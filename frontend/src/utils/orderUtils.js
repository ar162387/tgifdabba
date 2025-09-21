// Utility functions for order management

/**
 * Generate a unique order ID in the same format as the backend
 * Format: TGIF + 8-digit timestamp + 3-digit random number
 * @returns {string} Unique order ID
 */
export const generateOrderId = () => {
  const prefix = 'TGIF';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

/**
 * Validate order ID format
 * @param {string} orderId - Order ID to validate
 * @returns {boolean} True if valid format
 */
export const isValidOrderId = (orderId) => {
  const orderIdRegex = /^TGIF\d{8}\d{3}$/;
  return orderIdRegex.test(orderId);
};

export default {
  generateOrderId,
  isValidOrderId
};
