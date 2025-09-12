import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyMenuService } from '../services/dailyMenuService';
import { itemService } from '../services/itemService';

// Query keys
export const dailyMenuKeys = {
  all: ['dailyMenus'],
  lists: () => [...dailyMenuKeys.all, 'list'],
  list: (params) => [...dailyMenuKeys.lists(), params],
  details: () => [...dailyMenuKeys.all, 'detail'],
  detail: (id) => [...dailyMenuKeys.details(), id],
};

// Get all daily menus
export const useDailyMenus = () => {
  return useQuery({
    queryKey: dailyMenuKeys.lists(),
    queryFn: () => dailyMenuService.getAllDailyMenus(),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get items for menu selection
export const useMenuItems = () => {
  return useQuery({
    queryKey: ['items', 'menu'],
    queryFn: () => itemService.getAllItems({ limit: 100, active: true }),
    select: (data) => data.data.items,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Create daily menu mutation
export const useCreateDailyMenu = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (menuData) => dailyMenuService.createDailyMenu(menuData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyMenuKeys.lists() });
    },
  });
};

// Update daily menu mutation
export const useUpdateDailyMenu = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => dailyMenuService.updateDailyMenu(id, data),
    onSuccess: (data, variables) => {
      // Update the specific menu in cache
      queryClient.setQueryData(
        dailyMenuKeys.detail(variables.id),
        { data: data.data }
      );
      queryClient.invalidateQueries({ queryKey: dailyMenuKeys.lists() });
    },
  });
};

// Publish daily menu mutation
export const usePublishDailyMenu = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => dailyMenuService.publishDailyMenu(id),
    onSuccess: (data, id) => {
      // Update the specific menu in cache
      queryClient.setQueryData(
        dailyMenuKeys.detail(id),
        { data: data.data }
      );
      queryClient.invalidateQueries({ queryKey: dailyMenuKeys.lists() });
    },
  });
};
