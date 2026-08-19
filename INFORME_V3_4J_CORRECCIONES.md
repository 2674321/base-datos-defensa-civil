# INFORME V3.4J — CORRECCIONES UI/UX (spinner, responsividad, interactividad)

**Versión:** 0.8.5 — V3.4J
**Deployment:** @30 (`AKfycbxVlTwraU3tClaeLakRkXW3fwmi99-9ZqRtqgvwwEOhQqha9kSTnLxyjRpqZofh6DoO` — misma URL de siempre, actualizado con `clasp deploy`)
**Fecha:** ago 2026
**Base:** V3.4I (deploy @29, 0.8.4)

---

## 1. Bug crítico: spinner de "círculos apilados en vertical" en PC

### 1.1 Causa raíz (diagnóstico obligatorio, verificado contra código local y remoto)

Se descartaron las hipótesis de un markup de "puntos" (dots) en alguna página: se auditaron los 25 archivos HTML del proyecto y **no existe ningún indicador de puntos**; además se descargó el proyecto remoto con `clasp pull` a un directorio temporal y el CSS desplegado es idéntico al local.

La causa raíz está en `13_UI_Styles.html:567` (regla `.spinner`):

```css
/* ANTES (V3.4I) */
.spinner { width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid var(--dc-gris-200); border-top-color: var(--primario); animation: girar 0.8s linear infinite; }
```

La regla **no declaraba `display`**. Consecuencia por especificación CSS (elementos inline no reemplazados): `width` y `height` **se ignoran**. El `13_UI_Index.html:27` usa el spinner como `<span>`:

```html
<div class="splash-carga"><span class="spinner" aria-hidden="true"></span><span>Cargando sistema…</span></div>
```

Al ser inline, el `<span>` colapsa a una caja de ~5 px de ancho (solo bordes) × alto de línea, y con `border-radius: 50%` + borde bicolor (gris translúcido en lados, blanco arriba — override `.splash-carga .spinner`) se dibuja como una **píldora vertical de dos segmentos** que en escritorio se percibe como "círculos apilados". En celular la percepción difiere porque el splash ocupa todo el viewport y la píldora queda centrada junto al texto "Cargando sistema…" (menos notoria), pero el defecto de render es el mismo en ambos.

Por qué no se veía en el resto de la app: `App.cargando()` (`13_UI_App.html:211`) usa `<div class="spinner">` (block → el tamaño sí aplica) y los botones usan `.spinner-mini` que **sí** declara `display: inline-block`. Solo el splash (span) reproducía el colapso.

### 1.2 Solución: componente de carga robusto e institucional

Se eligió la opción **(a) un solo círculo giratorio con borde de color institucional** (de las tres ofrecidas: a. círculo simple, b. barra indeterminada, c. skeleton):

- **Robustez:** un solo elemento con `display: inline-block` es independiente del layout del contenedor (flex row/column, inline, grid) — el fallo de la píldora queda estructuralmente imposible. La barra indeterminada (b) ya existe como barra de carga superior de navegación (V3.4I), duplicarla sería confuso; los skeletons (c) ya cubren las zonas de datos.
- **Consistencia:** se mantiene el MISMO componente en splash, `App.cargando()`, comprobante de entregas (`17_UI_Entregas.html:341/658`) y `.spinner-mini` en botones (`botonEstado`).

```css
/* DESPUÉS (V3.4J) */
.spinner {
  display: inline-block;
  width: 20px; height: 20px; flex-shrink: 0; vertical-align: -4px;
  border-radius: 50%;
  border: 3px solid var(--dc-gris-200);
  border-top-color: var(--primario);
  animation: girar 0.8s linear infinite;
}
```

Colores 100 % institucionales (tokens existentes `--dc-gris-200` / `--primario`, sin colores nuevos); `prefers-reduced-motion` sigue desactivando la rotación (sección 27 intacta).

**Archivos con el componente:** `13_UI_Styles.html` (regla corregida), `13_UI_Index.html` (span del splash — sin cambio de markup, el fix de CSS lo resuelve), `13_UI_App.html` (`cargando()` — sin cambio de markup; se agregó `role="status"` para accesibilidad), `17_UI_Entregas.html` (comprobante — markup ya correcto con div).

### 1.3 Evidencia de verificación

