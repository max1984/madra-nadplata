import { LangProvider } from './contexts/LangContext';
import { useLang } from './contexts/LangContext';
import { useCalculator } from './hooks/useCalculator';
import Nav from './components/Nav';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import ExampleSection from './components/ExampleSection';
import FAQ from './components/FAQ';
import Calculator from './components/Calculator';
import Schedule from './components/Schedule';
import StrategyComparison from './components/StrategyComparison';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';

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
      <CookieBanner />
    </>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AppInner />
    </LangProvider>
  );
}
