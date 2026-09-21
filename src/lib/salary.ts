/**
 * Kalkulator wynagrodzeń brutto-netto — 4 typy umów (umowa o pracę, zlecenie,
 * dzieło, B2B) + roczne rozliczenie ze zmiennym wynagrodzeniem miesięcznym.
 *
 * Stawki i limity 2026 poniżej — zweryfikowane WebSearch 2026-09-21 (patrz
 * docs/WERYFIKACJA-STALYCH-2026.md dla źródeł per stała): rozporządzenie RM
 * z 11.09.2025 (minimalne wynagrodzenie), obwieszczenie MRPiPS z 19.11.2025
 * (limit 30-krotności), zus.pl (progi ryczałtu zdrowotnego, ZUS pełny/
 * preferencyjny przedsiębiorcy), GUS (przeciętne wynagrodzenie), ustawa
 * o PIT (skala, kwota zmniejszająca, ulgi — bez zmian od Polskiego Ładu
 * 2022). WSZYSTKIE potwierdzone zgodne z kodem. WYMAGA ponownej weryfikacji
 * na początku każdego kolejnego roku podatkowego — kwoty (minimalne
 * wynagrodzenie, limity, stawki ryczałtu zdrowotnego) zmieniają się rocznie.
 *
 * Każda funkcja liczy JEDEN miesiąc. `computeAnnualSalarySchedule` woła te
 * same funkcje 12 razy, przekazując dalej narastający `AnnualContext` —
 * zamiast duplikować logikę progresji podatkowej/limitów w osobnej "rocznej"
 * wersji każdej funkcji.
 */

// --------------------------------------------------------------- stałe ---

export const TAX_SCALE_THRESHOLD = 120_000; // roczny próg 12%/32%
export const TAX_SCALE_RATE_LOW = 0.12;
export const TAX_SCALE_RATE_HIGH = 0.32;

export const YOUNG_RELIEF_LIMIT = 85_528; // roczny limit ulg specjalnych (młodzi/powrót/4+/emeryci pracujący)
export const ZUS_ANNUAL_BASE_LIMIT = 282_600; // 30-krotność, limit podstawy emerytalno-rentowej

export const MIN_WAGE_GROSS = 4806;
export const MIN_WAGE_HOURLY = 31.40;

export const EMPLOYEE_PENSION_RATE = 0.0976;
export const EMPLOYEE_DISABILITY_RATE = 0.015;
export const EMPLOYEE_SICKNESS_RATE = 0.0245;
export const HEALTH_INSURANCE_RATE_EMPLOYEE = 0.09;

export const EMPLOYER_PENSION_RATE = 0.0976;
export const EMPLOYER_DISABILITY_RATE = 0.065;
export const EMPLOYER_ACCIDENT_RATE = 0.0167; // referencyjna — zależy od PKD/liczby ubezpieczonych, tu uproszczona do jednej stawki
export const EMPLOYER_LABOR_FUND_RATE = 0.0245;
export const EMPLOYER_FGSP_RATE = 0.0010;

export const KUP_STANDARD = 250;
export const KUP_ELEVATED = 300; // dojazd z innej gminy

export const HEALTH_INSURANCE_RATE_SKALA = 0.09;
export const HEALTH_INSURANCE_RATE_LINIOWY = 0.049;
export const HEALTH_INSURANCE_MIN_SKALA_LINIOWY = 432.54;

export const RYCZALT_HEALTH_TIER_1 = 498.35; // przychód roku do 60 000 zł
export const RYCZALT_HEALTH_TIER_2 = 830.58; // 60 000–300 000 zł
export const RYCZALT_HEALTH_TIER_3 = 1495.04; // powyżej 300 000 zł
export const RYCZALT_TIER_1_LIMIT = 60_000;
export const RYCZALT_TIER_2_LIMIT = 300_000;

export const B2B_FULL_ZUS_SOCIAL_MANDATORY = 1788.29; // emerytalna+rentowa+wypadkowa+FP, bez chorobowej
export const B2B_FULL_ZUS_PENSION_BASE = 5652.20; // 60% prognozowanego przeciętnego wynagrodzenia — baza "pełnego" ZUS
export const B2B_PREFERENTIAL_ZUS_SOCIAL_MANDATORY = 456.18; // emerytalna+rentowa+wypadkowa, 24 mies.
export const B2B_PREFERENTIAL_ZUS_PENSION_BASE = 0.3 * MIN_WAGE_GROSS; // 1441.80
export const B2B_SICKNESS_VOLUNTARY_RATE = 0.0245;

// --------------------------------------------------------------- typy ---

export type SpecialRelief = 'none' | 'under26' | 'returning' | 'family4plus' | 'working_pensioner';
export type TaxReducingShare = 'full' | 'half' | 'third' | 'none';
export type KupOption = 'standard' | 'elevated';
export type MandateKupOption = 'standard' | 'copyright';

export type PpkOption =
  | { mode: 'none' }
  | { mode: 'standard' }
  | { mode: 'custom'; employeeRate: number; employerRate: number };

