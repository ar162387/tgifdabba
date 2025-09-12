import mongoose from 'mongoose';
import User from './src/models/User.js';
import Item from './src/models/Item.js';
import { config } from './config.js';
import logger from './src/utils/logger.js';

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    logger.info('Connected to MongoDB for seeding');

    // Clear existing data (optional - remove in production)
    await User.deleteMany({});
    await Item.deleteMany({});
    logger.info('Cleared existing data');

    // Create admin user
    const adminUser = new User({
      email: 'admin@tgifdabba.com',
      passwordHash: await User.hashPassword('admin123'),
      role: 'admin'
    });
    await adminUser.save();
    logger.info('Admin user created:', adminUser.email);

    // Create sample items
    const sampleItems = [
      {
        name: 'Chicken Tikka Masala',
        description: 'Tender chicken pieces in a rich, creamy tomato-based sauce with aromatic spices',
        allergens: ['dairy'],
        price: 18.99,
        category: 'main',
        active: true
      },
      {
        name: 'Butter Chicken',
        description: 'Succulent chicken in a velvety tomato and butter sauce',
        allergens: ['dairy'],
        price: 19.99,
        category: 'main',
        active: true
      },
      {
        name: 'Vegetable Biryani',
        description: 'Fragrant basmati rice cooked with mixed vegetables and aromatic spices',
        allergens: [],
        price: 16.99,
        category: 'main',
        active: true
      },
      {
        name: 'Samosas',
        description: 'Crispy pastries filled with spiced potatoes and peas',
        allergens: ['gluten'],
        price: 8.99,
        category: 'appetizer',
        active: true
      },
      {
        name: 'Mango Lassi',
        description: 'Refreshing yogurt drink with sweet mango',
        allergens: ['dairy'],
        price: 5.99,
        category: 'beverage',
        active: true
      }
    ];

    for (const itemData of sampleItems) {
      const item = new Item(itemData);
      await item.save();
    }
    logger.info(`Created ${sampleItems.length} sample items`);

    logger.info('Seeding completed successfully!');
    logger.info('Admin credentials:');
    logger.info('Email: admin@tgifdabba.com');
    logger.info('Password: admin123');

  } catch (error) {
    logger.error('Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
};

// Run seeding
seedData();
