import { describe, it, expect } from 'vitest';
import {
  calcEmploymentContract,
  calcMandateContract,
  calcSpecificWorkContract,
  calcB2BContract,
  computeAnnualSalarySchedule,
  computeJointTaxation,
  grossFromHourlyRate,
  grossFromDailyRate,
  solveEmploymentGrossForNet,
  solveMandateGrossForNet,
  taxReducingAmount,
  kupAmount,
  TAX_SCALE_THRESHOLD,
  ZUS_ANNUAL_BASE_LIMIT,
  RYCZALT_TIER_1_LIMIT,
  ANNUAL_COPYRIGHT_KUP_LIMIT,
  RYCZALT_RATES,
  type EmploymentInputs,
  type MandateInputs,
  type B2BInputs,
} from './salary';

const employmentDefaults: EmploymentInputs = {
  grossMonthly: 8000,
  kup: 'standard',
  specialRelief: 'none',
  reducingShare: 'full',
  ppk: { mode: 'none' },
};

const mandateDefaults: MandateInputs = {
  grossMonthly: 5000,
  kup: 'standard',
  specialRelief: 'none',
  reducingShare: 'full',
  isStudentUnder26: false,
  sicknessVoluntary: true,
};

const b2bDefaults: B2BInputs = {
  monthlyRevenue: 10000,
  monthlyCosts: 0,
  taxForm: 'liniowy',
  ryczaltRate: 0.12,
  ipBoxSharePercent: 0,
  zusVariant: 'pelny',
  sicknessVoluntary: false,
};

describe('grossFromHourlyRate / grossFromDailyRate', () => {
  it('multiplies rate by hours/days', () => {
    expect(grossFromHourlyRate(40, 160)).toBe(6400);
    expect(grossFromDailyRate(300, 21)).toBe(6300);
  });

  it('clamps negative inputs to 0', () => {
    expect(grossFromHourlyRate(-10, 160)).toBe(0);
    expect(grossFromDailyRate(300, -5)).toBe(0);
  });
});

describe('taxReducingAmount / kupAmount', () => {
  it('maps PIT-2 share to the correct monthly amount', () => {
    expect(taxReducingAmount('full')).toBe(300);
    expect(taxReducingAmount('half')).toBe(150);
    expect(taxReducingAmount('third')).toBe(100);
    expect(taxReducingAmount('none')).toBe(0);
  });

  it('maps KUP option to the correct amount', () => {
    expect(kupAmount('standard')).toBe(250);
    expect(kupAmount('elevated')).toBe(300);
  });
});

