import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import { Review } from '../../models/Review';
import { User } from '../../models/User';
import { Food } from '../../models/Food';
import { Order } from '../../models/Order';

describe('Review Controller', () => {
  let userToken: string;
  let user: any;
  let food: any;
  let order: any;

  const validReviewData = {
    rating: 5,
    comment: 'Great food and service!',
    images: ['https://example.com/review1.jpg']
  };

  beforeEach(async () => {
    // Clear collections
    await Review.deleteMany({});
    await User.deleteMany({});
    await Food.deleteMany({});
    await Order.deleteMany({});

    // Create test user
    user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '+1234567890',
      role: 'user',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country'
      }
    });
    userToken = user.generateAuthToken();

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

  describe('POST /api/reviews', () => {
    it('should create a new review when authenticated', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validReviewData,
          food: food._id,
          order: order._id
        })
        .expect(201);

      expect(response.body.data.review.user.toString()).toBe(user._id.toString());
      expect(response.body.data.review.food.toString()).toBe(food._id.toString());
      expect(response.body.data.review.order.toString()).toBe(order._id.toString());
      expect(response.body.data.review.rating).toBe(validReviewData.rating);
      expect(response.body.data.review.comment).toBe(validReviewData.comment);
    });

    it('should fail to create review without authentication', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .send({
          ...validReviewData,
          food: food._id,
          order: order._id
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('authentication');
    });

    it('should fail to create review for non-existent food', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validReviewData,
          food: new mongoose.Types.ObjectId(),
          order: order._id
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('food');
    });

    it('should fail to create review for non-existent order', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validReviewData,
          food: food._id,
          order: new mongoose.Types.ObjectId()
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('order');
    });

    it('should fail to create review for non-completed order', async () => {
      await Order.findByIdAndUpdate(order._id, { status: 'pending' });
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validReviewData,
          food: food._id,
          order: order._id
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('order');
    });
  });

  describe('GET /api/reviews/food/:foodId', () => {
    beforeEach(async () => {
      // Create some test reviews
      await Review.create([
        { ...validReviewData, user: user._id, food: food._id, order: order._id },
        { ...validReviewData, rating: 4, user: user._id, food: food._id, order: order._id }
      ]);
    });

    it('should get all reviews for a food item', async () => {
      const response = await request(app)
        .get(`/api/reviews/food/${food._id}`)
        .expect(200);

      expect(response.body.data.reviews).toHaveLength(2);
      expect(response.body.data.reviews.every((review: any) => review.food.toString() === food._id.toString())).toBe(true);
    });

    it('should calculate average rating correctly', async () => {
      const response = await request(app)
        .get(`/api/reviews/food/${food._id}`)
        .expect(200);

      expect(response.body.data.averageRating).toBe(4.5);
    });
  });

  describe('PATCH /api/reviews/:id', () => {
    let reviewId: string;

    beforeEach(async () => {
      const review = await Review.create({
        ...validReviewData,
        user: user._id,
        food: food._id,
        order: order._id
      });
      reviewId = review._id.toString();
    });

    it('should update review when authenticated as owner', async () => {
      const updateData = {
        rating: 4,
        comment: 'Updated comment'
      };
      const response = await request(app)
        .patch(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.review.rating).toBe(updateData.rating);
      expect(response.body.data.review.comment).toBe(updateData.comment);
    });

    it('should fail to update review without authentication', async () => {
      const response = await request(app)
        .patch(`/api/reviews/${reviewId}`)
        .send({ rating: 4 })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('authentication');
    });

    it('should fail to update review when not owner', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
        phone: '+1234567890',
        role: 'user',
        address: {
          street: '123 Other St',
          city: 'Other City',
          state: 'OS',
          zipCode: '12345',
          country: 'Other Country'
        }
      });
      const otherToken = otherUser.generateAuthToken();

      const response = await request(app)
        .patch(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ rating: 4 })
        .expect(403);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('permission');
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    let reviewId: string;

    beforeEach(async () => {
      const review = await Review.create({
        ...validReviewData,
        user: user._id,
        food: food._id,
        order: order._id
      });
      reviewId = review._id.toString();
    });

    it('should delete review when authenticated as owner', async () => {
      const response = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(204);

      const deletedReview = await Review.findById(reviewId);
      expect(deletedReview).toBeNull();
    });

    it('should fail to delete review without authentication', async () => {
      const response = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('authentication');
    });

    it('should fail to delete review when not owner', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
        phone: '+1234567890',
        role: 'user',
        address: {
          street: '123 Other St',
          city: 'Other City',
          state: 'OS',
          zipCode: '12345',
          country: 'Other Country'
        }
      });
      const otherToken = otherUser.generateAuthToken();

      const response = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('permission');
    });
  });

  describe('POST /api/reviews/:id/like', () => {
    let reviewId: string;

    beforeEach(async () => {
      const review = await Review.create({
        ...validReviewData,
        user: user._id,
        food: food._id,
        order: order._id
      });
      reviewId = review._id.toString();
    });

    it('should increment likes when authenticated', async () => {
      const response = await request(app)
        .post(`/api/reviews/${reviewId}/like`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.review.likes).toBe(1);
    });

    it('should fail to like review without authentication', async () => {
      const response = await request(app)
        .post(`/api/reviews/${reviewId}/like`)
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('authentication');
    });
  });

  describe('POST /api/reviews/:id/dislike', () => {
    let reviewId: string;

    beforeEach(async () => {
      const review = await Review.create({
        ...validReviewData,
        user: user._id,
        food: food._id,
        order: order._id
      });
      reviewId = review._id.toString();
    });

    it('should increment dislikes when authenticated', async () => {
      const response = await request(app)
        .post(`/api/reviews/${reviewId}/dislike`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.review.dislikes).toBe(1);
    });

    it('should fail to dislike review without authentication', async () => {
      const response = await request(app)
        .post(`/api/reviews/${reviewId}/dislike`)
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('authentication');
    });
  });
}); 