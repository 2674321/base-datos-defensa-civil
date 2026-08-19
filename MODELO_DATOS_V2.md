# MODELO DE DATOS V2 — Reestructuración institucional (Defensa Civil, Sede La Serena)

> **ESTADO: APROBADO E IMPLEMENTADO (ago 2026).** Documento de propuesta — PASO 7 del encargo — que sirvió de spec; el modelo fue aprobado y se implementó **completo** (backend `21_MigracionV2.js` + `22–34`, 29 hojas con `ESQUEMA_V2='1.0'` y frontend V2 completo, deployment @13). Salvedades menores: los catálogos con `origen` OFICIAL/INTERNO/CONFIGURABLE se implementaron en hojas propias y no en `_Opciones`; las entidades `Agrupaciones`/`RadiocomSede` (§2.32/§2.11 del encargo) quedaron **fuera de alcance** (roadmap futuro); `HojaServicios` registra eventos automáticos (append-only) y anotaciones/documentos manuales.
> Origen de cada dato: **OFICIAL** (normativa nacional UNI/Defensa Civil), **INTERNO** (práctica de la Sede La Serena), **CONFIGURABLE** (libre por sede), **PENDIENTE DE CONFIRMACIÓN** (a validar).

---

## 1. PASO 2 — Estado actual vs. necesario

### 1.1 Arquitectura actual (verificada en el Spreadsheet real)

| Hoja | Columnas | Uso real |
|---|---|---|
| `Voluntarios` | 20: N°, RUN, Nombres, Ap.Paterno, Ap.Materno, F.Nacimiento, Sexo, Teléfono, Correo, Dirección, Comuna, Contacto Emergencia, Tel. Emergencia, F.Ingreso, **Estado**, **Categoría**, **Cargo**, Observaciones, F.Registro, Últ.Actualización | 1 voluntario real (Activo / Voluntario / cargo vacío) |
| `Catálogo` | ID, Elemento, Tipo, Requiere Talla, Requiere Devolución, Activo, Observaciones | 13 ítems (E-001 vacío + 12 vestuario + Botas de Combate); `Tipo` vacío en todos |
| `Inventario` | ID, Elemento ID, Elemento, Talla, Cantidad, Estado, N° Serie, Observaciones | vacío |
| `Entregas` | 17 cols con snapshots (voluntario, RUN, elemento, talla) + devoluciones parciales | vacío |
| `Config` | Parámetro, Valor, Tipo, Ayuda | ESTADOS, CATEGORIAS (Aspirante,Voluntario), SEXOS, **CARGO (vacío)**, TIPOS_ELEMENTO (vacío), STOCK_BAJO=5 |
| `Log` | Timestamp, Página, Evento, Resultado, Detalle | historial de eventos desde v0.2.0 |

Backend: 12 archivos `.js`; API JSON con respuestas canónicas `{ok, data, error}` (23 funciones; la Web App usa 21 vía `App.pedir`). Frontend v0.7.1: 9 archivos, router `#/`, design system institucional completo.

### 1.2 PASO 3 — Errores conceptuales y entidades mezcladas

| # | Problema actual | Consecuencia | Solución V2 |
|---|---|---|---|
| E1 | `Estado` (Activo/Inactivo/Suspendido/Egresado) = situación administrativa; `Categoría` = Aspirante/Voluntario; `Cargo` = función. **Tres dimensiones distintas en una sola fila, sin historial.** | Baja un voluntario → se pierde su grado/cargo/anterioridad; reactivar es destructivo | Entidades separadas + historiales (nunca sobrescribir) |
| E2 | **No existe el Grado** (7 grados oficiales UNI) | El sistema no modela la jerarquía institucional; solo "cargo" libre | Entidad `Grados` + `HistorialGrados` |
| E3 | `Cargo` como texto plano con lista en Config; la ayuda de Config sugiere "Jefe de Grupo, Operador de Radio" — **mezcla cargo con rol de servicio y con especialidad** | Imposible saber quién es Comandante/Jefe de Sede, ni desde cuándo | `Cargos` + `HistorialCargos` + `Areas`; roles de servicio aparte |
| E4 | Categorías = Aspirante/Voluntario; **"Disponible" mezclado como grado** — no existía en el modelo | No se puede registrar al personal en la categoría Disponible | **RESUELTO EN V3.1**: Grados = 6 oficiales sin Disponible; Categorías configurable = Aspirante, Disponible, Voluntario, Reserva (esquema 1.1) |
| E5 | Baja = cambiar estado + anotación en Observaciones | Sin fecha/motivo de egreso estructurados, sin historial | `Voluntarios.fechaIngreso/fechaEgreso/motivoEgreso` + `HojaServicios` |
| E6 | RUN único bloquea también a Egresados | No se puede reincorporar | Bloqueo solo entre activos (misma persona puede reaparecer; se reactiva su ficha) |
| E7 | Sin especialidades, subespecialidades, credenciales ni capacitaciones | Radioperador/RPAS/Sanidad sin registrar, vencimientos invisibles | 6 entidades nuevas |
| E8 | Sin Servicios ni Asistencia (solo placeholders) | No hay registro operativo | Entidades núcleo de la fase 3 |
| E9 | Inventario sin área y Catálogo sin tipo | No se distingue vestuario/telecomunicaciones/sanidad | Campo `Area` + `Tipo` |
| E10 | Sin unidades internas (F.T. Delta, RPAS, Rescate...) | No hay estructura operativa intermedia | `UnidadesInternas` + `IntegrantesUnidad` |
| E11 | Sin sedes, ubicación, agrupaciones, radiocomunicaciones de sede | No se puede escalar ni ubicar | Entidades `Sedes`, `RadiocomSede` (fase 8/9) |
| E12 | Sin usuarios ni permisos (`getSesion` solo identidad) | Cualquiera con acceso hace todo | `Usuarios` + `Permisos` (diseño, sin auth externo) |
| E13 | Sin grupo sanguíneo | La tarjeta de identificación oficial (validez 2 años) lo requiere | 2 campos: ABO + Rh |
| E14 | Config plana (pares clave/valor) | No sirve para catálogos por entidad | Tablas maestras propias (Grados, Cargos, Áreas, Especialidades, TiposServicio, EstadosAsistencia...) |
| E15 | Sin hoja de servicios | Requisito oficial (historial: anotaciones, ascensos, retiros, cursos, traslados) | Entidad `HojaServicios` (nunca borrar) |
| E16 | Sin documentos adjuntos ni referencias | Resoluciones, certificados, licencias sin respaldo | `Documentos` |

