import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

import './styles/payments.css';
import StudentProfile from './components/StudentProfile';
import CourseCatalog from './components/CourseCatalog';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import TeacherRegisterForm from './components/TeacherRegisterForm';
import EmailConfirmation from './components/EmailConfirmation';
import DiscussionForum from './components/DiscussionForum';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import AdminCourseManagement from './components/AdminCourseManagement';
import About from './components/About';
import FAQs from './components/FAQs';
import Contact from './components/Contact';
import Blog from './components/Blog';
import Resources from './components/Resources';
import Careers from './components/Careers';
import Support from './components/Support';

import { 
  initializeStorage, 
  getStudents, 
  getCurrentUser, 
  setCurrentUser, 
  updateStudent, 
  addStudent,
  authenticateUser,
  logoutUser,
  registerTeacher,
  getUsers,
  registerUser,
  confirmUserEmail,
  resendEmailConfirmation,
  canAccessLesson,
  purchaseLesson,
  getTeacherWhatsAppUrl,
  getAllCoursesForAdmin,
  getCourseDetailsForAdmin,
  deleteCourseAsAdmin,
  deleteLessonAsAdmin,
  getCourseAnalyticsForAdmin,
  getTeacherCoursesForAdmin,
  getPlatformStats,
  getAllUsers,
  deleteUser,
  updateUser,
  approveTeacher,
  rejectTeacher,
  dismissTeacher,
  getTeacherWallets,
  saveTeacherWallets,
  getTeacherWallet,
  updateTeacherWallet,
  addTeacherEarnings,
  withdrawFromWallet,
  getPaymentTransactions,
  savePaymentTransactions,
  processLessonPayment,
  getStudentById,
  updateCourseProgress,
  getEnrolledCoursesWithProgress
} from './utils/storage';

// Constants
const USER_ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
const INACTIVITY_WARNING_TIME = 55 * 60 * 1000;
const INACTIVITY_LOGOUT_TIME = 60 * 60 * 1000;

// Safe object utility functions
const safeObjectEntries = (obj, location = 'unknown') => {
  // Only log in development
  if (import.meta.env.MODE === 'development') {
    console.log(`🔧 safeObjectEntries called from: ${location}`, obj);
  }
  try {
    if (obj === null || obj === undefined) {
      if (import.meta.env.MODE === 'development') {
        console.log(`❌ ${location}: Object is null/undefined`);
      }
      return [];
    }
    if (typeof obj !== 'object') {
      if (import.meta.env.MODE === 'development') {
        console.log(`❌ ${location}: Not an object, type is:`, typeof obj);
      }
      return [];
    }
    const entries = Object.entries(obj);
    if (import.meta.env.MODE === 'development') {
      console.log(`✅ ${location}: Object.entries success, count:`, entries.length);
    }
    return entries;
  } catch (error) {
    console.error(`❌ ${location}: Error in safeObjectEntries:`, error);
    return [];
  }
};

