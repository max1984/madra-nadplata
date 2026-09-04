/**
 * Treść podstron SEO. Osobno od generatora, żeby dopisanie nowej strony
 * nie wymagało dotykania logiki budowania.
 *
 * Zasada nadrzędna: żadna liczba na tych stronach nie jest wpisana ręcznie.
 * Wszystko, co wygląda na wyliczenie, jest wyliczane tym samym kodem,
 * który napędza kalkulator (src/lib/mortgage.ts). Strona finansowa, która
 * podaje zmyślone kwoty, to nie jest problem SEO — to problem wiarygodności.
 */

/** Oprocentowanie użyte w tabelach przykładowych. */
export const REF_RATE = 6.5;
/** Okres użyty w tabelach przykładowych (lata). */
export const REF_YEARS = 25;
/** Warianty nadpłaty pokazywane w tabeli. */
export const OVERPAY_STEPS = [200, 500, 1000, 1500, 2000];

/** Kwoty kredytu, dla których powstają osobne podstrony. */
export const AMOUNTS = [
  100000, 150000, 200000, 250000, 300000, 350000,
  400000, 450000, 500000, 600000, 700000, 800000, 1000000,
];

/**
 * Strony poradnikowe. Treść pisana ręcznie — to jedyne miejsce,
 * gdzie tekst nie jest generowany.
 */
