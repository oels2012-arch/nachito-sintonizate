# Sintonízate. Te toca. · Nachito × Radio ITESO

Web de scrollytelling para el proyecto del Módulo 05 de *Taller de Tecnologías Emergentes* (EAM3632I, ITESO): **Proyecto colaborativo de Realidad Aumentada para negocios digitales**.

**Web:** https://oels2012-arch.github.io/nachito-sintonizate/

## La idea
Nachito, la mascota del ITESO, aparece en realidad aumentada con la playera de **Radio ITESO 95.1**. Primero **escucha** (mano en la oreja), luego **baila** el pase de Jamal y al final dice **te toca**: señala a la cámara y te deja continuar el baile. El trend se comparte, Nachito se vuelve el meme y "Radio ITESO" se queda en la cabeza de quien lo ve, que así descubre el podcast.

## Equipo
| Nombre | Rol |
|---|---|
| Eddy | PM |
| Leo | UX/UI |
| Diego | AR Developer (filtro en Lens Studio) |

## Estructura
```
web/                 Vite + JS vanilla + GSAP ScrollTrigger + Lenis
  index.html         14 capítulos + créditos
  src/main.js        componentes (ProgressEQ, ChapterIndex, HeadlineReveal, StatCounter, PinnedVideo, CycleDiagram…)
  src/style.css      tokens (semáforo --signal-red/amber/green), layout y movimiento
  public/assets/     imágenes y videos optimizados
docs/                guion, brief, datos con fuentes, log de generaciones IA, pitch
assets-src/          originales de Higgsfield + scripts de encode/montaje
insumos/             lámina de Nachito y fotos del campus (ver CREDITOS.md); las referencias de personas y el video del pase no se suben
```

## Correr en local
```bash
cd web
npm install
npm run dev      # http://localhost:5173/nachito-sintonizate/
npm run build    # genera web/dist
```
En modo presentación: ↓ / ↑ / espacio saltan de capítulo en capítulo.

## Despliegue
Cada push a `main` construye y publica en GitHub Pages con `.github/workflows/deploy.yml`.

---
Proyecto académico. **No es oficial del ITESO ni de Radio ITESO.** Las escenas se generaron con IA (Higgsfield). Las fuentes de los datos están en `docs/datos.md` y los créditos de las imágenes en `CREDITOS.md`.
