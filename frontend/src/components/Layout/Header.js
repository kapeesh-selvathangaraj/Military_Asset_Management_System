import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ setSidebarOpen, pageTitle }) => {
  const { user, logout, getUserFullName, getRoleDisplayName } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userNavigation = [
    {
      name: 'Your Profile',
      href: '/profile',
      icon: UserCircleIcon,
      onClick: () => navigate('/profile')
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Cog6ToothIcon,
      onClick: () => navigate('/settings')
    },
    {
      name: 'Sign out',
      href: '#',
      icon: ArrowRightOnRectangleIcon,
      onClick: handleLogout
    }
  ];

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50">
      {/* Mobile menu button */}
      <button
        type="button"
        className="px-4 border-r border-gray-200/50 text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all duration-200 md:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Desktop sidebar spacer */}
      <div className="hidden md:block md:w-64 md:flex-shrink-0" />

      <div className="flex-1 px-4 flex justify-between items-center">
        {/* Page title */}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900">
            {pageTitle}
          </h1>
        </div>

        <div className="ml-4 flex items-center md:ml-6">
          {/* Notifications button */}
          <button
            type="button"
            className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Profile dropdown */}
          <Menu as="div" className="ml-3 relative">
            <div>
              <Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-sm">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="ml-3 hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-700">
                    {getUserFullName()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getRoleDisplayName()}
                  </p>
                </div>
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                {/* User info in mobile */}
                <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                  <p className="text-sm font-medium text-gray-900">
                    {getUserFullName()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getRoleDisplayName()}
                  </p>
                  {user?.baseName && (
                    <p className="text-xs text-gray-400">
                      {user.baseName}
                    </p>
                  )}
                </div>

                {userNavigation.map((item) => (
                  <Menu.Item key={item.name}>
                    {({ active }) => (
                      <button
                        onClick={item.onClick}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
};

export default Header;
