import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BrokersPage from './pages/BrokersPage';
import StocksPage from './pages/StocksPage';
import SimulationPage from './pages/SimulationPage';
import Navbar from './components/Navbar';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<BrokersPage />} />
        <Route path="/stocks" element={<StocksPage />} />
        <Route path="/simulation" element={<SimulationPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
