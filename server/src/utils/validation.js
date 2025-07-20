const { body, validationResult } = require('express-validator');

// Common validation rules
const validationRules = {
  username: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores')
  ],
  
  email: [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please enter a valid email address')
      .normalizeEmail()
  ],
  
  password: [
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
  ],
  
  postTitle: [
    body('title')
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('Title must be between 3 and 200 characters')
  ],
  
  postContent: [
    body('content')
      .trim()
      .isLength({ min: 10, max: 10000 })
      .withMessage('Content must be between 10 and 10000 characters')
  ],
  
  categoryName: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Category name must be between 2 and 50 characters')
  ],
  
  commentContent: [
    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comment must be between 1 and 1000 characters')
  ]
};

// Sanitize input data
const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    return data
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''); // Remove script tags
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
};

// Validate ObjectId format
const isValidObjectId = (id) => {
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  return objectIdPattern.test(id);
};

// Validate email format
const isValidEmail = (email) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};

// Validate URL format
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validate date format
const isValidDate = (date) => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
};

// Validate pagination parameters
const validatePagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  
  if (pageNum < 1) {
    throw new Error('Page number must be greater than 0');
  }
  
  if (limitNum < 1 || limitNum > 100) {
    throw new Error('Limit must be between 1 and 100');
  }
  
  return { page: pageNum, limit: limitNum };
};

// Validate search query
const validateSearchQuery = (query) => {
  if (!query || typeof query !== 'string') {
    throw new Error('Search query is required');
  }
  
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) {
    throw new Error('Search query must be at least 2 characters long');
  }
  
  if (trimmedQuery.length > 100) {
    throw new Error('Search query cannot exceed 100 characters');
  }
  
  return trimmedQuery;
};

// Validate file upload
const validateFileUpload = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], maxSize = 5 * 1024 * 1024) => {
  if (!file) {
    throw new Error('No file uploaded');
  }
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  if (file.size > maxSize) {
    throw new Error(`File size too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
  }
  
  return true;
};

// Check validation results
const checkValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Custom validation for unique fields
const isUnique = (model, field, excludeId = null) => {
  return async (value) => {
    try {
      const query = { [field]: value };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }
      
      const existing = await model.findOne(query);
      if (existing) {
        throw new Error(`${field} already exists`);
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  };
};

// Validate and sanitize request body
const validateAndSanitize = (req, res, next) => {
  try {
    // Sanitize all string fields
    if (req.body) {
      req.body = sanitizeInput(req.body);
    }
    
    next();
  } catch (error) {
    res.status(400).json({
      error: 'Invalid input data',
      details: error.message
    });
  }
};

module.exports = {
  validationRules,
  sanitizeInput,
  isValidObjectId,
  isValidEmail,
  isValidUrl,
  isValidDate,
  validatePagination,
  validateSearchQuery,
  validateFileUpload,
  checkValidationResult,
  isUnique,
  validateAndSanitize
}; 