import { Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Broker, HistoricalDataPoint } from '../common/interfaces/models.interface';

class CreateBrokerDto {
  name: string;
  balance: number;
}

@Injectable()
export class AdminService {
  private readonly historicalDataPath = path.join(process.cwd(), 'historical-data.json');
  private readonly configFilePath = path.join(process.cwd(), 'config.json');
  private readonly brokersFilePath = path.join(process.cwd(), 'brokers.json');
  private readonly stockDirectoryPath = path.join(process.cwd(), 'stock-directory.json');

  private async readBrokers(): Promise<Broker[]> {
    try {
      const data = await fs.readFile(this.brokersFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  private async writeBrokers(brokers: Broker[]): Promise<void> {
    await fs.writeFile(this.brokersFilePath, JSON.stringify(brokers, null, 2));
  }

  async getAllAvailableStocks(): Promise<{ ticker: string; companyName: string }[]> {
    const data = await fs.readFile(this.stockDirectoryPath, 'utf-8');
    return JSON.parse(data);
  }

  async getConfig(): Promise<{ activeTickers: string[] }> {
    try {
      const data = await fs.readFile(this.configFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { activeTickers: [] };
      }
      throw error;
    }
  }

  async updateConfig(newConfig: { activeTickers: string[] }): Promise<void> {
    await fs.writeFile(this.configFilePath, JSON.stringify(newConfig, null, 2));
  }

  async getAllBrokers(): Promise<Broker[]> {
    return this.readBrokers();
  }

  async createBroker(brokerData: CreateBrokerDto): Promise<Broker> {
    const brokers = await this.readBrokers();
    const sorted = [...brokers].sort((a, b) => b.id - a.id);
    const maxId = sorted.length > 0 ? sorted[0].id : 0;
    const newId = maxId + 1;
    const newBroker: Broker = {
      id: newId,
      name: brokerData.name,
      balance: brokerData.balance,
      portfolio: [],
    };
    brokers.push(newBroker);
    await this.writeBrokers(brokers);
    return newBroker;
  }

  async updateBroker(id: number, updateData: { balance: number }): Promise<Broker> {
    const brokers = await this.readBrokers();
    const brokerIndex = brokers.findIndex((b) => b.id === id);
    if (brokerIndex === -1) {
      throw new NotFoundException(`Брокер с ID '${id}' не найдена`);
    }
    brokers[brokerIndex].balance = updateData.balance;
    await this.writeBrokers(brokers);
    return brokers[brokerIndex];
  }

  async deleteBroker(id: number): Promise<{ message: string }> {
    const brokers = await this.readBrokers();
    const updatedBrokers = brokers.filter((b) => b.id !== id);
    if (brokers.length === updatedBrokers.length) {
      throw new NotFoundException(`Брокер с ID '${id}' не найден`);
    }
    await this.writeBrokers(updatedBrokers);
    return { message: 'Брокер успешно удален' };
  }

  async getHistoricalDataFor(ticker: string): Promise<HistoricalDataPoint[]> {
    const data = await fs.readFile(this.historicalDataPath, 'utf-8');
    const historicalData = JSON.parse(data);
    return historicalData[ticker] || [];
  }
}
