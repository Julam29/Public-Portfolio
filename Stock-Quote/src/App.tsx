import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
// import DetailPage from './pages/DetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* <Route path="/detail" element={<DetailPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}