// utils/teacherPaymentService.js

import { 
  db,
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  addDoc,
  increment,
  doc
} from 'firebase/firestore';
import { getCurrentUser, getUserData, updateUserData } from './storage';

// ============================================
// TEACHER PAYMENT SERVICE - Firebase Integration
// ============================================

/**
 * Process payment for a teacher's lesson
 * @param {Object} paymentData - Payment data from gateway
 * @param {Object} lesson - Lesson object
 * @param {Object} student - Student user object
 * @param {number} platformFeePercentage - Platform fee percentage (default: 20)
 * @returns {Promise<Object>} - Transaction result
 */
export const processTeacherPayment = async (paymentData, lesson, student, platformFeePercentage = 20) => {
  try {
    // 1. Find the teacher who owns this lesson
    const teacher = await findLessonTeacher(lesson.id);
    if (!teacher) {
      console.error('❌ No teacher found for lesson:', lesson.id);
      return { success: false, error: 'Teacher not found' };
    }

    // 2. Calculate platform fee and teacher earnings
    const platformFee = (paymentData.amount * platformFeePercentage) / 100;
    const teacherEarnings = paymentData.amount - platformFee;

    // 3. Create transaction record
    const transaction = {
      id: `tx_${Date.now()}`,
      amount: paymentData.amount,
      teacherEarnings: teacherEarnings,
      platformFee: platformFee,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      courseId: lesson.courseId || 'unknown',
      teacherId: teacher.id,
      teacherName: teacher.name,
      studentId: student.id,
      studentName: student.name || student.displayName || 'Student',
      studentEmail: student.email,
      paymentGateway: paymentData.gateway || 'paystack',
      paymentId: paymentData.paymentId || paymentData.reference,
      paymentReference: paymentData.reference || paymentData.paymentId,
      date: new Date().toISOString(),
      status: 'completed',
      payoutStatus: teacher.bankAccount?.isVerified ? 'pending_payout' : 'held_no_bank',
      metadata: paymentData.metadata || {}
    };

    // 4. Save transaction to Firestore
    await saveTransaction(transaction);

    // 5. Update teacher's earnings
    await updateTeacherEarnings(teacher.id, transaction);

    // 6. Update lesson purchase count
    await updateLessonPurchaseCount(lesson.id);

    // 7. Record student purchase
    await recordStudentPurchase(student.id, lesson.id, transaction.id);

    // 8. Initiate payout to teacher's bank account (if bank account exists)
    let payoutResult = null;
    if (teacher.bankAccount && teacher.bankAccount.isVerified) {
      payoutResult = await initiateTeacherPayout(teacher.id, teacherEarnings, transaction.id, teacher.bankAccount);
    }

    // 9. Record platform earnings
    await recordPlatformEarnings(platformFee, transaction.id);

    console.log('✅ Teacher payment processed successfully:', transaction.id);
    return {
      success: true,
      transaction: transaction,
      payoutResult: payoutResult,
      teacherEarnings: teacherEarnings,
      platformFee: platformFee
    };

  } catch (error) {
    console.error('❌ Error processing teacher payment:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Find the teacher who owns a lesson
 */
const findLessonTeacher = async (lessonId) => {
  try {
    // Get lesson from Firestore
    const lessonRef = doc(db, 'lessons', lessonId);
    const lessonDoc = await getDoc(lessonRef);
    
    if (!lessonDoc.exists()) {
      console.error('❌ Lesson not found:', lessonId);
      return null;
    }
    
    const lessonData = lessonDoc.data();
    const courseId = lessonData.courseId;
    
    if (!courseId) {
      console.error('❌ Course ID not found for lesson:', lessonId);
      return null;
    }
    
    // Get course to find teacher
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      console.error('❌ Course not found:', courseId);
      return null;
    }
    
    const courseData = courseDoc.data();
    const teacherId = courseData.teacherId;
    
    if (!teacherId) {
      console.error('❌ Teacher ID not found for course:', courseId);
      return null;
    }
    
    // Get teacher user data
    const teacherData = await getUserData(teacherId);
    if (!teacherData) {
      console.error('❌ Teacher not found:', teacherId);
      return null;
    }
    
    // Get teacher's bank account info
    const bankAccount = await getTeacherBankAccount(teacherId);
    
    return {
      id: teacherId,
      name: teacherData.name || teacherData.displayName || 'Teacher',
      email: teacherData.email,
      bankAccount: bankAccount,
      earnings: await getTeacherEarnings(teacherId)
    };
  } catch (error) {
    console.error('❌ Error finding lesson teacher:', error);
    return null;
  }
};

/**
 * Get teacher's bank account from Firestore
 */
const getTeacherBankAccount = async (teacherId) => {
  try {
    const bankRef = doc(db, 'teacherBankAccounts', teacherId);
    const bankDoc = await getDoc(bankRef);
    
    if (bankDoc.exists()) {
      return bankDoc.data();
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting teacher bank account:', error);
    return null;
  }
};

/**
 * Save teacher's bank account
 */
export const saveTeacherBankAccount = async (teacherId, bankData) => {
  try {
    const bankRef = doc(db, 'teacherBankAccounts', teacherId);
    await setDoc(bankRef, {
      ...bankData,
      teacherId: teacherId,
      isVerified: bankData.isVerified || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('❌ Error saving teacher bank account:', error);
    throw error;
  }
};

/**
 * Save transaction to Firestore
 */
const saveTransaction = async (transaction) => {
  try {
    const transactionsRef = collection(db, 'transactions');
    await addDoc(transactionsRef, {
      ...transaction,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('❌ Error saving transaction:', error);
    throw error;
  }
};

/**
 * Update teacher's earnings in Firestore
 */
const updateTeacherEarnings = async (teacherId, transaction) => {
  try {
    const earningsRef = doc(db, 'teacherEarnings', teacherId);
    const earningsDoc = await getDoc(earningsRef);
    
    let earningsData = {
      teacherId: teacherId,
      totalEarnings: 0,
      pendingPayout: 0,
      paidOut: 0,
      transactions: [],
      updatedAt: new Date().toISOString()
    };
    
    if (earningsDoc.exists()) {
      earningsData = earningsDoc.data();
    }
    
    // Update earnings
    earningsData.totalEarnings += transaction.teacherEarnings;
    earningsData.pendingPayout += transaction.teacherEarnings;
    earningsData.transactions.unshift(transaction.id);
    
    await setDoc(earningsRef, earningsData, { merge: true });
    
    // Also update teacher's profile with earnings summary
    await updateUserData(teacherId, {
      totalEarnings: earningsData.totalEarnings,
      pendingPayout: earningsData.pendingPayout,
      lastEarningDate: new Date().toISOString()
    });
    
    console.log('✅ Teacher earnings updated:', teacherId);
    return true;
  } catch (error) {
    console.error('❌ Error updating teacher earnings:', error);
    throw error;
  }
};

/**
 * Update lesson purchase count
 */
const updateLessonPurchaseCount = async (lessonId) => {
  try {
    const lessonRef = doc(db, 'lessons', lessonId);
    await updateDoc(lessonRef, {
      purchaseCount: increment(1),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('❌ Error updating lesson purchase count:', error);
    // Non-critical, continue
    return false;
  }
};

/**
 * Record student purchase
 */
const recordStudentPurchase = async (studentId, lessonId, transactionId) => {
  try {
    const studentRef = doc(db, 'users', studentId);
    await updateDoc(studentRef, {
      purchasedLessons: arrayUnion({
        lessonId: lessonId,
        transactionId: transactionId,
        purchasedAt: new Date().toISOString()
      })
    });
    return true;
  } catch (error) {
    console.error('❌ Error recording student purchase:', error);
    return false;
  }
};

/**
 * Initiate payout to teacher's bank account
 */
const initiateTeacherPayout = async (teacherId, amount, transactionId, bankAccount) => {
  try {
    // In production, this would call payment gateway APIs:
    // - Paystack Transfer API
    // - Flutterwave Payout API
    // - Monnify Disbursement API
    
    console.log(`💸 Initiating payout of ₦${amount} to teacher ${teacherId}`);
    console.log(`🏦 Bank: ${bankAccount.bankName}, Account: ${bankAccount.accountNumber}`);
    
    // Simulate API call
    const payoutResult = await simulatePayoutAPI(teacherId, amount, bankAccount);
    
    if (payoutResult.success) {
      // Update teacher's pending payout
      const earningsRef = doc(db, 'teacherEarnings', teacherId);
      const earningsDoc = await getDoc(earningsRef);
      
      if (earningsDoc.exists()) {
        const earningsData = earningsDoc.data();
        earningsData.pendingPayout = Math.max(0, (earningsData.pendingPayout || 0) - amount);
        earningsData.paidOut = (earningsData.paidOut || 0) + amount;
        await setDoc(earningsRef, earningsData, { merge: true });
      }
      
      // Record payout transaction
      await saveTransaction({
        id: `payout_${Date.now()}`,
        type: 'payout',
        teacherId: teacherId,
        amount: amount,
        bankAccount: bankAccount,
        transactionId: transactionId,
        status: 'completed',
        date: new Date().toISOString()
      });
    }
    
    return payoutResult;
  } catch (error) {
    console.error('❌ Error initiating teacher payout:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Simulate payout API call
 */
const simulatePayoutAPI = async (teacherId, amount, bankAccount) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate 90% success rate
      const isSuccess = Math.random() > 0.1;
      resolve({
        success: isSuccess,
        message: isSuccess ? 'Payout completed successfully' : 'Payout failed due to bank processing error',
        reference: `payout_${Date.now()}`,
        amount: amount,
        bankAccount: bankAccount
      });
    }, 1500);
  });
};

/**
 * Record platform earnings
 */
const recordPlatformEarnings = async (amount, transactionId) => {
  try {
    const platformRef = doc(db, 'platformEarnings', 'summary');
    const platformDoc = await getDoc(platformRef);
    
    let platformData = {
      totalEarnings: 0,
      totalTransactions: 0,
      transactions: []
    };
    
    if (platformDoc.exists()) {
      platformData = platformDoc.data();
    }
    
    platformData.totalEarnings += amount;
    platformData.totalTransactions += 1;
    platformData.transactions.push({
      amount: amount,
      transactionId: transactionId,
      date: new Date().toISOString()
    });
    
    await setDoc(platformRef, platformData, { merge: true });
    
    console.log('✅ Platform earnings recorded:', amount);
    return true;
  } catch (error) {
    console.error('❌ Error recording platform earnings:', error);
    // Non-critical, continue
    return false;
  }
};

// ============================================
// PUBLIC API FUNCTIONS
// ============================================

/**
 * Get teacher's earnings summary
 */
export const getTeacherEarnings = async (teacherId) => {
  try {
    const earningsRef = doc(db, 'teacherEarnings', teacherId);
    const earningsDoc = await getDoc(earningsRef);
    
    if (earningsDoc.exists()) {
      return earningsDoc.data();
    }
    
    return {
      teacherId: teacherId,
      totalEarnings: 0,
      pendingPayout: 0,
      paidOut: 0,
      transactions: []
    };
  } catch (error) {
    console.error('❌ Error getting teacher earnings:', error);
    return {
      totalEarnings: 0,
      pendingPayout: 0,
      paidOut: 0,
      transactions: []
    };
  }
};

/**
 * Get platform earnings summary
 */
export const getPlatformEarnings = async () => {
  try {
    const platformRef = doc(db, 'platformEarnings', 'summary');
    const platformDoc = await getDoc(platformRef);
    
    if (platformDoc.exists()) {
      return platformDoc.data();
    }
    
    return {
      totalEarnings: 0,
      totalTransactions: 0,
      transactions: []
    };
  } catch (error) {
    console.error('❌ Error getting platform earnings:', error);
    return {
      totalEarnings: 0,
      totalTransactions: 0,
      transactions: []
    };
  }
};

/**
 * Get teacher's transactions
 */
export const getTeacherTransactions = async (teacherId) => {
  try {
    const transactionsRef = collection(db, 'transactions');
    const q = query(transactionsRef, where('teacherId', '==', teacherId));
    const querySnapshot = await getDocs(q);
    
    const transactions = [];
    querySnapshot.forEach(doc => {
      transactions.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    return transactions;
  } catch (error) {
    console.error('❌ Error getting teacher transactions:', error);
    return [];
  }
};

/**
 * Get all transactions (admin only)
 */
export const getAllTransactions = async () => {
  try {
    const transactionsRef = collection(db, 'transactions');
    const querySnapshot = await getDocs(transactionsRef);
    
    const transactions = [];
    querySnapshot.forEach(doc => {
      transactions.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    return transactions;
  } catch (error) {
    console.error('❌ Error getting all transactions:', error);
    return [];
  }
};

/**
 * Process pending payouts (cron job)
 */
export const processPendingPayouts = async () => {
  try {
    // Get all teachers with pending payouts
    const teachersRef = collection(db, 'teacherEarnings');
    const querySnapshot = await getDocs(teachersRef);
    
    const results = [];
    for (const doc of querySnapshot.docs) {
      const earningsData = doc.data();
      if (earningsData.pendingPayout > 0) {
        const teacherId = doc.id;
        const bankAccount = await getTeacherBankAccount(teacherId);
        
        if (bankAccount && bankAccount.isVerified) {
          const result = await initiateTeacherPayout(
            teacherId,
            earningsData.pendingPayout,
            `batch_${Date.now()}`,
            bankAccount
          );
          results.push({ teacherId, result });
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ Error processing pending payouts:', error);
    return [];
  }
};

export default {
  processTeacherPayment,
  getTeacherEarnings,
  getPlatformEarnings,
  getTeacherTransactions,
  getAllTransactions,
  saveTeacherBankAccount,
  getTeacherBankAccount,
  processPendingPayouts
};
