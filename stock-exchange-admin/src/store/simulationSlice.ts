import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface StockPrice {
  ticker: string;
  price: number;
}

interface MarketUpdatePayload {
  date: string;
  prices: StockPrice[];
}

interface SimulationState {
  isRunning: boolean;
  marketData: MarketUpdatePayload | null;
}

const initialState: SimulationState = {
  isRunning: false,
  marketData: null,
};

export const simulationSlice = createSlice({
  name: 'simulation',
  initialState,
  reducers: {
    startSimulation: (state) => {
      state.isRunning = true;
    },
    stopSimulation: (state) => {
      state.isRunning = false;
    },
    updateMarketData: (state, action: PayloadAction<MarketUpdatePayload>) => {
      state.marketData = action.payload;
    },
  },
});

export const { startSimulation, stopSimulation, updateMarketData } = simulationSlice.actions;
export default simulationSlice.reducer;
