import { describe, it, expect } from 'vitest';
import { uniqueScenarioName } from './scenarioNames';

describe('uniqueScenarioName', () => {
  it('returns the desired name unchanged when nothing collides', () => {
    expect(uniqueScenarioName([], 'Nowy')).toBe('Nowy');
    expect(uniqueScenarioName(['Inny'], 'Nowy')).toBe('Nowy');
  });

  it('appends " (2)" on first collision', () => {
    expect(uniqueScenarioName(['Wariant A'], 'Wariant A')).toBe('Wariant A (2)');
  });

  it('picks the next free number when earlier suffixes are already taken', () => {
    expect(uniqueScenarioName(['Wariant A', 'Wariant A (2)'], 'Wariant A')).toBe('Wariant A (3)');
  });

  it('collision check is case-insensitive', () => {
    expect(uniqueScenarioName(['wariant a'], 'Wariant A')).toBe('Wariant A (2)');
  });

  it('trims the desired name before comparing/returning', () => {
    expect(uniqueScenarioName(['Wariant A'], '  Wariant A  ')).toBe('Wariant A (2)');
  });
});