describe('calcEmploymentContract', () => {
  it(
    'regression: 8000 zł brutto, PIT-2 pełne, KUP standard, bez ulg/PPK — wynik krok po kroku: ' +
      'ZUS pracownika 13,71% z 8000 = 1096,80 (emerytalna 780,80 + rentowa 120 + chorobowa 196); ' +
      'zdrowotna 9% z (8000-1096,80=6903,20) = 621,29 (grosze, bez zaokrąglenia do pełnego złotego, ' +
      'jak reszta tej apki liczy na groszach); dochód do podatku = 6903,20-250(KUP) = 6653,20; ' +
      'podatek 12% z 6653,20 = 798,38, minus 300 (PIT-2) = 498,38, zaokrąglone do pełnych złotych ' +
      '(art. 63 §1 Ordynacji podatkowej) = 498; netto = 8000-1096,80-621,29-498 = 5783,91',
    () => {
      const r = calcEmploymentContract(employmentDefaults);
      expect(r.employeeSocialTotal).toBeCloseTo(1096.8, 2);
      expect(r.healthInsurance).toBeCloseTo(621.29, 2);
      expect(r.tax).toBe(Math.round(798.38 - 300));
      expect(r.net).toBeCloseTo(8000 - 1096.8 - 621.29 - Math.round(798.38 - 300), 2);
    }
  );

  it(
    'regression: brutto 8500 zł — składniki muszą sumować się do netto co do grosza; przed poprawką ' +
      'zaokrąglenia zaliczki PIT do pełnych złotych net był o 1 zł niższy niż suma odjętych składników',
    () => {
      const r = calcEmploymentContract({ ...employmentDefaults, grossMonthly: 8500 });
      expect(r.employeeSocialTotal).toBeCloseTo(1165.35, 2);
      expect(r.healthInsurance).toBeCloseTo(660.12, 2);
      expect(Number.isInteger(r.tax)).toBe(true);
      expect(r.tax).toBe(550);
      expect(r.net).toBeCloseTo(8500 - r.employeeSocialTotal - r.healthInsurance - r.tax, 2);
      expect(r.net).toBeCloseTo(6124.53, 2);
    }
  );

  it(
    'flatRateDeclared (art. 32 ust. 1a pkt 2 ustawy o PIT — oświadczenie o wspólnym opodatkowaniu z małżonkiem ' +
      'bez dochodów) keeps the withholding at a flat 12% even when cumulative taxable income (ctx.priorTaxableIncome) ' +
      'is already far past the 120 000 zł threshold, instead of the progressive 32% scaleTax would otherwise apply',
    () => {
      const ctx = { priorTaxableIncome: 200_000, priorReliefUsed: 0, priorPensionBase: 0, priorFlatRevenue: 0, priorCopyrightCostsUsed: 0 };
      const progressive = calcEmploymentContract(employmentDefaults, ctx);
      const flat = calcEmploymentContract({ ...employmentDefaults, flatRateDeclared: true }, ctx);
      expect(flat.tax).toBeLessThan(progressive.tax);
      expect(flat.net).toBeGreaterThan(progressive.net);
      // 12% niezależnie od tego, że priorTaxableIncome jest daleko za progiem.
      expect(flat.tax).toBe(Math.max(0, Math.round(flat.taxableIncomeThisMonth * 0.12 - 300)));
    }
  );

  it('higher KUP (elevated) lowers the tax vs standard, all else equal', () => {
    const standard = calcEmploymentContract({ ...employmentDefaults, kup: 'standard' });
    const elevated = calcEmploymentContract({ ...employmentDefaults, kup: 'elevated' });
    expect(elevated.tax).toBeLessThan(standard.tax);
    expect(elevated.net).toBeGreaterThan(standard.net);
  });

  it('special relief (under 26) zeroes the tax when income stays under the 85 528 zł limit', () => {
    const r = calcEmploymentContract({ ...employmentDefaults, specialRelief: 'under26' });
    expect(r.tax).toBe(0);
    expect(r.reliefExempt).toBeGreaterThan(0);
    // ZUS/zdrowotna są nadal potrącane — ulga dotyczy tylko podatku.
    expect(r.employeeSocialTotal).toBeGreaterThan(0);
    expect(r.healthInsurance).toBeGreaterThan(0);
  });

  it('custom PPK contribution reduces net by exactly the employee rate on gross', () => {
    const noPpk = calcEmploymentContract({ ...employmentDefaults, ppk: { mode: 'none' } });
    const withPpk = calcEmploymentContract({
      ...employmentDefaults,
      ppk: { mode: 'custom', employeeRate: 0.03, employerRate: 0.02 },
    });
    expect(withPpk.ppkEmployee).toBeCloseTo(8000 * 0.03, 2);
    expect(noPpk.net - withPpk.net).toBeCloseTo(8000 * 0.03, 2);
    expect(withPpk.employerTotalCost).toBeGreaterThan(noPpk.employerTotalCost);
  });

  it(
    'regression: pension/disability base is capped at the remaining room under the 30-krotność limit ' +
      '(282 600 zł) when prior annual income already used most of it — ZUS_ANNUAL_BASE_LIMIT is the exact ' +
      'boundary, so a gross above the remaining room must not push the base past it',
    () => {
      const ctx = { priorTaxableIncome: 0, priorReliefUsed: 0, priorPensionBase: ZUS_ANNUAL_BASE_LIMIT - 1000, priorFlatRevenue: 0, priorCopyrightCostsUsed: 0 };
      const r = calcEmploymentContract(employmentDefaults, ctx);
      expect(r.pensionBaseThisMonth).toBe(1000);
      // Powyżej limitu nie potrąca się już emerytalnej/rentowej (tylko chorobowa i zdrowotna liczą się od pełnego brutto).
      expect(r.employeePension).toBeCloseTo(1000 * 0.0976, 2);
    }
  );

  it('employer total cost is always greater than gross (employer-side contributions are additive)', () => {
    const r = calcEmploymentContract(employmentDefaults);
    expect(r.employerTotalCost).toBeGreaterThan(r.grossMonthly);
  });
});

describe('solveEmploymentGrossForNet', () => {
  const otherInputs = {
    kup: 'standard' as const,
    specialRelief: 'none' as const,
    reducingShare: 'full' as const,
    ppk: { mode: 'none' as const },
  };

  it(
    'regression: round-trips — the solved gross, fed back through calcEmploymentContract, produces net ' +
      'within 1 zł of the requested target ("chcę mieć na rękę X ile musi być brutto" was previously not ' +
      'possible at all, only the forward direction (brutto → netto) existed)',
    () => {
      for (const targetNet of [3000, 5500, 9000, 15000, 25000]) {
        const gross = solveEmploymentGrossForNet(targetNet, otherInputs);
        const net = calcEmploymentContract({ ...otherInputs, grossMonthly: gross }).net;
        expect(Math.abs(net - targetNet)).toBeLessThan(1);
      }
    }
  );

  it('returns 0 for a target net of 0 or less, without an infinite loop', () => {
    expect(solveEmploymentGrossForNet(0, otherInputs)).toBe(0);
    expect(solveEmploymentGrossForNet(-500, otherInputs)).toBe(0);
  });

  it('the solved gross correctly crosses the 32% bracket for a high target net (progressive tax, not flat)', () => {
    const gross = solveEmploymentGrossForNet(30000, otherInputs);
    const net = calcEmploymentContract({ ...otherInputs, grossMonthly: gross }).net;
    expect(Math.abs(net - 30000)).toBeLessThan(1);
    expect(gross).toBeGreaterThan(30000); // brutto zawsze wyższe niż netto
  });
});

