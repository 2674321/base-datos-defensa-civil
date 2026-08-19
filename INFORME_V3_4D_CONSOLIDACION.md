# INFORME V3.4D — CONSOLIDACIÓN OPERACIONAL (vestuario bajo cargo, entrega múltiple, licencia de radio, parches, biblioteca)

**Fecha:** 18/08/2026 · **Fase:** V3.4D · **Alcance:** backend (`37_MigracionesV34D.js` nuevo, `registrarEntregaMultipleV2`, fix de escritura por fila) + frontend (entrega múltiple, parches reales, Biblioteca Institucional) · **Deployment:** @22 (misma URL)

---

## 1. Objetivo

Cerrar la consolidación operacional solicitada por el usuario:

1. **Vestuario personal bajo cargo SIN devolución** (12 elementos): Catálogo → `Requiere Devolución=false`; entregas pendientes → `Entregado` con marcador V3.4D en Observaciones; todo idempotente y completo **en una sola ejecución**.
2. **Renombre 'Sanidad' → 'Auxiliar de Sanidad'** (por ID, sin tocar el área).
3. **'Operador RPAS'** como especialidad interna (nombre; la licencia DGAC 16418 respalda, no reemplaza) y **licencia de radioaficionado 'No informado'** cuando no exista credencial.
4. **Columnas foto** en Personas (Foto Drive ID / Fecha / Estado) y **Fecha Término + Institución Solicitante** en Servicios.
5. **Entrega MÚLTIPLE** en Entregas: N lotes por wizard (1–50), validaciones en backend, resultado parcial, nada escrito si el lote falla.
6. **Alertas**: stock 0 NO alerta (guard `stock > 0`).
7. **Parches reales** (3 imágenes institucionales como data URI) en 13_UI_Parches.
8. **Biblioteca Institucional** (página nueva).
9. Versión **0.8.0 — V3.4D**.

## 2. Cambios por archivo

| Archivo | Cambio |
|---|---|
| `37_MigracionesV34D.js` | **NUEVO** — `migrarV34D()` idempotente con `_migrarVestuarioBajoCargoV2` + `_renombrarEspecialidadV34D` + `_migrarColumnasV2` (reutiliza 21): (a) vestuario bajo cargo (12 elementos, `VESTUARIO_BAJO_CARGO`): voltea `Requiere Devolución` y reclasifica entregas `Pendiente de devolución` → `Entregado` + marcador "(V3.4D: reclasificada — entrega bajo cargo, sin devolución)" en Observaciones; (b) renombre Sanidad → Auxiliar de Sanidad (por ID, ID conservado, área intacta); (c) columnas foto Personas + Fecha Término/Institución Solicitante Servicios; (d) creación de especialidad 'Operador RPAS' (área Telecomunicaciones) si no existe; (e) `_licenciaRadioV2` → 'No informado' si no hay credencial `/^licencia de radioaficionado/i`. **FIX REAL (detectado por test_v34d)**: las escrituras usaban `getRange(fila0, col, n, 1).setValues(...)` asumiendo filas CONSECUTIVAS; con filas no consecutivas (ej. fila vacía o 'Casco' entre medio) corrompía filas intermedias y NO volteaba las filas objetivo → reemplazado por escritura POR FILA (`setValue`) en catálogo y entregas, y el flip se refleja en memoria para que la reclasificación ocurra en la MISMA ejecución (antes recién en la 2ª, rompiendo la idempotencia percibida) |
| `31_EquipamientoV2.js` | `registrarEntregaMultipleV2(lote, datos)` (nuevo): lote 1–50, voluntario válido, duplicados rechazados (mismo elemento+talla), serie → cantidad=1, talla ≤ 30 caracteres, stock suficiente y estado `Disponible`, estado derivado del catálogo (bajo cargo → `Entregado`), NADA escrito si el lote falla (rollback total), `{registradas, errores, parcial}`; `obtenerAlertasV2` (34) con `guard: stock > 0` (stock 0 NO alerta) |
| `00_Constantes.js` | `VESTUARIO_BAJO_CARGO` (12), `COL_PERSONA` foto 20/21/22 + `N_COLS_PERSONA=22`, `COL_SERVICIO` fechaTermino 24 / institucionSolicitante 25 + `N_COLS_SERVICIO=25` (V2), `ESTADO_ENTREGA_SIN_DEVOLUCION='Entregado'`, `HOJA_V2.tiposServicio='Tipos Servicio'` (corregido el nombre con espacio) |
| `17_UI_Entregas.html` | **Entrega múltiple**: 1.er paso modal de lote (1–50 filas), botón "Entrega múltiple" en modo actual, filas con elemento/talla/cantidad (`.ent-fila`), validaciones de fila en vivo, guardado vía `registrarEntregaMultipleV2`, resultado `{registradas, errores, parcial}` con toast; `ent-nueva` resetea con `reiniciarWizard()` (conserva modo+voluntario); `aplicarConjunto` usa `pintarTabla(w.inventario)` |
| `13_UI_Styles.html` | CSS entrega múltiple: `.ent-modos`, `.ent-modo` (uso token `--radio-pill`), `.ent-fila`, `.ent-col-sel`, `.ent-talla`, `.ent-cantidad`, `.ent-fila-sin`; `.fila-entre` (tabla de filas) y `.foto-voluntario.sin-foto` (placeholder foto sin imagen) |
| `13_UI_Parches.html` | DATA con **3 imágenes reales** (data URI PNG 256 px / 128 colores ≈19–28 KB): `especialidades.rpas` (Operador RPAS), `especialidades.radioaficionado` (Radioaficionado), `parches['fuerza de tarea delta']` (Fuerza de Tarea Delta); ALIAS `"operador rpas": "rpas"` (auto-aliases eliminados) |
| `32_UI_Biblioteca.html` | **NUEVO** — Biblioteca Institucional: 6 secciones (Normativa y reglamento, Procedimientos operativos, Formación y capacitación, Formularios, Comunicaciones, Prevención y difusión), filtro de búsqueda instantáneo, badges Disponible/Próximamente, SIN imágenes externas |
| `13_UI_App.html` | `TITULOS.biblioteca = 'Biblioteca Institucional'`; `PROYECTO_VERSION = '0.8.0 — V3.4D'` |
| `13_UI_Index.html` | Include `32_UI_Biblioteca` (tras 13_UI_Parches), nav-item "Biblioteca Institucional" (icono libro, tras Usuarios), `<section id="page-biblioteca" hidden>` |