- Descripción exacta del estado anterior (código): regla `.spinner` sin `display` → span inline colapsado (píldora vertical ~5×18 px, borde 2.5 px bicolor).
- Descripción exacta del estado posterior (código): `display: inline-block` → anillo único de 20 px, borde 3 px, arco azul institucional girando (0.8 s linear), `flex-shrink:0` y `vertical-align` para convivencia con texto en línea.
- **Pendiente de verificación visual del usuario** en /dev (PC): recarga forzada (Ctrl+Shift+R) → el splash debe mostrar UN círculo girando (no píldora ni círculos apilados) y el indicador de "Cargando ficha…" idéntico. En celular no debe cambiar nada perceptible.

---

## 2. Mejoras UI/UX

### 2.1 Responsividad y scroll horizontal controlado (punto 2, commit `c914b78`)

| Archivo | Cambio |
|---|---|
| `13_UI_Styles.html` `.tabla-wrap` | `-webkit-overflow-scrolling: touch`, `overscroll-behavior-x: contain`, `scrollbar-width: thin` + `scrollbar-color` gris institucional → scrollbar visible y delgada en desktop (affordance de scroll en tablas anchas: Especialidades, Credenciales, Licencias, Unidades, etc. — todas usan `.tabla-wrap`) |
| `13_UI_Styles.html` `.tabs` | scroll horizontal sin scrollbar visible (patrón Material), touch scrolling — pestañas de Ficha/Especialidades/Módulos en viewports intermedios |
| `13_UI_Styles.html` `.stepper` | idem (asistente de Entregas en 375–768 px) |

Los breakpoints existentes (480/768/1024/1280) y el modo tarjetas de tablas (≤768) quedaron intactos; el scrollbar fino cubre el rango 769–1280 (tablets landscape / laptops) donde las tablas se mantienen en modo fila.

### 2.2 Interactividad y feedback inmediato (punto 3, commit `530e9c2`)

| Archivo | Cambio |
|---|---|
| `13_UI_Styles.html` | `:focus-visible` (solo teclado, nunca clic) con anillo 2px `--primario` para `.btn`, `.btn-icono`, `.tab`, `.nav-item`, `.menu-item`, `.card-interactiva`, `.ordenable`, `.select`, `.step` — navegación accesible por Tab |
| `13_UI_Styles.html` | presión táctil `.nav-item:active` (fondo blanco 14 %) |
| `20_UI_Catalogo.html` | `guardar()` → `App.botonEstado(guardarBtn, 'procesando', 'Guardando…')` + restauración en catch |
| `21_UI_Personas.html` | 2 botones (alta, dar de baja/reactivar) con `botonEstado` |
| `22_UI_GradosCargos.html` | 5 botones (asignar grado, cargo, área, cerrar cargo, asignar cargo) con `botonEstado` |
| `23_UI_Especialidades.html` | 3 botones (especialidad, subespecialidad, asignación) con `botonEstado` |
| `24_UI_Credenciales.html` | 2 botones (catálogo, asignación) con `botonEstado` |
| `25_UI_Capacitaciones.html` | 2 botones (catálogo, asignación) con `botonEstado` |
| `26_UI_Unidades.html` | 2 botones (unidad, integrante) con `botonEstado` |
| `28_UI_Usuarios.html` | 2 botones (usuario, permiso) con `botonEstado` |

Total: **19 botones** de páginas CRUD que quedaban "mudos" (solo `disabled`) mientras el backend procesaba, ahora con spinner-mini + deshabilitado + restauración en error. (14/15/16/17/19 ya lo usaban desde V3.4E.)

**Cierre de modales:** verificado que el patrón `data-cerrar-form` (delegación global de `App.modal`) sigue operativo — cubre Biblioteca, Ficha y todos los formularios; no se tocó.

### 2.3 Versión y despliegue

- `13_UI_App.html` `PROYECTO_VERSION` y `00_Constantes.js` `PROYECTO.version` → **'0.8.5 — V3.4J'** (backend y frontend unificados, `ecf32c1`).
- `clasp push` (50 archivos) + `clasp deploy` → **@30**.

---

## 3. Bug latente corregido durante la regresión (commit `49ab644`)

`crearEstructuraV2()` (`21_MigracionV2.js:339`) seguía llamando `_migrarV34D(ss)`, función eliminada en el reordenamiento V3.4H (quedó comentada en `38_Migraciones.js`). Cualquier ejecución de `crearEstructuraV2()` (entorno nuevo / reestructuración) lanzaba `ReferenceError` al final de la creación, dejando la estructura parcialmente creada (lock liberado en `finally`). Fix: se devuelve el resultado vacío `{creados:[], omitidos:[], detalles:[]}` conservando el contrato del log y del retorno (`migracionesV34D`), ya que la migración V3.4D fue ejecutada en producción.

