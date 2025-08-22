import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Purchases from './pages/Purchases';
import Transfers from './pages/Transfers';
import Assignments from './pages/Assignments';
import Users from './pages/Users';
import Bases from './pages/Bases';
import Assets from './pages/Assets';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have permission to access this page.
            </p>
            <div className="mt-6">
              <button
                onClick={() => window.history.back()}
                className="btn-primary"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

// Public Route Component (redirects to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />

              {/* Protected Routes */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                
                {/* Dashboard - All roles */}
                <Route path="dashboard" element={<Dashboard />} />
                
                {/* Purchases - Admin, Base Commander, Logistics Officer */}
                <Route 
                  path="purchases" 
                  element={
                    <ProtectedRoute roles={['admin', 'base_commander', 'logistics_officer']}>
                      <Purchases />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Transfers - Admin, Base Commander, Logistics Officer */}
                <Route 
                  path="transfers" 
                  element={
                    <ProtectedRoute roles={['admin', 'base_commander', 'logistics_officer']}>
                      <Transfers />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Assignments - Admin, Base Commander */}
                <Route 
                  path="assignments" 
                  element={
                    <ProtectedRoute roles={['admin', 'base_commander']}>
                      <Assignments />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Users - Admin, Base Commander */}
                <Route 
                  path="users" 
                  element={
                    <ProtectedRoute roles={['admin', 'base_commander']}>
                      <Users />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Bases - All roles */}
                <Route path="bases" element={<Bases />} />
                
                {/* Assets - All roles */}
                <Route path="assets" element={<Assets />} />
                
                {/* Reports - Admin, Base Commander */}
                <Route 
                  path="reports" 
                  element={
                    <ProtectedRoute roles={['admin', 'base_commander']}>
                      <Reports />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Profile - All roles */}
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>

            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
