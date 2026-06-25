// Genera el sitio "Viaje verano 2026":
//   - index.html        -> portada (Asturias + Canadá)
//   - <parte>.html      -> resumen de cada parte (content/<x>.md + data/<x>.yml)
//   - <parte>-<dia>.html-> (futuro) página por día/etapa con sus caminatas
// {{media:ID}} incrusta la ficha de un lugar. NO edites dist/: se regenera con `npm run build`.

import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import MarkdownIt from 'markdown-it';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');

const SITE = { nombre: 'Viaje verano 2026', fechas: 'Asturias + Canadá · julio–agosto 2026' };

const LEG_ASTURIAS = [
  { c: '#2e7d32', t: 'tranquilo' }, { c: '#f9a825', t: 'hay gente, llevadero' },
  { c: '#c62828', t: 'masificado' }, { c: '#1565c0', t: 'base / logística' },
];
const LEG_CANADA = [
  { c: '#1565c0', t: 'base / camping' }, { c: '#2e7d32', t: 'actividad / naturaleza' },
  { c: '#f9a825', t: 'popular' }, { c: '#c62828', t: 'muy concurrido / con reserva' },
];

// Partes del viaje. Para añadir páginas por día más adelante: rellenar `dias` con
// { slug, titulo, content } -> genera "<base>-<slug>.html" y un índice en la parte.
const PARTS = [
  {
    output: 'asturias.html', nav: 'Asturias', content: 'asturias.md', data: 'lugares-asturias.yml',
    fechas: '20–24 julio 2026', desc: 'Cangas de Onís: rutas con baño natural, playa y mapa.',
    legend: LEG_ASTURIAS, subLabel: '🏖️🥾 Planes',
    dias: [
      { slug: 'playas-asturias', titulo: '🏖️ Playas', content: 'playas-asturias.md', base: 'ast', tipos: ['base', 'playa'] },
      { slug: 'caminatas-asturias', titulo: '🥾 Caminatas', content: 'caminatas-asturias.md', base: 'ast', tipos: ['base', 'caminata'] },
    ],
  },
  {
    output: 'canada.html', nav: 'Canadá', content: 'canada.md', data: 'lugares-canada.yml',
    fechas: '26 jul – 23 ago 2026 · autocaravana', desc: 'Rockies en autocaravana: Banff, Yoho, Jasper, Lake Louise, Kootenay.',
    legend: LEG_CANADA, subLabel: '🥾 Caminatas por base',
    dias: [
      { slug: 'caminatas-banff', titulo: 'Banff', content: 'caminatas-banff.md', base: 'banff' },
      { slug: 'caminatas-yoho', titulo: 'Yoho', content: 'caminatas-yoho.md', base: 'yoho' },
      { slug: 'caminatas-jasper', titulo: 'Jasper', content: 'caminatas-jasper.md', base: 'jasper' },
      { slug: 'caminatas-icefields', titulo: 'Icefields', content: 'caminatas-icefields.md', base: 'icefields' },
      { slug: 'caminatas-lake-louise', titulo: 'Lake Louise', content: 'caminatas-lake-louise.md', base: 'lake-louise' },
      { slug: 'caminatas-kootenay', titulo: 'Kootenay', content: 'caminatas-kootenay.md', base: 'kootenay' },
      { slug: 'caminatas-kananaskis', titulo: 'Kananaskis', content: 'caminatas-kananaskis.md', base: 'kananaskis' },
    ],
  },
];

const COLORES = { '🟢': '#2e7d32', '🟡': '#f9a825', '🔴': '#c62828', '🔵': '#1565c0' };
const colorDe = (s) => COLORES[(s || '').trim()] || '#1565c0';
const mapsUrl = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const safeJson = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/<[^>]+>/g, '').replace(/[^\w\s-]/g, '').trim().toLowerCase().replace(/\s+/g, '-');

const loadData = (file) => (existsSync(join(root, 'data', file)) ? yaml.load(readFileSync(join(root, 'data', file), 'utf8')) : []) || [];
const heroDe = (lug) => lug.filter((l) => l.foto).find((l) => l.hero) || lug.find((l) => l.foto) || null;

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
  if (l.ruta) links.push(`<a href="${esc(l.ruta)}" target="_blank" rel="noopener">🥾 Ruta</a>`);
  const linksHtml = links.length ? `<div class="media-links">${links.join('<span class="sep">·</span>')}</div>` : '';
  return `<figure class="media-dia">${img}${cap}${linksHtml}</figure>`;
}

