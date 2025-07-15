import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useExpenseContext } from '../context/ExpenseContext';
import { useNavigate } from 'react-router-dom';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, Legend } from 'recharts';
import { 
  Wallet, TrendingUp, TrendingDown, Target, AlertTriangle, Calendar,
  Utensils, Car, ShoppingCart, Gamepad2, Home, Plane, Book, Phone,
  Coffee, Users, MapPin, Heart, Zap, Award, Clock, ArrowUp, ArrowDown,
  CheckCircle, XCircle, Activity, Smartphone, Building2, CreditCard
} from 'lucide-react';

const Dashboard = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [budgetGoal, setBudgetGoal] = useState(5000);
  
  const { 
    expenses,
    sources,
    sourceBalances,
    categories,
    getFilteredExpenses,
    formatIndianCurrency,
    getSourceById,
    getSourceTypeInfo
  } = useExpenseContext();

  // ENHANCED: Stats calculation with payment source breakdown
  const youthFinanceStats = useMemo(() => {
    const filteredExpenses = getFilteredExpenses();
    const totalBalance = Object.values(sourceBalances).reduce((sum, balance) => sum + balance, 0);
    
    // Current month data - FIXED DATE CALCULATION
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDate = now.getDate();
    
    const thisMonthExpenses = filteredExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const expenseMonth = expenseDate.getMonth();
      const expenseYear = expenseDate.getFullYear();
      
      return expenseMonth === currentMonth && expenseYear === currentYear;
    });
    
    const thisMonthTotal = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Last month data for comparison
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const lastMonthExpenses = filteredExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === lastMonth && expenseDate.getFullYear() === lastMonthYear;
    });
    
    const lastMonthTotal = lastMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const monthlyChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
    
    // Budget analysis
    const budgetRemaining = budgetGoal - thisMonthTotal;
    const budgetUsedPercentage = (thisMonthTotal / budgetGoal) * 100;
    
    // Category configuration
    const youthCategories = {
      'Food & Drink': { icon: Utensils, color: '#F59E0B', emoji: '🍽️' },
      'Transportation': { icon: Car, color: '#3B82F6', emoji: '🚗' },
      'Shopping': { icon: ShoppingCart, color: '#EF4444', emoji: '🛍️' },
      'Entertainment': { icon: Gamepad2, color: '#8B5CF6', emoji: '🎮' },
      'Education': { icon: Book, color: '#10B981', emoji: '📚' },
      'Coffee & Snacks': { icon: Coffee, color: '#F97316', emoji: '☕' },
      'Friends & Social': { icon: Users, color: '#EC4899', emoji: '👥' },
      'Mobile & Internet': { icon: Phone, color: '#06B6D4', emoji: '📱' },
      'Health & Fitness': { icon: Heart, color: '#EF4444', emoji: '❤️' },
      'Healthcare': { icon: Heart, color: '#EF4444', emoji: '🏥' },
      'Utilities': { icon: Zap, color: '#10B981', emoji: '⚡' },
      'Travel': { icon: Plane, color: '#8B5CF6', emoji: '✈️' },
      'Business': { icon: Building2, color: '#F59E0B', emoji: '💼' },
      'Other': { icon: Zap, color: '#6B7280', emoji: '⚡' }
    };
    
    // Category spending analysis
    const categorySpending = thisMonthExpenses.reduce((acc, expense) => {
      const category = expense.category;
      if (!acc[category]) {
        acc[category] = {
          amount: 0,
          count: 0,
          icon: youthCategories[category]?.icon || Zap,
          color: youthCategories[category]?.color || '#6B7280',
          emoji: youthCategories[category]?.emoji || '💰'
        };
      }
      acc[category].amount += expense.amount;
      acc[category].count += 1;
      return acc;
    }, {});
    
    const topCategories = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b.amount - a.amount)
      .slice(0, 5);
    
    // ENHANCED: Current month weekly calculation with payment source breakdown
    const weeklyData = [];
    
    // Get first day of current month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    // Calculate weeks within the current month
    let weekNumber = 1;
    let currentWeekStart = new Date(firstDayOfMonth);
    
    while (currentWeekStart <= lastDayOfMonth) {
      let currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
      
      // Don't go beyond the current month
      if (currentWeekEnd > lastDayOfMonth) {
        currentWeekEnd = new Date(lastDayOfMonth);
      }
      
      // Don't go beyond today's date
      if (currentWeekEnd > now) {
        currentWeekEnd = new Date(now);
      }
      
      // Filter expenses for this week
      const weekExpenses = thisMonthExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= currentWeekStart && expenseDate <= currentWeekEnd;
      });
      
      // NEW: Group expenses by payment source for this week
      const weekBySource = {};
      let weekTotal = 0;
      
      // Initialize all sources with 0
      sources.forEach(source => {
        weekBySource[source.id] = 0;
      });
      
      // Add actual expenses by source
      weekExpenses.forEach(expense => {
        if (weekBySource.hasOwnProperty(expense.sourceId)) {
          weekBySource[expense.sourceId] += expense.amount;
        }
        weekTotal += expense.amount;
      });
      
      // Format week label
      const weekLabel = weekNumber === 1 && currentWeekStart.getDate() > 1 
        ? `Week 1` 
        : `Week ${weekNumber}`;
      
      weeklyData.push({
        week: weekLabel,
        total: weekTotal,
        transactions: weekExpenses.length,
        startDate: currentWeekStart.toISOString().split('T')[0],
        endDate: currentWeekEnd.toISOString().split('T')[0],
        ...weekBySource // Spread the source amounts
      });
      
      // Move to next week
      currentWeekStart = new Date(currentWeekEnd);
      currentWeekStart.setDate(currentWeekEnd.getDate() + 1);
      weekNumber++;
      
      // Safety check - don't create more than 6 weeks
      if (weekNumber > 6) break;
    }
    
    // Financial health score calculation
    const healthScore = Math.min(100, Math.max(0, 
      (100 - budgetUsedPercentage) * 0.4 + 
      (totalBalance / 10000 * 100) * 0.3 + 
      (thisMonthExpenses.length > 0 ? 50 : 0) * 0.3
    ));
    
    // Enhanced insights
    const insights = [];
    if (budgetUsedPercentage > 80) {
      insights.push({ 
        type: 'warning', 
        message: `⚠️ You've used ${Math.round(budgetUsedPercentage)}% of your monthly budget!`, 
        action: 'Review expenses' 
      });
    }
    if (thisMonthTotal > lastMonthTotal * 1.2) {
      insights.push({ 
        type: 'alert', 
        message: `📈 Spending increased by ${Math.round(monthlyChange)}% vs last month`, 
        action: 'Check categories' 
      });
    }
    if (topCategories.length > 0 && topCategories[0][1].amount > budgetGoal * 0.3) {
      insights.push({ 
        type: 'info', 
        message: `💡 ${topCategories[0][0]} is your top expense category (${formatIndianCurrency(topCategories[0][1].amount)})`, 
        action: 'Set category limit' 
      });
    }
    
    // Daily spending rate
    const averageDaily = currentDate > 0 ? thisMonthTotal / currentDate : 0;
    const daysInMonth = lastDayOfMonth.getDate();
    const projectedMonthly = averageDaily * daysInMonth;
    const daysRemaining = daysInMonth - currentDate;
    
    return {
      totalBalance,
      thisMonthTotal,
      lastMonthTotal,
      monthlyChange,
      budgetRemaining,
      budgetUsedPercentage,
      categorySpending,
      topCategories,
      weeklyData,
      healthScore,
      insights,
      averageDaily,
      projectedMonthly,
      daysRemaining,
      currentDate,
      daysInMonth
    };
  }, [expenses, sourceBalances, budgetGoal, getFilteredExpenses, sources]);

  // CUSTOM: Payment Source Tooltip Component
  const PaymentSourceTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + entry.value, 0);
      
      return (
        <div className={`p-4 border rounded-xl shadow-lg transition-all duration-200 ${
          isDarkMode 
            ? 'bg-slate-800 border-slate-600' 
            : 'bg-white border-gray-200'
        }`}>
          <p className={`font-semibold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
            {label}
          </p>
          <p className={`text-sm mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
            Total: {formatIndianCurrency(total)}
          </p>
          <div className="space-y-1">
            {payload
              .filter(entry => entry.value > 0)
              .sort((a, b) => b.value - a.value)
              .map((entry, index) => {
                const source = getSourceById(entry.dataKey);
                const sourceInfo = source ? getSourceTypeInfo(source.type) : null;
                const Icon = sourceInfo?.icon;
                
                return (
                  <div key={index} className="flex items-center gap-2">
                    {source && (
                      <div 
                        className="w-3 h-3 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: entry.color }}
                      >
                        {Icon && <Icon size={8} className="text-white" />}
                      </div>
                    )}
                    <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                      {source?.name || 'Unknown'}: {formatIndianCurrency(entry.value)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* Enhanced Header */}
        <div className={`rounded-xl shadow-sm border transition-colors duration-200 ${
          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
        }`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">₹</span>
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Your Money Dashboard
                  </h1>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Smart budgeting for the new generation • June 2025
                  </p>
                </div>
              </div>
              
              {/* Financial Health Score */}
              <div className={`text-center p-4 rounded-xl ${
                youthFinanceStats.healthScore > 70 
                  ? isDarkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'
                  : youthFinanceStats.healthScore > 40
                    ? isDarkMode ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
                    : isDarkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'
              } border`}>
                <div className={`text-2xl font-bold ${
                  youthFinanceStats.healthScore > 70 
                    ? isDarkMode ? 'text-green-400' : 'text-green-600'
                    : youthFinanceStats.healthScore > 40
                      ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                      : isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  {Math.round(youthFinanceStats.healthScore)}
                </div>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Financial Health
                </p>
              </div>
            </div>

            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <YouthStatCard
                title="Total Balance"
                value={formatIndianCurrency(youthFinanceStats.totalBalance)}
                icon={Wallet}
                color="blue"
                subtitle={`${sources.length} accounts`}
                isDarkMode={isDarkMode}
              />
              <YouthStatCard
                title="This Month"
                value={formatIndianCurrency(youthFinanceStats.thisMonthTotal)}
                icon={Calendar}
                color="purple"
                change={youthFinanceStats.monthlyChange}
                subtitle="vs last month"
                isDarkMode={isDarkMode}
              />
              <YouthStatCard
                title="Budget Left"
                value={formatIndianCurrency(youthFinanceStats.budgetRemaining)}
                icon={Target}
                color={youthFinanceStats.budgetRemaining > 0 ? "green" : "red"}
                subtitle={`${Math.round(youthFinanceStats.budgetUsedPercentage)}% used`}
                isDarkMode={isDarkMode}
              />
              <YouthStatCard
                title="Daily Average"
                value={formatIndianCurrency(youthFinanceStats.averageDaily)}
                icon={Activity}
                color="orange"
                subtitle={`${youthFinanceStats.daysRemaining} days left`}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        </div>

        {/* Budget Progress & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ENHANCED: Budget Progress with Payment Source Stacked Bar Chart */}
          <div className={`lg:col-span-2 rounded-xl shadow-sm border transition-colors duration-200 ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Monthly Budget Progress
                </h3>
                <input
                  type="number"
                  value={budgetGoal}
                  onChange={(e) => setBudgetGoal(Number(e.target.value))}
                  className={`w-24 px-2 py-1 text-sm rounded border ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Goal"
                />
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className={`w-full h-4 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                  <div 
                    className={`h-4 rounded-full transition-all duration-500 ${
                      youthFinanceStats.budgetUsedPercentage > 80 
                        ? 'bg-red-500' 
                        : youthFinanceStats.budgetUsedPercentage > 60 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, youthFinanceStats.budgetUsedPercentage)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2">
                  <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Spent: {formatIndianCurrency(youthFinanceStats.thisMonthTotal)}
                  </span>
                  <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Goal: {formatIndianCurrency(budgetGoal)}
                  </span>
                </div>
              </div>

              {/* ENHANCED: Payment Source Stacked Bar Chart */}
              <div className="mt-6">
                <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Weekly Spending by Payment Source
                </h4>
                
                {/* Payment Source Legend */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {sources.map(source => {
                    const typeInfo = getSourceTypeInfo(source.type);
                    const Icon = typeInfo.icon;
                    return (
                      <div key={source.id} className="flex items-center gap-1.5">
                        <div 
                          className="w-3 h-3 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: source.color }}
                        >
                          <Icon size={8} className="text-white" />
                        </div>
                        <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                          {source.name}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={youthFinanceStats.weeklyData}>
                    <XAxis 
                      dataKey="week" 
                      stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                      fontSize={12}
                    />
                    <YAxis 
                      stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                      fontSize={12}
                      tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<PaymentSourceTooltip />} />
                    
                    {/* Render a Bar for each payment source */}
                    {sources.map(source => (
                      <Bar 
                        key={source.id}
                        dataKey={source.id}
                        stackId="a"
                        fill={source.color}
                        radius={sources.indexOf(source) === sources.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Monthly Projection */}
                <div className={`mt-4 p-3 rounded-lg ${
                  isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Projected Monthly Total:
                    </span>
                    <span className={`font-semibold ${
                      youthFinanceStats.projectedMonthly > budgetGoal 
                        ? isDarkMode ? 'text-red-400' : 'text-red-600'
                        : isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {formatIndianCurrency(youthFinanceStats.projectedMonthly)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      Based on current daily average
                    </span>
                    <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      {youthFinanceStats.daysRemaining} days remaining
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Insights */}
          <div className={`rounded-xl shadow-sm border transition-colors duration-200 ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
          }`}>
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Smart Insights
              </h3>
              <div className="space-y-3">
                {youthFinanceStats.insights.map((insight, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    insight.type === 'warning' 
                      ? isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
                      : insight.type === 'alert'
                        ? isDarkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
                        : isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {insight.message}
                    </p>
                    <button 
                      onClick={() => navigate('/expenses/list')}
                      className={`text-xs mt-1 px-2 py-1 rounded transition-colors ${
                        isDarkMode 
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {insight.action}
                    </button>
                  </div>
                ))}
                
                {/* Pro Tips */}
                <div className={`p-3 rounded-lg border ${
                  isDarkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'
                }`}>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                    💡 Pro Tip: You're spending ₹{Math.round(youthFinanceStats.averageDaily)} per day on average
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Categories & Payment Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top Spending Categories */}
          <div className={`rounded-xl shadow-sm border transition-colors duration-200 ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
          }`}>
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Top Spending Categories
              </h3>
              <div className="space-y-3">
                {youthFinanceStats.topCategories.length > 0 ? (
                  youthFinanceStats.topCategories.map(([category, data], index) => {
                    const percentage = youthFinanceStats.thisMonthTotal > 0 
                      ? ((data.amount / youthFinanceStats.thisMonthTotal) * 100).toFixed(1) 
                      : 0;
                    
                    return (
                      <div key={category} className={`flex items-center justify-between p-3 rounded-lg ${
                        isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                            style={{ backgroundColor: data.color }}
                          >
                            {data.emoji}
                          </div>
                          <div>
                            <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {category}
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                              {data.count} transactions • {percentage}%
                            </p>
                          </div>
                        </div>
                        <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatIndianCurrency(data.amount)}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className={`text-center py-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    <p>No expenses recorded this month</p>
                    <p className="text-sm mt-1">Start adding expenses to see insights</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Sources */}
          <div className={`rounded-xl shadow-sm border transition-colors duration-200 ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Your Accounts
                </h3>
                <button
  onClick={() => navigate('/expenses/sources')}
  className={`text-sm px-3 py-1 rounded-lg transition-colors font-medium ${
    isDarkMode
      ? 'bg-blue-900/50 text-blue-400 hover:bg-blue-900/70'
      : 'bg-blue-600 text-white hover:bg-blue-700'
  }`}
>
  Manage
</button>

              </div>
              <div className="space-y-3">
                {sources.slice(0, 4).map((source) => {
                  const typeInfo = getSourceTypeInfo(source.type);
                  const Icon = typeInfo.icon;
                  const balance = sourceBalances[source.id] || 0;
                  
                  return (
                    <div key={source.id} className={`flex items-center justify-between p-3 rounded-lg ${
                      isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: source.color }}
                        >
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {source.name}
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            {typeInfo.name}
                          </p>
                        </div>
                      </div>
                      <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatIndianCurrency(balance)}
                      </p>
                    </div>
                  );
                })}
              </div>
              
              {/* Quick Add Expense Button */}
              <button
                onClick={() => navigate('/expenses/add')}
                className={`w-full mt-4 p-3 rounded-lg border-2 border-dashed transition-colors ${
                  isDarkMode 
                    ? 'border-slate-600 text-slate-400 hover:border-blue-500 hover:text-blue-400' 
                    : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">💰</span>
                  <span className="font-medium">Quick Add Expense</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Stat Card
const YouthStatCard = ({ title, value, icon: Icon, color, change, subtitle, isDarkMode }) => {
  const colors = {
    blue: isDarkMode ? 'text-blue-400' : 'text-blue-600',
    red: isDarkMode ? 'text-red-400' : 'text-red-600',
    green: isDarkMode ? 'text-green-400' : 'text-green-600',
    purple: isDarkMode ? 'text-purple-400' : 'text-purple-600',
    orange: isDarkMode ? 'text-orange-400' : 'text-orange-600'
  };

  const bgColors = {
    blue: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50',
    red: isDarkMode ? 'bg-red-900/30' : 'bg-red-50',
    green: isDarkMode ? 'bg-green-900/30' : 'bg-green-50',
    purple: isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50',
    orange: isDarkMode ? 'bg-orange-900/30' : 'bg-orange-50'
  };

  return (
    <div className={`p-4 rounded-lg border transition-all duration-200 hover:scale-105 ${
      isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${bgColors[color]} ${colors[color]}`}>
          <Icon size={20} />
        </div>
        {change !== undefined && (
          <div className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
            change > 0 
              ? isDarkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600'
              : isDarkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-600'
          }`}>
            {change > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <div>
        <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          {title}
        </p>
        <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {value}
        </p>
        {subtitle && (
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
