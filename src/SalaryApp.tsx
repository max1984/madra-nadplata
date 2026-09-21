import { LazyMotion, domAnimation, MotionConfig } from 'framer-motion';
import { LangProvider } from './contexts/LangContext';
import { useSalaryCalculator } from './hooks/useSalaryCalculator';
import SalaryNav from './components/salary/SalaryNav';
import SalaryCalculator from './components/salary/SalaryCalculator';
import SalaryFooter from './components/salary/SalaryFooter';
import ErrorBoundary from './components/ErrorBoundary';

function SalaryAppInner() {
  const {
    inputs, setInputs, calcState, calcError, calculate, isStale, resetToDefaults,
    scenarios, scenarioSaveError, scenarioLimitReached,
    saveCurrentAsScenario, loadScenario, deleteScenario, renameScenarioById, duplicateScenarioById, importScenarios,
  } = useSalaryCalculator();

  return (
    <>
      <SalaryNav />
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
      <SalaryFooter />
    </>
  );
}

export default function SalaryApp() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domAnimation} strict>
          <LangProvider>
            <SalaryAppInner />
          </LangProvider>
        </LazyMotion>
      </MotionConfig>
    </ErrorBoundary>
  );
}
