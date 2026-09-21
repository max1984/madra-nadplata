import { LazyMotion, domAnimation, MotionConfig } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { LangProvider, useLang } from './contexts/LangContext';
import { useCalculator } from './hooks/useCalculator';
import Nav from './components/Nav';
import Hero from './components/Hero';
import AdConsent from './components/AdConsent';
import PrivacyPolicy from './components/PrivacyPolicy';
import ErrorBoundary from './components/ErrorBoundary';
import AdSlot from './components/AdSlot';

const HowItWorks = lazy(() => import('./components/HowItWorks'));
const ExampleSection = lazy(() => import('./components/ExampleSection'));
const SupportOptions = lazy(() => import('./components/SupportOptions'));
const FAQ = lazy(() => import('./components/FAQ'));
const Calculator = lazy(() => import('./components/Calculator'));
const BankOffers = lazy(() => import('./components/BankOffers'));
const Schedule = lazy(() => import('./components/Schedule'));
const Footer = lazy(() => import('./components/Footer'));

function AppInner() {
  const { t } = useLang();
  const {
    inputs, setInputs, calcState, calcError, calculate, isStale, resetToDefaults,
    scenarios, scenarioSaveError, scenarioLimitReached, saveCurrentAsScenario, loadScenario, deleteScenario, renameScenario, duplicateScenario, importScenarios,
    onOverpayChange, onRateChange, onCustomEffectChange, onRowEffectChange,
    resetOverpays, clearOverpays, resetRates,
  } = useCalculator();

  return (
    <>
      <AdConsent />
      <PrivacyPolicy />
      <Nav />
      <Hero />
      {/* Granica osobna od kalkulatora (poniżej) — FAQ/HowItWorks/przykład
          nie mają powodu czekać na chunk Calculatora (ciągnie za sobą
          chart.js, spory kawałek). Fallback z minHeight zamiast null, żeby
          doładowanie chunku nie robiło skoku layoutu. */}
      <Suspense fallback={<div style={{ minHeight: 900 }} />}>
        <HowItWorks />
        <ExampleSection />
        <SupportOptions />
        <FAQ />
      </Suspense>

      <AdSlot slot="inArticle" />

      <div className="tools-divider">
        <div className="tools-divider-line" />
        <div className="tools-divider-content">
          <svg className="tools-divider-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h10M17 6h3M4 12h3M9 12h11M4 18h13M20 18h0" />
            <circle cx="14" cy="6" r="2" />
            <circle cx="6" cy="12" r="2" />
            <circle cx="17" cy="18" r="2" />
          </svg>
          <div className="tools-divider-label">{t('tools_divider')}</div>
        </div>
        <div className="tools-divider-line right" />
      </div>

      <Suspense fallback={<div style={{ minHeight: 1200 }} />}>
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
        <AdSlot slot="afterResults" />

        <BankOffers calcState={calcState} />

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
    <ErrorBoundary>
      {/* reducedMotion="user" — respektuje prefers-reduced-motion z systemu.
          CSS w index.css tłumi tylko natywne animation/transition; sprężyny
          i przesunięcia sterowane przez framer-motion (whileHover, fadeUp,
          AnimatePresence...) nie są CSS-em i bez tego ignorowały tę preferencję. */}
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domAnimation} strict>
          <LangProvider>
            <AppInner />
          </LangProvider>
        </LazyMotion>
      </MotionConfig>
    </ErrorBoundary>
  );
}
