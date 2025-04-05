import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import { Food } from '../../models/Food';
import { User } from '../../models/User';

describe('Food Controller', () => {
  let adminToken: string;
  let adminUser: any;

  const validFoodData = {
    name: 'Test Sushi Roll',
    description: 'A delicious test sushi roll',
    category: 'sushi',
    price: 12.99,
    image: 'https://example.com/test-sushi.jpg',
    preparationTime: 15,
    ingredients: ['rice', 'fish', 'seaweed'],
    nutritionalInfo: {
      calories: 350,
      protein: 15,
      carbs: 45,
      fat: 8
    },
    customizationOptions: [
      {
        name: 'Spice Level',
        options: ['Mild', 'Medium', 'Hot'],
        default: 'Medium'
      }
    ]
  };

  beforeEach(async () => {
    // Clear collections
    await Food.deleteMany({});
    await User.deleteMany({});

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
  });

  describe('GET /api/foods', () => {
    beforeEach(async () => {
      // Create some test food items
      await Food.create([
        { ...validFoodData, name: 'Sushi Roll 1' },
        { ...validFoodData, name: 'Sushi Roll 2' },
        { ...validFoodData, name: 'Sushi Roll 3' }
      ]);
    });

    it('should get all food items', async () => {
      const response = await request(app)
        .get('/api/foods')
        .expect(200);

      expect(response.body.data.foods).toHaveLength(3);
      expect(response.body.data.total).toBe(3);
    });

    it('should filter food items by category', async () => {
      const response = await request(app)
        .get('/api/foods?category=sushi')
        .expect(200);

      expect(response.body.data.foods).toHaveLength(3);
      expect(response.body.data.foods.every((food: any) => food.category === 'sushi')).toBe(true);
    });

    it('should filter food items by availability', async () => {
      await Food.create({ ...validFoodData, name: 'Unavailable Roll', isAvailable: false });
      const response = await request(app)
        .get('/api/foods?isAvailable=true')
        .expect(200);

      expect(response.body.data.foods).toHaveLength(3);
      expect(response.body.data.foods.every((food: any) => food.isAvailable)).toBe(true);
    });

    it('should sort food items by price', async () => {
      await Food.create([
        { ...validFoodData, name: 'Cheap Roll', price: 5.99 },
        { ...validFoodData, name: 'Expensive Roll', price: 19.99 }
      ]);

      const response = await request(app)
        .get('/api/foods?sort=price')
        .expect(200);

      const prices = response.body.data.foods.map((food: any) => food.price);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });
  });

  describe('GET /api/foods/search', () => {
    beforeEach(async () => {
      await Food.create([
        { ...validFoodData, name: 'Spicy Tuna Roll' },
        { ...validFoodData, name: 'California Roll' },
        { ...validFoodData, name: 'Salmon Roll' }
      ]);
    });

    it('should search food items by name', async () => {
      const response = await request(app)
        .get('/api/foods/search?q=spicy')
        .expect(200);

      expect(response.body.data.foods).toHaveLength(1);
      expect(response.body.data.foods[0].name).toBe('Spicy Tuna Roll');
    });

    it('should search food items by ingredients', async () => {
      const response = await request(app)
        .get('/api/foods/search?q=fish')
        .expect(200);

      expect(response.body.data.foods.length).toBeGreaterThan(0);
      expect(response.body.data.foods.every((food: any) => food.ingredients.includes('fish'))).toBe(true);
    });
  });

  describe('POST /api/foods', () => {
    it('should create a new food item when authenticated as admin', async () => {
      const response = await request(app)
        .post('/api/foods')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validFoodData)
        .expect(201);

      expect(response.body.data.food.name).toBe(validFoodData.name);
      expect(response.body.data.food.price).toBe(validFoodData.price);
    });

    it('should fail to create food item without authentication', async () => {
      const response = await request(app)
        .post('/api/foods')
        .send(validFoodData)
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('authentication');
    });

    it('should fail to create food item with invalid data', async () => {
      const invalidData = { ...validFoodData, price: -10 };
      const response = await request(app)
        .post('/api/foods')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('price');
    });
  });

  describe('PATCH /api/foods/:id', () => {
    let foodId: string;

    beforeEach(async () => {
      const food = await Food.create(validFoodData);
      foodId = food._id.toString();
    });

    it('should update food item when authenticated as admin', async () => {
      const updateData = { price: 14.99 };
      const response = await request(app)
        .patch(`/api/foods/${foodId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.food.price).toBe(updateData.price);
    });

    it('should fail to update food item without authentication', async () => {
      const response = await request(app)
        .patch(`/api/foods/${foodId}`)
        .send({ price: 14.99 })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('authentication');
    });

    it('should fail to update non-existent food item', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .patch(`/api/foods/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 14.99 })
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /api/foods/:id', () => {
    let foodId: string;

    beforeEach(async () => {
      const food = await Food.create(validFoodData);
      foodId = food._id.toString();
    });

    it('should delete food item when authenticated as admin', async () => {
      const response = await request(app)
        .delete(`/api/foods/${foodId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const deletedFood = await Food.findById(foodId);
      expect(deletedFood).toBeNull();
    });

    it('should fail to delete food item without authentication', async () => {
      const response = await request(app)
        .delete(`/api/foods/${foodId}`)
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('authentication');
    });

    it('should fail to delete non-existent food item', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .delete(`/api/foods/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('not found');
    });
  });
}); 