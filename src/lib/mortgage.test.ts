import { describe, it, expect } from 'vitest';
import {
  calcStdPayment,
  buildSchedule,
  buildBaseSchedule,
  buildRefinanceSchedule,
  naturalOverpaysFromBalance,
  balanceAt,
  solveOverpayForTarget,
  simulatePaymentHoliday,
} from './mortgage';

const round2 = (n: number) => Math.round(n * 100) / 100;

describe('calcStdPayment', () => {
  it('returns P/n when rate is 0', () => {
    expect(calcStdPayment(120000, 0, 120)).toBeCloseTo(1000, 2);
  });

  it('computes correct payment for typical mortgage', () => {
    // P=300000, 6% annual → 0.5%/month, 360 months
    // Known: ≈ 1798.65
    const std = calcStdPayment(300000, 0.005, 360);
    expect(std).toBeCloseTo(1798.65, 0);
  });

  it('total paid equals roughly P + interest (positive check)', () => {
    const P = 200000, r = 0.065 / 12, n = 240;
    const std = calcStdPayment(P, r, n);
    const totalPaid = std * n;
    expect(totalPaid).toBeGreaterThan(P); // more than principal
    expect(totalPaid).toBeLessThan(P * 2); // sanity cap
  });

  it('higher rate → higher payment', () => {
    const low = calcStdPayment(500000, 0.03 / 12, 360);
    const high = calcStdPayment(500000, 0.09 / 12, 360);
    expect(high).toBeGreaterThan(low);
  });
});

describe('buildBaseSchedule', () => {
  it('produces exactly `months` rows when loan goes full term', () => {
    const r = 0.075 / 12;
    const result = buildBaseSchedule(500000, Array(360).fill(r), 360, r);
    expect(result.count).toBe(360);
  });

  it('final balance is ≤ 0.005 (fully paid)', () => {
    const r = 0.065 / 12;
    const result = buildBaseSchedule(300000, Array(300).fill(r), 300, r);
    const lastBalance = result.balances[result.balances.length - 1];
    expect(lastBalance).toBeLessThanOrEqual(0.005);
  });

  it('balances are monotonically decreasing (no negative cap bug)', () => {
    const r = 0.1 / 12; // high rate stress test
    const result = buildBaseSchedule(400000, Array(360).fill(r), 360, r);
    for (let i = 1; i < result.balances.length; i++) {
      expect(result.balances[i]).toBeLessThanOrEqual(result.balances[i - 1] + 0.01);
    }
  });

  it('totalInterest is positive and less than the principal for reasonable rates', () => {
    const r = 0.05 / 12;
    const result = buildBaseSchedule(200000, Array(240).fill(r), 240, r);
    expect(result.totalInterest).toBeGreaterThan(0);
    expect(result.totalInterest).toBeLessThan(200000);
  });

  it('higher rate → more total interest', () => {
    const low = buildBaseSchedule(300000, Array(360).fill(0.04 / 12), 360, 0.04 / 12);
    const high = buildBaseSchedule(300000, Array(360).fill(0.08 / 12), 360, 0.08 / 12);
    expect(high.totalInterest).toBeGreaterThan(low.totalInterest);
  });
});

