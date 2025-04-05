import mongoose from 'mongoose';
import { Order } from '../../models/Order';
import { User } from '../../models/User';
import { Food } from '../../models/Food';

describe('Order Model', () => {
  let user: any;
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
    paymentMethod: 'card',
    status: 'pending'
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

    // Set food reference in order data
    validOrderData.items[0].food = food._id;
  });

  it('should create a new order successfully', async () => {
    const order = await Order.create({
      ...validOrderData,
      user: user._id
    });
    expect(order._id).toBeDefined();
    expect(order.user.toString()).toBe(user._id.toString());
    expect(order.items[0].food.toString()).toBe(food._id.toString());
    expect(order.status).toBe('pending');
    expect(order.totalAmount).toBe(food.price * validOrderData.items[0].quantity);
  });

  it('should fail to create order without user', async () => {
    await expect(Order.create(validOrderData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should fail to create order with invalid food item', async () => {
    const invalidOrderData = {
      ...validOrderData,
      user: user._id,
      items: [{ food: new mongoose.Types.ObjectId(), quantity: 1 }]
    };
    await expect(Order.create(invalidOrderData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should find orders by user', async () => {
    await Order.create({
      ...validOrderData,
      user: user._id
    });
    const orders = await Order.find({ user: user._id });
    expect(orders).toHaveLength(1);
    expect(orders[0].user.toString()).toBe(user._id.toString());
  });

  it('should update order status', async () => {
    const order = await Order.create({
      ...validOrderData,
      user: user._id
    });
    const updatedOrder = await Order.findByIdAndUpdate(
      order._id,
      { status: 'preparing' },
      { new: true }
    );
    expect(updatedOrder?.status).toBe('preparing');
  });

  it('should delete order successfully', async () => {
    const order = await Order.create({
      ...validOrderData,
      user: user._id
    });
    await Order.findByIdAndDelete(order._id);
    const deletedOrder = await Order.findById(order._id);
    expect(deletedOrder).toBeNull();
  });

  it('should validate delivery address structure', async () => {
    const invalidOrderData = {
      ...validOrderData,
      user: user._id,
      deliveryAddress: { street: '123 Test St' } // Missing required fields
    };
    await expect(Order.create(invalidOrderData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should calculate total amount correctly', async () => {
    const order = await Order.create({
      ...validOrderData,
      user: user._id
    });
    expect(order.totalAmount).toBe(food.price * validOrderData.items[0].quantity);
  });

  it('should validate payment method', async () => {
    const invalidOrderData = {
      ...validOrderData,
      user: user._id,
      paymentMethod: 'invalid_method'
    };
    await expect(Order.create(invalidOrderData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should track order history', async () => {
    const order = await Order.create({
      ...validOrderData,
      user: user._id
    });
    const updatedOrder = await Order.findByIdAndUpdate(
      order._id,
      { status: 'preparing' },
      { new: true }
    );
    expect(updatedOrder?.orderHistory).toHaveLength(2);
    expect(updatedOrder?.orderHistory[1].status).toBe('preparing');
  });
}); 