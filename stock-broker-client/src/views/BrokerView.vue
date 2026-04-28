<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTradingStore } from '@/stores/trading';
import { useRouter } from 'vue-router';
import axios from 'axios';
import StockChart from './StockChart.vue';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface Stock {
  name: string;
  price: number;
}

interface HistoryPoint {
  date: string;
  open: number;
}

const tradingStore = useTradingStore();
const router = useRouter();

const brokerData = computed(() => tradingStore.currentBrokerData);
const currentDate = computed(() => tradingStore.currentDate);
const stocks = computed(() => tradingStore.stocks);

const isRunning = computed(() => tradingStore.isRunning);

const isModalVisible = ref(false);
const transactionType = ref<'buy' | 'sell'>('buy');
const selectedStock = ref<Stock | null>(null);
const quantity = ref(1);

const isChartModalVisible = ref(false);
const chartTicker = ref<string | null>(null);
const historyData = ref<HistoryPoint[]>([]);
const isLoadingHistory = ref(false);

if (!tradingStore.currentUser) {
  router.push('/');
}

const portfolio = computed(() => {
  if (!brokerData.value) {
    return [];
  }
  const portfolioMap = new Map<string, { quantity: number; totalCost: number }>();
  for (const item of brokerData.value.portfolio) {
    if (!portfolioMap.has(item.ticker)) {
      portfolioMap.set(item.ticker, { quantity: 0, totalCost: 0 });
    }
    const entry = portfolioMap.get(item.ticker)!;
    entry.quantity += item.quantity;
    entry.totalCost += item.quantity * item.purchasePrice;
  }

  return Array.from(portfolioMap.entries()).map(([ticker, data]) => {
    const currentStock = stocks.value.find((s) => s.name === ticker);
    const currentPrice = currentStock ? currentStock.price : 0;
    const currentValue = data.quantity * currentPrice;
    const profitLoss = currentValue - data.totalCost;
    return { ticker, quantity: data.quantity, currentValue, profitLoss };
  });
});

const openBuyModal = (stock: Stock) => {
  if (!isRunning.value) {
    alert('Торги не запущены. Дождитесь начала симуляции.');
    return;
  }
  transactionType.value = 'buy';
  selectedStock.value = stock;
  quantity.value = 1;
  isModalVisible.value = true;
};

const openSellModal = (stock: Stock) => {
  transactionType.value = 'sell';
  selectedStock.value = stock;
  quantity.value = 1;
  isModalVisible.value = true;
};

const closeModal = () => {
  isModalVisible.value = false;
};

const openChartModal = async (ticker: string) => {
  if (!ticker) return;
  chartTicker.value = ticker;
  historyData.value = [];
  isChartModalVisible.value = true;
  isLoadingHistory.value = true;
  try {
    const response = await axios.get(`${API_BASE}/admin/historical/${ticker}`);
    const fullHistory: HistoryPoint[] = response.data;

    const simStartDateStr = tradingStore.simulationSettings.simulationStartDate;
    const currentSimDateStr = tradingStore.currentDate;

    if (simStartDateStr && currentSimDateStr) {
      const simStartDate = new Date(simStartDateStr);
      const currentSimDate = new Date(currentSimDateStr);
      historyData.value = fullHistory.filter((d) => {
        const [m, dy, y] = d.date.split('/');
        const pointDate = new Date(`${y}-${m.padStart(2, '0')}-${dy.padStart(2, '0')}`);
        return pointDate >= simStartDate && pointDate <= currentSimDate;
      });
    } else {
      historyData.value = fullHistory;
    }
  } catch (error) {
    console.error(`Не удалось загрузить историю для ${ticker}`, error);
    alert('Ошибка загрузки данных для графика');
  } finally {
    isLoadingHistory.value = false;
  }
};

const closeChartModal = () => {
  isChartModalVisible.value = false;
};

const confirmTransaction = async () => {
  if (!selectedStock.value || !tradingStore.currentUser || quantity.value <= 0) {
    alert('Неверные данные для транзакции');
    return;
  }

  if (transactionType.value === 'buy') {
    const totalConst = selectedStock.value.price * quantity.value;
    if (brokerData.value && brokerData.value.balance < totalConst) {
      alert('Недостаточно средств для покупки');
      return;
    }
  }

  try {
    const response = await axios.post(`${API_BASE}/broker/${transactionType.value}`, {
      brokerName: tradingStore.currentUser,
      ticker: selectedStock.value.name,
      quantity: quantity.value,
    });
    tradingStore.updateBroker(response.data);
    alert('Сделка прошла успешно');
    closeModal();
  } catch (error: any) {
    console.error('Ошибка при совершении сделки: ', error);
    const errorMessage = error.response?.data?.message || 'Неизвестная ошибка';
    alert(`Ошибка: ${errorMessage}`);
  }
};
</script>

