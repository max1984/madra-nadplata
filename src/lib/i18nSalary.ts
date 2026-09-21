/**
 * Klucze tłumaczeń dla kalkulatora wynagrodzeń — wydzielone z i18n.ts, żeby
 * nie mieszać w jednym 900-linijkowym pliku słownictwa dwóch niezależnych
 * kalkulatorów. Mechanika `t()`/`useLang()` w i18n.ts/LangContext.tsx się
 * nie zmienia — `pl`/`en` tam po prostu doklejają te rekordy przez spread.
 */
import type { Lang } from './i18n';

export type SalaryTranslationKey =
  | 'salary_nav_back' | 'salary_page_title' | 'salary_page_subtitle'
  | 'salary_tab_employment' | 'salary_tab_mandate' | 'salary_tab_specific_work' | 'salary_tab_b2b'
  | 'salary_gross_label' | 'salary_calculate_btn' | 'salary_reset_btn' | 'salary_footer_disclaimer'
  | 'salary_advanced_toggle' | 'salary_annual_mode_toggle'
  | 'salary_month_1' | 'salary_month_2' | 'salary_month_3' | 'salary_month_4'
  | 'salary_month_5' | 'salary_month_6' | 'salary_month_7' | 'salary_month_8'
  | 'salary_month_9' | 'salary_month_10' | 'salary_month_11' | 'salary_month_12'
  | 'salary_result_net' | 'salary_result_gross' | 'salary_result_tax'
  | 'salary_result_social' | 'salary_result_health' | 'salary_result_employer_cost'
  | 'salary_result_kup' | 'salary_result_copyright_kup' | 'salary_check_creditworthiness_link'
  | 'salary_annual_summary_title' | 'salary_annual_total_net' | 'salary_annual_total_tax'
  | 'salary_annual_total_social_health' | 'salary_annual_scale_crossed' | 'salary_annual_zus_crossed'
  | 'salary_annual_relief_crossed' | 'salary_annual_chart_label'
  | 'salary_kup_standard' | 'salary_kup_elevated'
  | 'salary_mandate_kup_standard' | 'salary_mandate_kup_copyright'
  | 'salary_relief_none' | 'salary_relief_under26' | 'salary_relief_returning'
  | 'salary_relief_family4plus' | 'salary_relief_working_pensioner' | 'salary_relief_label'
  | 'salary_pit2_full' | 'salary_pit2_half' | 'salary_pit2_third' | 'salary_pit2_none' | 'salary_pit2_label'
  | 'salary_ppk_none' | 'salary_ppk_standard' | 'salary_ppk_custom' | 'salary_ppk_label'
  | 'salary_bonus_label' | 'salary_copyright_share_label'
  | 'salary_student_toggle' | 'salary_sickness_toggle'
  | 'salary_b2b_revenue_label' | 'salary_b2b_costs_label' | 'salary_b2b_form_label'
  | 'salary_b2b_form_skala' | 'salary_b2b_form_liniowy' | 'salary_b2b_form_ryczalt' | 'salary_b2b_form_ipbox'
  | 'salary_b2b_ryczalt_rate_label' | 'salary_b2b_ipbox_share_label'
  | 'salary_b2b_zus_label' | 'salary_b2b_zus_ulga_na_start' | 'salary_b2b_zus_preferencyjny'
  | 'salary_b2b_zus_maly_zus_plus' | 'salary_b2b_zus_pelny' | 'salary_b2b_maly_zus_base_label'
  | 'salary_joint_taxation_toggle' | 'salary_joint_spouse_income_label' | 'salary_joint_savings_positive'
  | 'salary_joint_savings_negative' | 'salary_joint_not_eligible'
  | 'error_salary_gross' | 'error_salary_bonus' | 'error_salary_copyright_share'
  | 'error_salary_revenue' | 'error_salary_costs' | 'error_salary_ipbox_share'
  | 'error_salary_maly_zus_base' | 'error_salary_annual_length' | 'error_salary_annual_value'
  | 'error_salary_spouse_income'
  | 'salary_scenario_name_placeholder' | 'salary_scenario_save' | 'salary_scenario_save_storage_error'
  | 'salary_scenario_limit_reached' | 'salary_scenario_saved_title'
  | 'salary_scenario_sort_label' | 'salary_scenario_sort_newest' | 'salary_scenario_sort_oldest' | 'salary_scenario_sort_name'
  | 'salary_scenario_filter_placeholder' | 'salary_scenario_filter_no_match'
  | 'salary_scenario_load' | 'salary_scenario_delete' | 'salary_scenario_rename_hint'
  | 'salary_scenario_delete_confirm' | 'salary_scenario_delete_cancel'
  | 'salary_scenario_export' | 'salary_scenario_import'
  | 'salary_scenario_import_success' | 'salary_scenario_import_empty' | 'salary_scenario_import_error'
  | 'salary_scenario_duplicate' | 'salary_scenario_copy_suffix';

