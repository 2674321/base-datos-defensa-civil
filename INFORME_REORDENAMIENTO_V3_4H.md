# INFORME REORDENAMIENTO V3.4H — Consolidación de Migraciones

**Fecha:** 18 de agosto, 2026
**Versión:** 0.8.4
**Deployment:** @28 (AKfycbzvc31oyce23p9X84TjI_gSpjWviJ3bslnh7jAIMGGPIgrhCUT-1YoD6QYO4XuAB1z-)
**Commit:** `78d4def`

---

## Resumen

Consolidación de 4 archivos de migración (37/38/39/40) en UN solo archivo `38_Migraciones.js`. Auditoría completa de dead code y estructura del proyecto. Actualización de AGENTS.md.

## Cambios realizados

### 1. Consolidación de migraciones

**Antes (4 archivos):**
- `37_MigracionesV34D.js` — migrarV34D (157 líneas)
- `38_MigracionesV34F.js` — migrarV34F (149 líneas)
- `39_MigracionesV34G.js` — migrarV34G (270 líneas)
- `40_MigracionesV34H.js` — resetYSembrarV34H (136 líneas)

**Después (1 archivo):**
- `38_Migraciones.js` — 624 líneas, todo consolidado

**Estructura del archivo consolidado:**
1. **Sección HISTORIAL** (comentada): migrarV34D, migrarV34F, migrarV34G + todos sus helpers
2. **Sección ACTIVA**: resetYSembrarV34H + helpers

Las migraciones ejecutadas (V3.4D/F/G) quedan como referencia histórica comentada. Solo V3.4H está activa.

### 2. Dead code eliminado

| Archivo | Función eliminada | Razón |
|---|---|---|
| `01_Utilidades.js` | `_quitarAcentos` | Nunca llamada |
| `01_Utilidades.js` | `_calcularDV` | Nunca llamada |
| `01_Utilidades.js` | `_formatearRUT` | Nunca llamada |
| `00_Diagnostico.js` | `describeSpreadsheet` | Solo diagnóstico inicial |
| `21_MigracionV2.js` | `_migrarDevolucionesV2` | Nunca llamada |
| `40_MigracionesV34H.js` | `_normV34H` | Redundante con `_norm` existente |
| `38_MigracionesV34F.js` | `_migrarV34F` (interno) | Código muerto, nunca llamado |

### 3. Hallazgos de auditoría

**21_UI_Personas.html** — Huérfano:
- Archivo existe en el repo (261 líneas)
- NO está incluido en `13_UI_Index.html`
- No hay ruta `#/personas` en el sidebar ni en `TITULOS`
- El módulo `PersonasModule` se auto-registra pero nunca se ejecuta
- **Decisión pendiente**: incluir en Index + ruta, o eliminar

**Otras observaciones (baja prioridad):**
- `listarParametrosV2()` en `32_ConfigV2.js:86` = wrapper innecesario de `obtenerConfiguracion()`
- `_configSi` en `35_Retiros.js:39` = función general que debería vivir en `01_Utilidades.js`
- `_nombreVoluntarioV2` en `34_Reportes.js:13` = función reutilizable que podría moverse a `01_Utilidades.js`

### 4. AGENTS.md actualizado

- §0: versión 0.8.4, deployment @28
- §9.3: tabla de módulos consolidada (38_Migraciones.js en lugar de 37/38/39/40)
- §11: 21_UI_Personas.html marcado como huérfano
- §12: entrada de historial de reordenamiento

## Verificación

- `node --check` en todos los archivos .js: ✅ (28 archivos)
- `clasp push` (50 archivos): ✅
- `clasp deploy` @28: ✅

## Pendiente para el usuario

1. **Ejecutar `resetYSembrarV34H()`** desde el editor de Apps Script si necesita re-siembra
2. **Decidir sobre `21_UI_Personas.html`**: ¿incluir en la Web App o eliminar?
3. **Probar la Web App** con Ctrl+Shift+R para verificar que todo funciona

## Archivos modificados

| Archivo | Acción |
|---|---|
| `38_Migraciones.js` | CREADO (consolidado) |
| `37_MigracionesV34D.js` | ELIMINADO |
| `38_MigracionesV34F.js` | ELIMINADO |
| `39_MigracionesV34G.js` | ELIMINADO |
| `40_MigracionesV34H.js` | ELIMINADO |
| `AGENTS.md` | MODIFICADO (§0, §9.3, §11, §12) |
