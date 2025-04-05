const Order = require('../models/Order');
const Food = require('../models/Food');
const { AppError } = require('../middleware/errorHandler');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createOrder = async (req, res, next) => {
  try {
    const { items, deliveryAddress, paymentMethod, specialInstructions } = req.body;

    // Validate items
    const foodItems = await Promise.all(
      items.map(async item => {
        const food = await Food.findById(item.food);
        if (!food) {
          throw new AppError(`Food item ${item.food} not found`, 404);
        }
        if (!food.isAvailable) {
          throw new AppError(`Food item ${food.name} is not available`, 400);
        }
        return {
          food: food._id,
          quantity: item.quantity,
          price: food.price,
          customizations: item.customizations || []
        };
      })
    );

    // Create order
    const order = await Order.create({
      user: req.user._id,
      items: foodItems,
      deliveryAddress,
      paymentMethod,
      specialInstructions,
      deliveryFee: 5 // Fixed delivery fee for now
    });

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order._id.toString()
      }
    });

    res.status(201).json({
      status: 'success',
      data: {
        order,
        clientSecret: paymentIntent.client_secret
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.food', 'name price image');

    if (!order) {
      return next(new AppError('No order found with that ID', 404));
    }

    // Check if user is authorized to view this order
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to view this order', 403));
    }

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.food', 'name price image')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: {
        orders
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new AppError('No order found with that ID', 404));
    }

    // Check if user is authorized to update this order
    if (req.user.role !== 'admin' && req.user.role !== 'driver') {
      return next(new AppError('You are not authorized to update this order', 403));
    }

    // Update order status
    order.status = req.body.status;
    if (req.body.status === 'out-for-delivery') {
      order.driver = req.user._id;
    }
    await order.save();

    // Send push notification to user
    // TODO: Implement push notification

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderLocation = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new AppError('No order found with that ID', 404));
    }

    // Check if user is the assigned driver
    if (order.driver.toString() !== req.user._id.toString()) {
      return next(new AppError('You are not the assigned driver', 403));
    }

    // Update order location
    order.tracking.currentLocation = {
      type: 'Point',
      coordinates: [req.body.longitude, req.body.latitude]
    };
    order.tracking.lastUpdated = Date.now();
    await order.save();

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new AppError('No order found with that ID', 404));
    }

    // Check if user is authorized to cancel this order
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to cancel this order', 403));
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return next(new AppError('This order cannot be cancelled', 400));
    }

    // Update order status
    order.status = 'cancelled';
    await order.save();

    // Refund payment if already paid
    if (order.paymentStatus === 'completed') {
      // TODO: Implement refund logic
    }

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.submitOrderFeedback = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new AppError('No order found with that ID', 404));
    }

    // Check if user is authorized to submit feedback
    if (order.user._id.toString() !== req.user._id.toString()) {
      return next(new AppError('You are not authorized to submit feedback for this order', 403));
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return next(new AppError('Can only submit feedback for delivered orders', 400));
    }

    // Update order feedback
    order.feedback = {
      rating: req.body.rating,
      comment: req.body.comment,
      date: Date.now()
    };
    await order.save();

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderStats = async (req, res, next) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    next(error);
  }
}; 