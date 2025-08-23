import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { UserIcon, KeyIcon, ShieldCheckIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const { getRoleDisplayName } = useAuth();
  // const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  // Fetch user profile
  const { data: profileData, isLoading } = useQuery(
    'user-profile',
    async () => {
      const response = await axios.get('/api/auth/profile');
      return response.data;
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', name: 'Profile Information', icon: UserIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'activity', name: 'Recent Activity', icon: KeyIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-6">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-10 w-10 text-primary-600" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {profileData?.user?.first_name} {profileData?.user?.last_name}
            </h2>
            <p className="text-gray-600">@{profileData?.user?.username}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`badge badge-${profileData?.user?.role === 'admin' ? 'danger' : profileData?.user?.role === 'base_commander' ? 'warning' : 'info'}`}>
                {getRoleDisplayName(profileData?.user?.role)}
              </span>
              {profileData?.user?.base_name && (
                <div className="flex items-center text-sm text-gray-500">
                  <BuildingOfficeIcon className="h-5 w-5 mr-1" />
                  {profileData.user.base_name} ({profileData.user.base_code})
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && <ProfileTab profileData={profileData} />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'activity' && <ActivityTab />}
        </div>
      </div>
    </div>
  );
};

// Profile Information Tab
const ProfileTab = ({ profileData }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      firstName: profileData?.user?.first_name || '',
      lastName: profileData?.user?.last_name || '',
      email: profileData?.user?.email || ''
    }
  });

  const updateProfileMutation = useMutation(
    async (data) => {
      const response = await axios.put('/api/auth/profile', {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('user-profile');
        toast.success('Profile updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    }
  );

  const onSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
        <p className="text-sm text-gray-600">Update your personal details and contact information.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">First Name</label>
            <input
              type="text"
              className="form-input"
              {...register('firstName', { required: 'First name is required' })}
            />
            {errors.firstName && (
              <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label className="form-label">Last Name</label>
            <input
              type="text"
              className="form-input"
              {...register('lastName', { required: 'Last name is required' })}
            />
            {errors.lastName && (
              <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-input"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Invalid email address'
              }
            })}
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-input bg-gray-50"
            value={profileData?.user?.username || ''}
            disabled
          />
          <p className="text-sm text-gray-500 mt-1">Username cannot be changed</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Role</label>
            <input
              type="text"
              className="form-input bg-gray-50"
              value={profileData?.user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''}
              disabled
            />
          </div>
          {profileData?.user?.base_name && (
            <div>
              <label className="form-label">Base</label>
              <input
                type="text"
                className="form-input bg-gray-50"
                value={`${profileData.user.base_name} (${profileData.user.base_code})`}
                disabled
              />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateProfileMutation.isLoading}
            className="btn-primary"
          >
            {updateProfileMutation.isLoading ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Security Tab
const SecurityTab = () => {
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm();
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const changePasswordMutation = useMutation(
    async (data) => {
      const response = await axios.put('/api/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Password changed successfully');
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to change password');
      }
    }
  );

  const onSubmit = (data) => {
    changePasswordMutation.mutate(data);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
        <p className="text-sm text-gray-600">Ensure your account is using a long, random password to stay secure.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="form-label">Current Password</label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              className="form-input pr-10"
              {...register('currentPassword', { required: 'Current password is required' })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => togglePasswordVisibility('current')}
            >
              <span className="text-gray-400 text-sm">
                {showPasswords.current ? 'Hide' : 'Show'}
              </span>
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-sm text-red-600 mt-1">{errors.currentPassword.message}</p>
          )}
        </div>

        <div>
          <label className="form-label">New Password</label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              className="form-input pr-10"
              {...register('newPassword', { 
                required: 'New password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                }
              })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => togglePasswordVisibility('new')}
            >
              <span className="text-gray-400 text-sm">
                {showPasswords.new ? 'Hide' : 'Show'}
              </span>
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-sm text-red-600 mt-1">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <label className="form-label">Confirm New Password</label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              className="form-input pr-10"
              {...register('confirmPassword', { 
                required: 'Please confirm your password',
                validate: (value) => value === watch('newPassword') || 'Passwords do not match'
              })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => togglePasswordVisibility('confirm')}
            >
              <span className="text-gray-400 text-sm">
                {showPasswords.confirm ? 'Hide' : 'Show'}
              </span>
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={changePasswordMutation.isLoading}
            className="btn-primary"
          >
            {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Activity Tab
const ActivityTab = () => {
  const { data: activityData, isLoading } = useQuery(
    'user-activity',
    async () => {
      const response = await axios.get('/api/auth/activity');
      return response.data;
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        <p className="text-sm text-gray-600">Your recent login and activity history.</p>
      </div>

      {activityData?.activities?.length > 0 ? (
        <div className="space-y-4">
          {activityData.activities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <KeyIcon className="h-4 w-4 text-primary-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.description}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {format(new Date(activity.timestamp), 'MMM d, yyyy HH:mm')}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
          <p className="mt-1 text-sm text-gray-500">
            Your activity history will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default Profile;
