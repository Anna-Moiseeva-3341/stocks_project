import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Broker } from '../common/interfaces/models.interface';
import { SimulationService } from '../simulation/simulation.service';

@Injectable()
export class BrokerService {
  private readonly brokersFilePath = path.join(process.cwd(), 'brokers.json');

  constructor(private readonly simulationService: SimulationService) {}

  private async readBrokers(): Promise<Broker[]> {
    const data = await fs.readFile(this.brokersFilePath, 'utf8');
    return JSON.parse(data);
  }

  private async writeBrokers(brokers: Broker[]): Promise<void> {
    await fs.writeFile(this.brokersFilePath, JSON.stringify(brokers, null, 2));
  }

  async buy(brokerName: string, ticker: string, quantity: number): Promise<Broker> {
    const brokers = await this.readBrokers();
    const broker = brokers.find((b) => b.name === brokerName);
    if (!broker) {
      throw new NotFoundException(`Брокер ${brokerName} не найден`);
    }

    const currentPrice = this.simulationService.getCurrentPrice(ticker);
    if (!currentPrice) {
      throw new BadRequestException(`Цена для акции ${ticker} не найдена`);
    }

    const totalCost = currentPrice * quantity;
    if (broker.balance < totalCost) {
      throw new BadRequestException('Недостаточно средств');
    }

    broker.balance -= totalCost;
    broker.portfolio.push({ ticker, quantity, purchasePrice: currentPrice });
    await this.writeBrokers(brokers);
    return broker;
  }

  async sell(brokerName: string, ticker: string, quantity: number): Promise<Broker> {
    const brokers = await this.readBrokers();
    const broker = brokers.find((b) => b.name === brokerName);
    if (!broker) {
      throw new NotFoundException(`Брокер ${brokerName} не найден`);
    }

    const tickers = broker.portfolio.filter((s) => s.ticker === ticker);
    let totalQuantity = 0;
    for (const lot of tickers) {
      totalQuantity += lot.quantity;
    }
    if (totalQuantity < quantity) {
      throw new BadRequestException('Недостаточно акций для продажи');
    }
    const currentPrice = this.simulationService.getCurrentPrice(ticker);
    if (!currentPrice) {
      throw new BadRequestException(`Цена для акции ${ticker} не найдена`);
    }
    broker.balance += currentPrice * quantity;
    let quantitySell = quantity;
    const newPortfolio = broker.portfolio.filter((lot) => {
      if (lot.ticker !== ticker || quantitySell === 0) {
        return true;
      }
      if (lot.quantity <= quantitySell) {
        quantitySell -= lot.quantity;
        return false;
      } else {
        lot.quantity -= quantitySell;
        quantitySell = 0;
        return true;
      }
    });
    broker.portfolio = newPortfolio;
    await this.writeBrokers(brokers);
    return broker;
  }
}
