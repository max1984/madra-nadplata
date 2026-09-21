/**
 * Klucze tłumaczeń dla kalkulatora zdolności kredytowej — wydzielone z
 * i18n.ts, tak samo jak i18nSalary.ts dla kalkulatora wynagrodzeń. Mechanika
 * `t()`/`useLang()` w i18n.ts/LangContext.tsx się nie zmienia — `pl`/`en`
 * tam po prostu doklejają ten rekord przez spread.
 */
import type { Lang } from './i18n';

export type CreditworthinessTranslationKey =
  | 'cw_nav_back' | 'cw_page_title' | 'cw_page_subtitle' | 'cw_footer_disclaimer'
  | 'cw_income_label' | 'cw_contract_type_label'
  | 'cw_contract_employment' | 'cw_contract_b2b' | 'cw_contract_mandate_or_specific_work'
  | 'cw_income_recognition_label'
  | 'cw_household_size_label' | 'cw_first_person_cost_label' | 'cw_additional_person_cost_label'
  | 'cw_existing_loan_installments_label' | 'cw_credit_card_limits_label' | 'cw_alimony_label'
  | 'cw_years_label' | 'cw_nominal_rate_label' | 'cw_rate_type_label'
  | 'cw_rate_type_fixed' | 'cw_rate_type_variable'
  | 'cw_calculate_btn' | 'cw_reset_btn'
  | 'cw_result_recognized_income' | 'cw_result_household_cost' | 'cw_result_other_commitments'
  | 'cw_result_disposable_income' | 'cw_result_dsti_threshold' | 'cw_result_max_installment'
  | 'cw_result_buffer' | 'cw_result_max_loan_amount'
  | 'error_cw_income' | 'error_cw_household_size' | 'error_cw_years' | 'error_cw_nominal_rate'
  | 'error_cw_income_recognition' | 'error_cw_negative_field';

const plCw: Record<CreditworthinessTranslationKey, string> = {
  cw_nav_back: '← Kalkulator kredytu',
  cw_page_title: 'Kalkulator zdolności kredytowej',
  cw_page_subtitle: 'Orientacyjne oszacowanie maksymalnej kwoty kredytu hipotecznego wg metodologii Rekomendacji S KNF (DSTI, bufor ostrożnościowy, koszty utrzymania gospodarstwa domowego).',
  cw_footer_disclaimer: 'Strona edukacyjna – nie stanowi wiążącej decyzji kredytowej banku. Każdy bank stosuje własne normy kosztów utrzymania i interpretację Rekomendacji S.<br />Wyniki mają charakter orientacyjny — przed złożeniem wniosku skonsultuj się z doradcą kredytowym.',
  cw_income_label: 'Dochód netto (miesięcznie)',
  cw_contract_type_label: 'Typ umowy',
  cw_contract_employment: 'Umowa o pracę',
  cw_contract_b2b: 'B2B',
  cw_contract_mandate_or_specific_work: 'Zlecenie / dzieło',
  cw_income_recognition_label: '% dochodu uznawany przez bank',
  cw_household_size_label: 'Liczba osób w gospodarstwie domowym',
  cw_first_person_cost_label: 'Koszt utrzymania — pierwsza osoba',
  cw_additional_person_cost_label: 'Koszt utrzymania — każda kolejna osoba',
  cw_existing_loan_installments_label: 'Raty innych kredytów (miesięcznie)',
  cw_credit_card_limits_label: 'Limity kart kredytowych/w koncie',
  cw_alimony_label: 'Alimenty (miesięcznie)',
  cw_years_label: 'Okres kredytowania (lata)',
  cw_nominal_rate_label: 'Oprocentowanie nominalne (%)',
  cw_rate_type_label: 'Rodzaj oprocentowania',
  cw_rate_type_fixed: 'Okresowo stałe (bufor 2,5 p.p.)',
  cw_rate_type_variable: 'Zmienne (bufor 5 p.p.)',
  cw_calculate_btn: 'Oblicz',
  cw_reset_btn: 'Przywróć domyślne',
  cw_result_recognized_income: 'Uznany dochód',
  cw_result_household_cost: 'Koszty utrzymania gospodarstwa',
  cw_result_other_commitments: 'Inne zobowiązania',
  cw_result_disposable_income: 'Dostępne na ratę',
  cw_result_dsti_threshold: 'Zastosowany próg DSTI',
  cw_result_max_installment: 'Maksymalna rata',
  cw_result_buffer: 'Zastosowany bufor ostrożnościowy',
  cw_result_max_loan_amount: 'Maksymalna kwota kredytu',
  error_cw_income: 'Podaj poprawną kwotę dochodu netto',
  error_cw_household_size: 'Liczba osób w gospodarstwie musi wynosić co najmniej 1',
  error_cw_years: 'Okres kredytowania musi być między 1 a 40 lat',
  error_cw_nominal_rate: 'Oprocentowanie nominalne musi być między 0 a 30%',
  error_cw_income_recognition: 'Procent uznania dochodu musi być między 0 a 100%',
  error_cw_negative_field: 'Ta wartość nie może być ujemna',
};