<template>
  <div v-if="brokerData" class="broker-dashboard">
    <header class="page-header">
      <h1 class="header-title">Торговый терминал: {{ brokerData.name }}</h1>
      <div class="stats">
        <div class="stat-item">
          <span class="label">Баланс:</span>
          <span class="value">${{ brokerData.balance.toFixed(2) }}</span>
        </div>
        <div class="stat-item">
          <span class="label">Дата торгов:</span>
          <span class="value">{{ currentDate || '-' }}</span>
        </div>
      </div>
      <div class="stat-item">
        <span class="label">Статус:</span>
        <span class="value" :class="isRunning ? 'status-active' : 'status-inactive'">
          {{ isRunning ? 'Торги идут' : 'Торги не начаты' }}
        </span>
      </div>
    </header>

    <div class="tables-container">
      <section class="market-stocks">
        <h2>Акции на рынке</h2>
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th>Цена</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="stock in stocks"
              :key="stock.name"
              @click="openChartModal(stock.name)"
              class="clickable-row"
            >
              <td>{{ stock.name }}</td>
              <td>${{ stock.price.toFixed(2) }}</td>
              <td>
                <button
                  @click.stop="openBuyModal(stock)"
                  class="buy"
                  :disabled="!isRunning"
                  :title="!isRunning ? 'Дождитесь начала торгов' : 'Купить акцию'"
                >
                  Купить
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
      <section class="portfolio-stocks">
        <h2>Мой портфель</h2>
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th>Количество</th>
              <th>Текущая стоимость</th>
              <th>Прибыль/Убыток</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in portfolio"
              :key="item.ticker"
              @click="openChartModal(item.ticker)"
              class="clickable-row"
            >
              <td>{{ item.ticker }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.currentValue.toFixed(2) }}</td>
              <td>
                <span :class="{ profit: item.profitLoss > 0, loss: item.profitLoss < 0 }">
                  ${{ item.profitLoss.toFixed(2) }}
                </span>
              </td>
              <td>
                <button
                  v-if="stocks.some((s) => s.name === item.ticker)"
                  @click.stop="
                    () => {
                      const stock = stocks.find((s) => s.name === item.ticker);
                      if (stock) {
                        openSellModal(stock);
                      }
                    }
                  "
                  class="sell"
                  :disabled="!isRunning"
                  :title="!isRunning ? 'Дождитесь начала торгов' : 'Продать акцию'"
                >
                  Продать
                </button>
              </td>
            </tr>
            <tr v-if="!portfolio.length">
              <td colspan="5" style="text-align: center">Ваш портфель пуст</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
    <div v-if="isModalVisible" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h2 v-if="selectedStock">
          {{ transactionType === 'buy' ? 'Покупка' : 'Продажа' }} акции: {{ selectedStock.name }}
        </h2>
        <p v-if="selectedStock">Текущая цена: ${{ selectedStock.price.toFixed(2) }}</p>

        <div class="form-group">
          <label for="quantity">Количество:</label>
          <input id="quantity" type="number" v-model="quantity" min="1" />
        </div>

        <div class="modal-actions">
          <button @click="confirmTransaction" class="confirm-btn">Подтвердить</button>
          <button @click="closeModal" class="cancel-btn">Отмена</button>
        </div>
      </div>
    </div>
    <div v-if="isChartModalVisible" class="modal-overlay" @click.self="closeChartModal">
      <div class="modal-content chart-modal">
        <h2 v-if="chartTicker">График цены: {{ chartTicker }}</h2>
        <StockChart v-if="!isLoadingHistory" :chart-data="historyData" :ticker="chartTicker!" />
        <p v-else>Загрузка истории...</p>

        <div class="modal-actions">
          <button @click="closeChartModal" class="cancel-btn">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
  <div v-else>
    <p>Перенаправление на страницу входа...</p>
  </div>
</template>

<style scoped>
.broker-dashboard {
  max-width: 1200px;
  margin: auto;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.header-title {
  font-size: 2.8em;
  margin-bottom: 15px;
  color: #2c3e50;
  font-weight: 300;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  font-size: 1.4em;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-item .label {
  color: #7f8c8d;
  font-size: 0.8em;
}

.stat-item .value {
  color: #34495e;
  font-weight: bold;
}

.status-active {
  color: #28a745 !important;
}

.status-inactive {
  color: #dc3545 !important;
}

section {
  background-color: white;
  padding: 25px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

section h2 {
  font-size: 1.8em;
  margin-top: 0;
  margin-bottom: 20px;
}

.tables-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

thead th {
  background-color: #f7f7f7;
}

tbody tr:nth-of-type(odd) {
  background-color: #fdfdfd;
}

button {
  margin-right: 5px;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s;
  font-size: 1.1rem;
}

button:hover:not(:disabled) {
  opacity: 0.8;
}

button:disabled {
  background-color: #adb5bd !important;
  cursor: not-allowed;
  opacity: 0.7;
}

.buy {
  background-color: #28a745;
}

.sell {
  background-color: #dc3545;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  width: 400px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.form-group {
  margin: 20px 0;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
}

.form-group input {
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.confirm-btn {
  background-color: #28a745;
}

.cancel-btn {
  background-color: #6c757d;
}

.clickable-row {
  cursor: pointer;
}

.clickable-row:hover {
  background-color: #f5f5f5;
}

.chart-modal {
  width: 80%;
  max-width: 900px;
}

.profit {
  color: #28a745;
  font-weight: bold;
}

.loss {
  color: #dc3545;
  font-weight: bold;
}

@media (max-width: 768px) {
  .tables-container {
    grid-template-columns: 1fr;
  }

  .stats {
    gap: 20px;
    font-size: 1.1em;
  }
}
</style>
