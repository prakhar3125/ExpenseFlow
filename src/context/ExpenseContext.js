import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';

const ExpenseContext = createContext();

export const useExpenseContext = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenseContext must be used within ExpenseProvider');
  }
  return context;
};

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [sources, setSources] = useState([]);
  const [selectedSources, setSelectedSources] = useState(['all']);
  const [showSourceManager, setShowSourceManager] = useState(false);
  const [activeSourceView, setActiveSourceView] = useState('all');
  const [sourceBalances, setSourceBalances] = useState({});
  
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
    { id: 'UPI', name: 'UPI Account', icon: 'Smartphone', color: '#10B981', description: 'PhonePe, Google Pay, Paytm, etc.' },
    { id: 'BANK', name: 'Bank Account', icon: 'Building2', color: '#3B82F6', description: 'Savings, Current, Salary accounts' },
    { id: 'CASH', name: 'Cash', icon: 'Wallet', color: '#F59E0B', description: 'Physical cash, wallet money' },
    { id: 'CARD', name: 'Credit/Debit Card', icon: 'CreditCard', color: '#8B5CF6', description: 'Card payments and transactions' },
    { id: 'INVESTMENT', name: 'Investment Account', icon: 'TrendingUp', color: '#EF4444', description: 'Stocks, mutual funds, etc.' },
    { id: 'SAVINGS', name: 'Savings & Goals', icon: 'PiggyBank', color: '#06B6D4', description: 'Emergency fund, goal-based savings' }
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
      
      // Initialize default sources if none exist
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
    if (balance > threshold * 2) return { status: 'high', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (balance > threshold) return { status: 'medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { status: 'low', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

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

  const addExpense = (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now(),
      amount: parseFloat(expense.amount)
    };
    const updatedExpenses = [newExpense, ...expenses];
    
    localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
    setExpenses(updatedExpenses);
    
    window.dispatchEvent(new CustomEvent('expensesUpdated', { 
      detail: updatedExpenses 
    }));
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
  };
  
  const deleteExpense = (id) => {
    const updatedExpenses = expenses.filter(expense => expense.id !== id);
    setExpenses(updatedExpenses);
    localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
  };

  const getSourceTypeInfo = (type) => {
    return sourceTypes.find(st => st.id === type) || sourceTypes[0];
  };

  const getSourceById = (id) => {
    return sources.find(source => source.id === id);
  };

  const value = {
    // State
    expenses,
    sources,
    selectedSources,
    showSourceManager,
    activeSourceView,
    sourceBalances,
    currentExpense,
    currentSource,
    isEditing,
    editingId,
    showForm,
    isProcessingOCR,
    ocrSuccess,
    ocrError,
    ocrProgress,
    selectedImage,
    isProcessingAI,
    aiError,
    aiSuccess,
    imageQualityWarning,
    lastApiCall,
    apiCallCount,
    extractedText,
    aiCategorizedData,
    showCategories,
    showSourceForm,
    isEditingSource,
    editingSourceId,
    showSourceDetails,
    fileInputRef,
    cameraInputRef,
    categories,
    sourceTypes,
    sourceColors,
    
    // State setters
    setExpenses,
    setSources,
    setSelectedSources,
    setShowSourceManager,
    setActiveSourceView,
    setSourceBalances,
    setCurrentExpense,
    setCurrentSource,
    setIsEditing,
    setEditingId,
    setShowForm,
    setIsProcessingOCR,
    setOcrSuccess,
    setOcrError,
    setOcrProgress,
    setSelectedImage,
    setIsProcessingAI,
    setAiError,
    setAiSuccess,
    setImageQualityWarning,
    setLastApiCall,
    setApiCallCount,
    setExtractedText,
    setAiCategorizedData,
    setShowCategories,
    setShowSourceForm,
    setIsEditingSource,
    setEditingSourceId,
    setShowSourceDetails,
    
    // Functions
    getFilteredExpenses,
    getSourceStats,
    getBalanceStatus,
    formatIndianCurrency,
    handleImageUpload,
    handleFileSelect,
    handleSourceSubmit,
    resetSourceForm,
    editSource,
    deleteSource,
    addExpense,
    handleSubmit,
    resetForm,
    editExpense,
    deleteExpense,
    getSourceTypeInfo,
    getSourceById,
    categorizeExpense
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};
