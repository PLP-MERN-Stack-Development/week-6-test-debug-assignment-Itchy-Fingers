// posts.test.js - Integration tests for posts API endpoints

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../../src/app');
const User = require('../../src/models/User');
const Post = require('../../src/models/Post');
const Category = require('../../src/models/Category');
const { generateToken } = require('../../src/utils/auth');

let mongoServer;
let userToken;
let adminToken;
let userId;
let categoryId;

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

describe('GET /api/posts', () => {
  beforeEach(async () => {
    // Create user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123'
    });
    userId = user._id;
    userToken = generateToken(user);

    // Create admin
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin'
    });
    adminToken = generateToken(admin);

    // Create category
    const category = await Category.create({
      name: 'Technology',
      slug: 'technology',
      description: 'Technology related posts'
    });
    categoryId = category._id;

    // Create posts
    await Post.create([
      {
        title: 'Test Post 1',
        content: 'Test content 1',
        author: userId,
        category: categoryId,
        slug: 'test-post-1',
        status: 'published',
        views: 10
      },
      {
        title: 'Test Post 2',
        content: 'Test content 2',
        author: userId,
        category: categoryId,
        slug: 'test-post-2',
        status: 'published',
        views: 20
      },
      {
        title: 'Draft Post',
        content: 'Draft content',
        author: userId,
        category: categoryId,
        slug: 'draft-post',
        status: 'draft',
        views: 5
      }
    ]);
  });

  it('should return all published posts', async () => {
    const res = await request(app)
      .get('/api/posts');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('posts');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.posts.length).toBe(2);
    expect(res.body.posts[0].status).toBe('published');
    expect(res.body.posts[1].status).toBe('published');
  });

  it('should filter posts by status', async () => {
    const res = await request(app)
      .get('/api/posts?status=draft')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.posts.length).toBe(1);
    expect(res.body.posts[0].status).toBe('draft');
  });

  it('should search posts by title', async () => {
    const res = await request(app)
      .get('/api/posts?search=Test Post 1');

    expect(res.status).toBe(200);
    expect(res.body.posts.length).toBe(1);
    expect(res.body.posts[0].title).toBe('Test Post 1');
  });

  it('should filter posts by category', async () => {
    const res = await request(app)
      .get(`/api/posts?category=${categoryId}`);

    expect(res.status).toBe(200);
    expect(res.body.posts.length).toBe(2);
  });

  it('should sort posts by views', async () => {
    const res = await request(app)
      .get('/api/posts?sort=views&order=desc');

    expect(res.status).toBe(200);
    expect(res.body.posts[0].views).toBe(20);
    expect(res.body.posts[1].views).toBe(10);
  });

  it('should paginate results', async () => {
    // Create more posts
    const posts = [];
    for (let i = 3; i <= 15; i++) {
      posts.push({
        title: `Test Post ${i}`,
        content: `Test content ${i}`,
        author: userId,
        category: categoryId,
        slug: `test-post-${i}`,
        status: 'published',
        views: i
      });
    }
    await Post.insertMany(posts);

    const res = await request(app)
      .get('/api/posts?page=1&limit=10');

    expect(res.status).toBe(200);
    expect(res.body.posts.length).toBe(10);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(10);
  });

  it('should return 403 for draft posts when not authenticated', async () => {
    const res = await request(app)
      .get('/api/posts?status=draft');

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/posts/:id', () => {
  beforeEach(async () => {
    // Create user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123'
    });
    userId = user._id;
    userToken = generateToken(user);

    // Create category
    const category = await Category.create({
      name: 'Technology',
      slug: 'technology',
      description: 'Technology related posts'
    });
    categoryId = category._id;

    // Create post
    await Post.create({
      title: 'Test Post',
      content: 'Test content',
      author: userId,
      category: categoryId,
      slug: 'test-post',
      status: 'published',
      views: 10
    });
  });

  it('should return published post by ID', async () => {
    const post = await Post.findOne({ title: 'Test Post' });
    
    const res = await request(app)
      .get(`/api/posts/${post._id}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('post');
    expect(res.body.post.title).toBe('Test Post');
    expect(res.body.post.views).toBe(11); // Should increment
  });

  it('should return post by slug', async () => {
    const res = await request(app)
      .get('/api/posts/test-post');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('post');
    expect(res.body.post.title).toBe('Test Post');
  });

  it('should return 404 for non-existent post', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/posts/${nonExistentId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 404 for non-existent slug', async () => {
    const res = await request(app)
      .get('/api/posts/non-existent-slug');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/posts', () => {
  beforeEach(async () => {
    // Create user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123'
    });
    userId = user._id;
    userToken = generateToken(user);

    // Create category
    const category = await Category.create({
      name: 'Technology',
      slug: 'technology',
      description: 'Technology related posts'
    });
    categoryId = category._id;
  });

  it('should create a new post', async () => {
    const postData = {
      title: 'New Post',
      content: 'New post content',
      category: categoryId,
      status: 'published',
      tags: ['technology', 'programming']
    };

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send(postData);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Post created successfully');
    expect(res.body).toHaveProperty('post');
    expect(res.body.post.title).toBe(postData.title);
    expect(res.body.post.author).toBe(userId.toString());
  });

  it('should return 400 for missing title', async () => {
    const postData = {
      content: 'New post content',
      category: categoryId
    };

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send(postData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for missing content', async () => {
    const postData = {
      title: 'New Post',
      category: categoryId
    };

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send(postData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for invalid category', async () => {
    const postData = {
      title: 'New Post',
      content: 'New post content',
      category: new mongoose.Types.ObjectId()
    };

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send(postData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 when not authenticated', async () => {
    const postData = {
      title: 'New Post',
      content: 'New post content',
      category: categoryId
    };

    const res = await request(app)
      .post('/api/posts')
      .send(postData);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PUT /api/posts/:id', () => {
  beforeEach(async () => {
    // Create user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123'
    });
    userId = user._id;
    userToken = generateToken(user);

    // Create admin
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin'
    });
    adminToken = generateToken(admin);

    // Create category
    const category = await Category.create({
      name: 'Technology',
      slug: 'technology',
      description: 'Technology related posts'
    });
    categoryId = category._id;

    // Create post
    await Post.create({
      title: 'Test Post',
      content: 'Test content',
      author: userId,
      category: categoryId,
      slug: 'test-post',
      status: 'published'
    });
  });

  it('should update own post', async () => {
    const post = await Post.findOne({ title: 'Test Post' });
    const updateData = {
      title: 'Updated Post',
      content: 'Updated content',
      status: 'draft'
    };

    const res = await request(app)
      .put(`/api/posts/${post._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Post updated successfully');
    expect(res.body.post.title).toBe(updateData.title);
    expect(res.body.post.content).toBe(updateData.content);
    expect(res.body.post.status).toBe(updateData.status);
  });

  it('should allow admin to update any post', async () => {
    const post = await Post.findOne({ title: 'Test Post' });
    const updateData = {
      title: 'Admin Updated Post',
      status: 'published'
    };

    const res = await request(app)
      .put(`/api/posts/${post._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.post.title).toBe(updateData.title);
  });

  it('should return 403 when user tries to update other user post', async () => {
    // Create another user and post
    const otherUser = await User.create({
      username: 'otheruser',
      email: 'other@example.com',
      password: 'Password123'
    });
    const otherPost = await Post.create({
      title: 'Other Post',
      content: 'Other content',
      author: otherUser._id,
      category: categoryId,
      slug: 'other-post',
      status: 'published'
    });

    const updateData = {
      title: 'Unauthorized Update'
    };

    const res = await request(app)
      .put(`/api/posts/${otherPost._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(updateData);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for invalid title length', async () => {
    const post = await Post.findOne({ title: 'Test Post' });
    const updateData = {
      title: 'a'.repeat(201) // Too long
    };

    const res = await request(app)
      .put(`/api/posts/${post._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(updateData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 404 for non-existent post', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const updateData = {
      title: 'Updated Post'
    };

    const res = await request(app)
      .put(`/api/posts/${nonExistentId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(updateData);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 when not authenticated', async () => {
    const post = await Post.findOne({ title: 'Test Post' });
    const updateData = {
      title: 'Updated Post'
    };

    const res = await request(app)
      .put(`/api/posts/${post._id}`)
      .send(updateData);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});

describe('DELETE /api/posts/:id', () => {
  beforeEach(async () => {
    // Create user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123'
    });
    userId = user._id;
    userToken = generateToken(user);

    // Create admin
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin'
    });
    adminToken = generateToken(admin);

    // Create category
    const category = await Category.create({
      name: 'Technology',
      slug: 'technology',
      description: 'Technology related posts'
    });
    categoryId = category._id;

    // Create post
    await Post.create({
      title: 'Test Post',
      content: 'Test content',
      author: userId,
      category: categoryId,
      slug: 'test-post',
      status: 'published'
    });
  });

  it('should delete own post', async () => {
    const post = await Post.findOne({ title: 'Test Post' });

    const res = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Post deleted successfully');

    // Verify post is deleted
    const deletedPost = await Post.findById(post._id);
    expect(deletedPost).toBeNull();
  });

  it('should allow admin to delete any post', async () => {
    const post = await Post.findOne({ title: 'Test Post' });

    const res = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Post deleted successfully');
  });

  it('should return 403 when user tries to delete other user post', async () => {
    // Create another user and post
    const otherUser = await User.create({
      username: 'otheruser',
      email: 'other@example.com',
      password: 'Password123'
    });
    const otherPost = await Post.create({
      title: 'Other Post',
      content: 'Other content',
      author: otherUser._id,
      category: categoryId,
      slug: 'other-post',
      status: 'published'
    });

    const res = await request(app)
      .delete(`/api/posts/${otherPost._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 404 for non-existent post', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/api/posts/${nonExistentId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 when not authenticated', async () => {
    const post = await Post.findOne({ title: 'Test Post' });

    const res = await request(app)
      .delete(`/api/posts/${post._id}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/posts/:id/like', () => {
  beforeEach(async () => {
    // Create user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123'
    });
    userId = user._id;
    userToken = generateToken(user);

    // Create category
    const category = await Category.create({
      name: 'Technology',
      slug: 'technology',
      description: 'Technology related posts'
    });
    categoryId = category._id;

    // Create post
    await Post.create({
      title: 'Test Post',
      content: 'Test content',
      author: userId,
      category: categoryId,
      slug: 'test-post',
      status: 'published',
      likes: []
    });
  });

  it('should like a post', async () => {
    const post = await Post.findOne({ title: 'Test Post' });

    const res = await request(app)
      .post(`/api/posts/${post._id}/like`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Post liked successfully');

    // Verify post is liked
    const updatedPost = await Post.findById(post._id);
    expect(updatedPost.likes).toContain(userId.toString());
  });

  it('should unlike a post if already liked', async () => {
    const post = await Post.findOne({ title: 'Test Post' });
    
    // First like the post
    await Post.findByIdAndUpdate(post._id, {
      $addToSet: { likes: userId }
    });

    // Then unlike it
    const res = await request(app)
      .post(`/api/posts/${post._id}/like`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Post unliked successfully');

    // Verify post is unliked
    const updatedPost = await Post.findById(post._id);
    expect(updatedPost.likes).not.toContain(userId.toString());
  });

  it('should return 404 for non-existent post', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/posts/${nonExistentId}/like`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 when not authenticated', async () => {
    const post = await Post.findOne({ title: 'Test Post' });

    const res = await request(app)
      .post(`/api/posts/${post._id}/like`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/posts/:id/comment', () => {
  beforeEach(async () => {
    // Create user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123'
    });
    userId = user._id;
    userToken = generateToken(user);

    // Create category
    const category = await Category.create({
      name: 'Technology',
      slug: 'technology',
      description: 'Technology related posts'
    });
    categoryId = category._id;

    // Create post
    await Post.create({
      title: 'Test Post',
      content: 'Test content',
      author: userId,
      category: categoryId,
      slug: 'test-post',
      status: 'published',
      comments: []
    });
  });

  it('should add comment to post', async () => {
    const post = await Post.findOne({ title: 'Test Post' });
    const commentData = {
      content: 'Great post!'
    };

    const res = await request(app)
      .post(`/api/posts/${post._id}/comment`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(commentData);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Comment added successfully');
    expect(res.body).toHaveProperty('comment');

    // Verify comment is added
    const updatedPost = await Post.findById(post._id);
    expect(updatedPost.comments.length).toBe(1);
    expect(updatedPost.comments[0].content).toBe(commentData.content);
  });

  it('should return 400 for missing comment content', async () => {
    const post = await Post.findOne({ title: 'Test Post' });
    const commentData = {};

    const res = await request(app)
      .post(`/api/posts/${post._id}/comment`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(commentData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for comment too long', async () => {
    const post = await Post.findOne({ title: 'Test Post' });
    const commentData = {
      content: 'a'.repeat(1001) // Too long
    };

    const res = await request(app)
      .post(`/api/posts/${post._id}/comment`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(commentData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 404 for non-existent post', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const commentData = {
      content: 'Great post!'
    };

    const res = await request(app)
      .post(`/api/posts/${nonExistentId}/comment`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(commentData);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 when not authenticated', async () => {
    const post = await Post.findOne({ title: 'Test Post' });
    const commentData = {
      content: 'Great post!'
    };

    const res = await request(app)
      .post(`/api/posts/${post._id}/comment`)
      .send(commentData);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
}); 