---

## 2. PASO 4 — MODELO DE DATOS V2 (32 entidades)

Convenciones: **1 entidad = 1 hoja**; IDs numéricos correlativos (patrón actual) o prefijo (patrón E-/INV-/ENT-); relaciones por ID con snapshot del nombre en la fila (patrón Entregas ya validado); columnas de sistema `fechaRegistro`/`ultimaActualizacion` al final; fechas como texto `dd/mm/aaaa` en API; `origen` = OFICIAL | INTERNO | CONFIGURABLE | PENDIENTE.

### 2.1 Sedes (1 fila = 1 sede; concepto multisede, SIN plataforma nacional)

- **Propósito:** identificar la sede y su ubicación (prepara multisede sin implementarla).
- **Campos:** id, nombre, direccion, comuna, region, lugar, coordenadas, licenciaRadiocomunicaciones, indicativo, datosTecnicosRadio, responsableId (→Voluntarios), observaciones, sistema.
- **Claves:** id único; FK responsableId.
- **Origen:** OFICIAL los conceptos (sede, Jefe de Sede); INTERNO los datos reales. **Migración:** siembra 1 fila "La Serena" en `crearEstructuraBase`.
- **Nota:** con `Sedes.id` toda entidad dependiente puede escalar a multisede sin rediseño (columna `sedeId` opcional, no obligatoria por ahora).

### 2.2 Personas (1 fila = 1 persona; datos que persisten aunque deje de ser voluntario)

- **Propósito:** separar datos personales (permanentes) de la condición de voluntario (administrativa).
- **Campos:** id, run (único, validado módulo 11), nombres, apPaterno, apMaterno, fechaNacimiento, sexo, nacionalidad, direccion, comuna, telefono, correo, contactoEmergenciaNombre, contactoEmergenciaTelefono, grupoABO (A/B/AB/O), factorRh (+/-), observaciones, sistema.
- **Relaciones:** 1:1 con Voluntarios (FK `personaId`); 1:N Documentos; 1:N HojaServicios.
- **Obligatorio:** nombres, apPaterno, run (al ser voluntario). **Opcional:** resto.
- **Origen:** OFICIAL el RUN/grupo sanguíneo (tarjeta de identificación); INTERNO el resto.
- **Migración:** copiar de Voluntarios actual (columnas A–L + O/P) sin destruir la hoja original (ver §5).

### 2.3 Voluntarios (1 fila = 1 vínculo activo o histórico con la sede)

- **Propósito:** condición administrativa (estado, categoría, fechas, antigüedad). No duplica datos personales.
- **Campos:** id, personaId (FK), sedeId, estado (configurable: Activo, Inactivo, Suspendido, Egresado...), categoria (configurable: Aspirante, Disponible, Voluntario, Reserva — V3.1), fechaIngreso, fechaEgreso (null si activo), motivoEgreso, observaciones, sistema.
- **Historial:** el estado/categoría actual + `HojaServicios` para transiciones (nunca perder el pasado).
- **Origen:** OFICIAL la condición de Aspirante (instrucción básica mín. 3 meses) y la condición de Disponible (Ley de Reclutamiento: 1 año, mín. 4 h/semana); INTERNO los datos. **V3.1:** Disponible NO es grado — es categoría (ver 2.4).
- **Migración:** split de la hoja actual en Personas + Voluntarios (idempotente, con backup).

### 2.4 Grados (catálogo OFICIAL, 6 filas fijas por defecto — V3.1)

- **Propósito:** jerarquía institucional (UNI 2018: distintivos de grado).
- **Campos:** id, nombre, orden (1=Comandante Local … 6=Voluntario), insignia (descripción OFICIAL: 4 barras, 3 barras, 2, 1, V+barra, V+estrella, V), activo, origen=OFICIAL, observaciones.
- **Grados (7):** 1 Comandante Local; **2 Jefe de sede** (V3.4H: grado real, 3 barras UNI); 3 Instructor Mayor; 4 Instructor; 5 Subinstructor; 6 Voluntario Mayor; **7 Voluntario** (grado de ingreso). **V3.1:** "Disponible" **NO es un grado** — es categoría de personal (Ley de Reclutamiento: 1 año, mín. 4 h/semana; ROF-S Art. 18/20) y vive en Config `CATEGORIAS`. La semilla lo elimina del catálogo; si la hoja ya lo tenía sembrado, la sincronización de `crearEstructuraV2` lo elimina (sin referencias) o lo desactiva con observación (con referencias en Historial Grados). **V3.4H:** "Jefe de sede" es ahora un grado real (orden 2) en GRADOS_V2, eliminando la distinción cargo/grado que existía desde V3.4F.
- **No editable por el usuario** (OFICIAL) — puede marcarse `activo=false` si la sede no lo usa.

### 2.5 HistorialGrados (1 fila = 1 asignación/cese de grado)