## 3. Harnesses actualizados

| Harness | Cambio | Resultado |
|---|---|---|
| `test_v34d.js` | **NUEVO** (46 tests): A) 10 constantes (VESTUARIO_BAJO_CARGO, columnas, estados, HOJA_V2); B) 22 tests `registrarEntregaMultipleV2` (lote vacío/límites 1–50, duplicados, stock, serie→1, talla ≤30, estado derivado del catálogo, parcial, rollback total — nada escrito si el lote falla); C) 14 tests foto Personas (`fotoDriveId`/`fotoFecha`/`fotoEstado` en crear/actualizar/obtener), Servicios (`tipoServicioId` obligatorio — **el parámetro real; `tipoId` no existe** —, fechaTermino e institución persistidos, fecha inválida rechazada, actualización), alertas (stock 0 NO alerta, stock ≤ umbral SÍ con severidad critica), migración completa EN UNA ejecución (flip + reclasificación + renombre) + **idempotencia** (2ª ejecución sin cambios) | **46/46 OK, 0 FALLO(s)** |
| `test_v2.js` | Personas con 22 columnas, Servicios 25, versiones | **TODOS LOS TESTS V2 OK** |
| `test_v34_estructura.js` | Lista eval incluye `37_MigracionesV34D.js` | **28/28 OK** |
| `test_seed_demo.js` | Lista eval + 'Sanidad' → 'Auxiliar de Sanidad' en expectativas | **101/101 OK** |
| `test_rutas_v2.js` | Includes + ruta `biblioteca` (19 rutas) | **19/19 OK, 0 errores JS** |
| `check_ui.js` | Includes Index 20, versión 0.8.0 | **TODO OK** |

## 4. Regresión completa (todas verdes)

- `node --check` backend + JS de todos los `.html` (extracción con Python): **OK**.
- test_core OK · test_v2 OK · test_v31 OK · test_v32 OK · test_v33 OK · test_v34_estructura 28/28 · test_v34b_integracion OK · test_seed_demo 101/101 · test_ux OK · test_rutas_v2 19/19 · **test_v34d 46/46**.
- audit_ui_v2 SIN FALLOS · audit_ui SIN FALLOS · check_ui TODO OK.

## 5. Deployment

`clasp push` (todos los archivos) + `clasp deploy -d "V3.4D consolidación"` → **@22** (`AKfycbxmPwM2BsWL42gqvoLg9RShm246tizyBRewLvo9yEgj7aYx8ZWBptSnSJ0i4kb32fU`), misma URL. (Un deploy duplicado @23 creado por error se eliminó con `clasp undeploy`.)

## 6. Pendiente usuario

- Recarga forzada en /dev (Ctrl+Shift+R o `?new=1`).
- Verificar visualmente: entrega múltiple (botón y modal de lote), parches reales (RPAS, Radioaficionado, Fuerza de Tarea Delta) en Ficha/Especialidades, página Biblioteca Institucional, versión 0.8.0 — V3.4D en el sidebar.
- Opcional: ejecutar `migrarV34D()` una vez desde el editor (Editor → ejecutar → migrarV34D → autorizar) para aplicar el renombre, la reclasificación de entregas y las columnas nuevas en la hoja real.