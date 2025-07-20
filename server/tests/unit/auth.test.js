const jwt = require('jsonwebtoken');
const {
  generateToken,
  verifyToken,
  decodeToken,
  generateRefreshToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  generateEmailVerificationToken,
  isTokenExpired,
  getTokenExpiration
} = require('../../src/utils/auth');

describe('Auth Utilities', () => {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    username: 'testuser',
    role: 'user'
  };

  beforeEach(() => {
    // Reset environment variables for testing
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify the token can be decoded
      const decoded = jwt.decode(token);
      expect(decoded.userId).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.role).toBe(mockUser.role);
    });

    it('should include correct token metadata', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.decode(token);
      
      expect(decoded.iss).toBe('mern-testing-app');
      expect(decoded.aud).toBe('mern-testing-users');
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it('should throw error when user is invalid', () => {
      expect(() => generateToken(null)).toThrow('Failed to generate token');
      expect(() => generateToken(undefined)).toThrow('Failed to generate token');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken(mockUser);
      const decoded = verifyToken(token);
      
      expect(decoded.userId).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('should throw error for expired token', () => {
      // Create a token that expires immediately
      const expiredToken = jwt.sign(
        { userId: mockUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );
      
      expect(() => verifyToken(expiredToken)).toThrow();
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = generateToken(mockUser);
      const decoded = decodeToken(token);
      
      expect(decoded.userId).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
    });

    it('should handle invalid token gracefully', () => {
      expect(() => decodeToken('invalid-token')).toThrow();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', () => {
      const refreshToken = generateRefreshToken(mockUser);
      
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens', () => {
      const token1 = generateRefreshToken(mockUser);
      const token2 = generateRefreshToken(mockUser);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate reset token and hash', () => {
      const { resetToken, hashedToken } = generatePasswordResetToken();
      
      expect(resetToken).toBeDefined();
      expect(hashedToken).toBeDefined();
      expect(typeof resetToken).toBe('string');
      expect(typeof hashedToken).toBe('string');
      expect(resetToken.length).toBeGreaterThan(0);
      expect(hashedToken.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens', () => {
      const { resetToken: token1 } = generatePasswordResetToken();
      const { resetToken: token2 } = generatePasswordResetToken();
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyPasswordResetToken', () => {
    it('should verify valid reset token', () => {
      const { resetToken, hashedToken } = generatePasswordResetToken();
      const isValid = verifyPasswordResetToken(resetToken, hashedToken);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid reset token', () => {
      const { hashedToken } = generatePasswordResetToken();
      const isValid = verifyPasswordResetToken('invalid-token', hashedToken);
      
      expect(isValid).toBe(false);
    });

    it('should reject invalid hash', () => {
      const { resetToken } = generatePasswordResetToken();
      const isValid = verifyPasswordResetToken(resetToken, 'invalid-hash');
      
      expect(isValid).toBe(false);
    });
  });

  describe('generateEmailVerificationToken', () => {
    it('should generate verification token and hash', () => {
      const { verificationToken, hashedToken } = generateEmailVerificationToken(mockUser);
      
      expect(verificationToken).toBeDefined();
      expect(hashedToken).toBeDefined();
      expect(typeof verificationToken).toBe('string');
      expect(typeof hashedToken).toBe('string');
    });

    it('should generate unique tokens', () => {
      const { verificationToken: token1 } = generateEmailVerificationToken(mockUser);
      const { verificationToken: token2 } = generateEmailVerificationToken(mockUser);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for expired token', () => {
      const expiredToken = jwt.sign(
        { userId: mockUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );
      
      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return false for valid token', () => {
      const validToken = generateToken(mockUser);
      
      expect(isTokenExpired(validToken)).toBe(false);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
    });

    it('should return true for token without expiration', () => {
      const tokenWithoutExp = jwt.sign(
        { userId: mockUser._id },
        process.env.JWT_SECRET
      );
      
      expect(isTokenExpired(tokenWithoutExp)).toBe(true);
    });
  });

  describe('getTokenExpiration', () => {
    it('should return expiration date for valid token', () => {
      const token = generateToken(mockUser);
      const expiration = getTokenExpiration(token);
      
      expect(expiration).toBeInstanceOf(Date);
      expect(expiration.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return null for invalid token', () => {
      const expiration = getTokenExpiration('invalid-token');
      
      expect(expiration).toBeNull();
    });

    it('should return null for token without expiration', () => {
      const tokenWithoutExp = jwt.sign(
        { userId: mockUser._id },
        process.env.JWT_SECRET
      );
      
      const expiration = getTokenExpiration(tokenWithoutExp);
      
      expect(expiration).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle JWT signing errors', () => {
      // Mock jwt.sign to throw an error
      const originalSign = jwt.sign;
      jwt.sign = jest.fn(() => {
        throw new Error('JWT signing failed');
      });
      
      expect(() => generateToken(mockUser)).toThrow('Failed to generate token');
      
      // Restore original function
      jwt.sign = originalSign;
    });

    it('should handle JWT verification errors', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('should handle crypto errors in token generation', () => {
      // Mock crypto.randomBytes to throw an error
      const originalRandomBytes = require('crypto').randomBytes;
      require('crypto').randomBytes = jest.fn(() => {
        throw new Error('Crypto error');
      });
      
      expect(() => generateRefreshToken(mockUser)).toThrow('Failed to generate refresh token');
      
      // Restore original function
      require('crypto').randomBytes = originalRandomBytes;
    });
  });
}); 