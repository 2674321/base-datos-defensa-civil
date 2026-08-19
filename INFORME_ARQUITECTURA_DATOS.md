# INFORME DE ARQUITECTURA DE DATOS — DEFENSA CIVIL DE CHILE, SEDE LA SERENA
### Investigación institucional previa a la fase SERVICIOS + ASISTENCIA
**Versión:** 1.0 · **Fecha:** ago 2026 · **Estado:** pendiente de aprobación (no se modificó código, backend, frontend ni hojas)

Clasificación usada en todo el informe:
- **[OFICIAL]** = respaldado por normativa/documentación oficial (ROF, Reglamento de Uniformes, cartillas).
- **[SEDE LA SERENA]** = uso interno de la Sede La Serena, sin respaldo normativo nacional.
- **[PROPUESTA DEL SISTEMA]** = mejora tecnológica propuesta por este informe.

---

## 0. FUENTES CONSULTADAS (todas oficiales — biblioteca de defensacivil.cl)

| Ref | Documento | Año | URL |
|---|---|---|---|
| ROF-S | R.O.F. Sedes Locales Defensa Civil | 2020 | https://defensacivil.cl/wp-content/uploads/2023/06/Nuevo-ROF-sedes-2020.pdf |
| ROF-DG | R.O.F. Dirección General | 2018 | https://defensacivil.cl/wp-content/uploads/2025/02/ROF.-de-la-DGDCCH-ano-2018-NUEVO.pdf |
| UNI | Reglamento uso Uniformes, Grados, Distintivos, Medallas y Estandarte | 2018 (versión en línea dic-2024) | https://defensacivil.cl/wp-content/uploads/2024/12/Reglto.-uso-Uniformes-Grados-Distintivos-Medallas-y-Estandarte.pdf |
| CAL | Reglamento de Calificaciones de la DG | 2023 | https://defensacivil.cl/wp-content/uploads/2024/04/REGLAMENTO-DE-CALIFICACIONES-DE-LA-DIRECCION-GENERAL-2023.docx.pdf |
| RAD-B | Manual Básico del Radioperador (Resol./Exta N°293, 15-ENE-2024) | 2024 | https://defensacivil.cl/wp-content/uploads/2024/02/Manual-Basico-del-Radioperador.pdf |
| RAD-I | Manual Intermedio del Radioperador | 2024 | https://defensacivil.cl/wp-content/uploads/2024/02/Manual-Intermedio-del-Radioperador.pdf |
| RAD-A | Manual Avanzado del Radioperador | 2024 | https://defensacivil.cl/wp-content/uploads/2024/02/Manual-Avanzado-del-Radioperador.pdf |
| ALB | Cartilla Organización, Funcionamiento y Vigilancia de Albergues | 2017 | https://defensacivil.cl/wp-content/uploads/2024/02/Cartilla-Albergues-.pdf |
| ACOP | Cartilla Centro de Acopio y Ayuda Humanitaria | 2017 | https://defensacivil.cl/wp-content/uploads/2024/02/Cartilla-Centro-acopio-y-ayuda-humanit.pdf |
| DIR | Cartilla para Direccionamiento de Personas | s/f | https://defensacivil.cl/wp-content/uploads/2024/02/Cartilla-Direccionamiento-de-Personas-.pdf |
| PAP | Cartilla de Primeros Auxilios Psicológicos | 2024 | https://defensacivil.cl/wp-content/uploads/2024/02/Cartilla-de-Pr.-Aux.-Psicologicos.pdf |
| AUT | Cartilla de Autocuidado del Voluntario | 2024 | https://defensacivil.cl/wp-content/uploads/2024/02/Cartilla-de-Autocuidado-Psicologico.pdf |
| PAX | Manual Básico de Primeros Auxilios y Guía del Instructor | s/f | https://defensacivil.cl/wp-content/uploads/2024/02/Manual-Basico-Primeros-Auxilios-y-Guia-del-Instructor.pdf |
| FOR | Cartilla de Ejercicios y Formalidades | s/f | https://defensacivil.cl/wp-content/uploads/2024/02/Cartilla-de-formalidades-.pdf |
| ETI | Código de Ética | 2016 | https://defensacivil.cl/wp-content/uploads/2023/08/CODIGO-DE-ETICA-2016-1.pdf |
| RIOHS | Reglamento Interno de Higiene y Seguridad | 2021 | https://defensacivil.cl/wp-content/uploads/2023/06/RIOHS-2021-defensa-civil_.pdf |
| GEN | Disposiciones Equidad e Igualdad de Género 2022-2026 | 2022 | https://defensacivil.cl/wp-content/uploads/2023/06/Disposiciones-tema-de-Equidad-y-Genero.pdf |
| CIB | Protocolo de Ciberseguridad DG y Sedes | 2024 | https://defensacivil.cl/wp-content/uploads/2024/01/PROTOCOLO-DE-CIBERSEGURIDAD-DE-LA-DEFENSA-CIVIL-DE-CHILE.pdf |
| MEC | Cartilla uso y manipulación Motobomba | s/f | https://defensacivil.cl/wp-content/uploads/2024/02/Cartilla-uso-y-manip.-de-Motobomba-.pdf |
| ELE | Cartilla uso y manipulación Grupo Electrógeno | s/f | https://defensacivil.cl/wp-content/uploads/2024/02/Cartilla-sobre-uso-y-manip.-grupo-electrogeno-.pdf |

