import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

const MainContent = () => {
  const location = useLocation();
  
  // Get page title from pathname
  const getPageTitle = (pathname) => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const page = pathSegments[pathSegments.length - 1];
    
    const titles = {
      dashboard: 'Dashboard',
      items: 'Items',
      'daily-menu': 'Daily Menu',
      orders: 'Orders',
      contacts: 'Contacts',
      profile: 'Profile'
    };
    
    return titles[page] || 'CMS';
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="flex-1 flex flex-col">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <span className="text-gray-500">CMS</span>
            </li>
            <li className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-900 font-medium">{pageTitle}</span>
            </li>
          </ol>
        </nav>
      </div>
      
      {/* Page Content */}
      <main className="flex-1 p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};

export default MainContent;
