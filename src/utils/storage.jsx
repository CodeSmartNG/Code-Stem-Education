// Local Storage utilities for STEM Platform

// Keys for localStorage
const STUDENT_KEY = 'hausaStem_students';
const CURRENT_USER_KEY = 'hausaStem_currentUser';
const COURSES_KEY = 'hausaStem_courses';
const USERS_KEY = 'hausaStem_users';
const EMAIL_CONFIRMATIONS_KEY = 'hausaStem_email_confirmations';
const SESSION_TRACKING_KEY = 'hausaStem_session_tracking';
const TEACHER_WALLETS_KEY = 'hausaStem_teacher_wallets';
const PAYMENT_TRANSACTIONS_KEY = 'hausaStem_payment_transactions';

// ==================== INITIALIZATION ====================

export const initializeStorage = () => {
  const existingStudents = getStudents() || [];
  const existingCourses = getCourses() || {};
  const existingUsers = getUsers() || {};

  console.log('🔄 Initializing Storage...');
  console.log('Existing users:', Object.keys(existingUsers).length);
  console.log('Existing students:', existingStudents.length);
  console.log('Existing courses:', Object.keys(existingCourses).length);

  const users = getUsers() || {};
  let needsSave = false;

  // Create admin user if missing
  if (!users['admin1']) {
    console.log('🛠 Creating admin user...');
    users['admin1'] = {
      id: 'admin1',
      name: "Kabir Alkasim",
      email: "codesmartng1@gmail.com",
      password: "Kb1217@#$%&",
      role: "admin",
      isEmailConfirmed: true,
      joinedDate: new Date().toISOString()
    };
    needsSave = true;
  } else if (users['admin1'].email !== 'codesmartng1@gmail.com') {
    console.log('🛠 Updating admin user email...');
    users['admin1'].email = "codesmartng1@gmail.com";
    users['admin1'].isEmailConfirmed = true;
    needsSave = true;
  }

  // Create teacher user if missing
  if (!users['teacher1'] || users['teacher1'].email !== 'kabir@teacher.com') {
    console.log('🛠 Creating teacher user...');
    users['teacher1'] = {
      id: 'teacher1',
      name: "Kabir Teacher",
      email: "kabir@teacher.com",
      password: "121712",
      role: "teacher",
      specialization: "Computer Science",
      bio: "Experienced teacher in web development and programming",
      joinedDate: new Date().toISOString(),
      courses: ['webDevelopment', 'python', 'mathematics'],
      isApproved: true,
      isEmailConfirmed: true,
      approvedDate: new Date().toISOString(),
      whatsappNumber: '2348012345678'
    };
    needsSave = true;
  }

  // Create student user if missing
  if (!users['student1'] || users['student1'].email !== 'student@example.com') {
    console.log('🛠 Creating student user...');
    users['student1'] = {
      id: 'student1',
      name: "Ahmad Musa",
      email: "student@example.com",
      password: "password123",
      role: "student",
      level: "Beginner",
      progress: {},
      completedLessons: [],
      points: 0,
      badges: [],
      enrolledCourses: [],
      isEmailConfirmed: true,
      joinedDate: new Date().toISOString()
    };
    needsSave = true;
  }

  if (needsSave) {
    console.log('💾 Saving updated users...');
    saveUsers(users);
  }

  // Create default students if empty
  if (existingStudents.length === 0) {
    console.log('🛠 Creating default students...');
    const defaultStudents = [
      {
        id: 1,
        name: "Ahmad Musa",
        email: "student@example.com",
        password: "password123",
        role: "student",
        level: "Beginner",
        progress: {},
        completedLessons: [],
        points: 0,
        badges: [],
        enrolledCourses: [],
        isEmailConfirmed: true,
        joinedDate: new Date().toISOString()
      }
    ];
    saveStudents(defaultStudents);
  }

  // Create default courses if empty
  if (Object.keys(existingCourses).length === 0) {
    console.log('🛠 Creating default courses...');
    saveCourses(getDefaultCourses());
  }

  // Initialize teacher wallets
  initializeTeacherWallets();

  console.log('✅ Storage initialization complete');
  debugStorage();
};

const getDefaultCourses = () => {
  return {
    webDevelopment: {
      title: "Web Development",
      description: "Learn how to build websites using HTML, CSS and JavaScript",
      thumbnail: "🌐",
      teacherId: "teacher1",
      teacherName: "Kabir Teacher",
      isPublished: true,
      approvedDate: new Date().toISOString(),
      lessons: [
        {
          id: 1,
          title: "Introduction to HTML",
          content: "HTML is the first part of a website. It provides the structure of web pages.",
          duration: "30 minutes",
          completed: false,
          isLocked: false,
          isFree: true,
          price: 0,
          multimedia: [
            {
              id: 1,
              type: "video",
              url: "https://www.youtube.com/embed/dD2EISBDjWM",
              title: "Video: How to use HTML",
              description: "This video will teach you everything you need to know about HTML"
            }
          ],
          quiz: {
            title: "HTML Questions",
            passingScore: 70,
            questions: [
              {
                id: 1,
                question: "What does HTML stand for?",
                type: "text",
                options: [
                  "Hyper Text Markup Language",
                  "High Tech Modern Language",
                  "Hyper Transfer Markup Language",
                  "Home Tool Markup Language"
                ],
                correctAnswer: 0
              }
            ]
          }
        }
      ]
    },
    python: {
      title: "Python Programming",
      description: "Learn how to program software with the Python language",
      thumbnail: "🐍",
      teacherId: "teacher1",
      teacherName: "Kabir Teacher",
      isPublished: true,
      approvedDate: new Date().toISOString(),
      lessons: [
        {
          id: 1,
          title: "Python Basics",
          content: "Start learning about the basic components in Python: variables, data types, and basic operations.",
          duration: "40 minutes",
          completed: false,
          isLocked: false,
          isFree: false,
          price: 1500,
          multimedia: [],
          quiz: {
            title: "Python Questions",
            passingScore: 70,
            questions: [
              {
                id: 1,
                question: "How do you create a variable in Python?",
                type: "text",
                options: [
                  "x = 5",
                  "variable x = 5",
                  "let x = 5",
                  "var x = 5"
                ],
                correctAnswer: 0
              }
            ]
          }
        }
      ]
    },
    mathematics: {
      title: "Mathematics",
      description: "Learn mathematics from basics to advanced levels",
      thumbnail: "📊",
      teacherId: "teacher1",
      teacherName: "Kabir Teacher",
      isPublished: true,
      approvedDate: new Date().toISOString(),
      lessons: [
        {
          id: 1,
          title: "Algebra Basics",
          content: "Start learning about algebra and how to use it to solve problems.",
          duration: "35 minutes",
          completed: false,
          isLocked: false,
          isFree: true,
          price: 0,
          multimedia: [],
          quiz: {
            title: "Algebra Questions",
            passingScore: 70,
            questions: [
              {
                id: 1,
                question: "What is x in the equation 2x + 5 = 15?",
                type: "text",
                options: ["5", "10", "15", "20"],
                correctAnswer: 0
              }
            ]
          }
        }
      ]
    }
  };
};

// ==================== TEACHER WALLET FUNCTIONS ====================

