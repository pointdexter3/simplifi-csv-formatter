import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { getNewestArchiveFolder, extractToDate } from '../archive.js';

describe('Archive Script', () => {
  const testDir = './test-archive-isolated';

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

  describe('extractToDate', () => {
    it('should extract to-date from valid folder name', () => {
      const result = extractToDate('2023-01-01_to_2024-12-31');
      expect(result).toBe('2024-12-31');
    });

    it('should return empty string for invalid folder name', () => {
      const result = extractToDate('invalid-folder-name');
      expect(result).toBe('');
    });
  });

  describe('getNewestArchiveFolder', () => {
    it('should return null when archive directory does not exist', () => {
      const result = getNewestArchiveFolder(testDir);
      expect(result).toBeNull();
    });

    it('should return null when archive directory is empty', () => {
      mkdirSync(path.join(testDir, 'archive'));
      const result = getNewestArchiveFolder(testDir);
      expect(result).toBeNull();
    });

    it('should return newest folder when multiple archive folders exist', () => {
      const archiveDir = path.join(testDir, 'archive');
      mkdirSync(archiveDir);
      mkdirSync(path.join(archiveDir, '2022-01-01_to_2022-06-30'));
      mkdirSync(path.join(archiveDir, '2023-01-01_to_2023-06-30'));
      mkdirSync(path.join(archiveDir, '2024-01-01_to_2024-06-30'));

      const result = getNewestArchiveFolder(testDir);
      expect(result).toBe('2024-01-01_to_2024-06-30');
    });

    it('should ignore non-matching folder names', () => {
      const archiveDir = path.join(testDir, 'archive');
      mkdirSync(archiveDir);
      mkdirSync(path.join(archiveDir, '2022-01-01_to_2022-06-30'));
      mkdirSync(path.join(archiveDir, 'invalid-folder'));
      mkdirSync(path.join(archiveDir, '2024-01-01_to_2024-06-30'));
      mkdirSync(path.join(archiveDir, 'other-stuff'));

      const result = getNewestArchiveFolder(testDir);
      expect(result).toBe('2024-01-01_to_2024-06-30');
    });
  });
});
