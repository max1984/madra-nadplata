export type Lang = 'pl' | 'en';

export type TranslationKey =
  | 'nav_knowledge' | 'nav_how' | 'nav_example' | 'nav_faq'
  | 'nav_tools' | 'nav_calc' | 'nav_schedule' | 'tools_divider'
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
  | 'chart_balance' | 'chart_breakdown'
  | 'faq_label' | 'faq_title'
  | 'faq_q1' | 'faq_a1' | 'faq_q2' | 'faq_a2'
  | 'faq_q3' | 'faq_a3' | 'faq_q4' | 'faq_a4'
  | 'faq_q5' | 'faq_a5' | 'faq_q6' | 'faq_a6'
  | 'faq_q7' | 'faq_a7'
  | 'calc_label' | 'calc_title' | 'calc_sub'
  | 'form_loan_amount' | 'form_interest' | 'form_months' | 'form_months_unit'
  | 'form_fee' | 'form_fee_hint' | 'form_strategy'
  | 'strategy_fixed_total' | 'strategy_fixed_overpay'
  | 'strategy_shorten' | 'strategy_custom'
  | 'slider_total' | 'slider_overpay' | 'slider_std'
  | 'calc_btn' | 'calc_placeholder' | 'calc_placeholder_sub'
  | 'shorten_hint' | 'custom_hint'
  | 'stats_saved' | 'stats_faster' | 'stats_payments_instead'
  | 'stats_avg_overpay' | 'stats_total_interest' | 'stats_comparison'
  | 'stats_without' | 'stats_with' | 'stats_saving_prefix' | 'stats_saving_suffix'
  | 'stats_payments_label'
  | 'sch_label' | 'sch_title' | 'sch_sub'
  | 'sch_col_num' | 'sch_col_bal_before' | 'sch_col_rate'
  | 'sch_col_interest' | 'sch_col_capital' | 'sch_col_overpay'
  | 'sch_col_fee' | 'sch_col_total' | 'sch_col_bal_after'
  | 'toolbar_total' | 'toolbar_paid_at' | 'toolbar_of'
  | 'toolbar_reset' | 'toolbar_clear' | 'toolbar_reset_rates'
  | 'paid_off' | 'schedule_empty'
  | 'footer_disclaimer' | 'footer_author'
  | 'chart_without' | 'chart_with'
  | 'chart_interest_without' | 'chart_capital_without'
  | 'chart_interest_with' | 'chart_capital_with'
  | 'chart_year' | 'currency' | 'years' | 'years1' | 'months_short';

type Translations = Record<TranslationKey, string>;

