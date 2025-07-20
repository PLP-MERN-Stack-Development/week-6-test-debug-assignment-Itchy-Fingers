const express = require('express');
const { body, query } = require('express-validator');
const User = require('../models/User');
const Post = require('../models/Post');
const { auth, adminAuth } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { checkValidationResult, sanitizeInput, validatePagination } = require('../utils/validation');

const router = express.Router();

// Get all users (admin only)
router.get('/', [
  adminAuth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isLength({ min: 2, max: 100 }).withMessage('Search query must be between 2 and 100 characters'),
  query('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
  checkValidationResult
], asyncHandler(async (req, res) => {
  const { page, limit, search, role } = req.query;
  
  // Build query
  const query = {};
  
  if (role) {
    query.role = role;
  }
  
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { 'profile.firstName': { $regex: search, $options: 'i' } },
      { 'profile.lastName': { $regex: search, $options: 'i' } }
    ];
  }
  
  // Pagination
  const { page: pageNum, limit: limitNum } = validatePagination(page, limit);
  const skip = (pageNum - 1) * limitNum;
  
  // Execute query
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);
  
  // Get total count for pagination
  const total = await User.countDocuments(query);
  
  res.json({
    users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
}));

// Get user by ID
router.get('/:id', [
  auth,
  query('id').isMongoId().withMessage('Invalid user ID'),
  checkValidationResult
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Users can only view their own profile or admins can view any
  if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
    throw new AppError('Access denied', 403);
  }
  
  const user = await User.findById(id).select('-password');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  res.json({ user });
}));

// Get user profile with posts
router.get('/:id/profile', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page, limit } = req.query;
  
  const user = await User.findById(id).select('-password');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Get user's published posts
  const { page: pageNum, limit: limitNum } = validatePagination(page, limit);
  const skip = (pageNum - 1) * limitNum;
  
  const posts = await Post.find({ 
    author: id, 
    status: 'published' 
  })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);
  
  const totalPosts = await Post.countDocuments({ 
    author: id, 
    status: 'published' 
  });
  
  // Get user stats
  const totalViews = await Post.aggregate([
    { $match: { author: user._id, status: 'published' } },
    { $group: { _id: null, totalViews: { $sum: '$views' } } }
  ]);
  
  const totalLikes = await Post.aggregate([
    { $match: { author: user._id, status: 'published' } },
    { $group: { _id: null, totalLikes: { $sum: { $size: '$likes' } } } }
  ]);
  
  res.json({
    user,
    posts,
    stats: {
      totalPosts,
      totalViews: totalViews[0]?.totalViews || 0,
      totalLikes: totalLikes[0]?.totalLikes || 0
    },
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalPosts,
      pages: Math.ceil(totalPosts / limitNum)
    }
  });
}));

// Update user (admin or self)
router.put('/:id', [
  auth,
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Invalid role'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  checkValidationResult
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = sanitizeInput(req.body);
  
  // Check permissions
  if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
    throw new AppError('You can only update your own profile', 403);
  }
  
  // Only admins can change roles and active status
  if (updates.role && req.user.role !== 'admin') {
    throw new AppError('Only admins can change user roles', 403);
  }
  
  if (updates.isActive !== undefined && req.user.role !== 'admin') {
    throw new AppError('Only admins can change user active status', 403);
  }
  
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Update user
  if (updates.firstName !== undefined) user.profile.firstName = updates.firstName;
  if (updates.lastName !== undefined) user.profile.lastName = updates.lastName;
  if (updates.bio !== undefined) user.profile.bio = updates.bio;
  if (updates.role && req.user.role === 'admin') user.role = updates.role;
  if (updates.isActive !== undefined && req.user.role === 'admin') user.isActive = updates.isActive;
  
  await user.save();
  
  res.json({
    message: 'User updated successfully',
    user: user.getPublicProfile()
  });
}));

// Delete user (admin only)
router.delete('/:id', [
  adminAuth
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Prevent admin from deleting themselves
  if (req.user._id.toString() === id) {
    throw new AppError('You cannot delete your own account', 400);
  }
  
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Delete user's posts
  await Post.deleteMany({ author: id });
  
  // Delete user
  await User.findByIdAndDelete(id);
  
  res.json({
    message: 'User deleted successfully'
  });
}));

// Get user's posts (admin or self)
router.get('/:id/posts', [
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
  checkValidationResult
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page, limit, status } = req.query;
  
  // Check permissions
  if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
    throw new AppError('Access denied', 403);
  }
  
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Build query
  const query = { author: id };
  if (status) {
    query.status = status;
  }
  
  // Pagination
  const { page: pageNum, limit: limitNum } = validatePagination(page, limit);
  const skip = (pageNum - 1) * limitNum;
  
  const posts = await Post.find(query)
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);
  
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

// Get user statistics (admin or self)
router.get('/:id/stats', [
  auth
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check permissions
  if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
    throw new AppError('Access denied', 403);
  }
  
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Get user statistics
  const stats = await Post.aggregate([
    { $match: { author: user._id } },
    {
      $group: {
        _id: null,
        totalPosts: { $sum: 1 },
        totalViews: { $sum: '$views' },
        totalLikes: { $sum: { $size: '$likes' } },
        totalComments: { $sum: { $size: '$comments' } },
        publishedPosts: {
          $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
        },
        draftPosts: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
        },
        archivedPosts: {
          $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] }
        }
      }
    }
  ]);
  
  const userStats = stats[0] || {
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    publishedPosts: 0,
    draftPosts: 0,
    archivedPosts: 0
  };
  
  res.json({
    user: user.getPublicProfile(),
    stats: userStats
  });
}));

module.exports = router; 