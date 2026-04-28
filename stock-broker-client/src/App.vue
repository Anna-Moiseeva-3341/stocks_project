<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { useTradingStore } from '@/stores/trading';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const tradingStore = useTradingStore();

onMounted(async () => {
  try {
    const [configResponse, brokersResponse] = await Promise.all([
      axios.get(`${API_BASE}/admin/config`),
      axios.get(`${API_BASE}/admin/brokers`),
    ]);
    tradingStore.setInitialState({
      activeTickers: configResponse.data.activeTickers || [],
      brokers: brokersResponse.data || [],
    });
  } catch (error) {
    console.error('Не удалось загрузить начальные данные:', error);
  }
});
</script>

<template>
  <header class="app-header">
    <nav class="navbar">
      <RouterLink to="/" class="nav-link">Вход</RouterLink>
      <span class="nav-separator">|</span>
      <RouterLink to="/broker" class="nav-link">Брокер</RouterLink>
      <span class="nav-separator">|</span>
      <RouterLink to="/admin" class="nav-link">Админ</RouterLink>
    </nav>
  </header>
  <main class="app-main">
    <RouterView />
  </main>
</template>

<style scoped>
.app-header {
  background-color: #2c3e50;
  padding: 0 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.navbar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 56px;
}

.nav-link {
  color: #bdc3c7;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 6px;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.nav-link.router-link-exact-active {
  background-color: #42b983;
  color: #ffffff;
}

.nav-separator {
  color: #4a5568;
  user-select: none;
}

.app-main {
  padding: 20px;
}
</style>
