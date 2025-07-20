const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
const generateToken = (user) => {
  try {
    const payload = {
      userId: user._id,
      email: user.email,
      username: user.username,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'mern-testing-app',
      audience: 'mern-testing-users'
    });

    return token;
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate token');
  }
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    throw error;
  }
};

// Decode token without verification (for debugging)
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('Token decode error:', error);
    throw error;
  }
};

// Generate refresh token
const generateRefreshToken = (user) => {
  try {
    const refreshToken = crypto.randomBytes(40).toString('hex');
    
    // In a real app, you'd store this in the database
    // For now, we'll just return it
    return refreshToken;
  } catch (error) {
    console.error('Refresh token generation error:', error);
    throw new Error('Failed to generate refresh token');
  }
};

// Generate password reset token
const generatePasswordResetToken = () => {
  try {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    return {
      resetToken,
      hashedToken
    };
  } catch (error) {
    console.error('Password reset token generation error:', error);
    throw new Error('Failed to generate password reset token');
  }
};

// Verify password reset token
const verifyPasswordResetToken = (resetToken, hashedToken) => {
  try {
    const calculatedHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    return calculatedHash === hashedToken;
  } catch (error) {
    console.error('Password reset token verification error:', error);
    return false;
  }
};

// Generate email verification token
const generateEmailVerificationToken = (user) => {
  try {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    
    return {
      verificationToken,
      hashedToken
    };
  } catch (error) {
    console.error('Email verification token generation error:', error);
    throw new Error('Failed to generate email verification token');
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Token expiration check error:', error);
    return true;
  }
};

// Get token expiration time
const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    console.error('Get token expiration error:', error);
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  generateRefreshToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  generateEmailVerificationToken,
  isTokenExpired,
  getTokenExpiration
}; 