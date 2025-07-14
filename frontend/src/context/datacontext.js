// src/context/DataContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [dataMap, setDataMap] = useState({});
  const [user, setUser] = useState(null);
  const [workingProblems, setWorkingProblems] = useState([]);
  const [teams, setTeams] = useState([]);
  const [friends, setFriends] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  // Enhanced token refresh utility function
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('🔄 Attempting token refresh...');
      
      const response = await fetch('http://localhost:3001/api/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update tokens in localStorage
        localStorage.setItem('token', data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        
        console.log('✅ Token refreshed successfully');
        return data.data.tokens.accessToken;
      } else {
        console.error('❌ Token refresh failed:', data.message);
        
        // Clear tokens and logout user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        
        // Redirect to login
        window.location.href = '/login';
        
        throw new Error(data.message || 'Token refresh failed');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      
      // Clear tokens and logout user
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      
      // Redirect to login
      window.location.href = '/login';
      throw error;
    }
  };

  // Enhanced fetch wrapper with automatic token refresh and detailed error handling
  const fetchWithTokenRefresh = async (url, options = {}) => {
    const makeRequest = async (token) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
        },
      });
    };

    try {
      // First attempt with current token
      let token = localStorage.getItem('token');
      let response = await makeRequest(token);

      // If token related error (401), try to refresh
      if (response.status === 401) {
        try {
          const errorData = await response.json();
          console.log('🔑 Token error detected:', errorData.message, 'Code:', errorData.code);
          
          // Only attempt refresh for specific token errors
          if (errorData.code === 'TOKEN_EXPIRED' || errorData.code === 'INVALID_TOKEN') {
            console.log('🔄 Attempting token refresh due to:', errorData.code);
            
            // Refresh the token
            token = await refreshAccessToken();
            
            // Retry the original request with new token
            response = await makeRequest(token);
            
            console.log('✅ Request retried successfully with new token');
          } else {
            // For other auth errors, don't attempt refresh
            console.error('❌ Authentication error that cannot be refreshed:', errorData.message);
            throw new Error(errorData.message);
          }
        } catch (parseError) {
          // If we can't parse the error response, still try to refresh
          console.log('🔄 Could not parse error response, attempting refresh anyway');
          try {
            token = await refreshAccessToken();
            response = await makeRequest(token);
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            throw refreshError;
          }
        }
      }

      return response;
    } catch (error) {
      console.error('❌ Request failed:', error);
      throw error;
    }
  };

  // Load user from localStorage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Load working problems if they exist
    const storedWorkingProblems = localStorage.getItem('workingProblems');
    if (storedWorkingProblems) {
      setWorkingProblems(JSON.parse(storedWorkingProblems));
    }
    
    // Load submissions if they exist
    const storedSubmissions = localStorage.getItem('submissions');
    if (storedSubmissions) {
      setSubmissions(JSON.parse(storedSubmissions));
    }
  }, []);

  const addOrUpdateKey = (key, value) => {
    setDataMap(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const keyExists = (key) => {
    return key in dataMap;
  };

  const getValue = (key) => {
    return dataMap[key];
  };

  // Add a problem to working problems
  const addWorkingProblem = (problem) => {
    const exists = workingProblems.some(p => p._id === problem._id);
    if (!exists) {
      const updatedProblems = [...workingProblems, problem];
      setWorkingProblems(updatedProblems);
      localStorage.setItem('workingProblems', JSON.stringify(updatedProblems));
    }
  };

  // Remove a problem from working problems
  const removeWorkingProblem = (problemId) => {
    const updatedProblems = workingProblems.filter(p => p._id !== problemId);
    setWorkingProblems(updatedProblems);
    localStorage.setItem('workingProblems', JSON.stringify(updatedProblems));
  };

  // Update user data
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Enhanced logout function
  const logout = () => {
    console.log('🚪 Logging out user...');
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('workingProblems');
    localStorage.removeItem('submissions');
    setWorkingProblems([]);
    setTeams([]);
    setFriends([]);
    setSubmissions([]);
  };

  // Team functions with enhanced error handling
  const fetchTeams = async () => {
    try {
      console.log('📥 Fetching teams...');
      const response = await fetchWithTokenRefresh('http://localhost:3001/api/teams', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setTeams(data.data);
        console.log('✅ Teams fetched successfully');
      } else {
        console.error('❌ Failed to fetch teams:', data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching teams:', error);
    }
  };

  const createTeam = async (teamData) => {
    try {
      console.log('📝 Creating team...',teamData);
      const response = await fetchWithTokenRefresh('http://localhost:3001/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });
      
      const data = await response.json();
      if (response.ok) {
        setTeams([...teams, data.data]);
        console.log('✅ Team created successfully');
        return data.data;
      } else {
        console.error('❌ Failed to create team:', data.message);
        return null;
      }
    } catch (error) {
      console.error('❌ Error creating team:', error);
      return null;
    }
  };

  const addProblemToTeam = async (teamId, problemData) => {
    try {
      console.log('📝 Adding problem to team...');
      const response = await fetchWithTokenRefresh(`http://localhost:3001/api/teams/${teamId}/problems`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(problemData),
      });
      
      const data = await response.json();
      if (response.ok) {
        setTeams(teams.map(team => 
          team._id === teamId ? data.data : team
        ));
        console.log('✅ Problem added to team successfully');
        return data.data;
      } else {
        console.error('❌ Failed to add problem to team:', data.message);
        return null;
      }
    } catch (error) {
      console.error('❌ Error adding problem to team:', error);
      return null;
    }
  };

  const joinTeam = async (inviteCode) => {
    try {
      console.log('🔗 Joining team with invite code...');
      const response = await fetchWithTokenRefresh('http://localhost:3001/api/teams/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode }),
      });
      
      const data = await response.json();
      if (response.ok) {
        // Fetch all teams to ensure we have the latest data
        fetchTeams();
        console.log('✅ Joined team successfully');
        return true;
      } else {
        console.error('❌ Failed to join team:', data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error joining team:', error);
      return false;
    }
  };

  // Friend functions with enhanced error handling
  const fetchFriends = async () => {
    try {
      console.log('📥 Fetching friends...');
      const response = await fetchWithTokenRefresh('http://localhost:3001/api/friends', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setFriends(data.data);
        console.log('✅ Friends fetched successfully');
      } else {
        console.error('❌ Failed to fetch friends:', data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching friends:', error);
    }
  };

  const addFriend = async (friendCode) => {
    try {
      console.log('👥 Adding friend...');
      const response = await fetchWithTokenRefresh('http://localhost:3001/api/friends/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendCode }),
      });
      
      const data = await response.json();
      if (response.ok) {
        fetchFriends(); // Refresh friends list
        console.log('✅ Friend added successfully');
        return true;
      } else {
        console.error('❌ Failed to add friend:', data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error adding friend:', error);
      return false;
    }
  };

  const acceptFriendRequest = async (friendId) => {
    try {
      console.log('✅ Accepting friend request...');
      const response = await fetchWithTokenRefresh(`http://localhost:3001/api/friends/${friendId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      if (response.ok) {
        fetchFriends(); // Refresh friends list
        console.log('✅ Friend request accepted successfully');
        return true;
      } else {
        console.error('❌ Failed to accept friend request:', data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error accepting friend request:', error);
      return false;
    }
  };

  // Add a new submission
  const addSubmission = (submission) => {
    const updatedSubmissions = [submission, ...submissions];
    setSubmissions(updatedSubmissions);
    localStorage.setItem('submissions', JSON.stringify(updatedSubmissions));
  };

  // Fetch user submissions with enhanced error handling
  const fetchUserSubmissions = async () => {
    if (!user) return [];
    
    try {
      console.log('📥 Fetching user submissions...');
      const response = await fetchWithTokenRefresh(`${process.env.REACT_APP_SERVER_LINK}/api/submissions/user/${user._id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmissions(data.data);
        localStorage.setItem('submissions', JSON.stringify(data.data));
        console.log('✅ User submissions fetched successfully');
        return data.data;
      } else {
        console.error('❌ Failed to fetch user submissions:', data.message);
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching user submissions:', error);
      return [];
    }
  };

  // Load teams and friends on initial render if user is logged in
useEffect(() => {
    const fetchAllUserData = () => {
      if (user) {
        console.log('👤 User logged in, fetching user data...');
        fetchTeams();
        fetchFriends();
        fetchUserSubmissions();
      }
    };

    fetchAllUserData();
  }, []);
  return (
    <DataContext.Provider 
      value={{ 
        dataMap, 
        addOrUpdateKey, 
        keyExists, 
        getValue,
        user,
        updateUser,
        logout,
        workingProblems,
        addWorkingProblem,
        removeWorkingProblem,
        teams,
        fetchTeams,
        createTeam,
        joinTeam,  // Add this line
        addProblemToTeam,
        friends,
        fetchFriends,
        addFriend,
        acceptFriendRequest,
        submissions,
        addSubmission
        // fetchUserSubmissions
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => useContext(DataContext);
