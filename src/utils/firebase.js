// src/utils/firebase.js

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCQ_sNo4XG16JS7waJ_TEkCrK8sc1A4gq0",
  authDomain: "stem-education-9c439.firebaseapp.com",
  projectId: "stem-education-9c439",
  storageBucket: "stem-education-9c439.firebasestorage.app",
  messagingSenderId: "562966005597",
  appId: "1:562966005597:web:7757e059521a5cb8dc4ab4",
  measurementId: "G-QJDV0V79YD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ========================================
// AUTH FUNCTIONS
// ========================================

export const registerUser = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await sendEmailVerification(user);
    
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      name: userData.name || '',
      role: userData.role || 'student',
      level: userData.level || 'Beginner',
      createdAt: new Date().toISOString(),
      isEmailVerified: false,
      isApproved: userData.role === 'teacher' ? false : true,
      purchasedLessons: [],
      completedLessons: {},
      progress: {},
      ...userData
    });
    
    return { user, userData };
  } catch (error) {
    console.error('❌ Error registering user:', error);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Check if email is verified
    if (!user.emailVerified) {
      // Check if this is a demo account (we can skip verification for demo)
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      // Allow demo accounts to bypass email verification
      if (userData.isDemoAccount) {
        // Auto-verify demo accounts
        return { ...user, ...userData, emailVerified: true };
      }
      
      throw new Error('Please verify your email before logging in.');
    }
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    return { ...user, ...userData };
  } catch (error) {
    console.error('❌ Error logging in:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log('✅ User logged out');
  } catch (error) {
    console.error('❌ Error logging out:', error);
    throw error;
  }
};

export const resendVerification = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      await sendEmailVerification(user);
      console.log('✅ Verification email resent');
      return { success: true };
    } else {
      throw new Error('No user is currently signed in');
    }
  } catch (error) {
    console.error('❌ Error resending verification:', error);
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Password reset email sent');
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending password reset:', error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// ========================================
// FIRESTORE CRUD FUNCTIONS
// ========================================

export const getUserData = async (uid) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('❌ Error getting user data:', error);
    throw error;
  }
};

export const updateUserData = async (uid, data) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: new Date().toISOString()
    });
    console.log('✅ User data updated:', uid);
  } catch (error) {
    console.error('❌ Error updating user data:', error);
    throw error;
  }
};

export const deleteUserData = async (uid) => {
  try {
    await deleteDoc(doc(db, 'users', uid));
    console.log('✅ User data deleted:', uid);
  } catch (error) {
    console.error('❌ Error deleting user data:', error);
    throw error;
  }
};

export const saveCourse = async (courseData) => {
  try {
    const docRef = doc(collection(db, 'courses'));
    await setDoc(docRef, {
      ...courseData,
      id: docRef.id,
      createdAt: new Date().toISOString()
    });
    console.log('✅ Course saved:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving course:', error);
    throw error;
  }
};

export const getCourses = async (teacherId = null) => {
  try {
    let q = collection(db, 'courses');
    if (teacherId) {
      q = query(q, where('teacherId', '==', teacherId));
    }
    const querySnapshot = await getDocs(q);
    const courses = [];
    querySnapshot.forEach(doc => {
      courses.push({ id: doc.id, ...doc.data() });
    });
    return courses;
  } catch (error) {
    console.error('❌ Error getting courses:', error);
    throw error;
  }
};

export const saveLesson = async (courseId, lessonData) => {
  try {
    const docRef = doc(collection(db, 'lessons'));
    await setDoc(docRef, {
      ...lessonData,
      id: docRef.id,
      courseId: courseId,
      createdAt: new Date().toISOString()
    });
    console.log('✅ Lesson saved:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving lesson:', error);
    throw error;
  }
};

export const getLessons = async (courseId) => {
  try {
    const q = query(collection(db, 'lessons'), where('courseId', '==', courseId));
    const querySnapshot = await getDocs(q);
    const lessons = [];
    querySnapshot.forEach(doc => {
      lessons.push({ id: doc.id, ...doc.data() });
    });
    return lessons;
  } catch (error) {
    console.error('❌ Error getting lessons:', error);
    throw error;
  }
};

export const saveProgress = async (studentId, courseId, progressData) => {
  try {
    const docRef = doc(db, 'progress', `${studentId}_${courseId}`);
    await setDoc(docRef, {
      studentId,
      courseId,
      ...progressData,
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Progress saved for:', studentId);
  } catch (error) {
    console.error('❌ Error saving progress:', error);
    throw error;
  }
};

// ========================================
// DEFAULT USER CREATION
// ========================================

export const createDefaultUsers = async () => {
  try {
    console.log('🔄 Creating default users...');
    
    // Default accounts
    const defaultUsers = [
      {
        email: 'admin@stem.com',
        password: 'Admin123!',
        name: 'Admin User',
        role: 'admin',
        isDemoAccount: true,
        isEmailVerified: true
      },
      {
        email: 'teacher@stem.com',
        password: 'Teacher123!',
        name: 'Teacher User',
        role: 'teacher',
        isDemoAccount: true,
        isEmailVerified: true,
        isApproved: true,
        specialization: 'Web Development',
        bio: 'Experienced web developer and educator with 5+ years of teaching experience.',
        whatsappNumber: '2348012345678'
      },
      {
        email: 'student@stem.com',
        password: 'Student123!',
        name: 'Student User',
        role: 'student',
        isDemoAccount: true,
        isEmailVerified: true,
        level: 'Intermediate'
      }
    ];

    const results = [];
    for (const userData of defaultUsers) {
      try {
        // Check if user already exists
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          userData.email, 
          userData.password
        );
        const user = userCredential.user;
        
        // Save user data to Firestore
        const { password, ...userDataWithoutPassword } = userData;
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          isDemoAccount: userData.isDemoAccount,
          isEmailVerified: userData.isEmailVerified,
          createdAt: new Date().toISOString(),
          ...userDataWithoutPassword
        });
        
        console.log(`✅ Created ${userData.role}: ${userData.email}`);
        results.push({ success: true, email: userData.email, role: userData.role });
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`ℹ️ ${userData.email} already exists, skipping...`);
          results.push({ success: true, email: userData.email, role: userData.role, exists: true });
        } else {
          console.error(`❌ Error creating ${userData.email}:`, error.message);
          results.push({ success: false, email: userData.email, error: error.message });
        }
      }
    }
    
    console.log('✅ Default users creation complete');
    return results;
  } catch (error) {
    console.error('❌ Error creating default users:', error);
    return [];
  }
};

// ========================================
// EXPORT ALL
// ========================================

export { auth, db };
export default {
  auth,
  db,
  registerUser,
  loginUser,
  logoutUser,
  resendVerification,
  resetPassword,
  getCurrentUser,
  getUserData,
  updateUserData,
  deleteUserData,
  saveCourse,
  getCourses,
  saveLesson,
  getLessons,
  saveProgress,
  createDefaultUsers
};