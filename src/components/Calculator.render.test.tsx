// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LangProvider } from '../contexts/LangContext';
import { useCalculator } from '../hooks/useCalculator';
import Calculator from './Calculator';

afterEach(cleanup);

// Mirrors how App.tsx wires useCalculator() into <Calculator> — a thin
// harness so the render tests exercise the REAL onBlur-clamping logic
// (Calculator.tsx) together with the real setInputs (useCalculator.ts),
// not a mock that could silently drift from production wiring.
function Harness() {
  const {
    inputs, setInputs, calcState, calcError, calculate, isStale, resetToDefaults,
    scenarios, scenarioSaveError, scenarioLimitReached, saveCurrentAsScenario, loadScenario,
    deleteScenario, renameScenario, duplicateScenario, importScenarios,
  } = useCalculator();
  return (
    <Calculator
      inputs={inputs}
      setInputs={setInputs}
      calcState={calcState}
      onCalculate={calculate}
      onResetToDefaults={resetToDefaults}
      isStale={isStale}
      calcError={calcError}
      scenarios={scenarios}
      scenarioSaveError={scenarioSaveError}
      scenarioLimitReached={scenarioLimitReached}
      onSaveScenario={saveCurrentAsScenario}
      onLoadScenario={loadScenario}
      onDeleteScenario={deleteScenario}
      onRenameScenario={renameScenario}
      onDuplicateScenario={duplicateScenario}
      onImportScenarios={importScenarios}
    />
  );
}

function renderCalculator() {
  return render(
    <LangProvider>
      <Harness />
    </LangProvider>
  );
}

describe('Calculator creditworthiness cross-link (render)', () => {
  it(
    'regression: a "Sprawdź zdolność kredytową" link to the creditworthiness calculator appears once a result ' +
      'exists — the mortgage calculator was the only one of the three with no contextual link to a sibling ' +
      'calculator (CW→mortgage and salary→CW already existed)',
    async () => {
      const user = userEvent.setup();
      renderCalculator();
      expect(screen.queryByRole('link', { name: /zdolność kredytową/i })).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /oblicz/i }));
      const link = screen.getByRole('link', { name: /zdolność kredytową/i });
      expect(link).toBeInTheDocument();
      expect(link.getAttribute('href')).toMatch(/^\/zdolnosc-kredytowa\.html\?years=\d+&rate=/);
    }
  );
});

describe('Calculator keyboard shortcut discoverability (render)', () => {
  it(
    'regression: the "Oblicz" button has a title tooltip mentioning Ctrl+Enter — the Ctrl/Cmd+Enter shortcut ' +
      '(isCalculateShortcut) worked but was never surfaced anywhere in the UI, so a user had no way to discover it',
    () => {
      renderCalculator();
      const btn = screen.getByRole('button', { name: /oblicz/i });
      expect(btn.getAttribute('title')).toMatch(/ctrl/i);
    }
  );
});

describe('Calculator onBlur clamping (render)', () => {
  it('regression: an absurdly large #total-monthly value is clamped to sliderMax on blur instead of accepted verbatim', async () => {
    const user = userEvent.setup();
    renderCalculator();
    const input = document.getElementById('total-monthly') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, '999999999');
    await user.tab(); // blur

    const clamped = Number(input.value);
    expect(clamped).toBeLessThan(999999999);
    expect(Number.isFinite(clamped)).toBe(true);
    expect(clamped).toBeGreaterThan(0);
  });

  it('regression: zero in #total-monthly is clamped up to sliderMin on blur instead of accepted verbatim', async () => {
    const user = userEvent.setup();
    renderCalculator();
    const input = document.getElementById('total-monthly') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, '0');
    await user.tab();

    expect(Number(input.value)).toBeGreaterThan(0);
  });
});

describe('Calculator strategy-conditional fields (render)', () => {
  it('shows #total-monthly for the default fixed_total strategy and hides the fields of other strategies', () => {
    renderCalculator();
    expect(document.getElementById('total-monthly')).not.toBeNull();
    expect(document.getElementById('overpay-amount')).toBeNull();
    expect(document.getElementById('shorten-amount')).toBeNull();
  });

  it('switches to #overpay-amount when the strategy select changes to fixed_overpay, hiding #total-monthly', async () => {
    const user = userEvent.setup();
    renderCalculator();
    const select = screen.getByLabelText(/strategia|strategy/i) as HTMLSelectElement;
    await user.selectOptions(select, 'fixed_overpay');

    expect(document.getElementById('overpay-amount')).not.toBeNull();
    expect(document.getElementById('total-monthly')).toBeNull();
  });

  it('switches to #shorten-amount when the strategy select changes to shorten_period', async () => {
    const user = userEvent.setup();
    renderCalculator();
    const select = screen.getByLabelText(/strategia|strategy/i) as HTMLSelectElement;
    await user.selectOptions(select, 'shorten_period');

    expect(document.getElementById('shorten-amount')).not.toBeNull();
    expect(document.getElementById('total-monthly')).toBeNull();
  });
});
