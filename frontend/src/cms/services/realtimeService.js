import apiClient from './apiClient.js';
import { authService } from './authService.js';

class RealtimeService {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.pollingInterval = null;
    this.isPolling = false;
    this.lastOrderTimestamp = null;
    this.isConnecting = false;
    this.reconnectTimeout = null;
    this.connectionState = 'disconnected'; // 'disconnected', 'connecting', 'connected', 'error'
    this.isInitialized = false;
    this.persistentConnection = true; // Flag to maintain connection across page reloads
    this.lastPendingCount = 0;
    this.lastPendingCountTime = 0;
    this.cacheTimeout = 60000; // 60 seconds cache (increased from 30s)
    this.pendingCountPromise = null; // Prevent multiple simultaneous calls
    this.refreshDebounceTimeout = null; // Debounce refresh calls
    this.refreshDebounceDelay = 2000; // 2 seconds debounce
    this.isRefreshing = false; // Prevent concurrent refreshes
  }

  // Initialize persistent connection
  initialize() {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    
    // Check if we should maintain a persistent connection
    if (this.persistentConnection) {
      // Auto-connect on initialization
      this.connect();
      
      // Set up page visibility change handler to reconnect when page becomes visible
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.connectionState !== 'connected' && !this.isPolling) {
          console.log('Page became visible, reconnecting...');
          this.connect();
        }
      });
      
      // Set up beforeunload handler to maintain connection state
      window.addEventListener('beforeunload', () => {
        // Don't disconnect on page unload, just mark as potentially disconnected
        this.connectionState = 'disconnected';
      });
    }
  }

  // Subscribe to order events
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
    
    // Initialize if not already done
    this.initialize();
    
    // Start connection if not already connected
    if (!this.eventSource && !this.isPolling) {
      this.connect();
    }
    
    return () => this.unsubscribe(eventType, callback);
  }

  // Unsubscribe from events
  unsubscribe(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback);
      if (this.listeners.get(eventType).size === 0) {
        this.listeners.delete(eventType);
      }
    }
    
    // Only disconnect if no more listeners and not in persistent mode
    if (this.listeners.size === 0 && !this.persistentConnection) {
      this.disconnect();
    }
  }

  // Emit events to listeners
  emit(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Connect using Server-Sent Events
  async connect() {
    if (this.isConnecting || this.connectionState === 'connected') {
      return;
    }

    this.isConnecting = true;
    this.connectionState = 'connecting';
    
    // Emit connection state change
    this.emit('connection.stateChange', this.getConnectionStatus());

    try {
      // Try SSE first
      await this.connectSSE();
    } catch (error) {
      console.warn('SSE connection failed, falling back to polling:', error);
      this.connectionState = 'error';
      this.startPolling();
    } finally {
      this.isConnecting = false;
    }
  }

  // Check if we should maintain connection (for persistent mode)
  shouldMaintainConnection() {
    return this.persistentConnection && this.listeners.size > 0;
  }

  // Connect via Server-Sent Events
  connectSSE() {
    return new Promise((resolve, reject) => {
      try {
        const token = localStorage.getItem('cms_token');
        if (!token) {
          reject(new Error('No authentication token'));
          return;
        }

        // Create SSE connection
        this.eventSource = new EventSource(
          `http://localhost:5001/api/cms/realtime/orders?token=${encodeURIComponent(token)}`
        );

        this.eventSource.onopen = () => {
          console.log('SSE connection established');
          this.reconnectAttempts = 0;
          this.connectionState = 'connected';
          // Emit connection state change
          this.emit('connection.stateChange', this.getConnectionStatus());
          resolve();
        };

        this.eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleRealtimeEvent(data);
          } catch (error) {
            console.error('Error parsing SSE message:', error);
          }
        };

        this.eventSource.onerror = (error) => {
          console.error('SSE connection error:', error);
          this.connectionState = 'error';
          // Emit connection state change
          this.emit('connection.stateChange', this.getConnectionStatus());
          
          // Check if it's a token expiry error before closing
          const isTokenExpired = this.checkForTokenExpiry(error);
          
          this.eventSource.close();
          this.eventSource = null;
          
          if (isTokenExpired) {
            this.handleTokenExpiry();
          } else {
            // For other errors, attempt normal reconnection
            this.attemptReconnect();
          }
          
          reject(error);
        };

        // Set timeout for connection
        setTimeout(() => {
          if (!this.eventSource || this.eventSource.readyState !== EventSource.OPEN) {
            reject(new Error('SSE connection timeout'));
          }
        }, 5000);

      } catch (error) {
        reject(error);
      }
    });
  }

  // Check if the error is due to token expiry
  checkForTokenExpiry(error) {
    // Check if EventSource failed to connect (likely 401)
    if (error.target && error.target.readyState === EventSource.CLOSED) {
      // Try to make a test request to see if it's a token issue
      const token = localStorage.getItem('cms_token');
      if (!token) {
        return true; // No token means we need to login
      }
      
      // Check if the token is expired by trying to decode it
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          console.log('Token is expired based on payload');
          return true;
        }
      } catch (e) {
        console.log('Could not decode token, assuming expired');
        return true;
      }
    }
    
    return false;
  }

  // Handle connection errors (including token expiry)
  handleConnectionError(error) {
    // Check if it's a token expiry error
    if (this.checkForTokenExpiry(error)) {
      console.log('Token expiry detected, attempting to refresh...');
      this.handleTokenExpiry();
    } else {
      // For other errors, attempt normal reconnection
      this.attemptReconnect();
    }
  }

  // Handle token expiry by refreshing the token
  async handleTokenExpiry() {
    try {
      // Check if we have a token to refresh
      const currentToken = localStorage.getItem('cms_token');
      if (!currentToken) {
        console.log('No token to refresh, redirecting to login');
        this.handleAuthFailure();
        return;
      }

      // Check if token is expired by decoding it
      let isTokenExpired = false;
      try {
        const payload = JSON.parse(atob(currentToken.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        isTokenExpired = payload.exp && payload.exp < now;
      } catch (e) {
        isTokenExpired = true; // Invalid token format
      }

      if (!isTokenExpired) {
        console.log('Token is not expired, this might be a different issue');
        this.attemptReconnect();
        return;
      }

      // Try to refresh the token using authService
      const newToken = await authService.refreshToken();
      console.log('Token refreshed successfully');
      
      // Reset reconnection attempts and try to reconnect
      this.reconnectAttempts = 0;
      this.connect();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      this.handleAuthFailure();
    }
  }

  // Handle authentication failure
  handleAuthFailure() {
    // Clear auth data
    localStorage.removeItem('cms_token');
    localStorage.removeItem('cms_user');
    
    // Emit auth failure event
    this.emit('auth.failure', { message: 'Session expired, please login again' });
    
    // Redirect to login page
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // Attempt to reconnect with exponential backoff
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached, falling back to polling');
      this.startPolling();
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Fallback to polling when SSE fails
  startPolling() {
    if (this.isPolling) return;
    
    this.isPolling = true;
    this.connectionState = 'error';
    console.log('Starting polling fallback');
    
    // Emit connection state change
    this.emit('connection.stateChange', this.getConnectionStatus());
    
    // Initial fetch
    this.pollForNewOrders();
    
    // Set up polling interval (30 seconds - less frequent to avoid rate limits)
    this.pollingInterval = setInterval(() => {
      this.pollForNewOrders();
    }, 30000);
  }

  // Poll for new orders
  async pollForNewOrders() {
    try {
      const response = await apiClient.get('/orders', {
        params: {
          status: 'pending',
          limit: 50,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      });

      if (response.data?.data?.orders) {
        const orders = response.data.data.orders;
        
        // Filter new orders since last check
        const newOrders = this.lastOrderTimestamp 
          ? orders.filter(order => new Date(order.createdAt) > this.lastOrderTimestamp)
          : orders;

        // Update timestamp
        if (orders.length > 0) {
          this.lastOrderTimestamp = new Date(orders[0].createdAt);
        }

        // Emit events for new orders
        newOrders.forEach(order => {
          this.emit('order.created', {
            orderId: order.orderId,
            customerName: order.customer.email,
            customerPhone: order.customer.phoneNumber,
            itemsCount: order.items.length,
            total: order.pricing.total,
            placedAt: order.createdAt,
            status: order.status,
            orderData: order
          });
        });

        // Update cached count and emit
        this.lastPendingCount = orders.length;
        this.lastPendingCountTime = Date.now();
        this.emit('pending.count', orders.length);
      }
    } catch (error) {
      console.error('Error polling for orders:', error);
    }
  }

  // Handle realtime events
  handleRealtimeEvent(data) {
    switch (data.type) {
      case 'connected':
        console.log('SSE connection confirmed');
        // Emit connection established event
        this.emit('connection.established', data);
        break;
        
      case 'order.created':
        if (data.order?.status === 'pending') {
          // Update cached count immediately
          this.lastPendingCount = (this.lastPendingCount || 0) + 1;
          this.lastPendingCountTime = Date.now();
          
          this.emit('order.created', {
            orderId: data.order.orderId,
            customerName: data.order.customer.email,
            customerPhone: data.order.customer.phoneNumber,
            itemsCount: data.order.items.length,
            total: data.order.pricing.total,
            placedAt: data.order.createdAt,
            status: data.order.status,
            orderData: data.order
          });
          
          // Emit updated count
          this.emit('pending.count', this.lastPendingCount);
        }
        break;
        
      case 'order.updated':
        if (data.previousStatus === 'pending' && data.order.status !== 'pending') {
          // Update cached count immediately
          this.lastPendingCount = Math.max(0, (this.lastPendingCount || 0) - 1);
          this.lastPendingCountTime = Date.now();
          
          this.emit('order.updated', {
            orderId: data.order.orderId,
            previousStatus: data.previousStatus,
            newStatus: data.order.status,
            orderData: data.order
          });
          
          // Emit updated count
          this.emit('pending.count', this.lastPendingCount);
        }
        break;
        
      case 'pending.count':
        // Update cached count
        this.lastPendingCount = data.count;
        this.lastPendingCountTime = Date.now();
        this.emit('pending.count', data.count);
        break;
        
      case 'ping':
        // Handle ping messages to keep connection alive
        console.log('Received ping from server');
        break;
        
      default:
        console.log('Unknown event type:', data.type);
    }
  }

  // Disconnect from realtime service
  disconnect(force = false) {
    // Don't disconnect if we're in persistent mode and have listeners, unless forced
    if (!force && this.shouldMaintainConnection()) {
      console.log('Skipping disconnect - maintaining persistent connection');
      return;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.refreshDebounceTimeout) {
      clearTimeout(this.refreshDebounceTimeout);
      this.refreshDebounceTimeout = null;
    }
    
    this.isPolling = false;
    this.isRefreshing = false;
    this.reconnectAttempts = 0;
    this.connectionState = 'disconnected';
    console.log('Realtime service disconnected');
  }

  // Get current pending orders count with caching and debouncing
  async getPendingOrdersCount(forceRefresh = false) {
    const now = Date.now();
    
    // Return cached result if it's still valid and not forcing refresh
    if (!forceRefresh && this.lastPendingCountTime && (now - this.lastPendingCountTime) < this.cacheTimeout) {
      console.log('Using cached pending count:', this.lastPendingCount);
      return this.lastPendingCount;
    }
    
    // If there's already a pending request, return that promise
    if (this.pendingCountPromise) {
      console.log('Reusing existing pending count request');
      return this.pendingCountPromise;
    }
    
    console.log('Fetching fresh pending orders count from API...');
    
    // Create a new promise for this request
    this.pendingCountPromise = this.fetchPendingCountFromAPI();
    
    try {
      const count = await this.pendingCountPromise;
      return count;
    } finally {
      // Clear the promise when done
      this.pendingCountPromise = null;
    }
  }

  // Separate method for the actual API call
  async fetchPendingCountFromAPI() {
    try {
      const response = await apiClient.get('/orders', {
        params: {
          status: 'pending',
          limit: 1
        }
      });
      
      const count = response.data?.data?.pagination?.totalOrders || 0;
      console.log('API response for pending count:', response.data);
      console.log('Response data structure:', JSON.stringify(response.data, null, 2));
      console.log('Extracted count:', count);
      console.log('Available counts in response:', {
        totalOrders: response.data?.data?.pagination?.totalOrders,
        totalCount: response.data?.data?.totalCount,
        ordersLength: response.data?.data?.orders?.length,
        orders: response.data?.data?.orders
      });
      
      // Cache the result
      this.lastPendingCount = count;
      this.lastPendingCountTime = Date.now();
      
      return count;
    } catch (error) {
      console.error('Error fetching pending orders count:', error);
      // Return cached result if available, otherwise 0
      const fallbackCount = this.lastPendingCount || 0;
      console.log('Using fallback count:', fallbackCount);
      return fallbackCount;
    }
  }

  // Get current pending orders for notification panel
  async getPendingOrders(limit = 10) {
    try {
      const response = await apiClient.get('/orders', {
        params: {
          status: 'pending',
          limit,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      });
      
      return response.data?.data?.orders?.map(order => ({
        orderId: order.orderId,
        customerName: order.customer.email,
        customerPhone: order.customer.phoneNumber,
        itemsCount: order.items.length,
        total: order.pricing.total,
        placedAt: order.createdAt,
        status: order.status,
        orderData: order
      })) || [];
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      return [];
    }
  }

  // Check connection status
  getConnectionStatus() {
    return {
      state: this.connectionState,
      isConnected: this.connectionState === 'connected',
      isPolling: this.isPolling,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Force reconnection
  forceReconnect() {
    console.log('Forcing reconnection...');
    this.disconnect(true); // Force disconnect
    this.reconnectAttempts = 0;
    this.connect();
  }

  // Enable/disable persistent connection
  setPersistentConnection(enabled) {
    this.persistentConnection = enabled;
    
    if (enabled && !this.isInitialized) {
      this.initialize();
    } else if (!enabled && this.listeners.size === 0) {
      this.disconnect(true);
    }
  }

  // Get persistent connection status
  isPersistentConnectionEnabled() {
    return this.persistentConnection;
  }

  // Refresh pending orders count with debouncing
  async refreshPendingOrdersCount(forceRefresh = false) {
    // Clear any existing debounce timeout
    if (this.refreshDebounceTimeout) {
      clearTimeout(this.refreshDebounceTimeout);
    }

    // If already refreshing, don't start another refresh
    if (this.isRefreshing && !forceRefresh) {
      console.log('Refresh already in progress, skipping...');
      return this.lastPendingCount || 0;
    }

    return new Promise((resolve) => {
      this.refreshDebounceTimeout = setTimeout(async () => {
        try {
          this.isRefreshing = true;
          const count = await this.getPendingOrdersCount(forceRefresh);
          console.log('Refreshing pending orders count:', count);
          this.emit('pending.count', count);
          resolve(count);
        } catch (error) {
          console.error('Error refreshing pending orders count:', error);
          // Return cached count if available
          const cachedCount = this.lastPendingCount || 0;
          console.log('Using cached count:', cachedCount);
          this.emit('pending.count', cachedCount);
          resolve(cachedCount);
        } finally {
          this.isRefreshing = false;
        }
      }, forceRefresh ? 0 : this.refreshDebounceDelay);
    });
  }
}

// Create singleton instance
const realtimeService = new RealtimeService();

export default realtimeService;
