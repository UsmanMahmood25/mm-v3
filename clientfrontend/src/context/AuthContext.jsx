// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE_URL = 'https://mm-v3.onrender.com';

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in when the app loads
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_BASE_URL}/current-user`, {
          withCredentials: true, // Important for session cookies
        });

        console.log('Current user response:', response.data);

        const fetchedUser = response.data.user;

        if (fetchedUser && !fetchedUser.isGuest) {
          // If there is a logged-in user, set the user and mark them as logged in
          setUser(fetchedUser);
          setIsLoggedIn(true);
          
          // Fetch user interests immediately after login confirmation
          fetchUserInterests();
        } else {
          // If the user is a guest or none exists, ensure logged out state
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error fetching user session', error);
        setUser(null);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const fetchUserInterests = async () => {
    try {
      console.log('Fetching interests for user');
      
      const response = await axios.get(`${API_BASE_URL}/get-interests`, {
        withCredentials: true
      });
      
      console.log('Fetched interests response:', response.data);
      
      if (response.data.success) {
        setUser((prevUser) => ({
          ...prevUser,
          interests: response.data.interests
        }));
        return { success: true, interests: response.data.interests };
      } else {
        console.error('Failed to fetch interests:', response.data.error);
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('Error fetching interests:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || "Failed to fetch interests" 
      };
    }
  };

  const login = async (credentials) => {
    try {
      console.log('Attempting login with:', credentials);
      
      const response = await axios.post(`${API_BASE_URL}/login`, {
        username: credentials.emailOrUsername, // Send as username to match backend
        password: credentials.password
      }, {
        withCredentials: true, // Important for session cookies
      });

      console.log('Login response:', response.data);

      if (response.data.success) {
        setUser(response.data.user);
        setIsLoggedIn(true);
        
        // Fetch interests immediately after successful login
        fetchUserInterests();
        
        return { success: true, user: response.data.user };
      } else {
        return { success: false, error: response.data.error || "Login failed" };
      }
    } catch (error) {
      console.error('Login failed:', error);
      console.error('Error response:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.error || "An error occurred during login" 
      };
    }
  };

  const signup = async (userData) => {
    try {
      console.log('Attempting signup with:', userData);
      
      const response = await axios.post(`${API_BASE_URL}/signup`, {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName
      }, {
        withCredentials: true,
      });

      console.log('Signup response:', response.data);
      
      if (response.data.success) {
        // Auto-login after successful signup
        setUser(response.data.user);
        setIsLoggedIn(true);
        
        // Fetch interests immediately after successful signup
        fetchUserInterests();
        
        return { success: true, user: response.data.user };
      } else {
        return { success: false, error: response.data.error || "Signup failed" };
      }
    } catch (error) {
      console.error('Signup failed:', error);
      console.error('Error response:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.error || "An error occurred during signup" 
      };
    }
  };

  const logout = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/logout`, {}, { 
        withCredentials: true 
      });
      
      console.log('Logout response:', response.data);
      
      setUser(null);
      setIsLoggedIn(false);
      // Reset state or perform a page refresh
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Updated to use the fetching function
  const updateUserInterests = async () => {
    if (isLoggedIn) {
      return await fetchUserInterests();
    }
    return { success: false, error: "User not logged in" };
  };
    
  const updateUserProfile = async (profileData) => {
    if (user) {
      try {
        console.log('Updating profile with data:', profileData);
        console.log('Current user state before update:', user);
        
        const response = await axios.put(`${API_BASE_URL}/update-profile`, {
          username: user.username,
          ...profileData
        }, {
          withCredentials: true
        });
        
        console.log('Update profile response:', response.data);
        
        if (response.data.success) {
          // Update the user state with the new profile data
          setUser((prevUser) => {
            const updated = { ...prevUser, ...profileData };
            console.log('Updated user state:', updated);
            return updated;
          });
          return { success: true };
        }
        return { success: false, error: response.data.error };
      } catch (error) {
        console.error('Error updating profile', error);
        console.error('Error response:', error.response?.data);
        return { success: false, error: "Failed to update profile" };
      }
    }
    return { success: false, error: "User not logged in" };
  };
  
  // Testing function to execute SQL (used fo development mode purposes)
  const executeSql = async (query) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/execute-sql`, { query });
      return response.data;
    } catch (error) {
      console.error('Error executing SQL:', error);
      return { success: false, error: error.response?.data?.error || "SQL execution failed" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        login,
        signup,
        logout,
        updateUserInterests,
        updateUserProfile,
        isLoading,
        executeSql
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);