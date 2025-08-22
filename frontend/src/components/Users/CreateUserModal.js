import React, { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import api from '../../config/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../UI/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Modal component for creating a new user
 * Requires the current user to be an admin (enforced by backend).
 */
const CreateUserModal = ({ onClose, onSuccess }) => {
  const { hasRole } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'logistics_officer',
    baseId: ''
  });

  // Fetch bases for select
  const { data: basesData, isLoading: basesLoading } = useQuery(
    'bases-select',
    async () => {
      const res = await api.get('/api/bases');
      return res.data.bases;
    },
    {
      enabled: hasRole('admin')
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Mutation to register user via backend
  const mutation = useMutation(
    async () => {
      await api.post('/api/auth/register', {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        role: formData.role,
        baseId: formData.baseId || null
      });
    },
    {
      onSuccess: () => {
        toast.success('User created successfully');
        onSuccess();
      },
      onError: (err) => {
        const message = err.response?.data?.message || 'Failed to create user';
        toast.error(message);
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Create New User</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
          </div>
          <div>
            <label className="form-label">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-select"
            >
              <option value="admin">Administrator</option>
              <option value="base_commander">Base Commander</option>
              <option value="logistics_officer">Logistics Officer</option>
            </select>
          </div>
          <div>
            <label className="form-label">Base</label>
            {basesLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <select
                name="baseId"
                value={formData.baseId}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">None</option>
                {basesData?.map((base) => (
                  <option key={base.id} value={base.id}>
                    {base.name} ({base.code})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="btn-primary disabled:opacity-50"
            >
              {mutation.isLoading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