- **Campos:** id, voluntarioId, gradoId, fechaDesde, fechaHasta (null si vigente), resolucion (número de resolución exenta si existe), quienAsigno, motivo, requisitosEvaluados (texto: ✓/✗/⚠ por requisito), excepcion (bool), excepcionDetalle (quién/fecha/motivo — regla "advertir, no bloquear"), origen, observaciones, sistema.
- **Regla:** nunca se modifica una fila; el grado vigente = fila con `fechaHasta=null`. Ascenso = cerrar la anterior (fechaHasta) + abrir la nueva.
- **Requisitos OFICIALES (advertencia, no bloqueo):** Instructor Mayor: Instructor ≥2 años, ≥2 especialidades; Instructor: ≥1 especialidad, Subinstructor ≥2 años; Subinstructor: Voluntario Mayor ≥2 años; Voluntario Mayor: 2 años como Voluntario. La resolución la dicta la DG (ascenso formal = resolución exenta) — el sistema solo evalúa y avisa.

### 2.6 Cargos (catálogo CONFIGURABLE con semilla INTERNO/OFICIAL)

- **Propósito:** funciones dentro de la sede. **Cargo ≠ Grado** (ROF-S Art. 58: la superioridad se ejerce por grado o por mando).
- **Campos:** id, nombre, areaId (FK → Areas), ordenJerarquico, descripcion, origen (OFICIAL: Comandante Local, Jefe de Sede, asesores de plana mayor, Jefe de Equipo, cuerpo de instructores; INTERNO: Ayudante del Comandante, Ayudante del Jefe), activo, observaciones.
- **Semilla sugerida (validar con el usuario):** Comandante Local (OFICIAL, Art. 11), Jefe de Sede/Jefe Local (OFICIAL; requisito: Instructor Mayor ≥3 años), Ayudante del Comandante (INTERNO), Ayudante del Jefe (INTERNO), más los de la sede.

### 2.7 HistorialCargos (1 fila = 1 período en un cargo)

- **Campos:** id, voluntarioId, cargoId, fechaDesde, fechaHasta (null si vigente), quienAsigno, resolucion, observaciones, sistema. Vigente = `fechaHasta=null`. Misma regla de no-modificar.
- **V3.4F (cargos múltiples):** un voluntario puede tener **varios cargos vigentes a la vez** (no hay exclusividad); `asignarCargoV2` no cierra el anterior y rechaza re-asignar el mismo cargo vigente (`DUPLICADO`). Cierre explícito: `terminarCargoV2(id, datos)` / `terminarCargoVoluntarioV2(volId, cargoId, datos)` (idempotentes, `yaCerrado`). `obtenerCargosVigentesV2` y `obtenerPersonaV2.cargosVigentes` (con `cargoVigente` = más reciente por fechaDesde).

### 2.8 Areas (CONFIGURABLE, semilla INTERNA de la Sede La Serena)

- **Propósito:** estructura interna de la sede (Mando + 8 áreas).
- **Campos:** id, nombre, orden, encargadoId (FK → Voluntarios), descripcion, origen=INTERNO, activo, observaciones.
- **Semilla (§7 del encargo):** 1 Mando; 2 A-1 Personal; 3 A-2 Prevención de Riesgos y Seguridad; 4 A-3 Operaciones; 5 A-4 Logística; 6 Vestuario y Equipo; 7 Telecomunicaciones e Informática; 8 Sanidad; 9 Relaciones Públicas. *(La NOMENCLATURA alfanumérica A-1… es INTERNA de la sede — no se presenta como normativa nacional.)*

### 2.9 Especialidades (CONFIGURABLE; 3 OFICIALES por defecto)

- **Campos:** id, nombre, areaId (FK opcional), descripcion, origen, activo, observaciones.
- **Semilla OFICIAL (UNI/Defensa Civil):** Sanidad (Médico, Enfermero universitario, TENS, Auxiliar), Telecomunicaciones (Radioperador — 3 niveles Básico/Intermedio/Avanzado, Resol/Exta N°293 15-ENE-2024), Administración Logística (Adm. Albergues, Adm. Centros de Acopio, Operador de Equipos Logísticos).
- **Semilla INTERNA (Sede La Serena, §8):** Operador RPAS, Rescate Técnico con Cuerda, Búsqueda y Rescate, Fuerza de Tarea Delta, Grupo de Rescate Animal (futuro), Stop The Bleed. ⚠️ Nota del informe: "Delta" OFICIAL = Código Delta de radiocomunicaciones (RAD-B cap. 4); "Fuerza de Tarea Delta" como especialidad es **INTERNA** — se etiqueta como tal y se sugiere tratarla como Unidad Interna (§2.16) en lugar de especialidad.
- **Campos (V3.4G):** id, nombre, areaId (FK opcional), descripcion, origen, activo, observaciones, **niveles (col 8, lista separada por ';' — opcional)**.
- **V3.4F:** `ESPECIALIDADES_V2` = 9 — las 8 anteriores (incluida 'Auxiliar de Sanidad', ex 'Sanidad') + **'Sistema de Comando de Incidentes (SCI)'** origen **RECONOCIDA** (área A-3 Operaciones, UNI nivel nacional). El catálogo se siembra con `migrarV34F()` pero **no se asigna a ningún voluntario** hasta definición institucional.
- **V3.4G:** `ESPECIALIDADES_V2` = **9** (sin cambios de cantidad). **SCI = UNA especialidad con `niveles` en el campo** (`Introductorio; Básico Online; Básico; Intermedio; Avanzado`) — **ya NO como subespecialidades** (las 5 subespecialidades de nivel creadas por V3.4F se eliminan en `migrarV34G`). **Operador RPAS = única especialidad INTERNA** — los modelos habilitados viven en la credencial del voluntario (`VolCredenciales.modelosHabilitados`), no como subespecialidades.

