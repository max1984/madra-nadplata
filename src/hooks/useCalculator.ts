import { useState, useCallback } from 'react';
import {
  calcStdPayment,
  buildSchedule,
  buildBaseSchedule,
  naturalOverpaysFromBalance,
  type ScheduleRow,
} from '../lib/mortgage';

export type Strategy = 'fixed_total' | 'fixed_overpay' | 'shorten_period' | 'custom';

export interface CalcInputs {
  loanAmount: number;
  interestRate: number;
  loanMonths: number;
  prepayFee: number;
  strategy: Strategy;
  totalMonthlySlider: number;
  overpayAmountSlider: number;
  shortenAmountSlider: number;
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
  totalMonthly: number;
  defaultOverpay: number;
  baseInterest: number;
  baseMonths: number;
  baseBalances: number[];
  rows: ScheduleRow[];
}

const DEFAULT_INPUTS: CalcInputs = {
  loanAmount: 800000,
  interestRate: 7.5,
  loanMonths: 360,
  prepayFee: 0,
  strategy: 'fixed_total',
  totalMonthlySlider: 7000,
  overpayAmountSlider: 1000,
  shortenAmountSlider: 1000,
};

export function useCalculator() {
  const [inputs, setInputsState] = useState<CalcInputs>(DEFAULT_INPUTS);
  const [calcState, setCalcState] = useState<CalcState | null>(null);

  const setInputs = useCallback((patch: Partial<CalcInputs>) => {
    setInputsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const calculate = useCallback((overrideInputs?: Partial<CalcInputs>) => {
    const inp = overrideInputs ? { ...inputs, ...overrideInputs } : inputs;
    const { loanAmount: P, interestRate, loanMonths: months, prepayFee: feeRate, strategy } = inp;
    const annualRate = interestRate / 100;
    const r = annualRate / 12;
    const fee = feeRate / 100;
    const stdPayment = calcStdPayment(P, r, months);
    const customRates = Array<number>(months).fill(r);

    let customOverpay: number[];
    let totalMonthly = 0;
    let defaultOverpay = 0;

    if (strategy === 'fixed_total') {
      totalMonthly = inp.totalMonthlySlider;
      defaultOverpay = totalMonthly;
      customOverpay = naturalOverpaysFromBalance(P, 0, customRates, months, totalMonthly, r);
    } else if (strategy === 'fixed_overpay') {
      defaultOverpay = inp.overpayAmountSlider;
      customOverpay = Array<number>(months).fill(defaultOverpay);
    } else if (strategy === 'shorten_period') {
      defaultOverpay = inp.shortenAmountSlider;
      customOverpay = Array<number>(months).fill(defaultOverpay);
    } else {
      customOverpay = Array<number>(months).fill(0);
    }

    const base = buildBaseSchedule(P, customRates, months, r);
    const fixedStd = strategy === 'shorten_period' ? stdPayment : null;
    const rows = buildSchedule(P, customRates, months, fee, customOverpay, r, fixedStd);

    setCalcState({
      P, r, months, prepayFee: fee, stdPayment, origStdPayment: stdPayment,
      customOverpay, customRates, strategy, totalMonthly, defaultOverpay,
      baseInterest: base.totalInterest, baseMonths: base.count, baseBalances: base.balances,
      rows,
    });
  }, [inputs]);

  const onOverpayChange = useCallback((idx: number, value: string) => {
    setCalcState((prev) => {
      if (!prev) return prev;
      const newOverpay = [...prev.customOverpay];
      newOverpay[idx] = Math.max(0, parseFloat(value) || 0);

      if (prev.strategy === 'fixed_total') {
        let balance = prev.P;
        for (let i = 0; i <= idx && balance > 0.005; i++) {
          const r = prev.customRates[i] ?? prev.r;
          const remaining = prev.months - i;
          const interest = balance * r;
          const currentStd = calcStdPayment(balance, r, remaining);
          const regularCap = Math.max(0, Math.min(currentStd - interest, balance));
          const overpay = Math.max(0, Math.min(newOverpay[i] ?? 0, balance - regularCap));
          balance = Math.max(0, balance - regularCap - overpay);
        }
        const natural = naturalOverpaysFromBalance(balance, idx + 1, prev.customRates, prev.months, prev.totalMonthly, prev.r);
        for (let i = idx + 1; i < prev.months; i++) {
          newOverpay[i] = natural[i - (idx + 1)] ?? 0;
        }
      }

      const fixedStd = prev.strategy === 'shorten_period' ? prev.origStdPayment : null;
      const rows = buildSchedule(prev.P, prev.customRates, prev.months, prev.prepayFee, newOverpay, prev.r, fixedStd);
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
      if (prev.strategy === 'fixed_total') {
        newOverpay = naturalOverpaysFromBalance(prev.P, 0, newRates, prev.months, prev.totalMonthly, prev.r);
      }

      const base = buildBaseSchedule(prev.P, newRates, prev.months, prev.r);
      const fixedStd = prev.strategy === 'shorten_period' ? prev.origStdPayment : null;
      const rows = buildSchedule(prev.P, newRates, prev.months, prev.prepayFee, newOverpay, prev.r, fixedStd);

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
      if (prev.strategy === 'fixed_total') {
        newOverpay = naturalOverpaysFromBalance(prev.P, 0, prev.customRates, prev.months, prev.totalMonthly, prev.r);
      } else if (prev.strategy === 'custom') {
        newOverpay = Array<number>(prev.months).fill(0);
      } else {
        newOverpay = Array<number>(prev.months).fill(prev.defaultOverpay);
      }
      const fixedStd = prev.strategy === 'shorten_period' ? prev.origStdPayment : null;
      const rows = buildSchedule(prev.P, prev.customRates, prev.months, prev.prepayFee, newOverpay, prev.r, fixedStd);
      return { ...prev, customOverpay: newOverpay, rows };
    });
  }, []);

  const clearOverpays = useCallback(() => {
    setCalcState((prev) => {
      if (!prev) return prev;
      const newOverpay = Array<number>(prev.months).fill(0);
      const fixedStd = prev.strategy === 'shorten_period' ? prev.origStdPayment : null;
      const rows = buildSchedule(prev.P, prev.customRates, prev.months, prev.prepayFee, newOverpay, prev.r, fixedStd);
      return { ...prev, customOverpay: newOverpay, rows };
    });
  }, []);

  const resetRates = useCallback(() => {
    setCalcState((prev) => {
      if (!prev) return prev;
      const newRates = Array<number>(prev.months).fill(prev.r);
      let newOverpay = [...prev.customOverpay];
      if (prev.strategy === 'fixed_total') {
        newOverpay = naturalOverpaysFromBalance(prev.P, 0, newRates, prev.months, prev.totalMonthly, prev.r);
      }
      const base = buildBaseSchedule(prev.P, newRates, prev.months, prev.r);
      const fixedStd = prev.strategy === 'shorten_period' ? prev.origStdPayment : null;
      const rows = buildSchedule(prev.P, newRates, prev.months, prev.prepayFee, newOverpay, prev.r, fixedStd);
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
    calculate,
    onOverpayChange,
    onRateChange,
    resetOverpays,
    clearOverpays,
    resetRates,
  };
}
