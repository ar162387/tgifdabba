import React from 'react';
import { FileText, Package, Users, ShoppingCart } from 'lucide-react';

const EmptyState = ({ 
  type = 'default', 
  title = 'No data found', 
  description = 'There are no items to display at the moment.',
  action = null 
}) => {
  const icons = {
    default: FileText,
    items: Package,
    orders: ShoppingCart,
    contacts: Users,
  };

  const Icon = icons[type] || icons.default;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon size={32} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-center mb-6 max-w-sm">{description}</p>
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
