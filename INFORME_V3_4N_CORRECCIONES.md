# INFORME V3.4N — FIX POPOVER SIDEBAR MINI + LAZY LOADING GENERAL + BIBLIOTECA COLAPSABLE

**Fecha:** ago 2026 · **Versión:** 0.8.9 — V3.4N · **Deployment:** @34 (misma URL) · **Suite:** `tests/test_v34n.js` **70/70 OK**

---

## a. Fix del popover de sidebar mini — confirmado con el diff exacto

**Causa raíz (confirmada por spec CSS, no hipótesis):** `.nav` declara `overflow-y: auto` y nada de `overflow-x`; el navegador computa el eje no declarado como `auto` (nunca `visible` cuando el otro eje es `auto`), por lo que `.nav` recortaba en X el popover flotante `.sidebar.mini .nav-sub` (`position:absolute; left:calc(100% + 6px)`, 13_UI_Styles.html:261-266).

**Diff exacto (13_UI_Styles.html, línea 202):**

```diff
- .nav { flex: 1; overflow-y: auto; padding: var(--esp-3) var(--esp-3) var(--esp-4); }
+ .nav { flex: 1; overflow-y: auto; overflow-x: visible; padding: var(--esp-3) var(--esp-3) var(--esp-4); }
```

**Mejora opcional aplicada (13_UI_App.html, handler de `.nav-grupo-exp`):** en modo mini, al abrir un grupo se cierran los demás grupos `.abierto` (un solo popover flotante a la vez, `aria-expanded` sincronizado). En sidebar completo el comportamiento de múltiples grupos abiertos **no cambia** (verificado en harness con DOM real, sección 6).

**Verificación:** popover íntegro — fondo, borde, sombra y los 210px de ancho mínimo (asserts: `position:absolute`, `left:calc(100% + 6px)`, `min-width:210px` intactos). No se requirió reposicionamiento vertical: el popover se ancla a `top:0` del grupo y en el ítem más bajo del sidebar queda dentro del viewport (los grupos con submenú están arriba de la lista; la lista completa mantiene scroll vertical propio).

---

## b. Auditoría de lazy loading — secciones revisadas y resultado

| Sección | Antes | Después | Necesitaba cambio |
|---|---|---|---|
| **Ficha (18_UI_Ficha.html)** — 7 tabs | Ya era lazy por pestaña (V3.4B, `cargado[tab]`), pero con **N+1** internos: tab Servicios = `listarServiciosV2` + `obtenerServicioV2`×N y tab Administrativo = `listarUnidadesV2` + `listarIntegrantesUnidadV2`×N, re-pedidos en **cada** apertura de ficha | Cada llamada envuelta en `App.memo(..., 30000)` con claves compartidas (`servicios`, `servicio:ID`, `unidades`, `unidades:ID`, `personas`) + claves por voluntario (`retiros:ID`, `especialidades-vol:ID`, `credenciales-vol:ID`, `capacitaciones-vol:ID`, `equipamiento-vol:ID`, `asistencia-vol:ID`, `hist-grados:ID`, `hist-cargos:ID`, `eventos:ID`) | **SÍ** (N+1 era el mayor volumen del sistema) |
| **Unidades (26)** | 1 llamada al montar + integrantes bajo demanda (ya lazy) | `memo('unidades')` y `memo('unidades:ID')` — **claves compartidas con el tab Administrativo de la Ficha**: ver una unidad en Unidades y el tab admin de una ficha ya no duplica lecturas | **SÍ** (dedupe compartido) |
| **Especialidades (23)** | 3 llamadas secuenciales al montar (esp + sub + áreas) aunque se vea una sola pestaña | `memo('especialidades')`, `memo('subespecialidades')`, `memo('areas')` | **SÍ** |
| **Grados y Cargos (22)** | 3 llamadas al montar | `memo('grados')`, `memo('cargos')`, `memo('areas')` (áreas compartida con Especialidades) | **SÍ** |
| **Voluntarios (15) / Entregas (17) / Módulos (19) / Ficha** | `listarPersonasV2` (tabla más grande del sistema) pedida en cada montaje/apertura | `memo('personas', 30000)` compartida en los 4 call sites (Voluntarios, selector de Entregas ×2, asignación masiva de Módulos, carga de Ficha) | **SÍ** |
| **Entregas catálogo/inventario (17)** | Ya `memo('catalogo'/'inventario')` (V3.4K) | Sin cambios | No |
| **Inventario (16) / Catálogo (20) / Dashboard (14)** | Ya `memo()` (V3.4K) | Sin cambios | No |
| **Credenciales (24) / Capacitaciones (25)** | 1 llamada al montar, volumen pequeño (catálogos) | Sin cambios — fuera de las 5 priorizadas | No |
| **Reportes (27) / Usuarios (28)** | Bajo demanda por pestaña / 3 catálogos pequeños | Sin cambios | No |

