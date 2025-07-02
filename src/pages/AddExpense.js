import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Plus, Loader2, Check, AlertCircle, Brain, ChevronDown } from 'lucide-react';
import { useExpenseContext } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';

const AddExpense = () => {
  const { 
    // State
    currentExpense,
    sources,
    sourceBalances,
    categories,
    isEditing,
    editingId,
    isProcessingOCR,
    ocrSuccess,
    ocrError,
    ocrProgress,
    selectedImage,
    isProcessingAI,
    aiError,
    aiSuccess,
    imageQualityWarning,
    apiCallCount,
    extractedText,
    aiCategorizedData,
    fileInputRef,
    cameraInputRef,
    
    // State setters
    setCurrentExpense,
    
    // Functions
    handleSubmit,
    resetForm,
    handleImageUpload,
    handleFileSelect,
    formatIndianCurrency,
    getSourceById,
    getSourceTypeInfo,
    getBalanceStatus
  } = useExpenseContext();
  
  const { isDarkMode } = useTheme();

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

  return (
    <div className="space-y-6">
      {/* Enhanced Add Expense Form */}
      <section className={`border rounded-2xl shadow-sm transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-6 sm:p-8">
          <h2 className={`text-2xl font-bold mb-6 transition-colors duration-200 ${
            isDarkMode ? 'text-slate-100' : 'text-gray-900'
          }`}>
            {isEditing ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          
          {/* OCR & AI Processing Sub-Section */}
          <div className={`border rounded-xl p-5 mb-6 transition-colors duration-200 ${
            isDarkMode 
              ? 'bg-slate-700/50 border-slate-600' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className={`font-bold text-lg mb-4 flex items-center gap-3 transition-colors duration-200 ${
              isDarkMode ? 'text-slate-200' : 'text-gray-800'
            }`}>
              <Camera size={22} className="text-blue-600"/>
              Enhanced Receipt Processing
            </h3>
            
            {/* Rate Limit Warning */}
            {apiCallCount > 10 && (
              <div className={`mb-4 p-3 border rounded-lg transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-orange-900/30 border-orange-800/50' 
                  : 'bg-orange-100 border-orange-300'
              }`}>
                <div className={`flex items-center gap-3 text-sm transition-colors duration-200 ${
                  isDarkMode ? 'text-orange-300' : 'text-orange-700'
                }`}>
                  <AlertCircle size={20} />
                  <span>Approaching API rate limit ({apiCallCount}/15 calls this minute). Basic parsing will be used if limit is reached.</span>
                </div>
              </div>
            )}

            {/* File Input Buttons */}
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingOCR || isProcessingAI}
                className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70'
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                <Upload size={18} />
                Choose File
              </button>
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessingOCR || isProcessingAI}
                className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'bg-green-900/50 text-green-300 hover:bg-green-900/70'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                <Camera size={18} />
                Take Photo
              </button>
            </div>

            {/* Hidden Inputs */}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />

            {/* Status & Error Messages */}
            <div className="space-y-3">
              {imageQualityWarning && (
                <div className={`flex items-center gap-2 font-medium text-sm transition-colors duration-200 ${
                  isDarkMode ? 'text-orange-400' : 'text-orange-600'
                }`}>
                  <AlertCircle size={16} />
                  {imageQualityWarning}
                </div>
              )}
              {isProcessingOCR && (
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 font-medium transition-colors duration-200 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    <Loader2 size={16} className="animate-spin" />
                    Processing with enhanced OCR... {ocrProgress > 0 && `${ocrProgress}%`}
                  </div>
                  {ocrProgress > 0 && (
                    <div className={`w-full rounded-full h-2.5 ${
                      isDarkMode ? 'bg-slate-600' : 'bg-gray-200'
                    }`}>
                      <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${ocrProgress}%` }}></div>
                    </div>
                  )}
                </div>
              )}
              {isProcessingAI && (
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 font-medium transition-colors duration-200 ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`}>
                    <Brain size={16} className="animate-pulse" />
                    Perplexity AI analyzing with real-time verification...
                  </div>
                  <div className={`w-full rounded-full h-2.5 ${
                    isDarkMode ? 'bg-slate-600' : 'bg-gray-200'
                  }`}>
                    <div className="bg-purple-600 h-2.5 rounded-full animate-pulse"></div>
                  </div>
                </div>
              )}
              {ocrSuccess && (
                <div className={`flex items-center gap-2 font-medium text-sm transition-colors duration-200 ${
                  isDarkMode ? 'text-green-400' : 'text-green-600'
                }`}>
                  <Check size={16} />
                  Receipt processed successfully! Form auto-filled with extracted data.
                </div>
              )}
              {aiSuccess && (
                <div className={`flex items-center gap-2 font-medium text-sm transition-colors duration-200 ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>
                  <Brain size={16} />
                  Perplexity AI enhancement completed! Data verified and categorized.
                </div>
              )}
              {ocrError && (
                <div className={`flex items-center gap-2 font-medium text-sm transition-colors duration-200 ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  <AlertCircle size={16} />
                  {ocrError}
                </div>
              )}
              {aiError && (
                <div className={`flex items-center gap-2 font-medium text-sm transition-colors duration-200 ${
                  isDarkMode ? 'text-orange-400' : 'text-orange-600'
                }`}>
                  <AlertCircle size={16} />
                  {aiError}
                </div>
              )}
            </div>
            
            {/* Image Preview */}
            {selectedImage && (
              <div className="mt-4">
                <h4 className={`text-sm font-semibold mb-2 transition-colors duration-200 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>Receipt Preview:</h4>
                <img 
                  src={selectedImage} 
                  alt="Receipt preview" 
                  className={`max-w-full sm:max-w-sm max-h-56 object-contain rounded-lg border p-1 transition-colors duration-200 ${
                    isDarkMode ? 'border-slate-600' : 'border-gray-300'
                  }`}
                />
              </div>
            )}

            {/* AI Analysis Results */}
            {aiCategorizedData && (
              <div className={`mt-4 p-4 border rounded-lg transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-purple-900/30 border-purple-800/50' 
                  : 'bg-purple-50 border-purple-200'
              }`}>
                <h4 className={`font-semibold mb-2 flex items-center gap-2 transition-colors duration-200 ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-800'
                }`}>
                  <Brain size={16} />
                  AI Analysis Results (Confidence: {aiCategorizedData.confidence}%)
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className={`font-medium transition-colors duration-200 ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`}>Vendor:</span>
                    <span className={`ml-2 transition-colors duration-200 ${
                      isDarkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>{aiCategorizedData.vendor}</span>
                  </div>
                  <div>
                    <span className={`font-medium transition-colors duration-200 ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`}>Amount:</span>
                    <span className={`ml-2 transition-colors duration-200 ${
                      isDarkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>{formatIndianCurrency(aiCategorizedData.amount)}</span>
                  </div>
                  <div>
                    <span className={`font-medium transition-colors duration-200 ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`}>Category:</span>
                    <span className={`ml-2 transition-colors duration-200 ${
                      isDarkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>{aiCategorizedData.category}</span>
                  </div>
                  <div>
                    <span className={`font-medium transition-colors duration-200 ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`}>Parsed by:</span>
                    <span className={`ml-2 transition-colors duration-200 ${
                      isDarkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>{aiCategorizedData.parsedBy}</span>
                  </div>
                </div>
                {aiCategorizedData.reasoning && (
                  <div className="mt-2">
                    <span className={`font-medium text-sm transition-colors duration-200 ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`}>Reasoning:</span>
                    <p className={`text-xs mt-1 transition-colors duration-200 ${
                      isDarkMode ? 'text-slate-400' : 'text-gray-600'
                    }`}>{aiCategorizedData.reasoning}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Enhanced Manual Entry Form Fields with Source Selection */}
          <div className="space-y-5">
            {/* Payment Source Selection - Prominent Placement */}
            <div className={`border rounded-lg p-4 transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-blue-900/30 border-blue-800/50' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <label htmlFor="source" className={`block text-sm font-medium mb-3 transition-colors duration-200 ${
                isDarkMode ? 'text-blue-300' : 'text-blue-800'
              }`}>
                Payment Source * (Select where this expense was paid from)
              </label>
              <select
                id="source"
                value={currentExpense.sourceId}
                onChange={(e) => setCurrentExpense({...currentExpense, sourceId: e.target.value})}
                className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-slate-200' 
                    : 'bg-white border-blue-300'
                }`}
                required
              >
                <option value="">Select payment source</option>
                {sources.filter(source => source.isActive).map(source => {
                  const typeInfo = getSourceTypeInfo(source.type);
                  const Icon = typeInfo.icon;
                  const balance = sourceBalances[source.id] || 0;
                  const balanceStatus = getBalanceStatus(balance, source.alertThreshold);
                  
                  return (
                    <option key={source.id} value={source.id}>
                      {source.name} - {formatIndianCurrency(balance)} 
                      {balance < source.alertThreshold ? ' (Low Balance!)' : ''}
                    </option>
                  );
                })}
              </select>
              
              {/* Source Balance Preview */}
              {currentExpense.sourceId && (
                <div className={`mt-3 p-3 rounded-lg border transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600' 
                    : 'bg-white border-gray-200'
                }`}>
                  {(() => {
                    const selectedSource = getSourceById(currentExpense.sourceId);
                    const balance = sourceBalances[currentExpense.sourceId] || 0;
                    const balanceStatus = getBalanceStatus(balance, selectedSource?.alertThreshold || 0);
                    const newBalance = balance - (parseFloat(currentExpense.amount) || 0);
                    
                    return (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium transition-colors duration-200 ${
                            isDarkMode ? 'text-slate-300' : 'text-gray-700'
                          }`}>Current Balance:</p>
                          <p className={`text-lg font-bold ${balanceStatus.color}`}>
                            {formatIndianCurrency(balance)}
                          </p>
                        </div>
                        {currentExpense.amount && (
                          <div className="text-right">
                            <p className={`text-sm font-medium transition-colors duration-200 ${
                              isDarkMode ? 'text-slate-300' : 'text-gray-700'
                            }`}>After Transaction:</p>
                            <p className={`text-lg font-bold ${newBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatIndianCurrency(newBalance)}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Low Balance Warnings */}
              {currentExpense.sourceId && (() => {
                const selectedSource = getSourceById(currentExpense.sourceId);
                const balance = sourceBalances[currentExpense.sourceId] || 0;
                const amount = parseFloat(currentExpense.amount) || 0;
                const newBalance = balance - amount;
                
                if (amount > balance) {
                  return (
                    <div className={`mt-3 p-3 border rounded-lg transition-colors duration-200 ${
                      isDarkMode 
                        ? 'bg-red-900/30 border-red-800/50' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className={`flex items-center gap-2 transition-colors duration-200 ${
                        isDarkMode ? 'text-red-400' : 'text-red-700'
                      }`}>
                        <AlertCircle size={16} />
                        <span className="text-sm font-medium">
                          Insufficient balance! This transaction exceeds available funds by {formatIndianCurrency(amount - balance)}
                        </span>
                      </div>
                    </div>
                  );
                } else if (newBalance < selectedSource?.alertThreshold) {
                  return (
                    <div className={`mt-3 p-3 border rounded-lg transition-colors duration-200 ${
                      isDarkMode 
                        ? 'bg-orange-900/30 border-orange-800/50' 
                        : 'bg-orange-50 border-orange-200'
                    }`}>
                      <div className={`flex items-center gap-2 transition-colors duration-200 ${
                        isDarkMode ? 'text-orange-400' : 'text-orange-700'
                      }`}>
                        <AlertCircle size={16} />
                        <span className="text-sm font-medium">
                          Warning: This transaction will bring your balance below the alert threshold of {formatIndianCurrency(selectedSource.alertThreshold)}
                        </span>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label htmlFor="amount" className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>Amount *</label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={currentExpense.amount}
                  onChange={(e) => setCurrentExpense({...currentExpense, amount: e.target.value})}
                  className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-slate-200' 
                      : 'bg-white border-gray-300'
                  }`}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label htmlFor="vendor" className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>Vendor *</label>
                <input
                  id="vendor"
                  type="text"
                  value={currentExpense.vendor}
                  onChange={(e) => setCurrentExpense({...currentExpense, vendor: e.target.value})}
                  className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-slate-200' 
                      : 'bg-white border-gray-300'
                  }`}
                  placeholder="e.g., Starbucks, Amazon"
                  required
                />
              </div>
              <div>
                <label htmlFor="date" className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>Date *</label>
                <input
                  id="date"
                  type="date"
                  value={currentExpense.date}
                  onChange={(e) => setCurrentExpense({...currentExpense, date: e.target.value})}
                  className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-slate-200' 
                      : 'bg-white border-gray-300'
                  }`}
                  required
                />
              </div>
              <div>
                <label htmlFor="category" className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>Category *</label>
                <select
                  id="category"
                  value={currentExpense.category}
                  onChange={(e) => setCurrentExpense({...currentExpense, category: e.target.value})}
                  className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-slate-200' 
                      : 'bg-white border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {getCategoryIcon(category)} {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="description" className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                isDarkMode ? 'text-slate-300' : 'text-gray-700'
              }`}>Description</label>
              <input
                id="description"
                type="text"
                value={currentExpense.description}
                onChange={(e) => setCurrentExpense({...currentExpense, description: e.target.value})}
                className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-slate-200' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="Optional notes, e.g., 'Lunch with client'"
              />
            </div>
            
            {/* Action Buttons */}
            <div className={`flex items-center gap-3 pt-4 border-t mt-6 transition-colors duration-200 ${
              isDarkMode ? 'border-slate-600' : 'border-gray-200'
            }`}>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
              >
                {isEditing ? 'Update Expense' : 'Add Expense'}
              </button>
              <button
                onClick={resetForm}
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
        </div>
      </section>

      {/* Quick Category Reference */}
      {/* <section className={`border rounded-2xl shadow-sm transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-6">
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            isDarkMode ? 'text-slate-200' : 'text-gray-800'
          }`}>Quick Category Reference</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setCurrentExpense({...currentExpense, category})}
                className={`p-3 rounded-lg border text-left transition-all duration-200 hover:scale-105 ${
                  currentExpense.category === category
                    ? isDarkMode
                      ? 'bg-blue-900/50 border-blue-600 text-blue-300'
                      : 'bg-blue-50 border-blue-500 text-blue-700'
                    : isDarkMode
                      ? 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="text-2xl mb-1">{getCategoryIcon(category)}</div>
                <div className="text-sm font-medium">{category}</div>
              </button>
            ))}
          </div>
        </div>
      </section> */}

      {/* Tips Section */}
      {/* <section className={`border rounded-2xl shadow-sm transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-6">
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
            isDarkMode ? 'text-slate-200' : 'text-gray-800'
          }`}>💡 Tips for Better Receipt Processing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-blue-900/20 border-blue-800/50' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <h4 className={`font-semibold mb-2 transition-colors duration-200 ${
                isDarkMode ? 'text-blue-300' : 'text-blue-800'
              }`}>📸 Photo Quality</h4>
              <ul className={`text-sm space-y-1 transition-colors duration-200 ${
                isDarkMode ? 'text-blue-200' : 'text-blue-700'
              }`}>
                <li>• Good lighting, avoid shadows</li>
                <li>• Hold camera steady</li>
                <li>• Capture the entire receipt</li>
                <li>• Avoid reflections and glare</li>
              </ul>
            </div>
            <div className={`p-4 rounded-lg border transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-green-900/20 border-green-800/50' 
                : 'bg-green-50 border-green-200'
            }`}>
              <h4 className={`font-semibold mb-2 transition-colors duration-200 ${
                isDarkMode ? 'text-green-300' : 'text-green-800'
              }`}>🤖 AI Processing</h4>
              <ul className={`text-sm space-y-1 transition-colors duration-200 ${
                isDarkMode ? 'text-green-200' : 'text-green-700'
              }`}>
                <li>• AI analyzes vendor & amount</li>
                <li>• Smart categorization</li>
                <li>• Real-time business verification</li>
                <li>• Review before submitting</li>
              </ul>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default AddExpense;
