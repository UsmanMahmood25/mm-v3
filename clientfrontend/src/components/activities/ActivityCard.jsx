// src/components/activities/ActivityCard.jsx
import React, { useState } from 'react';
import { MapPin, Sun, Heart } from 'lucide-react';
import axios from "axios";
import { useAuth } from '../../context/AuthContext';
import { useSavedActivities } from '../../context/SavedActivitiesContext';
import ActivityDetailsModal from './ActivityDetails';

const API_BASE_URL = "https://mm-v3.onrender.com"; 

const ActivityCard = ({ activity }) => {
  const { title, category, location, weather, description } = activity;
  const { isLoggedIn } = useAuth();
  const { saveActivity, removeActivity, isActivitySaved } = useSavedActivities();
  const isSaved = isActivitySaved(title);
  const [showDetails, setShowDetails] = useState(false);

  // Truncate description to 95 characters and add ellipsis if needed
  const truncatedDescription = description.length > 95 
    ? `${description.substring(0, 95)}...` 
    : description;

  const handleSaveToggle = async () => {
    // Optimistically update UI for all users
    if (isSaved) {
      removeActivity(title); // Instantly update UI
    } else {
      saveActivity(activity); // Instantly update UI
    }
  
    // Only attempt to save to database if logged in
    if (isLoggedIn) {
      try {
        if (isSaved) {
          // Send request to remove activity from database
          const response = await axios.post(
            `${API_BASE_URL}/remove-activity`,
            { title },
            { withCredentials: true }
          );
    
          if (!response.data.success) {
            console.error("Failed to remove activity:", response.data.error);
            saveActivity(activity); // Rollback UI update if failed
          }
        } else {
          // Send request to save activity to database
          const response = await axios.post(
            `${API_BASE_URL}/save-activity`,
            {
              title,
              category,
              location,
              weather,
              description,
            },
            { withCredentials: true }
          );
    
          if (!response.data.success) {
            console.error("Failed to save activity:", response.data.error);
            removeActivity(title); // Rollback UI update if failed
          }
        }
      } catch (error) {
        console.error("Error saving/removing activity:", error);
        if (isSaved) {
          saveActivity(activity); // Rollback UI update
        } else {
          removeActivity(title); // Rollback UI update
        }
      }
    }
    // If not logged in, just keep the UI state change without database operations
  };  

  const handleViewDetails = () => {
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
        <div className="p-6 flex flex-col flex-grow">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{category}</p>
            </div>
            <button 
              onClick={handleSaveToggle}
              className={`text-gray-400 hover:text-red-500 transition-colors ${
                isSaved ? 'text-red-500' : ''
              }`}
              aria-label={isSaved ? "Remove from saved" : "Save activity"}
            >
              <Heart 
                size={20} 
                fill={isSaved ? "currentColor" : "none"}
              />
            </button>
          </div>
          <div className="mt-4 space-y-2 flex-grow">
            <div className="flex items-center text-sm text-gray-500">
              <MapPin size={16} className="mr-2 flex-shrink-0" />
              {location}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Sun size={16} className="mr-2 flex-shrink-0" />
              {weather}
            </div>
            <p className="text-sm text-gray-600 mt-2">{truncatedDescription}</p>
          </div>
          <button 
            className="mt-4 w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            onClick={handleViewDetails}
            aria-label="View activity details"
          >
            View Details
          </button>
        </div>
      </div>

      {/* Activity Details Modal */}
      {showDetails && (
        <ActivityDetailsModal 
          activity={activity} 
          onClose={handleCloseDetails} 
        />
      )}
    </>
  );
};

export default ActivityCard;