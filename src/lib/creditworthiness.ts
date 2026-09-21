/**
 * Kalkulator zdolności kredytowej — szacunek maksymalnej kwoty kredytu
 * hipotecznego wg metodologii Rekomendacji S KNF (DSTI, bufor ostrożnościowy
 * na wzrost stóp, koszty utrzymania gospodarstwa domowego). To orientacyjne
 * wyliczenie własne, nie wiążąca decyzja banku — każdy bank stosuje swoje
 * normy kosztów utrzymania i własną interpretację Rekomendacji S w
 * dopuszczalnych przez nią granicach.
 *
 * Stawki i progi poniżej — źródła: Rekomendacja S KNF, nowelizacja przyjęta
 * 19.06.2023 (termin dostosowania banków: 1.07.2024) — wprowadziła DSTI
 * (zamiast DTI) z progami ostrożności 40%/50% wg dochodu oraz bufor na
 * wzrost stóp min. 2,5 p.p. dla kredytów okresowo stałych, wyższy dla
 * zmiennych (knf.gov.pl/komunikacja/komunikaty?articleId=82735&p_id=18).
 * UWAGA: wcześniejsza wersja tego komentarza błędnie datowała nowelizację
 * na 19.06.2026 — źródła KNF nie potwierdzają nowelizacji z tą datą, to była
 * pomyłka (prawdopodobnie przesunięcie roku przy zachowaniu dnia/miesiąca
 * prawdziwej nowelizacji z 2023). Skorygowano po weryfikacji WebSearch
 * 2026-09-21. GUS: przeciętne wynagrodzenie w gospodarce narodowej, II
 * kwartał 2026: 9233,13 zł brutto (do zweryfikowania przy każdej aktualizacji
 * — patrz docs/WERYFIKACJA-STALYCH-2026.md).
 */

// --------------------------------------------------------------- stałe ---

/**
 * GUS, II kwartał 2026. DSTI porównuje się z dochodem NETTO wnioskodawcy,
 * więc potrzebny jest odpowiednik netto tej kwoty brutto — przeliczony tu
 * tą samą metodologią co `src/lib/salary.ts` (umowa o pracę, standardowe
 * KUP 250 zł, pełne PIT-2, bez ulg): 9233 - 13,71% ZUS (1266,05) - 9%
 * zdrowotna od podstawy po ZUS (717,03) - 12% podatek od (9233-1266,05-250)
 * minus 300 zł PIT-2 (626,03) = ok. 6624 zł netto. To przybliżenie (osoba o
 * przeciętnym wynagrodzeniu może mieć inny typ umowy/ulgi), skomentowane
 * jawnie zamiast szukać jednej "oficjalnej" kwoty netto, której GUS nie
 * publikuje wprost.
 */
export const AVERAGE_NATIONAL_WAGE_GROSS_2026 = 9233;
export const AVERAGE_NATIONAL_WAGE_NET_2026 = 6624;

export const DSTI_THRESHOLD_LOW = 0.4; // dochód ≤ przeciętne wynagrodzenie
export const DSTI_THRESHOLD_HIGH = 0.5; // dochód > przeciętne wynagrodzenie

// Rekomendacja S KNF (nowelizacja 19.06.2023, patrz komentarz na górze pliku)
// — minimalny bufor 2,5 p.p. dla kredytów o oprocentowaniu okresowo stałym;
// dla zmiennego bank ma stosować poziom "adekwatnie wyższy" bez wskazanej
// liczby (przyjęto tu 5 p.p. jako orientacyjny punkt startowy — banki
// stosują własne warianty w tych granicach).
export const BUFFER_FIXED_RATE_PP = 2.5;
export const BUFFER_VARIABLE_RATE_PP = 5;

// Orientacyjne normy kosztów utrzymania — każdy bank ma własne, te służą
// jako rozsądny punkt startowy, w pełni edytowalny w UI.
export const DEFAULT_FIRST_PERSON_COST = 1800;
export const DEFAULT_ADDITIONAL_PERSON_COST = 700;

// Standardowa metodologia bankowa: niewykorzystany limit karty/konta liczy
// się jako potencjalne miesięczne obciążenie w wysokości 5% limitu.
export const CREDIT_CARD_LIMIT_MONTHLY_RATE = 0.05;

// Bank nigdy nie zaokrągla oszacowania kwoty kredytu w górę.
const LOAN_AMOUNT_ROUNDING_STEP = 100;

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

// --------------------------------------------------------------- typy ---

export type CreditworthinessContractType = 'employment' | 'b2b' | 'mandate_or_specific_work';
export type CreditRateType = 'fixed' | 'variable';

export interface CreditworthinessInputs {
  netIncome: number;
  contractType: CreditworthinessContractType;
  /**
   * 0-100, procent dochodu uznawany przez bank. Ignorowane dla 'employment'
   * (bank zawsze uznaje 100% udokumentowanej umowy o pracę) — pole istnieje
   * na obu typach, żeby UI mogło pokazać/ukryć suwak bez zmiany kształtu
   * stanu formularza przy przełączaniu zakładek.
   */
  incomeRecognitionRate: number;
  householdSize: number; // >= 1
  firstPersonCost: number;
  additionalPersonCost: number;
  existingLoanInstallments: number;
  creditCardLimits: number;
  alimony: number;
  years: number;
  nominalRatePercent: number;
  rateType: CreditRateType;
}