export const initializeTeacherWallets = () => {
  const wallets = getTeacherWallets();
  const teachers = getAllTeachers();

  teachers.forEach(teacher => {
    if (!wallets[teacher.id]) {
      wallets[teacher.id] = {
        teacherId: teacher.id,
        teacherName: teacher.name,
        balance: 0,
        totalEarnings: 0,
        pendingWithdrawals: 0,
        transactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  });

  saveTeacherWallets(wallets);
};

export const getTeacherWallets = () => {
  try {
    const wallets = localStorage.getItem(TEACHER_WALLETS_KEY);
    return wallets ? JSON.parse(wallets) : {};
  } catch (error) {
    console.error('Error loading teacher wallets:', error);
    return {};
  }
};

export const saveTeacherWallets = (wallets) => {
  try {
    localStorage.setItem(TEACHER_WALLETS_KEY, JSON.stringify(wallets));
  } catch (error) {
    console.error('Error saving teacher wallets:', error);
  }
};

export const getTeacherWallet = (teacherId) => {
  const wallets = getTeacherWallets();
  return wallets[teacherId] || {
    teacherId: teacherId,
    teacherName: '',
    balance: 0,
    totalEarnings: 0,
    pendingWithdrawals: 0,
    transactions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const updateTeacherWallet = (teacherId, walletData) => {
  const wallets = getTeacherWallets();
  const currentWallet = getTeacherWallet(teacherId);

  wallets[teacherId] = {
    ...currentWallet,
    ...walletData,
    updatedAt: new Date().toISOString()
  };

  saveTeacherWallets(wallets);
  return wallets[teacherId];
};

export const addTeacherEarnings = (teacherId, amount, description, lessonDetails = {}) => {
  const wallet = getTeacherWallet(teacherId);

  const transaction = {
    id: `txn_${Date.now()}`,
    type: 'credit',
    amount: amount,
    description: description,
    lessonDetails: lessonDetails,
    date: new Date().toISOString(),
    status: 'completed'
  };

  const updatedWallet = {
    ...wallet,
    balance: wallet.balance + amount,
    totalEarnings: wallet.totalEarnings + amount,
    transactions: [transaction, ...wallet.transactions]
  };

  return updateTeacherWallet(teacherId, updatedWallet);
};

export const withdrawFromWallet = (teacherId, amount, bankDetails) => {
  const wallet = getTeacherWallet(teacherId);

  if (wallet.balance < amount) {
    throw new Error('Insufficient balance for withdrawal');
  }

  if (amount < 100) {
    throw new Error('Minimum withdrawal amount is ₦100');
  }

  const transaction = {
    id: `withdraw_${Date.now()}`,
    type: 'debit',
    amount: amount,
    description: `Withdrawal to ${bankDetails.bankName}`,
    bankDetails: bankDetails,
    date: new Date().toISOString(),
    status: 'pending'
  };

  const updatedWallet = {
    ...wallet,
    balance: wallet.balance - amount,
    pendingWithdrawals: wallet.pendingWithdrawals + amount,
    transactions: [transaction, ...wallet.transactions]
  };

  return updateTeacherWallet(teacherId, updatedWallet);
};

export const getTeacherPaymentStats = (teacherId) => {
  const wallet = getTeacherWallet(teacherId);
  const transactions = getPaymentTransactions();

  const teacherTransactions = Object.values(transactions).filter(
    transaction => transaction.teacherId === teacherId && transaction.status === 'completed'
  );

  const monthlyEarnings = teacherTransactions
    .filter(txn => {
      const txnDate = new Date(txn.date);
      const currentMonth = new Date();
      return txnDate.getMonth() === currentMonth.getMonth() &&
        txnDate.getFullYear() === currentMonth.getFullYear();
    })
    .reduce((total, txn) => total + txn.amount * 0.9, 0);

  const totalSales = teacherTransactions.length;

  return {
    totalEarnings: wallet.totalEarnings,
    availableBalance: wallet.balance,
    pendingWithdrawals: wallet.pendingWithdrawals,
    monthlyEarnings: monthlyEarnings,
    totalSales: totalSales,
    transactionHistory: wallet.transactions.slice(0, 10)
  };
};

// ==================== PAYMENT FUNCTIONS ====================

export const getPaymentTransactions = () => {
  try {
    const transactions = localStorage.getItem(PAYMENT_TRANSACTIONS_KEY);
    return transactions ? JSON.parse(transactions) : {};
  } catch (error) {
    console.error('Error loading payment transactions:', error);
    return {};
  }
};

export const savePaymentTransactions = (transactions) => {
  try {
    localStorage.setItem(PAYMENT_TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving payment transactions:', error);
  }
};

export const processLessonPayment = (studentId, teacherId, courseKey, lessonId, amount) => {
  try {
    const paymentTransaction = {
      id: `pay_${Date.now()}`,
      studentId: studentId,
      teacherId: teacherId,
      courseKey: courseKey,
      lessonId: lessonId,
      amount: amount,
      status: 'completed',
      date: new Date().toISOString(),
      type: 'lesson_purchase'
    };

    const transactions = getPaymentTransactions();
    transactions[paymentTransaction.id] = paymentTransaction;
    savePaymentTransactions(transactions);

    const teacherEarnings = amount * 0.9;
    addTeacherEarnings(teacherId, teacherEarnings, `Payment for lesson purchase`, {
      courseKey: courseKey,
      lessonId: lessonId,
      studentId: studentId
    });

    const student = getStudentById(studentId);
    if (student) {
      if (!student.purchasedLessons) {
        student.purchasedLessons = [];
      }

      const purchaseKey = `${courseKey}-${lessonId}`;
      if (!student.purchasedLessons.includes(purchaseKey)) {
        student.purchasedLessons.push(purchaseKey);
        updateStudent(student);
      }
    }

    return paymentTransaction;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

// ==================== LESSON PURCHASE & ACCESS ====================

export const purchaseLesson = (studentId, courseKey, lessonId, paymentData) => {
  try {
    const student = getStudentById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    if (!student.purchasedLessons) {
      student.purchasedLessons = [];
    }

    const purchaseKey = `${courseKey}-${lessonId}`;

    if (student.purchasedLessons.includes(purchaseKey)) {
      return { success: true, alreadyPurchased: true };
    }

    student.purchasedLessons.push(purchaseKey);

    if (!student.paymentHistory) {
      student.paymentHistory = [];
    }

    student.paymentHistory.push({
      paymentId: paymentData?.paymentId || `pay_${Date.now()}`,
      amount: paymentData?.amount || 0,
      lessonId: lessonId,
      courseKey: courseKey,
      gateway: paymentData?.gateway || 'manual',
      timestamp: new Date().toISOString(),
      status: 'completed'
    });

    updateStudent(student);
    return { success: true, alreadyPurchased: false };
  } catch (error) {
    console.error('Error purchasing lesson:', error);
    throw error;
  }
};

export const canAccessLesson = (studentId, courseKey, lessonId) => {
  const lesson = getLessonById(courseKey, lessonId);
  if (!lesson) return false;

  if (lesson.isFree) return true;

  return hasStudentPurchasedLesson(studentId, courseKey, lessonId);
};

export const hasStudentPurchasedLesson = (studentId, courseKey, lessonId) => {
  const student = getStudentById(studentId);
  if (!student || !student.purchasedLessons) {
    return false;
  }

  const purchaseKey = `${courseKey}-${lessonId}`;
  return student.purchasedLessons.includes(purchaseKey);
};

// ==================== USER MANAGEMENT ====================

export const getUsers = () => {
  try {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : {};
  } catch (error) {
    console.error('Error loading users:', error);
    return {};
  }
};

export const saveUsers = (users) => {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users:', error);
  }
};

export const getAllUsers = () => {
  const users = getUsers();
  return Object.values(users);
};

export const getUserById = (userId) => {
  const users = getUsers();
  return users[userId] || null;
};

export const deleteUser = (userId) => {
  const users = getUsers();
  const currentUser = getCurrentUser();

  if (!users[userId]) {
    throw new Error('User not found');
  }

  if (currentUser && currentUser.id === userId) {
    throw new Error('Cannot delete your own account');
  }

  if (users[userId].role === 'admin') {
    throw new Error('Cannot delete admin users');
  }

  const userRole = users[userId].role;
  delete users[userId];
  saveUsers(users);

  if (userRole === 'student') {
    const students = getStudents();
    const updatedStudents = students.filter(s => s.userId !== userId && s.id !== userId);
    saveStudents(updatedStudents);
  }

  if (userRole === 'teacher') {
    const wallets = getTeacherWallets();
    if (wallets[userId]) {
      delete wallets[userId];
      saveTeacherWallets(wallets);
    }
  }

  console.log('🗑 User deleted:', userId);
  return true;
};

export const updateUser = (userId, userData) => {
  const users = getUsers();

  if (!users[userId]) {
    throw new Error('User not found');
  }

  users[userId] = {
    ...users[userId],
    ...userData,
    updatedAt: new Date().toISOString()
  };

  saveUsers(users);
  return users[userId];
};

// ==================== AUTHENTICATION ====================

export const authenticateUser = (email, password) => {
  const users = getUsers();

  const user = Object.values(users).find(
    user => user.email === email && user.password === password
  );

  if (!user) return null;

  if (user.role !== 'admin' && !user.isEmailConfirmed) {
    throw new Error('Please confirm your email before logging in.');
  }

  if (user.role === 'teacher' && !user.isApproved) {
    throw new Error('Your teacher account is pending admin approval.');
  }

  setCurrentUser(user);
  resetSession();
  return user;
};

export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error loading current user:', error);
    return null;
  }
};

export const setCurrentUser = (user) => {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      updateLastActivity();
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (error) {
    console.error('Error saving current user:', error);
  }
};

export const logoutUser = () => {
  clearSession();
  localStorage.removeItem(CURRENT_USER_KEY);
};

// ==================== USER REGISTRATION ====================

export const registerUser = (userData) => {
  const users = getUsers();

  const existingUser = Object.values(users).find(
    user => user.email === userData.email
  );

  if (existingUser) {
    throw new Error('Email already registered');
  }

  const userId = `${userData.role}_${Date.now()}`;

  const newUser = {
    id: userId,
    name: userData.name,
    email: userData.email,
    password: userData.password,
    role: userData.role,
    isEmailConfirmed: false,
    joinedDate: new Date().toISOString()
  };

  if (userData.role === 'teacher') {
    newUser.specialization = userData.specialization || 'General';
    newUser.bio = userData.bio || '';
    newUser.courses = [];
    newUser.isApproved = false;
    newUser.profileImage = userData.profileImage || '';
    newUser.whatsappNumber = userData.whatsappNumber || '';
  } else if (userData.role === 'student') {
    newUser.level = userData.level || 'Beginner';
    newUser.progress = {};
    newUser.completedLessons = [];
    newUser.points = 0;
    newUser.badges = [];
    newUser.enrolledCourses = [];

    const students = getStudents();
    const newStudentId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
    const newStudent = {
      id: newStudentId,
      userId: userId,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: 'student',
      level: userData.level || 'Beginner',
      progress: {},
      completedLessons: [],
      points: 0,
      badges: [],
      enrolledCourses: [],
      isEmailConfirmed: false,
      joinedDate: new Date().toISOString()
    };
    saveStudents([...students, newStudent]);
  }

  users[userId] = newUser;
  saveUsers(users);

  const confirmationToken = createEmailConfirmation(userId, userData.email);
  sendEmailConfirmation(userData.email, confirmationToken);

  console.log('✅ New user registered:', userId);
  return { user: newUser, confirmationToken };
};

export const registerTeacher = (teacherData) => {
  return registerUser({
    ...teacherData,
    role: 'teacher'
  });
};

// ==================== EMAIL CONFIRMATION ====================

export const getEmailConfirmations = () => {
  try {
    const confirmations = localStorage.getItem(EMAIL_CONFIRMATIONS_KEY);
    return confirmations ? JSON.parse(confirmations) : {};
  } catch (error) {
    console.error('Error loading email confirmations:', error);
    return {};
  }
};

export const saveEmailConfirmations = (confirmations) => {
  try {
    localStorage.setItem(EMAIL_CONFIRMATIONS_KEY, JSON.stringify(confirmations));
  } catch (error) {
    console.error('Error saving email confirmations:', error);
  }
};

export const generateEmailConfirmationToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const createEmailConfirmation = (userId, email) => {
  const confirmations = getEmailConfirmations();
  const token = generateEmailConfirmationToken();

  const confirmation = {
    userId,
    email,
    token,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    isUsed: false
  };

  confirmations[token] = confirmation;
  saveEmailConfirmations(confirmations);

  console.log(`📧 Email confirmation created for user ${userId}`);
  return token;
};

export const verifyEmailConfirmation = (token) => {
  const confirmations = getEmailConfirmations();
  const confirmation = confirmations[token];

  if (!confirmation) {
    throw new Error('Invalid confirmation token');
  }

  if (confirmation.isUsed) {
    throw new Error('Confirmation token already used');
  }

  if (new Date(confirmation.expiresAt) < new Date()) {
    throw new Error('Confirmation token has expired');
  }

  confirmation.isUsed = true;
  confirmation.confirmedAt = new Date().toISOString();
  confirmations[token] = confirmation;
  saveEmailConfirmations(confirmations);

  return confirmation;
};

export const sendEmailConfirmation = (email, token) => {
  const confirmationLink = `${window.location.origin}/confirm-email?token=${token}`;

  console.log('📧 Email Confirmation Details:');
  console.log('To:', email);
  console.log('Confirmation Link:', confirmationLink);
  console.log('Token (for testing):', token);

  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('✅ Confirmation email sent successfully');
      resolve(true);
    }, 1000);
  });
};

