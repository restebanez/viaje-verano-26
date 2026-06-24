// Genera el sitio (multi-página) a partir de:
//   - content/<pagina>.md   (texto maestro)
//   - data/<datos>.yml      (mapa + fotos + vídeos)
// En el MD, {{media:ID}} incrusta la ficha (foto + crédito + enlaces) de ese lugar.
// NO edites dist/ a mano: se regenera con `npm run build`.

import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import MarkdownIt from 'markdown-it';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');

// Leyendas (color -> etiqueta) por tipo de viaje
const LEG_ASTURIAS = [
  { c: '#2e7d32', t: 'tranquilo' }, { c: '#f9a825', t: 'hay gente, llevadero' },
  { c: '#c62828', t: 'masificado' }, { c: '#1565c0', t: 'base / logística' },
];
const LEG_CANADA = [
  { c: '#1565c0', t: 'base / camping' }, { c: '#2e7d32', t: 'actividad / naturaleza' },
  { c: '#f9a825', t: 'popular' }, { c: '#c62828', t: 'muy concurrido / con reserva' },
];

// Páginas del sitio. El título sale del primer H1 de cada MD.
const PAGES = [
  { output: 'index.html', nav: 'Asturias', content: 'itinerario-cangas-de-onis.md', data: 'lugares.yml', fechas: '20–24 julio 2026', legend: LEG_ASTURIAS },
  { output: 'canada.html', nav: 'Canadá', content: 'canada.md', data: 'lugares-canada.yml', fechas: '26 jul – 23 ago 2026 · autocaravana', legend: LEG_CANADA },
];

const COLORES = { '🟢': '#2e7d32', '🟡': '#f9a825', '🔴': '#c62828', '🔵': '#1565c0' };
const colorDe = (s) => COLORES[(s || '').trim()] || '#1565c0';
const mapsUrl = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const safeJson = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

const creditoFoto = (l) =>
  l.credito
    ? `<span class="credito">Foto: ${l.credito_url ? `<a href="${esc(l.credito_url)}" target="_blank" rel="noopener">${esc(l.credito)}</a>` : esc(l.credito)}${l.licencia ? ` · ${esc(l.licencia)}` : ''} (Wikimedia Commons)</span>`
    : '';

function mediaCard(l) {
  if (!l) return '';
  const img = l.foto ? `<img src="./assets/img/${esc(l.foto)}" alt="${esc(l.nombre)}" loading="lazy">` : '';
  const cap = `<figcaption><strong>${esc(l.nombre)}</strong>${l.dia ? ` · ${esc(l.dia)}` : ''}${creditoFoto(l) ? `<br>${creditoFoto(l)}` : ''}</figcaption>`;
  const links = [];
  if (l.video) links.push(`<a href="${esc(l.video)}" target="_blank" rel="noopener">▶︎ Vídeo</a>`);
  if (l.maps_query) links.push(`<a href="${mapsUrl(l.maps_query)}" target="_blank" rel="noopener">🗺️ Mapa</a>`);
  if (l.wikiloc) links.push(`<a href="${esc(l.wikiloc)}" target="_blank" rel="noopener">🥾 Wikiloc</a>`);
  const linksHtml = links.length ? `<div class="media-links">${links.join('<span class="sep">·</span>')}</div>` : '';
  return `<figure class="media-dia">${img}${cap}${linksHtml}</figure>`;
}

const navHtml = (current) =>
  `<nav class="nav-viajes"><span>Viajes:</span> ${PAGES.map((p) =>
    p.output === current.output ? `<b>${esc(p.nav)}</b>` : `<a href="./${esc(p.output)}">${esc(p.nav)}</a>`
  ).join('<span class="sep">·</span>')}</nav>`;

