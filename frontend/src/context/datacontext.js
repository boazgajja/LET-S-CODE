import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [dataMap, setDataMap] = useState({});
  const [workingProblems, setWorkingProblems] = useState([]);
  const [teams, setTeams] = useState([]);
  const [friends, setFriends] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [teamWars, setTeamWars] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, fetchWithTokenRefresh, logout, updateUser } = useAuth();

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  useEffect(() => {
    const storedWorkingProblems = localStorage.getItem('workingProblems');
    if (storedWorkingProblems) {
      try {
        setWorkingProblems(JSON.parse(storedWorkingProblems));
      } catch (error) {
        localStorage.removeItem('workingProblems');
      }
    }
    const storedSubmissions = localStorage.getItem('submissions');
    if (storedSubmissions) {
      try {
        setSubmissions(JSON.parse(storedSubmissions));
      } catch (error) {
        localStorage.removeItem('submissions');
      }
    }
  }, []);

  // Data map
  const addOrUpdateKey = (key, value) => {
    setDataMap((prev) => ({ ...prev, [key]: value }));
  };
  const keyExists = (key) => key in dataMap;
  const getValue = (key) => dataMap[key];

  // ---------- UPDATED Working Problems functions -----------
  
  // Fetch working problems - UPDATED
  const fetchWorkingProblems = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) return;
      
      const response = await fetchWithTokenRefresh(`${process.env.REACT_APP_SERVER_LINK}/users/working-problems`, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched working problems:', data.data);
      
      if (data.success) {
        // Make sure all workingProblems have .id (question number)
        const workingProblemsWithId = (data.data || []).map((obj) => 
          obj.id ? obj : { ...obj, id: obj._id || obj.id }
        );
        setWorkingProblems(workingProblemsWithId);
      } else {
        console.error('Failed to fetch working problems:', data.message);
        setWorkingProblems([]);
      }
    } catch (error) {
      console.error('Error fetching working problems:', error);
      setWorkingProblems([]);
    } finally {
      setLoading(false);
    }
  }, [user, fetchWithTokenRefresh]);

  // Add working problem - UPDATED
  const addWorkingProblem = useCallback(async (problemData) => {
    if (!problemData || !problemData.id) return { success: false, message: 'Invalid problem data' };
    
    try {
      console.log('Adding working problem:', problemData);
      
      // Check if already exists locally
      const exists = workingProblems.some((p) => p.id === problemData.id);
      if (exists) {
        return { success: false, message: 'Problem already in working list' };
      }

      // Update local state optimistically
      const updatedProblems = [...workingProblems, problemData];
      setWorkingProblems(updatedProblems);
      localStorage.setItem('workingProblems', JSON.stringify(updatedProblems));
      
      if (user) {
        const response = await fetchWithTokenRefresh(`${process.env.REACT_APP_SERVER_LINK}/users/working-problems`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problemId: problemData.id })
        });

        if (!response.ok) {
          // Rollback on failure
          setWorkingProblems(workingProblems);
          localStorage.setItem('workingProblems', JSON.stringify(workingProblems));
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Add working problem response:', data);

        if (data.success) {
          // Update with server response
          const workingProblemsWithId = (data.data || []).map((obj) => 
            obj.id ? obj : { ...obj, id: obj._id || obj.id }
          );
          setWorkingProblems(workingProblemsWithId);
          localStorage.setItem('workingProblems', JSON.stringify(workingProblemsWithId));
          return { success: true, message: data.message };
        } else {
          // Rollback on server error
          setWorkingProblems(workingProblems);
          localStorage.setItem('workingProblems', JSON.stringify(workingProblems));
          console.error('Failed to add working problem:', data.message);
          return { success: false, message: data.message };
        }
      }
      
      return { success: true, message: 'Problem added locally' };
    } catch (error) {
      console.error('Error adding working problem:', error);
      // Rollback on error
      setWorkingProblems(workingProblems);
      localStorage.setItem('workingProblems', JSON.stringify(workingProblems));
      return { success: false, message: error.message };
    }
  }, [workingProblems, user, fetchWithTokenRefresh]);

  // Remove working problem - UPDATED
  const removeWorkingProblem = useCallback(async (problemId) => {
    try {
      console.log('Removing working problem:', problemId);
      
      // Find the problem to remove
      const problemToRemove = workingProblems.find(p => p.id === problemId);
      if (!problemToRemove) {
        return { success: false, message: 'Problem not found' };
      }

      // Update local state optimistically
      const updatedProblems = workingProblems.filter(p => p.id !== problemId);
      setWorkingProblems(updatedProblems);
      localStorage.setItem('workingProblems', JSON.stringify(updatedProblems));

      if (user) {
        // Use MongoDB _id for API call if available, otherwise use problemId
        const idForAPI = problemToRemove._id || problemId;
        
        const response = await fetchWithTokenRefresh(
          `${process.env.REACT_APP_SERVER_LINK}/users/working-problems/${idForAPI}`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if (!response.ok) {
          // Rollback on failure
          setWorkingProblems(workingProblems);
          localStorage.setItem('workingProblems', JSON.stringify(workingProblems));
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Remove working problem response:', data);

        if (data.success) {
          // Update with server response
          const workingProblemsWithId = (data.data || []).map((obj) => 
            obj.id ? obj : { ...obj, id: obj._id || obj.id }
          );
          setWorkingProblems(workingProblemsWithId);
          localStorage.setItem('workingProblems', JSON.stringify(workingProblemsWithId));
          return { success: true, message: data.message };
        } else {
          // Rollback on server error
          setWorkingProblems(workingProblems);
          localStorage.setItem('workingProblems', JSON.stringify(workingProblems));
          console.error('Failed to remove working problem:', data.message);
          return { success: false, message: data.message };
        }
      }
      
      return { success: true, message: 'Problem removed locally' };
    } catch (error) {
      console.error('Error removing working problem:', error);
      // Rollback on error
      setWorkingProblems(workingProblems);
      localStorage.setItem('workingProblems', JSON.stringify(workingProblems));
      return { success: false, message: error.message };
    }
  }, [workingProblems, user, fetchWithTokenRefresh]);

  // Bulk add working problems - NEW
  const addBulkWorkingProblems = useCallback(async (problemIds) => {
    try {
      console.log('Adding bulk working problems:', problemIds);
      
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }
      
      const response = await fetchWithTokenRefresh(`${process.env.REACT_APP_SERVER_LINK}/users/working-problems/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemIds })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Bulk add working problems response:', data);

      if (data.success) {
        const workingProblemsWithId = (data.data || []).map((obj) => 
          obj.id ? obj : { ...obj, id: obj._id || obj.id }
        );
        setWorkingProblems(workingProblemsWithId);
        localStorage.setItem('workingProblems', JSON.stringify(workingProblemsWithId));
        return { success: true, message: data.message };
      } else {
        console.error('Failed to bulk add working problems:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Error bulk adding working problems:', error);
      return { success: false, message: error.message };
    }
  }, [user, fetchWithTokenRefresh]);

  // ---------- Teams (unchanged) --------------
  const fetchTeams = async () => {
    try {
      const response = await fetchWithTokenRefresh(`${process.env.REACT_APP_SERVER_LINK}/teams`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) {
        setTeams(data.data);
      }
    } catch (error) {}
  };

  const createTeam = async (teamData) => {
    try {
      const response = await fetchWithTokenRefresh(`${process.env.REACT_APP_SERVER_LINK}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData),
      });
      const data = await response.json();
      if (response.ok) {
        const newTeamEntry = {
          team: data.data,
          role: 'owner',
          joinedAt: data.data.createdAt || new Date().toISOString(),
          _id: data.data._id
        };
        setTeams([...teams, newTeamEntry]);
        return data.data;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const addProblemToTeam = async (teamId, problemData) => {
    try {
      const response = await fetchWithTokenRefresh(`${process.env.REACT_APP_SERVER_LINK}/teams/${teamId}/problems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(problemData),
      });
      const data = await response.json();
      if (response.ok) {
        setTeams(teams.map((team) => (team._id === teamId ? data.data : team)));
        return data.data;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const joinTeam = async (inviteCode) => {
    try {
      const response = await fetchWithTokenRefresh(`${process.env.REACT_APP_SERVER_LINK}/teams/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode }),
      });
      const data = await response.json();
      if (response.ok) {
        fetchTeams();
        return data;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const getTeamJoinRequests = async (teamId) => {
    try {
      const response = await fetchWithTokenRefresh(`${process.env.REACT_APP_SERVER_LINK}/teams/${teamId}/requests`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) {
        return data.data;
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  };

  const acceptJoinRequest = async (teamId, userId) => {
    try {
      const response = await fetchWithTokenRefresh(
        `${process.env.REACT_APP_SERVER_LINK}/teams/${teamId}/requests/${userId}/accept`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      if (response.ok) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const rejectJoinRequest = async (teamId, userId) => {
    try {
      const response = await fetchWithTokenRefresh(
        `${process.env.REACT_APP_SERVER_LINK}/teams/${teamId}/requests/${userId}/reject`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      if (response.ok) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  // ----------- Friends (unchanged) -----------
  const fetchFriends = async () => {
    try {
      const response = await fetchWithTokenRefresh(`${process.env.REACT_APP_SERVER_LINK}/friends`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) {
        setFriends(data.data);
      }
    } catch (error) {}
  };

  const addFriend = async (friendCode) => {
    try {
      const response = await fetchWithTokenRefresh(`${process.env.REACT_APP_SERVER_LINK}/friends/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendCode }),
      });
      const data = await response.json();
      if (response.ok) {
        fetchFriends();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const acceptFriendRequest = async (friendId) => {
    try {
      const response = await fetchWithTokenRefresh(
        `${process.env.REACT_APP_SERVER_LINK}/friends/${friendId}/accept`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      if (response.ok) {
        fetchFriends();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const rejectFriendRequest = async (friendId) => {
    try {
      const response = await fetchWithTokenRefresh(
        `${process.env.REACT_APP_SERVER_LINK}/friends/${friendId}/reject`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      if (response.ok) {
        fetchFriends();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const removeFriend = async (friendId) => {
    try {
      const response = await fetchWithTokenRefresh(
        `${process.env.REACT_APP_SERVER_LINK}/friends/${friendId}`,
        { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      if (response.ok) {
        fetchFriends();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  // ---------- Submissions (unchanged) ----------
  const addSubmission = (submission) => {
    if (!submission) return;
    const updatedSubmissions = [submission, ...submissions];
    setSubmissions(updatedSubmissions);
    localStorage.setItem('submissions', JSON.stringify(updatedSubmissions));

    if (user && submission.problem) {
      const updatedUser = { ...user };
      updatedUser.stats = updatedUser.stats || {};
      updatedUser.stats.totalSubmissions = (updatedUser.stats.totalSubmissions || 0) + 1;

      if (submission.status === 'correct') {
        updatedUser.stats.acceptedSubmissions = (updatedUser.stats.acceptedSubmissions || 0) + 1;
        updatedUser.stats.solvedProblems = updatedUser.stats.solvedProblems || [];
        if (!updatedUser.stats.solvedProblems.includes(submission.problem)) {
          updatedUser.stats.solvedProblems.push(submission.problem);
          updatedUser.stats.problemsSolved = (updatedUser.stats.problemsSolved || 0) + 1;
        }
      }
      updateUser(updatedUser);
    }
  };

  const fetchUserSubmissions = async (page = 1, limit = 10) => {
    try {
      if (!user) return { submissions: [], pagination: { total: 0, page: 1, totalPages: 0 } };
      const response = await fetchWithTokenRefresh(
        `${process.env.REACT_APP_SERVER_LINK}/submissions/user/${user._id || user.userId}?page=${page}&limit=${limit}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      if (response.ok) {
        return data.data;
      } else {
        return { submissions: [], pagination: { total: 0, page: 1, totalPages: 0 } };
      }
    } catch (error) {
      return { submissions: [], pagination: { total: 0, page: 1, totalPages: 0 } };
    }
  };

  // ---------- Team Wars (unchanged) ----------
  const fetchTeamWars = async () => {
    try {
      const response = await fetchWithTokenRefresh(`${process.env.REACT_APP_SERVER_LINK}/team-wars`);
      if (!response.ok) return [];
      const data = await response.json();
      if (data.success) {
        setTeamWars(data.data);
        return data.data;
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  };

  const getTeamWar = async (warId) => {
    try {
      const response = await fetchWithTokenRefresh(`${process.env.REACT_APP_SERVER_LINK}/team-wars/${warId}`);
      if (!response.ok) return null;
      const data = await response.json();
      if (data.success) {
        return data.data;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const createTeamWar = async (challengedTeamId, warType, scheduledTime) => {
    try {
      const response = await fetchWithTokenRefresh(`${process.env.REACT_APP_SERVER_LINK}/team-wars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengedTeamId, warType, scheduledTime }),
      });
      const data = await response.json();
      if (response.ok) {
        await fetchTeamWars();
        return data.data;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const submitTeamWarSolution = async (warId, problemId, code) => {
    try {
      const response = await fetchWithTokenRefresh(
        `${process.env.REACT_APP_SERVER_LINK}/team-wars/${warId}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problemId, code }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        return data;
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const startTeamWar = async (warId) => {
    try {
      const response = await fetchWithTokenRefresh(
        `${process.env.REACT_APP_SERVER_LINK}/team-wars/${warId}/start`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      if (response.ok) {
        await fetchTeamWars();
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const joinTeamWar = async (warId, teamId) => {
    try {
      const response = await fetchWithTokenRefresh(
        `${process.env.REACT_APP_SERVER_LINK}/team-wars/${warId}/join`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        await fetchTeamWars();
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Clean up
  const clearData = () => {
    setWorkingProblems([]);
    setTeams([]);
    setFriends([]);
    setSubmissions([]);
    localStorage.removeItem('workingProblems');
    localStorage.removeItem('submissions');
  };

  // On login, fetch data
  useEffect(() => {
    if (user) {
      fetchTeams();
      fetchFriends();
      fetchUserSubmissions();
      fetchWorkingProblems();
    } else {
      clearData();
    }
  }, [user, fetchWorkingProblems]);

  return (
    <DataContext.Provider
      value={{
        dataMap, addOrUpdateKey, keyExists, getValue,
        user, updateUser, logout,
        workingProblems, addWorkingProblem, removeWorkingProblem, fetchWorkingProblems, addBulkWorkingProblems,
        teams, fetchTeams, createTeam, joinTeam, addProblemToTeam,
        getTeamJoinRequests, acceptJoinRequest, rejectJoinRequest,
        friends, fetchFriends, addFriend, acceptFriendRequest,
        rejectFriendRequest, removeFriend,
        submissions, addSubmission, fetchUserSubmissions,
        teamWars, fetchTeamWars, getTeamWar, createTeamWar,
        submitTeamWarSolution, startTeamWar, joinTeamWar,
        fetchWithTokenRefresh,
        loading, // Added loading state
        setWorkingProblems, setTeams // Added utility setters
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};