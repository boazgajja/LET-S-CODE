import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Clear authentication data
  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('workingProblems');
    localStorage.removeItem('submissions');
    console.log('🧹 Auth data cleared');
  }, []);

  // Refresh token function
  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('🔄 Attempting token refresh...');
      const response = await fetch('http://localhost:3001/api/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      
      const data = await response.json();

      if (response.ok && data.success) {
        // Update tokens in localStorage
        const newAccessToken = data.data.tokens.accessToken;
        const newRefreshToken = data.data.tokens.refreshToken;
        
        localStorage.setItem('token', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        setToken(newAccessToken);
        
        console.log('✅ Token refreshed successfully');
        return newAccessToken;
      } else {
        console.error('❌ Token refresh failed:', data.message);
        clearAuth();
        throw new Error(data.message || 'Token refresh failed');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      clearAuth();
      throw error;
    }
  }, [clearAuth]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        
        console.log('📦 Retrieved from localStorage:', {
          hasUser: !!storedUser,
          hasToken: !!storedToken,
          hasRefreshToken: !!storedRefreshToken
        });

        if (storedUser && storedToken) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log('👤 Parsed user:', parsedUser.username || parsedUser.email);
            
            // For now, trust the stored data without verification
            // You can add token verification later when you have the endpoint
            setUser(parsedUser);
            setToken(storedToken);
            setIsAuthenticated(true);
            console.log('✅ Auth initialized with stored data');
            
            /* 
            // Uncomment this when you have a verify endpoint
            try {
              const response = await fetch('http://localhost:3001/api/verify', {
                method: 'GET',
                headers: { 
                  'Authorization': `Bearer ${storedToken}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                setUser(parsedUser);
                setToken(storedToken);
                setIsAuthenticated(true);
                console.log('✅ Auth initialized with valid token');
              } else if (response.status === 401 && storedRefreshToken) {
                console.log('🔄 Token expired, attempting refresh...');
                try {
                  const newToken = await refreshAccessToken();
                  if (newToken) {
                    setUser(parsedUser);
                    setToken(newToken);
                    setIsAuthenticated(true);
                    console.log('✅ Auth initialized with refreshed token');
                  } else {
                    throw new Error('Failed to refresh token');
                  }
                } catch (refreshError) {
                  console.error('❌ Token refresh failed:', refreshError);
                  clearAuth();
                }
              } else {
                console.log('❌ Token validation failed');
                clearAuth();
              }
            } catch (verifyError) {
              console.log('⚠️ Cannot verify token (network error), using cached data');
              setUser(parsedUser);
              setToken(storedToken);
              setIsAuthenticated(true);
            }
            */
            
          } catch (parseError) {
            console.error('Error parsing stored user data:', parseError);
            clearAuth();
          }
        } else {
          console.log('💭 No stored auth data found');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuth();
      } finally {
        setIsLoading(false);
        console.log('✅ Auth initialization complete');
      }
    };

    initializeAuth();
  }, [clearAuth, refreshAccessToken]);

  // Fetch with token refresh wrapper
  const fetchWithTokenRefresh = useCallback(async (url, options = {}) => {
    const makeRequest = async (authToken) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${authToken}`,
        },
      });
    };

    try {
      let authToken = token || localStorage.getItem('token');
      
      if (!authToken) {
        throw new Error('No authentication token available');
      }

      console.log('🌐 Making request to:', url);
      let response = await makeRequest(authToken);

      // If token expired, try to refresh
      if (response.status === 401) {
        console.log('🔑 Token appears expired, attempting refresh...');
        try {
          const errorData = await response.json();
          console.log('🔑 Token error detected:', errorData.message);
          
          if (errorData.code === 'TOKEN_EXPIRED' || errorData.code === 'INVALID_TOKEN') {
            authToken = await refreshAccessToken();
            response = await makeRequest(authToken);
            console.log('✅ Request retried successfully with new token');
          } else {
            throw new Error(errorData.message);
          }
        } catch (parseError) {
          console.log('🔄 Attempting token refresh...');
          authToken = await refreshAccessToken();
          response = await makeRequest(authToken);
        }
      }
      
      return response;
    } catch (error) {
      console.error('❌ Request failed:', error);
      throw error;
    }
  }, [token, refreshAccessToken]);

  // Login function
  const login = async (credentials) => {
    try {
      setIsLoading(true);
      console.log('🔐 Attempting login...');
      
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      const data = await response.json();
      console.log('📡 Login response:', { success: response.ok, hasUser: !!data.data?.user });
      
      if (response.ok && data.success) {
        const userData = data.data.user;
        const tokens = data.data.tokens;
        
        console.log('💾 Storing login data:', {
          userId: userData._id,
          username: userData.username,
          hasAccessToken: !!tokens.accessToken,
          hasRefreshToken: !!tokens.refreshToken
        });
        
        // Store in localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userId', userData._id);
        localStorage.setItem('token', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        
        // Update state
        setUser(userData);
        setToken(tokens.accessToken);
        setIsAuthenticated(true);
        
        console.log('✅ Login successful');
        return { success: true, user: userData };
      } else {
        console.error('❌ Login failed:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setIsLoading(true);
      console.log('📝 Attempting registration...');
      
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Registration successful');
        return { success: true, message: data.message };
      } else {
        console.error('❌ Registration failed:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Network error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  // Update user function
  const updateUser = useCallback((userData) => {
    console.log('🔄 Updating user data...');
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('✅ User updated in AuthContext');
  }, []);

  // Logout function
  const logout = useCallback(() => {
    console.log('🚪 Logging out user...');
    clearAuth();
  }, [clearAuth]);

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    updateUser,
    logout,
    fetchWithTokenRefresh,
    refreshAccessToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
