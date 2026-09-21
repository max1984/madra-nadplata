/**
 * Szablon statycznej strony SEO (HTML + inline CSS) — wydzielony z build-seo.mjs
 * jako czysty moduł bez side-effectów (ten plik nie pisze do dist/, nie bundluje
 * esbuildem), żeby dało się go zaimportować w testach bez uruchamiania całego
 * generatora podstron.
 */
import { esc } from './seo-utils.mjs';

export const SITE = 'https://nadplata.org';

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

export function page({ slug, title, description, keywords, body, jsonLd }) {
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
<meta property="og:image" content="${SITE}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/og-image.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
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
<a href="/">Mądra Nadpłata</a> · <a href="/#faq">FAQ</a> · <a href="/#calculator">Kalkulator nadpłaty</a> ·
<a href="/wynagrodzenia.html">Kalkulator wynagrodzeń</a> · <a href="/zdolnosc-kredytowa.html">Zdolność kredytowa</a>
</div></footer>
</body>
</html>`;
}
