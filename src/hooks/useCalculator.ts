import { useState, useCallback } from 'react';
import {
  calcStdPayment,
  buildSchedule,
  buildBaseSchedule,
  naturalOverpaysFromBalance,
  balanceAt,
  type ScheduleRow,
} from '../lib/mortgage';
import type { TranslationKey } from '../lib/i18n';

export type Strategy = 'reduce_payment' | 'fixed_total' | 'fixed_overpay' | 'shorten_period' | 'custom';

export interface CalcInputs {
  loanAmount: number;
  interestRate: number;
  loanMonths: number;
  prepayFee: number;
  strategy: Strategy;
  totalMonthlySlider: number;
  overpayAmountSlider: number;
  shortenAmountSlider: number;
  overpayStartMonth: number;
}

export interface CalcState {
  P: number;
  r: number;
  months: number;
  prepayFee: number;
  stdPayment: number;
  origStdPayment: number;
  customOverpay: number[];
  customRates: number[];
  strategy: Strategy;
  customEffect: 'shorten' | 'reduce';
  totalMonthly: number;
  defaultOverpay: number;
  baseInterest: number;
  baseMonths: number;
  baseBalances: number[];
  baseCumInterestByMonth: number[];
  rows: ScheduleRow[];
}

const DEFAULT_INPUTS: CalcInputs = {
  loanAmount: 800000,
  interestRate: 6.5,
  loanMonths: 360,
  prepayFee: 0,
  strategy: 'reduce_payment',
  totalMonthlySlider: 7000,
  overpayAmountSlider: 1000,
  shortenAmountSlider: 1000,
  overpayStartMonth: 0,
};

function parseUrlInputs(): Partial<CalcInputs> {
  const sp = new URLSearchParams(window.location.search);
  const patch: Partial<CalcInputs> = {};
  if (sp.has('amount')) patch.loanAmount = +sp.get('amount')!;
  if (sp.has('rate')) patch.interestRate = +sp.get('rate')!;
  if (sp.has('months')) patch.loanMonths = +sp.get('months')!;
  if (sp.has('fee')) patch.prepayFee = +sp.get('fee')!;
  const strat = sp.get('strategy');
  if (strat && ['reduce_payment', 'fixed_total', 'fixed_overpay', 'shorten_period', 'custom'].includes(strat)) {
    patch.strategy = strat as Strategy;
  }
  if (sp.has('total')) patch.totalMonthlySlider = +sp.get('total')!;
  if (sp.has('overpay')) patch.overpayAmountSlider = +sp.get('overpay')!;
  if (sp.has('shorten')) patch.shortenAmountSlider = +sp.get('shorten')!;
  if (sp.has('start')) patch.overpayStartMonth = +sp.get('start')!;
  return patch;
}

function buildUrlParams(inp: CalcInputs): string {
  const sp = new URLSearchParams();
  sp.set('amount', String(inp.loanAmount));
  sp.set('rate', String(inp.interestRate));
  sp.set('months', String(inp.loanMonths));
  sp.set('fee', String(inp.prepayFee));
  sp.set('strategy', inp.strategy);
  if (inp.strategy === 'fixed_total') sp.set('total', String(inp.totalMonthlySlider));
  if (inp.strategy === 'fixed_overpay') sp.set('overpay', String(inp.overpayAmountSlider));
  if (inp.strategy === 'shorten_period') sp.set('shorten', String(inp.shortenAmountSlider));
  if (inp.overpayStartMonth > 0) sp.set('start', String(inp.overpayStartMonth));
  return sp.toString();
}

function validateInputs(inp: CalcInputs): TranslationKey | null {
  if (!isFinite(inp.loanAmount) || inp.loanAmount < 1000 || inp.loanAmount > 10_000_000) {
    return 'error_loan_amount';
  }
  if (!isFinite(inp.loanMonths) || inp.loanMonths < 12 || inp.loanMonths > 360) {
    return 'error_months';
  }
  if (!isFinite(inp.interestRate) || inp.interestRate < 0.1 || inp.interestRate > 25) {
    return 'error_rate';
  }
  return null;
}

