import EventEmitter from 'events';

class RealtimeService extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map(); // Map of userId -> Set of SSE connections
  }

  // Add a new SSE connection
  addConnection(userId, res, req) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    
    const userConnections = this.connections.get(userId);
    userConnections.add(res);
    
    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Send initial connection message
    this.sendToConnection(res, {
      type: 'connected',
      message: 'Connected to realtime service'
    });

    // Handle connection close
    req.on('close', () => {
      this.removeConnection(userId, res);
    });

    // Handle connection error
    req.on('error', (error) => {
      console.error('SSE connection error:', error);
      this.removeConnection(userId, res);
    });

    console.log(`SSE connection added for user ${userId}. Total connections: ${userConnections.size}`);
  }

  // Remove a connection
  removeConnection(userId, res) {
    if (this.connections.has(userId)) {
      const userConnections = this.connections.get(userId);
      userConnections.delete(res);
      
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
      
      console.log(`SSE connection removed for user ${userId}. Remaining connections: ${userConnections.size}`);
    }
  }

  // Send data to a specific connection
  sendToConnection(res, data) {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('Error sending SSE data:', error);
    }
  }

  // Broadcast to all connections for a user
  broadcastToUser(userId, data) {
    if (this.connections.has(userId)) {
      const userConnections = this.connections.get(userId);
      userConnections.forEach(res => {
        this.sendToConnection(res, data);
      });
    }
  }

  // Broadcast to all connected users
  broadcastToAll(data) {
    this.connections.forEach((userConnections, userId) => {
      this.broadcastToUser(userId, data);
    });
  }

  // Order-specific events
  onOrderCreated(order) {
    const data = {
      type: 'order.created',
      order: order,
      timestamp: new Date().toISOString()
    };
    
    // Broadcast to all connected admin users
    this.broadcastToAll(data);
    
    // Also emit for other services to listen
    this.emit('order.created', order);
  }

  onOrderUpdated(order, previousStatus) {
    const data = {
      type: 'order.updated',
      order: order,
      previousStatus: previousStatus,
      timestamp: new Date().toISOString()
    };
    
    // Broadcast to all connected admin users
    this.broadcastToAll(data);
    
    // Also emit for other services to listen
    this.emit('order.updated', order, previousStatus);
  }

  onOrderStatusChanged(orderId, newStatus, previousStatus) {
    const data = {
      type: 'order.status_changed',
      orderId: orderId,
      newStatus: newStatus,
      previousStatus: previousStatus,
      timestamp: new Date().toISOString()
    };
    
    this.broadcastToAll(data);
    this.emit('order.status_changed', orderId, newStatus, previousStatus);
  }

  // Get pending orders count for all users
  async getPendingOrdersCount() {
    // This would typically query the database
    // For now, we'll emit an event that can be handled by the orders controller
    this.emit('pending.count.request');
  }

  // Send pending count update
  sendPendingCountUpdate(count) {
    const data = {
      type: 'pending.count',
      count: count,
      timestamp: new Date().toISOString()
    };
    
    this.broadcastToAll(data);
  }

  // Get connection stats
  getStats() {
    const stats = {
      totalUsers: this.connections.size,
      totalConnections: 0
    };
    
    this.connections.forEach((userConnections) => {
      stats.totalConnections += userConnections.size;
    });
    
    return stats;
  }
}

// Create singleton instance
const realtimeService = new RealtimeService();

export default realtimeService;
