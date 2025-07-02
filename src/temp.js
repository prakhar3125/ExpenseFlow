import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Camera, Upload, Plus, Edit2, Trash2, Eye, DollarSign, Calendar, Building, Tag, Loader2, Check, AlertCircle, Brain, CreditCard, Wallet, Building2, Smartphone, PiggyBank, Settings, TrendingUp, TrendingDown, BarChart3, PieChart, Filter, Search, Bell, MoreVertical, Menu, X, Home, Activity, User, Grid3X3, ChevronRight, Minus } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { useTheme } from '../context/ThemeContext';

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([]);
  const [sources, setSources] = useState([]);
  const [selectedSources, setSelectedSources] = useState(['all']);
  const [showSourceManager, setShowSourceManager] = useState(false);
  const [activeSourceView, setActiveSourceView] = useState('all');
  const [sourceBalances, setSourceBalances] = useState({});
  const [activeTab, setActiveTab] = useState('home');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { isDarkMode } = useTheme();
  
  // Existing state variables
  const [currentExpense, setCurrentExpense] = useState({
    amount: '',
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    receiptImage: null,
    sourceId: ''
  });

  const [currentSource, setCurrentSource] = useState({
    id: '',
    type: '',
    name: '',
    balance: '',
    initialBalance: '',
    isActive: true,
    alertThreshold: '',
    preferredCategories: [],
    color: '#3B82F6',
    description: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSuccess, setAiSuccess] = useState(false);
  const [imageQualityWarning, setImageQualityWarning] = useState('');
  const [lastApiCall, setLastApiCall] = useState(0);
  const [apiCallCount, setApiCallCount] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [aiCategorizedData, setAiCategorizedData] = useState(null);
  const [showCategories, setShowCategories] = useState(false);
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [isEditingSource, setIsEditingSource] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState(null);
  const [showSourceDetails, setShowSourceDetails] = useState({});

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  // Perplexity API key
  const PERPLEXITY_API_KEY = process.env.REACT_APP_PERPLEXITY_API_KEY;
  
  const categories = [
    'Food & Drink',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Healthcare',
    'Utilities',
    'Travel',
    'Education',
    'Business',
    'Other'
  ];

  // Source types and their properties
  const sourceTypes = [
    { id: 'UPI', name: 'UPI Account', icon: Smartphone, color: '#10B981', description: 'PhonePe, Google Pay, Paytm, etc.' },
    { id: 'BANK', name: 'Bank Account', icon: Building2, color: '#3B82F6', description: 'Savings, Current, Salary accounts' },
    { id: 'CASH', name: 'Cash', icon: Wallet, color: '#F59E0B', description: 'Physical cash, wallet money' },
    { id: 'CARD', name: 'Credit/Debit Card', icon: CreditCard, color: '#8B5CF6', description: 'Card payments and transactions' },
    { id: 'INVESTMENT', name: 'Investment Account', icon: TrendingUp, color: '#EF4444', description: 'Stocks, mutual funds, etc.' },
    { id: 'SAVINGS', name: 'Savings & Goals', icon: PiggyBank, color: '#06B6D4', description: 'Emergency fund, goal-based savings' }
  ];

  const sourceColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4',
    '#84CC16', '#F97316', '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'
  ];

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedExpenses = localStorage.getItem('expenses');
    const savedSources = localStorage.getItem('expenseSources');
    const savedSourceBalances = localStorage.getItem('sourceBalances');
    
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
    
    if (savedSources) {
      const loadedSources = JSON.parse(savedSources);
      setSources(loadedSources);
      
      if (loadedSources.length === 0) {
        initializeDefaultSources();
      }
    } else {
      initializeDefaultSources();
    }
    
    if (savedSourceBalances) {
      setSourceBalances(JSON.parse(savedSourceBalances));
    }
  }, []);

  // Initialize default sources
  const initializeDefaultSources = () => {
    const defaultSources = [
      {
        id: 'cash_wallet_001',
        type: 'CASH',
        name: 'Wallet Cash',
        balance: 0,
        initialBalance: 0,
        isActive: true,
        alertThreshold: 100,
        preferredCategories: ['Food & Drink', 'Transportation'],
        color: '#F59E0B',
        description: 'Daily spending cash'
      },
      {
        id: 'upi_primary_001',
        type: 'UPI',
        name: 'Primary UPI',
        balance: 0,
        initialBalance: 0,
        isActive: true,
        alertThreshold: 500,
        preferredCategories: ['Shopping', 'Food & Drink'],
        color: '#10B981',
        description: 'Main UPI account'
      }
    ];
    
    setSources(defaultSources);
    localStorage.setItem('expenseSources', JSON.stringify(defaultSources));
  };

  // Calculate source balances from transactions
  const calculateSourceBalances = () => {
    const balances = {};
    
    sources.forEach(source => {
      balances[source.id] = source.initialBalance;
    });
    
    expenses.forEach(expense => {
      if (expense.sourceId && balances[expense.sourceId] !== undefined) {
        balances[expense.sourceId] -= expense.amount;
      }
    });
    
    return balances;
  };

  // Update source balance calculations whenever expenses or sources change
  useEffect(() => {
    const newBalances = calculateSourceBalances();
    setSourceBalances(newBalances);
    localStorage.setItem('sourceBalances', JSON.stringify(newBalances));
  }, [expenses, sources]);

  // Filter expenses based on selected sources
  const getFilteredExpenses = () => {
    if (selectedSources.includes('all')) {
      return expenses;
    }
    return expenses.filter(expense => selectedSources.includes(expense.sourceId));
  };

  // Get source-specific statistics
  const getSourceStats = (sourceId) => {
    const sourceExpenses = expenses.filter(expense => expense.sourceId === sourceId);
    const totalSpent = sourceExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const thisMonth = sourceExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
    });
    const monthlySpent = thisMonth.reduce((sum, expense) => sum + expense.amount, 0);
    
    const categoryBreakdown = sourceExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});
    
    return {
      totalTransactions: sourceExpenses.length,
      totalSpent,
      monthlySpent,
      categoryBreakdown,
      recentTransactions: sourceExpenses.slice(0, 5)
    };
  };

  // Get balance status for UI styling
  const getBalanceStatus = (balance, threshold) => {
    if (balance > threshold * 2) return { status: 'high', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
    if (balance > threshold) return { status: 'medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    return { status: 'low', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
  };

  // All existing OCR and AI processing functions remain unchanged
  const preprocessImage = (canvas, file) => {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          const scaleFactor = Math.max(1, 300 / 72);
          canvas.width = img.width * scaleFactor;
          canvas.height = img.height * scaleFactor;
          
          ctx.imageSmoothingEnabled = false;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.2 + 128 + 10));
            data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.2 + 128 + 10));
            data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.2 + 128 + 10));
          }
          
          ctx.putImageData(imageData, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to process image'));
            }
          }, 'image/png', 0.95);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const validateImageQuality = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data } = imageData;
        
        let brightness = 0;
        let pixelCount = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          brightness += (r + g + b) / 3;
          pixelCount++;
        }
        
        brightness = brightness / pixelCount;
        const minResolution = 300;
        const actualResolution = Math.min(img.width, img.height);
        
        let warnings = [];
        
        if (brightness < 80) {
          warnings.push('Image appears too dark - try better lighting');
        } else if (brightness > 180) {
          warnings.push('Image appears overexposed - reduce lighting or avoid glare');
        }
        
        if (actualResolution < minResolution) {
          warnings.push('Image resolution is low - try taking a closer photo');
        }
        
        if (warnings.length > 0) {
          setImageQualityWarning(warnings.join('. '));
          setTimeout(() => setImageQualityWarning(''), 8000);
        } else {
          setImageQualityWarning('');
        }
        
        resolve(true);
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = URL.createObjectURL(file);
    });
  };

  const correctOCRErrors = (text) => {
    let correctedText = text;
    
    const corrections = {
      'Rs\\s': 'Rs ',
      'R5\\s': 'Rs ',
      'R8\\s': 'Rs ',
      'FB\\s': 'Rs ',
      'Fs\\s': 'Rs ',
      'INR\\s': 'Rs ',
      '₹\\s': '₹ ',
      'S\\$': '$',
      '8\\$': '$',
      'B\\$': '$',
      '§': '$',
      '5\\$': '$',
      'O': '0',
      'o': '0',
      'I': '1',
      'l': '1',
      'Z': '2',
      'S': '5',
      'G': '6',
      'T': '7',
      'B': '8',
      'g': '9',
      ',': '.',
      ';': '.',
      ':': '.',
      'TOTAI': 'TOTAL',
      'TOTA': 'TOTAL',
      'TOTAl': 'TOTAL',
      'TOIAI': 'TOTAL',
      'SUBTOTAI': 'SUBTOTAL',
      'SUBTOTA': 'SUBTOTAL',
      'AMOUN': 'AMOUNT',
      'AMOUN7': 'AMOUNT',
      'BAIANCE': 'BALANCE',
      'BAIANCE': 'BALANCE'
    };
    
    Object.entries(corrections).forEach(([wrong, right]) => {
      const regex = new RegExp(wrong, 'gi');
      correctedText = correctedText.replace(regex, right);
    });
    
    return correctedText;
  };

  const formatIndianCurrency = (amount) => {
    if (isNaN(amount) || amount === 0) return '₹0.00';
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const extractAmountBasic = (text) => {
    const correctedText = correctOCRErrors(text);
    const lines = correctedText.split('\n');
    
    const amountPatterns = [
      /(?:TOTAL|AMOUNT|BALANCE|GRAND\s*TOTAL|SUBTOTAL|AMOUNT\s*DUE|PAYABLE)[:\s]*[Rs₹INR]*\s*(\d+[.,]\d{2})/i,
      /[Rs₹]\s*(\d+[.,]\d{2})\s*(?:TOTAL|$|AMOUNT|BALANCE)?/i,
      /(\d+[.,]\d{2})\s*[Rs₹INR]?\s*(?:TOTAL|AMOUNT|BALANCE|$)/i,
      /[FfRr][s5]\s*(\d+[.,]\d{2})/g,
      /R[s58]\s*(\d+[.,]\d{2})/g,
      /INR\s*(\d+[.,]\d{2})/g,
      /(?:TOTAL|AMOUNT|BALANCE|GRAND\s*TOTAL|SUBTOTAL|AMOUNT\s*DUE|PAYABLE)[:\s]*[$£€¥₹₨₽¢₡֏₱₩₪₫₦₨﷼]*\s*(\d+[.,]\d{2})/i,
      /[$£€¥₹₨₽¢₡֏₱₩₪₫₦₨﷼]\s*(\d+[.,]\d{2})\s*(?:TOTAL|$|AMOUNT|BALANCE)?/i,
      /(\d+[.,]\d{2})\s*[$£€¥₹₨₽¢₡֏₱₩₪₫₦₨﷼]?\s*(?:TOTAL|AMOUNT|BALANCE|$)/i,
      /[S8B§5]\s*(\d+[.,]\d{2})/g,
      /(?:TOTAL|AMOUNT|BALANCE)[:\s]*(\d+[,]\d{2})/i,
      /(?:TOTAL|AMOUNT|BALANCE)[:\s]*(\d+[.]\d{2})/i,
      /\$\s*(\d+[.,]\d{2})/g,
      /(\d+[.,]\d{2})/g
    ];
    
    let amounts = [];
    const processedLines = new Set();
    
    for (const line of lines) {
      if (processedLines.has(line.trim().toLowerCase())) continue;
      processedLines.add(line.trim().toLowerCase());
      
      for (const pattern of amountPatterns) {
        if (pattern.global) {
          let match;
          while ((match = pattern.exec(line)) !== null) {
            let value = match[1].replace(/,/g, '.');
            value = parseFloat(value);
            
            if (value > 0 && value < 999999) {
              amounts.push({
                value: value,
                context: line.trim(),
                priority: getPriorityScore(line, pattern)
              });
            }
          }
          pattern.lastIndex = 0;
        } else {
          const match = line.match(pattern);
          if (match) {
            let value = match[1].replace(/,/g, '.');
            value = parseFloat(value);
            
            if (value > 0 && value < 999999) {
              amounts.push({
                value: value,
                context: line.trim(),
                priority: getPriorityScore(line, pattern)
              });
            }
          }
        }
      }
    }
    
    if (amounts.length > 0) {
      amounts.sort((a, b) => b.priority - a.priority);
      return amounts[0].value;
    }
    
    return 0;
  };

  const getPriorityScore = (line, pattern) => {
    let score = 0;
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('total')) score += 10;
    if (lowerLine.includes('amount due')) score += 9;
    if (lowerLine.includes('balance')) score += 8;
    if (lowerLine.includes('subtotal')) score += 7;
    if (lowerLine.includes('amount')) score += 6;
    
    if (lowerLine.includes('tax')) score -= 3;
    if (lowerLine.includes('tip')) score -= 3;
    if (lowerLine.includes('change')) score -= 5;
    
    return score;
  };

  const extractVendorBasic = (text) => {
    const correctedText = correctOCRErrors(text);
    const lines = correctedText.split('\n').map(line => line.trim()).filter(line => line);
    
    const vendorPatterns = [
      /(WALMART|TARGET|STARBUCKS|DOMINO'S|MCDONALD'S|SUBWAY|AMAZON|COSTCO|HOME DEPOT|SHELL|EXXON|BP|CVS|WALGREENS|KROGER|SAFEWAY)/i,
      /^([A-Z][A-Z\s&'.-]+[A-Z])$/,
      /^([A-Z][A-Za-z\s&'.-]{2,30})$/,
      /^([A-Za-z\s&'.-]+(?:LLC|INC|CORP|CO|LTD))$/i,
      /^([A-Za-z\s&'.-]+)\s*#?\d+$/
    ];
    
    for (let i = 0; i < Math.min(8, lines.length); i++) {
      const line = lines[i];
      
      if (line.match(/^\d+$|^[\d\s\-\.]+$|^(RECEIPT|INVOICE|BILL|THANK YOU)/i)) {
        continue;
      }
      
      for (const pattern of vendorPatterns) {
        const match = line.match(pattern);
        if (match && match[1] && match[1].length > 2) {
          let vendor = match[1].trim();
          
          vendor = vendor.replace(/[^\w\s&'.-]/g, '').trim();
          vendor = vendor.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');
          
          return vendor;
        }
      }
    }
    
    return '';
  };

  const extractDateBasic = (text) => {
    const correctedText = correctOCRErrors(text);
    const lines = correctedText.split('\n');
    
    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
      /(\d{1,2}\s+\w{3,9}\s+\d{4})/i,
      /(\w{3,9}\s+\d{1,2},?\s+\d{4})/i,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2})/,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s+\d{1,2}:\d{2}/,
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\s+\d{1,2}:\d{2}/
    ];
    
    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          const dateStr = match[1];
          let parsedDate;
          
          try {
            if (dateStr.includes('/') || dateStr.includes('-')) {
              const parts = dateStr.split(/[\/\-]/);
              if (parts.length === 3) {
                if (parseInt(parts[0]) > 12) {
                  if (parseInt(parts[0]) > 31) {
                    parsedDate = new Date(parts[0], parts[1] - 1, parts[2]);
                  } else {
                    parsedDate = new Date(parts[2], parts[1] - 1, parts[0]);
                  }
                } else {
                  parsedDate = new Date(parts[2], parts[0] - 1, parts[1]);
                }
              }
            } else {
              parsedDate = new Date(dateStr);
            }
            
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toISOString().split('T')[0];
            }
          } catch (error) {
            continue;
          }
        }
      }
    }
    
    return new Date().toISOString().split('T')[0];
  };

  const canMakeApiCall = () => {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    
    if (timeSinceLastCall > 60000) {
      setApiCallCount(1);
      setLastApiCall(now);
      return true;
    }
    
    if (apiCallCount < 15) {
      setApiCallCount(prev => prev + 1);
      setLastApiCall(now);
      return true;
    }
    
    return false;
  };

  const extractDataWithPerplexity = async (ocrText, retryCount = 0) => {
    if (!PERPLEXITY_API_KEY) {
      throw new Error('Perplexity API key not configured');
    }
    
    const maxRetries = 3;
    const baseDelay = 1000;
    
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [
            {
              role: "system",
              content: `You are an expert financial document analysis assistant powered by real-time search capabilities. You specialize in correcting OCR errors and extracting structured expense data from receipts, invoices, and financial documents.

CORE CAPABILITIES:
- OCR error correction and text normalization
- Real-time business verification using current data
- Intelligent categorization based on current business information
- Accurate amount and date extraction with validation

INDIAN MARKET FOCUS:
- Primary currency: Indian Rupee (₹, Rs, INR)
- Indian number format: 1,00,000 (lakhs), 10,00,000 (10 lakhs)
- Common Indian businesses and chains
- Indian date formats and regional variations

EXTRACTION RULES:
Amount: 
- Look for TOTAL, AMOUNT DUE, BALANCE, GRAND TOTAL keywords
- Indian currency symbols: Rs, ₹, INR
- Support Indian number format: 1,00,000 (lakhs), 10,00,000 (10 lakhs)
- Ensure proper decimal format (XX.XX)
- Common Indian amount terms: "Rupees", "Rs.", "INR"

Vendor:
- Extract the main business or merchant name from the top of the receipt
- Use real-time search to verify and standardize business names when possible
- Clean business names, remove addresses/phone numbers
- Handle common business abbreviations and variations

Date:
- Support formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
- Convert to YYYY-MM-DD format
- Use current date (2025-06-12) if unclear or missing

Category (use exactly one from this list):
Food & Drink, Transportation, Shopping, Entertainment, Healthcare, Utilities, Travel, Education, Business, Other

Special Classification Rules:
- Certifications, courses, training → Education
- Business cards, professional services → Business
- Medical documents, prescriptions, pharmacies → Healthcare
- Travel bookings, hotels, airlines → Travel
- Gas stations, rideshare, parking → Transportation
- Restaurants, coffee shops, groceries → Food & Drink

RESPONSE FORMAT: Return ONLY valid JSON:
{
  "vendor": "Standardized Business Name",
  "amount": 25.99,
  "date": "2025-06-12", 
  "category": "Food & Drink",
  "description": "Brief description of purchase (Items in purchase) (max 50 chars)",
  "confidence": 85,
  "reasoning": "Explanation of categorization and any real-time verification used"
}

CONFIDENCE SCORING:
90-100: All fields clearly found, verified with real-time data, minimal OCR errors
80-89: Most fields found, some real-time verification, minor corrections needed
70-79: Good extraction, basic verification, some fields may need inference
60-69: Fair extraction, limited verification, moderate OCR issues
50-59: Poor OCR quality, significant guessing required
0-49: Very poor quality, highly uncertain extraction

Use your real-time search capabilities to verify business names and enhance categorization accuracy when possible.`
            },
            {
              role: "user", 
              content: `Analyze this OCR text from a financial document. Correct any OCR errors, verify business information if possible, and extract structured expense data:\n\n${ocrText}`
            }
          ],
          temperature: 0.2,
          max_tokens: 400,
          stream: false
        })
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          if (retryCount < maxRetries) {
            const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 1000;
            console.log(`Rate limit hit, retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return extractDataWithPerplexity(ocrText, retryCount + 1);
          } else {
            throw new Error('Rate limit exceeded after maximum retries. Please wait a few minutes and try again.');
          }
        }
        
        if (response.status === 401) {
          throw new Error('Invalid Perplexity API key. Please check your configuration.');
        }
        
        if (response.status === 403) {
          throw new Error('Access forbidden. Check your API key permissions or account credits.');
        }
        
        const errorText = await response.text();
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from Perplexity API');
      }
      
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      if (error.message.includes('Rate limit') || error.message.includes('API error')) {
        throw error;
      }
      console.error('Perplexity API Error Details:', error);
      throw new Error(`API call failed: ${error.message}`);
    }
  };

  const extractBasicData = (text) => {
    const vendor = extractVendorBasic(text);
    const amount = extractAmountBasic(text);
    const date = extractDateBasic(text);
    
    return {
      vendor: vendor || '',
      amount: amount || 0,
      date: date
    };
  };

  const parseReceiptText = async (text) => {
    const basicResult = extractBasicData(text);
    
    const hasBasicVendor = basicResult.vendor && basicResult.vendor !== 'Unknown Vendor';
    const hasBasicAmount = basicResult.amount > 0;
    
    if (!hasBasicVendor || !hasBasicAmount) {
      if (!canMakeApiCall()) {
        console.log('Rate limit prevention: too many API calls, using basic parsing');
        setAiError('Rate limit prevention active. Using basic parsing to avoid API limits.');
        setTimeout(() => setAiError(''), 5000);
        
        const fallbackResult = {
          ...basicResult,
          vendor: basicResult.vendor || 'Unknown Vendor',
          amount: basicResult.amount || 0,
          date: basicResult.date || new Date().toISOString().split('T')[0],
          category: categorizeExpense(basicResult.vendor),
          description: '',
          text: text,
          parsedBy: 'Basic (Rate Limited)',
          confidence: 40,
          reasoning: 'Basic parsing due to rate limit prevention'
        };
        
        setAiCategorizedData(fallbackResult);
        return fallbackResult;
      }
      
      try {
        setIsProcessingAI(true);
        console.log('Basic parsing insufficient, using Perplexity AI for enhanced parsing...');
        
        const aiResult = await extractDataWithPerplexity(text);
        
        const enhancedResult = {
          vendor: aiResult.vendor || basicResult.vendor || 'Unknown Vendor',
          amount: parseFloat(aiResult.amount) || basicResult.amount || 0,
          date: aiResult.date || basicResult.date || new Date().toISOString().split('T')[0],
          category: aiResult.category || 'Other',
          description: aiResult.description || '',
          text: text,
          parsedBy: 'Perplexity AI',
          confidence: aiResult.confidence || 0,
          reasoning: aiResult.reasoning || 'Perplexity AI-based categorization with real-time verification'
        };
        
        setAiCategorizedData(enhancedResult);
        setAiSuccess(true);
        setTimeout(() => setAiSuccess(false), 5000);
        
        return enhancedResult;
      } catch (error) {
        console.error('Perplexity AI parsing failed:', error);
        setAiError(`AI parsing failed: ${error.message}`);
        setTimeout(() => setAiError(''), 5000);
        
        const fallbackResult = {
          ...basicResult,
          vendor: basicResult.vendor || 'Unknown Vendor',
          amount: basicResult.amount || 0,
          date: basicResult.date || new Date().toISOString().split('T')[0],
          category: categorizeExpense(basicResult.vendor),
          description: '',
          text: text,
          parsedBy: 'Basic (AI Failed)',
          confidence: 30,
          reasoning: 'Basic regex parsing due to AI failure'
        };
        
        setAiCategorizedData(fallbackResult);
        return fallbackResult;
      } finally {
        setIsProcessingAI(false);
      }
    }
    
    const basicCategory = categorizeExpense(basicResult.vendor);
    const finalResult = {
      ...basicResult,
      category: basicCategory,
      description: '',
      text: text,
      parsedBy: 'Basic',
      confidence: 70,
      reasoning: 'Basic regex pattern matching'
    };
    
    setAiCategorizedData(finalResult);
    return finalResult;
  };

  const processOCR = async (imageFile) => {
    return new Promise(async (resolve, reject) => {
      try {
        await validateImageQuality(imageFile);
        
        const canvas = document.createElement('canvas');
        const preprocessedBlob = await preprocessImage(canvas, imageFile);
        
        const { data: { text } } = await Tesseract.recognize(
          preprocessedBlob,
          'eng',
          {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                setOcrProgress(Math.round(m.progress * 100));
              }
            },
            tessedit_pageseg_mode: '6',
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$.,/-:()& ',
            tessedit_ocr_engine_mode: '1',
            preserve_interword_spaces: '1'
          }
        );
        
        console.log('OCR Text:', text);
        const parsedData = await parseReceiptText(text);
        resolve(parsedData);
      } catch (err) {
        console.error('OCR Error:', err);
        reject(err);
      }
    });
  };
  
  const categorizeExpense = (vendor, description = '') => {
    const text = (vendor + ' ' + description).toLowerCase();
    
    if (text.includes('domino') || text.includes('pizza') || text.includes('starbucks') || 
        text.includes('restaurant') || text.includes('coffee') || text.includes('food') ||
        text.includes('mcdonald') || text.includes('subway') || text.includes('cafe') ||
        text.includes('burger') || text.includes('kfc') || text.includes('taco')) {
      return 'Food & Drink';
    }
    if (text.includes('gas') || text.includes('shell') || text.includes('exxon') || 
        text.includes('uber') || text.includes('lyft') || text.includes('taxi') ||
        text.includes('chevron') || text.includes('bp') || text.includes('fuel')) {
      return 'Transportation';
    }
    if (text.includes('walmart') || text.includes('target') || text.includes('amazon') || 
        text.includes('store') || text.includes('shop') || text.includes('market') ||
        text.includes('costco') || text.includes('kroger')) {
      return 'Shopping';
    }
    if (text.includes('movie') || text.includes('netflix') || text.includes('spotify') || 
        text.includes('game') || text.includes('entertainment') || text.includes('cinema')) {
      return 'Entertainment';
    }
    if (text.includes('hospital') || text.includes('doctor') || text.includes('pharmacy') || 
        text.includes('health') || text.includes('medical') || text.includes('cvs') ||
        text.includes('walgreens')) {
      return 'Healthcare';
    }
    if (text.includes('electric') || text.includes('water') || text.includes('internet') || 
        text.includes('phone') || text.includes('utility') || text.includes('cable')) {
      return 'Utilities';
    }
    if (text.includes('hotel') || text.includes('airline') || text.includes('flight') ||
        text.includes('travel') || text.includes('booking')) {
      return 'Travel';
    }
    if (text.includes('aws') || text.includes('certified') || text.includes('course') ||
        text.includes('education') || text.includes('university') || text.includes('school')) {
      return 'Education';
    }
    if (text.includes('office') || text.includes('business') || text.includes('corp') ||
        text.includes('llc') || text.includes('inc')) {
      return 'Business';
    }
    
    return 'Other';
  };
  
  const handleImageUpload = async (file) => {
    if (!file) return;
    
    setIsProcessingOCR(true);
    setOcrSuccess(false);
    setOcrError('');
    setOcrProgress(0);
    setSelectedImage(URL.createObjectURL(file));
    setExtractedText('');
    setAiCategorizedData(null);
    setAiError('');
    setAiSuccess(false);
    setImageQualityWarning('');
    
    try {
      const ocrResult = await processOCR(file);
      
      setCurrentExpense(prev => ({
        ...prev,
        amount: ocrResult.amount > 0 ? ocrResult.amount.toFixed(2) : '',
        vendor: ocrResult.vendor || '',
        date: ocrResult.date || new Date().toISOString().split('T')[0],
        category: ocrResult.category || 'Other',
        description: ocrResult.description || '',
        receiptImage: file
      }));
      
      setExtractedText(ocrResult.text);
      setOcrSuccess(true);
      setTimeout(() => setOcrSuccess(false), 5000);
    } catch (error) {
      console.error('OCR processing failed:', error);
      setOcrError('Failed to process receipt. Please try again or enter details manually.');
      setTimeout(() => setOcrError(''), 5000);
    } finally {
      setIsProcessingOCR(false);
      setOcrProgress(0);
    }
  };
  
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleSourceSubmit = () => {
    if (!currentSource.name || !currentSource.type) {
      alert('Please fill in all required fields');
      return;
    }

    let updatedSources;
    const addAmount = parseFloat(currentSource.initialBalance) || 0;
    
    if (isEditingSource) {
      updatedSources = sources.map(source => 
        source.id === editingSourceId 
          ? { 
              ...currentSource, 
              initialBalance: source.initialBalance + addAmount
            }
          : source
      );
      setIsEditingSource(false);
      setEditingSourceId(null);
    } else {
      const newSource = {
        ...currentSource,
        id: `${currentSource.type.toLowerCase()}_${Date.now()}`,
        initialBalance: addAmount,
        balance: addAmount
      };
      updatedSources = [...sources, newSource];
    }
    
    setSources(updatedSources);
    localStorage.setItem('expenseSources', JSON.stringify(updatedSources));
    
    resetSourceForm();
  };

  const resetSourceForm = () => {
    setCurrentSource({
      id: '',
      type: '',
      name: '',
      balance: '',
      initialBalance: '',
      isActive: true,
      alertThreshold: '',
      preferredCategories: [],
      color: sourceColors[Math.floor(Math.random() * sourceColors.length)],
      description: ''
    });
    setShowSourceForm(false);
  };

  const editSource = (source) => {
    setCurrentSource({
      ...source,
      initialBalance: '',
      alertThreshold: source.alertThreshold.toString()
    });
    setIsEditingSource(true);
    setEditingSourceId(source.id);
    setShowSourceForm(true);
  };

  const deleteSource = (id) => {
    if (sources.length <= 1) {
      alert('You must have at least one source');
      return;
    }
    
    const updatedSources = sources.filter(source => source.id !== id);
    setSources(updatedSources);
    localStorage.setItem('expenseSources', JSON.stringify(updatedSources));
    
    const updatedExpenses = expenses.filter(expense => expense.sourceId !== id);
    setExpenses(updatedExpenses);
    localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
  };

  const handleSubmit = () => {
    if (!currentExpense.amount || !currentExpense.vendor || !currentExpense.date || !currentExpense.category || !currentExpense.sourceId) {
      alert('Please fill in all required fields including payment source');
      return;
    }
    
    let updatedExpenses;
    
    if (isEditing) {
      updatedExpenses = expenses.map(expense => 
        expense.id === editingId 
          ? { ...currentExpense, id: editingId, amount: parseFloat(currentExpense.amount) }
          : expense
      );
      setIsEditing(false);
      setEditingId(null);
    } else {
      const newExpense = {
        ...currentExpense,
        id: Date.now(),
        amount: parseFloat(currentExpense.amount)
      };
      updatedExpenses = [newExpense, ...expenses];
    }
    
    localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
    setExpenses(updatedExpenses);
    
    window.dispatchEvent(new CustomEvent('expensesUpdated', { 
      detail: updatedExpenses 
    }));
    
    resetForm();
  };
  
  const resetForm = () => {
    setCurrentExpense({
      amount: '',
      vendor: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      receiptImage: null,
      sourceId: ''
    });
    setShowForm(false);
    setSelectedImage(null);
    setExtractedText('');
    setAiCategorizedData(null);
    setAiError('');
    setAiSuccess(false);
    setImageQualityWarning('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const editExpense = (expense) => {
    setCurrentExpense({
      ...expense,
      amount: expense.amount.toString()
    });
    setIsEditing(true);
    setEditingId(expense.id);
    setShowForm(true);
    setActiveTab('add');
  };
  
  const deleteExpense = (id) => {
    const updatedExpenses = expenses.filter(expense => expense.id !== id);
    setExpenses(updatedExpenses);
    localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
  };
  
  const filteredExpenses = getFilteredExpenses();
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const totalSourceBalance = Object.values(sourceBalances).reduce((sum, balance) => sum + balance, 0);
  const totalInitialBalance = sources.reduce((sum, source) => sum + source.initialBalance, 0);

  const getSourceTypeInfo = (type) => {
    return sourceTypes.find(st => st.id === type) || sourceTypes[0];
  };

  const getSourceById = (id) => {
    return sources.find(source => source.id === id);
  };

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

  // Tab content rendering
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHomeTab();
      case 'add':
        return renderAddExpenseTab();
      case 'sources':
        return renderSourcesTab();
      case 'analytics':
        return renderAnalyticsTab();
      default:
        return renderHomeTab();
    }
  };

  const renderHomeTab = () => (
    <div className="space-y-6">
      {/* Hero Balance Section - PayPal inspired */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">ExpenseFlow</h1>
              <p className="text-blue-100 text-sm">AI-Powered Expense Management</p>
            </div>
          </div>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white bg-opacity-10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-blue-100 text-sm font-medium">Total Balance</span>
              <TrendingUp size={16} className="text-green-300" />
            </div>
            <p className="text-3xl font-bold mb-1">{formatIndianCurrency(totalSourceBalance)}</p>
            <p className="text-blue-200 text-sm">Across {sources.length} accounts</p>
          </div>
          
          <div className="bg-white bg-opacity-10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-blue-100 text-sm font-medium">Monthly Spending</span>
              <TrendingDown size={16} className="text-red-300" />
            </div>
            <p className="text-3xl font-bold mb-1">{formatIndianCurrency(totalExpenses)}</p>
            <p className="text-blue-200 text-sm">{filteredExpenses.length} transactions</p>
          </div>
        </div>
      </div>

      {/* Quick Actions - Google Pay inspired */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab('add')}
            className="flex flex-col items-center gap-3 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={20} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">Add Expense</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab('add');
              setTimeout(() => fileInputRef.current?.click(), 100);
            }}
            className="flex flex-col items-center gap-3 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors group"
          >
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera size={20} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">Scan Receipt</span>
          </button>
          
          <button
            onClick={() => setActiveTab('sources')}
            className="flex flex-col items-center gap-3 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors group"
          >
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet size={20} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">Manage Sources</span>
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className="flex flex-col items-center gap-3 p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors group"
          >
            <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 size={20} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">Analytics</span>
          </button>
        </div>
      </div>

      {/* Payment Sources Overview */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
          <button
            onClick={() => setActiveTab('sources')}
            className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1"
          >
            View All <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="space-y-3">
          {sources.slice(0, 3).map(source => {
            const typeInfo = getSourceTypeInfo(source.type);
            const Icon = typeInfo.icon;
            const balance = sourceBalances[source.id] || 0;
            const balanceStatus = getBalanceStatus(balance, source.alertThreshold);
            
            return (
              <div key={source.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: source.color }}
                  >
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{source.name}</p>
                    <p className="text-sm text-gray-500">{typeInfo.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${balanceStatus.color}`}>
                    {formatIndianCurrency(balance)}
                  </p>
                  {balance < source.alertThreshold && (
                    <p className="text-xs text-orange-500">Low Balance</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <button
            onClick={() => setActiveTab('analytics')}
            className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1"
          >
            View All <ChevronRight size={16} />
          </button>
        </div>
        
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No transactions yet</p>
            <p className="text-gray-400 text-sm mt-1">Add your first expense to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.slice(0, 5).map(expense => {
              const source = getSourceById(expense.sourceId);
              const typeInfo = source ? getSourceTypeInfo(source.type) : null;
              
              return (
                <div key={expense.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">{getCategoryIcon(expense.category)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{expense.vendor}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{expense.category}</span>
                        {source && (
                          <>
                            <span>•</span>
                            <span>{source.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatIndianCurrency(expense.amount)}
                    </p>
                    <p className="text-sm text-gray-500">{expense.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderAddExpenseTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isEditing ? 'Edit Expense' : 'Add New Expense'}
        </h1>
        <p className="text-gray-600">
          {isEditing ? 'Update your expense details' : 'Scan a receipt or enter details manually'}
        </p>
      </div>

      {/* Enhanced Receipt Processing Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Receipt Processing</h2>
            <p className="text-sm text-gray-600">Powered by OCR + Perplexity AI</p>
          </div>
        </div>

        {/* Rate Limit Warning */}
        {apiCallCount > 10 && (
          <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex items-center gap-3 text-sm text-orange-700">
              <AlertCircle size={20} />
              <span>Approaching API rate limit ({apiCallCount}/15 calls this minute). Basic parsing will be used if limit is reached.</span>
            </div>
          </div>
        )}

        {/* Upload Buttons - PayPal style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingOCR || isProcessingAI}
            className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-blue-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Upload size={20} className="text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Choose File</p>
              <p className="text-sm text-gray-600">Select from gallery</p>
            </div>
          </button>
          
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={isProcessingOCR || isProcessingAI}
            className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-green-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <Camera size={20} className="text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Take Photo</p>
              <p className="text-sm text-gray-600">Capture receipt</p>
            </div>
          </button>
        </div>

        {/* Hidden Inputs */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />

        {/* Processing Status */}
        <div className="space-y-4">
          {imageQualityWarning && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">{imageQualityWarning}</span>
              </div>
            </div>
          )}
          
          {isProcessingOCR && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 size={18} className="animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  Processing with enhanced OCR... {ocrProgress > 0 && `${ocrProgress}%`}
                </span>
              </div>
              {ocrProgress > 0 && (
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${ocrProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
          
          {isProcessingAI && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <Brain size={18} className="animate-pulse text-purple-600" />
                <span className="text-sm font-medium text-purple-700">
                  Perplexity AI analyzing with real-time verification...
                </span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
          
          {ocrSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2 text-green-700">
                <Check size={18} />
                <span className="text-sm font-medium">Receipt processed successfully! Form auto-filled with extracted data.</span>
              </div>
            </div>
          )}
          
          {aiSuccess && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="flex items-center gap-2 text-purple-700">
                <Brain size={18} />
                <span className="text-sm font-medium">Perplexity AI enhancement completed! Data verified and categorized.</span>
              </div>
            </div>
          )}
          
          {(ocrError || aiError) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">{ocrError || aiError}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Image Preview */}
        {selectedImage && (
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Receipt Preview:</h4>
            <img 
              src={selectedImage} 
              alt="Receipt preview" 
              className="max-w-full sm:max-w-sm max-h-64 object-contain rounded-lg border border-gray-200 mx-auto"
            />
          </div>
        )}

        {/* AI Analysis Results */}
        {aiCategorizedData && (
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={18} className="text-purple-600" />
              <h4 className="font-medium text-purple-800">
                AI Analysis Results (Confidence: {aiCategorizedData.confidence}%)
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-purple-600 font-medium">Vendor:</span>
                <span className="ml-2 text-gray-700">{aiCategorizedData.vendor}</span>
              </div>
              <div>
                <span className="text-purple-600 font-medium">Amount:</span>
                <span className="ml-2 text-gray-700">{formatIndianCurrency(aiCategorizedData.amount)}</span>
              </div>
              <div>
                <span className="text-purple-600 font-medium">Category:</span>
                <span className="ml-2 text-gray-700">{aiCategorizedData.category}</span>
              </div>
              <div>
                <span className="text-purple-600 font-medium">Parsed by:</span>
                <span className="ml-2 text-gray-700">{aiCategorizedData.parsedBy}</span>
              </div>
            </div>
            {aiCategorizedData.reasoning && (
              <div className="mt-3 pt-3 border-t border-purple-200">
                <span className="text-purple-600 font-medium text-sm">Reasoning:</span>
                <p className="text-xs text-gray-600 mt-1">{aiCategorizedData.reasoning}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Entry Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Expense Details</h2>
        
        {/* Payment Source Selection */}
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <label className="block text-sm font-medium text-blue-800 mb-3">
            Payment Source *
          </label>
          <select
            value={currentExpense.sourceId}
            onChange={(e) => setCurrentExpense({...currentExpense, sourceId: e.target.value})}
            className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            required
          >
            <option value="">Select payment source</option>
            {sources.filter(source => source.isActive).map(source => {
              const balance = sourceBalances[source.id] || 0;
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
            <div className="mt-4 p-3 bg-white rounded-lg border">
              {(() => {
                const selectedSource = getSourceById(currentExpense.sourceId);
                const balance = sourceBalances[currentExpense.sourceId] || 0;
                const balanceStatus = getBalanceStatus(balance, selectedSource?.alertThreshold || 0);
                const newBalance = balance - (parseFloat(currentExpense.amount) || 0);
                
                return (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Current Balance:</p>
                      <p className={`text-lg font-bold ${balanceStatus.color}`}>
                        {formatIndianCurrency(balance)}
                      </p>
                    </div>
                    {currentExpense.amount && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">After Transaction:</p>
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

          {/* Balance Warnings */}
          {currentExpense.sourceId && (() => {
            const selectedSource = getSourceById(currentExpense.sourceId);
            const balance = sourceBalances[currentExpense.sourceId] || 0;
            const amount = parseFloat(currentExpense.amount) || 0;
            const newBalance = balance - amount;
            
            if (amount > balance) {
              return (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle size={16} />
                    <span className="text-sm font-medium">
                      Insufficient balance! This transaction exceeds available funds by {formatIndianCurrency(amount - balance)}
                    </span>
                  </div>
                </div>
              );
            } else if (newBalance < selectedSource?.alertThreshold) {
              return (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-700">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
            <input
              type="number"
              step="0.01"
              value={currentExpense.amount}
              onChange={(e) => setCurrentExpense({...currentExpense, amount: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vendor *</label>
            <input
              type="text"
              value={currentExpense.vendor}
              onChange={(e) => setCurrentExpense({...currentExpense, vendor: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Starbucks, Amazon"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
            <input
              type="date"
              value={currentExpense.date}
              onChange={(e) => setCurrentExpense({...currentExpense, date: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <select
              value={currentExpense.category}
              onChange={(e) => setCurrentExpense({...currentExpense, category: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={currentExpense.description}
            onChange={(e) => setCurrentExpense({...currentExpense, description: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Optional notes about this expense"
            rows="3"
          />
        </div>
        
        <div className="flex items-center gap-3 pt-6">
          <button
            onClick={handleSubmit}
            className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isEditing ? 'Update Expense' : 'Add Expense'}
          </button>
          <button
            onClick={resetForm}
            className="flex-1 sm:flex-none px-8 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const renderSourcesTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Methods</h1>
        <p className="text-gray-600">Manage your accounts and payment sources</p>
      </div>

      {/* Add Source Button */}
      {!showSourceForm && (
        <div className="text-center">
          <button
            onClick={() => setShowSourceForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Payment Source
          </button>
        </div>
      )}

      {/* Source Form */}
      {showSourceForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            {isEditingSource ? 'Edit Payment Source' : 'Add New Payment Source'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Source Type *</label>
              <select
                value={currentSource.type}
                onChange={(e) => setCurrentSource({...currentSource, type: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select type</option>
                {sourceTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Source Name *</label>
              <input
                type="text"
                value={currentSource.name}
                onChange={(e) => setCurrentSource({...currentSource, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Primary Bank Account"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Initial Balance</label>
              <input
                type="number"
                step="0.01"
                value={currentSource.initialBalance}
                onChange={(e) => setCurrentSource({...currentSource, initialBalance: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alert Threshold</label>
              <input
                type="number"
                step="0.01"
                value={currentSource.alertThreshold}
                onChange={(e) => setCurrentSource({...currentSource, alertThreshold: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="100.00"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <input
                type="text"
                value={currentSource.description}
                onChange={(e) => setCurrentSource({...currentSource, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional description"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleSourceSubmit}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {isEditingSource ? 'Update Source' : 'Add Source'}
            </button>
            <button
              onClick={resetSourceForm}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sources List */}
      <div className="space-y-4">
        {sources.map(source => {
          const typeInfo = getSourceTypeInfo(source.type);
          const Icon = typeInfo.icon;
          const balance = sourceBalances[source.id] || 0;
          const balanceStatus = getBalanceStatus(balance, source.alertThreshold);
          
          return (
            <div key={source.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: source.color }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{source.name}</h3>
                    <p className="text-sm text-gray-500">{typeInfo.name}</p>
                    {source.description && (
                      <p className="text-sm text-gray-600 mt-1">{source.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Balance</p>
                    <p className={`text-xl font-bold ${balanceStatus.color}`}>
                      {formatIndianCurrency(balance)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => editSource(source)}
                      className="p-2 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deleteSource(source.id)}
                      className="p-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics & Insights</h1>
        <p className="text-gray-600">Track your spending patterns and financial health</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Total Expenses</h3>
            <TrendingDown size={24} />
          </div>
          <p className="text-3xl font-bold">{formatIndianCurrency(totalExpenses)}</p>
          <p className="text-blue-100 text-sm mt-2">{filteredExpenses.length} transactions</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Available Balance</h3>
            <Wallet size={24} />
          </div>
          <p className="text-3xl font-bold">{formatIndianCurrency(totalSourceBalance)}</p>
          <p className="text-green-100 text-sm mt-2">Across {sources.length} accounts</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Top Category</h3>
            <PieChart size={24} />
          </div>
          {Object.keys(expensesByCategory).length > 0 ? (
            <>
              <p className="text-2xl font-bold">
                {Object.entries(expensesByCategory).sort(([,a], [,b]) => b - a)[0][0]}
              </p>
              <p className="text-purple-100 text-sm mt-2">
                {formatIndianCurrency(Object.entries(expensesByCategory).sort(([,a], [,b]) => b - a)[0][1])}
              </p>
            </>
          ) : (
            <p className="text-2xl font-bold">No data</p>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(expensesByCategory).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h2>
          <div className="space-y-4">
            {Object.entries(expensesByCategory)
              .sort(([,a], [,b]) => b - a)
              .map(([category, amount]) => {
                const percentage = ((amount / totalExpenses) * 100).toFixed(1);
                return (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCategoryIcon(category)}</span>
                      <span className="font-medium text-gray-800">{category}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="font-semibold text-gray-900">{formatIndianCurrency(amount)}</p>
                        <p className="text-sm text-gray-500">{percentage}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Transactions</h2>
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <Activity size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map(expense => {
              const source = getSourceById(expense.sourceId);
              return (
                <div key={expense.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">{getCategoryIcon(expense.category)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{expense.vendor}</p>
                      <p className="text-sm text-gray-500">{expense.category} • {source?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatIndianCurrency(expense.amount)}</p>
                    <p className="text-sm text-gray-500">{expense.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // Mobile Navigation
  const MobileNavigation = () => (
    <div className={`fixed inset-0 z-50 lg:hidden ${showMobileMenu ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)} />
      <div className="fixed top-0 left-0 h-full w-64 bg-white shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-gray-900">ExpenseFlow</h2>
            <button
              onClick={() => setShowMobileMenu(false)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          
          <nav className="space-y-2">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'add', label: 'Add Expense', icon: Plus },
              { id: 'sources', label: 'Payment Methods', icon: CreditCard },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  setShowMobileMenu(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeTab === id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile Navigation */}
      <MobileNavigation />
      
      {/* Desktop Navigation */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">ExpenseFlow</h1>
          </div>
          
          <nav className="space-y-2">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'add', label: 'Add Expense', icon: Plus },
              { id: 'sources', label: 'Payment Methods', icon: CreditCard },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeTab === id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        <div className="max-w-4xl mx-auto p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;
