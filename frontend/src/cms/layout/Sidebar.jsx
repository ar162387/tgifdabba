import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Calendar, 
  ShoppingCart, 
  Users,
  ChefHat
} from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    {
      path: 'dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard'
    },
    {
      path: 'items',
      icon: Package,
      label: 'Items'
    },
    {
      path: 'daily-menu',
      icon: Calendar,
      label: 'Daily Menu'
    },
    {
      path: 'orders',
      icon: ShoppingCart,
      label: 'Orders'
    },
    {
      path: 'contacts',
      icon: Users,
      label: 'Contacts'
    }
  ];

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <ChefHat size={32} className="text-orange-500" />
          <span className="text-xl font-bold text-gray-900">TGIF Dabba</span>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-orange-100 text-orange-700 border-r-2 border-orange-500'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
