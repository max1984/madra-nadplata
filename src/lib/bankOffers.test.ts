import { describe, it, expect } from 'vitest';
import { isOfferValid, activeSortedOffers, offerInterestDiff } from './bankOffers';
import { buildBaseSchedule } from './mortgage';
import type { BankOffer } from '../config/bankOffers';

function makeOffer(overrides: Partial<BankOffer> = {}): BankOffer {
  return {
    id: 'test', bank: 'Test Bank', rate: 6.5, validUntil: '2026-12-31', note: '',
    ...overrides,
  };
}

describe('isOfferValid', () => {
  it('is true when validUntil is in the future', () => {
    expect(isOfferValid(makeOffer({ validUntil: '2099-01-01' }), new Date(2026, 0, 1))).toBe(true);
  });

  it('is false when validUntil is in the past', () => {
    expect(isOfferValid(makeOffer({ validUntil: '2020-01-01' }), new Date(2026, 0, 1))).toBe(false);
  });

  it('regression: is still true on the validUntil day itself — an offer "valid until Jan 31" should not disappear at midnight of Jan 31, only after it ends', () => {
    const offer = makeOffer({ validUntil: '2026-01-31' });
    expect(isOfferValid(offer, new Date(2026, 0, 31, 8, 0))).toBe(true);
    expect(isOfferValid(offer, new Date(2026, 1, 1, 0, 0, 1))).toBe(false);
  });
});

describe('activeSortedOffers', () => {
  const today = new Date(2026, 0, 1);

  it('filters out expired offers', () => {
    const offers = [
      makeOffer({ id: 'a', validUntil: '2020-01-01' }),
      makeOffer({ id: 'b', validUntil: '2099-01-01' }),
    ];
    expect(activeSortedOffers(offers, today).map((o) => o.id)).toEqual(['b']);
  });

  it('sorts remaining offers by ascending interest rate', () => {
    const offers = [
      makeOffer({ id: 'high', rate: 7.5, validUntil: '2099-01-01' }),
      makeOffer({ id: 'low', rate: 6.1, validUntil: '2099-01-01' }),
      makeOffer({ id: 'mid', rate: 6.8, validUntil: '2099-01-01' }),
    ];
    expect(activeSortedOffers(offers, today).map((o) => o.id)).toEqual(['low', 'mid', 'high']);
  });

  it('returns an empty array for an empty input', () => {
    expect(activeSortedOffers([], today)).toEqual([]);
  });
});

describe('offerInterestDiff', () => {
  it('is negative (better) when the offer rate is lower than the reference schedule', () => {
    const P = 300000, months = 360;
    const highRateInterest = 400000; // stand-in for "current" total interest at a higher rate
    const diff = offerInterestDiff(makeOffer({ rate: 6 }), P, months, highRateInterest);
    expect(diff).toBeLessThan(0);
  });

  it('is positive (worse) when the offer rate is higher than the reference schedule', () => {
    const P = 300000, months = 360;
    const lowRateInterest = 50000; // stand-in for "current" total interest at a much lower rate
    const diff = offerInterestDiff(makeOffer({ rate: 9 }), P, months, lowRateInterest);
    expect(diff).toBeGreaterThan(0);
  });

  it('is zero when compared against its own resulting total interest', () => {
    const P = 300000, months = 360, rate = 6.5;
    const r = rate / 100 / 12;
    const own = buildBaseSchedule(P, Array(months).fill(r), months, r).totalInterest;
    expect(offerInterestDiff(makeOffer({ rate }), P, months, own)).toBeCloseTo(0, 6);
  });
});