Nota: no se usaron páginas de terceros como fuente principal.

---

## 1. QUÉ ENCONTRÉ EN LA DOCUMENTACIÓN OFICIAL (resumen ejecutivo)

1. **La jerarquía de grados del voluntariado es cerrada: 7 grados** (UNI, "Distintivos de grados"). No hay más.
2. **"Disponible" es un grado**: es una **categoría de personal** de la Ley de Reclutamiento (conscriptos, 1 año, mín. 4 h semanales) (ROF-S Art. 18 y 20).
3. **"Aspirante" no es un grado**: es la **condición de ingreso** (instrucción básica mín. 3 meses + prueba de calificación) (ROF-S Art. 17).
4. **Cargo ≠ grado, formalmente**: "La superioridad en la Institución puede existir por razones de grado o de mando" (ROF-S Art. 58).
5. **Solo 3 especialidades institucionales con distintivo** (UNI): Sanidad, Telecomunicaciones, Administración Logística; cada una con rangos/subespecialidades fijados.
6. **La sede se organiza en equipos operativos** (ROF-S Anexo Nº1): Primeros Auxilios, Administración Albergues, Centro de Acopio, Direccionamiento de Personas, Rescate y Salvataje — "conformación de equipos a considerar por las sedes dependiendo al empleo previsto en su COE comunal".
7. **Dos tipos oficiales de asistencia** (operativa; régimen e instrucción) con **porcentajes mínimos** para permanecer/ascender: voluntarios 50 %/60 %; disponibles 70 %/80 % (ROF-S Art. 18).
8. **Los ascensos los aprueba solo el Director General** por resolución exenta, a proposición de CL + JS + asesores de plana mayor, con requisitos formales por grado (ROF-S §"Solicitudes, requisitos y resoluciones de ascensos").
9. **"Hoja de servicios" oficial** por voluntario (anotaciones +/−, ascensos, retiros temporales, cursos, traslados) — valida el concepto de HISTORIAL (ROF-S §"Hoja de servicios").
10. **Grupo sanguíneo es dato institucional**: requerido (nombre, grado, grupo sanguíneo, foto) para la tarjeta de identificación (ROF-S §"Tarjetas de identificación").
11. **Sanciones oficiales** (ROF-S Art. 68): amonestación, reprensión, observaciones, suspensión del servicio (temporal), baja del servicio.
12. **"Delta" oficial = Código Delta** de radiocomunicaciones nacional (RAD-B cap. 4: D1..D23+). **No existe "Fuerza de Tarea Delta" como categoría institucional.**
13. **El Reglamento de Calificaciones 2023 rige a funcionarios de la DG** (planta/contrata, Ley 18.834), **no al voluntariado de sedes** (que se rige por el ROF Sedes).
14. Cargos nacionales (ROF-DG): Director General y jefaturas de departamentos (Contraloría y Asuntos Jurídicos, Planificación y Estudios, Operativo Institucional, Gestión y Proyectos, Logístico, Recursos Humanos, Finanzas).---

## 2. CATEGORÍAS OFICIALES EXISTENTES

### 2.1 Grados (jerarquía cerrada, de mayor a menor) [OFICIAL — UNI + ROF-S]
| Grado | Distintivo (UNI) | Observación normativa |
|---|---|---|
| Comandante Local | 4 barras | Máxima autoridad de la sede (ROF-S Art. 11) |
| Instructor Mayor (con cargo de Jefe de Sede) | 3 barras | El grado de Instructor Mayor habilita el cargo de Jefe de Sede (UNI) |
| Instructor Mayor | 2 barras | Integra asesorías e instruye (ROF-S Art. 14) |
| Instructor | 1 barra | Integra asesorías e instruye |
| Subinstructor | V + barra horizontal | Auxiliar de instrucción |
| Voluntario Mayor | V + estrella | Grado superior de la línea de voluntarios |
| Voluntario | V | Grado base del voluntariado |

### 2.2 Categorías de personal (NO son grados) [OFICIAL — ROF-S]
| Categoría | Naturaleza | Regla clave |
|---|---|---|
| Aspirante a voluntario | Condición de ingreso | Instrucción básica mín. 3 meses + prueba de calificación (1 repetición; reprobada → eliminación) (Art. 17) |
| Disponible | Enrolado por Ley de Reclutamiento | 1 año, mín. 4 h/semana; al licenciarse puede continuar como voluntario, con el año contado en su antigüedad (Arts. 18 y 20) |
| Voluntario (a) | Categoría de servicio permanente | — |
| Reserva | Voluntario empleado en operativos | "Personal voluntario (Reserva cuando sea empleada en operativos)" (Art. 59) |

