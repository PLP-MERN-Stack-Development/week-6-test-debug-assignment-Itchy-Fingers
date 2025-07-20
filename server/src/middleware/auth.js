const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token. User not found.' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Account is deactivated.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Authentication failed.' 
    });
  }
};

// Optional auth middleware - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

// Admin authorization middleware
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, (err) => {
      if (err) return next(err);
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Access denied. Admin privileges required.' 
        });
      }
      
      next();
    });
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authorization failed.' 
    });
  }
};

// Check if user owns the resource
const checkOwnership = (model, field = 'author') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const resource = await model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({ 
          error: 'Resource not found.' 
        });
      }
      
      if (resource[field].toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          error: 'Access denied. You can only modify your own resources.' 
        });
      }
      
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ 
        error: 'Ownership verification failed.' 
      });
    }
  };
};

module.exports = {
  auth,
  optionalAuth,
  adminAuth,
  checkOwnership
}; 