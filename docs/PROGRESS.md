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
