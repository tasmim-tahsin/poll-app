import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import PollPage from './pages/PollPage';
import ResultPage from './pages/ResultPage';
import Navbar from './components/Navbar'; // Import your Navbar component

const App = () => (
  <Router>
    <div className="min-h-screen flex flex-col">
      <Navbar /> {/* Add Navbar here - it will appear on all pages */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<AdminPage />} />
          <Route path="/poll/:sessionId" element={<PollPage />} />
          <Route path="/result/:sessionId" element={<ResultPage />} />
        </Routes>
      </main>
    </div>
  </Router>
);

export default App;