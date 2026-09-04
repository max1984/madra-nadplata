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
