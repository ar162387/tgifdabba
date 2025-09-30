import realtimeService from './realtimeService.js';

/**
 * Global Real-time Manager
 * Maintains persistent SSE connections across page navigation
 * Prevents connection drops when navigating between SPA pages
 */
class GlobalRealtimeManager {
  constructor() {
    this.isInitialized = false;
    this.subscribers = new Map(); // Map of eventType -> Set of callbacks
    this.connectionStatus = 'disconnected';
    this.connectionStatusCallbacks = new Set();
    
    // Initialize immediately when the module loads
    this.initialize();
  }

  initialize() {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    console.log('🌐 Global Real-time Manager initialized');
    
    // Subscribe to connection status changes
    realtimeService.subscribe('connection.stateChange', (status) => {
      this.connectionStatus = status.state;
      console.log(`🔗 Global connection status changed to: ${status.state}`);
      
      // Notify all connection status callbacks
      this.connectionStatusCallbacks.forEach(callback => {
        try {
          callback(status);
        } catch (error) {
          console.error('Error in connection status callback:', error);
        }
      });
    });
    
    // Set up global event forwarding
    this.setupEventForwarding();
  }

  setupEventForwarding() {
    // Forward all real-time events to subscribers
    const eventTypes = ['order.created', 'order.updated', 'order.status_changed'];
    
    eventTypes.forEach(eventType => {
      realtimeService.subscribe(eventType, (data) => {
        console.log(`📡 Global manager forwarding ${eventType}:`, data);
        
        if (this.subscribers.has(eventType)) {
          this.subscribers.get(eventType).forEach(callback => {
            try {
              callback(data);
            } catch (error) {
              console.error(`Error in ${eventType} callback:`, error);
            }
          });
        }
      });
    });
  }

  // Subscribe to events with automatic cleanup
  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    
    this.subscribers.get(eventType).add(callback);
    
    console.log(`📝 Subscribed to ${eventType}, total subscribers: ${this.subscribers.get(eventType).size}`);
    
    // Return unsubscribe function
    return () => {
      if (this.subscribers.has(eventType)) {
        this.subscribers.get(eventType).delete(callback);
        
        // Clean up empty event types
        if (this.subscribers.get(eventType).size === 0) {
          this.subscribers.delete(eventType);
        }
        
        console.log(`📝 Unsubscribed from ${eventType}, remaining subscribers: ${this.subscribers.get(eventType)?.size || 0}`);
      }
    };
  }

  // Subscribe to connection status changes
  subscribeToConnectionStatus(callback) {
    this.connectionStatusCallbacks.add(callback);
    
    // Immediately call with current status
    callback({ state: this.connectionStatus });
    
    return () => {
      this.connectionStatusCallbacks.delete(callback);
    };
  }

  // Get current connection status
  getConnectionStatus() {
    return {
      state: this.connectionStatus,
      isConnected: this.connectionStatus === 'connected',
      isPolling: realtimeService.getConnectionStatus().isPolling,
      reconnectAttempts: realtimeService.getConnectionStatus().reconnectAttempts
    };
  }

  // Get subscriber counts for debugging
  getStats() {
    const stats = {
      connectionStatus: this.connectionStatus,
      totalSubscribers: 0,
      eventTypes: {}
    };
    
    this.subscribers.forEach((callbacks, eventType) => {
      stats.eventTypes[eventType] = callbacks.size;
      stats.totalSubscribers += callbacks.size;
    });
    
    return stats;
  }

  // Force reconnection (useful for debugging)
  forceReconnect() {
    console.log('🔄 Global manager forcing reconnection...');
    realtimeService.forceReconnect();
  }

  // Check if we have any subscribers
  hasSubscribers() {
    return this.subscribers.size > 0 || this.connectionStatusCallbacks.size > 0;
  }
}

// Create singleton instance
const globalRealtimeManager = new GlobalRealtimeManager();

// Expose for debugging
if (typeof window !== 'undefined') {
  window.globalRealtimeManager = globalRealtimeManager;
}

export default globalRealtimeManager;
