import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataContext } from '../context/datacontext';
import '../styles/Teams.css';

const Teams = () => {
  const { user, teams, fetchTeams, createTeam, joinTeam, fetchWithTokenRefresh } = useDataContext();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', description: '', isPrivate: true });
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // console.log(teams);
    if (!user) {
      navigate('/');
      return;
    }
    
    // Fetch teams when component mounts to ensure we have the latest data
    fetchTeams();
  }, [user, navigate]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await createTeam(newTeam);
    
    if (result) {
      setNewTeam({ name: '', description: '', isPrivate: true });
      setShowCreateForm(false);
    }
    
    setLoading(false);
  };

  const handleViewTeam = (teamId) => {
    // Teams data is available for rendering
    navigate(`/teams/${teamId}`);
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await joinTeam(inviteCode);
    
    if (result) {
      setInviteCode('');
      setShowJoinForm(false);
      
      // Check if it's a pending request
      if (result.data && result.data.requestPending) {
        alert('Your join request has been sent to the team owner. You will be added to the team once approved.');
      } else {
        alert('You have successfully joined the team!');
      }
    }
    
    setLoading(false);
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    try {
      const response = await fetchWithTokenRefresh(`http://localhost:3001/api/teams/${teamId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert('Team deleted successfully!');
        fetchTeams();
      } else {
        alert(data.message || 'Failed to delete team');
      }
    } catch (err) {
      alert('Failed to delete team');
    }
  };

  return (
    <div className="ct_teams-container">
      <div className="ct_teams-header">
        <h1>My Teams</h1>
        <div className="team-actions">
          <button 
            className="ct_create-team-btn" 
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setShowJoinForm(false);
            }}
          >
            {showCreateForm ? 'Cancel' : 'Create Team'}
          </button>
          <button 
            className="ct_join-team-btn" 
            onClick={() => {
              setShowJoinForm(!showJoinForm);
              setShowCreateForm(false);
            }}
          >
            {showJoinForm ? 'Cancel' : 'Join Team'}
          </button>
        </div>
      </div>
      
      {/* Create Team Form */}
      {showCreateForm && (
        <form className="ct_create-team-form" onSubmit={handleCreateTeam}>
          <div className="ct_form-group">
            <label htmlFor="name">Team Name</label>
            <input
              type="text"
              id="name"
              value={newTeam.name}
              onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
              required
            />
          </div>
          
          <div className="ct_form-group">
            <label>Description</label>
            <textarea 
              value={newTeam.description}
              onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
            />
          </div>
          <div className="ct_form-group checkbox">
            <label>
              <input 
                type="checkbox" 
                checked={newTeam.isPrivate}
                onChange={(e) => setNewTeam({...newTeam, isPrivate: e.target.checked})}
              />
              Private Team
            </label>
          </div>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Team'}
          </button>
        </form>
      )}

      {/* Join Team Form */}
      {showJoinForm && (
        <form className="ct_join-team-form" onSubmit={handleJoinTeam}>
          <div className="ct_form-group">
            <label htmlFor="inviteCode">Invite Code</label>
            <input
              type="text"
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Team'}
          </button>
        </form>
      )}

      <div className="teams-list">
        {teams.length === 0 ? (
          <div className="no-teams">
            <p>You don't have any teams yet. Create one to get started!</p>
          </div>
        ) : (
          teams.map((team) =>
            team.team && team.team._id && team.team.name ? (
              <div key={team.team._id} className="team-card" onClick={() => handleViewTeam(team.team._id)}>
                <h3>{team.team.name}</h3>
                <p>{team.team.description || 'No description'}</p>
                <div className="team-meta">
                  <span>{team.team.members?.length || 0} members</span>
                  <span>{team.team.problems?.length || 0} problems</span>
                  <span className={team.team.isPrivate ? 'private' : 'public'}>
                    {team.team.isPrivate ? 'Private' : 'Public'}
                  </span>
                </div>
                {/* Delete button for owner */}
                {team.role === 'owner' && (
                  <button
                    className="delete-team-btn"
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteTeam(team.team._id);
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            ) : null
          )
        )}
      </div>
    </div>
  );
};

export default Teams;