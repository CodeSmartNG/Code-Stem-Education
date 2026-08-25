import React, { useState, useEffect } from 'react';
import './AuthForms.css';

const LoginForm = ({ 
  onLogin, 
  onSwitchToRegister, 
  onSwitchToTeacherRegister, 
  isLoading: parentLoading,
  onResendVerification // ✅ New prop for resending verification email
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  // Check for saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowResendVerification(false);
    setResendMessage('');

    // Check if account is locked
    if (isLocked) {
      setError('Account temporarily locked. Please wait 30 seconds before trying again.');
      return;
    }

    // Validate fields
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const result = await onLogin(formData.email, formData.password);

      // Check if login returned a special "email_not_verified" status
      if (result === 'email_not_verified') {
        setError('Please verify your email before logging in.');
        setShowResendVerification(true);
        setIsLoading(false);
        return;
      }

      if (result === true || result === 'success') {
        // Save email if "Remember Me" is checked
        if (rememberMe) {
          localStorage.setItem('remembered_email', formData.email);
        } else {
          localStorage.removeItem('remembered_email');
        }
        setError('');
        setLoginAttempts(0);
        setShowResendVerification(false);
      } else {
        // Increment failed attempts
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        // Lock account after 5 failed attempts
        if (newAttempts >= 5) {
          setIsLocked(true);
          setError('Too many failed attempts. Account locked for 30 seconds.');
          setTimeout(() => {
            setIsLocked(false);
            setLoginAttempts(0);
            setError('');
          }, 30000);
        } else {
          setError(`Invalid email or password. ${5 - newAttempts} attempts remaining.`);
        }
      }
    } catch (err) {
      // Check if error is about email verification
      if (err.message && err.message.toLowerCase().includes('verify your email')) {
        setError('Please verify your email before logging in. Check your inbox for the confirmation link.');
        setShowResendVerification(true);
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
      
      // Increment failed attempts on error too
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      if (newAttempts >= 5) {
        setIsLocked(true);
        setTimeout(() => {
          setIsLocked(false);
          setLoginAttempts(0);
        }, 30000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setIsLoading(true);
      setResendMessage('');
      
      if (onResendVerification) {
        const result = await onResendVerification(formData.email);
        if (result && result.success) {
          setResendMessage('✅ Verification email resent successfully! Please check your inbox.');
          setShowResendVerification(false);
        } else {
          setResendMessage('❌ Failed to resend verification email. Please try again.');
        }
      } else {
        setResendMessage('❌ Resend verification is not available. Please contact support.');
      }
    } catch (error) {
      setResendMessage('❌ ' + (error.message || 'Failed to resend verification email.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setShowResendVerification(false);
    setResendMessage('');
  };

  const handleDemoLogin = (role) => {
    // Clear any previous errors
    setError('');
    setLoginAttempts(0);
    setIsLocked(false);
    setShowResendVerification(false);
    setResendMessage('');

    const credentials = {
      admin: { email: 'codesmartng1@gmail.com', password: 'Kb1217@#$%&' },
      teacher: { email: 'kabir@teacher.com', password: '121712' },
      student: { email: 'student@example.com', password: 'password123' }
    };

    const cred = credentials[role];
    if (!cred) {
      setError('Invalid demo role selected');
      return;
    }

    setFormData({ email: cred.email, password: cred.password });

    // Auto-submit after a short delay
    setTimeout(() => {
      const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
      handleSubmit(submitEvent);
    }, 300);
  };

  const toggleShowPassword = () => {
    setShowPassword(prev => !prev);
  };

  const handleForgotPassword = () => {
    setError('Password reset functionality will be available soon. Please contact support.');
  };

  const clearError = () => {
    setError('');
    setShowResendVerification(false);
    setResendMessage('');
  };

  // Check if form is disabled
  const isDisabled = isLoading || parentLoading || isLocked;

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-icon">🔐</div>
          <h2>Welcome Back</h2>
          <p>Sign in to your STEM Platform account</p>
          {loginAttempts > 0 && loginAttempts < 5 && (
            <div className="attempts-warning">
              ⚠️ {5 - loginAttempts} login attempts remaining
            </div>
          )}
          {isLocked && (
            <div className="lock-warning">
              🔒 Account temporarily locked
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className={`error-message ${isLocked ? 'lock-error' : ''}`}>
            <span className="error-icon">{isLocked ? '🔒' : '⚠️'}</span>
            <span className="error-text">{error}</span>
            <button 
              type="button" 
              className="error-close" 
              onClick={clearError}
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        )}

        {/* Resend Verification Section */}
        {showResendVerification && (
          <div className="resend-verification-section">
            <div className="resend-info">
              <span className="resend-icon">📧</span>
              <p>Didn't receive the verification email? Click the button below to resend.</p>
            </div>
            <button
              type="button"
              className="resend-btn"
              onClick={handleResendVerification}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : '📧 Resend Verification Email'}
            </button>
            {resendMessage && (
              <div className={`resend-message ${resendMessage.includes('✅') ? 'success' : 'error'}`}>
                {resendMessage}
              </div>
            )}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form" autoComplete="on">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              required
              disabled={isDisabled}
              className={`form-input ${error && !formData.email ? 'input-error' : ''}`}
              autoComplete="email"
              aria-invalid={!!error && !formData.email}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                disabled={isDisabled}
                className={`form-input ${error && !formData.password ? 'input-error' : ''}`}
                autoComplete="current-password"
                aria-invalid={!!error && !formData.password}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={toggleShowPassword}
                disabled={isDisabled}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isDisabled}
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              className="forgot-password"
              onClick={handleForgotPassword}
              disabled={isDisabled}
            >
              Forgot password?
            </button>
          </div>

          <button 
            type="submit" 
            className={`btn-primary login-btn ${isDisabled ? 'loading' : ''}`}
            disabled={isDisabled}
          >
            {isDisabled ? (
              <>
                <div className="spinner"></div>
                {isLocked ? 'Account Locked...' : 'Signing In...'}
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo Login Section */}
        <div className="demo-section">
          <div className="demo-divider">
            <span>Quick Demo Access</span>
          </div>
          <div className="demo-buttons">
            <button 
              type="button" 
              className="demo-btn admin-demo"
              onClick={() => handleDemoLogin('admin')}
              disabled={isDisabled}
            >
              <span className="demo-icon">👑</span>
              Admin Demo
            </button>
            <button 
              type="button" 
              className="demo-btn teacher-demo"
              onClick={() => handleDemoLogin('teacher')}
              disabled={isDisabled}
            >
              <span className="demo-icon">👨‍🏫</span>
              Teacher Demo
            </button>
            <button 
              type="button" 
              className="demo-btn student-demo"
              onClick={() => handleDemoLogin('student')}
              disabled={isDisabled}
            >
              <span className="demo-icon">👨‍🎓</span>
              Student Demo
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <div className="footer-section">
            <p>Don't have an account?</p>
            <div className="register-options">
              <button 
                type="button" 
                className="btn-outline student-register-btn"
                onClick={onSwitchToRegister}
                disabled={isDisabled}
              >
                <span className="btn-icon">👨‍🎓</span>
                Sign up as Student
              </button>
              <div className="divider">
                <span>or</span>
              </div>
              <button 
                type="button" 
                className="btn-teacher teacher-register-btn"
                onClick={onSwitchToTeacherRegister}
                disabled={isDisabled}
              >
                <span className="btn-icon">👨‍🏫</span>
                Apply as Teacher
              </button>
            </div>
          </div>

          <div className="teacher-info">
            <div className="teacher-info-icon">💡</div>
            <div className="teacher-info-content">
              <h4>Interested in Teaching?</h4>
              <p>Join our platform as an educator and share your knowledge with students</p>
              <ul>
                <li>✅ Create and manage your own courses</li>
                <li>✅ Reach students interested in your expertise</li>
                <li>✅ Get admin approval for quality control</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="security-notice">
          <span className="security-icon">🔒</span>
          <p>Your login is secure and encrypted</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
