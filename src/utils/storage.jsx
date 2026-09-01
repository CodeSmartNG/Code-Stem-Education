// src/utils/storage.jsx

import { 
  auth, 
  db,
  getCurrentUser as firebaseGetCurrentUser,
  getUserData,
  updateUserData,
  saveCourse,
  getCourses,
  saveLesson,
  getLessons,
  logoutUser as firebaseLogout,
  loginUser,
  registerUser as firebaseRegister,
  resendVerification
} from './firebase';
import { 
  doc, 
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
  serverTimestamp
} from 'firebase/firestore';





// ============================================
// USER MANAGEMENT FUNCTIONS (Firebase)
// ============================================

// ✅ Get current user
export const getCurrentUser = async () => {
  try {
    const firebaseUser = await firebaseGetCurrentUser();
    if (!firebaseUser) return null;
    
    const userData = await getUserData(firebaseUser.uid);
    return {
      id: firebaseUser.uid,
      ...firebaseUser,
      ...userData
    };
  } catch (error) {
    console.error('❌ Error getting current user:', error);
    return null;
  }
};

// ✅ Set current user (kept for compatibility)
export const setCurrentUser = (user) => {
  // Firebase handles this automatically via auth state
  return user;
};

// ✅ Get all users (from Firebase)
export const getUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    const users = {};
    querySnapshot.forEach(doc => {
      users[doc.id] = { id: doc.id, ...doc.data() };
    });
    return users;
  } catch (error) {
    console.error('❌ Error getting users:', error);
    return {};
  }
};

// ✅ Set users (kept for compatibility)
export const setUsers = (users) => {
  // Firebase handles this automatically
  return users;
};

// ✅ Register user
export const registerUser = async (userData) => {
  try {
    const result = await firebaseRegister(
      userData.email, 
      userData.password, 
      userData
    );
    return {
      user: result.userData,
      confirmationToken: 'email_verification_sent'
    };
  } catch (error) {
    console.error('❌ Error registering user:', error);
    throw error;
  }
};

// ✅ Authenticate user
export const authenticateUser = async (email, password) => {
  try {
    const user = await loginUser(email, password);
    return {
      id: user.uid,
      ...user
    };
  } catch (error) {
    console.error('❌ Error authenticating user:', error);
    throw error;
  }
};

// ✅ Logout user
export const logoutUser = async () => {
  try {
    await firebaseLogout();
    return true;
  } catch (error) {
    console.error('❌ Error logging out:', error);
    return false;
  }
};

// ✅ Confirm user email
export const confirmUserEmail = async (token) => {
  // Firebase handles email confirmation via the verification link
  // This is a placeholder for the email confirmation flow
  try {
    // The actual confirmation is handled by Firebase's email verification
    return { success: true };
  } catch (error) {
    console.error('❌ Error confirming email:', error);
    throw error;
  }
};

// ✅ Resend email confirmation
export const resendEmailConfirmation = async (email) => {
  try {
    await resendVerification();
    return { success: true };
  } catch (error) {
    console.error('❌ Error resending confirmation:', error);
    throw error;
  }
};

// ============================================
// STUDENT MANAGEMENT FUNCTIONS
// ============================================

// ✅ Get students
export const getStudents = async () => {
  try {
    const users = await getUsers();
    const students = [];
    Object.values(users).forEach(user => {
      if (user.role === 'student') {
        students.push(user);
      }
    });
    return students;
  } catch (error) {
    console.error('❌ Error getting students:', error);
    return [];
  }
};

// ✅ Update student
export const updateStudent = async (student) => {
  try {
    if (!student || !student.id) {
      throw new Error('Valid student object required');
    }
    await updateUserData(student.id, student);
    return student;
  } catch (error) {
    console.error('❌ Error updating student:', error);
    throw error;
  }
};

// ============================================
// TEACHER MANAGEMENT FUNCTIONS
// ============================================

// ✅ Get teacher courses
export const getTeacherCourses = async (teacherId) => {
  try {
    if (!teacherId) {
      console.warn('⚠️ No teacher ID provided for getTeacherCourses');
      return {};
    }
    
    const courses = await getCourses(teacherId);
    const teacherCourses = {};
    courses.forEach(course => {
      teacherCourses[course.id] = course;
    });
    return teacherCourses;
  } catch (error) {
    console.error('❌ Error getting teacher courses:', error);
    return {};
  }
};

// ✅ Add new course
export const addNewCourse = async (courseData) => {
  try {
    const courseId = await saveCourse(courseData);
    return { id: courseId, ...courseData };
  } catch (error) {
    console.error('❌ Error adding course:', error);
    throw error;
  }
};

