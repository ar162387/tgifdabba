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

  // Filter items to show all items in CMS (including inactive ones)
  const allItems = useMemo(() => {
    return items || []; // Show all items regardless of active status
  }, [items]);

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
      console.error('Menu save error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save menu';
      const invalidItems = error.response?.data?.invalidItemIds;
      
      if (invalidItems && invalidItems.length > 0) {
        toast.error(`Failed to save menu: Invalid or inactive items detected (${invalidItems.length} items)`);
      } else {
        toast.error(errorMessage);
      }
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
          items={allItems}
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
  // Initialize sections from existing menu or empty array
  const [sections, setSections] = useState(() => {
    if (existingMenu?.sections?.length > 0) {
      return existingMenu.sections.map(section => ({
        id: section.id || crypto.randomUUID(),
        name: section.name,
        itemIds: new Set(
          (section.itemIds || []).map(item => {
            // Ensure we always get a string ID
            const itemId = typeof item === 'string' ? item : item._id || item.id;
            console.log('Processing item ID:', itemId, 'from item:', item);
            return itemId;
          }).filter(Boolean) // Remove any undefined/null values
        )
      }));
    }
    return [];
  });
  
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  // Derived state
  const selectedSection = sections.find(s => s.id === selectedSectionId) || null;
  const checkedItemIds = new Set(selectedSection?.itemIds ?? []);

  // Check for overlapping items across sections
  const getOverlappingItems = () => {
    const itemSectionMap = new Map();
    const overlaps = [];
    
    sections.forEach(section => {
      Array.from(section.itemIds).forEach(itemId => {
        if (itemSectionMap.has(itemId)) {
          overlaps.push({
            itemId,
            itemName: items.find(item => item._id === itemId)?.name || 'Unknown Item',
            sections: [itemSectionMap.get(itemId), section.name]
          });
        } else {
          itemSectionMap.set(itemId, section.name);
        }
      });
    });
    
    return overlaps;
  };

  const overlappingItems = getOverlappingItems();

  // Section management functions
  const onAddSection = () => {
    const name = newSectionName.trim();
    if (!name) return;
    
    // Check for duplicate names
    if (sections.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Section name already exists');
      return;
    }
    
    const id = crypto.randomUUID();
    const section = { id, name, itemIds: new Set() };
    setSections(prev => [...prev, section]);
    setSelectedSectionId(id);
    setNewSectionName('');
    setIsCreating(false);
  };

  const onSelectSection = (id) => {
    setSelectedSectionId(id);
  };

  const onRemoveSection = (id) => {
    setSections(prev => prev.filter(s => s.id !== id));
    if (selectedSectionId === id) {
      setSelectedSectionId(null);
    }
  };

  const onToggleItem = (itemId, checked) => {
    if (!selectedSection) return;
    
    setSections(prev => prev.map(s => {
      if (s.id !== selectedSection.id) return s;
      const next = new Set(s.itemIds);
      checked ? next.add(itemId) : next.delete(itemId);
      return { ...s, itemIds: next };
    }));
  };

  const handleSave = () => {
    // Check for overlapping items before saving
    if (overlappingItems.length > 0) {
      const overlapMessage = overlappingItems.map(overlap => 
        `"${overlap.itemName}" appears in both "${overlap.sections[0]}" and "${overlap.sections[1]}" sections`
      ).join('\n');
      
      toast.error(
        `Please remove overlapping items before saving:\n${overlapMessage}`,
        { duration: 6000 }
      );
      return;
    }

    // Collect all item IDs from all sections for the items field (for backward compatibility)
    const allItemIds = sections.flatMap(section => Array.from(section.itemIds)).filter(Boolean);
    
    console.log('Debug - Sections before processing:', sections);
    console.log('Debug - All item IDs collected:', allItemIds);
    
    const processedSections = sections.map(s => ({
      id: s.id,
      name: s.name,
      itemIds: Array.from(s.itemIds).filter(Boolean) // Filter out any null/undefined values
    }));
    
    const menuData = {
      dayOfWeek: day || 'monday',
      items: allItemIds, // Array of item IDs for backward compatibility
      sections: processedSections
    };
    console.log('Sending menu data:', JSON.stringify(menuData, null, 2));
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
              {!selectedSection ? (
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-gray-500">Create or select a section to assign items.</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  <div className="mb-2 text-sm text-gray-600">
                    Assigning items to: <span className="font-medium">{selectedSection.name}</span>
                  </div>
                  {items.map(item => (
                    <label key={item._id} className={`flex items-center space-x-2 p-2 hover:bg-gray-50 rounded ${!item.active ? 'bg-gray-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checkedItemIds.has(item._id)}
                        onChange={(e) => onToggleItem(item._id, e.target.checked)}
                        className="rounded"
                      />
                      <span className={`text-sm ${!item.active ? 'text-gray-600' : ''}`}>
                        {item.name} - £{item.price}
                        {!item.active && <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-1 rounded">Inactive</span>}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Sections */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium">Menu Sections</h3>
                {!isCreating && (
                  <Button size="sm" onClick={() => setIsCreating(true)}>
                    <Plus size={16} className="mr-1" />
                    Add Section
                  </Button>
                )}
              </div>

              {/* Overlapping Items Warning */}
              {overlappingItems.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-800">
                        Overlapping Items Detected
                      </h4>
                      <div className="mt-1 text-sm text-yellow-700">
                        {overlappingItems.map((overlap, index) => (
                          <div key={index}>
                            <strong>"{overlap.itemName}"</strong> appears in both 
                            <strong> "{overlap.sections[0]}"</strong> and 
                            <strong> "{overlap.sections[1]}"</strong> sections
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-sm text-yellow-700">
                        Please remove overlapping items before saving the menu.
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Inline Section Creator */}
              {isCreating && (
                <div className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50">
                  <input
                    type="text"
                    placeholder="Section name"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && onAddSection()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2"
                    autoFocus
                  />
                  <div className="flex justify-end space-x-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      setIsCreating(false);
                      setNewSectionName('');
                    }}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={onAddSection}>
                      <Plus size={16} className="mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {/* Existing Sections */}
              <div className="space-y-3">
                {sections.map((section) => {
                  const sectionOverlaps = overlappingItems.filter(overlap => 
                    overlap.sections.includes(section.name)
                  );
                  
                  return (
                    <div 
                      key={section.id} 
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedSectionId === section.id 
                          ? 'border-orange-500 bg-orange-50' 
                          : sectionOverlaps.length > 0
                          ? 'border-yellow-300 bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => onSelectSection(section.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{section.name}</h4>
                            {sectionOverlaps.length > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {sectionOverlaps.length} overlap{sectionOverlaps.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {section.itemIds.size} items
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveSection(section.id);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {sections.length === 0 && !isCreating && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No sections created yet</p>
                    <p className="text-sm">Click "Add Section" to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={overlappingItems.length > 0}
              className={overlappingItems.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {existingMenu ? 'Update Menu' : 'Create Menu'}
              {overlappingItems.length > 0 && ' (Fix overlaps first)'}
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
            <p className="text-sm text-gray-600 mb-2">Sections ({menu.sections?.length || 0})</p>
            {menu.sections && menu.sections.length > 0 ? (
              <div className="space-y-1">
                {menu.sections.map((section, index) => (
                  <div key={index} className="text-sm text-gray-700">
                    {section.name} ({section.itemIds?.length || 0} items)
                  </div>
                ))}
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
              disabled={!menu.sections || menu.sections.length === 0 || menu.sections.every(section => !section.itemIds || section.itemIds.length === 0)}
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
