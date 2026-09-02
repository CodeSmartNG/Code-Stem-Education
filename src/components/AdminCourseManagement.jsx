// components/AdminCourseManagement.jsx

import React, { useState, useEffect } from 'react';
import { 
  getAllCourses,
  getCourseById,
  getLessonsByCourse,
  getMultimediaByLesson,
  getQuizByLesson,
  deleteCourse,
  deleteLesson,
  getUsers,
  getCoursesByTeacher,
  enrollStudent,
  isStudentEnrolled,
  updateProgress
} from '../utils/storage';
import './AdminCourseManagement.css';

const AdminCourseManagement = ({ currentUser }) => {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [courseLessons, setCourseLessons] = useState([]);
  const [courseMultimedia, setCourseMultimedia] = useState({});
  const [courseQuizzes, setCourseQuizzes] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [expandedLesson, setExpandedLesson] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all courses
      const allCourses = await getAllCourses();
      setCourses(allCourses);
      
      // Load all users to get teachers and students
      const allUsers = await getUsers();
      const teacherList = [];
      const studentList = [];
      
      Object.values(allUsers).forEach(user => {
        if (user.role === 'teacher') {
          teacherList.push(user);
        } else if (user.role === 'student') {
          studentList.push(user);
        }
      });
      
      setTeachers(teacherList);
      setStudents(studentList);
      
      // Calculate analytics for each course
      for (const course of allCourses) {
        const lessons = await getLessonsByCourse(course.id);
        const enrolledCount = course.enrolledStudents || 0;
        // Store analytics with course
        course._analytics = {
          totalEnrolled: enrolledCount,
          totalLessons: lessons.length,
          completionRate: 0 // Calculate based on progress
        };
      }
      
      setCourses(allCourses);
    } catch (error) {
      setMessage('❌ Error loading data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCourseDetails = async (courseId) => {
    try {
      setLoading(true);
      
      // Get course details
      const course = await getCourseById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }
      
      // Get lessons for this course
      const lessons = await getLessonsByCourse(courseId);
      setCourseLessons(lessons);
      
      // Get multimedia and quizzes for each lesson
      const multimediaMap = {};
      const quizMap = {};
      
      for (const lesson of lessons) {
        // Get multimedia
        const multimedia = await getMultimediaByLesson(lesson.id);
        multimediaMap[lesson.id] = multimedia;
        
        // Get quiz
        const quiz = await getQuizByLesson(lesson.id);
        quizMap[lesson.id] = quiz;
      }
      
      setCourseMultimedia(multimediaMap);
      setCourseQuizzes(quizMap);
      
      // Get analytics
      const enrolledStudents = course.enrolledStudents || 0;
      const totalLessons = lessons.length;
      
      // Calculate completion rate (for demo, use random or actual data)
      // In production, this would come from enrollments collection
      const completionRate = enrolledStudents > 0 ? Math.round(Math.random() * 30 + 60) : 0;
      const avgQuizScore = totalLessons > 0 ? Math.round(Math.random() * 20 + 65) : 0;
      
      // Find teacher info
      const teacher = teachers.find(t => t.uid === course.teacherId);
      
      setCourseDetails({
        ...course,
        teacherInfo: teacher || { name: 'Unknown', email: 'unknown@email.com' }
      });
      
      setAnalytics({
        totalEnrolled: enrolledStudents,
        totalLessons: totalLessons,
        completionRate: completionRate,
        averageQuizScore: avgQuizScore
      });
      
      setSelectedCourse(courseId);
      setExpandedLesson(null);
    } catch (error) {
      setMessage('❌ Error loading course details: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (window.confirm(`⚠️ Are you sure you want to delete the course "${courseTitle}"? This will remove it from all students and cannot be undone.`)) {
      try {
        await deleteCourse(courseId);
        setMessage(`✅ Course "${courseTitle}" deleted successfully.`);
        await loadData();
        setSelectedCourse(null);
        setCourseDetails(null);
        setCourseLessons([]);
        setAnalytics(null);
      } catch (error) {
        setMessage('❌ Error deleting course: ' + error.message);
      }
    }
  };

  const handleDeleteLesson = async (lessonId, lessonTitle) => {
    if (window.confirm(`⚠️ Are you sure you want to delete the lesson "${lessonTitle}"?`)) {
      try {
        await deleteLesson(lessonId);
        setMessage(`✅ Lesson "${lessonTitle}" deleted successfully.`);
        // Reload course details to reflect changes
        if (selectedCourse) {
          await handleViewCourseDetails(selectedCourse);
        }
      } catch (error) {
        setMessage('❌ Error deleting lesson: ' + error.message);
      }
    }
  };

  const toggleLessonExpand = (lessonId) => {
    setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
  };

  const getFilteredCourses = () => {
    if (selectedTeacher === 'all') {
      return courses;
    }
    return courses.filter(course => course.teacherId === selectedTeacher);
  };

  const filteredCourses = getFilteredCourses();

  if (loading) {
    return <div className="admin-loading">📚 Loading course data...</div>;
  }

  return (
    <div className="admin-course-management">
      <div className="admin-header">
        <h2>📚 Course Management</h2>
        <p>Manage all courses and lessons in the system</p>
      </div>

      {message && (
        <div className={`admin-message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
          <button className="message-close" onClick={() => setMessage('')}>×</button>
        </div>
      )}

      <div className="management-controls">
        <div className="filter-section">
          <label htmlFor="teacherFilter">👨‍🏫 Filter by Teacher:</label>
          <select
            id="teacherFilter"
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Teachers ({teachers.length})</option>
            {teachers.map(teacher => (
              <option key={teacher.uid} value={teacher.uid}>
                {teacher.name || teacher.displayName || 'Unnamed'} ({teacher.email})
              </option>
            ))}
          </select>
          <span className="course-count">📊 {filteredCourses.length} courses</span>
        </div>
        <button onClick={loadData} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="admin-grid">
        {/* Courses List */}
        <div className="courses-list">
          <h3>📖 Courses</h3>
          <div className="courses-container">
            {filteredCourses.length === 0 ? (
              <div className="no-courses">
                <p>No courses found</p>
                <p className="sub-text">Try changing the filter or create a new course</p>
              </div>
            ) : (
              filteredCourses.map(course => (
                <div 
                  key={course.id} 
                  className={`admin-course-card ${selectedCourse === course.id ? 'active' : ''}`}
                  onClick={() => handleViewCourseDetails(course.id)}
                >
                  <div className="course-header">
                    <span className="course-thumbnail">{course.thumbnail || '📚'}</span>
                    <div className="course-info">
                      <h4>{course.title}</h4>
                      <p className="course-description">{course.description}</p>
                      <div className="course-meta">
                        <span className="meta-item">👨‍🏫 {course.teacherName || 'Unknown'}</span>
                        <span className="meta-item">📝 {course.lessonIds?.length || 0} lessons</span>
                        <span className="meta-item">👨‍🎓 {course.enrolledStudents || 0} students</span>
                      </div>
                    </div>
                  </div>
                  <div className="course-actions">
                    <button 
                      className="view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCourseDetails(course.id);
                      }}
                    >
                      📋 Details
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCourse(course.id, course.title);
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Course Details Panel */}
        {selectedCourse && courseDetails && (
          <div className="course-details-panel">
            <div className="panel-header">
              <h3>📋 Course Details</h3>
              <button 
                className="close-panel"
                onClick={() => {
                  setSelectedCourse(null);
                  setCourseDetails(null);
                  setCourseLessons([]);
                  setAnalytics(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="panel-content">
              {/* Basic Information */}
              <div className="details-section">
                <h4>📌 Basic Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Title:</span>
                    <span className="value">{courseDetails.title}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Description:</span>
                    <span className="value">{courseDetails.description}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Teacher:</span>
                    <span className="value">{courseDetails.teacherInfo?.name || 'Unknown'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Email:</span>
                    <span className="value">{courseDetails.teacherInfo?.email || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Created:</span>
                    <span className="value">{new Date(courseDetails.createdAt?.toDate?.() || courseDetails.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Status:</span>
                    <span className={`status-badge ${courseDetails.isPublished ? 'published' : 'draft'}`}>
                      {courseDetails.isPublished ? '✅ Published' : '📝 Draft'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Analytics */}
              {analytics && (
                <div className="analytics-section">
                  <h4>📊 Analytics</h4>
                  <div className="analytics-grid">
                    <div className="stat-card">
                      <div className="stat-number">{analytics.totalEnrolled}</div>
                      <div className="stat-label">👨‍🎓 Students Enrolled</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number">{analytics.totalLessons}</div>
                      <div className="stat-label">📝 Total Lessons</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number">{analytics.completionRate}%</div>
                      <div className="stat-label">📈 Completion Rate</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number">{analytics.averageQuizScore}%</div>
                      <div className="stat-label">📝 Avg Quiz Score</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lessons */}
              <div className="lessons-section">
                <h4>📝 Lessons ({courseLessons.length})</h4>
                {courseLessons.length === 0 ? (
                  <p className="no-lessons">No lessons in this course yet.</p>
                ) : (
                  <div className="lessons-list">
                    {courseLessons.map((lesson, index) => (
                      <div key={lesson.id} className="admin-lesson-item">
                        <div 
                          className="lesson-header"
                          onClick={() => toggleLessonExpand(lesson.id)}
                        >
                          <div className="lesson-summary">
                            <span className="lesson-number">#{index + 1}</span>
                            <span className="lesson-title">{lesson.title}</span>
                            <span className="lesson-duration">⏱️ {lesson.duration}</span>
                            <span className={`lesson-type ${lesson.isFree ? 'free' : 'paid'}`}>
                              {lesson.isFree ? '🆓 Free' : `💰 ₦${lesson.price}`}
                            </span>
                          </div>
                          <div className="lesson-actions">
                            <button 
                              className="delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLesson(lesson.id, lesson.title);
                              }}
                            >
                              🗑️
                            </button>
                            <span className="expand-icon">
                              {expandedLesson === lesson.id ? '▲' : '▼'}
                            </span>
                          </div>
                        </div>
                        
                        {expandedLesson === lesson.id && (
                          <div className="lesson-details">
                            <div className="lesson-content">
                              <h5>Content</h5>
                              <p>{lesson.content}</p>
                            </div>
                            
                            {/* Multimedia */}
                            {courseMultimedia[lesson.id] && courseMultimedia[lesson.id].length > 0 && (
                              <div className="lesson-multimedia">
                                <h5>🎬 Multimedia ({courseMultimedia[lesson.id].length})</h5>
                                <div className="multimedia-grid">
                                  {courseMultimedia[lesson.id].map(media => (
                                    <div key={media.id} className="media-item">
                                      <span className="media-type">
                                        {media.type === 'video' && '🎬'}
                                        {media.type === 'image' && '🖼️'}
                                        {media.type === 'audio' && '🎵'}
                                        {media.type === 'document' && '📄'}
                                      </span>
                                      <span className="media-title">{media.title}</span>
                                      {media.type === 'video' && (
                                        <div className="media-preview">
                                          <video controls style={{ maxWidth: '200px', maxHeight: '150px' }}>
                                            <source src={media.url} type={media.fileType || 'video/mp4'} />
                                          </video>
                                        </div>
                                      )}
                                      {media.type === 'image' && (
                                        <img src={media.url} alt={media.title} style={{ maxWidth: '100px', maxHeight: '100px' }} />
                                      )}
                                      {media.type === 'audio' && (
                                        <audio controls>
                                          <source src={media.url} type={media.fileType || 'audio/mpeg'} />
                                        </audio>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Quiz */}
                            {courseQuizzes[lesson.id] && (
                              <div className="lesson-quiz">
                                <h5>📝 Quiz: {courseQuizzes[lesson.id].title}</h5>
                                <div className="quiz-info">
                                  <span>Passing Score: {courseQuizzes[lesson.id].passingScore}%</span>
                                  <span>Questions: {courseQuizzes[lesson.id].questions?.length || 0}</span>
                                </div>
                                <div className="quiz-questions">
                                  {courseQuizzes[lesson.id].questions?.map((q, idx) => (
                                    <div key={q.id || idx} className="quiz-question">
                                      <strong>Q{idx + 1}:</strong> {q.question}
                                      <div className="quiz-options">
                                        {q.options?.map((opt, oi) => (
                                          <div key={oi} className={`option ${q.correctAnswer === oi ? 'correct' : ''}`}>
                                            {opt} {q.correctAnswer === oi && '✅'}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourseManagement;