### 2.10 Subespecialidades (CONFIGURABLE, hijos de una especialidad)

- **Campos (V3.4G):** id, especialidadId (FK), nombre, descripcion, origen, activo, observaciones, **niveles (col 8, lista separada por ';' — opcional)**.
- **Ejemplos (§9):** Telecomunicaciones → Radioaficionado; Sanidad → Stop The Bleed.
- **V3.4F:** `SUBESPECIALIDADES_V2` = 7: Radioaficionado, Stop The Bleed + **5 niveles SCI** (Introductorio, Básico Online, Básico, Intermedio, Avanzado) bajo la especialidad SCI, todos origen RECONOCIDA. Las habilitaciones RPAS (MAVIC SERIES MINI 2 / ENTERPRISE 3 / ENTERPRISE 3 PRO) se crean por siembra como subespecialidades INTERNAS de Operador RPAS.
- **V3.4G:** `SUBESPECIALIDADES_V2` = **2**: Radioaficionado (de Telecomunicaciones, **con `niveles` = `Aspirante; Novicio; General`**, INTERNO) y Stop The Bleed (de Auxiliar de Sanidad). **Se eliminaron del catálogo** las 5 subespecialidades de nivel SCI y las 4 habilitaciones RPAS (MAVIC SERIES / MINI 2 / ENTERPRISE 3 / ENTERPRISE 3 PRO); cualquier asignación vigente se cerró (`activo=false`) y los modelos RPAS se trasladaron a la credencial del voluntario. Los niveles ya **no se modelan como subespecialidades**.

### 2.11 VoluntarioEspecialidades (N:N entre Voluntarios y Especialidades/Subespecialidades)

- **Campos:** id, voluntarioId, especialidadId (FK, opcional si es sub), subespecialidadId (FK, opcional), fechaAsignacion, nivel (p. ej. Radioperador: Básico/Intermedio/Avanzado — texto libre), credencialId (FK opcional → Credenciales), observaciones, sistema, **activo (V3.3, col 11)**.
- **Regla:** solo válido si al menos una de especialidadId/subespecialidadId está presente.
- **INTEGRIDAD HISTÓRICA (V3.3):** `quitarEspecialidadV2` NO elimina la fila — cierra la relación con `activo=false` y motivo en observaciones (marcador `Cierre (V3.3)`). Vacío = vigente; solo `false` = cerrada. `listarEspecialidadesVoluntarioV2(voluntarioId, {incluirCerradas})`. Las cerradas no cuentan para requisitos de ascenso ni aparecen en listas vigentes.

### 2.12 Credenciales (CONFIGURABLE, con vencimiento)

- **Propósito:** licencias y certificaciones con respaldo (RPAS, radioaficionado, cursos, títulos).
- **Campos:** id, nombre, emisor, numero, fechaEmision, fechaVencimiento (null = sin vencimiento), documento (referencia a archivo/enlace), estado (Vigente, Por vencer, Vencida, Revocada — derivable + editable), observaciones, sistema.
- **Relación:** 1:N VoluntarioCredenciales.
- **INTEGRIDAD HISTÓRICA (V3.3):** `quitarCredencialV2` NO elimina la relación — la revoca con `estado='Revocada'` (ya contemplado en `ESTADOS_CREDENCIAL`) y motivo en observaciones. La relación revocada no aparece en `obtenerVencimientosV2` ni en `listarCredencialesVoluntarioV2` (salvo `{incluirCerradas}`), y su estado prevalece sobre el derivado del catálogo.

### 2.13 VoluntarioCredenciales (N:N Voluntarios × Credenciales)

- **Campos (V3.4G):** id, voluntarioId, credencialId, fechaObtencion, estado, observaciones, sistema, **nivel (col 9, p. ej. Radioaficionado: Novicio)**, **modelosHabilitados (col 10, lista ';' — RPAS: modelos de drones del voluntario)**.

### 2.14 Capacitaciones (catálogo de cursos) y 2.15 VoluntarioCapacitaciones

- **Capacitaciones:** id, nombre, institucion, instructor, tipo (Interna/Externa), horas, vigenciaMeses (opcional), origen, activo, observaciones.
- **VoluntarioCapacitaciones:** id, voluntarioId, capacitacionId, fecha, fechaVencimiento (derivada si vigenciaMeses), aprobado (bool), calificacion, respaldo, observaciones, sistema, **activo (V3.3, col 12)**.
- **INTEGRIDAD HISTÓRICA (V3.3):** `quitarCapacitacionV2` NO elimina la fila — cierra con `activo=false`. La relación cerrada no aparece en vigentes ni en `obtenerCapacitacionesVencidasV2`; consultable con `{incluirCerradas}`.

### 2.16 UnidadesInternas (CONFIGURABLE; semilla §8 INTERNA)

- **Propósito:** agrupaciones operativas de la sede (F.T. Delta, grupo RPAS, grupo de rescate...). **No son grados ni cargos.**
- **Campos:** id, nombre, descripcion, estado (Activa/Inactiva), jefeId (FK), fechaCreacion, observaciones, sistema.
- **Semilla:** Fuerza de Tarea Delta (INTERNO), Grupo de Rescate Animal (futuro, INTERNO), otras a confirmar.

### 2.17 IntegrantesUnidad (N:N)

- **Campos:** id, unidadInternaId, voluntarioId, rolEnUnidad (texto libre: Jefe, Subjefe, Operador, Integrante...), fechaIngreso, fechaSalida (null si vigente), observaciones, sistema.

### 2.18 Servicios (núcleo operativo)

