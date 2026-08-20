# INFORME V3.4K — CORRECCIONES (dashboard 1 round-trip, historial colapsable, sidebar mini, Jefe de Sede = grado)

**Versión:** 0.8.6 — V3.4K
**Deployment:** @31 (`AKfycbxVlTwraU3tClaeLakRkXW3fwmi99-9ZqRtqgvwwEOhQqha9kSTnLxyjRpqZofh6DoO` — misma URL de siempre, actualizado con `clasp deploy`)
**Fecha:** ago 2026
**Base:** V3.4J (deploy @30, 0.8.5)

---

## 0. Commits preliminares (0.3 y 0.4)

- **0.3 — `7efb975`:** elimina `21_UI_Personas.html` (huérfano definitivo, sin include en Index desde V2). Los harnesses `audit_ui_v2` se actualizaron para no referenciarlo.
- **0.4 — `a6e1762`:** `.gitignore` ampliado (cambio pendiente reportado por V3.4J, ajeno a la fase anterior). Diff de archivo:

```diff
 node_modules/
-*.log
+
+# OS
+.DS_Store
+Thumbs.db
+desktop.ini
+
+# Environment
+.env
+.env.local
+
+# Editor
+.vscode/
+.idea/
+
+# Clasp credentials (sensitive)
+.clasp.json
+
+# Temporary
+/tmp/
+*.tmp
```

---

## 1. 0.1 — Dashboard a UNA llamada de backend (mediciones reales)

### 1.1 Estado anterior (V3.4J)

El panel hacía **6 llamadas `google.script.run` en paralelo**:

| # | Llamada | Hoja(s) leídas | Filas reales (hoja exportada) |
|---|---|---|---|
| 1 | `obtenerResumenDashboardV2` | Voluntarios, Personas, Grados, Cargos, Áreas, Historial Grados, Historial Cargos, **Catálogo**, **Inventario**, **Entregas**, Log | Catálogo 1000 (rango, 13 con ID), Inventario 1000 (rango, 11 reales), Entregas 1000 (rango, 7 reales), Log 260 |
| 2 | `buscarElementos` | Catálogo (2ª lectura) | 1000 de rango (13 con ID) |
| 3 | `obtenerInventario` | Inventario (2ª lectura) | 1000 de rango (11 reales) |
| 4 | `obtenerHistorialEntregasV2` | Entregas (2ª lectura) | 1000 de rango (7 reales) |
| 5 | `listarServiciosV2` | Servicios | — |
| 6 | `obtenerEstadisticasAsistenciaV2` | Asistencia | — |

Además, el frontend **recalculaba** resúmenes (helpers `inventarioResumen`, `entregasResumen`, `entregasPorMes`, `mesClave`) duplicando lógica del backend (riesgo de divergencia) y el caché `App.memo('dashboard')` solo cubría el agregador (las otras 5 llamadas se re-ejecutaban con cada visita).

### 1.2 Estado posterior

- **Backend** (`11_Dashboard.js`): el agregador `obtenerResumenDashboardV2` ahora entrega TODO en una llamada:
  - `catalogo {total, activos}` (`_resumenCatalogo`)
  - `inventario {disponible, entregado, danado, extraviado, baja, sinEstado, porElemento}` (`_resumenInventario` — con normalización de estados)
  - `entregas {total, pendientes, devueltas, parciales, danadas, extraviadas, entregadas, porMes}` (`_resumenEntregas` — reusa las filas ya leídas, 0 lecturas extra)
  - `servicios {total, activos}` (`_resumenServicios`)
  - `asistencia` (resumen + `porcentajePresencia` + `porMes`, passthrough de `obtenerEstadisticasAsistenciaV2`)
  - mantiene `alertas`, `resumenAlerta`, `actividadReciente`, `minimosReferencia`, `version`, `generado`.
