import React, { useState, useEffect } from 'react';
import SearchBar from '../components/search/SearchBar';
import InterestTags from '../components/search/InterestTags';
import ActivityCard from '../components/activities/ActivityCard';
import { useAuth } from '../context/AuthContext';
import axios from "axios";
  
const API_BASE_URL = "https://mm-v3.onrender.com"; 

const DiscoverPage = () => {
  const { user } = useAuth();
  console.log('DiscoverPage - Current user:', user);
  
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedInterests, setGeneratedInterests] = useState([]);
  const [userInterests, setUserInterests] = useState([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [location, setLocation] = useState("");
  const [weather, setWeather] = useState({ condition: null, temperature: null });
  const [errorMessage, setErrorMessage] = useState("");

  // Load user interests if logged in
  useEffect(() => {
    if (user && user.interests) {
      console.log('Setting user interests from user object:', user.interests);
      const uniqueInterests = [...new Set(user.interests)];
      setUserInterests(uniqueInterests);
    }
  }, [user]);

  const handleGenerateActivities = async (selectedInterests) => {
    setErrorMessage("");
    const uniqueInterests = [...new Set(selectedInterests)];
    console.log('Generating activities with interests:', uniqueInterests);
    
    setGeneratedInterests(uniqueInterests);
    setUserInterests(uniqueInterests);
    setHasGenerated(false);
    setIsLoading(true);
  
    try {
      if (user) {
        console.log('Saving interests to database for user:', user.username);
        const response = await axios.post(
          `${API_BASE_URL}/save-interests`,
          { interests: uniqueInterests },
          { withCredentials: true }
        );
  
        if (!response.data.success) {
          console.error("Failed to save interests:", response.data.error);
          setUserInterests([]); 
        }
      }
  
      // Fetch activity recommendations
      console.log('Fetching activity recommendations with:', { 
        interests: uniqueInterests, 
        location, 
        weather: weather?.condition,
        temperature: weather?.temperature,
      });
      
      const response = await fetch(`${API_BASE_URL}/get-recommendations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interests: uniqueInterests,
          location: location,
          weather: weather?.condition,
          temperature: weather?.temperature,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
  
      const data = await response.json();
      console.log('Received recommendations:', data);
  
      const transformedActivities = [
        ...data.recommendations.outdoor_activities,
        ...data.recommendations.indoor_activities,
        ...data.recommendations.local_events,
      ].map((activity) => ({
        title: activity.name,
        category: activity.genre,
        location: activity.location,
        weather: activity.weather,
        description: activity.description,
      }));
  
      console.log('Transformed activities:', transformedActivities);
      setActivities(transformedActivities);
      setHasGenerated(true);
    } catch (error) {
      console.error("Error generating activities:", error);
      setErrorMessage("Failed to generate activities. Please try again later.");
      setUserInterests([]); 
    } finally {
      setIsLoading(false);
    }
  };

  // Update location when the user types in the SearchBar
  const handleLocationChange = (newLocation) => {
    console.log('User updated location:', newLocation);
    setLocation(newLocation);
  };

  const handleInterestsChange = (updatedInterests) => {
    console.log('Interests changed:', updatedInterests);
    if (hasGenerated && updatedInterests.length === 0) {
      console.log('Clearing activities due to empty interests');
      setActivities([]);
      setGeneratedInterests([]);
      setHasGenerated(false);
    }
  };

  const handleAddInterest = (interest) => {
    const normalizedInterest = interest.trim().toLowerCase();
    console.log('Adding interest:', interest, 'normalized:', normalizedInterest);
    
    const isDuplicate = userInterests.some(
      existingInterest => existingInterest.toLowerCase() === normalizedInterest
    );
    
    if (!isDuplicate && normalizedInterest) {
      console.log('Adding new interest to list:', interest.trim());
      document.dispatchEvent(new CustomEvent('addInterest', { detail: interest.trim() }));
    } else if (isDuplicate) {
      console.log('Interest already exists in list:', interest);
      setErrorMessage("This interest is already in your list.");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('Got user coordinates:', latitude, longitude);

          try {
            const response = await axios.post(`${API_BASE_URL}/get_weather`, {
              latitude,
              longitude,
            });

            console.log('Weather data received:', response.data);
            setLocation(response.data.location);
            setWeather({
              condition: response.data.weather.condition,
              temperature: response.data.weather.temperature,
            });
          } catch (err) {
            console.error("Weather fetch error:", err);
            setErrorMessage("Failed to fetch weather data.");
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setErrorMessage("Location access denied.");
        }
      );
    }
  }, []);
  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      <div className="max-w-2xl mx-auto"> 
        <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-8">
          <div className="flex flex-col space-y-4">
            <SearchBar onAddInterest={handleAddInterest} 
              location={location}
              onLocationChange={handleLocationChange}/>
            <InterestTags 
              onGenerateActivities={handleGenerateActivities}
              onInterestsChange={handleInterestsChange}
              initialInterests={userInterests}
            />
          </div>
        </section>
        
        {user && (
          <div className="bg-purple-50 rounded-xl p-4 mb-8 text-sm sm:text-base text-center">
            {console.log('Rendering welcome message with user:', user)}
            <p className="text-purple-600">
              Welcome back, <strong>{user.name || user.username}</strong>! 
            </p>
          </div>
        )}
        
        {/* Display error message if any */}
        {errorMessage && (
          <div className="bg-red-50 rounded-xl p-4 mb-8 text-sm sm:text-base">
            <p className="text-red-600">{errorMessage}</p>
          </div>
        )}
        
        {isLoading && (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
          </div>
        )}
        
        {generatedInterests.length > 0 && !isLoading && hasGenerated && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Activities based on your interests</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {generatedInterests.map((interest, index) => (
                <span
                  key={index}
                  className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {activities.length > 0 && !isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {activities.map((activity, index) => (
            <ActivityCard key={index} activity={activity} />
          ))}
        </div>
      )}
      
      {!isLoading && !hasGenerated && (
        <div className="text-center py-12">
          <div className="text-purple-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Add your interests and discover activities</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Enter your interests above and click "Generate Activities" to see personalized activity recommendations.
          </p>
        </div>
      )}
    </div>
  );
};

export default DiscoverPage;