describe('calcMandateContract', () => {
  it('student under 26 pays zero ZUS and zero health insurance, only tax on income after KUP', () => {
    const r = calcMandateContract({ ...mandateDefaults, isStudentUnder26: true });
    expect(r.employeeSocialTotal).toBe(0);
    expect(r.healthInsurance).toBe(0);
    expect(r.kup).toBeCloseTo(5000 * 0.2, 2);
  });

  it('non-student pays ZUS and health insurance like an employment contract (minus employer side)', () => {
    const r = calcMandateContract(mandateDefaults);
    expect(r.employeeSocialTotal).toBeGreaterThan(0);
    expect(r.healthInsurance).toBeGreaterThan(0);
  });

  it('copyright KUP (50%) yields a lower tax than standard KUP (20%), all else equal', () => {
    const standard = calcMandateContract({ ...mandateDefaults, kup: 'standard' });
    const copyright = calcMandateContract({ ...mandateDefaults, kup: 'copyright' });
    expect(copyright.kup).toBeGreaterThan(standard.kup);
    expect(copyright.tax).toBeLessThan(standard.tax);
  });

  it(
    'regression: caps copyright KUP at the remaining room under the annual 60 000 zł limit, same as ' +
      'calcEmploymentContract — previously kup:\'copyright\' on a zlecenie gave unlimited 50% KUP every ' +
      'month regardless of how much was already used earlier in the year, understating tax for high earners',
    () => {
      const ctx = {
        priorTaxableIncome: 0, priorReliefUsed: 0, priorPensionBase: 0, priorFlatRevenue: 0,
        priorCopyrightCostsUsed: ANNUAL_COPYRIGHT_KUP_LIMIT - 500,
      };
      const r = calcMandateContract({ ...mandateDefaults, kup: 'copyright', grossMonthly: 10000 }, ctx);
      // Bez limitu: (10000 - employeeSocialTotal) * 50% > 500 zł — ale w tym roku zostało tylko 500 zł miejsca.
      expect(r.kup).toBe(500);
    }
  );

  it('copyright KUP caps at 0 (not a negative number) once the annual limit is fully exhausted', () => {
    const ctx = {
      priorTaxableIncome: 0, priorReliefUsed: 0, priorPensionBase: 0, priorFlatRevenue: 0,
      priorCopyrightCostsUsed: ANNUAL_COPYRIGHT_KUP_LIMIT,
    };
    const r = calcMandateContract({ ...mandateDefaults, kup: 'copyright' }, ctx);
    expect(r.kup).toBe(0);
  });

  it(
    'the 60 000 zł cap also applies to a single isolated month with no prior annual context — a single ' +
      'huge one-off copyright payment cannot exceed the annual limit either, even outside annual mode',
    () => {
      const r = calcMandateContract({ ...mandateDefaults, kup: 'copyright', grossMonthly: 500_000 });
      expect(r.kup).toBe(ANNUAL_COPYRIGHT_KUP_LIMIT);
    }
  );

  it('the annual copyright limit does not affect standard (20%) KUP, which has no such cap', () => {
    const ctxAtLimit = {
      priorTaxableIncome: 0, priorReliefUsed: 0, priorPensionBase: 0, priorFlatRevenue: 0,
      priorCopyrightCostsUsed: ANNUAL_COPYRIGHT_KUP_LIMIT,
    };
    const withLimitUsed = calcMandateContract({ ...mandateDefaults, kup: 'standard' }, ctxAtLimit);
    const fresh = calcMandateContract({ ...mandateDefaults, kup: 'standard' });
    expect(withLimitUsed.kup).toBe(fresh.kup);
  });

  it('sickness insurance is voluntary — disabling it raises net pay slightly', () => {
    const withSickness = calcMandateContract({ ...mandateDefaults, sicknessVoluntary: true });
    const withoutSickness = calcMandateContract({ ...mandateDefaults, sicknessVoluntary: false });
    expect(withSickness.employeeSickness).toBeGreaterThan(0);
    expect(withoutSickness.employeeSickness).toBe(0);
    expect(withoutSickness.net).toBeGreaterThan(withSickness.net);
  });

  it('flatRateDeclared keeps a flat 12% withholding for a non-student contract too, even past the 120 000 zł threshold', () => {
    const ctx = { priorTaxableIncome: 200_000, priorReliefUsed: 0, priorPensionBase: 0, priorFlatRevenue: 0, priorCopyrightCostsUsed: 0 };
    const progressive = calcMandateContract(mandateDefaults, ctx);
    const flat = calcMandateContract({ ...mandateDefaults, flatRateDeclared: true }, ctx);
    expect(flat.tax).toBeLessThan(progressive.tax);
  });
});