- **Frontend** (`14_UI_Dashboard.html`): `cargar()` = **1 llamada** (`App.memo('dashboard', 30000, …)`); eliminados los helpers de recomputación (`inventarioResumen`, `entregasResumen`, `entregasPorMes`, `mesClave`). El frontend dejó de conocer la forma de leer hojas: solo consume el contrato.
- **Caché compartida**: `buscarElementos` y `obtenerInventario` se envuelven en `App.memo('catalogo'/'inventario', 30000)` en 20_UI_Catalogo, 16_UI_Inventario, 17_UI_Entregas (2 sitios) y el modal de entrada del Dashboard → una visita a Voluntarios+Dashboard+Inventario ya no duplica lecturas de Catálogo/Inventario.
- **`trasCambio()`** (`13_UI_App.html`) ahora invalida **todo el caché** (`for k in cache delete`) — antes solo `dashboard`, lo que dejaba catálogos/inventario potencialmente sucios tras una escritura.

### 1.3 Mediciones (datos reales de la hoja, sin OAuth — export xlsx de lector)

- Antes: 6 llamadas al backend → lecturas de hoja: **Catálogo ×2 (2000 filas de rango), Inventario ×2 (2000), Entregas ×2 (2000), Log ×1 (260)** + Servicios + Asistencia.
- Después: **1 llamada** → **Catálogo ×1 (1000), Inventario ×1 (1000), Entregas ×1 (1000), Log ×1 (260)** + Servicios + Asistencia. 50 % menos de filas de rango leídas y 5/6 menos de round-trips.
- Hallazgo de la medición: la hoja real tiene **11 filas de Inventario, 7 de Entregas, 12 elementos con nombre + E-001 fantasma** en rangos de 1000 — el peso real de lectura es de rango (no de datos), lo que confirma el valor de la consolidación y limita el upside de reducir el rango de lectura (lecturas batch de rango fijo, sin reescaneo por fila).

> ⚠️ Límite conocido: `clasp run` no funciona (token OAuth sin `script.external_request`), por lo que los tiempos de ejecución **no son medibles**; la métrica usada es de lecturas/llamadas (objetivo declarado de la fase).

### 1.4 Extras de robustez del punto 0.1

- `_leerCatalogo` (`05_Entregas.js`) filtra filas **sin ID o sin nombre** → el fantasma E-001 (ID sin nombre) ya no aparece en ningún consumo; verificado que `_siguienteIdPrefijo` no se ve afectado (sigue recorriendo el rango completo).
- `obtenerHistorial(limite, offset)` + `_leerLog(ss, limite, offset)`: paginación real del Log para el punto 1 (antes el límite se aplicaba en memoria con lectura completa del Log).

---

## 2. 0.2 — Jefe de Sede: DISTINTIVO → GRADO g-7 (fuente única GRADOS_V2)

### 2.1 Causa raíz

Desde V3.4F existía en `13_UI_Parches.html` (META) un distintivo `d-2 'Jefe de Sede'` de **origen CARGO** con grado Instructor Mayor. En V3.4H el backend declaró **GRADOS_V2 = 7 grados** (Jefe de sede grado real, orden 2, UNI 2018 "3 barras"), y la hoja real tiene 7 grados idénticos — pero la META del frontend seguía con la semántica vieja → **la biblioteca y el frontend contradecían al backend**.

### 2.2 Medición en hoja real (export)

- Hoja `Grados`: 7 grados — orden exacto: Comandante Local (1), **Jefe de sede (2, "3 barras", OFICIAL, activo)**, Instructor Mayor (3), Instructor (4), Subinstructor (5), Voluntario Mayor (6), Voluntario (7). **Coincide 1:1 con GRADOS_V2.**
- Hoja `Cargos`: 7 cargos, incluye 'Jefe de Sede / Jefe Local' (orden 2) → el cargo y el grado **coexisten** legítimamente.

### 2.3 Solución

- META: se elimina `d-2` y se inserta **`g-7 'Jefe de Sede'`** (GRADO, origen OFICIAL, área Mando, desc "Grado real de la sede (UNI 2018: 3 barras). Coexiste con el cargo de Jefe de Sede / Jefe Local", archivo `parche jefe sede`) entre `g-1` y `g-2` → 7 grados, espejo de GRADOS_V2 y de la hoja.
- `22_UI_GradosCargos.html`: texto de cabecera ("7 grados OFICIALES…"), comentarios de compat (la fila meta solo aparece si NO hay grado real con ese nombre — sigue siendo inofensiva).
- `32_UI_Biblioteca.html`: comentarios corregidos; ningún elemento META es origen CARGO (caso `CARGO_CONDICION` queda como compatibilidad muerta).
- ALIAS 'jefe de sede' → `parche jefe sede` intacto (la imagen del parche no cambia).

