import React, { useState, useEffect } from 'react';
import './Resources.css';
import { getCurrentUser, getUsers } from '../utils/storage';

const Resources = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadedResources, setDownloadedResources] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Resource data with categories
  const resourcesData = {
    categories: [
      {
        id: 'learning-materials',
        name: 'Learning Materials',
        icon: '📚',
        description: 'Comprehensive learning materials to enhance your STEM education',
        items: [
          { 
            id: 'cheat-sheets', 
            name: 'Programming Cheat Sheets', 
            type: 'PDF', 
            icon: '📄', 
            size: '2.4 MB',
            url: '/resources/cheat-sheets.pdf',
            description: 'Quick reference guides for HTML, CSS, JavaScript, and Python'
          },
          { 
            id: 'video-tutorials', 
            name: 'Video Tutorials', 
            type: 'Video', 
            icon: '🎥', 
            size: '45 min',
            url: '/resources/video-tutorials',
            description: 'Step-by-step video tutorials on various STEM topics'
          },
          { 
            id: 'practice-exercises', 
            name: 'Practice Exercises', 
            type: 'Interactive', 
            icon: '💻', 
            size: '15 exercises',
            url: '/resources/practice-exercises',
            description: 'Interactive coding exercises with instant feedback'
          },
          { 
            id: 'e-books', 
            name: 'E-Books Collection', 
            type: 'PDF', 
            icon: '📖', 
            size: '12.8 MB',
            url: '/resources/e-books',
            description: 'Free e-books covering programming, mathematics, and science'
          },
          { 
            id: 'flashcards', 
            name: 'STEM Flashcards', 
            type: 'Interactive', 
            icon: '🃏', 
            size: '50 cards',
            url: '/resources/flashcards',
            description: 'Flashcards for key STEM concepts and terminology'
          }
        ]
      },
      {
        id: 'tools-software',
        name: 'Tools & Software',
        icon: '🛠️',
        description: 'Essential tools and software for STEM learning and development',
        items: [
          { 
            id: 'code-editors', 
            name: 'Code Editor Recommendations', 
            type: 'Guide', 
            icon: '⚙️', 
            size: '5 min read',
            url: '/resources/code-editors',
            description: 'Best code editors for beginners and advanced developers'
          },
          { 
            id: 'free-tools', 
            name: 'Free Development Tools', 
            type: 'Tools', 
            icon: '🛠️', 
            size: '10 tools',
            url: '/resources/free-tools',
            description: 'Curated list of free tools for web development and programming'
          },
          { 
            id: 'browser-extensions', 
            name: 'Browser Extensions', 
            type: 'Extensions', 
            icon: '🔧', 
            size: '8 extensions',
            url: '/resources/browser-extensions',
            description: 'Useful browser extensions for developers and STEM learners'
          },
          { 
            id: 'ai-tools', 
            name: 'AI Learning Tools', 
            type: 'Tools', 
            icon: '🤖', 
            size: '6 tools',
            url: '/resources/ai-tools',
            description: 'AI-powered tools to enhance your learning experience'
          }
        ]
      },
      {
        id: 'career-resources',
        name: 'Career Resources',
        icon: '💼',
        description: 'Resources to help you build a successful career in STEM',
        items: [
          { 
            id: 'resume-templates', 
            name: 'Resume Templates', 
            type: 'Templates', 
            icon: '📝', 
            size: '5 templates',
            url: '/resources/resume-templates',
            description: 'Professional resume templates tailored for STEM jobs'
          },
          { 
            id: 'interview-prep', 
            name: 'Interview Preparation', 
            type: 'Guide', 
            icon: '💼', 
            size: '30 min read',
            url: '/resources/interview-prep',
            description: 'Guide to acing technical interviews in STEM fields'
          },
          { 
            id: 'job-search-tips', 
            name: 'Job Search Tips', 
            type: 'Articles', 
            icon: '🔍', 
            size: '15 articles',
            url: '/resources/job-search-tips',
            description: 'Strategies for finding and landing your dream STEM job'
          },
          { 
            id: 'linkedin-guide', 
            name: 'LinkedIn Optimization', 
            type: 'Guide', 
            icon: '📊', 
            size: '20 min read',
            url: '/resources/linkedin-guide',
            description: 'How to optimize your LinkedIn profile for STEM opportunities'
          }
        ]
      },
      {
        id: 'community',
        name: 'Community & Support',
        icon: '🤝',
        description: 'Connect with the STEM community and get support',
        items: [
          { 
            id: 'discord-community', 
            name: 'STEM Discord Community', 
            type: 'Community', 
            icon: '💬', 
            size: '2k+ members',
            url: '/resources/discord',
            description: 'Join our Discord community to connect with fellow learners'
          },
          { 
            id: 'study-groups', 
            name: 'Study Groups', 
            type: 'Community', 
            icon: '👥', 
            size: '5 groups',
            url: '/resources/study-groups',
            description: 'Join study groups to learn together with others'
          },
          { 
            id: 'mentorship', 
            name: 'Mentorship Program', 
            type: 'Support', 
            icon: '🌟', 
            size: '25 mentors',
            url: '/resources/mentorship',
            description: 'Get guidance from experienced professionals in STEM'
          }
        ]
      }
    ]
  };

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      // Load user's downloaded resources
      if (user) {
        const users = await getUsers();
        const userData = users[user.uid];
        if (userData?.downloadedResources) {
          setDownloadedResources(userData.downloadedResources);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (resource) => {
    if (!currentUser) {
      alert('Please log in to download resources');
      return;
    }

    try {
      // Simulate download
      console.log(`Downloading: ${resource.name}`);
      
      // Update downloaded resources in user profile
      const updatedDownloads = [...downloadedResources, resource.id];
      setDownloadedResources(updatedDownloads);
      
      // In a real app, you would update Firebase here
      // await updateUserData(currentUser.uid, {
      //   downloadedResources: updatedDownloads
      // });

      alert(`✅ Downloading ${resource.name}...`);
    } catch (error) {
      console.error('Error downloading resource:', error);
      alert('❌ Error downloading resource. Please try again.');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const getFilteredItems = () => {
    let allItems = [];
    let categories = resourcesData.categories;

    if (selectedCategory !== 'all') {
      categories = categories.filter(c => c.id === selectedCategory);
    }

    categories.forEach(category => {
      category.items.forEach(item => {
        if (searchTerm === '' || 
            item.name.toLowerCase().includes(searchTerm) || 
            item.description.toLowerCase().includes(searchTerm) ||
            category.name.toLowerCase().includes(searchTerm)) {
          allItems.push({
            ...item,
            categoryName: category.name,
            categoryId: category.id
          });
        }
      });
    });

    return allItems;
  };

  const isResourceDownloaded = (resourceId) => {
    return downloadedResources.includes(resourceId);
  };

  if (loading) {
    return (
      <div className="resources-loading">
        <div className="loading-spinner"></div>
        <p>Loading resources...</p>
      </div>
    );
  }

  const filteredItems = getFilteredItems();

  return (
    <div className="resources-container">
      {/* Header Section */}
      <div className="resources-header">
        <div className="header-content">
          <h1>📚 Learning Resources</h1>
          <p>Additional materials to support your STEM learning journey</p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{resourcesData.categories.reduce((total, c) => total + c.items.length, 0)}</span>
            <span className="stat-label">Total Resources</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{resourcesData.categories.length}</span>
            <span className="stat-label">Categories</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{downloadedResources.length}</span>
            <span className="stat-label">Downloaded</span>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="resources-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search resources..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        <div className="category-filters">
          <button 
            className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => handleCategoryFilter('all')}
          >
            All
          </button>
          {resourcesData.categories.map(category => (
            <button 
              key={category.id}
              className={`filter-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryFilter(category.id)}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      {filteredItems.length > 0 ? (
        <div className="resources-grid">
          {filteredItems.map((item) => (
            <div key={item.id} className="resource-card">
              <div className="resource-card-header">
                <div className="resource-icon">{item.icon}</div>
                <div className="resource-meta">
                  <span className="resource-type">{item.type}</span>
                  <span className="resource-size">{item.size}</span>
                </div>
              </div>
              <div className="resource-card-body">
                <h3>{item.name}</h3>
                <p className="resource-description">{item.description}</p>
                <div className="resource-category">
                  <span className="category-badge">{item.categoryName}</span>
                </div>
              </div>
              <div className="resource-card-footer">
                {isResourceDownloaded(item.id) ? (
                  <button className="downloaded-btn" disabled>
                    ✅ Downloaded
                  </button>
                ) : (
                  <button 
                    className="download-btn"
                    onClick={() => handleDownload(item)}
                  >
                    📥 Download
                  </button>
                )}
                <button className="preview-btn">
                  👁 Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>No Resources Found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Featured Resources */}
      {!searchTerm && selectedCategory === 'all' && (
        <div className="featured-section">
          <h2>🌟 Featured Resources</h2>
          <div className="featured-grid">
            <div className="featured-card">
              <div className="featured-icon">🚀</div>
              <h3>Getting Started with STEM</h3>
              <p>Essential resources for beginners in STEM fields</p>
              <button className="featured-btn">Explore</button>
            </div>
            <div className="featured-card">
              <div className="featured-icon">💡</div>
              <h3>Advanced Topics</h3>
              <p>Dive deeper into advanced STEM concepts</p>
              <button className="featured-btn">Explore</button>
            </div>
            <div className="featured-card">
              <div className="featured-icon">🎯</div>
              <h3>Career Paths</h3>
              <p>Explore different career opportunities in STEM</p>
              <button className="featured-btn">Explore</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;