const safeObjectKeys = (obj, location = 'unknown') => {
  if (import.meta.env.MODE === 'development') {
    console.log(`🔧 safeObjectKeys called from: ${location}`, obj);
  }
  try {
    if (!obj || typeof obj !== 'object') {
      if (import.meta.env.MODE === 'development') {
        console.log(`❌ ${location}: Invalid object for keys`);
      }
      return [];
    }
    const keys = Object.keys(obj);
    if (import.meta.env.MODE === 'development') {
      console.log(`✅ ${location}: Object.keys success, count:`, keys.length);
    }
    return keys;
  } catch (error) {
    console.error(`❌ ${location}: Error in safeObjectKeys:`, error);
    return [];
  }
};

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUserState] = useState(null);
  const [students, setStudentsState] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingUser, setPendingUser] = useState(null);
  const [confirmationToken, setConfirmationToken] = useState('');
  const [showConfirmationInfo, setShowConfirmationInfo] = useState(false);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initError, setInitError] = useState(null); // ✅ Added for initialization errors

  // Refs for timer management
  const logoutTimerRef = useRef(null);
  const warningTimerRef = useRef(null);

  // Define handleLogout first so it can be used in other hooks
  const handleLogout = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    logoutUser();
    setCurrentUserState(null);
    setCurrentView('login');
    setMessage('');
    setShowConfirmationInfo(false);
    setShowInactivityWarning(false);
    setInitError(null);
    localStorage.removeItem('hausaStem_currentView');
  }, []);

  // Auto-logout handler
  const handleAutoLogout = useCallback(() => {
    setMessage('You have been automatically logged out due to inactivity.');
    handleLogout();
  }, [handleLogout]);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    if (currentUser) {
      warningTimerRef.current = setTimeout(() => {
        setShowInactivityWarning(true);
      }, INACTIVITY_WARNING_TIME);

      logoutTimerRef.current = setTimeout(() => {
        handleAutoLogout();
      }, INACTIVITY_LOGOUT_TIME);
    }
  }, [currentUser, handleAutoLogout]);

  // Handle user activity
  const handleUserActivity = useCallback(() => {
    if (currentUser) {
      resetInactivityTimer();
      if (showInactivityWarning) {
        setShowInactivityWarning(false);
      }
    }
  }, [currentUser, resetInactivityTimer, showInactivityWarning]);

  // ✅ UPDATED: Initialize storage and load data with async/await and better error handling
  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('🔄 Initializing storage...');

        // ✅ Try to initialize storage with timeout
        const initPromise = initializeStorage();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Storage initialization timeout')), 10000);
        });
        
        await Promise.race([initPromise, timeoutPromise]);

        const loadedStudents = getStudents() || [];
        const loadedCurrentUser = getCurrentUser();

        console.log('✅ Loaded students:', loadedStudents.length);
        console.log('✅ Loaded current user:', loadedCurrentUser ? loadedCurrentUser.name : 'None');

        setStudentsState(loadedStudents);

        if (loadedCurrentUser) {
          console.log('👤 Restoring logged-in user:', loadedCurrentUser.name);

          setCurrentUserState(loadedCurrentUser);

          if (loadedCurrentUser.role === 'admin') {
            setCurrentView('admin');
          } else if (loadedCurrentUser.role === 'teacher') {
            setCurrentView('teacher');
          } else {
            setCurrentView('dashboard');
          }
        } else {
          console.log('👤 No logged-in user → showing login');
          setCurrentUserState(null);
          setCurrentView('login');
        }

        setInitError(null);

      } catch (error) {
        console.error('❌ Error initializing app:', error);
        setInitError(error.message || 'Failed to initialize app');
        setCurrentUserState(null);
        setCurrentView('login');
      } finally {
        console.log('✅ App initialization finished');
        setIsInitialized(true);
      }
    };

    initApp();
  }, []);

  // Set up activity listeners when user is logged in
  useEffect(() => {
    if (currentUser) {
      USER_ACTIVITY_EVENTS.forEach(event => {
        document.addEventListener(event, handleUserActivity);
      });

      resetInactivityTimer();

      return () => {
        USER_ACTIVITY_EVENTS.forEach(event => {
          document.removeEventListener(event, handleUserActivity);
        });
        if (logoutTimerRef.current) {
          clearTimeout(logoutTimerRef.current);
        }
        if (warningTimerRef.current) {
          clearTimeout(warningTimerRef.current);
        }
      };
    }
  }, [currentUser, handleUserActivity, resetInactivityTimer]);

  // Check for confirmation token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      handleEmailConfirmation(token);
    }
  }, []);

  // Login handler
  const handleLogin = useCallback((email, password) => {
    try {
      setIsLoading(true);
      setInitError(null);
      const user = authenticateUser(email, password);
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        setCurrentUserState(userWithoutPassword);
        setCurrentUser(userWithoutPassword);

        resetInactivityTimer();

        if (user.role === 'admin') {
          setCurrentView('admin');
        } else if (user.role === 'teacher') {
          setCurrentView('teacher');
        } else {
          setCurrentView('dashboard');
        }
        setMessage('');
        setIsLoading(false);
        return true;
      }
      setMessage('Invalid email or password');
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setMessage(error.message);
      setIsLoading(false);
      return false;
    }
  }, [resetInactivityTimer]);

  // Student registration
  const handleStudentRegister = useCallback(async (name, email, password) => {
    try {
      setIsLoading(true);
      setInitError(null);
      const users = getUsers();
      const existingUser = safeObjectEntries(users, 'student-register').find(([key, user]) => user.email === email);

      if (existingUser || students.find(s => s.email === email)) {
        setMessage('Email already exists. Please use a different email or login.');
        setIsLoading(false);
        return false;
      }

      const result = await registerUser({
        name,
        email,
        password,
        role: 'student',
        level: 'Beginner',
        completedLessons: [],
        completedCourses: [],
        progress: {},
        purchasedLessons: [],
        paymentHistory: [],
        quizResults: [],
        certificates: [],
        enrolledCourses: [],
        enrolledCoursesDate: {}
      });

      setPendingUser(result.user);
      setConfirmationToken(result.confirmationToken);
      setShowConfirmationInfo(true);
      setCurrentView('email-confirmation');
      setMessage(`Confirmation email sent to ${email}. Please check your inbox.`);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setMessage(error.message || 'Registration failed. Please try again.');
      setIsLoading(false);
      return false;
    }
  }, [students]);

  // Teacher registration
  const handleTeacherRegister = useCallback(async (teacherData) => {
    try {
      setIsLoading(true);
      setInitError(null);
      const users = getUsers();
      const existingUser = safeObjectEntries(users, 'teacher-register').find(([key, user]) => user.email === teacherData.email);

      if (existingUser) {
        setMessage('Email already exists. Please use a different email or login.');
        setIsLoading(false);
        return false;
      }

      const result = await registerUser({
        ...teacherData,
        role: 'teacher',
        isApproved: false,
        earnings: 0,
        courses: [],
        whatsappNumber: teacherData.whatsappNumber || ''
      });

      setPendingUser(result.user);
      setConfirmationToken(result.confirmationToken);
      setShowConfirmationInfo(true);
      setCurrentView('email-confirmation');
      setMessage(`Confirmation email sent to ${teacherData.email}. Please check your inbox.`);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Teacher registration error:', error);
      setMessage(error.message || 'Teacher registration failed. Please try again.');
      setIsLoading(false);
      return false;
    }
  }, []);

  // Email confirmation
  const handleEmailConfirmation = useCallback(async (token) => {
    try {
      setIsLoading(true);
      const user = await confirmUserEmail(token);

      setMessage('Email confirmed successfully! You can now log in.');
      setCurrentView('login');
      setPendingUser(null);
      setConfirmationToken('');
      setShowConfirmationInfo(false);

      window.history.replaceState({}, document.title, window.location.pathname);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Email confirmation error:', error);
      setMessage(error.message || 'Email confirmation failed. Please try again.');
      setIsLoading(false);
      return false;
    }
  }, []);

  // Resend confirmation
  const handleResendConfirmation = useCallback(async () => {
    if (pendingUser) {
      try {
        setIsLoading(true);
        await resendEmailConfirmation(pendingUser.email);
        setMessage('Confirmation email resent successfully! Please check your inbox.');
        setIsLoading(false);
      } catch (error) {
        console.error('Resend confirmation error:', error);
        setMessage(error.message || 'Failed to resend confirmation email. Please try again.');
        setIsLoading(false);
      }
    }
  }, [pendingUser]);

  // Update student data
  const updateStudentData = useCallback((updatedStudent) => {
    try {
      if (!updatedStudent || !updatedStudent.id) {
        console.error('Invalid student data for update');
        return;
      }

      updateStudent(updatedStudent);

      const { password, ...studentWithoutPassword } = updatedStudent;
      setCurrentUserState(studentWithoutPassword);
      setCurrentUser(studentWithoutPassword);

      setStudentsState(prev => 
        prev.map(s => s.id === updatedStudent.id ? updatedStudent : s)
      );
    } catch (error) {
      console.error('Error updating student:', error);
      setMessage('Failed to update student profile. Please try again.');
    }
  }, []);

  // Update current user
  const updateCurrentUser = useCallback((updatedUser) => {
    try {
      if (!updatedUser || !updatedUser.id) {
        console.error('Invalid user data for update');
        return;
      }

      const users = getUsers();
      if (users[updatedUser.id]) {
        users[updatedUser.id] = { ...users[updatedUser.id], ...updatedUser };
        localStorage.setItem('hausaStem_users', JSON.stringify(users));
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      setCurrentUserState(userWithoutPassword);
      setCurrentUser(userWithoutPassword);

      const currentUserData = getCurrentUser();
      if (currentUserData && currentUserData.id === updatedUser.id) {
        setCurrentUser(userWithoutPassword);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage('Failed to update user profile. Please try again.');
    }
  }, []);

  // Lesson purchase
  const handleLessonPurchase = useCallback(async (courseKey, lessonId) => {
    try {
      if (!currentUser) {
        setMessage('Please log in to purchase lessons');
        return false;
      }

      setIsLoading(true);
      const result = await purchaseLesson(currentUser.id, courseKey, lessonId);

      if (result.success) {
        const updatedUser = getCurrentUser();
        if (updatedUser) {
          setCurrentUserState(updatedUser);
          setCurrentUser(updatedUser);
        }
        setMessage(result.alreadyPurchased ? '✅ Lesson already purchased!' : '✅ Lesson purchased successfully!');
        setIsLoading(false);
        return true;
      } else {
        setMessage('❌ Failed to purchase lesson. Please try again.');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Error purchasing lesson:', error);
      setMessage('❌ Error processing payment: ' + error.message);
      setIsLoading(false);
      return false;
    }
  }, [currentUser]);

  // Check lesson access
  const checkLessonAccess = useCallback((courseKey, lessonId) => {
    if (!currentUser) return false;
    return canAccessLesson(currentUser.id, courseKey, lessonId);
  }, [currentUser]);

  // Get teacher contact
  const getTeacherContactUrl = useCallback((teacherId) => {
    return getTeacherWhatsAppUrl(teacherId);
  }, []);

  // Inactivity Warning Modal
  const InactivityWarning = useCallback(() => {
    if (!showInactivityWarning) return null;

    return (
      <div className="inactivity-warning-overlay">
        <div className="inactivity-warning-modal">
          <div className="warning-header">
            <h3>Session Timeout Warning</h3>
          </div>
          <div className="warning-body">
            <p>Your session will expire in 5 minutes due to inactivity.</p>
            <p>Would you like to continue your session?</p>
          </div>
          <div className="warning-actions">
            <button 
              className="continue-btn"
              onClick={() => {
                resetInactivityTimer();
                setShowInactivityWarning(false);
              }}
            >
              Continue Session
            </button>
            <button 
              className="logout-btn"
              onClick={handleLogout}
            >
              Log Out Now
            </button>
          </div>
        </div>
      </div>
    );
  }, [showInactivityWarning, resetInactivityTimer, handleLogout]);

  // Confirmation Info Display
  const ConfirmationInfoDisplay = useCallback(() => {
    if (!showConfirmationInfo || !confirmationToken) return null;

    return (
      <div className="confirmation-demo-display">
        <h3>📧 Demo Email Confirmation</h3>
        <p>Since this is a demo, here's your confirmation token:</p>
        <div className="confirmation-token">{confirmationToken}</div>
        <p>You can:</p>
        <ul>
          <li>Click the confirmation button below to simulate email confirmation</li>
          <li>Or manually navigate to: {window.location.origin}/confirm-email?token={confirmationToken}</li>
        </ul>
        <div className="demo-buttons">
          <button 
            onClick={() => handleEmailConfirmation(confirmationToken)}
            className="confirm-email-btn"
          >
            Confirm Email Now
          </button>
          <button 
            onClick={() => setShowConfirmationInfo(false)}
            className="close-info-btn"
          >
            Close
          </button>
        </div>
      </div>
    );
  }, [showConfirmationInfo, confirmationToken, handleEmailConfirmation]);

  // Message Display
  const MessageDisplay = useCallback(() => {
    if (!message) return null;

    let className = 'message';
    if (message.includes('success') || message.includes('✅')) {
      className += ' success';
    } else if (message.includes('email') || message.includes('📧')) {
      className += ' info';
    } else if (message.includes('❌') || message.includes('error') || message.includes('failed')) {
      className += ' error';
    }

    return (
      <div className={className}>
        {message}
      </div>
    );
  }, [message]);

  // Render view
  const renderView = useCallback(() => {
    console.log('🎯 renderView called with currentView:', currentView);
    console.log('🎯 currentUser:', currentUser ? currentUser.name : 'None');

    if (!currentUser) {
      console.log('👤 No current user, showing login/register views');
      switch(currentView) {
        case 'register':
          return (
            <>
              <MessageDisplay />
              <ConfirmationInfoDisplay />
              <RegisterForm 
                onRegister={handleStudentRegister} 
                onSwitchToLogin={() => {
                  setMessage('');
                  setCurrentView('login');
                }} 
                isRegistering={isLoading}
              />
            </>
          );
        case 'teacher-register':
          return (
            <>
              <MessageDisplay />
              <ConfirmationInfoDisplay />
              <TeacherRegisterForm 
                onRegister={handleTeacherRegister} 
                onSwitchToLogin={() => {
                  setMessage('');
                  setCurrentView('login');
                }}
                onSwitchToStudentRegister={() => {
                  setMessage('');
                  setCurrentView('register');
                }}
              />
            </>
          );
        case 'email-confirmation':
          return (
            <>
              <MessageDisplay />
              <ConfirmationInfoDisplay />
              <EmailConfirmation 
                email={pendingUser?.email}
                onConfirm={handleEmailConfirmation}
                onResend={handleResendConfirmation}
                onCancel={() => {
                  setMessage('');
                  setPendingUser(null);
                  setConfirmationToken('');
                  setShowConfirmationInfo(false);
                  setCurrentView('login');
                }}
              />
            </>
          );
        case 'login':
        default:
          return (
            <div className="login-container">
              <MessageDisplay />
              <ConfirmationInfoDisplay />
              <LoginForm 
                onLogin={handleLogin} 
                onSwitchToRegister={() => {
                  setMessage('');
                  setCurrentView('register');
                }} 
                onSwitchToTeacherRegister={() => {
                  setMessage('');
                  setCurrentView('teacher-register');
                }}
                isLoading={isLoading}
              />
            </div>
          );
      }
    }

    const isAdmin = currentUser?.role === 'admin';
    const isTeacher = currentUser?.role === 'teacher';
    const isStudent = currentUser?.role === 'student';
    console.log('🎯 User roles - Admin:', isAdmin, 'Teacher:', isTeacher, 'Student:', isStudent);

    switch(currentView) {
      case 'about':
        return <About />;
      case 'faqs':
        return <FAQs />;
      case 'contact':
        return <Contact />;
      case 'blog':
        return <Blog />;
      case 'resources':
        return <Resources />;
      case 'careers':
        return (
          <Careers 
            setCurrentView={setCurrentView} 
            setMessage={setMessage}
            onTeacherRegister={handleTeacherRegister}
            currentUser={currentUser}
          />
        );
      case 'support':
        return <Support />;
      case 'admin-courses':
        if (isAdmin) {
          return <AdminCourseManagement currentUser={currentUser} />;
        } else {
          return (
            <div className="access-denied">
              <h2>Access Denied</h2>
              <p>You don't have permission to access course management.</p>
              <button 
                className="back-button"
                onClick={() => setCurrentView(isAdmin ? 'admin' : isTeacher ? 'teacher' : 'dashboard')}
              >
                Back to Dashboard
              </button>
            </div>
          );
        }
      default:
        break;
    }

    if (currentView === 'admin') {
      console.log('🎯 Rendering admin dashboard');
      if (isAdmin) {
        return <AdminDashboard currentUser={currentUser} setCurrentView={setCurrentView} />;
      } else {
        return (
          <div className="access-denied">
            <h2>Access Denied</h2>
            <p>You don't have permission to access the admin dashboard.</p>
            <button 
              className="back-button"
              onClick={() => setCurrentView(isTeacher ? 'teacher' : 'dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        );
      }
    }

    if (currentView === 'teacher') {
      console.log('🎯 Rendering teacher dashboard');
      if (isTeacher) {
        return <TeacherDashboard currentUser={currentUser} setCurrentUser={updateCurrentUser} />;
      } else {
        return (
          <div className="access-denied">
            <h2>Access Denied</h2>
            <p>You don't have permission to access the teacher dashboard.</p>
            <button 
              className="back-button"
              onClick={() => setCurrentView(isAdmin ? 'admin' : 'dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        );
      }
    }

    if (isStudent) {
      console.log('🎯 Rendering student views for:', currentView);
      switch(currentView) {
        case 'profile':
          return <StudentProfile student={currentUser} setStudent={updateStudentData} />;
        case 'courses':
          return (
            <CourseCatalog 
              student={currentUser} 
              setStudent={updateStudentData}
              onLessonPurchase={handleLessonPurchase}
              onCheckLessonAccess={checkLessonAccess}
              onGetTeacherContact={getTeacherContactUrl}
            />
          );
        case 'discussion':
          return <DiscussionForum currentUser={currentUser} />;
        case 'dashboard':
        default:
          return (
            <>
              <MessageDisplay />
              <Dashboard student={currentUser} setStudent={updateStudentData} />
            </>
          );
      }
    }

    if (isTeacher) {
      console.log('🎯 Rendering teacher views for:', currentView);
      switch(currentView) {
        case 'profile':
          return (
            <div className="teacher-profile">
              <h2>Teacher Profile</h2>
              <p>Name: {currentUser.name}</p>
              <p>Email: {currentUser.email}</p>
              <p>Specialization: {currentUser.specialization}</p>
              <p>WhatsApp: {currentUser.whatsappNumber || 'Not provided'}</p>
              <p>Status: {currentUser.isApproved ? 'Approved' : 'Pending Approval'}</p>
              <p>Earnings: ₦{currentUser.earnings || 0}</p>
              <button 
                className="back-button"
                onClick={() => setCurrentView('teacher')}
              >
                Back to Teacher Dashboard
              </button>
            </div>
          );
        case 'dashboard':
        default:
          return <TeacherDashboard currentUser={currentUser} setCurrentUser={updateCurrentUser} />;
      }
    }

    if (isAdmin) {
      console.log('🎯 Rendering admin views for:', currentView);
      switch(currentView) {
        case 'dashboard':
        default:
          return <AdminDashboard currentUser={currentUser} setCurrentView={setCurrentView} />;
      }
    }

    console.error('❌ No matching view found for:', currentView, 'with user:', currentUser);
    return (
      <div className="error-view">
        <h2>Something went wrong</h2>
        <p>Unable to determine the appropriate view for your account.</p>
        <button 
          className="back-button"
          onClick={handleLogout}
        >
          Return to Login
        </button>
      </div>
    );
  }, [
    currentUser,
    currentView,
    handleLogin,
    handleStudentRegister,
    handleTeacherRegister,
    handleEmailConfirmation,
    handleResendConfirmation,
    handleLogout,
    updateStudentData,
    updateCurrentUser,
    handleLessonPurchase,
    checkLessonAccess,
    getTeacherContactUrl,
    MessageDisplay,
    ConfirmationInfoDisplay,
    pendingUser,
    isLoading
  ]);

  // ✅ Show error if initialization failed
  if (initError) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚨</div>
          <h2 style={{ color: '#dc3545', marginBottom: '0.5rem' }}>Failed to Load App</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>{initError}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🔄 Refresh
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                padding: '10px 24px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🗑️ Clear Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading STEM Platform...</p>
      </div>
    );
  }

  console.log('🎯 Rendering main App component');
  return (
    <div className="App">
      <InactivityWarning />

      {currentUser && (
        <Navigation 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          currentUser={currentUser}
          onLogout={handleLogout}
          isAdmin={currentUser.role === 'admin'}
          isTeacher={currentUser.role === 'teacher'}
          isStudent={currentUser.role === 'student'}
        />
      )}
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
