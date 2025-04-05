const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Order must belong to a user']
  },
  items: [{
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food',
      required: [true, 'Order item must reference a food']
    },
    quantity: {
      type: Number,
      required: [true, 'Order item must have a quantity'],
      min: [1, 'Quantity must be at least 1']
    },
    customizations: [{
      name: String,
      option: String,
      price: Number
    }],
    price: {
      type: Number,
      required: [true, 'Order item must have a price']
    }
  }],
  deliveryAddress: {
    street: {
      type: String,
      required: [true, 'Please provide delivery street address']
    },
    city: {
      type: String,
      required: [true, 'Please provide delivery city']
    },
    state: {
      type: String,
      required: [true, 'Please provide delivery state']
    },
    zipCode: {
      type: String,
      required: [true, 'Please provide delivery zip code']
    },
    country: {
      type: String,
      required: [true, 'Please provide delivery country']
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paymentMethod: {
    type: String,
    enum: ['credit-card', 'debit-card', 'cash'],
    required: [true, 'Please specify payment method']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  subtotal: {
    type: Number,
    required: [true, 'Order must have a subtotal']
  },
  tax: {
    type: Number,
    required: [true, 'Order must have tax amount']
  },
  deliveryFee: {
    type: Number,
    required: [true, 'Order must have delivery fee']
  },
  discount: {
    code: String,
    amount: Number
  },
  total: {
    type: Number,
    required: [true, 'Order must have a total']
  },
  specialInstructions: String,
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  tracking: {
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]
    },
    lastUpdated: Date
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    date: Date
  }
}, {
  timestamps: true
});

// Index for geospatial queries
orderSchema.index({ 'tracking.currentLocation': '2dsphere' });

// Pre-save middleware to calculate totals
orderSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subtotal = this.items.reduce((acc, item) => {
    const itemTotal = item.price * item.quantity;
    const customizationTotal = item.customizations.reduce((sum, custom) => sum + custom.price, 0);
    return acc + itemTotal + customizationTotal;
  }, 0);

  // Calculate tax (assuming 10% tax rate)
  this.tax = this.subtotal * 0.1;

  // Calculate total
  this.total = this.subtotal + this.tax + this.deliveryFee;
  
  // Apply discount if exists
  if (this.discount && this.discount.amount) {
    this.total -= this.discount.amount;
  }

  next();
});

// Static method to get order statistics
orderSchema.statics.getOrderStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$total' }
      }
    }
  ]);

  return stats;
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 