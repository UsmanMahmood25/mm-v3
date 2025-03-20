// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SavedActivitiesProvider } from './context/SavedActivitiesContext';
import MainLayout from './components/layout/MainLayout';
import SignInPage from './pages/SignInPage';
import DiscoverPage from './pages/DiscoverPage';
import AccountPage from './pages/AccountPage';
import SavedPage from './pages/SavedPage';
import { NotFound } from './pages/NotFoundPage';

const App = () => {
  return (
    <AuthProvider>
      <SavedActivitiesProvider>
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<DiscoverPage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
      </SavedActivitiesProvider>
    </AuthProvider>
  );
};

export default App;