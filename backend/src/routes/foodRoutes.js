const express = require('express');
const foodController = require('../controllers/foodController');
const { protect, restrictTo } = require('../middleware/auth');
const { validateFood } = require('../middleware/validators');

const router = express.Router();

// Public routes
router.get('/', foodController.getAllFoods);
router.get('/search', foodController.searchFoods);
router.get('/category/:category', foodController.getFoodsByCategory);
router.get('/stats', foodController.getFoodStats);
router.get('/:id', foodController.getFood);

// Protected routes (admin only)
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', validateFood, foodController.createFood);
router.patch('/:id', validateFood, foodController.updateFood);
router.delete('/:id', foodController.deleteFood);
router.patch('/:id/availability', foodController.updateFoodAvailability);
router.patch('/:id/discount', foodController.updateFoodDiscount);

module.exports = router; 