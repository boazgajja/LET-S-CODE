import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LetsCode from './components/Letscode';
import Problem from './components/problem';
import Landing from './components/landingpage';
import Profile from './components/profile';
import Teams from './components/Teams';
import TeamDetail from './components/TeamDetail';
import Friends from './components/Friends';
import AddProblem from './components/AddProblem';
import Submissions from './components/Submissions';
// Remove these imports
// import TeamWars from './components/TeamWars';
// import TeamWarDetail from './components/TeamWarDetail';
import Navbar from './components/Navbar';
import { DataProvider } from './context/datacontext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/themeContext';
import { SocketProvider } from './context/SocketContext';
import './styles/global.css';

// Helper component to protect authenticated routes
function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="app-loading">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

// Helper component to protect public routes (redirect authenticated users)
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="app-loading">Loading...</div>;
  }
  
  // If user is authenticated, redirect to problems page instead of staying on landing
  if (isAuthenticated) {
    return <Navigate to="/problem" replace />;
  }
  
  return children;
}

// Layout component for authenticated pages
const AuthenticatedLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

function AppContent() {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Public Routes - Landing/Login */}
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <Landing />
              </PublicRoute>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/problem" 
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <LetsCode />
                </AuthenticatedLayout>
              </RequireAuth>
            } 
          />
          
          <Route 
            path="/problem/:id" 
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <Problem />
                </AuthenticatedLayout>
              </RequireAuth>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <Profile />
                </AuthenticatedLayout>
              </RequireAuth>
            } 
          />
          
          <Route 
            path="/profile/:username" 
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <Profile />
                </AuthenticatedLayout>
              </RequireAuth>
            } 
          />
          
          <Route 
            path="/teams" 
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <Teams />
                </AuthenticatedLayout>
              </RequireAuth>
            } 
          />
          
          <Route 
            path="/teams/:id" 
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <TeamDetail />
                </AuthenticatedLayout>
              </RequireAuth>
            } 
          />
          
          <Route 
            path="/friends" 
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <Friends />
                </AuthenticatedLayout>
              </RequireAuth>
            } 
          />
          
          <Route 
            path="/add-problem" 
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <AddProblem />
                </AuthenticatedLayout>
              </RequireAuth>
            } 
          />
          
          <Route 
            path="/submissions" 
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <Submissions />
                </AuthenticatedLayout>
              </RequireAuth>
            } 
          />
          
          <Route 
            path="/submissions/:submissionId" 
            element={
              <RequireAuth>
                <AuthenticatedLayout>
                  <Submissions />
                </AuthenticatedLayout>
              </RequireAuth>
            } 
          />
          
         
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <DataProvider>
            <AppContent />
          </DataProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
