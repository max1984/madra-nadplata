// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LangProvider } from '../../contexts/LangContext';
import { useCreditworthinessCalculator } from '../../hooks/useCreditworthinessCalculator';
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

describe('CreditworthinessCalculator copy link button (render)', () => {
  it('regression: a "Kopiuj link" button appears once a result exists, alongside the existing "Kopiuj wynik" summary button — previously only the summary button existed here', async () => {
    const user = userEvent.setup();
    renderCreditworthinessCalculator();
    expect(screen.queryByRole('button', { name: /kopiuj link/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /oblicz/i }));
    expect(screen.getByRole('button', { name: /kopiuj link/i })).toBeInTheDocument();
  });
});
