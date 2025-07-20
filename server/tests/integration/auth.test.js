const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../../src/app');
const User = require('../../src/models/User');
const { generateToken } = require('../../src/utils/auth');

let mongoServer;
let token;
let userId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

describe('POST /api/auth/register', () => {
  it('should register a new user successfully', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
      firstName: 'John',
      lastName: 'Doe'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'User registered successfully');
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe(userData.username);
    expect(res.body.user.email).toBe(userData.email);
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('should return 400 for invalid email format', async () => {
    const userData = {
      username: 'testuser',
      email: 'invalid-email',
      password: 'Password123'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for weak password', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: '123'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for duplicate username', async () => {
    // Create first user
    await User.create({
      username: 'testuser',
      email: 'test1@example.com',
      password: 'Password123'
    });

    // Try to create second user with same username
    const userData = {
      username: 'testuser',
      email: 'test2@example.com',
      password: 'Password123'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for duplicate email', async () => {
    // Create first user
    await User.create({
      username: 'testuser1',
      email: 'test@example.com',
      password: 'Password123'
    });

    // Try to create second user with same email
    const userData = {
      username: 'testuser2',
      email: 'test@example.com',
      password: 'Password123'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    // Create a test user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123'
    });
    userId = user._id;
  });

  it('should login successfully with correct credentials', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'Password123'
    };

    const res = await request(app)
      .post('/api/auth/login')
      .send(loginData);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Login successful');
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(loginData.email);
  });

  it('should return 400 for invalid email format', async () => {
    const loginData = {
      email: 'invalid-email',
      password: 'Password123'
    };

    const res = await request(app)
      .post('/api/auth/login')
      .send(loginData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 for incorrect password', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'WrongPassword123'
    };

    const res = await request(app)
      .post('/api/auth/login')
      .send(loginData);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 for non-existent email', async () => {
    const loginData = {
      email: 'nonexistent@example.com',
      password: 'Password123'
    };

    const res = await request(app)
      .post('/api/auth/login')
      .send(loginData);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/auth/me', () => {
  beforeEach(async () => {
    // Create a test user and generate token
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123'
    });
    userId = user._id;
    token = generateToken(user);
  });

  it('should return user profile when authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('should return 401 when no token provided', async () => {
    const res = await request(app)
      .get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 when invalid token provided', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PUT /api/auth/profile', () => {
  beforeEach(async () => {
    // Create a test user and generate token
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
      profile: {
        firstName: 'John',
        lastName: 'Doe'
      }
    });
    userId = user._id;
    token = generateToken(user);
  });

  it('should update user profile successfully', async () => {
    const updateData = {
      firstName: 'Jane',
      lastName: 'Smith',
      bio: 'Updated bio'
    };

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Profile updated successfully');
    expect(res.body.user.profile.firstName).toBe(updateData.firstName);
    expect(res.body.user.profile.lastName).toBe(updateData.lastName);
    expect(res.body.user.profile.bio).toBe(updateData.bio);
  });

  it('should return 400 for invalid firstName length', async () => {
    const updateData = {
      firstName: 'a'.repeat(51) // Too long
    };

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for invalid lastName length', async () => {
    const updateData = {
      lastName: 'a'.repeat(51) // Too long
    };

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for invalid bio length', async () => {
    const updateData = {
      bio: 'a'.repeat(501) // Too long
    };

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 when not authenticated', async () => {
    const updateData = {
      firstName: 'Jane'
    };

    const res = await request(app)
      .put('/api/auth/profile')
      .send(updateData);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PUT /api/auth/change-password', () => {
  beforeEach(async () => {
    // Create a test user and generate token
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123'
    });
    userId = user._id;
    token = generateToken(user);
  });

  it('should change password successfully', async () => {
    const passwordData = {
      currentPassword: 'Password123',
      newPassword: 'NewPassword123'
    };

    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send(passwordData);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Password changed successfully');
  });

  it('should return 400 for incorrect current password', async () => {
    const passwordData = {
      currentPassword: 'WrongPassword123',
      newPassword: 'NewPassword123'
    };

    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send(passwordData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for weak new password', async () => {
    const passwordData = {
      currentPassword: 'Password123',
      newPassword: '123'
    };

    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send(passwordData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for missing current password', async () => {
    const passwordData = {
      newPassword: 'NewPassword123'
    };

    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send(passwordData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 when not authenticated', async () => {
    const passwordData = {
      currentPassword: 'Password123',
      newPassword: 'NewPassword123'
    };

    const res = await request(app)
      .put('/api/auth/change-password')
      .send(passwordData);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/auth/logout', () => {
  it('should return success message', async () => {
    const res = await request(app)
      .post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Logged out successfully');
  });
});

describe('POST /api/auth/refresh-token', () => {
  it('should return placeholder message', async () => {
    const res = await request(app)
      .post('/api/auth/refresh-token');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
}); 