/**
 * 00_Constantes.js — Configuración central del proyecto.
 * Único lugar donde se definen nombres de hojas, columnas, listas, estados e IDs.
 * Regla: NO llamar servicios aquí, solo constantes puras.
 */

var PROYECTO = {
  nombre: 'Base de datos D.C. "La Serena"',
  version: '0.8.6 — V3.4K'
};

var SS_ID = 'SS_ID_REDACTED';

var HOJA = {
  voluntarios: 'Voluntarios',
  catalogo: 'Catálogo',
  inventario: 'Inventario',
  entregas: 'Entregas',
  config: 'Config',
  log: 'Log'
};

// ============ Hoja Voluntarios (20 columnas) ============

// Columnas (1-based). El orden debe coincidir con ENCABEZADOS.
var COL = {
  id: 1,
  run: 2,
  nombres: 3,
  apPaterno: 4,
  apMaterno: 5,
  fechaNac: 6,
  sexo: 7,
  telefono: 8,
  correo: 9,
  direccion: 10,
  comuna: 11,
  emergenciaNombre: 12,
  emergenciaTelefono: 13,
  fechaIngreso: 14,
  estado: 15,
  categoria: 16,
  cargo: 17,
  observaciones: 18,
  fechaRegistro: 19,
  ultimaActualizacion: 20
};

var N_COLS = 20;
var FILA_ENTRADA = 2;   // fila donde se escribe un nuevo registro antes de guardarlo
var PRIMERA_FILA_DATO = 3;

var ENCABEZADOS = [
  'N°', 'RUN', 'Nombres', 'Apellido Paterno', 'Apellido Materno',
  'Fecha Nacimiento', 'Sexo', 'Teléfono', 'Correo',
  'Dirección', 'Comuna', 'Contacto Emergencia', 'Tel. Emergencia',
  'Fecha Ingreso', 'Estado', 'Categoría', 'Cargo', 'Observaciones',
  'Fecha Registro', 'Última Actualización'
];

// Columnas administradas por el backend (no editables en la hoja).
var COL_SISTEMA_VOLUNTARIOS = [COL.fechaRegistro, COL.ultimaActualizacion];

// ============ Hoja Catálogo (tipo de elemento) ============

var COL_CATALOGO = {
  id: 1,
  elemento: 2,
  tipo: 3,
  requiereTalla: 4,
  requiereDevolucion: 5,
  activo: 6,
  observaciones: 7,
  areaId: 8,
  tallas: 9
};
var N_COLS_CATALOGO = 9;
var ENCABEZADOS_CATALOGO = ['ID', 'Elemento', 'Tipo', 'Requiere Talla', 'Requiere Devolución', 'Activo', 'Observaciones', 'Área ID', 'Tallas']; // V2: área + tallas sugeridas (campo libre)

// ============ Hoja Inventario (existencias físicas) ============

var COL_INVENTARIO = {
  id: 1,
  elementoId: 2,
  elemento: 3,
  talla: 4,
  cantidad: 5,
  estado: 6,
  serie: 7,
  observaciones: 8,
  ubicacion: 9,
  serieSede: 10
};
var N_COLS_INVENTARIO = 10;
var ENCABEZADOS_INVENTARIO = ['ID', 'Elemento ID', 'Elemento', 'Talla', 'Cantidad', 'Estado', 'N° Serie', 'Observaciones', 'Ubicación', 'Serie Sede']; // V2: ubicación física + serie institucional

// ============ Hoja Entregas (movimientos) ============

var COL_ENTREGA = {
  id: 1,
  voluntarioId: 2,
  voluntario: 3,
  run: 4,
  inventarioId: 5,
  elementoId: 6,
  elemento: 7,
  talla: 8,
  cantidad: 9,
  fechaEntrega: 10,
  estado: 11,
  responsable: 12,
  fechaDevolucion: 13,
  cantidadDevuelta: 14,
  cantidadDanada: 15,
  cantidadExtraviada: 16,
  observaciones: 17
};
var N_COLS_ENTREGA = 17;
var ENCABEZADOS_ENTREGA = [
  'ID', 'Voluntario ID', 'Voluntario', 'RUN', 'Inventario ID', 'Elemento ID',
  'Elemento', 'Talla', 'Cantidad', 'Fecha Entrega', 'Estado', 'Responsable',
  'Fecha Devolución', 'Cant. Devuelta', 'Cant. Dañada', 'Cant. Extraviada', 'Observaciones'
];

// ============ Prefijos de IDs ============

var ID_PREFIJOS = {
  catalogo: 'E-',
  inventario: 'INV-',
  entrega: 'ENT-'
};

// ============ Estados por entidad (no mezclar conceptos) ============

// Inventario = posición de stock. "Entregado" solo se usa en unidades con N° Serie
// (cantidad = 1) mientras están asignadas; el resto de asignados se deriva de Entregas.
var ESTADOS_INVENTARIO = ['Disponible', 'Entregado', 'Dañado', 'Extraviado', 'Baja'];
// Entrega = resultado del movimiento. "Entregado" = final sin devolución requerida.
var ESTADOS_ENTREGA = ['Pendiente de devolución', 'Devuelto', 'Devuelto parcial', 'Dañado', 'Extraviado', 'Entregado'];
var ESTADO_INVENTARIO_DEFECTO = 'Disponible';
var ESTADO_ENTREGA_INICIAL = 'Pendiente de devolución';
var ESTADO_ENTREGA_SIN_DEVOLUCION = 'Entregado';
var TALLA_SIN_TALLA = 'Sin talla';