// Barra de navegación: portada + cambio entre partes.
const navHtml = (cur) =>
  `<nav class="nav-viajes"><a href="./index.html">◀ ${esc(SITE.nombre)}</a>${PARTS.map((p) =>
    `<span class="sep">·</span>${p.output === (cur && cur.output) ? `<b>${esc(p.nav)}</b>` : `<a href="./${esc(p.output)}">${esc(p.nav)}</a>`}`
  ).join('')}</nav>`;

function pageShell({ titulo, nav, hero, body, mapPoints, legend }) {
  const heroHtml = hero ? `<div class="hero-img" style="background-image:url('./assets/img/${esc(hero)}')"></div>` : '';
  const leyenda = legend ? legend.map((l) => `<span class="dot" style="background:${l.c}"></span> ${esc(l.t)}`).join('\n      ') : '';
  const mapSection = mapPoints && mapPoints.length ? `
  <section class="mapa-wrap" aria-label="Mapa">
    <h2>Mapa</h2>
    <div id="mapa"></div>
    <p class="leyenda">
      ${leyenda}
    </p>
  </section>` : '';
  const mapScript = mapPoints && mapPoints.length ? `
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<script>
const LUGARES = ${safeJson(mapPoints)};
(function () {
  if (!LUGARES.length || !window.L) return;
  const map = L.map('mapa', { scrollWheelZoom: false });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
  const grupo = [];
  for (const p of LUGARES) {
    const m = L.circleMarker([p.lat, p.lng], { radius: 8, color: '#fff', weight: 2, fillColor: p.color, fillOpacity: 0.95 }).addTo(map);
    const links = ['<a href="' + p.maps + '" target="_blank" rel="noopener">Google Maps</a>'];
    if (p.wikiloc) links.push('<a href="' + p.wikiloc + '" target="_blank" rel="noopener">Wikiloc</a>');
    if (p.ruta) links.push('<a href="' + p.ruta + '" target="_blank" rel="noopener">Ruta</a>');
    if (p.video) links.push('<a href="' + p.video + '" target="_blank" rel="noopener">Vídeo</a>');
    m.bindPopup('<b>' + p.nombre + '</b>' + (p.dia ? '<br>' + p.dia : '') + (p.tiempo ? '<br>' + p.tiempo : '') + '<br>' + links.join(' · '));
    m.bindTooltip(p.nombre);
    grupo.push([p.lat, p.lng]);
  }
  map.fitBounds(grupo, { padding: [40, 40] });
})();
</script>` : '';

  return `<!doctype html>
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
${nav || ''}
<header class="cabecera">
  ${heroHtml}
  <div class="cabecera-txt">
    <h1>${esc(titulo)}</h1>
    ${body.fechas ? `<p class="fechas">${esc(body.fechas)}</p>` : ''}
  </div>
</header>

<main>
  ${mapSection}
  <article class="contenido">
    ${body.html}
  </article>
</main>

<footer class="pie">
  <p>Documento maestro en Markdown · HTML generado automáticamente. No editar a mano.
  Fotos de Wikimedia Commons (ver crédito en cada una).</p>
</footer>
${mapScript}
</body>
</html>
`;
}

