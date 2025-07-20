const {
  sanitizeInput,
  isValidObjectId,
  isValidEmail,
  isValidUrl,
  isValidDate,
  validatePagination,
  validateSearchQuery,
  validateFileUpload,
  isUnique
} = require('../../src/utils/validation');

const mongoose = require('mongoose');

describe('Validation Utilities', () => {
  describe('sanitizeInput', () => {
    it('should sanitize string input', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).toBe('Hello World');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert("xss")';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).toBe('alert("xss")');
    });

    it('should remove event handlers', () => {
      const input = 'onclick=alert("xss")';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).toBe('');
    });

    it('should handle object input', () => {
      const input = {
        name: '<script>alert("xss")</script>John',
        email: 'test@example.com'
      };
      const sanitized = sanitizeInput(input);
      
      expect(sanitized.name).toBe('John');
      expect(sanitized.email).toBe('test@example.com');
    });

    it('should handle non-string input', () => {
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(null)).toBe(null);
      expect(sanitizeInput(undefined)).toBe(undefined);
    });
  });

  describe('isValidObjectId', () => {
    it('should validate correct ObjectId format', () => {
      const validId = '507f1f77bcf86cd799439011';
      expect(isValidObjectId(validId)).toBe(true);
    });

    it('should reject invalid ObjectId format', () => {
      expect(isValidObjectId('invalid-id')).toBe(false);
      expect(isValidObjectId('507f1f77bcf86cd79943901')).toBe(false); // too short
      expect(isValidObjectId('507f1f77bcf86cd7994390111')).toBe(false); // too long
      expect(isValidObjectId('')).toBe(false);
      expect(isValidObjectId(null)).toBe(false);
      expect(isValidObjectId(undefined)).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('test+tag@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URL formats', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path')).toBe(true);
      expect(isValidUrl('https://example.com/path?param=value')).toBe(true);
    });

    it('should reject invalid URL formats', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl(null)).toBe(false);
      expect(isValidUrl(undefined)).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('should validate correct date formats', () => {
      expect(isValidDate('2024-01-15')).toBe(true);
      expect(isValidDate('2024-01-15T10:30:00Z')).toBe(true);
      expect(isValidDate(new Date())).toBe(true);
    });

    it('should reject invalid date formats', () => {
      expect(isValidDate('invalid-date')).toBe(false);
      expect(isValidDate('2024-13-45')).toBe(false);
      expect(isValidDate('')).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
    });
  });

  describe('validatePagination', () => {
    it('should validate correct pagination parameters', () => {
      const result = validatePagination(1, 10);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should use default values when parameters are undefined', () => {
      const result = validatePagination(undefined, undefined);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should throw error for invalid page number', () => {
      expect(() => validatePagination(0, 10)).toThrow('Page number must be greater than 0');
      expect(() => validatePagination(-1, 10)).toThrow('Page number must be greater than 0');
    });

    it('should throw error for invalid limit', () => {
      expect(() => validatePagination(1, 0)).toThrow('Limit must be between 1 and 100');
      expect(() => validatePagination(1, 101)).toThrow('Limit must be between 1 and 100');
    });

    it('should handle string parameters', () => {
      const result = validatePagination('2', '20');
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
    });
  });

  describe('validateSearchQuery', () => {
    it('should validate correct search queries', () => {
      expect(validateSearchQuery('test')).toBe('test');
      expect(validateSearchQuery('  test  ')).toBe('test');
      expect(validateSearchQuery('a'.repeat(50))).toBe('a'.repeat(50));
    });

    it('should throw error for invalid search queries', () => {
      expect(() => validateSearchQuery('')).toThrow('Search query is required');
      expect(() => validateSearchQuery('a')).toThrow('Search query must be at least 2 characters long');
      expect(() => validateSearchQuery('a'.repeat(101))).toThrow('Search query cannot exceed 100 characters');
      expect(() => validateSearchQuery(null)).toThrow('Search query is required');
      expect(() => validateSearchQuery(undefined)).toThrow('Search query is required');
    });
  });

  describe('validateFileUpload', () => {
    const mockFile = {
      mimetype: 'image/jpeg',
      size: 1024 * 1024 // 1MB
    };

    it('should validate correct file uploads', () => {
      expect(validateFileUpload(mockFile)).toBe(true);
    });

    it('should throw error for missing file', () => {
      expect(() => validateFileUpload(null)).toThrow('No file uploaded');
      expect(() => validateFileUpload(undefined)).toThrow('No file uploaded');
    });

    it('should throw error for invalid file type', () => {
      const invalidFile = { ...mockFile, mimetype: 'text/plain' };
      expect(() => validateFileUpload(invalidFile)).toThrow('File type not allowed');
    });

    it('should throw error for file too large', () => {
      const largeFile = { ...mockFile, size: 10 * 1024 * 1024 }; // 10MB
      expect(() => validateFileUpload(largeFile, ['image/jpeg'], 5 * 1024 * 1024)).toThrow('File size too large');
    });

    it('should accept custom file types', () => {
      const pdfFile = { ...mockFile, mimetype: 'application/pdf' };
      expect(validateFileUpload(pdfFile, ['image/jpeg', 'application/pdf'])).toBe(true);
    });
  });

  describe('isUnique', () => {
    // Mock model for testing
    const MockModel = {
      findOne: jest.fn()
    };

    it('should return true for unique field', async () => {
      MockModel.findOne.mockResolvedValue(null);
      
      const isUniqueValidator = isUnique(MockModel, 'email');
      const result = await isUniqueValidator('test@example.com');
      
      expect(result).toBe(true);
      expect(MockModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should throw error for non-unique field', async () => {
      MockModel.findOne.mockResolvedValue({ _id: 'existing-id' });
      
      const isUniqueValidator = isUnique(MockModel, 'email');
      
      await expect(isUniqueValidator('test@example.com')).rejects.toThrow('email already exists');
    });

    it('should exclude current document when updating', async () => {
      MockModel.findOne.mockResolvedValue(null);
      
      const isUniqueValidator = isUnique(MockModel, 'email', 'current-id');
      await isUniqueValidator('test@example.com');
      
      expect(MockModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
        _id: { $ne: 'current-id' }
      });
    });

    it('should handle database errors', async () => {
      MockModel.findOne.mockRejectedValue(new Error('Database error'));
      
      const isUniqueValidator = isUnique(MockModel, 'email');
      
      await expect(isUniqueValidator('test@example.com')).rejects.toThrow('Database error');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      expect(sanitizeInput(null)).toBe(null);
      expect(sanitizeInput(undefined)).toBe(undefined);
      expect(isValidObjectId(null)).toBe(false);
      expect(isValidEmail(null)).toBe(false);
      expect(isValidUrl(null)).toBe(false);
      expect(isValidDate(null)).toBe(false);
    });

    it('should handle empty strings appropriately', () => {
      expect(sanitizeInput('')).toBe('');
      expect(isValidObjectId('')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidDate('')).toBe(false);
    });

    it('should handle special characters in sanitization', () => {
      const input = '<>javascript:alert("xss")onclick=alert("xss")';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).toBe('alert("xss")');
    });
  });
}); 