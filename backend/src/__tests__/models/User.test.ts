import mongoose from 'mongoose';
import { User } from '../../models/User';
import { hashPassword } from '../../utils/auth';

describe('User Model', () => {
  const validUserData = {
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
  };

  it('should create a new user successfully', async () => {
    const user = await User.create(validUserData);
    expect(user._id).toBeDefined();
    expect(user.name).toBe(validUserData.name);
    expect(user.email).toBe(validUserData.email);
    expect(user.password).not.toBe(validUserData.password); // Password should be hashed
    expect(user.phone).toBe(validUserData.phone);
    expect(user.address).toEqual(validUserData.address);
    expect(user.role).toBe('user'); // Default role
    expect(user.isActive).toBe(true); // Default status
  });

  it('should fail to create user with invalid email', async () => {
    const invalidUserData = { ...validUserData, email: 'invalid-email' };
    await expect(User.create(invalidUserData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should fail to create user with duplicate email', async () => {
    await User.create(validUserData);
    await expect(User.create(validUserData)).rejects.toThrow(mongoose.Error.DuplicateKeyError);
  });

  it('should find user by email', async () => {
    await User.create(validUserData);
    const user = await User.findOne({ email: validUserData.email });
    expect(user).toBeDefined();
    expect(user?.email).toBe(validUserData.email);
  });

  it('should update user successfully', async () => {
    const user = await User.create(validUserData);
    const updateData = { name: 'Updated Name' };
    const updatedUser = await User.findByIdAndUpdate(user._id, updateData, { new: true });
    expect(updatedUser?.name).toBe(updateData.name);
  });

  it('should delete user successfully', async () => {
    const user = await User.create(validUserData);
    await User.findByIdAndDelete(user._id);
    const deletedUser = await User.findById(user._id);
    expect(deletedUser).toBeNull();
  });

  it('should hash password before saving', async () => {
    const user = await User.create(validUserData);
    const hashedPassword = await hashPassword(validUserData.password);
    expect(user.password).toBe(hashedPassword);
  });

  it('should validate phone number format', async () => {
    const invalidUserData = { ...validUserData, phone: 'invalid-phone' };
    await expect(User.create(invalidUserData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should validate address structure', async () => {
    const invalidUserData = {
      ...validUserData,
      address: { street: '123 Test St' } // Missing required fields
    };
    await expect(User.create(invalidUserData)).rejects.toThrow(mongoose.Error.ValidationError);
  });
}); 