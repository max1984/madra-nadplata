// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LangProvider } from '../../contexts/LangContext';
import { useSalaryCalculator, DEFAULT_SALARY_INPUTS } from '../../hooks/useSalaryCalculator';
import SalaryCalculator from './SalaryCalculator';

afterEach(() => {
  cleanup();
  // useSalaryCalculator() seeds its initial calcState from the URL query
  // string, falling back to localStorage (persistSalaryInputs, called on
  // every "Oblicz") when the URL is empty — both survive across tests in
  // this file (cleanup() only unmounts React; jsdom's location/history and
  // the in-memory localStorage polyfill from src/test/setup.ts are shared
  // module-level state for the whole file). Without resetting both, a test
  // that calculates a result leaks its inputs into the next test's fresh
  // mount, which then starts with a populated calcState instead of null.
  window.history.replaceState(null, '', '/');
  localStorage.clear();
});

function Harness() {
  const {
    inputs, setInputs, calcState, calcError, calculate, isStale, resetToDefaults,
    scenarios, scenarioSaveError, scenarioLimitReached,
    saveCurrentAsScenario, loadScenario, deleteScenario, renameScenarioById, duplicateScenarioById, importScenarios,
  } = useSalaryCalculator();
  return (
    <SalaryCalculator
      inputs={inputs}
      setInputs={setInputs}
      calcState={calcState}
      calcError={calcError}
      onCalculate={calculate}
      onResetToDefaults={resetToDefaults}
      isStale={isStale}
      scenarios={scenarios}
      scenarioSaveError={scenarioSaveError}
      scenarioLimitReached={scenarioLimitReached}
      onSaveScenario={saveCurrentAsScenario}
      onLoadScenario={loadScenario}
      onDeleteScenario={deleteScenario}
      onRenameScenario={renameScenarioById}
      onDuplicateScenario={duplicateScenarioById}
      onImportScenarios={importScenarios}
    />
  );
}

function renderSalaryCalculator() {
  return render(
    <LangProvider>
      <Harness />
    </LangProvider>
  );
}

describe('SalaryCalculator keyboard shortcut discoverability (render)', () => {
  it(
    'regression: the "Oblicz" button has a title tooltip mentioning Ctrl+Enter — the Ctrl/Cmd+Enter shortcut ' +
      '(isCalculateShortcut) worked but was never surfaced anywhere in the UI, so a user had no way to discover it',
    () => {
      renderSalaryCalculator();
      const btn = screen.getByRole('button', { name: /oblicz/i });
      expect(btn.getAttribute('title')).toMatch(/ctrl/i);
    }
  );
});

describe('SalaryCalculator custom PPK rate inputs (render)', () => {
  it(
    'regression: selecting "Niestandardowo" PPK reveals employee/employer rate inputs — previously the dropdown ' +
      'had a "custom" option but no way to actually enter custom rates, so it silently produced the exact same ' +
      '2%/1.5% result as "Standardowo" (ppkRates() already supported custom rates, the UI just never exposed them)',
    async () => {
      const user = userEvent.setup();
      renderSalaryCalculator();
      await user.click(screen.getByRole('button', { name: /opcje zaawansowane/i }));

      expect(document.getElementById('emp-ppk-employee-rate')).not.toBeInTheDocument();
      await user.selectOptions(document.getElementById('emp-ppk') as HTMLSelectElement, 'custom');

      const employeeInput = document.getElementById('emp-ppk-employee-rate') as HTMLInputElement;
      const employerInput = document.getElementById('emp-ppk-employer-rate') as HTMLInputElement;
      expect(employeeInput).toBeInTheDocument();
      expect(employerInput).toBeInTheDocument();
    }
  );

  it('clamps the employee rate to [0.5, 4] and the employer rate to [1.5, 4] on blur, matching ppkRates()', async () => {
    const user = userEvent.setup();
    renderSalaryCalculator();
    await user.click(screen.getByRole('button', { name: /opcje zaawansowane/i }));
    await user.selectOptions(document.getElementById('emp-ppk') as HTMLSelectElement, 'custom');

    const employeeInput = document.getElementById('emp-ppk-employee-rate') as HTMLInputElement;
    await user.clear(employeeInput);
    await user.type(employeeInput, '10');
    await user.tab();
    expect(Number(employeeInput.value)).toBe(4);

    await user.clear(employeeInput);
    await user.type(employeeInput, '0.1');
    await user.tab();
    expect(Number(employeeInput.value)).toBe(0.5);

    const employerInput = document.getElementById('emp-ppk-employer-rate') as HTMLInputElement;
    await user.clear(employerInput);
    await user.type(employerInput, '0.2');
    await user.tab();
    expect(Number(employerInput.value)).toBe(1.5);
  });
});

