import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Assignments = () => {
  const { user, hasAnyRole } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('assignments');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    baseId: user?.role === 'base_commander' ? user.baseId : '',
    assignedToUserId: '',
    status: '',
    startDate: '',
    endDate: '',
    limit: 20,
    offset: 0
  });

  // Fetch assignments
  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery(
    ['assignments', filters],
    async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`/api/assignments?${params}`);
      return response.data;
    },
    {
      enabled: activeTab === 'assignments'
    }
  );

  // Fetch expenditures
  const { data: expendituresData, isLoading: expendituresLoading } = useQuery(
    ['expenditures', filters],
    async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`/api/assignments/expenditures?${params}`);
      return response.data;
    },
    {
      enabled: activeTab === 'expenditures'
    }
  );

  // Fetch bases for filter
  const { data: basesData } = useQuery(
    'bases',
    async () => {
      const response = await axios.get('/api/bases');
      return response.data;
    }
  );

  // Fetch users for filter
  const { data: usersData } = useQuery(
    'users',
    async () => {
      const response = await axios.get('/api/users');
      return response.data;
    }
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  // const getStatusBadge = (status) => {
  //   const statusClasses = {
  //     active: 'badge-success',
  //     returned: 'badge-info',
  //     lost: 'badge-danger',
  //     damaged: 'badge-warning'
  //   };
  //   return statusClasses[status] || 'badge-gray';
  // };

  // const getStatusText = (status) => {
  //   const statusTexts = {
  //     active: 'Active',
  //     returned: 'Returned',
  //     lost: 'Lost',
  //     damaged: 'Damaged'
  //   };
  //   return statusTexts[status] || status;
  // };

  const canCreateAssignment = hasAnyRole(['admin', 'base_commander']);
  const isLoading = assignmentsLoading || expendituresLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Assignments & Expenditures</h1>
          <p className="text-gray-600">Manage asset assignments to personnel and track expenditures</p>
        </div>
        {canCreateAssignment && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {activeTab === 'assignments' ? 'New Assignment' : 'New Expenditure'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assignments'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Assignments
            </button>
            <button
              onClick={() => setActiveTab('expenditures')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'expenditures'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Expenditures
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {user?.role === 'admin' && (
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
            {activeTab === 'assignments' && (
              <div>
                <label className="form-label">Assigned To</label>
                <select
                  className="form-select"
                  value={filters.assignedToUserId}
                  onChange={(e) => handleFilterChange('assignedToUserId', e.target.value)}
                >
                  <option value="">All Users</option>
                  {usersData?.users?.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.username})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {activeTab === 'assignments' && (
              <div>
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="returned">Returned</option>
                  <option value="lost">Lost</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>
            )}
            <div>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="lg" />
            </div>
          ) : activeTab === 'assignments' ? (
            <AssignmentsTable data={assignmentsData} filters={filters} onFilterChange={handleFilterChange} />
          ) : (
            <ExpendituresTable data={expendituresData} filters={filters} onFilterChange={handleFilterChange} />
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateAssignmentModal 
          type={activeTab}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries(['assignments']);
          }}
        />
      )}
    </div>
  );
};

// Assignments Table Component
const AssignmentsTable = ({ data, filters, onFilterChange }) => {
  if (!data?.assignments?.length) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <p className="text-lg">No assignments found</p>
          <p className="text-sm mt-1">Try adjusting your filters or create a new assignment</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'badge-success',
      returned: 'badge-info',
      lost: 'badge-danger',
      damaged: 'badge-warning'
    };
    return statusClasses[status] || 'badge-gray';
  };

  return (
    <>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Assignment Records ({data?.pagination?.total || 0})
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Asset</th>
              <th className="table-header-cell">Assigned To</th>
              <th className="table-header-cell">Assignment Date</th>
              <th className="table-header-cell">Expected Return</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Purpose</th>
              <th className="table-header-cell">Assigned By</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {data.assignments.map((assignment) => (
              <tr key={assignment.id} className="hover:bg-gray-50">
                <td className="table-cell">
                  <div>
                    <div className="font-medium">{assignment.asset_type_name}</div>
                    <div className="text-sm text-gray-500">
                      {assignment.serial_number} • {assignment.model}
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <div>
                    <div className="font-medium">
                      {assignment.assigned_to_first_name} {assignment.assigned_to_last_name}
                    </div>
                    <div className="text-sm text-gray-500">{assignment.assigned_to_username}</div>
                  </div>
                </td>
                <td className="table-cell">
                  {format(new Date(assignment.assignment_date), 'MMM d, yyyy')}
                </td>
                <td className="table-cell">
                  {assignment.expected_return_date 
                    ? format(new Date(assignment.expected_return_date), 'MMM d, yyyy')
                    : '-'
                  }
                </td>
                <td className="table-cell">
                  <span className={`badge ${getStatusBadge(assignment.status)}`}>
                    {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="max-w-xs truncate" title={assignment.purpose}>
                    {assignment.purpose || '-'}
                  </div>
                </td>
                <td className="table-cell">
                  <div>
                    <div className="font-medium">{assignment.assigned_by_username}</div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(assignment.created_at), 'MMM d, HH:mm')}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.total > data.pagination.limit && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {data.pagination.offset + 1} to{' '}
            {Math.min(data.pagination.offset + data.pagination.limit, data.pagination.total)}{' '}
            of {data.pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onFilterChange('offset', Math.max(0, filters.offset - filters.limit))}
              disabled={filters.offset === 0}
              className="btn-outline disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => onFilterChange('offset', filters.offset + filters.limit)}
              disabled={filters.offset + filters.limit >= data.pagination.total}
              className="btn-outline disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Expenditures Table Component
const ExpendituresTable = ({ data, filters, onFilterChange }) => {
  if (!data?.expenditures?.length) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <p className="text-lg">No expenditures found</p>
          <p className="text-sm mt-1">Try adjusting your filters or create a new expenditure</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Expenditure Records ({data?.pagination?.total || 0})
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Date</th>
              <th className="table-header-cell">Asset Type</th>
              <th className="table-header-cell">Base</th>
              <th className="table-header-cell">Quantity</th>
              <th className="table-header-cell">Reason</th>
              <th className="table-header-cell">Operation</th>
              <th className="table-header-cell">Authorized By</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {data.expenditures.map((expenditure) => (
              <tr key={expenditure.id} className="hover:bg-gray-50">
                <td className="table-cell">
                  {format(new Date(expenditure.expenditure_date), 'MMM d, yyyy')}
                </td>
                <td className="table-cell">
                  <div>
                    <div className="font-medium">{expenditure.asset_type_name}</div>
                    <div className="text-sm text-gray-500 capitalize">{expenditure.asset_category}</div>
                  </div>
                </td>
                <td className="table-cell">
                  <div>
                    <div className="font-medium">{expenditure.base_name}</div>
                    <div className="text-sm text-gray-500">{expenditure.base_code}</div>
                  </div>
                </td>
                <td className="table-cell font-medium text-red-600">
                  -{expenditure.quantity.toLocaleString()}
                </td>
                <td className="table-cell">
                  <div className="max-w-xs truncate" title={expenditure.reason}>
                    {expenditure.reason}
                  </div>
                </td>
                <td className="table-cell">
                  {expenditure.operation_name || '-'}
                </td>
                <td className="table-cell">
                  <div>
                    <div className="font-medium">{expenditure.authorized_by_username}</div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(expenditure.created_at), 'MMM d, HH:mm')}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.total > data.pagination.limit && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {data.pagination.offset + 1} to{' '}
            {Math.min(data.pagination.offset + data.pagination.limit, data.pagination.total)}{' '}
            of {data.pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onFilterChange('offset', Math.max(0, filters.offset - filters.limit))}
              disabled={filters.offset === 0}
              className="btn-outline disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => onFilterChange('offset', filters.offset + filters.limit)}
              disabled={filters.offset + filters.limit >= data.pagination.total}
              className="btn-outline disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Create Assignment Modal Component
const CreateAssignmentModal = ({ type, onClose, onSuccess }) => {
  // const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    asset_id: '',
    assigned_to: '',
    assignment_date: new Date().toISOString().split('T')[0],
    expected_return_date: '',
    purpose: '',
    location: '',
    notes: ''
  });

  // Fetch available assets
  const { data: assetsData } = useQuery(
    'available-assets',
    async () => {
      const response = await axios.get('/api/assets?current_status=available');
      return response.data;
    }
  );

  // Fetch users for assignment
  const { data: usersData } = useQuery(
    'users',
    async () => {
      const response = await axios.get('/api/users');
      return response.data;
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Map the component's snake_case formData keys to the backend's expected camelCase schema
    const payload = {
      assetId: formData.asset_id,
      assignedToUserId: formData.assigned_to,
      assignmentDate: formData.assignment_date,
    };

    if (formData.expected_return_date) {
      payload.expectedReturnDate = formData.expected_return_date;
    }
    if (formData.purpose) {
      payload.purpose = formData.purpose;
    }
    if (formData.notes) {
      payload.notes = formData.notes;
    }

    try {
      await axios.post('/api/assignments', payload);
      onSuccess();
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert(
        error.response?.data?.message ||
          'Failed to create assignment. Please check your input and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Create New Assignment
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Asset */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset *
              </label>
              <select
                name="asset_id"
                value={formData.asset_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Asset</option>
                {assetsData?.assets?.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.asset_type_name} - {asset.serial_number || 'No S/N'} ({asset.base_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To *
              </label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select User</option>
                {usersData?.users?.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.username}) - {user.base_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assignment Date *
              </label>
              <input
                type="date"
                name="assignment_date"
                value={formData.assignment_date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Expected Return Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Return Date
              </label>
              <input
                type="date"
                name="expected_return_date"
                value={formData.expected_return_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose *
              </label>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Purpose</option>
                <option value="training">Training</option>
                <option value="operation">Operation</option>
                <option value="maintenance">Maintenance</option>
                <option value="patrol">Patrol</option>
                <option value="exercise">Exercise</option>
                <option value="deployment">Deployment</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter assignment location"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any additional notes"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Assignments;
