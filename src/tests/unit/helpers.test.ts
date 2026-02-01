import { describe, it, expect } from 'vitest';
import { escapeHtml, formatDate, isOnline } from '@/utils/helpers';

describe('Utility Helpers', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert("xss")&lt;/script&gt;'
      );
    });

    it('should escape ampersand', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape quotes', () => {
      expect(escapeHtml('"Hello" & \'World\'')).toBe('"Hello" &amp; \'World\'');
    });

    it('should handle plain text', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle strings with only special characters', () => {
      expect(escapeHtml('<>&"')).toBe('&lt;&gt;&amp;"');
    });
  });

  describe('formatDate', () => {
    it('should format ISO date string', () => {
      const date = '2024-01-15T10:30:00.000Z';
      const formatted = formatDate(date);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });

    it('should include time in formatted output', () => {
      const date = '2024-01-15T10:30:00.000Z';
      const formatted = formatDate(date);
      expect(formatted).toMatch(/\d{1,2}:\d{2}/); // Time pattern
    });

    it('should handle current date', () => {
      const now = new Date().toISOString();
      const formatted = formatDate(now);
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });
  });

  describe('isOnline', () => {
    it('should return a boolean', () => {
      const online = isOnline();
      expect(typeof online).toBe('boolean');
    });

    it('should match navigator.onLine', () => {
      expect(isOnline()).toBe(navigator.onLine);
    });
  });
});
