/**
 * Wydzielone z build-seo.mjs, żeby dało się to przetestować bez odpalania
 * całego generatora (build-seo.mjs ma efekty uboczne na poziomie modułu —
 * generuje pliki od razu po zaimportowaniu).
 */

/**
 * esc() jest używane też wewnątrz atrybutów HTML w cudzysłowie
 * (np. `content="${esc(description)}"`), więc musi escapować sam znak `"`,
 * nie tylko &/</> — bez tego literalny cudzysłów w tytule/opisie/keywordach
 * zamykałby atrybut przedwcześnie i wstrzykiwał dowolny HTML do <head>.
 * Obecna treść w seo-content.mjs używa polskich cudzysłowów typograficznych
 * („..."), nie ASCII ", więc dziś nic tego nie ujawnia — ale to szczęście,
 * nie gwarancja, a funkcja o nazwie "escape" ma escapować wszystko, co może
 * złamać kontekst, w którym jest używana.
 */
export const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
