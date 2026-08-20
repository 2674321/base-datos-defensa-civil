# INFORME_V3_4L_CORRECCIONES.md — FIX ANIMACIÓN DE TRANSICIÓN ENTRE SECCIONES

**Versión:** 0.8.7 — V3.4L · **Fecha:** 19-08-2026 · **Deployment:** @32 (misma URL `AKfycbxVlTwraU3tClaeLakRkXW3fwmi99-9ZqRtqgvwwEOhQqha9kSTnLxyjRpqZofh6DoO`)

---

## a. CAUSA RAÍZ REAL (con evidencia, no afirmación)

### Hipótesis descartadas (con prueba)

| Hipótesis | Resultado | Evidencia |
|---|---|---|
| Falta implementación (no existe la barra) | **DESCARTADA** | El código existe desde V3.4I (`git show dcb5163` confirma `_barraCarga` + navegar()) y sigue intacto. Harness: `barra-carga` creada en `body` por `iniciar()` (`ok: barra-carga creada en body`). |
| El trigger nunca se conectó | **DESCARTADA** | `iniciar()` (13_UI_App.html:566-573) conecta cada `.nav-item[data-ruta]` a `navegar()` con `preventDefault`. Evidencia: el harness mide cambios reales de `width` de la barra tras cada click (60% → 100% → 0) en las 8 rutas probadas. |
| CSS la mantiene invisible (display:none / opacity:0 / pisada por V3.4K) | **DESCARTADA** | La barra es un div inline con `position:fixed; top:0; height:3px; z-index:10000` — por encima de header (z 100) y splash (z 810). Sin regla que la oculte. V3.4K no tocó `.barra-carga` (no existía la clase; el elemento era inline sin clase). |
| Navegación tan rápida que no alcanza a pintar un frame | **PARCIALMENTE CIERTA — era el síntoma, no la causa** | En entorno normal la secuencia dura ~320 ms (60%→100%→0) y sí pinta. Pero el bug real estaba en el ENTORNO reduce-motion (abajo). Igual se aplicó el floor mínimo como defensa (400 ms), como pedía la hipótesis 4 del prompt. |

### Causa raíz real: `prefers-reduced-motion` (reduce-motion del SO)

El mecanismo de transición **sí se disparaba y funcionaba en un entorno normal** (evidencia: caso 1 del diagnóstico). El bug aparecía cuando el sistema operativo reporta `prefers-reduced-motion: reduce` (Windows con "animaciones" desactivadas, muy común), porque DOS mecanismos mataban la transición:

1. **JS (`13_UI_App.html`, rama `reducido`)** — introducido en la MEJORA UX v0.8 y nunca revisado: `if (vieja && !reducido)` → con reduce-motion activo se llamaba `aplicar()` de inmediato: **sin fase `.saliendo` (sin fundido de página) y sin fase 60% de la barra**.
2. **CSS (`13_UI_Styles.html:1012`)** — `@media (prefers-reduced-motion: reduce) { * { transition-duration: 0.01ms !important; ... } }` → la barra (que usa `transition: width`) pasaba de 0→100%→0 **instantáneo**.

**Resultado medido con jsdom (tiempo real, `pretendToBeVisual`):**

```
== ENTORNO NORMAL ==
  click Voluntarios -> width barra = 60% | .saliendo = true   <- SÍ animaba
  +80ms  60% | +200ms 100% | +320ms 0px  (secuencia visible ~320 ms)

== PREFERS-REDUCED-MOTION ACTIVO ==
  click Inventario -> .saliendo = false                       <- salto instantáneo
  +0ms 100% | +120ms 0px   (flash de ~100 ms imperceptible)
```

Por eso persistió en V3.4H/I/J/K: cada fase "arregló por código" (V3.4I añadió la barra; V3.4J el spinner del splash; V3.4K la verificó solo leyendo el código, sin prueba visual — exactamente lo que este informe corrige), pero ninguna tocó el punto donde el entorno reduce-motion neutralizaba la implementación existente. El splash no sufría el problema porque V3.4I le puso un floor JS de 1200 ms (`SPLASH_MIN_MS`) — patrón que ahora se aplica a la barra.

---

## b. CAMBIO EXACTO APLICADO

**`13_UI_App.html`** (3 cambios, 1 foco):
1. **La barra SIEMPRE corre** — eliminada la rama `reducido` de `navegar()`: ahora `if (vieja)` siempre activa la fase 60% + `.saliendo` (150 ms) → `aplicar()`. El fundido de página y la barra son visibles en cualquier entorno.
2. **Floor mínimo de visibilidad 400 ms (patrón splash)** — nuevas variables `_barraDesde`, `_barraT`, `_barraMinMs = 400`:
   - `_barraDesde = Date.now()` al inicio de cada `navegar()` (también limpia el timer pendiente anterior para evitar resets cruzados en clics rápidos).
   - En `aplicar()`: `restante = max(100, 400 - (Date.now() - _barraDesde))` → la barra permanece al 100% hasta completar ≥400 ms desde el click, sea cual sea la velocidad real de la navegación (rápida o lenta). Consistente sin importar el backend.