// ✅ Update course
export const updateCourse = async (courseKey, updateData) => {
  try {
    const docRef = doc(db, 'courses', courseKey);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    return { id: courseKey, ...updateData };
  } catch (error) {
    console.error('❌ Error updating course:', error);
    throw error;
  }
};

// ✅ Delete course
export const deleteCourse = async (courseKey) => {
  try {
    await deleteDoc(doc(db, 'courses', courseKey));
    return true;
  } catch (error) {
    console.error('❌ Error deleting course:', error);
    throw error;
  }
};

// ✅ Get teacher stats
export const getTeacherStats = async (teacherId) => {
  try {
    if (!teacherId) {
      console.warn('⚠️ No teacher ID provided for getTeacherStats');
      return {
        totalCourses: 0,
        totalLessons: 0,
        totalStudents: 0
      };
    }
    
    const courses = await getTeacherCourses(teacherId);
    const students = await getStudents();
    let totalStudents = 0;
    let totalLessons = 0;
    
    Object.values(courses).forEach(course => {
      totalLessons += (course.lessons?.length || 0);
      if (course.enrolledStudents) {
        totalStudents += course.enrolledStudents.length;
      }
    });
    
    return {
      totalCourses: Object.keys(courses).length,
      totalLessons: totalLessons,
      totalStudents: totalStudents
    };
  } catch (error) {
    console.error('❌ Error getting teacher stats:', error);
    return {
      totalCourses: 0,
      totalLessons: 0,
      totalStudents: 0
    };
  }
};

// ============================================
// LESSON MANAGEMENT FUNCTIONS
// ============================================

// ✅ Add lesson to course
export const addLessonToCourse = async (courseKey, lessonData) => {
  try {
    const lessonId = await saveLesson(courseKey, lessonData);
    return { id: lessonId, ...lessonData };
  } catch (error) {
    console.error('❌ Error adding lesson:', error);
    throw error;
  }
};

