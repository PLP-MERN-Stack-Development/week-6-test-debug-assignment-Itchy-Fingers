const express = require('express');
const { body, query } = require('express-validator');
const Post = require('../models/Post');
const Category = require('../models/Category');
const { auth, optionalAuth } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { checkValidationResult, sanitizeInput, validatePagination, validateSearchQuery } = require('../utils/validation');

const router = express.Router();

// Get all posts with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isMongoId().withMessage('Invalid category ID'),
  query('search').optional().isLength({ min: 2, max: 100 }).withMessage('Search query must be between 2 and 100 characters'),
  query('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
  checkValidationResult
], asyncHandler(async (req, res) => {
  const { page, limit, category, search, status } = req.query;
  
  // Build query
  const query = {};
  
  // Filter by status (default to published for public access)
  if (status) {
    query.status = status;
  } else {
    query.status = 'published';
  }
  
  // Filter by category
  if (category) {
    query.category = category;
  }
  
  // Search functionality
  if (search) {
    const searchQuery = validateSearchQuery(search);
    query.$or = [
      { title: { $regex: searchQuery, $options: 'i' } },
      { content: { $regex: searchQuery, $options: 'i' } },
      { tags: { $in: [new RegExp(searchQuery, 'i')] } }
    ];
  }
  
  // Pagination
  const { page: pageNum, limit: limitNum } = validatePagination(page, limit);
  const skip = (pageNum - 1) * limitNum;
  
  // Execute query
  const posts = await Post.find(query)
    .populate('author', 'username profile.firstName profile.lastName')
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);
  
  // Get total count for pagination
  const total = await Post.countDocuments(query);
  
  res.json({
    posts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
}));

// Get single post by ID
router.get('/:id', [
  query('id').isMongoId().withMessage('Invalid post ID'),
  checkValidationResult
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const post = await Post.findById(id)
    .populate('author', 'username profile.firstName profile.lastName')
    .populate('category', 'name slug')
    .populate('comments.user', 'username profile.firstName profile.lastName');
  
  if (!post) {
    throw new AppError('Post not found', 404);
  }
  
  // Increment view count
  await post.incrementViews();
  
  res.json({ post });
}));

// Get post by slug
router.get('/slug/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  const post = await Post.findOne({ slug, status: 'published' })
    .populate('author', 'username profile.firstName profile.lastName')
    .populate('category', 'name slug')
    .populate('comments.user', 'username profile.firstName profile.lastName');
  
  if (!post) {
    throw new AppError('Post not found', 404);
  }
  
  // Increment view count
  await post.incrementViews();
  
  res.json({ post });
}));

// Create new post (requires authentication)
router.post('/', [
  auth,
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  
  body('content')
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Content must be between 10 and 10000 characters'),
  
  body('category')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Tag cannot exceed 50 characters'),
  
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  
  checkValidationResult
], asyncHandler(async (req, res) => {
  const { title, content, category, status = 'draft', tags = [], featured = false } = sanitizeInput(req.body);
  
  // Verify category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    throw new AppError('Category not found', 404);
  }
  
  // Create post
  const post = new Post({
    title,
    content,
    author: req.user._id,
    category,
    status,
    tags,
    featured
  });
  
  await post.save();
  
  // Populate author and category for response
  await post.populate('author', 'username profile.firstName profile.lastName');
  await post.populate('category', 'name slug');
  
  res.status(201).json({
    message: 'Post created successfully',
    post
  });
}));

// Update post (requires authentication and ownership)
router.put('/:id', [
  auth,
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Content must be between 10 and 10000 characters'),
  
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Valid category ID is required'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Tag cannot exceed 50 characters'),
  
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  
  checkValidationResult
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = sanitizeInput(req.body);
  
  // Find post and check ownership
  const post = await Post.findById(id);
  if (!post) {
    throw new AppError('Post not found', 404);
  }
  
  if (post.author.toString() !== req.user._id.toString()) {
    throw new AppError('You can only edit your own posts', 403);
  }
  
  // Verify category exists if updating
  if (updates.category) {
    const categoryExists = await Category.findById(updates.category);
    if (!categoryExists) {
      throw new AppError('Category not found', 404);
    }
  }
  
  // Update post
  Object.assign(post, updates);
  await post.save();
  
  // Populate author and category for response
  await post.populate('author', 'username profile.firstName profile.lastName');
  await post.populate('category', 'name slug');
  
  res.json({
    message: 'Post updated successfully',
    post
  });
}));

// Delete post (requires authentication and ownership)
router.delete('/:id', [
  auth
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Find post and check ownership
  const post = await Post.findById(id);
  if (!post) {
    throw new AppError('Post not found', 404);
  }
  
  if (post.author.toString() !== req.user._id.toString()) {
    throw new AppError('You can only delete your own posts', 403);
  }
  
  await Post.findByIdAndDelete(id);
  
  res.json({
    message: 'Post deleted successfully'
  });
}));

// Like/unlike post
router.post('/:id/like', [
  auth
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const post = await Post.findById(id);
  if (!post) {
    throw new AppError('Post not found', 404);
  }
  
  await post.toggleLike(req.user._id);
  
  res.json({
    message: 'Post like updated',
    likeCount: post.likeCount
  });
}));

// Add comment to post
router.post('/:id/comments', [
  auth,
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  
  checkValidationResult
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = sanitizeInput(req.body);
  
  const post = await Post.findById(id);
  if (!post) {
    throw new AppError('Post not found', 404);
  }
  
  await post.addComment(req.user._id, content);
  
  // Populate the new comment
  await post.populate('comments.user', 'username profile.firstName profile.lastName');
  
  res.json({
    message: 'Comment added successfully',
    comment: post.comments[post.comments.length - 1]
  });
}));

// Get posts by author
router.get('/author/:authorId', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  checkValidationResult
], asyncHandler(async (req, res) => {
  const { authorId } = req.params;
  const { page, limit } = req.query;
  
  const { page: pageNum, limit: limitNum } = validatePagination(page, limit);
  const skip = (pageNum - 1) * limitNum;
  
  const posts = await Post.find({ 
    author: authorId, 
    status: 'published' 
  })
    .populate('author', 'username profile.firstName profile.lastName')
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);
  
  const total = await Post.countDocuments({ 
    author: authorId, 
    status: 'published' 
  });
  
  res.json({
    posts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
}));

module.exports = router; 