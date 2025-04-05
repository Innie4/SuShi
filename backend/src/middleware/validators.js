const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array()
    });
  }
  next();
};

exports.validateRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object'),
  
  handleValidationErrors
];

exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

exports.validateFood = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['sushi', 'burgers', 'salads', 'desserts', 'beverages', 'appetizers'])
    .withMessage('Invalid category'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('image')
    .trim()
    .notEmpty()
    .withMessage('Image URL is required')
    .isURL()
    .withMessage('Please provide a valid image URL'),
  
  body('preparationTime')
    .isInt({ min: 1 })
    .withMessage('Preparation time must be a positive integer'),
  
  body('ingredients')
    .optional()
    .isArray()
    .withMessage('Ingredients must be an array'),
  
  body('nutritionalInfo')
    .optional()
    .isObject()
    .withMessage('Nutritional info must be an object'),
  
  handleValidationErrors
];

exports.validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  
  body('items.*.food')
    .isMongoId()
    .withMessage('Invalid food ID'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  body('items.*.customizations')
    .optional()
    .isArray()
    .withMessage('Customizations must be an array'),
  
  body('deliveryAddress')
    .isObject()
    .withMessage('Delivery address must be an object'),
  
  body('deliveryAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  
  body('deliveryAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  
  body('deliveryAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  
  body('deliveryAddress.zipCode')
    .trim()
    .notEmpty()
    .withMessage('Zip code is required'),
  
  body('deliveryAddress.country')
    .trim()
    .notEmpty()
    .withMessage('Country is required'),
  
  body('paymentMethod')
    .isIn(['credit-card', 'debit-card', 'cash'])
    .withMessage('Invalid payment method'),
  
  body('specialInstructions')
    .optional()
    .isString()
    .withMessage('Special instructions must be a string'),
  
  handleValidationErrors
]; 