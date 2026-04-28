import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface HistoricalDataPoint {
  date: string;
  open: number;
}

interface StockChartProps {
  ticker: string;
  history: HistoricalDataPoint[];
}

const StockChart = ({ ticker, history }: StockChartProps) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `История цен для ${ticker}`,
      },
    },
  };

  const data = {
    labels: history.map((item) => item.date),
    datasets: [
      {
        label: ticker,
        data: history.map((item) => item.open),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };
  return (
    <div style={{ position: 'relative', height: '300px', width: '100%' }}>
      <Line options={options} data={data} />
    </div>
  );
};
export default StockChart;
