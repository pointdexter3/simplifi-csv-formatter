import { describe, it, expect } from '@jest/globals';
import {
  invertTransactionDebitCredit,
  ofxReduceNoise,
  convertOfxDateTimeToIsoDate,
  convertIsoDateToSimplifiDate
} from '../format-all-financial-institutions.js';

describe('Format All Financial Institutions Script', () => {
  describe('convertOfxDateTimeToIsoDate', () => {
    it('should convert OFX datetime to ISO date', () => {
      const result = convertOfxDateTimeToIsoDate('20240115000000');
      expect(result).toBe('2024-01-15');
    });

    it('should handle different OFX date formats', () => {
      expect(convertOfxDateTimeToIsoDate('20240101120000')).toBe('2024-01-01');
      expect(convertOfxDateTimeToIsoDate('20231231235959')).toBe('2023-12-31');
      expect(convertOfxDateTimeToIsoDate('20240630000000')).toBe('2024-06-30');
    });

    it('should handle dates without time component', () => {
      expect(convertOfxDateTimeToIsoDate('20240115')).toBe('2024-01-15');
    });
  });

  describe('convertIsoDateToSimplifiDate', () => {
    it('should convert ISO date to Simplifi format', () => {
      const result = convertIsoDateToSimplifiDate('2024-01-15');
      expect(result).toBe('01/15/2024');
    });

    it('should handle various ISO dates', () => {
      expect(convertIsoDateToSimplifiDate('2024-01-01')).toBe('01/01/2024');
      expect(convertIsoDateToSimplifiDate('2023-12-31')).toBe('12/31/2023');
      expect(convertIsoDateToSimplifiDate('2024-06-30')).toBe('06/30/2024');
    });
  });

  describe('invertTransactionDebitCredit', () => {
    it('should not invert amount when no exception matches', () => {
      const result = invertTransactionDebitCredit(-50.00, 'bankname-chequing.ofx');
      expect(result).toBe(-50.00);
    });

    it('should handle positive amounts', () => {
      const result = invertTransactionDebitCredit(100.00, 'bankname-chequing.ofx');
      expect(result).toBe(100.00);
    });

    it('should be case insensitive for filename matching', () => {
      const result1 = invertTransactionDebitCredit(-50.00, 'BANKNAME-Chequing.OFX');
      const result2 = invertTransactionDebitCredit(-50.00, 'bankname-chequing.ofx');
      expect(result1).toBe(result2);
    });
  });

  describe('ofxReduceNoise', () => {
    it('should remove dollar signs', () => {
      const result = ofxReduceNoise('$50.00');
      expect(result).toBe('50.00');
    });

    it('should remove special characters', () => {
      const result = ofxReduceNoise('$50.00 from *Store #123');
      expect(result).toBe('50.00 from Store 123');
    });

    it('should reduce multiple spaces to single space', () => {
      const result = ofxReduceNoise('Transaction    from   Store');
      expect(result).toBe('Transaction from Store');
    });

    it('should remove leading and trailing whitespace from lines', () => {
      const result = ofxReduceNoise('  Line 1  \n  Line 2  \n  Line 3  ');
      expect(result).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should remove brackets', () => {
      const result = ofxReduceNoise('Payment [123] for service');
      expect(result).toBe('Payment 123 for service');
    });

    it('should remove B/M', () => {
      const result = ofxReduceNoise('B/M Payment');
      expect(result).toBe('Payment');
    });

    it('should handle complex strings', () => {
      const result = ofxReduceNoise('$100.00  *Store  [#456]  B/M  ');
      expect(result).toBe('100.00 Store 456');
    });
  });
});
