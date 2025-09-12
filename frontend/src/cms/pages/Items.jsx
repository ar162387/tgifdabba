import React, { useState, useMemo, useCallback, useTransition } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, EyeOff, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton, FormSkeleton } from '../components/ui/Skeleton';
import { useItems, useCreateItem, useUpdateItem, useDeleteItem, useToggleItemStatus } from '../hooks/useItems';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

const Items = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [allergens, setAllergens] = useState([]);
  const [newAllergen, setNewAllergen] = useState('');
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized query parameters
  const queryParams = useMemo(() => ({
    page: currentPage,
    limit: 10,
    ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
    ...(statusFilter && { active: statusFilter }),
  }), [currentPage, debouncedSearchTerm, statusFilter]);

  // TanStack Query hooks
  const { data: itemsData, isLoading, error } = useItems(queryParams);
  const createItemMutation = useCreateItem();
  const updateItemMutation = useUpdateItem();
  const deleteItemMutation = useDeleteItem();
  const toggleStatusMutation = useToggleItemStatus();

  // Memoized items and pagination data
  const items = useMemo(() => itemsData?.items || [], [itemsData?.items]);
  const totalPages = useMemo(() => itemsData?.pagination?.pages || 1, [itemsData?.pagination?.pages]);

  // Memoized form submission handler
  const onSubmit = useCallback(async (data) => {
    try {
      const itemData = {
        ...data,
        allergens: allergens
      };
      
      if (editingItem) {
        await updateItemMutation.mutateAsync({
          id: editingItem._id,
          data: itemData
        });
        toast.success('Item updated successfully');
      } else {
        await createItemMutation.mutateAsync(itemData);
        toast.success('Item created successfully');
      }
      
      setIsModalOpen(false);
      setEditingItem(null);
      setAllergens([]);
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save item');
    }
  }, [allergens, editingItem, updateItemMutation, createItemMutation, reset]);

  // Memoized event handlers
  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    reset(item);
    setAllergens(item.allergens || []);
    setIsModalOpen(true);
  }, [reset]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItemMutation.mutateAsync(id);
        toast.success('Item deleted successfully');
      } catch (error) {
        toast.error('Failed to delete item');
      }
    }
  }, [deleteItemMutation]);

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
    reset();
    setIsModalOpen(true);
  }, [reset]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null);
    setAllergens([]);
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

  // Memoized filter handlers with useTransition for smooth UI
  const handleSearchChange = useCallback((e) => {
    startTransition(() => {
      setSearchTerm(e.target.value);
    });
  }, []);

  const handleStatusFilterChange = useCallback((e) => {
    startTransition(() => {
      setStatusFilter(e.target.value);
    });
  }, []);


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
        <h1 className="text-2xl font-bold text-gray-900">Items</h1>
        <Button onClick={openModal}>
          <Plus size={20} className="mr-2" />
          Add Item
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          
          <Button variant="outline" disabled={isPending}>
            <Filter size={20} className="mr-2" />
            {isPending ? 'Filtering...' : 'Apply Filters'}
          </Button>
        </div>
      </div>

      {/* Table */}
      {items.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Allergens</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <ItemTableRow
                  key={item._id}
                  item={item}
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
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
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
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingItem ? 'Update Item' : 'Create Item'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Memoized table row component for better performance
const ItemTableRow = React.memo(({ item, onEdit, onDelete, onToggleStatus }) => {
  return (
    <TableRow>
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell className="max-w-xs truncate">{item.description}</TableCell>
      <TableCell>${item.price}</TableCell>
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
          onClick={() => onToggleStatus(item._id)}
          className={`px-2 py-1 rounded-full text-sm font-medium ${
            item.active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
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
            onClick={() => onDelete(item._id)}
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
