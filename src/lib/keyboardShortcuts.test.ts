import { describe, it, expect } from 'vitest';
import { isCalculateShortcut } from './keyboardShortcuts';

describe('isCalculateShortcut', () => {
  it('is true for Ctrl+Enter and Cmd+Enter (Windows/Linux vs. Mac)', () => {
    expect(isCalculateShortcut({ key: 'Enter', ctrlKey: true, metaKey: false })).toBe(true);
    expect(isCalculateShortcut({ key: 'Enter', ctrlKey: false, metaKey: true })).toBe(true);
  });

  it('regression: plain Enter (no modifier) is not the shortcut — that key is already used per-field to commit/blur a single input, and must keep doing only that', () => {
    expect(isCalculateShortcut({ key: 'Enter', ctrlKey: false, metaKey: false })).toBe(false);
  });

  it('is false for Ctrl/Cmd with a different key', () => {
    expect(isCalculateShortcut({ key: 'a', ctrlKey: true, metaKey: false })).toBe(false);
  });
});