### 2.3 Cargos oficiales de mando en la sede [OFICIAL — ROF-S]
| Cargo | Base normativa |
|---|---|
| Comandante Local | Art. 11: designado por resolución exenta del DG; FF.AA./Carabineros activos, en retiro, o voluntario calificado (DS Nº 547, 10-05-1948; OF.SS.FF.AA./DAI./DPI.(P) Nº 4227, 14-09-2015) |
| Jefe de Sede | Art. 11.1.b: requiere grado Instructor Mayor con mín. 3 años en el grado; propuesto por el CL; designado por resolución exenta del DG; reemplaza al CL |
| Asesores de la plana mayor | Art. 10, tarea 20: "Designará a los asesores técnicos y/o profesionales de la sede" (el CL); el reglamento no fija nómina cerrada de asesorías |
| Jefe de Equipo (y R.Op.) | Anexo Nº1: rol operativo al mando de cada equipo |
| Cuerpo de instructores | Art. 14: Instructor Mayor / Instructor / Subinstructor instruyen al voluntariado |

### 2.4 Especialidades oficiales con distintivo [OFICIAL — UNI §"Especialidades"; ROF-S Art. 91]
| Especialidad | Rangos / subespecialidades oficiales | Requisito de acreditación (UNI) |
|---|---|---|
| Sanidad | 1) Médico · 2) Enfermero universitario · 3) TENS (técnico en enfermería nivel superior) · 4) Auxiliar de sanidad (apoya y puede desempeñarse como camillero) | Título profesional/técnico autenticado, o diploma/certificado de cursos de la institución |
| Telecomunicaciones | Radioperador (centrales de comunicaciones de la sede y puestos móviles) | Diploma/certificado autenticado o cursos DC |
| Administración Logística | 1) Administración de Albergues · 2) Administración de Centros de Acopio · 3) Operador de Equipos Logísticos | Acreditación interna/externa |

- La pérdida de la especialidad está regulada (ROF-S Art. 92: omisión/mal uso → Departamento de RR.HH. de la DG).

### 2.5 Estructura operativa oficial de una sede [OFICIAL — ROF-S Anexo Nº1]
Jefe de Sede → Plana Mayor (1 Mensajero y adm., 1 Rad. Operador) → equipos (dotación referencial, varía según la fuerza de cada sede):
- **Equipo Primeros Auxilios**: Jefe de Equipo y R.Op., 1 Paramédico, 4 Camilleros
- **Equipo Administración Albergues**: Jefe Equipo y R.Op., 1 Estadística, 1 Bodeguero, 2 Recep. Ropa de Abrigo, 2 Distrib. Ropa de Abrigo, 2 Vigilancia y Control, 4 Asist. Alimentación, 2 Paramédicos
- **Equipo Centro de Acopio**: Jefe Equipo y R.Op., 2 Recepción de Ayuda, 2 Clasificadores, 2 Cargadores, 2 Estibadores, 2 Distribuidores
- **Equipo Direccionamiento de Personas**: Jefe Equipo y R.Op., 1 Jalonador Rutas de Evacuación, 4 Guías de Altavoz, 1 Recep. Zona de Seguridad
- **Equipo Rescate y Salvataje**: Jefe Equipo, 2 Op. Palas, 2 Op. Picotas, 2 Op. Chuzos, 1 Op. Motosierra, 1 Op. Motobomba, 1 Op. Gr. Electrógeno, 1 Rad. Operador

La Cartilla de Albergues (ALB) complementa con roles propios de albergue: Jefe de Albergue y encargados de instrucción, albergue, alimentación, salud, acción social, aseo y recreación.

### 2.6 Asistencia oficial [OFICIAL — ROF-S Art. 18]
- **Asistencia operativa**: emergencias, operativos sociales, eventos cívicos republicanos, religiosos, deportivos y apoyo a la comunidad.
- **Asistencia de régimen e instrucción**: concurrencia periódica a la sede (sábados u otros días definidos por cada sede).
- Exigencias: voluntarios 50 % operativa / 60 % régimen e instrucción; disponibles 70 % / 80 %.
- Registro: "libro de control de asistencia", visado por CL y/o JS "al término del servicio diario".
- Baja por causal "inasistencia" (solicitud escrita del CL/JS al DG).
- **Permisos especiales** (Art. 19): hasta 2 días de instrucción por mes los otorga CL/JS; situaciones mayores requieren autorización de la DG; constancia en la hoja de servicios.