- **Campos:** id, tipoServicioId (FK → catálogo configurable), nombre, descripcion, fecha, horarioInicio, horarioFin, lugar, direccion, comuna, region, responsableId (FK), telefonoContacto, rolesRequeridos (texto), alimentacion (bool), agua (bool), alojamiento (bool), transporte (bool), apoyoLogistico (bool), observaciones, sistema.
- **Tipos de servicio (CONFIGURABLE, semilla):** Centro de Resguardo Temporal, Albergue, Búsqueda de personas, Puesto sanitario, Direccionamiento de personas, Votaciones, Apoyo institucional, Emergencia, Operativo, Capacitación, Otro.
- **Regla:** rol dentro del servicio ≠ cargo institucional (los roles se registran en ServicioVoluntarios, no en Cargos).

### 2.19 ServicioVoluntarios (asignación masiva y por persona)

- **Campos:** id, servicioId, voluntarioId, rolEnServicio, asignadoPor, fechaAsignacion, estado (Asignado → flujo de asistencia; **Retirado/Reemplazado = cierre lógico V3.3**), observaciones, sistema.
- **Función:** asignación masiva (checkbox de lista → N filas en un solo setValues).
- **INTEGRIDAD HISTÓRICA (V3.3):** `quitarVoluntarioServicioV2` NO elimina la fila — marca `Retirado` (o `Reemplazado`) con motivo en observaciones. Conteos (`asignados` en listarServiciosV2), `obtenerServicioV2.asignados` y `yaAsignados` de la asignación masiva ignoran las cerradas → **re-asignar a un retirado crea una fila NUEVA**. `obtenerServicioV2` devuelve además `cerrados` (historial) y acepta `{incluirCerradas}`.

### 2.20 Asistencia (1 fila = 1 marcaje de un voluntario a un servicio)

- **Campos:** id, servicioId, voluntarioId, tipoAsistencia (Operativa / Régimen e instrucción — Art. 18), estado (CONFIGURABLE: Asignado, Presente, Ausente, Ausente justificado, Reemplazado, Retirado), horas (número), motivo (para ausencias), responsableRegistro, observaciones, sistema.
- **Regla OFICIAL (Art. 18, asistencia a servicios):** mínimos de asistencia — Voluntarios 50 % (régimen) / 60 % (operativa); Disponibles 70 % / 80 %. **No se codifican irreversiblemente**: viven en Config (parámetros numéricos) para reportes comparativos; el sistema informa, no sanciona.
- **Resumen:** FUERZA TOTAL / FORMAN (Presente) / FALTAN (Ausente + Ausente justificado + Reemplazado?) — composición configurable.

### 2.21 HojaServicios (timeline perpetuo — NUNCA se borra ni edita)

- **Campos:** id, voluntarioId, tipoEvento (INGRESO, ASCENSO, CARGO, SERVICIO, CAPACITACION, ESPECIALIDAD, CREDENCIAL, RETIRO_TEMPORAL, RECONOCIMIENTO, ANOTACION, SITUACION_ADMINISTRATIVA, EGRESO...), fecha, detalle (texto), referenciaId (opcional: ID de la entidad origen), quienRegistro, sistema.
- **Escritura:** solo append; los eventos se generan automáticamente desde los dominios (ascenso, egreso, servicio...) + anotaciones manuales.

### 2.22 Anotaciones (sanciones y notas del historial — Art. 68)

- **Campos:** id, voluntarioId, tipo (Observación, Amonestación, Reprensión, Suspensión del servicio, Baja del servicio, Nota positiva), fecha, detalle, autor, sancion (bool), vigencia (fechas para suspensiones), observaciones, sistema, **activo (V3.3, col 12)**.
- **INTEGRIDAD HISTÓRICA (V3.3):** `quitarAnotacionV2` NO elimina la fila (es registro institucional) — la desactiva con `activo=false` y motivo en observaciones (`Desactivación (V3.3)`). `listarAnotacionesVoluntarioV2(voluntarioId, {incluirCerradas})`.

### 2.23 Documentos

- **Campos:** id, voluntarioId (opcional; también sedeId opcional), tipo (Resolución, Certificado, Licencia, Curso, Hoja de vida, Otro), fecha, descripcion, referencia (n° documento), enlace/archivo (URL o Drive ID), observaciones, sistema, **activo (V3.3, col 12)**.
- **INTEGRIDAD HISTÓRICA (V3.3):** `quitarDocumentoV2` NO elimina la fila — la desactiva con `activo=false`. `listarDocumentosVoluntarioV2(voluntarioId, {incluirCerradas})`.

### 2.24 CatalogoEquipamiento (evolución del Catálogo actual)

- **Campos actuales (E-xxx) + nuevos:** tipo (Vestuario, Calzado, Accesorio, Equipo, Radio, Herramienta... — CONFIGURABLE), areaId (FK → Areas; p. ej. Telecomunicaciones → Radio portátil), requiereTalla (bool), requiereDevolucion (bool), tallasDisponibles (texto libre: "S,M,L,XL,XXL" o "38,40,42,44" — sin lista fija), activo, observaciones.
- **Semilla = los 12 ítems de vestuario conocidos + Botas de Combate** (ya sembrados; no inventar más).

### 2.25 Inventario (evolución)

- **Campos actuales (INV-xxx) + nuevos:** areaId (derivada del elemento), ubicacion, serieSede (n° serie institucional si existe). Mismo modelo A de stock (fila por elemento+talla+estado+cantidad) — validado, sin cambios de fondo.

### 2.26 Entregas y 2.27 Devoluciones

- **Entregas:** igual al modelo actual (snapshots + pendientes). Se mantiene.
- **Devoluciones:** hoy la devolución es columnas dentro de Entregas (17 cols). **V2:** tabla separada `Devoluciones` (id, entregaId, fecha, cantidadDevuelta, cantidadDanada, cantidadExtraviada, responsable, observaciones) para permitir **múltiples devoluciones parciales por entrega** (hoy solo una). Migración: mover las columnas N–Q a filas Devoluciones (idempotente).

