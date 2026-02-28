import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { getLastLine } from '../remove_duplicate_transactions.js';

describe('Remove Duplicate Transactions Script', () => {
  const testDir = './test-deduplication-isolated';

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('getLastLine', () => {
    it('should return last line from file with multiple data rows', () => {
      const testFile = path.join(testDir, 'test.csv');
      const content = `"Date","Payee","Amount","Tags"\n"01/15/2024","Store A","10.00",""\n"01/20/2024","Store B","20.00",""`;
      writeFileSync(testFile, content);

      const result = getLastLine(testFile);
      
      expect(result).toBe('"01/20/2024","Store B","20.00",""');
    });

    it('should return null for empty file (header only)', () => {
      const testFile = path.join(testDir, 'empty.csv');
      const content = `"Date","Payee","Amount","Tags"\n`;
      writeFileSync(testFile, content);

      const result = getLastLine(testFile);
      
      expect(result).toBeNull();
    });

    it('should handle file with single data row', () => {
      const testFile = path.join(testDir, 'single.csv');
      const content = `"Date","Payee","Amount","Tags"\n"01/15/2024","Store A","10.00",""`;
      writeFileSync(testFile, content);

      const result = getLastLine(testFile);
      
      expect(result).toBe('"01/15/2024","Store A","10.00",""');
    });

    it('should handle file with no trailing newline', () => {
      const testFile = path.join(testDir, 'no-newline.csv');
      const content = `"Date","Payee","Amount","Tags"\n"01/15/2024","Store A","10.00",""`;
      writeFileSync(testFile, content);

      const result = getLastLine(testFile);
      
      expect(result).toBe('"01/15/2024","Store A","10.00",""');
    });

    it('should handle multiple transactions', () => {
      const testFile = path.join(testDir, 'multiple.csv');
      const content = [
        '"Date","Payee","Amount","Tags"',
        '"01/01/2024","Store A","10.00",""',
        '"01/05/2024","Store B","20.00",""',
        '"01/10/2024","Store C","30.00",""',
        '"01/15/2024","Store D","40.00",""'
      ].join('\n');
      writeFileSync(testFile, content);

      const result = getLastLine(testFile);
      
      expect(result).toBe('"01/15/2024","Store D","40.00",""');
    });
  });
});
