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
  | 'salary_print' | 'salary_share_summary_text_single' | 'salary_share_summary_text_annual'
  | 'salary_csv_col_month' | 'salary_csv_filename' | 'salary_csv_col_revenue'
  | 'salary_csv_col_notes' | 'salary_csv_note_elevated' | 'salary_csv_note_zus'
  | 'salary_announcement_single' | 'salary_announcement_annual'
  | 'salary_advanced_toggle' | 'salary_annual_mode_toggle'
  | 'salary_month_1' | 'salary_month_2' | 'salary_month_3' | 'salary_month_4'
  | 'salary_month_5' | 'salary_month_6' | 'salary_month_7' | 'salary_month_8'
  | 'salary_month_9' | 'salary_month_10' | 'salary_month_11' | 'salary_month_12'
  | 'salary_result_net' | 'salary_result_gross' | 'salary_result_tax'
  | 'salary_result_social' | 'salary_result_health' | 'salary_result_employer_cost'
  | 'salary_result_kup' | 'salary_result_copyright_kup' | 'salary_check_creditworthiness_link'
  | 'salary_annual_summary_title' | 'salary_annual_total_net' | 'salary_annual_total_tax'
  | 'salary_annual_total_social_health' | 'salary_annual_scale_crossed' | 'salary_annual_zus_crossed'
  | 'salary_chart_legend_bracket' | 'salary_chart_legend_zus'
  | 'salary_annual_ryczalt_health_crossed' | 'salary_chart_legend_ryczalt_health'
  | 'salary_annual_copyright_limit_crossed' | 'salary_chart_legend_copyright_limit'
  | 'salary_copyright_annual_limit_hint'
  | 'salary_hourly_rate_label' | 'salary_hourly_rate_suffix' | 'salary_hourly_hours_label'
  | 'salary_hourly_hours_suffix' | 'salary_hourly_apply_btn' | 'salary_hourly_rate_below_min_hint'
  | 'salary_hourly_rate_field_label' | 'salary_hourly_hours_field_label'
  | 'salary_chart_legend_relief'
  | 'salary_annual_relief_crossed' | 'salary_annual_chart_label'
  | 'salary_kup_standard' | 'salary_kup_elevated'
  | 'salary_mandate_kup_standard' | 'salary_mandate_kup_copyright'
  | 'salary_relief_none' | 'salary_relief_under26' | 'salary_relief_returning'
  | 'salary_relief_family4plus' | 'salary_relief_working_pensioner' | 'salary_relief_label'
  | 'salary_pit2_full' | 'salary_pit2_half' | 'salary_pit2_third' | 'salary_pit2_none' | 'salary_pit2_label'
  | 'salary_ppk_none' | 'salary_ppk_standard' | 'salary_ppk_custom' | 'salary_ppk_label'
  | 'salary_ppk_custom_employee_label' | 'salary_ppk_custom_employer_label' | 'salary_ppk_custom_hint'
  | 'salary_bonus_label' | 'salary_copyright_share_label'
  | 'salary_student_toggle' | 'salary_sickness_toggle'
  | 'salary_b2b_revenue_label' | 'salary_b2b_costs_label' | 'salary_b2b_form_label'
  | 'salary_b2b_form_skala' | 'salary_b2b_form_liniowy' | 'salary_b2b_form_ryczalt' | 'salary_b2b_form_ipbox'
  | 'salary_b2b_liniowy_health_hint'
  | 'salary_b2b_ryczalt_rate_label' | 'salary_b2b_ipbox_share_label'
  | 'salary_b2b_zus_label' | 'salary_b2b_zus_ulga_na_start' | 'salary_b2b_zus_preferencyjny'
  | 'salary_b2b_zus_maly_zus_plus' | 'salary_b2b_zus_pelny' | 'salary_b2b_maly_zus_base_label' | 'salary_b2b_maly_zus_base_hint'
  | 'salary_joint_taxation_toggle' | 'salary_joint_spouse_income_label' | 'salary_joint_savings_positive'
  | 'salary_joint_savings_negative' | 'salary_joint_not_eligible'
  | 'salary_joint_flat_rate_toggle' | 'salary_joint_flat_rate_hint'
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
  salary_print: 'Drukuj / Zapisz PDF',
  salary_share_summary_text_single: 'Wynagrodzenie na rękę: {net} (podatek {tax}).\nPoliczone w kalkulatorze Mądra Nadpłata: {url}',
  salary_share_summary_text_annual: 'Wynagrodzenie roczne na rękę: {totalNet} (podatek łącznie {totalTax}).\nPoliczone w kalkulatorze Mądra Nadpłata: {url}',
  salary_csv_col_month: 'Miesiąc',
  salary_csv_filename: 'rozliczenie-roczne',
  salary_csv_col_revenue: 'Przychód',
  salary_csv_col_notes: 'Uwagi',
  salary_csv_note_elevated: 'wyższe obciążenie',
  salary_csv_note_zus: 'niższe składki ZUS',
  salary_announcement_single: 'Wyliczono wynagrodzenie: na rękę {net}, podatek {tax}.',
  salary_announcement_annual: 'Wyliczono rozliczenie roczne: łącznie na rękę {totalNet}, podatek {totalTax}.',
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
  salary_chart_legend_bracket: 'Miesiące w 32% progu podatkowym',
  salary_annual_ryczalt_health_crossed: 'Wyższy próg składki zdrowotnej (ryczałt) przekroczony w miesiącu',
  salary_chart_legend_ryczalt_health: 'Miesiące z wyższą składką zdrowotną (próg 60 000/300 000 zł przychodu)',
  salary_annual_copyright_limit_crossed: 'Roczny limit 50% kosztów autorskich (60 000 zł) wyczerpany w miesiącu',
  salary_copyright_annual_limit_hint: '50% koszty autorskie mają roczny limit 60 000 zł (art. 22 ust. 9a ustawy o PIT) — po jego wyczerpaniu nadwyżka nie dostaje już żadnego KUP.',
  salary_hourly_rate_label: 'Masz stawkę godzinową? Przelicz na kwotę miesięczną',
  salary_hourly_rate_suffix: 'zł/h',
  salary_hourly_hours_label: 'Godziny w miesiącu',
  salary_hourly_hours_suffix: 'godz.',
  salary_hourly_apply_btn: 'Zastosuj',
  salary_hourly_rate_below_min_hint: 'Ta stawka jest niższa niż minimalna stawka godzinowa na zleceniu (31,40 zł/h w 2026 r.).',
  salary_hourly_rate_field_label: 'Stawka godzinowa',
  salary_hourly_hours_field_label: 'Liczba godzin',
  salary_chart_legend_copyright_limit: 'Miesiące po wyczerpaniu limitu 50% kosztów autorskich',
  salary_chart_legend_relief: 'Miesiące po wyczerpaniu limitu ulgi specjalnej (85 528 zł)',
  salary_chart_legend_zus: 'Miesiąc przekroczenia limitu ZUS (mniej potrąceń)',
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
  salary_ppk_custom_employee_label: 'Stawka wpłaty pracownika (łącznie)',
  salary_ppk_custom_employer_label: 'Stawka wpłaty pracodawcy (łącznie)',
  salary_ppk_custom_hint: 'Łączna stawka (podstawowa + ewentualna dodatkowa) w ustawowych widełkach: 0,5–4% po stronie pracownika, 1,5–4% po stronie pracodawcy.',
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
  salary_b2b_liniowy_health_hint: 'Uproszczenie: podatek liczony bez rocznego odliczenia części zapłaconej składki zdrowotnej (limit ustawowy, wymaga rozliczenia narastająco w roku) — realny podatek może być nieco niższy.',
  salary_b2b_ryczalt_rate_label: 'Stawka ryczałtu',
  salary_b2b_ipbox_share_label: '% dochodu z kwalifikowanego IP',
  salary_b2b_zus_label: 'Wariant ZUS',
  salary_b2b_zus_ulga_na_start: 'Ulga na start (6 mies., tylko zdrowotna)',
  salary_b2b_zus_preferencyjny: 'Preferencyjny ZUS (24 mies.)',
  salary_b2b_zus_maly_zus_plus: 'Mały ZUS Plus',
  salary_b2b_zus_pelny: 'Pełny ZUS',
  salary_b2b_maly_zus_base_label: 'Podstawa składek (Mały ZUS Plus)',
  salary_b2b_maly_zus_base_hint: 'Ustawowe widełki: od 1441,80 zł (30% minimalnego wynagrodzenia) do 5652,20 zł (60% prognozowanego przeciętnego wynagrodzenia).',
  salary_joint_taxation_toggle: 'Wspólne rozliczenie z małżonkiem',
  salary_joint_spouse_income_label: 'Roczny dochód małżonka (po odliczeniach)',
  salary_joint_savings_positive: 'Wspólne rozliczenie oszczędza',
  salary_joint_savings_negative: 'Wspólne rozliczenie nie daje korzyści w tym przypadku',
  salary_joint_not_eligible: 'Ta forma opodatkowania B2B nie kwalifikuje się do wspólnego rozliczenia',
  salary_joint_flat_rate_toggle: 'Złożyłem/am u pracodawcy oświadczenie o wspólnym opodatkowaniu (art. 32 ust. 1a pkt 2 ustawy o PIT)',
  salary_joint_flat_rate_hint: 'Dotyczy sytuacji, gdy Twój dochód przekracza pierwszy próg, a małżonek nie osiąga dochodów (lub mieści się w niższym progu) — pracodawca pobiera wtedy zaliczkę 12% przez cały rok zamiast przechodzić na 32% po przekroczeniu 120 000 zł. Ostateczne rozliczenie i tak następuje w rocznym PIT.',
  error_salary_gross: 'Podaj poprawną kwotę wynagrodzenia brutto',
  error_salary_bonus: 'Podaj poprawną kwotę premii',
  error_salary_copyright_share: 'Udział kosztów autorskich musi być między 0 i 100%',
  error_salary_revenue: 'Podaj poprawną kwotę przychodu',
  error_salary_costs: 'Podaj poprawną kwotę kosztów firmowych',
  error_salary_ipbox_share: 'Udział dochodu z IP musi być między 0 i 100%',
  error_salary_maly_zus_base: 'Podstawa Małego ZUS Plus musi mieścić się w widełkach 1441,80 zł – 5652,20 zł',
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
  salary_print: 'Print / Save PDF',
  salary_share_summary_text_single: 'Net salary: {net} (tax {tax}).\nCalculated with Mądra Nadpłata: {url}',
  salary_share_summary_text_annual: 'Annual net salary: {totalNet} (total tax {totalTax}).\nCalculated with Mądra Nadpłata: {url}',
  salary_csv_col_month: 'Month',
  salary_csv_filename: 'annual-settlement',
  salary_csv_col_revenue: 'Revenue',
  salary_csv_col_notes: 'Notes',
  salary_csv_note_elevated: 'higher deductions',
  salary_csv_note_zus: 'lower ZUS contributions',
  salary_announcement_single: 'Salary calculated: net pay {net}, tax {tax}.',
  salary_announcement_annual: 'Annual settlement calculated: total net pay {totalNet}, tax {totalTax}.',
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
  salary_chart_legend_bracket: 'Months in the 32% tax bracket',
  salary_annual_ryczalt_health_crossed: 'Higher health insurance tier (flat-rate tax) crossed in month',
  salary_chart_legend_ryczalt_health: 'Months with higher health insurance (60,000/300,000 zł revenue threshold)',
  salary_annual_copyright_limit_crossed: 'Annual 50% copyright cost limit (60,000 zł) exhausted in month',
  salary_copyright_annual_limit_hint: '50% copyright costs have an annual limit of 60,000 zł (Art. 22(9a) of the PIT Act) — anything above that gets no further KUP.',
  salary_hourly_rate_label: 'Have an hourly rate? Convert it to a monthly amount',
  salary_hourly_rate_suffix: 'zł/h',
  salary_hourly_hours_label: 'Hours per month',
  salary_hourly_hours_suffix: 'hrs',
  salary_hourly_apply_btn: 'Apply',
  salary_hourly_rate_below_min_hint: 'This rate is below the statutory minimum hourly rate for mandate contracts (31.40 zł/h in 2026).',
  salary_hourly_rate_field_label: 'Hourly rate',
  salary_hourly_hours_field_label: 'Number of hours',
  salary_chart_legend_copyright_limit: 'Months after the 50% copyright cost limit is exhausted',
  salary_chart_legend_relief: 'Months after the special relief limit (85,528 zł) is exhausted',
  salary_chart_legend_zus: 'Month the ZUS limit was crossed (fewer deductions)',
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
  salary_ppk_custom_employee_label: 'Employee contribution rate (total)',
  salary_ppk_custom_employer_label: 'Employer contribution rate (total)',
  salary_ppk_custom_hint: 'Total rate (basic + any additional contribution) within the statutory range: 0.5–4% for the employee, 1.5–4% for the employer.',
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
  salary_b2b_liniowy_health_hint: 'Simplification: tax is calculated without the annual deduction of part of the paid health contribution (statutory cap, requires tracking cumulatively through the year) — actual tax may be slightly lower.',
  salary_b2b_ryczalt_rate_label: 'Lump-sum rate',
  salary_b2b_ipbox_share_label: '% of income from qualified IP',
  salary_b2b_zus_label: 'ZUS variant',
  salary_b2b_zus_ulga_na_start: 'Start relief (6 mo., health insurance only)',
  salary_b2b_zus_preferencyjny: 'Preferential ZUS (24 mo.)',
  salary_b2b_zus_maly_zus_plus: 'Small ZUS Plus',
  salary_b2b_zus_pelny: 'Full ZUS',
  salary_b2b_maly_zus_base_label: 'Contribution base (Small ZUS Plus)',
  salary_b2b_maly_zus_base_hint: 'Statutory range: from 1441.80 zł (30% of the minimum wage) to 5652.20 zł (60% of the forecast average wage).',
  salary_joint_taxation_toggle: 'Joint taxation with spouse',
  salary_joint_spouse_income_label: "Spouse's annual taxable income",
  salary_joint_savings_positive: 'Joint taxation saves',
  salary_joint_savings_negative: 'Joint taxation gives no benefit in this case',
  salary_joint_not_eligible: 'This B2B tax form is not eligible for joint taxation',
  salary_joint_flat_rate_toggle: "I've filed a declaration with my employer for joint taxation (Art. 32(1a)(2) of the PIT Act)",
  salary_joint_flat_rate_hint: "Applies when your income exceeds the first bracket but your spouse has no income (or is in a lower bracket) — the employer then withholds a flat 12% all year instead of switching to 32% past 120,000 zł. The final settlement still happens in the annual return.",
  error_salary_gross: 'Enter a valid gross salary amount',
  error_salary_bonus: 'Enter a valid bonus amount',
  error_salary_copyright_share: 'Copyright cost share must be between 0 and 100%',
  error_salary_revenue: 'Enter a valid revenue amount',
  error_salary_costs: 'Enter a valid business costs amount',
  error_salary_ipbox_share: 'IP income share must be between 0 and 100%',
  error_salary_maly_zus_base: 'The Small ZUS Plus contribution base must be between 1441.80 zł and 5652.20 zł',
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
