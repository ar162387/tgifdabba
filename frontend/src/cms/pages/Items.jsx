import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, X, Upload, Image as ImageIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCheckbox } from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton, FormSkeleton } from '../components/ui/Skeleton';
import { useItems, useCreateItem, useUpdateItem, useDeleteItem, useToggleItemStatus, useItemUsage, useBulkDeleteItems } from '../hooks/useItems';
import toast from 'react-hot-toast';

const Items = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [allergens, setAllergens] = useState([]);
  const [newAllergen, setNewAllergen] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const fileInputRef = useRef(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Simple query parameters without search
  const queryParams = useMemo(() => ({
    page: 1,
    limit: 1000, // Get all items for client-side filtering
  }), []);

  // TanStack Query hooks
  const { data: itemsData, isLoading, error, refetch } = useItems(queryParams);
  const createItemMutation = useCreateItem();
  const updateItemMutation = useUpdateItem();
  const deleteItemMutation = useDeleteItem();
  const toggleStatusMutation = useToggleItemStatus();
  const bulkDeleteMutation = useBulkDeleteItems();
  const { data: itemUsage, isLoading: usageLoading } = useItemUsage(deleteConfirmItem?._id);

  // Update allItems when data changes
  useEffect(() => {
    if (itemsData?.items) {
      setAllItems(itemsData.items);
    }
  }, [itemsData?.items]);

  // Client-side filtering - no re-renders that affect input focus
  useEffect(() => {
    let filtered = allItems;
    
    // Apply status filter first
    if (statusFilter) {
      filtered = filtered.filter(item => item.active.toString() === statusFilter);
    }
    
    // Then apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        (item.allergens && item.allergens.some(allergen => 
          allergen.toLowerCase().includes(searchLower)
        ))
      );
    }
    
    setFilteredItems(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [allItems, searchTerm, statusFilter]);

  // Memoized items and pagination data
  const items = useMemo(() => filteredItems, [filteredItems]);
  const totalPages = useMemo(() => Math.ceil(filteredItems.length / itemsPerPage), [filteredItems.length, itemsPerPage]);

  // Debug logging
  console.log('Items pagination debug:', {
    allItemsLength: allItems.length,
    filteredItemsLength: filteredItems.length,
    currentPage,
    itemsPerPage,
    totalPages,
    itemsLength: items.length,
    slicedItemsLength: items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).length
  });

  // Ensure current page is valid when filtered items change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Memoized form submission handler
  const onSubmit = useCallback(async (data) => {
    try {
      const formData = new FormData();
      
      // Add form data
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('price', data.price);
      formData.append('active', data.active);
      formData.append('allergens', JSON.stringify(allergens));
      
      // Add image if selected
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      
      // Add flag to remove image if user clicked remove
      if (removeImage) {
        formData.append('removeImage', 'true');
      }
      
      if (editingItem) {
        await updateItemMutation.mutateAsync({
          id: editingItem._id,
          data: formData
        });
        toast.success('Item updated successfully');
        // Immediately refetch to ensure UI updates
        await refetch();
      } else {
        await createItemMutation.mutateAsync(formData);
        toast.success('Item created successfully');
        // Immediately refetch to ensure UI updates
        await refetch();
      }
      
      setIsModalOpen(false);
      setEditingItem(null);
      setAllergens([]);
      setSelectedImage(null);
      setImagePreview(null);
      setRemoveImage(false);
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save item');
    }
  }, [allergens, editingItem, updateItemMutation, createItemMutation, reset, selectedImage, removeImage, refetch]);

  // Memoized event handlers
  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    reset({
      ...item,
      active: item.active.toString()
    });
    setAllergens(item.allergens || []);
    setImagePreview(item.imageUrl || null);
    setSelectedImage(null);
    setRemoveImage(false);
    setIsModalOpen(true);
  }, [reset]);

  const handleDelete = useCallback((item) => {
    setDeleteConfirmItem(item);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmItem) return;
    
    try {
      const response = await deleteItemMutation.mutateAsync(deleteConfirmItem._id);
      
      // Show success message with details about affected menus
      if (response.data?.affectedMenus?.length > 0) {
        const affectedDays = response.data.affectedMenus.map(menu => menu.dayOfWeek).join(', ');
        toast.success(`Item deleted successfully. It was removed from ${response.data.affectedMenus.length} daily menu(s): ${affectedDays}`);
      } else {
        toast.success('Item deleted successfully');
      }
      
      setShowDeleteConfirm(false);
      setDeleteConfirmItem(null);
    } catch (error) {
      toast.error('Failed to delete item');
    }
  }, [deleteConfirmItem, deleteItemMutation]);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setDeleteConfirmItem(null);
  }, []);

  const handleToggleStatus = useCallback(async (id) => {
    try {
      await toggleStatusMutation.mutateAsync(id);
      toast.success('Item status updated');
    } catch (error) {
      toast.error('Failed to update item status');
    }
  }, [toggleStatusMutation]);

  // Memoized modal handlers
  const openModal = useCallback(() => {
    setEditingItem(null);
    setAllergens([]);
    setSelectedImage(null);
    setImagePreview(null);
    setRemoveImage(false);
    reset();
    setIsModalOpen(true);
  }, [reset]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null);
    setAllergens([]);
    setSelectedImage(null);
    setImagePreview(null);
    setRemoveImage(false);
    reset();
  }, [reset]);

  const addAllergen = useCallback(() => {
    if (newAllergen.trim() && !allergens.includes(newAllergen.trim())) {
      setAllergens(prev => [...prev, newAllergen.trim()]);
      setNewAllergen('');
    }
  }, [newAllergen, allergens]);

  const removeAllergen = useCallback((allergenToRemove) => {
    setAllergens(prev => prev.filter(allergen => allergen !== allergenToRemove));
  }, []);

  const handleAllergenKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAllergen();
    }
  }, [addAllergen]);

  // Image handling functions
  const handleImageSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Simple filter handlers - no useCallback to avoid re-render issues
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Pagination handlers
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  }, []);

  // Bulk selection handlers
  const paginatedItems = useMemo(() => 
    items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [items, currentPage, itemsPerPage]
  );

  const handleSelectAll = useCallback((e) => {
    if (e.target.checked) {
      const newSelected = new Set(paginatedItems.map(item => item._id));
      setSelectedItems(newSelected);
    } else {
      setSelectedItems(new Set());
    }
  }, [paginatedItems]);

  const handleSelectItem = useCallback((itemId) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
      return newSelected;
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.size === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedItems.size} item(s)?`)) {
      try {
        const response = await bulkDeleteMutation.mutateAsync(Array.from(selectedItems));
        
        if (response.data?.affectedMenus?.length > 0) {
          const affectedDays = response.data.affectedMenus.map(menu => menu.dayOfWeek).join(', ');
          toast.success(`${selectedItems.size} item(s) deleted successfully. Removed from ${response.data.affectedMenus.length} daily menu(s): ${affectedDays}`);
        } else {
          toast.success(`${selectedItems.size} item(s) deleted successfully`);
        }
        
        setSelectedItems(new Set());
        await refetch();
      } catch (error) {
        toast.error('Failed to delete items');
      }
    }
  }, [selectedItems, bulkDeleteMutation, refetch]);

  const isAllSelected = useMemo(() => 
    paginatedItems.length > 0 && paginatedItems.every(item => selectedItems.has(item._id)),
    [paginatedItems, selectedItems]
  );

  const isSomeSelected = useMemo(() => 
    paginatedItems.some(item => selectedItems.has(item._id)) && !isAllSelected,
    [paginatedItems, selectedItems, isAllSelected]
  );


  // Show skeleton loader while loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Items</h1>
          <Button disabled>
            <Plus size={20} className="mr-2" />
            Add Item
          </Button>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <FormSkeleton />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <TableSkeleton rows={8} columns={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load items</p>
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
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Items</h1>
          {selectedItems.size > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash2 size={16} className="mr-2" />
              Delete {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
        <Button onClick={openModal}>
          <Plus size={20} className="mr-2" />
          Add Item
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchInput
            value={searchTerm}
            onChange={handleSearchChange}
          />
          
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {items.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <TableCheckbox
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                  />
                </TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Allergens</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item) => (
                  <ItemTableRow
                    key={item._id}
                    item={item}
                    selected={selectedItems.has(item._id)}
                    onSelect={handleSelectItem}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          type="items"
          title="No items found"
          description="Get started by adding your first menu item."
          action={<Button onClick={openModal}>Add Item</Button>}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && items.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          {/* Pagination Info */}
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, items.length)} of {items.length} results
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Size Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>

            {/* Pagination */}
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="h-8 w-8 p-0"
              >
                ←
              </Button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="h-8 w-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="h-8 w-8 p-0"
              >
                →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Item' : 'Add New Item'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <Input
              {...register('name', { required: 'Name is required' })}
              placeholder="Item name"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
              placeholder="Item description"
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register('price', { 
                required: 'Price is required',
                min: { value: 0, message: 'Price must be positive' }
              })}
              placeholder="0.00"
            />
            {errors.price && (
              <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="true"
                  {...register('active', { required: 'Status is required' })}
                  className="mr-2 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="false"
                  {...register('active', { required: 'Status is required' })}
                  className="mr-2 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Inactive</span>
              </label>
            </div>
            {errors.active && (
              <p className="text-sm text-red-600 mt-1">{errors.active.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Image
            </label>
            <div className="space-y-3">
              {/* Image Preview */}
              {(imagePreview || editingItem?.imageUrl) && !removeImage && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview || editingItem?.imageUrl}
                    alt="Item preview"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              
              {/* Show removal message */}
              {removeImage && (
                <div className="w-32 h-32 bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <X size={24} className="text-red-500 mx-auto mb-1" />
                    <p className="text-xs text-red-600">Image will be removed</p>
                  </div>
                </div>
              )}
              
              {/* File Input */}
              <div className="flex items-center space-x-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={16} className="mr-2" />
                  {removeImage ? 'Restore Image' : (imagePreview || editingItem?.imageUrl) ? 'Change Image' : 'Upload Image'}
                </Button>
                {removeImage && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setRemoveImage(false);
                      setImagePreview(editingItem?.imageUrl || null);
                    }}
                    className="text-green-600 border-green-300 hover:bg-green-50"
                  >
                    Restore
                  </Button>
                )}
                {!imagePreview && !editingItem?.imageUrl && !removeImage && (
                  <span className="text-sm text-gray-500">Optional</span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Supported formats: JPG, PNG, GIF. Max size: 5MB
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Allergens
            </label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  value={newAllergen}
                  onChange={(e) => setNewAllergen(e.target.value)}
                  onKeyPress={handleAllergenKeyPress}
                  placeholder="Enter allergen name"
                />
                <Button type="button" onClick={addAllergen} disabled={!newAllergen.trim()}>
                  Add
                </Button>
              </div>
              {allergens.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {allergens.map((allergen, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                    >
                      {allergen}
                      <button
                        type="button"
                        onClick={() => removeAllergen(allergen)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={closeModal}
              disabled={createItemMutation.isPending || updateItemMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createItemMutation.isPending || updateItemMutation.isPending}
            >
              {createItemMutation.isPending || updateItemMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingItem ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingItem ? 'Update Item' : 'Create Item'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={cancelDelete}
        title="Delete Item"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                Delete "{deleteConfirmItem?.name}"
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                This action cannot be undone. The item will be permanently removed.
              </p>
            </div>
          </div>

          {usageLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
              <span className="ml-2 text-sm text-gray-500">Checking usage...</span>
            </div>
          ) : itemUsage?.isUsed ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Eye className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">
                    Item is currently used in daily menus
                  </h4>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p className="mb-2">This item will be removed from the following daily menu sections:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {itemUsage.affectedMenus.map((menu, index) => (
                        <li key={index}>
                          <span className="font-medium capitalize">{menu.dayOfWeek}</span>
                          {menu.sections.length > 0 && (
                            <span className="text-yellow-600">
                              {' '}({menu.sections.join(', ')})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <EyeOff className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-800">
                    Item is not used in any daily menus
                  </h4>
                  <p className="mt-1 text-sm text-green-700">
                    This item can be safely deleted without affecting any daily menus.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={cancelDelete}
              disabled={deleteItemMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteItemMutation.isPending || usageLoading}
            >
              {deleteItemMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete Item'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Simple search input - no complex focus management
const SearchInput = ({ value, onChange }) => {
  return (
    <div className="relative">
      <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Search items..."
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );
};

// Memoized table row component for better performance
const ItemTableRow = React.memo(({ item, selected, onSelect, onEdit, onDelete, onToggleStatus }) => {
  const [isTogglingStatus, setIsTogglingStatus] = React.useState(false);

  const handleToggleClick = async () => {
    setIsTogglingStatus(true);
    try {
      await onToggleStatus(item._id);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <TableRow selected={selected}>
      <TableCell>
        <TableCheckbox
          checked={selected}
          onChange={() => onSelect(item._id)}
        />
      </TableCell>
      <TableCell>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-12 h-12 object-cover rounded-lg border border-gray-300"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center">
            <ImageIcon size={20} className="text-gray-400" />
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell className="max-w-xs truncate">{item.description}</TableCell>
      <TableCell>£{item.price}</TableCell>
      <TableCell>
        {item.allergens && item.allergens.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {item.allergens.map((allergen, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs"
              >
                {allergen}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-400 text-sm">None</span>
        )}
      </TableCell>
      <TableCell>
        <button
          onClick={handleToggleClick}
          disabled={isTogglingStatus}
          className={`px-2 py-1 rounded-full text-sm font-medium inline-flex items-center ${
            item.active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          } ${isTogglingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isTogglingStatus && (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
          )}
          {item.active ? 'Active' : 'Inactive'}
        </button>
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(item)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
});

export default Items;
