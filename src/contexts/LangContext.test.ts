import { describe, it, expect } from 'vitest';
import { resolveInitialLang } from './LangContext';

describe('resolveInitialLang', () => {
  it('falls back to "pl" when there is neither a URL param nor a stored value', () => {
    expect(resolveInitialLang('', null)).toBe('pl');
  });

  it('uses the stored language when there is no ?lang= in the URL', () => {
    expect(resolveInitialLang('', 'en')).toBe('en');
  });

  it(
    'regression: ?lang= takes priority over the stored/remembered language — a scenario link ' +
      'shared via Calculator.tsx carries this param so the recipient sees the calculator in the ' +
      'same language it was sent in, not their own default or previously remembered one',
    () => {
      expect(resolveInitialLang('?lang=en', 'pl')).toBe('en');
      expect(resolveInitialLang('?lang=pl', 'en')).toBe('pl');
    },
  );

  it('ignores an invalid ?lang= value and falls back to the stored language', () => {
    expect(resolveInitialLang('?lang=xx', 'en')).toBe('en');
  });

  it('ignores an invalid stored value when there is no valid URL param, falling back to "pl"', () => {
    expect(resolveInitialLang('', 'xx')).toBe('pl');
  });
});
