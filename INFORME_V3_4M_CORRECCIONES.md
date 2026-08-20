# INFORME_V3_4M_CORRECCIONES.md — FIX QUIRÚRGICO: SKELETON ROTO, SPINNER DESCENTRADO Y NIVEL FALTANTE EN RADIOAFICIONADO

**Versión:** 0.8.8 — V3.4M · **Fecha:** 20-08-2026 · **Deployment:** @33 (misma URL `AKfycbxVlTwraU3tClaeLakRkXW3fwmi99-9ZqRtqgvwwEOhQqha9kSTnLxyjRpqZofh6DoO`)

---

## a. LOS TRES FIXES APLICADOS (diff exacto)

Esta fase NO requirió diagnóstico exploratorio: las causas raíz fueron identificadas leyendo el código real. Confirmado como correcto y NO tocado: `.spinner` (13_UI_Styles.html:616-623), `.barra-carga` + `navegar()` (13_UI_App.html:432-502, V3.4L), `skeletonTarjetas()` (13_UI_App.html:236-252, ya tiene altos inline), y 00_Constantes.js (fuente de verdad correcta — solo se sincronizó la UI con ella).

### Fix 1 — `.skeleton` sin alto → barras colapsadas a 0px (solo se veía el círculo)

**Causa raíz:** `skeleton()` (13_UI_App.html:230) genera por fila un círculo (`width:34px;height:34px`, alto inline) + una barra `flex:1` + una barra `width:80px`, **ninguna de las dos últimas con alto definido** (ni inline ni clase). Como `.skeleton-fila` (13_UI_Styles.html:635) usa `align-items:center` (no `stretch`), ambas barras colapsan a **0px de alto** y desaparecen → N círculos sueltos apilados (el bug reportado).

**Fix aplicado** en `13_UI_Styles.html`, clase `.skeleton`:

```css
  ANTES:
  .skeleton {
    background: linear-gradient(90deg, var(--dc-gris-100) 25%, var(--dc-gris-50) 50%, var(--dc-gris-100) 75%);
    background-size: 200% 100%; border-radius: var(--radio-sm);
    animation: brillo 1.4s ease infinite;
  }

  DESPUÉS:
  .skeleton {
    background: linear-gradient(90deg, var(--dc-gris-100) 25%, var(--dc-gris-50) 50%, var(--dc-gris-100) 75%);
    background-size: 200% 100%; border-radius: var(--radio-sm);
    animation: brillo 1.4s ease infinite;
    height: 14px;
  }
```

`14px` = altura de línea de texto base (`--t-body:14px`) → la barra queda del alto de una línea de texto real, consistente con el sistema tipográfico. Los altos inline explícitos (círculo 34px, `skeletonTarjetas()` 42/16/10/22px) **ganan por precedencia de estilo inline** → sin regresión en Dashboard ni en los avatares.

### Fix 2 — `.cargando` pegado arriba (sin centrado vertical)

**Causa raíz:** `.cargando` (13_UI_Styles.html:611) centra su contenido horizontalmente (`justify-content:center`) pero su propio alto es solo el contenido natural (~20px + padding); `.content`/`.page` (13_UI_Styles.html:150-152) no aplican centrado vertical. Al montar una página vacía, el bloque queda pegado arriba, chico y apenas visible bajo la topbar.

**Fix aplicado** en `13_UI_Styles.html`, clase `.cargando`:

```css
  ANTES:
  .cargando { display: flex; align-items: center; gap: var(--esp-3); padding: var(--esp-5); color: var(--texto-2); font-size: var(--t-small); justify-content: center; }

  DESPUÉS:
  .cargando { display: flex; align-items: center; gap: var(--esp-3); padding: var(--esp-5); color: var(--texto-2); font-size: var(--t-small); justify-content: center; min-height: 200px; }
```

`200px` es suficiente para que anillo+texto se vean centrados sin resultar exagerados en los contenedores reales (auditoría abajo: todos son de página o panel de contenido, ninguno chico).

### Fix 3 — Nivel "Superior" de Radioaficionado faltante en la META

**Causa raíz:** 00_Constantes.js define Radioaficionado con **4 niveles** (`Aspirante; Novicio; General; Superior`, V3.4H) pero la META de 13_UI_Parches.html (entrada s-1) tenía **3** (faltaba Superior). Confirmado por el usuario: "Superior" es un nivel real y válido.

**Fix aplicado** en `13_UI_Parches.html` (entrada s-1, campo 13 `niveles`):

```js
  ANTES:  ..., true, 'Aspirante; Novicio; General'],
  DESPUÉS: ..., true, 'Aspirante; Novicio; General; Superior'],
```

**Tercera copia encontrada y corregida** en `24_UI_Credenciales.html:215` (dropdown "Nivel (radioaficionado)" del formulario de asignación — mismo patrón de V3.4K con "Jefe de Sede": backend correcto, copia UI desactualizada):

