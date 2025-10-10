import {
  formatCurrency,
  formatDate,
  formatPhone,
  validateEmail,
  validatePassword,
  calculateDiscountPercentage,
  truncateText,
} from '../index';

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('formats Philippine peso correctly', () => {
      expect(formatCurrency(1000)).toBe('₱1,000.00');
      expect(formatCurrency(99.99)).toBe('₱99.99');
      expect(formatCurrency(0)).toBe('₱0.00');
    });
  });

  describe('formatDate', () => {
    it('formats date string correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);
      expect(formatted).toContain('January');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });
  });

  describe('formatPhone', () => {
    it('formats Philippine mobile number', () => {
      expect(formatPhone('09123456789')).toBe('0912 345 6789');
      expect(formatPhone('639123456789')).toBe('+63 912 345 6789');
    });
  });

  describe('validateEmail', () => {
    it('validates email correctly', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('invalid.email')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('validates password length', () => {
      const result1 = validatePassword('short');
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Password must be at least 6 characters');

      const result2 = validatePassword('validpassword');
      expect(result2.isValid).toBe(true);
      expect(result2.errors).toHaveLength(0);
    });
  });

  describe('calculateDiscountPercentage', () => {
    it('calculates discount percentage correctly', () => {
      expect(calculateDiscountPercentage(100, 80)).toBe(20);
      expect(calculateDiscountPercentage(1000, 750)).toBe(25);
      expect(calculateDiscountPercentage(50, 50)).toBe(0);
    });

    it('handles edge cases', () => {
      expect(calculateDiscountPercentage(0, 0)).toBe(0);
      expect(calculateDiscountPercentage(100, 0)).toBe(100);
    });
  });

  describe('truncateText', () => {
    it('truncates long text', () => {
      const longText = 'This is a very long text that needs to be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very long...');
    });

    it('does not truncate short text', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 20)).toBe('Short text');
    });
  });
});
