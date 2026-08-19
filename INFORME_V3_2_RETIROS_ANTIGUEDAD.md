# INFORME V3.2 — RETIROS TEMPORALES, ANTIGÜEDAD Y REPARACIÓN DE CATÁLOGOS

### Sistema de Gestión Defensa Civil de Chile — Sede La Serena
**Versión:** 1.0 · **Fecha:** ago 2026 · **Estado:** IMPLEMENTADO Y VERIFICADO (esquema `1.2`, 30 hojas)

---

## 1. Alcance

1. **Retiros temporales** de voluntarios (hoja `RetirosTemporales`, 16 columnas) con reincorporación y anulación.
2. **Antigüedad con descuento configurable**: los retiros temporales pueden descontarse de la antigüedad institucional, de grado y de cargo según 3 parámetros nuevos en Config.
3. **Reparación estructural de catálogos** (`_repararCatalogosV2`): elimina el artefacto de siembra en fila 2 y los duplicados de los 9 catálogos.
4. **Corrección de la capa de escritura V2** (`_insertarFilaV2`/`_actualizarFilaV2`): bug latente que escribía vacíos todos los campos de las APIs V2 (solo aceptaba claves por nombre; todos los llamadores escriben con claves numéricas de columna).

## 2. Modelo de datos

### 2.1 Hoja `RetirosTemporales` (HOJA_V2.retirosTemporales)

| Col | Campo | Tipo | Notas |
|---|---|---|---|
| 1 | ID | número | correlativo |
| 2 | Voluntario ID | número → Voluntarios | |
| 3 | Sede ID | número → Sedes | |
| 4 | Fecha Inicio | fecha | inicio del retiro |
| 5 | Fecha Término | fecha | término previsto |
| 6 | Documento | texto | N° de resolución/nota |
| 7 | Fecha Documento | fecha | |
| 8 | Descripción Documento | texto | |
| 9 | Motivo | texto | |
| 10 | Observaciones | texto | |
| 11 | Estado | lista | `Activo` / `Finalizado` / `Anulado` |
| 12 | Fecha Reincorporación | fecha | se llena al reincorporar |
| 13 | Estado Anterior | texto | estado del voluntario al iniciar el retiro |
| 14 | Registrado Por | texto | correo de quien registra |
| 15 | Fecha Registro | fecha | |
| 16 | Última Actualización | fecha | |

### 2.2 Config (3 parámetros nuevos, tipo booleano, default `true`)

- `RETIRO_AFECTA_ANTIGUEDAD_INSTITUCIONAL` — si los períodos de retiro descuentan de la antigüedad institucional.
- `RETIRO_AFECTA_ANTIGUEDAD_GRADO` — ídem para la antigüedad en el grado actual.
- `RETIRO_AFECTA_ANTIGUEDAD_CARGO` — ídem para la antigüedad en el cargo actual.

### 2.3 Hoja de servicios (eventos automáticos)

`TIPOS_EVENTO_HOJA` (13 tipos) incluye `RETIRO_TEMPORAL` (creación) y `REINCORPORACION` (reincorporación); la anulación registra `SITUACION_ADMINISTRATIVA`. Los eventos se registran automáticamente en `HojaServicios` al crear/reincorporar/anular un retiro.

## 3. Funciones nuevas (35_Retiros.js + helpers en 21_MigracionV2.js)

| Función | Rol |
|---|---|
| `crearRetiroTemporalV2(datos)` | Crea retiro (`Activo`), valida voluntario activo, sin retiro activo previo, fecha término posterior al inicio; guarda `estadoAnterior`; registra evento `RETIRO_TEMPORAL`. |
| `reincorporarVoluntarioV2(retiroId, datos)` | Cierra retiro (`Finalizado`), restaura el estado anterior del voluntario, fecha reincorporación, evento `REINCORPORACION`. |
| `anularRetiroTemporalV2(retiroId, datos)` | Marca `Anulado` (sin efectos sobre antigüedad; requiere que el retiro no esté Finalizado). |
| `listarRetirosTemporalesV2(voluntarioId)` | Historial de retiros de un voluntario con `duracionTexto` derivada. |
| `obtenerAntiguedadV2(voluntarioId)` | Antigüedad institucional/de grado/de cargo con descuentos aplicados (`_calcularAntiguedadV2`, `_periodosDescontablesV2`, `_textoDuracionV2`). |
| `_repararCatalogosV2(ss)` / `_repararCatalogoV2(...)` | Reparación estructural idempotente (abajo). |
| `_nColsRef(nombre)` | Corrección: el mapa estaba indexado por claves de `HOJA_V2` pero se invocaba con nombres de hoja → las referencias nunca se detectaban (los duplicados con referencias se eliminaban en vez de desactivarse). |

