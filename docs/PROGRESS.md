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

---

## FAZA 5 — Podstrony SEO ✅

*4 września 2026*

**Problem**

Strona miała jeden adres URL walczący o jedną frazę, na której konkurencja
(Bankier, rankomat) ma domeny o autorytecie nie do dogonienia. Jeden URL to
sufit ruchu, a bez ruchu wszystkie poprzednie fazy są warte zero.

**Co zostało zrobione**

- `scripts/build-seo.mjs` — generator statycznych podstron, uruchamiany
  automatycznie po `vite build`. 18 podstron + `sitemap.xml`.
- `scripts/seo-content.mjs` — treść oddzielona od logiki generowania.
- Blok linków w stopce aplikacji — bez odnośnika ze strony głównej sam sitemap
  rzadko wystarcza, żeby Google uznał podstronę za wartą zaindeksowania.
- `public/sitemap.xml` usunięty; sitemap jest teraz generowany, więc nie może
  się zdezaktualizować.

**Dwie rodziny podstron**

*13 stron kwotowych* (`/kalkulator-nadplaty-300000-zl/`) — dla każdej kwoty
tabela skutków nadpłaty 200–2000 zł i druga tabela pokazująca wpływ
oprocentowania. Każda liczba jest wyliczana w czasie budowania przez
`src/lib/mortgage.ts`, ten sam kod, który liczy w kalkulatorze. Nic nie jest
wpisane ręcznie, więc treść i narzędzie nie mogą się rozjechać.

*5 stron poradnikowych* — treść pisana ręcznie, każda odpowiada na jedno
konkretne pytanie z wyszukiwarki: opłacalność nadpłaty, skrócenie okresu kontra
niższa rata, moment rozpoczęcia, nadpłata kontra inwestowanie, prowizja
za wcześniejszą spłatę.

**Decyzja: statyczny HTML zamiast tras w SPA**

Strona stoi na GitHub Pages, gdzie nie ma serwera renderującego Reacta.
Googlebot wykonuje JavaScript, ale z opóźnieniem i bez gwarancji. Dla stron,
których jedynym zadaniem jest zostać znalezionym, czysty HTML z inline CSS jest
lepszym narzędziem — ładuje się natychmiast i indeksuje bezwarunkowo.
Generator bundluje `mortgage.ts` esbuildem, więc nie ma zduplikowanej
matematyki finansowej w drugim języku.

**Decyzja: brak stron „nadpłata w mBanku / PKO BP"**

Frazy z nazwami banków mają duży wolumen i były pierwszym pomysłem — ale
rzetelna strona o nadpłacie w konkretnym banku wymaga zweryfikowanych danych
o prowizjach i procedurach tego banku. Bez nich powstałoby 12 niemal
identycznych stron podmieniających tylko nazwę, czyli podręcznikowy przykład
doorway pages, za które Google karze — a w kategorii finansowej podanie
niesprawdzonej informacji o opłatach to problem poważniejszy niż SEO.
Do zrobienia, gdy będą źródła.

**Weryfikacja:** wygenerowane strony sprawdzone w przeglądarce. Kredyt
300 000 zł / 6,5% / 25 lat → rata 2 026 zł, odsetki 307 686 zł, nadpłata
500 zł oszczędza 125 588 zł i skraca kredyt o 9 lat 1 mies. Zgadza się
z kalkulatorem i z przeliczeniem ręcznym.

**Potwierdzenie na produkcji** (5 września 2026, po automatycznym deployu):
strona główna, wszystkie 18 podstron i `sitemap.xml` (19 adresów) odpowiadają
`200 OK` pod `nadplata.org`. Pipeline `push → build → GitHub Pages` zadziałał
bez żadnej ręcznej interwencji.

---

## FAZA 6 — Automatyzacja ✅

*5 września 2026*

**Cel:** domknąć obietnicę „zero pracy właściciela" — deploy już działał
automatycznie od pierwszego commita w tej sesji (GitHub Actions → Pages przy
każdym pushu na `main`), tej fazie zostały więc dwie rzeczy, których wcześniej
brakowało: pilnowanie, czy strona żyje, i pilnowanie aktualności zależności.

