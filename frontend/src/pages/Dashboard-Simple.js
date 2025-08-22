import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DashboardSimple = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Military Asset Management Dashboard
        </h1>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            Welcome, {user?.firstName} {user?.lastName}
          </h3>
          <p className="text-blue-700">
            Role: {user?.role || 'Unknown'}
          </p>
          <p className="text-blue-700">
            Base ID: {user?.base_id || user?.baseId || 'Not assigned'}
          </p>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800">Total Assets</h4>
            <p className="text-2xl font-bold text-green-600">Loading...</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800">Active Bases</h4>
            <p className="text-2xl font-bold text-blue-600">Loading...</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800">Recent Activities</h4>
            <p className="text-2xl font-bold text-yellow-600">Loading...</p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800">✅ Backend API: Connected</p>
            <p className="text-green-800">✅ Database: Connected</p>
            <p className="text-green-800">✅ Authentication: Active</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSimple;
