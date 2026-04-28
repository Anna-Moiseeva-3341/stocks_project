import { useState, useEffect, type FormEvent } from 'react';
import axios from 'axios';
import styles from './BrokerManagement.module.css';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface Broker {
  id: number;
  name: string;
  balance: number;
}

const BrokersPage = () => {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [newName, setNewName] = useState('');
  const [newBalance, setNewBalance] = useState('');

  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        const response = await axios.get(`${API_BASE}/admin/brokers`);
        setBrokers(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке брокеров: ', error);
      }
    };
    fetchBrokers();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName || !newBalance) {
      alert('Пожалуйста, заполните все поля');
      return;
    }
    if (parseFloat(newBalance) < 0) {
      alert('Баланс не может быть отрицательным');
      return;
    }
    try {
      const response = await axios.post(`${API_BASE}/admin/brokers`, {
        name: newName,
        balance: parseFloat(newBalance),
      });
      setBrokers([...brokers, response.data]);
      setNewName('');
      setNewBalance('');
    } catch (error) {
      console.error('Ошибка при создании файла: ', error);
      alert('Не удалось создать брокера');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этого брокера?')) {
      try {
        await axios.delete(`${API_BASE}/admin/brokers/${id}`);
        setBrokers(brokers.filter((broker) => broker.id !== id));
      } catch (error) {
        console.error('Ошибка при удалении брокера: ', error);
        alert('Не удалось удалить брокера');
      }
    }
  };

  const handleEdit = async (id: number, currentBalance: number) => {
    const newBalanceStr = window.prompt('Введите новый баланс: ', String(currentBalance));
    if (newBalanceStr === null || newBalanceStr.trim() === '') {
      return;
    }
    const newBalance = parseFloat(newBalanceStr);
    if (isNaN(newBalance)) {
      alert('Пожалуйста, введите корректное число');
      return;
    }
    if (newBalance < 0) {
      alert('Баланс не может быть отрицательным');
      return;
    }
    try {
      const response = await axios.patch(`${API_BASE}/admin/brokers/${id}`, {
        balance: newBalance,
      });
      setBrokers(brokers.map((broker) => (broker.id === id ? response.data : broker)));
    } catch (error) {
      console.error('Ошибка при обновлении брокера', error);
      alert('Не удалось обновить баланс');
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.header}>Управление брокерами</h2>
      <form onSubmit={handleSubmit} className={styles.addForm}>
        <input
          type="text"
          placeholder="Имя брокера"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Начальный баланс"
          value={newBalance}
          onChange={(e) => setNewBalance(e.target.value)}
          step="0.01"
          min="0"
          required
        />
        <button type="submit">Добавить брокера</button>
      </form>
      <table className={styles.brokersTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Имя</th>
            <th>Баланс</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {brokers.map((broker) => (
            <tr key={broker.id}>
              <td data-label="ID">{broker.id}</td>
              <td data-label="Имя">{broker.name}</td>
              <td data-label="Баланс">{broker.balance.toFixed(2)}</td>
              <td data-label="Действия">
                <div className={styles.actions}>
                  <button
                    onClick={() => handleEdit(broker.id, broker.balance)}
                    className={`${styles.actionButton} ${styles.editButton}`}
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => handleDelete(broker.id)}
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                  >
                    Удалить
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BrokersPage;
