import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDataContext } from '../context/datacontext';
import '../styles/TeamDetail.css';
import axios from 'axios';

const TeamDetail = () => {
  const { teamId } = useParams();
  const { user, addProblemToTeam, getTeamJoinRequests, acceptJoinRequest, rejectJoinRequest } = useDataContext();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('problems');
  const [showAddProblemForm, setShowAddProblemForm] = useState(false);
  const [problemData, setProblemData] = useState({ problemId: '', notes: '' });
  const [inviteCodeCopied, setInviteCodeCopied] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchTeamDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3001/api/teams/${teamId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        console.log(teamId);
        console.log(response);

        if (!response.ok) {
          throw new Error('Failed to fetch team details');
        }

        const data = await response.json();
        setTeam(data.data);
      } catch (error) {
        console.error('Error fetching team details:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamDetails();
  }, [teamId, user, navigate]);

  const handleAddProblem = async (e) => {
    e.preventDefault();
    try {
      const result = await addProblemToTeam(teamId, problemData);
      if (result) {
        setTeam(result);
        setProblemData({ problemId: '', notes: '' });
        setShowAddProblemForm(false);
      }
    } catch (error) {
      console.error('Error adding problem:', error);
    }
  };

  const handleCopyInviteCode = () => {
    if (team?.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode);
      setInviteCodeCopied(true);
      setTimeout(() => setInviteCodeCopied(false), 2000);
    }
  };

  // Replace the fetchJoinRequests function with this
  const fetchJoinRequests = async () => {
    if (!team) return;
    
    // Check if user is owner or admin
    const userMember = team.members.find(member => 
      member.user._id === user._id && ['owner', 'admin'].includes(member.role)
    );
    
    if (!userMember) return;
    
    setLoadingRequests(true);
    try {
      const response = await fetch(`http://localhost:3001/api/teams/${teamId}/requests`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      if (response.ok) {
        setJoinRequests(data.data);
      } else {
        console.error('Failed to fetch team join requests:', data.message);
      }
    } catch (error) {
      console.error('Error fetching team join requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Call this when the active tab changes to members
  useEffect(() => {
    if (activeTab === 'members') {
      fetchJoinRequests();
    }
  }, [activeTab, team]);

  const handleAcceptRequest = async (userId) => {
    setLoadingRequests(true);
    const success = await acceptJoinRequest(teamId, userId);
    if (success) {
      // Refresh join requests and team data
      fetchJoinRequests();
      // Refresh team details to show new member
      const response = await fetch(`http://localhost:3001/api/teams/${teamId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTeam(data.data);
      }
      alert('Join request accepted!');
    } else {
      alert('Failed to accept join request.');
    }
    setLoadingRequests(false);
  };

  const handleRejectRequest = async (userId) => {
    setLoadingRequests(true);
    const success = await rejectJoinRequest(teamId, userId);
    if (success) {
      // Refresh join requests
      fetchJoinRequests();
      alert('Join request rejected!');
    } else {
      alert('Failed to reject join request.');
    }
    setLoadingRequests(false);
  };

  if (loading) {
    return <div className="td_loading">Loading team details...</div>;
  }

  if (error) {
    return <div className="td_error">{error}</div>;
  }

  if (!team) {
    return <div className="td_not-found">Team not found</div>;
  }

  // Check if current user is owner or admin
  const isOwnerOrAdmin = team.members.some(member => 
    member.user._id === user._id && ['owner', 'admin'].includes(member.role)
  );

  return (
    <div className="td_team-detail-container">
      <div className="td_team-header">
        <h1>{team.name}</h1>
        <p className="td_team-description">{team.description || 'No description'}</p>
        <div className="td_team-meta">
          <span className={team.isPrivate ? 'td_private' : 'td_public'}>
            {team.isPrivate ? 'Private' : 'Public'} Team
          </span>
          <span>Created: {new Date(team.createdAt).toLocaleDateString()}</span>
          <span>Members: {team.members?.length || 0}</span>
        </div>
        <div className="td_team-actions">
          <button className="td_invite-btn" onClick={handleCopyInviteCode}>
            {inviteCodeCopied ? 'Copied!' : 'Copy Invite Code'}
          </button>
        </div>
      </div>

      <div className="td_team-tabs">
        <button
          className={`td_tab-btn ${activeTab === 'problems' ? 'td_active' : ''}`}
          onClick={() => setActiveTab('problems')}
        >
          Problems
        </button>
        <button
          className={`td_tab-btn ${activeTab === 'members' ? 'td_active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Members
          {isOwnerOrAdmin && joinRequests.length > 0 && (
            <span className="request-badge">{joinRequests.length}</span>
          )}
        </button>
      </div>

      <div className="td_tab-content">
        {activeTab === 'problems' && (
          <div className="td_problems-tab">
            <div className="td_tab-header">
              <h2>Team Problems</h2>
              <button
                className="td_add-problem-btn"
                onClick={() => setShowAddProblemForm(!showAddProblemForm)}
              >
                {showAddProblemForm ? 'Cancel' : 'Add Problem'}
              </button>
            </div>

            {showAddProblemForm && (
              <div className="td_add-problem-form">
                <h3>Add Problem to Team</h3>
                <form onSubmit={handleAddProblem}>
                  <div className="td_form-group">
                    <label>Problem ID</label>
                    <input
                      type="text"
                      value={problemData.problemId}
                      onChange={(e) => setProblemData({ ...problemData, problemId: e.target.value })}
                      required
                    />
                  </div>
                  <div className="td_form-group">
                    <label>Notes</label>
                    <textarea
                      value={problemData.notes}
                      onChange={(e) => setProblemData({ ...problemData, notes: e.target.value })}
                      placeholder="Add notes about this problem (optional)"
                    />
                  </div>
                  <button type="submit" className="td_submit-btn">
                    Add Problem
                  </button>
                </form>
              </div>
            )}

            <div className="td_problems-list">
              {team.problems?.length === 0 ? (
                <div className="td_no-problems">
                  <p>No problems added to this team yet.</p>
                </div>
              ) : (
                team.problems?.map((problem) => (
                  <div key={problem._id} className="td_problem-card">
                    <h3>{problem.problem.title}</h3>
                    <div className="td_problem-meta">
                      <span className={`td_difficulty td_${problem.problem.difficulty?.toLowerCase()}`}>
                        {problem.problem.difficulty}
                      </span>
                      <span>Added by: {problem.addedBy.username}</span>
                      <span>Added: {new Date(problem.addedAt).toLocaleDateString()}</span>
                    </div>
                    {problem.notes && (
                      <div className="td_problem-notes">
                        <p>{problem.notes}</p>
                      </div>
                    )}
                    <button
                      className="td_solve-btn"
                      onClick={() =>{
                        console.log(problem);
                        navigate(`/problem/${problem.problem.id}`);
                      }}
                    >
                      Solve Problem
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="td_members-tab">
            <h2>Team Members</h2>
            
            {/* Show join requests section for owner/admin */}
            {isOwnerOrAdmin && (
              <div className="td_join-requests">
                <h3>Join Requests {loadingRequests && <span>(Loading...)</span>}</h3>
                {joinRequests.length === 0 ? (
                  <p>No pending join requests</p>
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
                              Requested: {new Date(request.requestedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="td_request-actions">
                          <button 
                            className="td_accept-btn"
                            onClick={() => handleAcceptRequest(request.user._id)}
                            disabled={loadingRequests}
                          >
                            Accept
                          </button>
                          <button 
                            className="td_reject-btn"
                            onClick={() => handleRejectRequest(request.user._id)}
                            disabled={loadingRequests}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
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
                    <h3>
                      {member.user.profile?.firstName} {member.user.profile?.lastName}
                    </h3>
                    <p>@{member.user.username}</p>
                    <span className={`td_role td_${member.role}`}>{member.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDetail;
