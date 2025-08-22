import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { XMarkIcon, UserIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../../config/api';
import LoadingSpinner from '../UI/LoadingSpinner';

const CommanderHandoverModal = ({ isOpen, onClose, base }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    new_commander_id: '',
    handover_date: new Date().toISOString().split('T')[0],
    handover_notes: '',
    ceremony_details: '',
    witnesses: ''
  });

  // Fetch users for commander selection
  const { data: usersData } = useQuery(
    'users-for-commander',
    async () => {
      const response = await api.get('/api/users?role=base_commander');
      return response.data;
    },
    { enabled: isOpen }
  );

  // Fetch handover history
  const { data: handoverHistory } = useQuery(
    ['commander-handovers', base?.id],
    async () => {
      const response = await api.get(`/api/bases/${base.id}/commander-handovers`);
      return response.data;
    },
    { enabled: isOpen && base?.id }
  );

  // Commander handover mutation
  const handoverMutation = useMutation(
    async (handoverData) => {
      const response = await api.post(`/api/bases/${base.id}/commander-handover`, handoverData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('bases');
        queryClient.invalidateQueries(['commander-handovers', base.id]);
        toast.success('Commander handover completed successfully!');
        onClose();
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to complete handover');
      }
    }
  );

  const resetForm = () => {
    setFormData({
      new_commander_id: '',
      handover_date: new Date().toISOString().split('T')[0],
      handover_notes: '',
      ceremony_details: '',
      witnesses: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handoverMutation.mutate(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen || !base) return null;

  const currentCommander = base.commander_first_name && base.commander_last_name 
    ? `${base.commander_first_name} ${base.commander_last_name}` 
    : 'No current commander';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Commander Handover - {base.name}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Handover Form */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">New Commander Handover</h4>
              
              {/* Current Commander Info */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-900">Current Commander</span>
                </div>
                <p className="text-blue-800 font-medium mt-1">{currentCommander}</p>
                {base.commander_username && (
                  <p className="text-blue-600 text-sm">@{base.commander_username}</p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Commander *
                  </label>
                  <select
                    name="new_commander_id"
                    value={formData.new_commander_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select New Commander</option>
                    {usersData?.users?.filter(user => user.id !== base.commander_id).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({user.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Handover Date *
                  </label>
                  <input
                    type="date"
                    name="handover_date"
                    value={formData.handover_date}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Handover Notes
                  </label>
                  <textarea
                    name="handover_notes"
                    value={formData.handover_notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Key information, ongoing operations, important contacts, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ceremony Details
                  </label>
                  <textarea
                    name="ceremony_details"
                    value={formData.ceremony_details}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ceremony location, time, special arrangements, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Witnesses
                  </label>
                  <input
                    type="text"
                    name="witnesses"
                    value={formData.witnesses}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Names of witnessing officers"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={handoverMutation.isLoading}
                    className="btn-primary"
                  >
                    {handoverMutation.isLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Processing...
                      </>
                    ) : (
                      'Complete Handover'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Handover History */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Handover History</h4>
              
              {handoverHistory?.handovers?.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {handoverHistory.handovers.map((handover, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {format(new Date(handover.handover_date), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {handover.from_commander} → {handover.to_commander}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {handover.handover_notes && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-700">{handover.handover_notes}</p>
                        </div>
                      )}
                      
                      {handover.ceremony_details && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Ceremony:</span> {handover.ceremony_details}
                          </p>
                        </div>
                      )}
                      
                      {handover.witnesses && (
                        <div className="mt-1">
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Witnesses:</span> {handover.witnesses}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No handover history</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No previous commander handovers recorded for this base.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommanderHandoverModal;
