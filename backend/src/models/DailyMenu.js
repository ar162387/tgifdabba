import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

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
    id: {
      type: String,
      required: false // Make optional to handle existing data
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    itemIds: [{
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
  
  // Generate IDs for sections that don't have them
  if (this.sections && this.sections.length > 0) {
    this.sections.forEach(section => {
      if (!section.id) {
        section.id = randomUUID();
      }
    });
  }
  
  next();
});

// Handle updates
dailyMenuSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  this.set({ updatedAt: Date.now() });
  
  // Generate IDs for sections that don't have them
  const sections = this.getUpdate()?.sections;
  if (sections && sections.length > 0) {
    sections.forEach(section => {
      if (!section.id) {
        section.id = randomUUID();
      }
    });
  }
  
  next();
});

// Ensure only one menu per day
dailyMenuSchema.index({ dayOfWeek: 1 }, { unique: true });

export default mongoose.model('DailyMenu', dailyMenuSchema);