const enCw: Record<CreditworthinessTranslationKey, string> = {
  cw_nav_back: '← Mortgage calculator',
  cw_page_title: 'Credit capacity calculator',
  cw_page_subtitle: 'An indicative estimate of the maximum mortgage amount, based on the KNF Recommendation S methodology (DSTI, precautionary buffer, household maintenance costs).',
  cw_footer_disclaimer: "Educational website – not a binding bank lending decision. Every bank applies its own household cost norms and interpretation of Recommendation S.<br />Results are indicative only — consult a mortgage advisor before applying.",
  cw_income_label: 'Net income (monthly)',
  cw_contract_type_label: 'Contract type',
  cw_contract_employment: 'Employment contract',
  cw_contract_b2b: 'B2B',
  cw_contract_mandate_or_specific_work: 'Mandate / specific-work contract',
  cw_income_recognition_label: '% of income recognized by the bank',
  cw_household_size_label: 'Household size',
  cw_first_person_cost_label: 'Maintenance cost — first person',
  cw_additional_person_cost_label: 'Maintenance cost — each additional person',
  cw_existing_loan_installments_label: 'Other loan installments (monthly)',
  cw_credit_card_limits_label: 'Credit card / overdraft limits',
  cw_alimony_label: 'Alimony (monthly)',
  cw_years_label: 'Loan term (years)',
  cw_nominal_rate_label: 'Nominal interest rate (%)',
  cw_rate_type_label: 'Interest rate type',
  cw_rate_type_fixed: 'Periodically fixed (2.5 pp buffer)',
  cw_rate_type_variable: 'Variable (5 pp buffer)',
  cw_calculate_btn: 'Calculate',
  cw_reset_btn: 'Reset to defaults',
  cw_result_recognized_income: 'Recognized income',
  cw_result_household_cost: 'Household maintenance cost',
  cw_result_other_commitments: 'Other commitments',
  cw_result_disposable_income: 'Available for installment',
  cw_result_dsti_threshold: 'DSTI threshold applied',
  cw_result_max_installment: 'Maximum installment',
  cw_result_buffer: 'Precautionary buffer applied',
  cw_result_max_loan_amount: 'Maximum loan amount',
  error_cw_income: 'Enter a valid net income amount',
  error_cw_household_size: 'Household size must be at least 1',
  error_cw_years: 'Loan term must be between 1 and 40 years',
  error_cw_nominal_rate: 'Nominal interest rate must be between 0 and 30%',
  error_cw_income_recognition: 'Income recognition percentage must be between 0 and 100%',
  error_cw_negative_field: 'This value cannot be negative',
};

export const CREDITWORTHINESS_TRANSLATIONS: Record<Lang, Record<CreditworthinessTranslationKey, string>> = {
  pl: plCw,
  en: enCw,
};