// ============ Valores por defecto de la hoja Config ============

// El usuario edita solo la columna Valor. Listas vacías = sin restricción aún.
var CONFIG_DEF = [
  ['Parámetro', 'Valor', 'Tipo', 'Ayuda'],
  ['ESTADOS', 'Activo,Inactivo,Suspendido,Egresado', 'lista', 'Estados posibles de un voluntario (separados por coma)'],
  ['CATEGORIAS', 'Aspirante,Disponible,Voluntario,Reserva', 'lista', 'Categorías o rangos (separados por coma)'],
  ['SEXOS', 'Femenino,Masculino,Otro', 'lista', 'Opciones de sexo (separadas por coma)'],
  ['CARGO', '', 'lista', 'Cargos posibles de un voluntario (separados por coma) — ej. Jefe de Grupo, Operador de Radio'],
  ['TIPOS_ELEMENTO', '', 'lista', 'Tipos de elemento del catálogo (separados por coma) — ej. Vestuario, Calzado, Accesorio'],
  ['STOCK_BAJO', '5', 'numero', 'Umbral de unidades disponibles para alertar "stock bajo" en el panel'],
  ['MIN_ASIST_VOLUNTARIOS_REGIMEN', '50', 'numero', '% mínimo de asistencia — voluntarios, régimen e instrucción (ROF-S Art. 18)'],
  ['MIN_ASIST_VOLUNTARIOS_OPERATIVA', '60', 'numero', '% mínimo de asistencia — voluntarios, servicios operativos (ROF-S Art. 18)'],
  ['MIN_ASIST_DISPONIBLES_REGIMEN', '70', 'numero', '% mínimo de asistencia — disponibles, régimen e instrucción (ROF-S Art. 18)'],
  ['MIN_ASIST_DISPONIBLES_OPERATIVA', '80', 'numero', '% mínimo de asistencia — disponibles, servicios operativos (ROF-S Art. 18)'],
  ['ALERTA_CREDENCIALES_DIAS', '30', 'numero', 'Días de anticipación para alertar credenciales por vencer'],
  ['ALERTA_CAPACITACION_DIAS', '30', 'numero', 'Días de anticipación para alertar capacitaciones por vencer'],
  ['RETIRO_AFECTA_ANTIGUEDAD_INSTITUCIONAL', 'Si', 'lista', '¿Un retiro temporal descuenta de la antigüedad institucional? (Si/No)'],
  ['RETIRO_AFECTA_ANTIGUEDAD_GRADO', 'No', 'lista', '¿Un retiro temporal descuenta de la antigüedad en el grado? (Si/No)'],
  ['RETIRO_AFECTA_ANTIGUEDAD_CARGO', 'No', 'lista', '¿Un retiro temporal descuenta de la antigüedad en el cargo? (Si/No)']
];

var STOCK_BAJO_DEFECTO = 5;

var ESTADO_DEFECTO = 'Activo';

// ============ Catálogo inicial (elementos conocidos — no inventar otros) ============

// [Elemento, Requiere Talla, Requiere Devolución]
// V3.4D: el vestuario personal de uso permanente (bajo cargo) NO requiere
// devolución; el catálogo es la fuente autoritativa del tipo de entrega.
var CATALOGO_INICIAL = [
  ['Botas de combate', true, false],
  ['Porta equipo', false, false],
  ['Polera', true, false],
  ['Polera pique', true, false],
  ['Cortavientos', true, false],
  ['Parka', true, false],
  ['Blusa', true, false],
  ['Pantalón', true, false],
  ['Gorra con cubrenuca', false, false],
  ['Gorra sin cubrenuca', false, false],
  ['Cinturón de combate', false, false],
  ['Cinturón de vestir', false, false]
];

// V3.4D: elementos de vestuario personal de uso permanente (entrega bajo
// cargo → sin devolución). Gobierna la reclasificación migratoria y sirve de
// ayuda en la UI de entrega múltiple (el catálogo sigue siendo autoritativo).
var VESTUARIO_BAJO_CARGO = [
  'Botas de combate', 'Porta equipo', 'Polera', 'Polera pique', 'Cortavientos',
  'Parka', 'Blusa', 'Pantalón', 'Gorra con cubrenuca', 'Gorra sin cubrenuca',
  'Cinturón de combate', 'Cinturón de vestir'
];

// ============ Colores y formato ============

var COLOR = {
  encabezado: '#0b5394',
  encabezadoTexto: '#ffffff',
  filaEntrada: '#fff2cc',
  invalido: '#f4cccc',
  normal: '#ffffff'
};

var FMT_FECHA = 'dd/mm/yyyy';
var LOG_MAX_FILAS = 2000;

// =====================================================================
// V2 — REESTRUCTURACIÓN INSTITUCIONAL (modelo de datos ampliado)
// Esquema V2: estructura creada/actualizada por crearEstructuraV2.
// =====================================================================

var ESQUEMA_V2 = '1.2';
var CLAVE_ESQUEMA = 'esquemaV2';

