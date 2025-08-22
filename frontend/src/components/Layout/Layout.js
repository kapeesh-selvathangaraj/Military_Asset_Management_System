import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname.split('/')[1];
    const titles = {
      dashboard: 'Dashboard',
      purchases: 'Purchases',
      transfers: 'Transfers',
      assignments: 'Assignments & Expenditures',
      users: 'User Management',
      bases: 'Base Management',
      assets: 'Asset Management',
      profile: 'Profile',
    };
    return titles[path] || 'Military Asset Management';
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Sidebar */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out md:ml-64">
        {/* Header */}
        <Header 
          setSidebarOpen={setSidebarOpen}
          pageTitle={getPageTitle()}
        />

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="w-full space-y-6">
                <Outlet />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