describe('solveMandateGrossForNet', () => {
  const otherInputs = {
    kup: 'standard' as const,
    specialRelief: 'none' as const,
    reducingShare: 'full' as const,
    isStudentUnder26: false,
    sicknessVoluntary: true,
  };

  it('regression: round-trips — the solved gross, fed back through calcMandateContract, produces net within 1 zł of the target', () => {
    for (const targetNet of [2500, 4000, 8000, 18000]) {
      const gross = solveMandateGrossForNet(targetNet, otherInputs);
      const net = calcMandateContract({ ...otherInputs, grossMonthly: gross }).net;
      expect(Math.abs(net - targetNet)).toBeLessThan(1);
    }
  });

  it('the student-under-26 exemption (no ZUS/health) yields a lower required gross for the same target net', () => {
    const withZus = solveMandateGrossForNet(5000, otherInputs);
    const student = solveMandateGrossForNet(5000, { ...otherInputs, isStudentUnder26: true });
    expect(student).toBeLessThan(withZus);
  });
});

describe('calcSpecificWorkContract', () => {
  it('never deducts ZUS or health insurance — only KUP and tax', () => {
    const r = calcSpecificWorkContract({ grossMonthly: 4000, kup: 'standard', reducingShare: 'full' });
    expect(r.kup).toBeCloseTo(800, 2);
    expect(r.taxableIncomeThisMonth).toBeCloseTo(3200, 2);
    expect(r.net).toBeCloseTo(4000 - r.tax, 2);
  });

  it('copyright transfer (50% KUP) roughly halves the taxable income vs 20% standard', () => {
    const standard = calcSpecificWorkContract({ grossMonthly: 4000, kup: 'standard', reducingShare: 'full' });
    const copyright = calcSpecificWorkContract({ grossMonthly: 4000, kup: 'copyright', reducingShare: 'full' });
    expect(copyright.taxableIncomeThisMonth).toBeLessThan(standard.taxableIncomeThisMonth);
    expect(copyright.net).toBeGreaterThan(standard.net);
  });

  it(
    'regression: caps copyright KUP at the remaining room under the annual 60 000 zł limit, same as ' +
      'calcEmploymentContract/calcMandateContract — previously kup:\'copyright\' on a dzieło gave unlimited ' +
      '50% KUP every month regardless of prior usage in the year',
    () => {
      const ctx = {
        priorTaxableIncome: 0, priorReliefUsed: 0, priorPensionBase: 0, priorFlatRevenue: 0,
        priorCopyrightCostsUsed: ANNUAL_COPYRIGHT_KUP_LIMIT - 200,
      };
      const r = calcSpecificWorkContract({ grossMonthly: 10000, kup: 'copyright', reducingShare: 'full' }, ctx);
      // Bez limitu: 10000 * 50% = 5000 zł — ale w tym roku zostało tylko 200 zł miejsca.
      expect(r.kup).toBe(200);
    }
  );

  it('the 120 000 zł scale threshold still applies via prior annual context (dzieło is not relief-exempt but is still taxed on the scale)', () => {
    const belowThreshold = calcSpecificWorkContract(
      { grossMonthly: 4000, kup: 'standard', reducingShare: 'none' },
      { priorTaxableIncome: 0, priorReliefUsed: 0, priorPensionBase: 0, priorFlatRevenue: 0, priorCopyrightCostsUsed: 0 }
    );
    const acrossThreshold = calcSpecificWorkContract(
      { grossMonthly: 4000, kup: 'standard', reducingShare: 'none' },
      { priorTaxableIncome: TAX_SCALE_THRESHOLD - 1000, priorReliefUsed: 0, priorPensionBase: 0, priorFlatRevenue: 0, priorCopyrightCostsUsed: 0 }
    );
    // Ten sam brutto, ale druga część nadwyżki jest opodatkowana 32% zamiast 12% — wyższy podatek.
    expect(acrossThreshold.tax).toBeGreaterThan(belowThreshold.tax);
  });
});

