# INFORME V3.4G — CORRECCIÓN: BIBLIOTECA, GRADOS, ESTRUCTURA DE NIVELES (SCI/RADIOAFICIONADO), RPAS Y LIMPIEZA DE OBSERVACIONES (versión 0.8.3)

**Fecha:** ago 2026 · **Deployment:** @26 (misma URL: `AKfycbxmPwM2BsWL42gqvoLg9RShm246tizyBRewLvo9yEgj7aYx8ZWBptSnSJ0i4kb32fU`) · **Backup pre-migración:** `/tmp/opencode/hoja_actual.xlsx` (estado V3.4A, 36 hojas)

## 1. Alcance

Corrección de la **biblioteca** (`32_UI_Biblioteca.html`), la **estructura de niveles** de SCI y Radioaficionado, el modelado **RPAS** y la **limpieza de observaciones** con referencias a fases de desarrollo (V3.4A–F) que habían quedado visibles al usuario. Se corrige el diseño de datos heredado de V3.4F (SCI con 5 subespecialidades de nivel, 4 habilitaciones RPAS como subespecialidades) hacia el modelo V3.4G: **los niveles viven en la especialidad/subespecialidad, los modelos RPAS en la credencial del voluntario** — y se limpia el texto de observaciones de todas las tablas visibles.

## 2. Backend

### 2.1 `39_MigracionesV34G.js` (nuevo) — `migrarV34G()` idempotente

Ejecutar una vez desde el editor (Editor → `migrarV34G`). Con `LockService` (tryLock 20 s). Flujo:

1. **`_migrarColumnasV2`** (idempotente, solo faltantes, al final): `Especialidades.niveles` (8), `Subespecialidades.niveles` (8), `VolCredenciales.nivel` (9) + `modelosHabilitados` (10).
2. **`_migrarNivelesV2`**: fija `niveles` de la especialidad **SCI** = `Introductorio; Básico Online; Básico; Intermedio; Avanzado` y de la subespecialidad **Radioaficionado** = `Aspirante; Novicio; General` (idempotente; solo si difieren).
3. **`_migrarSubsNivelV2`**: elimina del catálogo las 5 subespecialidades de nivel SCI y las 4 habilitaciones RPAS (MAVIC SERIES / MINI 2 / ENTERPRISE 3 / ENTERPRISE 3 PRO). Antes de borrar, **cierra (activo=false)** cualquier asignación vigente en VolEspecialidades (motivo claro), conservando las observaciones. Iteración en orden inverso por fila (borrado seguro) y devuelve las habilitaciones RPAS en orden para el seed.
4. **`_migrarModelosRpasV2`**: traslada los modelos de las habilitaciones RPAS a la credencial del voluntario (`VolCredenciales.modelosHabilitados`), marcando los no verificados con **`(DEMO)`** (ENTERPRISE 3 / ENTERPRISE 3 PRO), e ignora relaciones Revocadas.
5. **`_migrarNivelRadioV2`**: fija nivel **'Novicio'** (si vacío) en la licencia de radioaficionado.
6. **`_limpiarObservacionesV2`**: limpia de referencias a fases (V3.4A–F) y de texto de migración las columnas de Observaciones (y de responsable) de **todas las tablas visibles** (V2 + v0): Credenciales, VolCredenciales, VolEspecialidades, VolCapacitaciones, HistorialGrados/Cargos, Asistencia, Servicios, Unidades, IntegrantesUnidad, VoluntariosV2, Personas, RetirosTemporales, Anotaciones, Documentos, Entregas/Inventario/Voluntarios (v0). El historial de fases vive en el Log / historial técnico.

Resultado en Log (`_log`): `migrarV34G OK — <creados>; omitidos: N; detalles`.

### 2.2 Catálogo (00_Constantes.js)

- `ESPECIALIDADES_V2` = **9** — SCI es UNA especialidad RECONOCIDA con `niveles` en el campo (no subespecialidades).
- `SUBESPECIALIDADES_V2` = **2**: Radioaficionado (con niveles `Aspirante; Novicio; General`, INTERNO, de Telecomunicaciones) y Stop The Bleed (Auxiliar de Sanidad). **Se eliminaron los 5 niveles SCI y las 4 habilitaciones RPAS como subespecialidades.**
- `PREFIJOS_INDICATIVO_RADIO` = `{ Aspirante: 'CD', Novicio: 'CA', General: 'CE' }`.
- `COL_ESPECIALIDAD.niveles = 8`, `COL_SUBESPECIALIDAD.niveles = 8`, `COL_VOL_CREDENCIAL.nivel = 9` / `.modelosHabilitados = 10`.
- Versión **0.8.3 — V3.4G**.