### 2.7 Otras categorías oficiales útiles [OFICIAL]
- **Medallas por años de servicio** (UNI §D): reconocimiento anual por años de servicio (ceremonia de aniversario).
- **Sanciones** (ROF-S Art. 68): amonestación verbal · reprensión · observaciones (escrita) · suspensión del servicio (temporal) · baja del servicio (resolución exenta del DG).
- **Tarjeta de identificación**: validez 2 años; datos: nombre, grado, grupo sanguíneo y foto (ROF-S).
- **Código Delta** (RAD-B cap. 4): código oficial nacional de radiocomunicaciones (D1 trafico de gravedad, D2 enfermedad, D3 fallecimiento, D4 comprendido… hasta D23+).
- **Niveles de radioperador**: manuales Básico, Intermedio y Avanzado (2024) — tres niveles de la especialidad Telecomunicaciones [OFICIAL, RAD-B/I/A].

---

## 3. QUÉ CATEGORÍAS APARECEN EN LA SEDE LA SERENA (datos entregados por el usuario)

| Dato actual de la Sede | Clasificación propuesta |
|---|---|
| Disponible | Categoría de personal oficial (NO grado) [OFICIAL] |
| Aspirante | Condición de ingreso oficial (NO grado) [OFICIAL] |
| Voluntario / Voluntario Mayor / Subinstructor / Instructor / Instructor Mayor / Comandante Local | Grados oficiales [OFICIAL] |
| Jefe de Sede | Cargo oficial (requiere grado Instructor Mayor) [OFICIAL] |
| Jefe Área de Operaciones | No aparece como cargo formal en ROF-S (las "áreas" son de documentación: operaciones/instrucción/personal) → cargo interno [SEDE LA SERENA] — configurable |
| Asesor de Vestuario y Equipo | El ROF-S contempla "asesores técnicos y/o profesionales" sin nómina cerrada → cargo interno [SEDE LA SERENA] — configurable |
| Asesor de Telecomunicaciones | Ídem → [SEDE LA SERENA] — configurable |
| Asesor de Personal | Ídem → [SEDE LA SERENA] — configurable |
| Operador de RPAS | No aparece en documentación oficial → capacidad/especialidad interna [SEDE LA SERENA] o [PROPUESTA] |
| Sanidad | Especialidad oficial [OFICIAL] |
| Telecomunicaciones | Especialidad oficial [OFICIAL] |
| Administración de Albergues | Subespecialidad oficial de Administración Logística [OFICIAL] |
| Administración de Centros de Acopio | Subespecialidad oficial de Administración Logística [OFICIAL] |
| Operador de Equipos Logísticos | Subespecialidad oficial de Administración Logística [OFICIAL] |
| Auxiliar / TENS / Médico / Enfermero (Sanidad) | Rangos oficiales de la especialidad Sanidad [OFICIAL] |
| Licencia de Radioaficionado | Licencia externa (SUBTEL) — no es subespecialidad DC [PROPUESTA: credencial externa] |
| Stop the Bleed | Curso/certificación externa [PROPUESTA: credencial externa] |
| Fuerza de Tarea Delta | NO es grado, cargo ni especialidad nacional. Única referencia oficial a "Delta" = Código Delta de comunicaciones → capacidad/unidad interna de la Sede [SEDE LA SERENA] |

## 4. DIFERENCIAS ENTRE LO OFICIAL Y LO ACTUAL DE LA SEDE

1. **La Sede mezcla categorías** en una sola lista de "estado": mezcla categorías de personal (Disponible, Aspirante) con grados (Voluntario…Comandante Local). El sistema debe separarlas en dos dimensiones: **categoría** (o condición) y **grado**.
2. **Cargos internos** (Jefe Área de Operaciones, Asesores) no son normativos; el ROF-S solo fija Comandante Local, Jefe de Sede, asesores genéricos y jefes de equipo.
3. **RPAS y Fuerza de Tarea Delta** no tienen respaldo normativo; deben tratarse como estructura interna configurable.
4. **El sistema actual no modela** la doble asistencia oficial (operativa vs. régimen e instrucción) ni los porcentajes mínimos.
5. **El sistema actual no modela** la relación Grado ↔ Especialidades ↔ Ascensos (requisitos oficiales).
6. **Falta el historial** (hoja de servicios oficial) y las sanciones/permisos.

## 5. QUÉ INFORMACIÓN FALTA (para resolver con la Sede, no con normativa)

- Nómina exacta de asesorías internas de la Sede (Vestuario y Equipo, Telecomunicaciones, Personal, otras).
- Definición de "Fuerza de Tarea Delta" por la propia Sede (qué es, quién la integra, qué equipamiento usa).
- Criterio de la Sede para RPAS (especialidad interna, grupo de trabajo o solo capacidad individual).
- Si la Sede mantiene la categoría "Disponible" activa (depende del enrolamiento local).
- Horarios oficiales de régimen e instrucción (sábados) para el cálculo de asistencia.
- Política de vacaciones/permisos en la práctica (Art. 32 ROF-S existe).---