describe('SalaryCalculator hourly-rate helper (render)', () => {
  it(
    'regression: entering an hourly rate and hours/month and clicking "Zastosuj" fills the monthly gross field ' +
      'on the mandate tab — grossFromHourlyRate and MIN_WAGE_HOURLY existed in salary.ts since the calculator\'s ' +
      'first commit but were never wired into any UI, so this conversion was previously impossible to use',
    async () => {
      const user = userEvent.setup();
      renderSalaryCalculator();
      await user.click(screen.getByRole('button', { name: /^umowa zlecenie$/i }));

      await user.type(screen.getByRole('spinbutton', { name: /stawka godzinowa/i }), '50');
      await user.type(screen.getByRole('spinbutton', { name: /liczba godzin/i }), '160');
      // Mandate tab also shows the "chcę mieć na rękę" widget, which has its own
      // "Zastosuj" button — the hourly-rate one renders first in DOM order.
      await user.click(screen.getAllByRole('button', { name: /zastosuj/i })[0]!);

      const amountInput = document.getElementById('salary-amount') as HTMLInputElement;
      expect(Number(amountInput.value)).toBe(8000);
    }
  );

  it('warns when the entered hourly rate is below the statutory minimum (31.40 zł/h in 2026)', async () => {
    const user = userEvent.setup();
    renderSalaryCalculator();
    await user.click(screen.getByRole('button', { name: /^umowa zlecenie$/i }));

    expect(screen.queryByText(/minimalna stawka godzinowa/i)).not.toBeInTheDocument();
    await user.type(screen.getByRole('spinbutton', { name: /stawka godzinowa/i }), '20');
    expect(screen.getByText(/minimalna stawka godzinowa/i)).toBeInTheDocument();
  });

  it('the "Zastosuj" button stays disabled until both rate and hours are entered', async () => {
    const user = userEvent.setup();
    renderSalaryCalculator();
    await user.click(screen.getByRole('button', { name: /^umowa zlecenie$/i }));
    const hourlyApplyBtn = () => screen.getAllByRole('button', { name: /zastosuj/i })[0]!;

    expect(hourlyApplyBtn()).toBeDisabled();
    await user.type(screen.getByRole('spinbutton', { name: /stawka godzinowa/i }), '50');
    expect(hourlyApplyBtn()).toBeDisabled();
    await user.type(screen.getByRole('spinbutton', { name: /liczba godzin/i }), '160');
    expect(hourlyApplyBtn()).not.toBeDisabled();
  });

  it('the hourly-rate helper does not appear for other contract types (employment, dzieło, B2B)', async () => {
    renderSalaryCalculator();
    expect(screen.queryByRole('spinbutton', { name: /stawka godzinowa/i })).not.toBeInTheDocument();
  });
});

describe('SalaryCalculator daily-rate helper (render)', () => {
  it(
    'regression: entering a daily rate and days/month and clicking "Zastosuj" fills the monthly gross field on ' +
      'the dzieło tab — grossFromDailyRate existed in salary.ts since the calculator\'s first commit but was ' +
      'never wired into any UI, so this conversion was previously impossible to use',
    async () => {
      const user = userEvent.setup();
      renderSalaryCalculator();
      await user.click(screen.getByRole('button', { name: /umowa o dzieło/i }));

      await user.type(screen.getByRole('spinbutton', { name: /stawka dzienna/i }), '300');
      await user.type(screen.getByRole('spinbutton', { name: /liczba dni/i }), '21');
      // Zakładka dzieło pokazuje też widget kwoty docelowej — stawka dzienna
      // renderuje się jako pierwsza z nich.
      await user.click(screen.getAllByRole('button', { name: /zastosuj/i })[0]!);

      const amountInput = document.getElementById('salary-amount') as HTMLInputElement;
      expect(Number(amountInput.value)).toBe(6300);
    }
  );

  it('the daily-rate helper does not appear for employment or mandate contracts', async () => {
    const user = userEvent.setup();
    renderSalaryCalculator();
    expect(screen.queryByRole('spinbutton', { name: /stawka dzienna/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^umowa zlecenie$/i }));
    expect(screen.queryByRole('spinbutton', { name: /stawka dzienna/i })).not.toBeInTheDocument();
  });

  it(
    'the daily-rate helper also applies to B2B (revenue field), since day-rate billing is common for ' +
      'freelance/contract work invoiced through a JDG',
    async () => {
      const user = userEvent.setup();
      renderSalaryCalculator();
      await user.click(screen.getByRole('button', { name: /^b2b$/i }));

      await user.type(screen.getByRole('spinbutton', { name: /stawka dzienna/i }), '800');
      await user.type(screen.getByRole('spinbutton', { name: /liczba dni/i }), '18');
      // Zakładka B2B pokazuje też widget kwoty docelowej — stawka dzienna
      // renderuje się jako pierwsza z nich.
      await user.click(screen.getAllByRole('button', { name: /zastosuj/i })[0]!);

      const amountInput = document.getElementById('salary-amount') as HTMLInputElement;
      expect(Number(amountInput.value)).toBe(14400);
    }
  );
});

