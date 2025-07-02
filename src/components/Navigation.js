import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, X, Plus, BarChart3, LogOut, Sun, Moon } from 'lucide-react';

// Custom Rupee Icon Component
const RupeeIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="m6 13 8.5 8" />
    <path d="M6 13h3" />
    <path d="M9 13c6.667 0 6.667-10 0-10" />
  </svg>
);

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await logout();
    navigate('/auth');
  };

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  if (!user) return null;

  return (
    <>
      <nav className={`navbar sticky top-0 z-50 border-b ${
        isDarkMode 
          ? 'border-slate-700' 
          : 'border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <Link 
              to="/expenses" 
              className="flex items-center space-x-2 flex-shrink-0"
              onClick={handleNavClick}
            >
              <div className={`p-2 rounded-lg ${
                isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'
              }`}>
                <RupeeIcon 
                  size={24}
                  className={`${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} 
                />
              </div>
              <span className={`font-bold text-xl hidden sm:block ${
                isDarkMode ? 'text-slate-100' : 'text-gray-800'
              }`}>ExpenseFlow</span>
            </Link>

            {/* Desktop Navigation - ONLY VISIBLE ON DESKTOP */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link
                to="/expenses/add"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location.pathname.includes('/expenses')
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : isDarkMode
                      ? 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                <Plus size={20} />
                <span>Add Expense</span>
              </Link>

              <Link
                to="/dashboard"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location.pathname === '/dashboard'
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : isDarkMode
                      ? 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                <BarChart3 size={20} />
                <span>Dashboard</span>
              </Link>

              {/* SINGLE Theme Toggle - Desktop Only */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDarkMode
                    ? 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <button
                onClick={handleLogout}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isDarkMode
                    ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300'
                    : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                }`}
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Hamburger Menu Button - ONLY VISIBLE ON MOBILE */}
            <div className="lg:hidden">
              <button
                onClick={toggleMobileMenu}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDarkMode
                    ? 'text-slate-300 hover:bg-slate-700'
                    : 'text-gray-600 hover:bg-gray-100'
                } ${isMobileMenuOpen ? 'bg-blue-600 text-white' : ''}`}
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu - ONLY VISIBLE ON MOBILE */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out border-t ${
          isDarkMode ? 'border-slate-700' : 'border-gray-200'
        } ${
          isMobileMenuOpen 
            ? 'max-h-96 opacity-100' 
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="py-2 space-y-1 px-4">
            <Link
              to="/expenses/add"
              onClick={handleNavClick}
              className={`flex items-center space-x-3 px-4 py-4 rounded-lg transition-all duration-200 ${
                location.pathname.includes('/expenses')
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : isDarkMode
                    ? 'text-slate-300 hover:bg-slate-700 active:bg-slate-600'
                    : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
              }`}
            >
              <Plus size={20} />
              <span className="font-medium">Add Expense</span>
            </Link>

            <Link
              to="/dashboard"
              onClick={handleNavClick}
              className={`flex items-center space-x-3 px-4 py-4 rounded-lg transition-all duration-200 ${
                location.pathname === '/dashboard'
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : isDarkMode
                    ? 'text-slate-300 hover:bg-slate-700 active:bg-slate-600'
                    : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
              }`}
            >
              <BarChart3 size={20} />
              <span className="font-medium">Dashboard</span>
            </Link>

            {/* Theme Toggle in Mobile Menu */}
            <button
              onClick={toggleTheme}
              className={`flex items-center space-x-3 px-4 py-4 rounded-lg w-full text-left transition-all duration-200 ${
                isDarkMode
                  ? 'text-slate-300 hover:bg-slate-700 active:bg-slate-600'
                  : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
              }`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span className="font-medium">
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>

            <button
              onClick={handleLogout}
              className={`flex items-center space-x-3 px-4 py-4 rounded-lg w-full text-left transition-all duration-200 ${
                isDarkMode
                  ? 'text-red-400 hover:bg-red-900/20 active:bg-red-900/30'
                  : 'text-red-600 hover:bg-red-50 active:bg-red-100'
              }`}
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Navigation;