const pl: Translations = {
  nav_knowledge: 'Wiedza', nav_how: 'Jak to działa', nav_example: 'Przykład', nav_faq: 'FAQ',
  nav_tools: 'Narzędzia', nav_calc: 'Kalkulator', nav_schedule: 'Harmonogram',
  tools_divider: 'Narzędzia kalkulatora',
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
  step6_p: 'Nawet 500 zł miesięcznie przy kredycie na 500 000 zł może zaoszczędzić Ci ponad 80 000 zł i skrócić kredyt o 2–3 lata. Sprawdź sam w kalkulatorze poniżej.',
  how_formula: '<strong>Kluczowy wzór:</strong> Odsetki miesięczne = Saldo kredytu × (Oprocentowanie roczne ÷ 12). Im szybciej zredukcujesz saldo, tym mniej zapłacisz odsetek – i to kumuluje się przez całe lata.',
  ex_label: 'Przykład z życia',
  ex_title_text: '800 000 zł kredytu – co zmienia stała wpłata 7 000 zł miesięcznie?',
  ex_sub_text: 'Strategia: stała kwota do banku. Standardowa rata: {std}. Łącznie do banku: 7 000 zł/mies. (rata + nadpłata).',
  ex_without: 'Bez nadpłaty', ex_with_header: 'Stała kwota 7 000 zł / mies.',
  impact_loan: 'Kwota kredytu', impact_period: 'Okres spłaty', impact_payment: 'Miesięczna rata',
  impact_monthly_total: 'Miesięczna wpłata', impact_interest_total: 'Łączne odsetki',
  impact_total: 'Łącznie do banku', impact_saved: 'Oszczędność',
  chart_balance: 'Saldo kredytu w czasie', chart_breakdown: 'Odsetki vs. kapitał (podział roczny)',
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
  form_strategy: 'Strategia nadpłaty',
  strategy_fixed_total: 'Stała kwota do banku (rata + nadpłata)',
  strategy_fixed_overpay: 'Stała miesięczna nadpłata',
  strategy_shorten: 'Skrócenie okresu (stała rata, zmienna długość)',
  strategy_custom: 'Własne nadpłaty (wybierz miesiące w harmonogramie)',
  slider_total: 'Łączna kwota do banku', slider_overpay: 'Nadpłata miesięczna',
  slider_std: 'Standardowa rata:',
  calc_btn: 'Oblicz →',
  calc_placeholder: 'Kliknij "Oblicz" aby zobaczyć wyniki',
  calc_placeholder_sub: 'Wypełnij formularz po lewej i wciśnij przycisk. Wyniki pojawią się tutaj razem z wykresem i harmonogramem spłat.',
  shorten_hint: 'Rata regularnej spłaty pozostaje stała na poziomie oryginalnej raty. Stała nadpłata co miesiąc skraca okres kredytowania – im wyższa, tym szybciej kredyt zostanie spłacony. Ostatnia rata może być mniejsza niż standardowa.',
  custom_hint: 'Po kliknięciu <strong>Oblicz</strong> pojawią się wszystkie raty z pustymi polami nadpłat. Wpisz dowolną kwotę w wybranym miesiącu – wyniki zaktualizują się automatycznie.',
  stats_saved: 'zaoszczędzone odsetki', stats_faster: 'szybsza spłata',
  stats_payments_instead: 'zamiast', stats_avg_overpay: 'śr. nadpłata / mies.',
  stats_total_interest: 'łączne odsetki', stats_comparison: 'Porównanie łącznych kosztów',
  stats_without: 'Bez nadpłaty', stats_with: 'Z nadpłatą',
  stats_saving_prefix: 'Oszczędzasz', stats_saving_suffix: 'łącznych odsetek na tle scenariusza bez nadpłaty.',
  stats_payments_label: 'rat',
  sch_label: 'Szczegóły', sch_title: 'Harmonogram spłat',
  sch_sub: 'Tabela generuje się automatycznie po obliczeniu. Edytuj nadpłatę lub oprocentowanie dla dowolnego miesiąca – zmiany propagują się automatycznie.',
  sch_col_num: 'Rata #', sch_col_bal_before: 'Saldo przed ratą', sch_col_rate: 'Oprocent. %',
  sch_col_interest: 'Odsetki', sch_col_capital: 'Kapitał', sch_col_overpay: 'Nadpłata (edytuj)',
  sch_col_fee: 'Prowizja', sch_col_total: 'Łącznie do banku', sch_col_bal_after: 'Saldo po racie',
  toolbar_total: 'Łącznie nadpłacono:', toolbar_paid_at: 'Kredyt spłacony w racie:',
  toolbar_of: 'z', toolbar_reset: 'Przywróć domyślne', toolbar_clear: 'Wyczyść nadpłaty',
  toolbar_reset_rates: 'Przywróć oprocentowanie',
  paid_off: 'Kredyt spłacony',
  schedule_empty: 'Najpierw oblicz wyniki w sekcji Kalkulator powyżej.',
  footer_disclaimer: 'Strona edukacyjna – nie stanowi porady finansowej. Wyniki kalkulatora mają charakter poglądowy.<br />Przed podjęciem decyzji skonsultuj się z doradcą finansowym lub przeczytaj umowę kredytową.',
  footer_author: 'Autor kalkulatora:',
  chart_without: 'Bez nadpłaty', chart_with: 'Z nadpłatą',
  chart_interest_without: 'Odsetki (bez nadpłaty)', chart_capital_without: 'Kapitał (bez nadpłaty)',
  chart_interest_with: 'Odsetki (z nadpłatą)', chart_capital_with: 'Kapitał (z nadpłatą)',
  chart_year: 'Rok', currency: 'zł', years: 'lat', years1: 'rok', months_short: 'mies.',
};

