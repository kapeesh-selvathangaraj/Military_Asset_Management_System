import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { DocumentArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Reports = () => {
  const { user, hasRole } = useAuth();
  const [reportType, setReportType] = useState('asset-summary');
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [filters, setFilters] = useState({
    baseId: user?.role === 'base_commander' ? user.baseId : '',
    assetTypeId: ''
  });

  // Fetch bases for filter
  const { data: basesData } = useQuery(
    'bases',
    async () => {
      const response = await axios.get('/api/bases');
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
      const response = await axios.get('/api/assets/types');
      return response.data;
    }
  );

  // Fetch report data based on selected type
  const { data: reportData, isLoading } = useQuery(
    ['reports', reportType, dateRange, filters],
    async () => {
      const params = new URLSearchParams({
        type: reportType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
      });
      
      const response = await axios.get(`/api/reports?${params}`);
      return response.data;
    }
  );

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportReport = async (format) => {
    try {
      const params = new URLSearchParams({
        type: reportType,
        format,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
      });
      
      const response = await axios.get(`/api/reports/export?${params}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

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
          <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate and view asset management reports</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => exportReport('pdf')}
            className="btn-outline"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Export PDF
          </button>
          <button
            onClick={() => exportReport('csv')}
            className="btn-outline"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ChartBarIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Report Configuration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="form-label">Report Type</label>
            <select
              className="form-select"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="asset-summary">Asset Summary</option>
              <option value="asset-movement">Asset Movement</option>
              <option value="purchase-analysis">Purchase Analysis</option>
              <option value="transfer-report">Transfer Report</option>
              <option value="assignment-report">Assignment Report</option>
              <option value="expenditure-report">Expenditure Report</option>
            </select>
          </div>
          
          <div>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
            />
          </div>
          
          <div>
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
            />
          </div>
          
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
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {reportData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {reportData.summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(reportData.summary).map(([key, value]) => (
                <div key={key} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary-100 rounded-md flex items-center justify-center">
                          <ChartBarIcon className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {typeof value === 'number' ? value.toLocaleString() : value}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            {reportData.chartData?.barChart && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {reportData.chartData.barChart.title || 'Asset Distribution'}
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.chartData.barChart.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Pie Chart */}
            {reportData.chartData?.pieChart && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {reportData.chartData.pieChart.title || 'Asset Status Distribution'}
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.chartData.pieChart.data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reportData.chartData.pieChart.data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Line Chart */}
          {reportData.chartData?.lineChart && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {reportData.chartData.lineChart.title || 'Trend Analysis'}
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.chartData.lineChart.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Data Table */}
          {reportData.tableData && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {reportData.tableData.title || 'Detailed Report Data'}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      {reportData.tableData.columns.map((column) => (
                        <th key={column.key} className="table-header-cell">
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {reportData.tableData.rows.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {reportData.tableData.columns.map((column) => (
                          <td key={column.key} className="table-cell">
                            {column.type === 'date' && row[column.key]
                              ? format(new Date(row[column.key]), 'MMM d, yyyy')
                              : column.type === 'currency' && row[column.key]
                              ? `$${row[column.key].toLocaleString()}`
                              : row[column.key] || '-'
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Data State */}
      {!reportData && !isLoading && (
        <div className="bg-white shadow rounded-lg p-12">
          <div className="text-center">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No report data</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select a report type and date range to generate a report.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
