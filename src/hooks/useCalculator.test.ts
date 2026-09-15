import { describe, it, expect } from 'vitest';
import { parseUrlInputs, validateInputs, DEFAULT_INPUTS } from './useCalculator';

describe('parseUrlInputs', () => {
  it('parses valid numeric params', () => {
    const patch = parseUrlInputs('?amount=250000&rate=7.5&months=240');
    expect(patch).toEqual({ loanAmount: 250000, interestRate: 7.5, loanMonths: 240 });
  });

  it('ignores non-numeric or non-finite values instead of producing NaN', () => {
    const patch = parseUrlInputs('?amount=abc&rate=Infinity&fee=-NaN&months=180');
    expect(patch).toEqual({ loanMonths: 180 });
    expect(patch.loanAmount).toBeUndefined();
    expect(patch.interestRate).toBeUndefined();
    expect(patch.prepayFee).toBeUndefined();
  });

  it('ignores an unknown strategy value', () => {
    const patch = parseUrlInputs('?strategy=made_up');
    expect(patch.strategy).toBeUndefined();
  });

  it('maps the legacy reduce_payment strategy to fixed_total', () => {
    const patch = parseUrlInputs('?strategy=reduce_payment');
    expect(patch.strategy).toBe('fixed_total');
  });

  it('returns an empty patch for an empty query string', () => {
    expect(parseUrlInputs('')).toEqual({});
  });
});

describe('validateInputs', () => {
  it('accepts the default inputs', () => {
    expect(validateInputs(DEFAULT_INPUTS)).toBeNull();
  });

  it('rejects an out-of-range prepayment fee — a shared link could set ?fee=999 unchecked', () => {
    expect(validateInputs({ ...DEFAULT_INPUTS, prepayFee: 999 })).toBe('error_prepay_fee');
    expect(validateInputs({ ...DEFAULT_INPUTS, prepayFee: -1 })).toBe('error_prepay_fee');
    expect(validateInputs({ ...DEFAULT_INPUTS, prepayFee: 0 })).toBeNull();
    expect(validateInputs({ ...DEFAULT_INPUTS, prepayFee: 5 })).toBeNull();
  });
});
