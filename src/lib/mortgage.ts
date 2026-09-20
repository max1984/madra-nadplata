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
  isRefiRow?: boolean;
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
  fixedStdPayment: number | null = null,
  perRowFixed?: (number | null)[]
): ScheduleRow[] {
  let balance = P;
  const rows: ScheduleRow[] = [];
  let cumInterest = 0;
  const n = customOverpay.length;

  for (let i = 0; i < n && balance > 0.005; i++) {
    const r = customRates[i] ?? globalR;
    const remaining = origMonths - i;
    const interest = balance * r;
    const rowFixedStd = perRowFixed ? (perRowFixed[i] ?? fixedStdPayment) : fixedStdPayment;
    const currentStd =
      rowFixedStd !== null
        ? Math.max(rowFixedStd, interest)
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

/**
 * Suma faktycznie zaaplikowanej nadpłaty na podstawie rows (co się realnie
 * wydarzyło w harmonogramie), a nie surowego wejścia strategii
 * (customOverpay) — przy strategiach ze stałą kwotą ostatnia rata przed
 * spłatą kredytu przycina nadpłatę do pozostałego salda, więc sumowanie
 * wejściowego customOverpay zawyżało każdą zbiorczą statystykę nadpłaty
 * w UI (nagłówek harmonogramu, średnia nadpłata, symulacja inwestycji).
 */
export function totalAppliedOverpay(rows: ScheduleRow[]): number {
  return rows.reduce((acc, r) => acc + r.overpay, 0);
}

/**
 * Numer raty (1-indeksowany), w której saldo kredytu po raz pierwszy spada
 * do połowy (lub mniej) kwoty początkowej P — psychologicznie ważny kamień
 * milowy dla kredytobiorcy, niezależny od tego, ile z tego to odsetki
 * a ile kapitał. Zwraca null, gdy rows jest puste lub P <= 0.
 */
export function halfPrincipalMonth(rows: ScheduleRow[], P: number): number | null {
  if (P <= 0) return null;
  const half = P / 2;
  const idx = rows.findIndex((r) => r.balanceAfter <= half);
  return idx === -1 ? null : idx + 1;
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

/**
 * Miesiąc, w którym skumulowana oszczędność odsetkowa z refinansowania
 * przewyższa koszt jego opłat — albo null, jeśli nigdy do tego nie dochodzi
 * w obrębie rows.
 *
 * baseCumInterestByMonth (z buildBaseSchedule, bez nadpłat) ma naturalną
 * długość oryginalnego kredytu i po jej przekroczeniu NIE rośnie dalej —
 * kredyt bazowy byłby już spłacony, więc dalsze miesiące nie generują
 * kolejnych odsetek do porównania. Fallback do baseInterest musi więc
 * dotyczyć OBU końców przedziału (basePrev i baseCurr), nie tylko baseCurr:
 * przy refinansowaniu na nowy okres dłuższy niż to, co pozostało z
 * oryginalnego kredytu, fallback tylko dla baseCurr (a 0 dla basePrev)
 * dawał jednorazowy, fikcyjny skok "oszczędności" o całą resztę
 * baseInterest i fałszywie wczesny break-even.
 */
export function refiBreakEvenMonth(
  baseCumInterestByMonth: number[],
  baseInterest: number,
  rows: ScheduleRow[],
  refiMonth: number,
  totalFees: number,
): number | null {
  if (totalFees <= 0) return null;
  let cumulSavings = 0;
  for (let i = refiMonth; i < rows.length; i++) {
    const basePrev = i > 0 ? (baseCumInterestByMonth[i - 1] ?? baseInterest) : 0;
    const baseCurr = baseCumInterestByMonth[i] ?? baseInterest;
    const baseMonthInt = baseCurr - basePrev;
    cumulSavings += baseMonthInt - (rows[i]?.interest ?? 0);
    if (cumulSavings >= totalFees) return i + 1;
  }
  return null;
}

export interface RefiResult {
  rows: ScheduleRow[];
  refiBalance: number;
  originationFeeAmount: number;
  flatFeeAmount: number;
  phase1Interest: number;
  phase2Interest: number;
}

export function buildRefinanceSchedule(
  P: number,
  originalRates: number[],
  originalMonths: number,
  globalR: number,
  refiMonth: number,
  newAnnualRate: number,
  newMonths: number,
  originationFeePct: number,
  flatFee: number,
): RefiResult {
  let balance = P;
  let cumInterest = 0;
  const rows: ScheduleRow[] = [];

  for (let i = 0; i < refiMonth && balance > 0.005; i++) {
    const r = originalRates[i] ?? globalR;
    const remaining = originalMonths - i;
    const interest = balance * r;
    const std = calcStdPayment(balance, r, remaining);
    const regularCap = Math.max(0, Math.min(std - interest, balance));
    const balanceBefore = balance;
    balance = Math.max(0, balance - regularCap);
    cumInterest += interest;
    rows.push({
      num: rows.length + 1, balanceBefore,
      totalPayment: interest + regularCap,
      capital: regularCap, regularCap, interest,
      overpay: 0, fee: 0,
      balanceAfter: balance, cumInterest,
      annualRate: r * 12,
    });
  }

  const refiBalance = balance;
  const phase1Interest = cumInterest;
  const originationFeeAmount = refiBalance * originationFeePct / 100;

  const newR = newAnnualRate / 100 / 12;
  balance = refiBalance;
  let phase2Interest = 0;

  for (let i = 0; i < newMonths && balance > 0.005; i++) {
    const remaining = newMonths - i;
    const interest = balance * newR;
    const std = calcStdPayment(balance, newR, remaining);
    const regularCap = Math.max(0, Math.min(std - interest, balance));
    const balanceBefore = balance;
    balance = Math.max(0, balance - regularCap);
    phase2Interest += interest;
    cumInterest += interest;
    rows.push({
      num: rows.length + 1, balanceBefore,
      totalPayment: interest + regularCap,
      capital: regularCap, regularCap, interest,
      overpay: 0, fee: 0,
      balanceAfter: balance, cumInterest,
      annualRate: newR * 12,
      isRefiRow: true,
    });
  }

  return { rows, refiBalance, originationFeeAmount, flatFeeAmount: flatFee, phase1Interest, phase2Interest };
}

/**
 * Odwraca pytanie kalkulatora: zamiast „ile zaoszczędzę przy nadpłacie X",
 * odpowiada na „ile muszę nadpłacać, żeby skończyć w N miesięcy".
 *
 * Szuka najmniejszej stałej nadpłaty miesięcznej, przy której kredyt zostaje
 * spłacony najpóźniej w `targetMonths`. Rata regularna pozostaje na poziomie
 * pierwotnym (wariant „skrócenie okresu") — to jedyny wariant, w którym cel
 * czasowy ma sens, bo przy obniżaniu raty okres się nie zmienia.
 *
 * Zwraca `0`, gdy cel jest osiągalny bez nadpłacania (termin już go spełnia).
 */
export function solveOverpayForTarget(
  P: number,
  customRates: number[],
  origMonths: number,
  prepayFee: number,
  globalR: number,
  targetMonths: number,
  fixedStdPayment: number,
): number {
  const payoffMonths = (overpay: number): number =>
    buildSchedule(
      P, customRates, origMonths, prepayFee,
      Array<number>(origMonths).fill(overpay),
      globalR, fixedStdPayment,
    ).length;

  if (targetMonths <= 0) return P;
  if (payoffMonths(0) <= targetMonths) return 0;

  // Czas spłaty maleje monotonicznie wraz z nadpłatą, więc wystarczy bisekcja.
  // Górna granica: nadpłata równa całemu kapitałowi zamyka kredyt w 1. racie.
  let lo = 0;
  let hi = P;
  for (let i = 0; i < 60 && hi - lo > 0.01; i++) {
    const mid = (lo + hi) / 2;
    if (payoffMonths(mid) <= targetMonths) hi = mid;
    else lo = mid;
  }
  return Math.ceil(hi * 100) / 100;
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
    // Bez górnego ograniczenia do (b - regularCap) ostatnia rata przed spłatą
    // kredytu zwracała nadpłatę wielokrotnie większą niż realnie pozostałe
    // saldo (np. 6972 zł przy saldzie 3936 zł) — buildSchedule i tak przycinał
    // ją przy faktycznym wyliczeniu raty, ale to właśnie ta niewycięta wartość
    // trafiała do pola "Nadpłata (edytuj)" w harmonogramie.
    const overpay = Math.max(0, Math.min(totalMonthly - currentStd, b - regularCap));
    result.push(overpay);
    b = Math.max(0, b - regularCap - overpay);
  }

  const needed = months - startIdx;
  while (result.length < needed) result.push(0);
  return result;
}

export interface PaymentHolidayResult {
  /** Saldo po skapitalizowaniu odsetek z pominiętych rat. */
  balanceAfterHoliday: number;
  /** O ile miesięcy wydłuża się spłata przy powrocie do tej samej raty co przed wakacjami. */
  extraMonths: number;
  /** O ile wzrastają łączne odsetki w całym okresie kredytu względem braku wakacji. */
  extraInterest: number;
}

/**
 * Symuluje "wakacje kredytowe": przez `holidayMonths` rat nic się nie płaci,
 * a odsetki dopisują się do salda (kapitalizują) zamiast być spłacane na
 * bieżąco. Po wakacjach spłata wraca do dokładnie tej samej raty co wcześniej
 * — stąd wydłużenie okresu zamiast wzrostu raty. To uproszczony, jawnie
 * opisany model; dokładne zasady zależą od banku/programu.
 */
export function simulatePaymentHoliday(
  P: number, globalR: number, months: number, holidayMonths: number
): PaymentHolidayResult {
  const stdPayment = calcStdPayment(P, globalR, months);
  const baseline = buildBaseSchedule(P, Array<number>(months).fill(globalR), months, globalR);

  const balanceAfterHoliday = P * Math.pow(1 + globalR, holidayMonths);
  const bufferMonths = months + holidayMonths + 240; // spory zapas, żeby spłata na pewno domknęła się do zera
  const payoff = buildSchedule(
    balanceAfterHoliday, Array<number>(bufferMonths).fill(globalR), bufferMonths, 0,
    Array<number>(bufferMonths).fill(0), globalR, stdPayment,
  );
  const payoffInterest = payoff.length ? payoff[payoff.length - 1]!.cumInterest : 0;
  const totalInterestWithHoliday = (balanceAfterHoliday - P) + payoffInterest;

  return {
    balanceAfterHoliday,
    extraMonths: (holidayMonths + payoff.length) - months,
    extraInterest: totalInterestWithHoliday - baseline.totalInterest,
  };
}
