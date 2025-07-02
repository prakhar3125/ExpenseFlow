import React, { useState, useMemo } from 'react';
import { BarChart3, PieChart, TrendingUp, TrendingDown, Calendar, Filter, Download, Eye, EyeOff, DollarSign, Target, AlertCircle, Award, Zap } from 'lucide-react';
import { useExpenseContext } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';

const Analytics = () => {
  const { 
    // State
    expenses,
    sources,
    selectedSources,
    categories,
    sourceBalances,
    
    // Functions
    getFilteredExpenses,
    getSourceById,
    getSourceTypeInfo,
    formatIndianCurrency,
    getBalanceStatus,
    getSourceStats
  } = useExpenseContext();
  
  const { isDarkMode } = useTheme();
  
  // Local state for analytics
  const [timeRange, setTimeRange] = useState('thisYear'); // thisMonth, lastMonth, thisYear, lastYear, all
  const [chartType, setChartType] = useState('category'); // category, source, timeline, trends
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(categories);

  // Helper function to get category icons
  const getCategoryIcon = (category) => {
    const icons = {
      'Food & Drink': '🍽️',
      'Transportation': '🚗',
      'Shopping': '🛍️',
      'Entertainment': '🎬',
      'Healthcare': '🏥',
      'Utilities': '⚡',
      'Travel': '✈️',
      'Education': '📚',
      'Business': '💼',
      'Other': '📋'
    };
    return icons[category] || '📋';
  };

  // Filter expenses by time range
  const getExpensesByTimeRange = (range) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return getFilteredExpenses().filter(expense => {
      const expenseDate = new Date(expense.date);
      const expenseMonth = expenseDate.getMonth();
      const expenseYear = expenseDate.getFullYear();
      
      switch (range) {
        case 'thisMonth':
          return expenseMonth === currentMonth && expenseYear === currentYear;
        case 'lastMonth':
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return expenseMonth === lastMonth && expenseYear === lastMonthYear;
        case 'thisYear':
          return expenseYear === currentYear;
        case 'lastYear':
          return expenseYear === currentYear - 1;
        case 'all':
        default:
          return true;
      }
    });
  };

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const filteredExpenses = getExpensesByTimeRange(timeRange);
    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalTransactions = filteredExpenses.length;
    const averageTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    // Category breakdown
    const categoryBreakdown = filteredExpenses.reduce((acc, expense) => {
      if (selectedCategories.includes(expense.category)) {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      }
      return acc;
    }, {});

    // Source breakdown
    const sourceBreakdown = filteredExpenses.reduce((acc, expense) => {
      const source = getSourceById(expense.sourceId);
      if (source) {
        acc[source.name] = (acc[source.name] || 0) + expense.amount;
      }
      return acc;
    }, {});

    // Monthly trends (last 12 months)
    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expense.date.startsWith(monthKey);
      });
      
      monthlyTrends.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: monthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
        transactions: monthExpenses.length
      });
    }

    // Daily spending (last 30 days)
    const dailySpending = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      const dayExpenses = filteredExpenses.filter(expense => expense.date === dateKey);
      const amount = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      dailySpending.push({
        date: dateKey,
        amount,
        transactions: dayExpenses.length
      });
    }

    // Top vendors
    const vendorBreakdown = filteredExpenses.reduce((acc, expense) => {
      acc[expense.vendor] = (acc[expense.vendor] || 0) + expense.amount;
      return acc;
    }, {});

    const topVendors = Object.entries(vendorBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([vendor, amount]) => ({ vendor, amount }));

    return {
      totalAmount,
      totalTransactions,
      averageTransaction,
      categoryBreakdown,
      sourceBreakdown,
      monthlyTrends,
      dailySpending,
      topVendors,
      filteredExpenses
    };
  }, [expenses, timeRange, selectedSources, selectedCategories, getFilteredExpenses, getSourceById]);

  // Calculate comparison data
  const comparisonData = useMemo(() => {
    if (!comparisonMode) return null;

    const currentData = getExpensesByTimeRange(timeRange);
    let previousData = [];

    const now = new Date();
    switch (timeRange) {
      case 'thisMonth':
        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        previousData = getExpensesByTimeRange('lastMonth');
        break;
      case 'thisYear':
        previousData = getExpensesByTimeRange('lastYear');
        break;
      default:
        return null;
    }

    const currentTotal = currentData.reduce((sum, expense) => sum + expense.amount, 0);
    const previousTotal = previousData.reduce((sum, expense) => sum + expense.amount, 0);
    const percentageChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

    return {
      current: currentTotal,
      previous: previousTotal,
      change: currentTotal - previousTotal,
      percentageChange
    };
  }, [timeRange, comparisonMode, getExpensesByTimeRange]);

  // Export data as CSV
  const exportData = () => {
    const csvContent = [
      ['Date', 'Vendor', 'Category', 'Amount', 'Source', 'Description'],
      ...analyticsData.filteredExpenses.map(expense => {
        const source = getSourceById(expense.sourceId);
        return [
          expense.date,
          expense.vendor,
          expense.category,
          expense.amount,
          source?.name || 'Unknown',
          expense.description || ''
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Analytics Header with Controls */}
      <section className={`border rounded-2xl shadow-sm transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
            <div>
              <h1 className={`text-2xl font-bold transition-colors duration-200 ${
                isDarkMode ? 'text-slate-100' : 'text-gray-900'
              }`}>Expense Analytics & Insights</h1>
              <p className={`mt-1 transition-colors duration-200 ${
                isDarkMode ? 'text-slate-400' : 'text-gray-500'
              }`}>
                Comprehensive analysis of your spending patterns and trends
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setComparisonMode(!comparisonMode)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  comparisonMode
                    ? 'bg-blue-600 text-white'
                    : isDarkMode
                      ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <TrendingUp size={16} />
                Compare
              </button>
              
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  showAdvanced
                    ? isDarkMode
                      ? 'bg-purple-900/50 text-purple-300'
                      : 'bg-purple-100 text-purple-700'
                    : isDarkMode
                      ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter size={16} />
                Advanced
              </button>
              
              <button
                onClick={exportData}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  isDarkMode
                    ? 'bg-green-900/50 text-green-300 hover:bg-green-900/70'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>

          {/* Time Range and Chart Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                isDarkMode ? 'text-slate-300' : 'text-gray-700'
              }`}>Time Range</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-slate-200' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisYear">This Year</option>
                <option value="lastYear">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                isDarkMode ? 'text-slate-300' : 'text-gray-700'
              }`}>Chart Focus</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-slate-200' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="category">By Category</option>
                <option value="source">By Source</option>
                <option value="timeline">Timeline View</option>
                <option value="trends">Spending Trends</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>Quick Stats</label>
                <div className={`p-3 border rounded-lg text-center transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600' 
                    : 'bg-gray-50 border-gray-300'
                }`}>
                  <p className={`text-sm font-medium transition-colors duration-200 ${
                    isDarkMode ? 'text-slate-400' : 'text-gray-600'
                  }`}>Transactions</p>
                  <p className={`text-lg font-bold transition-colors duration-200 ${
                    isDarkMode ? 'text-slate-200' : 'text-gray-800'
                  }`}>
                    {analyticsData.totalTransactions}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className={`border-t pt-4 transition-colors duration-200 ${
              isDarkMode ? 'border-slate-600' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                isDarkMode ? 'text-slate-200' : 'text-gray-800'
              }`}>Advanced Filters</h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-700'
                  }`}>Categories to Include</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => {
                          if (selectedCategories.includes(category)) {
                            setSelectedCategories(selectedCategories.filter(c => c !== category));
                          } else {
                            setSelectedCategories([...selectedCategories, category]);
                          }
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
                          selectedCategories.includes(category)
                            ? 'bg-blue-600 text-white'
                            : isDarkMode
                              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span className="text-base">{getCategoryIcon(category)}</span>
                        <span>{category}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Key Metrics Overview */}
      <section className={`border rounded-2xl shadow-sm transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-6">
          <h2 className={`text-xl font-bold mb-6 transition-colors duration-200 ${
            isDarkMode ? 'text-slate-100' : 'text-gray-900'
          }`}>Key Metrics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Spent */}
            <div className={`rounded-lg p-6 border transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-red-900/30 border-red-800/50' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg transition-colors duration-200 ${
                  isDarkMode ? 'bg-red-900/50' : 'bg-red-100'
                }`}>
                  <TrendingDown size={24} className={`transition-colors duration-200 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`} />
                </div>
                {comparisonData && (
                  <div className={`text-xs px-2 py-1 rounded-full transition-colors duration-200 ${
                    comparisonData.percentageChange > 0
                      ? isDarkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600'
                      : isDarkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-600'
                  }`}>
                    {comparisonData.percentageChange > 0 ? '+' : ''}{comparisonData.percentageChange.toFixed(1)}%
                  </div>
                )}
              </div>
              <h3 className={`text-sm font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-red-300' : 'text-red-800'
              }`}>Total Spent</h3>
              <p className={`text-2xl font-bold transition-colors duration-200 ${
                isDarkMode ? 'text-red-200' : 'text-red-600'
              }`}>
                {formatIndianCurrency(analyticsData.totalAmount)}
              </p>
              {comparisonData && (
                <p className={`text-xs mt-1 transition-colors duration-200 ${
                  isDarkMode ? 'text-red-400' : 'text-red-500'
                }`}>
                  {comparisonData.change > 0 ? '+' : ''}{formatIndianCurrency(comparisonData.change)} vs last period
                </p>
              )}
            </div>

            {/* Average Transaction */}
            <div className={`rounded-lg p-6 border transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-blue-900/30 border-blue-800/50' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg transition-colors duration-200 ${
                  isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                }`}>
                  <BarChart3 size={24} className={`transition-colors duration-200 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
              </div>
              <h3 className={`text-sm font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-blue-300' : 'text-blue-800'
              }`}>Average Transaction</h3>
              <p className={`text-2xl font-bold transition-colors duration-200 ${
                isDarkMode ? 'text-blue-200' : 'text-blue-600'
              }`}>
                {formatIndianCurrency(analyticsData.averageTransaction)}
              </p>
              <p className={`text-xs mt-1 transition-colors duration-200 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-500'
              }`}>
                Per transaction
              </p>
            </div>

            {/* Most Expensive Category */}
            <div className={`rounded-lg p-6 border transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-purple-900/30 border-purple-800/50' 
                : 'bg-purple-50 border-purple-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg transition-colors duration-200 ${
                  isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'
                }`}>
                  <Award size={24} className={`transition-colors duration-200 ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                </div>
              </div>
              <h3 className={`text-sm font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-purple-300' : 'text-purple-800'
              }`}>Top Category</h3>
              {(() => {
                const topCategory = Object.entries(analyticsData.categoryBreakdown)
                  .sort(([,a], [,b]) => b - a)[0];
                return topCategory ? (
                  <>
                    <p className={`text-lg font-bold transition-colors duration-200 ${
                      isDarkMode ? 'text-purple-200' : 'text-purple-600'
                    }`}>
                      {getCategoryIcon(topCategory[0])} {topCategory[0]}
                    </p>
                    <p className={`text-xs mt-1 transition-colors duration-200 ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-500'
                    }`}>
                      {formatIndianCurrency(topCategory[1])}
                    </p>
                  </>
                ) : (
                  <p className={`text-lg font-bold transition-colors duration-200 ${
                    isDarkMode ? 'text-purple-200' : 'text-purple-600'
                  }`}>No data</p>
                );
              })()}
            </div>

            {/* Transaction Count */}
            <div className={`rounded-lg p-6 border transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-green-900/30 border-green-800/50' 
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg transition-colors duration-200 ${
                  isDarkMode ? 'bg-green-900/50' : 'bg-green-100'
                }`}>
                  <Zap size={24} className={`transition-colors duration-200 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`} />
                </div>
              </div>
              <h3 className={`text-sm font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-green-300' : 'text-green-800'
              }`}>Transactions</h3>
              <p className={`text-2xl font-bold transition-colors duration-200 ${
                isDarkMode ? 'text-green-200' : 'text-green-600'
              }`}>
                {analyticsData.totalTransactions}
              </p>
              <p className={`text-xs mt-1 transition-colors duration-200 ${
                isDarkMode ? 'text-green-400' : 'text-green-500'
              }`}>
                In selected period
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className={`border rounded-2xl shadow-sm transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-6">
          <h2 className={`text-xl font-bold mb-6 transition-colors duration-200 ${
            isDarkMode ? 'text-slate-100' : 'text-gray-900'
          }`}>Visual Analytics</h2>

          {/* Category Breakdown Chart */}
          {chartType === 'category' && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                isDarkMode ? 'text-slate-200' : 'text-gray-800'
              }`}>Spending by Category</h3>
              
              {Object.keys(analyticsData.categoryBreakdown).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(analyticsData.categoryBreakdown)
                    .sort(([,a], [,b]) => b - a)
                    .map(([category, amount]) => {
                      const percentage = ((amount / analyticsData.totalAmount) * 100).toFixed(1);
                      return (
                        <div key={category} className={`p-4 rounded-lg border transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-slate-700/50 border-slate-600' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{getCategoryIcon(category)}</span>
                              <div>
                                <h4 className={`font-semibold transition-colors duration-200 ${
                                  isDarkMode ? 'text-slate-200' : 'text-gray-800'
                                }`}>{category}</h4>
                                <p className={`text-sm transition-colors duration-200 ${
                                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                                }`}>
                                  {analyticsData.filteredExpenses.filter(e => e.category === category).length} transactions
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold transition-colors duration-200 ${
                                isDarkMode ? 'text-slate-100' : 'text-gray-900'
                              }`}>
                                {formatIndianCurrency(amount)}
                              </p>
                              <p className={`text-sm transition-colors duration-200 ${
                                isDarkMode ? 'text-slate-400' : 'text-gray-600'
                              }`}>{percentage}%</p>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className={`w-full rounded-full h-3 transition-colors duration-200 ${
                            isDarkMode ? 'bg-slate-600' : 'bg-gray-200'
                          }`}>
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className={`text-center py-12 border-2 border-dashed rounded-lg transition-colors duration-200 ${
                  isDarkMode 
                    ? 'border-slate-600' 
                    : 'border-gray-200'
                }`}>
                  <PieChart size={48} className={`mx-auto mb-4 transition-colors duration-200 ${
                    isDarkMode ? 'text-slate-500' : 'text-gray-400'
                  }`} />
                  <p className={`text-lg font-semibold transition-colors duration-200 ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>No category data available</p>
                </div>
              )}
            </div>
          )}

          {/* Source Breakdown Chart */}
          {chartType === 'source' && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                isDarkMode ? 'text-slate-200' : 'text-gray-800'
              }`}>Spending by Payment Source</h3>
              
              {Object.keys(analyticsData.sourceBreakdown).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(analyticsData.sourceBreakdown)
                    .sort(([,a], [,b]) => b - a)
                    .map(([sourceName, amount]) => {
                      const percentage = ((amount / analyticsData.totalAmount) * 100).toFixed(1);
                      const source = sources.find(s => s.name === sourceName);
                      const typeInfo = source ? getSourceTypeInfo(source.type) : null;
                      const Icon = typeInfo?.icon;
                      
                      return (
                        <div key={sourceName} className={`p-4 rounded-lg border transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-slate-700/50 border-slate-600' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {source && (
                                <div 
                                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                                  style={{ backgroundColor: source.color }}
                                >
                                  {Icon && <Icon size={20} />}
                                </div>
                              )}
                              <div>
                                <h4 className={`font-semibold transition-colors duration-200 ${
                                  isDarkMode ? 'text-slate-200' : 'text-gray-800'
                                }`}>{sourceName}</h4>
                                <p className={`text-sm transition-colors duration-200 ${
                                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                                }`}>
                                  {typeInfo?.name || 'Unknown Type'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold transition-colors duration-200 ${
                                isDarkMode ? 'text-slate-100' : 'text-gray-900'
                              }`}>
                                {formatIndianCurrency(amount)}
                              </p>
                              <p className={`text-sm transition-colors duration-200 ${
                                isDarkMode ? 'text-slate-400' : 'text-gray-600'
                              }`}>{percentage}%</p>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className={`w-full rounded-full h-3 transition-colors duration-200 ${
                            isDarkMode ? 'bg-slate-600' : 'bg-gray-200'
                          }`}>
                            <div 
                              className="h-3 rounded-full transition-all duration-500" 
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: source?.color || '#3B82F6'
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className={`text-center py-12 border-2 border-dashed rounded-lg transition-colors duration-200 ${
                  isDarkMode 
                    ? 'border-slate-600' 
                    : 'border-gray-200'
                }`}>
                  <BarChart3 size={48} className={`mx-auto mb-4 transition-colors duration-200 ${
                    isDarkMode ? 'text-slate-500' : 'text-gray-400'
                  }`} />
                  <p className={`text-lg font-semibold transition-colors duration-200 ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>No source data available</p>
                </div>
              )}
            </div>
          )}

          {/* Timeline Chart */}
          {chartType === 'timeline' && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                isDarkMode ? 'text-slate-200' : 'text-gray-800'
              }`}>Daily Spending (Last 30 Days)</h3>
              
              <div className="space-y-2">
                {analyticsData.dailySpending.slice(-7).map(day => {
                  const maxAmount = Math.max(...analyticsData.dailySpending.map(d => d.amount));
                  const percentage = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
                  
                  return (
                    <div key={day.date} className={`flex items-center gap-4 p-3 rounded-lg transition-colors duration-200 ${
                      isDarkMode 
                        ? 'bg-slate-700/50' 
                        : 'bg-gray-50'
                    }`}>
                      <div className="w-20 text-sm font-medium">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex-1">
                        <div className={`w-full rounded-full h-4 transition-colors duration-200 ${
                          isDarkMode ? 'bg-slate-600' : 'bg-gray-200'
                        }`}>
                          <div 
                            className="bg-gradient-to-r from-green-500 to-blue-600 h-4 rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-32 text-right">
                        <p className={`font-semibold transition-colors duration-200 ${
                          isDarkMode ? 'text-slate-200' : 'text-gray-800'
                        }`}>
                          {formatIndianCurrency(day.amount)}
                        </p>
                        <p className={`text-xs transition-colors duration-200 ${
                          isDarkMode ? 'text-slate-400' : 'text-gray-600'
                        }`}>
                          {day.transactions} transactions
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Monthly Trends */}
          {chartType === 'trends' && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                isDarkMode ? 'text-slate-200' : 'text-gray-800'
              }`}>Monthly Spending Trends (Last 12 Months)</h3>
              
              <div className="space-y-3">
                {analyticsData.monthlyTrends.map(month => {
                  const maxAmount = Math.max(...analyticsData.monthlyTrends.map(m => m.amount));
                  const percentage = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0;
                  
                  return (
                    <div key={month.month} className={`flex items-center gap-4 p-3 rounded-lg transition-colors duration-200 ${
                      isDarkMode 
                        ? 'bg-slate-700/50' 
                        : 'bg-gray-50'
                    }`}>
                      <div className="w-24 text-sm font-medium">
                        {month.month}
                      </div>
                      <div className="flex-1">
                        <div className={`w-full rounded-full h-5 transition-colors duration-200 ${
                          isDarkMode ? 'bg-slate-600' : 'bg-gray-200'
                        }`}>
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-600 h-5 rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-32 text-right">
                        <p className={`font-semibold transition-colors duration-200 ${
                          isDarkMode ? 'text-slate-200' : 'text-gray-800'
                        }`}>
                          {formatIndianCurrency(month.amount)}
                        </p>
                        <p className={`text-xs transition-colors duration-200 ${
                          isDarkMode ? 'text-slate-400' : 'text-gray-600'
                        }`}>
                          {month.transactions} transactions
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Top Vendors */}
      <section className={`border rounded-2xl shadow-sm transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-6">
          <h2 className={`text-xl font-bold mb-6 transition-colors duration-200 ${
            isDarkMode ? 'text-slate-100' : 'text-gray-900'
          }`}>Top Vendors</h2>
          
          {analyticsData.topVendors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analyticsData.topVendors.map((vendor, index) => (
                <div key={vendor.vendor} className={`flex items-center justify-between p-4 rounded-lg border transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-slate-700/50 border-slate-600' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className={`font-semibold transition-colors duration-200 ${
                        isDarkMode ? 'text-slate-200' : 'text-gray-800'
                      }`}>{vendor.vendor}</h3>
                      <p className={`text-sm transition-colors duration-200 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-600'
                      }`}>
                        {analyticsData.filteredExpenses.filter(e => e.vendor === vendor.vendor).length} transactions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold transition-colors duration-200 ${
                      isDarkMode ? 'text-slate-100' : 'text-gray-900'
                    }`}>
                      {formatIndianCurrency(vendor.amount)}
                    </p>
                    <p className={`text-sm transition-colors duration-200 ${
                      isDarkMode ? 'text-slate-400' : 'text-gray-600'
                    }`}>
                      {((vendor.amount / analyticsData.totalAmount) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-12 border-2 border-dashed rounded-lg transition-colors duration-200 ${
              isDarkMode 
                ? 'border-slate-600' 
                : 'border-gray-200'
            }`}>
              <AlertCircle size={48} className={`mx-auto mb-4 transition-colors duration-200 ${
                isDarkMode ? 'text-slate-500' : 'text-gray-400'
              }`} />
              <p className={`text-lg font-semibold transition-colors duration-200 ${
                isDarkMode ? 'text-slate-300' : 'text-gray-600'
              }`}>No vendor data available</p>
            </div>
          )}
        </div>
      </section>

      {/* Financial Health Summary */}
      <section className={`border rounded-2xl shadow-sm transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-6">
          <h2 className={`text-xl font-bold mb-6 transition-colors duration-200 ${
            isDarkMode ? 'text-slate-100' : 'text-gray-900'
          }`}>Financial Health Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Spending Velocity */}
            <div className={`p-4 rounded-lg border transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-orange-900/30 border-orange-800/50' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              <h3 className={`font-semibold mb-2 transition-colors duration-200 ${
                isDarkMode ? 'text-orange-300' : 'text-orange-800'
              }`}>Spending Velocity</h3>
              <p className={`text-2xl font-bold transition-colors duration-200 ${
                isDarkMode ? 'text-orange-200' : 'text-orange-600'
              }`}>
                {analyticsData.totalTransactions > 0 
                  ? (analyticsData.totalAmount / analyticsData.totalTransactions).toFixed(0)
                  : '0'
                }
              </p>
              <p className={`text-sm transition-colors duration-200 ${
                isDarkMode ? 'text-orange-400' : 'text-orange-500'
              }`}>₹ per transaction</p>
            </div>

            {/* Category Diversity */}
            <div className={`p-4 rounded-lg border transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-purple-900/30 border-purple-800/50' 
                : 'bg-purple-50 border-purple-200'
            }`}>
              <h3 className={`font-semibold mb-2 transition-colors duration-200 ${
                isDarkMode ? 'text-purple-300' : 'text-purple-800'
              }`}>Category Diversity</h3>
              <p className={`text-2xl font-bold transition-colors duration-200 ${
                isDarkMode ? 'text-purple-200' : 'text-purple-600'
              }`}>
                {Object.keys(analyticsData.categoryBreakdown).length}
              </p>
              <p className={`text-sm transition-colors duration-200 ${
                isDarkMode ? 'text-purple-400' : 'text-purple-500'
              }`}>out of {categories.length} categories</p>
            </div>

            {/* Balance Status */}
            <div className={`p-4 rounded-lg border transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-green-900/30 border-green-800/50' 
                : 'bg-green-50 border-green-200'
            }`}>
              <h3 className={`font-semibold mb-2 transition-colors duration-200 ${
                isDarkMode ? 'text-green-300' : 'text-green-800'
              }`}>Total Balance</h3>
              <p className={`text-2xl font-bold transition-colors duration-200 ${
                isDarkMode ? 'text-green-200' : 'text-green-600'
              }`}>
                {formatIndianCurrency(Object.values(sourceBalances).reduce((sum, balance) => sum + balance, 0))}
              </p>
              <p className={`text-sm transition-colors duration-200 ${
                isDarkMode ? 'text-green-400' : 'text-green-500'
              }`}>across all sources</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Analytics;
