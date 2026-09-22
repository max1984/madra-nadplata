// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LangProvider } from '../../contexts/LangContext';
import { useSalaryCalculator, DEFAULT_SALARY_INPUTS } from '../../hooks/useSalaryCalculator';
import SalaryCalculator from './SalaryCalculator';

afterEach(() => {
  cleanup();
  // useSalaryCalculator() seeds its initial calcState from the URL query
  // string, falling back to localStorage (persistSalaryInputs, called on
  // every "Oblicz") when the URL is empty — both survive across tests in
  // this file (cleanup() only unmounts React; jsdom's location/history and
  // the in-memory localStorage polyfill from src/test/setup.ts are shared
  // module-level state for the whole file). Without resetting both, a test
  // that calculates a result leaks its inputs into the next test's fresh
  // mount, which then starts with a populated calcState instead of null.
  window.history.replaceState(null, '', '/');
  localStorage.clear();
});

function Harness() {
  const {
    inputs, setInputs, calcState, calcError, calculate, isStale, resetToDefaults,
    scenarios, scenarioSaveError, scenarioLimitReached,
    saveCurrentAsScenario, loadScenario, deleteScenario, renameScenarioById, duplicateScenarioById, importScenarios,
  } = useSalaryCalculator();
  return (
    <SalaryCalculator
      inputs={inputs}
      setInputs={setInputs}
      calcState={calcState}
      calcError={calcError}
      onCalculate={calculate}
      onResetToDefaults={resetToDefaults}
      isStale={isStale}
      scenarios={scenarios}
      scenarioSaveError={scenarioSaveError}
      scenarioLimitReached={scenarioLimitReached}
      onSaveScenario={saveCurrentAsScenario}
      onLoadScenario={loadScenario}
      onDeleteScenario={deleteScenario}
      onRenameScenario={renameScenarioById}
      onDuplicateScenario={duplicateScenarioById}
      onImportScenarios={importScenarios}
    />
  );
}

function renderSalaryCalculator() {
  return render(
    <LangProvider>
      <Harness />
    </LangProvider>
  );
}

describe('SalaryCalculator keyboard shortcut discoverability (render)', () => {
  it(
    'regression: the "Oblicz" button has a title tooltip mentioning Ctrl+Enter — the Ctrl/Cmd+Enter shortcut ' +
      '(isCalculateShortcut) worked but was never surfaced anywhere in the UI, so a user had no way to discover it',
    () => {
      renderSalaryCalculator();
      const btn = screen.getByRole('button', { name: /oblicz/i });
      expect(btn.getAttribute('title')).toMatch(/ctrl/i);
    }
  );
});

describe('SalaryCalculator custom PPK rate inputs (render)', () => {
  it(
    'regression: selecting "Niestandardowo" PPK reveals employee/employer rate inputs — previously the dropdown ' +
      'had a "custom" option but no way to actually enter custom rates, so it silently produced the exact same ' +
      '2%/1.5% result as "Standardowo" (ppkRates() already supported custom rates, the UI just never exposed them)',
    async () => {
      const user = userEvent.setup();
      renderSalaryCalculator();
      await user.click(screen.getByRole('button', { name: /opcje zaawansowane/i }));

      expect(document.getElementById('emp-ppk-employee-rate')).not.toBeInTheDocument();
      await user.selectOptions(document.getElementById('emp-ppk') as HTMLSelectElement, 'custom');

      const employeeInput = document.getElementById('emp-ppk-employee-rate') as HTMLInputElement;
      const employerInput = document.getElementById('emp-ppk-employer-rate') as HTMLInputElement;
      expect(employeeInput).toBeInTheDocument();
      expect(employerInput).toBeInTheDocument();
    }
  );

  it('clamps the employee rate to [0.5, 4] and the employer rate to [1.5, 4] on blur, matching ppkRates()', async () => {
    const user = userEvent.setup();
    renderSalaryCalculator();
    await user.click(screen.getByRole('button', { name: /opcje zaawansowane/i }));
    await user.selectOptions(document.getElementById('emp-ppk') as HTMLSelectElement, 'custom');

    const employeeInput = document.getElementById('emp-ppk-employee-rate') as HTMLInputElement;
    await user.clear(employeeInput);
    await user.type(employeeInput, '10');
    await user.tab();
    expect(Number(employeeInput.value)).toBe(4);

    await user.clear(employeeInput);
    await user.type(employeeInput, '0.1');
    await user.tab();
    expect(Number(employeeInput.value)).toBe(0.5);

    const employerInput = document.getElementById('emp-ppk-employer-rate') as HTMLInputElement;
    await user.clear(employerInput);
    await user.type(employerInput, '0.2');
    await user.tab();
    expect(Number(employerInput.value)).toBe(1.5);
  });
});

