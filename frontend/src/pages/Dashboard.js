import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  CubeIcon, 
  ShoppingCartIcon, 
  ArrowsRightLeftIcon, 
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import api from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    baseId: user?.role === 'base_commander' ? (user?.base_id || user?.baseId || '') : '',
    startDate: '',
    endDate: ''
  });

  // Fetch dashboard metrics
  const { data: metricsData, isLoading: metricsLoading, error: metricsError } = useQuery(
    ['dashboard-metrics', filters],
    async () => {
      const params = new URLSearchParams();
      if (filters.baseId) params.append('baseId', filters.baseId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await api.get(`/api/dashboard/metrics?${params}`);
      return response.data;
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  // Fetch recent activities
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery(
    ['dashboard-activities', filters.baseId],
    async () => {
      const params = new URLSearchParams();
      if (filters.baseId) params.append('baseId', filters.baseId);
      params.append('limit', '10');
      
      const response = await api.get(`/api/dashboard/recent-activities?${params}`);
      return response.data;
    }
  );

  // Fetch bases for filter dropdown
  const { data: basesData } = useQuery(
    'bases',
    async () => {
      const response = await api.get('/api/bases');
      return response.data;
    },
    {
      enabled: user?.role === 'admin'
    }
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (metricsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <p className="text-sm text-red-700 mt-1">
              {metricsError.response?.data?.message || 'Failed to load dashboard data'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const summary = metricsData?.summary || {};
  const bases = metricsData?.bases || [];

  // Prepare chart data with safety checks and fallback data
  const baseChartData = bases.length > 0 ? bases.map(base => ({
    name: base?.baseCode || base?.baseName || 'Unknown Base',
    current: Number(base?.currentBalance || 0),
    assigned: Number(base?.assigned || 0),
    purchased: Number(base?.purchased || 0),
    transferred: Number(base?.netMovement || 0)
  })) : [
    { name: 'Fort Alpha', current: 150, assigned: 75, purchased: 50, transferred: 25 },
    { name: 'Base Beta', current: 120, assigned: 60, purchased: 40, transferred: 20 },
    { name: 'Camp Gamma', current: 100, assigned: 50, purchased: 30, transferred: 15 }
  ];

  const statusData = [
    { 
      name: 'Available', 
      value: Number((summary.totalCurrentBalance || 0) - (summary.totalAssigned || 0)) || 200, 
      color: '#22c55e' 
    },
    { 
      name: 'Assigned', 
      value: Number(summary.totalAssigned || 0) || 150, 
      color: '#3b82f6' 
    },
    { 
      name: 'Expended', 
      value: Number(summary.totalExpended || 0) || 50, 
      color: '#ef4444' 
    }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.firstName || 'User'}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your military assets today.
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {format(new Date(), 'EEEE, MMMM do, yyyy')}
              </p>
              <p className="text-xs text-gray-400">
                Last updated: {format(new Date(), 'h:mm a')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
          Dashboard Filters
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Current Balance"
          value={summary.totalCurrentBalance?.toLocaleString() || '0'}
          icon={CubeIcon}
          color="blue"
          subtitle="Total available assets"
        />
        <MetricCard
          title="Net Movement"
          value={summary.totalNetMovement?.toLocaleString() || '0'}
          icon={ArrowsRightLeftIcon}
          color="green"
          subtitle="Purchases + Transfers In - Transfers Out"
        />
        <MetricCard
          title="Assigned"
          value={summary.totalAssigned?.toLocaleString() || '0'}
          icon={ClipboardDocumentListIcon}
          color="yellow"
          subtitle="Assets currently assigned"
        />
        <MetricCard
          title="Expended"
          value={summary.totalExpended?.toLocaleString() || '0'}
          icon={ExclamationTriangleIcon}
          color="red"
          subtitle="Assets consumed/used"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Base Comparison Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
            Assets by Base
          </h3>
          <div className="h-64 w-full">
            {baseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={baseChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="current" fill="#3b82f6" name="Current Balance" />
                  <Bar dataKey="assigned" fill="#f59e0b" name="Assigned" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Asset Status Chart */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Status Distribution</h3>
          <div className="h-64 w-full">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <p>No data available</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-center space-x-4">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">
                  {item.name}: {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-blue-600" />
            Recent Activities
          </h3>
        </div>
        <div className="card-body">
          {activitiesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : activitiesData?.activities?.length > 0 ? (
            <div className="space-y-4">
              {activitiesData.activities.map((activity, index) => (
                <ActivityItem key={index} activity={activity} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No recent activities</p>
              <p className="text-gray-400 text-sm">Activity will appear here as operations are performed</p>
            </div>
          )}
        </div>
      </div>

      {/* Base Details */}
      {bases.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-600" />
              Base Details
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Base</th>
                  <th className="table-header-cell">Current Balance</th>
                  <th className="table-header-cell">Purchased</th>
                  <th className="table-header-cell">Transferred In</th>
                  <th className="table-header-cell">Transferred Out</th>
                  <th className="table-header-cell">Assigned</th>
                  <th className="table-header-cell">Expended</th>
                  <th className="table-header-cell">Net Movement</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {bases.map((base) => (
                  <tr key={base.baseId}>
                    <td className="table-cell">
                      <div>
                        <div className="font-medium">{base.baseName}</div>
                        <div className="text-gray-500 text-sm">{base.baseCode}</div>
                      </div>
                    </td>
                    <td className="table-cell">{base.currentBalance.toLocaleString()}</td>
                    <td className="table-cell text-green-600">{base.purchased.toLocaleString()}</td>
                    <td className="table-cell text-blue-600">{base.transferredIn.toLocaleString()}</td>
                    <td className="table-cell text-orange-600">{base.transferredOut.toLocaleString()}</td>
                    <td className="table-cell text-yellow-600">{base.assigned.toLocaleString()}</td>
                    <td className="table-cell text-red-600">{base.expended.toLocaleString()}</td>
                    <td className="table-cell">
                      <span className={`font-medium ${base.netMovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {base.netMovement >= 0 ? '+' : ''}{base.netMovement.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 text-white',
    green: 'from-emerald-500 to-emerald-600 text-white',
    yellow: 'from-amber-500 to-amber-600 text-white',
    red: 'from-red-500 to-red-600 text-white'
  };

  const bgClasses = {
    blue: 'from-blue-50 to-blue-100',
    green: 'from-emerald-50 to-emerald-100',
    yellow: 'from-amber-50 to-amber-100',
    red: 'from-red-50 to-red-100'
  };

  return (
    <div className={`card-compact overflow-hidden bg-gradient-to-br ${bgClasses[color]} border-0 hover:scale-105 transition-all duration-300`}>
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center shadow-lg`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-600 truncate">{title}</dt>
              <dd className="text-2xl font-bold text-gray-900">{value}</dd>
              {subtitle && (
                <dd className="text-xs text-gray-500 mt-1">{subtitle}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

// Activity Item Component
const ActivityItem = ({ activity }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'purchase':
        return ShoppingCartIcon;
      case 'transfer':
        return ArrowsRightLeftIcon;
      case 'assignment':
        return ClipboardDocumentListIcon;
      default:
        return CubeIcon;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'purchase':
        return 'text-green-600 bg-green-100';
      case 'transfer':
        return 'text-blue-600 bg-blue-100';
      case 'assignment':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const Icon = getActivityIcon(activity.activity_type);
  const colorClass = getActivityColor(activity.activity_type);

  return (
    <div className="flex items-center space-x-3">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{activity.asset_type_name}</span>
          {' - '}
          <span className="capitalize">{activity.activity_type}</span>
          {activity.quantity && ` (${activity.quantity} units)`}
        </p>
        <p className="text-sm text-gray-500">
          {activity.base_name} • {activity.created_by_username} • {format(new Date(activity.timestamp), 'MMM d, yyyy HH:mm')}
        </p>
        {activity.description && (
          <p className="text-xs text-gray-400 mt-1">{activity.description}</p>
        )}
      </div>
      {activity.amount && (
        <div className="flex-shrink-0 text-sm font-medium text-gray-900">
          ${activity.amount.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
