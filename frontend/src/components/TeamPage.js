import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import TeamChat from './TeamChat';

const TeamPage = () => {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:3001/api/teams/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setTeam(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching team:', error);
        setError('Failed to load team details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [teamId]);

  if (loading) return <div>Loading team details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!team) return <div>Team not found</div>;

  return (
    <div className="team-page">
      <div className="team-header">
        <h1>{team.name}</h1>
        <p>{team.description}</p>
      </div>
      
      <div className="team-content">
        <div className="team-tabs">
          <button className="tab-button active">Chat</button>
          <button className="tab-button">Problems</button>
          <button className="tab-button">Members</button>
        </div>
        
        <div className="tab-content">
          <TeamChat teamId={teamId} />
        </div>
      </div>
    </div>
  );
};

export default TeamPage;