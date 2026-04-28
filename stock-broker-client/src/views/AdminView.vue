<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useTradingStore } from '@/stores/trading';
import { useRouter } from 'vue-router';
import axios from 'axios';

interface PortfolioItem {
  ticker: string;
  quantity: number;
  purchasePrice: number;
}

interface AggregatedPortfolioItem {
  ticker: string;
  quantity: number;
  currentValue: number;
  totalProfit: number;
}

const tradingStore = useTradingStore();
const router = useRouter();
const brokers = computed(() => tradingStore.brokers);
const currentDate = computed(() => tradingStore.currentDate);
const expandedBrokerId = ref<number | null>(null);
const stocks = computed(() => tradingStore.stocks);
const activeTickers = ref<string[]>([]);

if (!tradingStore.currentUser) {
  router.push('/');
}

const getAggregatedPortfolio = (portfolio: PortfolioItem[]): AggregatedPortfolioItem[] => {
  if (!portfolio || portfolio.length === 0) {
    return [];
  }
  const portfolioMap = new Map<string, { quantity: number; totalCost: number }>();
  for (const item of portfolio) {
    if (!portfolioMap.has(item.ticker)) {
      portfolioMap.set(item.ticker, { quantity: 0, totalCost: 0 });
    }
    const entry = portfolioMap.get(item.ticker)!;
    entry.quantity += item.quantity;
    entry.totalCost += item.quantity * item.purchasePrice;
  }
  const result: AggregatedPortfolioItem[] = [];
  for (const [ticker, data] of portfolioMap.entries()) {
    const stock = tradingStore.stocks.find((s) => s.name === ticker);
    const currentPrice = stock ? stock.price : 0;
    const currentValue = data.quantity * currentPrice;
    const totalProfit = currentValue - data.totalCost;
    result.push({ ticker, quantity: data.quantity, currentValue, totalProfit });
  }
  return result;
};

const toggleBrokerDetails = (brokerId: number) => {
  if (expandedBrokerId.value === brokerId) {
    expandedBrokerId.value = null;
  } else {
    expandedBrokerId.value = brokerId;
  }
};

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:3000/admin/config');
    activeTickers.value = response.data.activeTickers || [];
  } catch (error) {
    console.error('Не удалось загрузить конфигурацию акций', error);
  }
});

const getPortfolioValue = (portfolio: PortfolioItem[]): number => {
  let totalValue = 0;
  for (const item of portfolio) {
    const stock = tradingStore.stocks.find((s) => s.name === item.ticker);
    if (stock) {
      totalValue += stock.price * item.quantity;
    }
  }
  return totalValue;
};

const getPortfolioProfit = (portfolio: PortfolioItem[]): number => {
  let totalProfit = 0;
  for (const item of portfolio) {
    const stock = tradingStore.stocks.find((s) => s.name === item.ticker);
    if (stock) {
      totalProfit += (stock.price - item.purchasePrice) * item.quantity;
    }
  }
  return totalProfit;
};
</script>

<template>
  <div class="page-container">
    <header class="page-header">
      <h1 class="header-title">Панель администратора</h1>
      <div class="stats">
        <span class="label">Дата торгов:</span>
        <span class="value">{{ currentDate }}</span>
      </div>
    </header>
    <section class="brokers-summary">
      <h2>Сводка по брокерам</h2>
      <table>
        <thead>
          <tr>
            <th>Имя брокера</th>
            <th>Баланс</th>
            <th>Стоимость портфеля</th>
            <th>Прибыль/Убыток портфеля</th>
            <th>Общая стоимость активов</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="broker in brokers" :key="broker.id">
            <tr @click="toggleBrokerDetails(broker.id)" class="clickable-row">
              <td>{{ broker.name }}</td>
              <td>${{ broker.balance.toFixed(2) }}</td>
              <td>${{ getPortfolioValue(broker.portfolio).toFixed(2) }}</td>
              <td>
                <span
                  :class="{
                    profit: getPortfolioProfit(broker.portfolio) > 0,
                    loss: getPortfolioProfit(broker.portfolio) < 0,
                  }"
                >
                  ${{ getPortfolioProfit(broker.portfolio).toFixed(2) }}
                </span>
              </td>
              <td>
                <strong
                  >${{ (broker.balance + getPortfolioValue(broker.portfolio)).toFixed(2) }}</strong
                >
              </td>
            </tr>
            <tr v-if="expandedBrokerId === broker.id" class="details-row">
              <td colspan="5">
                <div class="portfolio-details">
                  <table v-if="broker.portfolio.length" class="details-table">
                    <thead>
                      <tr>
                        <th>Акция</th>
                        <th>Количество</th>
                        <th>Текущая цена</th>
                        <th>Прибыль/Убыток</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="item in getAggregatedPortfolio(broker.portfolio)"
                        :key="item.ticker"
                      >
                        <td>{{ item.ticker }}</td>
                        <td>{{ item.quantity }}</td>
                        <td>${{ item.currentValue.toFixed(2) }}</td>
                        <td>
                          <span
                            :class="{ profit: item.totalProfit > 0, loss: item.totalProfit < 0 }"
                          >
                            ${{ item.totalProfit.toFixed(2) }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p v-else>Портфель пуст.</p>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 15px;
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
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.config-section .tickers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
}

.ticker-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.simulation-controls .controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  background-color: #28a745;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.stop-btn {
  background-color: #dc3545;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0;
}

th,
td {
  border: 1px solid #ccc;
  padding: 12px;
  text-align: left;
}

thead th {
  background-color: #f7f7f7;
}

tbody tr:nth-of-type(2n) {
  background-color: #fdfdfd;
}

.clickable-row {
  cursor: pointer;
}

.clickable-row:hover {
  background-color: #f5f5f5;
}

.details-row td {
  padding: 0;
  border: 0;
}

.portfolio-details {
  padding: 15px 25px;
  background-color: #fafafa;
}

.portfolio-details ul {
  list-style-type: none;
  padding-left: 0;
}

.profit {
  color: #28a745;
  font-weight: bold;
}

.loss {
  color: #dc3545;
  font-weight: bold;
}
</style>
