import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customer: {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    }
  },
  delivery: {
    type: {
      type: String,
      enum: ['delivery', 'collection'],
      required: true
    },
    address: {
      type: String,
      required: function() {
        return this.delivery.type === 'delivery';
      }
    },
    postcode: {
      type: String,
      required: function() {
        return this.delivery.type === 'delivery';
      }
    }
  },
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    imageUrl: {
      type: String,
      default: null
    }
  }],
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['cash_on_delivery', 'cash_on_collection', 'stripe'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed', 'requires_confirmation'],
      default: 'pending'
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    // Stripe-specific fields
    stripe: {
      paymentIntentId: {
        type: String,
        default: null
      },
      clientSecret: {
        type: String,
        default: null
      },
      refundId: {
        type: String,
        default: null
      },
      refundAmount: {
        type: Number,
        default: 0
      },
      refundReason: {
        type: String,
        default: null
      },
      customRefundReason: {
        type: String,
        default: null
      }
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'ready_for_collection', 'delivered', 'collected'],
    default: 'pending'
  },
  specialRequests: {
    type: String,
    default: null,
    maxlength: 500
  },
  notes: {
    type: String,
    default: null,
    maxlength: 1000
  },
  estimatedDeliveryTime: {
    type: Date,
    default: null
  },
  actualDeliveryTime: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
// Note: orderId index is already created by unique: true in schema definition
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Virtual for order age
orderSchema.virtual('ageInMinutes').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60));
});

// Method to update status
orderSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  // Set timestamps for specific status changes
  if (newStatus === 'delivered' || newStatus === 'collected') {
    this.actualDeliveryTime = new Date();
  }
  
  return this.save();
};

// Method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

// Method to check if order is ready for collection
orderSchema.methods.isReadyForCollection = function() {
  return this.delivery.type === 'collection' && this.status === 'ready_for_collection';
};

// Static method to generate order ID
orderSchema.statics.generateOrderId = function() {
  const prefix = 'TGIF';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

// Static method to get orders by status
orderSchema.statics.getOrdersByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to get orders by customer email
orderSchema.statics.getOrdersByCustomer = function(email) {
  return this.find({ 'customer.email': email }).sort({ createdAt: -1 });
};

// Pre-save middleware to set payment method based on delivery type
orderSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('delivery.type')) {
    // Only set default payment method if not already set (for Stripe payments)
    if (!this.payment.method) {
      if (this.delivery.type === 'delivery') {
        this.payment.method = 'cash_on_delivery';
      } else {
        this.payment.method = 'cash_on_collection';
      }
    }
  }
  next();
});

// Pre-save middleware to calculate pricing
orderSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('items') || this.isModified('delivery.type')) {
    // Calculate subtotal
    this.pricing.subtotal = this.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    // Calculate delivery fee (only for delivery orders)
    this.pricing.deliveryFee = this.delivery.type === 'delivery' ? 2.0 : 0;
    
    // Calculate total
    this.pricing.total = this.pricing.subtotal + this.pricing.deliveryFee;
    
    // Set payment amount
    this.payment.amount = this.pricing.total;
  }
  next();
});

export default mongoose.model('Order', orderSchema);
