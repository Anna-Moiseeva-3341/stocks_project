import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { io } from 'socket.io-client';
import { useTradingStore } from './stores/trading';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const tradingStore = useTradingStore();

const socket = io(API_BASE, {
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('WebSocket successfully connected! ID:', socket.id);
});

socket.on('simulation-status', (data: { isRunning: boolean }) => {
  console.log('Initial simulation status received:', data);
  tradingStore.setSimulationState(data.isRunning);
});

socket.on('simulation-started', () => {
  console.log('Event: Simulation has started');
  tradingStore.setSimulationState(true);
});

socket.on('simulation-stopped', () => {
  console.log('Event: Simulation has stopped');
  tradingStore.setSimulationState(false);
});

socket.on('simulation-end', () => {
  console.log('Event: Simulation has ended (data exhausted)');
  tradingStore.setSimulationState(false);
});

socket.on('market-update', (data) => {
  tradingStore.updateMarketData(data);
});

socket.on('connect_error', (err) => {
  console.error('WebSocket connection error:', err.message);
});

app.mount('#app');
