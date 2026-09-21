import { describe, it, expect } from 'vitest';
import {
  computeCreditworthiness,
  AVERAGE_NATIONAL_WAGE_NET_2026,
  BUFFER_FIXED_RATE_PP,
  BUFFER_VARIABLE_RATE_PP,
  DSTI_THRESHOLD_LOW,
  DSTI_THRESHOLD_HIGH,
  type CreditworthinessInputs,
} from './creditworthiness';
import { calcStdPayment } from './mortgage';

const BASE: CreditworthinessInputs = {
  netIncome: 8000,
  contractType: 'employment',
  incomeRecognitionRate: 100,
  householdSize: 1,
  firstPersonCost: 1800,
  additionalPersonCost: 700,
  existingLoanInstallments: 0,
  creditCardLimits: 0,
  alimony: 0,
  years: 25,
  nominalRatePercent: 7,
  rateType: 'fixed',
};

describe('computeCreditworthiness', () => {
  it('typowy przypadek: umowa o pracę, brak zobowiązań — DSTI jest wiążącym limitem powyżej progu przeciętnego wynagrodzenia', () => {
    const r = computeCreditworthiness(BASE);
    expect(r.recognizedIncome).toBe(8000);
    expect(r.householdCost).toBe(1800);
    expect(r.otherCommitments).toBe(0);
    expect(r.disposableIncome).toBe(6200);
    expect(r.dstiThreshold).toBe(DSTI_THRESHOLD_HIGH); // 8000 > 6624
    expect(r.maxInstallmentByDsti).toBe(4000);
    expect(r.maxInstallment).toBe(4000); // min(6200, 4000)
    expect(r.maxLoanAmount).toBeGreaterThan(0);
  });

  it('wysokie zobowiązania: disposableIncome staje się limitem wiążącym zamiast DSTI', () => {
    const r = computeCreditworthiness({ ...BASE, existingLoanInstallments: 3500 });
    expect(r.disposableIncome).toBe(8000 - 1800 - 3500); // 2700
    expect(r.maxInstallmentByDsti).toBe(4000);
    expect(r.maxInstallment).toBe(2700); // disposableIncome < DSTI limit
  });

  it('próg przeciętnego wynagrodzenia: dochód poniżej progu dostaje DSTI 40%, powyżej — 50%', () => {
    const below = computeCreditworthiness({ ...BASE, netIncome: 6000, existingLoanInstallments: 0, firstPersonCost: 0 });
    expect(below.dstiThreshold).toBe(DSTI_THRESHOLD_LOW);
    const above = computeCreditworthiness({ ...BASE, netIncome: 9000, existingLoanInstallments: 0, firstPersonCost: 0 });
    expect(above.dstiThreshold).toBe(DSTI_THRESHOLD_HIGH);
  });

  it('dochód dokładnie równy progowi przeciętnego wynagrodzenia dostaje niższy próg 40% (granica nie jest "powyżej")', () => {
    const r = computeCreditworthiness({ ...BASE, netIncome: AVERAGE_NATIONAL_WAGE_NET_2026, firstPersonCost: 0 });
    expect(r.dstiThreshold).toBe(DSTI_THRESHOLD_LOW);
  });

  it(
    'regression: próg DSTI liczony jest od surowego netIncome, nie od recognizedIncome — B2B z dochodem ' +
      '12000 i uznaniem 60% (recognizedIncome=7200, poniżej średniej krajowej) dostaje mimo to wyższy próg 50%, ' +
      'bo to netIncome (12000) klasyfikuje zamożność wnioskodawcy; liczenie progu od zdyskontowanego dochodu ' +
      'karałoby B2B podwójnie (surowszy próg + mniejsza podstawa) bez uzasadnienia',
    () => {
      const r = computeCreditworthiness({
        ...BASE,
        contractType: 'b2b',
        netIncome: 12000,
        incomeRecognitionRate: 60,
        existingLoanInstallments: 0,
        creditCardLimits: 0,
        alimony: 0,
      });
      expect(r.recognizedIncome).toBe(7200);
      expect(r.dstiThreshold).toBe(DSTI_THRESHOLD_HIGH);
      expect(r.maxInstallmentByDsti).toBe(3600); // 7200 * 0.5
      expect(r.disposableIncome).toBe(5400); // 7200 - 1800 (firstPersonCost)
      expect(r.maxInstallment).toBe(3600); // min(5400, 3600)
    }
  );

  it('regression: umowa o pracę (incomeRecognitionRate zawsze ignorowane) — próg i rata liczone od pełnego netIncome, zachowanie niezmienione przez fix progu DSTI dla B2B', () => {
    const r = computeCreditworthiness({ ...BASE, contractType: 'employment', netIncome: 12000, firstPersonCost: 1800 });
    expect(r.recognizedIncome).toBe(12000);
    expect(r.dstiThreshold).toBe(DSTI_THRESHOLD_HIGH);
    expect(r.maxInstallmentByDsti).toBe(6000); // 12000 * 0.5
  });

  it('B2B z częściowym uznaniem dochodu: recognizedIncome to netIncome × incomeRecognitionRate/100', () => {
    const r = computeCreditworthiness({ ...BASE, contractType: 'b2b', netIncome: 10000, incomeRecognitionRate: 85 });
    expect(r.recognizedIncome).toBe(8500);
  });

  it('umowa o pracę ignoruje incomeRecognitionRate — zawsze pełne 100% uznania', () => {
    const r = computeCreditworthiness({ ...BASE, contractType: 'employment', incomeRecognitionRate: 10 });
    expect(r.recognizedIncome).toBe(8000);
  });

  it('zlecenie/dzieło z niskim uznaniem dochodu (dolna granica 50%)', () => {
    const r = computeCreditworthiness({ ...BASE, contractType: 'mandate_or_specific_work', netIncome: 8000, incomeRecognitionRate: 50 });
    expect(r.recognizedIncome).toBe(4000);
  });

  it('oprocentowanie stałe dostaje niższy bufor (2,5 p.p.) niż zmienne (5 p.p.), reszta identyczna', () => {
    const fixed = computeCreditworthiness({ ...BASE, rateType: 'fixed' });
    const variable = computeCreditworthiness({ ...BASE, rateType: 'variable' });
    expect(fixed.bufferPercent).toBe(BUFFER_FIXED_RATE_PP);
    expect(variable.bufferPercent).toBe(BUFFER_VARIABLE_RATE_PP);
    expect(variable.effectiveAnnualRatePercent - fixed.effectiveAnnualRatePercent).toBe(BUFFER_VARIABLE_RATE_PP - BUFFER_FIXED_RATE_PP);
    // Wyższy bufor -> wyższa efektywna stopa -> niższa maksymalna kwota kredytu przy tej samej racie.
    expect(variable.maxLoanAmount).toBeLessThan(fixed.maxLoanAmount);
  });

  it('regression: dla zerowego oprocentowania nominalnego i zerowego bufora (hipotetycznie, przez ekstremalnie niską ratę) funkcja nie dzieli przez zero — sanity dla granicy r=0 w maxLoanFromInstallment', () => {
    // Efektywna stopa nigdy nie jest dokładnie 0 w praktyce (bufor > 0), ale
    // maxInstallment=0 (np. zerowy disposableIncome) musi dać maxLoanAmount=0
    // bez NaN/Infinity, niezależnie od stopy.
    const r = computeCreditworthiness({ ...BASE, netIncome: 0 });
    expect(r.maxInstallment).toBe(0);
    expect(r.maxLoanAmount).toBe(0);
    expect(Number.isFinite(r.maxLoanAmount)).toBe(true);
  });

  it('sanity: rata policzona wzorem annuitetowym (calcStdPayment z mortgage.ts) na wynikowej maxLoanAmount nie przekracza maxInstallment — odwrócony wzór jest spójny z oryginalnym', () => {
    const r = computeCreditworthiness(BASE);
    const monthlyRate = r.effectiveAnnualRatePercent / 100 / 12;
    const months = BASE.years * 12;
    const installmentOnMaxLoan = calcStdPayment(r.maxLoanAmount, monthlyRate, months);
    // maxLoanAmount jest zaokrąglone W DÓŁ do pełnych 100 zł (konserwatywnie),
    // więc rzeczywista rata na tę kwotę jest nieco NIŻSZA niż maxInstallment,
    // nigdy wyższa — z tolerancją na krok zaokrąglenia (100 zł kapitału to
    // najwyżej kilka złotych raty przy typowych parametrach).
    expect(installmentOnMaxLoan).toBeLessThanOrEqual(r.maxInstallment + 0.01);
    expect(installmentOnMaxLoan).toBeGreaterThan(r.maxInstallment - 5);
  });

  it('sanity: to samo dla dłuższego okresu i innego oprocentowania — inwersja trzyma się niezależnie od parametrów', () => {
    const inputs: CreditworthinessInputs = { ...BASE, years: 30, nominalRatePercent: 8.5, rateType: 'variable', netIncome: 12000 };
    const r = computeCreditworthiness(inputs);
    const monthlyRate = r.effectiveAnnualRatePercent / 100 / 12;
    const months = inputs.years * 12;
    const installmentOnMaxLoan = calcStdPayment(r.maxLoanAmount, monthlyRate, months);
    expect(installmentOnMaxLoan).toBeLessThanOrEqual(r.maxInstallment + 0.01);
    expect(installmentOnMaxLoan).toBeGreaterThan(r.maxInstallment - 5);
  });

  it('householdSize > 1 dolicza additionalPersonCost za każdą kolejną osobę', () => {
    const r = computeCreditworthiness({ ...BASE, householdSize: 3, firstPersonCost: 1800, additionalPersonCost: 700 });
    expect(r.householdCost).toBe(1800 + 2 * 700); // 3200
  });

  it('limit karty kredytowej liczy się jako 5% limitu miesięcznie, doliczone do otherCommitments', () => {
    const r = computeCreditworthiness({ ...BASE, creditCardLimits: 10000, alimony: 500 });
    expect(r.otherCommitments).toBe(10000 * 0.05 + 500); // 1000
  });

  it('ujemne/niefinite wartości wejściowe są clampowane do 0 zamiast dawać NaN', () => {
    const r = computeCreditworthiness({
      ...BASE,
      netIncome: -5000,
      existingLoanInstallments: NaN,
      creditCardLimits: -100,
      alimony: -1,
    });
    expect(r.recognizedIncome).toBe(0);
    expect(r.otherCommitments).toBe(0);
    expect(Number.isFinite(r.maxLoanAmount)).toBe(true);
  });
});
