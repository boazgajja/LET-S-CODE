import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LetsCode from './components/Letscode';
import Problem from './components/problem';

export default function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<LetsCode />} />
          <Route path="/problem/:id" element={<Problem />} />
        </Routes>
      </div>
    </Router>
  );
}