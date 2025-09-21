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

// Delete order mutation
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => orderService.deleteOrder(id),
    onSuccess: () => {
      // Invalidate orders list and stats
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.stats() });
    },
  });
};

// Cancel order mutation
export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }) => orderService.cancelOrder(id, reason),
    onSuccess: (data, variables) => {
      // Update the specific order in cache
      queryClient.setQueryData(
        orderKeys.detail(variables.id),
        { data: data.data }
      );
      // Invalidate orders list and stats
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.stats() });
    },
  });
};

// Update payment status mutation
export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, paymentStatus }) => orderService.updatePaymentStatus(id, paymentStatus),
    onSuccess: (data, variables) => {
      // Update the specific order in cache
      queryClient.setQueryData(
        orderKeys.detail(variables.id),
        { data: data.data }
      );
      // Invalidate orders list and stats
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.stats() });
    },
  });
};
