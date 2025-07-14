import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDataContext } from '../context/datacontext';
import '../styles/TeamProfile.css';
import axios from 'axios';
import { Users, Plus, ArrowLeft, Clock, Calendar, Tag } from 'lucide-react';

const TeamProfile = () => {
  const { id } = useParams();
  const { user } = useDataContext();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('problems');
  
  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/');
      return;
    }
    
    fetchTeam();
  }, [id, user, navigate]);
  
  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_SERVER_LINK}/api/teams/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setTeam(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching team:', err);
      setError(err.response?.data?.message || 'Error fetching team');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const getUserRole = () => {
    if (!team || !user) return null;
    
    const member = team.members.find(m => m.user._id === user._id);
    return member ? member.role : null;
  };
  
  if (loading) {
    return <div className="loading">Loading team profile...</div>;
  }
  
  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <Link to="/teams" className="back-link">
          <ArrowLeft size={16} /> Back to Teams
        </Link>
      </div>
    );
  }
  
  if (!team) {
    return (
      <div className="not-found-container">
        <div className="not-found-message">Team not found</div>
        <Link to="/teams" className="back-link">
          <ArrowLeft size={16} /> Back to Teams
        </Link>
      </div>
    );
  }
  
  const userRole = getUserRole();
  
  return (
    <div className="team-profile-container">
      <div className="team-profile-header">
        <Link to="/teams" className="back-link">
          <ArrowLeft size={16} /> Back to Teams
        </Link>
        <div className="team-info">
          <h1>{team.name}</h1>
          <p className="team-description">{team.description || 'No description'}</p>
          <div className="team-meta">
            <span className="team-privacy">{team.isPrivate ? 'Private' : 'Public'} Team</span>
            <span className="team-created">Created on {formatDate(team.createdAt)}</span>
            <span className="team-members"><Users size={14} /> {team.members.length} members</span>
          </div>
        </div>
      </div>
      
      <div className="team-content">
        <div className="team-sidebar">
          <div className="sidebar-section">
            <h3>Team Owner</h3>
            <div className="member-item owner">
              <div className="member-avatar">
                {team.owner.profile.avatar ? (
                  <img src={team.owner.profile.avatar} alt={team.owner.username} />
                ) : (
                  <div className="avatar-placeholder">
                    {team.owner.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="member-info">
                <span className="member-name">
                  {team.owner.profile.firstName} {team.owner.profile.lastName}
                </span>
                <span className="member-username">@{team.owner.username}</span>
              </div>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3>Team Members</h3>
            <div className="members-list">
              {team.members
                .filter(member => member.user._id !== team.owner._id)
                .map(member => (
                  <div key={member.user._id} className="member-item">
                    <div className="member-avatar">
                      {member.user.profile.avatar ? (
                        <img src={member.user.profile.avatar} alt={member.user.username} />
                      ) : (
                        <div className="avatar-placeholder">
                          {member.user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="member-info">
                      <span className="member-name">
                        {member.user.profile.firstName} {member.user.profile.lastName}
                      </span>
                      <span className="member-username">@{member.user.username}</span>
                      <span className="member-role">{member.role}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
        
        <div className="team-main-content">
          <div className="tabs">
            <button 
              className={`tab-btn ${activeTab === 'problems' ? 'active' : ''}`}
              onClick={() => setActiveTab('problems')}
            >
              Problems
            </button>
            <button 
              className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              Activity
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'problems' && (
              <div className="problems-tab">
                <div className="problems-header">
                  <h2>Team Problems</h2>
                  {userRole && (
                    <Link to={`/problem?addToTeam=${team._id}`} className="add-problem-btn">
                      <Plus size={16} /> Add Problem
                    </Link>
                  )}
                </div>
                
                {team.problems.length === 0 ? (
                  <div className="no-problems">
                    <p>No problems have been added to this team yet.</p>
                    {userRole && (
                      <p>Click the "Add Problem" button to add problems to this team.</p>
                    )}
                  </div>
                ) : (
                  <div className="problems-list">
                    {team.problems.map(({ problem, addedBy, addedAt, notes }) => (
                      <div key={problem._id} className="problem-card">
                        <div className="problem-info">
                          <Link to={`/problem/${problem.id}`} className="problem-title">
                            {problem.title}
                          </Link>
                          <div className="problem-meta">
                            <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>
                              {problem.difficulty}
                            </span>
                            <span className="added-by">
                              Added by @{addedBy.username}
                            </span>
                            <span className="added-at">
                              <Clock size={14} /> {formatDate(addedAt)}
                            </span>
                          </div>
                          {notes && <p className="problem-notes">{notes}</p>}
                          <div className="problem-tags">
                            {problem.tags.map(tag => (
                              <span key={tag} className="tag">
                                <Tag size={14} /> {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'activity' && (
              <div className="activity-tab">
                <h2>Team Activity</h2>
                <div className="activity-timeline">
                  {/* Team creation activity */}
                  <div className="activity-item">
                    <div className="activity-icon create-icon"></div>
                    <div className="activity-content">
                      <p className="activity-text">
                        <strong>{team.owner.username}</strong> created the team
                      </p>
                      <p className="activity-time">
                        <Calendar size={14} /> {formatDate(team.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Member join activities */}
                  {team.members
                    .filter(member => member.user._id !== team.owner._id)
                    .map(member => (
                      <div key={member.user._id} className="activity-item">
                        <div className="activity-icon join-icon"></div>
                        <div className="activity-content">
                          <p className="activity-text">
                            <strong>{member.user.username}</strong> joined the team
                          </p>
                          <p className="activity-time">
                            <Calendar size={14} /> {formatDate(member.joinedAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  
                  {/* Problem addition activities */}
                  {team.problems.map(({ problem, addedBy, addedAt }) => (
                    <div key={problem._id} className="activity-item">
                      <div className="activity-icon problem-icon"></div>
                      <div className="activity-content">
                        <p className="activity-text">
                          <strong>{addedBy.username}</strong> added problem <Link to={`/problem/${problem.id}`}>{problem.title}</Link>
                        </p>
                        <p className="activity-time">
                          <Calendar size={14} /> {formatDate(addedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamProfile;