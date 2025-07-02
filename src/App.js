import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ExpenseProvider } from './context/ExpenseContext'; // Add this import
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ExpenseLayout from './layout/ExpenseLayout';
import AddExpense from './pages/AddExpense';
import ExpensesList from './pages/ExpensesList';
import SourcesManager from './pages/SourcesManager';
import Analytics from './pages/Analytics';
import Dashboard from './pages/Dashboard';
import Authentication from './pages/Authentication';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ExpenseProvider> {/* Add ExpenseProvider here */}
          <Router>
            <div className="App">
              <Navigation />
              <main className="main-content">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/auth" element={<Authentication />} />
                  
                  {/* Protected Routes with Nested Structure */}
                  <Route path="/expenses" element={
                    <ProtectedRoute>
                      <ExpenseLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Navigate to="add" replace />} />
                    <Route path="add" element={<AddExpense />} />
                    <Route path="list" element={<ExpensesList />} />
                    <Route path="sources" element={<SourcesManager />} />
                    <Route path="analytics" element={<Analytics />} />
                  </Route>
                  
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Default redirect */}
                  <Route path="/" element={<Navigate to="/expenses" replace />} />
                  <Route path="/add-expense" element={<Navigate to="/expenses/add" replace />} />
                  
                  {/* 404 route */}
                  <Route path="*" element={<Navigate to="/auth" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </ExpenseProvider> {/* Close ExpenseProvider here */}
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