describe('calcB2BContract', () => {
  it(
    'regression: supports the full set of 10 real ryczałt ewidencjonowany rates (2%/3%/5,5%/8,5%/10%/12%/12,5%/14%/15%/17%) ' +
      '— the dropdown previously offered only 5 of these, missing rates that apply to e.g. trade/retail (3%), ' +
      'construction/production (5,5%), some rental/services (10%) and high-revenue IT (12,5%)',
    () => {
      expect(RYCZALT_RATES).toEqual([0.02, 0.03, 0.055, 0.085, 0.10, 0.12, 0.125, 0.14, 0.15, 0.17]);
      for (const ryczaltRate of RYCZALT_RATES) {
        const r = calcB2BContract({ ...b2bDefaults, taxForm: 'ryczalt', ryczaltRate });
        expect(r.tax).toBe(Math.round(10000 * ryczaltRate));
      }
    }
  );

  it('skala: costs reduce taxable income, tax uses 12%/32% scale', () => {
    const r = calcB2BContract({ ...b2bDefaults, taxForm: 'skala', monthlyCosts: 2000, zusVariant: 'ulga_na_start' });
    expect(r.income).toBeCloseTo(10000 - 2000, 2);
    expect(r.socialContributions).toBe(0); // ulga na start
  });

  it('liniowy: flat 19% tax on income after costs and social contributions', () => {
    const r = calcB2BContract({ ...b2bDefaults, taxForm: 'liniowy', zusVariant: 'ulga_na_start' });
    const expectedIncome = 10000 - 0 - 0;
    expect(r.tax).toBe(Math.round(expectedIncome * 0.19));
  });

  it(
    'regression: ryczałt taxes the FULL revenue (costs are not deductible), unlike skala/liniowy which ' +
      'tax revenue minus costs — same revenue+costs but different tax forms must diverge exactly by the cost amount',
    () => {
      const liniowy = calcB2BContract({ ...b2bDefaults, taxForm: 'liniowy', monthlyCosts: 3000, zusVariant: 'ulga_na_start' });
      const ryczalt = calcB2BContract({ ...b2bDefaults, taxForm: 'ryczalt', monthlyCosts: 3000, ryczaltRate: 0.12, zusVariant: 'ulga_na_start' });
      expect(liniowy.income).toBeCloseTo(7000, 2); // 10000 - 3000
      expect(ryczalt.income).toBeCloseTo(10000, 2); // pełny przychód, koszty nieodliczane od podatku
      expect(ryczalt.tax).toBeCloseTo(10000 * 0.12, 2);
    }
  );

  it('IP Box applies 5% to the declared IP share and 19% to the rest of the income', () => {
    const full = calcB2BContract({ ...b2bDefaults, taxForm: 'ipbox', ipBoxSharePercent: 100 });
    const none = calcB2BContract({ ...b2bDefaults, taxForm: 'ipbox', ipBoxSharePercent: 0 });
    const linear = calcB2BContract({ ...b2bDefaults, taxForm: 'liniowy' });
    expect(full.tax).toBe(Math.round(full.income * 0.05));
    expect(none.tax).toBeCloseTo(linear.tax, 2);
  });

  it('pełny ZUS costs more than preferencyjny, which costs more than ulga na start (zero)', () => {
    const start = calcB2BContract({ ...b2bDefaults, zusVariant: 'ulga_na_start' });
    const pref = calcB2BContract({ ...b2bDefaults, zusVariant: 'preferencyjny' });
    const full = calcB2BContract({ ...b2bDefaults, zusVariant: 'pelny' });
    expect(start.socialContributions).toBe(0);
    expect(pref.socialContributions).toBeGreaterThan(start.socialContributions);
    expect(full.socialContributions).toBeGreaterThan(pref.socialContributions);
  });

  it(
    'regression: ryczałt health insurance tier depends on CUMULATIVE annual revenue including this month, ' +
      `not just this month's revenue — crossing ${RYCZALT_TIER_1_LIMIT} zł mid-year raises the tier for this month`,
    () => {
      const belowTier = calcB2BContract(
        { ...b2bDefaults, taxForm: 'ryczalt', monthlyRevenue: 5000 },
        { priorTaxableIncome: 0, priorReliefUsed: 0, priorPensionBase: 0, priorFlatRevenue: 0, priorCopyrightCostsUsed: 0 }
      );
      const crossingTier = calcB2BContract(
        { ...b2bDefaults, taxForm: 'ryczalt', monthlyRevenue: 5000 },
        { priorTaxableIncome: 0, priorReliefUsed: 0, priorPensionBase: 0, priorFlatRevenue: RYCZALT_TIER_1_LIMIT - 1000, priorCopyrightCostsUsed: 0 }
      );
      expect(crossingTier.healthInsurance).toBeGreaterThan(belowTier.healthInsurance);
    }
  );

  it('mały ZUS Plus scales social contributions proportionally to the user-entered base', () => {
    const half = calcB2BContract({ ...b2bDefaults, zusVariant: 'maly_zus_plus', malyZusPlusBase: 2826.10 });
    const full = calcB2BContract({ ...b2bDefaults, zusVariant: 'maly_zus_plus', malyZusPlusBase: 5652.20 });
    expect(full.socialContributions).toBeCloseTo(half.socialContributions * 2, 1);
  });
});

