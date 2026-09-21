// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LangProvider } from '../../contexts/LangContext';
import { useSalaryCalculator } from '../../hooks/useSalaryCalculator';
import SalaryCalculator from './SalaryCalculator';

afterEach(cleanup);

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

describe('SalaryCalculator print button (render)', () => {
  it('regression: a "Drukuj / Zapisz PDF" button appears once a result exists, matching the mortgage and creditworthiness calculators — the salary calculator previously had no print/PDF export at all', async () => {
    const user = userEvent.setup();
    renderSalaryCalculator();
    expect(screen.queryByRole('button', { name: /drukuj/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /oblicz/i }));
    expect(screen.getByRole('button', { name: /drukuj/i })).toBeInTheDocument();
  });
});
