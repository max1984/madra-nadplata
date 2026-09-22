// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LangProvider } from '../../contexts/LangContext';
import { useCreditworthinessCalculator, DEFAULT_CREDITWORTHINESS_INPUTS } from '../../hooks/useCreditworthinessCalculator';
import CreditworthinessCalculator from './CreditworthinessCalculator';

afterEach(() => {
  cleanup();
  // useCreditworthinessCalculator() seeds its initial calcState from the URL
  // query string, falling back to localStorage (persistCreditworthinessInputs,
  // called on every "Oblicz") when the URL is empty — both survive across
  // tests in this file (cleanup() only unmounts React; jsdom's location/
  // history and the in-memory localStorage polyfill from src/test/setup.ts
  // are shared module-level state for the whole file). Without resetting
  // both, a test that calculates a result leaks its inputs into the next
  // test's fresh mount, which then starts with a populated calcState
  // instead of null.
  window.history.replaceState(null, '', '/');
  localStorage.clear();
});

function Harness() {
  const {
    inputs, setInputs, calcState, calcError, calculate, isStale, resetToDefaults,
    scenarios, scenarioSaveError, scenarioLimitReached, saveCurrentAsScenario, loadScenario, deleteScenario,
    renameScenarioById, importScenarios,
  } = useCreditworthinessCalculator();
  return (
    <CreditworthinessCalculator
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
      onImportScenarios={importScenarios}
    />
  );
}

function renderCreditworthinessCalculator() {
  return render(
    <LangProvider>
      <Harness />
    </LangProvider>
  );
}

describe('CreditworthinessCalculator auto-scroll to results (render)', () => {
  it(
    'regression: scrolls the results section into view after the first successful calculation, matching the ' +
      'mortgage calculator (Calculator.tsx) — creditworthiness previously left the user to scroll down manually ' +
      'past the whole form to see the result',
    async () => {
      const scrollSpy = vi.spyOn(window.HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
      const user = userEvent.setup();
      renderCreditworthinessCalculator();
      expect(scrollSpy).not.toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: /oblicz/i }));
      expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
      scrollSpy.mockRestore();
    }
  );
});

describe('CreditworthinessCalculator keyboard shortcut discoverability (render)', () => {
  it(
    'regression: the "Oblicz" button has a title tooltip mentioning Ctrl+Enter — the Ctrl/Cmd+Enter shortcut ' +
      '(isCalculateShortcut) worked but was never surfaced anywhere in the UI, so a user had no way to discover it',
    () => {
      renderCreditworthinessCalculator();
      const btn = screen.getByRole('button', { name: /oblicz/i });
      expect(btn.getAttribute('title')).toMatch(/ctrl/i);
    }
  );
});

describe('CreditworthinessCalculator copy link button (render)', () => {
  it('regression: a "Kopiuj link" button appears once a result exists, alongside the existing "Kopiuj wynik" summary button — previously only the summary button existed here', async () => {
    const user = userEvent.setup();
    renderCreditworthinessCalculator();
    expect(screen.queryByRole('button', { name: /kopiuj link/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /oblicz/i }));
    expect(screen.getByRole('button', { name: /kopiuj link/i })).toBeInTheDocument();
  });
});

describe('CreditworthinessCalculator Ctrl+Enter shortcut (render)', () => {
  // Mock onCalculate zamiast prawdziwego hooka — izoluje test do samego
  // okablowania skrótu klawiszowego, jak w SalaryCalculator.render.test.tsx.
  function renderWithMockCalculate(onCalculate: () => void) {
    return render(
      <LangProvider>
        <CreditworthinessCalculator
          inputs={DEFAULT_CREDITWORTHINESS_INPUTS}
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

  it('regression: Ctrl+Enter calls onCalculate from anywhere on the page, matching the mortgage calculator — creditworthiness previously had no keyboard shortcut at all', async () => {
    const onCalculate = vi.fn();
    const user = userEvent.setup();
    renderWithMockCalculate(onCalculate);

    await user.keyboard('{Control>}{Enter}{/Control}');
    await waitFor(() => expect(onCalculate).toHaveBeenCalledTimes(1));
  });

  it('plain Enter (no modifier) does not trigger onCalculate', async () => {
    const onCalculate = vi.fn();
    const user = userEvent.setup();
    renderWithMockCalculate(onCalculate);

    await user.keyboard('{Enter}');
    await new Promise((r) => setTimeout(r, 10));
    expect(onCalculate).not.toHaveBeenCalled();
  });
});
