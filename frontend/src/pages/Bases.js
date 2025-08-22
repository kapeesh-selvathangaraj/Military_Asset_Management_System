import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { BuildingOfficeIcon, UserIcon, CubeIcon, PlusIcon, PencilIcon, ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import CreateBaseModal from '../components/Bases/CreateBaseModal';
import EditBaseModal from '../components/Bases/EditBaseModal';
import CommanderHandoverModal from '../components/Bases/CommanderHandoverModal';
import api from '../config/api';

const Bases = () => {
  const { user, hasRole } = useAuth();
  const [selectedBase, setSelectedBase] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [baseToEdit, setBaseToEdit] = useState(null);

  // Fetch bases
  const { data: basesData, isLoading } = useQuery(
    'bases',
    async () => {
      const response = await api.get('/api/bases');
      return response.data;
    }
  );

  const handleEditBase = (base) => {
    setBaseToEdit(base);
    setShowEditModal(true);
  };

  const handleHandoverCommander = (base) => {
    setBaseToEdit(base);
    setShowHandoverModal(true);
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
          <h1 className="text-2xl font-semibold text-gray-900">Base Management</h1>
          <p className="text-gray-600">View and manage military bases across Indian Armed Forces</p>
        </div>
        {hasRole(['admin', 'base_commander']) && (
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add New Base
            </button>
          </div>
        )}
      </div>

      {/* Bases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {basesData?.bases?.map((base) => (
          <BaseCard 
            key={base.id} 
            base={base} 
            onClick={() => setSelectedBase(base)}
            onEdit={() => handleEditBase(base)}
            onHandover={() => handleHandoverCommander(base)}
            isUserBase={user?.baseId === base.id}
            canEdit={hasRole(['admin', 'base_commander'])}
          />
        ))}
      </div>

      {basesData?.bases?.length === 0 && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No bases found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No military bases are currently configured in the system.
          </p>
        </div>
      )}

      {/* Base Details Modal */}
      {selectedBase && (
        <BaseDetailsModal 
          base={selectedBase} 
          onClose={() => setSelectedBase(null)} 
        />
      )}

      {/* CRUD Modals */}
      <CreateBaseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <EditBaseModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        base={baseToEdit}
      />

      <CommanderHandoverModal
        isOpen={showHandoverModal}
        onClose={() => setShowHandoverModal(false)}
        base={baseToEdit}
      />
    </div>
  );
};

// Base Card Component
const BaseCard = ({ base, onClick, onEdit, onHandover, isUserBase, canEdit }) => {
  const handleCardClick = (e) => {
    // Prevent card click when clicking action buttons
    if (e.target.closest('.action-button')) {
      return;
    }
    onClick();
  };

  return (
    <div 
      className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200 ${
        isUserBase ? 'ring-2 ring-primary-500' : ''
      }`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center cursor-pointer flex-1" onClick={handleCardClick}>
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isUserBase ? 'bg-primary-100' : 'bg-gray-100'
              }`}>
                <BuildingOfficeIcon className={`h-6 w-6 ${
                  isUserBase ? 'text-primary-600' : 'text-gray-600'
                }`} />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {base.name}
                </h3>
                {isUserBase && (
                  <span className="badge-info text-xs">Your Base</span>
                )}
              </div>
              <p className="text-sm text-gray-500 font-mono">{base.code}</p>
              {/* India-specific info */}
              {(base.zone || base.command) && (
                <div className="mt-1">
                  {base.zone && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                      {base.zone}
                    </span>
                  )}
                  {base.command && (
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      {base.command}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          {canEdit && (
            <div className="flex space-x-2 ml-4">
              <button
                onClick={onEdit}
                className="action-button p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Base"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={onHandover}
                className="action-button p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                title="Commander Handover"
              >
                <ArrowPathRoundedSquareIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600">
            {base.location || 'Location not specified'}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <UserIcon className="h-5 w-5 mr-1" />
            <span>
              {base.commander_first_name && base.commander_last_name
                ? `${base.commander_first_name} ${base.commander_last_name}`
                : 'No commander assigned'
              }
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <CubeIcon className="h-5 w-5 mr-1" />
            <span>{base.total_assets || 0} assets</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Asset Types:</span>
            <span className="font-medium">{base.asset_types_count || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-500">Status:</span>
            <span className={`badge ${base.is_active ? 'badge-success' : 'badge-danger'}`}>
              {base.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Base Details Modal Component
const BaseDetailsModal = ({ base, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {base.name} Details
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-500">Base Code</dt>
                  <dd className="text-sm font-medium text-gray-900 font-mono">{base.code}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Location</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {base.location || 'Not specified'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Status</dt>
                  <dd>
                    <span className={`badge ${base.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {base.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Created</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {format(new Date(base.created_at), 'MMM d, yyyy')}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Command Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Command Information</h4>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-500">Commander</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {base.commander_first_name && base.commander_last_name
                      ? `${base.commander_first_name} ${base.commander_last_name}`
                      : 'No commander assigned'
                    }
                  </dd>
                </div>
                {base.commander_username && (
                  <div>
                    <dt className="text-sm text-gray-500">Username</dt>
                    <dd className="text-sm font-medium text-gray-900 font-mono">
                      @{base.commander_username}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Asset Summary */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Asset Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-900">
                  {base.asset_types_count || 0}
                </div>
                <div className="text-sm text-gray-500">Asset Types</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-900">
                  {base.total_assets || 0}
                </div>
                <div className="text-sm text-gray-500">Total Assets</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-900">-</div>
                <div className="text-sm text-gray-500">Active Assignments</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-900">-</div>
                <div className="text-sm text-gray-500">Pending Transfers</div>
              </div>
            </div>
          </div>
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

export default Bases;
