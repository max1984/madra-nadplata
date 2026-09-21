export type Lang = 'pl' | 'en';

export type TranslationKey =
  | 'nav_knowledge' | 'nav_how' | 'nav_example' | 'nav_faq'
  | 'nav_tools' | 'nav_calc' | 'nav_schedule' | 'tools_divider'
  | 'nav_lang_group' | 'nav_menu'
  | 'hero_badge' | 'hero_h1_full' | 'hero_p'
  | 'hero_stat1_lbl' | 'hero_stat2_lbl' | 'hero_stat3_lbl'
  | 'hero_btn1' | 'hero_btn2'
  | 'how_label' | 'how_title' | 'how_sub'
  | 'step1_h' | 'step1_p' | 'step2_h' | 'step2_p'
  | 'step3_h' | 'step3_p' | 'step4_h' | 'step4_p'
  | 'step5_h' | 'step5_p' | 'step6_h' | 'step6_p'
  | 'how_formula'
  | 'ex_label' | 'ex_title_text' | 'ex_sub_text'
  | 'ex_without' | 'ex_with_header'
  | 'impact_loan' | 'impact_period' | 'impact_payment'
  | 'impact_monthly_total' | 'impact_interest_total'
  | 'impact_total' | 'impact_saved'
  | 'chart_balance' | 'chart_breakdown' | 'chart_download'
  | 'faq_label' | 'faq_title'
  | 'faq_q1' | 'faq_a1' | 'faq_q2' | 'faq_a2'
  | 'faq_q3' | 'faq_a3' | 'faq_q4' | 'faq_a4'
  | 'faq_q5' | 'faq_a5' | 'faq_q6' | 'faq_a6'
  | 'faq_q7' | 'faq_a7'
  | 'calc_label' | 'calc_title' | 'calc_sub'
  | 'form_loan_amount' | 'form_interest' | 'form_months' | 'form_months_unit'
  | 'form_fee' | 'form_fee_hint' | 'form_strategy' | 'form_daily_interest'
  | 'strategy_fixed_total' | 'strategy_fixed_overpay'
  | 'strategy_shorten' | 'strategy_custom'
  | 'slider_total' | 'slider_overpay' | 'slider_std' | 'slider_std_short'
  | 'reduce_payment_hint'
  | 'calc_btn' | 'calc_placeholder' | 'calc_placeholder_sub' | 'calc_announcement' | 'calc_stale'
  | 'shorten_hint' | 'custom_hint'
  | 'stats_saved' | 'stats_faster' | 'stats_payments_instead'
  | 'stats_avg_overpay' | 'stats_total_interest' | 'stats_comparison'
  | 'stats_without' | 'stats_with' | 'stats_saving_prefix' | 'stats_saving_suffix'
  | 'stats_repayment_multiple'
  | 'stats_payments_label' | 'stats_loan_duration'
  | 'stats_half_label' | 'stats_half_hint'
  | 'stats_payoff_date_label' | 'stats_payoff_date_hint'
  | 'sch_label' | 'sch_title' | 'sch_sub'
  | 'sch_col_num' | 'sch_col_bal_before' | 'sch_col_rate'
  | 'sch_col_interest' | 'sch_col_capital' | 'sch_col_overpay'
  | 'sch_col_fee' | 'sch_col_total' | 'sch_col_bal_after'
  | 'toolbar_total' | 'toolbar_paid_at' | 'toolbar_of'
  | 'toolbar_reset' | 'toolbar_clear' | 'toolbar_reset_rates'
  | 'custom_effect_label' | 'custom_effect_shorten' | 'custom_effect_reduce'
  | 'paid_off' | 'schedule_empty'
  | 'footer_disclaimer' | 'footer_author' | 'footer_donate'
  | 'chart_without' | 'chart_with'
  | 'chart_interest_without' | 'chart_capital_without'
  | 'chart_interest_with' | 'chart_capital_with'
  | 'chart_year' | 'currency' | 'years' | 'years1' | 'months_short'
  | 'hero_note'
  | 'error_loan_amount' | 'error_months' | 'error_rate' | 'error_prepay_fee'
  | 'error_refi_rate' | 'error_refi_months' | 'error_refi_month' | 'error_refi_fee'
  | 'error_overpay_start'
  | 'copy_link' | 'copy_link_copied' | 'reset_defaults' | 'share_native'
  | 'copy_summary' | 'copy_summary_copied' | 'share_summary_text'
  | 'scenario_name_placeholder' | 'scenario_save' | 'scenario_saved_title'
  | 'scenario_sort_label' | 'scenario_sort_newest' | 'scenario_sort_oldest' | 'scenario_sort_name'
  | 'scenario_load' | 'scenario_delete' | 'scenario_diff_label' | 'scenario_rename_hint'
  | 'scenario_delete_confirm' | 'scenario_delete_cancel'
  | 'scenario_export' | 'scenario_import' | 'scenario_import_success' | 'scenario_import_empty'
  | 'scenario_export_csv'
  | 'scenario_compare_col_name' | 'scenario_compare_col_amount' | 'scenario_compare_col_rate'
  | 'scenario_compare_col_strategy' | 'scenario_compare_col_months' | 'scenario_compare_col_interest'
  | 'scenario_compare_col_saved_interest' | 'scenario_compare_col_saved_months'
  | 'scenario_active_badge' | 'scenario_active_hint'
  | 'scenario_copy_link' | 'scenario_copy_link_copied' | 'scenario_copy_summary'
  | 'scenario_duplicate' | 'scenario_copy_suffix'
  | 'csv_export' | 'sch_print'
  | 'overpay_start_label' | 'overpay_start_hint'
  | 'extra_annual_label' | 'extra_annual_hint'
  | 'row_effect_shorten' | 'row_effect_reduce'
  | 'invest_section_title' | 'invest_rate_label' | 'invest_gain_label' | 'invest_saved_label'
  | 'invest_verdict_overpay' | 'invest_verdict_invest'
  | 'breakeven_label' | 'breakeven_result' | 'breakeven_never'
  | 'no_overpay_title' | 'no_overpay_sub'
  | 'sch_yearly_toggle' | 'sch_monthly_toggle' | 'sch_col_year'
  | 'sch_jump_placeholder' | 'sch_jump_btn' | 'sch_jump_link' | 'sch_jump_link_copied'
  | 'custom_base_title' | 'custom_base_hint'
  | 'overpay_day_tip'
  | 'ad_consent_text' | 'ad_consent_accept' | 'ad_consent_decline' | 'ad_consent_policy'
  | 'ad_label' | 'partner_label' | 'partner_title' | 'partner_body' | 'partner_disclosure'
  | 'bank_offers_label' | 'bank_offers_title' | 'bank_offers_sub'
  | 'bank_offers_col_bank' | 'bank_offers_col_rate' | 'bank_offers_col_valid'
  | 'bank_offers_col_diff' | 'bank_offers_col_note' | 'bank_offers_disclaimer'
  | 'strategy_goal' | 'goal_hint' | 'goal_years_label' | 'goal_target_label'
  | 'goal_required_overpay' | 'goal_required_total' | 'goal_already_met'
  | 'goal_unreachable' | 'error_goal_months'
  | 'rate_shock_title' | 'rate_shock_hint' | 'rate_shock_more'
  | 'holiday_title' | 'holiday_hint' | 'holiday_scenario'
  | 'strategy_refinance'
  | 'refi_hint' | 'refi_month_label' | 'refi_remaining_hint'
  | 'refi_new_rate_label' | 'refi_new_months_label'
  | 'refi_origination_fee_label' | 'refi_origination_fee_hint' | 'refi_flat_fee_label'
  | 'refi_balance_label' | 'refi_fees_label'
  | 'refi_phase1_int_label' | 'refi_phase2_int_label'
  | 'refi_net_saving' | 'refi_net_cost'
  | 'refi_break_even' | 'refi_separator' | 'refi_new_payment_label'
  | 'refi_no_overpay_note' | 'refi_no_invest_note'
  | 'overpay_start_now'
  | 'nav_support'
  | 'sup_label' | 'sup_title' | 'sup_sub'
  | 'sup_badge_active' | 'sup_badge_ended'
  | 'sup_fwk_title' | 'sup_fwk_1' | 'sup_fwk_2' | 'sup_fwk_3' | 'sup_fwk_4' | 'sup_fwk_5'
  | 'sup_loan_title' | 'sup_loan_1' | 'sup_loan_2' | 'sup_loan_3'
  | 'sup_holidays_title' | 'sup_holidays_1' | 'sup_holidays_2' | 'sup_holidays_3'
  | 'sup_note'
  | 'close';

