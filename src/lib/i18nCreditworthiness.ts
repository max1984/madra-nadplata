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
  | 'cw_result_buffer' | 'cw_result_max_loan_amount' | 'cw_advanced_toggle' | 'cw_check_mortgage_link'
  | 'cw_copy_summary' | 'cw_share_summary_text' | 'cw_print'
  | 'cw_scenario_name_placeholder' | 'cw_scenario_save' | 'cw_scenario_save_storage_error'
  | 'cw_scenario_saved_title' | 'cw_scenario_load' | 'cw_scenario_delete'
  | 'cw_scenario_delete_confirm' | 'cw_scenario_delete_cancel' | 'cw_scenario_limit_reached'
  | 'cw_scenario_import' | 'cw_scenario_export' | 'cw_scenario_import_success'
  | 'cw_scenario_import_empty' | 'cw_scenario_import_error'
  | 'cw_scenario_filter_placeholder' | 'cw_scenario_filter_no_match' | 'cw_scenario_sort_label'
  | 'cw_scenario_sort_newest' | 'cw_scenario_sort_oldest' | 'cw_scenario_sort_name'
  | 'error_cw_income' | 'error_cw_household_size' | 'error_cw_years' | 'error_cw_nominal_rate'
  | 'error_cw_income_recognition' | 'error_cw_out_of_range_field';

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
  cw_advanced_toggle: 'Opcje zaawansowane',
  cw_check_mortgage_link: 'Sprawdź ratę dla tej kwoty w kalkulatorze kredytu →',
  cw_copy_summary: '📋 Kopiuj wynik',
  cw_print: '🖨️ Drukuj / Zapisz PDF',
  cw_share_summary_text: 'Zdolność kredytowa: maksymalnie {maxLoan} (dochód uznany {income}, rata maks. {installment}, próg DSTI {dsti}%).\nPoliczone w kalkulatorze Mądra Nadpłata: {url}',
  cw_scenario_name_placeholder: 'Nazwa scenariusza (np. "Rodzina, 2 osoby")',
  cw_scenario_save: '💾 Zapisz scenariusz',
  cw_scenario_save_storage_error: 'Nie udało się zapisać scenariusza na tym urządzeniu (pamięć przeglądarki jest pełna lub zablokowana) — po odświeżeniu strony może zniknąć.',
  cw_scenario_saved_title: 'Zapisane scenariusze',
  cw_scenario_load: 'Wczytaj',
  cw_scenario_delete: 'Usuń',
  cw_scenario_delete_confirm: 'Na pewno?',
  cw_scenario_delete_cancel: 'Anuluj',
  cw_scenario_limit_reached: 'Limit 10 zapisanych scenariuszy osiągnięty — najstarszy został usunięty, żeby zrobić miejsce na nowy.',
  cw_scenario_import: '⬆️ Importuj',
  cw_scenario_export: '⬇️ Eksportuj',
  cw_scenario_import_success: 'Zaimportowano {n} scenariuszy',
  cw_scenario_import_empty: 'Nie znaleziono poprawnych scenariuszy w pliku',
  cw_scenario_import_error: 'Nie udało się odczytać pliku',
  cw_scenario_filter_placeholder: 'Szukaj scenariusza…',
  cw_scenario_filter_no_match: 'Brak scenariuszy pasujących do wyszukiwania',
  cw_scenario_sort_label: 'Sortuj scenariusze',
  cw_scenario_sort_newest: 'Najnowsze',
  cw_scenario_sort_oldest: 'Najstarsze',
  cw_scenario_sort_name: 'Nazwa',
  error_cw_income: 'Podaj poprawną kwotę dochodu netto',
  error_cw_household_size: 'Liczba osób w gospodarstwie musi wynosić co najmniej 1',
  error_cw_years: 'Okres kredytowania musi być między 1 a 40 lat',
  error_cw_nominal_rate: 'Oprocentowanie nominalne musi być między 0 a 30%',
  error_cw_income_recognition: 'Procent uznania dochodu musi być między 0 a 100%',
  error_cw_out_of_range_field: 'Ta wartość jest poza dopuszczalnym zakresem',
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
  cw_advanced_toggle: 'Advanced options',
  cw_check_mortgage_link: 'Check the monthly payment for this amount in the mortgage calculator →',
  cw_copy_summary: '📋 Copy result',
  cw_print: '🖨️ Print / Save PDF',
  cw_share_summary_text: 'Credit capacity: up to {maxLoan} (recognized income {income}, max installment {installment}, DSTI threshold {dsti}%).\nCalculated with Mądra Nadpłata: {url}',
  cw_scenario_name_placeholder: 'Scenario name (e.g. "Family, 2 people")',
  cw_scenario_save: '💾 Save scenario',
  cw_scenario_save_storage_error: 'Could not save this scenario on this device (browser storage is full or blocked) — it may disappear after a page refresh.',
  cw_scenario_saved_title: 'Saved scenarios',
  cw_scenario_load: 'Load',
  cw_scenario_delete: 'Delete',
  cw_scenario_delete_confirm: 'Sure?',
  cw_scenario_delete_cancel: 'Cancel',
  cw_scenario_limit_reached: 'Reached the 10 saved-scenario limit — the oldest one was removed to make room for this one.',
  cw_scenario_import: '⬆️ Import',
  cw_scenario_export: '⬇️ Export',
  cw_scenario_import_success: 'Imported {n} scenarios',
  cw_scenario_import_empty: 'No valid scenarios found in the file',
  cw_scenario_import_error: 'Could not read the file',
  cw_scenario_filter_placeholder: 'Search scenarios…',
  cw_scenario_filter_no_match: 'No scenarios match your search',
  cw_scenario_sort_label: 'Sort scenarios',
  cw_scenario_sort_newest: 'Newest',
  cw_scenario_sort_oldest: 'Oldest',
  cw_scenario_sort_name: 'Name',
  error_cw_income: 'Enter a valid net income amount',
  error_cw_household_size: 'Household size must be at least 1',
  error_cw_years: 'Loan term must be between 1 and 40 years',
  error_cw_nominal_rate: 'Nominal interest rate must be between 0 and 30%',
  error_cw_income_recognition: 'Income recognition percentage must be between 0 and 100%',
  error_cw_out_of_range_field: 'This value is out of the allowed range',
};

export const CREDITWORTHINESS_TRANSLATIONS: Record<Lang, Record<CreditworthinessTranslationKey, string>> = {
  pl: plCw,
  en: enCw,
};
