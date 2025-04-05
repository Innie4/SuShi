const Food = require('../models/Food');
const { AppError } = require('../middleware/errorHandler');

// Helper function for filtering
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllFoods = async (req, res, next) => {
  try {
    // Build query
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    let query = Food.find(JSON.parse(queryStr));

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Field limiting
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    // Execute query
    const foods = await query;
    const total = await Food.countDocuments();

    res.status(200).json({
      status: 'success',
      results: foods.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: {
        foods
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getFood = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return next(new AppError('No food found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        food
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.createFood = async (req, res, next) => {
  try {
    const food = await Food.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        food
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateFood = async (req, res, next) => {
  try {
    const food = await Food.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!food) {
      return next(new AppError('No food found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        food
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteFood = async (req, res, next) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);

    if (!food) {
      return next(new AppError('No food found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

exports.getFoodStats = async (req, res, next) => {
  try {
    const stats = await Food.aggregate([
      {
        $group: {
          _id: '$category',
          numFoods: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          avgRating: { $avg: '$averageRating' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },
      {
        $sort: { avgPrice: 1 }
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

exports.searchFoods = async (req, res, next) => {
  try {
    const { query } = req.query;
    const foods = await Food.find({
      $text: { $search: query }
    }).select('name description price category image');

    res.status(200).json({
      status: 'success',
      results: foods.length,
      data: {
        foods
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getFoodsByCategory = async (req, res, next) => {
  try {
    const foods = await Food.find({ category: req.params.category });

    res.status(200).json({
      status: 'success',
      results: foods.length,
      data: {
        foods
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateFoodAvailability = async (req, res, next) => {
  try {
    const food = await Food.findByIdAndUpdate(
      req.params.id,
      { isAvailable: req.body.isAvailable },
      {
        new: true,
        runValidators: true
      }
    );

    if (!food) {
      return next(new AppError('No food found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        food
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateFoodDiscount = async (req, res, next) => {
  try {
    const food = await Food.findByIdAndUpdate(
      req.params.id,
      {
        discount: {
          percentage: req.body.percentage,
          validUntil: req.body.validUntil
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!food) {
      return next(new AppError('No food found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        food
      }
    });
  } catch (error) {
    next(error);
  }
}; 