var HOJA_V2 = {
  sedes: 'Sedes',
  personas: 'Personas',
  voluntarios: 'VoluntariosV2',
  grados: 'Grados',
  historialGrados: 'Historial Grados',
  cargos: 'Cargos',
  historialCargos: 'Historial Cargos',
  areas: 'Áreas',
  especialidades: 'Especialidades',
  subespecialidades: 'Subespecialidades',
  voluntarioEspecialidades: 'Voluntario Especialidades',
  credenciales: 'Credenciales',
  voluntarioCredenciales: 'Voluntario Credenciales',
  capacitaciones: 'Capacitaciones',
  voluntarioCapacitaciones: 'Voluntario Capacitaciones',
  unidadesInternas: 'Unidades Internas',
  integrantesUnidad: 'Integrantes Unidad',
  servicios: 'Servicios',
  servicioVoluntarios: 'Servicio Voluntarios',
  asistencia: 'Asistencia',
  hojaServicios: 'Hoja de Servicios',
  retirosTemporales: 'RetirosTemporales',
  anotaciones: 'Anotaciones',
  documentos: 'Documentos',
  devoluciones: 'Devoluciones',
  tiposServicio: 'Tipos Servicio',
  estadosAsistencia: 'Estados Asistencia',
  tiposDocumento: 'Tipos Documento',
  usuarios: 'Usuarios',
  permisos: 'Permisos'
};

// ============ Sedes ============
var COL_SEDE = { id: 1, nombre: 2, direccion: 3, comuna: 4, region: 5, lugar: 6, coordenadas: 7, licenciaRadio: 8, indicativo: 9, datosTecnicosRadio: 10, responsableId: 11, observaciones: 12, fechaRegistro: 13, ultimaActualizacion: 14 };
var N_COLS_SEDE = 14;
var ENCABEZADOS_SEDE = ['ID', 'Nombre', 'Dirección', 'Comuna', 'Región', 'Lugar', 'Coordenadas', 'Licencia Radio', 'Indicativo', 'Datos Técnicos Radio', 'Responsable ID', 'Observaciones', 'Fecha Registro', 'Última Actualización'];

// ============ Personas (datos personales permanentes) ============
// V3.4D: cols 20-22 foto (referencia Drive/URL segura, nunca binaria; la foto
// se registra en la ficha y habilita la credencial futura).
var COL_PERSONA = { id: 1, run: 2, nombres: 3, apPaterno: 4, apMaterno: 5, fechaNac: 6, sexo: 7, nacionalidad: 8, direccion: 9, comuna: 10, telefono: 11, correo: 12, emergenciaNombre: 13, emergenciaTelefono: 14, grupoABO: 15, factorRh: 16, observaciones: 17, fechaRegistro: 18, ultimaActualizacion: 19, fotoDriveId: 20, fotoFecha: 21, fotoEstado: 22 };
var N_COLS_PERSONA = 22;
var ENCABEZADOS_PERSONA = ['ID', 'RUN', 'Nombres', 'Apellido Paterno', 'Apellido Materno', 'Fecha Nacimiento', 'Sexo', 'Nacionalidad', 'Dirección', 'Comuna', 'Teléfono', 'Correo', 'Contacto Emergencia', 'Tel. Emergencia', 'Grupo ABO', 'Factor Rh', 'Observaciones', 'Fecha Registro', 'Última Actualización', 'Foto (Drive ID o URL)', 'Fecha Foto', 'Estado Foto'];

// ============ Voluntarios V2 (vínculo administrativo con la sede) ============
var COL_VOLUNTARIO_V2 = { id: 1, personaId: 2, sedeId: 3, estado: 4, categoria: 5, fechaIngreso: 6, fechaEgreso: 7, motivoEgreso: 8, observaciones: 9, fechaRegistro: 10, ultimaActualizacion: 11 };
var N_COLS_VOLUNTARIO_V2 = 11;
var ENCABEZADOS_VOLUNTARIO_V2 = ['ID', 'Persona ID', 'Sede ID', 'Estado', 'Categoría', 'Fecha Ingreso', 'Fecha Egreso', 'Motivo Egreso', 'Observaciones', 'Fecha Registro', 'Última Actualización'];

// ============ Grados (OFICIAL, UNI 2018) ============
var COL_GRADO = { id: 1, nombre: 2, orden: 3, insignia: 4, origen: 5, activo: 6, observaciones: 7 };
var N_COLS_GRADO = 7;
var ENCABEZADOS_GRADO = ['ID', 'Nombre', 'Orden', 'Insignia', 'Origen', 'Activo', 'Observaciones'];

// ============ Historial Grados (nunca sobrescribir) ============
var COL_HIST_GRADO = { id: 1, voluntarioId: 2, gradoId: 3, fechaDesde: 4, fechaHasta: 5, resolucion: 6, quienAsigno: 7, motivo: 8, requisitosEvaluados: 9, excepcion: 10, excepcionDetalle: 11, observaciones: 12, fechaRegistro: 13, ultimaActualizacion: 14 };
var N_COLS_HIST_GRADO = 14;
var ENCABEZADOS_HIST_GRADO = ['ID', 'Voluntario ID', 'Grado ID', 'Fecha Desde', 'Fecha Hasta', 'Resolución', 'Quien Asignó', 'Motivo', 'Requisitos Evaluados', 'Excepción', 'Excepción Detalle', 'Observaciones', 'Fecha Registro', 'Última Actualización'];

