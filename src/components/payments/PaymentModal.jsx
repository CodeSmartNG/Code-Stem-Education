import React, { useState } from 'react';
import paymentService, { paymentConfig } from '../../utils/paymentService';
import { getCurrentUser, processLessonPayment, purchaseLesson } from '../../utils/storage';
import './PaymentModal.css';

const PaymentModal = ({ lesson, course, onClose, onSuccess }) => {
  const [selectedMethod, setSelectedMethod] = useState('paystack');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('select'); // select, details, processing, success, error
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState('');
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    phoneNumber: ''
  });

  const currentUser = getCurrentUser();

  // Add safety checks for lesson and course
  const safeLesson = lesson || {};
  const safeCourse = course || {};

  const paymentMethods = [
    {
      id: 'paystack',
      name: 'Paystack',
      description: 'Pay with card, bank, or USSD',
      icon: '💳',
      supports: ['Card', 'Bank Transfer', 'USSD']
    },
    {
      id: 'flutterwave',
      name: 'Flutterwave',
      description: 'Multiple payment options',
      icon: '🌐',
      supports: ['Card', 'Bank', 'Mobile Money']
    },
    {
      id: 'bank_transfer',
      name: 'Direct Bank Transfer',
      description: 'Transfer to our account',
      icon: '🏦',
      supports: ['OPay', 'PalmPay', 'GTB', 'Zenith']
    },
    {
      id: 'ussd',
      name: 'USSD Payment',
      description: 'Dial code on your phone',
      icon: '📱',
      supports: ['Quick Banking']
    },
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      description: 'OPay, PalmPay, etc.',
      icon: '📲',
      supports: ['OPay', 'PalmPay']
    }
  ];

  const handlePayment = async () => {
    if (!currentUser) {
      setError('Please log in to make a payment');
      return;
    }

    setLoading(true);
    setError('');

    try {
      switch (selectedMethod) {
        case 'paystack':
          await handlePaystackPayment();
          break;
        case 'flutterwave':
          await handleFlutterwavePayment();
          break;
        case 'bank_transfer':
          await handleBankTransfer();
          break;
        case 'ussd':
          await handleUSSDPayment();
          break;
        case 'mobile_money':
          await handleMobileMoneyPayment();
          break;
        default:
          throw new Error('Invalid payment method');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment failed. Please try again.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackPayment = async () => {
    setStep('processing');
    
    const metadata = {
      lesson_id: safeLesson.id,
      lesson_title: safeLesson.title || 'Lesson',
      course_key: safeCourse.key,
      student_id: currentUser.id,
      student_name: currentUser.name
    };

    const result = await paymentService.initializePaystackPayment(
      currentUser.email,
      safeLesson.price || 0,
      metadata
    );

    if (result.status) {
      setPaymentData(result.data);
      
      // Simulate payment verification (in real app, this would be webhook-based)
      setTimeout(async () => {
        const verification = await paymentService.verifyPaystackPayment(result.data.reference);
        
        if (verification.status && verification.data.status === 'success') {
          await completePayment(verification.data.reference, 'paystack');
        } else {
          setError('Payment verification failed');
          setStep('error');
        }
      }, 3000);
    } else {
      throw new Error(result.message);
    }
  };

  const handleFlutterwavePayment = async () => {
    setStep('processing');
    
    const metadata = {
      lesson_id: safeLesson.id,
      lesson_title: safeLesson.title || 'Lesson',
      course_key: safeCourse.key
    };

    const result = await paymentService.initializeFlutterwavePayment(
      currentUser.email,
      safeLesson.price || 0,
      metadata
    );

    if (result.status === 'success') {
      setPaymentData(result.data);
      // In real implementation, redirect to Flutterwave
      setTimeout(async () => {
        await completePayment(`flutterwave_${Date.now()}`, 'flutterwave');
      }, 3000);
    } else {
      throw new Error(result.message);
    }
  };

  const handleBankTransfer = async () => {
    if (!bankDetails.bankName) {
      setError('Please select a bank');
      return;
    }

    setStep('processing');
    
    const result = await paymentService.initializeDirectBankTransfer(
      safeLesson.price || 0,
      bankDetails
    );

    if (result.status === 'success') {
      setPaymentData(result.data);
      setStep('transfer_details');
    } else {
      throw new Error(result.message);
    }
  };

  const handleUSSDPayment = async () => {
    if (!bankDetails.bankName) {
      setError('Please select a bank');
      return;
    }

    const result = await paymentService.generateUSSDCode(
      safeLesson.price || 0,
      bankDetails.bankName
    );

    if (result.status === 'success') {
      setPaymentData(result.data);
      setStep('ussd_instructions');
    } else {
      throw new Error(result.message);
    }
  };

  const handleMobileMoneyPayment = async () => {
    if (!bankDetails.phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    if (!bankDetails.bankName) {
      setError('Please select a mobile money provider');
      return;
    }

    setStep('processing');
    
    const result = await paymentService.initializeMobileMoneyPayment(
      bankDetails.phoneNumber,
      safeLesson.price || 0,
      bankDetails.bankName
    );

    if (result.status === 'success') {
      setPaymentData(result.data);
      setStep('mobile_money_pending');
    } else {
      throw new Error(result.message);
    }
  };

  const completePayment = async (reference, gateway) => {
    try {
      // Process payment in storage
      await processLessonPayment(
        currentUser.id,
        safeCourse.teacherId,
        safeCourse.key,
        safeLesson.id,
        safeLesson.price || 0
      );

      // Record purchase
      await purchaseLesson(currentUser.id, safeCourse.key, safeLesson.id, safeLesson.price || 0);

      setStep('success');
      
      // Notify parent component
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Payment completion error:', error);
      setError('Failed to complete payment processing');
      setStep('error');
    }
  };

  const handleConfirmTransfer = async () => {
    setLoading(true);
    try {
      // Simulate waiting for bank transfer confirmation
      setTimeout(async () => {
        await completePayment(paymentData.virtual_account, 'bank_transfer');
        setLoading(false);
      }, 5000);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'select':
        return (
          <div className="payment-methods">
            <h3>Select Payment Method</h3>
            <div className="methods-grid">
              {paymentMethods.map(method => (
                <div
                  key={method.id}
                  className={`method-card ${selectedMethod === method.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className="method-icon">{method.icon}</div>
                  <div className="method-info">
                    <h4>{method.name}</h4>
                    <p>{method.description}</p>
                    <div className="method-supports">
                      {method.supports.map(support => (
                        <span key={support} className="support-tag">{support}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Details Form */}
            {(selectedMethod === 'bank_transfer' || selectedMethod === 'ussd' || selectedMethod === 'mobile_money') && (
              <div className="payment-details-form">
                <h4>Payment Details</h4>
                
                {(selectedMethod === 'bank_transfer' || selectedMethod === 'ussd') && (
                  <div className="form-group">
                    <label>Select Bank:</label>
                    <select
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                    >
                      <option value="">Choose your bank</option>
                      {paymentConfig.supportedBanks.map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedMethod === 'mobile_money' && (
                  <>
                    <div className="form-group">
                      <label>Mobile Money Provider:</label>
                      <select
                        value={bankDetails.bankName}
                        onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                      >
                        <option value="">Choose provider</option>
                        {paymentConfig.supportedMobileMoney.map(provider => (
                          <option key={provider} value={provider}>{provider}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Phone Number:</label>
                      <input
                        type="tel"
                        placeholder="08012345678"
                        value={bankDetails.phoneNumber}
                        onChange={(e) => setBankDetails({...bankDetails, phoneNumber: e.target.value})}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="payment-summary">
              <h4>Order Summary</h4>
              <div className="summary-item">
                <span>Lesson:</span>
                <span>{safeLesson.title || 'Untitled Lesson'}</span> {/* SAFETY CHECK */}
              </div>
              <div className="summary-item">
                <span>Course:</span>
                <span>{safeCourse.title || 'Untitled Course'}</span> {/* SAFETY CHECK */}
              </div>
              <div className="summary-item total">
                <span>Total:</span>
                <span>₦{(safeLesson.price || 0).toLocaleString()}</span> {/* SAFETY CHECK */}
              </div>
            </div>

            <button 
              className="pay-now-btn"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Pay ₦${(safeLesson.price || 0).toLocaleString()}`} {/* SAFETY CHECK */}
            </button>
          </div>
        );

      case 'processing':
        return (
          <div className="payment-processing">
            <div className="processing-spinner"></div>
            <h3>Processing Payment...</h3>
            <p>Please wait while we process your payment</p>
            {paymentData?.authorization_url && (
              <div className="redirect-notice">
                <p>You will be redirected to complete your payment</p>
              </div>
            )}
          </div>
        );

      case 'transfer_details':
        return (
          <div className="transfer-details">
            <h3>Bank Transfer Instructions</h3>
            <div className="transfer-info">
              <div className="info-item">
                <label>Bank Name:</label>
                <span>{paymentData.bank_name}</span>
              </div>
              <div className="info-item">
                <label>Account Number:</label>
                <span className="account-number">{paymentData.virtual_account}</span>
              </div>
              <div className="info-item">
                <label>Account Name:</label>
                <span>{paymentData.account_name}</span>
              </div>
              <div className="info-item">
                <label>Amount:</label>
                <span>₦{(paymentData.amount || 0).toLocaleString()}</span> {/* SAFETY CHECK */}
              </div>
            </div>
            
            <div className="instructions">
              <h4>Instructions:</h4>
              <ol>
                <li>Transfer exactly ₦{(paymentData.amount || 0).toLocaleString()} to the account above</li> {/* SAFETY CHECK */}
                <li>Use your name as transfer reference</li>
                <li>Payment will be confirmed automatically within 24 hours</li>
              </ol>
            </div>

            <div className="action-buttons">
              <button 
                className="confirm-transfer-btn"
                onClick={handleConfirmTransfer}
                disabled={loading}
              >
                {loading ? 'Waiting for transfer...' : 'I have made the transfer'}
              </button>
              <button 
                className="back-btn"
                onClick={() => setStep('select')}
              >
                Back to Payment Methods
              </button>
            </div>
          </div>
        );

      case 'ussd_instructions':
        return (
          <div className="ussd-instructions">
            <h3>USSD Payment</h3>
            <div className="ussd-code">
              <h4>Dial this code on your phone:</h4>
              <div className="code-display">{paymentData.ussd_code}</div>
            </div>
            <div className="instructions">
              <p>{paymentData.instructions}</p>
              <ol>
                <li>Dial {paymentData.ussd_code} on your phone</li>
                <li>Follow the prompts to complete payment</li>
                <li>Return here after successful payment</li>
              </ol>
            </div>

            <div className="action-buttons">
              <button 
                className="confirm-payment-btn"
                onClick={() => completePayment(`ussd_${Date.now()}`, 'ussd')}
              >
                I have completed the payment
              </button>
              <button 
                className="back-btn"
                onClick={() => setStep('select')}
              >
                Back to Payment Methods
              </button>
            </div>
          </div>
        );

      case 'mobile_money_pending':
        return (
          <div className="mobile-money-pending">
            <h3>Mobile Money Payment</h3>
            <div className="pending-info">
              <p>Payment request sent to {bankDetails.phoneNumber}</p>
              <p>Please check your {bankDetails.bankName} app to approve the payment</p>
            </div>
            
            <div className="action-buttons">
              <button 
                className="confirm-payment-btn"
                onClick={() => completePayment(paymentData.transaction_id, 'mobile_money')}
              >
                I have approved the payment
              </button>
              <button 
                className="back-btn"
                onClick={() => setStep('select')}
              >
                Try another method
              </button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="payment-success">
            <div className="success-icon">✅</div>
            <h3>Payment Successful!</h3>
            <p>You now have access to "{safeLesson.title || 'the lesson'}"</p> {/* SAFETY CHECK */}
            <button className="close-btn" onClick={onClose}>
              Start Learning
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="payment-error">
            <div className="error-icon">❌</div>
            <h3>Payment Failed</h3>
            <p>{error || 'Something went wrong with your payment'}</p>
            <div className="action-buttons">
              <button className="retry-btn" onClick={() => setStep('select')}>
                Try Again
              </button>
              <button className="close-btn" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Don't render if no lesson data
  if (!lesson) {
    return null;
  }

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="modal-header">
          <h2>Purchase Lesson</h2>
          {step === 'select' && (
            <button className="close-button" onClick={onClose}>×</button>
          )}
        </div>
        
        <div className="modal-body">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;