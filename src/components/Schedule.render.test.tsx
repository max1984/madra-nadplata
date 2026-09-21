// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LangProvider } from '../contexts/LangContext';
import { useCalculator } from '../hooks/useCalculator';
import Schedule from './Schedule';

afterEach(cleanup);

/**
 * Harness z prawdziwym useCalculator() (jak Calculator.render.test.tsx) —
 * Schedule.tsx renderuje realny harmonogram (do 360 wierszy), którego nie
 * da się sensownie zamockować bez powielenia sporej części computeCalcState.
 * onOverpayChange/onRateChange owinięte w vi.fn(realHandler) — test widzi
 * prawdziwe zachowanie integracyjne, ale też asercje na to, z czym hook
 * został wywołany.
 */
function Harness({ onOverpaySpy, onRateSpy }: { onOverpaySpy: (idx: number, value: string) => void; onRateSpy: (idx: number, value: string) => void }) {
  const {
    inputs, calcState, calculate,
    onOverpayChange, onRateChange, onCustomEffectChange, onRowEffectChange,
    resetOverpays, clearOverpays, resetRates,
  } = useCalculator();

  return (
    <>
      <button type="button" onClick={calculate}>Oblicz (test)</button>
      <Schedule
        calcState={calcState}
        onOverpayChange={(idx, value) => { onOverpaySpy(idx, value); onOverpayChange(idx, value); }}
        onRateChange={(idx, value) => { onRateSpy(idx, value); onRateChange(idx, value); }}
        onCustomEffectChange={onCustomEffectChange}
        onRowEffectChange={onRowEffectChange}
        onResetOverpays={resetOverpays}
        onClearOverpays={clearOverpays}
        onResetRates={resetRates}
      />
      <span data-testid="strategy">{inputs.strategy}</span>
    </>
  );
}

function renderSchedule() {
  const onOverpaySpy = vi.fn();
  const onRateSpy = vi.fn();
  const utils = render(
    <LangProvider>
      <Harness onOverpaySpy={onOverpaySpy} onRateSpy={onRateSpy} />
    </LangProvider>
  );
  return { ...utils, onOverpaySpy, onRateSpy };
}

describe('Schedule row editing (render)', () => {
  it('regression: editing the first row\'s overpay field on blur calls onOverpayChange(0, value) — the harmonogram table previously had zero render-test coverage of this interaction', async () => {
    const user = userEvent.setup();
    const { onOverpaySpy } = renderSchedule();

    await user.click(screen.getByRole('button', { name: /oblicz \(test\)/i }));
    await waitFor(() => expect(document.getElementById('sch-row-1')).not.toBeNull());
    const row = document.getElementById('sch-row-1')!;
    const overpayInput = row.querySelector<HTMLInputElement>('.overpay-input')!;
    expect(overpayInput).toBeTruthy();

    await user.clear(overpayInput);
    await user.type(overpayInput, '500');
    await user.tab();

    expect(onOverpaySpy).toHaveBeenCalledWith(0, '500');
  });

  it('regression: editing the first row\'s rate field on blur calls onRateChange(0, value)', async () => {
    const user = userEvent.setup();
    const { onRateSpy } = renderSchedule();

    await user.click(screen.getByRole('button', { name: /oblicz \(test\)/i }));
    await waitFor(() => expect(document.getElementById('sch-row-1')).not.toBeNull());
    const row = document.getElementById('sch-row-1')!;
    const rateInput = row.querySelector<HTMLInputElement>('.rate-input')!;
    expect(rateInput).toBeTruthy();

    await user.clear(rateInput);
    await user.type(rateInput, '7,5');
    await user.tab();

    expect(onRateSpy).toHaveBeenCalledWith(0, '7,5');
  });
});