// ============ Cargos (configurables; cargo ≠ grado, ROF-S Art. 58) ============
var COL_CARGO = { id: 1, nombre: 2, areaId: 3, ordenJerarquico: 4, descripcion: 5, origen: 6, activo: 7, observaciones: 8 };
var N_COLS_CARGO = 8;
var ENCABEZADOS_CARGO = ['ID', 'Nombre', 'Área ID', 'Orden Jerárquico', 'Descripción', 'Origen', 'Activo', 'Observaciones'];

// ============ Historial Cargos ============
var COL_HIST_CARGO = { id: 1, voluntarioId: 2, cargoId: 3, fechaDesde: 4, fechaHasta: 5, quienAsigno: 6, resolucion: 7, observaciones: 8, fechaRegistro: 9, ultimaActualizacion: 10 };
var N_COLS_HIST_CARGO = 10;
var ENCABEZADOS_HIST_CARGO = ['ID', 'Voluntario ID', 'Cargo ID', 'Fecha Desde', 'Fecha Hasta', 'Quien Asignó', 'Resolución', 'Observaciones', 'Fecha Registro', 'Última Actualización'];

// ============ Áreas (estructura interna de la sede) ============
var COL_AREA = { id: 1, nombre: 2, orden: 3, encargadoId: 4, descripcion: 5, origen: 6, activo: 7, observaciones: 8 };
var N_COLS_AREA = 8;
var ENCABEZADOS_AREA = ['ID', 'Nombre', 'Orden', 'Encargado ID', 'Descripción', 'Origen', 'Activo', 'Observaciones'];

// ============ Especialidades ============
// V3.4G: col 8 'niveles' (lista separada por ';' — p. ej. SCI: Introductorio;
// Básico Online; Básico; Intermedio; Avanzado). Los niveles son atributo del
// catálogo, NO subespecialidades independientes.
var COL_ESPECIALIDAD = { id: 1, nombre: 2, areaId: 3, descripcion: 4, origen: 5, activo: 6, observaciones: 7, niveles: 8 };
var N_COLS_ESPECIALIDAD = 8;
var ENCABEZADOS_ESPECIALIDAD = ['ID', 'Nombre', 'Área ID', 'Descripción', 'Origen', 'Activo', 'Observaciones', 'Niveles'];

// ============ Subespecialidades ============
// V3.4G: col 8 'niveles' (p. ej. Radioaficionado: Aspirante; Novicio; General).
var COL_SUBESPECIALIDAD = { id: 1, especialidadId: 2, nombre: 3, descripcion: 4, origen: 5, activo: 6, observaciones: 7, niveles: 8 };
var N_COLS_SUBESPECIALIDAD = 8;
var ENCABEZADOS_SUBESPECIALIDAD = ['ID', 'Especialidad ID', 'Nombre', 'Descripción', 'Origen', 'Activo', 'Observaciones', 'Niveles'];

// ============ Voluntario Especialidades (N:N) ============
// V3.3: col 11 activo (vacío = vigente; false = relación cerrada, no se borra).
var COL_VOL_ESPECIALIDAD = { id: 1, voluntarioId: 2, especialidadId: 3, subespecialidadId: 4, fechaAsignacion: 5, nivel: 6, credencialId: 7, observaciones: 8, fechaRegistro: 9, ultimaActualizacion: 10, activo: 11 };
var N_COLS_VOL_ESPECIALIDAD = 11;
var ENCABEZADOS_VOL_ESPECIALIDAD = ['ID', 'Voluntario ID', 'Especialidad ID', 'Subespecialidad ID', 'Fecha Asignación', 'Nivel', 'Credencial ID', 'Observaciones', 'Fecha Registro', 'Última Actualización', 'Activo'];

// ============ Credenciales ============
var COL_CREDENCIAL = { id: 1, nombre: 2, emisor: 3, numero: 4, fechaEmision: 5, fechaVencimiento: 6, documento: 7, estado: 8, observaciones: 9, fechaRegistro: 10, ultimaActualizacion: 11 };
var N_COLS_CREDENCIAL = 11;
var ENCABEZADOS_CREDENCIAL = ['ID', 'Nombre', 'Emisor', 'Número', 'Fecha Emisión', 'Fecha Vencimiento', 'Documento', 'Estado', 'Observaciones', 'Fecha Registro', 'Última Actualización'];

// ============ Voluntario Credenciales (N:N) ============
// V3.4G: col 9 'nivel' (p. ej. Novicio) y col 10 'modelosHabilitados'
// (lista ';' — p. ej. RPAS: MAVIC SERIES; MINI 2). El indicativo de
// radioaficionado (p. ej. CA2OPX) se registra en Observaciones; su prefijo
// debe coincidir con el nivel (PREFIJOS_INDICATIVO_RADIO).
var COL_VOL_CREDENCIAL = { id: 1, voluntarioId: 2, credencialId: 3, fechaObtencion: 4, estado: 5, observaciones: 6, fechaRegistro: 7, ultimaActualizacion: 8, nivel: 9, modelosHabilitados: 10 };
var N_COLS_VOL_CREDENCIAL = 10;
var ENCABEZADOS_VOL_CREDENCIAL = ['ID', 'Voluntario ID', 'Credencial ID', 'Fecha Obtención', 'Estado', 'Observaciones', 'Fecha Registro', 'Última Actualización', 'Nivel', 'Modelos Habilitados'];