function renderMd(file, byId) {
  let src = readFileSync(join(root, 'content', file), 'utf8');
  let titulo = '';
  src = src.replace(/^﻿?#\s+(.+)\n/, (_, t) => { titulo = t.trim(); return ''; });
  src = src.replace(/\{\{\s*media:([a-z0-9_-]+)\s*\}\}/gi, (_, id) => {
    const l = byId.get(id.toLowerCase());
    if (!l) { console.warn('  ⚠ {{media:%s}} sin lugar', id); return ''; }
    return `\n\n${mediaCard(l)}\n\n`;
  });
  const html = md.render(src).replace(/<(h[23])>([\s\S]*?)<\/\1>/g, (_, t, inner) => `<${t} id="${slugify(inner)}">${inner}</${t}>`);
  return { titulo, html };
}

function mapPointsDe(lug) {
  return lug.filter((l) => typeof l.lat === 'number' && typeof l.lng === 'number').map((l) => ({
    nombre: l.nombre, dia: l.dia || '', color: colorDe(l.semaforo), lat: l.lat, lng: l.lng,
    maps: mapsUrl(l.maps_query || l.nombre), wikiloc: l.wikiloc || null, ruta: l.ruta || null, video: l.video || null,
    tiempo: l.tiempo || null,
  }));
}

function renderPart(part) {
  const lug = loadData(part.data);
  const byId = new Map(lug.map((l) => [String(l.id || '').toLowerCase(), l]));
  const { titulo, html } = renderMd(part.content, byId);
  // Índice de días (solo si la parte tiene `dias` definidos)
  const diasIndex = part.dias && part.dias.length
    ? `<p class="sub-links">${esc(part.subLabel || 'Páginas')}: ${part.dias.map((d) => `<a href="./${esc(d.slug)}.html">${esc(d.titulo)}</a>`).join(' · ')}</p>`
    : '';
  const out = pageShell({
    titulo: titulo || part.nav, nav: navHtml(part), hero: (heroDe(lug) || {}).foto,
    body: { html: diasIndex + html, fechas: part.fechas }, mapPoints: mapPointsDe(lug.filter((l) => l.tipo !== 'caminata')), legend: part.legend,
  });
  writeFileSync(join(dist, part.output), out);
  // Páginas por destino: mapa filtrado por base (camping + sus caminatas/playas)
  for (const d of part.dias || []) {
    const { titulo: dt, html: dh } = renderMd(d.content, byId);
    const dpts = d.base
      ? mapPointsDe(lug.filter((l) => l.base === d.base && (!d.tipos || d.tipos.includes(l.tipo))))
      : (d.mapAll ? mapPointsDe(lug) : null);
    const dout = pageShell({
      titulo: dt || d.titulo, nav: navHtml(part), hero: null,
      body: { html: `<p class="volver"><a href="./${esc(part.output)}">◀ ${esc(part.nav)}</a></p>` + dh, fechas: '' },
      mapPoints: dpts, legend: part.legend,
    });
    writeFileSync(join(dist, `${d.slug}.html`), dout);
  }
  return mapPointsDe(lug).length;
}

function renderLanding() {
  let intro = '';
  if (existsSync(join(root, 'content', 'landing.md'))) intro = md.render(readFileSync(join(root, 'content', 'landing.md'), 'utf8'));
  const cards = PARTS.map((p) => {
    const hero = heroDe(loadData(p.data));
    const img = hero ? `<div class="parte-img" style="background-image:url('./assets/img/${esc(hero.foto)}')"></div>` : '';
    return `<a class="parte-card" href="./${esc(p.output)}">${img}<div class="parte-txt"><h2>${esc(p.nav)}</h2><p class="fechas">${esc(p.fechas)}</p><p class="desc">${esc(p.desc)}</p></div></a>`;
  }).join('\n    ');
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(SITE.nombre)}</title>
<link rel="stylesheet" href="./assets/css/estilo.css">
</head>
<body>
<header class="cabecera">
  <div class="cabecera-txt">
    <h1>${esc(SITE.nombre)}</h1>
    <p class="fechas">${esc(SITE.fechas)}</p>
  </div>
</header>
<main class="landing">
  ${intro ? `<div class="contenido">${intro}</div>` : ''}
  <div class="partes">
    ${cards}
  </div>
</main>
<footer class="pie"><p>Documento maestro en Markdown · HTML generado automáticamente.</p></footer>
</body>
</html>
`;
  writeFileSync(join(dist, 'index.html'), html);
}

// --- generar dist/ ---
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
writeFileSync(join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
writeFileSync(join(dist, '.nojekyll'), '');
cpSync(join(root, 'assets'), join(dist, 'assets'), { recursive: true });

renderLanding();
console.log('OK · index.html (portada)');
for (const part of PARTS) {
  if (!existsSync(join(root, 'content', part.content))) { console.warn('(salto %s)', part.output); continue; }
  const n = renderPart(part);
  console.log(`OK · ${part.output} · ${n} puntos${part.dias.length ? ` · ${part.dias.length} días` : ''}`);
}
