import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
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
  getTeacherWhatsAppUrl
} from './utils/storage';

// Safe object utility functions with detailed logging
const safeObjectEntries = (obj, location = 'unknown') => {
  console.log(`🔧 safeObjectEntries called from: ${location}`, obj);
  try {
    if (obj === null) {
      console.log(`❌ ${location}: Object is null`);
      return [];
    }
    if (obj === undefined) {
      console.log(`❌ ${location}: Object is undefined`);
      return [];
    }
    if (typeof obj !== 'object') {
      console.log(`❌ ${location}: Not an object, type is:`, typeof obj);
      return [];
    }
    const entries = Object.entries(obj);
    console.log(`✅ ${location}: Object.entries success, count:`, entries.length);
    return entries;
  } catch (error) {
    console.error(`❌ ${location}: Error in safeObjectEntries:`, error);
    return [];
  }
};

const safeObjectKeys = (obj, location = 'unknown') => {
  console.log(`🔧 safeObjectKeys called from: ${location}`, obj);
  try {
    if (!obj || typeof obj !== 'object') {
      console.log(`❌ ${location}: Invalid object for keys`);
      return [];
    }
    const keys = Object.keys(obj);
    console.log(`✅ ${location}: Object.keys success, count:`, keys.length);
    return keys;
  } catch (error) {
    console.error(`❌ ${location}: Error in safeObjectKeys:`, error);
    return [];
  }
};

