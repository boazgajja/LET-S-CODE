import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext'; // Now this import will work

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineFriends, setOnlineFriends] = useState(new Set());
  const { token, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Connect to socket server
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // Authenticate with token
    newSocket.emit('authenticate', token);

    // Listen for friend status changes
    newSocket.on('friend_status_change', ({ userId, isOnline }) => {
      setOnlineFriends(prev => {
        const updated = new Set(prev);
        if (isOnline) {
          updated.add(userId);
        } else {
          updated.delete(userId);
        }
        return updated;
      });
    });

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, token]);

  // Function to check if a friend is online
  const isFriendOnline = (friendId) => {
    return onlineFriends.has(friendId);
  };

  // Function to send a message to a team
  const sendTeamMessage = (teamId, message) => {
    if (socket && isAuthenticated) {
      socket.emit('team_message', {
        teamId,
        message,
        userId: user?._id || localStorage.getItem('userId') // Use user from context if available
      });
    }
  };

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isFriendOnline, 
      onlineFriends,
      sendTeamMessage 
    }}>
      {children}
    </SocketContext.Provider>
  );
};