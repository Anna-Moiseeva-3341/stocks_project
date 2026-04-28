export interface PortfolioItem {
  ticker: string;
  quantity: number;
  purchasePrice: number;
}

export interface Broker {
  id: number;
  name: string;
  balance: number;
  portfolio: PortfolioItem[];
}

export interface Stock {
  ticker: string;
  company: string;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
}

export interface HistoricalData {
  [ticker: string]: HistoricalDataPoint[];
}
