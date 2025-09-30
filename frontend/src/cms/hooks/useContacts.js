import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactService } from '../services/contactService';

// Query keys
export const contactKeys = {
  all: ['contacts'],
  lists: () => [...contactKeys.all, 'list'],
  list: (params) => [...contactKeys.lists(), params],
  details: () => [...contactKeys.all, 'detail'],
  detail: (id) => [...contactKeys.details(), id],
  stats: () => [...contactKeys.all, 'stats'],
};

// Get all contacts with caching
export const useContacts = (params = {}) => {
  return useQuery({
    queryKey: contactKeys.list(params),
    queryFn: () => contactService.getAllContacts(params),
    select: (data) => data.data, // Transform the response
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get single contact
export const useContact = (id) => {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn: () => contactService.getContactById(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

// Get contact stats
export const useContactStats = () => {
  return useQuery({
    queryKey: contactKeys.stats(),
    queryFn: () => contactService.getContactStats(),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mark contact as read mutation
export const useMarkContactAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => contactService.markContactAsRead(id),
    onSuccess: (data, id) => {
      // Update the specific contact in cache
      queryClient.setQueryData(
        contactKeys.detail(id),
        { data: data.data }
      );
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: contactKeys.stats() });
    },
  });
};

// Respond to contact mutation
export const useRespondToContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, response }) => contactService.respondToContact(id, { response }),
    onSuccess: (data, variables) => {
      // Update the specific contact in cache
      queryClient.setQueryData(
        contactKeys.detail(variables.id),
        { data: data.data }
      );
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
  });
};

// Delete contact mutation
export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => contactService.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: contactKeys.stats() });
    },
  });
};

// Bulk delete contacts mutation
export const useBulkDeleteContacts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (contactIds) => contactService.bulkDeleteContacts(contactIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: contactKeys.stats() });
    },
  });
};
