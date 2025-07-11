import { format, parse, isValidNorthAmericanPhone } from './northAmericanFormatter';

describe('northAmericanFormatter', () => {
  describe('format', () => {
    it('should format empty value as empty string', () => {
      expect(format('')).toBe('');
      expect(format(null)).toBe('');
      expect(format(undefined)).toBe('');
    });

    it('should format partial phone numbers', () => {
      expect(format('123')).toBe('(123');
      expect(format('123456')).toBe('(123) 456');
      expect(format('1234567890')).toBe('(123) 456-7890');
    });

    it('should handle non-digit characters', () => {
      expect(format('123-456-7890')).toBe('(123) 456-7890');
      expect(format('(123) 456-7890')).toBe('(123) 456-7890');
      expect(format('123.456.7890')).toBe('(123) 456-7890');
      expect(format('123 456 7890')).toBe('(123) 456-7890');
    });

    it('should limit to 10 digits', () => {
      expect(format('123456789012345')).toBe('(123) 456-7890');
    });
  });

  describe('parse', () => {
    it('should extract only digits', () => {
      expect(parse('(123) 456-7890')).toBe('1234567890');
      expect(parse('123-456-7890')).toBe('1234567890');
      expect(parse('123.456.7890')).toBe('1234567890');
      expect(parse('123 456 7890')).toBe('1234567890');
    });

    it('should handle empty values', () => {
      expect(parse('')).toBe('');
      expect(parse(null)).toBe('');
      expect(parse(undefined)).toBe('');
    });
  });

  describe('isValidNorthAmericanPhone', () => {
    it('should validate correct North American phone numbers', () => {
      expect(isValidNorthAmericanPhone('(555) 123-4567')).toBe(true);
      expect(isValidNorthAmericanPhone('5551234567')).toBe(true);
      expect(isValidNorthAmericanPhone('555-123-4567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidNorthAmericanPhone('')).toBe(false);
      expect(isValidNorthAmericanPhone('123')).toBe(false); // too short
      expect(isValidNorthAmericanPhone('12345678901')).toBe(false); // too long
      expect(isValidNorthAmericanPhone('(055) 123-4567')).toBe(false); // area code starts with 0
      expect(isValidNorthAmericanPhone('(155) 123-4567')).toBe(false); // area code starts with 1
      expect(isValidNorthAmericanPhone('(911) 123-4567')).toBe(false); // N11 code
      expect(isValidNorthAmericanPhone('(411) 123-4567')).toBe(false); // N11 code
    });
  });
}); 