describe('SalaryCalculator target-net-to-gross helper (render)', () => {
  it(
    'regression: entering a target take-home amount and clicking "Zastosuj" fills the monthly gross field on ' +
      'the employment tab so the resulting net matches the target — solveEmploymentGrossForNet existed only ' +
      'as a pure function with no UI, so "chcę mieć na rękę X" was previously impossible to answer directly',
    async () => {
      const user = userEvent.setup();
      renderSalaryCalculator();

      await user.type(screen.getByRole('spinbutton', { name: /chcesz mieć konkretną kwotę/i }), '5000');
      await user.click(screen.getByRole('button', { name: /zastosuj/i }));

      const amountInput = document.getElementById('salary-amount') as HTMLInputElement;
      expect(Number(amountInput.value)).toBeGreaterThan(5000);
    }
  );

  it('also appears on the mandate tab, alongside the hourly-rate helper', async () => {
    const user = userEvent.setup();
    renderSalaryCalculator();
    await user.click(screen.getByRole('button', { name: /^umowa zlecenie$/i }));
    expect(screen.getByRole('spinbutton', { name: /chcesz mieć konkretną kwotę/i })).toBeInTheDocument();
  });

  it(
    'also applies to dzieło (solveSpecificWorkGrossForNet) and B2B revenue (solveB2BRevenueForNet) — net is ' +
      'still a well-defined, monotonic function of the primary amount for both, just via a different tax path',
    async () => {
      const user = userEvent.setup();
      renderSalaryCalculator();

      // Zakładki dzieło i B2B pokazują też widget stawki dziennej — każdy ma
      // własny przycisk "Zastosuj"; ten od kwoty docelowej renderuje się jako
      // ostatni z nich w kolejności DOM.
      const lastApplyBtn = () => {
        const buttons = screen.getAllByRole('button', { name: /zastosuj/i });
        return buttons[buttons.length - 1]!;
      };

      await user.click(screen.getByRole('button', { name: /umowa o dzieło/i }));
      await user.type(screen.getByRole('spinbutton', { name: /chcesz mieć konkretną kwotę/i }), '4000');
      await user.click(lastApplyBtn());
      const swAmount = document.getElementById('salary-amount') as HTMLInputElement;
      expect(Number(swAmount.value)).toBeGreaterThan(4000);

      await user.click(screen.getByRole('button', { name: /^b2b$/i }));
      await user.type(screen.getByRole('spinbutton', { name: /chcesz mieć konkretną kwotę/i }), '6000');
      await user.click(lastApplyBtn());
      const b2bAmount = document.getElementById('salary-amount') as HTMLInputElement;
      expect(Number(b2bAmount.value)).toBeGreaterThan(6000);
    }
  );
});

describe('SalaryCalculator copyright KUP annual limit hint (render)', () => {
  it(
    'regression: selecting copyright (50%) KUP on a mandate contract shows a hint about the 60 000 zł annual ' +
      'limit — this was the flip side of a real bug (calcMandateContract previously ignored this limit entirely, ' +
      'fixed separately); the hint makes the limit visible before the user hits it',
    async () => {
      const user = userEvent.setup();
      renderSalaryCalculator();
      await user.click(screen.getByRole('button', { name: /^umowa zlecenie$/i }));
      await user.click(screen.getByRole('button', { name: /opcje zaawansowane/i }));

      expect(screen.queryByText(/roczny limit 60 000 zł/i)).not.toBeInTheDocument();
      await user.selectOptions(document.getElementById('mnd-kup') as HTMLSelectElement, 'copyright');
      expect(screen.getByText(/roczny limit 60 000 zł/i)).toBeInTheDocument();
    }
  );
});

describe('SalaryCalculator Mały ZUS Plus base clamping (render)', () => {
  it(
    'regression: a malyZusPlusBase value outside the statutory range [1441.80, 5652.20] is clamped on blur ' +
      'instead of accepted verbatim — previously only base <= 0 was rejected, so e.g. 50000 zł (far above the ' +
      'legal maximum) was silently accepted and fed into the ZUS calculation',
    async () => {
      const user = userEvent.setup();
      renderSalaryCalculator();

      await user.click(screen.getByRole('button', { name: /^b2b$/i }));
      await user.selectOptions(document.getElementById('b2b-zus') as HTMLSelectElement, 'maly_zus_plus');

      const input = document.getElementById('b2b-maly-zus-base') as HTMLInputElement;
      await user.clear(input);
      await user.type(input, '50000');
      await user.tab();
      expect(Number(input.value)).toBe(5652.2);

      await user.clear(input);
      await user.type(input, '100');
      await user.tab();
      expect(Number(input.value)).toBe(1441.8);
    }
  );
});