3. **Clase `barra-carga` + `aria-hidden`** al elemento (antes era un div sin clase, imposible de estilizar/eximir).

**`13_UI_Styles.html`** (media query reduce-motion, final del archivo):
```css
.barra-carga { transition-duration: 200ms !important; }
.page.saliendo, .page.activa { animation-duration: 200ms !important; }
.page.activa.vista-nueva .stat-card, .page.activa.vista-nueva .tl-item, .page.activa.vista-nueva .barra-seg { animation-duration: 260ms !important; }
```
Estas excepciones garantizan que ni la barra ni el fundido de página se colapsen a 0.01 ms cuando el SO reporta reduce-motion. **Decisión documentada:** el usuario (dueño del producto) exige ver la transición; el indicador de progreso y la transición de navegación se eximen del recorte de movimiento (el resto de animaciones decorativas siguen respetando reduce-motion).

**`00_Constantes.js` + `13_UI_App.html`:** versión → `0.8.7 — V3.4L`.

---

## c. CONFIRMACIÓN SECCIÓN POR SECCIÓN (navegación real simulada con jsdom + click real sobre nav-item)

Harness `test_v34l.js` — **8 secciones × 2 entornos** (normal y reduce-motion), midiendo `width` de la barra con tiempo real:

```
== ENTORNO NORMAL ==                              == PREFERS-REDUCED-MOTION ACTIVO ==
-> voluntarios:   60% | reset t=414ms | hold 100% OK   -> voluntarios:   60% | reset t=416ms | hold 100% OK
-> servicios:     60% | reset t=421ms | hold 100% OK   -> servicios:     60% | reset t=421ms | hold 100% OK
-> asistencia:    60% | reset t=418ms | hold 100% OK   -> asistencia:    60% | reset t=430ms | hold 100% OK
-> inventario:    60% | reset t=418ms | hold 100% OK   -> inventario:    60% | reset t=400ms | hold 100% OK
-> entregas:      60% | reset t=409ms | hold 100% OK   -> entregas:      60% | reset t=423ms | hold 100% OK
-> catalogo:      60% | reset t=395ms | hold 100% OK   -> catalogo:      60% | reset t=398ms | hold 100% OK
-> historial:     60% | reset t=418ms | hold 100% OK   -> historial:     60% | reset t=414ms | hold 100% OK
-> configuracion: 60% | reset t=374ms | hold 100% OK   -> configuracion: 60% | reset t=383ms | hold 100% OK
```

Invariancias verificadas en las 16 combinaciones (8 rutas × 2 entornos):
- `width = 60%` inmediatamente tras el click (la barra arranca).
- Fase `.saliendo` presente (el fundido de página ocurre, también con reduce-motion).
- **Ningún reset prematuro**: el primer 0px ocurre entre 374–430 ms (floor 400 ms + drift de jsdom).
- Hold al 100% con muestras consecutivas antes del reset (sin parpadeo intermedio).
- Una sola `.page.activa` al final, siempre la destino (blindaje intacto).

Comportamiento equivalente garantizado en navegación rápida (secciones optimizadas V3.4K) y lenta (la barra completa su floor de 400 ms antes de devolver el control).

### Trigger confirmado (punto 2 del diagnóstico)
El click sobre `.nav-item[data-ruta]` (o accesos rápidos/⋮/campana) llama a `navegar()` directamente (13_UI_App.html:566-573); el `hashchange` (navegación por URL/atrás) también pasa por `navegar()` (línea 716-719). Ambos caminos ejecutan la misma secuencia de la barra — medido en el harness sobre el camino real (click sobre el `<a>` del sidebar).

### Regresión
- **19/19 suites verdes**: test_core, test_v2, test_v31, test_v32 (43/43), test_v33 (31/31), test_v34_estructura (28/28), test_v34b_integracion, test_v34d (47/47), test_v34e, test_v34f, test_v34g, test_seed_demo (83/83), test_ux, test_rutas, test_rutas_v2, **test_v34l (nuevo)**, audit_ui SIN FALLOS, audit_ui_v2 SIN FALLOS, check_ui TODO OK (54 OK, incluye nuevos checks de `.barra-carga` y exención CSS).
- `node --check`: backend completo + JS extraído de 13_UI_App.html → OK.
- Harnesses actualizados a 0.8.7 — V3.4L: test_v34d (A1), test_v34e (38/42), test_v34f (28/49), test_v34b (mock), check_ui (sección 6b).

### Pendiente del usuario
Verificación visual en /dev (Ctrl+Shift+R): navegar entre al menos 5 secciones (Panel de Control → Voluntarios → Especialidades → Historial → Equipamiento) en PC y en celular → debe verse la barra gradiente de 3px en la parte superior creciendo 0→60%→100%, manteniéndose ~400 ms y desvaneciéndose, y el fundido de página. **Importante:** si en tu PC Windows está desactivada la opción "animaciones" (preferencias de rendimiento), este fix es exactamente el que la vuelve visible.
