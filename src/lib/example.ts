import { calcStdPayment, buildSchedule, naturalOverpaysFromBalance } from './mortgage';
import type { ScheduleRow } from './mortgage';

export const EX = { P: 300000, annualRate: 0.06, months: 360 } as const;

export interface ExampleData {
  std: number;
  totalMonthly: number;
  baseRows: ScheduleRow[];
  withRows: ScheduleRow[];
  baseInterest: number;
  withInterest: number;
  withMonths: number;
  savedInterest: number;
}

function computeExample(): ExampleData {
  const { P, annualRate, months } = EX;
  const r = annualRate / 12;
  const std = calcStdPayment(P, r, months);
  const totalMonthly = Math.ceil(std) + 500;
  const rates = Array<number>(months).fill(r);
  const overpays = naturalOverpaysFromBalance(P, 0, rates, months, totalMonthly, r);
  const baseRows = buildSchedule(P, rates, months, 0, Array<number>(months).fill(0), r);
  const withRows = buildSchedule(P, rates, months, 0, overpays, r);
  const baseInterest = baseRows.length ? baseRows[baseRows.length - 1]!.cumInterest : 0;
  const withInterest = withRows.length ? withRows[withRows.length - 1]!.cumInterest : 0;
  const withMonths = withRows.length;
  const savedInterest = Math.round(baseInterest - withInterest);
  return { std, totalMonthly, baseRows, withRows, baseInterest, withInterest, withMonths, savedInterest };
}

export const EXAMPLE_DATA: ExampleData = computeExample();