export const confirmUserEmail = (token) => {
  try {
    const confirmation = verifyEmailConfirmation(token);
    const users = getUsers();

    if (!users[confirmation.userId]) {
      throw new Error('User not found');
    }

    users[confirmation.userId].isEmailConfirmed = true;
    users[confirmation.userId].emailConfirmedAt = new Date().toISOString();

    if (users[confirmation.userId].role === 'student') {
      const students = getStudents();
      const studentIndex = students.findIndex(s => s.userId === confirmation.userId || s.email === confirmation.email);
      if (studentIndex !== -1) {
        students[studentIndex].isEmailConfirmed = true;
        students[studentIndex].emailConfirmedAt = new Date().toISOString();
        saveStudents(students);
      }
    }

    saveUsers(users);

    console.log('✅ Email confirmed for user:', confirmation.userId);
    return users[confirmation.userId];
  } catch (error) {
    console.error('Error confirming email:', error);
    throw error;
  }
};

export const resendEmailConfirmation = (email) => {
  const users = getUsers();
  const user = Object.values(users).find(u => u.email === email);

  if (!user) {
    throw new Error('User not found with this email');
  }

  if (user.isEmailConfirmed) {
    throw new Error('Email is already confirmed');
  }

  const confirmationToken = createEmailConfirmation(user.id, email);
  sendEmailConfirmation(email, confirmationToken);

  console.log('✅ Confirmation email resent to:', email);
  return { success: true, message: 'Confirmation email sent successfully' };
};

// ==================== TEACHER MANAGEMENT ====================

export const getAllTeachers = () => {
  const users = getUsers();
  return Object.values(users).filter(user => user.role === 'teacher');
};

export const getPendingTeachers = () => {
  const teachers = getAllTeachers();
  return teachers.filter(teacher => !teacher.isApproved);
};

export const getApprovedTeachers = () => {
  const teachers = getAllTeachers();
  return teachers.filter(teacher => teacher.isApproved);
};

export const approveTeacher = (teacherId) => {
  const users = getUsers();

  if (!users[teacherId] || users[teacherId].role !== 'teacher') {
    throw new Error('Teacher not found');
  }

  users[teacherId].isApproved = true;
  users[teacherId].approvedDate = new Date().toISOString();

  saveUsers(users);
  console.log('✅ Teacher approved:', teacherId);
  return users[teacherId];
};

export const rejectTeacher = (teacherId) => {
  const users = getUsers();

  if (!users[teacherId] || users[teacherId].role !== 'teacher') {
    throw new Error('Teacher not found');
  }

  delete users[teacherId];
  saveUsers(users);

  console.log('❌ Teacher rejected:', teacherId);
  return true;
};

export const dismissTeacher = (teacherId) => {
  const users = getUsers();

  if (!users[teacherId] || users[teacherId].role !== 'teacher') {
    throw new Error('Teacher not found');
  }

  users[teacherId].isApproved = false;
  users[teacherId].dismissedDate = new Date().toISOString();

  saveUsers(users);
  console.log('🚫 Teacher dismissed:', teacherId);
  return users[teacherId];
};

export const updateTeacherProfile = (teacherId, profileData) => {
  const users = getUsers();

  if (!users[teacherId] || users[teacherId].role !== 'teacher') {
    throw new Error('Teacher not found');
  }

  users[teacherId] = {
    ...users[teacherId],
    ...profileData,
    updatedAt: new Date().toISOString()
  };

  saveUsers(users);
  return users[teacherId];
};

export const updateTeacherProfileWithWhatsApp = (teacherId, profileData) => {
  const users = getUsers();

  if (!users[teacherId] || users[teacherId].role !== 'teacher') {
    throw new Error('Teacher not found');
  }

  users[teacherId] = {
    ...users[teacherId],
    ...profileData,
    updatedAt: new Date().toISOString()
  };

  saveUsers(users);
  return users[teacherId];
};

export const getTeacherById = (teacherId) => {
  const users = getUsers();
  const teacher = users[teacherId];

  if (!teacher || teacher.role !== 'teacher') {
    return null;
  }

  return teacher;
};

