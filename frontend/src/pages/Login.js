import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  ShieldCheckIcon,
  UserIcon,
  LockClosedIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { login, loading, error } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const onSubmit = async (data) => {
    const result = await login(data);
    if (!result.success) {
      setError('root', { message: result.error });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-300">
            <ShieldCheckIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Military Asset Management
          </h1>
          <p className="text-blue-300 text-lg font-medium mb-2">
            Secure Access Portal
          </p>
          <div className="text-gray-400 text-sm">
            {currentTime.toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-200 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    className={`block w-full pl-10 pr-3 py-3 border-0 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20 transition-all duration-200 ${
                      errors.username ? 'ring-2 ring-red-400' : ''
                    }`}
                    placeholder="Enter your username"
                    {...register('username', {
                      required: 'Username is required',
                      minLength: {
                        value: 3,
                        message: 'Username must be at least 3 characters'
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9_@.]+$/,
                        message: 'Username can contain letters, numbers, underscores, @ and .'
                      }
                    })}
                  />
                </div>
                {errors.username && (
                  <p className="mt-2 text-sm text-red-400 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`block w-full pl-10 pr-12 py-3 border-0 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20 transition-all duration-200 ${
                      errors.password ? 'ring-2 ring-red-400' : ''
                    }`}
                    placeholder="Enter your password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-white transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-white" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-white" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-400 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            {/* Error Message */}
            {(error || errors.root) && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/50 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-200 font-medium">
                      {error || errors.root?.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {(isSubmitting || loading) ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-3">Authenticating...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <ShieldCheckIcon className="h-5 w-5 mr-2" />
                    Secure Sign In
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Demo Credentials */}
        <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-blue-200 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            Demo Credentials
          </h3>
          <div className="space-y-3 text-sm">
            <div className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors duration-200">
              <div className="text-blue-300 font-medium">🔧 Administrator</div>
              <div className="text-gray-300 font-mono">admin / password123</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors duration-200">
              <div className="text-blue-300 font-medium">⭐ Base Commander</div>
              <div className="text-gray-300 font-mono">cmd_liberty / password123</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors duration-200">
              <div className="text-blue-300 font-medium">📦 Logistics Officer</div>
              <div className="text-gray-300 font-mono">log_officer1 / password123</div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            🔒 This is a secure military system. All access is monitored and logged.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
