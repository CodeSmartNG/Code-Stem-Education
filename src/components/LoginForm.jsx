import React, { useState } from 'react';
import './AuthForms.css';

const LoginForm = ({ onLogin, onSwitchToRegister, onSwitchToTeacherRegister, isLoading: parentLoading }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Check for saved credentials on mount
  React.useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
      const success = await onLogin(formData.email, formData.password);
      
      if (success) {
        // Save email if "Remember Me" is checked
        if (rememberMe) {
          localStorage.setItem('remembered_email', formData.email);
        } else {
          localStorage.removeItem('remembered_email');
        }
        setError('');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
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
  };

  const handleDemoLogin = (role) => {
    const credentials = {
      admin: { email: 'codesmartng1@gmail.com', password: 'Kb1217@#$%&' },
      teacher: { email: 'kabir@teacher.com', password: '121712' },
      student: { email: 'student@example.com', password: 'password123' }
    };

    const cred = credentials[role];
    if (!cred) return;

    setFormData({ email: cred.email, password: cred.password });
    setError('');
    
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
    // You can implement password reset functionality here
    alert('Password reset functionality will be available soon.');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-icon">🔐</div>
          <h2>Welcome Back</h2>
          <p>Sign in to your STEM Platform account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
            <button className="error-close" onClick={() => setError('')}>×</button>
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
              disabled={isLoading || parentLoading}
              className="form-input"
              autoComplete="email"
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
                disabled={isLoading || parentLoading}
                className="form-input"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={toggleShowPassword}
                disabled={isLoading || parentLoading}
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
                disabled={isLoading || parentLoading}
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              className="forgot-password"
              onClick={handleForgotPassword}
              disabled={isLoading || parentLoading}
            >
              Forgot password?
            </button>
          </div>

          <button 
            type="submit" 
            className={`btn-primary login-btn ${(isLoading || parentLoading) ? 'loading' : ''}`}
            disabled={isLoading || parentLoading}
          >
            {(isLoading || parentLoading) ? (
              <>
                <div className="spinner"></div>
                Signing In...
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
              disabled={isLoading || parentLoading}
            >
              <span className="demo-icon">👑</span>
              Admin Demo
            </button>
            <button 
              type="button" 
              className="demo-btn teacher-demo"
              onClick={() => handleDemoLogin('teacher')}
              disabled={isLoading || parentLoading}
            >
              <span className="demo-icon">👨‍🏫</span>
              Teacher Demo
            </button>
            <button 
              type="button" 
              className="demo-btn student-demo"
              onClick={() => handleDemoLogin('student')}
              disabled={isLoading || parentLoading}
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
                disabled={isLoading || parentLoading}
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
                disabled={isLoading || parentLoading}
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