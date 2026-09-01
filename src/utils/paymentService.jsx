// utils/paymentService.js

// Simulated payment gateway service for Nigerian banks and mobile money
export const paymentService = {
  // Initialize payment with Paystack (supports Nigerian banks and mobile money)
  async initializePaystackPayment(email, amount, metadata = {}) {
    try {
      console.log('Initializing Paystack payment:', { email, amount, metadata });

      const paymentData = {
        reference: `paystack_${Date.now()}`,
        amount: amount * 100, // Paystack expects amount in kobo
        email: email,
        currency: 'NGN',
        metadata: metadata,
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money']
      };

      return new Promise((resolve) => {
        setTimeout(() => {
          const response = {
            status: true,
            message: 'Authorization URL created',
            data: {
              authorization_url: `https://paystack.com/pay/${paymentData.reference}`,
              access_code: `access_${paymentData.reference}`,
              reference: paymentData.reference
            }
          };
          resolve(response);
        }, 1000);
      });
    } catch (error) {
      console.error('Paystack initialization error:', error);
      throw new Error('Failed to initialize payment');
    }
  },

  // Verify Paystack payment
  async verifyPaystackPayment(reference) {
    try {
      console.log('Verifying Paystack payment:', reference);

      return new Promise((resolve) => {
        setTimeout(() => {
          const isSuccess = Math.random() > 0.2;

          if (isSuccess) {
            resolve({
              status: true,
              message: 'Verification successful',
              data: {
                status: 'success',
                reference: reference,
                amount: 5000,
                gateway_response: 'Approved',
                paid_at: new Date().toISOString()
              }
            });
          } else {
            resolve({
              status: false,
              message: 'Payment verification failed'
            });
          }
        }, 1500);
      });
    } catch (error) {
      console.error('Paystack verification error:', error);
      throw new Error('Payment verification failed');
    }
  },

  // Initialize Flutterwave payment
  async initializeFlutterwavePayment(email, amount, metadata = {}) {
    try {
      console.log('Initializing Flutterwave payment:', { email, amount, metadata });

      const paymentData = {
        tx_ref: `flutterwave_${Date.now()}`,
        amount: amount,
        currency: 'NGN',
        payment_options: 'card,account,ussd,banktransfer,mobilemoneyghana',
        redirect_url: `${window.location.origin}/payment-callback`,
        customer: {
          email: email,
        },
        meta: metadata,
        customizations: {
          title: 'STEM Learning Platform',
          description: 'Lesson Purchase'
        }
      };

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            status: 'success',
            message: 'Payment initialized',
            data: {
              link: `https://flutterwave.com/pay/${paymentData.tx_ref}`
            }
          });
        }, 1000);
      });
    } catch (error) {
      console.error('Flutterwave initialization error:', error);
      throw new Error('Failed to initialize payment');
    }
  },

  // Direct bank transfer simulation
  async initializeDirectBankTransfer(amount, bankDetails) {
    try {
      console.log('Initializing direct bank transfer:', { amount, bankDetails });

      const virtualAccount = `70${Math.random().toString().substr(2, 8)}`;

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            status: 'success',
            message: 'Virtual account generated',
            data: {
              virtual_account: virtualAccount,
              bank_name: bankDetails.bankName,
              account_name: 'STEM Learning Platform',
              amount: amount,
              expires_in: '24 hours'
            }
          });
        }, 1000);
      });
    } catch (error) {
      console.error('Bank transfer initialization error:', error);
      throw new Error('Failed to generate virtual account');
    }
  },

  // USSD payment simulation
  async generateUSSDCode(amount, bankCode) {
    try {
      console.log('Generating USSD code:', { amount, bankCode });

      const banks = {
        'OPAY': '*955*',
        'PALMPAY': '*933*',
        'GTB': '*737*',
        'ZENITH': '*966*',
        'ACCESS': '*901*'
      };

      const ussdPrefix = banks[bankCode] || '*322*';
      const transactionAmount = Math.floor(amount);
      const ussdCode = `${ussdPrefix}${transactionAmount}#`;

      return {
        status: 'success',
        data: {
          ussd_code: ussdCode,
          bank: bankCode,
          amount: amount,
          instructions: `Dial ${ussdCode} on your phone to complete payment`
        }
      };
    } catch (error) {
      console.error('USSD generation error:', error);
      throw new Error('Failed to generate USSD code');
    }
  },

  // Mobile money payment
  async initializeMobileMoneyPayment(phoneNumber, amount, provider) {
    try {
      console.log('Initializing mobile money payment:', { phoneNumber, amount, provider });

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            status: 'success',
            message: `Payment request sent to ${phoneNumber}`,
            data: {
              provider: provider,
              phone_number: phoneNumber,
              amount: amount,
              transaction_id: `mm_${Date.now()}`,
              instructions: `Check your ${provider} app to approve the payment`
            }
          });
        }, 1000);
      });
    } catch (error) {
      console.error('Mobile money initialization error:', error);
      throw new Error('Failed to initialize mobile money payment');
    }
  },

  // Process payment for a lesson
  async processLessonPayment(userId, courseKey, lessonId, lessonPrice, paymentMethod = 'paystack') {
    try {
      // Get user email and details - FIXED to use correct localStorage key
      const user = JSON.parse(localStorage.getItem('hausaStem_currentUser') || '{}');
      
      if (!user.email) {
        throw new Error('User email not found');
      }

      // Create metadata with lesson info
      const metadata = {
        userId: userId,
        courseKey: courseKey,
        lessonId: lessonId,
        type: 'lesson_purchase',
        platform: 'STEM Learning Platform'
      };

      // Initialize payment based on method
      let paymentResult;
      
      switch (paymentMethod) {
        case 'paystack':
          paymentResult = await this.initializePaystackPayment(
            user.email, 
            lessonPrice, 
            metadata
          );
          break;
        case 'flutterwave':
          paymentResult = await this.initializeFlutterwavePayment(
            user.email, 
            lessonPrice, 
            metadata
          );
          break;
        default:
          throw new Error('Unsupported payment method');
      }

      // Save pending transaction
      this.savePendingTransaction({
        userId: userId,
        courseKey: courseKey,
        lessonId: lessonId,
        amount: lessonPrice,
        paymentMethod: paymentMethod,
        reference: paymentResult.data.reference || paymentResult.data.tx_ref,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      return paymentResult;
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  },

  // Save pending transaction to storage - FIXED to use consistent key
  savePendingTransaction(transaction) {
    try {
      const transactions = JSON.parse(localStorage.getItem('hausaStem_transactions') || '[]');
      transactions.push(transaction);
      localStorage.setItem('hausaStem_transactions', JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  },

  // Get user's transaction history - FIXED to use consistent key
  getUserTransactions(userId) {
    try {
      const allTransactions = JSON.parse(localStorage.getItem('hausaStem_transactions') || '[]');
      return allTransactions.filter(t => t.userId === userId);
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  },

  // Update transaction status - FIXED to use consistent key
  updateTransactionStatus(reference, status, paymentData = {}) {
    try {
      const transactions = JSON.parse(localStorage.getItem('hausaStem_transactions') || '[]');
      const index = transactions.findIndex(t => t.reference === reference);
      
      if (index !== -1) {
        transactions[index].status = status;
        transactions[index].paymentData = paymentData;
        transactions[index].updatedAt = new Date().toISOString();
        localStorage.setItem('hausaStem_transactions', JSON.stringify(transactions));
        return transactions[index];
      }
      return null;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return null;
    }
  },

  // Get all transactions (for admin/teacher)
  getAllTransactions() {
    try {
      return JSON.parse(localStorage.getItem('hausaStem_transactions') || '[]');
    } catch (error) {
      console.error('Error getting all transactions:', error);
      return [];
    }
  },

  // Get teacher's earnings summary
  getTeacherEarningsSummary(teacherId) {
    try {
      const transactions = this.getUserTransactions(teacherId);
      const completedTransactions = transactions.filter(t => t.status === 'completed');
      
      const summary = {
        totalEarnings: completedTransactions.reduce((sum, t) => sum + t.amount, 0),
        totalTransactions: completedTransactions.length,
        pendingTransactions: transactions.filter(t => t.status === 'pending').length,
        failedTransactions: transactions.filter(t => t.status === 'failed').length,
        paymentMethods: {}
      };

      // Group by payment method
      completedTransactions.forEach(t => {
        const method = t.paymentMethod || 'unknown';
        summary.paymentMethods[method] = (summary.paymentMethods[method] || 0) + t.amount;
      });

      return summary;
    } catch (error) {
      console.error('Error getting teacher earnings:', error);
      return {
        totalEarnings: 0,
        totalTransactions: 0,
        pendingTransactions: 0,
        failedTransactions: 0,
        paymentMethods: {}
      };
    }
  }
};

// Payment gateway configuration
export const paymentConfig = {
  paystack: {
    publicKey: 'pk_test_your_paystack_public_key',
    secretKey: 'sk_test_your_paystack_secret_key'
  },
  flutterwave: {
    publicKey: 'FLWPUBK_TEST_your_flutterwave_public_key',
    secretKey: 'FLWSECK_TEST_your_flutterwave_secret_key'
  },
  supportedBanks: [
    'OPAY', 'PALMPAY', 'GTB', 'ZENITH', 'ACCESS', 'UBA', 
    'FIDELITY', 'FIRSTBANK', 'STERLING', 'UNION'
  ],
  supportedMobileMoney: ['OPAY', 'PALMPAY', 'CARBON', 'KUDA']
};

export default paymentService;