describe('SalaryCalculator Mały ZUS Plus base clamping (render)', () => {
  it(
    'regression: a malyZusPlusBase value outside the statutory range [1441.80, 5652.20] is clamped on blur ' +
      'instead of accepted verbatim — previously only base <= 0 was rejected, so e.g. 50000 zł (far above the ' +
      'legal maximum) was silently accepted and fed into the ZUS calculation',
    async () => {
      const user = userEvent.setup();
      renderSalaryCalculator();

      await user.click(screen.getByRole('button', { name: /^b2b$/i }));
      await user.selectOptions(document.getElementById('b2b-zus') as HTMLSelectElement, 'maly_zus_plus');

      const input = document.getElementById('b2b-maly-zus-base') as HTMLInputElement;
      await user.clear(input);
      await user.type(input, '50000');
      await user.tab();
      expect(Number(input.value)).toBe(5652.2);

      await user.clear(input);
      await user.type(input, '100');
      await user.tab();
      expect(Number(input.value)).toBe(1441.8);
    }
  );
});

describe('SalaryCalculator auto-scroll to results (render)', () => {
  it(
    'regression: scrolls the results section into view after the first successful calculation, matching the ' +
      'mortgage calculator (Calculator.tsx) — salary previously left the user to scroll down manually past the ' +
      'whole form to see the result',
    async () => {
      const scrollSpy = vi.spyOn(window.HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
      const user = userEvent.setup();
      renderSalaryCalculator();
      expect(scrollSpy).not.toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: /oblicz/i }));
      expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
      scrollSpy.mockRestore();
    }
  );
});

describe('SalaryCalculator print button (render)', () => {
  it('regression: a "Drukuj / Zapisz PDF" button appears once a result exists, matching the mortgage and creditworthiness calculators — the salary calculator previously had no print/PDF export at all', async () => {
    const user = userEvent.setup();
    renderSalaryCalculator();
    expect(screen.queryByRole('button', { name: /drukuj/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /oblicz/i }));
    expect(screen.getByRole('button', { name: /drukuj/i })).toBeInTheDocument();
  });
});

describe('SalaryCalculator CSV export button (render)', () => {
  it(
    'regression: a "Pobierz CSV" button appears only in annual mode, once a result exists — the annual chart ' +
      'shows net pay per month visually but there was no way to read exact figures or paste them into a ' +
      'spreadsheet, unlike the mortgage schedule which has had CSV export for a while',
    async () => {
      const user = userEvent.setup();
      renderSalaryCalculator();

      await user.click(screen.getByRole('button', { name: /oblicz/i }));
      expect(screen.queryByRole('button', { name: /pobierz csv/i })).not.toBeInTheDocument();

      await user.click(screen.getByRole('checkbox', { name: /rozliczenie roczne/i }));
      await user.click(screen.getByRole('button', { name: /oblicz/i }));
      expect(screen.getByRole('button', { name: /pobierz csv/i })).toBeInTheDocument();
    }
  );
});

describe('SalaryCalculator copy link/summary buttons (render)', () => {
  it('regression: "Kopiuj link" and "Kopiuj podsumowanie" buttons appear once a result exists — the salary calculator previously had neither, unlike the mortgage and creditworthiness calculators', async () => {
    const user = userEvent.setup();
    renderSalaryCalculator();
    await user.click(screen.getByRole('button', { name: /oblicz/i }));

    expect(screen.getByRole('button', { name: /kopiuj link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /kopiuj podsumowanie/i })).toBeInTheDocument();
  });
});

describe('SalaryCalculator Ctrl+Enter shortcut (render)', () => {
  // Minimalny harness z mockiem onCalculate zamiast prawdziwego hooka —
  // useSalaryCalculator persystuje wynik w localStorage/URL po każdym
  // przeliczeniu, więc kolejny test montujący prawdziwy hook od razu
  // widziałby wynik z poprzedniego testu w tym pliku (fałszywy "przycisk
  // już był"). Mock izoluje test do samego okablowania skrótu klawiszowego.
  function renderWithMockCalculate(onCalculate: () => void) {
    return render(
      <LangProvider>
        <SalaryCalculator
          inputs={DEFAULT_SALARY_INPUTS}
          setInputs={() => {}}
          calcState={null}
          calcError={null}
          onCalculate={onCalculate}
          onResetToDefaults={() => {}}
          isStale={false}
        />
      </LangProvider>
    );
  }

  it('regression: Ctrl+Enter calls onCalculate from anywhere on the page, matching the mortgage calculator — salary previously had no keyboard shortcut at all', async () => {
    const onCalculate = vi.fn();
    const user = userEvent.setup();
    renderWithMockCalculate(onCalculate);

    await user.keyboard('{Control>}{Enter}{/Control}');
    // Handler woła onCalculate przez setTimeout(…, 0) (patrz komentarz w
    // SalaryCalculator.tsx), więc wywołanie ląduje w kolejce mikrotask/task
    // po tym await — waitFor odpytuje zamiast zakładać synchroniczność.
    await waitFor(() => expect(onCalculate).toHaveBeenCalledTimes(1));
  });

  it('plain Enter (no modifier) does not trigger onCalculate — that key is already used per-field to commit/blur a single input', async () => {
    const onCalculate = vi.fn();
    const user = userEvent.setup();
    renderWithMockCalculate(onCalculate);

    await user.keyboard('{Enter}');
    await new Promise((r) => setTimeout(r, 10));
    expect(onCalculate).not.toHaveBeenCalled();
  });
});
