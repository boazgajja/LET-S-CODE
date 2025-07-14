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
    return <div className="tp_loading">Loading team profile...</div>;
  }
  
  if (error) {
    return (
      <div className="tp_error-container">
        <div className="tp_error-message">{error}</div>
        <Link to="/teams" className="tp_back-link">
          <ArrowLeft size={16} /> Back to Teams
        </Link>
      </div>
    );
  }
  
  if (!team) {
    return (
      <div className="tp_not-found-container">
        <div className="tp_not-found-message">Team not found</div>
        <Link to="/teams" className="tp_back-link">
          <ArrowLeft size={16} /> Back to Teams
        </Link>
      </div>
    );
  }
  
  const userRole = getUserRole();
  
  return (
    <div className="tp_team-profile-container">
      <div className="tp_team-profile-header">
        <Link to="/teams" className="tp_back-link">
          <ArrowLeft size={16} /> Back to Teams
        </Link>
        <div className="tp_team-info">
          <h1 className="tp_team-name">{team.name}</h1>
          <p className="tp_team-description">{team.description || 'No description'}</p>
          <div className="tp_team-meta">
            <span className={`tp_team-privacy ${team.isPrivate ? 'tp_private' : 'tp_public'}`}>
              {team.isPrivate ? 'Private' : 'Public'} Team
            </span>
            <span className="tp_team-created">Created on {formatDate(team.createdAt)}</span>
            <span className="tp_team-members"><Users size={14} /> {team.members.length} members</span>
          </div>
        </div>
      </div>
      
      <div className="tp_team-content">
        <div className="tp_team-sidebar">
          <div className="tp_sidebar-section">
            <h3>Team Owner</h3>
            <div className="tp_member-item tp_owner">
              <div className="tp_member-avatar">
                {team.owner.profile.avatar ? (
                  <img src={team.owner.profile.avatar} alt={team.owner.username} />
                ) : (
                  <div className="tp_avatar-placeholder">
                    {team.owner.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="tp_member-info">
                <span className="tp_member-name">
                  {team.owner.profile.firstName} {team.owner.profile.lastName}
                </span>
                <span className="tp_member-username">@{team.owner.username}</span>
              </div>
            </div>
          </div>
          
          <div className="tp_sidebar-section">
            <h3>Team Members</h3>
            <div className="tp_members-list">
              {team.members
                .filter(member => member.user._id !== team.owner._id)
                .map(member => (
                  <div key={member.user._id} className="tp_member-item">
                    <div className="tp_member-avatar">
                      {member.user.profile.avatar ? (
                        <img src={member.user.profile.avatar} alt={member.user.username} />
                      ) : (
                        <div className="tp_avatar-placeholder">
                          {member.user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="tp_member-info">
                      <span className="tp_member-name">
                        {member.user.profile.firstName} {member.user.profile.lastName}
                      </span>
                      <span className="tp_member-username">@{member.user.username}</span>
                      <span className="tp_member-role">{member.role}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
        
        <div className="tp_team-main-content">
          <div className="tp_team-tabs">
            <button 
              className={`tp_tab ${activeTab === 'problems' ? 'tp_active' : ''}`}
              onClick={() => setActiveTab('problems')}
            >
              Problems
            </button>
            <button 
              className={`tp_tab ${activeTab === 'activity' ? 'tp_active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              Activity
            </button>
          </div>
          
          <div className="tp_tab-content">
            {activeTab === 'problems' && (
              <div className="tp_problems-tab">
                <div className="tp_problems-header">
                  <h2>Team Problems</h2>
                  {userRole && (
                    <Link to={`/problem?addToTeam=${team._id}`} className="tp_add-problem-btn">
                      <Plus size={16} /> Add Problem
                    </Link>
                  )}
                </div>
                
                {team.problems.length === 0 ? (
                  <div className="tp_no-problems">
                    <p>No problems have been added to this team yet.</p>
                    {userRole && (
                      <p>Click the "Add Problem" button to add problems to this team.</p>
                    )}
                  </div>
                ) : (
                  <div className="tp_problems-list">
                    {team.problems.map(({ problem, addedBy, addedAt, notes }) => (
                      <div key={problem._id} className="tp_problem-card">
                        <div className="tp_problem-info">
                          <Link to={`/problem/${problem.id}`} className="tp_problem-title">
                            {problem.title}
                          </Link>
                          <div className="tp_problem-meta">
                            <span className={`tp_difficulty tp_${problem.difficulty.toLowerCase()}`}>
                              {problem.difficulty}
                            </span>
                            <span className="tp_added-by">
                              Added by @{addedBy.username}
                            </span>
                            <span className="tp_added-at">
                              <Clock size={14} /> {formatDate(addedAt)}
                            </span>
                          </div>
                          {notes && <p className="tp_problem-notes">{notes}</p>}
                          <div className="tp_problem-tags">
                            {problem.tags.map(tag => (
                              <span key={tag} className="tp_tag">
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
              <div className="tp_activity-tab">
                <h2>Team Activity</h2>
                <div className="tp_activity-timeline">
                  {/* Team creation activity */}
                  <div className="tp_activity-item">
                    <div className="tp_activity-icon tp_create-icon"></div>
                    <div className="tp_activity-content">
                      <p className="tp_activity-text">
                        <strong>{team.owner.username}</strong> created the team
                      </p>
                      <p className="tp_activity-time">
                        <Calendar size={14} /> {formatDate(team.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Member join activities */}
                  {team.members
                    .filter(member => member.user._id !== team.owner._id)
                    .map(member => (
                      <div key={member.user._id} className="tp_activity-item">
                        <div className="tp_activity-icon tp_join-icon"></div>
                        <div className="tp_activity-content">
                          <p className="tp_activity-text">
                            <strong>{member.user.username}</strong> joined the team
                          </p>
                          <p className="tp_activity-time">
                            <Calendar size={14} /> {formatDate(member.joinedAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  
                  {/* Problem addition activities */}
                  {team.problems.map(({ problem, addedBy, addedAt }) => (
                    <div key={problem._id} className="tp_activity-item">
                      <div className="tp_activity-icon tp_problem-icon"></div>
                      <div className="tp_activity-content">
                        <p className="tp_activity-text">
                          <strong>{addedBy.username}</strong> added problem <Link to={`/problem/${problem.id}`}>{problem.title}</Link>
                        </p>
                        <p className="tp_activity-time">
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