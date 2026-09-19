import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';

const SRC_DIR = join(__dirname, '..');

function listSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(full));
    } else if (['.ts', '.tsx', '.css'].includes(extname(entry.name)) && !entry.name.includes('.test.')) {
      files.push(full);
    }
  }
  return files;
}

function definedCssVars(): Set<string> {
  const css = readFileSync(join(SRC_DIR, 'index.css'), 'utf-8');
  const rootBlock = css.match(/:root\s*{([^}]*)}/)?.[1] ?? '';
  const defined = new Set<string>();
  for (const m of rootBlock.matchAll(/--([a-zA-Z0-9-]+)\s*:/g)) defined.add(m[1]!);
  return defined;
}

/**
 * var(--nazwa) bez wartości domyślnej wskazujący na niezdefiniowaną zmienną
 * nie jest błędem składniowym — przeglądarka po cichu traktuje deklarację
 * tak, jakby jej nie było (dziedziczenie/wartość początkowa), więc literówka
 * w nazwie zmiennej (np. --text1 zamiast --text) nie daje żadnego ostrzeżenia
 * w konsoli ani błędu builda — jedyny objaw to element wyglądający "trochę
 * inaczej niż powinien". Tak właśnie ErrorBoundary.tsx po cichu tracił kolor
 * nagłówka przez var(--text1), którego nikt nigdy nie zdefiniował.
 */
describe('CSS custom properties', () => {
  it('regression: every var(--x) without a fallback must reference a variable actually defined in :root — a typo like var(--text1) instead of var(--text) fails silently in the browser with no console warning', () => {
    const defined = definedCssVars();
    expect(defined.size).toBeGreaterThan(10);

    const offenders: string[] = [];
    for (const file of listSourceFiles(SRC_DIR)) {
      const content = readFileSync(file, 'utf-8');
      for (const m of content.matchAll(/var\(--([a-zA-Z0-9-]+)\s*(,[^)]*)?\)/g)) {
        const [, name, fallback] = m;
        if (fallback) continue; // has its own fallback — intentionally tolerant
        if (!defined.has(name!)) offenders.push(`${file}: --${name}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
