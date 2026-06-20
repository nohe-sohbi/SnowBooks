import { describe, it, expect } from 'vitest';
import { formatSize, formatDuration, formatTimeRemaining } from './formatters';

describe('formatSize', () => {
  it('formats bytes', () => {
    expect(formatSize(0)).toBe('0.0 B');
    expect(formatSize(512)).toBe('512.0 B');
  });

  it('scales through KB, MB and GB', () => {
    expect(formatSize(1024)).toBe('1.0 KB');
    expect(formatSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatSize(1024 * 1024 * 1024)).toBe('1.0 GB');
  });
});

describe('formatDuration', () => {
  it('formats minutes and zero-padded seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(600)).toBe('10:00');
  });

  it('guards against invalid input', () => {
    expect(formatDuration(Number.NaN)).toBe('0:00');
    expect(formatDuration(-10)).toBe('0:00');
  });
});

describe('formatTimeRemaining', () => {
  it('returns an empty string for unknown or non-positive estimates', () => {
    expect(formatTimeRemaining(undefined)).toBe('');
    expect(formatTimeRemaining(0)).toBe('');
    expect(formatTimeRemaining(-5)).toBe('');
    expect(formatTimeRemaining(Number.NaN)).toBe('');
  });

  it('formats seconds-only durations', () => {
    expect(formatTimeRemaining(45)).toBe('45s');
  });

  it('formats whole minutes', () => {
    expect(formatTimeRemaining(120)).toBe('2m');
  });

  it('formats minutes and seconds', () => {
    expect(formatTimeRemaining(150)).toBe('2m 30s');
  });
});
