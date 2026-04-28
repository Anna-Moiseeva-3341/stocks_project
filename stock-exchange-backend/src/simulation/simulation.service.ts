import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { EventsGateway } from 'src/events/events.gateway';
import { HistoricalData } from 'src/common/interfaces/models.interface';
import { AdminService } from 'src/admin/admin.service';

@Injectable()
export class SimulationService {
  private historicalData: HistoricalData;
  private currentMarketState: { ticker: string; price: number }[] = [];
  private simulationInterval: NodeJS.Timeout | null = null;
  private currentIndex = 0;
  private activeTickers: string[] = [];

  constructor(private readonly adminService: AdminService) {
    this.loadHistoricalData();
  }

  private async loadHistoricalData() {
    try {
      const filePath = path.join(process.cwd(), 'historical-data.json');
      const data = await fs.readFile(filePath, 'utf-8');
      this.historicalData = JSON.parse(data);

      this.currentMarketState = Object.keys(this.historicalData).map((ticker) => ({
        ticker,
        price: this.historicalData[ticker]?.[0]?.open || 0,
      }));

      console.log('Исторические данные успешно загружены и начальное состояние рынка создано');
    } catch (error) {
      console.error('КРИТИЧЕСКАЯ ОШИБКА: Не удалось загрузить historical-data.json', error);
    }
  }

  public getIsRunning(): boolean {
    return this.simulationInterval !== null;
  }

  public getCurrentPrice(ticker: string): number | null {
    const stock = this.currentMarketState.find((s) => s.ticker === ticker);
    return stock ? stock.price : null;
  }

  private isoToHistoricalForm(isoDate: string): string {
    const [year, month, day] = isoDate.split('-');
    return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
  }

  async startSimulation(speed: number, startDate: string | null) {
    const config = await this.adminService.getConfig();
    this.activeTickers = config.activeTickers;
    if (!this.activeTickers || this.activeTickers.length === 0) {
      console.log('Нет активных акций для симуляции.');
      EventsGateway.server.emit('simulation-error', { message: 'Нет выбранных акций' });
      return;
    }

    if (this.simulationInterval) {
      this.stopSimulation();
    }

    let startIndex = 0;

    if (startDate) {
      const formattedDate = this.isoToHistoricalForm(startDate);
      const firstTickerData = this.historicalData[this.activeTickers[0]];

      if (firstTickerData) {
        const foundIndex = firstTickerData.findIndex(
          (dataPoint) => dataPoint.date === formattedDate,
        );
        if (foundIndex !== -1) {
          startIndex = foundIndex;
          console.log(`Стартовая дата ${formattedDate} найдена, индекс: ${foundIndex}`);
        } else {
          const targetDate = new Date(startDate);
          const nearestIndex = firstTickerData.findIndex((dp) => {
            const [m, d, y] = dp.date.split('/');
            return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`) >= targetDate;
          });
          if (nearestIndex !== -1) {
            startIndex = nearestIndex;
            console.warn(
              `Дата ${formattedDate} не найдена, ` +
                `начинаем с ближайшей: ${firstTickerData[nearestIndex].date}`,
            );
          } else {
            console.warn(`Дата ${formattedDate} выходит за пределы данных, начинаем с начала`);
          }
        }
      }
    }
    this.currentIndex = startIndex;
    console.log(
      `Симуляция запущена со скоростью ${speed} мс, начиная с индекса ${this.currentIndex}`,
    );

    this.simulationInterval = setInterval(() => {
      try {
        const mainTicker = this.activeTickers[0];
        const currentDatePoint = this.historicalData[mainTicker]?.[this.currentIndex];

        if (!currentDatePoint) {
          console.log(`Симуляция завершена: данные на индексе ${this.currentIndex} кончились`);
          this.stopSimulation();
          EventsGateway.server.emit('simulation-end');
          return;
        }
        const activePrices: { ticker: string; price: number }[] = [];
        for (const ticker of this.activeTickers) {
          const tickerDataPoint = this.historicalData[ticker]?.[this.currentIndex];
          if (tickerDataPoint) {
            const newPrice = tickerDataPoint.open;
            const stockInState = this.currentMarketState.find((s) => s.ticker === ticker);
            if (stockInState) {
              stockInState.price = newPrice;
            }
            activePrices.push({ ticker, price: newPrice });
          }
        }
        const updatePayload = {
          date: currentDatePoint.date,
          prices: activePrices,
        };

        EventsGateway.server.emit('market-update', updatePayload);
        this.currentIndex++;
      } catch (error) {
        console.error('КРИТИЧЕСКАЯ ОШИБКА внутри setInterval:', error);
        this.stopSimulation();
      }
    }, speed);
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
      EventsGateway.server.emit('simulation-stopped');
      console.log('Симуляция остановлена');
    }
  }
}
