# Raport testów — kalkulatory finansowe cwaniak

Data: 2026-09-21
Zakres: 3 aplikacje — kalkulator nadpłaty kredytu hipotecznego (`/`), kalkulator wynagrodzeń brutto-netto (`/wynagrodzenia.html`), kalkulator zdolności kredytowej (`/zdolnosc-kredytowa.html`).
Metoda: white-box (przegląd kodu i testów jednostkowych z ekspertyzą finansowo-podatkową) + black-box (testy manualne w przeglądarce, wszystkie 3 apki, edge case'y) + ocena UI/UX.

**STATUS (2026-09-21, po sesji naprawczej): wszystkie pozycje 🔴/🟠/🟡 poniżej NAPRAWIONE — 18 commitów, 504/504 testów zielonych, plan naprawy i korekty ustaleń (menu mobilne miało inną przyczynę niż pierwotnie opisano) w historii commitów od `445b653` do `69b4d64`. Szczegóły przy każdej pozycji.**

Legenda priorytetów: 🔴 KRYTYCZNE (naprawić przed kolejnym wydaniem) · 🟠 WAŻNE (zaplanować) · 🟡 DROBNE (nice-to-have) · ⚪ BRAK TESTÓW (dług testowy) · 🔵 DO WERYFIKACJI (wymaga sprawdzenia danych/przepisów, nie kodu).

---

## 1. Błędy krytyczne

### 1.1 🔴 Menu mobilne bez tła — nakłada się na treść (black-box)
- **Gdzie:** kalkulator nadpłaty kredytu (`/`), prawdopodobnie komponent `Nav.tsx`.
- **Kroki:** otwórz stronę na viewport mobilnym (np. 390×844) → kliknij ikonę hamburgera.
- **Obserwacja:** rozwinięta lista linków nawigacji renderuje się bez nieprzezroczystego tła i nakłada się bezpośrednio na hero/kartę wyników pod spodem — tekst się miesza, menu jest nieczytelne i praktycznie nieużywalne na telefonie.
- **Oczekiwane:** panel z pełnym tłem (i/lub przyciemniony overlay pod nim).
- **Sugestia:** dodać `bg-white`/`bg-slate-900` (odpowiednio do motywu) + `z-index` na kontener rozwiniętego menu, ew. `backdrop` blokujący klikalność treści pod spodem.

---

## 2. Błędy ważne

### 2.1 🟠 Duplikat kluczy React w przyciskach szybkiej nadpłaty (black-box, potwierdzone w kodzie)
- **Gdzie:** `src/components/Calculator.tsx:171-174` (`overpayPresets()`), użycie `key={amount}` w liniach `742, 782, 818`.
- **Kroki:** ustaw bardzo małą kwotę kredytu (np. 1000 zł, 360 rat) → Oblicz → zmień na dużą kwotę (np. 10 000 000 zł) → Oblicz ponownie.
- **Obserwacja:** przy niskiej racie standardowej trzy prezety (10%/25%/50% raty, zaokrąglone w dół do 50 zł) kolapsują się do tej samej wartości `[50, 50, 50]` → kolizja klucza `key={amount}` → błąd React w konsoli ("two children with same key") i widmowe/nieaktualne przyciski w DOM.
- **Sugestia:** klucz niezależny od wartości (np. indeks pozycji w tablicy) i/lub logika gwarantująca unikalne kwoty prezetów.

### 2.2 🟠 `buildSchedule()` nie waliduje długości `customOverpay` względem `origMonths` (white-box)
- **Gdzie:** `src/lib/mortgage.ts:43` — pętla iteruje do `customOverpay.length`, a `remaining = origMonths - i` liczone jest z osobnego parametru `origMonths`.
- **Ryzyko:** dziś nieosiągalne z UI (każdy wywołujący buduje `customOverpay` o długości dokładnie `months`), ale funkcja jest eksportowana bez guardu. Jeśli `customOverpay` będzie kiedyś dłuższe niż `origMonths`, `remaining` spadnie do 0/ujemnej, `calcStdPayment` policzy dzielenie przez zero → `NaN`/`Infinity` rozlewające się po całym harmonogramie bez żadnego komunikatu błędu.
- **Sugestia:** dodać guard/assert `customOverpay.length === origMonths` albo pętlować jawnie po `origMonths`.

### 2.3 🟠 Próg DSTI (40%/50%) liczony na zdyskontowanym dochodzie zamiast surowym (white-box)
- **Gdzie:** `src/lib/creditworthiness.ts:151`.
- **Problem:** próg DSTI jest wyznaczany na `recognizedIncome` (dochód już pomniejszony o `incomeRecognitionRate` dla B2B/zlecenia), nie na surowym `netIncome`. Osoba na B2B z realnym dochodem 12 000 zł netto, ale uznaniem 60% (`recognizedIncome = 7200`), jeśli po dyskoncie zejdzie poniżej przeciętnej krajowej (6624 zł), dostaje podwójną karę: dyskonto dochodu + surowszy próg DSTI — bez jasnego uzasadnienia metodologicznego.
- **Sugestia:** zweryfikować z zespołem, czy to świadome uproszczenie (i udokumentować w kodzie/UI), czy błąd modelu wymagający liczenia progu na `netIncome`.

### 2.4 🟠 Koszty utrzymania gospodarstwa domowego odejmowane od zdyskontowanego dochodu (white-box)
- **Gdzie:** `src/lib/creditworthiness.ts:149`.
- **Problem:** `householdCost` odejmowane jest od `recognizedIncome` (po dyskoncie), a nie od pełnego `netIncome`. Realny koszt życia nie zależy od tego, ile bank "uznaje" z dochodu B2B — to sztucznie zaniża `disposableIncome` dla samozatrudnionych bardziej niż powinno.

### 2.5 🟠 Import scenariuszy może skasować nowsze własne dane zamiast starszych zaimportowanych (white-box)
- **Gdzie:** `src/hooks/useCreditworthinessCalculator.ts:314-324` (`mergeImportedCwScenarios`) i analogicznie `src/hooks/useSalaryCalculator.ts:528-537` (`mergeImportedSalaryScenarios`).
- **Problem:** przy przycinaniu do limitu (`MAX_*_SCENARIOS`) używane jest `slice(next.length - MAX)` na `[...existing, ...imported]` — czyli obcinanie wg **pozycji w tablicy**, nie wg `savedAt`. Import starego pliku eksportu przy przekroczonym limicie usuwa własne, nowsze scenariusze użytkownika zamiast starszych zaimportowanych — odwrotność zamierzonego zachowania (komentarz w kodzie mówi "zachowuje najnowsze").
- **Reprodukcja:** mieć 8 zapisanych scenariuszy → zaimportować plik z 5 starymi (limit 10) → 3 najstarsze z *własnych* zostają skasowane mimo że są nowsze niż importowane.
- **Sugestia:** sortować połączoną listę po `savedAt` przed przycięciem.

### 2.6 🟠 Rozbieżność zaokrąglenia 1 zł w kalkulatorze wynagrodzeń (black-box)
- **Test:** umowa o pracę, brutto 8500 zł, standardowe KUP, bez ulg, pełne PIT-2.
- **Obserwacja:** suma składników (podatek 550 + składki społeczne 1165 + zdrowotna 660 = 2375) odjęta od 8500 daje 6125 zł, aplikacja pokazuje 6124 zł (różnica 1 zł).
- **Sugestia:** zweryfikować kolejność zaokrągleń pośrednich vs. wynik końcowy zgodnie z metodyką ZUS/US (każdy składnik zaokrąglany osobno wg przepisów, nie odejmowanie już zaokrąglonych wartości od siebie).

---

## 3. Drobne / kosmetyczne

- **🟡 Nazwa eksportowanego CSV zahardkodowana po polsku** — `src/components/Schedule.tsx:246` generuje nazwę pliku `harmonogram-2026-09-21.csv` niezależnie od `lang`, mimo że reszta eksportu (separator, liczby, nagłówki) jest już w pełni zlokalizowana.
- **🟡 `Math.max(rowFixedStd, interest)` może wyzerować spłatę kapitału bez ostrzeżenia** — `src/lib/mortgage.ts:50`; po ręcznej podwyżce oprocentowania jednego wiersza rata może w całości pójść na odsetki. Matematycznie poprawne, ale niewyjaśnione użytkownikowi w UI.
- **🟡 Maksymalny okres kredytowania 40 lat** (`src/lib/creditworthiness.ts:160`) — polskie banki w praktyce rzadko przekraczają 30-35 lat; może sugerować nierealny scenariusz.
- **🟡 Brak walidacji duplikatów nazw scenariuszy** przy zapisie/imporcie/zmianie nazwy (oba kalkulatory: nadpłata, zdolność, wynagrodzenia) — można mieć kilka scenariuszy o identycznej nazwie, nierozróżnialnych na liście.
- **🟡 Zbyt wolna/długa animacja fade-in przy scrollu** (framer-motion `whileInView`) — sekcje pozostają wyblakłe 2-3s po wejściu w viewport, sprawia wrażenie niedoładowanej strony zamiast "premium".
- **🟡 Bufor stopy procentowej (5 p.p.) opisany w komentarzu kodu jako wartość referencyjna, ale nie zaznaczony jako przybliżenie w UI** — warto dodać adnotację w interfejsie zdolności kredytowej.

---

## 4. Braki w pokryciu testami

- Brak testu na scenariusz z **2.3** (próg DSTI liczony na `recognizedIncome` przy niepełnym uznaniu dochodu B2B/zlecenia powyżej średniej krajowej).
- Brak testu na `mergeImportedCwScenarios`/`mergeImportedSalaryScenarios` z importem starszych dat przy przepełnionym limicie (**2.5**).
- Brak testu na duplikat nazwy scenariusza.
- `src/components/Calculator.test.ts` testuje wyłącznie czyste funkcje pomocnicze — **brak jakiegokolwiek testu renderującego komponent** (React Testing Library). Cała logika inline w JSX (onBlur-clamping pól, warunkowe pola zależne od `strategy`) pokryta jest wyłącznie ręcznym testowaniem w przeglądarce. To samo dotyczy `Schedule.tsx`.
- Brak testu regresyjnego na „zmniejsz `loanMonths` po tym, jak `overpayStartMonth` był ustawiony wysoko" — `validateInputs` łapie to poprawnie, ale brak automatu i brak potwierdzenia, że komunikat błędu jest zrozumiały dla użytkownika.

---

## 5. Do weryfikacji przez zespół (nie błędy kodu — aktualność danych/przepisów)

- **🔵 Stałe podatkowo-składkowe w `src/lib/salary.ts` i `src/lib/creditworthiness.ts`** (`MIN_WAGE_GROSS`, `ZUS_ANNUAL_BASE_LIMIT`, `RYCZALT_HEALTH_TIER_1/2/3`, `B2B_FULL_ZUS_SOCIAL_MANDATORY`, `AVERAGE_NATIONAL_WAGE_GROSS_2026`, `BUFFER_VARIABLE_RATE_PP`) są opatrzone datą „wrzesień 2026" i odwołują się do nowelizacji Rekomendacji S z 19.06.2026 oraz danych GUS za II kw. 2026. Błąd w tych liczbach wprost przekłada się na błędną kwotę kredytu/wynagrodzenia pokazywaną użytkownikowi podejmującemu realną decyzję finansową — **zalecana ręczna weryfikacja ze źródłami (zus.pl, knf.gov.pl, stat.gov.pl) przed każdym wydaniem**.
- **🔵 B2B liniowy 19%** — podstawa opodatkowania odejmuje tylko składki społeczne, nie składkę zdrowotną (uproszczenie zgodne z rocznym, nie miesięcznym, limitem odliczenia zdrowotnej dla liniowców) — warto to opisać w UI/hincie, żeby nie wyglądało na pominięty odlicznik.

**Zweryfikowane i uznane za poprawne** (nie wymaga działania): annuitet i harmonogram spłat, zaokrąglenia harmonogramu, eksport CSV (separator/przecinek), refinansowanie, wakacje kredytowe, `calcEmploymentContract`/`calcMandateContract`/`calcSpecificWorkContract`/`calcB2BContract`, brak ulgi dla klasy średniej po lipcu 2022, składka zdrowotna niepomniejszająca podstawy PIT od 2022, limit 30-krotności tylko na emerytalną/rentową, zwolnienie studenta <26 lat ze zlecenia z ZUS, wyłączenie liniowego/ryczałtu/IP Box ze wspólnego rozliczenia, walidacja i odporność na dane brzegowe (ujemne, zero, ogromne liczby, znaki specjalne, puste pola — żaden z 3 kalkulatorów nie crashuje), przełącznik PL/EN działa spójnie między aplikacjami.

---

## 6. Ocena UI/UX i szaty graficznej

Ogólna ocena: warstwa funkcjonalna solidna, ale wizualnie projekt wygląda jak trzy osobne szablony, nie jedna spójna rodzina produktów finansowych, i miejscami czyta się generycznie ("AI SaaS template"). Poniżej konkretne, wdrożalne poprawki.

1. **Zastąpić generyczny gradient fioletowo-niebieski w hero** — ten wzorzec (czarny tekst + gradient purple→blue na kluczowym słowie) jest rozpoznawalnym domyślnym stylem szablonów AI/SaaS. Rekomendacja: własna paleta budująca skojarzenie z finansami/zaufaniem (np. głęboka zieleń, granat, lub stonowany bursztyn jako akcent) zamiast domyślnego fioletu Tailwind.

2. **Ujednolicić tożsamość wizualną między trzema aplikacjami.** Obecnie: kalkulator nadpłaty ma logo 💰 + fiolet/niebieski, wynagrodzenia — 💼 + indygo, zdolność kredytowa — 🏠 + niebieski. Rekomendacja: jeden spójny system tokenów koloru/typografii/promienia zaokrągleń dla wszystkich trzech + własna ikonografia SVG zamiast emoji (emoji renderują się inaczej na Windows/macOS/Linux — niespójny wygląd).

3. **Wyjść poza standardowe białe karty z cieniem.** To bardzo częsty, bezpieczny wzorzec bez charakteru. Propozycje: subtelna faktura/tekstura tła, nietypowy krój nagłówków (obecnie systemowy sans), animowany licznik dla kluczowych liczb wyników (np. "zaoszczędzone odsetki") zamiast statycznej zmiany wartości.

4. **Dopracować mikroanimacje** — framer-motion jest już w zależnościach, ale fade-in przy scrollu (2-3s opóźnienia) sprawia wrażenie niedopracowania, nie premium efektu (patrz błąd 🟡 w sekcji 3). Skrócić czas/opóźnienie albo zostawić subtelny slide/scale tylko dla elementów akcentujących.

5. **Dodać wizualizację/kontekst przy kluczowych wynikach w kalkulatorach wynagrodzeń i zdolności kredytowej** — kalkulator nadpłaty ma już wykres, pozostałe dwa pokazują wynik jako suchy tekst w kolorowej karcie. Rozszerzenie wizualizacji (np. pasek porównania do średniej krajowej) ujednoliciłoby "wow efekt" i spójność.

6. **Naprawić menu mobilne** (błąd 🔴 1.1) — to jednocześnie błąd funkcjonalny i najpoważniejszy problem UX na urządzeniach mobilnych.

**Zachować:** layout mobilny poza błędem menu jest dobrze przemyślany (karty składają się w kolumnę, brak poziomego scrolla, czytelne odstępy i jednostki przy polach formularzy).

---

## Podsumowanie priorytetów dla dev teamu

| # | Priorytet | Opis | Plik |
|---|-----------|------|------|
| 1 | 🔴 | Menu mobilne bez tła | `src/components/Nav.tsx` |
| 2 | 🟠 | Duplikat kluczy React w prezetach nadpłaty | `src/components/Calculator.tsx:171-174` |
| 3 | 🟠 | Brak walidacji długości `customOverpay` w `buildSchedule` | `src/lib/mortgage.ts:43` |
| 4 | 🟠 | Próg DSTI liczony na zdyskontowanym dochodzie | `src/lib/creditworthiness.ts:151` |
| 5 | 🟠 | Koszty utrzymania odejmowane od zdyskontowanego dochodu | `src/lib/creditworthiness.ts:149` |
| 6 | 🟠 | Import scenariuszy kasuje nowsze dane zamiast starszych | `useCreditworthinessCalculator.ts:314`, `useSalaryCalculator.ts:528` |
| 7 | 🟠 | Rozbieżność zaokrąglenia 1 zł w wynagrodzeniach | `src/lib/salary.ts` |
| 8 | 🔵 | Weryfikacja aktualności stałych podatkowo-składkowych 2026 | `src/lib/salary.ts`, `src/lib/creditworthiness.ts` |
| — | 🟡 | Pozostałe drobne (sekcja 3) i braki testów (sekcja 4) | — |
