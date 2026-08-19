# INFORME V3.3 — INTEGRIDAD HISTÓRICA (cierre lógico, nunca borrar)

### Sistema de Gestión Defensa Civil de Chile — Sede La Serena
**Fecha:** ago 2026 · **Esquema:** 1.2 (sin cambio de versión) · **Deployment:** @16 (misma URL)

## 1. Objetivo

Eliminar toda pérdida de información por operaciones destructivas: las 7 funciones que usaban `deleteRow` ahora **cierran lógicamente** el registro (la fila permanece en la hoja con su historia completa). Un cierre **nunca reduce la cantidad de registros históricos**; solo cambia el estado de vigencia del registro.

## 2. Mecanismo de cierre (reglas aprobadas por el usuario)

| Tabla | Campo de cierre | Valor de cierre | Marcador en observaciones |
|---|---|---|---|
| Voluntario Especialidades | `activo` (col 11 NUEVA) | `false` | `Cierre (V3.3)` |
| Voluntario Capacitaciones | `activo` (col 12 NUEVA) | `false` | `Cierre (V3.3)` |
| Anotaciones | `activo` (col 12 NUEVA) | `false` | `Desactivación (V3.3)` |
| Documentos | `activo` (col 12 NUEVA) | `false` | `Desactivación (V3.3)` |
| Voluntario Credenciales | `estado` (ya existía) | `Revocada` | `Revocación (V3.3)` |
| Servicio Voluntarios | `estado` (ya existía) | `Retirado` o `Reemplazado` | `Retiro (V3.3)` |
| Permisos | `activo` (ya existía) | `false` | `Revocación (V3.3)` |

- **Fila vacía en `activo` = VIGENTE** (`_vigenteV2`, nuevo helper): las filas históricas existentes NO se tocan físicamente (no se rellena `true`). Solo los nuevos cierres escriben `false` explícitamente.
- **Idempotencia:** una 2ª ejecución del cierre devuelve `{ok:true, yaCerrado:true}` sin duplicar el motivo en observaciones ni alterar datos históricos.
- **Firmas compatibles:** todas las funciones aceptan `(id, datos?)` con `datos.motivo` opcional — los llamadores previos con `(id)` siguen funcionando.
- **Eventos HojaServicios:** solo los cierres de ESPECIALIDAD / CREDENCIAL / CAPACITACION generan 1 evento (y solo si `!yaCerrado`). Anotación/documento/servicio/permiso usan solo `_log` (el registro mismo es el acta).
- **deleteRow legítimos conservados:** `_sincronizarGradosV2`, `_repararCatalogoV2` (21_MigracionV2.js) y el recorte del Log (01_Utilidades.js). v0 (`Voluntarios`, `Entregas`) no se tocó.

## 3. Migración de columnas (idempotente y no destructiva)

`_migrarColumnasV2(ss, nombre, encabezados, nCols)` en `21_MigracionV2.js`:

- Si `getLastColumn() < nCols` → `insertColumnsAfter` con SOLO las columnas faltantes + encabezados + formato (patrón de `_migrarColumnas` de 08_Config.js).
- Nunca elimina ni reordena columnas; conserva todas las filas.
- Se ejecuta en `crearEstructuraV2` para las 30 hojas (reporta `migradasV33` en el Log/resumen); re-ejecutable sin duplicar columnas.
- Tablas afectadas (al agregar `Activo` al final): Voluntario Especialidades (+1), Voluntario Capacitaciones (+1), Anotaciones (+1), Documentos (+1). El resto queda `agregadas: 0`.

## 4. Consultas derivadas corregidas (las cerrar aparecían como vigentes)