type Translations = Record<TranslationKey, string>;

const pl: Translations = {
  nav_knowledge: 'Wiedza', nav_how: 'Jak to działa', nav_example: 'Przykład', nav_faq: 'FAQ',
  nav_tools: 'Narzędzia', nav_calc: 'Kalkulator', nav_schedule: 'Harmonogram',
  tools_divider: 'Narzędzia kalkulatora',
  nav_lang_group: 'Język', nav_menu: 'Menu',
  hero_badge: 'Edukacja finansowa',
  hero_h1_full: 'Małe nadpłaty.<br /><span>Gigantyczne oszczędności.</span>',
  hero_p: 'Dowiedz się, jak regularne nadpłacanie kredytu hipotecznego może zaoszczędzić Ci dziesiątki lub nawet setki tysięcy złotych i skrócić kredyt o kilka lat.',
  hero_stat1_lbl: 'zaoszczędzone odsetki*', hero_stat2_lbl: 'szybsza spłata*', hero_stat3_lbl: 'łącznie do banku / mies.*',
  hero_btn1: 'Oblicz swoją nadpłatę →', hero_btn2: 'Jak to działa',
  how_label: 'Podstawy', how_title: 'Jak działa nadpłata kredytu?',
  how_sub: 'Każda złotówka wpłacona ponad ratę bezpośrednio redukuje kapitał – a mniejszy kapitał to mniejsze odsetki każdego kolejnego miesiąca.',
  step1_h: 'Rata = odsetki + kapitał',
  step1_p: 'Miesięczna rata składa się z dwóch części. Na początku kredytu większość to odsetki – dopiero z czasem proporcja się odwraca. Właśnie dlatego nadpłata na początku robi największą różnicę.',
  step2_h: 'Nadpłata spłaca kapitał',
  step2_p: 'Każda nadpłata trafia bezpośrednio w saldo kredytu. Mniejszy kapitał → niższe odsetki w kolejnym miesiącu → więcej pieniędzy idzie w kapitał. Efekt kuli śnieżnej działający na Twoją korzyść.',
  step3_h: 'Dwa efekty nadpłaty',
  step3_p: '<strong>Skrócenie okresu:</strong> rata pozostaje na tym samym poziomie, a kredyt kończy się wcześniej – to finansowo korzystniejsza opcja.<br /><br /><strong>Obniżenie raty:</strong> bank zmniejsza miesięczną ratę, ale termin spłaty pozostaje bez zmian.',
  step4_h: 'Uwaga na prowizję',
  step4_p: 'Niektóre banki pobierają prowizję za nadpłatę (zazwyczaj 1–3%, przez pierwsze 3 lata). Sprawdź umowę! Nawet z prowizją nadpłata zwykle się opłaca – kalkulator uwzględnia ten koszt.',
  step5_h: 'Zmienne oprocentowanie',
  step5_p: 'Kredyty ze zmienną stopą reagują na decyzje banku centralnego. Kalkulator pozwala zmienić oprocentowanie dla dowolnego miesiąca w harmonogramie – zobaczysz skutki zmiany stóp od razu.',
  step6_h: 'Efekt jest skumulowany',
  step6_p: 'Nawet 500 zł powyżej raty miesięcznie przy kredycie na 300 000 zł (6%, 30 lat) może zaoszczędzić Ci ponad 80 000 zł i skrócić kredyt o kilka lat. Sprawdź sam w kalkulatorze poniżej.',
  how_formula: '<strong>Kluczowy wzór:</strong> Odsetki miesięczne = Saldo kredytu × (Oprocentowanie roczne ÷ 12). Im szybciej zredukcujesz saldo, tym mniej zapłacisz odsetek – i to kumuluje się przez całe lata.',
  ex_label: 'Przykład z życia',
  ex_title_text: '300 000 zł kredytu – co zmienia startowa nadpłata 500 zł miesięcznie?',
  ex_sub_text: 'Strategia: stała kwota do banku. Standardowa rata: {std}. Startowa nadpłata: 500 zł/mies.',
  ex_without: 'Bez nadpłaty', ex_with_header: 'Stała kwota {total} / mies.',
  impact_loan: 'Kwota kredytu', impact_period: 'Okres spłaty', impact_payment: 'Miesięczna rata',
  impact_monthly_total: 'Miesięczna wpłata', impact_interest_total: 'Łączne odsetki',
  impact_total: 'Łącznie do banku', impact_saved: 'Oszczędność',
  chart_balance: 'Saldo kredytu w czasie', chart_breakdown: 'Odsetki vs. kapitał (podział roczny)',
  chart_download: '🖼️ Pobierz wykres (PNG)',
  faq_label: 'Pytania i odpowiedzi', faq_title: 'Najczęstsze pytania',
  faq_q1: 'Czy nadpłata zawsze się opłaca?',
  faq_a1: 'W ogromnej większości przypadków tak – szczególnie przy kredytach ze zmiennym oprocentowaniem. Porównaj oprocentowanie kredytu z potencjalnym zyskiem z inwestycji. Jeśli kredyt kosztuje Cię 6–8%, a bezpieczna lokata daje 4–5%, nadpłata jest racjonalnym wyborem.',
  faq_q2: 'Kiedy najlepiej zacząć nadpłacać?',
  faq_a2: 'Im wcześniej, tym lepiej – na początku kredytu odsetki stanowią największą część raty. Każda złotówka nadpłaty w pierwszych latach "zarabia" wielokrotnie więcej niż ta sama złotówka nadpłacona pod koniec.',
  faq_q3: 'Lepiej skrócić okres czy obniżyć ratę po nadpłacie?',
  faq_a3: 'Finansowo korzystniejsze jest skrócenie okresu – mniej rat oznacza mniej odsetek. Jednak obniżenie raty może mieć sens, jeśli zależy Ci na poprawie płynności. Możesz też stosować strategię hybrydową: obniżać ratę, ale nadal wpłacać poprzednią kwotę.',
  faq_q4: 'Co to jest prowizja za nadpłatę i jak na nią uważać?',
  faq_a4: 'Prawo bankowe pozwala bankom pobierać prowizję za wcześniejszą spłatę przez pierwsze 36 miesięcy. Po 3 latach prowizja jest zazwyczaj niedozwolona. Sprawdź umowę – wiele banków nie pobiera jej wcale.',
  faq_q5: 'Nadpłata a poduszka finansowa – co pierwsze?',
  faq_a5: 'Zasada ogólna: najpierw zbuduj poduszkę finansową na 3–6 miesięcy wydatków, dopiero potem nadpłacaj. Brak poduszki to ryzyko sięgania po drogi kredyt konsumpcyjny.',
  faq_q6: 'Czy nadpłatę mogę cofnąć lub wycofać?',
  faq_a6: 'Nie – nadpłata to trwałe zmniejszenie salda kredytu i nie można jej "cofnąć". Dlatego trzymaj poduszkę finansową osobno i nadpłacaj tylko wolne środki.',
  faq_q7: 'Jak poinformować bank o nadpłacie?',
  faq_a7: 'Najczęściej wystarczy przelew na numer rachunku kredytowego z odpowiednim tytułem (np. "nadpłata kredytu nr XXXX – spłata kapitału"). Sprawdź regulamin lub zadzwoń na infolinię.',
  calc_label: 'Narzędzie', calc_title: 'Kalkulator nadpłaty kredytu',
  calc_sub: 'Wprowadź dane swojego kredytu i sprawdź, ile możesz zaoszczędzić. Możesz wybrać strategię nadpłaty i edytować oprocentowanie w każdym miesiącu harmonogramu.',
  form_loan_amount: 'Kwota kredytu (pozostałe saldo)',
  form_interest: 'Oprocentowanie roczne', form_months: 'Pozostała liczba rat (mies.)',
  form_months_unit: 'mies.', form_fee: 'Prowizja za nadpłatę',
  form_fee_hint: 'Sprawdź w umowie – często 0% po 3 latach od uruchomienia kredytu',
  form_daily_interest: '≈ dziennie w odsetkach przy obecnym saldzie:',
  form_strategy: 'Strategia nadpłaty',
  strategy_fixed_total: 'Stała kwota do banku (rata + nadpłata)',
  strategy_fixed_overpay: 'Stała miesięczna nadpłata',
  strategy_shorten: 'Skrócenie okresu (stała rata, zmienna długość)',
  strategy_custom: 'Własne nadpłaty (wybierz miesiące w harmonogramie)',
  slider_total: 'Łączna kwota do banku', slider_overpay: 'Nadpłata miesięczna',
  slider_std: 'Standardowa rata:',
  slider_std_short: 'Rata',
  reduce_payment_hint: 'Ustal stałą kwotę, którą chcesz co miesiąc wpłacać do banku. Każda nadwyżka ponad wymaganą ratę obniża saldo – bank co miesiąc wylicza nową, niższą ratę wymaganą, a Ty nadal płacisz tę samą kwotę. Różnica rośnie, kredyt spłaca się coraz szybciej.',
  calc_btn: 'Oblicz →',
  calc_placeholder: 'Kliknij "Oblicz" aby zobaczyć wyniki',
  calc_placeholder_sub: 'Wypełnij formularz po lewej i wciśnij przycisk. Wyniki pojawią się tutaj razem z wykresem i harmonogramem spłat.',
  calc_announcement: 'Wyliczono harmonogram: {months} rat, łączne odsetki {interest}.',
  calc_stale: '⚠ Zmieniłeś dane — wyniki poniżej są nieaktualne. Kliknij „Oblicz”, aby je odświeżyć.',
  shorten_hint: 'Rata regularnej spłaty pozostaje stała na poziomie oryginalnej raty. Stała nadpłata co miesiąc skraca okres kredytowania – im wyższa, tym szybciej kredyt zostanie spłacony. Ostatnia rata może być mniejsza niż standardowa.',
  custom_hint: 'Po kliknięciu <strong>Oblicz</strong> pojawią się wszystkie raty z pustymi polami nadpłat. Wpisz dowolną kwotę w wybranym miesiącu – wyniki zaktualizują się automatycznie.',
  stats_saved: 'zaoszczędzone odsetki', stats_faster: 'szybsza spłata',
  stats_payments_instead: 'zamiast', stats_avg_overpay: 'śr. nadpłata / mies.',
  stats_total_interest: 'łączne odsetki', stats_comparison: 'Porównanie łącznych kosztów',
  stats_without: 'Bez nadpłaty', stats_with: 'Z nadpłatą',
  stats_saving_prefix: 'Oszczędzasz', stats_saving_suffix: 'łącznych odsetek na tle scenariusza bez nadpłaty.',
  stats_repayment_multiple: 'Bez nadpłaty oddałbyś bankowi łącznie {base}× pożyczonej kwoty — z nadpłatą tylko {with}×.',
  stats_payments_label: 'rat',
  stats_loan_duration: 'czas trwania kredytu',
  stats_half_label: 'połowa kapitału spłacona za', stats_half_hint: 'Za tyle czasu saldo kredytu spadnie do połowy dzisiejszej kwoty.',
  stats_payoff_date_label: 'spłata kredytu',
  stats_payoff_date_hint: 'Szacowana data ostatniej raty, licząc od dzisiaj.',
  sch_label: 'Szczegóły', sch_title: 'Harmonogram spłat',
  sch_sub: 'Tabela generuje się automatycznie po obliczeniu. Edytuj nadpłatę lub oprocentowanie dla dowolnego miesiąca – zmiany propagują się automatycznie.',
  sch_col_num: 'Rata #', sch_col_bal_before: 'Saldo przed ratą', sch_col_rate: 'Oprocent. %',
  sch_col_interest: 'Odsetki', sch_col_capital: 'Kapitał', sch_col_overpay: 'Nadpłata (edytuj)',
  sch_col_fee: 'Prowizja', sch_col_total: 'Łącznie do banku', sch_col_bal_after: 'Saldo po racie',
  toolbar_total: 'Łącznie nadpłacono:', toolbar_paid_at: 'Kredyt spłacony w racie:',
  toolbar_of: 'z', toolbar_reset: 'Przywróć domyślne', toolbar_clear: 'Wyczyść nadpłaty',
  toolbar_reset_rates: 'Przywróć oprocentowanie',
  custom_effect_label: 'Efekt nadpłaty',
  custom_effect_shorten: 'Skrócenie okresu',
  custom_effect_reduce: 'Zmniejszenie raty',
  paid_off: 'Kredyt spłacony',
  schedule_empty: 'Najpierw oblicz wyniki w sekcji Kalkulator powyżej.',
  footer_disclaimer: 'Strona edukacyjna – nie stanowi porady finansowej. Wyniki kalkulatora mają charakter poglądowy.<br />Przed podjęciem decyzji skonsultuj się z doradcą finansowym lub przeczytaj umowę kredytową.',
  footer_author: 'Autor kalkulatora:',
  footer_donate: 'Postaw mi kawę ☕',
  chart_without: 'Bez nadpłaty', chart_with: 'Z nadpłatą',
  chart_interest_without: 'Odsetki (bez nadpłaty)', chart_capital_without: 'Kapitał (bez nadpłaty)',
  chart_interest_with: 'Odsetki (z nadpłatą)', chart_capital_with: 'Kapitał (z nadpłatą)',
  chart_year: 'Rok', currency: 'zł', years: 'lat', years1: 'rok', months_short: 'mies.',
  hero_note: '* przykład: kredyt {amount} zł, {years} lat, {rate}%, łącznie {total} zł/mies. do banku',
  error_loan_amount: 'Kwota kredytu musi wynosić od 1 000 do 10 000 000 zł.',
  error_months: 'Liczba rat musi wynosić od 12 do 360.',
  error_rate: 'Oprocentowanie musi wynosić od 0,01% do 25%.',
  error_prepay_fee: 'Prowizja za nadpłatę musi wynosić od 0% do 5%.',
  error_refi_rate: 'Oprocentowanie nowego kredytu musi wynosić od 0,01% do 25%.',
  error_refi_months: 'Okres nowego kredytu musi wynosić od 12 do 360 miesięcy.',
  error_refi_month: 'Miesiąc refinansowania musi mieścić się w okresie kredytu.',
  error_refi_fee: 'Prowizja za udzielenie nowego kredytu musi wynosić od 0% do 10%, a opłata stała nie może być ujemna.',
  error_overpay_start: 'Opóźnienie startu nadpłaty musi mieścić się w okresie kredytu.',
  copy_link: 'Kopiuj link',
  copy_link_copied: '✓ Skopiowano!',
  reset_defaults: '↺ Przywróć domyślne dane',
  share_native: '📤 Udostępnij',
  copy_summary: '📋 Kopiuj podsumowanie', copy_summary_copied: '✓ Skopiowano podsumowanie!',
  share_summary_text: 'Kredyt {amount} zł, {rate}% na {months} mies.\nZ nadpłatą: spłacę w {withMonths} rat (o {savedTime} szybciej) i zaoszczędzę {saved} odsetek.\nPoliczone w kalkulatorze Mądra Nadpłata: {url}',
  scenario_name_placeholder: 'Nazwa scenariusza (np. "Wariant z nadpłatą 500 zł")',
  scenario_save: '💾 Zapisz scenariusz',
  scenario_saved_title: 'Zapisane scenariusze',
  scenario_sort_label: 'Sortuj scenariusze',
  scenario_sort_newest: 'Najnowsze',
  scenario_sort_oldest: 'Najstarsze',
  scenario_sort_name: 'Nazwa (A-Z)',
  scenario_load: 'Wczytaj',
  scenario_delete: 'Usuń',
  scenario_delete_confirm: 'Na pewno?',
  scenario_delete_cancel: 'Anuluj',
  scenario_export: '⬇️ Eksportuj',
  scenario_import: '⬆️ Importuj',
  scenario_import_success: 'Zaimportowano {n} scenariuszy',
  scenario_import_empty: 'Nie znaleziono poprawnych scenariuszy w pliku',
  scenario_export_csv: '📊 Eksportuj porównanie (CSV)',
  scenario_compare_col_name: 'Nazwa',
  scenario_compare_col_amount: 'Kwota kredytu',
  scenario_compare_col_rate: 'Oprocentowanie',
  scenario_compare_col_strategy: 'Strategia',
  scenario_compare_col_months: 'Liczba rat',
  scenario_compare_col_interest: 'Łączne odsetki',
  scenario_compare_col_saved_interest: 'Oszczędność na odsetkach',
  scenario_compare_col_saved_months: 'Skrócenie (miesiące)',
  scenario_active_badge: 'Aktywny',
  scenario_active_hint: 'Dane w formularzu dokładnie odpowiadają temu scenariuszowi',
  scenario_copy_link: '🔗 Link',
  scenario_copy_link_copied: '✓ Skopiowano',
  scenario_copy_summary: '📋 Podsumowanie',
  scenario_diff_label: 'Różnica względem aktualnego wyniku (odsetki / raty)',
  scenario_rename_hint: 'Kliknij, aby zmienić nazwę',
  scenario_duplicate: '📄 Duplikuj',
  scenario_copy_suffix: '(kopia)',
  csv_export: 'Pobierz CSV',
  sch_print: 'Drukuj / Zapisz PDF',
  overpay_start_label: 'Zacznij nadpłacać od miesiąca',
  overpay_start_now: 'Od razu',
  overpay_start_hint: 'Miesiąc 0 = od razu. Przydatne, gdy nadpłatę planujesz za kilka miesięcy (np. po wykończeniu mieszkania).',
  extra_annual_label: '💰 Dodatkowa (13.) rata raz w roku',
  extra_annual_hint: 'Raz w roku wpłać dodatkowo jedną pełną standardową ratę, ponad zwykłą nadpłatę — polski odpowiednik popularnych w USA/UK płatności co dwa tygodnie (efektywnie 13 rat zamiast 12 rocznie).',
  row_effect_shorten: 'Skrócenie',
  row_effect_reduce: 'Zmniejszenie',
  invest_section_title: 'Co gdybyś inwestował zamiast nadpłacać?',
  invest_rate_label: 'Zakładana roczna stopa zwrotu',
  invest_gain_label: 'Zysk z inwestycji (wartość końcowa – wpłacone)',
  invest_saved_label: 'Oszczędność na odsetkach (nadpłata)',
  invest_verdict_overpay: 'Nadpłata korzystniejsza o',
  invest_verdict_invest: 'Inwestycja korzystniejsza o',
  breakeven_label: 'Opłacalność prowizji za nadpłatę',
  breakeven_result: 'Prowizja zwraca się po miesiącu',
  breakeven_never: 'Prowizja pochłania więcej niż zaoszczędzone odsetki',
  no_overpay_title: 'Brak nadpłaty',
  no_overpay_sub: 'Ustaw kwotę wyższą niż standardowa rata, aby zobaczyć oszczędności.',
  sch_yearly_toggle: 'Widok roczny',
  sch_monthly_toggle: 'Widok miesięczny',
  sch_jump_placeholder: 'Nr miesiąca',
  sch_jump_btn: 'Skocz',
  sch_jump_link: '🔗 Link do miesiąca',
  sch_jump_link_copied: '✓ Skopiowano',
  sch_col_year: 'Rok',
  custom_base_title: 'Koszty bazowe kredytu',
  custom_base_hint: 'Dodaj nadpłaty w harmonogramie poniżej – wyniki zaktualizują się automatycznie.',
  overpay_day_tip: '💡 Najlepszym dniem na nadpłatę jest dzień spłaty raty kapitałowo-odsetkowej – ze względu na różne podejścia banków do naliczania odsetek, wpłata w tym dniu jest zawsze bezpieczna.',
  ad_consent_text: 'Ta strona wyświetla reklamy Google AdSense. Akceptując, zgadzasz się na personalizowanie reklam na podstawie Twoich zainteresowań. Odrzucając, zobaczysz reklamy niespersonalizowane. Dane nie są sprzedawane osobom trzecim.',
  ad_label: 'Reklama',
  partner_label: 'Oferta partnerska',
  partner_title: 'Niższe oprocentowanie działa jak nadpłata – tylko bez wpłacania ani złotówki',
  partner_body: 'Przy Twoim saldzie i okresie spłaty oprocentowanie niższe o 1 punkt procentowy oznacza {amount} mniej odsetek. Jeśli od zaciągnięcia kredytu minęło trochę czasu, warto sprawdzić, czy inny bank nie da Ci dziś lepszych warunków.',
  partner_disclosure: 'To linki partnerskie – jeśli skorzystasz z oferty, strona może dostać prowizję. Nie zmienia to wyników kalkulatora ani warunków, które dostaniesz od banku.',
  bank_offers_label: 'Oferty banków',
  bank_offers_title: 'Aktualne oferty kredytów hipotecznych',
  bank_offers_sub: 'Ręcznie zebrane oferty banków — sprawdzaj datę ważności i zawsze zweryfikuj szczegóły bezpośrednio w banku przed decyzją.',
  bank_offers_col_bank: 'Bank',
  bank_offers_col_rate: 'Oprocentowanie',
  bank_offers_col_valid: 'Oferta ważna do',
  bank_offers_col_diff: 'Różnica w odsetkach',
  bank_offers_col_note: 'Uwagi',
  bank_offers_disclaimer: 'Dane aktualizowane ręcznie i mogą się zdezaktualizować — to nie jest wiążąca oferta banku. Zawsze zweryfikuj warunki bezpośrednio przed podjęciem decyzji.',
  ad_consent_accept: 'Akceptuj',
  ad_consent_decline: 'Odrzuć',
  ad_consent_policy: 'Polityka prywatności',
  strategy_goal: 'Cel spłaty (podaj termin – policzę nadpłatę)',
  goal_hint: 'Odwrócone pytanie: zamiast zgadywać kwotę nadpłaty, podaj datę, do której chcesz mieć kredyt spłacony. Kalkulator wyliczy najmniejszą stałą nadpłatę, która pozwala zdążyć. Rata regularna zostaje bez zmian – nadpłata skraca okres.',
  goal_years_label: 'Chcę spłacić kredyt w ciągu',
  goal_target_label: 'Cel:',
  goal_required_overpay: 'wymagana nadpłata / mies.',
  goal_required_total: 'łącznie do banku / mies.',
  goal_already_met: 'Ten cel osiągniesz bez nadpłacania – kredyt i tak kończy się wcześniej.',
  goal_unreachable: 'Przy tak krótkim terminie nadpłata przekracza sensowne widełki. Wydłuż cel albo sprawdź saldo kredytu.',
  rate_shock_title: 'Test odporności na wzrost oprocentowania',
  rate_shock_hint: 'Jak zmieniłaby się Twoja rata, gdyby oprocentowanie wzrosło?',
  rate_shock_more: 'więcej miesięcznie',
  holiday_title: 'Wakacje kredytowe',
  holiday_hint: 'Co się zmieni, jeśli zawiesisz spłatę na kilka miesięcy? Zakładamy, że w tym czasie nic nie płacisz, a odsetki dopisują się do salda — szczegóły zależą od Twojego banku.',
  holiday_scenario: '{n} mies. wakacji → odsetki rosną o {amount}',
  error_goal_months: 'Cel spłaty musi mieścić się między 1 miesiącem a pozostałą liczbą rat.',
  strategy_refinance: 'Refinansowanie (nowy kredyt na inne warunki)',
  refi_hint: 'Symuluje zamknięcie obecnego kredytu i zaciągnięcie nowego na wybranych warunkach. Prowizja i opłaty jednorazowe naliczane są od salda w momencie refinansowania. Miesiąc 0 oznacza refinansowanie od razu – prowizja liczona od pełnej kwoty kredytu.',
  refi_month_label: 'Refinansuj po miesiącu',
  refi_remaining_hint: 'Pozostałe raty bez refinansowania:',
  refi_new_rate_label: 'Oprocentowanie nowego kredytu',
  refi_new_months_label: 'Okres nowego kredytu',
  refi_origination_fee_label: 'Prowizja za udzielenie kredytu',
  refi_origination_fee_hint: '% od salda w dniu refinansowania',
  refi_flat_fee_label: 'Inne opłaty jednorazowe',
  refi_balance_label: 'Saldo do refinansowania',
  refi_fees_label: 'Łączne opłaty jednorazowe',
  refi_phase1_int_label: 'Odsetki – stary kredyt',
  refi_phase2_int_label: 'Odsetki – nowy kredyt',
  refi_net_saving: 'Oszczędność netto refinansowania',
  refi_net_cost: 'Dodatkowy koszt refinansowania',
  refi_break_even: 'Opłaty zwracają się po miesiącu:',
  refi_separator: '↓ Refinansowanie',
  refi_new_payment_label: 'Nowa rata po refinansowaniu',
  refi_no_overpay_note: 'W trybie refinansowania nadpłaty nie są uwzględniane. Aby modelować nadpłaty, użyj strategii bez refinansowania.',
  refi_no_invest_note: 'Porównanie z inwestycją niedostępne w trybie refinansowania.',
  nav_support: 'Wsparcie',
  sup_label: 'Pomoc dla zadłużonych', sup_title: 'Aktualne wsparcie dla kredytobiorców',
  sup_sub: 'Poza samodzielną nadpłatą istnieją ustawowe formy pomocy dla osób, które mają problem ze spłatą kredytu hipotecznego. Oto co obowiązuje we wrześniu 2026 r.',
  sup_badge_active: 'Aktywne', sup_badge_ended: 'Zakończone',
  sup_fwk_title: 'Fundusz Wsparcia Kredytobiorców (FWK)',
  sup_fwk_1: 'Dla kogo: bezrobocie jednego z kredytobiorców, rata przekraczająca 40% dochodu gospodarstwa domowego (RdD) lub bardzo niski dochód po odjęciu raty.',
  sup_fwk_2: 'Wysokość: do 3000 zł miesięcznie, maksymalnie przez 40 miesięcy — łącznie do 120 000 zł.',
  sup_fwk_3: 'Spłata: dopiero po 2 latach od ostatniej wypłaty wsparcia, w 200 równych, nieoprocentowanych ratach.',
  sup_fwk_4: 'Umorzenie: jeśli spłacisz terminowo pierwsze 134 raty, pozostałe do 66 rat (nawet ok. 39 600 zł) zostaje umorzone.',
  sup_fwk_5: 'Warunek: kredytobiorca nie może być właścicielem innej nieruchomości mieszkalnej.',
  sup_loan_title: 'Pożyczka na spłatę zadłużenia',
  sup_loan_1: 'Dla kogo: sprzedałeś kredytowane mieszkanie lub dom, ale kwota ze sprzedaży nie wystarczyła na spłatę całego zadłużenia.',
  sup_loan_2: 'Finansowana z tego samego funduszu co FWK — pokrywa różnicę między ceną sprzedaży a saldem kredytu.',
  sup_loan_3: 'Zasady spłaty i możliwość częściowego umorzenia takie same jak w Funduszu Wsparcia Kredytobiorców.',
  sup_holidays_title: 'Ustawowe wakacje kredytowe',
  sup_holidays_1: 'Ostatnia edycja obowiązywała w 2024 r. — zawieszenie spłaty łącznie na kilka miesięcy dla kredytów w PLN zaciągniętych przed 1 lipca 2022 r.',
  sup_holidays_2: 'Od 2025 r. nie ma nowej ustawowej edycji programu — nie licz na automatyczne zawieszenie raty z mocy prawa.',
  sup_holidays_3: 'Alternatywa: „wakacje kredytowe umowne” — indywidualna decyzja banku. Warto zapytać o zawieszenie lub wydłużenie spłaty bezpośrednio w swoim banku.',
  sup_note: 'Stan na wrzesień 2026 r. Progi dochodowe i szczegółowe warunki bywają aktualizowane — przed złożeniem wniosku sprawdź bieżące zasady u swojego kredytodawcy lub w Banku Gospodarstwa Krajowego (BGK), operatorze funduszu.',
  close: 'Zamknij',
};

