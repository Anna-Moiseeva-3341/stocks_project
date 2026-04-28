import { useState, useEffect } from 'react';
import axios from 'axios';
import StockChart from '../components/StockChart';
import HistoryTable from '../components/HistoryTable';
import styles from './StocksPage.module.css';
import React from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface StockInfo {
  ticker: string;
  companyName: string;
}

interface HistoricalDataPoint {
  date: string;
  open: number;
}

const StocksPage = () => {
  const [allStocks, setAllStocks] = useState<StockInfo[]>([]);
  const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set());
  const [historyData, setHistoryData] = useState<Record<string, HistoricalDataPoint[]>>({});
  const [visibleComponents, setVisibleComponents] = useState<
    Record<string, { chart: boolean; table: boolean }>
  >({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allStocksRes, configRes] = await Promise.all([
          axios.get(`${API_BASE}/admin/stocks`),
          axios.get(`${API_BASE}/admin/config`),
        ]);
        setAllStocks(allStocksRes.data);
        setSelectedStocks(new Set(configRes.data.activeTickers));
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        alert('Не удалось загрузить данные');
      }
    };
    fetchData();
  }, []);

  const handleCheckboxChange = (ticker: string) => {
    const newSelection = new Set(selectedStocks);
    if (newSelection.has(ticker)) {
      newSelection.delete(ticker);
    } else {
      newSelection.add(ticker);
    }
    setSelectedStocks(newSelection);
  };

  const handleSave = async () => {
    try {
      await axios.post(`${API_BASE}/admin/config`, {
        activeTickers: Array.from(selectedStocks),
      });
      alert('Настройки сохранены!');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Не удалось сохранить настройки');
    }
  };

  const toggleVisibility = async (ticker: string, component: 'chart' | 'table') => {
    if (!historyData[ticker]) {
      try {
        const res = await axios.get(`${API_BASE}/admin/historical/${ticker}`);
        setHistoryData((prevData) => ({ ...prevData, [ticker]: res.data }));
      } catch (error) {
        console.error(`Не удалось загрузить историю для ${ticker}`, error);
        alert('Ошибка загрузки данных');
        return;
      }
    }
    setVisibleComponents((prev) => ({
      ...prev,
      [ticker]: {
        ...prev[ticker],
        [component]: !prev[ticker]?.[component],
      },
    }));
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Управление акциями</h1>
      <div className={styles.stockList}>
        {allStocks.map((stock) => {
          const isChartVisible = visibleComponents[stock.ticker]?.chart || false;
          const isTableVisible = visibleComponents[stock.ticker]?.table || false;
          const history = historyData[stock.ticker] || [];

          return (
            <React.Fragment key={stock.ticker}>
              <div className={styles.stockItem}>
                <label className={styles.stockLabel}>
                  <input
                    type="checkbox"
                    checked={selectedStocks.has(stock.ticker)}
                    onChange={() => handleCheckboxChange(stock.ticker)}
                  />
                  {stock.ticker} - {stock.companyName}
                </label>

                <div className={styles.actions}>
                  <button
                    onClick={() => toggleVisibility(stock.ticker, 'chart')}
                    className={styles.actionButton}
                  >
                    {isChartVisible ? 'Скрыть график' : 'Показать график'}
                  </button>
                  <button
                    onClick={() => toggleVisibility(stock.ticker, 'table')}
                    className={styles.actionButton}
                  >
                    {isTableVisible ? 'Скрыть таблицу' : 'Показать таблицу'}
                  </button>
                </div>
              </div>

              {(isChartVisible || isTableVisible) && history.length > 0 && (
                <div className={styles.detailsContainer}>
                  {isChartVisible && <StockChart ticker={stock.ticker} history={history} />}
                  {isTableVisible && <HistoryTable ticker={stock.ticker} history={history} />}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <button onClick={handleSave} className={styles.saveButton}>
        Сохранить
      </button>
    </div>
  );
};

export default StocksPage;
