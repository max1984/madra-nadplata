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
import Footer from './components/Footer';

function AppInner() {
  const { t } = useLang();
  const {
    inputs, setInputs, calcState, calculate,
    onOverpayChange, onRateChange,
    resetOverpays, clearOverpays, resetRates,
  } = useCalculator();

  return (
    <>
      <Nav />
      <Hero />
      <HowItWorks />
      <ExampleSection />
      <section id="faq-wrapper" style={{ display: 'contents' }}>
        <FAQ />
      </section>

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
      />
      <Schedule
        calcState={calcState}
        onOverpayChange={onOverpayChange}
        onRateChange={onRateChange}
        onResetOverpays={resetOverpays}
        onClearOverpays={clearOverpays}
        onResetRates={resetRates}
      />
      <Footer />
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
