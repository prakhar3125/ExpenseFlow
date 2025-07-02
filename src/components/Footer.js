import React from 'react';
import { useTheme } from '../context/ThemeContext';

const Footer = () => {
  const { isDarkMode } = useTheme();

  return (
    <footer className={`transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-slate-900 border-slate-700' 
        : 'bg-gray-50 border-gray-200'
    } border-t mt-auto`}>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8">
        
        {/* Main Footer Content - Mobile Optimized */}
        <div className="py-6 sm:py-8 lg:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            
            {/* Brand Section - Mobile Enhanced */}
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className={`text-lg sm:text-xl font-bold mb-2 sm:mb-3 transition-colors duration-200 ${
                isDarkMode ? 'text-slate-100' : 'text-gray-900'
              }`}>
                ExpenseFlow
              </h3>
              <p className={`text-sm sm:text-base font-medium mb-3 sm:mb-4 transition-colors duration-200 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`}>
                AI-Powered Expense Tracker
              </p>
              <p className={`text-sm leading-relaxed transition-colors duration-200 ${
                isDarkMode ? 'text-slate-400' : 'text-gray-600'
              }`}>
                Simplify your financial management with intelligent expense tracking, 
                automated categorization, and insightful analytics.
              </p>
            </div>

            {/* Quick Links Section - Mobile Enhanced */}
            <div>
              <h4 className={`text-sm sm:text-base font-semibold mb-3 sm:mb-4 transition-colors duration-200 ${
                isDarkMode ? 'text-slate-200' : 'text-gray-800'
              }`}>
                Quick Links
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <a 
                    href="/dashboard" 
                    className={`text-sm transition-colors duration-200 hover:underline min-h-[44px] sm:min-h-auto py-2 sm:py-0 block sm:inline ${
                      isDarkMode 
                        ? 'text-slate-400 hover:text-slate-200' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Dashboard
                  </a>
                </li>
                <li>
                  <a 
                    href="/expenses" 
                    className={`text-sm transition-colors duration-200 hover:underline min-h-[44px] sm:min-h-auto py-2 sm:py-0 block sm:inline ${
                      isDarkMode 
                        ? 'text-slate-400 hover:text-slate-200' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Expenses
                  </a>
                </li>
                <li>
                  <a 
                    href="/reports" 
                    className={`text-sm transition-colors duration-200 hover:underline min-h-[44px] sm:min-h-auto py-2 sm:py-0 block sm:inline ${
                      isDarkMode 
                        ? 'text-slate-400 hover:text-slate-200' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Reports
                  </a>
                </li>
                <li>
                  <a 
                    href="/settings" 
                    className={`text-sm transition-colors duration-200 hover:underline min-h-[44px] sm:min-h-auto py-2 sm:py-0 block sm:inline ${
                      isDarkMode 
                        ? 'text-slate-400 hover:text-slate-200' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Settings
                  </a>
                </li>
              </ul>
            </div>

            {/* Support Section - Mobile Enhanced */}
            <div>
              <h4 className={`text-sm sm:text-base font-semibold mb-3 sm:mb-4 transition-colors duration-200 ${
                isDarkMode ? 'text-slate-200' : 'text-gray-800'
              }`}>
                Support
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <a 
                    href="/help" 
                    className={`text-sm transition-colors duration-200 hover:underline min-h-[44px] sm:min-h-auto py-2 sm:py-0 block sm:inline ${
                      isDarkMode 
                        ? 'text-slate-400 hover:text-slate-200' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a 
                    href="/faq" 
                    className={`text-sm transition-colors duration-200 hover:underline min-h-[44px] sm:min-h-auto py-2 sm:py-0 block sm:inline ${
                      isDarkMode 
                        ? 'text-slate-400 hover:text-slate-200' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a 
                    href="/contact" 
                    className={`text-sm transition-colors duration-200 hover:underline min-h-[44px] sm:min-h-auto py-2 sm:py-0 block sm:inline ${
                      isDarkMode 
                        ? 'text-slate-400 hover:text-slate-200' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <a 
                    href="/feedback" 
                    className={`text-sm transition-colors duration-200 hover:underline min-h-[44px] sm:min-h-auto py-2 sm:py-0 block sm:inline ${
                      isDarkMode 
                        ? 'text-slate-400 hover:text-slate-200' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Feedback
                  </a>
                </li>
              </ul>
            </div>

            {/* Connect Section - Mobile Enhanced */}
            <div>
              <h4 className={`text-sm sm:text-base font-semibold mb-3 sm:mb-4 transition-colors duration-200 ${
                isDarkMode ? 'text-slate-200' : 'text-gray-800'
              }`}>
                Connect
              </h4>
              
              {/* Social Links - Mobile Optimized */}
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <a 
                  href="https://github.com/prakhar3125" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`p-2.5 sm:p-2 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center ${
                    isDarkMode 
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                  aria-label="Visit our GitHub profile"
                  title="GitHub"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.linkedin.com/in/prakhar3125/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`p-2.5 sm:p-2 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center ${
                    isDarkMode 
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                  aria-label="Visit our LinkedIn profile"
                  title="LinkedIn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
              
              {/* Contact Email - Mobile Enhanced */}
              <div className="space-y-2">
                <p className={`text-xs sm:text-sm font-medium transition-colors duration-200 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>
                  Email:
                </p>
                <a 
                  href="mailto:contact@expenseflow.com" 
                  className={`text-sm transition-colors duration-200 hover:underline break-words min-h-[44px] sm:min-h-auto py-2 sm:py-0 block sm:inline ${
                    isDarkMode 
                      ? 'text-slate-400 hover:text-slate-200' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  contact@expenseflow.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom - Mobile Enhanced */}
        <div className={`border-t py-4 sm:py-6 transition-colors duration-200 ${
          isDarkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            
            {/* Copyright - Mobile Optimized */}
            <div className="text-center sm:text-left">
              <p className={`text-xs sm:text-sm mb-1 sm:mb-2 transition-colors duration-200 ${
                isDarkMode ? 'text-slate-400' : 'text-gray-600'
              }`}>
                © 2025 ExpenseFlow. All rights reserved.
              </p>
              <p className={`text-xs sm:text-sm transition-colors duration-200 ${
                isDarkMode ? 'text-slate-400' : 'text-gray-600'
              }`}>
                Created with ❤️ by{' '}
                <a 
                  href="https://github.com/prakhar3125" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`font-medium transition-colors duration-200 hover:underline min-h-[44px] sm:min-h-auto py-1 sm:py-0 ${
                    isDarkMode 
                      ? 'text-blue-400 hover:text-blue-300' 
                      : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  Prakhar Sinha
                </a>
              </p>
            </div>
            
            {/* Legal Links - Mobile Enhanced */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-1">
              <a 
                href="/privacy" 
                className={`text-xs sm:text-sm transition-colors duration-200 hover:underline min-h-[44px] sm:min-h-auto py-2 sm:py-0 px-2 sm:px-0 ${
                  isDarkMode 
                    ? 'text-slate-400 hover:text-slate-200' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Privacy Policy
              </a>
              <span className={`hidden sm:inline text-xs sm:text-sm mx-2 ${
                isDarkMode ? 'text-slate-500' : 'text-gray-400'
              }`}>
                •
              </span>
              <a 
                href="/terms" 
                className={`text-xs sm:text-sm transition-colors duration-200 hover:underline min-h-[44px] sm:min-h-auto py-2 sm:py-0 px-2 sm:px-0 ${
                  isDarkMode 
                    ? 'text-slate-400 hover:text-slate-200' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Terms of Service
              </a>
              <span className={`hidden sm:inline text-xs sm:text-sm mx-2 ${
                isDarkMode ? 'text-slate-500' : 'text-gray-400'
              }`}>
                •
              </span>
              <a 
                href="/cookies" 
                className={`text-xs sm:text-sm transition-colors duration-200 hover:underline min-h-[44px] sm:min-h-auto py-2 sm:py-0 px-2 sm:px-0 ${
                  isDarkMode 
                    ? 'text-slate-400 hover:text-slate-200' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
  