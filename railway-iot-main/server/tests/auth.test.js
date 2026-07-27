import request from 'supertest';
import app from '../app.js';
import { connectDB, disconnectDB, clearDB } from './setup.js';

beforeAll(async () => {
  await connectDB();
});

afterEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await disconnectDB();
});

describe('Auth API Endpoints', () => {
  const userData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', userData.email);
    });

    it('should not register a user with an existing email', async () => {
      await request(app).post('/api/auth/register').send(userData);
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      expect(res.statusCode).toEqual(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(userData);
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
    });

    it('should fail with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: 'wrongpassword' });
      
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/auth/user', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send(userData);
      token = res.body.token;
    });

    it('should get logged in user data', async () => {
      const res = await request(app)
        .get('/api/auth/user')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('email', userData.email);
    });

    it('should fail without token', async () => {
      const res = await request(app).get('/api/auth/user');
      expect(res.statusCode).toEqual(401);
    });
  });
});
