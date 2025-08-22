import React, { useState } from 'react';
import CreateUserModal from '../components/Users/CreateUserModal';
import EditUserModal from '../components/Users/EditUserModal';
import UserActivityModal from '../components/Users/UserActivityModal';
import { useQuery } from 'react-query';
import { PlusIcon, FunnelIcon, UserIcon, PencilIcon, ClockIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import api from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Users = () => {
  const { user, hasRole, getRoleDisplayName } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({
    role: '',
    baseId: user?.role === 'base_commander' ? user.baseId : '',
    isActive: '',
    limit: 20,
    offset: 0
  });

  const handleEditUser = (userToEdit) => {
    setSelectedUser(userToEdit);
    setShowEditModal(true);
  };

  const handleViewActivity = (userToView) => {
    setSelectedUser(userToView);
    setShowActivityModal(true);
  };

  // Fetch users
  const { data: usersData, isLoading, refetch } = useQuery(
    ['users', filters],
    async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '') params.append(key, value);
      });
      
      const response = await api.get(`/api/users?${params}`);
      return response.data;
    }
  );

  // Fetch bases for filter
  const { data: basesData } = useQuery(
    'bases',
    async () => {
      const response = await api.get('/api/bases');
      return response.data;
    },
    {
      enabled: hasRole('admin')
    }
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const getRoleBadge = (role) => {
    const roleClasses = {
      admin: 'badge-danger',
      base_commander: 'badge-warning',
      logistics_officer: 'badge-info'
    };
    return roleClasses[role] || 'badge-gray';
  };

  const canCreateUser = hasRole('admin');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and their roles</p>
        </div>
        {canCreateUser && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New User
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Role</label>
            <select
              className="form-select"
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="base_commander">Base Commander</option>
              <option value="logistics_officer">Logistics Officer</option>
            </select>
          </div>
          {hasRole('admin') && (
            <div>
              <label className="form-label">Base</label>
              <select
                className="form-select"
                value={filters.baseId}
                onChange={(e) => handleFilterChange('baseId', e.target.value)}
              >
                <option value="">All Bases</option>
                {basesData?.bases?.map(base => (
                  <option key={base.id} value={base.id}>
                    {base.name} ({base.code})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Users ({usersData?.pagination?.total || 0})
          </h3>
        </div>
        
        {usersData?.users?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">User</th>
                  <th className="table-header-cell">Role</th>
                  <th className="table-header-cell">Base</th>
                  <th className="table-header-cell">Email</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Created</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {usersData.users.map((userData) => (
                  <tr key={userData.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {userData.first_name} {userData.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{userData.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getRoleBadge(userData.role)}`}>
                        {getRoleDisplayName(userData.role)}
                      </span>
                    </td>
                    <td className="table-cell">
                      {userData.base_name ? (
                        <div>
                          <div className="font-medium">{userData.base_name}</div>
                          <div className="text-sm text-gray-500">{userData.base_code}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <a 
                        href={`mailto:${userData.email}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        {userData.email}
                      </a>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${userData.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {userData.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      {format(new Date(userData.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        {hasRole(['admin', 'base_commander']) && (
                          <button
                            onClick={() => handleEditUser(userData)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewActivity(userData)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="View Activity"
                        >
                          <ClockIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-lg">No users found</p>
              <p className="text-sm mt-1">Try adjusting your filters or create a new user</p>
            </div>
          </div>
        )}

        {/* Pagination */}
        {usersData?.pagination && usersData.pagination.total > usersData.pagination.limit && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {usersData.pagination.offset + 1} to{' '}
              {Math.min(
                usersData.pagination.offset + usersData.pagination.limit,
                usersData.pagination.total
              )}{' '}
              of {usersData.pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleFilterChange('offset', Math.max(0, filters.offset - filters.limit))}
                disabled={filters.offset === 0}
                className="btn-outline disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handleFilterChange('offset', filters.offset + filters.limit)}
                disabled={filters.offset + filters.limit >= usersData.pagination.total}
                className="btn-outline disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={selectedUser}
      />

      {/* User Activity Modal */}
      <UserActivityModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        user={selectedUser}
      />
    </div>
  );
};

export default Users;
