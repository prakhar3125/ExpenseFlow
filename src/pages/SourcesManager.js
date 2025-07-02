import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Settings, AlertCircle, CreditCard, Wallet, Building2, Smartphone, PiggyBank, TrendingUp, Bell, BarChart3, TrendingDown, Eye, EyeOff } from 'lucide-react';
import { useExpenseContext } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';

const SourcesManager = () => {
  const { 
    // State
    sources,
    sourceBalances,
    currentSource,
    isEditingSource,
    editingSourceId,
    showSourceForm,
    sourceTypes,
    sourceColors,
    
    // State setters
    setCurrentSource,
    setShowSourceForm,
    
    // Functions
    handleSourceSubmit,
    resetSourceForm,
    editSource,
    deleteSource,
    getSourceTypeInfo,
    getSourceById,
    getBalanceStatus,
    formatIndianCurrency,
    getSourceStats
  } = useExpenseContext();
  
  const { isDarkMode } = useTheme();
  
  // Local state for sources manager
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [sortBy, setSortBy] = useState('name'); // name, balance, type, transactions
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [filterType, setFilterType] = useState('all'); // all, or specific source type
  const [showInactive, setShowInactive] = useState(false);
  const [selectedSources, setSelectedSources] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

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

  // Get filtered and sorted sources
  const getProcessedSources = () => {
    let filtered = sources.filter(source => {
      if (!showInactive && !source.isActive) return false;
      if (filterType !== 'all' && source.type !== filterType) return false;
      return true;
    });
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'balance':
          aValue = sourceBalances[a.id] || 0;
          bValue = sourceBalances[b.id] || 0;
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case 'transactions':
          aValue = getSourceStats(a.id).totalTransactions;
          bValue = getSourceStats(b.id).totalTransactions;
          break;
        case 'name':
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
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

  const processedSources = getProcessedSources();

  // Calculate totals
  const totalBalance = Object.values(sourceBalances).reduce((sum, balance) => sum + balance, 0);
  const totalInitialBalance = sources.reduce((sum, source) => sum + source.initialBalance, 0);
  const totalSpent = totalInitialBalance - totalBalance;
  const activeSources = sources.filter(source => source.isActive).length;

  // Handle bulk operations
  const handleSelectAll = () => {
    if (selectedSources.length === processedSources.length) {
      setSelectedSources([]);
    } else {
      setSelectedSources(processedSources.map(source => source.id));
    }
  };

  const handleSelectSource = (sourceId) => {
    if (selectedSources.includes(sourceId)) {
      setSelectedSources(selectedSources.filter(id => id !== sourceId));
    } else {
      setSelectedSources([...selectedSources, sourceId]);
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedSources.length} selected sources?`)) {
      selectedSources.forEach(sourceId => {
        deleteSource(sourceId);
      });
      setSelectedSources([]);
      setShowBulkActions(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Overview Stats */}
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
              }`}>Payment Sources Management</h1>
              <p className={`mt-1 transition-colors duration-200 ${
                isDarkMode ? 'text-slate-400' : 'text-gray-500'
              }`}>
                Manage your payment methods, balances, and spending tracking
              </p>
            </div>
            
            <button
              onClick={() => setShowSourceForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus size={20} />
              Add New Source
            </button>
          </div>

          {/* Overview Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`rounded-lg p-4 text-center border transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-blue-900/30 border-blue-800/50' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <p className={`text-sm font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-blue-300' : 'text-blue-800'
              }`}>Total Balance</p>
              <p className={`text-2xl font-bold transition-colors duration-200 ${
                isDarkMode ? 'text-blue-200' : 'text-blue-600'
              }`}>
                {formatIndianCurrency(totalBalance)}
              </p>
              <p className={`text-xs mt-1 transition-colors duration-200 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-500'
              }`}>
                {activeSources} active source{activeSources !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className={`rounded-lg p-4 text-center border transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-green-900/30 border-green-800/50' 
                : 'bg-green-50 border-green-200'
            }`}>
              <p className={`text-sm font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-green-300' : 'text-green-800'
              }`}>Initial Balance</p>
              <p className={`text-2xl font-bold transition-colors duration-200 ${
                isDarkMode ? 'text-green-200' : 'text-green-600'
              }`}>
                {formatIndianCurrency(totalInitialBalance)}
              </p>
              <p className={`text-xs mt-1 transition-colors duration-200 ${
                isDarkMode ? 'text-green-400' : 'text-green-500'
              }`}>
                Total started with
              </p>
            </div>
            
            <div className={`rounded-lg p-4 text-center border transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-red-900/30 border-red-800/50' 
                : 'bg-red-50 border-red-200'
            }`}>
              <p className={`text-sm font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-red-300' : 'text-red-800'
              }`}>Total Spent</p>
              <p className={`text-2xl font-bold transition-colors duration-200 ${
                isDarkMode ? 'text-red-200' : 'text-red-600'
              }`}>
                {formatIndianCurrency(totalSpent)}
              </p>
              <p className={`text-xs mt-1 transition-colors duration-200 ${
                isDarkMode ? 'text-red-400' : 'text-red-500'
              }`}>
                Across all sources
              </p>
            </div>
            
            <div className={`rounded-lg p-4 text-center border transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-purple-900/30 border-purple-800/50' 
                : 'bg-purple-50 border-purple-200'
            }`}>
              <p className={`text-sm font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-purple-300' : 'text-purple-800'
              }`}>Source Types</p>
              <p className={`text-2xl font-bold transition-colors duration-200 ${
                isDarkMode ? 'text-purple-200' : 'text-purple-600'
              }`}>
                {new Set(sources.map(s => s.type)).size}
              </p>
              <p className={`text-xs mt-1 transition-colors duration-200 ${
                isDarkMode ? 'text-purple-400' : 'text-purple-500'
              }`}>
                Different types
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Add/Edit Source Form */}
      {showSourceForm && (
        <section className={`border rounded-2xl shadow-sm transition-colors duration-200 ${
          isDarkMode 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="p-6">
            <h2 className={`text-xl font-bold mb-6 transition-colors duration-200 ${
              isDarkMode ? 'text-slate-100' : 'text-gray-900'
            }`}>
              {isEditingSource ? 'Edit Payment Source' : 'Add New Payment Source'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Source Type Selection */}
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>Source Type *</label>
                <select
                  value={currentSource.type}
                  onChange={(e) => setCurrentSource({...currentSource, type: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-slate-200' 
                      : 'bg-white border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select type</option>
                  {sourceTypes.map(type => {
                    const Icon = type.icon;
                    return (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    );
                  })}
                </select>
                {currentSource.type && (
                  <div className={`mt-2 p-3 rounded-lg border transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-slate-700/50 border-slate-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const typeInfo = getSourceTypeInfo(currentSource.type);
                        const Icon = typeInfo.icon;
                        return (
                          <>
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                              style={{ backgroundColor: typeInfo.color }}
                            >
                              <Icon size={20} />
                            </div>
                            <div>
                              <p className={`font-medium transition-colors duration-200 ${
                                isDarkMode ? 'text-slate-200' : 'text-gray-800'
                              }`}>{typeInfo.name}</p>
                              <p className={`text-sm transition-colors duration-200 ${
                                isDarkMode ? 'text-slate-400' : 'text-gray-600'
                              }`}>{typeInfo.description}</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Source Name */}
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>Source Name *</label>
                <input
                  type="text"
                  value={currentSource.name}
                  onChange={(e) => setCurrentSource({...currentSource, name: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-slate-200' 
                      : 'bg-white border-gray-300'
                  }`}
                  placeholder="e.g., PhonePe - Personal, SBI Savings"
                  required
                />
              </div>
              
              {/* Add Amount */}
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>Add Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentSource.initialBalance}
                  onChange={(e) => setCurrentSource({...currentSource, initialBalance: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-slate-200' 
                      : 'bg-white border-gray-300'
                  }`}
                  placeholder="Amount to add (0.00)"
                />
                <p className={`text-sm mt-1 transition-colors duration-200 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  {isEditingSource 
                    ? "Amount to add to current balance" 
                    : "Starting amount for new source (0 by default)"
                  }
                </p>
                
                {/* Balance Preview for Editing */}
                {isEditingSource && (
                  <div className={`mt-2 p-3 border rounded-lg transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-blue-900/30 border-blue-800/50' 
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <p className={`text-sm font-medium transition-colors duration-200 ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-800'
                    }`}>
                      Current Balance: {formatIndianCurrency(
                        sources.find(s => s.id === editingSourceId)?.initialBalance || 0
                      )}
                    </p>
                    <p className={`text-xs transition-colors duration-200 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      New balance will be: {formatIndianCurrency(
                        (sources.find(s => s.id === editingSourceId)?.initialBalance || 0) + 
                        (parseFloat(currentSource.initialBalance) || 0)
                      )}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Alert Threshold */}
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>Low Balance Alert Threshold</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentSource.alertThreshold}
                  onChange={(e) => setCurrentSource({...currentSource, alertThreshold: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-slate-200' 
                      : 'bg-white border-gray-300'
                  }`}
                  placeholder="100.00"
                />
                <p className={`text-sm mt-1 transition-colors duration-200 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  Get notified when balance drops below this amount
                </p>
              </div>
              
              {/* Description */}
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>Description</label>
                <input
                  type="text"
                  value={currentSource.description}
                  onChange={(e) => setCurrentSource({...currentSource, description: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-slate-200' 
                      : 'bg-white border-gray-300'
                  }`}
                  placeholder="Optional description or notes"
                />
              </div>
              
              {/* Color Theme Selection */}
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>Color Theme</label>
                <div className="flex flex-wrap gap-3">
                  {sourceColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setCurrentSource({...currentSource, color})}
                      className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                        currentSource.color === color 
                          ? 'border-gray-800 ring-2 ring-offset-2 ring-gray-400' 
                          : isDarkMode
                            ? 'border-slate-600 hover:border-slate-500'
                            : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Select ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <button
                onClick={handleSourceSubmit}
                className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
              >
                {isEditingSource ? 'Update Source' : 'Add Source'}
              </button>
              <button
                onClick={resetSourceForm}
                className={`px-6 py-2.5 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-600 text-slate-200 hover:bg-slate-500' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Filters and Controls */}
      <section className={`border rounded-2xl shadow-sm transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
            <h2 className={`text-xl font-bold transition-colors duration-200 ${
              isDarkMode ? 'text-slate-100' : 'text-gray-900'
            }`}>
              Sources ({processedSources.length})
            </h2>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className={`flex rounded-lg border transition-colors duration-200 ${
                isDarkMode ? 'border-slate-600' : 'border-gray-300'
              }`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-l-lg transition-colors duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : isDarkMode
                        ? 'text-slate-300 hover:bg-slate-700'
                        : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 rounded-r-lg transition-colors duration-200 ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : isDarkMode
                        ? 'text-slate-300 hover:bg-slate-700'
                        : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  List
                </button>
              </div>
              
              {/* Bulk Actions */}
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Settings size={16} />
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-slate-200' 
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value="all">All Types</option>
              {sourceTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-slate-200' 
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value="name">Sort by Name</option>
              <option value="balance">Sort by Balance</option>
              <option value="type">Sort by Type</option>
              <option value="transactions">Sort by Transactions</option>
            </select>

            {/* Sort Order */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={`px-3 py-3 border rounded-lg transition-colors ${
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>

            {/* Show Inactive Toggle */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className={`text-sm transition-colors duration-200 ${
                isDarkMode ? 'text-slate-300' : 'text-gray-700'
              }`}>Show Inactive</span>
            </label>
          </div>

          {/* Bulk Actions */}
          {showBulkActions && (
            <div className={`border-t pt-4 transition-colors duration-200 ${
              isDarkMode ? 'border-slate-600' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    isDarkMode
                      ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {selectedSources.length === processedSources.length ? 'Deselect All' : 'Select All'}
                </button>
                
                {selectedSources.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      isDarkMode
                        ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    Delete Selected ({selectedSources.length})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Sources List/Grid */}
      <section className={`border rounded-2xl shadow-sm transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-6">
          {processedSources.length === 0 ? (
            <div className={`text-center py-16 border-2 border-dashed rounded-lg transition-colors duration-200 ${
              isDarkMode 
                ? 'border-slate-600' 
                : 'border-gray-200'
            }`}>
              <CreditCard size={48} className={`mx-auto mb-4 transition-colors duration-200 ${
                isDarkMode ? 'text-slate-500' : 'text-gray-400'
              }`} />
              <p className={`text-lg font-semibold transition-colors duration-200 ${
                isDarkMode ? 'text-slate-300' : 'text-gray-600'
              }`}>
                No payment sources found
              </p>
              <p className={`mt-1 transition-colors duration-200 ${
                isDarkMode ? 'text-slate-400' : 'text-gray-500'
              }`}>
                Add your first payment source to start tracking expenses
              </p>
              <button
                onClick={() => setShowSourceForm(true)}
                className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Add Your First Source
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {processedSources.map(source => {
                const typeInfo = getSourceTypeInfo(source.type);
                const Icon = typeInfo.icon;
                const balance = sourceBalances[source.id] || 0;
                const stats = getSourceStats(source.id);
                const balanceStatus = getBalanceStatus(balance, source.alertThreshold);
                const isSelected = selectedSources.includes(source.id);
                
                return (
                  <div key={source.id} className={`border rounded-lg p-5 transition-all duration-200 ${
                    isSelected
                      ? isDarkMode
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-blue-500 bg-blue-50'
                      : isDarkMode
                        ? 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                        : 'border-gray-200 hover:shadow-lg hover:border-blue-300'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {showBulkActions && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectSource(source.id)}
                            className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        )}
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: source.color }}
                        >
                          <Icon size={24} />
                        </div>
                        <div>
                          <h3 className={`font-semibold transition-colors duration-200 ${
                            isDarkMode ? 'text-slate-200' : 'text-gray-800'
                          }`}>{source.name}</h3>
                          <p className={`text-sm transition-colors duration-200 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-600'
                          }`}>{typeInfo.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => editSource(source)}
                          className={`p-1.5 rounded-md transition-colors ${
                            isDarkMode
                              ? 'text-blue-400 hover:bg-blue-900/30'
                              : 'text-blue-600 hover:bg-blue-100'
                          }`}
                          title="Edit source"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteSource(source.id)}
                          className={`p-1.5 rounded-md transition-colors ${
                            isDarkMode
                              ? 'text-red-400 hover:bg-red-900/30'
                              : 'text-red-600 hover:bg-red-100'
                          }`}
                          title="Delete source"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Balance Display */}
                    <div className="mb-4">
                      <p className={`text-sm font-medium transition-colors duration-200 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-600'
                      }`}>Current Balance</p>
                      <p className={`text-2xl font-bold ${balanceStatus.color}`}>
                        {formatIndianCurrency(balance)}
                      </p>
                      {!source.isActive && (
                        <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-red-900/30 text-red-400' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className={`text-xs transition-colors duration-200 ${
                          isDarkMode ? 'text-slate-500' : 'text-gray-500'
                        }`}>Transactions</p>
                        <p className={`font-semibold transition-colors duration-200 ${
                          isDarkMode ? 'text-slate-300' : 'text-gray-700'
                        }`}>{stats.totalTransactions}</p>
                      </div>
                      <div>
                        <p className={`text-xs transition-colors duration-200 ${
                          isDarkMode ? 'text-slate-500' : 'text-gray-500'
                        }`}>Monthly Spent</p>
                        <p className={`font-semibold transition-colors duration-200 ${
                          isDarkMode ? 'text-slate-300' : 'text-gray-700'
                        }`}>{formatIndianCurrency(stats.monthlySpent)}</p>
                      </div>
                    </div>
                    
                    {/* Low Balance Warning */}
                    {balance < source.alertThreshold && source.isActive && (
                      <div className={`p-3 rounded-lg border transition-colors duration-200 ${
                        isDarkMode 
                          ? 'bg-orange-900/30 border-orange-800/50' 
                          : 'bg-orange-50 border-orange-200'
                      }`}>
                        <div className={`flex items-center gap-2 transition-colors duration-200 ${
                          isDarkMode ? 'text-orange-400' : 'text-orange-700'
                        }`}>
                          <Bell size={14} />
                          <span className="text-xs font-medium">
                            Low balance warning
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {source.description && (
                      <p className={`text-sm mt-3 transition-colors duration-200 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-600'
                      }`}>{source.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {processedSources.map(source => {
                const typeInfo = getSourceTypeInfo(source.type);
                const Icon = typeInfo.icon;
                const balance = sourceBalances[source.id] || 0;
                const stats = getSourceStats(source.id);
                const balanceStatus = getBalanceStatus(balance, source.alertThreshold);
                const isSelected = selectedSources.includes(source.id);
                
                return (
                  <div key={source.id} className={`border rounded-lg p-4 transition-all duration-200 ${
                    isSelected
                      ? isDarkMode
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-blue-500 bg-blue-50'
                      : isDarkMode
                        ? 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                        : 'border-gray-200 hover:shadow-lg hover:border-blue-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {showBulkActions && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectSource(source.id)}
                            className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        )}
                        
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: source.color }}
                        >
                          <Icon size={20} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className={`font-semibold transition-colors duration-200 ${
                              isDarkMode ? 'text-slate-200' : 'text-gray-800'
                            }`}>{source.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full transition-colors duration-200 ${
                              isDarkMode 
                                ? 'bg-slate-700 text-slate-300' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {typeInfo.name}
                            </span>
                            {!source.isActive && (
                              <span className={`text-xs px-2 py-1 rounded-full transition-colors duration-200 ${
                                isDarkMode 
                                  ? 'bg-red-900/30 text-red-400' 
                                  : 'bg-red-100 text-red-600'
                              }`}>
                                Inactive
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div>
                              <p className={`transition-colors duration-200 ${
                                isDarkMode ? 'text-slate-500' : 'text-gray-500'
                              }`}>Current Balance</p>
                              <p className={`font-semibold ${balanceStatus.color}`}>
                                {formatIndianCurrency(balance)}
                              </p>
                            </div>
                            <div>
                              <p className={`transition-colors duration-200 ${
                                isDarkMode ? 'text-slate-500' : 'text-gray-500'
                              }`}>Initial Balance</p>
                              <p className={`font-medium transition-colors duration-200 ${
                                isDarkMode ? 'text-slate-300' : 'text-gray-700'
                              }`}>
                                {formatIndianCurrency(source.initialBalance)}
                              </p>
                            </div>
                            <div>
                              <p className={`transition-colors duration-200 ${
                                isDarkMode ? 'text-slate-500' : 'text-gray-500'
                              }`}>Transactions</p>
                              <p className={`font-medium transition-colors duration-200 ${
                                isDarkMode ? 'text-slate-300' : 'text-gray-700'
                              }`}>{stats.totalTransactions}</p>
                            </div>
                            <div>
                              <p className={`transition-colors duration-200 ${
                                isDarkMode ? 'text-slate-500' : 'text-gray-500'
                              }`}>Monthly Spent</p>
                              <p className={`font-medium transition-colors duration-200 ${
                                isDarkMode ? 'text-slate-300' : 'text-gray-700'
                              }`}>
                                {formatIndianCurrency(stats.monthlySpent)}
                              </p>
                            </div>
                            <div>
                              <p className={`transition-colors duration-200 ${
                                isDarkMode ? 'text-slate-500' : 'text-gray-500'
                              }`}>Alert Threshold</p>
                              <p className={`font-medium transition-colors duration-200 ${
                                isDarkMode ? 'text-slate-300' : 'text-gray-700'
                              }`}>
                                {formatIndianCurrency(source.alertThreshold)}
                              </p>
                            </div>
                          </div>
                          
                          {source.description && (
                            <p className={`text-sm mt-2 transition-colors duration-200 ${
                              isDarkMode ? 'text-slate-400' : 'text-gray-600'
                            }`}>{source.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => editSource(source)}
                          className={`p-2 rounded-md transition-colors ${
                            isDarkMode
                              ? 'text-blue-400 hover:bg-blue-900/30'
                              : 'text-blue-600 hover:bg-blue-100'
                          }`}
                          title="Edit source"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteSource(source.id)}
                          className={`p-2 rounded-md transition-colors ${
                            isDarkMode
                              ? 'text-red-400 hover:bg-red-900/30'
                              : 'text-red-600 hover:bg-red-100'
                          }`}
                          title="Delete source"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Low Balance Warning */}
                    {balance < source.alertThreshold && source.isActive && (
                      <div className={`mt-3 p-3 rounded-lg border transition-colors duration-200 ${
                        isDarkMode 
                          ? 'bg-orange-900/30 border-orange-800/50' 
                          : 'bg-orange-50 border-orange-200'
                      }`}>
                        <div className={`flex items-center gap-2 transition-colors duration-200 ${
                          isDarkMode ? 'text-orange-400' : 'text-orange-700'
                        }`}>
                          <AlertCircle size={16} />
                          <span className="text-sm font-medium">
                            Low balance warning: Below ₹{source.alertThreshold} threshold
                          </span>
                        </div>
                      </div>
                    )}
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

export default SourcesManager;
