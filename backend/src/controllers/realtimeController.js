import realtimeService from '../services/realtimeService.js';
import { verifyToken } from '../utils/jwt.js';
import Order from '../models/Order.js';

// SSE endpoint for realtime order notifications
const streamOrders = async (req, res) => {
  try {
    // Extract token from query parameter or Authorization header
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({ 
        error: 'Authentication failed', 
        message: error.message,
        code: 'TOKEN_EXPIRED'
      });
    }

    const userId = decoded.userId;
    
    // Add connection to realtime service
    realtimeService.addConnection(userId, res, req);

    // Send initial pending orders count
    try {
      const pendingCount = await Order.countDocuments({ status: 'pending' });
      realtimeService.sendPendingCountUpdate(pendingCount);
    } catch (error) {
      console.error('Error fetching initial pending count:', error);
    }

    // Keep connection alive with periodic ping
    const pingInterval = setInterval(() => {
      try {
        res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`);
      } catch (error) {
        clearInterval(pingInterval);
        realtimeService.removeConnection(userId, res);
      }
    }, 30000); // Ping every 30 seconds

    // Clean up interval when connection closes
    req.on('close', () => {
      clearInterval(pingInterval);
    });

  } catch (error) {
    console.error('Error setting up SSE connection:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to establish realtime connection' });
    }
  }
};

// Get current pending orders count
const getPendingOrdersCount = async (req, res) => {
  try {
    const count = await Order.countDocuments({ status: 'pending' });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching pending orders count:', error);
    res.status(500).json({ error: 'Failed to fetch pending orders count' });
  }
};

// Get current pending orders for notification panel
const getPendingOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const orders = await Order.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('items.item', 'name price imageUrl')
      .lean();

    const formattedOrders = orders.map(order => ({
      orderId: order.orderId,
      customerName: order.customer.email,
      customerPhone: order.customer.phoneNumber,
      itemsCount: order.items.length,
      total: order.pricing.total,
      placedAt: order.createdAt,
      status: order.status,
      orderData: order
    }));

    res.json({ orders: formattedOrders });
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    res.status(500).json({ error: 'Failed to fetch pending orders' });
  }
};

export {
  streamOrders,
  getPendingOrdersCount,
  getPendingOrders
};
