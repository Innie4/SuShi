const express = require('express');
const orderController = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/auth');
const { validateOrder } = require('../middleware/validators');

const router = express.Router();

// All routes are protected
router.use(protect);

// User routes
router.post('/', validateOrder, orderController.createOrder);
router.get('/my-orders', orderController.getUserOrders);
router.get('/:id', orderController.getOrder);
router.post('/:id/cancel', orderController.cancelOrder);
router.post('/:id/feedback', orderController.submitOrderFeedback);

// Driver routes
router.use(restrictTo('driver'));
router.patch('/:id/status', orderController.updateOrderStatus);
router.patch('/:id/location', orderController.updateOrderLocation);

// Admin routes
router.use(restrictTo('admin'));
router.get('/stats', orderController.getOrderStats);

module.exports = router; 