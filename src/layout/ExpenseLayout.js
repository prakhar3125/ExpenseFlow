import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Plus, List, CreditCard, BarChart3, Filter, TrendingUp, Wallet, Receipt } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useExpenseContext } from '../context/ExpenseContext';

const ExpenseLayout = () => {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const { 
    sources, 
    sourceBalances, 
    formatIndianCurrency, 
    getFilteredExpenses,
    selectedSources
  } = useExpenseContext();

  const navItems = [
    { 
      to: 'add', 
      label: 'Add Expense', 
      icon: Plus, 
      description: 'Upload receipts & add new expenses',
      accent: 'blue'
    },
    { 
      to: 'list', 
      label: 'Expenses List', 
      icon: List, 
      description: 'View & manage all expenses',
      accent: 'green'
    },
    { 
      to: 'sources', 
      label: 'Payment Sources', 
      icon: CreditCard, 
      description: 'Manage payment methods',
      accent: 'purple'
    },
    { 
      to: 'analytics', 
      label: 'Analytics', 
      icon: BarChart3, 
      description: 'Insights & spending patterns',
      accent: 'orange'
    }
  ];

  // Calculate overview stats
  const filteredExpenses = getFilteredExpenses();
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalSourceBalance = Object.values(sourceBalances).reduce((sum, balance) => sum + balance, 0);

  // Get current month expenses
  const thisMonth = filteredExpenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  });
  const monthlySpent = thisMonth.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-7xl">
        
        {/* Clean Header */}
        <div className={`rounded-xl shadow-sm mb-6 transition-colors duration-200 ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-100'
        }`}>
          
          {/* App Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
                }`}>
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-xl sm:text-2xl font-semibold ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-900'
                  }`}>
                    ExpenseFlow
                  </h1>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    AI-Powered Expense Management
                  </p>
                </div>
              </div>
              
              {/* Filter Indicator */}
              {!selectedSources.includes('all') && selectedSources.length > 0 && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Filter size={14} />
                  <span>{selectedSources.length} source{selectedSources.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Overview - Minimalist Grid */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              
              {/* Total Balance */}
              <div className={`p-5 rounded-lg transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-800 border border-gray-700 hover:border-gray-600' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className={`w-4 h-4 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Total Balance
                      </p>
                    </div>
                    <p className={`text-2xl font-bold ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {formatIndianCurrency(totalSourceBalance)}
                    </p>
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      Across {sources.length} sources
                    </p>
                  </div>
                </div>
              </div>

              {/* This Month */}
              <div className={`p-5 rounded-lg transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-800 border border-gray-700 hover:border-gray-600' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Receipt className={`w-4 h-4 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        This Month
                      </p>
                    </div>
                    <p className={`text-2xl font-bold ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {formatIndianCurrency(monthlySpent)}
                    </p>
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      {thisMonth.length} transactions
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Spent */}
              <div className={`p-5 rounded-lg transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-800 border border-gray-700 hover:border-gray-600' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className={`w-4 h-4 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Total Spent
                      </p>
                    </div>
                    <p className={`text-2xl font-bold ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {formatIndianCurrency(totalExpenses)}
                    </p>
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      All time total
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Clean Navigation */}
            <div>
              <h2 className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                Quick Actions
              </h2>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {navItems.map(({ to, label, icon: Icon, description, accent }) => {
                  const isActive = location.pathname.endsWith(`/${to}`) || 
                    (to === 'add' && location.pathname.endsWith('/expenses'));
                  
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      className={`group p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                        isActive
                          ? isDarkMode
                            ? `border-${accent}-500 bg-${accent}-900/20`
                            : `border-${accent}-200 bg-${accent}-50`
                          : isDarkMode
                            ? 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className={`p-3 rounded-lg ${
                          isActive
                            ? `bg-${accent}-100 text-${accent}-600`
                            : isDarkMode
                              ? 'bg-gray-600 text-gray-300'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          <Icon size={24} />
                        </div>
                        <div>
                          <h3 className={`font-semibold text-sm ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>
                            {label}
                          </h3>
                          <p className={`text-xs mt-1 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {description}
                          </p>
                        </div>
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="transition-all duration-300">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default ExpenseLayout;
