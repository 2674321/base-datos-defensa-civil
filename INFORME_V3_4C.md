# INFORME V3.4C — CORRECCIÓN DE DATOS, NORMALIZACIÓN, PARCHES, LICENCIAS, INVENTARIO Y UX

**Fecha:** 17/08/2026 · **Fase:** V3.4C · **Alcance:** SOLO frontend (backend sin cambios funcionales; única edición: `version` en 00_Constantes.js) · **Deployment:** @21 (misma URL)

---

## 1. Objetivo

Cerrar los pendientes detectados en V3.4B y solicitudes del usuario sobre la Web App:

1. Campana de alertas que muestre el detalle (críticas/avisos) sin navegar.
2. Submenú "Formación y Acreditaciones" en el sidebar (Capacitaciones / Credenciales / **Licencias**).
3. Nueva página **Licencias** (solo lectura, desde `listarCredencialesV2`).
4. **Parches institucionales** de identidad (logo en miniatura) en Ficha, Grados y Catálogo de Especialidades.
5. **Buscador de Voluntarios** con filtros de especialidad, subespecialidad y unidad.
6. Correcciones menores de CSS (variantes de `stat-ico` usadas sin regla) y versión mostrada.

## 2. Cambios por archivo

| Archivo | Cambio |
|---|---|
| `13_UI_App.html` | **Panel de alertas desplegable** (`btn-alertas` → `refrescarAlertas().then(...)` construye `.menu-item.alr-item`: críticas con icono `alerta`, avisos con icono `punto` — **no existe icono 'info'**, se usó `punto` —, separador + `.alr-ver-todas` "Ver panel de control" → `navegar('dashboard')`; cierra con el dropdown estándar, **NO marca como leído**). Router: auto-apertura del submenú del ítem activo en `navegar()`; `licencias: 'Licencias'` en TITULOS; loop genérico sobre `.nav-grupo-exp` en `iniciar()`; **`App.patch` agregado al export** (delega al método real definido en 13_UI_Parches.html — requerido por la auditoría de métodos App.*) |
| `13_UI_Styles.html` | CSS `.alr-lista`/`.alr-item`/`.alr-critica`/`.alr-ver-todas` (panel de campana); `.parche`/`.chip-hab` (parches); **variantes `.stat-ico.aviso/.neutro/.ok/.info` y `.stat-titulo`** (se usaban en 19_UI_Modulos sin reglas — bug visual latente corregido) |
| `13_UI_Index.html` | Sidebar: ítem "Formación y Acreditaciones" con submenú colapsable (Capacitaciones/Credenciales/Licencias; Especialidades queda directo), CSS crítico inline del grupo; `page-licencias`; includes `29_UI_Licencias` y `13_UI_Parches` (**19 scriptlets en total**) |
| `29_UI_Licencias.html` | **NUEVO** — página solo lectura: filtra `/^licencia/i` de `listarCredencialesV2` (KPIs: vigentes / por vencer (≤30 d) / vencidas / total), búsqueda instantánea, badges de vigencia, tabla con patrón V3.4B |
| `13_UI_Parches.html` | **NUEVO** — `App.PARCHES` (data URIs) + `App.patch(nombre, alt)` → `<img class="parche">` (placeholder svg si se desconoce). **FIX crítico**: el encabezado `/* ... */` quedaba FUERA de `<script>` y contenía el literal `<script>` → rompía el parseo HTML (jsdom: "Unexpected identifier"); se movió el comentario DENTRO del wrapper y se eliminó un `</script>` final duplicado (quedan 1 cierre real + 1 `<script>` dentro de comentario JS, inofensivo — solo `</script>` interno rompería HTMLService) |
| `15_UI_Voluntarios.html` | **Buscador ampliado**: 3 selects dinámicos (especialidad/subespecialidad/unidad) construidos desde la lista ya cargada (`opcionesEsp/opcionesSub/opcionesUnidad`), filtrando `v.especialidades[]` `{especialidad, subespecialidad, nivel, origen}` y `v.unidades[]` `{unidad, rol, estado}`; empty-state unificado con `hayFiltro` |
| `18_UI_Ficha.html` | Parches aplicados: chip de grado en cabecera, timeline de grados, subespecialidades como `.chip-hab` |
| `22_UI_GradosCargos.html` | Parches en tabla de grados |
| `23_UI_Especialidades.html` | Parches en catálogo |
| `00_Constantes.js` | `version: '0.7.1 — V3.4C'` (se muestra en el sidebar — era 0.6.0) |

## 3. Harnesses actualizados

| Harness | Cambio | Resultado |
|---|---|---|
| `test_ux.js` | Includes + mocks `listarPersonasV2` (2 voluntarios con esp/unidades) y `listarCredencialesV2` (3 licencias, mock con nombre `Licencia Clase F`); **alertas como ARRAY** (forma real de `obtenerResumenDashboardV2`); tests 15–19 (campana, submenú, parches, licencias, buscador) | **TEST UX OK (19)** |
| `test_rutas_v2.js` | Includes `29_UI_Licencias` + `13_UI_Parches`; ruta `licencias` | **18/18 rutas OK, 0 errores JS** |
| `test_v34b_integracion.js` | Includes `29_UI_Licencias` + `13_UI_Parches` (App.patch en Ficha → ReferenceError si faltan) | **INTEGRACIÓN V3.4B OK** |
| `test_v32.js` | Test 34 (antigüedad) era **flaky por hora del día** (fallaba de noche, pasaba de mañana): el harness usaba `Math.floor` por separado; el backend (`_calcularAntiguedadV2`, 35_Retiros.js:107) descuenta ms exactos y aplica floor al final. Expectativa corregida a la semántica exacta del backend | **43/43 OK** |
| `audit_ui_v2.js` / `audit_ui.js` | `App.patch` ahora exportado; audit v0 ampliado a todos los *.js (detectaba V2 como inexistentes) | **SIN FALLOS** |
| `check_ui.js` | Expectativas obsoletas: includes Index 8→19, versión → 0.7.1, clases de plantillas dinámicas excluidas | **TODO OK** |

## 4. Regresión completa (todas verdes)

- `node --check` backend: OK (los .html no son chequeables con node --check; su JS se valida vía jsdom en los harnesses: 0 errores en todas las rutas).
- test_core PASS · test_v2 0 fallas · test_v31 OK · test_v32 43/43 · test_v33 31/31 · test_v34_estructura 28/28.
- test_seed_demo 101/101 · test_v34b_integracion OK · test_ux OK · test_rutas_v2 18/18 · test_rutas (legacy, síncrono sin esperas de transición — reemplazado por v2) quedó obsoleto.
- audit_ui_v2 SIN FALLOS · audit_ui SIN FALLOS · check_ui TODO OK.

## 5. Deployment

`clasp push` (todos los archivos) + `clasp deploy -i AKfycbzay31fDxiH0QGG29J77deMMJ7y19Ji_PrxQDYdn13zLiDI-F7TVprYBsDdNdikOplL --description "V3.4C — correccion de datos, normalizacion, parches, licencias, inventario y UX"` → **@21** (misma URL).

## 6. Pendiente usuario

- Recarga forzada en /dev (Ctrl+Shift+R o `?new=1`).
- Verificar visualmente: campana con detalle de alertas, submenú Formación y Acreditaciones, página Licencias, parches en Ficha/Grados/Especialidades, filtros del buscador de voluntarios y la versión 0.7.1 — V3.4C en el sidebar.