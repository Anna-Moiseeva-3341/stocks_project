<script setup lang="ts">
import { ref } from 'vue';
import { useTradingStore } from '@/stores/trading';

const tradingStore = useTradingStore();
const username = ref('');

const handleLogin = () => {
  if (username.value.trim() !== '') {
    tradingStore.login(username.value);
  } else {
    alert('Пожалуйста, введите имя брокера');
  }
};
</script>

<template>
  <div class="page-container">
    <div class="login-container">
      <h1>Вход в торговую систему</h1>
      <div class="login-form">
        <form @submit.prevent="handleLogin">
          <input id="username" v-model="username" type="text" placeholder="Введите ваше имя" />
          <button type="submit">Войти</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background-color: f0f2f5;
}

.login-container {
  width: 100%;
  max-width: 450px;
  padding: 30px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 25px;
}

.login-form label {
  font-weight: bold;
  font-size: 1.1em;
  text-align: left;
}
.login-form input {
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
}

.login-form button {
  padding: 12px 15px;
  border: none;
  background-color: #42b983;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1em;
  transition: background-color 0.2s;
}

.login-form button:hover {
  background-color: #33a06f;
}
</style>
