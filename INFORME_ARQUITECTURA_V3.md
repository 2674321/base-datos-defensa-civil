# INFORME DE ARQUITECTURA V3 — AUDITORÍA MAESTRA Y CONSOLIDACIÓN

### Sistema de Gestión Defensa Civil de Chile — Sede La Serena
**Versión:** 1.0 · **Fecha:** ago 2026 · **Estado:** auditoría SOLO LECTURA (no se modificó código, backend, frontend, hojas ni deployments)

> **ACTUALIZACIÓN V3.4G (ago 2026, aprobada e implementada, deployment @26):** CORRECCIÓN — BIBLIOTECA, GRADOS, ESTRUCTURA DE NIVELES (SCI/RADIOAFICIONADO), RPAS Y LIMPIEZA DE OBSERVACIONES (versión 0.8.3). `39_MigracionesV34G.js` + `migrarV34G()` idempotente (Editor): columnas nuevas idempotentes — `Especialidades.niveles` (8), `Subespecialidades.niveles` (8), `VolCredenciales.nivel` (9) + `modelosHabilitados` (10); **SCI = UNA especialidad RECONOCIDA con `niveles` en el campo** (`Introductorio; Básico Online; Básico; Intermedio; Avanzado`), ya NO como subespecialidades (se eliminan las 5 subs de nivel SCI y las 4 habilitaciones RPAS de V3.4F, cerrando asignaciones vigentes); **Operador RPAS = única especialidad INTERNA**, los modelos habilitados se trasladan a la credencial del voluntario (`modelosHabilitados`, marcando no verificados con `(DEMO)`); Radioaficionado = 1 sub de Telecomunicaciones con `niveles` `Aspirante; Novicio; General` + nivel 'Novicio' fijado en la licencia; **limpieza de observaciones** de referencias a fases V3.4A–F en todas las tablas visibles (V2 + v0). `ESPECIALIDADES_V2` = **9** (SCI con niveles en campo), `SUBESPECIALIDADES_V2` = **2** (Radioaficionado con niveles, Stop The Bleed), `GRADOS_V2` = 6. Coherencia V3.4F: `_migrarSciV2` (38) es V3.4G-aware (no recrea subs si SCI ya tiene niveles). Verificación: test_v34g 45/45, test_v34f 29/29 + DOM TODO OK, regresión completa verde. Detalle: `INFORME_V3_4G_CORRECCIONES.md`.

> **ACTUALIZACIÓN V3.4F (ago 2026, aprobada e implementada, deployment @25):** CONSOLIDACIÓN FINAL (versión 0.8.2). `38_MigracionesV34F.js` + `migrarV34F()` idempotente (Editor): renombre 'Sanidad'→'Auxiliar de Sanidad' por ID ANTES del seed, Stop The Bleed vinculada a la especialidad de sanidad, **SCI** — especialidad 'Sistema de Comando de Incidentes (SCI)' origen RECONOCIDA (área A-3 Operaciones) + 5 niveles como subespecialidades (catálogo sembrado, SIN asignar) —, `crearDatosDemoV2()` con lock propio (sin locks anidados), emisor SUBTEL. `ESPECIALIDADES_V2` = **9** (+SCI), `SUBESPECIALIDADES_V2` = **7** (+5 niveles SCI), `GRADOS_V2` = 6 (Jefe de Sede NO es grado: es DISTINTIVO d-2 origen CARGO — grado Instructor Mayor, área Mando, '3 barras' UNI 2018). **Cargos múltiples** (23_GradosCargos/22_Personas): `asignarCargoV2` no cierra el vigente (coexisten; mismo cargo vigente → DUPLICADO), `terminarCargoV2`/`terminarCargoVoluntarioV2` idempotentes (`yaCerrado`), `obtenerCargosVigentesV2` + `cargoVigente`. **Seed idempotente** (36_SeedDemo.js): `_seedGradoV2` omite grados de igual/menor jerarquía vigentes (permite promoción Voluntario→Voluntario Mayor) y `_seedServicios` no re-aplica marcajes existentes (2ª pasada = 0 creados). UI: Jefe de Sede entre Comandante Local e Instructor Mayor, botón 'Cerrar cargo', biblioteca con SCI/RECONOCIDA y 'Cargo/condición de mando', parches responsive 480 px. Verificación: test_v34f 49/49 + regresión completa verde. Detalle: `INFORME_V3_4F_CORRECCIONES.md`.

> **ACTUALIZACIÓN V3.3 (ago 2026, aprobada e implementada):** FASE "INTEGRIDAD HISTÓRICA" (esquema `1.2`, deployment @16). Las 7 funciones destructivas (quitarEspecialidadV2, quitarCredencialV2, quitarCapacitacionV2, quitarVoluntarioServicioV2, quitarAnotacionV2, quitarDocumentoV2, eliminarPermisoV2) dejaron de usar `deleteRow` y pasan a **cierre lógico** (la fila NUNCA se elimina): `activo=false` (VolEspecialidades/VolCapacitaciones/Anotaciones/Documentos — columna nueva al final, vacío = vigente), `estado='Revocada'` (VolCredenciales), `Retirado`/`Reemplazado` (ServicioVoluntarios) y `activo=false` (Permisos, ya existente); motivo concatenado en observaciones con marcador V3.3, **idempotente** (2ª ejecución: `yaCerrado:true`, sin duplicados). Migración idempotente `_migrarColumnasV2` (insertColumnsAfter solo de columnas faltantes, nunca destruye) ejecutada en `crearEstructuraV2`. Consultas derivadas corregidas: vencimientos/vencidas excluyen revocadas e inactivas, conteos de servicios y `yaAsignados` ignoran retirados (re-asignación = fila NUEVA), requisitos de ascenso cuentan solo especialidades activas; listas admiten `{incluirCerradas}` y `obtenerServicioV2` devuelve `cerrados`. `listarPermisosV2` conserva la vista completa (registro administrativo). UI de 4 pantallas con lenguaje Cerrar/Revocar. Verificación: test_v33 31/31, 09_Pruebas 115 OK (bloque V3.3 incluido), regresión completa verde. Detalle: `INFORME_V3_3_INTEGRIDAD_HISTORICA.md`.