Los skeletons/`App.cargando()` se conservan en cada carga perezosa (primer abrir de pestaña = skeleton de 3 filas; montaje de página = skeleton de 5 filas; ficha = skeleton → cargando) — la espera se siente intencional. `trasCambio()` sigue invalidando TODA la caché (no hay riesgo de datos viejos).

## c. Métricas antes/después (ventana de 30 s, mismo formato V3.4K)

**Ficha, tab Servicios** (3 servicios sembrados; abrir la ficha de 5 voluntarios distintos):
- Antes: 5 × (1 `listarServiciosV2` + 3 `obtenerServicioV2`) = **20 llamadas**.
- Después: 1 lista + 3 detalles = **4 llamadas** (las 4 aperturas siguientes: 0).

**Ficha, tab Administrativo + página Unidades** (1 unidad; 5 fichas + 1 visita a Unidades):
- Antes: 5 × (1 retiros + 1 unidades + 1 integrantes) + 1 × (1 unidades + 1 integrantes) = **17 llamadas**.
- Después: 1 retiros + 1 unidades + 1 integrantes = **3 llamadas** (claves compartidas).

**`listarPersonasV2` (tabla maestra)** — montar Voluntarios + Entregas + Módulos + abrir 3 fichas:
- Antes: **6 llamadas** (1+2+1+3). Después: **1 llamada**.

## d. Biblioteca colapsable — confirmado

32_UI_Biblioteca.html reescrito con el **mismo acordeón del Historial V3.4K** (`.hist-grupo`/`.hist-cabecera`/`.hist-chevron`/`.hist-count`, CSS 19b existente, cero CSS nuevo):
- Las 6 secciones inician **colapsadas** con título, descripción y contador (`N elemento(s)` / `N documento(s)`).
- El contenido (rejilla de tarjetas o tabla de documentos) se renderiza **solo en la primera expansión** (`dataset.renderizado`, lazy DOM — los datos son META estática, no hay round-trips que eliminar).
- El **buscador auto-expande** las secciones con coincidencias, oculta las que no tienen y, al limpiar, todo vuelve a colapsar. **Fix de bug preexistente descubierto en la auditoría**: antes, buscar **acumulaba** secciones duplicadas en cada tecleo (el rejilla no se limpiaba antes de `pintarSecciones`); ahora `rejilla.innerHTML = ''` al inicio.
- Verificado en DOM real (jsdom): 6 grupos, todos colapsados al montar, expansión con contenido, lazy de una sola vez, búsqueda expande/oculta, limpieza vuelve a colapsar.

## e. Housekeeping 0.1 — estado

Las suites históricas (test_v2, test_v31, test_core…) **no existen en el repo** (se generaban en-sesión, nunca se commiteaban; en disco solo hay `09_Pruebas.js` del backend). **Parcialmente resuelto:** se creó la carpeta `v1/tests/` con el primer harness versionado — `test_v34n.js` (70 asserts: CSS popover, toggle mini con DOM, memo() por sección, Biblioteca colapsable con DOM, versión 0.8.9) — commiteado como "baseline: suite de regresión versionada", y `**/tests/**` agregado a `.claspignore` para que clasp nunca suba harnesses. **Pendiente explícito:** las suites anteriores a V3.4N no existen ni en git ni en disco — no son recuperables sin reescribirlas; se sugiere regenerarlas por fases en `tests/` si se requiere cobertura histórica.

## f. Decisiones permanentes de modelo de datos — verificación contra código real (2026-08-20)

Se creó la sección **`## DECISIONES PERMANENTES — NO MODIFICAR SIN APROBACIÓN EXPLÍCITA`** al inicio de AGENTS.md (regla de vigencia para TODAS las fases futuras + 8 decisiones verificadas una por una contra el código actual, no de memoria):

