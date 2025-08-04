import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDataContext } from '../context/datacontext';
import '../styles/TeamDetail.css';

const TeamDetail = () => {
  const { id: teamId } = useParams();
  const { user } = useAuth();
  const { addProblemToTeam, getTeamJoinRequests, acceptJoinRequest, rejectJoinRequest, fetchWithTokenRefresh } = useDataContext();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('problems');
  const [showAddProblemForm, setShowAddProblemForm] = useState(false);
  const [problemData, setProblemData] = useState({ problemId: '', notes: '' });
  const [inviteCodeCopied, setInviteCodeCopied] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  
  // Chat related states
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  const navigate = useNavigate();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchTeamDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchWithTokenRefresh(`http://localhost:3001/api/teams/${teamId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch team details');
        }

        const data = await response.json();
        if (data.success) {
          setTeam(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch team details');
        }
      } catch (err) {
        console.error('Error fetching team details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamDetails();
  }, [teamId, user, navigate, fetchWithTokenRefresh]);

  // Fetch chat messages
  const fetchMessages = async () => {
    if (!team) return;
    
    setLoadingMessages(true);
    try {
      const response = await fetchWithTokenRefresh(`http://localhost:3001/api/teams/${teamId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const response = await fetchWithTokenRefresh(`http://localhost:3001/api/teams/${teamId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newMessage.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Add the new message to local state
          const messageWithSender = {
            ...data.data,
            sender: {
              _id: user._id || user.userId,
              username: user.username,
              profile: user.profile
            }
          };
          setMessages(prev => [...prev, messageWithSender]);
          setNewMessage('');
        }
      } else {
        alert('Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Fetch messages when switching to chat tab
  useEffect(() => {
    if (activeTab === 'chat' && team) {
      fetchMessages();
    }
  }, [activeTab, team]);

  const handleAddProblem = async (e) => {
    e.preventDefault();
    try {
      const result = await addProblemToTeam(teamId, problemData);
      if (result) {
        setTeam(result);
        setProblemData({ problemId: '', notes: '' });
        setShowAddProblemForm(false);
        alert('Problem added successfully!');
      }
    } catch (err) {
      console.error('Error adding problem:', err);
      alert('Failed to add problem. Please try again.');
    }
  };

  const handleCopyInviteCode = () => {
    if (team?.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode)
        .then(() => {
          setInviteCodeCopied(true);
          setTimeout(() => setInviteCodeCopied(false), 2000);
        })
        .catch(() => {
          alert('Failed to copy invite code');
        });
    }
  };

  const fetchJoinRequests = async () => {
    if (!team) return;
    
    // Check if user is owner or admin
    const userMember = team.members.find(member => 
      (member.user._id === user._id || member.user._id === user.userId) && 
      ['owner', 'admin'].includes(member.role)
    );
    
    if (!userMember) return;
    
    setLoadingRequests(true);
    try {
      const response = await fetchWithTokenRefresh(`http://localhost:3001/api/teams/${teamId}/requests`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setJoinRequests(data.data || []);
        } else {
          console.error('Failed to fetch team join requests:', data.message);
        }
      } else {
        console.error('Failed to fetch team join requests');
      }
    } catch (err) {
      console.error('Error fetching team join requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch join requests when switching to members tab
  useEffect(() => {
    if (activeTab === 'members' && team) {
      fetchJoinRequests();
    }
  }, [activeTab, team]);

  const handleAcceptRequest = async (userId) => {
    setLoadingRequests(true);
    try {
      const success = await acceptJoinRequest(teamId, userId);
      if (success) {
        // Refresh join requests and team data
        await fetchJoinRequests();
        
        // Refresh team details to show new member
        const response = await fetchWithTokenRefresh(`http://localhost:3001/api/teams/${teamId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setTeam(data.data);
          }
        }
        alert('Join request accepted!');
      } else {
        alert('Failed to accept join request.');
      }
    } catch (err) {
      console.error('Error accepting join request:', err);
      alert('Failed to accept join request.');
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRejectRequest = async (userId) => {
    setLoadingRequests(true);
    try {
      const success = await rejectJoinRequest(teamId, userId);
      if (success) {
        // Refresh join requests
        await fetchJoinRequests();
        alert('Join request rejected!');
      } else {
        alert('Failed to reject join request.');
      }
    } catch (err) {
      console.error('Error rejecting join request:', err);
      alert('Failed to reject join request.');
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSolveProblem = (problemId) => {
    if (problemId) {
      navigate(`/problem/${problemId}`);
    }
  };

  // Format message timestamp
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="td_loading">
        <div className="td_loading-spinner"></div>
        <p>Loading team details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="td_error">
        <h2>Error Loading Team</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/teams')} className="td_back-btn">
          Back to Teams
        </button>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="td_not-found">
        <h2>Team not found</h2>
        <p>The team you're looking for doesn't exist or you don't have access to it.</p>
        <button onClick={() => navigate('/teams')} className="td_back-btn">
          Back to Teams
        </button>
      </div>
    );
  }

  // Check if current user is owner or admin
  const isAdminOrOwner = team.members.some(member => 
    (member.user._id === user._id || member.user._id === user.userId) && 
    ['owner', 'admin'].includes(member.role)
  );

  // Check if current user is a member of the team
  const isMember = team.members.some(member => 
    member.user._id === user._id || member.user._id === user.userId
  );

  if (!isMember) {
    return (
      <div className="td_no-access">
        <h2>Access Denied</h2>
        <p>You are not a member of this team.</p>
        <button onClick={() => navigate('/teams')} className="td_back-btn">
          Back to Teams
        </button>
      </div>
    );
  }

  return (
    <div className="td_team-detail-container">
      <div className="td_team-header">
        <div className="td_header-top">
          <button onClick={() => navigate('/teams')} className="td_back-button">
            ← Back to Teams
          </button>
        </div>
        
        <h1>{team.name}</h1>
        <p className="td_team-description">{team.description || 'No description provided'}</p>
        
        <div className="td_team-meta">
          <span className={`td_team-type ${team.isPrivate ? 'td_private' : 'td_public'}`}>
            {team.isPrivate ? '🔒 Private' : '🌍 Public'} Team
          </span>
          <span className="td_meta-item">
            📅 Created: {new Date(team.createdAt).toLocaleDateString()}
          </span>
          <span className="td_meta-item">
            👥 Members: {team.members?.length || 0}
          </span>
          <span className="td_meta-item">
            📚 Problems: {team.problems?.length || 0}
          </span>
        </div>
        
        {isAdminOrOwner && (
          <div className="td_team-actions">
            <div className="td_invite-section">
              <span className="td_invite-label">Invite Code:</span>
              <code className="td_invite-code">{team.inviteCode}</code>
              <button className="td_invite-btn" onClick={handleCopyInviteCode}>
                {inviteCodeCopied ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="td_team-tabs">
        <button
          className={`td_tab-btn ${activeTab === 'problems' ? 'td_active' : ''}`}
          onClick={() => setActiveTab('problems')}
        >
          📚 Problems ({team.problems?.length || 0})
        </button>
        <button
          className={`td_tab-btn ${activeTab === 'members' ? 'td_active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          👥 Members ({team.members?.length || 0})
          {isAdminOrOwner && joinRequests.length > 0 && (
            <span className="td_request-badge">{joinRequests.length}</span>
          )}
        </button>
        <button
          className={`td_tab-btn ${activeTab === 'chat' ? 'td_active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 Chat
        </button>
      </div>

      <div className="td_tab-content">
        {activeTab === 'problems' && (
          <div className="td_problems-tab">
            <div className="td_tab-header">
              <h2>Team Problems</h2>
              {isAdminOrOwner && (
                <button
                  className="td_add-problem-btn"
                  onClick={() => setShowAddProblemForm(!showAddProblemForm)}
                >
                  {showAddProblemForm ? '❌ Cancel' : '➕ Add Problem'}
                </button>
              )}
            </div>

            {showAddProblemForm && isAdminOrOwner && (
              <div className="td_add-problem-form">
                <h3>Add Problem to Team</h3>
                <form onSubmit={handleAddProblem}>
                  <div className="td_form-group">
                    <label htmlFor="problemId">Problem ID *</label>
                    <input
                      id="problemId"
                      type="text"
                      value={problemData.problemId}
                      onChange={(e) => setProblemData({ ...problemData, problemId: e.target.value })}
                      placeholder="Enter the problem ID"
                      required
                    />
                  </div>
                  <div className="td_form-group">
                    <label htmlFor="notes">Notes</label>
                    <textarea
                      id="notes"
                      value={problemData.notes}
                      onChange={(e) => setProblemData({ ...problemData, notes: e.target.value })}
                      placeholder="Add notes about this problem (optional)"
                      rows="3"
                    />
                  </div>
                  <div className="td_form-actions">
                    <button type="submit" className="td_submit-btn">
                      ✅ Add Problem
                    </button>
                    <button 
                      type="button" 
                      className="td_cancel-btn"
                      onClick={() => setShowAddProblemForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="td_problems-list">
              {!team.problems || team.problems.length === 0 ? (
                <div className="td_no-problems">
                  <div className="td_empty-state">
                    <h3>📚 No Problems Yet</h3>
                    <p>No problems have been added to this team yet.</p>
                    {isAdminOrOwner && (
                      <button
                        className="td_add-first-problem-btn"
                        onClick={() => setShowAddProblemForm(true)}
                      >
                        Add First Problem
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="td_problems-grid">
                  {team.problems.map((problem) => (
                    <div key={problem._id} className="td_problem-card">
                      <div className="td_problem-header">
                        <h3>{problem.problem?.title || 'Problem Title'}</h3>
                        <span className={`td_difficulty td_${problem.problem?.difficulty?.toLowerCase() || 'unknown'}`}>
                          {problem.problem?.difficulty || 'Unknown'}
                        </span>
                      </div>
                      
                      <div className="td_problem-meta">
                        <div className="td_meta-row">
                          <span>👤 Added by: <strong>{problem.addedBy?.username || 'Unknown'}</strong></span>
                        </div>
                        <div className="td_meta-row">
                          <span>📅 Added: {new Date(problem.addedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {problem.notes && (
                        <div className="td_problem-notes">
                          <h4>📝 Notes:</h4>
                          <p>{problem.notes}</p>
                        </div>
                      )}
                      
                      <div className="td_problem-actions">
                        <button
                          className="td_solve-btn"
                          onClick={() => handleSolveProblem(problem.problem?._id || problem.problem?.id)}
                        >
                          🚀 Solve Problem
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="td_members-tab">
            <h2>Team Members</h2>
            
            {/* Show join requests section for owner/admin */}
            {isAdminOrOwner && (
              <div className="td_join-requests">
                <div className="td_requests-header">
                  <h3>
                    🔔 Join Requests 
                    {loadingRequests && <span className="td_loading-text">(Loading...)</span>}
                  </h3>
                </div>
                
                {joinRequests.length === 0 ? (
                  <div className="td_no-requests">
                    <p>No pending join requests</p>
                  </div>
                ) : (
                  <div className="td_requests-list">
                    {joinRequests.map(request => (
                      <div key={request.user._id} className="td_request-item">
                        <div className="td_request-user">
                          <div className="td_user-avatar">
                            {request.user.profile?.avatar ? (
                              <img src={request.user.profile.avatar} alt={request.user.username} />
                            ) : (
                              <div className="td_avatar-placeholder">
                                {request.user.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="td_user-info">
                            <h4>
                              {request.user.profile?.firstName} {request.user.profile?.lastName}
                            </h4>
                            <p>@{request.user.username}</p>
                            <p className="td_request-date">
                              📅 Requested: {new Date(request.requestedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="td_request-actions">
                          <button 
                            className="td_accept-btn"
                            onClick={() => handleAcceptRequest(request.user._id)}
                            disabled={loadingRequests}
                          >
                            ✅ Accept
                          </button>
                          <button 
                            className="td_reject-btn"
                            onClick={() => handleRejectRequest(request.user._id)}
                            disabled={loadingRequests}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="td_members-section">
              <h3>Current Members</h3>
              <div className="td_members-list">
                {team.members?.map((member) => (
                  <div key={member._id} className="td_member-card">
                    <div className="td_member-avatar">
                      {member.user.profile?.avatar ? (
                        <img src={member.user.profile.avatar} alt={member.user.username} />
                      ) : (
                        <div className="td_avatar-placeholder">
                          {member.user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="td_member-info">
                      <h4>
                        {member.user.profile?.firstName} {member.user.profile?.lastName}
                      </h4>
                      <p>@{member.user.username}</p>
                      <span className={`td_role td_${member.role}`}>
                        {member.role === 'owner' && '👑 '}
                        {member.role === 'admin' && '⭐ '}
                        {member.role === 'member' && '👤 '}
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                      <p className="td_join-date">
                        📅 Joined: {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="td_chat-tab">
            <div className="td_chat-container">
              <div className="td_chat-header">
                <h2>💬 Team Chat</h2>
                <span className="td_online-members">
                  {team.members?.length || 0} members
                </span>
              </div>
              
              <div className="td_chat-messages" ref={chatContainerRef}>
                {loadingMessages ? (
                  <div className="td_chat-loading">
                    <div className="td_loading-spinner"></div>
                    <p>Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="td_no-messages">
                    <div className="td_empty-chat">
                      <h3>💬 No messages yet</h3>
                      <p>Start the conversation with your team!</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const isCurrentUser = message.sender._id === (user._id || user.userId);
                      const showAvatar = index === 0 || messages[index - 1].sender._id !== message.sender._id;
                      
                      return (
                        <div 
                          key={index} 
                          className={`td_message ${isCurrentUser ? 'td_message-current-user' : 'td_message-other-user'}`}
                        >
                          {!isCurrentUser && showAvatar && (
                            <div className="td_message-avatar">
                              {message.sender.profile?.avatar ? (
                                <img src={message.sender.profile.avatar} alt={message.sender.username} />
                              ) : (
                                <div className="td_avatar-placeholder">
                                  {message.sender.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="td_message-content">
                            {!isCurrentUser && showAvatar && (
                              <div className="td_message-sender">
                                {message.sender.profile?.firstName} {message.sender.profile?.lastName}
                                <span className="td_message-username">@{message.sender.username}</span>
                              </div>
                            )}
                            
                            <div className="td_message-bubble">
                              <p>{message.content}</p>
                              <span className="td_message-time">
                                {formatMessageTime(message.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
              
              <form className="td_chat-input-form" onSubmit={handleSendMessage}>
                <div className="td_chat-input-container">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="td_chat-input"
                    disabled={sendingMessage}
                  />
                  <button 
                    type="submit" 
                    className="td_send-btn"
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    {sendingMessage ? '⏳' : '📤'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDetail;