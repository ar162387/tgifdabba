import React, { useMemo, useCallback } from 'react';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { StatCardSkeleton } from '../components/ui/Skeleton';
import { useDashboardStats, useRecentActivity } from '../hooks/useDashboard';

const Dashboard = () => {
  // TanStack Query hooks
  const { data: statsData, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: recentActivity, isLoading: activityLoading, error: activityError } = useRecentActivity();

  // Memoized stat cards configuration
  const statCards = useMemo(() => [
    {
      title: 'Total Orders',
      value: statsData?.orders?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Pending Orders',
      value: statsData?.orders?.byStatus?.pending?.count || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      change: '+5%'
    },
    {
      title: 'Delivered Orders',
      value: statsData?.orders?.byStatus?.delivered?.count || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'New Contacts',
      value: statsData?.contacts?.unreadContacts || 0,
      icon: Users,
      color: 'bg-purple-500',
      change: '+3%'
    }
  ], [statsData]);

  // Show skeleton loaders while loading
  if (statsLoading || activityLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
        
        {/* Recent Activity Skeleton */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (statsError || activityError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load dashboard data</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <StatCard key={index} card={card} />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <ActivityItem key={index} activity={activity} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Package className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium">Add New Item</span>
          </button>
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium">Update Menu</span>
          </button>
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <ShoppingCart className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium">View Orders</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Memoized Stat Card Component
const StatCard = React.memo(({ card }) => {
  const Icon = card.icon;
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${card.color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{card.title}</p>
          <p className="text-2xl font-bold text-gray-900">{card.value}</p>
        </div>
      </div>
      <div className="mt-4">
        <span className="text-sm text-green-600 font-medium">{card.change}</span>
        <span className="text-sm text-gray-500 ml-1">from last month</span>
      </div>
    </div>
  );
});

// Memoized Activity Item Component
const ActivityItem = React.memo(({ activity }) => {
  return (
    <div className="flex items-center space-x-4">
      <div className={`w-2 h-2 rounded-full ${
        activity.type === 'order' ? 'bg-blue-500' : 'bg-purple-500'
      }`} />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
        <p className="text-sm text-gray-500">{activity.subtitle}</p>
      </div>
      <div className="text-sm text-gray-500">
        {new Date(activity.timestamp).toLocaleDateString()}
      </div>
    </div>
  );
});

export default Dashboard;