describe('computeAnnualSalarySchedule', () => {
  it('with a flat gross every month and no threshold crossed, all 12 months compute identical tax/net', () => {
    const result = computeAnnualSalarySchedule('employment', Array(12).fill(5000), {
      kup: 'standard',
      specialRelief: 'none',
      reducingShare: 'full',
      ppk: { mode: 'none' },
    });
    expect(result.months).toHaveLength(12);
    expect(result.months[0]!.tax).toBeCloseTo(result.months[11]!.tax, 2);
    expect(result.scaleThresholdCrossedMonth).toBeNull();
  });

  it(
    'regression: flags the exact month the cumulative taxable income crosses 120 000 zł — a high, ' +
      'constant monthly gross of 12 000 zł (employment) accumulates ~9 800 zł/month taxable after ZUS+KUP, ' +
      'crossing 120 000 zł partway through the year',
    () => {
      const result = computeAnnualSalarySchedule('employment', Array(12).fill(12000), {
        kup: 'standard',
        specialRelief: 'none',
        reducingShare: 'full',
        ppk: { mode: 'none' },
      });
      expect(result.scaleThresholdCrossedMonth).not.toBeNull();
      expect(result.scaleThresholdCrossedMonth).toBeGreaterThan(1);
      expect(result.scaleThresholdCrossedMonth).toBeLessThanOrEqual(12);
      // Po przekroczeniu progu kolejne miesiące mają wyższy podatek (32% od nadwyżki).
      const crossMonth = result.scaleThresholdCrossedMonth!;
      if (crossMonth < 12) {
        expect(result.months[crossMonth]!.tax).toBeGreaterThan(result.months[0]!.tax);
      }
    }
  );

  it(
    'regression: flags the month the cumulative ZUS pension/disability base crosses the 30-krotność limit ' +
      `(${ZUS_ANNUAL_BASE_LIMIT} zł) — a gross well above the monthly-equivalent of the limit crosses it before month 12`,
    () => {
      const monthlyGross = ZUS_ANNUAL_BASE_LIMIT / 6; // crosses the annual limit by month 6
      const result = computeAnnualSalarySchedule('employment', Array(12).fill(monthlyGross), {
        kup: 'standard',
        specialRelief: 'none',
        reducingShare: 'full',
        ppk: { mode: 'none' },
      });
      expect(result.zusLimitCrossedMonth).not.toBeNull();
      expect(result.zusLimitCrossedMonth).toBeLessThanOrEqual(6);
    }
  );

  it(
    'regression: flags the month the young-relief 85 528 zł limit is exhausted, after which tax reappears',
    () => {
      // Ulga liczy się od dochodu po ZUS+KUP, nie od brutto: 10 000 zł brutto/mies
      // → ok. 8 379 zł podlegającego uldze miesięcznie → 12 × 8 379 ≈ 100 548 zł/rok,
      // co przekracza limit 85 528 zł w trakcie roku (8000 zł brutto/mies dawało tylko
      // ok. 79 838 zł/rok po odliczeniach — za mało, żeby próg został przekroczony).
      const monthlyGross = 10000;
      const result = computeAnnualSalarySchedule('employment', Array(12).fill(monthlyGross), {
        kup: 'standard',
        specialRelief: 'under26',
        reducingShare: 'full',
        ppk: { mode: 'none' },
      });
      expect(result.reliefLimitCrossedMonth).not.toBeNull();
      const crossMonth = result.reliefLimitCrossedMonth!;
      expect(result.months[0]!.tax).toBe(0);
      if (crossMonth < 12) {
        expect(result.months[11]!.tax).toBeGreaterThan(0);
      }
    }
  );

  it(
    'regression: B2B ryczałt health insurance tier rises across the year as cumulative revenue crosses 60 000 zł, ' +
      'and ryczaltHealthTierCrossedMonth records which month it happened in — this was previously untracked, ' +
      'so the annual chart showed an unexplained net-pay drop for the exact same reason the scale threshold ' +
      '(120 000 zł) and ZUS limit crossings were already annotated for employment/mandate',
    () => {
      const result = computeAnnualSalarySchedule('b2b', Array(12).fill(8000), {
        monthlyCosts: 0,
        taxForm: 'ryczalt',
        ryczaltRate: 0.12,
        ipBoxSharePercent: 0,
        zusVariant: 'ulga_na_start',
        sicknessVoluntary: false,
      });
      const firstMonthHealth = (result.months[0] as { healthInsurance: number }).healthInsurance;
      const lastMonthHealth = (result.months[11] as { healthInsurance: number }).healthInsurance;
      expect(lastMonthHealth).toBeGreaterThan(firstMonthHealth);
      // 8000/miesiąc przekracza 60 000 zł narastająco w 8. miesiącu (8*8000=64000).
      expect(result.ryczaltHealthTierCrossedMonth).toBe(8);
    }
  );

  it('ryczaltHealthTierCrossedMonth stays null when cumulative revenue never crosses a tier', () => {
    const result = computeAnnualSalarySchedule('b2b', Array(12).fill(3000), {
      monthlyCosts: 0,
      taxForm: 'ryczalt',
      ryczaltRate: 0.12,
      ipBoxSharePercent: 0,
      zusVariant: 'ulga_na_start',
      sicknessVoluntary: false,
    });
    expect(result.ryczaltHealthTierCrossedMonth).toBeNull();
  });

  it('ryczaltHealthTierCrossedMonth stays null for a B2B tax form other than ryczałt, even at high revenue', () => {
    const result = computeAnnualSalarySchedule('b2b', Array(12).fill(30000), {
      monthlyCosts: 0,
      taxForm: 'liniowy',
      ryczaltRate: 0.12,
      ipBoxSharePercent: 0,
      zusVariant: 'ulga_na_start',
      sicknessVoluntary: false,
    });
    expect(result.ryczaltHealthTierCrossedMonth).toBeNull();
  });

  it('ryczaltHealthTierCrossedMonth stays null for non-B2B contract types', () => {
    const result = computeAnnualSalarySchedule('employment', Array(12).fill(30000), {
      kup: 'standard',
      specialRelief: 'none',
      reducingShare: 'full',
      ppk: { mode: 'none' },
    });
    expect(result.ryczaltHealthTierCrossedMonth).toBeNull();
  });

  it(
    'regression: copyrightLimitCrossedMonth records the month the annual 50% copyright-cost limit ' +
      '(60 000 zł) is exhausted — previously untracked, so an employee with a high copyright share saw an ' +
      'unexplained net-pay drop on the annual chart with no annotation, the same class of bug as the ' +
      '120 000 zł threshold and the ZUS limit',
    () => {
      const result = computeAnnualSalarySchedule('employment', Array(12).fill(15000), {
        kup: 'standard',
        copyrightSharePercent: 100,
        specialRelief: 'none',
        reducingShare: 'full',
        ppk: { mode: 'none' },
      });
      // 0.5 * 15000 * 100% = 7500 zł/miesiąc kosztów autorskich; 60 000 / 7500 = 8 miesięcy.
      expect(result.copyrightLimitCrossedMonth).toBe(8);
    }
  );

  it('copyrightLimitCrossedMonth stays null when copyrightSharePercent is 0 or unset, even at high income', () => {
    const unset = computeAnnualSalarySchedule('employment', Array(12).fill(30000), {
      kup: 'standard',
      specialRelief: 'none',
      reducingShare: 'full',
      ppk: { mode: 'none' },
    });
    const explicitZero = computeAnnualSalarySchedule('employment', Array(12).fill(30000), {
      kup: 'standard',
      copyrightSharePercent: 0,
      specialRelief: 'none',
      reducingShare: 'full',
      ppk: { mode: 'none' },
    });
    expect(unset.copyrightLimitCrossedMonth).toBeNull();
    expect(explicitZero.copyrightLimitCrossedMonth).toBeNull();
  });

  it('copyrightLimitCrossedMonth stays null for B2B, which has no KUP concept at all', () => {
    const result = computeAnnualSalarySchedule('b2b', Array(12).fill(30000), {
      monthlyCosts: 0,
      taxForm: 'skala',
      ryczaltRate: 0.12,
      ipBoxSharePercent: 0,
      zusVariant: 'pelny',
      sicknessVoluntary: false,
    });
    expect(result.copyrightLimitCrossedMonth).toBeNull();
  });

  it(
    'regression: copyrightLimitCrossedMonth also tracks kup:\'copyright\' on a mandate (zlecenie) contract ' +
      'across the year — previously computeAnnualSalarySchedule only fed calcEmploymentContract\'s copyrightKup ' +
      'into priorCopyrightCostsUsed, so calcMandateContract never saw the accumulated usage and applied ' +
      'unlimited 50% KUP every month all year, regardless of the 60 000 zł annual cap',
    () => {
      const result = computeAnnualSalarySchedule('mandate', Array(12).fill(15000), {
        kup: 'copyright',
        specialRelief: 'none',
        reducingShare: 'full',
        isStudentUnder26: false,
        sicknessVoluntary: false,
      });
      expect(result.copyrightLimitCrossedMonth).not.toBeNull();
      // Po wyczerpaniu limitu net powinno spaść (wyższy dochód do opodatkowania).
      const crossMonth = result.copyrightLimitCrossedMonth!;
      if (crossMonth < 12) {
        expect(result.months[crossMonth]!.tax).toBeGreaterThan(result.months[0]!.tax);
      }
    }
  );

  it('copyrightLimitCrossedMonth stays null for a mandate contract using standard (20%) KUP, even at high income', () => {
    const result = computeAnnualSalarySchedule('mandate', Array(12).fill(30000), {
      kup: 'standard',
      specialRelief: 'none',
      reducingShare: 'full',
      isStudentUnder26: false,
      sicknessVoluntary: false,
    });
    expect(result.copyrightLimitCrossedMonth).toBeNull();
  });

  it('copyrightLimitCrossedMonth also tracks kup:\'copyright\' on a specific_work (dzieło) contract across the year', () => {
    const result = computeAnnualSalarySchedule('specific_work', Array(12).fill(15000), {
      kup: 'copyright',
      reducingShare: 'full',
    });
    expect(result.copyrightLimitCrossedMonth).not.toBeNull();
  });

  it('totalNet equals the sum of each month\'s net pay', () => {
    const result = computeAnnualSalarySchedule('mandate', Array(12).fill(4000), {
      kup: 'standard',
      specialRelief: 'none',
      reducingShare: 'full',
      isStudentUnder26: false,
      sicknessVoluntary: true,
    });
    const manualSum = Math.round(result.months.reduce((s, m) => s + m.net, 0) * 100) / 100;
    expect(result.totalNet).toBeCloseTo(manualSum, 2);
  });
});

