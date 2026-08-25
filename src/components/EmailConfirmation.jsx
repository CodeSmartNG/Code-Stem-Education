import React, { useState, useEffect } from 'react';
import './EmailConfirmation.css';

const EmailConfirmation = ({ 
  email, 
  onConfirm, 
  onResend, 
  onCancel,
  token, // Optional token for manual entry (legacy/local mode)
  isFirebaseMode = true // ✅ New prop to indicate Firebase mode
}) => {
  const [manualToken, setManualToken] = useState(token || '');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'checking', 'verified', 'error'

  // ✅ Auto-check verification status periodically (for Firebase)
  useEffect(() => {
    if (isFirebaseMode) {
      // Check verification status every 5 seconds
      const interval = setInterval(async () => {
        try {
          setVerificationStatus('checking');
          // The parent component will handle the actual check
          // This is just for UI feedback
        } catch (error) {
          console.error('Error checking verification status:', error);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isFirebaseMode]);

  const handleManualConfirm = () => {
    if (manualToken.trim()) {
      onConfirm(manualToken.trim());
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage('');
    
    try {
      await onResend();
      setResendMessage('✅ Confirmation email sent successfully! Please check your inbox.');
      setVerificationStatus(null);
    } catch (error) {
      setResendMessage('❌ ' + (error.message || 'Failed to resend email. Please try again.'));
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      setIsVerifying(true);
      setVerificationStatus('checking');
      
      // Call the parent's check function
      if (onConfirm && typeof onConfirm === 'function') {
        // For Firebase, onConfirm might be called without token
        const result = await onConfirm();
        if (result && result.success) {
          setVerificationStatus('verified');
          setResendMessage('✅ Email verified successfully! You can now log in.');
        } else if (result && result.message) {
          setResendMessage('⏳ ' + result.message);
        }
      }
    } catch (error) {
      setVerificationStatus('error');
      setResendMessage('❌ ' + (error.message || 'Failed to verify email. Please try again.'));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="email-confirmation-container">
      <div className="email-confirmation-card">
        <div className="confirmation-header">
          <div className="confirmation-icon">📧</div>
          <h2>Confirm Your Email Address</h2>
        </div>
        
        <div className="confirmation-content">
          <p className="confirmation-instructions">
            We've sent a confirmation email to:
          </p>
          <p className="confirmation-email">{email}</p>

          {/* ✅ Firebase Mode - Status Indicator */}
          {isFirebaseMode && (
            <div className="firebase-status">
              <div className="status-indicator">
                <span className={`status-dot ${verificationStatus === 'verified' ? 'verified' : verificationStatus === 'checking' ? 'checking' : 'pending'}`}></span>
                <span className="status-text">
                  {verificationStatus === 'verified' && '✅ Email Verified'}
                  {verificationStatus === 'checking' && '⏳ Checking verification...'}
                  {verificationStatus === 'error' && '❌ Verification Failed'}
                  {!verificationStatus && '⏳ Waiting for verification...'}
                </span>
              </div>
              {verificationStatus !== 'verified' && (
                <button
                  onClick={handleCheckVerification}
                  disabled={isVerifying}
                  className="check-verification-btn"
                >
                  {isVerifying ? 'Checking...' : '🔍 Check Verification'}
                </button>
              )}
            </div>
          )}

          {/* ✅ Firebase Mode Instructions */}
          {isFirebaseMode ? (
            <div className="confirmation-steps firebase-steps">
              <h3>📌 To complete your registration:</h3>
              <ol>
                <li>Check your email inbox (and spam/junk folder)</li>
                <li>Click the <strong>"Verify Email"</strong> button in the email from Firebase</li>
                <li>Click the <strong>"Check Verification"</strong> button below or refresh the page</li>
                <li>You'll be automatically redirected to login</li>
              </ol>
              <div className="firebase-note">
                <span className="note-icon">🔐</span>
                <p>Firebase handles email verification securely. The verification link expires after 24 hours.</p>
              </div>
            </div>
          ) : (
            /* ✅ Local Mode Instructions (Legacy) */
            <div className="confirmation-steps">
              <h3>To complete your registration:</h3>
              <ol>
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the confirmation link in the email</li>
                <li>Return here to log in</li>
              </ol>
            </div>
          )}

          {/* ✅ Manual Token Entry (for testing/local mode) */}
          {!isFirebaseMode && (
            <div className="manual-confirmation">
              <h4>Demo / Manual Confirmation</h4>
              <p className="demo-note">
                For testing purposes, you can manually enter a confirmation token below:
              </p>
              <div className="token-input-group">
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Enter confirmation token"
                  className="token-input"
                />
                <button
                  onClick={handleManualConfirm}
                  disabled={!manualToken.trim()}
                  className="confirm-token-btn"
                >
                  Confirm Email
                </button>
              </div>
            </div>
          )}

          {/* ✅ Resend Email Section */}
          <div className="resend-section">
            <p>Didn't receive the email?</p>
            <button
              onClick={handleResend}
              disabled={isResending}
              className="resend-btn"
            >
              {isResending ? 'Sending...' : '📧 Resend Confirmation Email'}
            </button>
            {resendMessage && (
              <p className={`resend-message ${resendMessage.includes('✅') ? 'success' : resendMessage.includes('❌') ? 'error' : 'info'}`}>
                {resendMessage}
              </p>
            )}
          </div>

          {/* ✅ Help Tips */}
          <div className="help-tips">
            <h4>💡 Having trouble?</h4>
            <ul>
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>Wait a few minutes - emails can take time to arrive</li>
              <li>Try resending the verification email if you don't see it</li>
              {isFirebaseMode && (
                <li>Check that you didn't miss the verification email from Firebase</li>
              )}
              <li>Contact support if you continue having issues</li>
            </ul>
          </div>
        </div>

        <div className="confirmation-actions">
          <button
            onClick={onCancel}
            className="cancel-btn"
          >
            ← Back to Login
          </button>
        </div>

        {/* ✅ Mode Information */}
        <div className="demo-info">
          <details>
            <summary>{isFirebaseMode ? '🔐 How Email Verification Works (Firebase)' : '📋 Demo Information'}</summary>
            <div className="demo-content">
              {isFirebaseMode ? (
                <>
                  <p><strong>Email verification with Firebase:</strong></p>
                  <ul>
                    <li>Firebase sends a real verification email to your address</li>
                    <li>Click the verification link in the email</li>
                    <li>The app checks your verification status automatically</li>
                    <li>Once verified, you can log in to your account</li>
                    <li>All data is securely managed by Firebase Auth</li>
                  </ul>
                  <p className="security-note">
                    🔒 Your email and password are securely stored in Firebase.
                  </p>
                </>
              ) : (
                <>
                  <p><strong>How this works in demo mode:</strong></p>
                  <ul>
                    <li>Confirmation tokens are stored in browser storage</li>
                    <li>No actual emails are sent in this demo</li>
                    <li>Use the manual confirmation above with the token shown during registration</li>
                    <li>In a real application, users would receive actual email links</li>
                  </ul>
                </>
              )}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmation;
