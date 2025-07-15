import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import PollPage from './pages/PollPage';
import ResultPage from './pages/ResultPage';
import Navbar from './components/Navbar';

const Layout = () => {
  return (
    <div>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

const App = () => (
  <Router>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/poll/:sessionId" element={<PollPage />} />
        <Route path="/result/:sessionId" element={<ResultPage />} />
      </Route>
    </Routes>
  </Router>
);

export default App;
