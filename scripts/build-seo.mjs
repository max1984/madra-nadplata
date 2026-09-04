/**
 * Generuje statyczne podstrony SEO do dist/ po zbudowaniu aplikacji.
 *
 * Dlaczego statyczny HTML, a nie kolejne trasy w SPA: strona stoi na GitHub
 * Pages, więc nie ma serwera, który mógłby wyrenderować Reacta przed wysłaniem
 * odpowiedzi. Googlebot renderuje JavaScript, ale robi to z opóźnieniem i bez
 * gwarancji. Dla stron, których jedynym zadaniem jest zostać znalezionym,
 * czysty HTML jest po prostu lepszym narzędziem — ładuje się natychmiast
 * i indeksuje bez warunków.
 *
 * Matematyka pochodzi z src/lib/mortgage.ts — tego samego pliku, który liczy
 * w kalkulatorze. Bundlujemy go esbuildem zamiast przepisywać, żeby liczby
 * w treści i liczby w narzędziu nie mogły się rozjechać.
 */
import { build } from 'esbuild';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AMOUNTS, GUIDES, REF_RATE, REF_YEARS, OVERPAY_STEPS } from './seo-content.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SITE = 'https://nadplata.org';
const TODAY = new Date().toISOString().slice(0, 10);

/** Bundluje moduł TypeScript do tymczasowego pliku i importuje go. */
async function importTs(relPath) {
  const out = join(ROOT, 'node_modules', '.seo-tmp.mjs');
  await build({
    entryPoints: [join(ROOT, relPath)],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: out,
    logLevel: 'silent',
  });
  const mod = await import(pathToFileURL(out).href + '?t=' + Date.now());
  rmSync(out, { force: true });
  return mod;
}

const { calcStdPayment, buildSchedule, buildBaseSchedule } = await importTs('src/lib/mortgage.ts');

const plnFmt = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
const pln = (n) => plnFmt.format(Math.round(n)) + ' zł';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function monthsToText(m) {
  const y = Math.floor(m / 12);
  const r = m % 12;
  const yTxt = y > 0 ? `${y} ${y === 1 ? 'rok' : y < 5 ? 'lata' : 'lat'}` : '';
  const mTxt = r > 0 ? `${r} mies.` : '';
  return [yTxt, mTxt].filter(Boolean).join(' ') || '0 mies.';
}

/** Wylicza skutki stałej nadpłaty przy zachowanej racie (skrócenie okresu). */
function overpayEffect(P, annualRate, months, overpay) {
  const r = annualRate / 100 / 12;
  const rates = Array(months).fill(r);
  const std = calcStdPayment(P, r, months);
  const base = buildBaseSchedule(P, rates, months, r);
  const rows = buildSchedule(P, rates, months, 0, Array(months).fill(overpay), r, std);
  const withInterest = rows.length ? rows[rows.length - 1].cumInterest : 0;
  return {
    std,
    baseInterest: base.totalInterest,
    baseMonths: base.count,
    withInterest,
    withMonths: rows.length,
    savedInterest: base.totalInterest - withInterest,
    savedMonths: base.count - rows.length,
  };
}

// ---------------------------------------------------------------- szablon ---

