# INFORME V3.4F — CONSOLIDACIÓN FINAL (versión 0.8.2)

**Fecha:** ago 2026 · **Deployment:** @25 (misma URL: `AKfycbxmPwM2BsWL42gqvoLg9RShm246tizyBRewLvo9yEgj7aYx8ZWBptSnSJ0i4kb32fU`) · **Backup pre-migración:** `/tmp/opencode/hoja_actual.xlsx` (estado V3.4A, 36 hojas)

## 1. Alcance

Fase de consolidación final que cierra el plan V3.4A–E sobre la hoja real (quedó en V3.4A; las fases C/D/E nunca se ejecutaron en ella). Sin funcionalidad nueva fuera del plan: correcciones de datos idempotentes + 3 mejoras de frontend + verificación integral (49 puntos §6 + regresión completa).

## 2. Backend

### 2.1 `38_MigracionesV34F.js` (nuevo) — `migrarV34F()` idempotente

Ejecutar una vez desde el editor (Editor → `migrarV34F`). Flujo con `LockService` (sin locks anidados; el seed toma el suyo):

1. **`_migrarEspecialidadSanidadV2`** (de 37): renombra 'Sanidad' → 'Auxiliar de Sanidad' por ID, ANTES del seed (el seed busca el nombre nuevo). Idempotente; maneja el caso ambos-nombres-existen.
2. **`_migrarStopTheBleedV2`**: fija `especialidadId` de la subespecialidad 'Stop The Bleed' → Auxiliar de Sanidad (en la hoja real quedó sin especialidad).
3. **`_migrarSciV2`**: crea especialidad **'Sistema de Comando de Incidentes (SCI)'** origen **RECONOCIDA** (área A-3 Operaciones) + 5 niveles como subespecialidades (Introductorio, Básico Online, Básico, Intermedio, Avanzado). **Se siembra el catálogo pero NO se asigna a nadie.**
4. **`crearDatosDemoV2()`** (lock propio): corrige la hoja real — licencia radio Novicio CA2OPX N° "No informado", 4 habilitaciones RPAS separadas, A-4, unidades (Operadores RPA **Activa**, GRA **'En formación'**).
5. **`_migrarEmisorRadioV2`**: emisor **SUBTEL** en la licencia de radioaficionado (si vacío).

Resultado en Log (`_log`): `migrarV34F OK — <creados>; omitidos: N; detalles`.

### 2.2 `36_SeedDemo.js` — idempotencia V3.4F (2 fixes reales)

- **`_seedGradoV2`**: antes, en re-ejecución `asignarGradoV2` cerraba el grado vigente y el 'Voluntario' de ingreso se re-creaba (filas HG duplicadas). Ahora: si el voluntario ya tiene un grado vigente de **igual o menor jerarquía** (orden), omite; si el sembrado es **superior** al vigente, procede (promoción legítima, ej. Patricio Voluntario → Voluntario Mayor en la misma pasada).
- **`_seedServicios`**: los marcajes de asistencia se re-aplicaban en cada pasada (`registrarAsistenciaV2` cuenta las actualizaciones como "aplicados"). Ahora filtra voluntarios con marcaje previo para el servicio (por `servicioVoluntarios` Retirado/Reemplazado y por filas de Asistencia existentes) → la 2ª pasada reporta **0 creados**.

### 2.3 Catálogo (00_Constantes.js)

- `ESPECIALIDADES_V2` = **9** (+ SCI RECONOCIDA); `SUBESPECIALIDADES_V2` = **7** (+ 5 niveles SCI RECONOCIDA).
- `GRADOS_V2` = 6 (Jefe de Sede NO es grado, confirmado).
- Versión **0.8.2 — V3.4F**.

### 2.4 Cargos múltiples (23_GradosCargos.js, 22_Personas.js)

- `asignarCargoV2` NO cierra el cargo vigente anterior (coexisten); rechaza re-asignar el mismo cargo vigente (`DUPLICADO`).
- `terminarCargoV2(id, datos)` / `terminarCargoVoluntarioV2(volId, cargoId, datos)` idempotentes (`yaCerrado`).
- `obtenerCargosVigentesV2` y `obtenerPersonaV2.cargosVigentes` (con `cargoVigente` = el más reciente por fechaDesde).

## 3. Frontend

- **`22_UI_GradosCargos.html`**: Jefe de Sede (distintivo d-2, origen CARGO) insertado **entre Comandante Local e Instructor Mayor** (bug: antes quedaba después de Instructor Mayor); pestaña Cargos con botón **'Cerrar cargo'** + modal (voluntario, select de cargo, fecha de término).
- **`32_UI_Biblioteca.html`**: header V3.4F; sección Grados y Distintivos reordenada (Comandante Local → **Jefe de Sede** → Instructor Mayor → Instructor → Sub Instructor → Voluntario Mayor → Voluntario → Radioaficionado CA2OPX); Especialidades incluye SCI; Subespecialidades incluye los 5 niveles; `ORIGEN_CLASE` + `RECONOCIDA:'info'`; `CARGO_CONDICION = 'Cargo/condición de mando'` — ficha con fila **Condición** y tarjeta con badge (nunca badge 'CARGO').
- **`13_UI_Parches.html`**: entrada META **e-7** (SCI, RECONOCIDA, A-3 Operaciones) → `App.meta('Sistema de Comando de Incidentes (SCI)')` funciona (20 entradas META).
- **`13_UI_Styles.html`**: `@media (max-width: 480px)` para `.chip`/`.parche` (parches legibles en móvil).

## 4. Restricciones respetadas

- NO motor/evaluación de ascensos; NO permisos avanzados; NO multi-sede; NO bitácoras RPAS/Telecom; NO workflows; NO informe DG.
- Deployment sobre la MISMA URL (@25), sin deployments paralelos.

## 5. Pendiente usuario

1. Ejecutar **`migrarV34F()`** una vez desde el editor (autorizar si pide) y verificar el Log.
2. Verificación visual en /dev (recarga forzada): Grados y Cargos (Jefe de Sede en posición 2, Cerrar cargo), Biblioteca (SCI con badge RECONOCIDA, Jefe de Sede con 'Cargo/condición de mando'), Ficha (2 chips de cargo, especialidades sin duplicar).

## 6. Verificación (todo verde)

| Harness | Resultado |
|---|---|
| **test_v34f.js** (nuevo, 49 pts: 27 backend + 22 DOM) | **49/49** |
| test_v2.js | TODOS OK |
| test_v34d.js | 46/46 |
| test_v34e.js | TODO OK |
| test_seed_demo.js | 101/101 |
| test_ux.js | TEST UX OK |
| test_rutas_v2.js | TODAS LAS RUTAS OK |
| test_core / v31 / v32 / v33 / v34_estructura / v34b | OK |
| audit_ui.js / audit_ui_v2.js | SIN FALLOS |
| check_ui.js | TODO OK |
| node --check (7 .js editados + scripts de 6 HTML) | OK |

Ajustes de harness en esta fase: test_v2 (9 esp / 7 sub), test_seed_demo (11 subs), audit_ui_v2 (exportados incluyen 13_UI_Parches: App.meta/metaLista).