import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  XMarkIcon,
  HomeIcon,
  ShoppingCartIcon,
  ArrowsRightLeftIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, hasAnyRole } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      roles: ['admin', 'base_commander', 'logistics_officer']
    },
    {
      name: 'Purchases',
      href: '/purchases',
      icon: ShoppingCartIcon,
      roles: ['admin', 'base_commander', 'logistics_officer']
    },
    {
      name: 'Transfers',
      href: '/transfers',
      icon: ArrowsRightLeftIcon,
      roles: ['admin', 'base_commander', 'logistics_officer']
    },
    {
      name: 'Assignments',
      href: '/assignments',
      icon: ClipboardDocumentListIcon,
      roles: ['admin', 'base_commander']
    },
    {
      name: 'Assets',
      href: '/assets',
      icon: CubeIcon,
      roles: ['admin', 'base_commander', 'logistics_officer']
    },
    {
      name: 'Bases',
      href: '/bases',
      icon: BuildingOfficeIcon,
      roles: ['admin', 'base_commander', 'logistics_officer']
    },
    {
      name: 'Users',
      href: '/users',
      icon: UserGroupIcon,
      roles: ['admin', 'base_commander']
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: ChartBarIcon,
      roles: ['admin', 'base_commander']
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: UserIcon,
      roles: ['admin', 'base_commander', 'logistics_officer']
    }
  ];

  const filteredNavigation = navigation.filter(item => 
    hasAnyRole(item.roles)
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-gray-900 to-slate-900">
      {/* Logo and title */}
      <div className="flex items-center flex-shrink-0 px-4 py-6 border-b border-gray-700/50">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">🛡️</span>
            </div>
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-bold text-white">
              Military Assets
            </h1>
            <p className="text-xs text-gray-300">Management System</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-gray-700/50">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-blue-300 truncate">
                {user?.role === 'admin' && '🔧 Administrator'}
                {user?.role === 'base_commander' && '⭐ Base Commander'}
                {user?.role === 'logistics_officer' && '📦 Logistics Officer'}
              </p>
              {user?.baseName && (
                <p className="text-xs text-gray-400 truncate">
                  {user.baseName}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:scale-105 hover:shadow-md'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200 ${
                isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-300'
              }`} />
              <span className="truncate">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-700/50 bg-gray-800/30">
        <p className="text-xs text-gray-400 text-center font-medium">
          Military Asset Management System
        </p>
        <p className="text-xs text-gray-500 text-center mt-1">
          v1.0.0 • Secure & Reliable
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-40">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
            <div className="flex-shrink-0 w-14">
              {/* Force sidebar to shrink to fit close icon */}
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
