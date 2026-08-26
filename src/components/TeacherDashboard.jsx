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
  getCurrentUser,
  // ✅ Firebase-specific functions
  uploadFile,
  getFileUrl
} from '../utils/storage';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [courses, setCoursesState] = useState({});
  const [wallet, setWallet] = useState(null);
  const [teacherProfile, setTeacherProfile] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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

  // ✅ Upload file to Firebase Storage
  const uploadFileToFirebase = async (file, path) => {
    try {
      const fileUrl = await uploadFile(file, path);
      return fileUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // ✅ Convert file to base64 (fallback for small files)
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
    loadData();
    loadTeacherProfile();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        console.error('No user logged in');
        return;
      }

      const teacherStats = await getTeacherStats(currentUser.uid);
      const teacherCourses = await getTeacherCourses(currentUser.uid);
      const walletData = await getTeacherWallet(currentUser.uid);

      setStats(teacherStats);
      setCoursesState(teacherCourses);
      setWallet(walletData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadTeacherProfile = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setTeacherProfile(currentUser);
        setWhatsappNumber(currentUser.whatsappNumber || '');
      }
    } catch (error) {
      console.error('Error loading teacher profile:', error);
    }
  };

  // ✅ Save WhatsApp number
  const saveWhatsAppNumber = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        alert('Please log in first');
        return;
      }

      await updateTeacherProfileWithWhatsApp(currentUser.uid, {
        whatsappNumber: whatsappNumber
      });
      alert('✅ WhatsApp number saved successfully!');
      await loadTeacherProfile();
    } catch (error) {
      alert('❌ Error saving WhatsApp number: ' + error.message);
    }
  };

  // ✅ Process withdrawal
  const handleWithdrawal = async () => {
    try {
      const currentUser = await getCurrentUser();
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
        const updatedWallet = await withdrawFromWallet(currentUser.uid, parseFloat(withdrawalAmount), bankDetails);
        setWallet(updatedWallet);
        setWithdrawalAmount('');
        setBankDetails({ bankName: '', accountNumber: '', accountName: '' });
        alert('✅ Withdrawal request submitted successfully!');
      }
    } catch (error) {
      alert('❌ Error processing withdrawal: ' + error.message);
    }
  };

  // Course Management Functions
  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        alert('Please log in first');
        return;
      }

      const courseData = {
        ...newCourseForm,
        teacherId: currentUser.uid,
        teacherName: currentUser.name || 'Teacher',
        createdAt: new Date().toISOString(),
        lessons: []
      };

      await addNewCourse(courseData);
      alert('Course added successfully!');
      setNewCourseForm({
        title: '',
        description: '',
        thumbnail: '📚',
        key: ''
      });
      await loadData();
      setActiveTab('my-courses');
    } catch (error) {
      alert('Error adding course: ' + error.message);
    }
  };

  const startEditCourse = (courseKey) => {
    const course = courses[courseKey];
    setEditingCourse(courseKey);
    setEditCourseForm({
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail
    });
  };

  const cancelEditCourse = () => {
    setEditingCourse(null);
    setEditCourseForm({});
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    try {
      await updateCourse(editingCourse, editCourseForm);
      alert('Course updated successfully!');
      setEditingCourse(null);
      setEditCourseForm({});
      await loadData();
    } catch (error) {
      alert('Error updating course: ' + error.message);
    }
  };

  const handleDeleteCourse = async (courseKey) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        await deleteCourse(courseKey);
        alert('Course deleted successfully!');
        await loadData();
      } catch (error) {
        alert('Error deleting course: ' + error.message);
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
      id: quizForm.questions.length + 1,
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

      // Validate file size (max 100MB for Firebase)
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

      // Validate file size (max 50MB for Firebase)
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

  // ✅ Add lesson with file upload to Firebase
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

      // ✅ Upload video file to Firebase Storage
      if (newLessonForm.videoFile) {
        const currentUser = await getCurrentUser();
        const filePath = `teachers/${currentUser.uid}/videos/${Date.now()}_${newLessonForm.videoFileName}`;
        const fileUrl = await uploadFileToFirebase(newLessonForm.videoFile, filePath);
        
        lessonData.multimedia.push({
          type: 'video',
          url: fileUrl,
          title: newLessonForm.videoTitle || newLessonForm.videoFileName || 'Lesson Video',
          description: newLessonForm.videoDescription || 'Video content for this lesson',
          fileName: newLessonForm.videoFileName,
          fileSize: newLessonForm.videoFile.size,
          fileType: newLessonForm.videoFile.type,
          uploadedAt: new Date().toISOString(),
          firebasePath: filePath
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

      await addLessonToCourse(newLessonForm.courseKey, lessonData);
      alert('Lesson added successfully!');

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
      await loadData();
      setIsUploading(false);
    } catch (error) {
      console.error('Error adding lesson:', error);
      alert('Error adding lesson: ' + error.message);
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
      title: lesson.title,
      content: lesson.content,
      duration: lesson.duration,
      isFree: lesson.isFree,
      price: lesson.price
    });
  };

  const cancelEditLesson = () => {
    setEditingLesson(null);
    setEditLessonForm({});
  };

  const handleUpdateLesson = async (e) => {
    e.preventDefault();
    try {
      const updatedData = {
        ...editLessonForm,
        isLocked: !editLessonForm.isFree
      };

      await updateLesson(editingLesson.courseKey, editingLesson.lessonId, updatedData);
      alert('Lesson updated successfully!');
      setEditingLesson(null);
      setEditLessonForm({});
      await loadData();
    } catch (error) {
      alert('Error updating lesson: ' + error.message);
    }
  };

  const handleDeleteLesson = async (courseKey, lessonId, lessonTitle) => {
    if (window.confirm(`Are you sure you want to delete the lesson "${lessonTitle}"?`)) {
      try {
        await deleteLesson(courseKey, lessonId);
        alert('Lesson deleted successfully!');
        await loadData();
      } catch (error) {
        alert('Error deleting lesson: ' + error.message);
      }
    }
  };

  // ✅ Handle multimedia file upload to Firebase
  const handleAddMultimedia = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const progressInterval = simulateUploadProgress();
      const multimediaData = { ...newMultimediaForm };

      if (newMultimediaForm.file) {
        const currentUser = await getCurrentUser();
        const filePath = `teachers/${currentUser.uid}/media/${Date.now()}_${newMultimediaForm.fileName}`;
        const fileUrl = await uploadFileToFirebase(newMultimediaForm.file, filePath);
        
        multimediaData.url = fileUrl;
        multimediaData.fileName = newMultimediaForm.fileName;
        multimediaData.fileSize = newMultimediaForm.file.size;
        multimediaData.fileType = newMultimediaForm.file.type;
        multimediaData.firebasePath = filePath;
      }

      await addMultimediaToLesson(
        managingMultimedia.courseKey,
        managingMultimedia.lesson.id,
        multimediaData
      );

      clearInterval(progressInterval);
      setUploadProgress(100);
      alert('Multimedia content added successfully!');

      setNewMultimediaForm({
        type: 'video',
        file: null,
        fileName: '',
        title: '',
        description: ''
      });
      await loadData();
      setIsUploading(false);
    } catch (error) {
      console.error('Error adding multimedia:', error);
      alert('Error adding multimedia: ' + error.message);
      setIsUploading(false);
    }
  };

  const handleDeleteMultimedia = async (multimediaId, multimediaTitle) => {
    if (window.confirm(`Are you sure you want to delete "${multimediaTitle}"?`)) {
      try {
        await deleteMultimediaFromLesson(
          managingMultimedia.courseKey,
          managingMultimedia.lesson.id,
          multimediaId
        );
        alert('Multimedia content deleted successfully!');
        await loadData();
      } catch (error) {
        alert('Error deleting multimedia: ' + error.message);
      }
    }
  };

  const startManageMultimedia = (courseKey, lesson) => {
    setManagingMultimedia({ courseKey, lesson });
    setActiveTab('manage-multimedia');
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  if (!stats) {
    return <div className="loading-teacher">Loading teacher data...</div>;
  }

  return (
    <div className="teacher-dashboard">
      <div className="teacher-header">
        <h3>Teacher Dashboard</h3>
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
          <p>Uploading to Firebase... Please wait.</p>
        </div>
      )}

      <div className="teacher-tabs">
        <button onClick={() => setActiveTab('overview')} className={activeTab === 'overview' ? 'active' : ''}>
          Overview
        </button>
        <button onClick={() => setActiveTab('my-courses')} className={activeTab === 'my-courses' ? 'active' : ''}>
          My Courses ({Object.keys(courses).length})
        </button>
        <button onClick={() => setActiveTab('manage-lessons')} className={activeTab === 'manage-lessons' ? 'active' : ''}>
          Manage Lessons
        </button>
        <button onClick={() => setActiveTab('add-course')} className={activeTab === 'add-course' ? 'active' : ''}>
          Add Course
        </button>
        <button onClick={() => setActiveTab('add-lesson')} className={activeTab === 'add-lesson' ? 'active' : ''}>
          Add Lesson
        </button>
        <button onClick={() => setActiveTab('manage-multimedia')} className={activeTab === 'manage-multimedia' ? 'active' : ''}>
          Manage Media
        </button>
        <button onClick={() => setActiveTab('earnings')} className={activeTab === 'earnings' ? 'active' : ''}>
          💰 Earnings {wallet && `(${formatCurrency(wallet.balance)})`}
        </button>
        <button onClick={() => setActiveTab('whatsapp')} className={activeTab === 'whatsapp' ? 'active' : ''}>
          📱 WhatsApp
        </button>
      </div>

      <div className="teacher-content">
        {/* Overview Tab - Same as before */}
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
                <h3>My Courses</h3>
                <div className="stat-number">{stats.totalCourses}</div>
              </div>
              <div className="stat-card">
                <h3>Total Lessons</h3>
                <div className="stat-number">{stats.totalLessons}</div>
              </div>
              <div className="stat-card">
                <h3>Students Enrolled</h3>
                <div className="stat-number">{stats.totalStudents}</div>
              </div>
              <div className="stat-card">
                <h3>Paid Lessons</h3>
                <div className="stat-number">
                  {Object.values(courses).reduce((total, course) => 
                    total + (course.lessons?.filter(lesson => !lesson.isFree).length || 0), 0
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Earnings Tab - Same as before */}
        {activeTab === 'earnings' && (
          <div className="earnings-tab">
            <h3>💰 Earnings & Withdrawals</h3>
            {wallet ? (
              <div className="earnings-content">
                <div className="balance-card">
                  <h4>Available Balance</h4>
                  <div className="balance-amount">{formatCurrency(wallet.balance)}</div>
                  <p>Total Earnings: {formatCurrency(wallet.totalEarnings)}</p>
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

        {/* WhatsApp Tab - Same as before */}
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
                Save WhatsApp Number
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

        {/* My Courses Tab - Updated for Firebase */}
        {activeTab === 'my-courses' && (
          <div className="courses-tab">
            <h3>My Courses</h3>
            <div className="courses-list">
              {Object.entries(courses).map(([key, course]) => (
                <div key={key} className="course-teacher-card">
                  {editingCourse === key ? (
                    <div className="edit-course-form">
                      <h4>Edit Course: {course.title}</h4>
                      <form onSubmit={handleUpdateCourse} className="teacher-form">
                        <div className="form-group">
                          <label>Course Title</label>
                          <input
                            type="text"
                            value={editCourseForm.title}
                            onChange={(e) => setEditCourseForm({...editCourseForm, title: e.target.value})}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Description</label>
                          <textarea
                            value={editCourseForm.description}
                            onChange={(e) => setEditCourseForm({...editCourseForm, description: e.target.value})}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Thumbnail Emoji</label>
                          <input
                            type="text"
                            value={editCourseForm.thumbnail}
                            onChange={(e) => setEditCourseForm({...editCourseForm, thumbnail: e.target.value})}
                          />
                        </div>
                        <div className="form-actions">
                          <button type="submit" className="save-btn">Save Changes</button>
                          <button type="button" onClick={cancelEditCourse} className="cancel-btn">Cancel</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <>
                      <div className="course-header">
                        <span className="course-thumbnail">{course.thumbnail}</span>
                        <div className="course-info">
                          <h4>{course.title}</h4>
                          <p className="course-description">{course.description}</p>
                        </div>
                      </div>
                      <div className="course-stats">
                        <span>Lessons: {course.lessons?.length || 0}</span>
                        <span>Free: {course.lessons?.filter(lesson => lesson.isFree).length || 0}</span>
                        <span>Paid: {course.lessons?.filter(lesson => !lesson.isFree).length || 0}</span>
                      </div>
                      <div className="course-actions">
                        <button className="edit-btn" onClick={() => startEditCourse(key)}>Edit</button>
                        <button className="view-btn" onClick={() => startViewLessons(key)}>Manage Lessons</button>
                        <button className="delete-btn" onClick={() => handleDeleteCourse(key)}>Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manage Lessons Tab - Updated for Firebase */}
        {activeTab === 'manage-lessons' && (
          <div className="manage-lessons-tab">
            <h3>
              Manage Lessons 
              {viewingCourseLessons && ` - ${courses[viewingCourseLessons]?.title}`}
            </h3>

            {!viewingCourseLessons ? (
              <div className="select-course-prompt">
                <p>Select a course to manage its lessons:</p>
                <div className="course-buttons">
                  {Object.entries(courses).map(([key, course]) => (
                    <button 
                      key={key} 
                      className="course-select-btn"
                      onClick={() => startViewLessons(key)}
                    >
                      {course.thumbnail} {course.title}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="lessons-management">
                <button 
                  className="back-to-courses"
                  onClick={() => setViewingCourseLessons(null)}
                >
                  ← Back to Courses
                </button>

                <div className="lessons-list">
                  {courses[viewingCourseLessons]?.lessons?.map((lesson) => (
                    <div key={lesson.id} className="lesson-teacher-card">
                      {editingLesson?.courseKey === viewingCourseLessons && editingLesson.lessonId === lesson.id ? (
                        <div className="edit-lesson-form">
                          <h4>Edit Lesson</h4>
                          <form onSubmit={handleUpdateLesson} className="teacher-form">
                            <div className="form-group">
                              <label>Lesson Title</label>
                              <input
                                type="text"
                                value={editLessonForm.title}
                                onChange={(e) => setEditLessonForm({...editLessonForm, title: e.target.value})}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Lesson Content</label>
                              <textarea
                                value={editLessonForm.content}
                                onChange={(e) => setEditLessonForm({...editLessonForm, content: e.target.value})}
                                required
                                rows="4"
                              />
                            </div>
                            <div className="form-group">
                              <label>Duration</label>
                              <input
                                type="text"
                                value={editLessonForm.duration}
                                onChange={(e) => setEditLessonForm({...editLessonForm, duration: e.target.value})}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Lesson Type</label>
                              <div className="pricing-options">
                                <label>
                                  <input
                                    type="radio"
                                    name="lessonType"
                                    checked={editLessonForm.isFree}
                                    onChange={() => setEditLessonForm({...editLessonForm, isFree: true, price: 0})}
                                  />
                                  Free Lesson
                                </label>
                                <label>
                                  <input
                                    type="radio"
                                    name="lessonType"
                                    checked={!editLessonForm.isFree}
                                    onChange={() => setEditLessonForm({...editLessonForm, isFree: false, price: editLessonForm.price || 500})}
                                  />
                                  Paid Lesson
                                </label>
                              </div>
                            </div>
                            {!editLessonForm.isFree && (
                              <div className="form-group">
                                <label>Price (₦)</label>
                                <input
                                  type="number"
                                  value={editLessonForm.price}
                                  onChange={(e) => setEditLessonForm({...editLessonForm, price: parseInt(e.target.value) || 0})}
                                  min="100"
                                  max="10000"
                                />
                              </div>
                            )}
                            <div className="form-actions">
                              <button type="submit" className="save-btn">Save Changes</button>
                              <button type="button" onClick={cancelEditLesson} className="cancel-btn">Cancel</button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <>
                          <div className="lesson-info">
                            <h5>{lesson.title}</h5>
                            <p><strong>Duration:</strong> {lesson.duration}</p>
                            <p><strong>Type:</strong> 
                              <span className={`lesson-type ${lesson.isFree ? 'free' : 'paid'}`}>
                                {lesson.isFree ? ' FREE' : ` PAID - ${formatCurrency(lesson.price)}`}
                              </span>
                            </p>
                            <p className="lesson-content-preview">{lesson.content.substring(0, 100)}...</p>
                            {lesson.multimedia && lesson.multimedia.length > 0 && (
                              <div className="lesson-media-indicator">
                                🎬 {lesson.multimedia.length} media file(s)
                              </div>
                            )}
                            {lesson.quiz && (
                              <div className="lesson-quiz-indicator">
                                📝 Has quiz ({lesson.quiz.questions.length} questions)
                              </div>
                            )}
                          </div>
                          <div className="lesson-actions">
                            <button 
                              className="edit-btn"
                              onClick={() => startEditLesson(viewingCourseLessons, lesson)}
                            >
                              Edit
                            </button>
                            <button 
                              className="media-btn"
                              onClick={() => startManageMultimedia(viewingCourseLessons, lesson)}
                            >
                              Media
                            </button>
                            <button 
                              className="delete-btn"
                              onClick={() => handleDeleteLesson(viewingCourseLessons, lesson.id, lesson.title)}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Course Tab - Updated for Firebase */}
        {activeTab === 'add-course' && (
          <div className="add-course-tab">
            <h3>Add New Course</h3>
            <form onSubmit={handleAddCourse} className="teacher-form">
              <div className="form-group">
                <label>Course Title</label>
                <input
                  type="text"
                  value={newCourseForm.title}
                  onChange={(e) => setNewCourseForm({...newCourseForm, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newCourseForm.description}
                  onChange={(e) => setNewCourseForm({...newCourseForm, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Thumbnail Emoji</label>
                <input
                  type="text"
                  value={newCourseForm.thumbnail}
                  onChange={(e) => setNewCourseForm({...newCourseForm, thumbnail: e.target.value})}
                  placeholder="🌐"
                />
              </div>
              <div className="form-group">
                <label>Course Key (auto-generated if empty)</label>
                <input
                  type="text"
                  value={newCourseForm.key}
                  onChange={(e) => setNewCourseForm({...newCourseForm, key: e.target.value})}
                  placeholder="webDevelopment"
                />
              </div>
              <button type="submit" className="submit-btn">Add Course</button>
            </form>
          </div>
        )}

        {/* Add Lesson Tab - Updated for Firebase with File Upload */}
        {activeTab === 'add-lesson' && (
          <div className="add-lesson-tab">
            <h3>Add New Lesson</h3>
            <form onSubmit={handleAddLesson} className="teacher-form">
              <div className="form-group">
                <label>Select Course</label>
                <select
                  value={newLessonForm.courseKey}
                  onChange={(e) => setNewLessonForm({...newLessonForm, courseKey: e.target.value})}
                  required
                >
                  <option value="">Choose a course</option>
                  {Object.entries(courses).map(([key, course]) => (
                    <option key={key} value={key}>{course.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Lesson Title</label>
                <input
                  type="text"
                  value={newLessonForm.title}
                  onChange={(e) => setNewLessonForm({...newLessonForm, title: e.target.value})}
                  required
                />
              </div>

              {/* Lesson Pricing Section */}
              <div className="pricing-section">
                <h4>Lesson Pricing</h4>
                <div className="pricing-options">
                  <label className="pricing-option">
                    <input
                      type="radio"
                      name="lessonType"
                      checked={newLessonForm.isFree}
                      onChange={() => setNewLessonForm({...newLessonForm, isFree: true, price: 0})}
                    />
                    <span className="option-label">Free Lesson</span>
                    <span className="option-description">Students can access for free</span>
                  </label>

                  <label className="pricing-option">
                    <input
                      type="radio"
                      name="lessonType"
                      checked={!newLessonForm.isFree}
                      onChange={() => setNewLessonForm({...newLessonForm, isFree: false, price: 500})}
                    />
                    <span className="option-label">Paid Lesson</span>
                    <span className="option-description">Students pay to access</span>
                  </label>
                </div>

                {!newLessonForm.isFree && (
                  <div className="price-input">
                    <div className="form-group">
                      <label>Lesson Price (₦)</label>
                      <input
                        type="number"
                        value={newLessonForm.price}
                        onChange={(e) => setNewLessonForm({...newLessonForm, price: parseInt(e.target.value) || 0})}
                        min="100"
                        max="10000"
                        required
                      />
                      <small>Price between ₦100 - ₦10,000</small>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Lesson Content</label>
                <textarea
                  value={newLessonForm.content}
                  onChange={(e) => setNewLessonForm({...newLessonForm, content: e.target.value})}
                  required
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Duration</label>
                <input
                  type="text"
                  value={newLessonForm.duration}
                  onChange={(e) => setNewLessonForm({...newLessonForm, duration: e.target.value})}
                  placeholder="30 minutes"
                  required
                />
              </div>

              {/* Video Upload Section - Firebase Storage */}
              <div className="video-upload-section">
                <h4>📹 Upload Video (Optional)</h4>
                <div className="form-group">
                  <label>Select Video File</label>
                  <div className="file-upload-wrapper">
                    <input
                      type="file"
                      id="videoFile"
                      accept="video/*,.mp4,.webm,.ogg,.mov,.avi"
                      onChange={handleVideoFileSelect}
                      className="file-input"
                    />
                    <label htmlFor="videoFile" className="file-upload-label">
                      <span className="upload-icon">📤</span>
                      {newLessonForm.videoFileName ? (
                        <span className="file-name">{newLessonForm.videoFileName}</span>
                      ) : (
                        <span>Choose Video File (MP4, WebM, OGG, MOV, AVI)</span>
                      )}
                    </label>
                  </div>
                  <small className="help-text">
                    Max file size: 100MB • Uploads to Firebase Storage
                  </small>
                </div>

                {newLessonForm.videoFile && (
                  <div className="file-preview">
                    <video controls style={{ maxWidth: '100%', maxHeight: '300px' }}>
                      <source src={URL.createObjectURL(newLessonForm.videoFile)} type={newLessonForm.videoFile.type} />
                      Your browser does not support the video tag.
                    </video>
                    <p className="file-details">
                      File: {newLessonForm.videoFileName} • Size: {(newLessonForm.videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                )}

                <div className="form-group">
                  <label>Video Title</label>
                  <input
                    type="text"
                    value={newLessonForm.videoTitle}
                    onChange={(e) => setNewLessonForm({...newLessonForm, videoTitle: e.target.value})}
                    placeholder="Lesson Video Tutorial"
                  />
                </div>

                <div className="form-group">
                  <label>Video Description</label>
                  <input
                    type="text"
                    value={newLessonForm.videoDescription}
                    onChange={(e) => setNewLessonForm({...newLessonForm, videoDescription: e.target.value})}
                    placeholder="Watch this video to learn more"
                  />
                </div>
              </div>

              {/* Quiz Section - Same as before */}
              <div className="quiz-section">
                <div className="section-header">
                  <h4>Quiz Content (Optional)</h4>
                  <button 
                    type="button"
                    onClick={() => setShowQuizForm(!showQuizForm)}
                    className="toggle-btn"
                  >
                    {showQuizForm ? 'Hide Quiz Form' : 'Add Quiz'}
                  </button>
                </div>

                {showQuizForm && (
                  <div className="quiz-form">
                    {/* Quiz form content - same as before */}
                    <div className="form-group">
                      <label>Quiz Title</label>
                      <input
                        type="text"
                        value={quizForm.title}
                        onChange={(e) => setQuizForm({...quizForm, title: e.target.value})}
                        placeholder="Lesson Quiz"
                      />
                    </div>

                    <div className="form-group">
                      <label>Passing Score (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={quizForm.passingScore}
                        onChange={(e) => setQuizForm({...quizForm, passingScore: parseInt(e.target.value) || 70})}
                      />
                    </div>

                    <div className="current-question">
                      <h5>Add New Question</h5>

                      <div className="form-group">
                        <label>Question Type</label>
                        <select
                          value={currentQuestion.type}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, type: e.target.value})}
                        >
                          <option value="text">Text Question</option>
                          <option value="image">Image Question</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Question Text</label>
                        <input
                          type="text"
                          value={currentQuestion.question}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
                          placeholder="Enter your question here"
                        />
                      </div>

                      {currentQuestion.type === 'image' && (
                        <div className="form-group">
                          <label>Image URL</label>
                          <input
                            type="url"
                            value={currentQuestion.imageUrl}
                            onChange={(e) => setCurrentQuestion({...currentQuestion, imageUrl: e.target.value})}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      )}

                      <div className="options-section">
                        <h6>Options</h6>
                        {currentQuestion.options.map((option, index) => (
                          <div key={index} className="option-item">
                            <input
                              type="radio"
                              name="correctAnswer"
                              checked={currentQuestion.correctAnswer === index}
                              onChange={() => handleCorrectAnswerChange(index)}
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              placeholder={`Option ${index + 1}`}
                              className="option-input"
                            />
                            <span className="correct-label">
                              {currentQuestion.correctAnswer === index ? 'Correct' : ''}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button 
                        type="button" 
                        onClick={handleAddQuestion}
                        className="add-question-btn"
                      >
                        Add Question to Quiz
                      </button>
                    </div>

                    {quizForm.questions.length > 0 && (
                      <div className="existing-questions">
                        <h5>Questions in Quiz ({quizForm.questions.length})</h5>
                        {quizForm.questions.map((question, index) => (
                          <div key={question.id} className="question-item">
                            <div className="question-info">
                              <strong>Q{index + 1}:</strong> {question.question}
                              {question.type === 'image' && question.imageUrl && (
                                <div className="question-image-preview">
                                  <img src={question.imageUrl} alt="Question" style={{maxWidth: '100px'}} />
                                </div>
                              )}
                              <div className="options-preview">
                                Options: {question.options.join(', ')}
                              </div>
                              <div className="correct-answer">
                                Correct: Option {question.correctAnswer + 1}
                              </div>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleRemoveQuestion(question.id)}
                              className="remove-btn"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button type="submit" className="submit-btn" disabled={isUploading}>
                {isUploading ? 'Uploading to Firebase...' : 'Add Lesson'}
              </button>
            </form>
          </div>
        )}

        {/* Manage Multimedia Tab - Updated for Firebase */}
        {activeTab === 'manage-multimedia' && (
          <div className="manage-multimedia-tab">
            <h3>
              Manage Multimedia Content
              {managingMultimedia && ` - ${managingMultimedia.lesson.title}`}
            </h3>

            {!managingMultimedia ? (
              <div className="select-lesson-prompt">
                <p>Select a lesson to manage its multimedia content:</p>
                <div className="lessons-grid">
                  {Object.entries(courses).map(([courseKey, course]) =>
                    course.lessons?.map(lesson => (
                      <div key={`${courseKey}-${lesson.id}`} className="lesson-select-card">
                        <div className="lesson-info">
                          <strong>{lesson.title}</strong>
                          <span>Course: {course.title}</span>
                          <span>Type: {lesson.isFree ? 'FREE' : `PAID - ${formatCurrency(lesson.price)}`}</span>
                        </div>
                        <div className="multimedia-stats">
                          {lesson.multimedia && lesson.multimedia.length > 0 ? (
                            <span className="has-media">📹 {lesson.multimedia.length} media files</span>
                          ) : (
                            <span className="no-media">No media</span>
                          )}
                        </div>
                        <button 
                          className="manage-media-btn"
                          onClick={() => startManageMultimedia(courseKey, lesson)}
                        >
                          Manage Media
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="multimedia-management">
                <div className="management-header">
                  <button 
                    className="back-to-lessons"
                    onClick={() => setManagingMultimedia(null)}
                  >
                    ← Back to Lessons
                  </button>
                  <h4>Managing: {managingMultimedia.lesson.title}</h4>
                </div>

                {/* Add New Multimedia Form with Firebase Upload */}
                <div className="add-multimedia-form">
                  <h5>Add New Multimedia Content</h5>
                  <form onSubmit={handleAddMultimedia} className="teacher-form compact">
                    <div className="form-group">
                      <label>Media Type</label>
                      <select
                        value={newMultimediaForm.type}
                        onChange={(e) => {
                          setNewMultimediaForm({
                            ...newMultimediaForm,
                            type: e.target.value,
                            file: null,
                            fileName: ''
                          });
                        }}
                        required
                      >
                        <option value="video">Video</option>
                        <option value="image">Image</option>
                        <option value="audio">Audio</option>
                        <option value="document">Document</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Upload File</label>
                      <div className="file-upload-wrapper">
                        <input
                          type="file"
                          id="multimediaFile"
                          accept={
                            newMultimediaForm.type === 'video' ? 'video/*,.mp4,.webm,.ogg,.mov,.avi' :
                            newMultimediaForm.type === 'image' ? 'image/*,.jpg,.jpeg,.png,.gif,.webp,.svg' :
                            newMultimediaForm.type === 'audio' ? 'audio/*,.mp3,.ogg,.wav' :
                            '.pdf,.doc,.docx,.txt'
                          }
                          onChange={handleMultimediaFileSelect}
                          className="file-input"
                        />
                        <label htmlFor="multimediaFile" className="file-upload-label">
                          <span className="upload-icon">📤</span>
                          {newMultimediaForm.fileName ? (
                            <span className="file-name">{newMultimediaForm.fileName}</span>
                          ) : (
                            <span>Choose {newMultimediaForm.type} file</span>
                          )}
                        </label>
                      </div>
                      <small className="help-text">
                        Max file size: 50MB • Uploads to Firebase Storage
                      </small>
                    </div>

                    {newMultimediaForm.file && newMultimediaForm.type === 'video' && (
                      <div className="file-preview">
                        <video controls style={{ maxWidth: '100%', maxHeight: '200px' }}>
                          <source src={URL.createObjectURL(newMultimediaForm.file)} type={newMultimediaForm.file.type} />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}

                    {newMultimediaForm.file && newMultimediaForm.type === 'image' && (
                      <div className="file-preview">
                        <img 
                          src={URL.createObjectURL(newMultimediaForm.file)} 
                          alt="Preview" 
                          style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <label>Title</label>
                      <input
                        type="text"
                        value={newMultimediaForm.title}
                        onChange={(e) => setNewMultimediaForm({...newMultimediaForm, title: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={newMultimediaForm.description}
                        onChange={(e) => setNewMultimediaForm({...newMultimediaForm, description: e.target.value})}
                        rows="2"
                      />
                    </div>

                    <button type="submit" className="submit-btn" disabled={isUploading}>
                      {isUploading ? 'Uploading to Firebase...' : 'Add Media'}
                    </button>
                  </form>
                </div>

                {/* Existing Multimedia List */}
                <div className="existing-multimedia">
                  <h5>Existing Media Content</h5>
                  {managingMultimedia.lesson.multimedia && managingMultimedia.lesson.multimedia.length > 0 ? (
                    <div className="multimedia-list">
                      {managingMultimedia.lesson.multimedia.map(media => (
                        <div key={media.id} className="media-item">
                          <div className="media-preview">
                            {media.type === 'video' && <span className="media-icon">🎬</span>}
                            {media.type === 'image' && <span className="media-icon">🖼️</span>}
                            {media.type === 'audio' && <span className="media-icon">🎵</span>}
                            {media.type === 'document' && <span className="media-icon">📄</span>}
                            <div className="media-info">
                              <strong>{media.title}</strong>
                              <span>Type: {media.type}</span>
                              {media.fileName && <span>File: {media.fileName}</span>}
                              {media.fileSize && <span>Size: {(media.fileSize / (1024 * 1024)).toFixed(2)} MB</span>}
                              {media.firebasePath && (
                                <span className="firebase-path">📁 {media.firebasePath}</span>
                              )}
                              {media.type === 'video' && (
                                <div className="media-preview-video">
                                  <video controls style={{ maxWidth: '200px', maxHeight: '150px' }}>
                                    <source src={media.url} type={media.fileType || 'video/mp4'} />
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              )}
                              {media.type === 'image' && (
                                <img src={media.url} alt={media.title} style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain' }} />
                              )}
                              {media.type === 'audio' && (
                                <audio controls style={{ maxWidth: '200px' }}>
                                  <source src={media.url} type={media.fileType || 'audio/mpeg'} />
                                </audio>
                              )}
                            </div>
                          </div>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteMultimedia(media.id, media.title)}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-media-message">No multimedia content added yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;