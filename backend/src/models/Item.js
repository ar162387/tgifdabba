import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  allergens: [{
    type: String,
    trim: true
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  imagePublicId: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
itemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Item', itemSchema);
