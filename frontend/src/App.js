import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LetsCode from './components/Letscode';
import Problem from './components/problem';
import Landing from './components/landingpage';
import Profile from './components/profile';
import Teams from './components/Teams';
import TeamDetail from './components/TeamDetail';
import Friends from './components/Friends';
import AddProblem from './components/AddProblem';
import Navbar from './components/Navbar';
import { DataProvider } from './context/datacontext';
import { ThemeProvider } from './context/themeContext';
import './styles/global.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
  }, []);

  // Layout component for authenticated pages
  const AuthenticatedLayout = ({ children }) => (
    <>
      <Navbar />
      {children}
    </>
  );

  return (
    <ThemeProvider>
      <DataProvider>
        <Router>
          <div className="app">
            <Routes>
              <Route path="/problem" element={
                isAuthenticated ? 
                <AuthenticatedLayout><LetsCode /></AuthenticatedLayout> : 
                <Navigate to="/" />
              } />
              <Route path="/problem/:id" element={
                isAuthenticated ? 
                <AuthenticatedLayout><Problem /></AuthenticatedLayout> : 
                <Navigate to="/" />
              } />
              <Route path="/" element={<Landing />} />
              <Route path="/profile" element={
                isAuthenticated ? 
                <AuthenticatedLayout><Profile /></AuthenticatedLayout> : 
                <Navigate to="/" />
              } />
              <Route path="/teams" element={
                isAuthenticated ? 
                <AuthenticatedLayout><Teams /></AuthenticatedLayout> : 
                <Navigate to="/" />
              } />
              <Route path="/teams/:teamId" element={
                isAuthenticated ? 
                <AuthenticatedLayout><TeamDetail /></AuthenticatedLayout> : 
                <Navigate to="/" />
              } />
              <Route path="/friends" element={
                isAuthenticated ? 
                <AuthenticatedLayout><Friends /></AuthenticatedLayout> : 
                <Navigate to="/" />
              } />
              <Route path="/add-problem" element={
                isAuthenticated ? 
                <AuthenticatedLayout><AddProblem /></AuthenticatedLayout> : 
                <Navigate to="/" />
              } />
            </Routes>
          </div>
        </Router>
      </DataProvider>
    </ThemeProvider>
  );
}