// ============ Capacitaciones ============
var COL_CAPACITACION = { id: 1, nombre: 2, institucion: 3, instructor: 4, tipo: 5, horas: 6, vigenciaMeses: 7, origen: 8, activo: 9, observaciones: 10 };
var N_COLS_CAPACITACION = 10;
var ENCABEZADOS_CAPACITACION = ['ID', 'Nombre', 'Institución', 'Instructor', 'Tipo', 'Horas', 'Vigencia Meses', 'Origen', 'Activo', 'Observaciones'];

// ============ Voluntario Capacitaciones (N:N) ============
// V3.3: col 12 activo (vacío = vigente; false = relación cerrada, no se borra).
var COL_VOL_CAPACITACION = { id: 1, voluntarioId: 2, capacitacionId: 3, fecha: 4, fechaVencimiento: 5, aprobado: 6, calificacion: 7, respaldo: 8, observaciones: 9, fechaRegistro: 10, ultimaActualizacion: 11, activo: 12 };
var N_COLS_VOL_CAPACITACION = 12;
var ENCABEZADOS_VOL_CAPACITACION = ['ID', 'Voluntario ID', 'Capacitación ID', 'Fecha', 'Fecha Vencimiento', 'Aprobado', 'Calificación', 'Respaldo', 'Observaciones', 'Fecha Registro', 'Última Actualización', 'Activo'];

// ============ Unidades internas ============
var COL_UNIDAD = { id: 1, nombre: 2, descripcion: 3, estado: 4, jefeId: 5, fechaCreacion: 6, observaciones: 7, fechaRegistro: 8, ultimaActualizacion: 9 };
var N_COLS_UNIDAD = 9;
var ENCABEZADOS_UNIDAD = ['ID', 'Nombre', 'Descripción', 'Estado', 'Jefe ID', 'Fecha Creación', 'Observaciones', 'Fecha Registro', 'Última Actualización'];

// ============ Integrantes Unidad (N:N) ============
var COL_INTEGRANTE_UNIDAD = { id: 1, unidadId: 2, voluntarioId: 3, rol: 4, fechaIngreso: 5, fechaSalida: 6, observaciones: 7, fechaRegistro: 8, ultimaActualizacion: 9 };
var N_COLS_INTEGRANTE_UNIDAD = 9;
var ENCABEZADOS_INTEGRANTE_UNIDAD = ['ID', 'Unidad ID', 'Voluntario ID', 'Rol', 'Fecha Ingreso', 'Fecha Salida', 'Observaciones', 'Fecha Registro', 'Última Actualización'];

// ============ Servicios ============
// V3.4D: cols 24-25 fechaTermino/institucionSolicitante (lugar: todo Chile).
var COL_SERVICIO = { id: 1, tipoServicioId: 2, nombre: 3, descripcion: 4, fecha: 5, horarioInicio: 6, horarioFin: 7, lugar: 8, direccion: 9, comuna: 10, region: 11, responsableId: 12, telefonoContacto: 13, rolesRequeridos: 14, alimentacion: 15, agua: 16, alojamiento: 17, transporte: 18, apoyoLogistico: 19, estado: 20, observaciones: 21, fechaRegistro: 22, ultimaActualizacion: 23, fechaTermino: 24, institucionSolicitante: 25 };
var N_COLS_SERVICIO = 25;
var ENCABEZADOS_SERVICIO = ['ID', 'Tipo Servicio ID', 'Nombre', 'Descripción', 'Fecha', 'Horario Inicio', 'Horario Fin', 'Lugar', 'Dirección', 'Comuna', 'Región', 'Responsable ID', 'Teléfono Contacto', 'Roles Requeridos', 'Alimentación', 'Agua', 'Alojamiento', 'Transporte', 'Apoyo Logístico', 'Estado', 'Observaciones', 'Fecha Registro', 'Última Actualización', 'Fecha Término', 'Institución Solicitante'];
var ESTADOS_SERVICIO = ['Planificado', 'Activo', 'Finalizado', 'Cancelado'];
var ESTADO_SERVICIO_DEFECTO = 'Planificado';

// ============ Servicio Voluntarios (asignaciones) ============
var COL_SERVICIO_VOLUNTARIO = { id: 1, servicioId: 2, voluntarioId: 3, rolEnServicio: 4, asignadoPor: 5, fechaAsignacion: 6, estado: 7, observaciones: 8, fechaRegistro: 9, ultimaActualizacion: 10 };
var N_COLS_SERVICIO_VOLUNTARIO = 10;
var ENCABEZADOS_SERVICIO_VOLUNTARIO = ['ID', 'Servicio ID', 'Voluntario ID', 'Rol en Servicio', 'Asignado Por', 'Fecha Asignación', 'Estado', 'Observaciones', 'Fecha Registro', 'Última Actualización'];

