import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OnlineStatusIndicator from './OnlineStatusIndicator';
import { useSocket } from '../context/SocketContext';

const FriendsList = () => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isFriendOnline } = useSocket();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('${process.env.REACT_APP_SERVER_LINK}/friends', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setFriends(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  // Sort friends: online first, then by name
  const sortedFriends = [...friends].sort((a, b) => {
    const aOnline = isFriendOnline(a.user._id);
    const bOnline = isFriendOnline(b.user._id);
    
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    
    return a.user.username.localeCompare(b.user.username);
  });

  if (loading) return <div>Loading friends...</div>;

  return (
    <div className="friends-list">
      <h2>Friends</h2>
      {sortedFriends.length === 0 ? (
        <p>No friends yet. Add some friends to get started!</p>
      ) : (
        <ul>
          {sortedFriends.map(friend => (
            <li key={friend.user._id} className="friend-item">
              <div className="friend-avatar">
                {friend.user.profile.avatar ? (
                  <img src={friend.user.profile.avatar} alt={friend.user.username} />
                ) : (
                  <div className="avatar-placeholder">
                    {friend.user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="friend-info">
                <h3>{friend.user.profile.firstName || friend.user.username}</h3>
                <OnlineStatusIndicator 
                  userId={friend.user._id} 
                  lastActive={friend.user.lastActive} 
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FriendsList;