function computeCalcState(inp: CalcInputs): CalcState {
  const { loanAmount: P, interestRate, loanMonths: months, prepayFee: feeRate, strategy } = inp;
  const r = interestRate / 100 / 12;
  const fee = feeRate / 100;
  const stdPayment = calcStdPayment(P, r, months);
  const customRates = Array<number>(months).fill(r);
  const startMonth = inp.overpayStartMonth ?? 0;

  let customOverpay: number[];
  let totalMonthly = 0;
  let defaultOverpay = 0;

  if (strategy === 'reduce_payment' || strategy === 'fixed_total') {
    totalMonthly = inp.totalMonthlySlider;
    defaultOverpay = totalMonthly;
    if (startMonth > 0) {
      const noOv = Array<number>(months).fill(0);
      const balAtStart = balanceAt(P, customRates, months, noOv, startMonth - 1, r);
      const postOvs = naturalOverpaysFromBalance(balAtStart, startMonth, customRates, months, totalMonthly, r);
      customOverpay = [...Array<number>(startMonth).fill(0), ...postOvs];
    } else {
      customOverpay = naturalOverpaysFromBalance(P, 0, customRates, months, totalMonthly, r);
    }
  } else if (strategy === 'fixed_overpay') {
    defaultOverpay = inp.overpayAmountSlider;
    customOverpay = Array<number>(months).fill(defaultOverpay);
    for (let i = 0; i < startMonth && i < months; i++) customOverpay[i] = 0;
  } else if (strategy === 'shorten_period') {
    defaultOverpay = inp.shortenAmountSlider;
    customOverpay = Array<number>(months).fill(defaultOverpay);
    for (let i = 0; i < startMonth && i < months; i++) customOverpay[i] = 0;
  } else {
    customOverpay = Array<number>(months).fill(0);
  }

  const base = buildBaseSchedule(P, customRates, months, r);
  const fixedStd = strategy === 'shorten_period' ? stdPayment : null;
  const rows = buildSchedule(P, customRates, months, fee, customOverpay, r, fixedStd);

  return {
    P, r, months, prepayFee: fee, stdPayment, origStdPayment: stdPayment,
    customOverpay, customRates, strategy, customEffect: 'shorten' as const, totalMonthly, defaultOverpay,
    baseInterest: base.totalInterest, baseMonths: base.count, baseBalances: base.balances,
    baseCumInterestByMonth: base.cumInterestByMonth,
    rows,
  };
}

function resolveFixedStd(prev: CalcState): number | null {
  if (prev.strategy === 'shorten_period') return prev.origStdPayment;
  if (prev.strategy === 'custom' && prev.customEffect === 'shorten') return prev.origStdPayment;
  return null;
}