## 6. MODELO DE DATOS RECOMENDADO (visión de conjunto)

```
PERSONA (persona física: RUN, nombres, apellidos, F.Nac., sexo, contacto…)
   │
   └── VOLUNTARIO (filiación institucional: ID voluntario, ingreso, estado, categoría, grado actual,
   │                 grupo ABO, factor Rh, observaciones, fechas de registro/actualización)
   │        │
   │        ├──< VoluntarioGrado (histórico): grado, fecha inicio, fecha término, resolución, activo
   │        ├──< VoluntarioCargo (histórico): cargo_id, fecha inicio, fecha término, activo, observaciones
   │        ├──< VoluntarioEspecialidad: especialidad_id, rango/acreditación, fecha acreditación, estado
   │        ├──< VoluntarioCredencial: tipo, nombre, institución, n° documento, emisión, vencimiento, estado
   │        ├──< VoluntarioEquipo (si aplica): equipo interno (ej. F.T. Delta), rol, fecha, estado
   │        ├──< HojaServicios (historial): tipo de anotación, fecha, detalle, responsable (se nutre de todos los eventos)
   │        └──< Asistencia / ServicioVoluntario (participación en servicios)
   │
   SERVICIO (acto/actividad: tipo, nombre, fecha, hora inicio/término, lugar, comuna, descripción,
   │          responsable, estado, observaciones)
   │        └──< ServicioVoluntario (N:N): rol en el servicio, estado de asignación/asistencia,
   │                                     hora llegada, hora salida, observación, registrado por
   │
   CATÁLOGO (elementos) ──> INVENTARIO (existencias por talla) ──> ENTREGA (N:N con VOLUNTARIO)
   │
   GRADO (catálogo cerrado 7) · CARGO (catálogo configurable) · ESPECIALIDAD (catálogo oficial 3 + internas)
   · CREDENCIAL_TIPO (catálogo) · SERVICIO_TIPO (catálogo) · ESTADO_ASIGNACION / ASISTENCIA (catálogos)
```

Regla de oro heredada del propio ROF-S (Art. 58): **grado (jerarquía por grado) y cargo (jerarquía por mando) son dimensiones independientes**; el sistema las modela por separado y con historial.

## 7. ENTIDADES NUEVAS NECESARIAS (vs. arquitectura actual)

| Entidad | Propósito | Clasificación |
|---|---|---|
| PERSONA | Datos personales separados de lo institucional | [PROPUESTA DEL SISTEMA] (separación técnica; el ROF-S no distingue) |
| VOLUNTARIO (ampliar) | + categoría (aspirante/disponible/voluntario/reserva) + grupo ABO + Rh + fecha ingreso + antigüedad | [OFICIAL] campos |
| GRADO | Catálogo de 7 grados con orden jerárquico y requisitos | [OFICIAL] |
| VOLUNTARIO_GRADO | Historial de grados (fechas + resolución) | [PROPUESTA] sobre base [OFICIAL] |
| CARGO | Catálogo configurable (activo/inactivo) | [OFICIAL + SEDE] |
| VOLUNTARIO_CARGO | Historial de cargos (inicio/término/activo/observaciones) | [PROPUESTA] |
| ESPECIALIDAD | Catálogo: 3 oficiales + internas (RPAS) | [OFICIAL + SEDE] |
| VOLUNTARIO_ESPECIALIDAD | Acreditación por voluntario (fecha, estado, observaciones) | [PROPUESTA] |
| CREDENCIAL_TIPO | Tipos: licencia (SUBTEL), curso, certificación, título | [PROPUESTA] |
| VOLUNTARIO_CREDENCIAL | Licencias/cursos/certificaciones con vencimiento | [PROPUESTA] |
| EQUIPO_INTERNO (opcional) | Unidades internas (ej. F.T. Delta) | [SEDE LA SERENA] |
| VOLUNTARIO_EQUIPO | Integración con rol y fechas | [SEDE LA SERENA] |
| SERVICIO | Acto/actividad con lugar, fechas, responsable, estado | [OFICIAL — tipos de asistencia operativa] |
| SERVICIO_TIPO | Catálogo: emergencia, operativo social, evento cívico, religioso, deportivo, régimen e instrucción, otros | [OFICIAL — Art. 18] |
| SERVICIO_VOLUNTARIO | N:N asignación + rol + asistencia (estado, horas, registro) | [PROPUESTA] |
| HOJA_SERVICIOS | Historial narrativo del voluntario (nutrido automáticamente) | [OFICIAL — "hoja de servicios"] |
| SANCIÓN (opcional fase 2) | Amonestación/reprensión/observación/suspensión/baja | [OFICIAL — Art. 68] |

## 8. RELACIONES ENTRE ENTIDADES

