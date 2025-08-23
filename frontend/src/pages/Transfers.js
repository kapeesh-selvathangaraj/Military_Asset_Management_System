import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { FunnelIcon, PlusIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import api from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Transfers = () => {
  const { hasAnyRole } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    fromBaseId: '',
    toBaseId: '',
    assetTypeId: '',
    status: '',
    startDate: '',
    endDate: '',
    limit: 20,
    offset: 0
  });

  // Fetch transfers
  const { data: transfersData, isLoading } = useQuery(
    ['transfers', filters],
    async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await api.get(`/api/transfers?${params}`);
      return response.data;
    }
  );

  // Fetch bases for filter
  const { data: basesData } = useQuery(
    'bases',
    async () => {
      const response = await api.get('/api/bases');
      return response.data;
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
      pending: 'badge-warning',
      in_transit: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger'
    };
    return statusClasses[status] || 'badge-gray';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      pending: 'Pending',
      in_transit: 'In Transit',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return statusTexts[status] || status;
  };

  const canCreateTransfer = hasAnyRole(['admin', 'base_commander', 'logistics_officer']);

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
          <h1 className="text-2xl font-semibold text-gray-900">Transfers</h1>
          <p className="text-gray-600">Manage asset transfers between bases</p>
        </div>
        {canCreateTransfer && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Transfer
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="form-label">From Base</label>
            <select
              className="form-select"
              value={filters.fromBaseId}
              onChange={(e) => handleFilterChange('fromBaseId', e.target.value)}
            >
              <option value="">All Bases</option>
              {basesData?.bases?.map(base => (
                <option key={base.id} value={base.id}>
                  {base.name} ({base.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">To Base</label>
            <select
              className="form-select"
              value={filters.toBaseId}
              onChange={(e) => handleFilterChange('toBaseId', e.target.value)}
            >
              <option value="">All Bases</option>
              {basesData?.bases?.map(base => (
                <option key={base.id} value={base.id}>
                  {base.name} ({base.code})
                </option>
              ))}
            </select>
          </div>
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
                  {type.name}
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
              <option value="pending">Pending</option>
              <option value="in_transit">In Transit</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
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

      {/* Transfers Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Transfer Records ({transfersData?.pagination?.total || 0})
          </h3>
        </div>
        
        {transfersData?.transfers?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Date</th>
                  <th className="table-header-cell">Asset Type</th>
                  <th className="table-header-cell">From Base</th>
                  <th className="table-header-cell">To Base</th>
                  <th className="table-header-cell">Quantity</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Requested By</th>
                  <th className="table-header-cell">Tracking</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {transfersData.transfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      {format(new Date(transfer.transfer_date), 'MMM d, yyyy')}
                    </td>
                    <td className="table-cell">
                      <div>
                        <div className="font-medium">{transfer.asset_type_name}</div>
                        <div className="text-sm text-gray-500 capitalize">{transfer.asset_category}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div>
                        <div className="font-medium">{transfer.from_base_name}</div>
                        <div className="text-sm text-gray-500">{transfer.from_base_code}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div>
                        <div className="font-medium">{transfer.to_base_name}</div>
                        <div className="text-sm text-gray-500">{transfer.to_base_code}</div>
                      </div>
                    </td>
                    <td className="table-cell font-medium">
                      {transfer.quantity.toLocaleString()}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getStatusBadge(transfer.status)}`}>
                        {getStatusText(transfer.status)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div>
                        <div className="font-medium">{transfer.requested_by_username}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(transfer.created_at), 'MMM d, HH:mm')}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      {transfer.tracking_number || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-lg">No transfers found</p>
              <p className="text-sm mt-1">Try adjusting your filters or create a new transfer</p>
            </div>
          </div>
        )}

        {/* Pagination */}
        {transfersData?.pagination && transfersData.pagination.total > transfersData.pagination.limit && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {transfersData.pagination.offset + 1} to{' '}
              {Math.min(
                transfersData.pagination.offset + transfersData.pagination.limit,
                transfersData.pagination.total
              )}{' '}
              of {transfersData.pagination.total} results
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
                disabled={filters.offset + filters.limit >= transfersData.pagination.total}
                className="btn-outline disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Transfer Modal */}
      {showCreateModal && (
        <CreateTransferModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries(['transfers']);
          }}
        />
      )}
    </div>
  );
};

// Create Transfer Modal Component
const CreateTransferModal = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    from_base_id: user?.role === 'base_commander' ? user.baseId : '',
    to_base_id: '',
    asset_type_id: '',
    quantity: '',
    reason: '',
    transfer_date: new Date().toISOString().split('T')[0],
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
      const payload = {
        fromBaseId: formData.from_base_id,
        toBaseId: formData.to_base_id,
        assetTypeId: formData.asset_type_id,
        quantity: parseInt(formData.quantity),
        transferDate: formData.transfer_date,
      };
      if (formData.reason) payload.reason = formData.reason;
      if (formData.notes) payload.notes = formData.notes;

      await api.post('/api/transfers', payload);
      onSuccess();
    } catch (error) {
      console.error('Error creating transfer:', error);
      const backendMessage = error.response?.data?.message || 'Failed to create transfer. Please try again.';
      alert(backendMessage);
      alert('Failed to create transfer. Please try again.');
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
              Create New Transfer
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
            {/* From Base */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Base *
              </label>
              <select
                name="from_base_id"
                value={formData.from_base_id}
                onChange={handleInputChange}
                required
                disabled={user?.role === 'base_commander'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select From Base</option>
                {(basesData?.bases || []).map(base => (
                  <option key={base.id} value={base.id}>
                    {base.name} ({base.code})
                  </option>
                ))}
              </select>
            </div>

            {/* To Base */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Base *
              </label>
              <select
                name="to_base_id"
                value={formData.to_base_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select To Base</option>
                {(basesData?.bases || []).filter(base => base.id !== formData.from_base_id).map(base => (
                  <option key={base.id} value={base.id}>
                    {base.name} ({base.code})
                  </option>
                ))}
              </select>
            </div>

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
                {(assetTypesData?.assetTypes || []).map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quantity"
              />
            </div>

            {/* Transfer Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transfer Date *
              </label>
              <input
                type="date"
                name="transfer_date"
                value={formData.transfer_date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason *
              </label>
              <select
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Reason</option>
                <option value="reallocation">Reallocation</option>
                <option value="maintenance">Maintenance</option>
                <option value="operational_need">Operational Need</option>
                <option value="surplus">Surplus</option>
                <option value="emergency">Emergency</option>
                <option value="other">Other</option>
              </select>
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
              {isSubmitting ? 'Creating...' : 'Create Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Transfers;