const en: Translations = {
  nav_knowledge: 'Learn', nav_how: 'How it works', nav_example: 'Example', nav_faq: 'FAQ',
  nav_tools: 'Tools', nav_calc: 'Calculator', nav_schedule: 'Schedule',
  tools_divider: 'Calculator Tools',
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
  step6_p: 'Even 500 PLN/month on a 500,000 PLN loan can save you over 80,000 PLN and shorten the loan by 2–3 years. Try it yourself in the calculator below.',
  how_formula: '<strong>Key formula:</strong> Monthly interest = Loan balance × (Annual rate ÷ 12). The faster you reduce the balance, the less interest you pay — and this compounds over years.',
  ex_label: 'Real example',
  ex_title_text: '800,000 PLN mortgage – what does a fixed 7,000 PLN/month change?',
  ex_sub_text: 'Strategy: fixed total to bank. Standard payment: {std}. Fixed total to bank: 7,000 PLN/mo. (payment + overpayment).',
  ex_without: 'Without overpayment', ex_with_header: 'Fixed total 7,000 PLN/month',
  impact_loan: 'Loan amount', impact_period: 'Repayment period', impact_payment: 'Monthly payment',
  impact_monthly_total: 'Monthly total', impact_interest_total: 'Total interest',
  impact_total: 'Total to bank', impact_saved: 'Savings',
  chart_balance: 'Loan balance over time', chart_breakdown: 'Interest vs. principal (annual breakdown)',
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
  form_strategy: 'Overpayment strategy',
  strategy_fixed_total: 'Fixed total to bank (payment + overpayment)',
  strategy_fixed_overpay: 'Fixed monthly overpayment',
  strategy_shorten: 'Shorten period (fixed payment, shorter term)',
  strategy_custom: 'Custom overpayments (edit in schedule)',
  slider_total: 'Total monthly to bank', slider_overpay: 'Monthly overpayment',
  slider_std: 'Standard payment:',
  calc_btn: 'Calculate →',
  calc_placeholder: 'Click "Calculate" to see results',
  calc_placeholder_sub: 'Fill in the form on the left and press the button. Results will appear here along with a chart and repayment schedule.',
  shorten_hint: 'The standard payment stays fixed at the original amount. A fixed monthly overpayment on top shortens the loan term — the higher the overpayment, the faster the loan is paid off. The last payment may be smaller than a standard payment.',
  custom_hint: 'After clicking <strong>Calculate</strong>, all payments appear with empty overpayment fields. Enter any amount for a specific month — results update automatically.',
  stats_saved: 'interest saved', stats_faster: 'faster payoff',
  stats_payments_instead: 'instead of', stats_avg_overpay: 'avg overpay/mo',
  stats_total_interest: 'total interest', stats_comparison: 'Total cost comparison',
  stats_without: 'Without overpayment', stats_with: 'With overpayment',
  stats_saving_prefix: 'You save', stats_saving_suffix: 'of total interest vs. no overpayment.',
  stats_payments_label: 'payments',
  sch_label: 'Details', sch_title: 'Repayment Schedule',
  sch_sub: 'The table is generated automatically after calculating. Edit the overpayment or interest rate for any month — changes propagate automatically.',
  sch_col_num: 'Payment #', sch_col_bal_before: 'Balance before', sch_col_rate: 'Rate %',
  sch_col_interest: 'Interest', sch_col_capital: 'Principal', sch_col_overpay: 'Overpayment (edit)',
  sch_col_fee: 'Fee', sch_col_total: 'Total to bank', sch_col_bal_after: 'Balance after',
  toolbar_total: 'Total overpaid:', toolbar_paid_at: 'Loan paid off at payment:',
  toolbar_of: 'of', toolbar_reset: 'Reset to defaults', toolbar_clear: 'Clear overpayments',
  toolbar_reset_rates: 'Reset rates',
  paid_off: 'Loan paid off',
  schedule_empty: 'First calculate results in the Calculator section above.',
  footer_disclaimer: 'Educational website — does not constitute financial advice. Calculator results are for illustrative purposes only.<br />Before making a decision, consult a financial advisor or read your loan agreement.',
  footer_author: 'Calculator author:',
  chart_without: 'Without overpayment', chart_with: 'With overpayment',
  chart_interest_without: 'Interest (no overpayment)', chart_capital_without: 'Principal (no overpayment)',
  chart_interest_with: 'Interest (with overpayment)', chart_capital_with: 'Principal (with overpayment)',
  chart_year: 'Year', currency: 'PLN', years: 'years', years1: 'year', months_short: 'mo.',
};

export const LANGS: Record<Lang, Translations> = { pl, en };

export function t(lang: Lang, key: TranslationKey): string {
  return LANGS[lang][key] ?? LANGS.pl[key] ?? key;
}
