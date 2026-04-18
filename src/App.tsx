import { LazyMotion, domAnimation } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { LangProvider } from './contexts/LangContext';
import { useLang } from './contexts/LangContext';
import { useCalculator } from './hooks/useCalculator';
import Nav from './components/Nav';
import Hero from './components/Hero';

const HowItWorks = lazy(() => import('./components/HowItWorks'));
const ExampleSection = lazy(() => import('./components/ExampleSection'));
const FAQ = lazy(() => import('./components/FAQ'));
const Calculator = lazy(() => import('./components/Calculator'));
const Schedule = lazy(() => import('./components/Schedule'));
const StrategyComparison = lazy(() => import('./components/StrategyComparison'));
const Footer = lazy(() => import('./components/Footer'));

function AppInner() {
  const { t } = useLang();
  const {
    inputs, setInputs, calcState, calcError, calculate,
    onOverpayChange, onRateChange, onCustomEffectChange, onRowEffectChange,
    resetOverpays, clearOverpays, resetRates,
  } = useCalculator();

  return (
    <>
      <Nav />
      <Hero />
      <Suspense fallback={null}>
        <HowItWorks />
        <ExampleSection />
        <FAQ />

        <div className="tools-divider">
          <div className="tools-divider-line" />
          <div className="tools-divider-content">
            <div className="tools-divider-icon">⚙️</div>
            <div className="tools-divider-label">{t('tools_divider')}</div>
          </div>
          <div className="tools-divider-line right" />
        </div>

        <Calculator
          inputs={inputs}
          setInputs={setInputs}
          calcState={calcState}
          onCalculate={calculate}
          calcError={calcError}
        />
        {calcState && <StrategyComparison inputs={inputs} calcState={calcState} />}
        <Schedule
          calcState={calcState}
          onOverpayChange={onOverpayChange}
          onRateChange={onRateChange}
          onCustomEffectChange={onCustomEffectChange}
          onRowEffectChange={onRowEffectChange}
          onResetOverpays={resetOverpays}
          onClearOverpays={clearOverpays}
          onResetRates={resetRates}
        />
        <Footer />
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      <LangProvider>
        <AppInner />
      </LangProvider>
    </LazyMotion>
  );
}
