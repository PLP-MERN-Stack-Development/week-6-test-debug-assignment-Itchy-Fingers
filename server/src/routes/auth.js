const express = require('express');
const { body } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../utils/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { checkValidationResult, sanitizeInput } = require('../utils/validation');

const router = express.Router();

// Register new user
router.post('/register', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
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
  
  checkValidationResult
], asyncHandler(async (req, res) => {
  const { username, email, password, firstName, lastName } = sanitizeInput(req.body);

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    throw new AppError('User with this email or username already exists', 400);
  }

  // Create new user
  const user = new User({
    username,
    email,
    password,
    profile: {
      firstName,
      lastName
    }
  });

  await user.save();

  // Generate token
  const token = generateToken(user);

  res.status(201).json({
    message: 'User registered successfully',
    user: user.getPublicProfile(),
    token
  });
}));

// Login user
router.post('/login', [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  checkValidationResult
], asyncHandler(async (req, res) => {
  const { email, password } = sanitizeInput(req.body);

  // Find user by credentials
  const user = await User.findByCredentials(email, password);

  if (!user.isActive) {
    throw new AppError('Account is deactivated', 401);
  }

  // Generate token
  const token = generateToken(user);

  res.json({
    message: 'Login successful',
    user: user.getPublicProfile(),
    token
  });
}));

// Get current user profile
router.get('/me', asyncHandler(async (req, res) => {
  // This route requires authentication middleware
  // The user will be available in req.user from the auth middleware
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  res.json({
    user: req.user.getPublicProfile()
  });
}));

// Update user profile
router.put('/profile', [
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
  
  checkValidationResult
], asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { firstName, lastName, bio } = sanitizeInput(req.body);

  // Update user profile
  const user = await User.findById(req.user._id);
  
  if (firstName !== undefined) user.profile.firstName = firstName;
  if (lastName !== undefined) user.profile.lastName = lastName;
  if (bio !== undefined) user.profile.bio = bio;

  await user.save();

  res.json({
    message: 'Profile updated successfully',
    user: user.getPublicProfile()
  });
}));

// Change password
router.put('/change-password', [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  checkValidationResult
], asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { currentPassword, newPassword } = sanitizeInput(req.body);

  // Verify current password
  const user = await User.findById(req.user._id);
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    message: 'Password changed successfully'
  });
}));

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({
    message: 'Logged out successfully'
  });
});

// Refresh token (placeholder for future implementation)
router.post('/refresh-token', asyncHandler(async (req, res) => {
  // In a real application, you would validate the refresh token
  // and generate a new access token
  res.json({
    message: 'Token refresh endpoint - not implemented in this demo'
  });
}));

module.exports = router; 