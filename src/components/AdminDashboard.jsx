import React, { useState, useEffect, useCallback } from 'react';
import { 
  getPendingTeachers, 
  approveTeacher, 
  rejectTeacher, 
  getAllTeachers,
  getPlatformStats,
  getUsers,
  getStudents,
  getCourses,
  deleteUser,
  updateUser,
  getAllCoursesForAdmin,
  getCourseAnalyticsForAdmin,
  getTeacherWallets,
  updateTeacherWallet,
  getPaymentTransactions,
  savePaymentTransactions,
  saveTeacherWallets,
  getTeacherWallet,
  dismissTeacher,
  getTeacherCoursesForAdmin,
  getAllCoursesAnalyticsForAdmin
} from '../utils/storage';
import './AdminDashboard.css';

const AdminDashboard = ({ currentUser, setCurrentView }) => {
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [approvedTeachers, setApprovedTeachers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [teacherWallets, setTeacherWallets] = useState({});
  const [paymentTransactions, setPaymentTransactions] = useState({});
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    try {
      const pending = getPendingTeachers();
      const allTeachers = getAllTeachers();
      const approved = allTeachers.filter(teacher => teacher.isApproved);
      const platformStats = getPlatformStats();
      const users = Object.values(getUsers());
      const courses = Object.values(getAllCoursesForAdmin());
      const wallets = getTeacherWallets();
      const transactions = getPaymentTransactions();

      setPendingTeachers(pending);
      setApprovedTeachers(approved);
      setAllUsers(users);
      setAllCourses(courses);
      setStats(platformStats);
      setTeacherWallets(wallets);
      setPaymentTransactions(transactions);

      // Extract pending withdrawals
      const withdrawals = [];
      Object.values(wallets).forEach(wallet => {
        if (wallet.transactions) {
          wallet.transactions.forEach(transaction => {
            if (transaction.type === 'debit' && transaction.status === 'pending') {
              withdrawals.push({
                ...transaction,
                teacherId: wallet.teacherId,
                teacherName: wallet.teacherName
              });
            }
          });
        }
      });
      setPendingWithdrawals(withdrawals);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading dashboard data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleApproveTeacher = useCallback((teacherId) => {
    if (window.confirm('Are you sure you want to approve this teacher?')) {
      setLoading(true);
      try {
        approveTeacher(teacherId);
        loadData();
        alert('✅ Teacher approved successfully! They can now access the teacher dashboard.');
      } catch (error) {
        alert('❌ Error approving teacher: ' + error.message);
      }
      setLoading(false);
    }
  }, [loadData]);

  const handleRejectTeacher = useCallback((teacherId) => {
    if (window.confirm('Are you sure you want to reject this teacher application? This action cannot be undone.')) {
      setLoading(true);
      try {
        rejectTeacher(teacherId);
        loadData();
        alert('✅ Teacher application rejected.');
      } catch (error) {
        alert('❌ Error rejecting teacher: ' + error.message);
      }
      setLoading(false);
    }
  }, [loadData]);

  const handleDismissTeacher = useCallback((teacherId) => {
    if (window.confirm('Are you sure you want to dismiss this teacher? They will lose all access to the teacher dashboard.')) {
      setLoading(true);
      try {
        dismissTeacher(teacherId);
        loadData();
        alert('✅ Teacher dismissed successfully.');
      } catch (error) {
        alert('❌ Error dismissing teacher: ' + error.message);
      }
      setLoading(false);
    }
  }, [loadData]);

  const handleDeleteUser = useCallback((userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone and all their data will be lost.')) {
      setLoading(true);
      try {
        deleteUser(userId);
        loadData();
        alert('✅ User deleted successfully.');
      } catch (error) {
        alert('❌ Error deleting user: ' + error.message);
      }
      setLoading(false);
    }
  }, [loadData]);

  const handleApproveWithdrawal = useCallback((teacherId, transactionId) => {
    if (window.confirm('Are you sure you want to approve this withdrawal? The funds will be transferred to the teacher.')) {
      setLoading(true);
      try {
        const wallets = getTeacherWallets();
        const wallet = wallets[teacherId];

        if (wallet) {
          const transaction = wallet.transactions.find(t => t.id === transactionId);
          const updatedTransactions = wallet.transactions.map(t => 
            t.id === transactionId 
              ? { ...t, status: 'completed', completedAt: new Date().toISOString() }
              : t
          );

          wallets[teacherId] = {
            ...wallet,
            transactions: updatedTransactions,
            pendingWithdrawals: Math.max(0, (wallet.pendingWithdrawals || 0) - (transaction?.amount || 0)),
            updatedAt: new Date().toISOString()
          };

          saveTeacherWallets(wallets);
          loadData();
          alert('✅ Withdrawal approved successfully!');
        }
      } catch (error) {
        alert('❌ Error approving withdrawal: ' + error.message);
      }
      setLoading(false);
    }
  }, [loadData]);

  const handleRejectWithdrawal = useCallback((teacherId, transactionId) => {
    if (window.confirm('Are you sure you want to reject this withdrawal? The funds will be returned to the teacher\'s wallet.')) {
      setLoading(true);
      try {
        const wallets = getTeacherWallets();
        const wallet = wallets[teacherId];

        if (wallet) {
          const transaction = wallet.transactions.find(t => t.id === transactionId);
          const updatedTransactions = wallet.transactions.map(t => 
            t.id === transactionId 
              ? { ...t, status: 'rejected', rejectedAt: new Date().toISOString() }
              : t
          );

          wallets[teacherId] = {
            ...wallet,
            balance: (wallet.balance || 0) + (transaction?.amount || 0),
            pendingWithdrawals: Math.max(0, (wallet.pendingWithdrawals || 0) - (transaction?.amount || 0)),
            transactions: updatedTransactions,
            updatedAt: new Date().toISOString()
          };

          saveTeacherWallets(wallets);
          loadData();
          alert('✅ Withdrawal rejected. Funds returned to teacher wallet.');
        }
      } catch (error) {
        alert('❌ Error rejecting withdrawal: ' + error.message);
      }
      setLoading(false);
    }
  }, [loadData]);

  const handleViewUser = useCallback((user) => {
    setSelectedUser(user);
  }, []);

  const handleCloseUserDetails = useCallback(() => {
    setSelectedUser(null);
  }, []);

  const handleManageCourses = useCallback(() => {
    setCurrentView('admin-courses');
  }, [setCurrentView]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  }, []);

  const formatCurrency = useCallback((amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  }, []);

  const getUserRoleBadge = useCallback((user) => {
    if (user.role === 'admin') {
      return <span className="role-badge admin">👑 Admin</span>;
    } else if (user.role === 'teacher') {
      return user.isApproved ? 
        <span className="role-badge teacher">👨‍🏫 Teacher</span> :
        <span className="role-badge pending">⏳ Pending</span>;
    } else {
      return <span className="role-badge student">👨‍🎓 Student</span>;
    }
  }, []);

  const getTopCourses = useCallback(() => {
    const coursesWithAnalytics = allCourses.map(course => {
      try {
        const analytics = getCourseAnalyticsForAdmin(course.key);
        return { ...course, analytics };
      } catch (error) {
        return { ...course, analytics: { totalEnrolled: 0 } };
      }
    });

    return coursesWithAnalytics
      .sort((a, b) => (b.analytics?.totalEnrolled || 0) - (a.analytics?.totalEnrolled || 0))
      .slice(0, 5);
  }, [allCourses]);

  const calculatePlatformEarnings = useCallback(() => {
    let total = 0;
    Object.values(teacherWallets).forEach(wallet => {
      if (wallet.transactions) {
        wallet.transactions.forEach(transaction => {
          if (transaction.type === 'credit') {
            total += transaction.amount * 0.1;
          }
        });
      }
    });
    return total;
  }, [teacherWallets]);

  // Filter users based on search and role
  const getFilteredUsers = useCallback(() => {
    let filtered = allUsers;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(term) || 
        user.email?.toLowerCase().includes(term)
      );
    }
    
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }
    
    return filtered;
  }, [allUsers, searchTerm, filterRole]);

  if (loading && !Object.keys(stats).length) {
    return (
      <div className="admin-dashboard">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-content">
          <h1>👑 Admin Dashboard</h1>
          <p>Welcome back, {currentUser?.name || 'Admin'}!</p>
        </div>
        <div className="admin-header-actions">
          <button 
            className="refresh-btn"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          className="action-btn primary"
          onClick={handleManageCourses}
        >
          📚 Manage All Courses
        </button>
        <button 
          className={`action-btn secondary ${pendingTeachers.length > 0 ? 'has-notification' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          👨‍🏫 Review Teachers 
          {pendingTeachers.length > 0 && <span className="notification-badge">{pendingTeachers.length}</span>}
        </button>
        <button 
          className={`action-btn secondary ${pendingWithdrawals.length > 0 ? 'has-notification' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          💰 Payment Approvals
          {pendingWithdrawals.length > 0 && <span className="notification-badge">{pendingWithdrawals.length}</span>}
        </button>
        <button 
          className="action-btn secondary"
          onClick={() => setActiveTab('users')}
        >
          👥 View All Users ({allUsers.length})
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-students">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.totalStudents || 0}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="stat-card stat-card-teachers">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-info">
            <h3>{approvedTeachers.length}</h3>
            <p>Approved Teachers</p>
          </div>
        </div>
        <div className="stat-card stat-card-earnings">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>{formatCurrency(calculatePlatformEarnings())}</h3>
            <p>Platform Earnings</p>
          </div>
        </div>
        <div className="stat-card stat-card-pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{pendingWithdrawals.length}</h3>
            <p>Pending Payments</p>
          </div>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="overview-tab">
          <div className="overview-grid">
            <div className="overview-card overview-card-courses">
              <h3>📊 Top Courses by Enrollment</h3>
              <div className="courses-list">
                {getTopCourses().length > 0 ? (
                  getTopCourses().map((course, index) => (
                    <div key={course.key} className="course-item">
                      <div className="course-rank">#{index + 1}</div>
                      <div className="course-info">
                        <div className="course-title">{course.title}</div>
                        <div className="course-meta">
                          <span>By: {course.teacherName}</span>
                          <span>•</span>
                          <span>{course.analytics?.totalEnrolled || 0} students</span>
                        </div>
                      </div>
                      <button 
                        className="btn-view-small"
                        onClick={handleManageCourses}
                      >
                        View
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="empty-text">No courses available</p>
                )}
              </div>
            </div>

            <div className="overview-card overview-card-activity">
              <h3>🔄 Recent Activity</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-icon">👨‍🏫</div>
                  <div className="activity-info">
                    <div className="activity-title">Teacher Applications</div>
                    <div className="activity-desc">
                      {pendingTeachers.length} pending review
                    </div>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">💰</div>
                  <div className="activity-info">
                    <div className="activity-title">Payment Approvals</div>
                    <div className="activity-desc">
                      {pendingWithdrawals.length} withdrawals pending
                    </div>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">📚</div>
                  <div className="activity-info">
                    <div className="activity-title">Course Management</div>
                    <div className="activity-desc">
                      {allCourses.length} total courses available
                    </div>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">👥</div>
                  <div className="activity-info">
                    <div className="activity-title">Total Users</div>
                    <div className="activity-desc">
                      {allUsers.length} users registered
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overview-card overview-card-stats">
              <h3>📈 Platform Statistics</h3>
              <div className="stats-list">
                <div className="stat-item">
                  <span className="stat-label">Total Lessons:</span>
                  <span className="stat-value">{stats.totalLessons || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Completed Lessons:</span>
                  <span className="stat-value">{stats.totalCompletedLessons || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Platform Revenue:</span>
                  <span className="stat-value">{formatCurrency(calculatePlatformEarnings())}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Pending Payments:</span>
                  <span className="stat-value">{pendingWithdrawals.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Courses:</span>
                  <span className="stat-value">{stats.totalCourses || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Approvals Tab */}
      {activeTab === 'payments' && (
        <div className="tab-content">
          <div className="section-header">
            <div className="section-header-left">
              <h2>💰 Payment Approvals</h2>
              <p>Review and approve teacher withdrawal requests</p>
            </div>
            <div className="section-header-right">
              <span className="pending-count">{pendingWithdrawals.length} pending</span>
            </div>
          </div>

          {pendingWithdrawals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <h3>No Pending Payments</h3>
              <p>All withdrawal requests have been processed.</p>
            </div>
          ) : (
            <div className="payments-grid">
              {pendingWithdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="payment-card">
                  <div className="payment-header">
                    <div className="payment-teacher">
                      <div className="teacher-avatar">
                        {withdrawal.teacherName?.charAt(0).toUpperCase() || 'T'}
                      </div>
                      <div className="teacher-info">
                        <h4>{withdrawal.teacherName}</h4>
                        <p className="teacher-id">ID: {withdrawal.teacherId}</p>
                      </div>
                    </div>
                    <div className="payment-amount">
                      <span className="amount">{formatCurrency(withdrawal.amount)}</span>
                      <span className="status pending">⏳ Pending</span>
                    </div>
                  </div>

                  <div className="payment-details">
                    <div className="detail-row">
                      <label>Bank Name:</label>
                      <span>{withdrawal.bankDetails?.bankName || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <label>Account Number:</label>
                      <span>{withdrawal.bankDetails?.accountNumber || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <label>Account Name:</label>
                      <span>{withdrawal.bankDetails?.accountName || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <label>Request Date:</label>
                      <span>{formatDate(withdrawal.date)}</span>
                    </div>
                    <div className="detail-row">
                      <label>Description:</label>
                      <span>{withdrawal.description}</span>
                    </div>
                  </div>

                  <div className="payment-actions">
                    <button 
                      className="btn-approve"
                      onClick={() => handleApproveWithdrawal(withdrawal.teacherId, withdrawal.id)}
                      disabled={loading}
                    >
                      ✅ Approve Payment
                    </button>
                    <button 
                      className="btn-reject"
                      onClick={() => handleRejectWithdrawal(withdrawal.teacherId, withdrawal.id)}
                      disabled={loading}
                    >
                      ❌ Reject Payment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Teacher Wallet Summary */}
          <div className="wallet-summary-section">
            <h3>📊 Teacher Wallet Summary</h3>
            <div className="wallets-grid">
              {Object.values(teacherWallets).map(wallet => (
                <div key={wallet.teacherId} className="wallet-summary-card">
                  <div className="wallet-header">
                    <h4>{wallet.teacherName}</h4>
                    <span className="wallet-id">ID: {wallet.teacherId}</span>
                  </div>
                  <div className="wallet-balances">
                    <div className="balance-item">
                      <span className="label">Available:</span>
                      <span className="value">{formatCurrency(wallet.balance)}</span>
                    </div>
                    <div className="balance-item">
                      <span className="label">Total Earnings:</span>
                      <span className="value">{formatCurrency(wallet.totalEarnings)}</span>
                    </div>
                    <div className="balance-item">
                      <span className="label">Pending Withdrawals:</span>
                      <span className="value">{formatCurrency(wallet.pendingWithdrawals)}</span>
                    </div>
                  </div>
                  <div className="wallet-transactions">
                    <span className="transactions-count">
                      {wallet.transactions?.length || 0} transactions
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Management Section */}
      <div className="management-section">
        <div className="section-header">
          <h2>👥 User Management</h2>
          <div className="tab-buttons">
            <button 
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview
            </button>
            <button 
              className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
              onClick={() => setActiveTab('payments')}
            >
              💰 Payments ({pendingWithdrawals.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              ⏳ Pending Teachers ({pendingTeachers.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
              onClick={() => setActiveTab('teachers')}
            >
              ✅ Approved Teachers ({approvedTeachers.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              👥 All Users ({allUsers.length})
            </button>
          </div>
        </div>

        {/* Pending Teachers Tab */}
        {activeTab === 'pending' && (
          <div className="tab-content">
            {pendingTeachers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <h3>No Pending Requests</h3>
                <p>All teacher applications have been reviewed.</p>
              </div>
            ) : (
              <div className="users-grid">
                {pendingTeachers.map(teacher => (
                  <div key={teacher.id} className="user-card pending">
                    <div className="user-header">
                      <div className="user-avatar">
                        {teacher.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="user-info">
                        <h4>{teacher.name}</h4>
                        <p className="user-email">{teacher.email}</p>
                        <p className="user-specialization">{teacher.specialization}</p>
                      </div>
                      {getUserRoleBadge(teacher)}
                    </div>

                    <div className="user-bio">
                      <p>{teacher.bio || 'No bio provided.'}</p>
                    </div>

                    <div className="user-meta">
                      <div className="meta-item">
                        <span className="meta-label">Applied:</span>
                        <span className="meta-value">{formatDate(teacher.joinedDate)}</span>
                      </div>
                    </div>

                    <div className="action-buttons">
                      <button 
                        className="btn-approve"
                        onClick={() => handleApproveTeacher(teacher.id)}
                        disabled={loading}
                      >
                        ✅ Approve
                      </button>
                      <button 
                        className="btn-reject"
                        onClick={() => handleRejectTeacher(teacher.id)}
                        disabled={loading}
                      >
                        ❌ Reject
                      </button>
                      <button 
                        className="btn-view"
                        onClick={() => handleViewUser(teacher)}
                      >
                        👁 View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Approved Teachers Tab */}
        {activeTab === 'teachers' && (
          <div className="tab-content">
            {approvedTeachers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👨‍🏫</div>
                <h3>No Approved Teachers</h3>
                <p>Approved teachers will appear here.</p>
              </div>
            ) : (
              <div className="users-grid">
                {approvedTeachers.map(teacher => (
                  <div key={teacher.id} className="user-card approved">
                    <div className="user-header">
                      <div className="user-avatar approved">
                        {teacher.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="user-info">
                        <h4>{teacher.name}</h4>
                        <p className="user-email">{teacher.email}</p>
                        <p className="user-specialization">{teacher.specialization}</p>
                      </div>
                      {getUserRoleBadge(teacher)}
                    </div>

                    <div className="user-bio">
                      <p>{teacher.bio || 'No bio provided.'}</p>
                    </div>

                    <div className="user-meta">
                      <div className="meta-item">
                        <span className="meta-label">Approved:</span>
                        <span className="meta-value">
                          {teacher.approvedDate ? formatDate(teacher.approvedDate) : 'N/A'}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Courses:</span>
                        <span className="meta-value">{teacher.courses?.length || 0}</span>
                      </div>
                    </div>

                    <div className="action-buttons">
                      <button 
                        className="btn-dismiss"
                        onClick={() => handleDismissTeacher(teacher.id)}
                        disabled={loading}
                      >
                        🚫 Dismiss
                      </button>
                      <button 
                        className="btn-view"
                        onClick={() => handleViewUser(teacher)}
                      >
                        👁 View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All Users Tab */}
        {activeTab === 'users' && (
          <div className="tab-content">
            <div className="table-controls">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="filter-box">
                <select 
                  value={filterRole} 
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
              </div>
            </div>

            {getFilteredUsers().length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No Users Found</h3>
                <p>Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredUsers().map(user => (
                      <tr key={user.id} className="user-row">
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar small">
                              {user.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="user-details">
                              <div className="user-name">{user.name}</div>
                              <div className="user-email">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {getUserRoleBadge(user)}
                        </td>
                        <td>
                          <span className={`status-badge ${user.role === 'teacher' ? (user.isApproved ? 'approved' : 'pending') : 'active'}`}>
                            {user.role === 'teacher' ? (
                              user.isApproved ? '✅ Approved' : '⏳ Pending'
                            ) : (
                              '✅ Active'
                            )}
                          </span>
                        </td>
                        <td>
                          {formatDate(user.joinedDate)}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button 
                              className="btn-view"
                              onClick={() => handleViewUser(user)}
                            >
                              👁 View
                            </button>
                            {user.id !== currentUser?.id && user.role !== 'admin' && (
                              <button 
                                className="btn-delete"
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={loading}
                              >
                                🗑 Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) handleCloseUserDetails();
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>👤 User Details</h3>
              <button className="close-btn" onClick={handleCloseUserDetails}>×</button>
            </div>
            <div className="modal-body">
              <div className="user-detail-section">
                <div className="user-detail-avatar">
                  <div className="user-avatar large">
                    {selectedUser.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="user-detail-name">
                    <h4>{selectedUser.name}</h4>
                    <span className="user-detail-email">{selectedUser.email}</span>
                  </div>
                </div>

                <div className="detail-grid">
                  <div className="detail-row">
                    <label>Role:</label>
                    <span>{getUserRoleBadge(selectedUser)}</span>
                  </div>
                  <div className="detail-row">
                    <label>Joined Date:</label>
                    <span>{formatDate(selectedUser.joinedDate)}</span>
                  </div>
                  {selectedUser.role === 'teacher' && (
                    <>
                      <div className="detail-row">
                        <label>Specialization:</label>
                        <span>{selectedUser.specialization || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <label>Status:</label>
                        <span>{selectedUser.isApproved ? '✅ Approved' : '⏳ Pending'}</span>
                      </div>
                      {selectedUser.approvedDate && (
                        <div className="detail-row">
                          <label>Approved Date:</label>
                          <span>{formatDate(selectedUser.approvedDate)}</span>
                        </div>
                      )}
                      {selectedUser.whatsappNumber && (
                        <div className="detail-row">
                          <label>WhatsApp:</label>
                          <span>{selectedUser.whatsappNumber}</span>
                        </div>
                      )}
                      <div className="detail-row">
                        <label>Bio:</label>
                        <span>{selectedUser.bio || 'No bio provided'}</span>
                      </div>
                    </>
                  )}
                  {selectedUser.role === 'student' && (
                    <>
                      <div className="detail-row">
                        <label>Level:</label>
                        <span>{selectedUser.level || 'Beginner'}</span>
                      </div>
                      <div className="detail-row">
                        <label>Points:</label>
                        <span>{selectedUser.points || 0}</span>
                      </div>
                      <div className="detail-row">
                        <label>Enrolled Courses:</label>
                        <span>{selectedUser.enrolledCourses?.length || 0}</span>
                      </div>
                      <div className="detail-row">
                        <label>Completed Lessons:</label>
                        <span>{selectedUser.completedLessons?.length || 0}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-close" onClick={handleCloseUserDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;