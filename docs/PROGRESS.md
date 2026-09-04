# Dziennik prac — nadplata.org

Rejestr tego, co zostało zrobione, w kolejności wdrażania.
Plan nadrzędny: [`PLAN-ZYSKU.md`](./PLAN-ZYSKU.md).

Legenda: ✅ zrobione · 🔜 następne · ⏸ czeka na dane od właściciela

---

## FAZA 1 — Fundament pomiaru i konfiguracji ✅

*4 września 2026*

**Co zostało zrobione**

- `docs/PLAN-ZYSKU.md` — pełny plan monetyzacji: diagnoza stanu, model przychodu
  z liczbami, sześć faz wdrożenia, lista zadań wymagających właściciela,
  realistyczne prognozy i lista rzeczy świadomie pominiętych.
- `src/config/monetization.ts` — jedno miejsce konfiguracji: ID AdSense, sloty
  reklamowe, oferty partnerskie, token analityki. Każdy strumień przychodu ma
  funkcję `*Enabled()`, więc niedokonfigurowany element po prostu się nie renderuje.
- `src/lib/scripts.ts` — warunkowe ładowanie skryptów zewnętrznych po zdarzeniu
  `load`.
- `index.html` — usunięty zaszyty na sztywno skrypt AdSense.

**Dlaczego to było pierwsze**

Skrypt AdSense w `index.html` wskazywał na atrapę `ca-pub-XXXXXXXXXXXXXXXX`.
Efekt: każdy odwiedzający pobierał kilkaset kilobajtów kodu Google, który nie mógł
wyświetlić żadnej reklamy, bo takie konto nie istnieje. Strona ponosiła pełny koszt
wydajnościowy reklam, nie mając z nich żadnego przychodu — najgorszy możliwy wariant.

**Stan po fazie:** strona nadal nie zarabia, ale przestała tracić.
Włączenie przychodu to teraz podmiana jednej stałej.

⏸ **Czeka na Ciebie:** publisher ID AdSense (`ca-pub-...`) → `ADSENSE_CLIENT`
w `src/config/monetization.ts`.

---

## FAZA 2 — Jasny motyw ✅

*4 września 2026*

**Co zostało zrobione**

- `src/index.css` napisany od nowa w jasnym systemie kolorów. Te same nazwy klas,
  więc żaden komponent nie wymagał przepisania struktury.
- Paleta: biel `#ffffff` i `#f6f8fc` na przemian, granat marki `#2563eb`,
  zieleń oszczędności `#047857`, czerwień kosztu `#dc2626`. Wszystkie pary
  tekst/tło spełniają WCAG AA.
- Usunięty `backdrop-filter` z kart — na jasnym tle nic nie wnosił, a jest jednym
  z najdroższych efektów w przeglądarce. Zamiast niego biała karta z obramowaniem
  i delikatnym cieniem.
- `src/lib/chartTheme.ts` — kolory wykresów wyjęte do jednego pliku. Wcześniej ta
  sama paleta była wklejona osobno w `Calculator.tsx` i `ExampleSection.tsx`,
  z drobnymi rozjazdami między nimi.
- Poprawki punktowe: `Hero3D` (cienkie linie w jasnym błękicie były niewidoczne
  na bieli), `AdConsent` (przepisany na klasy zamiast ciemnych stylów inline),
  `PrivacyPolicy`, `Footer`, `Hero`, `HowItWorks`, `Schedule`.
- `meta name="theme-color"` z `#060913` na `#ffffff`.
- Dodany widoczny `:focus-visible` — na ciemnym tle domyślny outline przeglądarki
  był w miarę czytelny, na jasnym praktycznie znikał.

**Naprawione przy okazji**

- `.pp-body h2` odwoływało się do nieistniejącej zmiennej `--text1` (literówka),
  przez co nagłówki polityki prywatności dziedziczyły kolor rodzica. To samo
  w nagłówku `h1` modala.
- Baner zgody na reklamy pokazywał się, mimo że reklam nie było — informował
  o czymś, co nie istniało. Teraz zależy od `adsEnabled()`.
- Martwe reguły `.cookie-*` (~30 linii CSS bez odpowiednika w kodzie).

**Weryfikacja:** build + 25 testów przechodzi, zrzuty ekranu całej strony
w rozdzielczości 1440 px sprawdzone wizualnie (hero, sekcje edukacyjne,
wykresy, kalkulator z wynikami).

---

## FAZA 3 — Cel spłaty (nowa funkcja) ✅

*4 września 2026*

**Skąd pomysł**