export function useCalculator() {
  const [inputs, setInputsState] = useState<CalcInputs>(() => ({
    ...DEFAULT_INPUTS,
    ...parseUrlInputs(),
  }));

  const [calcState, setCalcState] = useState<CalcState | null>(() => {
    const urlPatch = parseUrlInputs();
    if (!Object.keys(urlPatch).length) return null;
    const inp = { ...DEFAULT_INPUTS, ...urlPatch };
    if (validateInputs(inp) !== null) return null;
    return computeCalcState(inp);
  });

  const [calcError, setCalcError] = useState<TranslationKey | null>(null);

  const setInputs = useCallback((patch: Partial<CalcInputs>) => {
    setInputsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const calculate = useCallback((overrideInputs?: Partial<CalcInputs>) => {
    const inp = overrideInputs ? { ...inputs, ...overrideInputs } : inputs;
    const err = validateInputs(inp);
    if (err) {
      setCalcError(err);
      return;
    }
    setCalcError(null);
    window.history.replaceState(null, '', '?' + buildUrlParams(inp));
    setCalcState(computeCalcState(inp));
  }, [inputs]);

  const onOverpayChange = useCallback((idx: number, value: string) => {
    setCalcState((prev) => {
      if (!prev) return prev;
      const newOverpay = [...prev.customOverpay];
      newOverpay[idx] = Math.max(0, parseFloat(value) || 0);

      if (prev.strategy === 'reduce_payment' || prev.strategy === 'fixed_total') {
        const balance = balanceAt(prev.P, prev.customRates, prev.months, newOverpay, idx, prev.r);
        const natural = naturalOverpaysFromBalance(balance, idx + 1, prev.customRates, prev.months, prev.totalMonthly, prev.r);
        for (let i = idx + 1; i < prev.months; i++) {
          newOverpay[i] = natural[i - (idx + 1)] ?? 0;
        }
      }

      const rows = buildSchedule(prev.P, prev.customRates, prev.months, prev.prepayFee, newOverpay, prev.r, resolveFixedStd(prev));
      return { ...prev, customOverpay: newOverpay, rows };
    });
  }, []);

  const onRateChange = useCallback((idx: number, annualRateValue: string) => {
    setCalcState((prev) => {
      if (!prev) return prev;
      const newRate = Math.max(0.001, parseFloat(annualRateValue) || 0) / 100 / 12;
      const newRates = [...prev.customRates];
      for (let i = idx; i < prev.months; i++) newRates[i] = newRate;

      let newOverpay = [...prev.customOverpay];
      if (prev.strategy === 'reduce_payment' || prev.strategy === 'fixed_total') {
        newOverpay = naturalOverpaysFromBalance(prev.P, 0, newRates, prev.months, prev.totalMonthly, prev.r);
      }

      const base = buildBaseSchedule(prev.P, newRates, prev.months, prev.r);
      const rows = buildSchedule(prev.P, newRates, prev.months, prev.prepayFee, newOverpay, prev.r, resolveFixedStd(prev));

      return {
        ...prev,
        customRates: newRates,
        customOverpay: newOverpay,
        baseInterest: base.totalInterest,
        baseMonths: base.count,
        baseBalances: base.balances,
        rows,
      };
    });
  }, []);

  const resetOverpays = useCallback(() => {
    setCalcState((prev) => {
      if (!prev) return prev;
      let newOverpay: number[];
      if (prev.strategy === 'reduce_payment' || prev.strategy === 'fixed_total') {
        newOverpay = naturalOverpaysFromBalance(prev.P, 0, prev.customRates, prev.months, prev.totalMonthly, prev.r);
      } else if (prev.strategy === 'custom') {
        newOverpay = Array<number>(prev.months).fill(0);
      } else {
        newOverpay = Array<number>(prev.months).fill(prev.defaultOverpay);
      }
      const rows = buildSchedule(prev.P, prev.customRates, prev.months, prev.prepayFee, newOverpay, prev.r, resolveFixedStd(prev));
      return { ...prev, customOverpay: newOverpay, rows };
    });
  }, []);

  const clearOverpays = useCallback(() => {
    setCalcState((prev) => {
      if (!prev) return prev;
      const newOverpay = Array<number>(prev.months).fill(0);
      const rows = buildSchedule(prev.P, prev.customRates, prev.months, prev.prepayFee, newOverpay, prev.r, resolveFixedStd(prev));
      return { ...prev, customOverpay: newOverpay, rows };
    });
  }, []);

  const onCustomEffectChange = useCallback((effect: 'shorten' | 'reduce') => {
    setCalcState((prev) => {
      if (!prev || prev.strategy !== 'custom') return prev;
      const fixedStd = effect === 'shorten' ? prev.origStdPayment : null;
      const rows = buildSchedule(prev.P, prev.customRates, prev.months, prev.prepayFee, prev.customOverpay, prev.r, fixedStd);
      return { ...prev, customEffect: effect, rows };
    });
  }, []);

  const resetRates = useCallback(() => {
    setCalcState((prev) => {
      if (!prev) return prev;
      const newRates = Array<number>(prev.months).fill(prev.r);
      let newOverpay = [...prev.customOverpay];
      if (prev.strategy === 'reduce_payment' || prev.strategy === 'fixed_total') {
        newOverpay = naturalOverpaysFromBalance(prev.P, 0, newRates, prev.months, prev.totalMonthly, prev.r);
      }
      const base = buildBaseSchedule(prev.P, newRates, prev.months, prev.r);
      const rows = buildSchedule(prev.P, newRates, prev.months, prev.prepayFee, newOverpay, prev.r, resolveFixedStd(prev));
      return {
        ...prev,
        customRates: newRates,
        customOverpay: newOverpay,
        baseInterest: base.totalInterest,
        baseMonths: base.count,
        baseBalances: base.balances,
        rows,
      };
    });
  }, []);

  return {
    inputs,
    setInputs,
    calcState,
    calcError,
    calculate,
    onOverpayChange,
    onRateChange,
    onCustomEffectChange,
    resetOverpays,
    clearOverpays,
    resetRates,
  };
}