// ============ Asistencia ============
var COL_ASISTENCIA = { id: 1, servicioId: 2, voluntarioId: 3, tipoAsistencia: 4, estado: 5, horas: 6, motivo: 7, responsableRegistro: 8, observaciones: 9, fechaRegistro: 10, ultimaActualizacion: 11 };
var N_COLS_ASISTENCIA = 11;
var ENCABEZADOS_ASISTENCIA = ['ID', 'Servicio ID', 'Voluntario ID', 'Tipo Asistencia', 'Estado', 'Horas', 'Motivo', 'Responsable Registro', 'Observaciones', 'Fecha Registro', 'Última Actualización'];

// ============ Hoja de Servicios (timeline perpetuo, solo append) ============
var COL_HOJA_SERVICIOS = { id: 1, voluntarioId: 2, tipoEvento: 3, fecha: 4, detalle: 5, referenciaId: 6, quienRegistro: 7, fechaRegistro: 8, ultimaActualizacion: 9 };
var N_COLS_HOJA_SERVICIOS = 9;
var ENCABEZADOS_HOJA_SERVICIOS = ['ID', 'Voluntario ID', 'Tipo Evento', 'Fecha', 'Detalle', 'Referencia ID', 'Quien Registró', 'Fecha Registro', 'Última Actualización'];

// ============ Anotaciones (Art. 68 y notas) ============
// V3.3: col 12 activo (vacío = vigente; false = anotación desactivada, NO se borra).
var COL_ANOTACION = { id: 1, voluntarioId: 2, tipo: 3, fecha: 4, detalle: 5, autor: 6, sancion: 7, vigenciaHasta: 8, observaciones: 9, fechaRegistro: 10, ultimaActualizacion: 11, activo: 12 };
var N_COLS_ANOTACION = 12;
var ENCABEZADOS_ANOTACION = ['ID', 'Voluntario ID', 'Tipo', 'Fecha', 'Detalle', 'Autor', 'Sanción', 'Vigencia Hasta', 'Observaciones', 'Fecha Registro', 'Última Actualización', 'Activo'];

// ============ Documentos ============
// V3.3: col 12 activo (vacío = vigente; false = documento desactivado, NO se borra).
var COL_DOCUMENTO = { id: 1, voluntarioId: 2, sedeId: 3, tipo: 4, fecha: 5, descripcion: 6, referencia: 7, enlace: 8, observaciones: 9, fechaRegistro: 10, ultimaActualizacion: 11, activo: 12 };
var N_COLS_DOCUMENTO = 12;
var ENCABEZADOS_DOCUMENTO = ['ID', 'Voluntario ID', 'Sede ID', 'Tipo', 'Fecha', 'Descripción', 'Referencia', 'Enlace', 'Observaciones', 'Fecha Registro', 'Última Actualización', 'Activo'];

// ============ Devoluciones (múltiples parciales por entrega) ============
var COL_DEVOLUCION = { id: 1, entregaId: 2, fecha: 3, cantidadDevuelta: 4, cantidadDanada: 5, cantidadExtraviada: 6, responsable: 7, observaciones: 8, fechaRegistro: 9, ultimaActualizacion: 10 };
var N_COLS_DEVOLUCION = 10;
var ENCABEZADOS_DEVOLUCION = ['ID', 'Entrega ID', 'Fecha', 'Cant. Devuelta', 'Cant. Dañada', 'Cant. Extraviada', 'Responsable', 'Observaciones', 'Fecha Registro', 'Última Actualización'];

// ============ Catálogos de listas (CONFIGURABLE) ============
var COL_CATALOGO_LISTA = { id: 1, nombre: 2, origen: 3, activo: 4, observaciones: 5 };

// ============ Retiros temporales (V3.2) ============
// Un retiro temporal = período de ausencia con reincorporación. Sin borrado físico:
// estados Activo / Finalizado / Anulado. La antigüedad se deriva (no se persiste).
var COL_RETIRO_TEMPORAL = {
  id: 1, voluntarioId: 2, sedeId: 3, fechaInicio: 4, fechaTermino: 5,
  documento: 6, documentoFecha: 7, documentoDescripcion: 8, motivo: 9,
  observaciones: 10, estado: 11, fechaReincorporacion: 12, estadoAnterior: 13,
  registradoPor: 14, fechaRegistro: 15, ultimaActualizacion: 16
};
var N_COLS_RETIRO_TEMPORAL = 16;
var ENCABEZADOS_RETIRO_TEMPORAL = ['ID', 'Voluntario ID', 'Sede ID', 'Fecha Inicio', 'Fecha Término', 'Documento', 'Fecha Documento', 'Descripción Documento', 'Motivo', 'Observaciones', 'Estado', 'Fecha Reincorporación', 'Estado Anterior', 'Registrado Por', 'Fecha Registro', 'Última Actualización'];
var ESTADOS_RETIRO_TEMPORAL = ['Activo', 'Finalizado', 'Anulado'];
var N_COLS_CATALOGO_LISTA = 5;
var ENCABEZADOS_CATALOGO_LISTA = ['ID', 'Nombre', 'Origen', 'Activo', 'Observaciones'];

// ============ Usuarios y Permisos ============
var COL_USUARIO = { id: 1, correo: 2, perfil: 3, activo: 4, observaciones: 5, fechaRegistro: 6, ultimaActualizacion: 7 };
var N_COLS_USUARIO = 7;
var ENCABEZADOS_USUARIO = ['ID', 'Correo', 'Perfil', 'Activo', 'Observaciones', 'Fecha Registro', 'Última Actualización'];