const STYLE = `
:root{--bg:#fff;--bg2:#f6f8fc;--border:#e3e8f0;--accent:#2563eb;--accent-soft:#eff4ff;
--green:#047857;--red:#dc2626;--text:#0f172a;--text2:#475569;--text3:#64748b}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',system-ui,-apple-system,sans-serif;background:var(--bg);
color:var(--text);line-height:1.65;-webkit-font-smoothing:antialiased}
header{border-bottom:1px solid var(--border);background:#fff}
.bar{max-width:840px;margin:0 auto;padding:14px 20px;display:flex;justify-content:space-between;align-items:center}
.brand{font-weight:800;font-size:1rem;color:var(--text);text-decoration:none}
.bar a.cta{font-size:.85rem;color:var(--accent);text-decoration:none;font-weight:600}
main{max-width:840px;margin:0 auto;padding:40px 20px 64px}
nav.crumbs{font-size:.78rem;color:var(--text3);margin-bottom:20px}
nav.crumbs a{color:var(--text3)}
h1{font-family:'Inter',system-ui,sans-serif;font-size:clamp(1.7rem,4vw,2.4rem);
font-weight:800;letter-spacing:-.5px;line-height:1.2;margin-bottom:16px}
h2{font-family:'Inter',system-ui,sans-serif;font-size:1.22rem;font-weight:700;
margin:36px 0 12px;letter-spacing:-.2px}
p{margin-bottom:14px;color:var(--text2)}
.lead{font-size:1.05rem;color:var(--text2);margin-bottom:8px}
table{width:100%;border-collapse:collapse;font-size:.9rem;margin:18px 0;
border:1px solid var(--border);border-radius:12px;overflow:hidden}
th{background:var(--bg2);text-align:left;padding:11px 14px;font-size:.74rem;
text-transform:uppercase;letter-spacing:.7px;color:var(--text3);font-weight:700}
td{padding:11px 14px;border-top:1px solid #eef1f6}
td.num{text-align:right;font-variant-numeric:tabular-nums}
.good{color:var(--green);font-weight:600}
.bad{color:var(--red)}
.box{background:var(--accent-soft);border:1px solid #d3e0fb;border-radius:12px;
padding:16px 20px;margin:22px 0;font-size:.92rem;color:var(--text2)}
.box strong{color:var(--accent)}
.cta-box{background:var(--bg2);border:1px solid var(--border);border-radius:14px;
padding:24px;margin:32px 0;text-align:center}
.cta-box p{margin-bottom:14px}
.btn{display:inline-block;background:var(--accent);color:#fff;text-decoration:none;
padding:12px 26px;border-radius:999px;font-weight:600;font-size:.95rem}
.links{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.links a{font-size:.84rem;color:var(--text2);text-decoration:none;background:var(--bg2);
border:1px solid var(--border);border-radius:999px;padding:5px 13px}
.links a:hover{border-color:var(--accent);color:var(--accent)}
footer{border-top:1px solid var(--border);background:var(--bg2);margin-top:48px}
.foot{max-width:840px;margin:0 auto;padding:26px 20px;font-size:.8rem;color:var(--text3)}
.foot a{color:var(--text2)}
@media(max-width:600px){table{font-size:.82rem}th,td{padding:9px 10px}}
`;

function page({ slug, title, description, keywords, body, jsonLd }) {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} | Mądra Nadpłata</title>
<meta name="description" content="${esc(description)}">
<meta name="keywords" content="${esc(keywords)}">
<link rel="canonical" href="${SITE}/${slug}/">
<meta name="theme-color" content="#ffffff">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta property="og:type" content="article">
<meta property="og:url" content="${SITE}/${slug}/">
<meta property="og:locale" content="pl_PL">
<meta property="og:site_name" content="Mądra Nadpłata">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>${STYLE}</style>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body>
<header><div class="bar">
<a class="brand" href="/">💰 Mądra Nadpłata</a>
<a class="cta" href="/#calculator">Kalkulator →</a>
</div></header>
<main>
<nav class="crumbs"><a href="/">Strona główna</a> › ${esc(title)}</nav>
${body}
</main>
<footer><div class="foot">
Strona edukacyjna – nie stanowi porady finansowej. Wyniki mają charakter poglądowy.
Przed decyzją sprawdź umowę kredytową lub skonsultuj się z doradcą.<br>
<a href="/">Mądra Nadpłata</a> · <a href="/#faq">FAQ</a> · <a href="/#calculator">Kalkulator nadpłaty</a>
</div></footer>
</body>
</html>`;
}

function relatedLinks(currentSlug) {
  const items = [
    ...GUIDES.map((g) => ({ slug: g.slug, label: g.title })),
    ...[200000, 300000, 400000, 500000, 700000].map((a) => ({
      slug: amountSlug(a),
      label: `Nadpłata kredytu ${plnFmt.format(a)} zł`,
    })),
  ].filter((i) => i.slug !== currentSlug);

  return `<h2>Zobacz też</h2><div class="links">${items
    .map((i) => `<a href="/${i.slug}/">${esc(i.label)}</a>`)
    .join('')}</div>`;
}

const amountSlug = (a) => `kalkulator-nadplaty-${a}-zl`;

// ------------------------------------------------------- strony kwotowe ---

function amountPage(P) {
  const months = REF_YEARS * 12;
  const rows = OVERPAY_STEPS.map((o) => ({ o, ...overpayEffect(P, REF_RATE, months, o) }));
  const first = rows[0];
  const best = rows[rows.length - 1];
  const amountTxt = plnFmt.format(P);
  const title = `Nadpłata kredytu ${amountTxt} zł – ile zaoszczędzisz?`;
  const description = `Kredyt ${amountTxt} zł na ${REF_YEARS} lat przy ${String(REF_RATE).replace('.', ',')}%: rata ${pln(first.std)}. Sprawdź, ile odsetek oszczędza nadpłata 200–2000 zł miesięcznie.`;

  const rateRows = [4.5, 5.5, 6.5, 7.5, 8.5].map((rate) => ({
    rate,
    ...overpayEffect(P, rate, months, 500),
  }));

  const body = `
