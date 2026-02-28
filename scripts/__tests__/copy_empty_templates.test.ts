import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { copyTemplateFiles } from '../copy_empty_templates.js';

describe('Copy Empty Templates Script', () => {
  const testDir = './test-templates-isolated';

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });

    // Create template structure in test directory
    const templateDir = path.join(testDir, 'template/original_ofx_files');
    mkdirSync(templateDir, { recursive: true });
    writeFileSync(path.join(templateDir, 'bankname-chequing.ofx'), 'template content');
    writeFileSync(path.join(templateDir, 'bankname-savings.ofx'), 'template content');
    writeFileSync(path.join(templateDir, 'readme.md'), '# Templates');
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('copyTemplateFiles', () => {
    it('should copy template files to destination', () => {
      expect(existsSync(path.join(testDir, 'original_ofx_files'))).toBe(false);
      
      copyTemplateFiles(testDir);
      
      expect(existsSync(path.join(testDir, 'original_ofx_files'))).toBe(true);
      expect(existsSync(path.join(testDir, 'original_ofx_files/bankname-chequing.ofx'))).toBe(true);
      expect(existsSync(path.join(testDir, 'original_ofx_files/bankname-savings.ofx'))).toBe(true);
      expect(existsSync(path.join(testDir, 'original_ofx_files/readme.md'))).toBe(true);
    });

    it('should throw error if template folder does not exist', () => {
      rmSync(path.join(testDir, 'template'), { recursive: true, force: true });
      
      expect(() => copyTemplateFiles(testDir)).toThrow('Template folder does not exist');
    });

    it('should throw error if destination already exists', () => {
      mkdirSync(path.join(testDir, 'original_ofx_files'));
      
      expect(() => copyTemplateFiles(testDir)).toThrow('Destination folder already exists');
    });
  });
});
