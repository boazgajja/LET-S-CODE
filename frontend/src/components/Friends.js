import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataContext } from '../context/datacontext';
import { useSocket } from '../context/SocketContext'; // Add this import
import '../styles/Friends.css';

const Friends = () => {
  const { user, friends, fetchFriends, addFriend, acceptFriendRequest, rejectFriendRequest, removeFriend } = useDataContext();
  const { isFriendOnline } = useSocket(); // Add this to use socket context
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
  }, []);

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

  const handleRejectRequest = async (friendId) => {
    setLoading(true);
    const success = await rejectFriendRequest(friendId);
    if (success) {
      alert('Friend request rejected!');
    } else {
      alert('Failed to reject friend request.');
    }
    setLoading(false);
  };

  const handleRemoveFriend = async (friendId, friendName) => {
    if (window.confirm(`Are you sure you want to remove ${friendName} from your friends?`)) {
      setLoading(true);
      const success = await removeFriend(friendId);
      if (success) {
        alert('Friend removed successfully!');
      } else {
        alert('Failed to remove friend.');
      }
      setLoading(false);
    }
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
    <div className="f_friends-container">
      <div className="f_friends-header">
        <h1>My Friends</h1>
        <div className="f_friend-code-section">
          <div className="f_my-friend-code">
            <p>Your Friend Code: <strong>{myFriendCode}</strong></p>
            <button className="f_copy-btn" onClick={copyFriendCode}>Copy</button>
          </div>
          <form onSubmit={handleAddFriend} className="f_add-friend-form">
            <input 
              type="text" 
              placeholder="Enter friend code"
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value)}
              required
              className="f_friend-input"
            />
            <button 
              type="submit" 
              disabled={addingFriend}
              className="f_add-btn"
            >
              {addingFriend ? 'Adding...' : 'Add Friend'}
            </button>
          </form>
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <div className="f_friend-requests">
          <h2>Friend Requests</h2>
          <div className="f_friends-list">
            {pendingRequests.map((friend) => (
              <div key={friend._id} className="f_friend-card f_pending">
                <div className="f_friend-avatar">
                  {friend.user.profile?.avatar ? (
                    <img src={friend.user.profile.avatar} alt={friend.user.username} />
                  ) : (
                    <div className="f_avatar-placeholder">
                      {friend.user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="f_friend-info">
                  <h3>{friend.user.profile?.firstName} {friend.user.profile?.lastName}</h3>
                  <p>@{friend.user.username}</p>
                </div>
                <div className="f_friend-actions">
                  <button 
                    className="f_accept-btn"
                    onClick={() => handleAcceptRequest(friend.user._id)}
                    disabled={loading}
                  >
                    Accept
                  </button>
                  <button 
                    className="f_reject-btn"
                    onClick={() => handleRejectRequest(friend.user._id)}
                    disabled={loading}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="f_friends-list-section">
        <h2>My Friends ({acceptedFriends.length})</h2>
        {acceptedFriends.length === 0 ? (
          <div className="f_no-friends">
            <p>You don't have any friends yet. Add friends using their friend code!</p>
          </div>
        ) : (
          <div className="f_friends-list">
            {acceptedFriends.map((friend) => (
              <div key={friend._id} className="f_friend-card">
                <div className="f_friend-avatar">
                  {friend.user.profile?.avatar ? (
                    <img src={friend.user.profile.avatar} alt={friend.user.username} />
                  ) : (
                    <div className="f_avatar-placeholder">
                      {friend.user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Add online status indicator */}
                  <div className={`f_online-status ${isFriendOnline(friend.user._id) ? 'f_online' : 'f_offline'}`}></div>
                </div>
                <div className="f_friend-info">
                  <h3>{friend.user.profile?.firstName} {friend.user.profile?.lastName}</h3>
                  <p>@{friend.user.username}</p>
                  {/* Add online status text */}
                  <p className={`f_status-text ${isFriendOnline(friend.user._id) ? 'f_online-text' : 'f_offline-text'}`}>
                    {isFriendOnline(friend.user._id) ? 'Online' : 'Offline'}
                  </p>
                </div>
                <div className="f_friend-actions">
                  <button 
                    className="f_view-profile-btn"
                    onClick={() => navigate(`/profile/${friend.user.username}`)}
                  >
                    View Profile
                  </button>
                  <button 
                    className="f_remove-btn"
                    onClick={() => handleRemoveFriend(friend.user._id, friend.user.username)}
                    disabled={loading}
                  >
                    Remove
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
