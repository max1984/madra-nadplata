# Plan monetyzacji nadplata.org

> Wersja 1.0 — 4 września 2026
> Cel: przekształcić nadplata.org z projektu hobbystycznego w źródło pasywnego dochodu,
> przy minimalnym nakładzie pracy właściciela.

---

## 0. Punkt startowy — diagnoza

Stan zastany (4.09.2026), potwierdzony w kodzie i na żywej stronie:

| Element | Stan | Skutek |
|---|---|---|
| AdSense | `ca-pub-XXXXXXXXXXXXXXXX` w `index.html` i `ads.txt` — **atrapa** | **Strona nie zarabia ani złotówki.** Skrypt ładuje się z nieistniejącym ID |
| Sloty reklamowe | Brak — tylko Auto Ads | Google sam wybiera miejsca, zwykle słabo |
| Afiliacja | Brak | Największy niewykorzystany strumień |
| Analityka | Usunięta (commit `0bf3032`) | **Latasz bez przyrządów** — nie wiesz, ile masz ruchu |
| Search Console | Nieznane | Nie wiadomo, na co strona rankuje |
| Treść pod SEO | 1 podstrona (`/`) | Jedna strona = jedno słowo kluczowe = sufit ruchu |
| Produkt | Kalkulator lepszy niż u konkurencji | **To jest realny atut** |
| Donacje | buymeacoffee | Symboliczne, nie skaluje się |

**Wniosek:** produkt jest gotowy, brakuje trzech rzeczy — pomiaru, ruchu i podpiętej monetyzacji.
W tej kolejności co do ważności, ale wdrażamy równolegle.

---

## 1. Model przychodu

Wybrany model (decyzja właściciela): **AdSense (baza) + afiliacja finansowa (dźwignia)**.

### 1.1 Dlaczego akurat tak

Kalkulator nadpłaty przyciąga ruch o wyjątkowo wysokiej intencji zakupowej:
użytkownik ma kredyt hipoteczny, myśli o pieniądzach i właśnie w tej sekundzie
liczy, jak zapłacić bankowi mniej. To najlepszy możliwy moment na pokazanie
oferty refinansowania.

### 1.2 Ekonomia — realistyczne widełki

**AdSense** (kategoria finanse, ruch polski):

| Odsłon / mies. | RPM 4 zł | RPM 8 zł | RPM 12 zł |
|---|---|---|---|
| 5 000 | 20 zł | 40 zł | 60 zł |
| 25 000 | 100 zł | 200 zł | 300 zł |
| 100 000 | 400 zł | 800 zł | 1 200 zł |

**Afiliacja** (leady kredytowe, stawki rynkowe w PL 2026: 50–600 zł za lead,
do 1 000 zł za podpisaną umowę):

| Odsłon / mies. | CTR 2% | Konwersja leada 5% | Stawka 150 zł | Przychód |
|---|---|---|---|---|
| 5 000 | 100 kliknięć | 5 leadów | 150 zł | **750 zł** |
| 25 000 | 500 kliknięć | 25 leadów | 150 zł | **3 750 zł** |
| 100 000 | 2 000 kliknięć | 100 leadów | 150 zł | **15 000 zł** |

> **To jest cała teza tego planu:** afiliacja daje 10–30× więcej niż reklamy
> displayowe przy tym samym ruchu. Reklamy to podłoga, afiliacja to sufit.

### 1.3 Uczciwość jako strategia, nie jako ograniczenie

Strona ma w stopce disclaimer „nie stanowi porady finansowej". To dobrze.
Moduł ofert partnerskich musi:

- pokazywać się **tylko wtedy, gdy wyliczenie faktycznie pokazuje oszczędność**
  (np. refinansowanie ma dodatnie saldo netto),
- być jawnie oznaczony jako **„Oferta partnerska"** z wyjaśnieniem prowizji,
- nigdy nie udawać wyniku kalkulatora.

