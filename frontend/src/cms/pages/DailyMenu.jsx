import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, Plus, Edit, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useDailyMenus, useMenuItems, useCreateDailyMenu, useUpdateDailyMenu, usePublishDailyMenu } from '../hooks/useDailyMenu';
import toast from 'react-hot-toast';

const DailyMenu = () => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Memoized days of week
  const daysOfWeek = useMemo(() => [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ], []);

  // TanStack Query hooks
  const { data: dailyMenus = [], isLoading: menusLoading, error: menusError } = useDailyMenus();
  const { data: items = [], isLoading: itemsLoading, error: itemsError } = useMenuItems();
  const createMenuMutation = useCreateDailyMenu();
  const updateMenuMutation = useUpdateDailyMenu();
  const publishMenuMutation = usePublishDailyMenu();

  const isLoading = menusLoading || itemsLoading;
  const error = menusError || itemsError;

  // Memoized utility functions
  const getMenuForDay = useCallback((day) => {
    return dailyMenus.find(menu => menu.dayOfWeek === day);
  }, [dailyMenus]);

  // Memoized event handlers
  const handleEditDay = useCallback((day) => {
    setSelectedDay(day);
    setIsEditing(true);
  }, []);

  const handleSaveMenu = useCallback(async (dayData) => {
    try {
      const existingMenu = getMenuForDay(dayData.dayOfWeek);
      
      if (existingMenu) {
        await updateMenuMutation.mutateAsync({
          id: existingMenu._id,
          data: dayData
        });
        toast.success('Menu updated successfully');
      } else {
        await createMenuMutation.mutateAsync(dayData);
        toast.success('Menu created successfully');
      }
      
      setIsEditing(false);
      setSelectedDay(null);
    } catch (error) {
      toast.error('Failed to save menu');
    }
  }, [getMenuForDay, updateMenuMutation, createMenuMutation]);

  const handlePublishMenu = useCallback(async (menuId) => {
    try {
      await publishMenuMutation.mutateAsync(menuId);
      toast.success('Menu published successfully');
    } catch (error) {
      toast.error('Failed to publish menu');
    }
  }, [publishMenuMutation]);

  // Show skeleton loaders while loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Daily Menu</h1>
          <Button disabled>
            <Plus size={20} className="mr-2" />
            Manage Menu
          </Button>
        </div>
        
        {/* Days Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 7 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load menu data</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Daily Menu</h1>
        <Button onClick={() => setIsEditing(true)}>
          <Plus size={20} className="mr-2" />
          Manage Menu
        </Button>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {daysOfWeek.map((day) => (
          <DayCard
            key={day}
            day={day}
            menu={getMenuForDay(day)}
            onEditDay={handleEditDay}
            onPublishMenu={handlePublishMenu}
          />
        ))}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <MenuEditModal
          day={selectedDay}
          items={items}
          existingMenu={selectedDay ? getMenuForDay(selectedDay) : null}
          onSave={handleSaveMenu}
          onClose={() => {
            setIsEditing(false);
            setSelectedDay(null);
          }}
        />
      )}
    </div>
  );
};

// Menu Edit Modal Component
const MenuEditModal = ({ day, items, existingMenu, onSave, onClose }) => {
  const [selectedItems, setSelectedItems] = useState(
    existingMenu?.items?.map(item => item._id) || []
  );
  const [sections, setSections] = useState(
    existingMenu?.sections || []
  );

  const handleItemToggle = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const addSection = () => {
    setSections(prev => [...prev, { name: '', items: [] }]);
  };

  const updateSection = (index, field, value) => {
    setSections(prev => prev.map((section, i) => 
      i === index ? { ...section, [field]: value } : section
    ));
  };

  const removeSection = (index) => {
    setSections(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const menuData = {
      dayOfWeek: day || 'monday',
      items: selectedItems,
      sections: sections.filter(section => section.name.trim())
    };
    onSave(menuData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-900 bg-opacity-20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {existingMenu ? `Edit ${day} Menu` : 'Create Daily Menu'}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Items Selection */}
            <div>
              <h3 className="text-lg font-medium mb-3">Select Items</h3>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {items.map(item => (
                  <label key={item._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item._id)}
                      onChange={() => handleItemToggle(item._id)}
                      className="rounded"
                    />
                    <span className="text-sm">{item.name} - ${item.price}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sections */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium">Menu Sections</h3>
                <Button size="sm" onClick={addSection}>
                  <Plus size={16} className="mr-1" />
                  Add Section
                </Button>
              </div>
              <div className="space-y-3">
                {sections.map((section, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <input
                      type="text"
                      placeholder="Section name"
                      value={section.name}
                      onChange={(e) => updateSection(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {section.items.length} items
                      </span>
                      <button
                        onClick={() => removeSection(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {existingMenu ? 'Update Menu' : 'Create Menu'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoized Day Card Component
const DayCard = React.memo(({ day, menu, onEditDay, onPublishMenu }) => {
  const isPublished = menu?.published;
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 capitalize">
          {day}
        </h3>
        <div className="flex items-center space-x-2">
          {isPublished && (
            <CheckCircle size={20} className="text-green-500" />
          )}
          <button
            onClick={() => onEditDay(day)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit size={16} />
          </button>
        </div>
      </div>

      {menu ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 mb-2">Items ({menu.items.length})</p>
            {menu.items.length > 0 ? (
              <div className="space-y-1">
                {menu.items.slice(0, 3).map((item, index) => (
                  <div key={index} className="text-sm text-gray-700 truncate">
                    {item.name}
                  </div>
                ))}
                {menu.items.length > 3 && (
                  <div className="text-sm text-gray-500">
                    +{menu.items.length - 3} more
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No items</p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Sections ({menu.sections.length})</p>
            {menu.sections.length > 0 ? (
              <div className="space-y-1">
                {menu.sections.slice(0, 2).map((section, index) => (
                  <div key={index} className="text-sm text-gray-700">
                    {section.name} ({section.items.length})
                  </div>
                ))}
                {menu.sections.length > 2 && (
                  <div className="text-sm text-gray-500">
                    +{menu.sections.length - 2} more
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No sections</p>
            )}
          </div>

          <div className="pt-3 border-t">
            <Button
              size="sm"
              variant={isPublished ? "outline" : "default"}
              onClick={() => onPublishMenu(menu._id)}
              disabled={menu.items.length === 0}
            >
              {isPublished ? 'Published' : 'Publish'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar size={32} className="text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-3">No menu set</p>
          <Button size="sm" onClick={() => onEditDay(day)}>
            Create Menu
          </Button>
        </div>
      )}
    </div>
  );
});

export default DailyMenu;
