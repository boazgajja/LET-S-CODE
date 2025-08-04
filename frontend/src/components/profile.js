import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/ProfilePage.css';
import { Code, Moon, Sun } from 'lucide-react';
import { useDataContext } from '../context/datacontext';
import { useTheme } from '../context/themeContext';
import NavBar from './Navbar.js';

const ProfilePage = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  
  const { user, updateUser, logout, workingProblems } = useDataContext();
  const navigate = useNavigate();
const { fetchWithTokenRefresh } = useDataContext();
const [recentSubmissions, setRecentSubmissions] = useState([]);

useEffect(() => {
  const fetchRecentSubmissions = async () => {
    if (!user) return;

    try {
      const response = await fetchWithTokenRefresh(
        `${process.env.REACT_APP_SERVER_LINK}/submissions/user/${user._id || user.userId}?page=1&limit=10`,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        setRecentSubmissions(data.data.submissions || []);
      }
    } catch (error) {
      console.error("Failed to fetch recent submissions:", error);
    }
  };

  fetchRecentSubmissions();
}, [user]);

  // Redirect if not logged in
  useEffect(() => {
    // User data is available in the component
    if (!user) {
      navigate('/');
      return;
    }
    
    // Initialize edit form with user data
    if (user) {
      setEditForm({
        ...user,
        profile: user.profile || {}
      });
    }
  }, [user, navigate]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // API call to update user would go here
    // For now, just update in context
    updateUser(editForm);
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCancel = () => {
    setEditForm({
      ...user,
      profile: user.profile || {}
    });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const calculateAcceptanceRate = () => {
    if (!user?.stats?.totalSubmissions) return 0;
    return Math.round((user.stats.acceptedSubmissions / user.stats.totalSubmissions) * 100);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'var(--easy)';
      case 'medium': return 'var(--medium)';
      case 'hard': return 'var(--hard)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return 'var(--success)';
      case 'wrong answer': return 'var(--danger)';
      case 'time limit exceeded': return 'var(--warning)';
      case 'runtime error': return 'var(--danger)';
      default: return 'var(--text-secondary)';
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const submittedTime = new Date(timestamp);
    const diffInHours = Math.floor((now - submittedTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (!user) return null;

  return (
    <>
      <NavBar />
      <div className="p_profile-wrapper">
        <div className="p_profile-container">
          {/* Header */}
          <div className="p_profile-header">
            <div className="p_header-logo">
              <div className="p_logo-container">
                <div className="p_logo-icon">
                  <Code size={24} />
                </div>
                <div className="p_logo-text">LetsCode</div>
              </div>
            </div>
            <div className="p_profile-header-content">
              <div className="p_profile-info">
                <div className="p_profile-avatar">
                  {user.profile?.avatar ? (
                    <img src={user.profile.avatar} alt="Profile" />
                  ) : (
                    <div className="p_avatar-placeholder">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="p_profile-details">
                  <h1 className="p_profile-name">
                    {user.profile?.firstName && user.profile?.lastName
                      ? `${user.profile.firstName} ${user.profile.lastName}`
                      : user.username}
                  </h1>
                  <p className="p_profile-username">@{user.username}</p>
                  <p className="p_profile-bio">{user.profile?.bio || 'No bio yet'}</p>
                </div>
              </div>
              <div className="p_profile-actions">
                <button 
                  className="p_theme-toggle" 
                  onClick={toggleTheme} 
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button className="p_logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="p_profile-tabs">
            <button 
              className={`p_tab-btn ${activeTab === 'overview' ? 'p_active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`p_tab-btn ${activeTab === 'submissions' ? 'p_active' : ''}`}
              onClick={() => setActiveTab('submissions')}
            >
              Submissions
            </button>
            <button 
              className={`p_tab-btn ${activeTab === 'settings' ? 'p_active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </div>

          {/* Tab Content */}
          <div className="p_tab-content">
            {activeTab === 'overview' && (
              <div className="p_overview-tab">
                {/* Stats */}
                <div className="p_profile-stats">
                  <div className="p_stat-card">
                    <h3>Problems Solved</h3>
                    <div className="p_stat-value">{user.stats?.problemsSolved || 0}</div>
                  </div>
                  <div className="p_stat-card">
                    <h3>Acceptance Rate</h3>
                    <div className="p_stat-value">{calculateAcceptanceRate()}%</div>
                  </div>
                  <div className="p_stat-card">
                    <h3>Total Submissions</h3>
                    <div className="p_stat-value">{user.stats?.totalSubmissions || 0}</div>
                  </div>
                </div>

                {/* Working Problems */}
                <div className="p_info-section">
                  <div className="p_section-header">
                    <h3>Working Problems</h3>
                    <div className="p_section-count">{workingProblems.length}</div>
                  </div>
                  {workingProblems.length > 0 ? (
                    <div className="p_working-problems-list">
                      {workingProblems.map((problem) => (
                        <Link to={`/problem/${problem._id}`} key={problem._id} className="p_working-problem-card">
                          <div className="p_problem-card-content">
                            <h4 className="p_problem-card-title">{problem.title}</h4>
                            <span 
                              className={`p_difficulty-badge p_${problem.difficulty?.toLowerCase()}`}
                              style={{ color: getDifficultyColor(problem.difficulty) }}
                            >
                              {problem.difficulty}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p_empty-state">
                      <p>You haven't started working on any problems yet.</p>
                      <Link to="/problem" className="p_btn p_btn-primary">Browse Problems</Link>
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="p_activity-section">
                  <div className="p_section-header">
                    <h3>Recent Activity</h3>
                  </div>
                  {user.recentActivity && user.recentActivity.length > 0 ? (
                    <div className="p_activity-list">
                      {user.recentActivity.map((activity, index) => (
                        <div key={index} className="p_activity-item">
                          <div className="p_activity-icon" style={{ backgroundColor: getStatusColor(activity.status) }}>
                            {activity.status === 'Accepted' ? '✓' : '×'}
                          </div>
                          <div className="p_activity-details">
                            <div className="p_activity-problem">
                              <Link to={`/problem/${activity.problemId}`}>{activity.problemTitle}</Link>
                              <span className="p_activity-time">{formatTimeAgo(activity.timestamp)}</span>
                            </div>
                            <div className="p_activity-status" style={{ color: getStatusColor(activity.status) }}>
                              {activity.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p_empty-state">
                      <p>No recent activity to show.</p>
                      <Link to="/problem" className="p_btn p_btn-primary">Solve Problems</Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* In the submissions tab section */}
            {activeTab === 'submissions' && (
              <div className="p_submissions-tab">
                <div className="p_submissions-header">
                  <h3>Your Recent Submissions</h3>
                  <Link to="/submissions" className="p_view-all-btn">View All Submissions</Link>
                </div>
                {user.submissions && user.submissions.length > 0 ? (
                  <div className="p_submissions-list">
                    {recentSubmissions.map((submission, index) => (console.log(submission),
                      <div key={index} className="p_submission-item">
                        <div className="p_submission-problem">
                          <Link to={`/problem/${submission.problemId}`}>{submission.problemTitle}</Link>
                        </div>
                        <div className="p_submission-details">
                          <span 
                            className="p_submission-status"
                            style={{ color: getStatusColor(submission.status) }}
                          >
                            {submission.status}
                          </span>
                          <span className="p_submission-language">{submission.language}</span>
                          <span className="p_submission-time">{formatTimeAgo(submission.createdAt)}</span>
                          <Link to={`/submissions/${submission.submissionId}`} className="p_view-submission-btn">
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                    {user.submissions.length > 10 && (
                      <div className="p_more-submissions">
                        <Link to="/submissions" className="p_more-link">View all {user.submissions.length} submissions</Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p_empty-state">
                    <p>You haven't made any submissions yet.</p>
                    <Link to="/problem" className="p_btn p_btn-primary">Solve Problems</Link>
                  </div>
                )}
              </div>
            )};

            {activeTab === 'settings' && (
              <div className="p_settings-tab">
                <div className="p_settings-header">
                  <h3>Profile Settings</h3>
                  {!isEditing ? (
                    <button className="p_edit-profile-btn" onClick={handleEdit}>
                      Edit Profile
                    </button>
                  ) : (
                    <div className="p_edit-actions">
                      <button className="p_btn p_btn-primary" onClick={handleSave}>Save Changes</button>
                      <button className="p_btn p_btn-secondary" onClick={handleCancel}>Cancel</button>
                    </div>
                  )}
                </div>
                
                <div className="p_settings-form">
                  <div className="p_form-section">
                    <h4>Account Information</h4>
                    <div className="p_form-group">
                      <label>Username</label>
                      <input 
                        type="text" 
                        value={editForm.username || ''} 
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="p_form-group">
                      <label>Email</label>
                      <input 
                        type="email" 
                        value={editForm.email || ''} 
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="p_form-section">
                    <h4>Profile Information</h4>
                    <div className="p_form-row">
                      <div className="p_form-group">
                        <label>First Name</label>
                        <input 
                          type="text" 
                          value={editForm.profile?.firstName || ''} 
                          onChange={(e) => handleInputChange('profile.firstName', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="p_form-group">
                        <label>Last Name</label>
                        <input 
                          type="text" 
                          value={editForm.profile?.lastName || ''} 
                          onChange={(e) => handleInputChange('profile.lastName', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    <div className="p_form-group">
                      <label>Bio</label>
                      <textarea 
                        value={editForm.profile?.bio || ''} 
                        onChange={(e) => handleInputChange('profile.bio', e.target.value)}
                        disabled={!isEditing}
                        rows="4"
                      ></textarea>
                    </div>
                    <div className="p_form-group">
                      <label>Country</label>
                      <input 
                        type="text" 
                        value={editForm.profile?.country || ''} 
                        onChange={(e) => handleInputChange('profile.country', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;