export interface CreditworthinessResult {
  recognizedIncome: number;
  householdCost: number;
  otherCommitments: number;
  disposableIncome: number;
  dstiThreshold: number; // 0.4 albo 0.5 — zastosowany próg
  maxInstallmentByDsti: number;
  maxInstallment: number; // min(disposableIncome, maxInstallmentByDsti) — faktyczny limit
  bufferPercent: number; // 2.5 albo 5 — zastosowany bufor
  effectiveAnnualRatePercent: number; // nominalRatePercent + bufferPercent
  maxLoanAmount: number;
}

// ------------------------------------------------------------ logika ---

/** Umowa o pracę zawsze 100% — bank nie dyskontuje udokumentowanego etatu. */
function resolveIncomeRecognitionRate(inputs: CreditworthinessInputs): number {
  if (inputs.contractType === 'employment') return 1;
  return clamp(inputs.incomeRecognitionRate, 0, 100) / 100;
}

function resolveBufferPercent(rateType: CreditRateType): number {
  return rateType === 'fixed' ? BUFFER_FIXED_RATE_PP : BUFFER_VARIABLE_RATE_PP;
}

/**
 * Odwrócony wzór annuitetowy z `calcStdPayment` w `mortgage.ts`
 * (P,r,n) -> rata; tu: rata,r,n -> P. Dla r=0 (oprocentowanie zerowe,
 * praktycznie tylko do testów) kwota to po prostu rata × liczba rat.
 */
function maxLoanFromInstallment(installment: number, monthlyRate: number, months: number): number {
  if (installment <= 0 || months <= 0) return 0;
  const raw = monthlyRate === 0
    ? installment * months
    : (installment * (1 - Math.pow(1 + monthlyRate, -months))) / monthlyRate;
  return Math.floor(nonNegative(raw) / LOAN_AMOUNT_ROUNDING_STEP) * LOAN_AMOUNT_ROUNDING_STEP;
}

export function computeCreditworthiness(inputs: CreditworthinessInputs): CreditworthinessResult {
  const netIncome = nonNegative(inputs.netIncome);
  const recognitionRate = resolveIncomeRecognitionRate(inputs);
  const recognizedIncome = round2(netIncome * recognitionRate);

  // Koszty utrzymania odejmowane są świadomie od recognizedIncome (dochodu
  // po dyskoncie uznania źródła, np. B2B/zlecenie), nie od surowego
  // netIncome — to konserwatywne uproszczenie: skoro bank nie uznaje pełnej
  // kwoty jako wiarygodnej podstawy spłaty, tym bardziej nie powinien z niej
  // wyliczać nadwyżki ponad koszty życia. Próg DSTI (niżej) liczony jest
  // inaczej — od pełnego netIncome — bo klasyfikuje zamożność wnioskodawcy,
  // nie wiarygodność źródła dochodu.
  const householdSize = Math.max(1, Math.round(nonNegative(inputs.householdSize) || 1));
  const firstPersonCost = nonNegative(inputs.firstPersonCost);
  const additionalPersonCost = nonNegative(inputs.additionalPersonCost);
  const householdCost = round2(firstPersonCost + (householdSize - 1) * additionalPersonCost);

  const otherCommitments = round2(
    nonNegative(inputs.existingLoanInstallments) +
    nonNegative(inputs.creditCardLimits) * CREDIT_CARD_LIMIT_MONTHLY_RATE +
    nonNegative(inputs.alimony)
  );

  const disposableIncome = round2(Math.max(0, recognizedIncome - householdCost - otherCommitments));

  // Próg 40%/50% liczony od surowego netIncome, NIE od recognizedIncome —
  // dyskonto uznania źródła dochodu (B2B/zlecenie) już raz obniża dostępną
  // kwotę przez disposableIncome/maxInstallmentByDsti niżej; liczenie progu
  // od tego samego zdyskontowanego dochodu karałoby wnioskodawcę podwójnie
  // (surowszy próg + mniejsza podstawa) bez uzasadnienia metodologicznego.
  const dstiThreshold = netIncome > AVERAGE_NATIONAL_WAGE_NET_2026 ? DSTI_THRESHOLD_HIGH : DSTI_THRESHOLD_LOW;
  const maxInstallmentByDsti = round2(recognizedIncome * dstiThreshold);
  const maxInstallment = round2(Math.min(disposableIncome, maxInstallmentByDsti));

  const bufferPercent = resolveBufferPercent(inputs.rateType);
  const nominalRate = clamp(inputs.nominalRatePercent, 0, 30);
  const effectiveAnnualRatePercent = round2(nominalRate + bufferPercent);
  const monthlyRate = effectiveAnnualRatePercent / 100 / 12;

  const years = clamp(Math.round(inputs.years), 1, 40);
  const months = years * 12;
  const maxLoanAmount = maxLoanFromInstallment(maxInstallment, monthlyRate, months);

  return {
    recognizedIncome,
    householdCost,
    otherCommitments,
    disposableIncome,
    dstiThreshold,
    maxInstallmentByDsti,
    maxInstallment,
    bufferPercent,
    effectiveAnnualRatePercent,
    maxLoanAmount,
  };
}