- PERSONA 1—1 VOLUNTARIO (filiación institucional; permite voluntarios "ex" y aspirantes)
- VOLUNTARIO 1—N VOLUNTARIO_GRADO (N histórico, 1 actual)
- VOLUNTARIO 1—N VOLUNTARIO_CARGO (N histórico, varios simultáneos posibles: ej. cargo + asesoría)
- VOLUNTARIO N—N ESPECIALIDAD vía VOLUNTARIO_ESPECIALIDAD (múltiples, con rango por especialidad)
- VOLUNTARIO N—N CREDENCIAL_TIPO vía VOLUNTARIO_CREDENCIAL
- VOLUNTARIO N—N SERVICIO vía SERVICIO_VOLUNTARIO (con rol y asistencia dentro del servicio)
- VOLUNTARIO N—N EQUIPO_INTERNO vía VOLUNTARIO_EQUIPO (opcional, Sede)
- VOLUNTARIO 1—N HOJA_SERVICIOS (línea de tiempo unificada)
- VOLUNTARIO N—N CATÁLOGO vía ENTREGA (equipamiento, ya existente)
- VOLUNTARIO 1—N ASISTENCIA (si se separa del servicio: régimen e instrucción no siempre es "servicio")

## 9. QUÉ DEBE QUEDAR CONFIGURABLE EN CONFIG (catálogos)

- **Cargos** (crear/activar/desactivar/modificar) — con semilla oficial (Comandante Local, Jefe de Sede) e internos (asesores, Jefe Área de Operaciones).
- **Especialidades** (las 3 oficiales protegidas contra edición + internas libres: RPAS, otras).
- **Rangos por especialidad** (Sanidad: Médico/Enfermero/TENS/Auxiliar; Logística: 3 subespecialidades).
- **Tipos de servicio** (semilla oficial del Art. 18 + "régimen e instrucción" + libre).
- **Estados de asignación/asistencia** (semilla: asignado, presente, ausente, justificado, reemplazado, retirado).
- **Equipos internos** (ej. Fuerza de Tarea Delta) — categoría "unidad interna de la sede".
- **Porcentajes mínimos de asistencia** (voluntarios 50/60, disponibles 70/80 — editables).
- **Grados**: el orden jerárquico debe ser fijo (7 oficiales); NO editable para evitar romper la jerarquía normativa (solo "visible/activo" si la sede no usa alguno).
- Umbral STOCK_BAJO (ya existe) y configuración de horario de régimen (sábados).

## 10. QUÉ DEBE TENER HISTORIAL

- Grados (VOLUNTARIO_GRADO) y cargos (VOLUNTARIO_CARGO) — con fechas inicio/término y resolución.
- Especialidades (acreditación y eventual pérdida, ROF-S Art. 92).
- Credenciales (emisión/vencimiento/estado).
- Servicios y asistencias (nunca se borran; se anulan con estado, no con eliminación).
- Equipamiento (ya existe historial de entregas/devoluciones).
- Anotaciones de hoja de servicios (positivas/negativas, permisos, sanciones — fase 2).
- Bajas/reactivaciones: el voluntario no se elimina; cambia de estado con motivo y fecha.
- Cambios de datos personales sensibles (fecha de modificación, quién modificó) [PROPUESTA].

## 11. QUÉ DEBE SER CATÁLOGO

GRADO (7 fijos) · CARGO (configurable) · ESPECIALIDAD (oficial+interna) · SERVICIO_TIPO · ESTADO_ASISTENCIA · ESTADO_ASIGNACION · CREDENCIAL_TIPO · EQUIPO_INTERNO · COMUNA/LUGAR (reutilizable) · CATÁLOGO de elementos (ya existe).

## 12. QUÉ DEBE SER RELACIÓN N:N

VOLUNTARIO↔GRADO (histórica) · VOLUNTARIO↔CARGO (histórica) · VOLUNTARIO↔ESPECIALIDAD (con rango) · VOLUNTARIO↔SERVICIO (con rol y asistencia) · VOLUNTARIO↔CREDENCIAL · VOLUNTARIO↔EQUIPO_INTERNO · VOLUNTARIO↔CATÁLOGO (entregas, ya existente).

## 13. QUÉ DEBE SER DATO PERSONAL (PERSONA)

RUN, nombres, apellidos, fecha de nacimiento, sexo (con perspectiva GEN: la institución exige "sin distinción de género" en el ingreso), teléfono, correo, dirección, comuna, contacto de emergencia y su teléfono. El RUN es el identificador natural (la tarjeta de identificación usa nombre, grado, grupo sanguíneo, foto).

## 14. QUÉ DEBE SER DATO OPERATIVO (VOLUNTARIO + entidades relacionadas)