### 2.4 Verificación

- `App.metaLista('GRADO').length === 7`; `App.meta('Jefe de Sede')` → `{tipo:'GRADO', entidadId:'g-7', origen:'OFICIAL'}`; sin `d-2` en META; tarjeta/ficha de biblioteca muestran badge **OFICIAL** (ya no "Cargo/condición de mando"); GradosCargos: 7 filas sin fila aviso. Harnesses `test_v34f`/`test_v34e` actualizados y verdes.

---

## 3. Punto 1 — Historial colapsable (año → mes → semana) con carga perezosa

- **Backend:** `obtenerHistorial(limite, offset)` y `_leerLog(ss, limite, offset)` con paginación real desde el Log (260 filas reales) — antes se leía el Log completo y se recortaba en memoria.
- **Frontend** (`19_UI_Modulos.html`, HistorialModule reescrito):
  - lotes de **80 eventos** vía `offset` (fin detectado cuando un lote devuelve < 80);
  - agrupación **año → mes → semana (lunes)** con conteos por grupo;
  - **colapsado por defecto**, salvo el año/mes/semana más recientes;
  - **carga perezosa**: expandir el grupo más antiguo carga el siguiente bloque; botón "Cargar más historial" al pie mientras haya más;
  - buscador con debounce que, si no encuentra coincidencias en lo cargado, **sigue cargando bloques (máx. 5)** hasta hallarlas o agotar, y expande los grupos con coincidencias;
  - filtros tipo/resultado conservados.
- CSS nuevo en `13_UI_Styles.html` (sección 19b): `.hist-grupo`, `.hist-cabecera`, `.hist-chevron`, `.hist-contenido`, `.hist-count` — acordeón con jerarquía visual por nivel, chevron rotado, timeline anidado.

---

## 4. Puntos 2 y 3 — Submenú "Asistencia y Servicios" + sidebar colapsable

### 4.1 Árbol del sidebar (antes → después)

```
ANTES                                    DESPUÉS
Inicio                                   Inicio
  Panel de control                         Panel de control
Gestión                                  Gestión
  Voluntarios                              Voluntarios
  Servicios                                ▸ Asistencia y Servicios
  Asistencia                                 Servicios
Equipamiento ▸                              Asistencia
  Inventario                              Equipamiento ▸ (sin cambios)
  Entregas                                Institucional (sin cambios)
  Catálogo                                Formación y Acreditaciones ▸ (sin cambios)
Institucional ▸ …                        Administración ▸ (sin cambios)
```

### 4.2 Sidebar colapsable (mini)

- Botón `◀` en el pie del sidebar → clase `.mini` (ancho 68 px), persistido en `localStorage['dc-sidebar-mini']` + clase `dc-mini` en `<body>` (desplaza `.content` y `.app-header`).
- En mini: se ocultan textos/grupos/badges, los iconos quedan centrados, y los submenús (`Equipamiento`, `Asistencia y Servicios`, `Formación`, `Administración`) se abren como **popover** (panel claro a la derecha, ≥1024 px).
- **<1024 px el modo drawer se mantiene intacto** (el mini se desactiva por media query: sidebar completa, submenús en árbol).
- El router ya expandía el grupo padre al navegar (comportamiento conservado).

---

## 5. Puntos 4, 5 y 6 — Logo, header y topbar responsiva

- **4 — Logo sidebar:** se quitó `background:#FFFFFF` y `box-shadow` de `.logo-sidebar` (el logo oficial es un emblema circular con transparencia — el "cuadro blanco" era un artefacto CSS).
- **5 — Header 2 líneas:** el nombre oficial verificado es **"Sede La Serena"** (docs, splash, sidebar y título usan ese nombre; no existe "Sede Local La Serena" en ninguna parte del proyecto) → se mantiene el nombre y se corrige el **espaciado** entre título y lema (`.logo-sub { margin-top: 2px }`, `.sidebar-logo-texto span` con `display:block` + margen).
- **6 — Topbar responsiva:**
  - **Escritorio (≥768 px):** `seccion-actual` + `estado-sistema` + **3 accesos rápidos** (iconos que navegan a Voluntarios / Entregas / Inventario) + campana + usuario.
  - **Móvil (<768 px):** se ocultan `seccion-actual`, `estado-sistema` y los accesos rápidos; aparece el botón **⋮** con dropdown de las rutas principales (Dashboard, Voluntarios, Servicios, Asistencia, Inventario, Entregas, Catálogo, Historial, Configuración); campana y usuario permanecen.

