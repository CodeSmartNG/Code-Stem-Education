import React, { useState, useEffect } from 'react';
import { 
  getTeacherCourses,
  addNewCourse, 
  addLessonToCourse, 
  updateCourse,
  deleteCourse,
  updateLesson,
  deleteLesson,
  addMultimediaToLesson,
  deleteMultimediaFromLesson,
  getTeacherStats,
  getTeacherWallet,
  withdrawFromWallet,
  updateTeacherProfileWithWhatsApp,
  getTeacherWhatsAppUrl,
  getCurrentUser
} from '../utils/storage';
import paymentService from '../utils/paymentService';
import './TeacherDashboard.css'; // Make sure to import the CSS

const TeacherDashboard = ({ initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [stats, setStats] = useState(null);
  const [courses, setCoursesState] = useState({});
  const [wallet, setWallet] = useState(null);
  const [teacherProfile, setTeacherProfile] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Payment-related states
  const [transactions, setTransactions] = useState([]);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('paystack');

  // Course Form States
  const [newCourseForm, setNewCourseForm] = useState({
    title: '',
    description: '',
    thumbnail: '📚',
    key: ''
  });

  // Lesson Form States with File Upload and Payment Options
  const [newLessonForm, setNewLessonForm] = useState({
    courseKey: '',
    title: '',
    content: '',
    duration: '',
    videoFile: null,
    videoFileName: '',
    videoTitle: '',
    videoDescription: '',
    isFree: true,
    price: 0,
    isLocked: false
  });

  // Quiz Form States
  const [quizForm, setQuizForm] = useState({
    title: '',
    passingScore: 70,
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    type: 'text',
    options: ['', '', '', ''],
    correctAnswer: 0,
    imageUrl: ''
  });

  const [showQuizForm, setShowQuizForm] = useState(false);

  // Edit States
  const [editingCourse, setEditingCourse] = useState(null);
  const [editCourseForm, setEditCourseForm] = useState({});
  const [editingLesson, setEditingLesson] = useState(null);
  const [editLessonForm, setEditLessonForm] = useState({});
  const [viewingCourseLessons, setViewingCourseLessons] = useState(null);

  // Multimedia States
  const [managingMultimedia, setManagingMultimedia] = useState(null);
  const [newMultimediaForm, setNewMultimediaForm] = useState({
    type: 'video',
    file: null,
    fileName: '',
    title: '',
    description: ''
  });

  // Payment & WhatsApp States
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountName: ''
  });

  // ✅ Convert file to base64 for storage (local storage)
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // ✅ Handle file upload progress simulation
  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
    return interval;
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await loadData();
      await loadTeacherProfile();
      await loadTransactions();
    } catch (error) {
      console.error('Error loading all data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.id) {
        console.error('No user logged in');
        return;
      }

      const teacherStats = getTeacherStats(currentUser.id);
      const teacherCourses = getTeacherCourses(currentUser.id);
      const walletData = getTeacherWallet(currentUser.id);

      setStats(teacherStats);
      setCoursesState(teacherCourses);
      setWallet(walletData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadTeacherProfile = () => {
    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setTeacherProfile(currentUser);
        setWhatsappNumber(currentUser.whatsappNumber || '');
      }
    } catch (error) {
      console.error('Error loading teacher profile:', error);
    }
  };

  const loadTransactions = () => {
    try {
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.id) {
        const userTransactions = paymentService.getUserTransactions(currentUser.id);
        setTransactions(userTransactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  // ✅ Generate payment report
  const generatePaymentReport = () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        alert('Please log in first');
        return;
      }

      const allTransactions = paymentService.getUserTransactions(currentUser.id);
      const completedTransactions = allTransactions.filter(t => t.status === 'completed');
      const totalEarnings = completedTransactions.reduce((sum, t) => sum + t.amount, 0);

      const report = {
        teacherName: currentUser.name || 'Teacher',
        teacherId: currentUser.id,
        generatedAt: new Date().toISOString(),
        totalTransactions: completedTransactions.length,
        totalEarnings: totalEarnings,
        transactions: completedTransactions,
        paymentMethods: {
          paystack: completedTransactions.filter(t => t.paymentMethod === 'paystack').length,
          flutterwave: completedTransactions.filter(t => t.paymentMethod === 'flutterwave').length
        }
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment_report_${currentUser.id}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('📊 Payment report downloaded successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report: ' + error.message);
    }
  };

  // ✅ View transaction details
  const viewTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowPaymentDetails(true);
  };

  // ✅ Save WhatsApp number
  const saveWhatsAppNumber = () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        alert('Please log in first');
        return;
      }

      updateTeacherProfileWithWhatsApp(currentUser.id, {
        whatsappNumber: whatsappNumber
      });
      alert('✅ WhatsApp number saved successfully!');
      loadTeacherProfile();
    } catch (error) {
      alert('❌ Error saving WhatsApp number: ' + error.message);
    }
  };

  // ✅ Process withdrawal
  const handleWithdrawal = () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        alert('Please log in first');
        return;
      }

      if (!withdrawalAmount || withdrawalAmount <= 0) {
        alert('Please enter a valid withdrawal amount');
        return;
      }

      if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountName) {
        alert('Please fill in all bank details');
        return;
      }

      if (window.confirm(`Are you sure you want to withdraw ₦${withdrawalAmount}?`)) {
        const updatedWallet = withdrawFromWallet(currentUser.id, parseFloat(withdrawalAmount), bankDetails);
        setWallet(updatedWallet);
        setWithdrawalAmount('');
        setBankDetails({ bankName: '', accountNumber: '', accountName: '' });
        alert('✅ Withdrawal request submitted successfully!');
        loadTransactions();
      }
    } catch (error) {
      alert('❌ Error processing withdrawal: ' + error.message);
    }
  };

  // Course Management Functions
  const handleAddCourse = (e) => {
    e.preventDefault();
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        alert('Please log in first');
        return;
      }

      const courseData = {
        ...newCourseForm,
        teacherId: currentUser.id,
        teacherName: currentUser.name || 'Teacher',
        createdAt: new Date().toISOString(),
        lessons: []
      };

      addNewCourse(courseData);
      alert('✅ Course added successfully!');
      setNewCourseForm({
        title: '',
        description: '',
        thumbnail: '📚',
        key: ''
      });
      loadData();
      setActiveTab('my-courses');
    } catch (error) {
      alert('❌ Error adding course: ' + error.message);
    }
  };

  const startEditCourse = (courseKey) => {
    const course = courses[courseKey];
    if (!course) {
      alert('Course not found');
      return;
    }
    setEditingCourse(courseKey);
    setEditCourseForm({
      title: course.title || '',
      description: course.description || '',
      thumbnail: course.thumbnail || '📚'
    });
  };

  const cancelEditCourse = () => {
    setEditingCourse(null);
    setEditCourseForm({});
  };

  const handleUpdateCourse = (e) => {
    e.preventDefault();
    try {
      updateCourse(editingCourse, editCourseForm);
      alert('✅ Course updated successfully!');
      setEditingCourse(null);
      setEditCourseForm({});
      loadData();
    } catch (error) {
      alert('❌ Error updating course: ' + error.message);
    }
  };

  const handleDeleteCourse = (courseKey) => {
    if (window.confirm('⚠️ Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        deleteCourse(courseKey);
        alert('✅ Course deleted successfully!');
        loadData();
      } catch (error) {
        alert('❌ Error deleting course: ' + error.message);
      }
    }
  };

  // Quiz Management Functions
  const handleAddQuestion = () => {
    if (!currentQuestion.question.trim()) {
      alert('Please enter a question');
      return;
    }

    if (currentQuestion.options.some(opt => !opt.trim())) {
      alert('Please fill all options');
      return;
    }

    const newQuestion = {
      id: Date.now(),
      ...currentQuestion,
      options: [...currentQuestion.options]
    };

    setQuizForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));

    setCurrentQuestion({
      question: '',
      type: 'text',
      options: ['', '', '', ''],
      correctAnswer: 0,
      imageUrl: ''
    });
  };

  const handleRemoveQuestion = (questionId) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const handleCorrectAnswerChange = (index) => {
    setCurrentQuestion(prev => ({
      ...prev,
      correctAnswer: index
    }));
  };

  const resetQuizForm = () => {
    setQuizForm({
      title: '',
      passingScore: 70,
      questions: []
    });
    setCurrentQuestion({
      question: '',
      type: 'text',
      options: ['', '', '', ''],
      correctAnswer: 0,
      imageUrl: ''
    });
    setShowQuizForm(false);
  };

  // ✅ Handle video file selection
  const handleVideoFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
      if (!validTypes.includes(file.type) && !file.type.startsWith('video/')) {
        alert('Please select a valid video file (MP4, WebM, OGG, MOV, AVI)');
        return;
      }

      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert('Video file size must be less than 100MB');
        return;
      }

      setNewLessonForm({
        ...newLessonForm,
        videoFile: file,
        videoFileName: file.name
      });
    }
  };

  // ✅ Handle multimedia file selection
  const handleMultimediaFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = {
        video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        audio: ['audio/mpeg', 'audio/ogg', 'audio/wav'],
        document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      };

      const allowedTypes = validTypes[newMultimediaForm.type] || [];
      if (!allowedTypes.includes(file.type) && !file.type.startsWith(newMultimediaForm.type === 'video' ? 'video/' : '')) {
        alert(`Please select a valid ${newMultimediaForm.type} file`);
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB');
        return;
      }

      setNewMultimediaForm({
        ...newMultimediaForm,
        file: file,
        fileName: file.name
      });
    }
  };

  // ✅ Add lesson with file upload
  const handleAddLesson = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const progressInterval = simulateUploadProgress();

      const lessonData = {
        title: newLessonForm.title,
        content: newLessonForm.content,
        duration: newLessonForm.duration,
        completed: false,
        multimedia: [],
        quiz: null,
        isFree: newLessonForm.isFree,
        price: newLessonForm.isFree ? 0 : newLessonForm.price,
        isLocked: !newLessonForm.isFree
      };

      // ✅ Add video file if provided
      if (newLessonForm.videoFile) {
        const base64Data = await fileToBase64(newLessonForm.videoFile);
        lessonData.multimedia.push({
          type: 'video',
          url: base64Data,
          title: newLessonForm.videoTitle || newLessonForm.videoFileName || 'Lesson Video',
          description: newLessonForm.videoDescription || 'Video content for this lesson',
          fileName: newLessonForm.videoFileName,
          fileSize: newLessonForm.videoFile.size,
          fileType: newLessonForm.videoFile.type,
          uploadedAt: new Date().toISOString()
        });
      }

      // Add quiz if there are questions
      if (quizForm.questions.length > 0) {
        lessonData.quiz = {
          title: quizForm.title || 'Lesson Quiz',
          passingScore: quizForm.passingScore,
          questions: quizForm.questions
        };
      }

      addLessonToCourse(newLessonForm.courseKey, lessonData);
      alert('✅ Lesson added successfully!');

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Reset all forms
      setNewLessonForm({
        courseKey: '',
        title: '',
        content: '',
        duration: '',
        videoFile: null,
        videoFileName: '',
        videoTitle: '',
        videoDescription: '',
        isFree: true,
        price: 0,
        isLocked: false
      });
      resetQuizForm();
      loadData();
      setIsUploading(false);
    } catch (error) {
      console.error('Error adding lesson:', error);
      alert('❌ Error adding lesson: ' + error.message);
      setIsUploading(false);
    }
  };

  const startViewLessons = (courseKey) => {
    setViewingCourseLessons(courseKey);
    setActiveTab('manage-lessons');
  };

  const startEditLesson = (courseKey, lesson) => {
    setEditingLesson({ courseKey, lessonId: lesson.id });
    setEditLessonForm({
      title: lesson.title || '',
      content: lesson.content || '',
      duration: lesson.duration || '',
      isFree: lesson.isFree !== undefined ? lesson.isFree : true,
      price: lesson.price || 0
    });
  };

  const cancelEditLesson = () => {
    setEditingLesson(null);
    setEditLessonForm({});
  };

  const handleUpdateLesson = (e) => {
    e.preventDefault();
    try {
      const updatedData = {
        ...editLessonForm,
        isLocked: !editLessonForm.isFree
      };

      updateLesson(editingLesson.courseKey, editingLesson.lessonId, updatedData);
      alert('✅ Lesson updated successfully!');
      setEditingLesson(null);
      setEditLessonForm({});
      loadData();
    } catch (error) {
      alert('❌ Error updating lesson: ' + error.message);
    }
  };

  const handleDeleteLesson = (courseKey, lessonId, lessonTitle) => {
    if (window.confirm(`⚠️ Are you sure you want to delete the lesson "${lessonTitle}"?`)) {
      try {
        deleteLesson(courseKey, lessonId);
        alert('✅ Lesson deleted successfully!');
        loadData();
      } catch (error) {
        alert('❌ Error deleting lesson: ' + error.message);
      }
    }
  };

  // ✅ Handle multimedia file upload
  const handleAddMultimedia = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const progressInterval = simulateUploadProgress();
      const multimediaData = { ...newMultimediaForm };

      if (newMultimediaForm.file) {
        const base64Data = await fileToBase64(newMultimediaForm.file);
        multimediaData.url = base64Data;
        multimediaData.fileName = newMultimediaForm.fileName;
        multimediaData.fileSize = newMultimediaForm.file.size;
        multimediaData.fileType = newMultimediaForm.file.type;
      }

      addMultimediaToLesson(
        managingMultimedia.courseKey,
        managingMultimedia.lesson.id,
        multimediaData
      );

      clearInterval(progressInterval);
      setUploadProgress(100);
      alert('✅ Multimedia content added successfully!');

      setNewMultimediaForm({
        type: 'video',
        file: null,
        fileName: '',
        title: '',
        description: ''
      });
      loadData();
      setIsUploading(false);
    } catch (error) {
      console.error('Error adding multimedia:', error);
      alert('❌ Error adding multimedia: ' + error.message);
      setIsUploading(false);
    }
  };

  const handleDeleteMultimedia = (multimediaId, multimediaTitle) => {
    if (window.confirm(`⚠️ Are you sure you want to delete "${multimediaTitle}"?`)) {
      try {
        deleteMultimediaFromLesson(
          managingMultimedia.courseKey,
          managingMultimedia.lesson.id,
          multimediaId
        );
        alert('✅ Multimedia content deleted successfully!');
        loadData();
      } catch (error) {
        alert('❌ Error deleting multimedia: ' + error.message);
      }
    }
  };

  const startManageMultimedia = (courseKey, lesson) => {
    setManagingMultimedia({ courseKey, lesson });
    setActiveTab('manage-multimedia');
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₦0';
    return `₦${amount.toLocaleString() || '0'}`;
  };

  if (loading) {
    return <div className="loading-teacher">📚 Loading teacher dashboard...</div>;
  }

  if (!stats) {
    return <div className="loading-teacher">⚠️ No teacher data found. Please make sure you're logged in as a teacher.</div>;
  }

  return (
    <div className="teacher-dashboard">
      <div className="teacher-header">
        <h3>👨‍🏫 Teacher Dashboard</h3>
        <p>Manage Your Courses, Earnings, and Lessons</p>
      </div>

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            >
              {uploadProgress}%
            </div>
          </div>
          <p>📤 Uploading... Please wait.</p>
        </div>
      )}

      <div className="teacher-tabs">
        <button onClick={() => setActiveTab('overview')} className={activeTab === 'overview' ? 'active' : ''}>
          📊 Overview
        </button>
        <button onClick={() => setActiveTab('my-courses')} className={activeTab === 'my-courses' ? 'active' : ''}>
          📚 My Courses ({Object.keys(courses).length})
        </button>
        <button onClick={() => setActiveTab('manage-lessons')} className={activeTab === 'manage-lessons' ? 'active' : ''}>
          📝 Manage Lessons
        </button>
        <button onClick={() => setActiveTab('add-course')} className={activeTab === 'add-course' ? 'active' : ''}>
          ➕ Add Course
        </button>
        <button onClick={() => setActiveTab('add-lesson')} className={activeTab === 'add-lesson' ? 'active' : ''}>
          ➕ Add Lesson
        </button>
        <button onClick={() => setActiveTab('manage-multimedia')} className={activeTab === 'manage-multimedia' ? 'active' : ''}>
          🎬 Manage Media
        </button>
        <button onClick={() => setActiveTab('earnings')} className={activeTab === 'earnings' ? 'active' : ''}>
          💰 Earnings {wallet && `(${formatCurrency(wallet.balance)})`}
        </button>
        <button onClick={() => setActiveTab('payments')} className={activeTab === 'payments' ? 'active' : ''}>
          💳 Payments
        </button>
        <button onClick={() => setActiveTab('whatsapp')} className={activeTab === 'whatsapp' ? 'active' : ''}>
          📱 WhatsApp
        </button>
      </div>

      <div className="teacher-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {wallet && (
              <div className="wallet-summary">
                <h3>💰 Earnings Summary</h3>
                <div className="wallet-stats">
                  <div className="wallet-stat">
                    <span className="stat-label">Available Balance:</span>
                    <span className="stat-amount">{formatCurrency(wallet.balance)}</span>
                  </div>
                  <div className="wallet-stat">
                    <span className="stat-label">Total Earnings:</span>
                    <span className="stat-amount">{formatCurrency(wallet.totalEarnings)}</span>
                  </div>
                  <div className="wallet-stat">
                    <span className="stat-label">Pending Withdrawals:</span>
                    <span className="stat-amount">{formatCurrency(wallet.pendingWithdrawals)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="stats-grid">
              <div className="stat-card">
                <h3>📚 My Courses</h3>
                <div className="stat-number">{stats.totalCourses}</div>
              </div>
              <div className="stat-card">
                <h3>📝 Total Lessons</h3>
                <div className="stat-number">{stats.totalLessons}</div>
              </div>
              <div className="stat-card">
                <h3>👨‍🎓 Students Enrolled</h3>
                <div className="stat-number">{stats.totalStudents}</div>
              </div>
              <div className="stat-card">
                <h3>💰 Paid Lessons</h3>
                <div className="stat-number">
                  {Object.values(courses).reduce((total, course) => 
                    total + (course.lessons?.filter(lesson => !lesson.isFree).length || 0), 0
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="payments-tab">
            <h3>💳 Payment History & Reports</h3>
            
            <div className="payment-actions">
              <button onClick={generatePaymentReport} className="report-btn">
                📊 Generate Payment Report
              </button>
              <button onClick={() => setActiveTab('earnings')} className="earnings-btn">
                💰 View Earnings
              </button>
            </div>

            <div className="payment-summary">
              <div className="summary-card">
                <h4>Total Transactions</h4>
                <div className="summary-number">
                  {transactions.filter(t => t.status === 'completed').length}
                </div>
              </div>
              <div className="summary-card">
                <h4>Total Earned</h4>
                <div className="summary-number">
                  {formatCurrency(transactions
                    .filter(t => t.status === 'completed')
                    .reduce((sum, t) => sum + (t.amount || 0), 0)
                  )}
                </div>
              </div>
              <div className="summary-card">
                <h4>Pending Payments</h4>
                <div className="summary-number">
                  {transactions.filter(t => t.status === 'pending').length}
                </div>
              </div>
            </div>

            <div className="transactions-list-full">
              <h4>Transaction History</h4>
              {transactions.length > 0 ? (
                <div className="transactions-table">
                  <div className="table-header">
                    <span>Reference</span>
                    <span>Amount</span>
                    <span>Method</span>
                    <span>Status</span>
                    <span>Date</span>
                    <span>Action</span>
                  </div>
                  {transactions.map((transaction, index) => (
                    <div key={index} className="table-row">
                      <span className="ref">{transaction.reference}</span>
                      <span className="amount">{formatCurrency(transaction.amount)}</span>
                      <span className="method">{transaction.paymentMethod}</span>
                      <span className={`status ${transaction.status}`}>
                        {transaction.status === 'completed' ? '✅' : 
                         transaction.status === 'pending' ? '⏳' : '❌'}
                        {transaction.status}
                      </span>
                      <span className="date">{new Date(transaction.createdAt).toLocaleDateString()}</span>
                      <span className="action">
                        <button 
                          onClick={() => viewTransactionDetails(transaction)}
                          className="view-btn"
                        >
                          View
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-transactions">No transactions yet.</p>
              )}
            </div>

            {/* Payment Details Modal */}
            {showPaymentDetails && selectedTransaction && (
              <div className="modal-overlay" onClick={() => {
                setShowPaymentDetails(false);
                setSelectedTransaction(null);
              }}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>Transaction Details</h3>
                  <button 
                    className="modal-close"
                    onClick={() => {
                      setShowPaymentDetails(false);
                      setSelectedTransaction(null);
                    }}
                  >
                    ×
                  </button>
                  <div className="transaction-details-modal">
                    <div className="detail-row">
                      <span className="label">Reference:</span>
                      <span className="value">{selectedTransaction.reference}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Amount:</span>
                      <span className="value">{formatCurrency(selectedTransaction.amount)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Payment Method:</span>
                      <span className="value">{selectedTransaction.paymentMethod}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Status:</span>
                      <span className={`value status ${selectedTransaction.status}`}>
                        {selectedTransaction.status}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Date:</span>
                      <span className="value">{new Date(selectedTransaction.createdAt).toLocaleString()}</span>
                    </div>
                    {selectedTransaction.paymentData && (
                      <div className="detail-row">
                        <span className="label">Payment Data:</span>
                        <span className="value">
                          <pre>{JSON.stringify(selectedTransaction.paymentData, null, 2)}</pre>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="earnings-tab">
            <h3>💰 Earnings & Withdrawals</h3>

            {wallet ? (
              <div className="earnings-content">
                <div className="balance-card">
                  <h4>Available Balance</h4>
                  <div className="balance-amount">{formatCurrency(wallet.balance)}</div>
                  <p>Total Earnings: {formatCurrency(wallet.totalEarnings)}</p>
                  <p>Pending Withdrawals: {formatCurrency(wallet.pendingWithdrawals)}</p>
                </div>

                {/* Payment Methods Section */}
                <div className="payment-methods-section">
                  <h4>Payment Methods</h4>
                  <div className="payment-methods-grid">
                    <div className="payment-method-card">
                      <div className="method-icon">🏦</div>
                      <h5>Paystack</h5>
                      <p>Cards, Bank Transfer, USSD</p>
                      <button 
                        className={`select-method-btn ${paymentMethod === 'paystack' ? 'selected' : ''}`}
                        onClick={() => setPaymentMethod('paystack')}
                      >
                        {paymentMethod === 'paystack' ? '✓ Selected' : 'Select'}
                      </button>
                    </div>
                    <div className="payment-method-card">
                      <div className="method-icon">🌊</div>
                      <h5>Flutterwave</h5>
                      <p>Cards, Bank, Mobile Money</p>
                      <button 
                        className={`select-method-btn ${paymentMethod === 'flutterwave' ? 'selected' : ''}`}
                        onClick={() => setPaymentMethod('flutterwave')}
                      >
                        {paymentMethod === 'flutterwave' ? '✓ Selected' : 'Select'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="withdrawal-section">
                  <h4>Withdraw Funds</h4>
                  <div className="withdrawal-form">
                    <div className="form-group">
                      <label>Amount to Withdraw (₦)</label>
                      <input
                        type="number"
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="100"
                        max={wallet.balance}
                      />
                      <small>Minimum withdrawal: ₦100</small>
                    </div>

                    <div className="form-group">
                      <label>Bank Name</label>
                      <input
                        type="text"
                        value={bankDetails.bankName}
                        onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                        placeholder="e.g., GTBank, Zenith Bank"
                      />
                    </div>

                    <div className="form-group">
                      <label>Account Number</label>
                      <input
                        type="text"
                        value={bankDetails.accountNumber}
                        onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                        placeholder="10-digit account number"
                      />
                    </div>

                    <div className="form-group">
                      <label>Account Name</label>
                      <input
                        type="text"
                        value={bankDetails.accountName}
                        onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                        placeholder="Name as it appears on bank account"
                      />
                    </div>

                    <button 
                      onClick={handleWithdrawal}
                      disabled={!withdrawalAmount || withdrawalAmount > wallet.balance}
                      className="withdraw-btn"
                    >
                      Request Withdrawal
                    </button>
                  </div>
                </div>

                <div className="transaction-history">
                  <h4>Transaction History</h4>
                  {wallet.transactions && wallet.transactions.length > 0 ? (
                    <div className="transactions-list">
                      {wallet.transactions.map((transaction, index) => (
                        <div key={index} className="transaction-item">
                          <div className="transaction-info">
                            <span className={`transaction-type ${transaction.type}`}>
                              {transaction.type === 'credit' ? '💰 Credit' : '💸 Withdrawal'}
                            </span>
                            <span className="transaction-amount">
                              {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                            </span>
                          </div>
                          <div className="transaction-details">
                            <span className="transaction-description">{transaction.description}</span>
                            <span className="transaction-date">
                              {new Date(transaction.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-transactions">No transactions yet</p>
                  )}
                </div>
              </div>
            ) : (
              <p>Loading wallet information...</p>
            )}
          </div>
        )}

        {/* WhatsApp Tab */}
        {activeTab === 'whatsapp' && (
          <div className="whatsapp-tab">
            <h3>📱 WhatsApp Contact</h3>
            <p>Add your WhatsApp number so students can contact you directly</p>

            <div className="whatsapp-form">
              <div className="form-group">
                <label>WhatsApp Phone Number</label>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g., 2348012345678"
                />
                <small>Include country code without + sign (e.g., 2348012345678 for Nigeria)</small>
              </div>

              <button onClick={saveWhatsAppNumber} className="save-btn">
                💾 Save WhatsApp Number
              </button>

              {teacherProfile.whatsappNumber && (
                <div className="whatsapp-preview">
                  <h4>Your WhatsApp Contact Link:</h4>
                  <div className="whatsapp-link">
                    <a 
                      href={getTeacherWhatsAppUrl(teacherProfile.id)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="whatsapp-btn"
                    >
                      💬 Chat on WhatsApp
                    </a>
                  </div>
                  <p>Share this link with your students for direct communication</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Courses Tab - Keep existing code */}
        {/* ... (rest of the tabs remain the same) ... */}
      </div>
    </div>
  );
};

export default TeacherDashboard;