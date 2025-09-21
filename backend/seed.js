import mongoose from 'mongoose';
import User from './src/models/User.js';
import Item from './src/models/Item.js';
import DailyMenu from './src/models/DailyMenu.js';
import Order from './src/models/Order.js';
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
    await DailyMenu.deleteMany({});
    await Order.deleteMany({});
    logger.info('Cleared existing data');

    // Create admin user
    const adminUser = new User({
      email: 'admin@tgifdabba.com',
      passwordHash: await User.hashPassword('admin123'),
      role: 'admin'
    });
    await adminUser.save();
    logger.info('Admin user created:', adminUser.email);

    // Create 20 sample items
    const sampleItems = [
      // Main Tiffin Items (8 items)
      {
        name: 'Tiffin 1 - Palak Paneer Special',
        description: 'Palakh paneer curry 300gm, Dal makhani 300gm, Jeera rice 200gm, Chapati 6',
        allergens: ['Gluten', 'Milk (Ghee, Butter, Yogurt)', 'Mustard', 'Red Chilli Powder', 'Sunflower Oil', 'Tree Nuts'],
        price: 9.99,
        active: true,
        imageUrl: '/images/food-image-sizzle.png'
      },
      {
        name: 'Tiffin 2 - Paneer Delight',
        description: 'Palakh paneer curry 300gm, Dal makhani 300gm, Jeera rice 200gm, Paratha 5',
        allergens: ['Gluten', 'Milk (Ghee, Butter, Yogurt)', 'Mustard', 'Red Chilli Powder', 'Sunflower Oil', 'Tree Nuts'],
        price: 10.99,
        active: true,
        imageUrl: '/images/food-image-sizzle.png'
      },
      {
        name: 'Tiffin 3 - Aloo Mutter Combo',
        description: 'Aloo with mutter and tomato curry 300gm, Dal makhani 300gm, Jeera rice 200gm, Chapati 6',
        allergens: ['Gluten', 'Milk (Ghee, Butter, Yogurt)', 'Mustard', 'Red Chilli Powder', 'Sunflower Oil', 'Tree Nuts'],
        price: 8.99,
        active: true,
        imageUrl: '/images/food-image-sizzle.png'
      },
      {
        name: 'Tiffin 4 - Veggie Special',
        description: 'Aloo with mutter and tomato curry 300gm, Dal makhani 300gm, Jeera rice 200gm, Paratha 5',
        allergens: ['Gluten', 'Milk (Ghee, Butter, Yogurt)', 'Mustard', 'Red Chilli Powder', 'Sunflower Oil', 'Tree Nuts'],
        price: 9.99,
        active: true,
        imageUrl: '/images/food-image-sizzle.png'
      },
      {
        name: 'Tiffin 5 - Chana Masala Delight',
        description: 'Chana masala curry 300gm, Rajma curry 300gm, Jeera rice 200gm, Chapati 6',
        allergens: ['Gluten', 'Milk (Ghee, Butter, Yogurt)', 'Mustard', 'Red Chilli Powder', 'Sunflower Oil'],
        price: 8.49,
        active: true,
        imageUrl: '/images/food-image-sizzle.png'
      },
      {
        name: 'Tiffin 6 - Mixed Veg Special',
        description: 'Mixed vegetable curry 300gm, Dal tadka 300gm, Jeera rice 200gm, Paratha 5',
        allergens: ['Gluten', 'Milk (Ghee, Butter, Yogurt)', 'Mustard', 'Red Chilli Powder', 'Sunflower Oil'],
        price: 7.99,
        active: true,
        imageUrl: '/images/food-image-sizzle.png'
      },
      {
        name: 'Tiffin 7 - Rajma Chawal',
        description: 'Rajma curry 300gm, Dal makhani 300gm, Jeera rice 200gm, Chapati 6',
        allergens: ['Gluten', 'Milk (Ghee, Butter, Yogurt)', 'Mustard', 'Red Chilli Powder', 'Sunflower Oil'],
        price: 8.99,
        active: true,
        imageUrl: '/images/food-image-sizzle.png'
      },
      {
        name: 'Tiffin 8 - Weekend Special',
        description: 'Paneer butter masala 300gm, Dal makhani 300gm, Jeera rice 200gm, Naan 4',
        allergens: ['Gluten', 'Milk (Ghee, Butter, Yogurt)', 'Mustard', 'Red Chilli Powder', 'Sunflower Oil', 'Tree Nuts'],
        price: 11.99,
        active: true,
        imageUrl: '/images/food-image-sizzle.png'
      },
      // Add On Items (12 items)
      {
        name: 'Palakh (spinach) with paneer curry 425gm (Add On)',
        description: 'Simple and easy Palak Paneer is a popular Indian dish where Indian cottage cheese is cooked with spinach puree',
        allergens: ['Milk (Ghee, Butter, Yogurt)', 'Red Chilli Powder', 'Sunflower Oil', 'Tree Nuts'],
        price: 6.99,
        active: true,
        imageUrl: '/images/sauce1.jpg'
      },
      {
        name: 'Dal Makhani 425gm (Add On)',
        description: 'Dal makhani is a popular North Indian dish where whole black lentils slow cooked with spices, butter & cream, sautéed onion gravy',
        allergens: ['Milk (Ghee, Butter, Yogurt)', 'Red Chilli Powder', 'Sunflower Oil'],
        price: 5.99,
        active: true,
        imageUrl: '/images/sauce2.jpg'
      },
      {
        name: 'Aloo with mutter and tomato curry 425gm (Add On)',
        description: 'Simple gravy based curry recipe made with boiled potatoes, mutter and tomatoes with Indian masala',
        allergens: ['Mustard', 'Red Chilli Powder', 'Sunflower Oil'],
        price: 4.99,
        active: true,
        imageUrl: '/images/sauce3.jpg'
      },
      {
        name: 'Jeera rice 300gm (Add On)',
        description: 'Steamed Basmati rice, mixed with the whole jeera fried in ghee, garnished with coriander',
        allergens: ['Gluten', 'Milk (Ghee, Butter, Yogurt)', 'Sunflower Oil'],
        price: 3.99,
        active: true,
        imageUrl: '/images/food-image-sizzle.png'
      },
      {
        name: 'Chana Masala 425gm (Add On)',
        description: 'Spicy chickpea curry cooked with onions, tomatoes and aromatic spices',
        allergens: ['Mustard', 'Red Chilli Powder', 'Sunflower Oil'],
        price: 4.49,
        active: true,
        imageUrl: '/images/sauce1.jpg'
      },
      {
        name: 'Rajma Curry 425gm (Add On)',
        description: 'Red kidney beans cooked in a rich tomato and onion gravy with aromatic spices',
        allergens: ['Mustard', 'Red Chilli Powder', 'Sunflower Oil'],
        price: 4.99,
        active: true,
        imageUrl: '/images/sauce2.jpg'
      },
      {
        name: 'Paneer Butter Masala 425gm (Add On)',
        description: 'Cottage cheese cooked in a rich tomato and cream based gravy with aromatic spices',
        allergens: ['Milk (Ghee, Butter, Yogurt)', 'Red Chilli Powder', 'Sunflower Oil', 'Tree Nuts'],
        price: 7.99,
        active: true,
        imageUrl: '/images/sauce3.jpg'
      },
      {
        name: 'Mixed Vegetable Curry 425gm (Add On)',
        description: 'Assorted vegetables cooked in a flavorful tomato and onion gravy',
        allergens: ['Mustard', 'Red Chilli Powder', 'Sunflower Oil'],
        price: 3.99,
        active: true,
        imageUrl: '/images/sauce1.jpg'
      },
      {
        name: 'Dal Tadka 425gm (Add On)',
        description: 'Yellow lentils tempered with cumin, garlic and red chilies',
        allergens: ['Mustard', 'Red Chilli Powder', 'Sunflower Oil'],
        price: 3.49,
        active: true,
        imageUrl: '/images/sauce2.jpg'
      },
      {
        name: 'Chapati 6 pieces (Add On)',
        description: 'Freshly made whole wheat flatbreads, soft and fluffy',
        allergens: ['Gluten'],
        price: 2.99,
        active: true,
        imageUrl: '/images/food-image-sizzle.png'
      },
      {
        name: 'Paratha 4 pieces (Add On)',
        description: 'Layered flatbreads cooked with ghee, stuffed with spiced potatoes',
        allergens: ['Gluten', 'Milk (Ghee, Butter, Yogurt)'],
        price: 3.99,
        active: true,
        imageUrl: '/images/food-image-sizzle.png'
      },
      {
        name: 'Naan 2 pieces (Add On)',
        description: 'Leavened flatbread baked in tandoor, soft and slightly charred',
        allergens: ['Gluten', 'Milk (Ghee, Butter, Yogurt)'],
        price: 4.99,
        active: true,
        imageUrl: '/images/food-image-sizzle.png'
      }
    ];

    const createdItems = [];
    for (const itemData of sampleItems) {
      const item = new Item(itemData);
      await item.save();
      createdItems.push(item);
    }
    logger.info(`Created ${sampleItems.length} sample items`);

    // Create daily menus for all seven days
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const mainTiffinItems = createdItems.slice(0, 8);
    const addOnItems = createdItems.slice(8);

    for (const day of daysOfWeek) {
      const dailyMenu = new DailyMenu({
        dayOfWeek: day,
        items: createdItems.map(item => item._id),
        sections: [
          {
            name: 'Main Tiffin',
            itemIds: mainTiffinItems.map(item => item._id)
          },
          {
            name: 'Add Ons',
            itemIds: addOnItems.map(item => item._id)
          }
        ],
        published: true
      });

      await dailyMenu.save();
      logger.info(`Created ${day} daily menu`);
    }

    // Generate 250 orders from the last 3 months
    const today = new Date('2025-09-12'); // Today's date as specified
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const customerEmails = [
      'john.doe@email.com', 'jane.smith@email.com', 'mike.johnson@email.com',
      'sarah.wilson@email.com', 'david.brown@email.com', 'lisa.davis@email.com',
      'robert.miller@email.com', 'emily.garcia@email.com', 'james.martinez@email.com',
      'amanda.anderson@email.com', 'chris.taylor@email.com', 'jessica.thomas@email.com',
      'daniel.jackson@email.com', 'ashley.white@email.com', 'matthew.harris@email.com',
      'samantha.martin@email.com', 'ryan.thompson@email.com', 'nicole.garcia@email.com',
      'kevin.martinez@email.com', 'stephanie.robinson@email.com'
    ];

    const phoneNumbers = [
      '+44 7700 900001', '+44 7700 900002', '+44 7700 900003', '+44 7700 900004',
      '+44 7700 900005', '+44 7700 900006', '+44 7700 900007', '+44 7700 900008',
      '+44 7700 900009', '+44 7700 900010', '+44 7700 900011', '+44 7700 900012',
      '+44 7700 900013', '+44 7700 900014', '+44 7700 900015', '+44 7700 900016',
      '+44 7700 900017', '+44 7700 900018', '+44 7700 900019', '+44 7700 900020'
    ];

    const addresses = [
      '123 High Street, London, SW1A 1AA',
      '456 Oxford Road, Manchester, M1 1AA',
      '789 Queen Street, Birmingham, B1 1AA',
      '321 King Street, Liverpool, L1 1AA',
      '654 Prince Street, Leeds, LS1 1AA',
      '987 Duke Street, Sheffield, S1 1AA',
      '147 Earl Street, Bristol, BS1 1AA',
      '258 Viscount Street, Newcastle, NE1 1AA',
      '369 Baron Street, Nottingham, NG1 1AA',
      '741 Lord Street, Leicester, LE1 1AA'
    ];

    const orderStatuses = ['pending', 'confirmed', 'cancelled', 'ready_for_collection', 'delivered', 'collected'];
    const paymentStatuses = ['pending', 'paid', 'refunded'];

    const orders = [];
    for (let i = 0; i < 250; i++) {
      // Generate random date within last 3 months
      const randomTime = threeMonthsAgo.getTime() + Math.random() * (today.getTime() - threeMonthsAgo.getTime());
      const orderDate = new Date(randomTime);

      // Random customer details
      const customerEmail = customerEmails[Math.floor(Math.random() * customerEmails.length)];
      const phoneNumber = phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)];
      const address = addresses[Math.floor(Math.random() * addresses.length)];

      // Random delivery type
      const deliveryType = Math.random() > 0.3 ? 'delivery' : 'collection';

      // Random items (1-4 items per order)
      const numItems = Math.floor(Math.random() * 4) + 1;
      const selectedItems = [];
      const usedItemIds = new Set();

      for (let j = 0; j < numItems; j++) {
        let randomItem;
        do {
          randomItem = createdItems[Math.floor(Math.random() * createdItems.length)];
        } while (usedItemIds.has(randomItem._id.toString()));

        usedItemIds.add(randomItem._id.toString());
        selectedItems.push({
          itemId: randomItem._id,
          name: randomItem.name,
          price: randomItem.price,
          quantity: Math.floor(Math.random() * 3) + 1,
          imageUrl: randomItem.imageUrl
        });
      }

      // Calculate pricing
      const subtotal = selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      const deliveryFee = deliveryType === 'delivery' ? 3.0 : 0;
      const total = subtotal + deliveryFee;

      // Random status
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];

      const order = new Order({
        orderId: Order.generateOrderId(),
        customer: {
          email: customerEmail,
          phoneNumber: phoneNumber
        },
        delivery: {
          type: deliveryType,
          address: deliveryType === 'delivery' ? address : undefined,
          postcode: deliveryType === 'delivery' ? address.split(', ')[2] : undefined
        },
        items: selectedItems,
        pricing: {
          subtotal: subtotal,
          deliveryFee: deliveryFee,
          total: total
        },
        payment: {
          method: deliveryType === 'delivery' ? 'cash_on_delivery' : 'cash_on_collection',
          status: paymentStatus,
          amount: total
        },
        status: status,
        specialRequests: Math.random() > 0.7 ? 'Extra spicy please' : null,
        notes: Math.random() > 0.8 ? 'Please deliver after 6 PM' : null,
        estimatedDeliveryTime: status === 'delivered' || status === 'collected' ? 
          new Date(orderDate.getTime() + (30 + Math.random() * 30) * 60000) : null,
        actualDeliveryTime: status === 'delivered' || status === 'collected' ? 
          new Date(orderDate.getTime() + (30 + Math.random() * 30) * 60000) : null,
        createdAt: orderDate,
        updatedAt: orderDate
      });

      orders.push(order);
    }

    // Insert all orders
    await Order.insertMany(orders);
    logger.info(`Created ${orders.length} sample orders`);

    logger.info('Seeding completed successfully!');
    logger.info('Admin credentials:');
    logger.info('Email: admin@tgifdabba.com');
    logger.info('Password: admin123');
    logger.info(`Created ${createdItems.length} items`);
    logger.info(`Created ${daysOfWeek.length} daily menus`);
    logger.info(`Created ${orders.length} orders from last 3 months`);

  } catch (error) {
    logger.error('Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
};

// Run seeding
seedData();