ID voluntario, fecha de ingreso, categoría (aspirante/disponible/voluntario/reserva), estado administrativo (activo/suspendido/egresado…), grado actual, cargo(s) actuales, grupo ABO + Rh, observaciones, fecha registro, última actualización, hoja de servicios, servicios, asistencias, especialidades, credenciales, equipo interno.

## 15. QUÉ DEBE SER CREDENCIAL / CERTIFICACIÓN (VOLUNTARIO_CREDENCIAL)

- **Licencia de Radioaficionado** (SUBTEL, externa) → credencial con n° y vencimiento.
- **Títulos profesionales/técnicos** que acreditan rangos de Sanidad (Médico, Enfermero, TENS) → credencial respaldo.
- **Cursos** (Stop the Bleed, primeros auxilios externos, etc.) → credencial.
- **Diplomas DC** (radioperador básico/intermedio/avanzado, primeros auxilios) → credencial interna con fecha.
- **Distinción: especialidad ≠ credencial.** La especialidad es la categoría institucional con distintivo; la credencial es el respaldo documental (título/licencia/curso) que la sustenta y que puede vencer (ej. licencia SUBTEL). El sistema guarda ambas y las relaciona por voluntario.

## 16. DISEÑO RECOMENDADO PARA SERVICIOS

Entidad SERVICIO (un acto/actividad concreta — coincide con la "asistencia operativa" del Art. 18):
- Campos: tipo (catálogo), nombre, fecha, hora inicio, hora término, lugar, comuna, descripción, responsable (voluntario), estado (planificado/activo/finalizado/anulado), observaciones.
- ID legible: SRV-001 (secuencia).
- Flujo en la Web App: crear → asignar personal (selección múltiple) → registro de asistencia → cierre con informe.
- **Tipos sugeridos** (catálogo): emergencia, operativo social, evento cívico republicano, evento religioso, evento deportivo, apoyo a la comunidad, régimen e instrucción, otro.
- Roles dentro del servicio (catálogo libre por servicio): se nutren del organigrama oficial (Jefe de Equipo y R.Op., Paramédico, Camillero, Rad. Operador, Bodeguero, etc.) + roles internos.
- Sin concatenación de nombres: siempre vía SERVICIO_VOLUNTARIO.

## 17. DISEÑO RECOMENDADO PARA ASISTENCIA

- Separación conceptual: **SERVICIO** (qué se hizo) vs. **ASISTENCIA** (quién estuvo) — la asistencia vive en SERVICIO_VOLUNTARIO, y además existe la asistencia de **régimen e instrucción** (reuniones de sede) que también debe registrarse para el cálculo de porcentajes.
- Estados sugeridos para SERVICIO_VOLUNTARIO.estado (catálogo): Asignado · Presente · Ausente · Justificado · Reemplazado · Retirado (semilla propuesta; la Sede puede ajustar).
- Campos: rol en el servicio, hora llegada, hora salida, observación, responsable que registró (voluntario), fecha/hora de registro.
- Cálculos derivados: horas de servicio, % asistencia operativa, % asistencia régimen e instrucción, servicios realizados, ausencias, participación histórica — comparables contra los porcentajes oficiales (50/60 y 70/80).
- Registro "al término del servicio diario" y visado por CL/JS (ROF-S Art. 18) → la Web App puede implementar el cierre/visado del libro.---

## 18. DISEÑO RECOMENDADO PARA GRADOS / CARGOS / ESPECIALIDADES

### Grados
- Catálogo fijo de 7 con orden jerárquico (1=Comandante Local … 7=Voluntario) + requisitos oficiales de ascenso almacenados como datos (referencia): edad, escolaridad, n° de especialidades, permanencia mínima en el grado anterior (Voluntario Mayor: 2 años; Subinstructor: 2 años; Instructor: 2 años; Instructor Mayor: 2 años) y evaluación.
- VOLUNTARIO_GRADO: historial con fechas; el grado actual = registro activo. El ascenso solo se marca como "propuesto" hasta la resolución exenta del DG (campo resolución).
- Reglas de progresión derivadas del ROF-S: no se permiten saltos (ascender requiere el grado inmediatamente anterior y los años mínimos); casos especiales (nuevas sedes, ingreso de profesionales/FF.AA.) son dispensas del DG → se registran como tal con resolución.

### Cargos
- CARGO (catálogo configurable) + VOLUNTARIO_CARGO (historial N:N). Una persona puede tener varios cargos simultáneos (ej. Jefe de Equipo + Asesor) y varios a lo largo del tiempo.
- Semilla oficial: Comandante Local, Jefe de Sede (protegidos, con requisito de grado para aviso informativo: CL/JS requieren Instructor Mayor — solo aviso, no bloqueo).
- Semilla interna: Jefe Área de Operaciones, Asesor de Vestuario y Equipo, Asesor de Telecomunicaciones, Asesor de Personal (marcadas como [SEDE LA SERENA]).
- El sistema NO impone restricciones automáticas cargo→grado (la decisión es humana); solo muestra advertencias.

