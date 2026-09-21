import { describe, it, expect } from 'vitest';
import { canUseNativeShare, overpayPresets, formatCalcAnnouncement, isCalculateShortcut, formatResultsSummaryText, buildScenarioComparisonCSV, scenarioSummaryText, resolveImportMessage, formatChartYTick, formatScenarioCount, shouldClearFilterOnEscape, shouldCancelDeleteConfirmOnEscape } from './Calculator';
import { t as translate } from '../lib/i18n';
import { fmt, fmtC, csvDec } from '../lib/format';
import type { ScheduleRow } from '../lib/mortgage';
import { DEFAULT_INPUTS, type ScenarioComparisonRow } from '../hooks/useCalculator';

function makeRow(cumInterest: number): ScheduleRow {
  return {
    num: 1, balanceBefore: 0, totalPayment: 0, capital: 0, regularCap: 0,
    interest: 0, overpay: 0, fee: 0, balanceAfter: 0, cumInterest, annualRate: 0,
  };
}

describe('canUseNativeShare', () => {
  it('is true when navigator.share is a function', () => {
    expect(canUseNativeShare({ share: () => Promise.resolve() })).toBe(true);
  });

  it('is false when navigator has no share method — most desktop browsers', () => {
    expect(canUseNativeShare({})).toBe(false);
  });

  it('is false when navigator itself is unavailable (e.g. SSR/build-time)', () => {
    expect(canUseNativeShare(undefined)).toBe(false);
    expect(canUseNativeShare(null)).toBe(false);
  });

  it('is false when share exists but is not callable (defensive against a broken polyfill)', () => {
    expect(canUseNativeShare({ share: 'not a function' })).toBe(false);
  });
});

describe('overpayPresets', () => {
  it('scales with the standard payment — a bigger loan gets bigger preset suggestions', () => {
    const small = overpayPresets(1000);
    const big = overpayPresets(5000);
    for (let i = 0; i < 3; i++) expect(big[i]).toBeGreaterThan(small[i]!);
  });

  it('returns three ascending amounts (10%, 25%, 50% of the standard payment)', () => {
    const presets = overpayPresets(1798.65);
    expect(presets).toHaveLength(3);
    expect(presets[0]!).toBeLessThan(presets[1]!);
    expect(presets[1]!).toBeLessThan(presets[2]!);
  });

  it('rounds every preset to a full 50 zł, never a jarring number like 173', () => {
    for (const v of overpayPresets(1234.56)) expect(v % 50).toBe(0);
  });

  it('regression: never suggests less than 50 zł, even for a tiny standard payment where 10%/25% would round to 0', () => {
    for (const v of overpayPresets(100)) expect(v).toBeGreaterThanOrEqual(50);
  });
});

describe('formatCalcAnnouncement', () => {
  const t = (key: Parameters<typeof translate>[1]) => translate('pl', key);
  const fmt = (n: number) => fmtC(n, 'pl');

  it('regression: announces something for a screen-reader user after a successful calculation — validation errors already used role="alert", but a successful result had no aria-live equivalent at all', () => {
    const cs = { rows: [makeRow(1000), makeRow(2000), makeRow(3500)] };
    const msg = formatCalcAnnouncement(cs, t, fmt);
    expect(msg.length).toBeGreaterThan(0);
    expect(msg).toContain('3');
  });

  it('reflects the row count and the final cumulative interest', () => {
    const cs = { rows: [makeRow(100), makeRow(250)] };
    const msg = formatCalcAnnouncement(cs, t, fmt);
    expect(msg).toContain('2');
    expect(msg).toContain(fmt(250));
  });

  it('does not throw for an empty schedule', () => {
    expect(() => formatCalcAnnouncement({ rows: [] }, t, fmt)).not.toThrow();
  });
});

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

describe('formatResultsSummaryText', () => {
  const t = (key: Parameters<typeof translate>[1]) => translate('pl', key);
  const fmtPl = (n: number, dec?: number) => fmt(n, dec, 'pl');
  const fmtCPl = (n: number, dec?: number) => fmtC(n, 'pl', dec);
  const url = 'https://nadplata.org/?amount=300000';

  const cs = {
    P: 300000, r: 0.06 / 12, months: 360,
    rows: [makeRow(1000), makeRow(2000), makeRow(3000)],
    baseMonths: 360, baseInterest: 300000,
  };

  it('includes the loan amount, rate and the given url — this is meant to be pasted as-is into a chat message', () => {
    const text = formatResultsSummaryText(cs, t, fmtPl, fmtCPl, url);
    expect(text).toContain(fmtPl(300000));
    expect(text).toContain('6');
    expect(text).toContain(url);
  });

  it('reflects the actual applied schedule length, not the nominal loan term', () => {
    const text = formatResultsSummaryText(cs, t, fmtPl, fmtCPl, url);
    expect(text).toContain('3'); // withMonths = rows.length = 3
    expect(text).toContain('360'); // months = nominal term
  });

  it('does not throw and has no leftover {placeholder} tokens for a normal calculation', () => {
    const text = formatResultsSummaryText(cs, t, fmtPl, fmtCPl, url);
    expect(text).not.toMatch(/\{[a-zA-Z]+\}/);
  });
});

