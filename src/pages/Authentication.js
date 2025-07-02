import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
// Add this import at the top of Authentication.js
import '../styles/authentication.css';

import { 
  Eye, 
  EyeOff, 
  Loader2, 
  Mail, 
  Lock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const RupeeIcon = ({ size = 20, className = "" }) => (
  <div 
    className={`rupee-icon ${className}`}
    style={{ fontSize: `${size}px`, width: `${size}px`, height: `${size}px` }}
  >
    ₹
  </div>
);

const Authentication = () => {
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('password');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const { login, signup, user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const validateForm = () => {
    if (!email || !password) {
      setError('Please fill in all required fields');
      return false;
    }
    
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login({ email, password });
      } else {
        result = await signup({ email, password });
      }

      if (result.success) {
        const from = location.state?.from?.pathname || '/add-expense';
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }

    setIsLoading(false);
  };

  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  const features = [
    'Track expenses across multiple categories',
    'Generate detailed financial reports',
    'Set and monitor budget goals',
    'Secure cloud synchronization'
  ];

  return (
    <div className="auth-container">
      {/* Left Panel - Features */}
      <div className="auth-left-panel">
        <div className="auth-left-content">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <RupeeIcon size={40} />
            </div>
            <div className="auth-brand-text">
              <h1 className="auth-brand-title">ExpenseFlow</h1>
              <div className="auth-brand-subtitle">
                <Sparkles className="auth-brand-sparkle" />
                <span>Professional Finance Tracker</span>
              </div>
            </div>
          </div>

          <h2 className="auth-main-title">
            Take Control of Your Financial Journey
          </h2>

          <p className="auth-main-description">
            Join thousands of professionals who trust ExpenseFlow to manage their finances 
            with precision and insight.
          </p>

          <div className="auth-features-list">
            {features.map((feature, index) => (
              <div key={index} className="auth-feature-item">
                <CheckCircle className="auth-feature-icon" />
                <span className="auth-feature-text">{feature}</span>
              </div>
            ))}
          </div>

          <div className="auth-testimonial">
            <div className="auth-testimonial-avatars">
              {[1, 2, 3].map((i) => (
                <div key={i} className="auth-testimonial-avatar" />
              ))}
              <span className="auth-testimonial-count">Trusted by 10,000+ users</span>
            </div>
            <p className="auth-testimonial-text">
              "ExpenseFlow transformed how I manage my business expenses. Highly recommended!"
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Authentication Form */}
      <div className="auth-right-panel">
        <div className="auth-form-container">
          {/* Mobile Logo */}
          <div className="auth-mobile-brand">
            <div className="auth-mobile-brand-content">
              <div className="auth-mobile-brand-icon">
                <RupeeIcon size={32} />
              </div>
              <h1 className="auth-mobile-brand-title">ExpenseFlow</h1>
            </div>
          </div>

          <div className="auth-form-wrapper">
            <div className="auth-form-header">
              <h2 className="auth-form-title">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="auth-form-description">
                {isLogin 
                  ? 'Sign in to access your financial dashboard' 
                  : 'Join ExpenseFlow and start managing your finances professionally'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && (
                <div className="auth-error-alert">
                  <div className="auth-error-content">
                    <AlertCircle className="auth-error-icon" />
                    <p className="auth-error-text">{error}</p>
                  </div>
                </div>
              )}

              <div className="auth-form-fields">
                <div className="auth-form-group">
                  <label htmlFor="email" className="auth-form-label">
                    Email Address
                  </label>
                  <div className="auth-input-wrapper">
                    <div className="auth-input-icon">
                      <Mail className="auth-input-icon-svg" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="auth-input"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <div className="auth-form-group">
                  <label htmlFor="password" className="auth-form-label">
                    Password
                  </label>
                  <div className="auth-input-wrapper">
                    <div className="auth-input-icon">
                      <Lock className="auth-input-icon-svg" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="auth-input"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="auth-password-toggle"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="auth-form-group">
                    <label htmlFor="confirmPassword" className="auth-form-label">
                      Confirm Password
                    </label>
                    <div className="auth-input-wrapper">
                      <div className="auth-input-icon">
                        <Lock className="auth-input-icon-svg" />
                      </div>
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="auth-input"
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="auth-password-toggle"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="auth-submit-button"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="loading-spinner" />
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-form-footer">
              <p className="auth-switch-prompt">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
              </p>
              <button
                type="button"
                onClick={handleModeSwitch}
                className="auth-switch-button"
              >
                {isLogin ? 'Create a free account' : 'Sign in instead'}
              </button>
            </div>

            {!isLogin && (
              <div className="auth-terms-text">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Authentication;