var COL_PERMISO = { id: 1, perfil: 2, modulo: 3, accion: 4, activo: 5, observaciones: 6 };
var N_COLS_PERMISO = 6;
var ENCABEZADOS_PERMISO = ['ID', 'Perfil', 'Módulo', 'Acción', 'Activo', 'Observaciones'];

// ============ Semillas V2 (catálogos iniciales — no inventar más) ============

// [Nombre, Orden, Insignia, Origen, Activo, Observaciones]
// V3.4H: espejo de la hoja real corregida a mano — "Jefe de sede" es un GRADO
// OFICIAL de la sede (orden 2, '3 barras'), no un distintivo (7 grados).
var GRADOS_V2 = [
  ['Comandante Local', 1, '4 barras', 'OFICIAL', true, 'UNI 2018 — autoridad máxima de la sede (ROF-S Art. 11)'],
  ['Jefe de sede', 2, '3 barras', 'OFICIAL', true, 'UNI 2018'],
  ['Instructor Mayor', 3, '2 barras', 'OFICIAL', true, 'UNI 2018'],
  ['Instructor', 4, '1 barra', 'OFICIAL', true, 'UNI 2018'],
  ['Subinstructor', 5, 'V + barra', 'OFICIAL', true, 'UNI 2018'],
  ['Voluntario Mayor', 6, 'V + estrella', 'OFICIAL', true, 'UNI 2018'],
  ['Voluntario', 7, 'V', 'OFICIAL', true, 'UNI 2018 — grado de ingreso']
];

// [Nombre, Orden, Origen, Activo]
var AREAS_V2 = [
  ['Mando', 0, 'INTERNO', true],
  ['A-1 Personal', 1, 'INTERNO', true],
  ['A-2 Prevención de Riesgos y Seguridad', 2, 'INTERNO', true],
  ['A-3 Operaciones', 3, 'INTERNO', true],
  ['A-4 Logística', 4, 'INTERNO', true],
  ['Vestuario y Equipo', 5, 'INTERNO', true],
  ['Telecomunicaciones e Informática', 6, 'INTERNO', true],
  ['Sanidad', 7, 'INTERNO', true],
  ['Relaciones Públicas', 8, 'INTERNO', true]
];

// [Nombre, Área (nombre), Orden, Descripción, Origen, Activo]
var CARGOS_V2 = [
  ['Comandante Local', 'Mando', 1, 'Máxima autoridad de la sede (ROF-S Art. 11; designado por resolución exenta de la DG; DS N°547 10-05-1948)', 'OFICIAL', true],
  ['Jefe de Sede / Jefe Local', 'Mando', 2, 'Requiere grado Instructor Mayor con al menos 3 años en el grado (OFICIAL)', 'OFICIAL', true],
  ['Ayudante del Comandante', 'Mando', 3, '', 'INTERNO', true],
  ['Ayudante del Jefe', 'Mando', 4, '', 'INTERNO', true],
  ['Jefe de Equipo', 'A-3 Operaciones', 5, 'Jefatura de equipo operativo (ROF-S Anexo N°1)', 'OFICIAL', true],
  ['Jefe de Área', '', 6, 'Jefatura de un área de la sede', 'INTERNO', true]
];

// [Nombre, Área (nombre), Descripción, Origen, Activo, Niveles (opcional)]
// V3.4C: A-4 Logística = 3 especialidades INDEPENDIENTES (Administrador de
// Albergues, Administrador de Centros de Acopio, Operador de Equipos
// Logísticos) — NO una única "Administración Logística" con variantes.
// V3.4F: SCI = especialidad RECONOCIDA/CONFIGURABLE (utilizada por distintas
// sedes) — se siembra en el catálogo pero NO se asigna a nadie.
// V3.4G: SCI es UNA especialidad con NIVELES (col 8) — ya NO son 5
// subespecialidades independientes.
// V3.4H: SCI reclasificada a origen INTERNA (propia de la sede). Espejo de la
// hoja real corregida a mano (10 filas): "Administración Logística" queda
// Inactiva (cerrada V3.4C, reemplazada por 3 especialidades A-4) y "Auxiliar
// de Sanidad" declara sus 4 niveles en el campo niveles.
var ESPECIALIDADES_V2 = [
  ['Auxiliar de Sanidad', 'Sanidad', 'Médico / Enfermero universitario / TENS / Auxiliar', 'OFICIAL', true, 'Auxiliar; TENS; Enfermero Universitario; Medico'],
  ['Telecomunicaciones', 'Telecomunicaciones e Informática', 'Radioperador (Básico / Intermedio / Avanzado — Resol/Exta N°293 15-ENE-2024)', 'OFICIAL', true, ''],
  ['Administración Logística', 'A-4 Logística', 'Adm. Albergues / Adm. Centros de Acopio / Operador de Equipos Logísticos', 'OFICIAL', false, ''],
  ['Operador RPAS', 'Telecomunicaciones e Informática', 'Operación de drones (RPAS). Los modelos habilitados se registran en la credencial del voluntario (modelosHabilitados), no como subespecialidades.', 'INTERNO', true, ''],
  ['Rescate Técnico con Cuerda', 'A-3 Operaciones', '', 'INTERNO', true, ''],
  ['Búsqueda y Rescate', 'A-3 Operaciones', '', 'INTERNO', true, ''],
  ['Sistema de Comando de Incidentes (SCI)', 'A-3 Operaciones', '', 'INTERNO', true, 'Introductorio; Básico Online; Básico; Intermedio; Avanzado'],
  ['Administrador de Albergues', 'A-4 Logística', '', 'OFICIAL', true, ''],
  ['Administrador de Centros de Acopio', 'A-4 Logística', '', 'OFICIAL', true, ''],
  ['Operador de Equipos Logísticos', 'A-4 Logística', '', 'OFICIAL', true, '']
];

