import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('passes through plain strings', () => {
    expect(cn('class-a')).toBe('class-a');
  });

  it('handles multiple class names', () => {
    expect(cn('class-a', 'class-b')).toBe('class-a class-b');
  });

  it('drops conditional or falsy values', () => {
    const isFalse = false;
    const isTrue = true;
    expect(cn('class-a', isFalse && 'class-b', isTrue && 'class-c')).toBe('class-a class-c');
  });

  it('handles undefined, null, false, and the empty string', () => {
    expect(cn('class-a', undefined, null, false, '', 'class-b')).toBe('class-a class-b');
  });

  it('resolves tailwind class conflicts using tailwind-merge', () => {
    expect(cn('p-2 p-4')).toBe('p-4');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('handles arrays and objects correctly as clsx inputs', () => {
    expect(cn(['class-a', 'class-b'])).toBe('class-a class-b');
    expect(cn({ 'class-a': true, 'class-b': false })).toBe('class-a');
  });
});
