import { LazyMotion, domAnimation, MotionConfig } from 'framer-motion';
import { LangProvider } from './contexts/LangContext';
import { useCreditworthinessCalculator } from './hooks/useCreditworthinessCalculator';
import CreditworthinessNav from './components/creditworthiness/CreditworthinessNav';
import CreditworthinessCalculator from './components/creditworthiness/CreditworthinessCalculator';
import CreditworthinessFooter from './components/creditworthiness/CreditworthinessFooter';
import ErrorBoundary from './components/ErrorBoundary';

function CreditworthinessAppInner() {
  const {
    inputs, setInputs, calcState, calcError, calculate, isStale, resetToDefaults,
    scenarios, scenarioSaveError, saveCurrentAsScenario, loadScenario, deleteScenario,
  } = useCreditworthinessCalculator();

  return (
    <>
      <CreditworthinessNav />
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
        onSaveScenario={saveCurrentAsScenario}
        onLoadScenario={loadScenario}
        onDeleteScenario={deleteScenario}
      />
      <CreditworthinessFooter />
    </>
  );
}

export default function CreditworthinessApp() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domAnimation} strict>
          <LangProvider>
            <CreditworthinessAppInner />
          </LangProvider>
        </LazyMotion>
      </MotionConfig>
    </ErrorBoundary>
  );
}