### 2.28 Configuracion (ampliación)

- Estructura actual (Parámetro/Valor/Tipo/Ayuda) + nuevos parámetros numéricos de asistencia (minimos %, umbrales) y de alertas (credenciales por vencer, capacitaciones por vencer). Los **catálogos** (grados, cargos, áreas, especialidades, tipos de servicio, estados de asistencia) dejan de vivir aquí y pasan a **sus propias hojas** (2.4–2.20) — Config queda solo para parámetros escalares y listas cortas (SEXOS, tallas sugeridas).

### 2.29 Usuarios y 2.30 Permisos (diseño; sin auth externo)

- **Usuarios:** id, correo (identidad Google), perfilId (FK), activo, observaciones. El perfil se resuelve en `getSesion()`.
- **Permisos:** id, perfilId (Administrador / Encargado / Voluntario / Consulta), modulo (o *), accion (leer/escribir/gestionar), activo. Simplificación V2: matriz fija por perfil en constantes, con `Permisos` como tabla para excepciones.
- **INTEGRIDAD HISTÓRICA (V3.3):** `eliminarPermisoV2` NO elimina la fila — revoca la excepción con `activo=false` y motivo en observaciones (`Revocación (V3.3)`). `listarPermisosV2` sigue mostrando TODAS las excepciones con su `activo` (vista administrativa de lo revocado).
- **Regla de privacidad:** datos personales (RUN, dirección, teléfono, emergencia, grupo sanguíneo, anotaciones) solo visibles/editables según perfil; Consulta = solo lectura de lo no sensible; Voluntario = consulta de SU ficha y sus servicios.

### 2.31 Log (se mantiene)

### 2.32 Agrupaciones (CONFIGURABLE — fase posterior)

- **Propósito:** agrupaciones de la sede hacia afuera o internas de otra naturaleza (una sede puede tener varias agrupaciones; encargados; participación con otras instituciones). No confundir con Unidades Internas (operativas) ni con Cargos.
- **Campos:** id, nombre, tipo (INTERNO: por confirmar), encargadoId (FK → Voluntarios), descripcion, activo, observaciones, sistema.
- **Relación:** 1:N IntegrantesAgrupacion (id, agrupacionId, voluntarioId, rol, fechaIngreso, fechaSalida, observaciones) — misma forma que IntegrantesUnidad; se crea cuando se necesite (roadmap fase 12 o a pedido).
- **Origen:** INTERNO/PENDIENTE DE CONFIRMACIÓN (no hay catálogo oficial de "agrupaciones" en los ROF revisados).

---

## 3. PASO 5 — ARQUITECTURA FUNCIONAL V2 (módulos y pantallas)

La Web App sigue siendo la interfaz principal; Sheets solo persistencia; backend fuente de verdad. Sin frameworks nuevos.

| # | Módulo | Pantallas (rutas) | Backend nuevo |
|---|---|---|---|
| 1 | Personas/Voluntarios | `#/voluntarios` (lista + filtros por estado/categoría/grado/cargo/área), `#/personas/:id` | `crearPersona`, `crearVoluntario` (2 pasos), `actualizarPersona`, `reactivarVoluntario`, `listarVoluntariosV2` (con grado/cargo/área vigentes) |
| 2 | Grados y Cargos | `#/grados` (catálogo OFICIAL + requisitos ✓/✗/⚠), `#/cargos` (catálogo + organigrama simple), asignación desde ficha | `asignarGrado`, `asignarCargo`, `obtenerRequisitosGrado` (advertencia + excepción con quién/fecha/motivo) |
| 3 | Ficha V2 | `#/ficha/:id` con secciones: Datos personales, Estado, Grado, Cargo, Área, Antigüedades, Especialidades, Subespecialidades, Licencias, Credenciales, Grupo sanguíneo, Contacto, Equipamiento, Servicios, Asistencia, Capacitaciones, Hoja de servicios, Historial | `obtenerFichaV2` (agregador por sección, 1 llamada) |
| 4 | Especialidades/Credenciales/Capacitaciones | `#/especialidades`, `#/credenciales` (con alertas de vencimiento), `#/capacitaciones` | CRUD + `obtenerVencimientosProximos` |
| 5 | Servicios | `#/servicios` (crear, listar, asignar masiva, cerrar) | `crearServicio`, `asignarVoluntariosServicio` (batch), `cerrarServicio` |
| 6 | Asistencia | `#/asistencia` (marcaje por servicio, resumen FUERZA TOTAL/FORMAN/FALTAN, estadísticas anual/trimestral/por tipo/servicio/individual/grado/categoría) | `registrarAsistencia` (batch), `obtenerResumenAsistencia`, `obtenerEstadisticasAsistencia` (sin codificar % mínimos) |
| 7 | Hoja de servicios | `#/historial/:id` (timeline del voluntario, perpetuo) | `obtenerHojaServicios` (append-only) |
| 8 | Unidades internas | `#/unidades` (listado, integrantes, estado) | CRUD + `gestionarIntegrante` |
| 9 | Equipamiento V2 | `#/catalogo`, `#/inventario` (agrupado por área), `#/entregas` (asistente actual + múltiples devoluciones) | `registrarDevolucionV2` (tabla aparte) |
| 10 | Dashboard V2 | KPIs: fuerza total, activos, disponibles, aspirantes, distribución por grado/cargo, asistencia reciente, próximos servicios, servicios activos, alertas (credenciales/capacitaciones por vencer, stock bajo, pendientes), novedades/actividad reciente | `obtenerResumenDashboardV2` (extiende el actual) |
| 11 | Configuración V2 | `#/configuracion` (parámetros + tablas maestras por sede: cargos, áreas, especialidades, tipos de servicio, estados de asistencia, tipos de documento) — etiquetado OFICIAL/INTERNO | `obtenerConfiguracionV2`, `guardarConfiguracion` (solo perfil Administrador) |
| 12 | Administración | `#/usuarios` (perfiles), `#/auditoria` (Log), backup manual | `gestionarUsuario`, `crearBackup` |
| 13 | Reportes | `#/reportes` (asistencia por período/tipo, equipamiento por área, vencimientos, hoja de servicios imprimible) | agregadores de lectura |