// [Nombre, Especialidad (nombre), Origen, Activo, Niveles (opcional)]
// V3.4F: niveles SCI como subespecialidades — V3.4G: ELIMINADOS (niveles de la
// especialidad SCI). Radioaficionado es UNA subespecialidad de
// Telecomunicaciones con niveles — V3.4H: la hoja real declara 4 niveles
// (Aspirante; Novicio; General; Superior).
var SUBESPECIALIDADES_V2 = [
  ['Radioaficionado', 'Telecomunicaciones', 'INTERNO', true, 'Aspirante; Novicio; General; Superior'],
  ['Stop The Bleed', 'Auxiliar de Sanidad', 'INTERNO', true, '']
];

// Prefijos de indicativo de radioaficionado por nivel (referencia para la
// ficha de la credencial). Niveles V3.4G: Aspirante→CD, Novicio→CA, General→CE.
var PREFIJOS_INDICATIVO_RADIO = { Aspirante: 'CD', Novicio: 'CA', General: 'CE' };

// [Nombre, Descripción, Estado, Origen]
// V3.4C: estados de unidad ampliados (En formación / Activa / Inactiva);
// Grupo de Rescate Animal se registra en formación.
var UNIDADES_V2 = [
  ['Fuerza de Tarea Delta', 'Unidad operativa interna de la sede. NOTA: "Delta" en el ámbito oficial corresponde al Código Delta de radiocomunicaciones (RAD-B cap. 4); esta unidad es INTERNA de la sede.', 'Activa', 'INTERNO'],
  ['Operadores RPA', 'Unidad operativa interna de operadores de aeronaves remotamente pilotadas (RPA). Capacidad distinta de la licencia externa DGAC: la unidad agrupa a los operadores; la licencia acredita la habilitación legal.', 'Activa', 'INTERNO'],
  ['Grupo de Rescate Animal', 'Unidad en formación', 'En formación', 'INTERNO']
];

var TIPOS_SERVICIO_V2 = ['Centro de Resguardo Temporal', 'Albergue', 'Búsqueda de personas', 'Puesto sanitario', 'Direccionamiento de personas', 'Votaciones', 'Apoyo institucional', 'Emergencia', 'Operativo', 'Régimen e instrucción', 'Capacitación', 'Otro'];
var ESTADOS_ASISTENCIA_V2 = ['Asignado', 'Presente', 'Ausente', 'Ausente justificado', 'Reemplazado', 'Retirado'];
var TIPOS_DOCUMENTO_V2 = ['Resolución', 'Certificado', 'Licencia', 'Curso', 'Hoja de vida', 'Otro'];
var TIPOS_EVENTO_HOJA = ['INGRESO', 'ASCENSO', 'CARGO', 'SERVICIO', 'CAPACITACION', 'ESPECIALIDAD', 'CREDENCIAL', 'RETIRO_TEMPORAL', 'RECONOCIMIENTO', 'ANOTACION', 'SITUACION_ADMINISTRATIVA', 'REINCORPORACION', 'EGRESO'];
var TIPOS_ANOTACION = ['Observación', 'Amonestación', 'Reprensión', 'Suspensión del servicio', 'Baja del servicio', 'Nota positiva'];
var PERFILES = ['Administrador', 'Encargado', 'Voluntario', 'Consulta'];
var GRUPOS_ABO = ['A', 'B', 'AB', 'O'];
var FACTORES_RH = ['+', '-'];
var ESTADOS_CREDENCIAL = ['Vigente', 'Por vencer', 'Vencida', 'Revocada'];
// V3.4H: el catálogo de Credenciales es una PLANTA (tipo de licencia) — su
// único estado es Activo/Inactivo. La vigencia (Vigente/Por vencer/Vencida) y
// la Revocación viven SOLO en la asignación (Voluntario_Credencial).
var ESTADOS_TIPO_CREDENCIAL = ['Activo', 'Inactivo'];
var ESTADOS_UNIDAD = ['En formación', 'Activa', 'Inactiva'];
var TIPOS_ASISTENCIA = ['Operativa', 'Régimen e instrucción'];

// V3.4C: catálogo extensible de TIPOS de licencia (credenciales de tipo
// licencia en el catálogo de Credenciales). La lista es la referencia de
// tipos conocidos; agregar un tipo = agregar su credencial "Licencia de X".
// Las habilitaciones/categorías particulares (p. ej. Novicio, RPAS) viven en
// los campos de la credencial y sus observaciones.
var TIPOS_LICENCIA = ['Radioaficionado', 'RPAS', 'Clase F'];
var ESTADO_VOLUNTARIO_V2_DEFECTO = 'Activo';
var CATEGORIA_VOLUNTARIO_V2_DEFECTO = 'Voluntario';