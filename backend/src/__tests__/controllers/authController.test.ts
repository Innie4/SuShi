import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import { User } from '../../models/User';
import { hashPassword } from '../../utils/auth';

describe('Auth Controller', () => {
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

  beforeEach(async () => {
    // Clear the users collection before each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should fail to register with invalid email', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('email');
    });

    it('should fail to register with duplicate email', async () => {
      await User.create(validUserData);
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('email');
    });

    it('should fail to register with weak password', async () => {
      const invalidData = { ...validUserData, password: 'weak' };
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('password');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await User.create(validUserData);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password
        })
        .expect(200);

      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should fail to login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('password');
    });

    it('should fail to login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: validUserData.password
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('email');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      await User.create(validUserData);
    });

    it('should send password reset email for valid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: validUserData.email })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('email');
    });

    it('should handle non-existent email gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('email');
    });
  });

  describe('PATCH /api/auth/reset-password/:token', () => {
    let resetToken: string;

    beforeEach(async () => {
      const user = await User.create(validUserData);
      resetToken = user.createPasswordResetToken();
      await user.save();
    });

    it('should reset password with valid token', async () => {
      const response = await request(app)
        .patch(`/api/auth/reset-password/${resetToken}`)
        .send({
          password: 'newpassword123'
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('password');

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: 'newpassword123'
        })
        .expect(200);

      expect(loginResponse.body.data.token).toBeDefined();
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .patch('/api/auth/reset-password/invalid-token')
        .send({
          password: 'newpassword123'
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('token');
    });
  });

  describe('PATCH /api/auth/update-password', () => {
    let token: string;

    beforeEach(async () => {
      const user = await User.create(validUserData);
      token = user.generateAuthToken();
    });

    it('should update password when authenticated', async () => {
      const response = await request(app)
        .patch('/api/auth/update-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: validUserData.password,
          newPassword: 'newpassword123'
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('password');

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: 'newpassword123'
        })
        .expect(200);

      expect(loginResponse.body.data.token).toBeDefined();
    });

    it('should fail with incorrect current password', async () => {
      const response = await request(app)
        .patch('/api/auth/update-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('password');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .patch('/api/auth/update-password')
        .send({
          currentPassword: validUserData.password,
          newPassword: 'newpassword123'
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('authentication');
    });
  });
}); 