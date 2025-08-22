import React from 'react';
import { useQuery } from 'react-query';
import { XMarkIcon, ClockIcon, ComputerDesktopIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import api from '../../config/api';
import LoadingSpinner from '../UI/LoadingSpinner';

const UserActivityModal = ({ isOpen, onClose, user }) => {
  // Fetch user activity
  const { data: activityData, isLoading } = useQuery(
    ['user-activity', user?.id],
    async () => {
      const response = await api.get(`/api/users/${user.id}/activity`);
      return response.data;
    },
    { enabled: isOpen && user?.id }
  );

  if (!isOpen || !user) return null;

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login':
        return <ShieldCheckIcon className="h-5 w-5 text-green-600" />;
      case 'logout':
        return <ShieldCheckIcon className="h-5 w-5 text-gray-600" />;
      case 'api_access':
        return <ComputerDesktopIcon className="h-5 w-5 text-blue-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'login':
        return 'bg-green-50 border-green-200';
      case 'logout':
        return 'bg-gray-50 border-gray-200';
      case 'api_access':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Activity Log - {user.full_name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          {/* User Summary */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-blue-900">{user.full_name}</h4>
                <p className="text-blue-700">@{user.username} • {user.role}</p>
                {user.military_rank && (
                  <p className="text-blue-600 text-sm">{user.military_rank}</p>
                )}
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </div>
                <p className="text-blue-600 text-sm mt-1">
                  Last login: {user.last_login ? format(new Date(user.last_login), 'MMM d, yyyy HH:mm') : 'Never'}
                </p>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h4>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : activityData?.activities?.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {activityData.activities.map((activity, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-lg p-4 ${getActivityColor(activity.type)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        {getActivityIcon(activity.type)}
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.action || activity.type}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(activity.timestamp), 'MMM d, yyyy HH:mm:ss')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {activity.ip_address && (
                          <p className="text-xs text-gray-500">IP: {activity.ip_address}</p>
                        )}
                        {activity.user_agent && (
                          <p className="text-xs text-gray-500 max-w-xs truncate" title={activity.user_agent}>
                            {activity.user_agent}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {activity.details && (
                      <div className="mt-2 text-sm text-gray-700">
                        {typeof activity.details === 'string' 
                          ? activity.details 
                          : JSON.stringify(activity.details, null, 2)
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No activity found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No recent activity recorded for this user.
                </p>
              </div>
            )}
          </div>

          {/* Activity Statistics */}
          {activityData?.statistics && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Activity Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-900">
                    {activityData.statistics.total_logins || 0}
                  </div>
                  <div className="text-sm text-green-700">Total Logins</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-900">
                    {activityData.statistics.api_calls || 0}
                  </div>
                  <div className="text-sm text-blue-700">API Calls</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-900">
                    {activityData.statistics.days_active || 0}
                  </div>
                  <div className="text-sm text-purple-700">Days Active</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-orange-900">
                    {activityData.statistics.failed_attempts || 0}
                  </div>
                  <div className="text-sm text-orange-700">Failed Attempts</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserActivityModal;
