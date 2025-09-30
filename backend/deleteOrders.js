import mongoose from 'mongoose';
import Order from './src/models/Order.js';
import { config } from './config.js';
import logger from './src/utils/logger.js';

/**
 * Script to delete all orders from the database
 * Usage: node deleteOrders.js
 */

const deleteAllOrders = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    logger.info('Connected to MongoDB');

    // Count orders before deletion
    const countBefore = await Order.countDocuments();
    logger.info(`Found ${countBefore} orders in the database`);

    if (countBefore === 0) {
      logger.info('No orders to delete');
      return;
    }

    // Ask for confirmation (this will show in logs)
    logger.warn('⚠️  WARNING: This will delete ALL orders from the database!');
    logger.info('Proceeding with deletion in 3 seconds...');
    
    // Wait 3 seconds to allow manual cancellation (Ctrl+C)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Delete all orders
    const result = await Order.deleteMany({});
    logger.info(`✅ Successfully deleted ${result.deletedCount} orders`);

    // Verify deletion
    const countAfter = await Order.countDocuments();
    if (countAfter === 0) {
      logger.info('✅ Verification successful: Orders collection is now empty');
    } else {
      logger.warn(`⚠️  Warning: ${countAfter} orders still remain in the database`);
    }

  } catch (error) {
    logger.error('❌ Error deleting orders:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  }
};

// Run the deletion script
deleteAllOrders();