// ✅ Update lesson
export const updateLesson = async (courseKey, lessonId, updateData) => {
  try {
    const docRef = doc(db, 'lessons', lessonId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    return { id: lessonId, ...updateData };
  } catch (error) {
    console.error('❌ Error updating lesson:', error);
    throw error;
  }
};

// ✅ Delete lesson
export const deleteLesson = async (courseKey, lessonId) => {
  try {
    await deleteDoc(doc(db, 'lessons', lessonId));
    return true;
  } catch (error) {
    console.error('❌ Error deleting lesson:', error);
    throw error;
  }
};

// ✅ Get lessons for a course
export const getLessonsForCourse = async (courseId) => {
  try {
    return await getLessons(courseId);
  } catch (error) {
    console.error('❌ Error getting lessons:', error);
    return [];
  }
};

// ============================================
// MULTIMEDIA MANAGEMENT FUNCTIONS
// ============================================

// ✅ Add multimedia to lesson
export const addMultimediaToLesson = async (courseKey, lessonId, multimediaData) => {
  try {
    const docRef = doc(db, 'lessons', lessonId);
    await updateDoc(docRef, {
      multimedia: arrayUnion({
        id: `media_${Date.now()}`,
        ...multimediaData,
        createdAt: new Date().toISOString()
      })
    });
    return multimediaData;
  } catch (error) {
    console.error('❌ Error adding multimedia:', error);
    throw error;
  }
};

// ✅ Delete multimedia from lesson
export const deleteMultimediaFromLesson = async (courseKey, lessonId, multimediaId) => {
  try {
    const docRef = doc(db, 'lessons', lessonId);
    // Get the lesson first to find the multimedia item
    const lessonDoc = await getDoc(docRef);
    if (!lessonDoc.exists()) {
      throw new Error('Lesson not found');
    }
    const lessonData = lessonDoc.data();
    const multimedia = lessonData.multimedia || [];
    const itemToRemove = multimedia.find(m => m.id === multimediaId);
    
    if (!itemToRemove) {
      throw new Error('Multimedia not found');
    }
    
    await updateDoc(docRef, {
      multimedia: arrayRemove(itemToRemove)
    });
    return true;
  } catch (error) {
    console.error('❌ Error deleting multimedia:', error);
    throw error;
  }
};

// ============================================
// WALLET & PAYMENT FUNCTIONS
// ============================================

// ✅ Get teacher wallet
export const getTeacherWallet = async (teacherId) => {
  try {
    if (!teacherId) {
      console.warn('⚠️ No teacher ID provided for getTeacherWallet');
      return {
        balance: 0,
        totalEarnings: 0,
        pendingWithdrawals: 0,
        transactions: []
      };
    }
    
    const docRef = doc(db, 'wallets', teacherId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    
    // Create default wallet if it doesn't exist
    const defaultWallet = {
      balance: 0,
      totalEarnings: 0,
      pendingWithdrawals: 0,
      transactions: [],
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, defaultWallet);
    return defaultWallet;
  } catch (error) {
    console.error('❌ Error getting teacher wallet:', error);
    return {
      balance: 0,
      totalEarnings: 0,
      pendingWithdrawals: 0,
      transactions: []
    };
  }
};

// ✅ Update teacher wallet
export const updateTeacherWallet = async (teacherId, walletData) => {
  try {
    if (!teacherId) {
      throw new Error('Teacher ID is required');
    }
    
    const docRef = doc(db, 'wallets', teacherId);
    await setDoc(docRef, {
      ...walletData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    return walletData;
  } catch (error) {
    console.error('❌ Error updating teacher wallet:', error);
    throw error;
  }
};

// ✅ Withdraw from wallet
export const withdrawFromWallet = async (teacherId, amount, bankDetails) => {
  try {
    if (!teacherId) {
      throw new Error('Teacher ID is required');
    }
    
    const wallet = await getTeacherWallet(teacherId);
    
    if (amount > wallet.balance) {
      throw new Error('Insufficient balance');
    }
    
    if (amount < 100) {
      throw new Error('Minimum withdrawal is ₦100');
    }
    
    // Create withdrawal transaction
    const withdrawal = {
      type: 'withdrawal',
      amount: -amount,
      description: `Withdrawal to ${bankDetails.bankName} - ${bankDetails.accountNumber}`,
      date: new Date().toISOString(),
      bankDetails: bankDetails,
      status: 'pending'
    };
    
    wallet.transactions = wallet.transactions || [];
    wallet.transactions.push(withdrawal);
    wallet.balance -= amount;
    wallet.pendingWithdrawals = (wallet.pendingWithdrawals || 0) + amount;
    
    const updatedWallet = await updateTeacherWallet(teacherId, wallet);
    console.log('✅ Withdrawal processed:', amount);
    return updatedWallet;
  } catch (error) {
    console.error('❌ Error processing withdrawal:', error);
    throw error;
  }
};

// ✅ Update teacher profile with WhatsApp
export const updateTeacherProfileWithWhatsApp = async (teacherId, data) => {
  try {
    if (!teacherId) {
      throw new Error('Teacher ID is required');
    }
    
    await updateUserData(teacherId, {
      whatsappNumber: data.whatsappNumber || '',
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Teacher profile updated with WhatsApp:', data.whatsappNumber);
    return { whatsappNumber: data.whatsappNumber };
  } catch (error) {
    console.error('❌ Error updating teacher profile:', error);
    throw error;
  }
};

// ✅ Get teacher WhatsApp URL
export const getTeacherWhatsAppUrl = (teacherId) => {
  // This is a synchronous function that returns a URL
  // WhatsApp URL is constructed from the teacher's phone number
  try {
    if (!teacherId) {
      console.warn('⚠️ No teacher ID provided');
      return '#';
    }
    
    // We'll get the actual number from Firebase when needed
    // For now, return a placeholder
    return `https://wa.me/${teacherId}`;
  } catch (error) {
    console.error('❌ Error getting WhatsApp URL:', error);
    return '#';
  }
};

// ✅ Get teacher WhatsApp number from Firebase
export const getTeacherWhatsAppNumber = async (teacherId) => {
  try {
    const userData = await getUserData(teacherId);
    return userData?.whatsappNumber || '';
  } catch (error) {
    console.error('❌ Error getting WhatsApp number:', error);
    return '';
  }
};

// ============================================
// LESSON ACCESS & PURCHASE FUNCTIONS
// ============================================

// ✅ Check if user can access lesson
export const canAccessLesson = async (userId, courseKey, lessonId) => {
  try {
    if (!userId || !courseKey || !lessonId) {
      return false;
    }
    
    const userData = await getUserData(userId);
    if (!userData) return false;
    
    const purchasedLessons = userData.purchasedLessons || [];
    return purchasedLessons.some(p => p.courseKey === courseKey && p.lessonId === lessonId);
  } catch (error) {
    console.error('❌ Error checking lesson access:', error);
    return false;
  }
};

// ✅ Purchase lesson
export const purchaseLesson = async (userId, courseKey, lessonId) => {
  try {
    if (!userId || !courseKey || !lessonId) {
      throw new Error('User ID, course key, and lesson ID are required');
    }
    
    const userData = await getUserData(userId);
    if (!userData) {
      throw new Error('User not found');
    }
    
    const purchasedLessons = userData.purchasedLessons || [];
    const alreadyPurchased = purchasedLessons.some(p => p.courseKey === courseKey && p.lessonId === lessonId);
    
    if (alreadyPurchased) {
      throw new Error('Lesson already purchased');
    }
    
    purchasedLessons.push({
      courseKey: courseKey,
      lessonId: lessonId,
      purchasedAt: new Date().toISOString()
    });
    
    await updateUserData(userId, {
      purchasedLessons: purchasedLessons
    });
    
    console.log('✅ Lesson purchased:', lessonId);
    return true;
  } catch (error) {
    console.error('❌ Error purchasing lesson:', error);
    throw error;
  }
};

// ============================================
// STORAGE INITIALIZATION
// ============================================

// ✅ Initialize storage
export const initializeStorage = async () => {
  try {
    console.log('🔄 Initializing Firebase storage...');
    // Firebase is already initialized in firebase.js
    console.log('✅ Firebase storage ready');
    return true;
  } catch (error) {
    console.error('❌ Error initializing storage:', error);
    return false;
  }
};




// src/utils/storage.jsx - Add this function

// ✅ Process lesson payment - ADD THIS
export const processLessonPayment = async (userId, courseKey, lessonId, amount, paymentMethod = 'paystack') => {
  try {
    if (!userId || !courseKey || !lessonId) {
      throw new Error('User ID, course key, and lesson ID are required');
    }

    // Get user data
    const userData = await getUserData(userId);
    if (!userData) {
      throw new Error('User not found');
    }

    // Check if lesson already purchased
    const purchasedLessons = userData.purchasedLessons || [];
    const alreadyPurchased = purchasedLessons.some(p => p.courseKey === courseKey && p.lessonId === lessonId);
    
    if (alreadyPurchased) {
      throw new Error('Lesson already purchased');
    }

    // Process payment through payment service
    const paymentResult = await paymentService.processLessonPayment(
      userId,
      courseKey,
      lessonId,
      amount,
      paymentMethod
    );

    // Save transaction record
    const transaction = {
      userId: userId,
      courseKey: courseKey,
      lessonId: lessonId,
      amount: amount,
      paymentMethod: paymentMethod,
      status: 'pending',
      reference: paymentResult.data.reference || paymentResult.data.tx_ref,
      createdAt: new Date().toISOString()
    };

    // Save to transactions collection
    const transactionsRef = collection(db, 'transactions');
    await setDoc(doc(transactionsRef), transaction);

    return paymentResult;
  } catch (error) {
    console.error('❌ Error processing lesson payment:', error);
    throw error;
  }
};

// ✅ Verify payment - ADD THIS
export const verifyPayment = async (reference) => {
  try {
    if (!reference) {
      throw new Error('Payment reference is required');
    }

    // Verify payment through payment service
    const result = await paymentService.verifyPaystackPayment(reference);

    if (result.status) {
      // Update transaction status
      const transactionsRef = collection(db, 'transactions');
      const q = query(transactionsRef, where('reference', '==', reference));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          status: 'completed',
          paymentData: result.data,
          updatedAt: new Date().toISOString()
        });

        // Update user's purchased lessons
        const transaction = querySnapshot.docs[0].data();
        const userRef = doc(db, 'users', transaction.userId);
        await updateDoc(userRef, {
          purchasedLessons: arrayUnion({
            courseKey: transaction.courseKey,
            lessonId: transaction.lessonId,
            purchasedAt: new Date().toISOString()
          })
        });
      }
    }

    return result;
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    throw error;
  }
};

// ✅ Get user's purchased lessons - ADD THIS
export const getUserPurchasedLessons = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userData = await getUserData(userId);
    return userData?.purchasedLessons || [];
  } catch (error) {
    console.error('❌ Error getting purchased lessons:', error);
    return [];
  }
};

// ============================================
// ✅ FINAL EXPORT
// ============================================

// src/utils/storage.jsx - Update the export section

export default {
  // User Management
  getCurrentUser,
  setCurrentUser,
  getUsers,
  setUsers,
  registerUser,
  authenticateUser,
  logoutUser,
  confirmUserEmail,
  resendEmailConfirmation,
  
  // Student Management
  getStudents,
  updateStudent,
  
  // Teacher Management
  getTeacherCourses,
  addNewCourse,
  updateCourse,
  deleteCourse,
  getTeacherStats,
  
  // Lesson Management
  addLessonToCourse,
  updateLesson,
  deleteLesson,
  getLessonsForCourse,
  
  // Multimedia Management
  addMultimediaToLesson,
  deleteMultimediaFromLesson,
  
  // Wallet & Payment
  getTeacherWallet,
  updateTeacherWallet,
  withdrawFromWallet,
  updateTeacherProfileWithWhatsApp,
  getTeacherWhatsAppUrl,
  getTeacherWhatsAppNumber,
  getTeacherWhatsAppUrlAsync,
  
  // Lesson Access & Payment
  canAccessLesson,
  purchaseLesson,
  processLessonPayment, // ✅ ADD THIS
  verifyPayment, // ✅ ADD THIS
  getUserPurchasedLessons, // ✅ ADD THIS
  
  // Storage
  initializeStorage
};