// Pełny zestaw stawek ryczałtu ewidencjonowanego 2026 (ustawa o zryczałtowanym
// podatku dochodowym, art. 12) — zweryfikowane WebSearch 2026-09-22 (wcześniej
// brakowało 2%/3%/5,5%/10%/12,5%, dropdown miał tylko 5 z 10 realnych stawek).
export type RyczaltRate = 0.02 | 0.03 | 0.055 | 0.085 | 0.10 | 0.12 | 0.125 | 0.14 | 0.15 | 0.17;
export type B2BTaxForm = 'skala' | 'liniowy' | 'ryczalt' | 'ipbox';
export type B2BZusVariant = 'ulga_na_start' | 'preferencyjny' | 'maly_zus_plus' | 'pelny';

/**
 * Narastający stan roku podatkowego, przekazywany między kolejnymi miesiącami
 * w `computeAnnualSalarySchedule`. Dla samodzielnego wyliczenia jednego
 * miesiąca (poza rozliczeniem rocznym) domyślny `EMPTY_ANNUAL_CONTEXT`
 * zakłada, że to pierwszy przychód w roku — tak samo jak robi to każdy
 * sprawdzony konkurentny kalkulator liczący "jeden miesiąc".
 */
export interface AnnualContext {
  priorTaxableIncome: number; // dochód po uldze specjalnej, narastająco — próg skali 120 000 zł
  priorReliefUsed: number; // przychód objęty ulgą specjalną, narastająco — limit 85 528 zł
  priorPensionBase: number; // podstawa emerytalno-rentowa, narastająco — limit 30-krotności 282 600 zł
  priorFlatRevenue: number; // przychód (B2B ryczałt), narastająco — progi zdrowotnej 60k/300k
  priorCopyrightCostsUsed: number; // 50% koszty autorskie (umowa o pracę), narastająco — roczny limit 60 000 zł
}

export const EMPTY_ANNUAL_CONTEXT: AnnualContext = {
  priorTaxableIncome: 0,
  priorReliefUsed: 0,
  priorPensionBase: 0,
  priorFlatRevenue: 0,
  priorCopyrightCostsUsed: 0,
};

// Roczny limit 50%-owych kosztów autorskich = II próg skali × 50% (art. 22
// ust. 9a ustawy o PIT) — nadwyżka ponad ten limit nie dostaje już żadnego
// KUP autorskiego (nie spada do 20%, spada do 0 — standardowy KUP 250/300 zł
// nalezy się niezależnie i osobno, patrz `calcEmploymentContract`).
export const ANNUAL_COPYRIGHT_KUP_LIMIT = TAX_SCALE_THRESHOLD * 0.5; // 60 000

export type SalaryContractType = 'employment' | 'mandate' | 'specific_work' | 'b2b';

