import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState, type AppDispatch } from '../store';
import { startSimulation, stopSimulation, updateMarketData } from '../store/simulationSlice';
import styles from './SimulationPage.module.css';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const SimulationPage = () => {
  const [speed, setSpeed] = useState('1');
  const [startDate, setStartDate] = useState('');
  const dispatch: AppDispatch = useDispatch();
  const { isRunning, marketData } = useSelector((state: RootState) => state.simulation);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(API_BASE);
    socketRef.current = socket;

    socket.on('connect', () => console.log('WebSocket подключен'));

    socket.on('market-update', (data) => {
      dispatch(updateMarketData(data));
    });

    socket.on('simulation-end', () => {
      dispatch(stopSimulation());
      alert('Симуляция завершена');
    });

    socket.on('simulation-stopped', () => {
      dispatch(stopSimulation());
    });

    socket.on('simulation-error', (data: { message: string }) => {
      alert(`Ошибка симуляции: ${data.message}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  const handleStart = async () => {
    const speedMS = parseInt(speed) * 1000;
    if (isNaN(speedMS) || speedMS <= 0) {
      alert('Введите корректное значение скорости (целое число > 0)');
      return;
    }
    try {
      await axios.post(`${API_BASE}/simulation/start`, {
        speed: speedMS,
        startDate: startDate || null,
      });
      dispatch(startSimulation());
    } catch (error) {
      console.error('Ошибка при запуске симуляции', error);
      alert('Не удалось запустить симуляцию');
    }
  };

  const handleStop = async () => {
    try {
      await axios.post(`${API_BASE}/simulation/stop`);
      dispatch(stopSimulation());
    } catch (error) {
      console.error('Ошибка при остановке симуляции', error);
      alert('Не удалось остановить симуляцию');
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Настройки симуляции</h1>
      <div className={styles.controlsContainer}>
        <div className={styles.controlGroup}>
          <label>Скорость (сек):</label>
          <input
            type="number"
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
            disabled={isRunning}
            style={{ padding: '8px' }}
          />
        </div>
        <div className={styles.controlGroup}>
          <label>Дата начала:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isRunning}
            style={{ padding: '8px' }}
          />
        </div>
        <button
          onClick={handleStart}
          disabled={isRunning}
          className={`${styles.button} ${styles.startButton}`}
        >
          Начать торги
        </button>
        <button
          onClick={handleStop}
          disabled={!isRunning}
          className={`${styles.button} ${styles.stopButton}`}
        >
          Остановить
        </button>
      </div>
      <div className={styles.marketStatus}>
        <h2>Текущее состояние рынка</h2>
        {marketData ? (
          <div>
            <p>
              <strong>Текущая дата:</strong>
              {marketData.date}
            </p>
            <table className={styles.marketTable}>
              <thead>
                <tr>
                  <th>Акция</th>
                  <th>Цена</th>
                </tr>
              </thead>
              <tbody>
                {marketData.prices.map((stock) => (
                  <tr key={stock.ticker}>
                    <td>{stock.ticker}</td>
                    <td>{stock.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{isRunning ? 'Ожидание первых данных' : 'Симуляция не запущена'}</p>
        )}
      </div>
    </div>
  );
};

export default SimulationPage;
