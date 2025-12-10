const { isValidPhoneNumber, parseFutureDate } = require('../../utils/validators');

describe('Validators Utility - Unit Tests', () => {
  describe('isValidPhoneNumber', () => {
    it('should accept valid E.164 phone numbers', () => {
      const validNumbers = [
        '+1234567890',
        '+12345678901',
        '+123456789012',
        '+1234567890123',
        '+12345678901234',
        '+123456789012345',  // Max 15 digits
        '+14155552671',      // US number
        '+442071838750',     // UK number
        '+81312345678',      // Japan number
      ];

      validNumbers.forEach(number => {
        expect(isValidPhoneNumber(number)).toBe(true);
      });
    });

    it('should reject invalid phone number formats', () => {
      const invalidNumbers = [
        '1234567890',              // Missing +
        '+123',                    // Too short
        '+1234567890123456',       // Too long (>15 digits)
        'not-a-number',           // Not numeric
        '+12-345-6789',           // Contains hyphens
        '(123) 456-7890',         // Contains parentheses
        '+12 345 6789',           // Contains spaces
        '',                       // Empty string
        null,                     // Null
        undefined,                // Undefined
        '+abc1234567890',         // Contains letters
      ];

      invalidNumbers.forEach(number => {
        expect(isValidPhoneNumber(number)).toBe(false);
      });
    });
  });

  describe('parseFutureDate', () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should accept valid future ISO datetime strings', () => {
      const futureDate = '2024-01-02T12:00:00Z'; // 1 day in the future
      const result = parseFutureDate(futureDate);

      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(futureDate);
    });

    it('should reject past dates', () => {
      const pastDate = '2023-12-31T12:00:00Z'; // 1 day in the past
      const result = parseFutureDate(pastDate);

      expect(result).toBeNull();
    });

    it('should reject current time (must be in future)', () => {
      const currentDate = '2024-01-01T12:00:00Z';
      const result = parseFutureDate(currentDate);

      // Should be null because it's not > current time
      expect(result).toBeNull();
    });

    it('should accept dates far in the future', () => {
      const farFuture = '2050-01-01T00:00:00Z';
      const result = parseFutureDate(farFuture);

      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2050);
    });

    it('should reject invalid date formats', () => {
      const invalidDates = [
        'not-a-date',
        '2024-13-01',           // Invalid month
        '2024-01-32',           // Invalid day
        '01/01/2024',           // Non-ISO format
        'tomorrow',
        '',
        null,
        undefined,
      ];

      invalidDates.forEach(date => {
        const result = parseFutureDate(date);
        expect(result).toBeNull();
      });
    });

    it('should handle different ISO formats', () => {
      const formats = [
        '2024-12-31T23:59:59Z',
        '2024-12-31T23:59:59.000Z',
        '2024-12-31T23:59:59+00:00',
      ];

      formats.forEach(format => {
        const result = parseFutureDate(format);
        expect(result).toBeInstanceOf(Date);
      });
    });

    it('should accept dates just 1 second in the future', () => {
      const nearFuture = '2024-01-01T12:00:01Z';
      const result = parseFutureDate(nearFuture);

      expect(result).toBeInstanceOf(Date);
    });
  });
});
