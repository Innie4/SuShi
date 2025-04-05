import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import { Order } from '../../models/Order';
import { User } from '../../models/User';
import { Food } from '../../models/Food';

describe('Order Controller', () => {
  let userToken: string;
  let user: any;
  let adminToken: string;
  let adminUser: any;
  let driverToken: string;
  let driverUser: any;
  let food: any;

  const validOrderData = {
    items: [
      {
        food: null, // Will be set in beforeEach
        quantity: 2,
        customization: {
          'Spice Level': 'Hot'
        }
      }
    ],
    deliveryAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country'
    },
    paymentMethod: 'card'
  };

  beforeEach(async () => {
    // Clear collections
    await Order.deleteMany({});
    await User.deleteMany({});
    await Food.deleteMany({});

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

    // Create regular user
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

    // Create admin user
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      phone: '+1234567890',
      role: 'admin',
      address: {
        street: '123 Admin St',
        city: 'Admin City',
        state: 'AS',
        zipCode: '12345',
        country: 'Admin Country'
      }
    });
    adminToken = adminUser.generateAuthToken();

    // Create driver user
    driverUser = await User.create({
      name: 'Driver User',
      email: 'driver@example.com',
      password: 'password123',
      phone: '+1234567890',
      role: 'driver',
      address: {
        street: '123 Driver St',
        city: 'Driver City',
        state: 'DS',
        zipCode: '12345',
        country: 'Driver Country'
      }
    });
    driverToken = driverUser.generateAuthToken();

    // Set food reference in order data
    validOrderData.items[0].food = food._id;
  });

  describe('POST /api/orders', () => {
    it('should create a new order when authenticated', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validOrderData)
        .expect(201);

      expect(response.body.data.order.user.toString()).toBe(user._id.toString());
      expect(response.body.data.order.items[0].food.toString()).toBe(food._id.toString());
      expect(response.body.data.order.status).toBe('pending');
      expect(response.body.data.order.totalAmount).toBe(food.price * validOrderData.items[0].quantity);
    });

    it('should fail to create order without authentication', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send(validOrderData)
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('authentication');
    });

    it('should fail to create order with invalid food item', async () => {
      const invalidData = {
        ...validOrderData,
        items: [{ food: new mongoose.Types.ObjectId(), quantity: 1 }]
      };
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('food');
    });
  });

  describe('GET /api/orders/my-orders', () => {
    beforeEach(async () => {
      // Create some test orders
      await Order.create([
        { ...validOrderData, user: user._id, status: 'pending' },
        { ...validOrderData, user: user._id, status: 'completed' }
      ]);
    });

    it('should get user orders when authenticated', async () => {
      const response = await request(app)
        .get('/api/orders/my-orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.orders).toHaveLength(2);
      expect(response.body.data.orders.every((order: any) => order.user.toString() === user._id.toString())).toBe(true);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/orders/my-orders?status=pending')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].status).toBe('pending');
    });
  });

  describe('GET /api/orders/:id', () => {
    let orderId: string;

    beforeEach(async () => {
      const order = await Order.create({
        ...validOrderData,
        user: user._id
      });
      orderId = order._id.toString();
    });

    it('should get order details when authenticated as owner', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.order._id.toString()).toBe(orderId);
    });

    it('should get order details when authenticated as admin', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.order._id.toString()).toBe(orderId);
    });

    it('should fail to get order details without authentication', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('authentication');
    });
  });

  describe('POST /api/orders/:id/cancel', () => {
    let orderId: string;

    beforeEach(async () => {
      const order = await Order.create({
        ...validOrderData,
        user: user._id,
        status: 'pending'
      });
      orderId = order._id.toString();
    });

    it('should cancel order when authenticated as owner', async () => {
      const response = await request(app)
        .post(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.order.status).toBe('cancelled');
    });

    it('should fail to cancel order when not owner', async () => {
      const response = await request(app)
        .post(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('permission');
    });

    it('should fail to cancel non-pending order', async () => {
      await Order.findByIdAndUpdate(orderId, { status: 'completed' });
      const response = await request(app)
        .post(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('status');
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    let orderId: string;

    beforeEach(async () => {
      const order = await Order.create({
        ...validOrderData,
        user: user._id,
        status: 'pending'
      });
      orderId = order._id.toString();
    });

    it('should update order status when authenticated as driver', async () => {
      const response = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ status: 'preparing' })
        .expect(200);

      expect(response.body.data.order.status).toBe('preparing');
    });

    it('should fail to update order status without authentication', async () => {
      const response = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .send({ status: 'preparing' })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('authentication');
    });

    it('should fail to update order status when not driver', async () => {
      const response = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'preparing' })
        .expect(403);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('permission');
    });
  });

  describe('PATCH /api/orders/:id/location', () => {
    let orderId: string;

    beforeEach(async () => {
      const order = await Order.create({
        ...validOrderData,
        user: user._id,
        status: 'out_for_delivery',
        driver: driverUser._id
      });
      orderId = order._id.toString();
    });

    it('should update order location when authenticated as assigned driver', async () => {
      const location = {
        latitude: 40.7128,
        longitude: -74.0060
      };
      const response = await request(app)
        .patch(`/api/orders/${orderId}/location`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send(location)
        .expect(200);

      expect(response.body.data.order.deliveryLocation).toEqual(location);
    });

    it('should fail to update order location when not assigned driver', async () => {
      const response = await request(app)
        .patch(`/api/orders/${orderId}/location`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ latitude: 40.7128, longitude: -74.0060 })
        .expect(403);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('permission');
    });
  });
}); 