describe('scenarioSummaryText', () => {
  const t = (key: Parameters<typeof translate>[1]) => translate('pl', key);
  const fmtPl = (n: number, dec?: number) => fmt(n, dec, 'pl');
  const fmtCPl = (n: number, dec?: number) => fmtC(n, 'pl', dec);
  const url = 'https://nadplata.org/?amount=300000';

  it('returns the same text as formatResultsSummaryText for valid inputs', () => {
    const text = scenarioSummaryText(DEFAULT_INPUTS, t, fmtPl, fmtCPl, url);
    expect(text).not.toBeNull();
    expect(text).toContain(url);
  });

  it('regression: returns null instead of throwing for a corrupted scenario — a hand-edited or broken import can carry a scenario whose inputs pass parseScenariosJSON\'s shape check but fail validateInputs (e.g. loanMonths: NaN), and computeCalcState on that would throw a RangeError from Array(NaN) inside a click handler', () => {
    const corrupted = { ...DEFAULT_INPUTS, loanMonths: NaN };
    expect(() => scenarioSummaryText(corrupted, t, fmtPl, fmtCPl, url)).not.toThrow();
    expect(scenarioSummaryText(corrupted, t, fmtPl, fmtCPl, url)).toBeNull();
  });

  it('returns null for a scenario with an out-of-range loan amount, same as any other invalid form input', () => {
    const invalid = { ...DEFAULT_INPUTS, loanAmount: -5 };
    expect(scenarioSummaryText(invalid, t, fmtPl, fmtCPl, url)).toBeNull();
  });
});

describe('resolveImportMessage', () => {
  const t = (key: Parameters<typeof translate>[1]) => translate('pl', key);

  it('reports the imported count on success', () => {
    expect(resolveImportMessage({ ok: true, count: 3 }, t)).toBe(translate('pl', 'scenario_import_success').replace('{n}', '3'));
  });

  it('reports "no valid scenarios" when the file parsed but held nothing usable', () => {
    expect(resolveImportMessage({ ok: true, count: 0 }, t)).toBe(translate('pl', 'scenario_import_empty'));
  });

  it('regression: reports a read error instead of leaving the user with no feedback at all — handleImportFileChange only wired reader.onload, so a failed FileReader read (disk/permission error, file removed between picking it and reading it) used to fire neither onload nor any message', () => {
    expect(resolveImportMessage({ ok: false }, t)).toBe(translate('pl', 'scenario_import_error'));
  });
});

describe('formatChartYTick', () => {
  const fmtPl = (n: number, dec?: number) => fmt(n, dec, 'pl');
  const fmtEn = (n: number, dec?: number) => fmt(n, dec, 'en');

  it('divides by 1000 and appends "k"', () => {
    expect(formatChartYTick(12345, fmtPl)).toBe(`${fmtPl(12.345)}k`);
  });

  it(
    'regression: reformats through whichever `fmt` is passed in, instead of a fixed locale — the balance ' +
      'chart\'s Y-axis callback used to close over the `fmt` captured when the chart was first created, so ' +
      'switching language later updated the series labels (via chart.update()) but left the Y-axis numbers ' +
      'formatted in the old locale (e.g. comma instead of dot as the decimal separator); the chart effect ' +
      'now rebuilds the callback through this function on every update, keyed off the current `fmt`',
    () => {
      expect(formatChartYTick(1234567, fmtPl)).not.toBe(formatChartYTick(1234567, fmtEn));
      expect(formatChartYTick(1234567, fmtPl)).toBe(`${fmtPl(1234.567)}k`);
      expect(formatChartYTick(1234567, fmtEn)).toBe(`${fmtEn(1234.567)}k`);
    },
  );
});

describe('formatScenarioCount', () => {
  it('formats as "count/10", matching MAX_SCENARIOS in useCalculator.ts', () => {
    expect(formatScenarioCount(0)).toBe('0/10');
    expect(formatScenarioCount(3)).toBe('3/10');
    expect(formatScenarioCount(10)).toBe('10/10');
  });
});

describe('shouldClearFilterOnEscape', () => {
  it('clears a non-empty filter on Escape', () => {
    expect(shouldClearFilterOnEscape('Escape', 'wariant')).toBe(true);
  });

  it(
    'regression: does nothing for Escape on an already-empty filter — the scenario search field ' +
      '(added alongside sort/filter for saved scenarios) had no Escape-to-clear at all, unlike the ' +
      'existing Escape-cancels-rename pattern on the scenario name edit field; guarding on a non-empty ' +
      'filter avoids swallowing Escape (e.g. for closing something else) when there is nothing to clear',
    () => {
      expect(shouldClearFilterOnEscape('Escape', '')).toBe(false);
    },
  );

  it('ignores any other key regardless of filter content', () => {
    expect(shouldClearFilterOnEscape('Enter', 'wariant')).toBe(false);
    expect(shouldClearFilterOnEscape('a', 'wariant')).toBe(false);
  });
});

