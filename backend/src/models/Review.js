const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Review must belong to a user']
  },
  food: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
    required: [true, 'Review must belong to a food item']
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Review must belong to an order']
  },
  rating: {
    type: Number,
    required: [true, 'Review must have a rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  title: {
    type: String,
    required: [true, 'Review must have a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Review must have a comment'],
    trim: true
  },
  images: [{
    type: String,
    trim: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  helpful: {
    type: Number,
    default: 0
  },
  notHelpful: {
    type: Number,
    default: 0
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  adminResponse: {
    text: String,
    date: Date,
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
reviewSchema.index({ food: 1, rating: -1 });
reviewSchema.index({ user: 1, food: 1 }, { unique: true });

// Pre-save middleware to update food ratings
reviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Food = mongoose.model('Food');
    const food = await Food.findById(this.food);
    
    if (food) {
      food.ratings.push({
        user: this.user,
        rating: this.rating,
        review: this.comment,
        date: this.createdAt
      });
      
      await food.save();
    }
  }
  next();
});

// Static method to get review statistics
reviewSchema.statics.getReviewStats = async function(foodId) {
  const stats = await this.aggregate([
    {
      $match: { food: mongoose.Types.ObjectId(foodId) }
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  return stats;
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 