<h1>Nadpłata kredytu ${amountTxt} zł – ile realnie zaoszczędzisz?</h1>
<p class="lead">Kredyt hipoteczny na <strong>${amountTxt} zł</strong>, ${REF_YEARS} lat,
oprocentowanie ${String(REF_RATE).replace('.', ',')}% w skali roku. Rata wynosi
<strong>${pln(first.std)}</strong>, a łączne odsetki bez żadnej nadpłaty —
<strong class="bad">${pln(first.baseInterest)}</strong>. Poniżej dokładnie to,
co zmienia każda kolejna złotówka dopłacana co miesiąc.</p>

<h2>Ile daje nadpłata przy kredycie ${amountTxt} zł</h2>
<table>
<thead><tr>
<th>Nadpłata / mies.</th><th>Zaoszczędzone odsetki</th>
<th>Kredyt krótszy o</th><th>Spłacony w</th>
</tr></thead>
<tbody>
${rows.map((r) => `<tr>
<td>${pln(r.o)}</td>
<td class="num good">${pln(r.savedInterest)}</td>
<td class="num">${monthsToText(r.savedMonths)}</td>
<td class="num">${monthsToText(r.withMonths)}</td>
</tr>`).join('')}
</tbody>
</table>
<p>Wariant zakłada <strong>skrócenie okresu</strong>: rata zostaje na poziomie
${pln(first.std)}, a nadpłata idzie w całości w kapitał. Przy nadpłacie
${pln(best.o)} miesięcznie kredyt kończy się po ${monthsToText(best.withMonths)}
zamiast po ${monthsToText(best.baseMonths)}, a łączny koszt odsetek spada
z ${pln(best.baseInterest)} do ${pln(best.withInterest)}.</p>

<div class="box">Zwróć uwagę na proporcje: nadpłata ${pln(first.o)} miesięcznie
to przez cały okres kredytu ${pln(first.o * first.withMonths)} wpłacone ponad ratę,
a oszczędność wynosi <strong>${pln(first.savedInterest)}</strong>. To nie jest
przesuwanie pieniędzy w czasie — to pieniądze, które po prostu nie trafiają do banku.</div>

<h2>Jak oprocentowanie zmienia opłacalność</h2>
<p>Ta sama nadpłata ${pln(500)} miesięcznie przy kredycie ${amountTxt} zł na ${REF_YEARS} lat,
w zależności od oprocentowania:</p>
<table>
<thead><tr><th>Oprocentowanie</th><th>Rata</th><th>Odsetki bez nadpłaty</th><th>Oszczędność</th></tr></thead>
<tbody>
${rateRows.map((r) => `<tr>
<td>${String(r.rate).replace('.', ',')}%</td>
<td class="num">${pln(r.std)}</td>
<td class="num bad">${pln(r.baseInterest)}</td>
<td class="num good">${pln(r.savedInterest)}</td>
</tr>`).join('')}
</tbody>
</table>
<p>Im wyższe oprocentowanie, tym więcej zarabia każda złotówka nadpłaty —
dlatego przy kredytach ze zmienną stopą nadpłacanie w okresie wysokich stóp
ma największy sens.</p>