Powód nie jest tylko etyczny: Google karze strony YMYL („Your Money or Your Life")
za ukryte reklamy finansowe, a AdSense potrafi zablokować konto. Transparentność
to warunek utrzymania obu strumieni przychodu.

---

## 2. Fazy wdrożenia

Numeracja odpowiada commitom w repo — postęp śledzony w [`PROGRESS.md`](./PROGRESS.md).

### FAZA 1 — Fundament pomiaru i konfiguracji ✅

**Problem:** wszystko jest zaszyte w kodzie w kilku miejscach, nie da się nic
włączyć bez grzebania w plikach.

- `src/config/monetization.ts` — jedno miejsce na: ID AdSense, sloty reklamowe,
  linki afiliacyjne, przełączniki funkcji. Podmiana ID = jedna linijka.
- Analityka bezciasteczkowa (Cloudflare Web Analytics / Plausible) — bez zgody RODO,
  bez banera, zero wpływu na Core Web Vitals.
- Skrypt AdSense ładowany **warunkowo** — przy atrapie ID w ogóle się nie ładuje
  (dziś marnuje transfer i psuje LCP przy każdym wejściu).

### FAZA 2 — Jasny motyw ✅

**Problem biznesowy, nie estetyczny.** Ciemny motyw w kategorii finanse:

- obniża CTR reklam AdSense (reklamy są projektowane pod jasne tła i wyglądają
  jak obce wtręty na ciemnym),
- obniża zaufanie — banki, porównywarki i serwisy finansowe w PL są jasne;
  ciemny interfejs czyta się jako „projekt hobbystyczny",
- gorzej drukuje się i gorzej wygląda w zrzutach ekranu udostępnianych na forach
  (a to darmowy kanał ruchu).

Jasna, czysta paleta: biel/kość słoniowa, jeden granat jako kolor marki, zieleń
dla oszczędności, czerwień dla kosztu. Kontrasty zgodne z WCAG AA.

### FAZA 3 — Nowa funkcjonalność (przewaga nad konkurencją)

Przegląd konkurencji (Bankier.pl SMART, hipoteczny.pl, dobrykalkulator.pl,
okioki.pl, bankoweabc.pl) pokazuje, że **wszyscy robią to samo**: 4 pola,
wybór „niższa rata / krótszy okres", jeden wynik. Żaden nie ma wykresu,
edytowalnego harmonogramu ani eksportu. Bankier.pl monetyzuje listą ofert banków
pod wynikiem — i to jest wzorzec do skopiowania.

Czego brakuje **wszystkim**, łącznie z nami:

1. **Cel spłaty (goal-seek)** — odwrócone pytanie: „chcę mieć kredyt spłacony
   za 15 lat — ile muszę dopłacać?". To najczęstsze realne pytanie kredytobiorcy,
   a nikt w PL tego nie ma. Wyszukiwane frazy: „ile nadpłacać żeby spłacić
   kredyt w 15 lat", „jak szybko spłacić kredyt hipoteczny".
2. **Test odporności na stopy** — „co jeśli WIBOR wzrośnie o 2 pp?".
   Po latach 2022–2023 to lęk numer jeden polskiego kredytobiorcy.
3. **Raport do druku / PDF** — kalkulacja do zabrania do banku lub doradcy.
   Podwójna korzyść: użyteczność + naturalne miejsce na markę i ofertę partnera.
4. **Wakacje kredytowe** — specyfika PL, brak w narzędziach zagranicznych.

Priorytet wdrożenia: **1 → 3 → 2 → 4**.

### FAZA 4 — Podpięcie monetyzacji

- **Sloty reklamowe** w miejscach o realnej widoczności: pod wynikami kalkulatora
  (użytkownik tam scrolluje i się zatrzymuje) oraz w treści między sekcjami.
  Nigdy nad kalkulatorem — to zabija konwersję do wyniku, a wynik jest paliwem
  dla afiliacji.
- **Moduł ofert partnerskich** — kontekstowy, pojawia się po wyliczeniu, gdy dane
  użytkownika wskazują na sens refinansowania. Z pełnym oznaczeniem.
- **`ads.txt`** z prawdziwym ID (bez tego część popytu programatycznego odpada).

### FAZA 5 — Ruch (bez ruchu poprzednie fazy są warte zero)

Największa dźwignia i największa praca. Strona to dziś **jeden adres URL**
walczący o jedną frazę. Rozwiązanie: strony generowane programowo, prerenderowane
do statycznego HTML (GitHub Pages nie ma serwera, więc SPA sam z siebie nie
zaindeksuje się dobrze).

Trzy rodziny podstron, każda z unikalną treścią i kalkulatorem wypełnionym danymi:

| Rodzina | Przykład URL | Szacowany wolumen |
|---|---|---|
| Wg banku | `/nadplata-kredytu-mbank` | 12 banków × ~200 wyszukiwań/mies. |
| Wg kwoty | `/kalkulator-nadplaty-300000-zl` | 15 kwot × ~150 wyszukiwań/mies. |
| Wg pytania | `/czy-oplaca-sie-nadplacac-kredyt` | 20 fraz × ~300 wyszukiwań/mies. |

Razem realistycznie **8–15 tys. odsłon/mies. w horyzoncie 6–9 miesięcy** —
przy czym każda taka podstrona ma wyższą intencję niż strona główna,
więc konwertuje lepiej.

Uzupełniająco: `sitemap.xml` generowany automatycznie przy buildzie,
dane strukturalne per podstrona, wewnętrzne linkowanie.

### FAZA 6 — Automatyzacja („żebyś nic nie musiał robić")

- **Deploy** — już działa: `push` na `main` → GitHub Actions → GitHub Pages.
- **Sitemap** — generowany przy każdym buildzie, `lastmod` zawsze aktualne.
- **Monitoring** — cotygodniowa akcja sprawdzająca, czy strona żyje i czy
  Core Web Vitals nie spadły; e-mail przy awarii.
- **Zależności** — Dependabot, automatyczne PR-y z aktualizacjami bezpieczeństwa.
- **Treść** — opcjonalnie: zaplanowany agent w chmurze, który raz w miesiącu
  dopisuje nową podstronę poradnikową i wypycha ją na produkcję.

---

## 3. Co wymaga Ciebie — kompletna lista

To jedyne rzeczy, których nie da się zrobić za Ciebie, bo wymagają Twojej
tożsamości, konta bankowego albo podpisu.

| # | Zadanie | Czas | Kiedy |
|---|---|---|---|
| 1 | Podać mi **publisher ID AdSense** (`ca-pub-...`) | 2 min | Teraz |
| 2 | W panelu AdSense: dodać `nadplata.org` jako witrynę i włączyć **Auto Ads** | 10 min | Po fazie 4 |
| 3 | Założyć konto w **Google Search Console** i zweryfikować domenę | 15 min | Raz |
| 4 | Zarejestrować się w **1–2 sieciach afiliacyjnych** (SuperPartners / LeadStar / ComperiaLead) i przekazać mi linki trackingowe | 30 min | Po fazie 4 |
| 5 | Sprawdzać raz w miesiącu, czy wpływy się zgadzają | 5 min/mies. | Stale |

**Suma jednorazowa: około godzina Twojego czasu.** Wszystko poza tym — kod,
treść, SEO, deploy, monitoring — jest po mojej stronie i zostaje zautomatyzowane.

---

## 4. Realistyczne oczekiwania

Uczciwie, bez obiecywania cudów:

| Horyzont | Ruch / mies. | Przychód / mies. |
|---|---|---|
| Miesiąc 1–2 | 500–2 000 | 0–50 zł (indeksacja trwa) |
| Miesiąc 3–4 | 2 000–6 000 | 100–500 zł |
| Miesiąc 6–9 | 8 000–15 000 | 800–3 000 zł |
| Miesiąc 12+ | 20 000+ | 2 000–8 000 zł |

Największa niepewność to SEO — Google potrzebuje 2–4 miesięcy na ocenę nowych
podstron w kategorii YMYL, a konkurencja (Bankier, rankomat) ma domeny
o autorytecie nie do dogonienia na frazach ogólnych. Dlatego cała strategia
ruchu opiera się na **frazach długiego ogona**, gdzie autorytet domeny waży mniej
niż dopasowanie treści do konkretnego pytania.

Drugie ryzyko: AdSense potrafi odrzucić witrynę o zbyt małej ilości treści.
Faza 5 (podstrony) rozwiązuje to przy okazji.

---

## 5. Czego świadomie NIE robimy

- **Newsletter / zbieranie e-maili** — wymaga backendu, zgód RODO i regularnego
  pisania. Sprzeczne z założeniem „zero pracy właściciela".
- **Płatna wersja premium** — na tym ruchu nie zwróci kosztu obsługi płatności
  i podatków. Do rozważenia dopiero powyżej 50 tys. odsłon/mies.
- **Własne API / konta użytkowników** — koszt serwera zjadłby przychód.
  Strona zostaje w 100% statyczna, hosting kosztuje 0 zł.
- **Agresywne reklamy (pop-up, sticky, interstitial)** — podnoszą RPM o ~20%,
  ale zabijają konwersję afiliacyjną, która jest wielokrotnie cenniejsza.
