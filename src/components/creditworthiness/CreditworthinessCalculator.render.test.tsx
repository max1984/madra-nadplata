// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LangProvider } from '../../contexts/LangContext';
import { useCreditworthinessCalculator, DEFAULT_CREDITWORTHINESS_INPUTS } from '../../hooks/useCreditworthinessCalculator';
import CreditworthinessCalculator from './CreditworthinessCalculator';

afterEach(cleanup);

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