**UI/UX:** se mantiene el design system v0.7.1 (identidad institucional, logo App.LOGO, paleta, KPIs semánticos). Nuevos patrones: ficha por secciones (acordeón/tabs jerárquicos), paneles de catálogo con columna de origen (OFICIAL/INTERNO/CONFIGURABLE con chip de color), organigrama visual (fase posterior), tabla maestra editable solo por Administrador.

**Reglas de privacidad en UI:** los datos sensibles se muestran según perfil; Consulta no ve RUN completo ni emergencia; los datos personales nunca aparecen en reportes impresos salvo autorización.

---

## 4. PASO 6 — ROADMAP (12 fases, en el orden del encargo)

> **ESTADO: TODAS LAS FASES 1–12 IMPLEMENTADAS (ago 2026)** salvo: módulo 3 (ficha V2 por secciones — se mantiene la ficha v0 con 6 tabs), módulo 12 `#/auditoria` (el Historial global de la Web App cubre la auditoría), `crearBackup()` (backup manual CLI), y módulo 13 reportes de asistencia por período/equipamiento por área (Reportes V2 cubre general/nómina/alertas). Pendientes futuros: `Agrupaciones`/`RadiocomSede`, filtrado de datos sensibles por perfil en UI.

Cada fase = hojas + backend + frontend + verificación (auditoría + test de rutas + node --check) + `clasp push` + deploy en la misma URL + entrada en AGENTS.md. **Una fase a la vez, aprobada por el usuario.**

1. **Modelo de datos V2** — crear todas las hojas nuevas + semillas + `crearEstructuraBaseV2` + migración idempotente con backup (no toca datos existentes: crea `Personas`/`Voluntarios` nuevos; la hoja `Voluntarios` actual se conserva como referencia hasta la fase 2).
2. **Personas/Voluntarios** — split de la hoja actual, campos nuevos (ABO/Rh, nacionalidad, fecha/motivo egreso), reactivación de Egresados, frontend de lista/ficha de datos.
3. **Grados/Cargos/Historial** — catálogos + asignación con historial + evaluación de requisitos (advertencia, no bloqueo) + antigüedades calculadas (institucional/en grado/en cargo, con retiro temporal configurable).
4. **Especialidades/Subespecialidades/Credenciales/Capacitaciones** — CRUD + alertas de vencimiento.
5. **Servicios** — núcleo + tipos configurables + asignación masiva + roles.
6. **Asistencia** — marcaje, estados configurables, tipos operativa/régimen, resumen FUERZA TOTAL/FORMAN/FALTAN, estadísticas (sin % codificados).
7. **Hoja de servicios** — timeline perpetuo automático + anotaciones (Art. 68) + documentos.
8. **Unidades internas** — F.T. Delta, RPAS, etc. + integración con ficha.
9. **Inventario/Equipamiento V2** — área/tipo en catálogo, inventario por área, devoluciones múltiples, vestuario ampliado (solo lo conocido).
10. **Dashboard avanzado** — KPIs V2 + alertas de credenciales/capacitaciones + próximos servicios + organigrama simple.
11. **Permisos** — Usuarios + matriz por perfil + filtrado de datos sensibles en UI.
12. **Reportes** — módulo de reportes y exportación.

**Fuera de alcance por ahora:** plataforma nacional/multisede operativa, auth externo (se mantiene MYSELF), motor automático de ascensos, Forms.

---

## 5. PASO 7 — Decisiones pendientes (con recomendación por defecto)

> **ESTADO: LAS 8 DECISIONES FUERON APROBADAS POR EL USUARIO E IMPLEMENTADAS** (ver AGENTS.md §12 "FASE V2 COMPLETA").

> Si no hay objeción, se aplica la **recomendación**. Cualquier cambio se refleja en AGENTS.md antes de implementar.

| # | Decisión | Recomendación por defecto |
|---|---|---|
| 1 | Personas vs Voluntarios | **2 entidades** (Personas + Voluntarios): conserva datos al egresar y permite reactivar sin reingresar datos |
| 2 | Grados | **7 grados** (Comandante Local … Voluntario — **V3.1: sin Disponible**, grado de ingreso = Voluntario; **V3.4H: Jefe de sede es grado real orden 2**); Categoría Disponible (1 año, 4 h/semana) en Config CATEGORIAS |
| 3 | F.T. Delta | **Unidad Interna** (no especialidad, no grado): evita colisión con el Código Delta OFICIAL de radiocomunicaciones; se etiqueta INTERNO |
| 4 | Áreas (semilla) | **Mando + 8 áreas** (A-1 Personal, A-2 Prevención de Riesgos y Seguridad, A-3 Operaciones, A-4 Logística, Vestuario y Equipo, Telecomunicaciones e Informática, Sanidad, Relaciones Públicas) |
| 5 | Devoluciones | **Tabla separada `Devoluciones`** con múltiples devoluciones parciales por entrega (hoy solo 1 por entrega, en columnas) |
| 6 | Categorías | **Aspirante, Disponible, Voluntario, Reserva** (configurable — V3.1); Disponible es categoría, no grado |
| 7 | Permisos | **Matriz fija por perfil en constantes** + tabla `Permisos` solo para excepciones (más simple y auditable) |
| 8 | RUN de Egresados | **Reactivar la ficha** (permitir reingreso de Egresados, bloqueo solo entre activos) |

