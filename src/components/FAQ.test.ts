import { describe, it, expect } from 'vitest';
import { faqQuestionId, faqPanelId } from './FAQ';

describe('faqQuestionId / faqPanelId', () => {
  it('regression: the question button and its answer panel must reference each other via matching, unique ids — aria-controls/aria-labelledby silently do nothing if these ever drift apart', () => {
    const keys = [1, 2, 3, 4, 5, 6, 7];
    const questionIds = keys.map(faqQuestionId);
    const panelIds = keys.map(faqPanelId);

    expect(new Set(questionIds).size).toBe(keys.length);
    expect(new Set(panelIds).size).toBe(keys.length);
    // Question and panel ids must never collide with each other either.
    expect(new Set([...questionIds, ...panelIds]).size).toBe(keys.length * 2);
  });

  it('is stable/deterministic for the same key', () => {
    expect(faqQuestionId(3)).toBe(faqQuestionId(3));
    expect(faqPanelId(3)).toBe(faqPanelId(3));
  });
});