```js
  ANTES:  ['Aspirante', 'Novicio', 'General'].map(...)
  DESPUÉS: ['Aspirante', 'Novicio', 'General', 'Superior'].map(...)
```

**Versionado:** 00_Constantes.js → `'0.8.8 — V3.4M'`; 13_UI_App.html → `PROYECTO_VERSION = '0.8.8'`.

---

## b. AUDITORÍA COMPLETA DE CALL SITES

### `App.skeleton(` — 18 call sites (todos contenedores de página completa o cuerpo de tab)

| Archivo:línea | Contenedor | Tipo | Tratamiento |
|---|---|---|---|
| 15_UI_Voluntarios.html:365 | `cont` (página Voluntarios) | página completa | default 14px OK |
| 16_UI_Inventario.html:254 | `cont` (página Inventario) | página completa | default 14px OK |
| 17_UI_Entregas.html:883 | `cont` (página Entregas) | página completa | default 14px OK |
| 18_UI_Ficha.html:139 | `cuerpo` (`#tab-cuerpo` de la ficha) | cuerpo de tab | default 14px OK |
| 18_UI_Ficha.html:483 | `cont` (contenedor raíz de la ficha) | página completa | default 14px OK |
| 19_UI_Modulos.html:241 | `cont` (página Servicios) | página completa | default 14px OK |
| 19_UI_Modulos.html:425 | `cont` (página Asistencia) | página completa | default 14px OK |
| 19_UI_Modulos.html:680 | `cont` (página Historial) | página completa | default 14px OK |
| 19_UI_Modulos.html:693 | `cont` (página Configuración) | página completa | default 14px OK |
| 20_UI_Catalogo.html:212 | `cont` (página Catálogo) | página completa | default 14px OK |
| 22_UI_GradosCargos.html:383 | `cont` (página Grados) | página completa | default 14px OK |
| 23_UI_Especialidades.html:300 | `cont` (página Especialidades) | página completa | default 14px OK |
| 24_UI_Credenciales.html:251 | `cont` (página Credenciales) | página completa | default 14px OK |
| 25_UI_Capacitaciones.html:256 | `cont` (página Capacitaciones) | página completa | default 14px OK |
| 26_UI_Unidades.html:205 | `cont` (página Unidades) | página completa | default 14px OK |
| 27_UI_Reportes.html:164 | `cont` (página Reportes) | página completa | default 14px OK |
| 28_UI_Usuarios.html:200 | `cont` (página Usuarios) | página completa | default 14px OK |
| 29_UI_Licencias.html:92 | `cont` (página Licencias) | página completa | default 14px OK |

**Ningún call site pasa un `style` que fije un alto distinto** para las barras de `skeleton()` (los únicos altos inline son el círculo y los de `skeletonTarjetas()`). **Sin tratamiento especial necesario.**

### `App.cargando(` — 5 call sites (todos página completa o panel de contenido)

| Archivo:línea | Contenedor | Tipo | Resultado con min-height:200px |
|---|---|---|---|
| 13_UI_App.html:468 | `cont = #page-<nombre>` en `navegar()` | página completa | centrado OK |
| 18_UI_Ficha.html:490 | `cont` (contenedor raíz de la ficha) | página completa | centrado OK |
| 19_UI_Modulos.html:294 | `#as-resumen` (panel `.card-cuerpo` de Asistencia) | panel de contenido | centrado OK |
| 19_UI_Modulos.html:296 | `#as-resumen` (apaga el cargando) | — | no aplica (activo=false) |
| 19_UI_Modulos.html:299 | `#as-resumen` (apaga el cargando) | — | no aplica (activo=false) |

**Ningún call site usa un contenedor pequeño** (dropdown/modal/sección lateral angosta). `#as-resumen` es el cuerpo de la tarjeta de marcajes — área de contenido, no un mini-contenedor. **No se agregó variante compacta** (decisión documentada: no existe caso real que la justifique; si en el futuro se usa `cargando()` en un modal/dropdown, se añadirá `.cargando-compacta` con min-height menor, p. ej. 60px).

---

## c. CONFIRMACIÓN: SIN TERCERA COPIA DESINCRONIZADA DE NIVELES DE RADIOAFICIONADO

Auditoría global en **todos** los `.js`/`.html` del proyecto (excluida la carpeta de referencia visual `Defensa Civil – …_files/`), buscando cualquier lista de niveles que contenga `Aspirante; Novicio; General` sin `Superior`:

- **`00_Constantes.js`** — `SUBESPECIALIDADES_V2[1][5]` = `'Aspirante; Novicio; General; Superior'` ✔ (fuente de verdad, 4 niveles, V3.4H).
- **`13_UI_Parches.html`** — META s-1 = `'Aspirante; Novicio; General; Superior'` ✔ (**corregido en esta fase**).
- **`24_UI_Credenciales.html:215`** — dropdown = `['Aspirante', 'Novicio', 'General', 'Superior']` ✔ (**tercera copia encontrada y corregida**).
- **`38_Migraciones.js`** — contiene `'Aspirante; Novicio; General'` **solo en líneas de comentario** (historial de la migración V3.4G, por referencia — no es código activo) ✔.
- **`MODELO_DATOS_V2.md`** — documento de spec, ya describe 4 niveles ✔.
- **`PREFIJOS_INDICATIVO_RADIO`** = `{Aspirante:'CD', Novicio:'CA', General:'CE'}` — intacto (no incluye Superior porque Superior no tiene prefijo de indicativo propio; no es una "lista de niveles" a sincronizar).

**Resultado: no queda ninguna copia activa con 3 niveles.** El patrón "backend correcto → copia UI desactualizada" (visto en V3.4K con Jefe de Sede) se cerró de raíz.

---

## d. VERIFICACIÓN

### Harness de la fase — `test_v34m.js` (19/19 OK)

Checks cubiertos: sintaxis JS de los 4 archivos modificados (13_UI_App, 13_UI_Parches, 24_UI_Credenciales, 00_Constantes); `.skeleton` con `height:14px` + `animation:brillo` + `.skeleton-fila` con `align-items:center` intacto; `.cargando` con `min-height:200px` + `justify-content:center` intacto; META s-1 con 4 niveles y sin la lista de 3; SUBESPECIALIDADES_V2 con 4 niveles; PREFIJOS_INDICATIVO_RADIO intacto; dropdown de Credenciales con 4 niveles y sin la lista de 3; auditoría global sin copias desincronizadas (38_Migraciones.js solo comentarios); versión backend `0.8.8 — V3.4M` + frontend `0.8.8`.

### Sintaxis global — 48/48 archivos OK

`node --check` equivalente (extracción de `<script>` de todos los `.html` + todos los `.js` del proyecto) → **48/48 sin errores de sintaxis**, incluyendo 13_UI_Styles.html (CSS — validado por estructura de bloques) y los 4 archivos modificados.

### Regresión de suites anteriores

Los harnesses históricos (test_core, test_v2 … test_v34l, audit_ui, check_ui) **no están versionados en el repo** (se ejecutaron en sesiones previas desde un entorno temporal), por lo que no fue posible re-ejecutarlos en esta sesión. La cobertura de esta fase se realizó con el harness específico (19/19) + sintaxis global (48/48). Los cambios son **acotados** (2 propiedades CSS de una línea + 2 listas de datos de UI), sin tocar backend, router, animaciones V3.4L, `.spinner` ni `skeletonTarjetas()` — ningún componente ya funcional se modificó.

### Verificación visual (PC y celular) — pendiente del usuario

Esta sesión no tiene acceso visual (deployment MYSELF + sin cuenta para abrir el browser). Reproducción exacta del caso original, pendiente de confirmar en /dev (Ctrl+Shift+R):

1. **Ficha de voluntario → tab Servicios** (o cualquier sección que invoque `App.skeleton`): cada fila debe verse como **fila completa** (círculo + 2 barras de texto de ~14px), NO círculos sueltos apilados.
2. **Navegación a una página recién montada** (p. ej. Ficha tras click en Voluntarios): el indicador "Cargando…" (anillo + texto) debe verse **centrado verticalmente** en el área de contenido, legible, no pegado arriba.
3. **Especialidades / Biblioteca Institucional**: Radioaficionado debe mostrar los **4 niveles** (Aspirante, Novicio, General, Superior).
4. **Sin regresiones**: la barra de navegación (V3.4L), el spinner de botones, el splash inicial y `skeletonTarjetas()` del Dashboard deben verse **igual** que antes.

---

## e. ENTREGABLES

- **Commits** (según instrucción de la fase):
  - `642fe50` — "V3.4M: fix .skeleton (height 14px, barras ya no colapsan a 0) y .cargando (min-height 200px, centrado vertical) + bump versión 0.8.8" (13_UI_Styles.html, 00_Constantes.js, 13_UI_App.html).
  - `ca759e0` — "V3.4M: nivel Superior de Radioaficionado en META (s-1) y dropdown de Credenciales — alineado a SUBESPECIALIDADES_V2 (4 niveles)" (13_UI_Parches.html, 24_UI_Credenciales.html).
- **`clasp push`** — OK ("Script is already up to date" en re-push = sincronizado).
- **`clasp deploy -i`** — **@33** (misma URL).
- **AGENTS.md** — §0 (Estado actual + deployment @33), §9.3 (13_UI_Styles / 13_UI_App / 24_UI_Credenciales), §12 (entrada V3.4M) actualizados.