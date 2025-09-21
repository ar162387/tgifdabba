import React, { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { STRIPE_CONFIG } from '../../config/stripe';
import Button from '../ui/Button';

// Initialize Stripe with error handling
const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey).catch((error) => {
  console.error('Failed to load Stripe:', error);
  return null;
});

// Suppress HTTPS warning in development
if (import.meta.env.DEV) {
  const originalWarn = console.warn;
  console.warn = (message) => {
    if (typeof message === 'string' && message.includes('HTTPS')) {
      return; // Suppress HTTPS warnings in development
    }
    originalWarn(message);
  };
}

// Card element options
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#ef4444',
    },
  },
  hidePostalCode: true, // We'll collect this separately
};

// Payment form component
const PaymentForm = ({ 
  clientSecret, 
  onPaymentSuccess, 
  onPaymentError, 
  isLoading, 
  disabled = false,
  onPaymentIntentNeeded
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(false);
  const paymentAttemptedRef = useRef(false);

  // Auto-retry payment when clientSecret becomes available after creating payment intent
  useEffect(() => {
    if (clientSecret && pendingPayment && !paymentAttemptedRef.current) {
      console.log('Client secret received, auto-retrying payment...');
      paymentAttemptedRef.current = true;
      setPendingPayment(false);
      // Trigger payment confirmation automatically
      handlePaymentConfirmation();
    }
  }, [clientSecret, pendingPayment]);

  const handlePaymentConfirmation = async () => {
    if (!stripe || !elements) {
      console.warn('Stripe or elements not ready');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    
    if (!cardElement) {
      setError('Card information is required. Please try again.');
      setIsProcessing(false);
      return;
    }

    console.log('Attempting payment confirmation with client secret:', clientSecret);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        console.error('Payment failed:', error);
        setError(error.message || 'Payment failed. Please try again.');
        onPaymentError?.(error);
      } else if (paymentIntent) {
        console.log('Payment result:', paymentIntent);
        
        // Handle different payment intent statuses
        switch (paymentIntent.status) {
          case 'succeeded':
            onPaymentSuccess?.(paymentIntent);
            break;
          case 'requires_action':
            // Handle 3D Secure authentication
            setError('Additional authentication required. Please try again.');
            onPaymentError?.(new Error('Additional authentication required'));
            break;
          case 'requires_payment_method':
            setError('Payment method was declined. Please try a different card.');
            onPaymentError?.(new Error('Payment method declined'));
            break;
          case 'requires_confirmation':
            setError('Payment requires confirmation. Please try again.');
            onPaymentError?.(new Error('Payment requires confirmation'));
            break;
          default:
            console.error('Unexpected payment status:', paymentIntent.status);
            setError(`Payment was not completed (Status: ${paymentIntent.status}). Please try again.`);
            onPaymentError?.(new Error(`Payment not completed: ${paymentIntent.status}`));
        }
      } else {
        setError('No payment result received. Please try again.');
        onPaymentError?.(new Error('No payment result'));
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An unexpected error occurred. Please try again.');
      onPaymentError?.(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || disabled || isLoading) {
      console.warn('Payment form not ready:', { stripe: !!stripe, elements: !!elements, disabled, isLoading });
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    
    if (!cardElement) {
      setError('Card information is required. Please try again.');
      setIsProcessing(false);
      return;
    }

    // If no client secret, create payment intent first
    if (!clientSecret) {
      try {
        console.log('Creating payment intent...');
        setPendingPayment(true);
        paymentAttemptedRef.current = false;
        await onPaymentIntentNeeded?.();
        // Don't set isProcessing to false here - let the useEffect handle the retry
        return;
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Failed to prepare payment. Please try again.');
        setIsProcessing(false);
        setPendingPayment(false);
        return;
      }
    }

    // If we have client secret, proceed with payment confirmation
    await handlePaymentConfirmation();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="p-4 border border-gray-300 rounded-lg bg-white">
          <CardElement options={cardElementOptions} />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Your payment information is secure and encrypted</span>
      </div>

      <Button
        type="submit"
        variant="black"
        size="large"
        className="w-full"
        disabled={!stripe || isProcessing || disabled || isLoading}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing Payment...
          </div>
        ) : (
          'Pay with Card'
        )}
      </Button>
    </form>
  );
};

// Main Stripe payment component
const StripePaymentForm = ({ 
  clientSecret, 
  onPaymentSuccess, 
  onPaymentError, 
  isLoading = false,
  disabled = false,
  onPaymentIntentNeeded
}) => {

  // Check if Stripe failed to load
  if (!stripePromise) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 text-sm">
          Failed to load payment system. Please refresh the page and try again.
        </p>
      </div>
    );
  }

  // Validate client secret format only if provided
  if (clientSecret && (!clientSecret.startsWith('pi_') || !clientSecret.includes('_secret_'))) {
    console.error('Invalid client secret format:', clientSecret);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 text-sm">
          Invalid payment configuration. Please try again.
        </p>
      </div>
    );
  }

  console.log('StripePaymentForm rendering with client secret:', clientSecret);

  return (
    <Elements stripe={stripePromise} options={STRIPE_CONFIG.options}>
      <PaymentForm
        clientSecret={clientSecret}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
        isLoading={isLoading}
        disabled={disabled}
        onPaymentIntentNeeded={onPaymentIntentNeeded}
      />
    </Elements>
  );
};

export default StripePaymentForm;
