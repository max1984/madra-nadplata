import { LazyMotion, domAnimation, MotionConfig } from 'framer-motion';
import { LangProvider, useLang } from './contexts/LangContext';
import CreditworthinessNav from './components/creditworthiness/CreditworthinessNav';
import CreditworthinessFooter from './components/creditworthiness/CreditworthinessFooter';
import ErrorBoundary from './components/ErrorBoundary';

/**
 * Placeholder — CreditworthinessCalculator.tsx (formularz + wynik) to
 * osobny, kolejny krok planu (/Users/annakorecka/.claude/plans/zdolnosc-kredytowa.md).
 * Hook (useCreditworthinessCalculator) i cała reszta infrastruktury (i18n,
 * trzeci entry point Vite) są już gotowe i podłączone.
 */
function CreditworthinessAppInner() {
  const { t } = useLang();

  return (
    <>
      <CreditworthinessNav />
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <p>{t('cw_page_subtitle')}</p>
      </div>
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
