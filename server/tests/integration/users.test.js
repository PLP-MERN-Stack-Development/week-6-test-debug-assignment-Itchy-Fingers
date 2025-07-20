const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../../src/app');
const User = require('../../src/models/User');
const Post = require('../../src/models/Post');
const { generateToken } = require('../../src/utils/auth');

let mongoServer;
let adminToken;
let userToken;
let adminId;
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

describe('GET /api/users', () => {
  beforeEach(async () => {
    // Create admin user
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin'
    });
    adminId = admin._id;
    adminToken = generateToken(admin);

    // Create regular user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
      role: 'user'
    });
    userId = user._id;
    userToken = generateToken(user);
  });

  it('should return all users when admin', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBe(2);
  });

  it('should filter users by role', async () => {
    const res = await request(app)
      .get('/api/users?role=user')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBe(1);
    expect(res.body.users[0].role).toBe('user');
  });

  it('should search users by username', async () => {
    const res = await request(app)
      .get('/api/users?search=admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBe(1);
    expect(res.body.users[0].username).toBe('admin');
  });

  it('should paginate results', async () => {
    // Create multiple users
    const users = [];
    for (let i = 0; i < 15; i++) {
      users.push({
        username: `user${i}`,
        email: `user${i}@example.com`,
        password: 'Password123'
      });
    }
    await User.insertMany(users);

    const res = await request(app)
      .get('/api/users?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBe(10);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(10);
  });

  it('should return 403 when not admin', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app)
      .get('/api/users');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/users/:id', () => {
  beforeEach(async () => {
    // Create admin user
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin'
    });
    adminId = admin._id;
    adminToken = generateToken(admin);

    // Create regular user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
      role: 'user'
    });
    userId = user._id;
    userToken = generateToken(user);
  });

  it('should return user profile when admin', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user._id).toBe(userId.toString());
    expect(res.body.user.username).toBe('testuser');
  });

  it('should return own profile when regular user', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user._id).toBe(userId.toString());
  });

  it('should return 403 when user tries to access other user profile', async () => {
    const res = await request(app)
      .get(`/api/users/${adminId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 404 for non-existent user', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/users/${nonExistentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/users/:id/profile', () => {
  beforeEach(async () => {
    // Create user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
      role: 'user'
    });
    userId = user._id;

    // Create posts for user
    await Post.create([
      {
        title: 'Test Post 1',
        content: 'Test content 1',
        author: userId,
        category: new mongoose.Types.ObjectId(),
        slug: 'test-post-1',
        status: 'published',
        views: 10
      },
      {
        title: 'Test Post 2',
        content: 'Test content 2',
        author: userId,
        category: new mongoose.Types.ObjectId(),
        slug: 'test-post-2',
        status: 'published',
        views: 20
      }
    ]);
  });

  it('should return user profile with posts and stats', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/profile`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('posts');
    expect(res.body).toHaveProperty('stats');
    expect(res.body.posts.length).toBe(2);
    expect(res.body.stats.totalPosts).toBe(2);
    expect(res.body.stats.totalViews).toBe(30);
  });

  it('should paginate posts', async () => {
    // Create more posts
    const posts = [];
    for (let i = 3; i <= 15; i++) {
      posts.push({
        title: `Test Post ${i}`,
        content: `Test content ${i}`,
        author: userId,
        category: new mongoose.Types.ObjectId(),
        slug: `test-post-${i}`,
        status: 'published',
        views: i
      });
    }
    await Post.insertMany(posts);

    const res = await request(app)
      .get(`/api/users/${userId}/profile?page=1&limit=10`);

    expect(res.status).toBe(200);
    expect(res.body.posts.length).toBe(10);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(10);
  });

  it('should return 404 for non-existent user', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/users/${nonExistentId}/profile`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PUT /api/users/:id', () => {
  beforeEach(async () => {
    // Create admin user
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin'
    });
    adminId = admin._id;
    adminToken = generateToken(admin);

    // Create regular user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
      role: 'user',
      profile: {
        firstName: 'John',
        lastName: 'Doe'
      }
    });
    userId = user._id;
    userToken = generateToken(user);
  });

  it('should update own profile when regular user', async () => {
    const updateData = {
      firstName: 'Jane',
      lastName: 'Smith',
      bio: 'Updated bio'
    };

    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'User updated successfully');
    expect(res.body.user.profile.firstName).toBe(updateData.firstName);
    expect(res.body.user.profile.lastName).toBe(updateData.lastName);
    expect(res.body.user.profile.bio).toBe(updateData.bio);
  });

  it('should update any user when admin', async () => {
    const updateData = {
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    };

    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.user.profile.firstName).toBe(updateData.firstName);
    expect(res.body.user.role).toBe(updateData.role);
  });

  it('should return 403 when user tries to update other user', async () => {
    const updateData = {
      firstName: 'Unauthorized'
    };

    const res = await request(app)
      .put(`/api/users/${adminId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(updateData);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for invalid firstName length', async () => {
    const updateData = {
      firstName: 'a'.repeat(51) // Too long
    };

    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(updateData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for invalid bio length', async () => {
    const updateData = {
      bio: 'a'.repeat(501) // Too long
    };

    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(updateData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 404 for non-existent user', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const updateData = {
      firstName: 'Test'
    };

    const res = await request(app)
      .put(`/api/users/${nonExistentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updateData);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 when not authenticated', async () => {
    const updateData = {
      firstName: 'Test'
    };

    const res = await request(app)
      .put(`/api/users/${userId}`)
      .send(updateData);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});

describe('DELETE /api/users/:id', () => {
  beforeEach(async () => {
    // Create admin user
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin'
    });
    adminId = admin._id;
    adminToken = generateToken(admin);

    // Create regular user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
      role: 'user'
    });
    userId = user._id;
    userToken = generateToken(user);
  });

  it('should delete user when admin', async () => {
    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'User deleted successfully');

    // Verify user is deleted
    const deletedUser = await User.findById(userId);
    expect(deletedUser).toBeNull();
  });

  it('should delete user posts when user is deleted', async () => {
    // Create posts for user
    await Post.create([
      {
        title: 'Test Post 1',
        content: 'Test content 1',
        author: userId,
        category: new mongoose.Types.ObjectId(),
        slug: 'test-post-1',
        status: 'published'
      },
      {
        title: 'Test Post 2',
        content: 'Test content 2',
        author: userId,
        category: new mongoose.Types.ObjectId(),
        slug: 'test-post-2',
        status: 'published'
      }
    ]);

    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    // Verify posts are deleted
    const posts = await Post.find({ author: userId });
    expect(posts.length).toBe(0);
  });

  it('should return 400 when admin tries to delete themselves', async () => {
    const res = await request(app)
      .delete(`/api/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 403 when regular user tries to delete user', async () => {
    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 404 for non-existent user', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/users/${nonExistentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app)
      .delete(`/api/users/${userId}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/users/:id/posts', () => {
  beforeEach(async () => {
    // Create admin user
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin'
    });
    adminId = admin._id;
    adminToken = generateToken(admin);

    // Create regular user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
      role: 'user'
    });
    userId = user._id;
    userToken = generateToken(user);

    // Create posts for user
    await Post.create([
      {
        title: 'Published Post',
        content: 'Published content',
        author: userId,
        category: new mongoose.Types.ObjectId(),
        slug: 'published-post',
        status: 'published'
      },
      {
        title: 'Draft Post',
        content: 'Draft content',
        author: userId,
        category: new mongoose.Types.ObjectId(),
        slug: 'draft-post',
        status: 'draft'
      }
    ]);
  });

  it('should return user posts when admin', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/posts`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('posts');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.posts.length).toBe(2);
  });

  it('should return own posts when regular user', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/posts`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.posts.length).toBe(2);
  });

  it('should filter posts by status', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/posts?status=published`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.posts.length).toBe(1);
    expect(res.body.posts[0].status).toBe('published');
  });

  it('should return 403 when user tries to access other user posts', async () => {
    const res = await request(app)
      .get(`/api/users/${adminId}/posts`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 404 for non-existent user', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/users/${nonExistentId}/posts`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/users/:id/stats', () => {
  beforeEach(async () => {
    // Create admin user
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin'
    });
    adminId = admin._id;
    adminToken = generateToken(admin);

    // Create regular user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
      role: 'user'
    });
    userId = user._id;
    userToken = generateToken(user);

    // Create posts for user
    await Post.create([
      {
        title: 'Published Post',
        content: 'Published content',
        author: userId,
        category: new mongoose.Types.ObjectId(),
        slug: 'published-post',
        status: 'published',
        views: 10,
        likes: ['user1', 'user2'],
        comments: [{ user: 'user1', content: 'Comment 1' }]
      },
      {
        title: 'Draft Post',
        content: 'Draft content',
        author: userId,
        category: new mongoose.Types.ObjectId(),
        slug: 'draft-post',
        status: 'draft',
        views: 5,
        likes: ['user3'],
        comments: []
      }
    ]);
  });

  it('should return user stats when admin', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/stats`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('stats');
    expect(res.body.stats.totalPosts).toBe(2);
    expect(res.body.stats.publishedPosts).toBe(1);
    expect(res.body.stats.draftPosts).toBe(1);
    expect(res.body.stats.totalViews).toBe(15);
    expect(res.body.stats.totalLikes).toBe(3);
    expect(res.body.stats.totalComments).toBe(1);
  });

  it('should return own stats when regular user', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/stats`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.stats.totalPosts).toBe(2);
  });

  it('should return 403 when user tries to access other user stats', async () => {
    const res = await request(app)
      .get(`/api/users/${adminId}/stats`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 404 for non-existent user', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/users/${nonExistentId}/stats`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
}); 