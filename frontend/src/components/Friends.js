import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataContext } from '../context/datacontext';
import '../styles/Friends.css';

const Friends = () => {
  const { user, friends, fetchFriends, addFriend, acceptFriendRequest } = useDataContext();
  const [friendCode, setFriendCode] = useState('');
  const [myFriendCode, setMyFriendCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingFriend, setAddingFriend] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    fetchFriends();
    fetchMyFriendCode();
  }, [user, navigate, fetchFriends]);

  const fetchMyFriendCode = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/friends/code', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setMyFriendCode(data.data.friendCode);
      }
    } catch (error) {
      console.error('Error fetching friend code:', error);
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    setAddingFriend(true);
    
    const success = await addFriend(friendCode);
    
    if (success) {
      setFriendCode('');
      alert('Friend request sent successfully!');
    } else {
      alert('Failed to add friend. Please check the friend code and try again.');
    }
    
    setAddingFriend(false);
  };

  const handleAcceptRequest = async (friendId) => {
    setLoading(true);
    const success = await acceptFriendRequest(friendId);
    if (success) {
      alert('Friend request accepted!');
    } else {
      alert('Failed to accept friend request.');
    }
    setLoading(false);
  };

  const copyFriendCode = () => {
    if (myFriendCode) {
      navigator.clipboard.writeText(myFriendCode);
      alert('Friend code copied to clipboard!');
    }
  };

  // Filter friends by status
  const pendingRequests = friends.filter(f => f.status === 'pending');
  const acceptedFriends = friends.filter(f => f.status === 'accepted');

  return (
    <div className="friends-container">
      <div className="friends-header">
        <h1>My Friends</h1>
        <div className="friend-code-section">
          <div className="my-friend-code">
            <p>Your Friend Code: <strong>{myFriendCode}</strong></p>
            <button className="copy-btn" onClick={copyFriendCode}>Copy</button>
          </div>
          <form onSubmit={handleAddFriend} className="add-friend-form">
            <input 
              type="text" 
              placeholder="Enter friend code"
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value)}
              required
            />
            <button 
              type="submit" 
              disabled={addingFriend}
            >
              {addingFriend ? 'Adding...' : 'Add Friend'}
            </button>
          </form>
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <div className="friend-requests">
          <h2>Friend Requests</h2>
          <div className="friends-list">
            {pendingRequests.map((friend) => (
              <div key={friend._id} className="friend-card pending">
                <div className="friend-avatar">
                  {friend.user.profile?.avatar ? (
                    <img src={friend.user.profile.avatar} alt={friend.user.username} />
                  ) : (
                    <div className="avatar-placeholder">
                      {friend.user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="friend-info">
                  <h3>{friend.user.profile?.firstName} {friend.user.profile?.lastName}</h3>
                  <p>@{friend.user.username}</p>
                </div>
                <div className="friend-actions">
                  <button 
                    className="accept-btn"
                    onClick={() => handleAcceptRequest(friend.user._id)}
                    disabled={loading}
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="friends-list-section">
        <h2>My Friends ({acceptedFriends.length})</h2>
        {acceptedFriends.length === 0 ? (
          <div className="no-friends">
            <p>You don't have any friends yet. Add friends using their friend code!</p>
          </div>
        ) : (
          <div className="friends-list">
            {acceptedFriends.map((friend) => (
              <div key={friend._id} className="friend-card">
                <div className="friend-avatar">
                  {friend.user.profile?.avatar ? (
                    <img src={friend.user.profile.avatar} alt={friend.user.username} />
                  ) : (
                    <div className="avatar-placeholder">
                      {friend.user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="friend-info">
                  <h3>{friend.user.profile?.firstName} {friend.user.profile?.lastName}</h3>
                  <p>@{friend.user.username}</p>
                </div>
                <div className="friend-actions">
                  <button 
                    className="view-profile-btn"
                    onClick={() => navigate(`/profile/${friend.user.username}`)}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;