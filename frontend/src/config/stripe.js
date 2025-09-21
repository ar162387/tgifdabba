// Stripe configuration
export const STRIPE_CONFIG = {
  // Replace with your actual Stripe publishable key
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890abcdefghijklmnopqrstuvwxyz',
  
  // Stripe options
  options: {
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#f97316', // Orange theme to match your brand
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
      rules: {
        '.Input': {
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '16px',
        },
        '.Input:focus': {
          borderColor: '#f97316',
          boxShadow: '0 0 0 2px rgba(249, 115, 22, 0.1)',
        },
        '.Label': {
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '8px',
        },
        '.Error': {
          color: '#ef4444',
          fontSize: '14px',
          marginTop: '4px',
        },
      },
    },
    loader: 'auto',
  },
};

// Payment method options
export const PAYMENT_METHODS = {
  CASH_ON_DELIVERY: 'cash_on_delivery',
  CASH_ON_COLLECTION: 'cash_on_collection',
  STRIPE: 'stripe',
};

// Payment method labels
export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH_ON_DELIVERY]: 'Cash on Delivery',
  [PAYMENT_METHODS.CASH_ON_COLLECTION]: 'Cash on Collection',
  [PAYMENT_METHODS.STRIPE]: 'Card Payment',
};

// Payment method descriptions
export const PAYMENT_METHOD_DESCRIPTIONS = {
  [PAYMENT_METHODS.CASH_ON_DELIVERY]: 'Pay with cash when your order arrives',
  [PAYMENT_METHODS.CASH_ON_COLLECTION]: 'Pay with cash when you collect your order',
  [PAYMENT_METHODS.STRIPE]: 'Pay securely with your card',
};