Przegląd konkurencji: Bankier.pl SMART, hipoteczny.pl, dobrykalkulator.pl,
okioki.pl, bankoweabc.pl. Wszystkie robią dokładnie to samo — cztery pola,
przełącznik „niższa rata / krótszy okres", jeden wynik. Żaden nie ma wykresu,
edytowalnego harmonogramu ani eksportu, więc pod względem funkcji byliśmy
już z przodu.

Ale wszystkie, łącznie z naszym, odpowiadały tylko na pytanie
„co mi da nadpłata X zł?". Prawdziwe pytanie kredytobiorcy brzmi odwrotnie:
**„chcę mieć to spłacone przed emeryturą / przed studiami dziecka — ile muszę
dopłacać?"**. Tego nie ma nikt w Polsce, a w narzędziach anglojęzycznych
funkcja goal-seek jest uznawana za najbardziej użyteczny tryb kalkulatora.

**Co zostało zrobione**

- `solveOverpayForTarget()` w `src/lib/mortgage.ts` — bisekcja po kwocie
  nadpłaty. Czas spłaty maleje monotonicznie wraz z nadpłatą, więc bisekcja
  jest poprawna i zbiega w ~27 krokach do grosza. Zwraca **najmniejszą** kwotę,
  która pozwala zdążyć, a nie pierwszą lepszą.
- Nowa strategia `goal` w `useCalculator` — suwak celu w latach, wynik
  propagowany do harmonogramu, wykresów i eksportu CSV jak każda inna strategia.
- Karta wyniku pokazująca wymaganą nadpłatę, łączną kwotę do banku
  i faktyczną liczbę rat.
- Obsługa przypadku „cel osiągalny bez nadpłacania" — zamiast pustego wyniku
  strona mówi wprost, że nic nie trzeba robić.
- Współdzielenie przez URL: `?strategy=goal&goal=180`.
- 6 nowych testów: trafianie w cel, minimalność wyniku, monotoniczność,
  przypadki brzegowe (cel 1 miesiąc, cel 0, cel dłuższy niż kredyt).

**Weryfikacja:** 31 testów przechodzi. Sprawdzone na żywo — kredyt 400 000 zł,
6,5%, 300 rat, cel 15 lat → 784 zł/mies. nadpłaty, 3 484 zł łącznie do banku,
183 052 zł zaoszczędzonych odsetek. Rata standardowa 2 701 zł zgadza się
z wyliczeniem ręcznym.

---

## FAZA 4 — Podpięcie monetyzacji ✅

*4 września 2026*

**Co zostało zrobione**

- `src/components/AdSlot.tsx` — jednostka reklamowa czytająca konfigurację.
  Bez skonfigurowanego slotu nie renderuje niczego: żadnej pustej ramki,
  żadnego przeskoku layoutu.
- `src/components/PartnerOffers.tsx` — kontekstowy moduł ofert pod wynikami.
- Dwa miejsca reklamowe: pod wynikami kalkulatora i między sekcjami
  edukacyjnymi. **Świadomie nie ma reklamy nad kalkulatorem** — użytkownik,
  który nie doszedł do wyniku, nie kliknie też w ofertę partnera,
  a oferta jest warta wielokrotnie więcej niż odsłona reklamy.

**Jak działa moduł partnerski**

Nie jest to zwykły baner. Liczy na danych konkretnego użytkownika, ile odsetek
zniknęłoby przy oprocentowaniu niższym o 1 punkt procentowy, i pokazuje tę kwotę
w treści. Przy kredycie 400 000 zł na 7,2% i 300 ratach to 75 608 zł — liczba,
która sama się broni, bez obiecywania czegokolwiek w imieniu banku.

Warunki wyświetlenia (wszystkie muszą być spełnione):

1. Użytkownik kliknął „Oblicz" — moduł nie istnieje na pustej stronie.
2. Pozostało co najmniej 60 rat — przy krótszym okresie refinansowanie
   zwykle nie zwraca kosztów.
3. Obniżka oprocentowania faktycznie dawałaby oszczędność.
4. W konfiguracji są jakiekolwiek oferty.

Oznaczenie: badge „Oferta partnerska", osobna adnotacja o prowizji pod linkami,
`rel="sponsored nofollow"` na każdym odnośniku. To nie jest nadgorliwość —
Google traktuje strony finansowe jako YMYL i karze za ukryte reklamy,
a AdSense potrafi za to zablokować konto.

**Weryfikacja:** przetestowane z tymczasowymi ofertami testowymi — moduł
renderuje się poprawnie i podaje prawidłową kwotę (75 608 zł potwierdzone
ręcznym przeliczeniem). Konfiguracja przywrócona do pustej.

⏸ **Czeka na Ciebie:** linki z sieci afiliacyjnej → `PARTNER_OFFERS`
oraz ID jednostek reklamowych → `ADSENSE_SLOTS`.