| # | Decisión | Verificación en código actual | Estado |
|---|---|---|---|
| 1 | Jefe de Sede = grado real OFICIAL/Activo, también cargo/condición de mando con insignia propia | `GRADOS_V2` 00_Constantes.js:425 `['Jefe de sede',2,'3 barras','OFICIAL',true]`; cargo 'Jefe de Sede / Jefe Local' 00_Constantes.js:449; META g-7 13_UI_Parches.html:28 | ✅ |
| 2 | SCI = especialidad INTERNA con 5 niveles agrupados | 00_Constantes.js:475 + META e-7 (13_UI_Parches.html:40), ambos `INTERNO` y los 5 niveles | ✅ |
| 3 | Radioaficionado = subesp. de Telecomunicaciones INTERNO, 4 niveles | 00_Constantes.js:487 + META s-1 (13_UI_Parches.html:41), 4 niveles ambos (alineado V3.4M) | ✅ |
| 4 | Operador RPAS = especialidad única; modelos = campo de credencial | 00_Constantes.js:472 (INTERNO); `VolCredenciales.modelosHabilitados` col 10 (00_Constantes.js:326); SUBESPECIALIDADES_V2 sin modelos RPAS | ✅ |
| 5 | Admin. Logística → 3 especialidades OFICIAL; original inactiva | 00_Constantes.js:471 (`activo=false`, conservada) + 476-478 (las 3, OFICIAL/Activo) | ✅ |
| 6 | Sanidad → 'Auxiliar de Sanidad' | 00_Constantes.js:469 (nombre nuevo; área 'Sanidad' conservada; migración V3.4D/F por ID) | ✅ |
| 7 | Credenciales plantilla-only | `listarCredencialesV2` devuelve solo {id,nombre,emisor,estado} (25_Credenciales.js:36-52); ESTADOS_TIPO_CREDENCIAL 2 valores | ✅ |
| 8 | Personas eliminada; 22_Personas.js conservado | 21_UI_Personas.html no existe (commit 7efb975); 22_Personas.js intacto con 15 funciones | ⚠️ (ver abajo) |

**INCONSISTENCIA DETECTADA — REQUIERE DECISIÓN DEL USUARIO (no corregida en esta fase, por regla):** la decisión 8 se enunció como "22_Personas.js se conserva porque lo consumen **6+ archivos**". El conteo real en el código actual es **5 archivos**: 14_UI_Dashboard (1 llamada), 15_UI_Voluntarios (8), 17_UI_Entregas (2), 18_UI_Ficha (6), 19_UI_Modulos (1) — el "6+" del historial (V3.4I) incluía 21_UI_Personas.html, que fue **eliminado en V3.4K**. La decisión de fondo (conservar 22_Personas.js) es correcta y se mantiene; solo el argumento del conteo quedó obsoleto. Se documentó en AGENTS.md con la nota ⚠️; si el usuario prefiere, puede aprobar corregir el enunciado a "5 páginas frontend".

## Otros entregables

- **Commits separados (5):** (1) fix CSS popover `67c20dd` · (1b) toggle mini + versión `9dd4f83` · (2) lazy loading `529ae92` · (3) Biblioteca colapsable `9a086eb` · (0.1) baseline tests `8a22dd9`.
- **Verificación técnica:** harness 70/70 OK · `node --check` 47/47 archivos del proyecto (el único "fallo" es la página de referencia descargada de defensacivil.cl, excluida de clasp) · braces CSS balanceadas · regresión de invariantes V3.4M (`.skeleton` 14px, `.cargando` 200px, Radioaficionado 4 niveles) y V3.4K (memo catalogo/inventario, historial paginado, `obtenerHistorial` con LOTE/offset) sin fallos.
- **Deployment:** `clasp push` + `clasp deploy -i AKfycbxVlTwraU3tClaeLakRkXW3fwmi99-9ZqRtqgvwwEOhQqha9kSTnLxyjRpqZofh6DoO` → **@34** (misma URL).
- **AGENTS.md** actualizado (§0 @34/0.8.9, §9.3, §12) + **nueva sección `## DECISIONES PERMANENTES — NO MODIFICAR SIN APROBACIÓN EXPLÍCITA`** al inicio (regla de vigencia + 8 decisiones de modelo de datos verificadas contra código real — ver sección f).

## Pendiente del usuario (verificación visual en /dev, Ctrl+Shift+R)

1. Sidebar en **mini (68px)**: click en un grupo con submenú (ej. "Voluntarios") → popover COMPLETO (210px, fondo/borde/sombra) flotando a la derecha del riel, sin recorte; abrir un segundo grupo → el primero se cierra. Probar el grupo más cercano al borde inferior.
2. Sidebar **completo**: submenús expanden igual que antes (múltiples abiertos permitidos).
3. Ficha de voluntario: abrir tabs Servicios y Administrativo (skeleton → contenido), volver a abrir la misma ficha → carga instantánea (memo).
4. Biblioteca: 6 secciones colapsadas con contador; expandir "Reglamentos y Documentos" → tabla con 6 documentos; buscar "ROF-S" → solo esa sección se expande; limpiar → todo colapsado.
5. Celular: biblioteca colapsable + navegación normal.