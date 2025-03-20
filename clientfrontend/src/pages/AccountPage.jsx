// src/pages/AccountPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSavedActivities } from '../context/SavedActivitiesContext';
import { User, Heart, Settings, LogOut, ChevronDown, X, Calendar } from 'lucide-react';
import AccountSettings from '../components/account/AccountSettings';
import ActivityCard from '../components/activities/ActivityCard';
import axios from 'axios';

const API_BASE_URL = "https://mm-v3.onrender.com";

const AccountPage = () => {
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuth();
  const { savedActivities } = useSavedActivities();
  const [activeTab, setActiveTab] = useState('profile');
  const [showMobileTabMenu, setShowMobileTabMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userInterests, setUserInterests] = useState([]);
  const [memberSince, setMemberSince] = useState('');

  // Update userInterests whenever user.interests changes
  useEffect(() => {
    if (user && user.interests) {
      setUserInterests(user.interests);
    }
  }, [user]);

  // Fetch user details including member since date
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (user && !user.isGuest) {
        try {
          // First check if memberSince already exists in user object
          if (user.memberSince) {
            setMemberSince(user.memberSince);
          } else {
            // If not, fetch it from the server
            const response = await axios.get(`${API_BASE_URL}/user-details`, {
              withCredentials: true
            });
            
            if (response.data.success && response.data.userDetails.memberSince) {
              setMemberSince(response.data.userDetails.memberSince);
            }
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
          setMemberSince('Unable to fetch');
        }
      }
    };
    
    fetchUserDetails();
  }, [user]);

  // Move all hooks to the top level before any conditional returns
  useEffect(() => {
    if (isDeleting) {
      // Add the keyframes and animation class only when in delete mode
      const style = document.createElement('style');
      style.id = 'wiggle-animation-style';
      style.innerHTML = `
        @keyframes wiggle {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-1deg); }
          50% { transform: rotate(0deg); }
          75% { transform: rotate(1deg); }
          100% { transform: rotate(0deg); }
        }
        .wiggle-animation {
          animation: wiggle 0.2s infinite;
          animation-timing-function: ease-in-out;
        }
      `;
      document.head.appendChild(style);
    } else {
      // Remove the style when not in delete mode
      const existingStyle = document.getElementById('wiggle-animation-style');
      if (existingStyle) {
        existingStyle.remove();
      }
    }

    // Cleanup on component unmount
    return () => {
      const existingStyle = document.getElementById('wiggle-animation-style');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [isDeleting]);

  // Handle authentication loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    navigate('/signin');
    return null;
  }

  const handleLogout = () => {
    logout();
  };

  const toggleMobileTabMenu = () => {
    setShowMobileTabMenu(!showMobileTabMenu);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowMobileTabMenu(false);
  };


  const handleDeleteInterest = async (interestToDelete) => {
    console.log(`Deleting interest: ${interestToDelete}`);
  
    try {
      const response = await fetch(`${API_BASE_URL}/remove-interest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Keep the session alive
        body: JSON.stringify({ interest: interestToDelete }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error("Failed to remove interest:", data.error);
        alert(`Error: ${data.error}`);
        return;
      }
  
      console.log("Interest removed successfully:", data);
  
      // Update UI state after a successful backend response
      setUserInterests((prev) => prev.filter((interest) => interest !== interestToDelete));
    } catch (error) {
      console.error("Error removing interest:", error);
      alert("Something went wrong. Please try again.");
    }
  };
  

  const ProfileSection = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto sm:mx-0">
          <User size={32} className="text-purple-600" />
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-semibold">{user?.displayName ||user.name || user.username || 'User Name'}</h2>
          <p className="text-gray-500">{user?.email || 'email@example.com'}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-medium mb-2">Location</h3>
          <p className="text-gray-600">{user?.location || 'Not set'}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-medium mb-2">Member Since</h3>
          <div className="flex items-center text-gray-600">
            <Calendar size={16} className="mr-2 text-purple-500" />
            <p>{user?.memberSince || memberSince || 'Loading...'}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-medium mb-2">Interests</h3>
          {userInterests && userInterests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {userInterests.map((interest, index) => (
                <span
                  key={index}
                  className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs"
                >
                  {interest}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No interests added yet</p>
          )}
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="font-medium mb-2">Activity Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xl font-bold text-purple-600">{savedActivities.length}</p>
            <p className="text-sm text-gray-500">Saved Activities</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-purple-600">0</p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-purple-600">0</p>
            <p className="text-sm text-gray-500">Reviews</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-purple-600">0</p>
            <p className="text-sm text-gray-500">Friends</p>
          </div>
        </div>
      </div>
    </div>
  );

  const SavedActivitiesSection = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Saved Activities</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedActivities.length > 0 ? (
          savedActivities.map((activity, index) => (
            <ActivityCard key={index} activity={activity} />
          ))
        ) : (
          <div className="col-span-full bg-white p-8 rounded-lg shadow-sm text-center">
            <Heart size={40} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg mb-2">No saved activities yet</p>
            <p className="text-gray-400">
              Activities you save will appear here. Click the heart icon on any activity to save it for later.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Discover Activities
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const InterestsSection = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Your Interests</h2>
      {userInterests && userInterests.length > 0 ? (
        <div>
          <div className="flex flex-wrap gap-2 mb-6">
            {userInterests.map((interest, index) => (
              <span
                key={index}
                className={`bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm flex items-center ${
                  isDeleting ? "wiggle-animation" : ""
                }`}
              >
                {interest}
                {isDeleting && (
                  <button
                    onClick={() => handleDeleteInterest(interest)}
                    className="ml-2 bg-purple-200 hover:bg-purple-300 rounded-full p-1 text-purple-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </span>
            ))}
          </div>
          <p className="text-gray-600">
            These interests are used to generate personalized activity recommendations for you.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add Interests
            </button>
            <button
              onClick={() => setIsDeleting(!isDeleting)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isDeleting
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-purple-600 text-white hover:bg-purple-700"
              }`}
            >
              {isDeleting ? "Done" : "Delete Interests"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <p className="text-gray-500 text-lg mb-2">No interests added yet</p>
          <p className="text-gray-400 mb-4">
            Adding interests helps us recommend activities that match your preferences.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Add Interests
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Mobile Tab Selector */}
        <div className="md:hidden border-b border-gray-200">
          <button
            onClick={toggleMobileTabMenu}
            className="flex items-center justify-between w-full px-6 py-4 text-left"
          >
            <span className="font-medium text-gray-900">
              {activeTab === 'profile' && 'Profile'}
              {activeTab === 'saved' && 'Saved Activities'}
              {activeTab === 'interests' && 'Interests'}
              {activeTab === 'settings' && 'Settings'}
            </span>
            <ChevronDown 
              size={20} 
              className={`transform transition-transform ${showMobileTabMenu ? 'rotate-180' : ''}`} 
            />
          </button>
          
          {showMobileTabMenu && (
            <div className="border-t border-gray-100">
              <button
                onClick={() => handleTabChange('profile')}
                className={`w-full px-6 py-3 text-left ${activeTab === 'profile' ? 'bg-purple-50 text-purple-600' : ''}`}
              >
                Profile
              </button>
              <button
                onClick={() => handleTabChange('saved')}
                className={`w-full px-6 py-3 text-left ${activeTab === 'saved' ? 'bg-purple-50 text-purple-600' : ''}`}
              >
                Saved Activities
              </button>
              <button
                onClick={() => handleTabChange('interests')}
                className={`w-full px-6 py-3 text-left ${activeTab === 'interests' ? 'bg-purple-50 text-purple-600' : ''}`}
              >
                Interests
              </button>
              <button
                onClick={() => handleTabChange('settings')}
                className={`w-full px-6 py-3 text-left ${activeTab === 'settings' ? 'bg-purple-50 text-purple-600' : ''}`}
              >
                Settings
              </button>
            </div>
          )}
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:block border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Account">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 inline-flex items-center border-b-2 ${
                activeTab === 'profile'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="mr-2" size={20} />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`py-4 px-1 inline-flex items-center border-b-2 ${
                activeTab === 'saved'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Heart className="mr-2" size={20} />
              Saved Activities {savedActivities.length > 0 && (
                <span className="ml-2 bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs">
                  {savedActivities.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('interests')}
              className={`py-4 px-1 inline-flex items-center border-b-2 ${
                activeTab === 'interests'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="mr-2" size={20} />
              Interests
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 inline-flex items-center border-b-2 ${
                activeTab === 'settings'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="mr-2" size={20} />
              Settings
            </button>
          </nav>
        </div>
        
        {/* Content Section */}
        <div className="p-4 sm:p-6">
          {activeTab === 'profile' && <ProfileSection />}
          {activeTab === 'saved' && <SavedActivitiesSection />}
          {activeTab === 'interests' && <InterestsSection />}
          {activeTab === 'settings' && <AccountSettings />}
        </div>
        
        {/* Logout Section */}
        <div className="border-t border-gray-200 p-4 sm:p-6">
          <button
            onClick={handleLogout}
            className="flex items-center text-red-600 hover:text-red-700 transition-colors"
          >
            <LogOut size={20} className="mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;