import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/orderService';

// Query keys
export const orderKeys = {
  all: ['orders'],
  lists: () => [...orderKeys.all, 'list'],
  list: (params) => [...orderKeys.lists(), params],
  details: () => [...orderKeys.all, 'detail'],
  detail: (id) => [...orderKeys.details(), id],
  stats: () => [...orderKeys.all, 'stats'],
};

// Get all orders with caching
export const useOrders = (params = {}) => {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => orderService.getAllOrders(params),
    select: (data) => data.data, // Transform the response
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get single order
export const useOrder = (id) => {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => orderService.getOrderById(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

// Get order stats
export const useOrderStats = () => {
  return useQuery({
    queryKey: orderKeys.stats(),
    queryFn: () => orderService.getOrderStats(),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Update order status mutation
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }) => orderService.updateOrderStatus(id, { status }),
    onSuccess: (data, variables) => {
      // Update the specific order in cache
      queryClient.setQueryData(
        orderKeys.detail(variables.id),
        { data: data.data }
      );
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: orderKeys.stats() });
    },
  });
};

// Mark order as read mutation
export const useMarkOrderAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => orderService.markOrderAsRead(id),
    onSuccess: (data, id) => {
      // Update the specific order in cache
      queryClient.setQueryData(
        orderKeys.detail(id),
        { data: data.data }
      );
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
};