function renderPage(page) {
  const lugares = (existsSync(join(root, 'data', page.data)) ? yaml.load(readFileSync(join(root, 'data', page.data), 'utf8')) : []) || [];
  const byId = new Map(lugares.map((l) => [String(l.id || '').toLowerCase(), l]));

  let mdSrc = readFileSync(join(root, 'content', page.content), 'utf8');
  let titulo = page.nav;
  mdSrc = mdSrc.replace(/^﻿?#\s+(.+)\n/, (_, t) => { titulo = t.trim(); return ''; });
  mdSrc = mdSrc.replace(/\{\{\s*media:([a-z0-9_-]+)\s*\}\}/gi, (_, id) => {
    const l = byId.get(id.toLowerCase());
    if (!l) { console.warn('  ⚠ {{media:%s}} sin lugar en %s', id, page.data); return ''; }
    return mediaCard(l);
  });
  const bodyHtml = md.render(mdSrc);

  const puntos = lugares
    .filter((l) => typeof l.lat === 'number' && typeof l.lng === 'number')
    .map((l) => ({ nombre: l.nombre, dia: l.dia || '', color: colorDe(l.semaforo), lat: l.lat, lng: l.lng, maps: mapsUrl(l.maps_query || l.nombre), wikiloc: l.wikiloc || null, video: l.video || null }));

  const hero = lugares.filter((l) => l.foto).find((l) => l.hero) || lugares.find((l) => l.foto) || null;
  const heroHtml = hero ? `<div class="hero-img" style="background-image:url('./assets/img/${esc(hero.foto)}')"></div>` : '';
  const leyenda = page.legend.map((l) => `<span class="dot" style="background:${l.c}"></span> ${esc(l.t)}`).join('\n      ');

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(titulo)}</title>
<link rel="preconnect" href="https://unpkg.com">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
<link rel="stylesheet" href="./assets/css/estilo.css">
</head>
<body>
${navHtml(page)}
<header class="cabecera">
  ${heroHtml}
  <div class="cabecera-txt">
    <h1>${esc(titulo)}</h1>
    <p class="fechas">${esc(page.fechas)}</p>
  </div>
</header>

<main>
  <section class="mapa-wrap" aria-label="Mapa de los lugares">
    <h2>Mapa</h2>
    <div id="mapa"></div>
    <p class="leyenda">
      ${leyenda}
    </p>
  </section>

  <article class="contenido">
    ${bodyHtml}
  </article>
</main>

<footer class="pie">
  <p>Documento maestro en Markdown · HTML generado automáticamente. No editar a mano.
  Fotos de Wikimedia Commons (ver crédito en cada una).</p>
</footer>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<script>
const LUGARES = ${safeJson(puntos)};
(function () {
  if (!LUGARES.length || !window.L) return;
  const map = L.map('mapa', { scrollWheelZoom: false });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
  const grupo = [];
  for (const p of LUGARES) {
    const m = L.circleMarker([p.lat, p.lng], { radius: 8, color: '#fff', weight: 2, fillColor: p.color, fillOpacity: 0.95 }).addTo(map);
    const links = ['<a href="' + p.maps + '" target="_blank" rel="noopener">Google Maps</a>'];
    if (p.wikiloc) links.push('<a href="' + p.wikiloc + '" target="_blank" rel="noopener">Wikiloc</a>');
    if (p.video) links.push('<a href="' + p.video + '" target="_blank" rel="noopener">Vídeo</a>');
    m.bindPopup('<b>' + p.nombre + '</b>' + (p.dia ? '<br>' + p.dia : '') + '<br>' + links.join(' · '));
    m.bindTooltip(p.nombre);
    grupo.push([p.lat, p.lng]);
  }
  map.fitBounds(grupo, { padding: [40, 40] });
})();
</script>
</body>
</html>
`;
  writeFileSync(join(dist, page.output), html);
  return puntos.length;
}

// --- generar dist/ ---
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
writeFileSync(join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
writeFileSync(join(dist, '.nojekyll'), '');
cpSync(join(root, 'assets'), join(dist, 'assets'), { recursive: true });

for (const page of PAGES) {
  if (!existsSync(join(root, 'content', page.content))) { console.warn('(salto %s: no existe %s)', page.output, page.content); continue; }
  const n = renderPage(page);
  console.log(`OK · ${page.output} · ${n} puntos`);
}
