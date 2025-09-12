import mongoose from 'mongoose';

const dailyMenuSchema = new mongoose.Schema({
  dayOfWeek: {
    type: String,
    required: true,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  }],
  sections: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    items: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
    }]
  }],
  published: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
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
dailyMenuSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.published && !this.publishedAt) {
    this.publishedAt = Date.now();
  }
  next();
});

// Ensure only one menu per day
dailyMenuSchema.index({ dayOfWeek: 1 }, { unique: true });

export default mongoose.model('DailyMenu', dailyMenuSchema);
