import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import * as path from 'path';
import { UploadService } from './upload.service';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

test('UploadService Security - Path Traversal', async (t) => {
  // Mock ConfigService
  const mockConfigService = {
    get: (key: string) => {
      if (key === 'UPLOAD_DIR') return './uploads';
      if (key === 'TEMP_DIR') return './temp';
      if (key === 'MAX_FILE_SIZE') return '1073741824';
      return null;
    }
  } as unknown as ConfigService;

  const uploadService = new UploadService(mockConfigService);
  const extractDir = '/safe/extraction/dir';

  await t.test('sanitizeFilename should accept valid filenames', () => {
    const { safeName, outputPath } = uploadService.sanitizeFilename('test.mp3', extractDir);
    assert.strictEqual(safeName, 'test.mp3');
    assert.strictEqual(outputPath, path.join(extractDir, 'test.mp3'));
  });

  await t.test('sanitizeFilename should handle paths inside directories', () => {
    const { safeName, outputPath } = uploadService.sanitizeFilename('folder/test.mp3', extractDir);
    assert.strictEqual(safeName, 'test.mp3');
    assert.strictEqual(outputPath, path.join(extractDir, 'test.mp3'));
  });

  await t.test('sanitizeFilename should reject empty filenames', () => {
    assert.throws(
      () => uploadService.sanitizeFilename('', extractDir),
      BadRequestException
    );
  });

  await t.test('sanitizeFilename should reject "."', () => {
    assert.throws(
      () => uploadService.sanitizeFilename('.', extractDir),
      BadRequestException
    );
  });

  await t.test('sanitizeFilename should reject ".." and its variants', () => {
    assert.throws(
      () => uploadService.sanitizeFilename('..', extractDir),
      BadRequestException
    );
    assert.throws(
      () => uploadService.sanitizeFilename('.. ', extractDir),
      BadRequestException
    );
  });

  await t.test('sanitizeFilename should trim trailing spaces and reject effectively ".." results', () => {
    // A path like "dir/.. " has a basename of ".. ".
    // Trimming it yields ".." which should be rejected.
    assert.throws(
      () => uploadService.sanitizeFilename('dir/.. ', extractDir),
      BadRequestException
    );
  });

  await t.test('sanitizeFilename should trim spaces and dots to prevent evasion (if path resolves outside)', () => {
    // If the basename ends up being tricky
    const { safeName } = uploadService.sanitizeFilename('folder/test.mp3  ', extractDir);
    assert.strictEqual(safeName, 'test.mp3'); // spaces should be trimmed
  });
});
