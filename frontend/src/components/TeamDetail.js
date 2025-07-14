import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDataContext } from '../context/datacontext';
import '../styles/TeamDetail.css';

const TeamDetail = () => {
  const { teamId } = useParams();
  const { user, addProblemToTeam } = useDataContext();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('problems');
  const [showAddProblemForm, setShowAddProblemForm] = useState(false);
  const [problemData, setProblemData] = useState({ problemId: '', notes: '' });
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

  const copyInviteCode = () => {
    if (team?.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode);
      alert('Invite code copied to clipboard!');
    }
  };

  if (loading) return <div className="loading">Loading team details...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!team) return <div className="not-found">Team not found</div>;

  return (
    <div className="team-detail-container">
      <div className="team-header">
        <h1>{team.name}</h1>
        <p className="team-description">{team.description}</p>
        <div className="team-meta">
          <span>{team.members?.length || 0} members</span>
          <span>{team.problems?.length || 0} problems</span>
          <span className={team.isPrivate ? 'private' : 'public'}>
            {team.isPrivate ? 'Private' : 'Public'}
          </span>
        </div>
        <div className="team-actions">
          <button className="invite-btn" onClick={copyInviteCode}>
            Copy Invite Code
          </button>
        </div>
      </div>

      <div className="team-tabs">
        <button 
          className={`tab-btn ${activeTab === 'problems' ? 'active' : ''}`}
          onClick={() => setActiveTab('problems')}
        >
          Problems
        </button>
        <button 
          className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Members
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'problems' && (
          <div className="problems-tab">
            <div className="tab-header">
              <h2>Team Problems</h2>
              <button 
                className="add-problem-btn"
                onClick={() => setShowAddProblemForm(!showAddProblemForm)}
              >
                {showAddProblemForm ? 'Cancel' : 'Add Problem'}
              </button>
            </div>

            {showAddProblemForm && (
              <div className="add-problem-form">
                <h3>Add Problem to Team</h3>
                <form onSubmit={handleAddProblem}>
                  <div className="form-group">
                    <label>Problem ID</label>
                    <input 
                      type="text" 
                      value={problemData.problemId}
                      onChange={(e) => setProblemData({...problemData, problemId: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <textarea 
                      value={problemData.notes}
                      onChange={(e) => setProblemData({...problemData, notes: e.target.value})}
                      placeholder="Add notes about this problem (optional)"
                    />
                  </div>
                  <button type="submit" className="submit-btn">
                    Add Problem
                  </button>
                </form>
              </div>
            )}

            <div className="problems-list">
              {team.problems?.length === 0 ? (
                <div className="no-problems">
                  <p>No problems added to this team yet.</p>
                </div>
              ) : (
                team.problems?.map((problem) => (
                  <div key={problem._id} className="problem-card">
                    <h3>{problem.problem.title}</h3>
                    <div className="problem-meta">
                      <span className={`difficulty ${problem.problem.difficulty.toLowerCase()}`}>
                        {problem.problem.difficulty}
                      </span>
                      <span>Added by: {problem.addedBy.username}</span>
                      <span>Added: {new Date(problem.addedAt).toLocaleDateString()}</span>
                    </div>
                    {problem.notes && (
                      <div className="problem-notes">
                        <p>{problem.notes}</p>
                      </div>
                    )}
                    <button 
                      className="solve-btn"
                      onClick={() => navigate(`/problem/${problem.problem.id}`)}
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
          <div className="members-tab">
            <h2>Team Members</h2>
            <div className="members-list">
              {team.members?.map((member) => (
                <div key={member._id} className="member-card">
                  <div className="member-avatar">
                    {member.user.profile?.avatar ? (
                      <img src={member.user.profile.avatar} alt={member.user.username} />
                    ) : (
                      <div className="avatar-placeholder">
                        {member.user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="member-info">
                    <h3>{member.user.profile?.firstName} {member.user.profile?.lastName}</h3>
                    <p>@{member.user.username}</p>
                    <span className={`role ${member.role}`}>{member.role}</span>
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