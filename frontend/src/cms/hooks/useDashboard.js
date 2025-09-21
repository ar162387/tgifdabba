import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/orderService';
import { contactService } from '../services/contactService';
import { notificationService } from '../services/notificationService';

// Query keys
export const dashboardKeys = {
  all: ['dashboard'],
  stats: () => [...dashboardKeys.all, 'stats'],
  activity: () => [...dashboardKeys.all, 'activity'],
};

// Get dashboard stats
export const useDashboardStats = () => {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const [ordersResponse, contactsResponse, notificationsResponse] = await Promise.all([
        orderService.getOrderStats({ period: 'month' }), // Get stats for the month instead of today
        contactService.getContactStats(),
        notificationService.getNotificationCounters()
      ]);

      return {
        orders: ordersResponse.data,
        contacts: contactsResponse.data,
        notifications: notificationsResponse.data
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

// Get recent activity
export const useRecentActivity = () => {
  return useQuery({
    queryKey: dashboardKeys.activity(),
    queryFn: () => notificationService.getRecentActivity(5),
    select: (data) => data.data,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 3 * 60 * 1000, // Refetch every 3 minutes
  });
};
