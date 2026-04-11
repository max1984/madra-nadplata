export interface ScheduleRow {
  num: number;
  balanceBefore: number;
  totalPayment: number;
  capital: number;
  regularCap: number;
  interest: number;
  overpay: number;
  fee: number;
  balanceAfter: number;
  cumInterest: number;
  annualRate: number;
}

export interface BaseScheduleResult {
  balances: number[];
  totalInterest: number;
  count: number;
  cumInterestByMonth: number[];
}

export function calcStdPayment(P: number, r: number, n: number): number {
  if (r === 0) return P / n;
  return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function buildSchedule(
  P: number,
  customRates: number[],
  origMonths: number,
  prepayFee: number,
  customOverpay: number[],
  globalR: number,
  fixedStdPayment: number | null = null
): ScheduleRow[] {
  let balance = P;
  const rows: ScheduleRow[] = [];
  let cumInterest = 0;
  const n = customOverpay.length;

  for (let i = 0; i < n && balance > 0.005; i++) {
    const r = customRates[i] ?? globalR;
    const remaining = origMonths - i;
    const interest = balance * r;
    const currentStd =
      fixedStdPayment !== null
        ? Math.max(fixedStdPayment, interest)
        : calcStdPayment(balance, r, remaining);
    const regularCap = Math.max(0, Math.min(currentStd - interest, balance));
    const overpay = Math.max(0, Math.min(customOverpay[i] ?? 0, balance - regularCap));
    const totalCap = regularCap + overpay;
    const fee = overpay * prepayFee;
    const totalPayment = interest + totalCap + fee;
    const balanceBefore = balance;
    balance = Math.max(0, balance - totalCap);
    cumInterest += interest;

    rows.push({
      num: i + 1,
      balanceBefore,
      totalPayment,
      capital: totalCap,
      regularCap,
      interest,
      overpay,
      fee,
      balanceAfter: balance,
      cumInterest,
      annualRate: r * 12,
    });
  }
  return rows;
}

export function buildBaseSchedule(
  P: number,
  customRates: number[],
  months: number,
  globalR: number
): BaseScheduleResult {
  let balance = P;
  let cumInterest = 0;
  const balances: number[] = [];
  const cumInterestByMonth: number[] = [];

  for (let i = 0; i < months && balance > 0.005; i++) {
    const r = customRates[i] ?? globalR;
    const remaining = months - i;
    const interest = balance * r;
    const std = calcStdPayment(balance, r, remaining);
    const cap = Math.max(0, Math.min(std - interest, balance));
    balance = Math.max(0, balance - cap);
    cumInterest += interest;
    balances.push(balance);
    cumInterestByMonth.push(cumInterest);
  }

  return { balances, totalInterest: cumInterest, count: balances.length, cumInterestByMonth };
}

// Returns the remaining balance after applying overpays up to and including upToIdx.
export function balanceAt(
  P: number,
  customRates: number[],
  origMonths: number,
  customOverpay: number[],
  upToIdx: number,
  globalR: number
): number {
  let balance = P;
  for (let i = 0; i <= upToIdx && balance > 0.005; i++) {
    const r = customRates[i] ?? globalR;
    const remaining = origMonths - i;
    const interest = balance * r;
    const std = calcStdPayment(balance, r, remaining);
    const regularCap = Math.max(0, Math.min(std - interest, balance));
    const overpay = Math.max(0, Math.min(customOverpay[i] ?? 0, balance - regularCap));
    balance = Math.max(0, balance - regularCap - overpay);
  }
  return balance;
}

export function naturalOverpaysFromBalance(
  startBalance: number,
  startIdx: number,
  customRates: number[],
  months: number,
  totalMonthly: number,
  globalR: number
): number[] {
  let b = startBalance;
  const result: number[] = [];

  for (let i = startIdx; i < months && b > 0.005; i++) {
    const r = customRates[i] ?? globalR;
    const remaining = months - i;
    const interest = b * r;
    const currentStd = calcStdPayment(b, r, remaining);
    const regularCap = Math.max(0, Math.min(currentStd - interest, b));
    const overpay = Math.max(0, totalMonthly - currentStd);
    result.push(overpay);
    b = Math.max(0, b - regularCap - overpay);
  }

  const needed = months - startIdx;
  while (result.length < needed) result.push(0);
  return result;
}