const plSalary: Record<SalaryTranslationKey, string> = {
  salary_nav_back: '← Kalkulator kredytu',
  salary_page_title: 'Kalkulator wynagrodzeń brutto-netto',
  salary_page_subtitle: 'Umowa o pracę, zlecenie, dzieło i B2B — jeden kalkulator, ze wsparciem rocznego rozliczenia ze zmiennym wynagrodzeniem.',
  salary_tab_employment: 'Umowa o pracę',
  salary_tab_mandate: 'Umowa zlecenie',
  salary_tab_specific_work: 'Umowa o dzieło',
  salary_tab_b2b: 'B2B',
  salary_gross_label: 'Wynagrodzenie brutto (miesięcznie)',
  salary_calculate_btn: 'Oblicz',
  salary_reset_btn: 'Przywróć domyślne',
  salary_footer_disclaimer: 'Strona edukacyjna – nie stanowi porady podatkowej. Wyniki kalkulatora mają charakter poglądowy.<br />Przed podjęciem decyzji skonsultuj się z księgowym lub doradcą podatkowym.',
  salary_advanced_toggle: 'Opcje zaawansowane',
  salary_annual_mode_toggle: 'Rozliczenie roczne ze zmiennym wynagrodzeniem',
  salary_month_1: 'Styczeń', salary_month_2: 'Luty', salary_month_3: 'Marzec', salary_month_4: 'Kwiecień',
  salary_month_5: 'Maj', salary_month_6: 'Czerwiec', salary_month_7: 'Lipiec', salary_month_8: 'Sierpień',
  salary_month_9: 'Wrzesień', salary_month_10: 'Październik', salary_month_11: 'Listopad', salary_month_12: 'Grudzień',
  salary_result_net: 'Na rękę',
  salary_result_gross: 'Brutto',
  salary_result_tax: 'Podatek',
  salary_result_social: 'Składki społeczne',
  salary_result_health: 'Składka zdrowotna',
  salary_result_employer_cost: 'Koszt pracodawcy',
  salary_result_kup: 'Koszty uzyskania przychodu',
  salary_result_copyright_kup: 'Koszty autorskie (50%)',
  salary_check_creditworthiness_link: 'Sprawdź zdolność kredytową z tym dochodem →',
  salary_annual_summary_title: 'Podsumowanie roczne',
  salary_annual_total_net: 'Suma netto',
  salary_annual_total_tax: 'Suma podatku',
  salary_annual_total_social_health: 'Suma składek',
  salary_annual_scale_crossed: 'Próg 120 000 zł przekroczony w miesiącu',
  salary_annual_zus_crossed: 'Limit 30-krotności ZUS przekroczony w miesiącu',
  salary_annual_relief_crossed: 'Ulga wyczerpana w miesiącu',
  salary_annual_chart_label: 'Wynagrodzenie netto w kolejnych miesiącach',
  salary_kup_standard: 'Standardowe (250 zł)',
  salary_kup_elevated: 'Podwyższone — dojazd z innej gminy (300 zł)',
  salary_mandate_kup_standard: 'Standardowe (20%)',
  salary_mandate_kup_copyright: 'Przeniesienie praw autorskich (50%)',
  salary_relief_none: 'Brak',
  salary_relief_under26: 'Ulga dla młodych (<26 lat)',
  salary_relief_returning: 'Ulga na powrót z zagranicy',
  salary_relief_family4plus: 'Ulga dla rodzin 4+',
  salary_relief_working_pensioner: 'Ulga dla pracującego emeryta',
  salary_relief_label: 'Ulga specjalna',
  salary_pit2_full: 'Pełna (300 zł)',
  salary_pit2_half: 'Połowa (150 zł)',
  salary_pit2_third: 'Jedna trzecia (100 zł)',
  salary_pit2_none: 'Brak (PIT-2 u innego płatnika)',
  salary_pit2_label: 'Kwota zmniejszająca podatek (PIT-2)',
  salary_ppk_none: 'Nie uczestniczę',
  salary_ppk_standard: 'Standardowo (2% / 1,5%)',
  salary_ppk_custom: 'Niestandardowo',
  salary_ppk_label: 'PPK',
  salary_bonus_label: 'Premia (brutto)',
  salary_copyright_share_label: '% wynagrodzenia objęte prawami autorskimi',
  salary_student_toggle: 'Student/uczeń do 26 lat (zwolnienie z ZUS i zdrowotnej)',
  salary_sickness_toggle: 'Dobrowolna składka chorobowa',
  salary_b2b_revenue_label: 'Przychód (miesięcznie)',
  salary_b2b_costs_label: 'Koszty firmowe (miesięcznie)',
  salary_b2b_form_label: 'Forma opodatkowania',
  salary_b2b_form_skala: 'Skala podatkowa (12%/32%)',
  salary_b2b_form_liniowy: 'Podatek liniowy (19%)',
  salary_b2b_form_ryczalt: 'Ryczałt ewidencjonowany',
  salary_b2b_form_ipbox: 'IP Box (5%)',
  salary_b2b_ryczalt_rate_label: 'Stawka ryczałtu',
  salary_b2b_ipbox_share_label: '% dochodu z kwalifikowanego IP',
  salary_b2b_zus_label: 'Wariant ZUS',
  salary_b2b_zus_ulga_na_start: 'Ulga na start (6 mies., tylko zdrowotna)',
  salary_b2b_zus_preferencyjny: 'Preferencyjny ZUS (24 mies.)',
  salary_b2b_zus_maly_zus_plus: 'Mały ZUS Plus',
  salary_b2b_zus_pelny: 'Pełny ZUS',
  salary_b2b_maly_zus_base_label: 'Podstawa składek (Mały ZUS Plus)',
  salary_joint_taxation_toggle: 'Wspólne rozliczenie z małżonkiem',
  salary_joint_spouse_income_label: 'Roczny dochód małżonka (po odliczeniach)',
  salary_joint_savings_positive: 'Wspólne rozliczenie oszczędza',
  salary_joint_savings_negative: 'Wspólne rozliczenie nie daje korzyści w tym przypadku',
  salary_joint_not_eligible: 'Ta forma opodatkowania B2B nie kwalifikuje się do wspólnego rozliczenia',
  error_salary_gross: 'Podaj poprawną kwotę wynagrodzenia brutto',
  error_salary_bonus: 'Podaj poprawną kwotę premii',
  error_salary_copyright_share: 'Udział kosztów autorskich musi być między 0 i 100%',
  error_salary_revenue: 'Podaj poprawną kwotę przychodu',
  error_salary_costs: 'Podaj poprawną kwotę kosztów firmowych',
  error_salary_ipbox_share: 'Udział dochodu z IP musi być między 0 i 100%',
  error_salary_maly_zus_base: 'Podaj poprawną podstawę składek dla Małego ZUS Plus',
  error_salary_annual_length: 'Rozliczenie roczne wymaga 12 wartości miesięcznych',
  error_salary_annual_value: 'Każda wartość miesięczna musi być poprawną, nieujemną kwotą',
  error_salary_spouse_income: 'Podaj poprawny roczny dochód małżonka',
  salary_scenario_name_placeholder: 'Nazwa scenariusza (np. "Umowa o pracę 8000 zł")',
  salary_scenario_save: '💾 Zapisz scenariusz wynagrodzenia',
  salary_scenario_save_storage_error: 'Nie udało się zapisać scenariusza na tym urządzeniu (pamięć przeglądarki jest pełna lub zablokowana) — po odświeżeniu strony może zniknąć.',
  salary_scenario_limit_reached: 'Limit 10 zapisanych scenariuszy osiągnięty — najstarszy został usunięty, żeby zrobić miejsce na nowy.',
  salary_scenario_saved_title: 'Zapisane scenariusze',
  salary_scenario_sort_label: 'Sortuj scenariusze',
  salary_scenario_sort_newest: 'Najnowsze',
  salary_scenario_sort_oldest: 'Najstarsze',
  salary_scenario_sort_name: 'Nazwa (A-Z)',
  salary_scenario_filter_placeholder: '🔍 Szukaj scenariusza…',
  salary_scenario_filter_no_match: 'Brak scenariuszy pasujących do wyszukiwania.',
  salary_scenario_load: 'Wczytaj',
  salary_scenario_delete: 'Usuń',
  salary_scenario_rename_hint: 'Kliknij, aby zmienić nazwę',
  salary_scenario_delete_confirm: 'Na pewno?',
  salary_scenario_delete_cancel: 'Anuluj',
  salary_scenario_export: '⬇️ Eksportuj',
  salary_scenario_import: '⬆️ Importuj',
  salary_scenario_import_success: 'Zaimportowano {n} scenariuszy',
  salary_scenario_import_empty: 'Nie znaleziono poprawnych scenariuszy w pliku',
  salary_scenario_import_error: 'Nie udało się odczytać pliku',
  salary_scenario_duplicate: '📄 Duplikuj',
  salary_scenario_copy_suffix: '(kopia)',
};

