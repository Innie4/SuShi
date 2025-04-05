const express = require('express');
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validators');

const router = express.Router();

// Public routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Protected routes
router.use(authController.protect);
router.patch('/update-password', authController.updatePassword);

module.exports = router; 