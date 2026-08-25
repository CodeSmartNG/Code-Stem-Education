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
  deleteDoc 
} from 'firebase/firestore';

// ✅ Your Firebase config (replace with your actual config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ========================================
// EMAIL CONFIRMATION FUNCTIONS
// ========================================

// Register user with Firebase (sends verification email)
export const registerUserWithFirebase = async (email, password, userData) => {
  try {
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Send verification email
    await sendEmailVerification(user);

    // 3. Save user data to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      name: userData.name || '',
      role: userData.role || 'student',
      createdAt: new Date().toISOString(),
      isEmailVerified: false,
      ...userData
    });

    // 4. Return user data for localStorage
    return {
      uid: user.uid,
      email: user.email,
      isEmailVerified: false,
      ...userData
    };
  } catch (error) {
    console.error('Firebase registration error:', error);
    throw error;
  }
};

// Check if email is verified
export const checkEmailVerification = async (user) => {
  try {
    await user.reload();
    return user.emailVerified;
  } catch (error) {
    console.error('Error checking email verification:', error);
    return false;
  }
};

// Resend verification email
export const resendVerificationEmail = async (user) => {
  try {
    await sendEmailVerification(user);
    return true;
  } catch (error) {
    console.error('Error resending verification email:', error);
    throw error;
  }
};

// Login with Firebase
export const loginWithFirebase = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check if email is verified
    if (!user.emailVerified) {
      throw new Error('Please verify your email before logging in.');
    }

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};

    return {
      uid: user.uid,
      email: user.email,
      isEmailVerified: user.emailVerified,
      ...userData
    };
  } catch (error) {
    console.error('Firebase login error:', error);
    throw error;
  }
};

// Logout from Firebase
export const logoutFromFirebase = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error('Firebase logout error:', error);
    throw error;
  }
};

// Get current Firebase user
export const getCurrentFirebaseUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// ========================================
// FIRESTORE DATA SYNC FUNCTIONS
// ========================================

// Sync user data from Firestore to localStorage
export const syncUserDataToLocal = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error syncing user data:', error);
    return null;
  }
};

// Update user data in Firestore
export const updateUserDataInFirestore = async (uid, data) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating user data in Firestore:', error);
    throw error;
  }
};

export { auth, db };