describe('calcEmploymentContract — copyright costs (50% koszty autorskie)', () => {
  it('50% share on half the salary adds copyright KUP on top of the standard KUP, lowering tax vs no copyright share', () => {
    const none = calcEmploymentContract({ ...employmentDefaults, copyrightSharePercent: 0 });
    const half = calcEmploymentContract({ ...employmentDefaults, copyrightSharePercent: 50 });
    // 50% udziału z 8000 zł brutto = 4000 zł objęte prawami, 50% z tego = 2000 zł kosztów autorskich.
    expect(half.copyrightKup).toBeCloseTo(0.5 * 8000 * 0.5, 2);
    expect(none.copyrightKup).toBe(0);
    expect(half.tax).toBeLessThan(none.tax);
    expect(half.net).toBeGreaterThan(none.net);
  });

  it(
    'regression: caps copyright KUP at the remaining room under the annual 60 000 zł limit — a full ' +
      '100% copyright share on a high salary must not exceed the room left after most of the annual ' +
      'limit was already used earlier in the year',
    () => {
      const ctx = {
        priorTaxableIncome: 0, priorReliefUsed: 0, priorPensionBase: 0, priorFlatRevenue: 0,
        priorCopyrightCostsUsed: ANNUAL_COPYRIGHT_KUP_LIMIT - 1000,
      };
      const r = calcEmploymentContract({ ...employmentDefaults, copyrightSharePercent: 100 }, ctx);
      // Bez limitu 50% z 8000 = 4000 zł kosztów — ale w tym roku pozostało tylko 1000 zł miejsca.
      expect(r.copyrightKup).toBe(1000);
    }
  );

  it('zero or unset copyrightSharePercent yields zero copyright KUP, matching the pre-existing behaviour', () => {
    const unset = calcEmploymentContract(employmentDefaults);
    const explicitZero = calcEmploymentContract({ ...employmentDefaults, copyrightSharePercent: 0 });
    expect(unset.copyrightKup).toBe(0);
    expect(explicitZero.copyrightKup).toBe(0);
    expect(unset.net).toBeCloseTo(explicitZero.net, 2);
  });
});

