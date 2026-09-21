# Weryfikacja stałych podatkowo-składkowych 2026

Data weryfikacji: 2026-09-21, metoda: WebSearch, źródła priorytetowo oficjalne
(zus.pl, gov.pl, stat.gov.pl, knf.gov.pl, przepisy.gofin.pl) lub agregatory
cytujące akty prawne wprost. Wynik: **wszystkie sprawdzone stałe zgodne
z kodem** — żadna liczba nie wymagała zmiany. Skorygowano jedną błędną datę
(patrz niżej).

## src/lib/salary.ts

| Stała | Wartość w kodzie | Źródło | Werdykt |
|---|---|---|---|
| `MIN_WAGE_GROSS` | 4806 | Rozporządzenie RM z 11.09.2025 w sprawie minimalnego wynagrodzenia w 2026 r. | ✅ zgodna |
| `MIN_WAGE_HOURLY` | 31.40 | j.w. | ✅ zgodna |
| `ZUS_ANNUAL_BASE_LIMIT` | 282 600 | Obwieszczenie Ministra Rodziny, Pracy i Polityki Społecznej z 19.11.2025 (30× prognozowane przeciętne wynagrodzenie 9420 zł) | ✅ zgodna |
| `RYCZALT_HEALTH_TIER_1` | 498.35 | zus.pl, próg przychodu ≤ 60 000 zł | ✅ zgodna |
| `RYCZALT_HEALTH_TIER_2` | 830.58 | zus.pl, próg 60 000–300 000 zł | ✅ zgodna |
| `RYCZALT_HEALTH_TIER_3` | 1495.04 | zus.pl, próg > 300 000 zł | ✅ zgodna |
| `B2B_FULL_ZUS_SOCIAL_MANDATORY` | 1788.29 | zus.pl, pełny ZUS bez chorobowej, baza 5652 zł (60% prognozowanego przeciętnego wynagrodzenia) | ✅ zgodna |
| `B2B_FULL_ZUS_PENSION_BASE` | 5652.20 | j.w. | ✅ zgodna |
| `B2B_PREFERENTIAL_ZUS_SOCIAL_MANDATORY` | 456.18 | zus.pl, preferencyjny ZUS (24 mies.), baza 1441.80 = 30% MIN_WAGE_GROSS | ✅ zgodna |
| `HEALTH_INSURANCE_MIN_SKALA_LINIOWY` | 432.54 | zus.pl, minimalna składka zdrowotna skala/liniowy 2026 | ✅ zgodna |
| `AVERAGE_NATIONAL_WAGE_GROSS_2026` (w creditworthiness.ts, ta sama rodzina danych) | 9233 | Komunikat GUS, przeciętne wynagrodzenie w gospodarce narodowej II kw. 2026: 9233,13 zł | ✅ zgodna |
| Kwota zmniejszająca podatek | 300 zł/mies. (`case 'full': return 300` w `resolveReducingAmount`) | Bez zmian od Polskiego Ładu 2022 (30 000 zł kwoty wolnej × 12% ÷ 12) | ✅ zgodna |
| `TAX_SCALE_THRESHOLD` | 120 000 | Skala PIT bez zmian od 2022 | ✅ zgodna (wiedza ogólna, niekwestionowana w żadnym z przeszukanych źródeł 2026) |
| `YOUNG_RELIEF_LIMIT` | 85 528 | Limit ulg specjalnych bez zmian od 2019/2022 | ✅ zgodna (jw.) |

## src/lib/creditworthiness.ts

| Stała | Wartość w kodzie | Źródło | Werdykt |
|---|---|---|---|
| `DSTI_THRESHOLD_LOW` / `HIGH` | 0.4 / 0.5 | Rekomendacja S KNF, nowelizacja 19.06.2023 (nie 2026 — patrz niżej) | ✅ zgodna |
| `BUFFER_FIXED_RATE_PP` | 2.5 | j.w., knf.gov.pl | ✅ zgodna |
| `BUFFER_VARIABLE_RATE_PP` | 5 (przyjęte orientacyjnie) | Rekomendacja nakazuje "adekwatnie wyższy" bufor dla zmiennej stopy bez wskazania liczby — 5 p.p. to świadomy wybór autorski, nie cytat z przepisu | ⚪ brak jednej "oficjalnej" liczby, wartość pozostaje jako rozsądne przybliżenie |
| `AVERAGE_NATIONAL_WAGE_GROSS_2026` | 9233 | GUS, II kw. 2026: 9233,13 zł | ✅ zgodna |
| `AVERAGE_NATIONAL_WAGE_NET_2026` | 6624 | Wyliczenie pochodne (nie ma jednej "oficjalnej" kwoty netto) — dodano test krzyżowy w `creditworthiness.test.ts` porównujący z realnym przeliczeniem `calcEmploymentContract` z `salary.ts` (tolerancja ±2 zł) | ✅ zgodna, teraz pilnowana automatycznie |

## Skorygowany błąd: fabrykowana data nowelizacji Rekomendacji S

Komentarz w `creditworthiness.ts` twierdził, że Rekomendacja S została
zaostrzona **19.06.2026**. Źródła KNF (knf.gov.pl/komunikacja/komunikaty)
nie potwierdzają żadnej nowelizacji z tą datą — prawdziwa, ostatnia duża
nowelizacja została przyjęta **19.06.2023** (termin dostosowania banków:
1.07.2024) i to ona wprowadziła DSTI 40%/50% oraz bufor 2,5 p.p., czyli
dokładnie te wartości, które są w kodzie. Najbardziej prawdopodobne
wyjaśnienie: pomyłka przy wcześniejszym generowaniu komentarza — przesunięcie
roku (2023→2026) przy zachowaniu identycznego dnia/miesiąca (19.06)
prawdziwej nowelizacji. Same liczby (DSTI, bufor) były więc cały czas
poprawne — błędna była tylko narracja o dacie. Skorygowano w kodzie
(zobacz `src/lib/creditworthiness.ts`, commit "Licz próg DSTI od surowego
dochodu netto").

## Metodologia

Każda stała sprawdzona przez WebSearch z zapytaniem celowanym w tę
konkretną wartość, priorytetyzując wyniki z domen `zus.pl`, `gov.pl`,
`stat.gov.pl`, `knf.gov.pl` lub bezpośrednie cytaty aktów prawnych
(rozporządzeń, obwieszczeń). Gdzie źródło pierwotne nie było bezpośrednio
dostępne (np. treść rozporządzenia RM), przyjęto zgodność wielu niezależnych
serwisów księgowych/kadrowych cytujących tę samą liczbę jako wystarczające
potwierdzenie.

## Do zrobienia przy następnej aktualizacji (nowy rok/kwartał)

- GUS publikuje przeciętne wynagrodzenie kwartalnie — `AVERAGE_NATIONAL_WAGE_GROSS_2026`
  w `creditworthiness.ts` wymaga aktualizacji po każdym komunikacie GUS.
- Minimalne wynagrodzenie, limit 30-krotności, progi ryczałtu zdrowotnego
  zmieniają się corocznie (od 1 stycznia) — do sprawdzenia na przełomie
  grudnia/stycznia.
- Rekomendacja S może zostać znowelizowana ponownie — do sprawdzenia przy
  każdej wzmiance o zmianach w prasie branżowej (nie ufać samej dacie bez
  potwierdzenia w źródle KNF, patrz sekcja wyżej).