describe('shouldCancelDeleteConfirmOnEscape', () => {
  it('cancels an active delete confirmation on Escape', () => {
    expect(shouldCancelDeleteConfirmOnEscape('Escape', 'scenario-1')).toBe(true);
  });

  it(
    'regression: does nothing for Escape when no delete confirmation is active — the "Na pewno?" ' +
      'state for a saved scenario had no keyboard way out at all (only the "Anuluj" button), unlike ' +
      'the existing Escape-cancels-rename and Escape-clears-filter patterns in the same scenario list',
    () => {
      expect(shouldCancelDeleteConfirmOnEscape('Escape', null)).toBe(false);
    },
  );

  it('ignores any other key regardless of confirmDeleteId', () => {
    expect(shouldCancelDeleteConfirmOnEscape('Enter', 'scenario-1')).toBe(false);
    expect(shouldCancelDeleteConfirmOnEscape('a', 'scenario-1')).toBe(false);
  });
});

describe('buildScenarioComparisonCSV', () => {
  const t = (key: Parameters<typeof translate>[1]) => translate('pl', key);

  function makeRow(overrides: Partial<ScenarioComparisonRow> = {}): ScenarioComparisonRow {
    return {
      name: 'Wariant', loanAmount: 300000, interestRate: 6, strategy: 'fixed_total',
      months: 212, totalInterest: 186999, interestSaved: 42000, monthsSaved: 88, savedAt: 1,
      ...overrides,
    };
  }

  it('starts with a UTF-8 BOM and a semicolon-separated pl header row', () => {
    const csv = buildScenarioComparisonCSV([makeRow()], t, 'pl');
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const firstLine = csv.slice(1).split('\n')[0];
    expect(firstLine).toContain(';');
    expect(firstLine).toContain('Nazwa');
  });

  it('uses a comma separator for en, matching the app-wide CSV locale convention', () => {
    const csv = buildScenarioComparisonCSV([makeRow()], (k) => translate('en', k), 'en');
    const firstLine = csv.slice(1).split('\n')[0];
    expect(firstLine).toContain(',');
  });

  it('one data row per scenario, in the given order', () => {
    const csv = buildScenarioComparisonCSV([makeRow({ name: 'A' }), makeRow({ name: 'B' })], t, 'pl');
    const lines = csv.slice(1).split('\n');
    expect(lines).toHaveLength(3); // header + 2 data rows
    expect(lines[1]).toContain('A');
    expect(lines[2]).toContain('B');
  });

  it('regression: quotes a scenario name that contains the column separator, so it does not get split into an extra column', () => {
    const csv = buildScenarioComparisonCSV([makeRow({ name: 'Wariant; z nadpłatą' })], t, 'pl');
    const dataLine = csv.slice(1).split('\n')[1]!;
    expect(dataLine.startsWith('"Wariant; z nadpłatą"')).toBe(true);
  });

  it.each(['=SUM(A1:A9)', '+1+1', '-1+1', '@SUM(1,2)'])(
    'regression: neutralizes a scenario name starting with "%s" with a leading apostrophe, so Excel/Sheets does not interpret it as a formula (CSV/formula injection)',
    (name) => {
      const csv = buildScenarioComparisonCSV([makeRow({ name })], t, 'pl');
      const dataLine = csv.slice(1).split('\n')[1]!;
      expect(dataLine.startsWith(`'${name}`)).toBe(true);
    },
  );

  it('does not alter a scenario name that merely contains (not starts with) a formula-trigger character', () => {
    const csv = buildScenarioComparisonCSV([makeRow({ name: 'Dom przy ul. Słoneczna=12' })], t, 'pl');
    const dataLine = csv.slice(1).split('\n')[1]!;
    expect(dataLine.startsWith('Dom przy ul. Słoneczna=12')).toBe(true);
  });

  it('regression: escapes a double quote inside the scenario name instead of producing invalid CSV', () => {
    const csv = buildScenarioComparisonCSV([makeRow({ name: 'Mój "ulubiony"' })], t, 'pl');
    const dataLine = csv.slice(1).split('\n')[1]!;
    expect(dataLine).toContain('"Mój ""ulubiony"""');
  });

  it('translates the strategy into a human-readable label instead of the raw internal key', () => {
    const csv = buildScenarioComparisonCSV([makeRow({ strategy: 'fixed_overpay' })], t, 'pl');
    const dataLine = csv.slice(1).split('\n')[1]!;
    expect(dataLine).not.toContain('fixed_overpay');
    expect(dataLine).toContain(t('strategy_fixed_overpay'));
  });

  it('includes the interest-saved and months-saved columns, in the header and as the last two data fields', () => {
    const csv = buildScenarioComparisonCSV([makeRow({ interestSaved: 42000, monthsSaved: 88 })], t, 'pl');
    const [headerLine, dataLine] = csv.slice(1).split('\n');
    expect(headerLine).toContain(t('scenario_compare_col_saved_interest'));
    expect(headerLine).toContain(t('scenario_compare_col_saved_months'));
    const fields = dataLine!.split(';');
    expect(fields[fields.length - 1]).toBe('88');
    expect(fields[fields.length - 2]).toBe(csvDec(42000, 'pl'));
  });
});
