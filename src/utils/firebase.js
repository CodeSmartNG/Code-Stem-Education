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
  onSnapshot
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
      ...userData
    });
    
    return { user, userData };
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    if (!user.emailVerified) {
      throw new Error('Please verify your email before logging in.');
    }
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    return { ...user, ...userData };
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const resendVerification = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      await sendEmailVerification(user);
    }
  } catch (error) {
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
    throw error;
  }
};

export const updateUserData = async (uid, data) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
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
    return docRef.id;
  } catch (error) {
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
    return docRef.id;
  } catch (error) {
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
  } catch (error) {
    throw error;
  }
};

export { auth, db };