describe('buildSchedule', () => {
  it('zero overpay: rows.length equals months (full term)', () => {
    const r = 0.065 / 12;
    const rows = buildSchedule(300000, Array(360).fill(r), 360, 0, Array(360).fill(0), r);
    expect(rows.length).toBe(360);
  });

  it('positive overpay shortens the loan', () => {
    const r = 0.075 / 12, P = 500000, n = 360;
    const noOverpay = buildSchedule(P, Array(n).fill(r), n, 0, Array(n).fill(0), r);
    const withOverpay = buildSchedule(P, Array(n).fill(r), n, 0, Array(n).fill(2000), r);
    expect(withOverpay.length).toBeLessThan(noOverpay.length);
  });

  it('overpay saves interest vs no overpay', () => {
    const r = 0.065 / 12, P = 400000, n = 300;
    const noOv = buildSchedule(P, Array(n).fill(r), n, 0, Array(n).fill(0), r);
    const withOv = buildSchedule(P, Array(n).fill(r), n, 0, Array(n).fill(1000), r);
    const interestNo = noOv[noOv.length - 1]!.cumInterest;
    const interestWith = withOv[withOv.length - 1]!.cumInterest;
    expect(interestWith).toBeLessThan(interestNo);
  });

  it('prepayFee is charged on overpay only, not on regular capital', () => {
    const r = 0.065 / 12, P = 200000, n = 240, fee = 0.02;
    const rows = buildSchedule(P, Array(n).fill(r), n, fee, Array(n).fill(500), r);
    rows.forEach((row) => {
      expect(round2(row.fee)).toBeCloseTo(round2(row.overpay * fee), 2);
    });
  });

  it('balanceAfter is always ≥ 0', () => {
    const r = 0.07 / 12, P = 600000, n = 360;
    const rows = buildSchedule(P, Array(n).fill(r), n, 0, Array(n).fill(3000), r);
    rows.forEach((row) => {
      expect(row.balanceAfter).toBeGreaterThanOrEqual(0);
    });
  });

  it('shorten_period (fixedStdPayment): shorter term than free recalc at same overpay', () => {
    const r = 0.065 / 12, P = 500000, n = 360;
    const std = calcStdPayment(P, r, n);
    const overpays = Array(n).fill(1000);
    const shortened = buildSchedule(P, Array(n).fill(r), n, 0, overpays, r, std);
    const free = buildSchedule(P, Array(n).fill(r), n, 0, overpays, r, null);
    // shorten_period keeps original std → more aggressive repayment → same or shorter
    expect(shortened.length).toBeLessThanOrEqual(free.length);
  });

  it('reduce_payment via naturalOverpays: savings ≈ 225 000 for 500k/6.5%/30yr/+500', () => {
    const P = 500000, r = 0.065 / 12, n = 360;
    const std = calcStdPayment(P, r, n);
    const totalMonthly = std + 500;
    const overpays = naturalOverpaysFromBalance(P, 0, Array(n).fill(r), n, totalMonthly, r);
    const base = buildSchedule(P, Array(n).fill(r), n, 0, Array(n).fill(0), r);
    const result = buildSchedule(P, Array(n).fill(r), n, 0, overpays, r);
    const baseInt = base[base.length - 1]!.cumInterest;
    const withInt = result[result.length - 1]!.cumInterest;
    const saved = baseInt - withInt;
    // Should be around 225 000 (±5 000 tolerance)
    expect(saved).toBeGreaterThan(220000);
    expect(saved).toBeLessThan(230000);
  });

  it('reduce_payment shortens loan by ~110 months for 500k/6.5%/30yr/+500', () => {
    const P = 500000, r = 0.065 / 12, n = 360;
    const std = calcStdPayment(P, r, n);
    const totalMonthly = std + 500;
    const overpays = naturalOverpaysFromBalance(P, 0, Array(n).fill(r), n, totalMonthly, r);
    const base = buildSchedule(P, Array(n).fill(r), n, 0, Array(n).fill(0), r);
    const result = buildSchedule(P, Array(n).fill(r), n, 0, overpays, r);
    const shorter = base.length - result.length;
    expect(shorter).toBeGreaterThan(100);
    expect(shorter).toBeLessThan(120);
  });
});

describe('balanceAt', () => {
  it('with no overpay matches buildSchedule balanceAfter at same index', () => {
    const r = 0.065 / 12, P = 300000, n = 300;
    const rows = buildSchedule(P, Array(n).fill(r), n, 0, Array(n).fill(0), r);
    [0, 10, 50, 100, 200].forEach((idx) => {
      const fromSchedule = rows[idx]?.balanceAfter ?? 0;
      const fromBalanceAt = balanceAt(P, Array(n).fill(r), n, Array(n).fill(0), idx, r);
      expect(fromBalanceAt).toBeCloseTo(fromSchedule, 1);
    });
  });

  it('with overpay: balanceAt is lower than without', () => {
    const r = 0.065 / 12, P = 400000, n = 360;
    const noOv = balanceAt(P, Array(n).fill(r), n, Array(n).fill(0), 120, r);
    const withOv = balanceAt(P, Array(n).fill(r), n, Array(n).fill(1000), 120, r);
    expect(withOv).toBeLessThan(noOv);
  });
});