describe('calcEmploymentContract — premia (bonusMonthly)', () => {
  it('splits grossMonthly into baseGross + bonusGross, summing back to the same total', () => {
    const r = calcEmploymentContract({ ...employmentDefaults, grossMonthly: 6000, bonusMonthly: 2000 });
    expect(r.baseGross).toBe(6000);
    expect(r.bonusGross).toBe(2000);
    expect(r.grossMonthly).toBe(8000);
  });

  it('a bonus produces the exact same result as an equivalent plain increase in gross (same total taxed/contributed identically)', () => {
    const withBonus = calcEmploymentContract({ ...employmentDefaults, grossMonthly: 6000, bonusMonthly: 2000 });
    const plainGross = calcEmploymentContract({ ...employmentDefaults, grossMonthly: 8000 });
    expect(withBonus.net).toBeCloseTo(plainGross.net, 2);
    expect(withBonus.tax).toBeCloseTo(plainGross.tax, 2);
    expect(withBonus.employeeSocialTotal).toBeCloseTo(plainGross.employeeSocialTotal, 2);
  });
});

describe('computeJointTaxation', () => {
  it('yields a positive tax saving when incomes are very unequal (one spouse earns much more)', () => {
    const r = computeJointTaxation(200_000, 0, 3600);
    expect(r.taxSavingsVsSeparate).toBeGreaterThan(0);
  });

  it('yields (near) zero saving when both spouses earn the same amount', () => {
    const r = computeJointTaxation(100_000, 100_000, 3600);
    expect(r.taxSavingsVsSeparate).toBeCloseTo(0, 0);
  });

  it('handles a spouse with zero income (joint tax still computed from the combined total)', () => {
    const r = computeJointTaxation(150_000, 0, 3600);
    expect(r.jointTax).toBeGreaterThan(0);
    expect(r.spouseShareTax).toBeGreaterThanOrEqual(0);
    expect(r.taxSavingsVsSeparate).toBeGreaterThan(0);
  });

  it('sanity check: ownShareTax + spouseShareTax equals jointTax (proportional split of the combined bill)', () => {
    const r = computeJointTaxation(180_000, 60_000, 3600);
    expect(r.ownShareTax + r.spouseShareTax).toBeCloseTo(r.jointTax, 2);
  });
});