// ------------------------------------------------------------- helpery ---

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function nonNegative(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function taxReducingAmount(share: TaxReducingShare): number {
  switch (share) {
    case 'full': return 300;
    case 'half': return 150;
    case 'third': return 100;
    case 'none': return 0;
  }
}

export function kupAmount(option: KupOption): number {
  return option === 'elevated' ? KUP_ELEVATED : KUP_STANDARD;
}

/** Przelicza stawkę godzinową/dniową na wynagrodzenie brutto miesięczne. */
export function grossFromHourlyRate(hourlyRate: number, hoursPerMonth: number): number {
  return round2(nonNegative(hourlyRate) * nonNegative(hoursPerMonth));
}
export function grossFromDailyRate(dailyRate: number, daysPerMonth: number): number {
  return round2(nonNegative(dailyRate) * nonNegative(daysPerMonth));
}

function ppkRates(ppk: PpkOption): { employee: number; employer: number } {
  switch (ppk.mode) {
    case 'none': return { employee: 0, employer: 0 };
    case 'standard': return { employee: 0.02, employer: 0.015 };
    case 'custom': return {
      employee: clamp(ppk.employeeRate, 0.005, 0.04),
      employer: clamp(ppk.employerRate, 0.015, 0.04),
    };
  }
}

/**
 * Podatek wg skali 12%/32%, z uwzględnieniem dochodu osiągniętego wcześniej w
 * roku (`priorTaxableIncome`, do wyznaczenia, jaka część dochodu z TEGO
 * miesiąca mieści się jeszcze w niższym progu) i kwoty zmniejszającej podatek.
 */
// Zaliczka na PIT (miesięczna) zaokrąglana jest do pełnych złotych —
// art. 63 §1 Ordynacji podatkowej dotyczy też zaliczek na podatek, zasada
// "końcówki < 50 gr w dół, >= 50 gr w górę" odpowiada Math.round(). Składki
// ZUS/zdrowotna NIE podlegają temu przepisowi i zostają w groszach (round2).
function scaleTax(taxableIncome: number, priorTaxableIncome: number, reducingAmount: number): number {
  const income = nonNegative(taxableIncome);
  const roomAtLowRate = Math.max(0, TAX_SCALE_THRESHOLD - Math.max(0, priorTaxableIncome));
  const belowThreshold = Math.min(income, roomAtLowRate);
  const aboveThreshold = income - belowThreshold;
  const tax = belowThreshold * TAX_SCALE_RATE_LOW + aboveThreshold * TAX_SCALE_RATE_HIGH;
  return Math.max(0, Math.round(tax - reducingAmount));
}

interface IncomeTaxResult {
  tax: number;
  reliefUsedThisMonth: number;
  taxableIncomeThisMonth: number;
}

/**
 * Ulga specjalna (młodzi <26/powrót z zagranicy/4+ dzieci/pracujący emeryci)
 * zwalnia przychód z podatku do limitu 85 528 zł/rok, narastająco — dochód
 * ponad ten limit wraca do normalnego opodatkowania wg skali, licząc próg
 * 120 000 zł od zera od momentu wyczerpania ulgi (a nie od początku roku).
 */
function applyIncomeTax(
  incomeThisMonth: number,
  opts: { specialRelief: SpecialRelief; reducingAmount: number; ctx: AnnualContext; flatRateDeclared?: boolean }
): IncomeTaxResult {
  const income = nonNegative(incomeThisMonth);
  const reliefRoom = opts.specialRelief === 'none' ? 0 : Math.max(0, YOUNG_RELIEF_LIMIT - opts.ctx.priorReliefUsed);
  const reliefUsedThisMonth = Math.min(income, reliefRoom);
  const taxableIncomeThisMonth = income - reliefUsedThisMonth;
  // Art. 32 ust. 1a pkt 2 ustawy o PIT: pracownik, który złożył u płatnika
  // oświadczenie o zamiarze opodatkowania dochodów łącznie z małżonkiem
  // (małżonek nie osiąga dochodów albo mieści się w niższym progu), ma
  // zaliczkę 12% przez WSZYSTKIE miesiące roku — próg 120 000 zł (i
  // narastający `ctx.priorTaxableIncome`) jest wtedy pomijany na etapie
  // zaliczki, bo do rozliczenia progresji dochodzi dopiero w rocznym PIT.
  // Warunek uprawniający (własny dochód > 120k, dochód małżonka w niższym
  // progu) NIE jest tu sprawdzany — to świadome oświadczenie użytkownika
  // złożone u realnego pracodawcy, nie coś, co kalkulator może/powinien
  // automatycznie wykrywać z samych liczb w formularzu.
  const tax = opts.flatRateDeclared
    ? Math.max(0, Math.round(taxableIncomeThisMonth * TAX_SCALE_RATE_LOW - opts.reducingAmount))
    : scaleTax(taxableIncomeThisMonth, opts.ctx.priorTaxableIncome, opts.reducingAmount);
  return { tax, reliefUsedThisMonth, taxableIncomeThisMonth };
}

/** Składka emerytalno-rentowa z uwzględnieniem limitu 30-krotności, narastająco. */
function pensionDisabilityBase(fullBase: number, priorPensionBase: number): number {
  const room = Math.max(0, ZUS_ANNUAL_BASE_LIMIT - priorPensionBase);
  return Math.min(nonNegative(fullBase), room);
}

// ------------------------------------------------------- umowa o pracę ---

export interface EmploymentInputs {
  /** Podstawa (bez premii) — patrz `bonusMonthly`. */
  grossMonthly: number;
  /**
   * Premia brutto doliczana do `grossMonthly` przed wszystkimi obliczeniami —
   * to nie jest osobny tytuł prawny, tylko dodatkowy składnik tego samego
   * wynagrodzenia, opodatkowany/składkowany identycznie. Służy wyłącznie
   * czytelnemu rozbiciu "podstawa + premia" w wyniku (`baseGross`/`bonusGross`)
   * dla trybu jednomiesięcznego. W rozliczeniu rocznym (`computeAnnualSalarySchedule`)
   * powinno zawsze zostać 0/undefined — tam premię w konkretnym miesiącu
   * wpisuje się wprost jako wyższą wartość w `monthlyGrossValues[i]`, nie tutaj.
   */
  bonusMonthly?: number;
  kup: KupOption;
  /**
   * % wynagrodzenia (0-100) objęte przeniesieniem praw autorskich — dodatkowe
   * 50% KUP naliczane RÓWNOLEGLE ze standardowym `kup` (250/300 zł), nie
   * zamiast niego, do rocznego limitu `ANNUAL_COPYRIGHT_KUP_LIMIT` (60 000 zł).
   */
  copyrightSharePercent?: number;
  specialRelief: SpecialRelief;
  reducingShare: TaxReducingShare;
  ppk: PpkOption;
  /** Oświadczenie art. 32 ust. 1a pkt 2 ustawy o PIT u tego płatnika — patrz `applyIncomeTax`. */
  flatRateDeclared?: boolean;
}

export interface EmploymentResult {
  /** Suma `baseGross + bonusGross` — pełne wynagrodzenie brutto tego miesiąca. */
  grossMonthly: number;
  baseGross: number;
  bonusGross: number;
  pensionBaseThisMonth: number;
  employeePension: number;
  employeeDisability: number;
  employeeSickness: number;
  employeeSocialTotal: number;
  healthInsurance: number;
  kup: number;
  copyrightKup: number;
  reliefExempt: number;
  taxableIncomeThisMonth: number;
  tax: number;
  ppkEmployee: number;
  ppkEmployer: number;
  net: number;
  employerPension: number;
  employerDisability: number;
  employerAccident: number;
  employerLaborFund: number;
  employerFgsp: number;
  employerTotalCost: number;
}

export function calcEmploymentContract(
  inputs: EmploymentInputs,
  ctx: AnnualContext = EMPTY_ANNUAL_CONTEXT
): EmploymentResult {
  const baseGross = nonNegative(inputs.grossMonthly);
  const bonusGross = nonNegative(inputs.bonusMonthly ?? 0);
  const gross = baseGross + bonusGross;
  const pensionBaseThisMonth = pensionDisabilityBase(gross, ctx.priorPensionBase);

  const employeePension = round2(pensionBaseThisMonth * EMPLOYEE_PENSION_RATE);
  const employeeDisability = round2(pensionBaseThisMonth * EMPLOYEE_DISABILITY_RATE);
  const employeeSickness = round2(gross * EMPLOYEE_SICKNESS_RATE); // chorobowa nie ma limitu 30-krotności
  const employeeSocialTotal = round2(employeePension + employeeDisability + employeeSickness);

  const healthBase = Math.max(0, gross - employeeSocialTotal);
  const healthInsurance = round2(healthBase * HEALTH_INSURANCE_RATE_EMPLOYEE);

  const kup = kupAmount(inputs.kup);

  // 50% koszty autorskie: liczone od części wynagrodzenia objętej prawami
  // (`copyrightSharePercent`), DODATKOWO do standardowego `kup` — nie w jego
  // miejsce — do wyczerpania rocznego limitu 60 000 zł. Nadwyżka ponad limit
  // dostaje 0 zł kosztów autorskich (nie spada do 20%).
  const copyrightShare = clamp(inputs.copyrightSharePercent ?? 0, 0, 100) / 100;
  const fullCopyrightKup = round2(0.5 * gross * copyrightShare);
  const remainingCopyrightLimit = Math.max(0, ANNUAL_COPYRIGHT_KUP_LIMIT - ctx.priorCopyrightCostsUsed);
  const copyrightKup = round2(Math.min(fullCopyrightKup, remainingCopyrightLimit));

  const incomeForTax = Math.max(0, gross - employeeSocialTotal - kup - copyrightKup);
  const reducingAmount = taxReducingAmount(inputs.reducingShare);
  const { tax, reliefUsedThisMonth, taxableIncomeThisMonth } = applyIncomeTax(incomeForTax, {
    specialRelief: inputs.specialRelief,
    reducingAmount,
    ctx,
    flatRateDeclared: inputs.flatRateDeclared,
  });

  // PPK potrącane po opodatkowaniu — uproszczenie: w realnych listach płac
  // wpłata pracownika zmniejsza podstawę PIT (wchodzi do "koszty uzyskania"
  // pośrednio przez odroczenie), ale wpływ na wynik netto miesiąca jest
  // marginalny (rzędu kilku zł przy stawce 2%), a to znacząco prostsza i
  // czytelniejsza kolejność liczenia.
  const { employee: ppkEmployeeRate, employer: ppkEmployerRate } = ppkRates(inputs.ppk);
  const ppkEmployee = round2(gross * ppkEmployeeRate);
  const ppkEmployer = round2(gross * ppkEmployerRate);

  const net = round2(gross - employeeSocialTotal - healthInsurance - tax - ppkEmployee);

  const employerPension = round2(pensionBaseThisMonth * EMPLOYER_PENSION_RATE);
  const employerDisability = round2(pensionBaseThisMonth * EMPLOYER_DISABILITY_RATE);
  const employerAccident = round2(gross * EMPLOYER_ACCIDENT_RATE);
  const employerLaborFund = round2(gross * EMPLOYER_LABOR_FUND_RATE);
  const employerFgsp = round2(gross * EMPLOYER_FGSP_RATE);
  const employerTotalCost = round2(
    gross + employerPension + employerDisability + employerAccident + employerLaborFund + employerFgsp + ppkEmployer
  );

  return {
    grossMonthly: gross,
    baseGross,
    bonusGross,
    pensionBaseThisMonth,
    employeePension,
    employeeDisability,
    employeeSickness,
    employeeSocialTotal,
    healthInsurance,
    kup,
    copyrightKup,
    reliefExempt: round2(reliefUsedThisMonth),
    taxableIncomeThisMonth: round2(taxableIncomeThisMonth),
    tax,
    ppkEmployee,
    ppkEmployer,
    net,
    employerPension,
    employerDisability,
    employerAccident,
    employerLaborFund,
    employerFgsp,
    employerTotalCost,
  };
}

// --------------------------------------------------------- zlecenie ---

export interface MandateInputs {
  grossMonthly: number;
  kup: MandateKupOption;
  specialRelief: SpecialRelief;
  reducingShare: TaxReducingShare;
  isStudentUnder26: boolean; // zwolnienie z ZUS i zdrowotnej, niezależnie od specialRelief
  sicknessVoluntary: boolean; // chorobowa jest dobrowolna na zleceniu
  /** Oświadczenie art. 32 ust. 1a pkt 2 ustawy o PIT u tego płatnika — patrz `applyIncomeTax`. */
  flatRateDeclared?: boolean;
}

export interface MandateResult {
  grossMonthly: number;
  pensionBaseThisMonth: number;
  employeePension: number;
  employeeDisability: number;
  employeeSickness: number;
  employeeSocialTotal: number;
  healthInsurance: number;
  kup: number;
  reliefExempt: number;
  taxableIncomeThisMonth: number;
  tax: number;
  net: number;
}

export function calcMandateContract(
  inputs: MandateInputs,
  ctx: AnnualContext = EMPTY_ANNUAL_CONTEXT
): MandateResult {
  const gross = nonNegative(inputs.grossMonthly);
  const kupRate = inputs.kup === 'copyright' ? 0.5 : 0.2;

  if (inputs.isStudentUnder26) {
    const kup = round2(gross * kupRate);
    const incomeForTax = Math.max(0, gross - kup);
    const reducingAmount = taxReducingAmount(inputs.reducingShare);
    const { tax, reliefUsedThisMonth, taxableIncomeThisMonth } = applyIncomeTax(incomeForTax, {
      specialRelief: inputs.specialRelief,
      reducingAmount,
      ctx,
      flatRateDeclared: inputs.flatRateDeclared,
    });
    return {
      grossMonthly: gross,
      pensionBaseThisMonth: 0,
      employeePension: 0,
      employeeDisability: 0,
      employeeSickness: 0,
      employeeSocialTotal: 0,
      healthInsurance: 0,
      kup,
      reliefExempt: round2(reliefUsedThisMonth),
      taxableIncomeThisMonth: round2(taxableIncomeThisMonth),
      tax,
      net: round2(gross - tax),
    };
  }

  const pensionBaseThisMonth = pensionDisabilityBase(gross, ctx.priorPensionBase);
  const employeePension = round2(pensionBaseThisMonth * EMPLOYEE_PENSION_RATE);
  const employeeDisability = round2(pensionBaseThisMonth * EMPLOYEE_DISABILITY_RATE);
  const employeeSickness = inputs.sicknessVoluntary ? round2(gross * EMPLOYEE_SICKNESS_RATE) : 0;
  const employeeSocialTotal = round2(employeePension + employeeDisability + employeeSickness);

  const healthBase = Math.max(0, gross - employeeSocialTotal);
  const healthInsurance = round2(healthBase * HEALTH_INSURANCE_RATE_EMPLOYEE);

  const kup = round2((gross - employeeSocialTotal) * kupRate);
  const incomeForTax = Math.max(0, gross - employeeSocialTotal - kup);
  const reducingAmount = taxReducingAmount(inputs.reducingShare);
  const { tax, reliefUsedThisMonth, taxableIncomeThisMonth } = applyIncomeTax(incomeForTax, {
    specialRelief: inputs.specialRelief,
    reducingAmount,
    ctx,
    flatRateDeclared: inputs.flatRateDeclared,
  });

  const net = round2(gross - employeeSocialTotal - healthInsurance - tax);

  return {
    grossMonthly: gross,
    pensionBaseThisMonth,
    employeePension,
    employeeDisability,
    employeeSickness,
    employeeSocialTotal,
    healthInsurance,
    kup,
    reliefExempt: round2(reliefUsedThisMonth),
    taxableIncomeThisMonth: round2(taxableIncomeThisMonth),
    tax,
    net,
  };
}

// ------------------------------------------------------------- dzieło ---

export interface SpecificWorkInputs {
  grossMonthly: number;
  kup: MandateKupOption; // 20% standard / 50% przeniesienie praw autorskich
  reducingShare: TaxReducingShare;
}

export interface SpecificWorkResult {
  grossMonthly: number;
  kup: number;
  taxableIncomeThisMonth: number;
  tax: number;
  net: number;
}

/**
 * Dzieło nie jest objęte ulgami specjalnymi (limit 85 528 zł dotyczy tylko
 * umowy o pracę i zlecenia) — próg skali 120 000 zł nadal ma zastosowanie
 * (via `ctx.priorTaxableIncome`), bo to wciąż zaliczka wg tej samej skali PIT.
 */
export function calcSpecificWorkContract(
  inputs: SpecificWorkInputs,
  ctx: AnnualContext = EMPTY_ANNUAL_CONTEXT
): SpecificWorkResult {
  const gross = nonNegative(inputs.grossMonthly);
  const kupRate = inputs.kup === 'copyright' ? 0.5 : 0.2;
  const kup = round2(gross * kupRate);
  const taxableIncomeThisMonth = Math.max(0, gross - kup);
  const reducingAmount = taxReducingAmount(inputs.reducingShare);
  const tax = scaleTax(taxableIncomeThisMonth, ctx.priorTaxableIncome, reducingAmount);
  return {
    grossMonthly: gross,
    kup,
    taxableIncomeThisMonth: round2(taxableIncomeThisMonth),
    tax,
    net: round2(gross - tax),
  };
}

// --------------------------------------------------------------- B2B ---

export interface B2BInputs {
  monthlyRevenue: number;
  monthlyCosts: number;
  taxForm: B2BTaxForm;
  ryczaltRate: RyczaltRate; // używane tylko gdy taxForm === 'ryczalt'
  ipBoxSharePercent: number; // 0-100, używane tylko gdy taxForm === 'ipbox'
  zusVariant: B2BZusVariant;
  sicknessVoluntary: boolean;
  malyZusPlusBase?: number; // podstawa wpisywana przez użytkownika, tylko gdy zusVariant === 'maly_zus_plus'
}

export interface B2BResult {
  monthlyRevenue: number;
  monthlyCosts: number;
  income: number; // przychód - koszty (dla skali/liniowego/ipbox); dla ryczałtu = przychód
  socialContributions: number;
  pensionBaseThisMonth: number;
  healthInsurance: number;
  tax: number;
  net: number;
}

function b2bSocialContributions(
  variant: B2BZusVariant,
  sicknessVoluntary: boolean,
  malyZusPlusBase: number | undefined
): { social: number; pensionBase: number } {
  switch (variant) {
    case 'ulga_na_start':
      return { social: 0, pensionBase: 0 };
    case 'preferencyjny': {
      const sickness = sicknessVoluntary ? round2(B2B_PREFERENTIAL_ZUS_PENSION_BASE * B2B_SICKNESS_VOLUNTARY_RATE) : 0;
      return { social: round2(B2B_PREFERENTIAL_ZUS_SOCIAL_MANDATORY + sickness), pensionBase: B2B_PREFERENTIAL_ZUS_PENSION_BASE };
    }
    case 'maly_zus_plus': {
      const base = nonNegative(malyZusPlusBase ?? B2B_PREFERENTIAL_ZUS_PENSION_BASE);
      const mandatoryRate = B2B_FULL_ZUS_SOCIAL_MANDATORY / B2B_FULL_ZUS_PENSION_BASE;
      const mandatory = round2(base * mandatoryRate);
      const sickness = sicknessVoluntary ? round2(base * B2B_SICKNESS_VOLUNTARY_RATE) : 0;
      return { social: round2(mandatory + sickness), pensionBase: base };
    }
    case 'pelny': {
      const sickness = sicknessVoluntary ? round2(B2B_FULL_ZUS_PENSION_BASE * B2B_SICKNESS_VOLUNTARY_RATE) : 0;
      return { social: round2(B2B_FULL_ZUS_SOCIAL_MANDATORY + sickness), pensionBase: B2B_FULL_ZUS_PENSION_BASE };
    }
  }
}

function ryczaltHealthInsurance(cumulativeRevenueIncludingThisMonth: number): number {
  if (cumulativeRevenueIncludingThisMonth <= RYCZALT_TIER_1_LIMIT) return RYCZALT_HEALTH_TIER_1;
  if (cumulativeRevenueIncludingThisMonth <= RYCZALT_TIER_2_LIMIT) return RYCZALT_HEALTH_TIER_2;
  return RYCZALT_HEALTH_TIER_3;
}

export function calcB2BContract(inputs: B2BInputs, ctx: AnnualContext = EMPTY_ANNUAL_CONTEXT): B2BResult {
  const revenue = nonNegative(inputs.monthlyRevenue);
  const costs = Math.min(nonNegative(inputs.monthlyCosts), revenue);

  const { social: socialContributions, pensionBase: pensionBaseThisMonth } = b2bSocialContributions(
    inputs.zusVariant,
    inputs.sicknessVoluntary,
    inputs.malyZusPlusBase
  );

  if (inputs.taxForm === 'ryczalt') {
    const cumulativeRevenue = ctx.priorFlatRevenue + revenue;
    const healthInsurance = ryczaltHealthInsurance(cumulativeRevenue);
    // Ryczałt: podatek liczony od PEŁNEGO przychodu, koszty firmowe go nie
    // zmniejszają. Zaokrąglenie do pełnych złotych jak w scaleTax (art. 63
    // §1 Ordynacji podatkowej dotyczy każdej zaliczki na podatek).
    const tax = Math.round(revenue * inputs.ryczaltRate);
    const net = round2(revenue - costs - socialContributions - healthInsurance - tax);
    return { monthlyRevenue: revenue, monthlyCosts: costs, income: revenue, socialContributions, pensionBaseThisMonth, healthInsurance, tax, net };
  }

  const income = Math.max(0, revenue - costs - socialContributions);

  if (inputs.taxForm === 'skala') {
    const healthInsurance = Math.max(round2(income * HEALTH_INSURANCE_RATE_SKALA), HEALTH_INSURANCE_MIN_SKALA_LINIOWY);
    // Bez kwoty zmniejszającej podatek — przedsiębiorca na skali też może z
    // niej korzystać miesięcznie, ale plan nie obejmuje tej opcji dla B2B;
    // uproszczenie udokumentowane, nie przeoczenie.
    const tax = scaleTax(income, ctx.priorTaxableIncome, 0);
    const net = round2(revenue - costs - socialContributions - healthInsurance - tax);
    return { monthlyRevenue: revenue, monthlyCosts: costs, income, socialContributions, pensionBaseThisMonth, healthInsurance, tax, net };
  }

  if (inputs.taxForm === 'liniowy') {
    // Uproszczenie: podstawa opodatkowania (income) tu NIE odejmuje zapłaconej
    // składki zdrowotnej, mimo że liniowcy od 2022 mogą część zdrowotnej
    // zaliczyć w koszty do rocznego limitu (ustawowo określona kwota,
    // aktualizowana co roku). Miesięczne odliczenie byłoby nieprecyzyjne bez
    // śledzenia limitu narastająco w roku — celowo pominięte, nie przeoczone.
    const healthInsurance = Math.max(round2(income * HEALTH_INSURANCE_RATE_LINIOWY), HEALTH_INSURANCE_MIN_SKALA_LINIOWY);
    const tax = Math.round(income * 0.19); // zaliczka do pełnych złotych, jak w scaleTax
    const net = round2(revenue - costs - socialContributions - healthInsurance - tax);
    return { monthlyRevenue: revenue, monthlyCosts: costs, income, socialContributions, pensionBaseThisMonth, healthInsurance, tax, net };
  }

  // IP Box: 5% od kwalifikowanej części dochodu, reszta wg liniowego 19%
  // (uproszczenie — realnie IP Box wymaga wyodrębnienia kwalifikowanego IP
  // z ewidencji, tu przybliżone jednym procentowym udziałem w dochodzie).
  // Zdrowotna liczona jak dla liniowego (4,9%, min. 432,54 zł) — IP Box nie
  // ma odrębnych reguł zdrowotnej, przedsiębiorca rozlicza się na zasadach
  // liniowego poza samym PIT.
  const ipBoxShare = clamp(inputs.ipBoxSharePercent, 0, 100) / 100;
  const incomeIpBox = income * ipBoxShare;
  const incomeOther = income - incomeIpBox;
  const tax = Math.round(incomeIpBox * 0.05 + incomeOther * 0.19); // zaliczka do pełnych złotych, jak w scaleTax
  const healthInsurance = Math.max(round2(income * HEALTH_INSURANCE_RATE_LINIOWY), HEALTH_INSURANCE_MIN_SKALA_LINIOWY);
  const net = round2(revenue - costs - socialContributions - healthInsurance - tax);
  return { monthlyRevenue: revenue, monthlyCosts: costs, income, socialContributions, pensionBaseThisMonth, healthInsurance, tax, net };
}

// ------------------------------------------------------ roczne rozliczenie ---

export interface AnnualScheduleResult<TResult> {
  months: TResult[];
  totalNet: number;
  totalTax: number;
  totalSocialAndHealth: number;
  scaleThresholdCrossedMonth: number | null; // 1-12, miesiąc w którym dochód przekroczył 120 000 zł narastająco
  zusLimitCrossedMonth: number | null; // miesiąc przekroczenia limitu 30-krotności
  reliefLimitCrossedMonth: number | null; // miesiąc wyczerpania ulgi specjalnej (85 528 zł)
}

/**
 * Symuluje 12 miesięcy tego samego typu umowy i tych samych opcji, z innym
 * wynagrodzeniem brutto/przychodem każdy miesiąc — śledząc narastająco progi
 * podatkowe i limity składek. To jest funkcja, której NIE ma żaden ze
 * sprawdzonych konkurentów (oni liczą tylko jeden miesiąc w izolacji).
 *
 * Uproszczenie (jak każdy kalkulator "jednomiesięczny" zresztą): traktuje
 * dany typ umowy jako JEDYNY dochód w roku, bez łączenia z innymi źródłami
 * w rocznym PIT-37/PIT-36 — to świadoma decyzja, nie przeoczenie.
 */
export function computeAnnualSalarySchedule(
  contractType: 'employment',
  monthlyGrossValues: number[],
  options: Omit<EmploymentInputs, 'grossMonthly'>
): AnnualScheduleResult<EmploymentResult>;
export function computeAnnualSalarySchedule(
  contractType: 'mandate',
  monthlyGrossValues: number[],
  options: Omit<MandateInputs, 'grossMonthly'>
): AnnualScheduleResult<MandateResult>;
export function computeAnnualSalarySchedule(
  contractType: 'specific_work',
  monthlyGrossValues: number[],
  options: Omit<SpecificWorkInputs, 'grossMonthly'>
): AnnualScheduleResult<SpecificWorkResult>;
export function computeAnnualSalarySchedule(
  contractType: 'b2b',
  monthlyGrossValues: number[],
  options: Omit<B2BInputs, 'monthlyRevenue'>
): AnnualScheduleResult<B2BResult>;
export function computeAnnualSalarySchedule(
  contractType: SalaryContractType,
  monthlyGrossValues: number[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: any
): AnnualScheduleResult<EmploymentResult | MandateResult | SpecificWorkResult | B2BResult> {
  let ctx = EMPTY_ANNUAL_CONTEXT;
  const months: (EmploymentResult | MandateResult | SpecificWorkResult | B2BResult)[] = [];
  let scaleThresholdCrossedMonth: number | null = null;
  let zusLimitCrossedMonth: number | null = null;
  let reliefLimitCrossedMonth: number | null = null;

  for (let i = 0; i < monthlyGrossValues.length; i++) {
    const amount = monthlyGrossValues[i] ?? 0;
    let result: EmploymentResult | MandateResult | SpecificWorkResult | B2BResult;
    let taxableIncomeThisMonth = 0;
    let reliefUsedThisMonth = 0;
    let pensionBaseThisMonth = 0;
    let copyrightCostsThisMonth = 0;

    if (contractType === 'employment') {
      const r = calcEmploymentContract({ ...options, grossMonthly: amount }, ctx);
      result = r;
      taxableIncomeThisMonth = r.taxableIncomeThisMonth;
      reliefUsedThisMonth = r.reliefExempt;
      pensionBaseThisMonth = r.pensionBaseThisMonth;
      copyrightCostsThisMonth = r.copyrightKup;
    } else if (contractType === 'mandate') {
      const r = calcMandateContract({ ...options, grossMonthly: amount }, ctx);
      result = r;
      taxableIncomeThisMonth = r.taxableIncomeThisMonth;
      reliefUsedThisMonth = r.reliefExempt;
      pensionBaseThisMonth = r.pensionBaseThisMonth;
    } else if (contractType === 'specific_work') {
      const r = calcSpecificWorkContract({ ...options, grossMonthly: amount }, ctx);
      result = r;
      taxableIncomeThisMonth = r.taxableIncomeThisMonth;
    } else {
      const r = calcB2BContract({ ...options, monthlyRevenue: amount }, ctx);
      result = r;
      pensionBaseThisMonth = r.pensionBaseThisMonth;
    }
    months.push(result);

    const priorTaxable = ctx.priorTaxableIncome;
    const priorPension = ctx.priorPensionBase;
    const priorRelief = ctx.priorReliefUsed;

    ctx = {
      priorTaxableIncome: ctx.priorTaxableIncome + taxableIncomeThisMonth,
      priorReliefUsed: ctx.priorReliefUsed + reliefUsedThisMonth,
      priorPensionBase: ctx.priorPensionBase + pensionBaseThisMonth,
      priorFlatRevenue: ctx.priorFlatRevenue + (contractType === 'b2b' ? (amount ?? 0) : 0),
      priorCopyrightCostsUsed: ctx.priorCopyrightCostsUsed + copyrightCostsThisMonth,
    };

    if (scaleThresholdCrossedMonth === null && priorTaxable < TAX_SCALE_THRESHOLD && ctx.priorTaxableIncome >= TAX_SCALE_THRESHOLD) {
      scaleThresholdCrossedMonth = i + 1;
    }
    if (zusLimitCrossedMonth === null && priorPension < ZUS_ANNUAL_BASE_LIMIT && ctx.priorPensionBase >= ZUS_ANNUAL_BASE_LIMIT) {
      zusLimitCrossedMonth = i + 1;
    }
    if (reliefLimitCrossedMonth === null && priorRelief < YOUNG_RELIEF_LIMIT && ctx.priorReliefUsed >= YOUNG_RELIEF_LIMIT) {
      reliefLimitCrossedMonth = i + 1;
    }
  }

  const totalNet = round2(months.reduce((sum, m) => sum + m.net, 0));
  const totalTax = round2(months.reduce((sum, m) => sum + m.tax, 0));
  const totalSocialAndHealth = round2(
    months.reduce((sum, m) => {
      if ('employeeSocialTotal' in m) return sum + m.employeeSocialTotal + m.healthInsurance;
      if ('socialContributions' in m) return sum + m.socialContributions + m.healthInsurance;
      return sum;
    }, 0)
  );

  return {
    months,
    totalNet,
    totalTax,
    totalSocialAndHealth,
    scaleThresholdCrossedMonth,
    zusLimitCrossedMonth,
    reliefLimitCrossedMonth,
  };
}

// ------------------------------------------------- wspólne rozliczenie ---

/** Podatek roczny wg skali 12%/32%, bez podziału na miesiące — tylko do `computeJointTaxation`. */
function annualScaleTax(income: number, reducingAmountAnnual: number): number {
  const inc = nonNegative(income);
  const below = Math.min(inc, TAX_SCALE_THRESHOLD);
  const above = inc - below;
  const tax = below * TAX_SCALE_RATE_LOW + above * TAX_SCALE_RATE_HIGH;
  return Math.max(0, round2(tax - reducingAmountAnnual));
}

export interface JointTaxationResult {
  jointTax: number;
  ownShareTax: number;
  spouseShareTax: number;
  taxSavingsVsSeparate: number; // dodatnie = wspólne rozliczenie się opłaca
}

/**
 * Wspólne rozliczenie małżonków: podatek liczony od POŁOWY sumy dochodów
 * obojga wg skali, wynik ×2 — klasyczny mechanizm PIT-37 (art. 6 ust. 2
 * ustawy o PIT). Opłaca się, gdy dochody są nierówne (osoba o wyższym
 * dochodzie "oddaje" część kwoty zmniejszającej podatek/niższego progu tej
 * o niższym dochodzie); bez korzyści, gdy dochody są zbliżone.
 *
 * DOTYCZY TYLKO dochodów opodatkowanych skalą (umowa o pracę, zlecenie,
 * dzieło, B2B na skali) — B2B liniowy/ryczałt/IP Box NIE kwalifikuje się do
 * wspólnego rozliczenia (art. 6 ust. 8 ustawy o PIT wyłącza podatników
 * rozliczających się inaczej niż na zasadach ogólnych). Ta funkcja tego nie
 * sprawdza sama — to odpowiedzialność UI/hooka: nie pokazywać/nie pozwalać
 * włączyć tej opcji dla formy opodatkowania, która się nie kwalifikuje.
 */
export function computeJointTaxation(
  ownAnnualTaxableIncome: number,
  spouseAnnualTaxableIncome: number,
  reducingAmountAnnual: number
): JointTaxationResult {
  const own = nonNegative(ownAnnualTaxableIncome);
  const spouse = nonNegative(spouseAnnualTaxableIncome);
  const combined = own + spouse;

  const jointTax = round2(annualScaleTax(combined / 2, reducingAmountAnnual) * 2);
  const ownShareTax = combined > 0 ? round2(jointTax * (own / combined)) : 0;
  const spouseShareTax = round2(jointTax - ownShareTax);

  const separateTax = round2(
    annualScaleTax(own, reducingAmountAnnual) + annualScaleTax(spouse, reducingAmountAnnual)
  );
  const taxSavingsVsSeparate = round2(separateTax - jointTax);

  return { jointTax, ownShareTax, spouseShareTax, taxSavingsVsSeparate };
}
