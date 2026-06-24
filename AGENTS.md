# AGENTS.md — cómo trabajar en este repo

Sitio de un itinerario de viaje. **Patrón docs-as-code: se edita la fuente y se
regenera el HTML.** No es una app; es un documento con mapa y fotos.

## Fuentes de verdad (lo que SÍ se edita)

| Archivo | Qué contiene | Cuándo tocarlo |
|---|---|---|
| `content/itinerario-cangas-de-onis.md` | **Texto maestro** del itinerario | Cambios de texto (el 90% de las veces) |
| `data/lugares.yml` | Datos de **mapa y fotos** por lugar | Añadir/mover un pin o una foto |
| `assets/img/` | Imágenes (deben ser de **licencia libre**) | Añadir fotos |
| `assets/css/estilo.css` | Estilos | Cambios de aspecto |

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
   crédito en `data/lugares.yml` (`credito`, `credito_url`, `licencia`). Es un sitio
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

## Estructura de un lugar (`data/lugares.yml`)

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