function App() {
  const [currentUser, setCurrentUserState] = useState(null);
  const [students, setStudentsState] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingUser, setPendingUser] = useState(null);
  const [confirmationToken, setConfirmationToken] = useState('');
  const [showConfirmationInfo, setShowConfirmationInfo] = useState(false);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Refs for timer management
  const logoutTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

  // Get current view from URL hash
  const getCurrentViewFromHash = () => {
    const hash = location.hash.replace('#', '') || '/';
    return hash === '/' ? 'login' : hash.replace('/', '');
  };

  const [currentView, setCurrentView] = useState(getCurrentViewFromHash());

  // Update currentView when hash changes
  useEffect(() => {
    setCurrentView(getCurrentViewFromHash());
  }, [location.hash]);

  // Auto-logout handler
  const handleAutoLogout = useCallback(() => {
    setMessage('You have been automatically logged out due to inactivity.');
    handleLogout();
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    // Clear existing timers
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    
    // Only set timers if user is logged in
    if (currentUser) {
      // Show warning after 55 minutes (5 minutes before logout)
      warningTimerRef.current = setTimeout(() => {
        setShowInactivityWarning(true);
      }, 55 * 60 * 1000); // 55 minutes
      
      // Auto logout after 60 minutes
      logoutTimerRef.current = setTimeout(() => {
        handleAutoLogout();
      }, 60 * 60 * 1000); // 60 minutes
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

  // Initialize storage and load data
  useEffect(() => {
    const initApp = () => {
      try {
        console.log('🔄 Initializing storage...');
        initializeStorage();
        
        // Load all data from localStorage
        const loadedStudents = getStudents();
        const loadedCurrentUser = getCurrentUser();
        
        console.log('Loaded students:', loadedStudents);
        console.log('Loaded current user:', loadedCurrentUser);
        
        setStudentsState(loadedStudents);
        
        if (loadedCurrentUser) {
          setCurrentUserState(loadedCurrentUser);
          // Redirect based on user role
          if (loadedCurrentUser.role === 'admin') {
            navigate('/admin');
          } else if (loadedCurrentUser.role === 'teacher') {
            navigate('/teacher');
          } else {
            navigate('/dashboard');
          }
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsInitialized(true);
      }
    };

    initApp();
  }, [navigate]);

  // Set up activity listeners when user is logged in
  useEffect(() => {
    if (currentUser) {
      // Add event listeners for user activity
      events.forEach(event => {
        document.addEventListener(event, handleUserActivity);
      });
      
      // Start the inactivity timer
      resetInactivityTimer();
      
      // Cleanup function
      return () => {
        events.forEach(event => {
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

  // Check for confirmation token in URL (for email confirmation links)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      handleEmailConfirmation(token);
    }
  }, []);

  const handleLogin = (email, password) => {
    try {
      const user = authenticateUser(email, password);
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        setCurrentUserState(userWithoutPassword);
        setCurrentUser(userWithoutPassword);
        
        // Reset inactivity timer on login
        resetInactivityTimer();
        
        // Redirect based on role
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'teacher') {
          navigate('/teacher');
        } else {
          navigate('/dashboard');
        }
        setMessage('');
        return true;
      }
      setMessage('Invalid email or password');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setMessage(error.message);
      return false;
    }
  };

  const handleStudentRegister = async (name, email, password) => {
    try {
      // Check if email already exists in students
      const users = getUsers();
      const existingUser = safeObjectEntries(users, 'student-register').find(([key, user]) => user.email === email);
      
      if (existingUser || students.find(s => s.email === email)) {
        setMessage('Email already exists. Please use a different email or login.');
        return false;
      }

      // Register user with email confirmation
      const result = await registerUser({
        name,
        email,
        password,
        role: 'student',
        level: 'Beginner',
        completedLessons: [],
        progress: {},
        purchasedLessons: []
      });

      // Store pending user data and token
      setPendingUser(result.user);
      setConfirmationToken(result.confirmationToken);
      setShowConfirmationInfo(true);
      navigate('/email-confirmation');
      setMessage(`Confirmation email sent to ${email}. Please check your inbox.`);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setMessage(error.message || 'Registration failed. Please try again.');
      return false;
    }
  };

  const handleTeacherRegister = async (teacherData) => {
    try {
      // Check if email already exists
      const users = getUsers();
      const existingUser = safeObjectEntries(users, 'teacher-register').find(([key, user]) => user.email === teacherData.email);
      
      if (existingUser) {
        setMessage('Email already exists. Please use a different email or login.');
        return false;
      }

      // Register teacher with email confirmation
      const result = await registerUser({
        ...teacherData,
        role: 'teacher',
        isApproved: false,
        earnings: 0,
        courses: [],
        whatsappNumber: teacherData.whatsappNumber || ''
      });

      // Store pending user data and token
      setPendingUser(result.user);
      setConfirmationToken(result.confirmationToken);
      setShowConfirmationInfo(true);
      navigate('/email-confirmation');
      setMessage(`Confirmation email sent to ${teacherData.email}. Please check your inbox.`);
      return true;
    } catch (error) {
      console.error('Teacher registration error:', error);
      setMessage(error.message || 'Teacher registration failed. Please try again.');
      return false;
    }
  };

  const handleEmailConfirmation = async (token) => {
    try {
      const user = await confirmUserEmail(token);
      
      setMessage('Email confirmed successfully! You can now log in.');
      navigate('/login');
      setPendingUser(null);
      setConfirmationToken('');
      setShowConfirmationInfo(false);
      
      // Clear token from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      return true;
    } catch (error) {
      console.error('Email confirmation error:', error);
      setMessage(error.message || 'Email confirmation failed. Please try again.');
      return false;
    }
  };

  const handleResendConfirmation = async () => {
    if (pendingUser) {
      try {
        await resendEmailConfirmation(pendingUser.email);
        setMessage('Confirmation email resent successfully! Please check your inbox.');
      } catch (error) {
        console.error('Resend confirmation error:', error);
        setMessage(error.message || 'Failed to resend confirmation email. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    // Clear all timers
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    
    logoutUser();
    setCurrentUserState(null);
    setCurrentUser(null);
    navigate('/login');
    setMessage('');
    setShowConfirmationInfo(false);
    setShowInactivityWarning(false);
  };

  // Enhanced student update
  const updateStudentData = (updatedStudent) => {
    try {
      // Update in localStorage
      updateStudent(updatedStudent);
      
      // Update in state
      const { password, ...studentWithoutPassword } = updatedStudent;
      setCurrentUserState(studentWithoutPassword);
      setCurrentUser(studentWithoutPassword);
      
      // Update in students list
      setStudentsState(prev => 
        prev.map(s => s.id === updatedStudent.id ? updatedStudent : s)
      );
    } catch (error) {
      console.error('Error updating student:', error);
    }
  };

  // Enhanced user update
  const updateCurrentUser = (updatedUser) => {
    try {
      // Update user in the users collection
      const users = getUsers();
      if (users[updatedUser.id]) {
        users[updatedUser.id] = { ...users[updatedUser.id], ...updatedUser };
        localStorage.setItem('hausaStem_users', JSON.stringify(users));
      }
      
      // Update current user state
      const { password: _, ...userWithoutPassword } = updatedUser;
      setCurrentUserState(userWithoutPassword);
      setCurrentUser(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Handle lesson purchase from CourseCatalog
  const handleLessonPurchase = async (courseKey, lessonId) => {
    try {
      if (!currentUser) {
        setMessage('Please log in to purchase lessons');
        return false;
      }

      const success = await purchaseLesson(currentUser.id, courseKey, lessonId);
      if (success) {
        // Refresh user data to reflect the purchase
        const updatedUser = getCurrentUser();
        if (updatedUser) {
          setCurrentUserState(updatedUser);
          setCurrentUser(updatedUser);
        }
        setMessage('✅ Lesson purchased successfully!');
        return true;
      } else {
        setMessage('❌ Failed to purchase lesson. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Error purchasing lesson:', error);
      setMessage('❌ Error processing payment: ' + error.message);
      return false;
    }
  };

  // Check if user can access lesson
  const checkLessonAccess = (courseKey, lessonId) => {
    if (!currentUser) return false;
    return canAccessLesson(currentUser.id, courseKey, lessonId);
  };

  // Get teacher WhatsApp URL
  const getTeacherContactUrl = (teacherId) => {
    return getTeacherWhatsAppUrl(teacherId);
  };

  // Inactivity Warning Modal Component
  const InactivityWarning = () => {
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
  };

  // Demo confirmation info display
  const ConfirmationInfoDisplay = () => showConfirmationInfo && confirmationToken ? (
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
  ) : null;

  // Show message if exists
  const MessageDisplay = () => message ? (
    <div className={`message ${message.includes('success') ? 'success' : message.includes('email') ? 'info' : 'error'}`}>
      {message}
    </div>
  ) : null;

  if (!isInitialized) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading STEM Platform...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Inactivity Warning Modal */}
      <InactivityWarning />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          !currentUser ? (
            <div className="login-container">
              <MessageDisplay />
              <ConfirmationInfoDisplay />
              <LoginForm 
                onLogin={handleLogin} 
                onSwitchToRegister={() => navigate('/register')}
                onSwitchToTeacherRegister={() => navigate('/teacher-register')}
              />
            </div>
          ) : (
            <Navigate to="/dashboard" replace />
          )
        } />
        
        <Route path="/login" element={
          !currentUser ? (
            <div className="login-container">
              <MessageDisplay />
              <ConfirmationInfoDisplay />
              <LoginForm 
                onLogin={handleLogin} 
                onSwitchToRegister={() => navigate('/register')}
                onSwitchToTeacherRegister={() => navigate('/teacher-register')}
              />
            </div>
          ) : (
            <Navigate to="/dashboard" replace />
          )
        } />
        
        <Route path="/register" element={
          !currentUser ? (
            <>
              <MessageDisplay />
              <ConfirmationInfoDisplay />
              <RegisterForm 
                onRegister={handleStudentRegister} 
                onSwitchToLogin={() => navigate('/login')}
              />
            </>
          ) : (
            <Navigate to="/dashboard" replace />
          )
        } />
        
        <Route path="/teacher-register" element={
          !currentUser ? (
            <>
              <MessageDisplay />
              <ConfirmationInfoDisplay />
              <TeacherRegisterForm 
                onRegister={handleTeacherRegister} 
                onSwitchToLogin={() => navigate('/login')}
                onSwitchToStudentRegister={() => navigate('/register')}
              />
            </>
          ) : (
            <Navigate to="/dashboard" replace />
          )
        } />

        <Route path="/email-confirmation" element={
          !currentUser ? (
            <>
              <MessageDisplay />
              <ConfirmationInfoDisplay />
              <EmailConfirmation 
                email={pendingUser?.email}
                onConfirm={handleEmailConfirmation}
                onResend={handleResendConfirmation}
                onCancel={() => navigate('/login')}
              />
            </>
          ) : (
            <Navigate to="/dashboard" replace />
          )
        } />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          currentUser ? (
            <>
              <Navigation currentUser={currentUser} onLogout={handleLogout} />
              <main className="main-content">
                <MessageDisplay />
                <Dashboard student={currentUser} setStudent={updateStudentData} />
              </main>
            </>
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        <Route path="/courses" element={
          currentUser ? (
            <>
              <Navigation currentUser={currentUser} onLogout={handleLogout} />
              <main className="main-content">
                <CourseCatalog 
                  student={currentUser} 
                  setStudent={updateStudentData}
                  onLessonPurchase={handleLessonPurchase}
                  onCheckLessonAccess={checkLessonAccess}
                  onGetTeacherContact={getTeacherContactUrl}
                />
              </main>
            </>
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        <Route path="/profile" element={
          currentUser ? (
            <>
              <Navigation currentUser={currentUser} onLogout={handleLogout} />
              <main className="main-content">
                <StudentProfile student={currentUser} setStudent={updateStudentData} />
              </main>
            </>
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        <Route path="/discussion" element={
          currentUser ? (
            <>
              <Navigation currentUser={currentUser} onLogout={handleLogout} />
              <main className="main-content">
                <DiscussionForum currentUser={currentUser} />
              </main>
            </>
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        {/* Add other routes for About, FAQs, Contact, etc. */}
        <Route path="/about" element={<About />} />
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/careers" element={
          <Careers 
            onTeacherRegister={handleTeacherRegister}
            currentUser={currentUser}
          />
        } />
        <Route path="/support" element={<Support />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          currentUser?.role === 'admin' ? (
            <>
              <Navigation currentUser={currentUser} onLogout={handleLogout} />
              <main className="main-content">
                <AdminDashboard currentUser={currentUser} />
              </main>
            </>
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        <Route path="/admin-courses" element={
          currentUser?.role === 'admin' ? (
            <>
              <Navigation currentUser={currentUser} onLogout={handleLogout} />
              <main className="main-content">
                <AdminCourseManagement currentUser={currentUser} />
              </main>
            </>
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        {/* Teacher Routes */}
        <Route path="/teacher" element={
          currentUser?.role === 'teacher' ? (
            <>
              <Navigation currentUser={currentUser} onLogout={handleLogout} />
              <main className="main-content">
                <TeacherDashboard currentUser={currentUser} setCurrentUser={updateCurrentUser} />
              </main>
            </>
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