## 4. Antigüedad

- Base: `fechaIngreso` del voluntario (o fecha de inicio del grado/cargo para las antigüedades específicas) hasta hoy.
- Períodos descontables: retiros `Activo` o `Finalizado` cuyo período (inicio→término) cae dentro del rango de la antigüedad (los `Anulados` nunca descuentan).
- Cada descuento es independiente y gobernado por su parámetro Config; descontar = false mantiene la antigüedad sin ajuste.
- Salidas: `dias`, `ms`, `texto` (formato `_textoDuracionV2`: años/meses/días, p. ej. `1 año`, `6 meses`, `45 días`) y `descontado` (indica si hubo ajuste real).

## 5. Reparación de catálogos (`_repararCatalogosV2`)

Aplica a los 9 catálogos: Grados, Cargos, Áreas, Especialidades, Subespecialidades, Unidades Internas, Tipos Servicio, Estados Asistencia, Tipos Documento.

1. **Artefacto de siembra en fila 2**: si `fila 2` tiene ID numérico (resto de la siembra original que creó la hoja con `insertRowAfter` mal posicionado), se inserta una fila vacía arriba (`insertRowAfter(PRIMERA_FILA_DATO - 2)`): el artefacto queda desplazado a la fila de datos sin sobrescribir filas existentes. Idempotente: en 2ª pasada la fila 2 está vacía.
2. **Duplicados** (por ID y, en Grados, también por nombre): la primera aparición se conserva; el duplicado **con referencias** (Historial Grados/Cargos, tablas que usan el ID) se **desactiva** (`activo=false` + observación "Duplicado detectado (V3.2) — conservado por referencias"); el duplicado **sin referencias** se **elimina**.
3. **Idempotencia verificada**: una 2ª ejecución sobre el mismo estado no mueve, no elimina ni re-desactiva nada (las filas ya inactivas no se vuelven a contar).

## 6. Corrección estructural de la capa de escritura V2 (bug latente)

`_insertarFilaV2` y `_actualizarFilaV2` leían los campos **solo por nombre** (`fila.personaId`), pero **todos** los llamadores V2 escriben con **claves numéricas de columna** (`fila[COL_PERSONA.personaId]`). Consecuencia: cada alta/actualización V2 escribía vacíos todos los campos salvo ID y fechas. Corregido en los helpers (aceptan ambas formas: `fila[k]` o `fila[String(col)]`), lo que arregla la capa de escritura de TODO el backend V2 sin tocar los llamadores. En `_actualizarFilaV2` además solo se aplican los campos presentes en `cambios` (nunca se tocan columnas ausentes) y `null`/`undefined` limpian el campo (semántica preservada).

## 7. Verificación

| Suite | Resultado |
|---|---|
| Harness V3.2 (`/tmp/opencode/test_v32.js`, 43 pruebas) | TODAS OK |
| Harness V2 (regresión, expectativas actualizadas a 13 eventos/30 hojas) | TODOS OK |
| Harness V3.1 (regresión) | TODOS OK |
| Harness core v0 (regresión, CONFIG_DEF 16 filas +3 RETIRO_*) | TODAS PASARON |
| Test rutas Web App (jsdom, 17 rutas) | TODAS OK |
| Auditoría UI (audit_ui_v2) | SIN FALLOS |
| `09_Pruebas.js` secciones V3.1 + V3.2 + API (69 asserts, mocks internos del editor) | 0 fallos |
| `node --check` (9 archivos backend+pruebas) | OK |

Cobertura del harness V3.2: constantes/config (1–6), antigüedad pura y validaciones (7–15), creación de retiros (16–20), reincorporación (21–26), segundo retiro + anulación (27–31), listado (32–33), antigüedad con descuento (34–37), reparación de catálogos (38–40: artefacto fila 2, duplicado con/sin referencias, idempotencia), integración con Servicios/nómina (`enRetiro` en asignación, nómina con antigüedad derivada) (41–43).

## 8. Pendiente del usuario (aplicación en la hoja real)

Ejecutar **una vez** desde el editor de Apps Script:

1. `crearEstructuraV2()` — crea la hoja `RetirosTemporales` y los 3 parámetros nuevos de Config (migración idempotente, no afecta lo existente).
2. `_repararCatalogosV2(SpreadsheetApp.getActiveSpreadsheet())` — elimina el artefacto de fila 2 y los duplicados de los catálogos sembrados (ver resultado en Log).