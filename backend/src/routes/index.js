const express = require('express');
const authRoutes = require('./authRoutes');
const foodRoutes = require('./foodRoutes');
const orderRoutes = require('./orderRoutes');
const reviewRoutes = require('./reviewRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/foods', foodRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);
router.use('/users', userRoutes);

module.exports = router; 