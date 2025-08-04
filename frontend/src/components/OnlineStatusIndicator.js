import React from 'react';
import { useSocket } from '../context/SocketContext';

const OnlineStatusIndicator = ({ userId, lastActive }) => {
  const { isFriendOnline } = useSocket();
  const isOnline = isFriendOnline(userId);
  
  // Format last active time
  const formatLastActive = () => {
    if (!lastActive) return 'Unknown';
    
    const lastActiveDate = new Date(lastActive);
    const now = new Date();
    const diffMs = now - lastActiveDate;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    
    return lastActiveDate.toLocaleDateString();
  };

  return (
    <div className="online-status" title={isOnline ? 'Online' : `Last seen ${formatLastActive()}`}>
      <div 
        className={`status-dot ${isOnline ? 'online' : 'offline'}`} 
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: isOnline ? '#44b700' : '#bdbdbd',
          display: 'inline-block',
          marginRight: '5px'
        }}
      />
      <span>{isOnline ? 'Online' : `Last seen ${formatLastActive()}`}</span>
    </div>
  );
};

export default OnlineStatusIndicator;