export const GUIDES = [
  {
    slug: 'czy-oplaca-sie-nadplacac-kredyt-hipoteczny',
    title: 'Czy opłaca się nadpłacać kredyt hipoteczny?',
    description:
      'Kiedy nadpłata kredytu hipotecznego ma sens, a kiedy lepiej odłożyć pieniądze gdzie indziej. Konkretne progi opłacalności i wyliczenia.',
    keywords: 'czy opłaca się nadpłacać kredyt, nadpłata kredytu opłacalność, nadpłata czy oszczędzanie',
    intro:
      'Krótka odpowiedź: prawie zawsze, ale nie zawsze najpierw. Nadpłata to inwestycja o gwarantowanej stopie zwrotu równej oprocentowaniu Twojego kredytu — i to zwrocie wolnym od podatku Belki. Trudno o bezpieczniejszy zysk. Są jednak trzy sytuacje, w których pieniądze powinny popłynąć gdzie indziej.',
    sections: [
      {
        h: 'Nadpłata to inwestycja z gwarantowanym zwrotem',
        p: [
          'Każda złotówka nadpłaty zmniejsza saldo kredytu, a od mniejszego salda bank nalicza mniejsze odsetki — w każdym kolejnym miesiącu aż do końca kredytu. Efekt jest równoważny inwestycji o stopie zwrotu równej oprocentowaniu kredytu.',
          'Różnica na korzyść nadpłaty: ten zwrot jest pewny i nieopodatkowany. Lokata na 5% brutto daje po podatku Belki około 4,05% netto. Nadpłata kredytu na 6,5% daje 6,5% netto, bo nie jest przychodem, tylko uniknięciem kosztu. Żeby inwestycja pobiła nadpłatę kredytu na 6,5%, musiałaby przynosić ponad 8% brutto rocznie — i to nie okazjonalnie, tylko przez cały pozostały okres kredytu.',
        ],
      },
      {
        h: 'Trzy sytuacje, w których nie nadpłacaj',
        p: [
          '<strong>Nie masz poduszki finansowej.</strong> Nadpłaty nie da się cofnąć. Bank nie odda Ci pieniędzy, gdy zepsuje się samochód albo stracisz pracę — zostanie Ci kredyt gotówkowy na 12–20%. Najpierw odłóż 3–6 miesięcy wydatków na koncie, do którego masz dostęp z dnia na dzień, dopiero potem nadpłacaj.',
          '<strong>Masz droższy dług.</strong> Karta kredytowa, chwilówka, kredyt gotówkowy, zakupy na raty — jeśli cokolwiek kosztuje Cię więcej niż hipoteka, każda złotówka powinna iść tam. Kolejność jest zawsze ta sama: od najdroższego długu do najtańszego.',
          '<strong>Twój pracodawca dopłaca do PPK, a Ty nie korzystasz.</strong> Dopłata pracodawcy to natychmiastowy zwrot rzędu kilkudziesięciu procent. Nic w kredycie tego nie pobije.',
        ],
      },
      {
        h: 'A co z prowizją za wcześniejszą spłatę?',
        p: [
          'Ustawa o kredycie hipotecznym pozwala bankowi pobrać rekompensatę za wcześniejszą spłatę tylko przez pierwsze 36 miesięcy od uruchomienia kredytu, i tylko przy oprocentowaniu zmiennym. Po trzech latach prowizja jest niedozwolona. Wiele banków nie pobiera jej wcale.',
          'Jeśli prowizja Cię dotyczy, nadal zwykle się opłaca — po prostu zwraca się później. Kalkulator pokazuje, w którym miesiącu zaoszczędzone odsetki przewyższą zapłaconą prowizję.',
        ],
      },
    ],
  },
  {
    slug: 'skrocic-okres-czy-zmniejszyc-rate',
    title: 'Skrócić okres kredytu czy zmniejszyć ratę?',
    description:
      'Dwa warianty nadpłaty kredytu hipotecznego i ich realne konsekwencje. Który wybrać i kiedy niższa rata jest lepsza mimo wyższego kosztu.',
    keywords: 'skrócenie okresu kredytu czy zmniejszenie raty, nadpłata kredytu skrócenie okresu, obniżenie raty po nadpłacie',
    intro:
      'Po każdej nadpłacie bank zapyta, co zrobić z jej efektem: skrócić okres kredytowania czy obniżyć ratę. Finansowo odpowiedź jest jednoznaczna, ale to nie znaczy, że zawsze jest właściwa.',
    sections: [
      {
        h: 'Skrócenie okresu jest tańsze — zawsze',
        p: [
          'Przy skróceniu okresu rata zostaje taka sama, a kredyt kończy się wcześniej. Płacisz odsetki przez mniej miesięcy, więc łączny koszt spada mocniej. Przy obniżeniu raty termin zostaje ten sam, a Ty co miesiąc płacisz mniej — odsetki nalicza się wprawdzie od niższego salda, ale przez pełny pierwotny okres.',
          'Różnica między tymi wariantami przy tej samej nadpłacie potrafi sięgać kilkudziesięciu tysięcy złotych. Możesz ją zobaczyć u siebie: w kalkulatorze wybierz strategię „Własne nadpłaty" i przełącz efekt między skróceniem a zmniejszeniem.',
        ],
      },
      {
        h: 'Kiedy niższa rata mimo wszystko wygrywa',
        p: [
          'Niższa rata to nie strata, tylko zakup bezpieczeństwa. Ma sens, gdy Twój budżet jest napięty, dochód nieregularny albo szykuje się większy wydatek — dziecko, zmiana pracy, remont. Mniejsze zobowiązanie miesięczne obniża ryzyko, że w gorszym miesiącu sięgniesz po drogi kredyt konsumpcyjny.',
          'Jest też wariant hybrydowy, najlepszy z obu światów: poproś o obniżenie raty, ale nadal wpłacaj do banku poprzednią kwotę. Różnica działa jak kolejna nadpłata, a formalnie Twoje zobowiązanie jest niższe — gdy przyjdzie chudszy miesiąc, po prostu zapłacisz mniej bez żadnych negocjacji z bankiem. To dokładnie strategia „Stała kwota do banku" w kalkulatorze.',
        ],
      },
      {
        h: 'Jak to zgłosić w banku',
        p: [
          'Sam przelew nadpłaty zwykle nie wystarczy — bez dyspozycji bank domyślnie wybierze jeden z wariantów, najczęściej obniżenie raty. Dyspozycję składa się w bankowości elektronicznej albo na infolinii, zależnie od banku. Sprawdź to przed przelewem, bo zmiana po fakcie bywa kłopotliwa.',
          'Najbezpieczniejszy termin nadpłaty to dzień spłaty raty — banki różnie naliczają odsetki za dni pomiędzy ratami, a wpłata w dniu raty nie zostawia pola do interpretacji.',
        ],
      },
    ],
  },
  {
    slug: 'kiedy-zaczac-nadplacac-kredyt',
    title: 'Kiedy zacząć nadpłacać kredyt hipoteczny?',
    description:
      'Dlaczego pierwsze lata kredytu decydują o oszczędnościach i ile kosztuje zwłoka. Wyliczenia dla typowego kredytu hipotecznego.',
    keywords: 'kiedy zacząć nadpłacać kredyt, nadpłata na początku kredytu, opóźnienie nadpłaty koszt',
    intro:
      'Im wcześniej, tym lepiej — ale nie z powodów, o których zwykle się mówi. Nie chodzi o dyscyplinę ani o „im dłużej, tym więcej wpłat". Chodzi o to, że złotówka nadpłacona w pierwszym roku pracuje inaczej niż ta sama złotówka nadpłacona w dziesiątym.',
    sections: [
      {
        h: 'Dlaczego początek kredytu jest wyjątkowy',
        p: [
          'W racie równej proporcja odsetek do kapitału zmienia się w czasie. Na starcie kredytu hipotecznego zdecydowana większość raty to odsetki — kapitał spłacasz w żółwim tempie. Dopiero po latach proporcja się odwraca.',
          'Nadpłata omija ten mechanizm: trafia w całości w kapitał. Zmniejszone saldo obniża odsetki w każdym z pozostałych miesięcy, więc im więcej miesięcy zostało, tym więcej razy ta oszczędność się powtórzy. Nadpłata w pierwszym roku trzydziestoletniego kredytu działa przez 360 miesięcy. Ta sama kwota w dwudziestym piątym roku — przez 60.',
        ],
      },
      {
        h: 'Ile kosztuje odkładanie decyzji',
        p: [
          'Zwłoka nie jest neutralna. Rok czekania z nadpłatą przy typowym kredycie hipotecznym to zwykle kilka–kilkanaście tysięcy złotych straconych oszczędności, w zależności od kwoty i oprocentowania. Nie dlatego, że wpłacisz o dwanaście rat mniej, ale dlatego, że każda z nich zdąży „popracować" krócej.',
          'Kalkulator ma suwak „Zacznij nadpłacać od miesiąca" — ustaw go na 12 i porównaj wynik z zerem. Różnica jest ceną jednego roku zwłoki przy Twoich parametrach.',
        ],
      },
      {
        h: 'Wyjątek: pierwsze 36 miesięcy i prowizja',
        p: [
          'Jeśli Twój bank pobiera rekompensatę za wcześniejszą spłatę, dotyczy ona tylko pierwszych trzech lat kredytu ze zmiennym oprocentowaniem. Czasem opłaca się poczekać do końca tego okresu — ale nie zawsze, bo w tym czasie odsetki biegną dalej.',
          'To jest dokładnie ta sytuacja, w której warto policzyć zamiast zgadywać. Wpisz prowizję w kalkulator: pokaże, po ilu miesiącach zaoszczędzone odsetki przewyższą jej koszt.',
        ],
      },
    ],
  },
  {
    slug: 'nadplata-kredytu-czy-inwestowanie',
    title: 'Nadpłata kredytu czy inwestowanie? Jak policzyć, co się bardziej opłaca',
    description:
      'Porównanie nadpłaty kredytu hipotecznego z inwestowaniem tych samych pieniędzy. Próg opłacalności z uwzględnieniem podatku Belki i ryzyka.',
    keywords: 'nadpłata kredytu czy inwestowanie, nadpłata czy lokata, nadpłata kredytu a obligacje',
    intro:
      'To pytanie sprowadza się do jednej liczby: jaką stopę zwrotu musiałaby dać inwestycja, żeby pobić Twój kredyt. Odpowiedź jest wyższa, niż większość ludzi zakłada, bo trzeba porównywać wielkości po podatku i po ryzyku.',
    sections: [
      {
        h: 'Próg opłacalności: oprocentowanie kredytu podzielone przez 0,81',
        p: [
          'Nadpłata daje zwrot równy oprocentowaniu kredytu, netto — nie płacisz podatku od tego, że czegoś nie wydałeś. Zysk z inwestycji jest opodatkowany 19-procentowym podatkiem Belki, więc do porównania trzeba go wziąć brutto.',
          'Stąd prosty próg: podziel oprocentowanie kredytu przez 0,81. Kredyt na 6,5% wymaga inwestycji dającej ponad <strong>8,0% brutto rocznie</strong>. Kredyt na 7,5% — ponad 9,3%. I to nie w dobrym roku, tylko średniorocznie przez cały pozostały okres kredytu.',
          'Wyjątkiem są konta emerytalne IKE i IKZE, gdzie podatku Belki nie ma. Tam próg jest równy samemu oprocentowaniu kredytu, a w IKZE dochodzi jeszcze odliczenie od podstawy opodatkowania.',
        ],
      },
      {
        h: 'Pewne 6,5% kontra niepewne 8%',
        p: [
          'Nawet jeśli jakaś klasa aktywów historycznie dawała ponad 8% rocznie, to średnia z dekad, a nie gwarancja na Twoje najbliższe piętnaście lat. Nadpłata nie ma odchylenia standardowego — oszczędność jest dokładnie taka, jak wyliczona.',
          'W praktyce oznacza to, że przy kredytach powyżej 6% nadpłata wygrywa z bezpiecznymi instrumentami (lokaty, obligacje skarbowe) niemal zawsze, a z rynkiem akcji remisuje przy znacznie wyższym ryzyku po stronie akcji.',
        ],
      },
      {
        h: 'Odpowiedź, która zwykle jest najlepsza: jedno i drugie',
        p: [
          'To nie musi być wybór zerojedynkowy. Rozsądna kolejność wygląda tak: poduszka finansowa, potem najdroższy dług, potem dopłaty pracodawcy do PPK, potem podział nadwyżki między nadpłatę a długoterminowe inwestowanie w proporcji zależnej od Twojej tolerancji ryzyka.',
          'W kalkulatorze, pod wynikami, jest suwak zakładanej stopy zwrotu z inwestycji. Ustaw realistyczną wartość i zobacz, po której stronie wychodzi przewaga przy Twoim kredycie.',
        ],
      },
    ],
  },
  {
    slug: 'prowizja-za-wczesniejsza-splate-kredytu',
    title: 'Prowizja za wcześniejszą spłatę kredytu hipotecznego',
    description:
      'Kiedy bank może pobrać rekompensatę za nadpłatę kredytu hipotecznego, ile wynosi i jak sprawdzić, czy nadpłata mimo niej się opłaca.',
    keywords: 'prowizja za wcześniejszą spłatę kredytu, rekompensata za nadpłatę, opłata za nadpłatę kredytu hipotecznego',
    intro:
      'Najczęstszy powód, dla którego ludzie nie nadpłacają — i najczęściej niepotrzebny. W większości przypadków prowizji albo nie ma, albo jest niższa niż zaoszczędzone odsetki.',
    sections: [
      {
        h: 'Co mówi ustawa',
        p: [
          'Ustawa o kredycie hipotecznym pozwala bankowi pobrać rekompensatę za wcześniejszą spłatę wyłącznie w pierwszych 36 miesiącach od zawarcia umowy i wyłącznie przy oprocentowaniu zmiennym. Rekompensata nie może przekroczyć 3% spłacanej kwoty ani odsetek, które przypadałyby za rok.',
          'Po trzech latach nadpłata kredytu ze zmiennym oprocentowaniem jest bezpłatna — bank nie może pobrać za nią nic. Przy oprocentowaniu okresowo stałym zasady bywają inne i trzeba sprawdzić umowę.',
        ],
      },
      {
        h: 'Gdzie to sprawdzić u siebie',
        p: [
          'Szukaj w tabeli opłat i prowizji swojego banku pozycji „wcześniejsza spłata", „przedterminowa spłata" lub „rekompensata". Drugie miejsce to sama umowa kredytowa, zwykle w paragrafie o spłacie. Trzecie — infolinia; warto poprosić o potwierdzenie mailem.',
          'Sprawdź też, czy bank nie stosuje progu kwotowego: część banków nie pobiera prowizji od nadpłat poniżej pewnej kwoty rocznie.',
        ],
      },
      {
        h: 'Nawet z prowizją zwykle się opłaca',
        p: [
          'Prowizja jest jednorazowym kosztem od nadpłacanej kwoty, a oszczędność na odsetkach jest powtarzalna i biegnie do końca kredytu. Dlatego prowizja zwraca się zazwyczaj w ciągu kilku–kilkunastu miesięcy.',
          'W kalkulatorze wpisz swoją prowizję w pole „Prowizja za nadpłatę". Wyniki pokażą punkt, w którym zaoszczędzone odsetki przewyższają jej koszt — a jeśli tego punktu nie ma w całym okresie kredytu, powie to wprost.',
        ],
      },
    ],
  },
];