---

## 6. Migración (detallada)

**Reglas:** backup previo; idempotente (re-ejecutable sin daño); **nunca destruir** hojas ni columnas existentes; documentada en Log; control de versión de esquema.

1. **Control de versión:** `PropertiesService.getScriptProperties()` → clave `esquemaV2 = '1.0'`; cada migración registra en `Log` y avanza la versión solo al terminar completa.
2. **Backup:** (a) CLI antes de cualquier cambio estructural: export xlsx local (`curl` del §6 de AGENTS.md) — manual, responsabilidad del usuario; (b) backend `crearBackup()` (fase 12) copia el Spreadsheet a una carpeta Drive `D.C. La Serena — Backups` con fecha; por ahora solo (a).
3. **Fase 1 (solo agregar):** `crearEstructuraV2()` crea las hojas nuevas + siembra catálogos (Grados 7, Areas 9, Cargos semilla, Especialidades, Subespecialidades, TiposServicio, EstadosAsistencia, TiposDocumento, Categorías). **No toca ninguna hoja existente.** Idempotente: `if (sh) no recrear` + siembra solo si la hoja está vacía.
4. **Fase 2 (split Voluntarios → Personas + Voluntarios):** `_migrarVoluntariosV2()` lee la hoja actual (20 cols), crea Personas y Voluntarios **solo para filas no migradas** (se detecta por RUN ya existente en Personas); copia estado/categoría/fechas; agrega fila de ingreso en HojaServicios. La hoja `Voluntarios` original se conserva (renombrada `Voluntarios_v0` oculta o intacta a criterio del usuario) — jamás se borra ni se pisa.
5. **Fase 9 (devoluciones):** `_migrarDevolucionesV2()` lee Entregas (cols N–Q) → filas en `Devoluciones`; idempotente por `entregaId` (no duplica si ya existe). Columnas originales se conservan (dejan de usarse para nuevos movimientos).
6. **Re-ejecución segura:** todas las migraciones verifican existencia previa antes de insertar (RUN único en Personas, entregaId en Devoluciones, hoja existente en Estructura).

---

## 7. Organización del código V2 (nuevos archivos, al final de la numeración)

| Archivo | Contenido (fase) |
|---|---|
| `21_MigracionV2.js` | `crearEstructuraV2`, migraciones idempotentes, `estadoMigracionV2`, control de esquema (fases 1–2, 9) |
| `22_Personas.js` | Dominio Personas + Voluntarios V2 (CRUD, reactivación, split) (fase 2) |
| `23_GradosCargos.js` | Catálogos Grados/Cargos/Areas + historiales + evaluación de requisitos (fase 3) |
| `24_Especialidades.js` | Especialidades/Subespecialidades/VoluntarioEspecialidades (fase 4) |
| `25_Credenciales.js` | Credenciales/VoluntarioCredenciales + vencimientos (fase 4) |
| `26_Capacitaciones.js` | Capacitaciones/VoluntarioCapacitaciones (fase 4) |
| `27_Servicios.js` | Servicios/ServicioVoluntarios/asignación masiva (fase 5) |
| `28_Asistencia.js` | Asistencia, resúmenes y estadísticas (fase 6) |
| `29_HojaServicios.js` | Timeline perpetuo + Anotaciones + Documentos (fase 7) |
| `30_Unidades.js` | UnidadesInternas/IntegrantesUnidad (fase 8) |
| `31_EquipamientoV2.js` | Catálogo/Inventario/Devoluciones V2 (área, tipo, devoluciones múltiples) (fase 9) |
| `32_ConfigV2.js` | Configuración V2 + tablas maestras + catálogos (fase 11 y transversal) |
| `33_Usuarios.js` | Usuarios/Permisos + `getSesion` con perfil (fase 11) |
| `34_Reportes.js` | Agregadores de reportes (fase 12) |

`11_Dashboard.js` y `12_WebApp.js` se extienden por fases (agregador V2, doGet intacto). El frontend suma páginas nuevas sin tocar las existentes (rutas nuevas en `13_UI_App.html`).

---

## 8. Fase 1 — plan de trabajo concreto (próximo paso tras aprobación)

**Alcance:** solo agregar estructura + semillas + migración idempotente. No se toca el frontend ni las hojas actuales; la Web App sigue funcionando.

1. `00_Constantes.js`: mapa `HOJA_V2` (32 hojas), mapas `COL_*` por entidad, semillas (GRADOS_V2, AREAS_V2, CARGOS_V2, ESPECIALIDADES_V2, SUBESPECIALIDADES_V2, TIPOS_SERVICIO_V2, ESTADOS_ASISTENCIA_V2, TIPOS_DOCUMENTO_V2, CATEGORIAS_V2), `ESQUEMA_V2 = '1.0'`.
2. `21_MigracionV2.js`: `crearEstructuraV2()` (crea hojas + siembra catálogos, idempotente), `estadoMigracionV2()` (diagnóstico: qué existe/qué falta), control de esquema.
3. `09_Pruebas.js`: añadir `ejecutarPruebasV2` (asserts de estructura/semillas/idempotencia sobre el modelo).
4. Verificación: `node --check` + pruebas estáticas + `clasp push` + deploy (misma URL) + entrada en AGENTS.md (decisión de arquitectura V2 + estado).
5. Revisión manual del usuario: ejecutar `crearEstructuraV2` desde el editor y confirmar hojas/semillas en el Spreadsheet.