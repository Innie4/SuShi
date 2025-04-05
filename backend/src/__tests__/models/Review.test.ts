import mongoose from 'mongoose';
import { Review } from '../../models/Review';
import { User } from '../../models/User';
import { Food } from '../../models/Food';
import { Order } from '../../models/Order';

describe('Review Model', () => {
  let user: any;
  let food: any;
  let order: any;

  const validReviewData = {
    rating: 5,
    comment: 'Great food and service!',
    images: ['https://example.com/review1.jpg'],
    likes: 0,
    dislikes: 0
  };

  beforeEach(async () => {
    // Create test user
    user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '+1234567890',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country'
      }
    });

    // Create test food
    food = await Food.create({
      name: 'Test Sushi',
      description: 'Test Description',
      category: 'sushi',
      price: 10.99,
      image: 'https://example.com/test.jpg',
      preparationTime: 15,
      ingredients: ['rice', 'fish'],
      nutritionalInfo: {
        calories: 300,
        protein: 10,
        carbs: 40,
        fat: 5
      }
    });

    // Create test order
    order = await Order.create({
      user: user._id,
      items: [
        {
          food: food._id,
          quantity: 1
        }
      ],
      deliveryAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country'
      },
      paymentMethod: 'card',
      status: 'completed'
    });
  });

  it('should create a new review successfully', async () => {
    const review = await Review.create({
      ...validReviewData,
      user: user._id,
      food: food._id,
      order: order._id
    });
    expect(review._id).toBeDefined();
    expect(review.user.toString()).toBe(user._id.toString());
    expect(review.food.toString()).toBe(food._id.toString());
    expect(review.order.toString()).toBe(order._id.toString());
    expect(review.rating).toBe(validReviewData.rating);
    expect(review.comment).toBe(validReviewData.comment);
  });

  it('should fail to create review without user', async () => {
    await expect(Review.create({
      ...validReviewData,
      food: food._id,
      order: order._id
    })).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should fail to create review with invalid rating', async () => {
    await expect(Review.create({
      ...validReviewData,
      rating: 6,
      user: user._id,
      food: food._id,
      order: order._id
    })).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should find reviews by food', async () => {
    await Review.create({
      ...validReviewData,
      user: user._id,
      food: food._id,
      order: order._id
    });
    const reviews = await Review.find({ food: food._id });
    expect(reviews).toHaveLength(1);
    expect(reviews[0].food.toString()).toBe(food._id.toString());
  });

  it('should update review successfully', async () => {
    const review = await Review.create({
      ...validReviewData,
      user: user._id,
      food: food._id,
      order: order._id
    });
    const updatedReview = await Review.findByIdAndUpdate(
      review._id,
      { rating: 4, comment: 'Updated comment' },
      { new: true }
    );
    expect(updatedReview?.rating).toBe(4);
    expect(updatedReview?.comment).toBe('Updated comment');
  });

  it('should delete review successfully', async () => {
    const review = await Review.create({
      ...validReviewData,
      user: user._id,
      food: food._id,
      order: order._id
    });
    await Review.findByIdAndDelete(review._id);
    const deletedReview = await Review.findById(review._id);
    expect(deletedReview).toBeNull();
  });

  it('should validate image URLs', async () => {
    const invalidReviewData = {
      ...validReviewData,
      images: ['invalid-url'],
      user: user._id,
      food: food._id,
      order: order._id
    };
    await expect(Review.create(invalidReviewData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should handle likes and dislikes', async () => {
    const review = await Review.create({
      ...validReviewData,
      user: user._id,
      food: food._id,
      order: order._id
    });
    const updatedReview = await Review.findByIdAndUpdate(
      review._id,
      { $inc: { likes: 1, dislikes: 1 } },
      { new: true }
    );
    expect(updatedReview?.likes).toBe(1);
    expect(updatedReview?.dislikes).toBe(1);
  });

  it('should prevent duplicate reviews for the same order', async () => {
    await Review.create({
      ...validReviewData,
      user: user._id,
      food: food._id,
      order: order._id
    });
    await expect(Review.create({
      ...validReviewData,
      user: user._id,
      food: food._id,
      order: order._id
    })).rejects.toThrow(mongoose.Error.DuplicateKeyError);
  });

  it('should update food ratings when review is created', async () => {
    const review = await Review.create({
      ...validReviewData,
      user: user._id,
      food: food._id,
      order: order._id
    });
    const updatedFood = await Food.findById(food._id);
    expect(updatedFood?.ratings.average).toBe(validReviewData.rating);
    expect(updatedFood?.ratings.count).toBe(1);
  });
}); 