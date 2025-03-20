// src/context/SavedActivitiesContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from "axios";
import { useAuth } from './AuthContext';

const SavedActivitiesContext = createContext(null);

const API_BASE_URL = "https://mm-v3.onrender.com";

export const SavedActivitiesProvider = ({ children }) => {
  const [savedActivities, setSavedActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  // Load saved activities when user changes
  useEffect(() => {
    const fetchSavedActivities = async () => {
      try {
        if (!user || user.isGuest) {
          setSavedActivities([]);
          return;
        }
        setIsLoading(true);
        const response = await axios.get(`${API_BASE_URL}/saved-activities`, {
          withCredentials: true, // Important for session cookies
        });
        console.log("4...");

        console.log("Saved activities response:", response.data);

        if (response.data.success) {
          setSavedActivities(response.data.activities);
        } else {
          console.error("Failed to fetch saved activities:", response.data.error);
        }
      } catch (error) {
        console.error("Error fetching saved activities:", error);
        setSavedActivities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedActivities();
  }, [user]);


  // Save activities to localStorage whenever they change
  useEffect(() => {
    if (user) {
      localStorage.setItem(`savedActivities_${user.id}`, JSON.stringify(savedActivities));
    }
  }, [savedActivities, user]);

  const saveActivity = (activity) => {
    setSavedActivities(prev => {
      // Check if activity already exists
      const exists = prev.some(saved => saved.title === activity.title);
      if (!exists) {
        return [...prev, activity];
      }
      return prev;
    });
  };

  const removeActivity = (activityTitle) => {
    setSavedActivities(prev => 
      prev.filter(activity => activity.title !== activityTitle)
    );
  };

  const isActivitySaved = (activityTitle) => {
    return savedActivities.some(activity => activity.title === activityTitle);
  };

  const clearAllActivities = () => {
    setSavedActivities([]);
    if (user) {
      localStorage.removeItem(`savedActivities_${user.id}`);
    }
  };

  return (
    <SavedActivitiesContext.Provider value={{ 
      savedActivities, 
      saveActivity, 
      removeActivity,
      isActivitySaved,
      clearAllActivities,
      isLoading
    }}>
      {children}
    </SavedActivitiesContext.Provider>
  );
};

export const useSavedActivities = () => useContext(SavedActivitiesContext);