**Co zostało zrobione**

- `.github/workflows/monitor.yml` — cotygodniowa kontrola (poniedziałek,
  06:17 UTC): strona główna odpowiada, `sitemap.xml` ma odpowiednią liczbę
  wpisów, dwie reprezentatywne podstrony SEO odpowiadają, `robots.txt`
  wskazuje na sitemap. Bez żadnych sekretów — GitHub domyślnie wysyła e-mail
  do właściciela repozytorium, gdy zaplanowany workflow kończy się
  niepowodzeniem, więc to jedyny potrzebny „alarm".
- `.github/dependabot.yml` — cotygodniowe PR-y z aktualizacjami npm
  (pogrupowane patch/minor, limit 5 naraz) i akcji GitHuba. Merge nadal
  wymaga Twojego kliknięcia — to jedyne miejsce, gdzie automatyzacja świadomie
  zatrzymuje się przed Tobą, bo aktualizacje major mogą wymagać przeglądu.

**Co już działało wcześniej i nie wymagało zmian**

- Deploy: `git push` na `main` → `npm run build` (teraz obejmuje też generator
  SEO z fazy 5) → GitHub Pages. Zero kroków ręcznych.
- Sitemap: generowany przy każdym buildzie z `lastmod` ustawionym na datę
  builda — nie może się zdezaktualizować.

**Weryfikacja:** logika sprawdzeń z `monitor.yml` odtworzona ręcznie przeciwko
`nadplata.org` — wszystkie cztery kroki przechodzą.

---

## Podsumowanie: gdzie jesteśmy

Wszystkie sześć faz z `PLAN-ZYSKU.md` wdrożone i działające na produkcji.
Pozostałe kroki należą wyłącznie do właściciela (sekcja 3 planu):
publisher ID AdSense, konto Search Console, rejestracja w sieci afiliacyjnej.
Do tego czasu strona działa dokładnie jak wcześniej, tylko szybciej, jaśniej,
z jedną unikalną funkcją więcej i z osiemnastoma dodatkowymi drzwiami wejścia
z wyszukiwarki.

---

## Podpięcie prawdziwego AdSense ✅

*5 września 2026*

Właściciel przekazał publisher ID (`pub-6577606072180185`). Podmienione
w dwóch miejscach:

- `src/config/monetization.ts` → `ADSENSE_CLIENT = 'ca-pub-6577606072180185'`.
  Od tego momentu `adsEnabled()` zwraca `true`: skrypt `adsbygoogle.js`
  ładuje się naprawdę (Auto Ads zacznie działać na całej stronie, gdy Google
  zakończy weryfikację witryny), a baner zgody na reklamy zaczyna się pokazywać
  pierwszym odwiedzającym.
- `public/ads.txt` → prawdziwy `pub-6577606072180185` zamiast atrapy.
  Bez zgodnego `ads.txt` część popytu programatycznego i tak by odpadła,
  nawet przy poprawnym ID w skrypcie.

Dwa ręcznie umieszczone sloty (`afterResults`, `inArticle` w
`ADSENSE_SLOTS`) zostają puste, dopóki nie założysz w panelu AdSense
konkretnych jednostek reklamowych — do tego czasu monetyzuje samo Auto Ads.

**Naprawiony przy okazji bug zgłoszony przez właściciela:** linki poradnikowe
w stopce (dodane w Fazie 5) były owinięte w tag `<nav>`. Globalny CSS ma
regułę po samej nazwie znacznika — `nav { position: fixed; top: 0; z-index: 100; }`
— napisaną z myślą o głównej nawigacji, ale łapiącą **każdy** element `<nav>`
na stronie. Efekt: linki w stopce renderowały się przyklejone do góry ekranu,
na wierzchu treści hero. Zmienione na `<div role="navigation">` — ten sam
sygnał dla czytników ekranu, bez kolizji ze stylem tagu. Zweryfikowane
zrzutem ekranu: góra strony czysta, linki z powrotem w stopce.
