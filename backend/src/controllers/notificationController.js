import Order from '../models/Order.js';
import Contact from '../models/Contact.js';
import logger from '../utils/logger.js';

export const getNotificationCounters = async (req, res, next) => {
  try {
    const [ordersNew, contactsNew] = await Promise.all([
      Order.countDocuments({ read: false }),
      Contact.countDocuments({ read: false })
    ]);

    const counters = {
      ordersNew,
      contactsNew,
      totalNew: ordersNew + contactsNew
    };

    res.json({
      success: true,
      data: counters
    });
  } catch (error) {
    logger.error('Get notification counters error', error);
    next(error);
  }
};

export const getRecentActivity = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const [recentOrders, recentContacts] = await Promise.all([
      Order.find()
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .populate('items.item', 'name')
        .select('customer status totals createdAt'),
      Contact.find()
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .select('name email subject read createdAt')
    ]);

    // Combine and sort by creation date
    const activities = [
      ...recentOrders.map(order => ({
        type: 'order',
        id: order._id,
        title: `New order from ${order.customer.name}`,
        subtitle: `$${order.totals.total} - ${order.status}`,
        timestamp: order.createdAt,
        read: order.read
      })),
      ...recentContacts.map(contact => ({
        type: 'contact',
        id: contact._id,
        title: `Contact from ${contact.name}`,
        subtitle: contact.subject || contact.email,
        timestamp: contact.createdAt,
        read: contact.read
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: activities.slice(0, parseInt(limit))
    });
  } catch (error) {
    logger.error('Get recent activity error', error);
    next(error);
  }
};