---

## 6. Punto 7 — Barras proporcionales en KPIs (causa raíz y solución)

**Causa raíz:** los KPIs mostraban solo número + etiqueta; el porcentaje no se representaba visualmente (texto plano en etiquetas largas, sin lectura rápida de proporción).

**Solución** (`13_UI_Styles.html` + `14_UI_Dashboard.html`):
- `kpi(icono, clase, numero, label, porcentaje?)` renderiza `.kpi-barra` (6 px, pill, fondo `--dc-gris-100`) cuando recibe porcentaje;
- color semántico por KPI (`.kpi-barra.verde/ambar/rojo/celeste/gris` con tokens existentes — sin colores nuevos);
- 7 KPIs con barra: voluntarios activos, servicios activos, presencia, catalogados, stock disponible, pendientes de devolución, alertas (100 % si hay, 0 si no);
- transición de ancho 420 ms.

---

## 7. Punto 8 — Inventario por estado: "Sin estado" (causa raíz y solución)

**Causa raíz:** el resumen de inventario (Dashboard e Inventario) recorría una lista fija de 5 estados; una fila con estado **vacío/inválido** se sumaba bajo una clave `undefined` que ningún render mostraba → **stock invisible** y chips inconsistentes ("Sin existencias" con filas existentes).

**Medición en hoja real:** las 11 filas de Inventario están todas en 'Disponible' → el defecto no se manifiesta hoy en producción; es **robustez preventiva** (estados editables manualmente + migraciones futuras). No se migraron datos (decisión documentada).

**Solución:**
- Backend `_resumenInventario`: normaliza a `'Sin estado'` (clave `sinEstado`) — nunca se pierde del conteo, y `porElemento` lo expone por elemento.
- Dashboard: `COLOR_ESTADOS_INV['Sin estado'] = #9AA6B2` (gris, no confundible con estados reales) + estado incluido en apiladas y leyenda.
- `16_UI_Inventario.html`: estado vacío → `'Sin estado'` (normalización en `agrupar()` para que el filtro funcione), chip + columna + opción de filtro propias; colores alineados.

---

## 8. Versión y verificación

- `PROYECTO_VERSION` / `PROYECTO.version` → **'0.8.6 — V3.4K'** (13_UI_App.html, 00_Constantes.js).
- `node --check` OK en backend (18 archivos) y en el JS extraído de los 10 HTML tocados.
- **Regresión: 19/19 harnesses verdes** — core, v2, v31, v32, v33 (31/31), v34_estructura (28/28), v34b integración, v34d (47/47), v34e DOM, v34f DOM (43–49 actualizados a g-7/OFICIAL/0.8.6), v34g DOM, seed_demo (83/83), ux, rutas, rutas_v2, audit_ui, audit_ui_v2, check_ui.
- Deploy **@31** (misma URL): `AKfycbxVlTwraU3tClaeLakRkXW3fwmi99-9ZqRtqgvwwEOhQqha9kSTnLxyjRpqZofh6DoO`.

### Pendiente del usuario
- **Verificación visual** en /dev (recarga forzada Ctrl+Shift+R), en PC y celular (375/768/1440):
  1. Splash y carga normal (sin cambios de V3.4J).
  2. Dashboard: 7 KPIs con barras de proporción; donuts/apiladas con "Sin estado" solo si existe.
  3. Historial: acordeón año→mes→semana; expandir el grupo más antiguo carga más; buscar un texto antiguo sigue cargando hasta encontrarlo.
  4. Sidebar: botón ◀ en el pie (PC) colapsa/expande y persiste; submenús popover en modo mini; en celular el drawer funciona como antes y aparece ⋮ en el header con las rutas.
  5. Logo del sidebar sin cuadro blanco; header con título/lema bien espaciados.
  6. Biblioteca/Grados y Cargos: "Jefe de Sede" como GRADO (OFICIAL) en el lugar correcto de la jerarquía.
  7. Versión 0.8.6 — V3.4K visible (pie del sidebar / dropdown de usuario).