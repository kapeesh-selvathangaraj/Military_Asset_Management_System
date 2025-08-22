import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import api from '../../config/api';
import LoadingSpinner from '../UI/LoadingSpinner';

const CreateBaseModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    commander_id: '',
    zone: '',
    command: '',
    base_type: '',
    status: 'active',
    contact_info: {
      phone: '',
      email: '',
      address: ''
    }
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

  // Create base mutation
  const createBaseMutation = useMutation(
    async (baseData) => {
      const response = await api.post('/api/bases', baseData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('bases');
        toast.success('Base created successfully!');
        onClose();
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create base');
      }
    }
  );

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      location: '',
      commander_id: '',
      zone: '',
      command: '',
      base_type: '',
      status: 'active',
      contact_info: {
        phone: '',
        email: '',
        address: ''
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createBaseMutation.mutate(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('contact_')) {
      const contactField = name.replace('contact_', '');
      setFormData(prev => ({
        ...prev,
        contact_info: {
          ...prev.contact_info,
          [contactField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Create New Base
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Basic Information</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Base Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Base Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., INS-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Mumbai, Maharashtra"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Base Commander
                </label>
                <select
                  name="commander_id"
                  value={formData.commander_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Commander</option>
                  {usersData?.users?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.username})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* India-Specific Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Military Organization</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Military Zone
                </label>
                <select
                  name="zone"
                  value={formData.zone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Zone</option>
                  <option value="Northern Command">Northern Command</option>
                  <option value="Western Command">Western Command</option>
                  <option value="Central Command">Central Command</option>
                  <option value="Eastern Command">Eastern Command</option>
                  <option value="Southern Command">Southern Command</option>
                  <option value="South Western Command">South Western Command</option>
                  <option value="Western Naval Command">Western Naval Command</option>
                  <option value="Eastern Naval Command">Eastern Naval Command</option>
                  <option value="Southern Naval Command">Southern Naval Command</option>
                  <option value="Western Air Command">Western Air Command</option>
                  <option value="Central Air Command">Central Air Command</option>
                  <option value="Eastern Air Command">Eastern Air Command</option>
                  <option value="Southern Air Command">Southern Air Command</option>
                  <option value="South Western Air Command">South Western Air Command</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Service Branch
                </label>
                <select
                  name="command"
                  value={formData.command}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Service</option>
                  <option value="Indian Army">Indian Army</option>
                  <option value="Indian Navy">Indian Navy</option>
                  <option value="Indian Air Force">Indian Air Force</option>
                  <option value="Indian Coast Guard">Indian Coast Guard</option>
                  <option value="Border Security Force">Border Security Force</option>
                  <option value="Central Reserve Police Force">Central Reserve Police Force</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Base Type
                </label>
                <select
                  name="base_type"
                  value={formData.base_type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Type</option>
                  <option value="Headquarters">Headquarters</option>
                  <option value="Training Center">Training Center</option>
                  <option value="Operational Base">Operational Base</option>
                  <option value="Naval Base">Naval Base</option>
                  <option value="Air Base">Air Base</option>
                  <option value="Artillery Base">Artillery Base</option>
                  <option value="Logistics Hub">Logistics Hub</option>
                  <option value="Research Facility">Research Facility</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="active">Active</option>
                  <option value="under_construction">Under Construction</option>
                  <option value="decommissioned">Decommissioned</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_info.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="+91-XXX-XXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_info.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="base@mil.in"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  name="contact_address"
                  value={formData.contact_info.address}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Full address"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createBaseMutation.isLoading}
              className="btn-primary"
            >
              {createBaseMutation.isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Creating...
                </>
              ) : (
                'Create Base'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBaseModal;