- `obtenerVencimientosV2` (25): excluye relaciones con `estado='Revocada'` (consumido por 34_Reportes.js:73/192).
- `obtenerCapacitacionesVencidasV2` (26): excluye relaciones inactivas (consumido por 34_Reportes.js:74/200).
- `listarServiciosV2` (27): el contador `asignados` ignora Retirado/Reemplazado.
- `obtenerServicioV2(servicioId, opciones?)` (27): `asignados` = solo vigentes; nuevo array `cerrados` (historial); con `{incluirCerradas:true}` todo junto.
- `asignarVoluntariosServicioV2` (27): `yaAsignados` ignora las cerradas → **re-asignar a un voluntario retirado crea una fila NUEVA** (antes quedaba bloqueado o la reasignación rompía el historial).
- `listarCredencialesVoluntarioV2(voluntarioId, opciones?)` (25): respeta `Revocada` de la relación sobre el estado derivado del catálogo; oculta por defecto.
- `listarEspecialidadesVoluntarioV2` / `listarCapacitacionesVoluntarioV2` / `listarAnotacionesVoluntarioV2` / `listarDocumentosVoluntarioV2` (24/26/29): solo vigentes por defecto; `{incluirCerradas:true}` para historial (cada item expone `activo`).
- `_requisitosGrado` (23_GradosCargos.js): `nEspecialidades` cuenta SOLO relaciones activas.
- `listarPermisosV2` (33): SIN filtro — sigue mostrando todas las excepciones con su `activo` (vista administrativa de lo revocado; decisión documentada).
- `permisoUsuarioV2` (33): ya leía `_bool(p.activo, true)` — sin cambios.

## 5. UI (4 pantallas, sin rediseño)

| Pantalla | Antes | Ahora |
|---|---|---|
| 23_UI_Especialidades | "Quitar asignación" | "Cerrar relación" |
| 24_UI_Credenciales | "Quitar credencial" | "Revocar credencial" |
| 25_UI_Capacitaciones | "Quitar capacitación" | "Cerrar relación" |
| 28_UI_Usuarios | "Eliminar excepción" | "Revocar excepción" |

Mensaje de confirmación estándar: *"Esta acción no eliminará el registro histórico. La relación quedará cerrada y permanecerá disponible en el historial."* (Servicios/Anotaciones/Documentos no tienen botón de quitar en la UI: API-only).

## 6. Verificación

- **test_v33 (nuevo harness CLI, /tmp/opencode/test_v33.js): 31/31** — migración de columnas (agrega/idempotente/datos intactos), 7 cierres (fila conservada, estado de cierre, motivo una sola vez, 2ª ejecución `yaCerrado`), consultas (vencimientos/vencidas/listas/requisitos), re-asignación tras retiro con fila NUEVA, sin duplicación de vigentes.
- **09_Pruebas (autodiagnóstico, extracción node): 115 OK** — nuevo bloque 12b4/12b5 (constantes V3.3, `_sinDeleteRow` en las 7 funciones, cierres con mocks) + V3.1 + V3.2 + V2 puras + API (corregido `eval` con try/catch para funciones v0 no cargadas en CLI; 7 funciones V3.3 agregadas a la lista de API).
- **Regresión completa:** test_core OK, test_v2 33/33 OK, test_v31 15/15 OK, test_v32 43/43 OK, test_rutas_v2 TODAS LAS RUTAS OK (0 errores JS), audit_ui_v2 SIN FALLOS, `node --check` en los 18 `.js` + extracción `<script>` de las 4 pantallas editadas.
- Ninguna prueba previa requirió cambio de expectativa (las 7 funciones no estaban ejercitadas antes).

## 7. Archivos modificados

Backend: `00_Constantes.js` (cols/encabezados), `21_MigracionV2.js` (`_migrarColumnasV2`, `_cerrarFilaV2`, `_vigenteV2`, resumen crearEstructuraV2), `24_Especialidades.js`, `25_Credenciales.js`, `26_Capacitaciones.js`, `27_Servicios.js`, `29_HojaServicios.js`, `33_Usuarios.js`, `23_GradosCargos.js`, `09_Pruebas.js`.
Frontend: `23_UI_Especialidades.html`, `24_UI_Credenciales.html`, `25_UI_Capacitaciones.html`, `28_UI_Usuarios.html`.
Docs: `AGENTS.md` (historial §12), `MODELO_DATOS_V2.md`, `INFORME_ARQUITECTURA_V3.md` (banner).

## 8. Pendiente para el usuario

1. Ejecutar `crearEstructuraV2()` una vez desde el editor de Apps Script → aplica la migración de columnas `Activo` en las 4 hojas (verificar en Log: "columnas V3.3").
2. Recarga forzada de la Web App (Ctrl+Shift+R o `?new=1`).