describe('naturalOverpaysFromBalance', () => {
  it('total monthly payment ≈ totalMonthly in each month', () => {
    const r = 0.065 / 12, P = 500000, n = 360;
    const totalMonthly = 7000;
    const overpays = naturalOverpaysFromBalance(P, 0, Array(n).fill(r), n, totalMonthly, r);
    // Simulate to check first few months
    let bal = P;
    for (let i = 0; i < Math.min(20, n) && bal > 0.005; i++) {
      const rem = n - i;
      const interest = bal * r;
      const std = calcStdPayment(bal, r, rem);
      const rc = Math.max(0, Math.min(std - interest, bal));
      const ov = Math.max(0, Math.min(overpays[i] ?? 0, bal - rc));
      const total = interest + rc + ov;
      // Total payment should be ≤ totalMonthly (or equal once loan is small enough)
      expect(total).toBeLessThanOrEqual(totalMonthly + 0.01);
      bal = Math.max(0, bal - rc - ov);
    }
  });

  it('slider below stdPayment produces zero overpay (no negative overpay)', () => {
    const r = 0.075 / 12, P = 800000, n = 360;
    const std = calcStdPayment(P, r, n);
    // totalMonthly < std → overpay should be 0 (clamped by max(0,...))
    const overpays = naturalOverpaysFromBalance(P, 0, Array(n).fill(r), n, std - 100, r);
    overpays.slice(0, 12).forEach((ov) => {
      expect(ov).toBeGreaterThanOrEqual(0);
    });
  });

  it('returns array of length months', () => {
    const r = 0.065 / 12, P = 300000, n = 240;
    const overpays = naturalOverpaysFromBalance(P, 0, Array(n).fill(r), n, 5000, r);
    expect(overpays.length).toBe(n);
  });

  it('regression: never returns an overpay larger than the balance actually left to pay off — near payoff it used to hand back a raw (totalMonthly - currentStd) far above the remaining balance (e.g. 6972 zł owed against a 3936 zł balance), which buildSchedule silently clamped but the "Nadpłata (edytuj)" field in Schedule.tsx displayed unclamped', () => {
    const r = 0.065 / 12, P = 500000, n = 360, totalMonthly = 7000;
    const overpays = naturalOverpaysFromBalance(P, 0, Array(n).fill(r), n, totalMonthly, r);
    let bal = P;
    for (let i = 0; i < n && bal > 0.005; i++) {
      const rem = n - i;
      const interest = bal * r;
      const std = calcStdPayment(bal, r, rem);
      const rc = Math.max(0, Math.min(std - interest, bal));
      const ov = overpays[i] ?? 0;
      expect(ov).toBeLessThanOrEqual(bal - rc + 1e-6);
      bal = Math.max(0, bal - rc - ov);
    }
  });
});

describe('slider minimum constraint', () => {
  it('totalMonthlySlider < stdPayment → overpay is 0 for all months', () => {
    const P = 800000, r = 0.065 / 12, n = 360;
    const std = calcStdPayment(P, r, n);
    const tooLow = Math.floor(std) - 1;
    const overpays = naturalOverpaysFromBalance(P, 0, Array(n).fill(r), n, tooLow, r);
    // All overpays should be 0 (can't overpay when total < std)
    const nonZero = overpays.filter((v) => v > 0);
    expect(nonZero.length).toBe(0);
  });

  it('totalMonthlySlider === stdPayment → overpay is 0 for first month', () => {
    const P = 500000, r = 0.065 / 12, n = 360;
    const std = calcStdPayment(P, r, n);
    const overpays = naturalOverpaysFromBalance(P, 0, Array(n).fill(r), n, std, r);
    expect(overpays[0]).toBeCloseTo(0, 1);
  });

  it('totalMonthlySlider > stdPayment → first month overpay is positive', () => {
    const P = 500000, r = 0.065 / 12, n = 360;
    const std = calcStdPayment(P, r, n);
    const overpays = naturalOverpaysFromBalance(P, 0, Array(n).fill(r), n, std + 500, r);
    expect(overpays[0]).toBeGreaterThan(0);
  });
});

describe('solveOverpayForTarget', () => {
  const P = 300000, r = 0.06 / 12, n = 360;
  const rates = Array<number>(n).fill(r);
  const std = calcStdPayment(P, r, n);

  it('returns 0 when the target is not shorter than the natural term', () => {
    expect(solveOverpayForTarget(P, rates, n, 0, r, n, std)).toBe(0);
    expect(solveOverpayForTarget(P, rates, n, 0, r, n + 60, std)).toBe(0);
  });

  it('found overpayment actually hits the target', () => {
    for (const target of [300, 240, 180, 120, 60]) {
      const overpay = solveOverpayForTarget(P, rates, n, 0, r, target, std);
      const rows = buildSchedule(P, rates, n, 0, Array<number>(n).fill(overpay), r, std);
      expect(rows.length).toBeLessThanOrEqual(target);
    }
  });

  it('is minimal — one grosz less misses the target', () => {
    const target = 180;
    const overpay = solveOverpayForTarget(P, rates, n, 0, r, target, std);
    const justUnder = buildSchedule(P, rates, n, 0, Array<number>(n).fill(overpay - 1), r, std);
    expect(justUnder.length).toBeGreaterThan(target);
  });

  it('shorter target requires a bigger overpayment', () => {
    const a = solveOverpayForTarget(P, rates, n, 0, r, 240, std);
    const b = solveOverpayForTarget(P, rates, n, 0, r, 120, std);
    expect(b).toBeGreaterThan(a);
  });

  it('a one-month target requires roughly the whole principal', () => {
    const overpay = solveOverpayForTarget(P, rates, n, 0, r, 1, std);
    expect(overpay).toBeGreaterThan(P * 0.99);
  });

  it('handles a target of 0 without looping forever', () => {
    expect(solveOverpayForTarget(P, rates, n, 0, r, 0, std)).toBe(P);
  });
});