> **ACTUALIZACIÓN V3.1 (ago 2026, aprobada e implementada):** las decisiones P1/P2/P4 del usuario se ejecutaron como FASE V3.1 (esquema `1.1`): `GRADOS_V2` = 6 grados OFICIAL sin Disponible (grado de ingreso = Voluntario), `CATEGORIAS` default 'Aspirante,Disponible,Voluntario,Reserva' (configurable), `ESTADOS` 'Activo,Inactivo,Suspendido,Egresado'; sincronización idempotente de catálogos en `crearEstructuraV2` (`_sincronizarGradosV2`/`_sincronizarConfigV2` — elimina solo sin referencias históricas, desactiva con observación si hay referencias, respeta Config personalizada y lo reporta); frontend Personas/Reportes con estados/categorías dinámicos desde Config. Verificación: harness V3.1 15/15, test_v2 33/33, rutas OK, auditoría SIN FALLOS, regresión v0 OK. Deployment **@14** (misma URL). Los hallazgos C1/C8 de este informe quedan resueltos; el resto (C2–C7, C9–C20) sigue pendiente de fases V3.2 en adelante.

> Fuentes analizadas: `AGENTS.md`, `MODELO_DATOS_V2.md`, `INFORME_ARQUITECTURA_DATOS.md`, 21 archivos backend (`.js`), 18 archivos frontend (`13_UI_*.html`), `appsscript.json`, `.clasp.json`, harness de pruebas (backend `09_Pruebas.js`, CLI `/tmp/opencode/*`), y el nuevo encargo FASE V3 del usuario.

---

## A. ESTADO ACTUAL (qué existe realmente)

### A.1 Backend (Apps Script, V8) — 21 archivos `.js`

| Archivo | Rol | Líneas |
|---|---|---|
| `00_Constantes.js` | Constantes puras: `HOJA_V2` (29 hojas), `COL_*` por entidad, semillas (GRADOS_V2, AREAS_V2, CARGOS_V2, ESPECIALIDADES_V2, SUBESPECIALIDADES_V2, UNIDADES_V2, TIPOS_SERVICIO_V2, ESTADOS_ASISTENCIA_V2, TIPOS_DOCUMENTO_V2, TIPOS_EVENTO_HOJA, TIPOS_ANOTACION, PERFILES), `ESQUEMA_V2='1.0'` | 444 |
| `01_Utilidades.js` | Helpers RUT/fechas/batch/caché/`_log` | — |
| `03_Voluntarios.js` | API **v0** voluntarios (listar, crear, ficha, baja) | — |
| `04_Eventos.js` | onOpen/onEdit | — |
| `05_Entregas.js` | Catálogo/Inventario/Entregas **v0 extendido** (+ `listarElementosV2` :103, `listarInventarioV2` :208, areaId/tallas, ubicacion/serieSede, devoluciones parciales) | — |
| `07_Formato.js`, `08_Config.js`, `09_Pruebas.js` (harness `apisV2` 64 APIs :160–171), `10_Backup.js` | v0 | — |
| `11_Dashboard.js` | `obtenerResumenDashboard` (v0, **usado por el frontend**) + `obtenerResumenDashboardV2` (:223–259, **sin uso**), `obtenerHistorial`, `obtenerConfiguracion` | — |
| `12_WebApp.js` | `doGet` (template evaluate), `include`, `getSesion()` (:25–43) → **{correo, perfil, permisos}** | — |
| `21_MigracionV2.js` | `crearEstructuraV2()` (29 hojas, esquema 1.0), helpers `_hojaV2/_tablaV2/_buscarV2/_insertarFilaV2/_actualizarFilaV2/_agregarEventoHojaV2`, `estadoMigracionV2` | 505 |
| `22_Personas.js` | Personas+Voluntarios V2 (CRUD, alta/baja/reactivación, migración v0, antigüedad) | — |
| `23_GradosCargos.js` | Grados (lectura), Cargos/Áreas (CRUD), `_requisitosGrado` (:167–233 **hardcodeado**), `asignarGradoV2` (con excepción), `asignarCargoV2`, historiales | 409 |
| `24_Especialidades.js` | CRUD esp/sub + N:N + `quitarEspecialidadV2` (:170 → **deleteRow** :177) | — |
| `25_Credenciales.js` | Catálogo + N:N + `quitarCredencialV2` (:138 → **deleteRow** :144) + vencimientos (ALERTA_CREDENCIALES_DIAS=30) | — |
| `26_Capacitaciones.js` | Catálogo + N:N + `quitarCapacitacionV2` (:120 → **deleteRow** :126) + vencidas | — |
| `27_Servicios.js` | Tipos + Servicios CRUD + estado (Planificado/Activo/Finalizado/Cancelado) + asignación masiva **con lock** + `quitarVoluntarioServicioV2` (:305 → **deleteRow** :311, **sin uso en UI**) | 313 |
| `28_Asistencia.js` | Estados catálogo + `registrarAsistenciaV2` (batch) + resumen FUERZA TOTAL/FORMAN/FALTAN + estadísticas con `minimosReferencia` (Config :226–229, informativos) | 248 |
| `29_HojaServicios.js` | Eventos append-only + Anotaciones/Documentos CRUD + `quitarAnotacionV2` (:116 → **deleteRow** :122), `quitarDocumentoV2` (:183 → **deleteRow** :189) | 191 |
| `30_Unidades.js` | Unidades CRUD + integrantes **append-only** (`egresarIntegranteUnidadV2` cierra con fecha) | 161 |
| `31_EquipamientoV2.js` | `registrarEntregaV2`/`registrarDevolucionV2` (devoluciones parciales múltiples en tabla `Devoluciones`), historiales | 257 |
| `32_ConfigV2.js` | **Sedes CRUD** (`listarSedesV2` :11, `crearSedeV2` :37, `actualizarSedeV2` :60 — **sin UI**) + `listarParametrosV2` + `actualizarParametroV2` | — |
| `33_Usuarios.js` | `PERFILES` = Administrador/Encargado/Voluntario/Consulta; `MATRIZ_PERMISOS_BASE` (18 filas, :14–33); usuarios CRUD; excepciones (otorga/revoca); `permisoUsuarioV2` (:175, fallback Consulta); `puedeV2` (:213) | 224 |
| `34_Reportes.js` | `obtenerReporteGeneralV2`, `obtenerNominaV2`, `obtenerAlertasV2` | 227 |
| `00_Diagnostico.js` | Residuo de diagnóstico (`describeSpreadsheet`) | — |

