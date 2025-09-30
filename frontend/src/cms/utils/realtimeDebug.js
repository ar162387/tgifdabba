// Real-time debugging utilities
export const realtimeDebug = {
  // Enable debug mode
  enable() {
    if (typeof window !== 'undefined') {
      window.realtimeDebug = true;
      console.log('🔧 Real-time debugging enabled');
    }
  },

  // Disable debug mode
  disable() {
    if (typeof window !== 'undefined') {
      window.realtimeDebug = false;
      console.log('🔧 Real-time debugging disabled');
    }
  },

  // Log real-time events
  log(eventType, data) {
    if (typeof window !== 'undefined' && window.realtimeDebug) {
      console.log(`🔔 Real-time Event: ${eventType}`, data);
    }
  },

  // Log connection status
  logConnection(status) {
    if (typeof window !== 'undefined' && window.realtimeDebug) {
      console.log(`🔗 Connection Status: ${status.state}`, status);
    }
  },

  // Log order updates
  logOrderUpdate(orderId, oldStatus, newStatus) {
    if (typeof window !== 'undefined' && window.realtimeDebug) {
      console.log(`📦 Order Update: ${orderId} ${oldStatus} → ${newStatus}`);
    }
  },

  // Check for duplicate events
  checkDuplicates(eventType, data, eventHistory = []) {
    const eventKey = `${eventType}-${JSON.stringify(data)}`;
    const isDuplicate = eventHistory.some(history => history.key === eventKey);
    
    if (isDuplicate && typeof window !== 'undefined' && window.realtimeDebug) {
      console.warn(`⚠️ Duplicate event detected: ${eventType}`, data);
    }
    
    return isDuplicate;
  },

  // Get connection stats
  getStats() {
    if (typeof window !== 'undefined' && window.realtimeService) {
      return {
        connectionStatus: window.realtimeService.getConnectionStatus(),
        listeners: window.realtimeService.listeners?.size || 0,
        isConnected: window.realtimeService.connectionState === 'connected'
      };
    }
    return null;
  },

  // Monitor performance
  monitorPerformance() {
    if (typeof window !== 'undefined') {
      const start = performance.now();
      
      return {
        end: () => {
          const end = performance.now();
          const duration = end - start;
          
          if (window.realtimeDebug) {
            console.log(`⏱️ Performance: ${duration.toFixed(2)}ms`);
          }
          
          return duration;
        }
      };
    }
    return { end: () => 0 };
  }
};

// Auto-enable in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  realtimeDebug.enable();
}