export const getTeacherWhatsAppUrl = (teacherId) => {
  const users = getUsers();
  const teacher = users[teacherId];

  if (!teacher || !teacher.whatsappNumber) {
    return null;
  }

  const whatsappNumber = teacher.whatsappNumber.replace(/\D/g, '');
  const message = `Hello ${teacher.name}! I found you on the STEM Learning Platform and would like to learn more about your courses.`;

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
};

export const getTeacherCourses = (teacherId) => {
  const courses = getCourses();

  if (!teacherId) {
    console.log('No teacher ID found, returning all courses for demo');
    return courses;
  }

  return Object.fromEntries(
    Object.entries(courses).filter(([key, course]) => course.teacherId === teacherId)
  );
};

export const getTeacherStats = (teacherId) => {
  const teacherCourses = getTeacherCourses(teacherId);
  const allStudents = getStudents();

  const totalCourses = Object.keys(teacherCourses).length;
  const totalLessons = Object.values(teacherCourses).reduce(
    (acc, course) => acc + (course.lessons?.length || 0), 0
  );

  const teacherCourseKeys = Object.keys(teacherCourses);
  const totalStudents = allStudents.filter(student =>
    student.enrolledCourses?.some(courseKey =>
      teacherCourseKeys.includes(courseKey)
    )
  ).length;

  let totalCompletions = 0;
  let totalPossibleCompletions = 0;

  allStudents.forEach(student => {
    teacherCourseKeys.forEach(courseKey => {
      if (student.enrolledCourses?.includes(courseKey)) {
        totalPossibleCompletions++;
        if (student.completedCourses?.includes(courseKey)) {
          totalCompletions++;
        }
      }
    });
  });

  const averageCompletionRate = totalPossibleCompletions > 0
    ? Math.round((totalCompletions / totalPossibleCompletions) * 100)
    : 0;

  const paymentStats = getTeacherPaymentStats(teacherId);

  return {
    totalCourses,
    totalLessons,
    totalStudents,
    averageCompletionRate,
    totalEarnings: paymentStats.totalEarnings,
    availableBalance: paymentStats.availableBalance,
    monthlyEarnings: paymentStats.monthlyEarnings,
    totalSales: paymentStats.totalSales,
    recentActivity: [
      {
        type: 'course',
        title: 'New Course Created',
        description: 'You created a new course',
        date: new Date().toISOString()
      },
      {
        type: 'lesson',
        title: 'Lesson Updated',
        description: 'You updated a lesson',
        date: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  };
};

export const getCurrentTeacherId = () => {
  const currentUser = getCurrentUser();
  return currentUser && currentUser.role === 'teacher' ? currentUser.id : null;
};

// ==================== STUDENT MANAGEMENT ====================

export const getStudents = () => {
  try {
    const students = localStorage.getItem(STUDENT_KEY);
    return students ? JSON.parse(students) : [];
  } catch (error) {
    console.error('Error loading students:', error);
    return [];
  }
};

export const saveStudents = (students) => {
  try {
    localStorage.setItem(STUDENT_KEY, JSON.stringify(students));
  } catch (error) {
    console.error('Error saving students:', error);
  }
};

export const getStudentById = (id) => {
  const users = getUsers();
  if (users[id] && users[id].role === 'student') {
    return users[id];
  }

  const students = getStudents();
  return students.find(student => student.id === id || student.userId === id);
};

export const updateStudent = (updatedStudent) => {
  const users = getUsers();
  const userId = updatedStudent.userId || updatedStudent.id;

  if (users[userId] && users[userId].role === 'student') {
    users[userId] = { ...users[userId], ...updatedStudent };
    saveUsers(users);
  }

  const students = getStudents();
  const updatedStudents = students.map(student =>
    student.id === updatedStudent.id || student.userId === userId
      ? { ...student, ...updatedStudent }
      : student
  );
  saveStudents(updatedStudents);

  const currentUser = getCurrentUser();
  if (currentUser && (currentUser.id === userId || currentUser.id === updatedStudent.id)) {
    setCurrentUser(updatedStudent);
  }

  return updatedStudent;
};

export const addStudent = (newStudent) => {
  const students = getStudents();
  const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
  const studentWithId = {
    ...newStudent,
    id: newId,
    joinedDate: new Date().toISOString()
  };

  saveStudents([...students, studentWithId]);
  return studentWithId;
};

// ==================== COURSE MANAGEMENT ====================

export const getCourses = () => {
  try {
    const courses = localStorage.getItem(COURSES_KEY);
    return courses ? JSON.parse(courses) : {};
  } catch (error) {
    console.error('Error loading courses:', error);
    return {};
  }
};

export const saveCourses = (courses) => {
  try {
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
  } catch (error) {
    console.error('Error saving courses:', error);
  }
};

export const getCourseByKey = (courseKey) => {
  const courses = getCourses();
  return courses[courseKey] || null;
};

const generateCourseKey = (title) => {
  return title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

export const addNewCourse = (courseData) => {
  const courses = getCourses();
  const courseKey = courseData.key || generateCourseKey(courseData.title);

  if (courses[courseKey]) {
    throw new Error('Course with this key already exists');
  }

  const teacherId = getCurrentTeacherId();

  courses[courseKey] = {
    ...courseData,
    key: courseKey,
    teacherId: teacherId,
    lessons: courseData.lessons || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  saveCourses(courses);
  return courseKey;
};

export const addNewCourseWithTeacher = (courseData, teacherId) => {
  const courses = getCourses();
  const users = getUsers();

  const courseKey = courseData.key || generateCourseKey(courseData.title);

  if (courses[courseKey]) {
    throw new Error('Course with this key already exists');
  }

  const teacher = users[teacherId];
  if (!teacher || teacher.role !== 'teacher' || !teacher.isApproved) {
    throw new Error('Teacher not found or not approved');
  }

  courses[courseKey] = {
    ...courseData,
    key: courseKey,
    teacherId: teacherId,
    teacherName: teacher.name,
    lessons: courseData.lessons || [],
    isPublished: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!teacher.courses) {
    teacher.courses = [];
  }
  teacher.courses.push(courseKey);
  users[teacherId] = teacher;

  saveCourses(courses);
  saveUsers(users);

  return courseKey;
};

export const updateCourse = (courseKey, courseData) => {
  const courses = getCourses();

  if (!courses[courseKey]) {
    throw new Error('Course not found');
  }

  courses[courseKey] = {
    ...courses[courseKey],
    ...courseData,
    updatedAt: new Date().toISOString()
  };

  saveCourses(courses);
  return courses[courseKey];
};

export const deleteCourse = (courseKey) => {
  const courses = getCourses();
  if (!courses[courseKey]) {
    throw new Error('Course not found');
  }

  const teacherId = courses[courseKey].teacherId;
  if (teacherId) {
    const users = getUsers();
    const teacher = users[teacherId];
    if (teacher && teacher.courses) {
      teacher.courses = teacher.courses.filter(course => course !== courseKey);
      saveUsers(users);
    }
  }

  const updatedCourses = { ...courses };
  delete updatedCourses[courseKey];
  saveCourses(updatedCourses);
  return true;
};

export const approveCourse = (courseKey) => {
  const courses = getCourses();

  if (!courses[courseKey]) {
    throw new Error('Course not found');
  }

  courses[courseKey].isPublished = true;
  courses[courseKey].approvedDate = new Date().toISOString();

  saveCourses(courses);
  return courses[courseKey];
};

// ==================== LESSON MANAGEMENT ====================

export const getLessonById = (courseKey, lessonId) => {
  const course = getCourseByKey(courseKey);
  if (!course) return null;

  return course.lessons.find(lesson => lesson.id === lessonId) || null;
};

export const getLessons = (courseKey) => {
  const courses = getCourses();
  const course = courses[courseKey];

  if (!course) {
    console.warn(`Course "${courseKey}" not found`);
    return [];
  }

  return course.lessons || [];
};

export const addLessonToCourse = (courseKey, lessonData) => {
  const courses = getCourses();
  const course = courses[courseKey];

  if (!course) {
    throw new Error('Course not found');
  }

  const newLessonId = course.lessons.length > 0
    ? Math.max(...course.lessons.map(l => l.id)) + 1
    : 1;

  const newLesson = {
    id: newLessonId,
    ...lessonData,
    createdAt: new Date().toISOString()
  };

  course.lessons.push(newLesson);
  course.updatedAt = new Date().toISOString();

  saveCourses(courses);
  return newLesson;
};

export const updateLesson = (courseKey, lessonId, lessonData) => {
  const courses = getCourses();
  const course = courses[courseKey];

  if (!course) {
    throw new Error('Course not found');
  }

  const lessonIndex = course.lessons.findIndex(l => l.id === lessonId);
  if (lessonIndex === -1) {
    throw new Error('Lesson not found');
  }

  course.lessons[lessonIndex] = {
    ...course.lessons[lessonIndex],
    ...lessonData,
    updatedAt: new Date().toISOString()
  };
  course.updatedAt = new Date().toISOString();

  saveCourses(courses);
  return course.lessons[lessonIndex];
};

export const deleteLesson = (courseKey, lessonId) => {
  const courses = getCourses();
  const course = courses[courseKey];

  if (!course) {
    throw new Error('Course not found');
  }

  course.lessons = course.lessons.filter(lesson => lesson.id !== lessonId);
  course.updatedAt = new Date().toISOString();

  saveCourses(courses);
  return course;
};

// ==================== LESSON LOCK MANAGEMENT ====================

export const toggleLessonLock = (courseKey, lessonId, isLocked) => {
  try {
    const courses = getCourses();
    if (!courses[courseKey]) {
      throw new Error('Course not found');
    }

    const course = courses[courseKey];
    const lessonIndex = course.lessons.findIndex(lesson => lesson.id === lessonId);

    if (lessonIndex === -1) {
      throw new Error('Lesson not found');
    }

    course.lessons[lessonIndex].isLocked = isLocked;
    course.updatedAt = new Date().toISOString();

    saveCourses(courses);

    console.log(`✅ Lesson ${lessonId} in course ${courseKey} ${isLocked ? 'locked' : 'unlocked'}`);
    return true;
  } catch (error) {
    console.error('Error toggling lesson lock:', error);
    throw error;
  }
};

export const getLockedLessonsCount = (courseKey) => {
  const courses = getCourses();
  const course = courses[courseKey];

  if (!course || !course.lessons) {
    return 0;
  }

  return course.lessons.filter(lesson => lesson.isLocked).length;
};

export const getLockedLessonsForStudent = (studentId, courseKey) => {
  const student = getStudentById(studentId);
  const courses = getCourses();
  const course = courses[courseKey];

  if (!student || !course) {
    return [];
  }

  return course.lessons
    .filter(lesson => lesson.isLocked)
    .map(lesson => ({
      courseKey,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      isLocked: true
    }));
};

export const isLessonAccessible = (studentId, courseKey, lessonId) => {
  const student = getStudentById(studentId);
  const courses = getCourses();
  const course = courses[courseKey];

  if (!student || !course) {
    return false;
  }

  const lesson = course.lessons.find(l => l.id === lessonId);
  if (!lesson) {
    return false;
  }

  if (lesson.isFree) {
    return true;
  }

  return hasStudentPurchasedLesson(studentId, courseKey, lessonId);
};

// ==================== MULTIMEDIA MANAGEMENT ====================

export const addMultimediaToLesson = (courseKey, lessonId, multimediaItem) => {
  const courses = getCourses();
  const course = courses[courseKey];

  if (!course) {
    throw new Error('Course not found');
  }

  const lesson = course.lessons.find(l => l.id === lessonId);
  if (!lesson) {
    throw new Error('Lesson not found');
  }

  if (!lesson.multimedia) {
    lesson.multimedia = [];
  }

  const newMultimediaItem = {
    id: lesson.multimedia.length > 0 ? Math.max(...lesson.multimedia.map(m => m.id)) + 1 : 1,
    ...multimediaItem
  };

  lesson.multimedia.push(newMultimediaItem);
  course.updatedAt = new Date().toISOString();

  saveCourses(courses);
  return newMultimediaItem;
};

export const updateMultimediaInLesson = (courseKey, lessonId, multimediaId, multimediaData) => {
  const courses = getCourses();
  const course = courses[courseKey];

  if (!course) {
    throw new Error('Course not found');
  }

  const lesson = course.lessons.find(l => l.id === lessonId);
  if (!lesson || !lesson.multimedia) {
    throw new Error('Lesson or multimedia not found');
  }

  const multimediaIndex = lesson.multimedia.findIndex(item => item.id === multimediaId);
  if (multimediaIndex === -1) {
    throw new Error('Multimedia item not found');
  }

  lesson.multimedia[multimediaIndex] = { ...lesson.multimedia[multimediaIndex], ...multimediaData };
  course.updatedAt = new Date().toISOString();

  saveCourses(courses);
  return lesson.multimedia[multimediaIndex];
};

export const deleteMultimediaFromLesson = (courseKey, lessonId, multimediaId) => {
  const courses = getCourses();
  const course = courses[courseKey];

  if (!course) {
    throw new Error('Course not found');
  }

  const lesson = course.lessons.find(l => l.id === lessonId);
  if (!lesson || !lesson.multimedia) {
    throw new Error('Lesson or multimedia not found');
  }

  lesson.multimedia = lesson.multimedia.filter(item => item.id !== multimediaId);
  course.updatedAt = new Date().toISOString();

  saveCourses(courses);
  return true;
};

// ==================== COURSE ENROLLMENT ====================

export const enrollStudentInCourse = (studentId, courseKey) => {
  const student = getStudentById(studentId);
  const courses = getCourses();

  if (!student) {
    throw new Error('Student not found');
  }

  if (!courses[courseKey]) {
    throw new Error('Course not found');
  }

  if (student.enrolledCourses?.includes(courseKey)) {
    throw new Error('Already enrolled in this course');
  }

  if (!student.enrolledCourses) {
    student.enrolledCourses = [];
  }

  if (!student.progress) {
    student.progress = {};
  }

  student.enrolledCourses.push(courseKey);
  student.progress[courseKey] = 0;

  if (!student.enrolledCoursesDate) {
    student.enrolledCoursesDate = {};
  }
  student.enrolledCoursesDate[courseKey] = new Date().toISOString();

  updateStudent(student);

  console.log(`✅ Student ${studentId} enrolled in course: ${courseKey}`);
  return true;
};

export const unenrollStudentFromCourse = (studentId, courseKey) => {
  const student = getStudentById(studentId);

  if (!student) {
    throw new Error('Student not found');
  }

  if (!student.enrolledCourses?.includes(courseKey)) {
    throw new Error('Not enrolled in this course');
  }

  student.enrolledCourses = student.enrolledCourses.filter(course => course !== courseKey);

  if (student.progress && student.progress[courseKey]) {
    delete student.progress[courseKey];
  }

  if (student.completedCourses?.includes(courseKey)) {
    student.completedCourses = student.completedCourses.filter(course => course !== courseKey);
  }

  if (student.enrolledCoursesDate && student.enrolledCoursesDate[courseKey]) {
    delete student.enrolledCoursesDate[courseKey];
  }

  updateStudent(student);

  console.log(`❌ Student ${studentId} unenrolled from course: ${courseKey}`);
  return true;
};

export const getEnrolledCoursesWithProgress = (studentId) => {
  const student = getStudentById(studentId);
  const courses = getCourses();

  if (!student || !student.enrolledCourses) {
    return [];
  }

  return student.enrolledCourses.map(courseKey => {
    const course = courses[courseKey];
    return {
      key: courseKey,
      ...course,
      progress: student.progress?.[courseKey] || 0,
      isCompleted: student.completedCourses?.includes(courseKey) || false,
      enrolledDate: student.enrolledCoursesDate?.[courseKey] || student.joinedDate
    };
  }).filter(course => course !== null);
};

export const updateCourseProgress = (studentId, courseKey, progress) => {
  const student = getStudentById(studentId);

  if (!student) {
    throw new Error('Student not found');
  }

  if (!student.enrolledCourses?.includes(courseKey)) {
    throw new Error('Not enrolled in this course');
  }

  if (!student.progress) {
    student.progress = {};
  }

  student.progress[courseKey] = Math.min(100, Math.max(0, progress));

  if (progress >= 100) {
    if (!student.completedCourses) {
      student.completedCourses = [];
    }
    if (!student.completedCourses.includes(courseKey)) {
      student.completedCourses.push(courseKey);
      student.points = (student.points || 0) + 100;

      if (!student.badges) {
        student.badges = [];
      }
      if (!student.badges.includes('Course Completer')) {
        student.badges.push('Course Completer');
      }
    }
  }

  updateStudent(student);
  return student.progress[courseKey];
};

export const getCourseCompletionStatus = (studentId, courseKey) => {
  const student = getStudentById(studentId);

  if (!student) {
    return { enrolled: false, progress: 0, completed: false };
  }

  return {
    enrolled: student.enrolledCourses?.includes(courseKey) || false,
    progress: student.progress?.[courseKey] || 0,
    completed: student.completedCourses?.includes(courseKey) || false
  };
};

// ==================== QUIZ MANAGEMENT ====================

export const addQuizToLesson = (courseKey, lessonId, quizData) => {
  const courses = getCourses();
  const course = courses[courseKey];

  if (!course) {
    throw new Error('Course not found');
  }

  const lesson = course.lessons.find(l => l.id === lessonId);
  if (!lesson) {
    throw new Error('Lesson not found');
  }

  const quizWithIds = {
    ...quizData,
    questions: quizData.questions.map((q, index) => ({
      id: q.id || index + 1,
      ...q
    }))
  };

  lesson.quiz = quizWithIds;
  course.updatedAt = new Date().toISOString();

  saveCourses(courses);
  return quizWithIds;
};

export const updateQuizInLesson = (courseKey, lessonId, quizData) => {
  const courses = getCourses();
  const course = courses[courseKey];

  if (!course) {
    throw new Error('Course not found');
  }

  const lesson = course.lessons.find(l => l.id === lessonId);
  if (!lesson || !lesson.quiz) {
    throw new Error('Lesson or quiz not found');
  }

  lesson.quiz = { ...lesson.quiz, ...quizData };
  course.updatedAt = new Date().toISOString();

  saveCourses(courses);
  return lesson.quiz;
};

export const deleteQuizFromLesson = (courseKey, lessonId) => {
  const courses = getCourses();
  const course = courses[courseKey];

  if (!course) {
    throw new Error('Course not found');
  }

  const lesson = course.lessons.find(l => l.id === lessonId);
  if (!lesson) {
    throw new Error('Lesson not found');
  }

  lesson.quiz = null;
  course.updatedAt = new Date().toISOString();

  saveCourses(courses);
  return true;
};

export const getQuizResults = (studentId, courseKey, lessonId) => {
  const student = getStudentById(studentId);
  if (!student || !student.quizResults) return null;

  return student.quizResults.find(result =>
    result.courseKey === courseKey && result.lessonId === lessonId
  );
};

export const saveQuizResult = (studentId, courseKey, lessonId, score, passed, totalQuestions) => {
  const student = getStudentById(studentId);
  if (!student) return null;

  if (!student.quizResults) {
    student.quizResults = [];
  }

  const existingResultIndex = student.quizResults.findIndex(
    result => result.courseKey === courseKey && result.lessonId === lessonId
  );

  const quizResult = {
    courseKey,
    lessonId,
    score,
    passed,
    totalQuestions,
    completedAt: new Date().toISOString(),
    attempts: existingResultIndex >= 0 ? student.quizResults[existingResultIndex].attempts + 1 : 1
  };

  if (existingResultIndex >= 0) {
    if (score > student.quizResults[existingResultIndex].score) {
      student.quizResults[existingResultIndex] = quizResult;
    }
  } else {
    student.quizResults.push(quizResult);
  }

  updateStudent(student);
  return student;
};

export const getQuizAnalytics = () => {
  const students = getStudents();
  const courses = getCourses();

  let totalQuizzes = 0;
  let totalAttempts = 0;
  let passedAttempts = 0;
  let averageScore = 0;

  students.forEach(student => {
    if (student.quizResults) {
      student.quizResults.forEach(result => {
        totalAttempts++;
        averageScore += result.score;
        if (result.passed) {
          passedAttempts++;
        }
      });
    }
  });

  Object.values(courses).forEach(course => {
    course.lessons.forEach(lesson => {
      if (lesson.quiz) {
        totalQuizzes++;
      }
    });
  });

  averageScore = totalAttempts > 0 ? averageScore / totalAttempts : 0;

  return {
    totalQuizzes,
    totalAttempts,
    passedAttempts,
    failedAttempts: totalAttempts - passedAttempts,
    averageScore: Math.round(averageScore),
    passRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0
  };
};

export const getStudentQuizProgress = (studentId) => {
  const student = getStudentById(studentId);
  const courses = getCourses();

  if (!student) return null;

  let totalQuizzes = 0;
  let completedQuizzes = 0;
  let averageQuizScore = 0;

  Object.entries(courses).forEach(([courseKey, course]) => {
    course.lessons.forEach(lesson => {
      if (lesson.quiz) {
        totalQuizzes++;
        const quizResult = student.quizResults?.find(
          result => result.courseKey === courseKey && result.lessonId === lesson.id
        );
        if (quizResult) {
          completedQuizzes++;
          averageQuizScore += quizResult.score;
        }
      }
    });
  });

  averageQuizScore = completedQuizzes > 0 ? averageQuizScore / completedQuizzes : 0;

  return {
    totalQuizzes,
    completedQuizzes,
    pendingQuizzes: totalQuizzes - completedQuizzes,
    completionRate: totalQuizzes > 0 ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0,
    averageScore: Math.round(averageQuizScore)
  };
};

// ==================== CERTIFICATE FUNCTIONS ====================

export const generateCertificate = (studentId, courseKey, completionDate, certificateId) => {
  const student = getStudentById(studentId);
  const courses = getCourses();
  const course = courses[courseKey];

  if (!student || !course) {
    throw new Error('Student or course not found');
  }

  const certificate = {
    id: certificateId || `cert_${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    courseKey: courseKey,
    courseTitle: course.title,
    completionDate: completionDate || new Date().toISOString(),
    issuedDate: new Date().toISOString(),
    certificateUrl: null,
    verificationCode: generateVerificationCode()
  };

  if (!student.certificates) {
    student.certificates = [];
  }
  student.certificates.push(certificate);

  updateStudent(student);

  return certificate;
};

export const getStudentCertificates = (studentId) => {
  const student = getStudentById(studentId);
  return student?.certificates || [];
};

export const getCertificateById = (certificateId) => {
  const students = getStudents();
  for (let student of students) {
    if (student.certificates) {
      const certificate = student.certificates.find(cert => cert.id === certificateId);
      if (certificate) return certificate;
    }
  }
  return null;
};

export const verifyCertificate = (certificateId, verificationCode) => {
  const certificate = getCertificateById(certificateId);
  if (!certificate) {
    return { valid: false, message: 'Certificate not found' };
  }

  if (certificate.verificationCode !== verificationCode) {
    return { valid: false, message: 'Invalid verification code' };
  }

  return {
    valid: true,
    message: 'Certificate verified successfully',
    certificate: certificate
  };
};

export const checkCertificateEligibility = (studentId, courseKey) => {
  const student = getStudentById(studentId);
  const courses = getCourses();
  const course = courses[courseKey];

  if (!student || !course) {
    return { eligible: false, reason: 'Student or course not found' };
  }

  if (student.progress[courseKey] < 100) {
    return {
      eligible: false,
      reason: 'Course not completed',
      progress: student.progress[courseKey]
    };
  }

  const existingCert = student.certificates?.find(cert =>
    cert.courseKey === courseKey
  );

  if (existingCert) {
    return {
      eligible: false,
      reason: 'Certificate already issued',
      certificate: existingCert
    };
  }

  return { eligible: true, reason: 'Eligible for certificate' };
};

const generateVerificationCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

// ==================== ADMIN COURSE MANAGEMENT ====================

export const getAllCoursesForAdmin = () => {
  return getCourses();
};

export const getCourseDetailsForAdmin = (courseKey) => {
  const courses = getCourses();
  const course = courses[courseKey];

  if (!course) {
    throw new Error('Course not found');
  }

  const users = getUsers();
  const teacher = users[course.teacherId];

  return {
    ...course,
    teacherInfo: teacher ? {
      name: teacher.name,
      email: teacher.email,
      specialization: teacher.specialization,
      isApproved: teacher.isApproved
    } : null
  };
};

export const deleteCourseAsAdmin = (courseKey) => {
  return deleteCourse(courseKey);
};

export const deleteLessonAsAdmin = (courseKey, lessonId) => {
  return deleteLesson(courseKey, lessonId);
};

export const getTeacherCoursesForAdmin = (teacherId) => {
  return getTeacherCourses(teacherId);
};

export const getCourseAnalyticsForAdmin = (courseKey) => {
  const course = getCourseByKey(courseKey);
  if (!course) {
    throw new Error('Course not found');
  }

  const students = getStudents();
  const enrolledStudents = students.filter(student =>
    student.enrolledCourses?.includes(courseKey)
  );

  const completedStudents = students.filter(student =>
    student.completedCourses?.includes(courseKey)
  );

  let totalLessonCompletions = 0;
  let totalPossibleCompletions = 0;

  enrolledStudents.forEach(student => {
    course.lessons.forEach(lesson => {
      totalPossibleCompletions++;
      if (student.completedLessons?.includes(`${courseKey}-${lesson.id}`)) {
        totalLessonCompletions++;
      }
    });
  });

  const averageCompletionRate = totalPossibleCompletions > 0
    ? Math.round((totalLessonCompletions / totalPossibleCompletions) * 100)
    : 0;

  let totalQuizAttempts = 0;
  let passedQuizAttempts = 0;
  let totalQuizScore = 0;

  enrolledStudents.forEach(student => {
    if (student.quizResults) {
      student.quizResults.forEach(result => {
        if (result.courseKey === courseKey) {
          totalQuizAttempts++;
          totalQuizScore += result.score;
          if (result.passed) {
            passedQuizAttempts++;
          }
        }
      });
    }
  });

  const averageQuizScore = totalQuizAttempts > 0 ? Math.round(totalQuizScore / totalQuizAttempts) : 0;
  const quizPassRate = totalQuizAttempts > 0 ? Math.round((passedQuizAttempts / totalQuizAttempts) * 100) : 0;

  return {
    courseKey,
    courseTitle: course.title,
    totalEnrolled: enrolledStudents.length,
    totalCompleted: completedStudents.length,
    completionRate: enrolledStudents.length > 0 ? Math.round((completedStudents.length / enrolledStudents.length) * 100) : 0,
    averageLessonCompletion: averageCompletionRate,
    totalLessons: course.lessons.length,
    totalQuizAttempts,
    averageQuizScore,
    quizPassRate,
    recentEnrollments: enrolledStudents
      .sort((a, b) => new Date(b.joinedDate) - new Date(a.joinedDate))
      .slice(0, 5)
      .map(student => ({
        name: student.name,
        enrolledDate: student.enrolledCoursesDate?.[courseKey] || student.joinedDate,
        progress: student.progress?.[courseKey] || 0
      }))
  };
};

export const getAllCoursesAnalyticsForAdmin = () => {
  const courses = getCourses();
  const analytics = [];

  Object.entries(courses).forEach(([courseKey, course]) => {
    const courseAnalytics = getCourseAnalyticsForAdmin(courseKey);
    analytics.push(courseAnalytics);
  });

  return analytics.sort((a, b) => b.totalEnrolled - a.totalEnrolled);
};

export const updateCourseAsAdmin = (courseKey, courseData) => {
  return updateCourse(courseKey, {
    ...courseData,
    lastUpdatedBy: 'admin'
  });
};

export const updateLessonAsAdmin = (courseKey, lessonId, lessonData) => {
  return updateLesson(courseKey, lessonId, {
    ...lessonData,
    lastUpdatedBy: 'admin'
  });
};

export const getUnapprovedCourses = () => {
  const courses = getCourses();
  return Object.fromEntries(
    Object.entries(courses).filter(([key, course]) => !course.isPublished)
  );
};

export const approveCourseAsAdmin = (courseKey) => {
  const courses = getCourses();

  if (!courses[courseKey]) {
    throw new Error('Course not found');
  }

  courses[courseKey].isPublished = true;
  courses[courseKey].approvedDate = new Date().toISOString();
  courses[courseKey].approvedBy = 'admin';

  saveCourses(courses);
  console.log(`✅ Admin approved course: ${courseKey}`);
  return courses[courseKey];
};

export const rejectCourseAsAdmin = (courseKey) => {
  const courses = getCourses();

  if (!courses[courseKey]) {
    throw new Error('Course not found');
  }

  courses[courseKey].isPublished = false;
  courses[courseKey].rejectedDate = new Date().toISOString();
  courses[courseKey].rejectedBy = 'admin';
  courses[courseKey].rejectionReason = 'Rejected by admin';

  saveCourses(courses);
  console.log(`❌ Admin rejected course: ${courseKey}`);
  return courses[courseKey];
};

// ==================== PLATFORM STATISTICS ====================

export const getPlatformStats = () => {
  const students = getStudents();
  const courses = getCourses();
  const teachers = getAllTeachers();
  const approvedTeachers = getApprovedTeachers();
  const pendingTeachers = getPendingTeachers();
  const users = getAllUsers();

  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalApprovedTeachers = approvedTeachers.length;
  const totalPendingTeachers = pendingTeachers.length;
  const totalCourses = Object.keys(courses).length;
  const totalLessons = Object.values(courses).reduce((total, course) =>
    total + course.lessons.length, 0
  );
  const totalCompletedLessons = students.reduce((total, student) =>
    total + student.completedLessons.length, 0
  );

  const recentStudents = students
    .sort((a, b) => new Date(b.joinedDate) - new Date(a.joinedDate))
    .slice(0, 5);

  const quizAnalytics = getQuizAnalytics();

  return {
    totalStudents,
    totalTeachers,
    totalApprovedTeachers,
    totalPendingTeachers,
    totalCourses,
    totalLessons,
    totalCompletedLessons,
    totalUsers: users.length,
    recentStudents,
    studentProgress: students.map(student => ({
      name: student.name,
      progress: Object.values(student.progress).reduce((a, b) => a + b, 0) / 3,
      completedLessons: student.completedLessons.length,
      joinedDate: student.joinedDate
    })),
    ...quizAnalytics
  };
};

// ==================== SESSION TRACKING ====================

export const getSessionTracking = () => {
  try {
    const sessionData = localStorage.getItem(SESSION_TRACKING_KEY);
    return sessionData ? JSON.parse(sessionData) : {
      lastActivity: null,
      sessionStart: null,
      autoLogoutEnabled: true,
      logoutTimeout: 60 * 60 * 1000,
      warningTimeout: 55 * 60 * 1000
    };
  } catch (error) {
    console.error('Error loading session tracking:', error);
    return {
      lastActivity: null,
      sessionStart: null,
      autoLogoutEnabled: true,
      logoutTimeout: 60 * 60 * 1000,
      warningTimeout: 55 * 60 * 1000
    };
  }
};

export const saveSessionTracking = (sessionData) => {
  try {
    localStorage.setItem(SESSION_TRACKING_KEY, JSON.stringify(sessionData));
  } catch (error) {
    console.error('Error saving session tracking:', error);
  }
};

export const updateLastActivity = () => {
  const sessionData = getSessionTracking();
  sessionData.lastActivity = new Date().toISOString();

  if (!sessionData.sessionStart) {
    sessionData.sessionStart = new Date().toISOString();
  }

  saveSessionTracking(sessionData);
  return sessionData;
};

export const resetSession = () => {
  const sessionData = {
    lastActivity: new Date().toISOString(),
    sessionStart: new Date().toISOString(),
    autoLogoutEnabled: true,
    logoutTimeout: 60 * 60 * 1000,
    warningTimeout: 55 * 60 * 1000
  };
  saveSessionTracking(sessionData);
  return sessionData;
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_TRACKING_KEY);
};

export const getSessionDuration = () => {
  const sessionData = getSessionTracking();
  if (!sessionData.sessionStart) return 0;

  const startTime = new Date(sessionData.sessionStart);
  const currentTime = new Date();
  return currentTime - startTime;
};

export const getTimeUntilLogout = () => {
  const sessionData = getSessionTracking();
  if (!sessionData.lastActivity || !sessionData.autoLogoutEnabled) {
    return null;
  }

  const lastActivity = new Date(sessionData.lastActivity);
  const currentTime = new Date();
  const timeSinceActivity = currentTime - lastActivity;
  const timeRemaining = sessionData.logoutTimeout - timeSinceActivity;

  return Math.max(0, timeRemaining);
};

export const getTimeUntilWarning = () => {
  const sessionData = getSessionTracking();
  if (!sessionData.lastActivity || !sessionData.autoLogoutEnabled) {
    return null;
  }

  const lastActivity = new Date(sessionData.lastActivity);
  const currentTime = new Date();
  const timeSinceActivity = currentTime - lastActivity;
  const timeRemaining = sessionData.warningTimeout - timeSinceActivity;

  return Math.max(0, timeRemaining);
};

export const getSessionStats = () => {
  const sessionData = getSessionTracking();
  const timeUntilLogout = getTimeUntilLogout();
  const timeUntilWarning = getTimeUntilWarning();
  const sessionDuration = getSessionDuration();

  return {
    isActive: timeUntilLogout !== null && timeUntilLogout > 0,
    timeUntilLogout: timeUntilLogout,
    timeUntilWarning: timeUntilWarning,
    sessionDuration: sessionDuration,
    lastActivity: sessionData.lastActivity,
    sessionStart: sessionData.sessionStart,
    autoLogoutEnabled: sessionData.autoLogoutEnabled,
    willWarnSoon: timeUntilWarning !== null && timeUntilWarning <= 5 * 60 * 1000
  };
};

// ==================== PROGRESS TRACKING ====================

export const calculateOverallProgress = (studentId) => {
  const student = getStudentById(studentId);
  const courses = getCourses();

  if (!student) return 0;

  let totalLessons = 0;
  let completedLessons = 0;

  Object.entries(courses).forEach(([courseKey, course]) => {
    totalLessons += course.lessons.length;
    completedLessons += course.lessons.filter(lesson =>
      student.completedLessons.includes(`${courseKey}-${lesson.id}`)
    ).length;
  });

  return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
};

export const getStudentActivity = (studentId, days = 30) => {
  const student = getStudentById(studentId);
  if (!student) return [];

  const activities = [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  student.completedLessons.forEach(lessonKey => {
    activities.push({
      type: 'lesson_completed',
      lessonKey,
      date: new Date().toISOString(),
      description: 'Completed a lesson'
    });
  });

  if (student.quizResults) {
    student.quizResults.forEach(result => {
      activities.push({
        type: 'quiz_attempt',
        courseKey: result.courseKey,
        lessonId: result.lessonId,
        score: result.score,
        passed: result.passed,
        date: result.completedAt,
        description: `Scored ${result.score}% on quiz`
      });
    });
  }

  const transactions = getPaymentTransactions();
  Object.values(transactions).forEach(transaction => {
    if (transaction.studentId === studentId) {
      activities.push({
        type: 'payment',
        courseKey: transaction.courseKey,
        lessonId: transaction.lessonId,
        amount: transaction.amount,
        date: transaction.date,
        description: `Purchased lesson for ₦${transaction.amount}`
      });
    }
  });

  return activities
    .filter(activity => new Date(activity.date) >= cutoffDate)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

// ==================== DATA BACKUP ====================

export const exportData = () => {
  const data = {
    students: getStudents(),
    courses: getCourses(),
    users: getUsers(),
    sessionTracking: getSessionTracking(),
    emailConfirmations: getEmailConfirmations(),
    teacherWallets: getTeacherWallets(),
    paymentTransactions: getPaymentTransactions(),
    exportDate: new Date().toISOString(),
    version: '1.0'
  };

  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });

  return URL.createObjectURL(dataBlob);
};

export const importData = (jsonData) => {
  try {
    const data = JSON.parse(jsonData);

    if (data.students && Array.isArray(data.students)) {
      saveStudents(data.students);
    }

    if (data.courses && typeof data.courses === 'object') {
      saveCourses(data.courses);
    }

    if (data.users && typeof data.users === 'object') {
      saveUsers(data.users);
    }

    if (data.sessionTracking && typeof data.sessionTracking === 'object') {
      saveSessionTracking(data.sessionTracking);
    }

    if (data.emailConfirmations && typeof data.emailConfirmations === 'object') {
      saveEmailConfirmations(data.emailConfirmations);
    }

    if (data.teacherWallets && typeof data.teacherWallets === 'object') {
      saveTeacherWallets(data.teacherWallets);
    }

    if (data.paymentTransactions && typeof data.paymentTransactions === 'object') {
      savePaymentTransactions(data.paymentTransactions);
    }

    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

export const resetAllData = () => {
  if (window.confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
    localStorage.removeItem(STUDENT_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(COURSES_KEY);
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem(SESSION_TRACKING_KEY);
    localStorage.removeItem(EMAIL_CONFIRMATIONS_KEY);
    localStorage.removeItem(TEACHER_WALLETS_KEY);
    localStorage.removeItem(PAYMENT_TRANSACTIONS_KEY);
    initializeStorage();
    return true;
  }
  return false;
};

// ==================== DEBUG FUNCTIONS ====================

export const debugStorage = () => {
  console.log('=== STORAGE DEBUG INFO ===');

  const users = getUsers();
  const currentUser = getCurrentUser();
  const students = getStudents();
  const courses = getCourses();
  const sessionTracking = getSessionTracking();
  const teacherWallets = getTeacherWallets();
  const paymentTransactions = getPaymentTransactions();

  console.log('All Users:', users);
  console.log('Current User:', currentUser);
  console.log('Students:', students);
  console.log('Courses:', courses);
  console.log('Session Tracking:', sessionTracking);
  console.log('Teacher Wallets:', teacherWallets);
  console.log('Payment Transactions:', paymentTransactions);

  console.log('Admin User (admin1):', users['admin1']);
  console.log('Teacher User (teacher1):', users['teacher1']);
  console.log('Student User (student1):', users['student1']);

  console.log('=== END DEBUG INFO ===');
};

// ==================== EXPORTS ====================

export default {
  initializeStorage,
  getTeacherWallets,
  saveTeacherWallets,
  getTeacherWallet,
  updateTeacherWallet,
  addTeacherEarnings,
  withdrawFromWallet,
  getTeacherPaymentStats,
  getPaymentTransactions,
  savePaymentTransactions,
  processLessonPayment,
  purchaseLesson,
  canAccessLesson,
  hasStudentPurchasedLesson,
  getSessionTracking,
  saveSessionTracking,
  updateLastActivity,
  getSessionDuration,
  getTimeUntilLogout,
  getTimeUntilWarning,
  resetSession,
  clearSession,
  getSessionStats,
  getEmailConfirmations,
  createEmailConfirmation,
  verifyEmailConfirmation,
  sendEmailConfirmation,
  confirmUserEmail,
  resendEmailConfirmation,
  getUsers,
  saveUsers,
  registerUser,
  authenticateUser,
  getCurrentUser,
  setCurrentUser,
  logoutUser,
  deleteUser,
  updateUser,
  getAllUsers,
  getUserById,
  registerTeacher,
  getAllTeachers,
  getPendingTeachers,
  getApprovedTeachers,
  approveTeacher,
  rejectTeacher,
  dismissTeacher,
  updateTeacherProfile,
  updateTeacherProfileWithWhatsApp,
  getTeacherById,
  getTeacherCourses,
  getTeacherStats,
  getCurrentTeacherId,
  addNewCourse,
  addNewCourseWithTeacher,
  approveCourse,
  getStudents,
  saveStudents,
  getStudentById,
  updateStudent,
  addStudent,
  getCourses,
  saveCourses,
  getCourseByKey,
  addLessonToCourse,
  updateCourse,
  deleteCourse,
  updateLesson,
  deleteLesson,
  getLessons,
  getLessonById,
  toggleLessonLock,
  getLockedLessonsCount,
  getLockedLessonsForStudent,
  isLessonAccessible,
  addMultimediaToLesson,
  updateMultimediaInLesson,
  deleteMultimediaFromLesson,
  getPlatformStats,
  getAllCoursesForAdmin,
  getCourseDetailsForAdmin,
  deleteCourseAsAdmin,
  deleteLessonAsAdmin,
  getTeacherCoursesForAdmin,
  getCourseAnalyticsForAdmin,
  getAllCoursesAnalyticsForAdmin,
  updateCourseAsAdmin,
  updateLessonAsAdmin,
  getUnapprovedCourses,
  approveCourseAsAdmin,
  rejectCourseAsAdmin,
  generateCertificate,
  getStudentCertificates,
  getCertificateById,
  verifyCertificate,
  checkCertificateEligibility,
  addQuizToLesson,
  updateQuizInLesson,
  deleteQuizFromLesson,
  getQuizResults,
  saveQuizResult,
  getQuizAnalytics,
  getStudentQuizProgress,
  enrollStudentInCourse,
  unenrollStudentFromCourse,
  getEnrolledCoursesWithProgress,
  updateCourseProgress,
  getCourseCompletionStatus,
  exportData,
  importData,
  resetAllData,
  calculateOverallProgress,
  getStudentActivity,
  debugStorage,
  getTeacherWhatsAppUrl
};
