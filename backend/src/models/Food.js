const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Food must have a name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Food must have a description']
  },
  category: {
    type: String,
    required: [true, 'Food must have a category'],
    enum: ['sushi', 'burgers', 'salads', 'desserts', 'beverages', 'appetizers']
  },
  price: {
    type: Number,
    required: [true, 'Food must have a price'],
    min: [0, 'Price cannot be negative']
  },
  image: {
    type: String,
    required: [true, 'Food must have an image']
  },
  ingredients: [{
    type: String,
    trim: true
  }],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    allergens: [String]
  },
  preparationTime: {
    type: Number,
    required: [true, 'Food must have a preparation time'],
    min: [0, 'Preparation time cannot be negative']
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isVegan: {
    type: Boolean,
    default: false
  },
  isSpicy: {
    type: Boolean,
    default: false
  },
  spiceLevel: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Rating must be above 0'],
    max: [5, 'Rating must be below 5'],
    set: val => Math.round(val * 10) / 10
  },
  numberOfRatings: {
    type: Number,
    default: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  discount: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    validUntil: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  customization: [{
    name: String,
    options: [{
      name: String,
      price: Number
    }]
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate
foodSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'food',
  localField: '_id'
});

// Pre-save middleware to calculate average rating
foodSchema.pre('save', function(next) {
  if (this.ratings.length > 0) {
    this.averageRating = this.ratings.reduce((acc, item) => acc + item.rating, 0) / this.ratings.length;
    this.numberOfRatings = this.ratings.length;
  }
  next();
});

// Index for text search
foodSchema.index({ name: 'text', description: 'text', tags: 'text' });

const Food = mongoose.model('Food', foodSchema);

module.exports = Food; 