### 2.3 Coherencia con V3.4F (`38_MigracionesV34F.js`)

`_migrarSciV2` es **V3.4G-aware**: si la especialidad SCI ya tiene `niveles` en el campo (col 8), retorna temprano sin recrear las subespecialidades de nivel → **la 2ª pasada de `migrarV34F` después de `migrarV34G` no re-introduce las subespecialidades** (restaura la idempotencia de la secuencia V3.4F → V3.4G → V3.4F).

## 3. Frontend

- **`32_UI_Biblioteca.html`**: subespecialidades ya no muestran los niveles SCI ni las habilitaciones RPAS como subespecialidades; la sección de niveles se lee del campo `niveles` de la especialidad/subespecialidad.
- **`23_UI_Especialidades.html`** / **`24_UI_Especialidades.js`**: se muestra y edita el campo `niveles` de especialidades y subespecialidades; la ficha de asignación ofrece niveles desde `e.niveles`.
- **`24_UI_Credenciales.html`** / **`25_Credenciales.js`**: se muestra y edita `nivel` y `modelosHabilitados` en la relación credencial–voluntario.
- **`18_UI_Ficha.html`**: muestra `modelosHabilitados` en la credencial RPAS y el `nivel` en la radioaficionado.
- **`13_UI_Parches.html`**: META con `niveles` para SCI y Radioaficionado.
- **`13_UI_App.html`**: `PROYECTO_VERSION = '0.8.3'`.

## 4. Restricciones respetadas

- NO motor/evaluación de ascensos; NO permisos avanzados; NO multi-sede; NO bitácoras RPAS/Telecom; NO workflows; NO informe DG.
- Deployment sobre la MISMA URL (@26), sin deployments paralelos.
- `ESPECIALIDADES_V2`/`SUBESPECIALIDADES_V2` son arrays de **6 columnas** `[Nombre, Área, Descripción, Origen, Activo, Niveles]` → niveles en índice 5 de la constante (el mapa de hoja `COL_ESPECIALIDAD` es de 8 columnas; NO usar `COL_ESPECIALIDAD.niveles - 1`).

## 5. Pendiente usuario

1. Ejecutar **`migrarV34G()`** una vez desde el editor (autorizar si pide) y verificar el Log. ⚠️ `clasp run migrarV34G` **no funciona** (límite OAuth de clasp, ver AGENTS.md §6) — ejecutar manualmente desde script.google.com.
2. Verificación visual en /dev (recarga forzada): Biblioteca (niveles SCI/Radioaficionado como dato, sin subespecialidades duplicadas), Credenciales (modelos RPAS y nivel radio), Especialidades (campo niveles), Ficha (modelosHabilitados), y que las observaciones ya no mencionen "V3.4A–F".

## 6. Verificación (todo verde)

| Harness | Resultado |
|---|---|
| **test_v34g.js** (nuevo, 45 pts: backend + DOM) | **45/45** |
| test_v34f.js | **29/29 + DOM TODO OK** |
| test_v34d.js | 46/46 |
| test_v34e.js | 29/29 + DOM |
| test_v33.js | 31/31 |
| test_v2.js / v31 / v32 / v34_estructura / v34b / seed_demo | OK |
| test_ux.js | TEST UX OK |
| test_rutas_v2.js | TODAS LAS RUTAS OK |
| audit_ui.js / audit_ui_v2.js | SIN FALLOS |
| check_ui.js | TODO OK (versión 0.8.3) |
| node --check | OK |

Ajustes de harness en esta fase: `test_v34f.js` (nombre real de SCI `'sistema de comando de incidentes (sci)'`, niveles leídos de índice `[5]` del array constante y normalizados por acentos — constante usa `Básico`, la lista esperada sin acento), `check_ui.js` (assert de versión → 0.8.3).
