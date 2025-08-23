import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { FunnelIcon, EyeIcon, PlusIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import api from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Assets = () => {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    baseId: user?.role === 'base_commander' ? user.baseId : '',
    assetTypeId: '',
    status: '',
    condition: '',
    limit: 20,
    offset: 0
  });

  // Fetch assets
  const { data: assetsData, isLoading } = useQuery(
    ['assets', filters],
    async () => {
      const params = new URLSearchParams();

      // Map frontend keys/values to backend expectations
      Object.entries(filters).forEach(([key, value]) => {
        if (!value) return;

        let paramKey = key;
        let paramVal = value;

        if (key === 'status') {
          paramKey = 'current_status';
          if (value === 'expended') paramVal = 'disposed';
        }
        if (key === 'condition') {
          paramKey = 'condition_status';
          if (value === 'excellent') paramVal = 'new';
          if (value === 'damaged') paramVal = 'unserviceable';
        }

        params.append(paramKey, paramVal);
      });

      const response = await api.get(`/api/assets?${params}`);
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

  // Fetch asset types for filter
  const { data: assetTypesData } = useQuery(
    'asset-types',
    async () => {
      const response = await api.get('/api/assets/types');
      return response.data;
    }
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      available: 'badge-success',
      assigned: 'badge-warning',
      maintenance: 'badge-info',
      disposed: 'badge-danger',
      transferred: 'badge-gray'
    };
    return statusClasses[status] || 'badge-gray';
  };

  const getConditionBadge = (condition) => {
    const conditionClasses = {
      new: 'badge-success',
      good: 'badge-info',
      fair: 'badge-warning',
      poor: 'badge-warning',
      unserviceable: 'badge-danger'
    };
    return conditionClasses[condition] || 'badge-gray';
  };

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
          <h1 className="text-2xl font-semibold text-gray-900">Asset Management</h1>
          <p className="text-gray-600">View and manage military assets</p>
        </div>
        {hasRole(['admin', 'logistics_officer']) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add New Asset
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <label className="form-label">Asset Type</label>
            <select
              className="form-select"
              value={filters.assetTypeId}
              onChange={(e) => handleFilterChange('assetTypeId', e.target.value)}
            >
              <option value="">All Types</option>
              {assetTypesData?.assetTypes?.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.category})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="maintenance">Maintenance</option>
              <option value="disposed">Disposed</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>
          <div>
            <label className="form-label">Condition</label>
            <select
              className="form-select"
              value={filters.condition}
              onChange={(e) => handleFilterChange('condition', e.target.value)}
            >
              <option value="">All Conditions</option>
              <option value="new">New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="unserviceable">Unserviceable</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Assets ({assetsData?.pagination?.total || 0})
          </h3>
        </div>
        
        {assetsData?.assets?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Asset</th>
                  <th className="table-header-cell">Base</th>
                  <th className="table-header-cell">Serial Number</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Condition</th>
                  <th className="table-header-cell">Acquisition</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {assetsData.assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div>
                        <div className="font-medium">{asset.asset_type_name}</div>
                        <div className="text-sm text-gray-500 capitalize">
                          {asset.asset_category}
                        </div>
                        {asset.model && (
                          <div className="text-sm text-gray-400">
                            {asset.manufacturer} {asset.model}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div>
                        <div className="font-medium">{asset.base_name}</div>
                        <div className="text-sm text-gray-500">{asset.base_code}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-mono text-sm">
                        {asset.serial_number || '-'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getStatusBadge(asset.current_status)}`}>
                        {asset.current_status.charAt(0).toUpperCase() + asset.current_status.slice(1)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getConditionBadge(asset.condition_status)}`}>
                        {asset.condition_status.charAt(0).toUpperCase() + asset.condition_status.slice(1)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div>
                        {asset.acquisition_date && (
                          <div className="text-sm">
                            {format(new Date(asset.acquisition_date), 'MMM d, yyyy')}
                          </div>
                        )}
                        {asset.acquisition_cost && (
                          <div className="text-sm text-gray-500">
                            ${asset.acquisition_cost.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => setSelectedAsset(asset)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-lg">No assets found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          </div>
        )}

        {/* Pagination */}
        {assetsData?.pagination && assetsData.pagination.total > assetsData.pagination.limit && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {assetsData.pagination.offset + 1} to{' '}
              {Math.min(
                assetsData.pagination.offset + assetsData.pagination.limit,
                assetsData.pagination.total
              )}{' '}
              of {assetsData.pagination.total} results
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
                disabled={filters.offset + filters.limit >= assetsData.pagination.total}
                className="btn-outline disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Asset Modal */}
      {showCreateModal && (
        <CreateAssetModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries(['assets']);
          }}
        />
      )}

      {/* Asset Details Modal */}
      {selectedAsset && (
        <AssetDetailsModal 
          asset={selectedAsset} 
          onClose={() => setSelectedAsset(null)} 
        />
      )}
    </div>
  );
};

// Asset Details Modal Component
const AssetDetailsModal = ({ asset, onClose }) => {
  // Fetch detailed asset information including assignment history
  const { data: assetDetails, isLoading } = useQuery(
    ['asset-details', asset.id],
    async () => {
      const response = await api.get(`/api/assets/${asset.id}`);
      return response.data;
    }
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Asset Details
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

        <div className="px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-gray-500">Asset Type</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {assetDetails?.asset?.asset_type_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Category</dt>
                    <dd className="text-sm font-medium text-gray-900 capitalize">
                      {assetDetails?.asset?.asset_category}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Serial Number</dt>
                    <dd className="text-sm font-medium text-gray-900 font-mono">
                      {assetDetails?.asset?.serial_number || 'Not assigned'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Model</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {assetDetails?.asset?.model || 'Not specified'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Manufacturer</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {assetDetails?.asset?.manufacturer || 'Not specified'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Status Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Status Information</h4>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-gray-500">Current Status</dt>
                    <dd>
                      <span className={`badge ${getStatusBadge(assetDetails?.asset?.current_status)}`}>
                        {assetDetails?.asset?.current_status?.charAt(0).toUpperCase() + assetDetails?.asset?.current_status?.slice(1)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Condition</dt>
                    <dd>
                      <span className={`badge ${getConditionBadge(assetDetails?.asset?.condition_status)}`}>
                        {assetDetails?.asset?.condition_status?.charAt(0).toUpperCase() + assetDetails?.asset?.condition_status?.slice(1)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Base</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {assetDetails?.asset?.base_name} ({assetDetails?.asset?.base_code})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Acquisition Date</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {assetDetails?.asset?.acquisition_date 
                        ? format(new Date(assetDetails.asset.acquisition_date), 'MMM d, yyyy')
                        : 'Not recorded'
                      }
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Acquisition Cost</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {assetDetails?.asset?.acquisition_cost 
                        ? `$${assetDetails.asset.acquisition_cost.toLocaleString()}`
                        : 'Not recorded'
                      }
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Assignment History */}
          {assetDetails?.assignmentHistory?.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Assignment History</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Assigned To
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Assignment Date
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Return Date
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Purpose
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assetDetails.assignmentHistory.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {assignment.assigned_to_first_name} {assignment.assigned_to_last_name}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {format(new Date(assignment.assignment_date), 'MMM d, yyyy')}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {assignment.actual_return_date 
                            ? format(new Date(assignment.actual_return_date), 'MMM d, yyyy')
                            : assignment.expected_return_date
                            ? `Expected: ${format(new Date(assignment.expected_return_date), 'MMM d, yyyy')}`
                            : '-'
                          }
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          <span className={`badge ${getStatusBadge(assignment.status)}`}>
                            {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={assignment.purpose}>
                            {assignment.purpose || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

// Helper functions (duplicated for this component)
const getStatusBadge = (status) => {
  const statusClasses = {
    available: 'badge-success',
    assigned: 'badge-warning',
    maintenance: 'badge-info',
    expended: 'badge-danger',
    transferred: 'badge-gray',
    active: 'badge-success',
    returned: 'badge-info',
    lost: 'badge-danger',
    damaged: 'badge-warning'
  };
  return statusClasses[status] || 'badge-gray';
};

const getConditionBadge = (condition) => {
  const conditionClasses = {
    excellent: 'badge-success',
    good: 'badge-info',
    fair: 'badge-warning',
    poor: 'badge-warning',
    damaged: 'badge-danger'
  };
  return conditionClasses[condition] || 'badge-gray';
};

// Create Asset Modal Component
const CreateAssetModal = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    asset_type_id: '',
    base_id: user?.role === 'base_commander' ? user.baseId : '',
    serial_number: '',
    model: '',
    manufacturer: '',
    purchase_date: '',
    purchase_cost: '',
    current_status: 'available',
    condition_status: 'excellent',
    location: '',
    notes: ''
  });

  // Fetch bases for dropdown
  const { data: basesData } = useQuery(
    'bases',
    async () => {
      const response = await api.get('/api/bases');
      return response.data;
    }
  );

  // Fetch asset types for dropdown
  const { data: assetTypesData } = useQuery(
    'asset-types',
    async () => {
      const response = await api.get('/api/assets/types');
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

    try {
      await api.post('/api/assets', {
        ...formData,
        purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating asset:', error);
      alert('Failed to create asset. Please try again.');
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
              Add New Asset
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
            {/* Asset Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Type *
              </label>
              <select
                name="asset_type_id"
                value={formData.asset_type_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Asset Type</option>
                {assetTypesData?.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Base */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base *
              </label>
              <select
                name="base_id"
                value={formData.base_id}
                onChange={handleInputChange}
                required
                disabled={user?.role === 'base_commander'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select Base</option>
                {basesData?.map(base => (
                  <option key={base.id} value={base.id}>
                    {base.name} ({base.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Serial Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serial Number
              </label>
              <input
                type="text"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter serial number"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter model"
              />
            </div>

            {/* Manufacturer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter manufacturer"
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Purchase Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Cost ($)
              </label>
              <input
                type="number"
                name="purchase_cost"
                value={formData.purchase_cost}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            {/* Current Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Status
              </label>
              <select
                name="current_status"
                value={formData.current_status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="maintenance">Maintenance</option>
                <option value="transferred">Transferred</option>
              </select>
            </div>

            {/* Condition Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition Status
              </label>
              <select
                name="condition_status"
                value={formData.condition_status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="damaged">Damaged</option>
              </select>
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter current location"
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
              {isSubmitting ? 'Creating...' : 'Create Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Assets;