const en: Translations = {
  nav_knowledge: 'Learn', nav_how: 'How it works', nav_example: 'Example', nav_faq: 'FAQ',
  nav_tools: 'Tools', nav_calc: 'Calculator', nav_schedule: 'Schedule',
  tools_divider: 'Calculator Tools',
  nav_lang_group: 'Language', nav_menu: 'Menu',
  hero_badge: 'Financial Education',
  hero_h1_full: 'Small overpayments.<br /><span>Massive savings.</span>',
  hero_p: 'Discover how regular mortgage overpayments can save you tens or hundreds of thousands and pay off your loan years early.',
  hero_stat1_lbl: 'interest saved*', hero_stat2_lbl: 'faster payoff*', hero_stat3_lbl: 'total to bank / mo.*',
  hero_btn1: 'Calculate your savings →', hero_btn2: 'How it works',
  how_label: 'Basics', how_title: 'How does overpaying work?',
  how_sub: 'Every unit of currency paid above the required amount directly reduces your principal — a smaller principal means less interest each month.',
  step1_h: 'Payment = interest + principal',
  step1_p: "Monthly payments consist of two parts. Early in the loan, most goes to interest — the ratio reverses over time. That's why early overpayments make the biggest difference.",
  step2_h: 'Overpayment reduces principal',
  step2_p: 'Every overpayment goes directly to the loan balance. Less principal → less interest next month → more goes to principal. A snowball effect working in your favor.',
  step3_h: 'Two effects of overpayment',
  step3_p: '<strong>Shorten the term:</strong> your payment stays the same and the loan ends earlier — this is the more financially beneficial option.<br /><br /><strong>Reduce the payment:</strong> the bank lowers your monthly payment while keeping the same end date.',
  step4_h: 'Watch out for prepayment fees',
  step4_p: "Some banks charge a fee for overpayments (typically 1–3%, in the first 3 years). Check your contract! Even with a fee, overpaying usually pays off — the calculator accounts for this cost.",
  step5_h: 'Variable interest rates',
  step5_p: "Variable rate mortgages respond to central bank decisions. The calculator lets you change the interest rate for any month in the schedule — you'll see the effect of rate changes immediately.",
  step6_h: 'The effect compounds',
  step6_p: 'Even 500 PLN above your monthly payment on a 300,000 PLN loan (6%, 30 years) can save you over 80,000 PLN and shorten the loan by several years. Try it yourself in the calculator below.',
  how_formula: '<strong>Key formula:</strong> Monthly interest = Loan balance × (Annual rate ÷ 12). The faster you reduce the balance, the less interest you pay — and this compounds over years.',
  ex_label: 'Real example',
  ex_title_text: '300,000 PLN mortgage – what does a starting 500 PLN/month overpayment change?',
  ex_sub_text: 'Strategy: fixed total to bank. Standard payment: {std}. Starting overpayment: 500 PLN/mo.',
  ex_without: 'Without overpayment', ex_with_header: 'Fixed total {total}/month',
  impact_loan: 'Loan amount', impact_period: 'Repayment period', impact_payment: 'Monthly payment',
  impact_monthly_total: 'Monthly total', impact_interest_total: 'Total interest',
  impact_total: 'Total to bank', impact_saved: 'Savings',
  chart_balance: 'Loan balance over time', chart_breakdown: 'Interest vs. principal (annual breakdown)',
  chart_download: '🖼️ Download chart (PNG)',
  faq_label: 'Q&A', faq_title: 'Frequently Asked Questions',
  faq_q1: 'Is overpaying always worth it?',
  faq_a1: "In the vast majority of cases, yes — especially with variable rate mortgages. Compare your loan rate with potential investment returns. If your loan costs 6–8% and safe deposits offer 4–5%, overpaying is the rational choice.",
  faq_q2: 'When is the best time to start overpaying?',
  faq_a2: 'The sooner the better — early in the loan, interest makes up most of the payment. Every unit of overpayment in the early years "earns" many times more than the same amount overpaid near the end.',
  faq_q3: 'Is it better to shorten the term or reduce the monthly payment?',
  faq_a3: 'Financially, shortening the term is better — fewer payments means less interest. However, reducing the payment may make sense if you need to improve cash flow.',
  faq_q4: 'What is a prepayment fee and how to avoid it?',
  faq_a4: "Banking law allows banks to charge a fee for early repayment during the first 36 months. After 3 years the fee is typically not allowed. Check your contract — many banks don't charge it at all.",
  faq_q5: 'Overpayment vs. emergency fund — which comes first?',
  faq_a5: 'General rule: build an emergency fund for 3–6 months of expenses first, then start overpaying. Without a safety net you risk needing expensive consumer credit.',
  faq_q6: 'Can I reverse or withdraw an overpayment?',
  faq_a6: "No — an overpayment is a permanent reduction of the loan balance and cannot be undone. Keep your emergency fund separate and only overpay with money you won't need.",
  faq_q7: 'How do I notify the bank about an overpayment?',
  faq_a7: 'Usually a bank transfer to the loan account with the appropriate reference is sufficient (e.g. "overpayment loan no. XXXX – capital repayment"). Check your terms or call the helpline.',
  calc_label: 'Tool', calc_title: 'Mortgage Overpayment Calculator',
  calc_sub: 'Enter your loan details and see how much you can save. Choose an overpayment strategy and edit the interest rate for any month in the schedule.',
  form_loan_amount: 'Loan amount (remaining balance)',
  form_interest: 'Annual interest rate', form_months: 'Remaining months (mo.)',
  form_months_unit: 'mo.', form_fee: 'Prepayment fee',
  form_fee_hint: 'Check your contract – often 0% after 3 years from loan origination',
  form_daily_interest: '≈ daily interest at your current balance:',
  form_strategy: 'Overpayment strategy',
  strategy_fixed_total: 'Fixed total to bank (payment + overpayment)',
  strategy_fixed_overpay: 'Fixed monthly overpayment',
  strategy_shorten: 'Shorten period (fixed payment, shorter term)',
  strategy_custom: 'Custom overpayments (edit in schedule)',
  slider_total: 'Total monthly to bank', slider_overpay: 'Monthly overpayment',
  slider_std: 'Standard payment:',
  slider_std_short: 'Payment',
  reduce_payment_hint: 'Set a fixed amount you want to pay to the bank each month. Every surplus above the required installment reduces the principal — the bank recalculates a new, lower required installment each month, while you keep paying the same amount. The surplus grows and the loan is repaid faster and faster.',
  calc_btn: 'Calculate →',
  calc_placeholder: 'Click "Calculate" to see results',
  calc_placeholder_sub: 'Fill in the form on the left and press the button. Results will appear here along with a chart and repayment schedule.',
  calc_announcement: 'Schedule calculated: {months} payments, total interest {interest}.',
  calc_stale: '⚠ You changed the inputs — the results below are outdated. Click “Calculate” to refresh them.',
  shorten_hint: 'The standard payment stays fixed at the original amount. A fixed monthly overpayment on top shortens the loan term — the higher the overpayment, the faster the loan is paid off. The last payment may be smaller than a standard payment.',
  custom_hint: 'After clicking <strong>Calculate</strong>, all payments appear with empty overpayment fields. Enter any amount for a specific month — results update automatically.',
  stats_saved: 'interest saved', stats_faster: 'faster payoff',
  stats_payments_instead: 'instead of', stats_avg_overpay: 'avg overpay/mo',
  stats_total_interest: 'total interest', stats_comparison: 'Total cost comparison',
  stats_without: 'Without overpayment', stats_with: 'With overpayment',
  stats_saving_prefix: 'You save', stats_saving_suffix: 'of total interest vs. no overpayment.',
  stats_repayment_multiple: 'Without overpaying you’d repay the bank {base}× what you borrowed — with your plan, only {with}×.',
  stats_payments_label: 'payments',
  stats_loan_duration: 'loan duration',
  stats_half_label: 'half the principal paid off in', stats_half_hint: 'How long until the loan balance drops to half of today’s amount.',
  stats_payoff_date_label: 'loan paid off by',
  stats_payoff_date_hint: 'Estimated date of the final payment, counting from today.',
  sch_label: 'Details', sch_title: 'Repayment Schedule',
  sch_sub: 'The table is generated automatically after calculating. Edit the overpayment or interest rate for any month — changes propagate automatically.',
  sch_col_num: 'Payment #', sch_col_bal_before: 'Balance before', sch_col_rate: 'Rate %',
  sch_col_interest: 'Interest', sch_col_capital: 'Principal', sch_col_overpay: 'Overpayment (edit)',
  sch_col_fee: 'Fee', sch_col_total: 'Total to bank', sch_col_bal_after: 'Balance after',
  toolbar_total: 'Total overpaid:', toolbar_paid_at: 'Loan paid off at payment:',
  toolbar_of: 'of', toolbar_reset: 'Reset to defaults', toolbar_clear: 'Clear overpayments',
  toolbar_reset_rates: 'Reset rates',
  custom_effect_label: 'Overpayment effect',
  custom_effect_shorten: 'Shorten term',
  custom_effect_reduce: 'Reduce installment',
  paid_off: 'Loan paid off',
  schedule_empty: 'First calculate results in the Calculator section above.',
  footer_disclaimer: 'Educational website — does not constitute financial advice. Calculator results are for illustrative purposes only.<br />Before making a decision, consult a financial advisor or read your loan agreement.',
  footer_author: 'Calculator author:',
  footer_donate: 'Buy me a coffee ☕',
  chart_without: 'Without overpayment', chart_with: 'With overpayment',
  chart_interest_without: 'Interest (no overpayment)', chart_capital_without: 'Principal (no overpayment)',
  chart_interest_with: 'Interest (with overpayment)', chart_capital_with: 'Principal (with overpayment)',
  chart_year: 'Year', currency: 'PLN', years: 'years', years1: 'year', months_short: 'mo.',
  hero_note: '* example: {amount} PLN, {years} years, {rate}%, fixed total {total} PLN/mo.',
  error_loan_amount: 'Loan amount must be between 1,000 and 10,000,000.',
  error_months: 'Months must be between 12 and 360.',
  error_rate: 'Interest rate must be between 0.01% and 25%.',
  error_prepay_fee: 'The prepayment fee must be between 0% and 5%.',
  error_refi_rate: 'New loan interest rate must be between 0.01% and 25%.',
  error_refi_months: 'New loan period must be between 12 and 360 months.',
  error_refi_month: 'The refinancing month must fall within the loan term.',
  error_refi_fee: 'The new loan origination fee must be between 0% and 10%, and the flat fee cannot be negative.',
  error_overpay_start: 'The overpay start delay must fall within the loan term.',
  copy_link: 'Copy link',
  copy_link_copied: '✓ Copied!',
  reset_defaults: '↺ Reset to defaults',
  share_native: '📤 Share',
  copy_summary: '📋 Copy summary', copy_summary_copied: '✓ Summary copied!',
  share_summary_text: 'Loan {amount} PLN, {rate}% for {months} mo.\nWith the overpay plan: I’ll pay it off in {withMonths} payments ({savedTime} sooner) and save {saved} in interest.\nCalculated with Mądra Nadpłata: {url}',
  scenario_name_placeholder: 'Scenario name (e.g. "500 PLN overpay variant")',
  scenario_save: '💾 Save scenario',
  scenario_saved_title: 'Saved scenarios',
  scenario_sort_label: 'Sort scenarios',
  scenario_sort_newest: 'Newest',
  scenario_sort_oldest: 'Oldest',
  scenario_sort_name: 'Name (A-Z)',
  scenario_load: 'Load',
  scenario_delete: 'Delete',
  scenario_delete_confirm: 'Sure?',
  scenario_delete_cancel: 'Cancel',
  scenario_export: '⬇️ Export',
  scenario_import: '⬆️ Import',
  scenario_import_success: 'Imported {n} scenarios',
  scenario_import_empty: 'No valid scenarios found in the file',
  scenario_export_csv: '📊 Export comparison (CSV)',
  scenario_compare_col_name: 'Name',
  scenario_compare_col_amount: 'Loan amount',
  scenario_compare_col_rate: 'Interest rate',
  scenario_compare_col_strategy: 'Strategy',
  scenario_compare_col_months: 'Payments',
  scenario_compare_col_interest: 'Total interest',
  scenario_compare_col_saved_interest: 'Interest saved',
  scenario_compare_col_saved_months: 'Shortened by (months)',
  scenario_active_badge: 'Active',
  scenario_active_hint: 'The form fields exactly match this scenario',
  scenario_copy_link: '🔗 Link',
  scenario_copy_link_copied: '✓ Copied',
  scenario_copy_summary: '📋 Summary',
  scenario_diff_label: 'Difference vs. current result (interest / payments)',
  scenario_rename_hint: 'Click to rename',
  scenario_duplicate: '📄 Duplicate',
  scenario_copy_suffix: '(copy)',
  csv_export: 'Download CSV',
  sch_print: 'Print / Save PDF',
  overpay_start_label: 'Start overpaying from month',
  overpay_start_now: 'Now',
  overpay_start_hint: 'Month 0 = immediately. Useful if you plan to start overpaying after a few months.',
  extra_annual_label: '💰 Extra (13th) payment once a year',
  extra_annual_hint: 'Once a year, pay one full standard payment on top of your regular overpayment — a Polish equivalent of the popular US/UK biweekly payment trick (effectively 13 payments instead of 12 per year).',
  row_effect_shorten: 'Shorten',
  row_effect_reduce: 'Reduce',
  invest_section_title: 'What if you invested instead of overpaying?',
  invest_rate_label: 'Expected annual investment return',
  invest_gain_label: 'Investment gain (final value – invested)',
  invest_saved_label: 'Interest savings (overpayment)',
  invest_verdict_overpay: 'Overpaying wins by',
  invest_verdict_invest: 'Investing wins by',
  breakeven_label: 'Prepayment fee profitability',
  breakeven_result: 'Fee pays off after month',
  breakeven_never: 'Fees exceed interest savings over loan term',
  no_overpay_title: 'No overpayment set',
  no_overpay_sub: 'Set an amount above the standard payment to see your savings.',
  sch_yearly_toggle: 'Yearly view',
  sch_monthly_toggle: 'Monthly view',
  sch_jump_placeholder: 'Month no.',
  sch_jump_btn: 'Jump',
  sch_jump_link: '🔗 Link to month',
  sch_jump_link_copied: '✓ Copied',
  sch_col_year: 'Year',
  custom_base_title: 'Base loan costs',
  custom_base_hint: 'Add overpayments in the schedule below — results update automatically.',
  overpay_day_tip: '💡 The best day to make an overpayment is your installment due date — due to varying bank approaches to interest calculation, paying on the due date is always safe.',
  ad_consent_text: 'This site displays Google AdSense ads. By accepting, you consent to interest-based personalized advertising. By declining, you will see non-personalized ads only. Your data is not sold to third parties.',
  ad_label: 'Advertisement',
  partner_label: 'Partner offer',
  partner_title: 'A lower rate works like an overpayment — without paying a single extra unit',
  partner_body: 'At your balance and remaining term, a rate lower by 1 percentage point means {amount} less interest. If some time has passed since you took the loan, it is worth checking whether another bank would offer you better terms today.',
  partner_disclosure: 'These are affiliate links — if you use an offer, this site may receive a commission. It does not change the calculator results or the terms the bank gives you.',
  bank_offers_label: 'Bank offers',
  bank_offers_title: 'Current mortgage offers',
  bank_offers_sub: 'Manually collected bank offers — check the validity date and always verify the details directly with the bank before deciding.',
  bank_offers_col_bank: 'Bank',
  bank_offers_col_rate: 'Interest rate',
  bank_offers_col_valid: 'Offer valid until',
  bank_offers_col_diff: 'Interest difference',
  bank_offers_col_note: 'Notes',
  bank_offers_disclaimer: 'Data is updated manually and may be outdated — this is not a binding bank offer. Always verify the terms directly before making a decision.',
  ad_consent_accept: 'Accept',
  ad_consent_decline: 'Decline',
  ad_consent_policy: 'Privacy Policy',
  strategy_goal: 'Payoff goal (set a date, get the overpayment)',
  goal_hint: 'The reverse question: instead of guessing an overpayment, set the date you want to be debt-free. The calculator finds the smallest fixed monthly overpayment that gets you there. Your regular payment stays the same — the overpayment shortens the term.',
  goal_years_label: 'I want the loan paid off within',
  goal_target_label: 'Goal:',
  goal_required_overpay: 'required overpayment / mo.',
  goal_required_total: 'total to bank / mo.',
  goal_already_met: 'You reach this goal without overpaying — the loan already ends sooner.',
  goal_unreachable: 'For such a short deadline the required overpayment exceeds sensible limits. Extend the goal or check your balance.',
  rate_shock_title: 'Interest rate stress test',
  rate_shock_hint: 'How would your payment change if the interest rate went up?',
  rate_shock_more: 'more per month',
  holiday_title: 'Payment holiday',
  holiday_hint: 'What changes if you pause repayment for a few months? We assume you pay nothing during that time and interest is added to the balance — details depend on your bank.',
  holiday_scenario: '{n}-month holiday → interest grows by {amount}',
  error_goal_months: 'The payoff goal must be between 1 month and the remaining number of payments.',
  strategy_refinance: 'Refinancing (new loan on different terms)',
  refi_hint: 'Simulates closing the current loan and taking a new one on different terms. The origination fee and other one-time costs are applied to the outstanding balance at the time of refinancing. Month 0 means refinancing immediately — fees are calculated on the full loan amount.',
  refi_month_label: 'Refinance after month',
  refi_remaining_hint: 'Remaining payments without refinancing:',
  refi_new_rate_label: 'New loan interest rate',
  refi_new_months_label: 'New loan period',
  refi_origination_fee_label: 'Origination fee',
  refi_origination_fee_hint: '% of outstanding balance at refinancing date',
  refi_flat_fee_label: 'Other one-time fees',
  refi_balance_label: 'Balance to refinance',
  refi_fees_label: 'Total one-time fees',
  refi_phase1_int_label: 'Interest — old loan',
  refi_phase2_int_label: 'Interest — new loan',
  refi_net_saving: 'Net refinancing saving',
  refi_net_cost: 'Net refinancing extra cost',
  refi_break_even: 'Fees recovered by month:',
  refi_separator: '↓ Refinancing',
  refi_new_payment_label: 'New payment after refinancing',
  refi_no_overpay_note: 'Overpayments are not supported in refinancing mode. To model overpayments, use a non-refinancing strategy.',
  refi_no_invest_note: 'Investment comparison is not available in refinancing mode.',
  nav_support: 'Support',
  sup_label: 'Help for borrowers', sup_title: 'Current support for mortgage borrowers',
  sup_sub: 'Besides overpaying on your own, Polish law provides relief programs for borrowers struggling to keep up with a mortgage. Here is what applies as of September 2026 — this is specific to Polish mortgages (PLN, Polish law).',
  sup_badge_active: 'Active', sup_badge_ended: 'Ended',
  sup_fwk_title: 'Borrowers’ Support Fund (FWK)',
  sup_fwk_1: 'Who qualifies: one borrower is unemployed, the payment exceeds 40% of household income (RdD ratio), or household income is very low after the payment.',
  sup_fwk_2: 'Amount: up to 3,000 PLN per month, for up to 40 months — up to 120,000 PLN in total.',
  sup_fwk_3: 'Repayment: starts only 2 years after the last support payout, spread over 200 equal, interest-free instalments.',
  sup_fwk_4: 'Debt forgiveness: pay the first 134 instalments on time and the remaining up to 66 (roughly 39,600 PLN) get written off.',
  sup_fwk_5: 'Condition: the borrower cannot own another residential property.',
  sup_loan_title: 'Residual debt loan',
  sup_loan_1: 'Who qualifies: you sold the mortgaged property but the sale price didn’t cover the full outstanding debt.',
  sup_loan_2: 'Funded from the same pool as FWK — covers the gap between the sale price and the loan balance.',
  sup_loan_3: 'Repayment terms and partial debt forgiveness work the same way as under the Borrowers’ Support Fund.',
  sup_holidays_title: 'Statutory payment holidays',
  sup_holidays_1: 'The last edition ran in 2024 — a combined few months of suspended payments for PLN mortgages taken out before 1 July 2022.',
  sup_holidays_2: 'No new statutory edition has been introduced since 2025 — don’t expect an automatic legal suspension of your payment.',
  sup_holidays_3: 'Alternative: bank-granted "contractual" payment holidays — an individual decision by your bank. It’s worth asking your bank directly about suspending or extending your repayment.',
  sup_note: 'Accurate as of September 2026. Income thresholds and detailed conditions are updated periodically — check the current rules with your lender or Bank Gospodarstwa Krajowego (BGK), the fund’s operator, before applying.',
  close: 'Close',
};

export const LANGS: Record<Lang, Translations> = { pl, en };

export function t(lang: Lang, key: TranslationKey): string {
  return LANGS[lang][key] ?? LANGS.pl[key] ?? key;
}
