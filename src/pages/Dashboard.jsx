import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = ({ student, setStudent }) => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Fix: Add null checks for student and student.progress
  const progress = student?.progress || {};
  const totalProgress = Object.values(progress).length > 0 
    ? Object.values(progress).reduce((a, b) => a + b, 0) / Object.values(progress).length 
    : 0;

  // Calculate total completed lessons
  const totalCompletedLessons = student?.completedLessons?.length || 0;

  // Calculate earned points
  const totalPoints = student?.points || 0;

  // Get level based on points/progress
  const getLevel = () => {
    if (student?.level) return student.level;
    if (totalProgress >= 80) return 'Advanced';
    if (totalProgress >= 50) return 'Intermediate';
    if (totalProgress >= 20) return 'Beginner';
    return 'Novice';
  };

  const getLevelEmoji = () => {
    const level = getLevel();
    switch(level) {
      case 'Advanced': return '🚀';
      case 'Intermediate': return '📚';
      case 'Beginner': return '🌱';
      default: return '🌱';
    }
  };

  const getJoinedDate = () => {
    if (student?.joinedDate) {
      try {
        return new Date(student.joinedDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return 'Recently';
      }
    }
    return 'Recently';
  };

  // Load enrolled courses and recent activity
  useEffect(() => {
    if (student?.enrolledCourses) {
      setEnrolledCourses(student.enrolledCourses);
    }
    if (student?.recentActivity) {
      setRecentActivity(student.recentActivity);
    }
  }, [student]);

  // If student is null/undefined, show loading or error state
  if (!student) {
    return (
      <div className="dashboard">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h3>Loading Dashboard...</h3>
          <p>Please wait while we load your learning progress.</p>
        </div>
      </div>
    );
  }

  const level = getLevel();
  const levelEmoji = getLevelEmoji();

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <div className="welcome-avatar">
            {student.name?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div className="welcome-text">
            <h2>Welcome back, {student.name}! 👋</h2>
            <p className="welcome-subtitle">
              {levelEmoji} {level} Level • Member since {getJoinedDate()}
            </p>
          </div>
        </div>
        <div className="welcome-stats-mini">
          <div className="mini-stat">
            <span className="mini-stat-number">{totalCompletedLessons}</span>
            <span className="mini-stat-label">Lessons</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-number">{totalPoints}</span>
            <span className="mini-stat-label">Points</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card stat-card-level">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Level</h3>
            <p className="stat-value">{level}</p>
          </div>
        </div>

        <div className="stat-card stat-card-progress">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <h3>Overall Progress</h3>
            <p className="stat-value">{totalProgress.toFixed(1)}%</p>
          </div>
        </div>

        <div className="stat-card stat-card-lessons">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Completed Lessons</h3>
            <p className="stat-value">{totalCompletedLessons}</p>
          </div>
        </div>

        <div className="stat-card stat-card-points">
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <h3>Points Earned</h3>
            <p className="stat-value">{totalPoints}</p>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      {student.badges && student.badges.length > 0 && (
        <div className="badges-section">
          <h3>🏅 Achievements & Badges</h3>
          <div className="badges-list">
            {student.badges.map((badge, index) => (
              <div key={index} className="badge-item">
                <span className="badge-icon">🏅</span>
                <span className="badge-name">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Progress Overview */}
      <div className="progress-overview">
        <h3>📚 Course Progress</h3>
        <div className="course-progress">
          {Object.keys(progress).length > 0 ? (
            Object.entries(progress).map(([course, value]) => (
              <div key={course} className="progress-item">
                <div className="progress-header">
                  <span className="course-name">
                    {course.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="progress-percentage">{value || 0}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{width: `${value || 0}%`}}
                  >
                    {value >= 30 && `${value || 0}%`}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-progress">
              <p>No courses in progress yet.</p>
              <button className="browse-courses-btn">Browse Courses</button>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="dashboard-grid">
        {/* Recent Activity */}
        <div className="recent-activity">
          <h3>🔄 Recent Activity</h3>
          {student.completedLessons && student.completedLessons.length > 0 ? (
            <ul className="activity-list">
              {student.completedLessons.slice(-5).reverse().map((lesson, index) => (
                <li key={index} className="activity-item">
                  <span className="activity-icon">✅</span>
                  <span className="activity-text">Completed: {lesson}</span>
                  <span className="activity-time">Just now</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <p>No activity yet. Start learning!</p>
            </div>
          )}
        </div>

        {/* Enrolled Courses */}
        <div className="enrolled-courses">
          <h3>📖 Enrolled Courses</h3>
          {enrolledCourses.length > 0 ? (
            <ul className="enrolled-list">
              {enrolledCourses.slice(0, 5).map((course, index) => (
                <li key={index} className="enrolled-item">
                  <span className="enrolled-icon">📘</span>
                  <span className="enrolled-name">{course}</span>
                  <span className="enrolled-status">In Progress</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <p>No courses enrolled.</p>
              <button className="explore-btn">Explore Courses</button>
            </div>
          )}
        </div>
      </div>

      {/* Account Info */}
      <div className="account-info">
        <h3>👤 Account Information</h3>
        <div className="account-grid">
          <div className="account-item">
            <span className="account-label">Member since:</span>
            <span className="account-value">{getJoinedDate()}</span>
          </div>
          <div className="account-item">
            <span className="account-label">Email address:</span>
            <span className="account-value">{student.email}</span>
          </div>
          <div className="account-item">
            <span className="account-label">Level:</span>
            <span className="account-value">{level}</span>
          </div>
          <div className="account-item">
            <span className="account-label">Total Points:</span>
            <span className="account-value">{totalPoints}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;