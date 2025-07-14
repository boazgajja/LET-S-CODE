import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataContext } from '../context/datacontext';
import '../styles/Teams.css';

const Teams = () => {
  const { user, teams, fetchTeams, createTeam } = useDataContext();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', description: '', isPrivate: true });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
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
    navigate(`/teams/${teamId}`);
  };

  return (
    <div className="ct_teams-container">
      <div className="ct_teams-header">
        <h1>My Teams</h1>
        <button 
          className="ct_create-team-btn" 
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create Team'}
        </button>
      </div>
      
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
          
          {/* Update all other form-group classes to ct_form-group */}
          <div className="form-group">
            <label>Description</label>
            <textarea 
              value={newTeam.description}
              onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
            />
          </div>
          <div className="form-group checkbox">
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

      <div className="teams-list">
        {teams.length === 0 ? (
          <div className="no-teams">
            <p>You don't have any teams yet. Create one to get started!</p>
          </div>
        ) : (
          teams.map((team) => (
            <div key={team._id} className="team-card" onClick={() => handleViewTeam(team._id)}>
              <h3>{team.name}</h3>
              <p>{team.description || 'No description'}</p>
              <div className="team-meta">
                <span>{team.members?.length || 0} members</span>
                <span>{team.problems?.length || 0} problems</span>
                <span className={team.isPrivate ? 'private' : 'public'}>
                  {team.isPrivate ? 'Private' : 'Public'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Teams;