describe('SalaryCalculator auto-scroll to results (render)', () => {
  it(
    'regression: scrolls the results section into view after the first successful calculation, matching the ' +
      'mortgage calculator (Calculator.tsx) — salary previously left the user to scroll down manually past the ' +
      'whole form to see the result',
    async () => {
      const scrollSpy = vi.spyOn(window.HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
      const user = userEvent.setup();
      renderSalaryCalculator();
      expect(scrollSpy).not.toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: /oblicz/i }));
      expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
      scrollSpy.mockRestore();
    }
  );
});

describe('SalaryCalculator print button (render)', () => {
  it('regression: a "Drukuj / Zapisz PDF" button appears once a result exists, matching the mortgage and creditworthiness calculators — the salary calculator previously had no print/PDF export at all', async () => {
    const user = userEvent.setup();
    renderSalaryCalculator();
    expect(screen.queryByRole('button', { name: /drukuj/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /oblicz/i }));
    expect(screen.getByRole('button', { name: /drukuj/i })).toBeInTheDocument();
  });
});

describe('SalaryCalculator CSV export button (render)', () => {
  it(
    'regression: a "Pobierz CSV" button appears only in annual mode, once a result exists — the annual chart ' +
      'shows net pay per month visually but there was no way to read exact figures or paste them into a ' +
      'spreadsheet, unlike the mortgage schedule which has had CSV export for a while',
    async () => {
      const user = userEvent.setup();
      renderSalaryCalculator();

      await user.click(screen.getByRole('button', { name: /oblicz/i }));
      expect(screen.queryByRole('button', { name: /pobierz csv/i })).not.toBeInTheDocument();

      await user.click(screen.getByRole('checkbox', { name: /rozliczenie roczne/i }));
      await user.click(screen.getByRole('button', { name: /oblicz/i }));
      expect(screen.getByRole('button', { name: /pobierz csv/i })).toBeInTheDocument();
    }
  );
});

describe('SalaryCalculator copy link/summary buttons (render)', () => {
  it('regression: "Kopiuj link" and "Kopiuj podsumowanie" buttons appear once a result exists — the salary calculator previously had neither, unlike the mortgage and creditworthiness calculators', async () => {
    const user = userEvent.setup();
    renderSalaryCalculator();
    await user.click(screen.getByRole('button', { name: /oblicz/i }));

    expect(screen.getByRole('button', { name: /kopiuj link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /kopiuj podsumowanie/i })).toBeInTheDocument();
  });
});

describe('SalaryCalculator Ctrl+Enter shortcut (render)', () => {
  // Minimalny harness z mockiem onCalculate zamiast prawdziwego hooka —
  // useSalaryCalculator persystuje wynik w localStorage/URL po każdym
  // przeliczeniu, więc kolejny test montujący prawdziwy hook od razu
  // widziałby wynik z poprzedniego testu w tym pliku (fałszywy "przycisk
  // już był"). Mock izoluje test do samego okablowania skrótu klawiszowego.
  function renderWithMockCalculate(onCalculate: () => void) {
    return render(
      <LangProvider>
        <SalaryCalculator
          inputs={DEFAULT_SALARY_INPUTS}
          setInputs={() => {}}
          calcState={null}
          calcError={null}
          onCalculate={onCalculate}
          onResetToDefaults={() => {}}
          isStale={false}
        />
      </LangProvider>
    );
  }

  it('regression: Ctrl+Enter calls onCalculate from anywhere on the page, matching the mortgage calculator — salary previously had no keyboard shortcut at all', async () => {
    const onCalculate = vi.fn();
    const user = userEvent.setup();
    renderWithMockCalculate(onCalculate);

    await user.keyboard('{Control>}{Enter}{/Control}');
    // Handler woła onCalculate przez setTimeout(…, 0) (patrz komentarz w
    // SalaryCalculator.tsx), więc wywołanie ląduje w kolejce mikrotask/task
    // po tym await — waitFor odpytuje zamiast zakładać synchroniczność.
    await waitFor(() => expect(onCalculate).toHaveBeenCalledTimes(1));
  });

  it('plain Enter (no modifier) does not trigger onCalculate — that key is already used per-field to commit/blur a single input', async () => {
    const onCalculate = vi.fn();
    const user = userEvent.setup();
    renderWithMockCalculate(onCalculate);

    await user.keyboard('{Enter}');
    await new Promise((r) => setTimeout(r, 10));
    expect(onCalculate).not.toHaveBeenCalled();
  });
});
