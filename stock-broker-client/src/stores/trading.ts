import { defineStore } from 'pinia';
import router from '@/router';

interface Stock {
  name: string;
  price: number;
}

interface InitialConfig {
  brokers: Broker[];
  activeTickers: string[];
}

interface PortfolioItem {
  ticker: string;
  quantity: number;
  purchasePrice: number;
}

interface Broker {
  id: number;
  name: string;
  balance: number;
  portfolio: PortfolioItem[];
}

export const useTradingStore = defineStore('trading', {
  state: () => ({
    currentDate: '',
    stocks: [] as Stock[],
    brokers: [] as Broker[],
    currentUser: null as string | null,
    isRunning: false,
    simulationSettings: {
      speed: 2,
      startDate: '',
      simulationStartDate: null as string | null,
    },
  }),
  getters: {
    currentBrokerData(state): Broker | undefined {
      return state.brokers.find((b) => b.name === state.currentUser);
    },
  },
  actions: {
    login(userName: string) {
      const userExists = this.brokers.some((b) => b.name === userName);
      if (userExists) {
        this.currentUser = userName;
        router.push('/broker');
      } else {
        alert('Брокер с таким именем не найден');
      }
    },
    updateMarketData(data: { date: string; prices: { ticker: string; price: number }[] }) {
      this.currentDate = data.date;
      data.prices.forEach((updatedStock) => {
        const existingStock = this.stocks.find((s) => s.name === updatedStock.ticker);
        if (existingStock) {
          existingStock.price = updatedStock.price;
        }
      });
    },
    setInitialState(config: InitialConfig) {
      this.brokers = config.brokers || [];
      if (config.activeTickers && Array.isArray(config.activeTickers)) {
        this.stocks = config.activeTickers.map((ticker) => ({ name: ticker, price: 0 }));
      }
    },
    setSimulationState(running: boolean) {
      this.isRunning = running;
    },
    updateSimulationSettings(settings: {
      speed?: number;
      startDate?: string;
      simulationStartDate?: string | null;
    }) {
      Object.assign(this.simulationSettings, settings);
    },
    updateBroker(updatedBroker: Broker) {
      const index = this.brokers.findIndex((b) => b.id === updatedBroker.id);
      if (index !== -1) {
        this.brokers[index] = updatedBroker;
      }
    },
  },
});