### A.2 Modelo físico — 29 hojas (`HOJA_V2`, 00_Constantes.js:207–237)

Sedes, Personas, VoluntariosV2, Grados, Historial Grados, Cargos, Historial Cargos, Áreas, Especialidades, Subespecialidades, Voluntario Especialidades, Credenciales, Voluntario Credenciales, Capacitaciones, Voluntario Capacitaciones, Unidades Internas, Integrantes Unidad, Servicios, Servicio Voluntarios, Asistencia, Hoja de Servicios, Anotaciones, Documentos, Devoluciones, Tipos Servicio, Estados Asistencia, Tipos Documento, Usuarios, Permisos.

La hoja v0 `Voluntarios` (20 columnas) **persiste intacta**; `VoluntariosV2` es el maestro V2 (11 columnas: personaId, sedeId, estado, categoria, fechaIngreso, fechaEgreso, motivoEgreso…).

### A.3 Semillas actuales (00_Constantes.js)

- **GRADOS_V2** (:378–386): Comandante Local (1), Instructor Mayor (2), Instructor (3), Subinstructor (4), Voluntario Mayor (5), Voluntario (6) — todos OFICIAL — **+ "Disponible" (7, INTERNO, "Grado de ingreso — corrección del usuario")** ⚠️
- **AREAS_V2** (:389–399): Mando + A-1..A-4 + Vestuario y Equipo + Telecomunicaciones e Informática + Sanidad + Relaciones Públicas (9, INTERNO).
- **CARGOS_V2** (:403–409): Comandante Local (OFICIAL), Jefe de Sede/Jefe Local (OFICIAL), Ayudante del Comandante, Ayudante del Jefe, Jefe de Equipo (OFICIAL), Jefe de Área (INTERNO). **No incluye**: Asesor de Vestuario/Telecomunicaciones/Personal, Guardaalmacén, Jefe de Área de Operaciones (informados por la sede).
- **ESPECIALIDADES_V2** (:412–419): Sanidad, Telecomunicaciones, Administración Logística (OFICIAL) + Operador RPAS, Rescate Técnico con Cuerda, Búsqueda y Rescate (INTERNO).
- **SUBESPECIALIDADES_V2** (:422–425): Radioaficionado, Stop The Bleed (INTERNO). **No incluye**: los rangos de Sanidad (Médico/Enfermero/TENS/Auxiliar) ni de Logística (Albergues/Acopio/Operador) como subespecialidades — solo van en la descripción de la especialidad.
- **UNIDADES_V2** (:428–431): Fuerza de Tarea Delta (Activa, INTERNO, nota anti-confusión Código Delta), Grupo de Rescate Animal (Inactiva).
- **TIPOS_SERVICIO_V2** (:433): 11 tipos (CRT, Albergue, Búsqueda de personas, Puesto sanitario, Direccionamiento, Votaciones, Apoyo institucional, Emergencia, Operativo, Capacitación, Otro).
- **ESTADOS_ASISTENCIA_V2** (:434): Asignado, Presente, Ausente, Ausente justificado, Reemplazado, Retirado.
- **TIPOS_ASISTENCIA** (:443): Operativa, Régimen e instrucción.
- **Categorías**: viven en **Config** (`CATEGORIAS` = 'Aspirante,Voluntario', :151) — **sin Disponible ni Reserva**.
- **ESTADOS_CREDENCIAL** (:441): Vigente, Por vencer, Vencida, Revocada. **TIPOS_EVENTO_HOJA** (:436): incluye RETIRO_TEMPORAL. **TIPOS_ANOTACION** (:437): Observación, Amonestación, Reprensión, Suspensión del servicio, Baja del servicio, Nota positiva.

### A.4 Frontend (HTMLService) — 17 includes, 18 páginas, 5 grupos de sidebar

| Grupo sidebar | Páginas | Backend |
|---|---|---|
| Inicio | Dashboard | **v0** (`obtenerResumenDashboard`) |
| Gestión | Voluntarios, Servicios, Asistencia | v0 / **V2** / V2 |
| Equipamiento | Inventario, Entregas, Catálogo | v0 / v0 / v0 |
| Institucional | Personas, Grados y Cargos, Especialidades, Credenciales, Capacitaciones, Unidades, Reportes, Usuarios | **V2** |
| Administración | Historial, Configuración | v0 / v0 (lectura) |

- Ficha (`#/ficha/:id`, 18_UI_Ficha.html) = **v0**; tabs Servicios (:110–111) y Asistencia (:113–114) son **placeholders**.
- `getSesion` se usa 1 vez (header). **Ninguna página filtra por perfil/permisos**; el sidebar es estático.
- **No existe**: Organigrama, Ficha V2, selector de Sede, foto de voluntario.
- `PROYECTO_VERSION='0.7.1'` hardcodeada (13_UI_App.html:15) vs. backend `0.6.0` (intencional).
- `19_UI_Modulos.html` contiene 4 páginas (Servicios, Asistencia, Historial, Configuración) — única excepción al patrón 1 archivo = 1 página.

### A.5 Permisos (33_Usuarios.js)