<div class="cta-box">
<p><strong>To są liczby dla przykładowych parametrów.</strong> Wpisz swoje saldo,
oprocentowanie i pozostałą liczbę rat, żeby zobaczyć własny harmonogram,
wykres i punkt spłaty.</p>
<a class="btn" href="/?amount=${P}&rate=${REF_RATE}&months=${months}&fee=0&strategy=fixed_overpay&overpay=500#calculator">Policz dla swojego kredytu →</a>
</div>

<h2>Jak to policzyliśmy</h2>
<p>Wyliczenia pochodzą z tego samego silnika, który napędza kalkulator na stronie
głównej: rata równa (annuitetowa), odsetki naliczane miesięcznie od bieżącego salda,
nadpłata zaliczana w całości na kapitał, bez prowizji za wcześniejszą spłatę.
Rzeczywisty harmonogram Twojego banku może różnić się o kilka–kilkanaście złotych
z powodu zaokrągleń i sposobu liczenia dni w miesiącu.</p>

${relatedLinks(amountSlug(P))}
`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Ile wynosi rata kredytu ${amountTxt} zł na ${REF_YEARS} lat?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Przy oprocentowaniu ${String(REF_RATE).replace('.', ',')}% rata wynosi około ${pln(first.std)}, a łączne odsetki w całym okresie to ${pln(first.baseInterest)}.`,
        },
      },
      {
        '@type': 'Question',
        name: `Ile zaoszczędzę nadpłacając 500 zł przy kredycie ${amountTxt} zł?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Nadpłata 500 zł miesięcznie oszczędza około ${pln(rows[1].savedInterest)} odsetek i skraca kredyt o ${monthsToText(rows[1].savedMonths)}.`,
        },
      },
    ],
  };

  return { slug: amountSlug(P), title, description, keywords: `nadpłata kredytu ${amountTxt}, kalkulator nadpłaty ${amountTxt} zł, rata kredytu ${amountTxt} zł`, body, jsonLd };
}

// --------------------------------------------------- strony poradnikowe ---

function guidePage(g) {
  const body = `
<h1>${esc(g.title)}</h1>
<p class="lead">${g.intro}</p>
${g.sections.map((s) => `<h2>${esc(s.h)}</h2>${s.p.map((x) => `<p>${x}</p>`).join('')}`).join('')}
<div class="cta-box">
<p><strong>Sprawdź to na swoich liczbach.</strong> Kalkulator pokazuje harmonogram
co do miesiąca, uwzględnia prowizję i pozwala porównać nadpłatę z inwestowaniem.</p>
<a class="btn" href="/#calculator">Otwórz kalkulator →</a>
</div>
${relatedLinks(g.slug)}
`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: g.title,
    description: g.description,
    inLanguage: 'pl',
    datePublished: TODAY,
    dateModified: TODAY,
    author: { '@type': 'Person', name: 'Bartłomiej Derda' },
    mainEntityOfPage: `${SITE}/${g.slug}/`,
  };
  return { ...g, body, jsonLd };
}

// ------------------------------------------------------------- budowanie ---

const pages = [...AMOUNTS.map(amountPage), ...GUIDES.map(guidePage)];

for (const p of pages) {
  const dir = join(DIST, p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), page(p), 'utf8');
}

const urls = [
  { loc: `${SITE}/`, priority: '1.0', freq: 'weekly' },
  ...pages.map((p) => ({ loc: `${SITE}/${p.slug}/`, priority: '0.7', freq: 'monthly' })),
];

writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`,
  'utf8',
);

console.log(`SEO: ${pages.length} podstron + sitemap z ${urls.length} adresami`);
