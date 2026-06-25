# AGENTS.md — cómo trabajar en este repo

Sitio **"Viaje verano 2026"**: una **portada** (`index.html`) con dos **partes** —Asturias
y Canadá—, cada una con su itinerario, mapa y caminatas. **Patrón docs-as-code: se edita la
fuente (MD + YAML) y se regenera el HTML.** No es una app.

## Estructura

- **Portada** → `index.html` (`content/landing.md` + tarjetas de cada parte). Sin mapa.
- **Partes** (array `PARTS` en `scripts/build.mjs`):
  - **Asturias** → `asturias.html` (`content/asturias.md` + `data/lugares-asturias.yml`)
  - **Canadá** → `canada.html` (`content/canada.md` + `data/lugares-canada.yml`)
- Cada parte tiene mapa, leyenda y resumen. Navegación: portada ↔ partes.

**Páginas por destino:** cada parte tiene un array `dias` en `PARTS`; cada entrada genera
`<slug>.html`. Canadá tiene **una página de caminatas por base**, p. ej.
`{ slug:'caminatas-banff', titulo:'Banff', content:'caminatas-banff.md' }` → `caminatas-banff.html`,
enlazada desde el resumen de la parte ("🥾 Caminatas por base") y desde cada etapa del
itinerario (`content/canada.md`). Opcional `mapAll:true` para incluir el mapa de la parte;
reutiliza el YAML de la parte para `{{media:id}}`. Los títulos `##` llevan id automático (anclas).

Para añadir una parte nueva: crea el `.md` y el `.yml` y añade una entrada a `PARTS`.

## Fuentes de verdad (lo que SÍ se edita)

| Archivo | Qué contiene | Cuándo tocarlo |
|---|---|---|
| `content/*.md` | **Texto maestro** de cada viaje | Cambios de texto (el 90% de las veces) |
| `data/*.yml` | Datos de **mapa, fotos y vídeos** por lugar | Añadir/mover un pin, foto o vídeo |
| `assets/img/` | Imágenes (deben ser de **licencia libre**) | Añadir fotos |
| `assets/css/estilo.css` | Estilos (común a todas las páginas) | Cambios de aspecto |
| `content/landing.md` | Intro de la **portada** | Cambiar el texto de inicio |
| `scripts/build.mjs` (`PARTS`) | Registro de partes y días | Añadir/quitar una parte o un día |

## Generado (lo que NO se edita a mano)

- `dist/` lo crea `npm run build`. **Nunca edites `dist/` directamente**: se borra
  y se regenera en cada build. Está en `.gitignore`; lo publica el workflow de CI.

## Flujo

```bash
npm install        # una vez
npm run build      # genera dist/index.html
npm run serve      # build + previsualiza en http://localhost:8080
```

Publicar: `git push` a `main` → GitHub Actions (`.github/workflows/deploy.yml`)
construye y despliega en GitHub Pages.

## Reglas

1. **El MD manda.** Si cambias el plan, cámbialo en el MD; luego `npm run build`.
2. **Fotos solo de licencia libre** (Wikimedia Commons, dominio público…) con su
   crédito en `data/lugares-*.yml` (`credito`, `credito_url`, `licencia`). Es un sitio
   público: no subas imágenes con copyright.
3. **Privacidad:** el sitio lleva `noindex` + `robots.txt` Disallow (no debe salir
   en buscadores). Mantenlo así salvo que el dueño pida lo contrario.
4. **Mapa:** Leaflet + OpenStreetMap (sin API key). Cada lugar necesita `lat`/`lng`
   para salir en el mapa; el enlace "Abrir en Google Maps" usa `maps_query`.
5. **Datos sensibles:** contrasta antes de publicar (mareas, accesos, distancias).
   Errores ya corregidos: La Pesanca está en Piloña (no Cangas); Colunga→aeropuerto
   son ~79 km (no 107).

## Fotos y vídeos junto a los días

La foto de un lugar aparece **junto a su día** poniendo `{{media:ID}}` en el MD
(donde `ID` es el campo `id` del lugar en `lugares.yml`). El build lo convierte en
una ficha flotante con foto + crédito + enlaces (▶︎ Vídeo · 🗺️ Mapa · 🥾 Wikiloc).
Pon `{{media:ID}}` en su propia línea, con una línea en blanco antes y después.

## Estructura de un lugar (`data/lugares-*.yml`)

```yaml
- id: olla                                  # se usa en el MD como {{media:olla}}
  nombre: Olla de San Vicente
  dia: "Jue 23"
  semaforo: "🔴"            # 🟢 tranquilo · 🟡 llevadero · 🔴 masificado
  maps_query: "Aparcamiento Olla de San Vicente"
  lat: 43.30613
  lng: -5.12837
  wikiloc: "https://www.wikiloc.com/..."   # opcional
  video: "https://www.youtube.com/watch?v=..."  # opcional (enlace, no embebido)
  foto: olla.jpg                            # opcional, en assets/img/
  credito: "Autor"                          # si hay foto
  credito_url: "https://commons.wikimedia.org/..."
  licencia: "CC BY-SA 4.0"
  hero: true                                # opcional: foto de cabecera
```
