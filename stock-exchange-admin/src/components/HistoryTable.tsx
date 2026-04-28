interface HistoricalDataPoint {
  date: string;
  open: number;
}

interface HistoryTableProps {
  ticker: string;
  history: HistoricalDataPoint[];
}

const HistoryTable = ({ ticker, history }: HistoryTableProps) => {
  return (
    <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '10px' }}>
      <h4>Таблица данных для {ticker}</h4>
      <table border={1} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ padding: '8px' }}>Дата</th>
            <th style={{ padding: '8px' }}>Цена открытия</th>
          </tr>
        </thead>
        <tbody>
          {history
            .slice()
            .reverse()
            .map((item) => (
              <tr key={item.date}>
                <td style={{ padding: '8px' }}>{item.date}</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>{item.open.toFixed(2)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistoryTable;
