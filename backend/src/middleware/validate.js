import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    console.log('Request body:', req.body);
    console.log('Request params:', req.params);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Auth validation rules
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

export const validateProfileUpdate = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('currentPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Current password must be at least 6 characters long'),
  body('newPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  handleValidationErrors
];

// Item validation rules
export const validateItem = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be less than 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description is required and must be less than 500 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('allergens')
    .optional()
    .custom((value) => {
      // Handle both array and JSON string formats
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch {
          return false;
        }
      }
      return Array.isArray(value);
    })
    .withMessage('Allergens must be an array'),
  handleValidationErrors
];

// Daily Menu validation rules
export const validateDailyMenu = [
  body('dayOfWeek')
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Valid day of week is required'),
  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array'),
  body('sections')
    .optional()
    .isArray()
    .withMessage('Sections must be an array'),
  handleValidationErrors
];

// Daily Menu update validation rules (dayOfWeek not required for updates)
export const validateDailyMenuUpdate = [
  body('dayOfWeek')
    .optional()
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Valid day of week is required'),
  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array'),
  body('sections')
    .optional()
    .isArray()
    .withMessage('Sections must be an array'),
  body('published')
    .optional()
    .isBoolean()
    .withMessage('Published must be a boolean'),
  handleValidationErrors
];

// Order validation rules
export const validateOrderUpdate = [
  body('status')
    .isIn(['pending', 'preparing', 'delivered', 'canceled'])
    .withMessage('Valid status is required'),
  handleValidationErrors
];

// Order creation validation rules
export const validateOrderCreation = [
  body('customer.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid customer email is required'),
  body('customer.phoneNumber')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 characters'),
  body('delivery.type')
    .isIn(['delivery', 'collection'])
    .withMessage('Delivery type must be either delivery or collection'),
  body('delivery.address')
    .if(body('delivery.type').equals('delivery'))
    .notEmpty()
    .withMessage('Delivery address is required for delivery orders'),
  body('delivery.postcode')
    .if(body('delivery.type').equals('delivery'))
    .notEmpty()
    .withMessage('Postcode is required for delivery orders'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.itemId')
    .isMongoId()
    .withMessage('Valid item ID is required'),
  body('items.*.quantity')
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be between 1 and 10'),
  body('specialRequests')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Special requests must be less than 500 characters'),
  handleValidationErrors
];

// Order status update validation rules
export const validateOrderStatusUpdate = [
  body('status')
    .isIn(['pending', 'confirmed', 'cancelled', 'ready_for_collection', 'delivered', 'collected'])
    .withMessage('Valid status is required'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  handleValidationErrors
];

// Order cancellation validation rules
export const validateOrderCancellation = [
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters'),
  handleValidationErrors
];

// Contact validation rules
export const validateContact = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be less than 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message is required and must be less than 1000 characters'),
  handleValidationErrors
];
