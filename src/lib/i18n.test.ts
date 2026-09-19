import { describe, it, expect } from 'vitest';
import { t } from './i18n';

describe('nav_lang_group', () => {
  it('regression: the language-switcher aria-label must actually be translated, not left as a hardcoded English string — a Polish screen reader user would otherwise hear the English word "Language" in an all-Polish nav', () => {
    expect(t('pl', 'nav_lang_group')).toBe('Język');
    expect(t('en', 'nav_lang_group')).toBe('Language');
    expect(t('pl', 'nav_lang_group')).not.toBe(t('en', 'nav_lang_group'));
  });
});
