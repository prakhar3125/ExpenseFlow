import React, { useState, useEffect } from 'react';
import { Eye, Edit2, Trash2, Calendar, Building, Filter, Search, AlertCircle, Tag, ChevronDown, MoreVertical } from 'lucide-react';
import { useExpenseContext } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const ExpensesList = () => {
  const { 
    // State
    expenses,
    sources,
    selectedSources,
    categories,
    sourceBalances,
    showCategories,
    
    // State setters
    setSelectedSources,
    setShowCategories,
    setCurrentExpense,
    setIsEditing,
    setEditingId,
    setShowForm,
    
    // Functions
    getFilteredExpenses,
    deleteExpense,
    getSourceById,
    getSourceTypeInfo,
    formatIndianCurrency,
    getBalanceStatus
  } = useExpenseContext();
  
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  // Local state for list-specific functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, amount, vendor, category
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState('all'); // all, thisMonth, lastMonth, thisYear
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('detailed'); // detailed, compact
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // FIXED: Enhanced edit function that properly sets up edit state
  const handleEditExpense = (expense) => {
    try {
      // Set the current expense data in the context
      setCurrentExpense({
        amount: expense.amount.toString(),
        vendor: expense.vendor,
        date: expense.date,
        category: expense.category,
        description: expense.description || '',
        receiptImage: expense.receiptImage || null,
        sourceId: expense.sourceId
      });
      
      // Set editing state
      setIsEditing(true);
      setEditingId(expense.id);
      setShowForm(true);
      
      // Navigate to add expense page which will show edit mode
      navigate('/expenses/add');
    } catch (error) {
      console.error('Error editing expense:', error);
      alert('Error editing expense. Please try again.');
    }
  };

  // FIXED: Enhanced delete function with confirmation
  const handleDeleteExpense = (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        deleteExpense(expenseId);
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Error deleting expense. Please try again.');
      }
    }
  };

  // Get filtered and sorted expenses
  const getProcessedExpenses = () => {
    let filtered = getFilteredExpenses();
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(expense => 
        expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(expense => expense.category === selectedCategory);
    }
    
    // Apply date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        const expenseMonth = expenseDate.getMonth();
        const expenseYear = expenseDate.getFullYear();
        
        switch (dateRange) {
          case 'thisMonth':
            return expenseMonth === currentMonth && expenseYear === currentYear;
          case 'lastMonth':
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return expenseMonth === lastMonth && expenseYear === lastMonthYear;
          case 'thisYear':
            return expenseYear === currentYear;
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'vendor':
          aValue = a.vendor.toLowerCase();
          bValue = b.vendor.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'date':
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return filtered;
  };

  const filteredExpenses = getProcessedExpenses();
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averageExpense = filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;

  // Calculate category breakdown for filtered expenses
  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

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

  // Helper function to format date ranges
  const getDateRangeLabel = (range) => {
    const labels = {
      'all': 'All Time',
      'thisMonth': 'This Month',
      'lastMonth': 'Last Month',
      'thisYear': 'This Year'
    };
    return labels[range] || 'All Time';
  };

  // Handle bulk operations
  const handleSelectAll = () => {
    if (selectedExpenses.length === filteredExpenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(filteredExpenses.map(expense => expense.id));
    }
  };

  const handleSelectExpense = (expenseId) => {
    if (selectedExpenses.includes(expenseId)) {
      setSelectedExpenses(selectedExpenses.filter(id => id !== expenseId));
    } else {
      setSelectedExpenses([...selectedExpenses, expenseId]);
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedExpenses.length} selected expenses?`)) {
      selectedExpenses.forEach(expenseId => {
        handleDeleteExpense(expenseId);
      });
      setSelectedExpenses([]);
      setShowBulkActions(false);
    }
  };

  // Clear selected expenses when filters change
  useEffect(() => {
    setSelectedExpenses([]);
  }, [searchTerm, selectedCategory, dateRange, selectedSources]);

  return (
    <div className="space-y-6">
      {/* Enhanced Filter Section */}
      <section className={`border rounded-2xl shadow-sm transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
            <h2 className={`text-xl font-bold flex items-center gap-2 transition-colors duration-200 ${
              isDarkMode ? 'text-slate-100' : 'text-gray-900'
            }`}>
              <Filter size={20} />
              Filter by Payment Sources
            </h2>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  isDarkMode
                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Search size={16} />
                Advanced Filters
              </button>
              
              <button
                onClick={() => setViewMode(viewMode === 'detailed' ? 'compact' : 'detailed')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  isDarkMode
                    ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <Eye size={16} />
                {viewMode === 'detailed' ? 'Compact View' : 'Detailed View'}
              </button>
            </div>
          </div>
          
          {/* Source Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedSources(['all'])}
              className={`px-4 py-2 rounded-full border transition-all duration-200 ${
                selectedSources.includes('all')
                  ? isDarkMode
                    ? 'bg-slate-600 text-slate-100 border-slate-500'
                    : 'bg-gray-800 text-white border-gray-800'
                  : isDarkMode
                    ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              All Sources ({sources.length})
            </button>
            
            {sources.map(source => {
              const typeInfo = getSourceTypeInfo(source.type);
              const Icon = typeInfo.icon;
              const balance = sourceBalances[source.id] || 0;
              const balanceStatus = getBalanceStatus(balance, source.alertThreshold);
              
              return (
                <button
                  key={source.id}
                  onClick={() => {
                    if (selectedSources.includes(source.id)) {
                      setSelectedSources(selectedSources.filter(id => id !== source.id));
                    } else {
                      setSelectedSources([...selectedSources.filter(id => id !== 'all'), source.id]);
                    }
                  }}
                  className={`px-4 py-2 rounded-full border transition-all duration-200 flex items-center gap-2 ${
                    selectedSources.includes(source.id)
                      ? 'border-gray-600 text-white'
                      : isDarkMode
                        ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                  style={{
                    backgroundColor: selectedSources.includes(source.id) ? source.color : undefined,
                    borderColor: selectedSources.includes(source.id) ? source.color : undefined
                  }}
                >
                  <Icon size={16} />
                  <span className="font-medium">{source.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedSources.includes(source.id) 
                      ? 'bg-white bg-opacity-20 text-white' 
                      : balanceStatus.bgColor + ' ' + balanceStatus.color
                  }`}>
                    {formatIndianCurrency(balance)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className={`border-t pt-4 transition-colors duration-200 ${
              isDarkMode ? 'border-slate-600' : 'border-gray-200'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-700'
                  }`}>Search</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search vendor, description..."
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-700'
                  }`}>Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-slate-200' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {getCategoryIcon(category)} {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-700'
                  }`}>Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-slate-200' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Time</option>
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="thisYear">This Year</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-700'
                  }`}>Sort By</label>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className={`flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isDarkMode 
                          ? 'bg-slate-700 border-slate-600 text-slate-200' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="date">Date</option>
                      <option value="amount">Amount</option>
                      <option value="vendor">Vendor</option>
                      <option value="category">Category</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className={`px-3 py-3 border rounded-lg transition-colors ${
                        isDarkMode
                          ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setDateRange('all');
                    setSortBy('date');
                    setSortOrder('desc');
                    setSelectedSources(['all']);
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Clear All Filters
                </button>
                
                <span className={`text-sm transition-colors duration-200 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  Showing {filteredExpenses.length} of {expenses.length} expenses
                </span>
              </div>
            </div>
          )}

          {/* Quick Stats for Filtered Results */}
          {filteredExpenses.length > 0 && (
            <div className={`border-t pt-4 mt-4 transition-colors duration-200 ${
              isDarkMode ? 'border-slate-600' : 'border-gray-200'
            }`}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`text-center p-3 rounded-lg transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-blue-900/30 border border-blue-800/50' 
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <p className={`text-sm font-medium transition-colors duration-200 ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-800'
                  }`}>Total Amount</p>
                  <p className={`text-xl font-bold transition-colors duration-200 ${
                    isDarkMode ? 'text-blue-200' : 'text-blue-600'
                  }`}>
                    {formatIndianCurrency(totalExpenses)}
                  </p>
                </div>
                
                <div className={`text-center p-3 rounded-lg transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-green-900/30 border border-green-800/50' 
                    : 'bg-green-50 border border-green-200'
                }`}>
                  <p className={`text-sm font-medium transition-colors duration-200 ${
                    isDarkMode ? 'text-green-300' : 'text-green-800'
                  }`}>Transactions</p>
                  <p className={`text-xl font-bold transition-colors duration-200 ${
                    isDarkMode ? 'text-green-200' : 'text-green-600'
                  }`}>
                    {filteredExpenses.length}
                  </p>
                </div>
                
                <div className={`text-center p-3 rounded-lg transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-purple-900/30 border border-purple-800/50' 
                    : 'bg-purple-50 border border-purple-200'
                }`}>
                  <p className={`text-sm font-medium transition-colors duration-200 ${
                    isDarkMode ? 'text-purple-300' : 'text-purple-800'
                  }`}>Average</p>
                  <p className={`text-xl font-bold transition-colors duration-200 ${
                    isDarkMode ? 'text-purple-200' : 'text-purple-600'
                  }`}>
                    {formatIndianCurrency(averageExpense)}
                  </p>
                </div>
                
                <div className={`text-center p-3 rounded-lg transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-orange-900/30 border border-orange-800/50' 
                    : 'bg-orange-50 border border-orange-200'
                }`}>
                  <p className={`text-sm font-medium transition-colors duration-200 ${
                    isDarkMode ? 'text-orange-300' : 'text-orange-800'
                  }`}>Time Period</p>
                  <p className={`text-xl font-bold transition-colors duration-200 ${
                    isDarkMode ? 'text-orange-200' : 'text-orange-600'
                  }`}>
                    {getDateRangeLabel(dateRange)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Category Breakdown (Conditional) */}
      {Object.keys(expensesByCategory).length > 0 && (
        <section className={`border rounded-2xl shadow-sm transition-colors duration-200 ${
          isDarkMode 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="p-6">
            <button
              onClick={() => setShowCategories(!showCategories)}
              className={`w-full flex items-center justify-between text-left focus:outline-none transition-colors duration-200 ${
                isDarkMode ? 'text-slate-100' : 'text-gray-900'
              }`}
            >
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Tag size={20} />
                Expense Categories {!selectedSources.includes('all') && `(${selectedSources.length} sources)`}
              </h2>
              <ChevronDown
                size={24}
                className={`transition-transform duration-300 ease-in-out ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                } ${showCategories ? 'transform rotate-180' : ''}`}
              />
            </button>
            
            {showCategories && (
              <div className={`mt-4 pt-4 border-t transition-colors duration-200 ${
                isDarkMode ? 'border-slate-700' : 'border-gray-200'
              }`}>
                <div className="space-y-3">
                  {Object.entries(expensesByCategory)
                    .sort(([,a], [,b]) => b - a)
                    .map(([category, amount]) => {
                      const percentage = ((amount / totalExpenses) * 100).toFixed(1);
                      const transactionCount = filteredExpenses.filter(e => e.category === category).length;
                      return (
                        <div key={category} className={`flex items-center justify-between p-4 rounded-lg transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-slate-700/50 hover:bg-slate-700' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="text-xl">{getCategoryIcon(category)}</div>
                            <div>
                              <h3 className={`font-semibold transition-colors duration-200 ${
                                isDarkMode ? 'text-slate-200' : 'text-gray-800'
                              }`}>{category}</h3>
                              <p className={`text-sm transition-colors duration-200 ${
                                isDarkMode ? 'text-slate-400' : 'text-gray-600'
                              }`}>{transactionCount} transaction{transactionCount !== 1 ? 's' : ''}</p>
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
                            }`}>{percentage}% of total</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Expenses List */}
      <section className={`border rounded-2xl shadow-sm transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-bold flex items-center gap-2 transition-colors duration-200 ${
              isDarkMode ? 'text-slate-100' : 'text-gray-900'
            }`}>
              <Eye size={20} />
              Recent Expenses ({filteredExpenses.length})
            </h2>
            
            {/* Bulk Actions */}
            {filteredExpenses.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <MoreVertical size={16} />
                </button>
                
                {showBulkActions && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAll}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        isDarkMode
                          ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {selectedExpenses.length === filteredExpenses.length ? 'Deselect All' : 'Select All'}
                    </button>
                    
                    {selectedExpenses.length > 0 && (
                      <button
                        onClick={handleBulkDelete}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          isDarkMode
                            ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        Delete Selected ({selectedExpenses.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {filteredExpenses.length === 0 ? (
            <div className={`text-center py-16 border-2 border-dashed rounded-lg transition-colors duration-200 ${
              isDarkMode 
                ? 'border-slate-600' 
                : 'border-gray-200'
            }`}>
              <AlertCircle size={48} className={`mx-auto mb-4 transition-colors duration-200 ${
                isDarkMode ? 'text-slate-500' : 'text-gray-400'
              }`} />
              <p className={`text-lg font-semibold transition-colors duration-200 ${
                isDarkMode ? 'text-slate-300' : 'text-gray-600'
              }`}>
                {selectedSources.includes('all') 
                  ? 'No expenses found matching your filters' 
                  : 'No expenses from selected sources matching your filters'
                }
              </p>
              <p className={`mt-1 transition-colors duration-200 ${
                isDarkMode ? 'text-slate-400' : 'text-gray-500'
              }`}>
                Try adjusting your filters or add new expenses.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map(expense => {
                const source = getSourceById(expense.sourceId);
                const typeInfo = source ? getSourceTypeInfo(source.type) : null;
                const Icon = typeInfo?.icon;
                const isSelected = selectedExpenses.includes(expense.id);
                
                return (
                  <div key={expense.id} className={`border rounded-lg p-4 transition-all duration-200 ${
                    isSelected
                      ? isDarkMode
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-blue-500 bg-blue-50'
                      : isDarkMode
                        ? 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                        : 'border-gray-200 hover:shadow-lg hover:border-blue-300'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Checkbox for bulk selection */}
                        {showBulkActions && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectExpense(expense.id)}
                            className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-x-3 gap-y-2 mb-2">
                            <h3 className={`text-lg font-semibold transition-colors duration-200 ${
                              isDarkMode ? 'text-slate-200' : 'text-gray-800'
                            }`}>{expense.vendor}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200 ${
                              isDarkMode 
                                ? 'bg-blue-900/50 text-blue-300' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {expense.category}
                            </span>
                            
                            {/* Source Badge */}
                            {source && (
                              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border"
                                   style={{ 
                                     backgroundColor: `${source.color}20`, 
                                     borderColor: source.color,
                                     color: source.color
                                   }}>
                                {Icon && <Icon size={12} />}
                                {source.name}
                              </div>
                            )}
                          </div>
                          
                          <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-sm transition-colors duration-200 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-600'
                          }`}>
                            <span className={`flex items-center gap-1.5 font-mono font-medium ${
                              isDarkMode ? 'text-green-400' : 'text-green-700'
                            }`}>
                              {formatIndianCurrency(expense.amount)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar size={14} />
                              {expense.date}
                            </span>
                            {expense.description && (
                              <span className="flex items-center gap-1.5">
                                <Building size={14} />
                                {expense.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* FIXED: Enhanced Action Buttons with Better Light Mode Styling */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className={`group relative p-2.5 rounded-lg border transition-all duration-200 ${
                            isDarkMode
                              ? 'border-blue-600/20 bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 hover:border-blue-500/40'
                              : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:shadow-sm'
                          }`}
                          title="Edit expense"
                        >
                          <Edit2 size={16} className="transition-transform duration-200 group-hover:scale-110" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className={`group relative p-2.5 rounded-lg border transition-all duration-200 ${
                            isDarkMode
                              ? 'border-red-600/20 bg-red-900/20 text-red-400 hover:bg-red-900/40 hover:border-red-500/40'
                              : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 hover:shadow-sm'
                          }`}
                          title="Delete expense"
                        >
                          <Trash2 size={16} className="transition-transform duration-200 group-hover:scale-110" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ExpensesList;