describe('buildRefinanceSchedule', () => {
  const P = 300000, months = 360;
  const oldR = 0.06 / 12;
  const oldRates = Array<number>(months).fill(oldR);

  it('refinancing at month 0 keeps the balance at the original principal', () => {
    const result = buildRefinanceSchedule(P, oldRates, months, oldR, 0, 5, 300, 2, 0);
    expect(result.refiBalance).toBe(P);
    expect(result.phase1Interest).toBe(0);
    expect(result.originationFeeAmount).toBeCloseTo(P * 0.02, 2);
  });

  it('computes the origination fee off the balance at the refi month, not the original principal', () => {
    const refiMonth = 60;
    const result = buildRefinanceSchedule(P, oldRates, months, oldR, refiMonth, 5, 300, 2, 0);
    const expectedBalance = balanceAt(P, oldRates, months, Array<number>(months).fill(0), refiMonth - 1, oldR);
    expect(result.refiBalance).toBeCloseTo(expectedBalance, 1);
    expect(result.originationFeeAmount).toBeCloseTo(result.refiBalance * 0.02, 2);
    expect(result.originationFeeAmount).not.toBeCloseTo(P * 0.02, 2);
  });

  it('passes the flat fee straight through unchanged', () => {
    const result = buildRefinanceSchedule(P, oldRates, months, oldR, 24, 5, 300, 0, 1500);
    expect(result.flatFeeAmount).toBe(1500);
  });

  it('produces phase1 + phase2 rows with a continuous, non-increasing balance', () => {
    const refiMonth = 36;
    const result = buildRefinanceSchedule(P, oldRates, months, oldR, refiMonth, 5, 300, 2, 0);

    expect(result.rows.length).toBe(refiMonth + 300);
    result.rows.slice(0, refiMonth).forEach((row) => expect(row.isRefiRow).toBeUndefined());
    result.rows.slice(refiMonth).forEach((row) => expect(row.isRefiRow).toBe(true));

    expect(result.rows[refiMonth - 1].balanceAfter).toBeCloseTo(result.refiBalance, 1);
    expect(result.rows[refiMonth].balanceBefore).toBeCloseTo(result.refiBalance, 1);

    for (let i = 1; i < result.rows.length; i++) {
      expect(result.rows[i].balanceAfter).toBeLessThanOrEqual(result.rows[i - 1].balanceAfter + 0.01);
    }
  });

  it('accumulates cumInterest continuously across the refinance boundary', () => {
    const result = buildRefinanceSchedule(P, oldRates, months, oldR, 36, 5, 300, 0, 0);
    const lastRow = result.rows[result.rows.length - 1];
    expect(lastRow.cumInterest).toBeCloseTo(result.phase1Interest + result.phase2Interest, 1);
  });

  it('a lower new rate pays off the refinanced balance within the new term', () => {
    const result = buildRefinanceSchedule(P, oldRates, months, oldR, 60, 4, 300, 0, 0);
    const lastRow = result.rows[result.rows.length - 1];
    expect(lastRow.balanceAfter).toBeCloseTo(0, 1);
  });
});

describe('simulatePaymentHoliday', () => {
  const P = 300000, months = 360, r = 0.06 / 12;

  it('capitalizes interest during the holiday — balance grows, it does not stay flat', () => {
    const result = simulatePaymentHoliday(P, r, months, 6);
    expect(result.balanceAfterHoliday).toBeGreaterThan(P);
    expect(result.balanceAfterHoliday).toBeCloseTo(P * Math.pow(1 + r, 6), 6);
  });

  it('extends the term instead of raising the payment, and adds real interest cost', () => {
    const result = simulatePaymentHoliday(P, r, months, 6);
    expect(result.extraMonths).toBeGreaterThan(0);
    expect(result.extraInterest).toBeGreaterThan(0);
  });

  it('a longer holiday costs more than a shorter one', () => {
    const short = simulatePaymentHoliday(P, r, months, 3);
    const long = simulatePaymentHoliday(P, r, months, 6);
    expect(long.extraMonths).toBeGreaterThan(short.extraMonths);
    expect(long.extraInterest).toBeGreaterThan(short.extraInterest);
  });

  it('with 0 holiday months, nothing changes', () => {
    const result = simulatePaymentHoliday(P, r, months, 0);
    expect(result.balanceAfterHoliday).toBeCloseTo(P, 6);
    expect(result.extraMonths).toBe(0);
    expect(result.extraInterest).toBeCloseTo(0, 2);
  });
});
