import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import api from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Purchases = () => {
  const { user, hasAnyRole } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    baseId: user?.role === 'base_commander' ? user.baseId : '',
    assetTypeId: '',
    startDate: '',
    endDate: '',
    supplier: '',
    limit: 20,
    offset: 0
  });

  // Fetch purchases
  const { data: purchasesData, isLoading } = useQuery(
    ['purchases', filters],
    async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await api.get(`/api/purchases?${params}`);
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

  const canCreatePurchase = hasAnyRole(['admin', 'base_commander', 'logistics_officer']);

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
          <h1 className="text-2xl font-semibold text-gray-900">Purchases</h1>
          <p className="text-gray-600">Manage asset purchases and procurement</p>
        </div>
        {canCreatePurchase && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Purchase
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
          <div>
            <label className="form-label">Supplier</label>
            <input
              type="text"
              className="form-input"
              placeholder="Search supplier..."
              value={filters.supplier}
              onChange={(e) => handleFilterChange('supplier', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Purchase Records ({purchasesData?.pagination?.total || 0})
          </h3>
        </div>
        
        {purchasesData?.purchases?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Date</th>
                  <th className="table-header-cell">Asset Type</th>
                  <th className="table-header-cell">Base</th>
                  <th className="table-header-cell">Quantity</th>
                  <th className="table-header-cell">Unit Cost</th>
                  <th className="table-header-cell">Total Cost</th>
                  <th className="table-header-cell">Supplier</th>
                  <th className="table-header-cell">Created By</th>
                  <th className="table-header-cell">Status</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {purchasesData.purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      {format(new Date(purchase.purchase_date), 'MMM d, yyyy')}
                    </td>
                    <td className="table-cell">
                      <div>
                        <div className="font-medium">{purchase.asset_type_name}</div>
                        <div className="text-sm text-gray-500 capitalize">{purchase.asset_category}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div>
                        <div className="font-medium">{purchase.base_name}</div>
                        <div className="text-sm text-gray-500">{purchase.base_code}</div>
                      </div>
                    </td>
                    <td className="table-cell font-medium">
                      {purchase.quantity.toLocaleString()}
                    </td>
                    <td className="table-cell">
                      {purchase.unit_cost ? `$${purchase.unit_cost.toLocaleString()}` : '-'}
                    </td>
                    <td className="table-cell font-medium">
                      {purchase.total_cost ? `$${purchase.total_cost.toLocaleString()}` : '-'}
                    </td>
                    <td className="table-cell">
                      {purchase.supplier || '-'}
                    </td>
                    <td className="table-cell">
                      <div>
                        <div className="font-medium">{purchase.created_by_username}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(purchase.created_at), 'MMM d, HH:mm')}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="badge-success">
                        {purchase.received_date ? 'Received' : 'Ordered'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-lg">No purchases found</p>
              <p className="text-sm mt-1">Try adjusting your filters or create a new purchase</p>
            </div>
          </div>
        )}

        {/* Pagination */}
        {purchasesData?.pagination && purchasesData.pagination.total > purchasesData.pagination.limit && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {purchasesData.pagination.offset + 1} to{' '}
              {Math.min(
                purchasesData.pagination.offset + purchasesData.pagination.limit,
                purchasesData.pagination.total
              )}{' '}
              of {purchasesData.pagination.total} results
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
                disabled={filters.offset + filters.limit >= purchasesData.pagination.total}
                className="btn-outline disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Purchase Modal */}
      {showCreateModal && (
        <CreatePurchaseModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries(['purchases']);
          }}
        />
      )}
    </div>
  );
};

// Create Purchase Modal Component
const CreatePurchaseModal = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    asset_type_id: '',
    base_id: user?.role === 'base_commander' ? user.baseId : '',
    quantity: '',
    unit_cost: '',
    total_cost: '',
    supplier: '',
    purchase_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    purchase_order_number: '',
    invoice_number: '',
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
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-calculate total cost when quantity or unit cost changes
      if (name === 'quantity' || name === 'unit_cost') {
        const quantity = parseFloat(name === 'quantity' ? value : updated.quantity) || 0;
        const unitCost = parseFloat(name === 'unit_cost' ? value : updated.unit_cost) || 0;
        updated.total_cost = (quantity * unitCost).toFixed(2);
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        baseId: formData.base_id,
        assetTypeId: formData.asset_type_id,
        quantity: parseInt(formData.quantity),
        unitCost: parseFloat(formData.unit_cost) || undefined,
        totalCost: parseFloat(formData.total_cost) || undefined,
        purchase_date: formData.purchase_date,
      };
      if (formData.delivery_date) payload.delivery_date = formData.delivery_date;
      if (formData.supplier) payload.vendor = formData.supplier;
      if (formData.notes) payload.notes = formData.notes;

      await api.post('/api/purchases', payload);
      onSuccess();
    } catch (error) {
      console.error('Error creating purchase:', error);
      alert('Failed to create purchase. Please try again.');
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
              Create New Purchase
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
                {(assetTypesData?.assetTypes || []).map(type => (
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
                {(basesData?.bases || []).map(base => (
                  <option key={base.id} value={base.id}>
                    {base.name} ({base.code})
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

            {/* Unit Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Cost ($) *
              </label>
              <input
                type="number"
                name="unit_cost"
                value={formData.unit_cost}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            {/* Total Cost (Auto-calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Cost ($)
              </label>
              <input
                type="number"
                name="total_cost"
                value={formData.total_cost}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                placeholder="0.00"
                readOnly
              />
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter supplier name"
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Date *
              </label>
              <input
                type="date"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Delivery Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                name="delivery_date"
                value={formData.delivery_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Purchase Order Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Order Number
              </label>
              <input
                type="text"
                name="purchase_order_number"
                value={formData.purchase_order_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter PO number"
              />
            </div>

            {/* Invoice Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter invoice number"
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
              {isSubmitting ? 'Creating...' : 'Create Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Purchases;