---

## 4. Pruebas (todas locales; el usuario verifica visualmente en /dev)

- `node --check`: backend (18 .js) y frontend (HTML con `<script>` extraído) — TODO OK (Index/Styles se validan por estructura, no por node).
- **Regresión completa — 15 suites verdes, 0 fallos:**
  - `test_core` TODAS PASARON · `test_v2` 39/39 · `test_v31` 14/14 · `test_v32` OK · `test_v33` 31/31 · `test_v34_estructura` 28/28 · `test_v34b_integracion` OK · `test_v34d` 47/47 · `test_v34e` DOM TODO OK · `test_v34f` 32/32 + DOM OK · `test_v34g` 35/35 + DOM TODO OK · `test_seed_demo` 83/83 · `test_ux` 57 checks OK · `test_rutas` 17 rutas OK · `test_rutas_v2` 18 rutas OK · `audit_ui`/`audit_ui_v2` SIN FALLOS.
  - Los harnesses que quedaron rotos por el reordenamiento V3.4H (referencias a `37/38/39/40_MigracionesV34*.js`) y por las expectativas V3.4G (versión 0.8.3, 9 especialidades, seed de credenciales viejo) fueron reparados: los bloques de migración histórica se reemplazaron por asserts del estado del consolidado (patrón de `test_v34g`), y las expectativas se alinearon al comportamiento documentado V3.4H/V3.4I/V3.4J verificado contra el código fuente.
- **Viewports (375/768/1440 px):** sin overflow roto — tablas en modo tarjetas ≤768 con `data-label`; tablas anchas 769+ con scroll horizontal controlado (scrollbar delgada visible); tabs/stepper con scroll sin barra; toast 360 px ya cabe en 375 px (fix existente ≤480) — sin regresiones en la regresión DOM (test_ux 57 checks incluye navegación en viewport angosto).

---

## 5. Hallazgos (no corregidos — propuestas para fase futura)

1. **META `d-2` Jefe de Sede (`13_UI_Parches.html`)**: V3.4H convirtió "Jefe de sede" en grado real (`GRADOS_V2` = 7, orden 2), pero la META frontend aún lo presenta como distintivo de origen CARGO (6 grados). No es regresión de V3.4J ni de V3.4I; requiere decisión del usuario sobre cómo debe mostrarse (grado vs. distintivo) antes de tocar la META o la biblioteca — fuera del alcance de esta fase.
2. **`21_UI_Personas.html` huérfana**: sigue sin include en Index ni nav-item (desde V3.4H). Pendiente de decisión: integrarla a la navegación o retirarla.
3. **`.gitignore` local**: existe un cambio no commiteado (ignora `.clasp.json`, node, OS junk) ajeno a V3.4J — se dejó fuera de los commits de esta fase; recomendado committearlo aparte.

---

## 6. Pendiente del usuario (verificación visual en /dev — recarga forzada)

1. **PC/desktop:** splash inicial → UN círculo girando azul (no píldora ni círculos apilados); "Cargando ficha de …" idéntico; barra de carga superior 3px al navegar (sin cambios).
2. **PC/desktop:** tablas anchas (Especialidades, Credenciales, Licencias) con scroll horizontal y scrollbar delgada; tabs de la Ficha desplazables sin barra.
3. **Teclado:** Tab por botones/tabs/nav → anillo azul de foco visible; Enter/Esc en modales OK.
4. **Botones CRUD** (Catálogo, Personas, Grados, Especialidades, Credenciales, Capacitaciones, Unidades, Usuarios): al guardar → spinner-mini + deshabilitado; error → restauración.
5. **Celular (375 px):** splash OK, tablas en tarjetas, stepper de Entregas sin scrollbar.
6. `?new=1` si persisten restos de caché.

---

## 7. Commits de la fase

| Commit | Contenido |
|---|---|
| `b2b2b3e` | (a) fix spinner de círculos apilados + componente robusto institucional |
| `c914b78` | (b) responsividad: scroll horizontal controlado (tabla-wrap/tabs/stepper) |
| `530e9c2` | (c) interactividad: focus-visible, presión nav, 19 botones CRUD con feedback |
| `49ab644` | (d) fix regresión: `crearEstructuraV2` referenciaba `_migrarV34D` eliminado |
| `ecf32c1` | bump versión 0.8.5 (backend + frontend) |
| *(siguiente)* | informe + AGENTS.md §0/§12 |