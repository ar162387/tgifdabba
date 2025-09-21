import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemService } from '../services/itemService';

// Query keys
export const itemKeys = {
  all: ['items'],
  lists: () => [...itemKeys.all, 'list'],
  list: (params) => [...itemKeys.lists(), params],
  details: () => [...itemKeys.all, 'detail'],
  detail: (id) => [...itemKeys.details(), id],
};

// Get all items with caching
export const useItems = (params = {}) => {
  return useQuery({
    queryKey: itemKeys.list(params),
    queryFn: () => itemService.getAllItems(params),
    select: (data) => data.data, // Transform the response
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get single item
export const useItem = (id) => {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => itemService.getItemById(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

// Create item mutation
export const useCreateItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (itemData) => itemService.createItem(itemData),
    onSuccess: () => {
      // Invalidate and refetch items list
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
};

// Update item mutation
export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => itemService.updateItem(id, data),
    onSuccess: (data, variables) => {
      // Update the specific item in cache
      queryClient.setQueryData(
        itemKeys.detail(variables.id),
        { data: data.data }
      );
      
      // Force invalidate all items-related queries
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
      
      // Also remove specific queries to force fresh fetch
      queryClient.removeQueries({ queryKey: itemKeys.lists() });
    },
  });
};

// Delete item mutation
export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => itemService.deleteItem(id),
    onSuccess: (response) => {
      // Invalidate items queries to refresh the list
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      
      // Also invalidate daily menu queries since items might have been removed from menus
      queryClient.invalidateQueries({ queryKey: ['dailyMenus'] });
      
      return response; // Return response so it can be used in the component
    },
  });
};

// Check item usage query
export const useItemUsage = (id) => {
  return useQuery({
    queryKey: [...itemKeys.detail(id), 'usage'],
    queryFn: () => itemService.checkItemUsage(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

// Toggle item status mutation
export const useToggleItemStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => itemService.toggleItemStatus(id),
    onSuccess: (data, id) => {
      // Optimistically update the item in cache
      queryClient.setQueryData(
        itemKeys.detail(id),
        { data: data.data }
      );
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
};