### Especialidades
- ESPECIALIDAD (catálogo) + rango interno: Sanidad (Médico/Enfermero/TENS/Auxiliar), Telecomunicaciones (Radioperador; niveles básico/intermedio/avanzado como credenciales), Administración Logística (3 subespecialidades como rangos).
- VOLUNTARIO_ESPECIALIDAD: fecha de acreditación, estado (vigente/perdida — Art. 92), observaciones.
- Especialidades internas (RPAS) marcadas como internas; las 3 oficiales no editables.

## 19. DISEÑO RECOMENDADO PARA FUERZA DE TAREA DELTA

- **Hallazgo**: no existe como categoría institucional; "Delta" oficial es el Código Delta de comunicaciones (RAD-B cap. 4). Por lo tanto [SEDE LA SERENA]: capacidad/unidad interna.
- **Propuesta**: entidad EQUIPO_INTERNO (o "grupo de trabajo") con relación N:N VOLUNTARIO_EQUIPO (rol, fecha inicio/término, estado). La Web App lo muestra bajo Gestión/Equipamiento como "Unidades de la sede" y en la ficha del voluntario.
- Se documentará en la UI con la etiqueta "Unidad interna de la Sede La Serena" (nunca como grado/cargo/especialidad nacional).
- Si la Sede define reglas propias (capacitaciones, integración), se configuran como credenciales/capacidades vinculadas, sin afirmar respaldo nacional.

## 20. RIESGOS DE DISEÑARLO INCORRECTAMENTE

1. **Tratar "Disponible/Aspirante" como grados** → jerarquía falsa y ascensos imposibles de modelar (riesgo alto: es el error actual de la Sede en su hoja de datos).
2. **Guardar cargos como texto** (Voluntario.Cargo) → sin historial, sin multi-cargo, sin trazabilidad de nombramientos; el ROF-S exige resolución y hoja de servicios.
3. **Guardar especialidades concatenadas** → imposible filtrar por capacidad (la función "Buscar personal por capacidad" de §12 moriría al nacer).
4. **Mezclar especialidad con curso/licencia** → vencimientos no controlados (licencia SUBTEL), credibilidad de datos, riesgos operativos (desplegar a un "Radioperador" sin licencia vigente).
5. **Crear una sola tabla de "servicios" con nombres pegados** → sin control de asistencia, sin % oficiales, sin historial de participación.
6. **No modelar los dos tipos de asistencia** → el sistema no podría calcular los porcentajes que el ROF-S exige para permanecer y ascender; se pierde la razón de ser del libro de control de asistencia.
7. **Presentar F.T. Delta / RPAS como categorías nacionales** → error institucional visible (el informe y la UI deben marcar "interna").
8. **Permitir ascensos sin registro de resolución** → conflicto con la norma (solo el DG asciende por resolución exenta; CL/JS no pueden ascender informalmente).
9. **Eliminar físicamente registros** (bajas, asistencias, entregas) → imposible reconstruir la trayectoria que exige la hoja de servicios.
10. **Dato de grupo sanguíneo inferido o en una sola columna** → riesgo de salud; el ROF-S lo exige para la tarjeta; debe ser ABO + Rh separados y solo ingresado por el voluntario/ficha.

## 21. DECISIÓN REQUERIDA (pendiente de aprobación)

1. ¿Apruebas el modelo con PERSONA + VOLUNTARIO separados, o prefieres mantener un solo registro de voluntario (con datos personales dentro) para simplificar la migración? (Recomendación: separación lógica dentro del mismo registro en Sheets, no dos hojas físicas obligatorias.)
2. ¿Aprobamos el catálogo de grados fijo (7) + categorías (Aspirante/Disponible/Voluntario/Reserva) separadas?
3. ¿Aprobamos Cargos y Especialidades como catálogos configurables con historial N:N?
4. ¿Aprobamos la entidad SERVICIO + SERVICIO_VOLUNTARIO como núcleo de la fase Servicios y Asistencia?
5. ¿Confirmas el tratamiento de F.T. Delta como "unidad interna de la sede" (configurable) y de RPAS como "especialidad interna"?
6. ¿Mantenemos las credenciales (licencias/cursos/títulos) en su propia entidad con vencimiento?
7. ¿Migramos los datos actuales (voluntarios, estados, cargos, especialidades, entregas) con mapeo a las nuevas categorías en una fase posterior, sin tocar el frontend existente hasta entonces?

---

*Informe generado a partir de documentación oficial descargada de defensacivil.cl/biblioteca (PDFs analizados: ROF Sedes 2020, ROF DG 2018, Reglamento de Uniformes 2018, Reglamento de Calificaciones 2023, Manual Básico del Radioperador 2024, Cartilla de Albergues 2017; títulos confirmados del resto de la biblioteca). Archivos fuente en /tmp/opencode/rofdocs/.*
