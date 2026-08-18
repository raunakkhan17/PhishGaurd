import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Login from './components/Login';
import DetectionEngine from './components/DetectionEngine';
import CommunityHub from './components/CommunityHub';
import ForumDetail from './components/ForumDetail';
import CreateForumPost from './components/CreateForumPost';
import CreateEducationResource from './components/CreateEducationResource';
import ReportWebsite from './components/ReportWebsite';
import PublicDirectory from './components/PublicDirectory';
import AdminDashboard from './components/AdminDashboard';
import Tools from './components/Tools';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

const AppContentWrapper: React.FC = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<'community' | 'detection' | 'directory' | 'tools'>('detection');

  // Update active section based on current route
  useEffect(() => {
    if (location.pathname.startsWith('/community') || location.pathname.startsWith('/create-') || location.pathname.startsWith('/forum')) {
      setActiveSection('community');
    } else if (location.pathname.startsWith('/directory')) {
      setActiveSection('directory');
    } else if (location.pathname.startsWith('/detection')) {
      setActiveSection('detection');
    } else if (location.pathname.startsWith('/tools')) {
      setActiveSection('tools');
    }
  }, [location.pathname]);

  return <AppContent activeSection={activeSection} setActiveSection={setActiveSection} />;
};

const AppContent: React.FC<{
  activeSection: 'community' | 'detection' | 'directory' | 'tools';
  setActiveSection: (section: 'community' | 'detection' | 'directory' | 'tools') => void;
}> = ({ activeSection, setActiveSection }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Login />;
  }

  // Role-based navigation
  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
      />
      
      <Routes>
        {/* Default route - redirect based on role */}
        <Route 
          path="/" 
          element={
            isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/detection" replace />
          } 
        />
        
        {/* Detection Engine - for all users */}
        <Route 
          path="/detection" 
          element={
            <ProtectedRoute>
              <DetectionEngine />
            </ProtectedRoute>
          } 
        />
        
        {/* Community Hub - for all users */}
        <Route 
          path="/community" 
          element={
            <ProtectedRoute>
              <CommunityHub />
            </ProtectedRoute>
          } 
        />
        
        {/* Forum routes - for all users */}
        <Route 
          path="/forum/:forumId" 
          element={
            <ProtectedRoute>
              <ForumDetail />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/create-post" 
          element={
            <ProtectedRoute>
              <CreateForumPost />
            </ProtectedRoute>
          } 
        />
        
        {/* Education routes - for all users */}
        <Route 
          path="/create-education-resource" 
          element={
            <ProtectedRoute>
              <CreateEducationResource />
            </ProtectedRoute>
          } 
        />
        
        {/* Report website - for all users */}
        <Route 
          path="/report-website" 
          element={
            <ProtectedRoute>
              <ReportWebsite />
            </ProtectedRoute>
          } 
        />
        
        {/* Public Directory - for all users */}
        <Route 
          path="/directory" 
          element={
            <ProtectedRoute>
              <PublicDirectory />
            </ProtectedRoute>
          } 
        />
        
        {/* Tools - for all users */}
        <Route 
          path="/tools" 
          element={
            <ProtectedRoute>
              <Tools />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin routes - only for admin users */}
        {isAdmin && (
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        )}
        
        {/* Catch all route - redirect to appropriate page based on role */}
        <Route 
          path="*" 
          element={
            isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/detection" replace />
          } 
        />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContentWrapper />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;