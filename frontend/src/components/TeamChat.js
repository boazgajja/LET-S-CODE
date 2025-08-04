import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import OnlineStatusIndicator from './OnlineStatusIndicator';

const TeamChat = ({ teamId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const { socket, sendTeamMessage } = useSocket();
  const messagesEndRef = useRef(null);

  // Fetch team messages and members
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch team details including members
        const teamResponse = await axios.get(`${process.env.REACT_APP_SERVER_LINK}/teams/${teamId}`, { headers });
        if (teamResponse.data.success) {
          setTeamMembers(teamResponse.data.data.members);
        }
        
        // Fetch team messages
        const messagesResponse = await axios.get(`${process.env.REACT_APP_SERVER_LINK}/teams/${teamId}/messages`, { headers });
        if (messagesResponse.data.success) {
          setMessages(messagesResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  // Listen for new team messages
  useEffect(() => {
    if (!socket) return;

    socket.on('team_message', (data) => {
      if (data.teamId === teamId) {
        setMessages(prev => [...prev, data.message]);
      }
    });

    return () => {
      socket.off('team_message');
    };
  }, [socket, teamId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Send message via socket
    sendTeamMessage(teamId, newMessage);
    
    // Also send via API for persistence
    const sendViaApi = async () => {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${process.env.REACT_APP_SERVER_LINK}/teams/${teamId}/messages`, {
          content: newMessage
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Error sending message via API:', error);
      }
    };
    sendViaApi();

    setNewMessage('');
  };

  if (loading) return <div>Loading team chat...</div>;

  return (
    <div className="team-chat-container">
      <div className="team-members-sidebar">
        <h3>Team Members</h3>
        <ul className="team-members-list">
          {teamMembers.map(member => (
            <li key={member.user._id} className="team-member-item">
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
                  {member.user.profile.firstName || member.user.username}
                </span>
                <span className="member-role">{member.role}</span>
                <OnlineStatusIndicator 
                  userId={member.user._id} 
                  lastActive={member.user.lastActive} 
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="chat-main">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="no-messages">No messages yet. Start the conversation!</div>
          ) : (
            messages.map((message, index) => {
              const isCurrentUser = message.sender._id === localStorage.getItem('userId');
              return (
                <div 
                  key={index} 
                  className={`message ${isCurrentUser ? 'sent' : 'received'}`}
                >
                  {!isCurrentUser && (
                    <div className="message-sender">
                      {message.sender.profile.firstName || message.sender.username}
                    </div>
                  )}
                  <div className="message-content">{message.content}</div>
                  <div className="message-timestamp">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="message-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="message-input"
          />
          <button type="submit" className="send-button">Send</button>
        </form>
      </div>
    </div>
  );
};

export default TeamChat;