const enSalary: Record<SalaryTranslationKey, string> = {
  salary_nav_back: '← Mortgage calculator',
  salary_page_title: 'Gross-to-net salary calculator',
  salary_page_subtitle: 'Employment, mandate, specific-work and B2B contracts — one calculator, with annual reconciliation for month-to-month varying pay.',
  salary_tab_employment: 'Employment',
  salary_tab_mandate: 'Mandate contract',
  salary_tab_specific_work: 'Specific-work contract',
  salary_tab_b2b: 'B2B',
  salary_gross_label: 'Gross salary (monthly)',
  salary_calculate_btn: 'Calculate',
  salary_reset_btn: 'Reset to defaults',
  salary_footer_disclaimer: 'Educational website — does not constitute tax advice. Calculator results are for illustrative purposes only.<br />Before making a decision, consult an accountant or tax advisor.',
  salary_advanced_toggle: 'Advanced options',
  salary_annual_mode_toggle: 'Annual reconciliation with varying monthly pay',
  salary_month_1: 'January', salary_month_2: 'February', salary_month_3: 'March', salary_month_4: 'April',
  salary_month_5: 'May', salary_month_6: 'June', salary_month_7: 'July', salary_month_8: 'August',
  salary_month_9: 'September', salary_month_10: 'October', salary_month_11: 'November', salary_month_12: 'December',
  salary_result_net: 'Net pay',
  salary_result_gross: 'Gross',
  salary_result_tax: 'Tax',
  salary_result_social: 'Social contributions',
  salary_result_health: 'Health insurance',
  salary_result_employer_cost: 'Employer cost',
  salary_result_kup: 'Tax-deductible costs',
  salary_result_copyright_kup: 'Copyright costs (50%)',
  salary_check_creditworthiness_link: 'Check credit capacity with this income →',
  salary_annual_summary_title: 'Annual summary',
  salary_annual_total_net: 'Total net',
  salary_annual_total_tax: 'Total tax',
  salary_annual_total_social_health: 'Total contributions',
  salary_annual_scale_crossed: '120,000 zł threshold crossed in month',
  salary_annual_zus_crossed: '30x ZUS limit crossed in month',
  salary_annual_relief_crossed: 'Relief exhausted in month',
  salary_annual_chart_label: 'Net pay across the months',
  salary_kup_standard: 'Standard (250 zł)',
  salary_kup_elevated: 'Elevated — commute from another municipality (300 zł)',
  salary_mandate_kup_standard: 'Standard (20%)',
  salary_mandate_kup_copyright: 'Copyright transfer (50%)',
  salary_relief_none: 'None',
  salary_relief_under26: 'Under-26 relief',
  salary_relief_returning: 'Returning-from-abroad relief',
  salary_relief_family4plus: '4+ children relief',
  salary_relief_working_pensioner: 'Working pensioner relief',
  salary_relief_label: 'Special relief',
  salary_pit2_full: 'Full (300 zł)',
  salary_pit2_half: 'Half (150 zł)',
  salary_pit2_third: 'One third (100 zł)',
  salary_pit2_none: 'None (PIT-2 filed elsewhere)',
  salary_pit2_label: 'Tax-reducing amount (PIT-2)',
  salary_ppk_none: 'Not participating',
  salary_ppk_standard: 'Standard (2% / 1.5%)',
  salary_ppk_custom: 'Custom',
  salary_ppk_label: 'PPK',
  salary_bonus_label: 'Bonus (gross)',
  salary_copyright_share_label: '% of salary covered by copyright transfer',
  salary_student_toggle: 'Student under 26 (exempt from ZUS and health insurance)',
  salary_sickness_toggle: 'Voluntary sickness insurance',
  salary_b2b_revenue_label: 'Revenue (monthly)',
  salary_b2b_costs_label: 'Business costs (monthly)',
  salary_b2b_form_label: 'Tax form',
  salary_b2b_form_skala: 'Progressive scale (12%/32%)',
  salary_b2b_form_liniowy: 'Flat tax (19%)',
  salary_b2b_form_ryczalt: 'Lump-sum tax',
  salary_b2b_form_ipbox: 'IP Box (5%)',
  salary_b2b_ryczalt_rate_label: 'Lump-sum rate',
  salary_b2b_ipbox_share_label: '% of income from qualified IP',
  salary_b2b_zus_label: 'ZUS variant',
  salary_b2b_zus_ulga_na_start: 'Start relief (6 mo., health insurance only)',
  salary_b2b_zus_preferencyjny: 'Preferential ZUS (24 mo.)',
  salary_b2b_zus_maly_zus_plus: 'Small ZUS Plus',
  salary_b2b_zus_pelny: 'Full ZUS',
  salary_b2b_maly_zus_base_label: 'Contribution base (Small ZUS Plus)',
  salary_joint_taxation_toggle: 'Joint taxation with spouse',
  salary_joint_spouse_income_label: "Spouse's annual taxable income",
  salary_joint_savings_positive: 'Joint taxation saves',
  salary_joint_savings_negative: 'Joint taxation gives no benefit in this case',
  salary_joint_not_eligible: 'This B2B tax form is not eligible for joint taxation',
  error_salary_gross: 'Enter a valid gross salary amount',
  error_salary_bonus: 'Enter a valid bonus amount',
  error_salary_copyright_share: 'Copyright cost share must be between 0 and 100%',
  error_salary_revenue: 'Enter a valid revenue amount',
  error_salary_costs: 'Enter a valid business costs amount',
  error_salary_ipbox_share: 'IP income share must be between 0 and 100%',
  error_salary_maly_zus_base: 'Enter a valid contribution base for Small ZUS Plus',
  error_salary_annual_length: 'Annual reconciliation requires 12 monthly values',
  error_salary_annual_value: 'Every monthly value must be a valid, non-negative amount',
  error_salary_spouse_income: "Enter a valid spouse's annual income",
  salary_scenario_name_placeholder: 'Scenario name (e.g. "Employment contract 8000 zł")',
  salary_scenario_save: '💾 Save salary scenario',
  salary_scenario_save_storage_error: 'Could not save this scenario on this device (browser storage is full or blocked) — it may disappear after a page refresh.',
  salary_scenario_limit_reached: 'Reached the 10 saved-scenario limit — the oldest one was removed to make room for this one.',
  salary_scenario_saved_title: 'Saved scenarios',
  salary_scenario_sort_label: 'Sort scenarios',
  salary_scenario_sort_newest: 'Newest',
  salary_scenario_sort_oldest: 'Oldest',
  salary_scenario_sort_name: 'Name (A-Z)',
  salary_scenario_filter_placeholder: '🔍 Search scenarios…',
  salary_scenario_filter_no_match: 'No scenarios match your search.',
  salary_scenario_load: 'Load',
  salary_scenario_delete: 'Delete',
  salary_scenario_rename_hint: 'Click to rename',
  salary_scenario_delete_confirm: 'Sure?',
  salary_scenario_delete_cancel: 'Cancel',
  salary_scenario_export: '⬇️ Export',
  salary_scenario_import: '⬆️ Import',
  salary_scenario_import_success: 'Imported {n} scenarios',
  salary_scenario_import_empty: 'No valid scenarios found in the file',
  salary_scenario_import_error: 'Could not read the file',
  salary_scenario_duplicate: '📄 Duplicate',
  salary_scenario_copy_suffix: '(copy)',
};

export const SALARY_TRANSLATIONS: Record<Lang, Record<SalaryTranslationKey, string>> = {
  pl: plSalary,
  en: enSalary,
};