`MATRIZ_PERMISOS_BASE` (18 filas): Administrador=*/*; Encargado=lectura+escritura en voluntarios, gradosCargos, servicios, asistencia, equipamiento + lectura reportes; Voluntario=lectura voluntarios/servicios/asistencia/equipamiento; Consulta=lectura voluntarios/reportes. Excepciones en hoja `Permisos` (otorga/revoca). **`permisoUsuarioV2` solo se invoca desde `getSesion` (12_WebApp.js:33). Ninguna función pública V2 valida permisos al ejecutarse.** El frontend tampoco filtra nada.

### A.6 Configuración y manifest

- `appsscript.json`: V8, America/Santiago, `webapp{executeAs:USER_DEPLOYING, access:MYSELF}`, `executionApi{MYSELF}`, **Sheets v4 avanzado declarado pero NO usado** (solo `SpreadsheetApp` en el código).
- `.clasp.json`: Script ID único; deployment @13 en la misma URL (prod y /dev).
- Config (hoja): CATEGORIAS, ESTADOS, STOCK_BAJO, `MIN_ASIST_*` (50/60/70/80, 28_Asistencia.js:226–229), umbral credenciales.
- Harness de pruebas: **en `/tmp/opencode`** (no versionados): test_core.js, test_v2.js (33/33), test_rutas_v2.js (17 rutas OK), audit_ui_v2.js (SIN FALLOS). En repo: `apisV2` en 09_Pruebas.js (64 APIs).

---

## B. MODELO ACTUAL (entidades y relaciones reales)

```
SEDES ──────────────┐
                    ├─→ VOLUNTARIOSV2 (estado, categoria, fechaIngreso/Egreso, motivoEgreso)
PERSONAS (1:1) ─────┘            │
                                 ├──→ HistorialGrados (fechaDesde/Hasta, resolucion, requisitosEvaluados, excepcion, excepcionDetalle)
                                 ├──→ Grados (catálogo, orden, origen, activo)
                                 ├──→ HistorialCargos (fechaDesde/Hasta, quienAsigno, resolucion)
                                 ├──→ Cargos (catálogo, areaId, ordenJerarquico, origen) ──→ Áreas
                                 ├──→ VoluntarioEspecialidades (especialidadId|subespecialidadId, nivel, credencialId)
                                 ├──→ VoluntarioCredenciales (fechaObtencion, estado) ──→ Credenciales (catálogo, vencimiento)
                                 ├──→ VoluntarioCapacitaciones (fecha, aprobado, calificacion) ──→ Capacitaciones (vigenciaMeses)
                                 ├──→ IntegrantesUnidad (rol, fechaIngreso, fechaSalida) ──→ UnidadesInternas
                                 ├──→ ServicioVoluntarios (rolEnServicio, estado) ──→ Servicios (tipo, fecha, lugar, estado)
                                 │                                                 └──→ TiposServicio
                                 ├──→ Asistencia (tipoAsistencia, estado, horas, motivo) ──→ EstadosAsistencia
                                 ├──→ HojaServicios (eventos append-only) ──→ TIPOS_EVENTO_HOJA
                                 ├──→ Anotaciones (tipo, sancion) ──→ TIPOS_ANOTACION
                                 ├──→ Documentos (tipo, referencia, enlace) ──→ TiposDocumento
                                 └──→ Entregas ──→ Devoluciones (múltiples parciales) ──→ Inventario ──→ Catálogo
USUARIOS ──→ Permisos (excepciones) ──→ MATRIZ_PERMISOS_BASE (constante)
```

Patrones implementados: IDs correlativos, relaciones por ID + snapshot de nombre, historiales append-only en grados/cargos/integrantes, respuestas canónicas `{ok,data,error}`, batch get/set, LockService en asignación masiva de servicios, origen OFICIAL/INTERNO en catálogos.

---

## C. PROBLEMAS DETECTADOS (clasificados)

### CRÍTICO

**C1. "Disponible" está sembrado como Grado 7** (00_Constantes.js:385, origen INTERNO, "corrección del usuario") — **contradice el propio encargo V3** ("Disponible NO es un grado, Aspirante NO es un grado; separación conceptual grado / condición-categoría / estado institucional") y la investigación normativa (INFORME_ARQUITECTURA_DATOS.md §2.2: Disponible = categoría de personal OFICIAL, Ley de Reclutamiento, ROF-S Art. 18/20; Aspirante = condición de ingreso, Art. 17). La Sede usa 6 grados + Aspirante/Disponible como condiciones. El modelo V2 mezcló grado con condición (error que el propio informe normativo §20.1 advierte como "riesgo alto"). Requiere decisión y corrección de semilla (sin datos en riesgo: la semilla no se ha usado todavía en producción).

**C2. Permisos inertes.** Matriz + excepciones + `permisoUsuarioV2`/`puedeV2` existen pero **ninguna función pública V2 los ejecuta** (solo getSesion los calcula) y **el frontend no filtra nada** (sidebar estático, router sin chequeos). Cualquier usuario con acceso a la Web App puede ejecutar cualquier operación. Hoy el riesgo es bajo (access MYSELF, un solo dueño), pero es un riesgo estructural alto para el acceso delegado que pide V3 §17.

**C3. Borrado físico de historial** (viola la regla "nunca borrar", ROF-S hoja de servicios, Art. 92 pérdida de especialidad, Art. 68 sanciones):
| Función | Archivo:línea | Qué borra |
|---|---|---|
| `quitarEspecialidadV2` | 24_Especialidades.js:177 | fila N:N especialidad (historial de acreditación) |
| `quitarCredencialV2` | 25_Credenciales.js:144 | fila N:N credencial |
| `quitarCapacitacionV2` | 26_Capacitaciones.js:126 | fila N:N capacitación |
| `quitarVoluntarioServicioV2` | 27_Servicios.js:311 | asignación a servicio (participación histórica) |
| `quitarAnotacionV2` | 29_HojaServicios.js:122 | **anotación/sanción (Art. 68)** |
| `quitarDocumentoV2` | 29_HojaServicios.js:189 | documento/respaldo |
| `eliminarPermisoV2` | 33_Usuarios.js:166 | excepción de permiso (auditabilidad) |

### ALTO

**C4. Retiro temporal no modelado.** Existe solo como tipo de evento `RETIRO_TEMPORAL` (00_Constantes.js:436) y un comentario en 22_Personas.js:476–477 ("por ahora se informa la antigüedad continua"). Falta la entidad/campos que exige V3 §8 (fecha inicio, fecha término, documento, motivo, observación) y el efecto configurable sobre la antigüedad institucional vs. en grado/cargo.

**C5. Requisitos de ascenso hardcodeados** (23_GradosCargos.js:167–233: 2 años en grado anterior + 1–2 especialidades; CL = ⚠ resolución DG). V3 §9 pide requisitos **configurables** (antigüedad, grado actual, asistencia, especialidades, capacitaciones, evaluación) y estados Cumple/No cumple/Pendiente sin motor automático. Actualmente no contemplan asistencia ni evaluación, y no son editables sin tocar código.

**C6. Doble vida v0/V2 sin puente.** Dashboard, Voluntarios, Ficha, Catálogo, Inventario, Entregas usan APIs v0 sobre la hoja `Voluntarios` original; el resto usa V2. No existe ficha V2 consolidada (grado/cargo/especialidades/credenciales están dispersos en Personas, Grados, Especialidades, Credenciales, Capacitaciones) y los datos v0/V2 **no se sincronizan** (listarVoluntarios vs listarPersonasV2). Riesgo de divergencia y de que el usuario vea "dos sistemas".

**C7. Servicios incompletos frente a V3 §11.** No existe edición de servicios (solo crear + cambiar estado), ni retirar/reemplazar asignados en la UI (el backend **sí** tiene `quitarVoluntarioServicioV2`, no expuesto), ni campo de **resultado/informe posterior** del servicio.

**C8. Categorías incompletas.** Config `CATEGORIAS`='Aspirante,Voluntario' — si Disponible deja de ser grado debe pasar a categoría/condición; falta además `Reserva` (ROF-S Art. 59). No hay separación explícita en el modelo entre "estado institucional" (Activo/Suspendido/Egresado), "categoría/condición" (Aspirante/Disponible/Voluntario/Reserva) y "grado" (jerarquía).

### MEDIO

**C9. Sedes sin UI y multi-sede a medias.** Hoja `Sedes` + CRUD backend existen (32_ConfigV2.js) pero el frontend nunca llama `listarSedesV2`; `sedeId` en VoluntariosV2 es opcional y sin uso. Los catálogos (grados, cargos, especialidades…) son **globales, sin `sedeId`** — una futura multi-sede real requerirá decidir catálogos globales vs. por sede.

**C10. Dashboard desactualizado.** El frontend usa el agregador **v0**; `obtenerResumenDashboardV2` (11_Dashboard.js:223) está implementado y sin uso (KPIs V2, grados/cargos, alertas V2).

**C11. Organigrama inexistente** (V3 §16): sin módulo ni modelo (requiere relación jerárquica Áreas/Cargos, actualmente solo `ordenJerarquico` plano en Cargos).

**C12. Asistencia de régimen e instrucción sin servicio asociado.** El flujo actual exige un Servicio para registrar asistencia (`obtenerAsistenciaServicioV2`). Las reuniones de sede (régimen e instrucción) deberían poder registrarse sin crear un "servicio" artificial (INFORME §17). Además V3 §10 pide soporte futuro de "asistencia especial" según tipo de servicio.

**C13. Ficha V2 pendiente** (era módulo 3 del plan V2, MODELO_DATOS_V2.md §3): no implementada; tabs Servicios/Asistencia de la ficha v0 son placeholders.

**C14. Documentación desactualizada** (AGENTS.md): dice perfil 'Coordinador' (real: 'Encargado', 00_Constantes.js:438), `getSesion` "sin permisos aún" (real: {correo, perfil, permisos}, 12_WebApp.js:25–43), "4 grupos" de sidebar (real: 5), "9 archivos frontend" (real: 17). MODELO_DATOS_V2.md fue actualizado al aprobarse, pero no refleja las salvedades de implementación.

### BAJO

**C15.** Sheets v4 declarado en appsscript.json y no usado (scope innecesario).
**C16.** `PROYECTO_VERSION` frontend (0.7.1) vs backend (0.6.0) divergentes por decisión, confusa para auditoría.
**C17.** Harness de pruebas en `/tmp/opencode` no versionados en el repo (solo `apisV2` en 09_Pruebas.js).
**C18.** `19_UI_Modulos.html` agrupa 4 páginas (excepción al patrón 1 archivo = 1 página).
**C19.** `00_Diagnostico.js` (residuo) en el proyecto.
**C20.** Integridad referencial parcial: hay validación de existencia en escrituras principales (ej. `asignarGradoV2` valida voluntario y grado, 23_GradosCargos.js:255–262), pero los borrados físicos (C3) pueden dejar historial en HojaServicios sin su fila origen.

### Lo que SÍ está bien en V2 (conservar)

- Personas y Voluntarios separados; grado ≠ cargo con historiales append-only y resolución.
- Advertencia-no-bloqueo en grados/cargos con excepción documentada (quién/fecha/motivo).
- Categorías y mínimos de asistencia configurables en Config (informativos, no sancionan — ROF-S Art. 18).
- F.T. Delta y Grupo de Rescate Animal como UnidadesInternas INTERNO (con nota aclaratoria del Código Delta).
- Asignación masiva con LockService; estados de asistencia configurables; tipos de servicio configurables.
- Devoluciones parciales múltiples en tabla propia; IntegrantesUnidad append-only; HojaServicios append-only (eventos).
- `origen` OFICIAL/INTERNO en catálogos; respuestas canónicas; batch I/O; 29 hojas con esquema versionado.

---

## D. MODELO V3 RECOMENDADO

Sobre la base V2 (que es sólida), los cambios son de **consolidación**, no de reescritura:

### D.1 Cambios de modelo

| # | Cambio | Detalle |
|---|---|---|
| 1 | **Grados sin Disponible** | Catálogo = 6 grados OFICIAL (Comandante Local → Voluntario) con orden jerárquico. Eliminar "Disponible" de `GRADOS_V2`. |
| 2 | **Categorías/condiciones separadas** | Categoría = Aspirante, Disponible, Voluntario, Reserva (configurable en Config; el voluntario tiene UNO solo). Estado institucional = Activo, Inactivo, Suspendido, Egresado (configurable). Grado = jerarquía. Tres campos independientes en VoluntariosV2 (ya tiene `estado` y `categoria`; falta ajustar valores). |
| 3 | **RetirosTemporales (entidad nueva)** | id, voluntarioId, fechaInicio, fechaTermino, documento, motivo, observaciones, estado. Efecto en antigüedad **configurable** (regla por parámetro: descuenta de institucional y/o en-grado/cargo). Genera evento RETIRO_TEMPORAL en HojaServicios. |
| 4 | **RequisitosAscenso configurables** | Tabla/hoja por grado destino: añosEnGradoAnterior, especialidadesMin, asistenciaMinOperativa, asistenciaMinRegimen, capacitacionesRequeridas, evaluacionRequerida(bool). Evaluación = humana (CL/DG): el sistema devuelve Cumple/No cumple/Pendiente + advertencias. Sin motor automático. |
| 5 | **Sin borrado físico** | Toda "quitar" pasa a **cierre**: `fechaTermino`/`activo=false`/estado `Revocada`/`Perdida` (Art. 92) en la fila N:N; servicio = `fechaSalida` en ServicioVoluntarios (reemplazo = cerrar + alta). Anotaciones/Documentos: `activo=false`. Se conserva el historial completo. |
| 6 | **Servicios ampliados** | + edición, + `quitarVoluntarioServicioV2` expuesto en UI, + retirar/reemplazar, + campos `resultado`, `informe`, `fechaCierre`, `cerradoPor`. |
| 7 | **Asistencia de régimen sin servicio** | Permitir registro de "régimen e instrucción" con jornada simple (fecha, tipo, horas) sin servicio asociado; o mantener servicio-tipo "Régimen e instrucción" como convención (decisión del usuario). Futuro: formularios de asistencia especial por tipo de servicio (campo `formato` en TiposServicio). |
| 8 | **Sedes activas** | UI de Sedes en Configuración (CRUD existe en backend); decidir catálogos globales vs. por sede (recomendación: globales con etiqueta de origen por ahora; `sedeId` en las tablas que nazcan nuevas). |
| 9 | **Ficha V2** | `#/ficha/:id` consolidada (Personal, Estado/Grado/Cargo/Área, Especialidades, Credenciales, Capacitaciones, Unidades, Equipamiento, Servicios/Asistencia, Hoja de servicios) usando un agregador V2 (extender `obtenerFichaVoluntario` o nuevo `obtenerFichaV2`). |
| 10 | **Dashboard V2** | Migrar el frontend al agregador `obtenerResumenDashboardV2` (KPIs institucionales + alertas V2). |
| 11 | **Organigrama (futuro cercano)** | Sin entidad nueva: agregar `padreId`/`dependeDe` en Cargos y `encargadoId` ya existe en Áreas; vista jerárquica derivada (CL → JS → Plana Mayor/Áreas → equipos/unidades). Click → ficha del titular. |
| 12 | **Permisos efectivos** | Envolver cada API pública V2 con `permisoUsuarioV2(Session.getActiveUser().getEmail())` (fallback: si no hay usuario, comportamiento actual); frontend oculta/deshabilita según perfil devuelto por `getSesion`. Escalonado por fase de usuarios. |
| 13 | **Fotografía** | Campo opcional futuro (URL/Drive ID) en Personas para tarjeta de identificación (ROF-S). |
| 14 | **Credenciales: tipo catálogo** | Catálogo de tipos (Licencia, Curso, Título, Certificación) + campos tipo/número/emisor ya pedidos en V3 §6; vínculo "si la licencia vence, la especialidad asociada se marca no vigente" (regla configurable). |

### D.2 Versión de esquema

`ESQUEMA_V2 = '1.1'` (agrega RetirosTemporales; sin migraciones destructivas).

---

## E. DIAGRAMA CONCEPTUAL (V3)

```
                    SEDE (1) ──sedeId──┐
                                       ▼
  PERSONA (1:1) ────────────► VOLUNTARIO ◄──── estado institucional (Activo/Suspendido/Egresado…)
   RUN · datos personales    (categoría: Aspirante/Disponible/Voluntario/Reserva)   ── categoría (Config)
   ABO/Rh · contacto         (fechaIngreso/Egreso · motivoEgreso)
                                       │
       ┌───────────────┬──────────────┼─────────────────┬─────────────────┬───────────────┐
       ▼               ▼              ▼                 ▼                 ▼               ▼
  HistorialGrados  HistorialCargos  VoluntarioEsp.  VoluntarioCred.  VoluntarioCap.  IntegrantesUnidad
       │               │              │                 │                 │               │
  GRADOS (6,        CARGOS (config, Cargo≠Grado)   ESPECIALIDADES   CREDENCIALES    CAPACITACIONES    UNIDADES
  jerárquico)       └─► ÁREAS (9, interno)          └─► Subesp.       (tipo, n°,     (vigencia)       (F.T. Delta…)
       │               │        └── jerarquía organigrama ──────────┐  emisor)          │             └─ rol/ingreso/salida
       ▼               ▼                                           ▼                   ▼                  ▼
  RequisitosAscenso (Config/hoja)                          HOJA DE SERVICIOS (append-only, timeline perpetuo)
       │               │                                           │
       ▼               ▼                                           ▼
  RETIROS TEMPORALES  (fechaInicio/fin, doc, motivo; efecto antigüedad configurable)

  SERVICIO (tipo·fecha·lugar·estado·informe) ── ServicioVoluntarios (rol, estado, fechaSalida) ──► VOLUNTARIO
       │                                                                  │
       ▼                                                                  ▼
  TIPOS_SERVICIO (config)                                          ASISTENCIA (operativa / régimen e instrucción)
                                                                   estados config · horas · motivo
  EQUIPAMIENTO: CATÁLOGO → INVENTARIO → ENTREGAS → Devoluciones (múltiples parciales) ──► VOLUNTARIO
  USUARIOS → PERFILES + MATRIZ + Permisos (excepciones) → getSesion{perfil, permisos} → Frontend filtra
  Config (parámetros escalares) · Log (auditoría) · Sedes (multi-sede futuro)
```

---

## F. QUÉ DEBE PERMANECER EN SHEETS (persistencia pura)

Las 29 hojas V2 + eventuales nuevas (RetirosTemporales) como almacenamiento de datos **sin lógica**: sin fórmulas de negocio, sin validaciones autoritativas, sin botones (los menús son wrappers administrativos de respaldo). IDs, reglas y cálculos viven en backend. `Log` para auditoría.

## G. QUÉ DEBE PERMANECER EXCLUSIVAMENTE EN BACKEND (Apps Script)

Reglas de negocio y validaciones (RUT módulo 11, estados por entidad, requisitos de ascenso, mínimos de asistencia), asignación de IDs, concurrencia (LockService), escritura de eventos en HojaServicios, cálculo de antigüedad (institucional/en grado/en cargo, con descuento de retiros temporales configurable), `permisoUsuarioV2`/`puedeV2` **aplicados a cada API**, respuestas canónicas `{ok,data,error}`, logging. El backend es la fuente de verdad.

## H. QUÉ DEBE MANEJAR EXCLUSIVAMENTE EL FRONTEND

Router y navegación, renderizado (design system, tablas→cards responsive), estados de carga/error/vacío, modal/confirmar/toast, debounce/búsqueda instantánea, filtros visuales y **ocultación de acciones por perfil** (según `getSesion`), organigrama visual, comprobantes imprimibles. Nunca toca Sheets ni valida reglas de negocio (solo feedback).

## I. QUÉ DEBE SER CONFIGURABLE POR SEDE

Categorías/condiciones (lista), estados institucionales, cargos + historial, áreas, especialidades y subespecialidades internas, unidades internas (F.T. Delta…), tipos de servicio, estados de asistencia, tipos de documento, mínimos de asistencia (%), umbrales de alerta (credenciales, stock), **requisitos de ascenso (V3)**, regla de retiro temporal en antigüedad, tallas de vestuario (ya libre).

## J. QUÉ ES OFICIAL NACIONAL (etiquetado OFICIAL)

6 grados jerárquicos (UNI), categorías de personal Aspirante/Disponible/Reserva/Voluntario(a) (ROF-S Art. 17/18/59), 3 especialidades con distintivo (Sanidad, Telecomunicaciones, Administración Logística) y sus rangos, cargos Comandante Local / Jefe de Sede / Jefe de Equipo, dos tipos de asistencia (operativa; régimen e instrucción) con sus % mínimos, sanciones (Art. 68), tarjeta de identificación (ABO+Rh+foto), hoja de servicios. Los datos de la sede se siembran con `origen: OFICIAL`.

## K. QUÉ ES INTERNO DE SEDE (etiquetado INTERNO/CONFIGURABLE)

Áreas A-1..A-4 y nomenclatura alfanumérica, asesores y cargos internos (Ayudante del Comandante, Ayudante del Jefe, Jefe de Área, Guardaalmacén…), Fuerza de Tarea Delta (unidad interna; "Delta" oficial es el Código de radiocomunicaciones), RPAS/Rescate Técnico/Búsqueda y Rescate/Stop the Bleed (especialidades/capacidades internas), Grupo de Rescate Animal. La UI los distingue con chip/etiqueta de origen y nunca los presenta como nacionales.

## L. QUÉ PUEDE EVOLUCIONAR POSTERIORMENTE

Multi-sede completo (catálogos por sede o globales con `sedeId`; decisión en D.1#8), permisos por perfil activos en UI + acceso del voluntario a su propia ficha, organigrama interactivo, motor de requisitos de ascenso (sin autoridad automática: la DG asciende por resolución exenta), formularios de asistencia especial por tipo de servicio, fotografía (tarjeta ROF-S), auditoría de cambios en datos personales (quién/cuándo), catálogo de tipos de credencial con validación de vigencia cruzada (licencia → especialidad no vigente), backups automáticos (`crearBackup`).

---

## M. PLAN DE MIGRACIÓN V2 → V3 (NO EJECUTAR — solo diseño)

Orden propuesto (cada paso: backup CLI + `node --check` + harness + `clasp push` + deploy misma URL + actualizar docs):

1. **Esquema 1.1 + semillas**: quitar "Disponible" de GRADOS_V2 (si la decisión del usuario confirma 6 grados); ampliar Config CATEGORIAS → 'Aspirante,Disponible,Voluntario,Reserva' (o la lista que decida la sede). Sin datos afectados (catálogos vacíos en producción).
2. **RetirosTemporales**: nueva hoja + constantes + CRUD + efecto en antigüedad (parámetro de regla) + evento en HojaServicios. Regresión completa.
3. **Cierre en vez de borrado**: cambiar `quitar*` a cierre con `fechaTermino`/`activo=false`/estado Revocada/Perdida; conservar API (firma igual o `{fechaTermino, motivo}`); migrar no necesaria (no hay filas borrables históricas relevantes en producción).
4. **Requisitos configurables**: tabla/hoja `RequisitosAscenso` + evaluador (advertencias) manteniendo el panel ✓/✗/⚠ de la UI de grados.
5. **Servicios**: edición + retirar/reemplazar en UI (backend listo) + informe/resultado.
6. **Asistencia de régimen** (según decisión) + Dashboard V2 en frontend.
7. **Ficha V2** consolidada (agregador + página).
8. **Sedes en UI** y, si se decide, **catálogos por sede** (solo para entidades nuevas; las existentes se etiquetan "globales").
9. **Permisos efectivos** en backend (envolver APIs) y filtros de UI por perfil.
10. **Docs + verificación final**: AGENTS.md (corregir Coordinador→Encargado, getSesion, grupos, 17 includes), MODELO_DATOS_V2.md (salvedades), harnees versionados, appsscript.json (quitar Sheets v4 si no se usa).

---

## DECISIONES QUE NECESITO DEL USUARIO

> Solo preguntas necesarias. Lo ya definido (Persona/Voluntario separados, grado ≠ cargo, historiales, advertencia-no-bloqueo, unidades internas configurables, mínimos informativos) NO se vuelve a preguntar.

### 1. Personal
- P1. ¿Confirmas el modelo **grado (jerarquía) + categoría/condición (Aspirante/Disponible/Voluntario/Reserva) + estado institucional (Activo/Suspendido/Egresado)** como tres dimensiones independientes? (Recomendado: sí — revierte la decisión V2 de "Disponible = grado 7".)
- P2. ¿La categoría **Reserva** (ROF-S Art. 59: voluntario empleado en operativos) se agrega a la lista, o solo Aspirante/Disponible/Voluntario por ahora?
- P3. ¿La foto del voluntario (tarjeta de identificación) se implementa en esta fase o queda para después?

### 2. Grados
- P4. ¿Catálogo final = **6 grados** (los que usa la sede: Voluntario → Comandante Local) o los 7 oficiales UNI (incluye "Instructor Mayor con Jefe de Sede" como grado de 3 barras)? Recomendado: 6, tratando "c/Jefe de Sede" como cargo (como está).
- P5. ¿Lista exacta de requisitos configurables por grado? Propuesta por defecto: años en grado anterior, nº de especialidades, % asistencia operativa/régimen, capacitaciones requeridas, evaluación (Cumple/No cumple/Pendiente). ¿Cuáles aplican en tu sede?

### 3. Cargos
- P6. ¿Agregar a la semilla los cargos informados que faltan (Asesor de Vestuario, Asesor de Telecomunicaciones, Asesor de Personal, Guardaalmacén de Vestuario y Equipos, Jefe de Área de Operaciones)? ¿Alguno otro?
- P7. ¿Se permite a una persona tener **varios cargos simultáneos** (ej. cargo de mando + asesoría)? Recomendado: sí (historial lo soporta).
- P8. ¿La advertencia de requisito para CL/Jefe de Sede (Instructor Mayor ≥3 años) se mantiene solo como aviso (no bloqueo)?

### 4. Especialidades
- P9. ¿Los rangos de Sanidad (Médico/Enfermero/TENS/Auxiliar) y Logística (Albergues/Acopio/Operador de Equipos) se modelan como **subespecialidades** (como el modelo ya lo permite) o se dejan en la descripción? Recomendado: subespecialidades OFICIAL.
- P10. ¿RPAS se mantiene como especialidad interna (como está) o prefieres modelarla como unidad/equipo de trabajo?

### 5. Credenciales
- P11. ¿Implementar el **catálogo de tipos de credencial** (Licencia/Certificado/Curso/Título) con campos tipo + número + institución emisora? (V3 §6)
- P12. ¿Al vencer una licencia (ej. RPAS), la especialidad vinculada debe marcarse **automáticamente como no vigente** o solo mostrarse advertencia?
- P13. ¿Confirmas que "quitar" una credencial debe **cerrar con fecha** (historial conservado) en lugar de borrarla?

### 6. Unidades
- P14. ¿El rol del integrante de unidad es texto libre (como está) o catálogo (Jefe/Subjefe/Operador/Integrante)? Recomendado: catálogo configurable.
- P15. ¿F.T. Delta necesita **equipamiento propio** (inventario asociado a la unidad) en esta fase o solo integrantes y responsable?

### 7. Servicios
- P16. ¿Permitir **editar** servicios ya creados (datos generales) o solo cambiar estado y agregar asignados? Recomendado: editar mientras no esté Activo/Finalizado.
- P17. ¿Implementar **retirar/reemplazar** voluntarios asignados en la pantalla Servicios (backend listo)?
- P18. ¿Agregar **informe/resultado** posterior del servicio (texto, fecha de cierre, quien cerró)? ¿Obligatorio al Finalizar?
- P19. ¿La lista de 11 tipos de servicio actual es la correcta o ajustamos (ej. "Régimen e instrucción" como tipo)?

### 8. Asistencia
- P20. ¿Las **reuniones de régimen e instrucción** (sin servicio operativo asociado) se registran creando un servicio tipo "Régimen e instrucción" (convención) o necesitas registro independiente sin servicio?
- P21. ¿Los estados actuales (Asignado/Presente/Ausente/Ausente justificado/Reemplazado/Retirado) cubren los casos de la sede (permiso, justificación, retiro)?
- P22. ¿"Asistencia especial con formulario distinto" (V3 §10) se diseña ahora o se posterga?

### 9. Equipamiento
- P23. ¿Modelar equipos de otras áreas (telecomunicaciones, sanidad) en el catálogo ahora, o seguir con vestuario (12 elementos conocidos) y ampliar después?
- P24. ¿Tallas libres (texto) se mantienen tal cual? (Recomendado: sí.)

### 10. Historial
- P25. ¿Confirmas que **nada se borra físicamente** (anotaciones/sanciones, asignaciones, documentos → solo desactivación/cierre)? Recomendado: sí (hoja de servicios oficial).
- P26. ¿Quién puede registrar anotaciones/sanciones (perfil Encargado/Administrador) y quién puede verlas?
- P27. ¿Auditoría de cambios en datos personales (quién modificó y cuándo) se implementa en esta fase o después?

### 11. Multi-sede
- P28. ¿La UI de **Sedes** (CRUD en Configuración) se habilita ahora (prepara multi-sede sin funcionalidad completa) o se deja dormida?
- P29. ¿Los catálogos (cargos, especialidades, unidades, tipos de servicio) serán **globales** (una sola lista para todas las sedes) o **por sede** (columna sedeId)? Recomendado para esta etapa: globales con etiqueta de origen.

### 12. Seguridad/permisos
- P30. ¿Se activan los **permisos efectivos** (backend valida perfil por API + frontend oculta acciones) en esta fase, o al momento de dar acceso a más personas?
- P31. ¿El perfil intermedio se llama **"Encargado"** (como está implementado) o prefieres "Coordinador"?
- P32. ¿Los voluntarios (perfil Voluntario) podrán consultar **solo su propia ficha** (datos personales + sus servicios/asistencia/equipamiento) o solo lectura general no sensible?

---

*Fin del informe. Ningún archivo fue modificado durante la auditoría.*
