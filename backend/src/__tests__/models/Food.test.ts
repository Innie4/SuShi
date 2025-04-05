import mongoose from 'mongoose';
import { Food } from '../../models/Food';

describe('Food Model', () => {
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
    ],
    ratings: {
      average: 4.5,
      count: 10
    }
  };

  it('should create a new food item successfully', async () => {
    const food = await Food.create(validFoodData);
    expect(food._id).toBeDefined();
    expect(food.name).toBe(validFoodData.name);
    expect(food.category).toBe(validFoodData.category);
    expect(food.price).toBe(validFoodData.price);
    expect(food.isAvailable).toBe(true); // Default status
  });

  it('should fail to create food with invalid price', async () => {
    const invalidFoodData = { ...validFoodData, price: -10 };
    await expect(Food.create(invalidFoodData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should fail to create food with invalid preparation time', async () => {
    const invalidFoodData = { ...validFoodData, preparationTime: -5 };
    await expect(Food.create(invalidFoodData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should find food by category', async () => {
    await Food.create(validFoodData);
    const foods = await Food.find({ category: validFoodData.category });
    expect(foods).toHaveLength(1);
    expect(foods[0].category).toBe(validFoodData.category);
  });

  it('should update food availability', async () => {
    const food = await Food.create(validFoodData);
    const updatedFood = await Food.findByIdAndUpdate(
      food._id,
      { isAvailable: false },
      { new: true }
    );
    expect(updatedFood?.isAvailable).toBe(false);
  });

  it('should delete food successfully', async () => {
    const food = await Food.create(validFoodData);
    await Food.findByIdAndDelete(food._id);
    const deletedFood = await Food.findById(food._id);
    expect(deletedFood).toBeNull();
  });

  it('should validate nutritional info structure', async () => {
    const invalidFoodData = {
      ...validFoodData,
      nutritionalInfo: { calories: 350 } // Missing required fields
    };
    await expect(Food.create(invalidFoodData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should validate customization options structure', async () => {
    const invalidFoodData = {
      ...validFoodData,
      customizationOptions: [
        {
          name: 'Spice Level' // Missing required fields
        }
      ]
    };
    await expect(Food.create(invalidFoodData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should update ratings correctly', async () => {
    const food = await Food.create(validFoodData);
    const newRating = 5;
    const updatedFood = await Food.findByIdAndUpdate(
      food._id,
      {
        $inc: { 'ratings.count': 1 },
        $set: {
          'ratings.average': (food.ratings.average * food.ratings.count + newRating) / (food.ratings.count + 1)
        }
      },
      { new: true }
    );
    expect(updatedFood?.ratings.count).toBe(food.ratings.count + 1);
    expect(updatedFood?.ratings.average).toBeGreaterThan(food.ratings.average);
  });

  it('should validate image URL format', async () => {
    const invalidFoodData = { ...validFoodData, image: 'invalid-url' };
    await expect(Food.create(invalidFoodData)).rejects.toThrow(mongoose.Error.ValidationError);
  });
}); 