/**
 * 36_SeedDemo.js — FASE V3.4A + CORRECCIONES V3.4C + ALINEACIÓN V3.4H.
 *
 * SIEMBRA de datos de prueba controlados, usando SOLO APIs existentes.
 * Ejecutar desde el editor:
 *   crearDatosDemoV2()
 *
 * Contenido (V3.4A):
 *  - Registro REAL autorizado: Patricio Andrés Varela Contreras (RUN 21.889.985-4),
 *    Voluntario Mayor, Activo, ingreso 01/04/2023, cargo "Asesor de
 *    Telecomunicaciones" (fecha aproximada documentada), Sanidad (nivel TENS),
 *    Telecomunicaciones + Radioaficionado (distintivo CA2OPX), Operador RPAS
 *    INTERNO, grupo sanguíneo O+, integrante de la Fuerza de Tarea Delta
 *    (INTERNO, sin rol específico) y 7 entregas de equipamiento (Botas de
 *    combate 45, Polera L, Blusa L, Pantalón L, Gorra sin cubrenuca, Cinturón
 *    de combate, Cinturón de vestir).
 *  - 5 voluntarios ficticios DEMO 01–05 (RUN 11.111.111-1 … 55.555.555-5),
 *    inequívocamente identificables como DEMO (DEMO 03 = Egresado).
 *  - 3 servicios DEMO (1 Activo + 2 históricos Finalizados), asignaciones
 *    masivas, 2 retiros de prueba y asistencia variada.
 *
 * V3.4H (espejo de las hojas corregidas a mano — fuente de verdad):
 *  - LOOKUP-ONLY de catálogos: Especialidades, Subespecialidades,
 *    Credenciales y Unidades Internas NO se crean ni normalizan (existen por
 *    estructura/reset; si falta un elemento, se reporta detalle y se omite).
 *  - Textos de datos reproducen las correcciones manuales: obs de la
 *    credencial de radioaficionado = "Distintivo: CA2OPX."; obs de la de RPAS
 *    = "Licencia DGAC de operador RPAS."; modelos habilitados = "Enterprise 3;
 *    Enterprise 3 Pro; Mavic Series; Mini 2" (orden del usuario, sin "(DEMO)").
 *  - Sin referencias a fases de desarrollo en observaciones.
 *
 * IDEMPOTENTE: cada bloque verifica antes de crear (por RUN / nombre / estado);
 * re-ejecutar no duplica.
 */

// Datos del registro real autorizado (FASE V3.4A + correcciones V3.4C).
var SEED_DEMO_PATRICIO = {
  run: '21.889.985-4',
  nombres: 'Patricio Andrés',
  apPaterno: 'Varela',
  apMaterno: 'Contreras',
  grupoABO: 'O',
  factorRh: '+',
  fechaIngreso: '01/04/2023',
  estado: 'Activo',
  categoria: 'Voluntario',
  gradoActual: 'Voluntario Mayor',
  cargo: 'Asesor de Telecomunicaciones',
  cargoArea: 'Telecomunicaciones e Informática',
  cargoObservaciones: 'Cargo asumido aproximadamente 10 meses después del ingreso.',
  // V3.4D: la especialidad fue renombrada a "Auxiliar de Sanidad" (ID intacto).
  especialidadSanidad: 'Auxiliar de Sanidad',
  especialidadSanidadNivel: 'TENS',
  especialidadTelecom: 'Telecomunicaciones',
  subespecialidadRadio: 'Radioaficionado',
  distintivo: 'CA2OPX',
  especialidadRpas: 'Operador RPAS',
  rpasNivel: 'Operador',
  // V3.4H: modelos habilitados reproducen la hoja corregida (orden del
  // usuario, sin "(DEMO)").
  rpasModelos: 'Enterprise 3; Enterprise 3 Pro; Mavic Series; Mini 2',
  licenciaRadio: {
    nombre: 'Licencia de Radioaficionado',
    categoria: 'Novicio',
    numero: 'No informado'
  },
  licenciaRpas: {
    nombre: 'Licencia de Operador RPAS',
    emisor: 'DGAC',
    numero: '16418',
    emision: '26/09/2024',
    vencimiento: '26/09/2027'
  },
  unidad: 'Fuerza de Tarea Delta',
  unidadRpa: 'Operadores RPA',
  equipamiento: [
    { elemento: 'Botas de combate', talla: '45' },
    { elemento: 'Polera', talla: 'L' },
    { elemento: 'Blusa', talla: 'L' },
    { elemento: 'Pantalón', talla: 'L' },
    { elemento: 'Gorra sin cubrenuca', talla: '' },
    { elemento: 'Cinturón de combate', talla: '' },
    { elemento: 'Cinturón de vestir', talla: '' }
  ]
};

// Voluntarios ficticios de prueba (RUN válidos con dígito verificador calculado).
var SEED_DEMO_VOLUNTARIOS = [
  { run: '11.111.111-1', nombres: 'DEMO 01', apPaterno: 'PRUEBA DEL SISTEMA', categoria: 'Voluntario', fechaIngreso: '01/01/2024', especialidad: 'Auxiliar de Sanidad' },
  { run: '22.222.222-2', nombres: 'DEMO 02', apPaterno: 'PRUEBA DEL SISTEMA', categoria: 'Voluntario', fechaIngreso: '01/02/2024', especialidad: 'Telecomunicaciones' },
  { run: '33.333.333-3', nombres: 'DEMO 03', apPaterno: 'PRUEBA DEL SISTEMA', categoria: 'Voluntario', fechaIngreso: '01/03/2024', especialidad: 'Operador RPAS', estado: 'Egresado', observacionesVoluntario: 'Prueba V3.4H: demo Egresado' },
  { run: '44.444.444-4', nombres: 'DEMO 04', apPaterno: 'PRUEBA DEL SISTEMA', categoria: 'Disponible', fechaIngreso: '01/04/2024', especialidad: 'Administrador de Centros de Acopio' },
  { run: '55.555.555-5', nombres: 'DEMO 05', apPaterno: 'PRUEBA DEL SISTEMA', categoria: 'Aspirante', fechaIngreso: '01/05/2024', especialidad: '' }
];

// Servicios DEMO (1 activo + 2 históricos finalizados).
var SEED_DEMO_SERVICIOS = [
  { nombre: 'DEMO — PRUEBA DEL SISTEMA', tipo: 'Operativo', fecha: '17/08/2026', lugar: 'DEMO / Sede La Serena', descripcion: 'Registro de prueba para validación de la Web App.', estado: 'Activo' },
  { nombre: 'DEMO — PRUEBA HISTÓRICA 1', tipo: 'Capacitación', fecha: '10/06/2026', lugar: 'DEMO / Sede La Serena', descripcion: 'Servicio histórico de prueba (DEMO).', estado: 'Finalizado' },
  { nombre: 'DEMO — PRUEBA HISTÓRICA 2', tipo: 'Otro', fecha: '15/07/2026', lugar: 'DEMO / Sede La Serena', descripcion: 'Servicio histórico de prueba (DEMO).', estado: 'Finalizado' }
];

/**
 * Siembra completa de la FASE V3.4A. Idempotente. Devuelve resumen con
 * {ok, data:{creados, omitidos, detalles}} para verificación.
 */
function crearDatosDemoV2() {
  var ss = _ss();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  try {
    var r = { creados: [], omitidos: [], detalles: [] };

    // ── Registro real autorizado (V2) ─────────────────────────────────────
    var patricioV2 = _seedPersonaV2(ss, SEED_DEMO_PATRICIO, r, 'Patricio');
    var voluntarioId = patricioV2 ? patricioV2.voluntarioId : null;

    // ── Voluntarios DEMO (V2) ─────────────────────────────────────────────
    var demosV2 = {};
    for (var d = 0; d < SEED_DEMO_VOLUNTARIOS.length; d++) {
      var dVol = _seedPersonaV2(ss, SEED_DEMO_VOLUNTARIOS[d], r, SEED_DEMO_VOLUNTARIOS[d].nombres);
      demosV2[SEED_DEMO_VOLUNTARIOS[d].nombres] = dVol ? dVol.voluntarioId : null;
    }

    // ── Grado + cargo de Patricio ─────────────────────────────────────────
    if (voluntarioId) {
      _seedGradoPatricio(ss, voluntarioId, r);
      _seedCargoPatricio(ss, voluntarioId, r);
      _seedEspecialidadesPatricio(ss, voluntarioId, r);
      _seedUnidadPatricio(ss, voluntarioId, r);
    }

    // ── Grados + especialidades DEMO ──────────────────────────────────────
    for (var g = 0; g < SEED_DEMO_VOLUNTARIOS.length; g++) {
      var v = SEED_DEMO_VOLUNTARIOS[g];
      var vid = demosV2[v.nombres];
      if (!vid) continue;
      // Grado de ingreso para todos salvo el Aspirante (DEMO 05, sin grado).
      if (v.categoria !== 'Aspirante') {
        _seedGradoV2(ss, vid, 'Voluntario', v.fechaIngreso, 'Grado de ingreso (registro DEMO).', r, v.nombres);
      }
      if (v.especialidad) {
        _seedEspecialidadV2(ss, vid, v.especialidad, '', v.fechaIngreso, 'Registro DEMO (voluntario ficticio).', r, v.nombres);
      }
    }

    // ── Voluntarios v0 (páginas Voluntarios/Entregas/Ficha) ───────────────
    _seedVoluntarioV0(ss, SEED_DEMO_PATRICIO, r, 'Patricio');
    for (var v0 = 0; v0 < SEED_DEMO_VOLUNTARIOS.length; v0++) {
      _seedVoluntarioV0(ss, SEED_DEMO_VOLUNTARIOS[v0], r, SEED_DEMO_VOLUNTARIOS[v0].nombres);
    }

    // ── Equipamiento: inventario + 7 entregas (solo Patricio) ─────────────
    _seedEquipamientoPatricio(ss, r);

    // ── Servicios DEMO + asignaciones + retiros + asistencia ──────────────
    _seedServicios(ss, voluntarioId, demosV2, r);

    // ── Inventario v0 DEMO (40/elemento, menos lo ya entregado) ───────────
    // V3.4H: lookup-only de catálogos — catálogos no se crean/normalizan.
    _seedInventarioV34C(ss, r);

    // ── Verificación de catálogos (lookup-only) ───────────────────────────
    // V3.4H: tras el reset + re-siembra, todos los catálogos deben existir.
    // Reportamos anomalies pero NO abortamos — el seed es robusto.
    _verificarCatalogosLookupV34H(ss, r);

    _log(ss, HOJA_V2.personas, 'crearDatosDemoV2', 'OK', 'Creados: ' + r.creados.length + ' | Omitidos (ya existían): ' + r.omitidos.length);
    return _resOk({
      creados: r.creados,
      omitidos: r.omitidos,
      detalles: r.detalles
    });
  } finally {
    lock.releaseLock();
  }
}

// ─────────────────────────────── Personas V2 ───────────────────────────────

/** Persona V2 (+ vínculo VoluntariosV2) si el RUN no existe; idempotente. */
function _seedPersonaV2(ss, datos, r, etiqueta) {
  var existentes = _tablaV2(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA);
  for (var i = 0; i < existentes.length; i++) {
    if (_cuerpoRUN(existentes[i].run) === _cuerpoRUN(_validarRUT(datos.run).run || datos.run)) {
      var ya = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
        return String(v.personaId) === String(existentes[i].id);
      });
      r.omitidos.push(etiqueta + ' (persona ya existe: P' + existentes[i].id + (ya ? ', Vol. ' + ya.id : '') + ')');
      return { id: existentes[i].id, voluntarioId: ya ? ya.id : null };
    }
  }
  var res = crearPersonaV2({
    run: datos.run,
    nombres: datos.nombres,
    apPaterno: datos.apPaterno,
    apMaterno: datos.apMaterno || '',
    grupoABO: datos.grupoABO || '',
    factorRh: datos.factorRh || '',
    observaciones: datos.observaciones || 'Registro DEMO (datos de prueba controlados).',
    voluntario: true,
    estado: datos.estado || 'Activo',
    categoria: datos.categoria,
    fechaIngreso: datos.fechaIngreso,
    observacionesVoluntario: datos.observacionesVoluntario || 'Registro DEMO (datos de prueba controlados).'
  });
  if (!res.ok) { r.detalles.push('ERROR persona ' + etiqueta + ': ' + res.error); return null; }
  r.creados.push('Persona ' + etiqueta + ' → P' + res.data.id + (res.data.voluntarioId ? ' / Vol. ' + res.data.voluntarioId : ''));
  return res.data;
}

// ─────────────────────────────── Grado y cargo ─────────────────────────────

/** Grado de ingreso idempotente (no re-asigna si ya hay historial del grado). */
function _seedGradoV2(ss, voluntarioId, gradoNombre, fechaDesde, observaciones, r, etiqueta) {
  var grado = _buscarV2(ss, HOJA_V2.grados, COL_GRADO, N_COLS_GRADO, function (g) { return g.nombre === gradoNombre; });
  if (!grado) { r.detalles.push('ERROR grado ' + etiqueta + ': "' + gradoNombre + '" no existe en Grados'); return; }
  var hist = _tablaV2(ss, HOJA_V2.historialGrados, COL_HIST_GRADO, N_COLS_HIST_GRADO);
  for (var i = 0; i < hist.length; i++) {
    if (String(hist[i].voluntarioId) === String(voluntarioId) && String(hist[i].gradoId) === String(grado.id) && !_texto(hist[i].fechaHasta)) {
      r.omitidos.push('Grado ' + gradoNombre + ' (' + etiqueta + '): ya asignado (HG' + hist[i].id + ')');
      return;
    }
  }
  // V3.4F: un voluntario tiene UN grado vigente. Si una siembra previa ya
  // dejó un grado vigente (asignarGradoV2 cierra el anterior), no se vuelve a
  // sembrar un grado de IGUAL O MENOR jerarquía (el 'Voluntario' de ingreso se
  // re-creaba en re-ejecución). Se permite sembrar un grado SUPERIOR al
  // vigente: es la promoción legítima (ej. Patricio: Voluntario → Voluntario
  // Mayor en la misma ejecución).
  var gradosHoja = _tablaV2(ss, HOJA_V2.grados, COL_GRADO, N_COLS_GRADO);
  var vigente = null;
  for (var v = 0; v < hist.length; v++) {
    if (String(hist[v].voluntarioId) === String(voluntarioId) && !_texto(hist[v].fechaHasta)) { vigente = hist[v]; break; }
  }
  if (vigente) {
    var vg = null;
    for (var g2 = 0; g2 < gradosHoja.length; g2++) {
      if (String(gradosHoja[g2].id) === String(vigente.gradoId)) { vg = gradosHoja[g2]; break; }
    }
    var ordSeeded = Number(grado.orden || 99);
    var ordVigente = Number(vg ? vg.orden : 99);
    if (ordSeeded >= ordVigente) {
      r.omitidos.push('Grado ' + gradoNombre + ' (' + etiqueta + '): ya tiene grado vigente de igual o mayor jerarquía (HG' + vigente.id + ')');
      return;
    }
  }
  var res = asignarGradoV2(voluntarioId, grado.id, {
    fechaDesde: fechaDesde,
    quienAsigno: 'Sistema (siembra DEMO)',
    motivo: 'Registro DEMO',
    observaciones: observaciones
  });
  if (!res.ok) { r.detalles.push('ERROR grado ' + etiqueta + ': ' + res.error); return; }
  r.creados.push('Grado ' + gradoNombre + ' (' + etiqueta + ') → HG' + res.data.id);
}

/** Grado de Patricio: Voluntario al ingreso + Voluntario Mayor (sin fecha exacta). */
function _seedGradoPatricio(ss, voluntarioId, r) {
  _seedGradoV2(ss, voluntarioId, 'Voluntario', SEED_DEMO_PATRICIO.fechaIngreso,
    'Grado de ingreso (registro real autorizado).', r, 'Patricio');
  // Voluntario Mayor: fecha no precisada → se registra hoy (fecha real de la
  // carga), con observación; los requisitos (mín. 2 años como Voluntario)
  // se cumplen con el historial anterior.
  _seedGradoV2(ss, voluntarioId, SEED_DEMO_PATRICIO.gradoActual, '',
    'Grado registrado; fecha real de ascenso no informada.', r, 'Patricio');
}

/** Cargo "Asesor de Telecomunicaciones" (INTERNO) + asignación con observación. */
function _seedCargoPatricio(ss, voluntarioId, r) {
  var cargo = _buscarV2(ss, HOJA_V2.cargos, COL_CARGO, N_COLS_CARGO, function (c) {
    return c.nombre === SEED_DEMO_PATRICIO.cargo;
  });
  var cargoId = null;
  if (cargo) {
    cargoId = cargo.id;
    r.omitidos.push('Cargo "' + SEED_DEMO_PATRICIO.cargo + '": ya existe (C' + cargo.id + ')');
  } else {
    var area = _buscarV2(ss, HOJA_V2.areas, COL_AREA, N_COLS_AREA, function (a) {
      return a.nombre === SEED_DEMO_PATRICIO.cargoArea;
    });
    var resC = crearCargoV2({
      nombre: SEED_DEMO_PATRICIO.cargo,
      areaId: area ? area.id : '',
      descripcion: '',
      observaciones: 'Cargo creado para el registro real autorizado (INTERNO — SEDE).'
    });
    if (!resC.ok) { r.detalles.push('ERROR cargo: ' + resC.error); return; }
    cargoId = resC.data.id;
    r.creados.push('Cargo "' + SEED_DEMO_PATRICIO.cargo + '" → C' + cargoId);
  }
  // Fecha del cargo: aproximada (el modelo no soporta fechas aproximadas) →
  // se deja la fecha exacta vacía (se registra hoy) y la observación pedida.
  var histC = _tablaV2(ss, HOJA_V2.historialCargos, COL_HIST_CARGO, N_COLS_HIST_CARGO);
  for (var i = 0; i < histC.length; i++) {
    if (String(histC[i].voluntarioId) === String(voluntarioId) && String(histC[i].cargoId) === String(cargoId) && !_texto(histC[i].fechaHasta)) {
      r.omitidos.push('Cargo "' + SEED_DEMO_PATRICIO.cargo + '": ya asignado a Patricio (HC' + histC[i].id + ')');
      return;
    }
  }
  var res = asignarCargoV2(voluntarioId, cargoId, {
    fechaDesde: '',
    quienAsigno: 'Sistema (siembra DEMO)',
    observaciones: SEED_DEMO_PATRICIO.cargoObservaciones
  });
  if (!res.ok) { r.detalles.push('ERROR asignar cargo: ' + res.error); return; }
  r.creados.push('Cargo "' + SEED_DEMO_PATRICIO.cargo + '" (Patricio) → HC' + res.data.id);
}

// ─────────────────────────────── Especialidades ────────────────────────────

/** Asignación de especialidad idempotente (no duplica asignaciones vigentes). */
function _seedEspecialidadV2(ss, voluntarioId, espNombre, subNombre, fechaAsignacion, observaciones, r, etiqueta) {
  var esp = _buscarV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, function (e) {
    return e.nombre === espNombre;
  });
  if (!esp) { r.detalles.push('ERROR especialidad ' + etiqueta + ': "' + espNombre + '" no existe'); return; }
  var sub = null;
  if (subNombre) {
    sub = _buscarV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD, function (s) {
      return s.nombre === subNombre && String(s.especialidadId) === String(esp.id);
    });
    if (!sub) { r.detalles.push('ERROR subespecialidad ' + etiqueta + ': "' + subNombre + '" no existe bajo ' + espNombre); return; }
  }
  var asignadas = _tablaV2(ss, HOJA_V2.voluntarioEspecialidades, COL_VOL_ESPECIALIDAD, N_COLS_VOL_ESPECIALIDAD);
  for (var i = 0; i < asignadas.length; i++) {
    var a = asignadas[i];
    if (String(a.voluntarioId) === String(voluntarioId) &&
        String(a.especialidadId || '') === String(esp.id) &&
        String(a.subespecialidadId || '') === String(sub ? sub.id : '') &&
        _vigenteV2(a.activo)) {
      r.omitidos.push('Especialidad ' + espNombre + (sub ? ' / ' + sub.nombre : '') + ' (' + etiqueta + '): ya asignada (VE' + a.id + ')');
      return;
    }
  }
  var res = asignarEspecialidadV2(voluntarioId, {
    especialidadId: esp.id,
    subespecialidadId: sub ? sub.id : '',
    fechaAsignacion: fechaAsignacion,
    nivel: '',
    observaciones: observaciones
  });
  if (!res.ok) { r.detalles.push('ERROR asignar especialidad ' + etiqueta + ': ' + res.error); return; }
  r.creados.push('Especialidad ' + espNombre + (sub ? ' / ' + sub.nombre : '') + ' (' + etiqueta + ') → VE' + res.data.id);
}

/** Especialidades de Patricio: Sanidad (TENS), Telecomunicaciones (Radioaficionado,
 *  distintivo CA2OPX) y Operador RPAS INTERNO respaldado por la licencia DGAC
 *  N° 16418. V3.4G: los modelos habilitados (MAVIC SERIES, MINI 2, ENTERPRISE 3,
 *  ENTERPRISE 3 PRO) son DATOS de la credencial (modelosHabilitados), NO
 *  subespecialidades. */
function _seedEspecialidadesPatricio(ss, voluntarioId, r) {
  // Sanidad — variante TENS (nivel, NO especialidad separada).
  var espSanidad = _buscarV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, function (e) {
    return e.nombre === SEED_DEMO_PATRICIO.especialidadSanidad;
  });
  var asignadas = _tablaV2(ss, HOJA_V2.voluntarioEspecialidades, COL_VOL_ESPECIALIDAD, N_COLS_VOL_ESPECIALIDAD);
  var asignada = false;
  for (var i = 0; i < asignadas.length; i++) {
    var a = asignadas[i];
    if (String(a.voluntarioId) === String(voluntarioId) && String(a.especialidadId || '') === String(espSanidad ? espSanidad.id : '') && !a.subespecialidadId && _vigenteV2(a.activo)) {
      asignada = true;
      r.omitidos.push('Especialidad Sanidad (Patricio): ya asignada (VE' + a.id + ')');
    }
  }
  if (!asignada && espSanidad) {
    var res = asignarEspecialidadV2(voluntarioId, {
      especialidadId: espSanidad.id,
      fechaAsignacion: SEED_DEMO_PATRICIO.fechaIngreso,
      nivel: SEED_DEMO_PATRICIO.especialidadSanidadNivel,
      observaciones: 'Variante TENS de la especialidad de Sanidad (registro real autorizado).'
    });
    if (res.ok) r.creados.push('Especialidad Sanidad (nivel TENS, Patricio) → VE' + res.data.id);
    else r.detalles.push('ERROR Sanidad: ' + res.error);
  }

  // Telecomunicaciones + Radioaficionado (distintivo CA2OPX).
  _seedEspecialidadV2(ss, voluntarioId, SEED_DEMO_PATRICIO.especialidadTelecom, SEED_DEMO_PATRICIO.subespecialidadRadio,
    SEED_DEMO_PATRICIO.fechaIngreso,
    'Distintivo: ' + SEED_DEMO_PATRICIO.distintivo + '.', r, 'Patricio');

  // Radioaficionado: licencia SUBTEL, categoría Novicio, distintivo CA2OPX,
  // N° "No informado" (16418 NO es de radioaficionado).
  _seedCredencialRadioaficionado(ss, voluntarioId, r);
  // RPAS: licencia DGAC N° 16418 (26/09/2024 → 26/09/2027, Vigente) con los
  // modelos habilitados en la credencial (no como subespecialidades).
  var rpasLicId = _seedCredencialRpas(ss, voluntarioId, r);

  // Operador RPAS (capacidad INTERNO — SEDE) respaldada por la licencia DGAC.
  var espRpas = _buscarV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, function (e) {
    return e.nombre === SEED_DEMO_PATRICIO.especialidadRpas;
  });
  if (!espRpas) { r.detalles.push('ERROR especialidad "Operador RPAS" no existe'); return; }
  _seedAsignacionRpas(ss, voluntarioId, espRpas.id, '', SEED_DEMO_PATRICIO.rpasNivel, rpasLicId,
    'Capacidad INTERNO — SEDE respaldada por la licencia DGAC N° ' + SEED_DEMO_PATRICIO.licenciaRpas.numero + ' (' + SEED_DEMO_PATRICIO.licenciaRpas.emision + ' → ' + SEED_DEMO_PATRICIO.licenciaRpas.vencimiento + ').', r);
}

/** Credencial "Licencia de Radioaficionado": categoría NOVICIO, distintivo
 *  CA2OPX. V3.4H: lookup-only — obs = "Distintivo: CA2OPX." (la planta
 *  conserva lo que haya; nivel 'Novicio' en la relación). Idempotente. */
function _seedCredencialRadioaficionado(ss, voluntarioId, r) {
  var datos = SEED_DEMO_PATRICIO.licenciaRadio;
  var nombre = datos.nombre;
  var cred = _buscarV2(ss, HOJA_V2.credenciales, COL_CREDENCIAL, N_COLS_CREDENCIAL, function (c) {
    return c.nombre === nombre;
  });
  if (!cred) {
    r.detalles.push('SKIP credencial "' + nombre + '": no existe en catálogo (lookup-only)');
    return null;
  }
  var credencialId = cred.id;
  r.omitidos.push('Credencial "' + nombre + '": catálogo conservado (C' + credencialId + ')');
  var asignadas = _tablaV2(ss, HOJA_V2.voluntarioCredenciales, COL_VOL_CREDENCIAL, N_COLS_VOL_CREDENCIAL);
  for (var i = 0; i < asignadas.length; i++) {
    if (String(asignadas[i].voluntarioId) === String(voluntarioId) && String(asignadas[i].credencialId) === String(credencialId) && asignadas[i].estado !== 'Revocada') {
      r.omitidos.push('Credencial "' + nombre + '" (Patricio): ya asignada (VC' + asignadas[i].id + ')');
      return credencialId;
    }
  }
  var res = asignarCredencialV2(voluntarioId, credencialId, {
    estado: 'Vigente',
    nivel: datos.categoria,
    observaciones: 'Distintivo: ' + SEED_DEMO_PATRICIO.distintivo + '.'
  });
  if (!res.ok) { r.detalles.push('ERROR asignar credencial "' + nombre + '": ' + res.error); return null; }
  r.creados.push('Credencial "' + nombre + '" (Patricio, nivel ' + datos.categoria + ') → VC' + res.data.id);
  return credencialId;
}

/** Credencial "Licencia de Operador RPAS": organismo DGAC. V3.4H: lookup-only
 *  — obs = "Licencia DGAC de operador RPAS.", modelos = rpasModelos de la
 *  constante (orden/formato del usuario, sin "(DEMO)"). Idempotente. */
function _seedCredencialRpas(ss, voluntarioId, r) {
  var d = SEED_DEMO_PATRICIO.licenciaRpas;
  var cred = _buscarV2(ss, HOJA_V2.credenciales, COL_CREDENCIAL, N_COLS_CREDENCIAL, function (c) {
    return _norm(c.nombre) === _norm(d.nombre);
  });
  if (!cred) {
    r.detalles.push('SKIP credencial "' + d.nombre + '": no existe en catálogo (lookup-only)');
    return null;
  }
  var credencialId = cred.id;
  r.omitidos.push('Credencial "' + d.nombre + '": catálogo conservado (C' + credencialId + ')');
  var asignadas = _tablaV2(ss, HOJA_V2.voluntarioCredenciales, COL_VOL_CREDENCIAL, N_COLS_VOL_CREDENCIAL);
  for (var i = 0; i < asignadas.length; i++) {
    if (String(asignadas[i].voluntarioId) === String(voluntarioId) && String(asignadas[i].credencialId) === String(credencialId) && asignadas[i].estado !== 'Revocada') {
      r.omitidos.push('Credencial "' + d.nombre + '" (Patricio): ya asignada (VC' + asignadas[i].id + ')');
      return credencialId;
    }
  }
  var res = asignarCredencialV2(voluntarioId, credencialId, {
    fechaObtencion: d.emision,
    estado: 'Vigente',
    nivel: SEED_DEMO_PATRICIO.rpasNivel,
    modelosHabilitados: SEED_DEMO_PATRICIO.rpasModelos,
    observaciones: 'Licencia DGAC de operador RPAS.'
  });
  if (!res.ok) { r.detalles.push('ERROR asignar credencial "' + d.nombre + '": ' + res.error); return null; }
  r.creados.push('Credencial "' + d.nombre + '" (Patricio, ' + SEED_DEMO_PATRICIO.rpasNivel + ') → VC' + res.data.id);
  return credencialId;
}

/** Asignación de Operador RPAS (base, sin subespecialidad) con credencialId de
 *  la licencia DGAC N° 16418. Idempotente. */
function _seedAsignacionRpas(ss, voluntarioId, espId, subId, nivel, credencialId, observaciones, r) {
  var asignadas = _tablaV2(ss, HOJA_V2.voluntarioEspecialidades, COL_VOL_ESPECIALIDAD, N_COLS_VOL_ESPECIALIDAD);
  for (var i = 0; i < asignadas.length; i++) {
    var a = asignadas[i];
    if (String(a.voluntarioId) === String(voluntarioId) &&
        String(a.especialidadId || '') === String(espId) &&
        String(a.subespecialidadId || '') === String(subId) &&
        _vigenteV2(a.activo)) {
      r.omitidos.push('Asignación RPAS ' + (subId ? '(habilitación ' + subId + ')' : '(base)') + ' (Patricio): ya asignada (VE' + a.id + ')');
      return;
    }
  }
  var res = asignarEspecialidadV2(voluntarioId, {
    especialidadId: espId,
    subespecialidadId: subId,
    fechaAsignacion: SEED_DEMO_PATRICIO.licenciaRpas.emision,
    nivel: nivel,
    credencialId: credencialId,
    observaciones: observaciones
  });
  if (!res.ok) { r.detalles.push('ERROR asignación RPAS: ' + res.error); return; }
  r.creados.push('Asignación RPAS ' + (subId ? '(habilitación ' + subId + ')' : '(base, nivel ' + nivel + ')') + ' (Patricio) → VE' + res.data.id);
}

// ─────────────────────────────── Unidad ────────────────────────────────────

/** Patricio como integrante de unidades INTERNAS (V3.4E): Fuerza de Tarea
 *  Delta y Operadores RPA (sin rol). V3.4H: lookup-only — la unidad DEBE
 *  existir (creada por crearEstructuraV2 o el reset). Se busca con _norm
 *  (case-insensitive). La membresía (integrante) es transaccional y SÍ se crea. */
function _seedUnidadPatricio(ss, voluntarioId, r) {
  var unidades = [SEED_DEMO_PATRICIO.unidad];
  if (SEED_DEMO_PATRICIO.unidadRpa) unidades.push(SEED_DEMO_PATRICIO.unidadRpa);
  for (var ui = 0; ui < unidades.length; ui++) {
    var nombreUnidad = unidades[ui];
    var unidad = _buscarV2(ss, HOJA_V2.unidadesInternas, COL_UNIDAD, N_COLS_UNIDAD, function (u) {
      return _norm(u.nombre) === _norm(nombreUnidad);
    });
    if (!unidad) {
      r.detalles.push('SKIP unidad "' + nombreUnidad + '": no existe en catálogo (lookup-only)');
      continue;
    }
    r.omitidos.push('Unidad "' + nombreUnidad + '": catálogo conservado (U' + unidad.id + ')');
    var integrantes = _tablaV2(ss, HOJA_V2.integrantesUnidad, COL_INTEGRANTE_UNIDAD, N_COLS_INTEGRANTE_UNIDAD);
    var yaIntegrante = false;
    for (var i = 0; i < integrantes.length; i++) {
      if (String(integrantes[i].unidadId) === String(unidad.id) && String(integrantes[i].voluntarioId) === String(voluntarioId) && !integrantes[i].fechaSalida) {
        r.omitidos.push('Unidad "' + nombreUnidad + '" (Patricio): ya es integrante (IU' + integrantes[i].id + ')');
        yaIntegrante = true;
        break;
      }
    }
    if (yaIntegrante) continue;
    var res = asignarIntegranteUnidadV2(unidad.id, voluntarioId, {
      rol: '',
      fechaIngreso: SEED_DEMO_PATRICIO.fechaIngreso,
      observaciones: 'Integrante sin rol específico (registro real autorizado).'
    });
    if (!res.ok) { r.detalles.push('ERROR integrante unidad: ' + res.error); return; }
    r.creados.push('Unidad "' + nombreUnidad + '" (Patricio, sin rol) → IU' + res.data.id);
  }
}

// ──────────────────────────── Voluntarios v0 + Equipamiento ────────────────

/** Registro v0 (páginas Voluntarios/Entregas/Ficha): idempotente por RUN. */
function _seedVoluntarioV0(ss, datos, r, etiqueta) {
  var resList = listarVoluntarios();
  if (!resList.ok) { r.detalles.push('ERROR listarVoluntarios: ' + resList.error); return; }
  for (var i = 0; i < (resList.data || []).length; i++) {
    if (_cuerpoRUN(resList.data[i].run) === _cuerpoRUN(_validarRUT(datos.run).run)) {
      r.omitidos.push('Voluntario v0 ' + etiqueta + ': ya existe (N° ' + resList.data[i].id + ')');
      return;
    }
  }
  var res = crearVoluntario({
    run: datos.run,
    nombres: datos.nombres,
    apPaterno: datos.apPaterno,
    apMaterno: datos.apMaterno || '',
    fechaIngreso: datos.fechaIngreso,
    estado: datos.estado || 'Activo',
    categoria: datos.categoria,
    cargo: datos.cargo || '',
    observaciones: 'Registro DEMO (datos de prueba controlados).'
  });
  if (!res.ok) { r.detalles.push('ERROR voluntario v0 ' + etiqueta + ': ' + res.error); return; }
  r.creados.push('Voluntario v0 ' + etiqueta + ' → N° ' + res.data.id);
}

/** Inventario + entregas v0 de Patricio (7 ítems, idempotente por entrega pendiente). */
function _seedEquipamientoPatricio(ss, r) {
  var resList = listarVoluntarios();
  if (!resList.ok) { r.detalles.push('ERROR listarVoluntarios (equipamiento): ' + resList.error); return; }
  var patricioV0 = null;
  for (var i = 0; i < (resList.data || []).length; i++) {
    if (_cuerpoRUN(resList.data[i].run) === _cuerpoRUN(_validarRUT(SEED_DEMO_PATRICIO.run).run)) {
      patricioV0 = resList.data[i];
      break;
    }
  }
  if (!patricioV0) { r.detalles.push('ERROR equipamiento: voluntario v0 de Patricio no encontrado'); return; }

  var catalogo = listarElementosV2();
  if (!catalogo.ok) { r.detalles.push('ERROR catálogo: ' + catalogo.error); return; }
  var porNombre = {};
  for (var c = 0; c < (catalogo.data || []).length; c++) {
    porNombre[_norm(catalogo.data[c].elemento)] = catalogo.data[c];
  }

  var entregas = obtenerHistorialEntregas(patricioV0.id);
  var yaEntregados = {};
  if (entregas.ok) {
    for (var e = 0; e < (entregas.data || []).length; e++) {
      yaEntregados[_norm(entregas.data[e].elemento)] = true;
    }
  }

  for (var k = 0; k < SEED_DEMO_PATRICIO.equipamiento.length; k++) {
    var item = SEED_DEMO_PATRICIO.equipamiento[k];
    var elem = porNombre[_norm(item.elemento)];
    if (!elem) { r.detalles.push('ERROR equipamiento: "' + item.elemento + '" no está en el catálogo'); continue; }
    if (yaEntregados[_norm(item.elemento)]) {
      r.omitidos.push('Entrega "' + item.elemento + '" (Patricio): ya registrada');
      continue;
    }
    // Stock: entrada de 2 unidades (queda 1 disponible tras la entrega).
    var resInv = registrarEntradaInventario({
      elementoId: elem.id,
      talla: item.talla,
      cantidad: 2,
      estado: 'Disponible',
      observaciones: 'Entrada DEMO (datos de prueba controlados).'
    });
    if (!resInv.ok) { r.detalles.push('ERROR inventario "' + item.elemento + '": ' + resInv.error); continue; }
    r.creados.push('Inventario "' + item.elemento + '" ' + (item.talla || 'Sin talla') + ' → ' + resInv.data.id);

    var resEnt = registrarEntrega({
      voluntarioId: patricioV0.id,
      inventarioId: resInv.data.id,
      cantidad: 1,
      responsable: 'Sistema (siembra DEMO)',
      observaciones: 'Entrega real autorizada (datos de prueba controlados).'
    });
    if (!resEnt.ok) { r.detalles.push('ERROR entrega "' + item.elemento + '": ' + resEnt.error); continue; }
    r.creados.push('Entrega "' + item.elemento + '" ' + (item.talla || 'Sin talla') + ' (Patricio) → ' + resEnt.data.id);
  }
}

// ─────────────────────────────── Servicios DEMO ────────────────────────────

/** Servicios DEMO: creación, asignaciones masivas, retiros y asistencia. */
function _seedServicios(ss, patricioV2, demosV2, r) {
  var tipos = listarTiposServicioV2();
  if (!tipos.ok) { r.detalles.push('ERROR tipos de servicio: ' + tipos.error); return; }
  var tipoPorNombre = {};
  for (var t = 0; t < (tipos.data || []).length; t++) {
    tipoPorNombre[_norm(tipos.data[t].nombre)] = tipos.data[t];
  }

  var todos = [patricioV2, demosV2['DEMO 01'], demosV2['DEMO 02'], demosV2['DEMO 03'], demosV2['DEMO 04']];
  for (var s = 0; s < SEED_DEMO_SERVICIOS.length; s++) {
    var sv = SEED_DEMO_SERVICIOS[s];
    var tipo = tipoPorNombre[_norm(sv.tipo)];
    if (!tipo) { r.detalles.push('ERROR servicio "' + sv.nombre + '": tipo "' + sv.tipo + '" no existe'); continue; }

    var servicioId = null;
    var existentes = listarServiciosV2({});
    if (existentes.ok) {
      for (var x = 0; x < (existentes.data || []).length; x++) {
        if (existentes.data[x].nombre === sv.nombre) {
          servicioId = existentes.data[x].id;
          r.omitidos.push('Servicio "' + sv.nombre + '": ya existe (S' + servicioId + ')');
          break;
        }
      }
    }
    if (!servicioId) {
      var resS = crearServicioV2({
        tipoServicioId: tipo.id,
        nombre: sv.nombre,
        descripcion: sv.descripcion,
        fecha: sv.fecha,
        lugar: sv.lugar,
        estado: sv.estado,
        observaciones: 'Servicio DEMO (datos de prueba controlados). No corresponde a una emergencia real.'
      });
      if (!resS.ok) { r.detalles.push('ERROR crear servicio "' + sv.nombre + '": ' + resS.error); continue; }
      servicioId = resS.data.id;
      r.creados.push('Servicio "' + sv.nombre + '" → S' + servicioId);
    }

    // Asignación masiva: Patricio + DEMO 01–04 (rol "Otro", sin inventar roles).
    var asignar = s === 0 ? todos : (s === 1 ? [patricioV2, demosV2['DEMO 01'], demosV2['DEMO 02']] : [patricioV2, demosV2['DEMO 03'], demosV2['DEMO 04']]);
    // V3.4F: no se re-asigna a quien ya fue retirado/reemplazado en una siembra
    // previa (cierre lógico V3.3) — re-asignarlo crearía una fila nueva en cada
    // ejecución y rompería la idempotencia del seed.
    var cerrados = {};
    var asignacionesPrevias = _tablaV2(ss, HOJA_V2.servicioVoluntarios, COL_SERVICIO_VOLUNTARIO, N_COLS_SERVICIO_VOLUNTARIO);
    for (var c = 0; c < asignacionesPrevias.length; c++) {
      var ap = asignacionesPrevias[c];
      if (String(ap.servicioId) === String(servicioId) && (ap.estado === 'Retirado' || ap.estado === 'Reemplazado')) {
        cerrados[String(ap.voluntarioId)] = true;
      }
    }
    var ids = [];
    for (var a = 0; a < asignar.length; a++) {
      if (asignar[a] && !cerrados[String(asignar[a])]) ids.push(String(asignar[a]));
    }
    var resAsig = asignarVoluntariosServicioV2(servicioId, ids, {
      rolEnServicio: 'Otro',
      asignadoPor: 'Sistema (siembra DEMO)',
      observaciones: 'Asignación DEMO (datos de prueba controlados).'
    });
    if (resAsig.ok) {
      if (resAsig.data.creados > 0) r.creados.push('Asignación ' + resAsig.data.creados + ' voluntario(s) → servicio "' + sv.nombre + '"');
      else r.omitidos.push('Asignación servicio "' + sv.nombre + '": todos ya estaban asignados');
    } else {
      r.detalles.push('ERROR asignación "' + sv.nombre + '": ' + resAsig.error);
    }

    // Retiros de prueba (mecanismo V3.3, idempotente).
    if (s === 1 && demosV2['DEMO 02']) {
      _seedRetiroServicio(ss, servicioId, demosV2['DEMO 02'], 'Retirado', 'Retiro de prueba (DEMO).', r, sv.nombre);
    }
    if (s === 2 && demosV2['DEMO 03']) {
      _seedRetiroServicio(ss, servicioId, demosV2['DEMO 03'], 'Reemplazado', 'Reemplazo de prueba (DEMO).', r, sv.nombre);
    }

    // Asistencia variada (estados de la lista oficial, upsert idempotente).
    var marcaje = [];
    if (s === 0) {
      marcaje = [
        { voluntarioId: patricioV2, estado: 'Presente', horas: 8 },
        { voluntarioId: demosV2['DEMO 01'], estado: 'Presente', horas: 8 },
        { voluntarioId: demosV2['DEMO 02'], estado: 'Presente', horas: 8 },
        { voluntarioId: demosV2['DEMO 03'], estado: 'Ausente', horas: 0, motivo: 'Motivo de prueba (DEMO)' },
        { voluntarioId: demosV2['DEMO 04'], estado: 'Ausente justificado', horas: 0, motivo: 'Justificación de prueba (DEMO)' }
      ];
    } else if (s === 1) {
      marcaje = [
        { voluntarioId: patricioV2, estado: 'Presente', horas: 8 },
        { voluntarioId: demosV2['DEMO 01'], estado: 'Presente', horas: 8 },
        { voluntarioId: demosV2['DEMO 02'], estado: 'Retirado', horas: 2 }
      ];
    } else {
      marcaje = [
        { voluntarioId: patricioV2, estado: 'Presente', horas: 8 },
        { voluntarioId: demosV2['DEMO 03'], estado: 'Reemplazado', horas: 3 },
        { voluntarioId: demosV2['DEMO 04'], estado: 'Presente', horas: 8 }
      ];
    }
    // V3.4F: no se vuelven a aplicar marcajes ya existentes (registrarAsistenciaV2
    // actualiza las filas previas y cuenta las actualizaciones como "aplicados",
    // lo que rompía la idempotencia del seed en re-ejecución).
    var marcajesPrevios = _tablaV2(ss, HOJA_V2.asistencia, COL_ASISTENCIA, N_COLS_ASISTENCIA);
    var marcajeExiste = {};
    for (var m0 = 0; m0 < marcajesPrevios.length; m0++) {
      if (String(marcajesPrevios[m0].servicioId) === String(servicioId)) {
        marcajeExiste[String(marcajesPrevios[m0].voluntarioId)] = true;
      }
    }
    var marcajeValidos = [];
    for (var m = 0; m < marcaje.length; m++) {
      if (marcaje[m].voluntarioId && !marcajeExiste[String(marcaje[m].voluntarioId)]) {
        marcajeValidos.push({
          voluntarioId: marcaje[m].voluntarioId,
          tipoAsistencia: 'Operativa',
          estado: marcaje[m].estado,
          horas: marcaje[m].horas,
          motivo: marcaje[m].motivo || '',
          responsableRegistro: 'Sistema (siembra DEMO)',
          observaciones: 'Marcaje DEMO (datos de prueba controlados).'
        });
      }
    }
    if (!marcajeValidos.length) {
      r.omitidos.push('Asistencia servicio "' + sv.nombre + '": marcajes ya registrados');
      continue;
    }
    var resAsist = registrarAsistenciaV2(servicioId, marcajeValidos);
    if (resAsist.ok && resAsist.data.aplicados > 0) {
      r.creados.push('Asistencia ' + resAsist.data.aplicados + ' marcaje(s) → servicio "' + sv.nombre + '"');
    } else if (resAsist.ok) {
      r.omitidos.push('Asistencia servicio "' + sv.nombre + '": sin cambios');
    } else {
      r.detalles.push('ERROR asistencia "' + sv.nombre + '": ' + resAsist.error);
    }
  }
}

/** Retiro/reemplazo de una asignación (cierre lógico V3.3, idempotente). */
function _seedRetiroServicio(ss, servicioId, voluntarioId, estado, motivo, r, nombreServicio) {
  var asignaciones = _tablaV2(ss, HOJA_V2.servicioVoluntarios, COL_SERVICIO_VOLUNTARIO, N_COLS_SERVICIO_VOLUNTARIO);
  for (var i = 0; i < asignaciones.length; i++) {
    var a = asignaciones[i];
    if (String(a.servicioId) === String(servicioId) && String(a.voluntarioId) === String(voluntarioId)) {
      if (a.estado === 'Retirado' || a.estado === 'Reemplazado') {
        r.omitidos.push('Retiro "' + nombreServicio + '" (Vol. ' + voluntarioId + '): ya ' + a.estado.toLowerCase() + ' (SV' + a.id + ')');
        return;
      }
      var res = quitarVoluntarioServicioV2(a.id, { estado: estado, motivo: motivo });
      if (res.ok) r.creados.push('Retiro "' + nombreServicio + '" (Vol. ' + voluntarioId + ') → ' + estado + ' (SV' + a.id + ')');
      else r.detalles.push('ERROR retiro "' + nombreServicio + '": ' + res.error);
      return;
    }
  }
  r.detalles.push('ERROR retiro "' + nombreServicio + '": asignación de Vol. ' + voluntarioId + ' no encontrada');
}

// ──────────── V3.4H: verificación de catálogos (lookup-only) ────────────────

/** Verifica que los catálogos existan tras el reset + re-siembra. Reporta
 *  anomalías pero NO aborta — el seed es robusto. */
function _verificarCatalogosLookupV34H(ss, r) {
  var unidadesNombres = ['Fuerza de Tarea Delta', 'CBR La Serena', 'Operadores RPA'];
  for (var u = 0; u < unidadesNombres.length; u++) {
    var unidad = _buscarV2(ss, HOJA_V2.unidadesInternas, COL_UNIDAD, N_COLS_UNIDAD, (function(nombre) {
      return function(x) { return _norm(x.nombre) === _norm(nombre); };
    })(unidadesNombres[u]));
    if (!unidad) r.detalles.push('ALERTA: unidad "' + unidadesNombres[u] + '" no encontrada tras reset');
  }

  var credNombres = ['Licencia de Radioaficionado', 'Licencia de Operador Rpas', 'Licencia Clase F'];
  for (var c = 0; c < credNombres.length; c++) {
    var cred = _buscarV2(ss, HOJA_V2.credenciales, COL_CREDENCIAL, N_COLS_CREDENCIAL, (function(nombre) {
      return function(x) { return _norm(x.nombre) === _norm(nombre); };
    })(credNombres[c]));
    if (!cred) r.detalles.push('ALERTA: credencial "' + credNombres[c] + '" no encontrada tras reset');
  }

  var espNombres = ['Auxiliar de Sanidad', 'Telecomunicaciones', 'Operador RPAS', 'Sistema de Comando de Incidentes (SCI)'];
  for (var e = 0; e < espNombres.length; e++) {
    var esp = _buscarV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, (function(nombre) {
      return function(x) { return _norm(x.nombre) === _norm(nombre); };
    })(espNombres[e]));
    if (!esp) r.detalles.push('ALERTA: especialidad "' + espNombres[e] + '" no encontrada tras reset');
  }
}

// ══════════════════════ Correcciones V3.4C (idempotente) ═════════════════════

// Stock DEMO V3.4C: 40 unidades por elemento de vestuario. "Gorra con
// cubrenuca" existe en el catálogo pero NO recibe stock (regla V3.4C).

var STOCK_DEMO_V34C = [
  { elemento: 'Botas de combate', talla: '45' },
  { elemento: 'Polera', talla: 'L' },
  { elemento: 'Blusa', talla: 'L' },
  { elemento: 'Pantalón', talla: 'L' },
  { elemento: 'Gorra sin cubrenuca', talla: '' },
  { elemento: 'Cinturón de combate', talla: '' },
  { elemento: 'Cinturón de vestir', talla: '' },
  { elemento: 'Porta equipo', talla: '' },
  { elemento: 'Polera pique', talla: 'L' },
  { elemento: 'Cortavientos', talla: 'L' },
  { elemento: 'Parka', talla: 'L' }
];



// ────────────────────────── Inventario V3.4C (40/unidad) ────────────────────

/** Inventario V3.4C: 40 unidades por elemento (11 elementos; "Gorra con
 *  cubrenuca" NO recibe stock). En los 7 elementos entregados a Patricio la
 *  fila queda en 40 menos lo entregado (stock físico total = 40). Usa la
 *  cadena v0 (Inventario = única fuente física). Idempotente. */
function _seedInventarioV34C(ss, r) {
  var resList = listarVoluntarios();
  if (!resList.ok) { r.detalles.push('ERROR listarVoluntarios (inventario V3.4C): ' + resList.error); return; }
  var patricioV0 = null;
  for (var i = 0; i < (resList.data || []).length; i++) {
    if (_cuerpoRUN(resList.data[i].run) === _cuerpoRUN(_validarRUT(SEED_DEMO_PATRICIO.run).run)) {
      patricioV0 = resList.data[i];
      break;
    }
  }
  if (!patricioV0) { r.detalles.push('ERROR inventario V3.4C: voluntario v0 de Patricio no encontrado'); return; }

  var entregas = obtenerHistorialEntregas(patricioV0.id);
  var porElemento = {};
  if (entregas.ok) {
    for (var e = 0; e < (entregas.data || []).length; e++) {
      var clave = _norm(entregas.data[e].elemento);
      porElemento[clave] = (porElemento[clave] || 0) + 1;
    }
  }

  var catalogo = listarElementosV2();
  if (!catalogo.ok) { r.detalles.push('ERROR catálogo (inventario V3.4C): ' + catalogo.error); return; }
  var porNombre = {};
  for (var c = 0; c < (catalogo.data || []).length; c++) {
    porNombre[_norm(catalogo.data[c].elemento)] = catalogo.data[c];
  }

  for (var k = 0; k < STOCK_DEMO_V34C.length; k++) {
    var item = STOCK_DEMO_V34C[k];
    var elem = porNombre[_norm(item.elemento)];
    if (!elem) { r.detalles.push('ERROR inventario V3.4C: "' + item.elemento + '" no está en el catálogo'); continue; }
    var entregado = porElemento[_norm(item.elemento)] || 0;
    var objetivo = 40 - entregado;
    if (objetivo < 0) objetivo = 0;

    var inv = obtenerInventario({ elementoId: elem.id });
    var fila = null;
    if (inv.ok) {
      for (var f = 0; f < (inv.data || []).length; f++) {
        if (_norm(String(inv.data[f].talla || 'Sin talla')) === _norm(item.talla || 'Sin talla')) { fila = inv.data[f]; break; }
      }
    }
    var obs = 'Stock DEMO (40 unidades por elemento; ' + entregado + ' entregada(s) a Patricio).';
    if (fila) {
      if (Number(fila.cantidad || 0) === objetivo) {
        r.omitidos.push('Inventario "' + item.elemento + '" ' + (item.talla || 'Sin talla') + ': ya en ' + objetivo);
      } else {
        var resA = ajustarInventario(fila.id, { cantidad: objetivo, observaciones: obs });
        if (resA.ok) r.creados.push('Inventario "' + item.elemento + '" ' + (item.talla || 'Sin talla') + ' → ' + objetivo + ' (' + fila.id + ')');
        else r.detalles.push('ERROR ajustar inventario "' + item.elemento + '": ' + resA.error);
      }
    } else {
      var resE = registrarEntradaInventario({
        elementoId: elem.id,
        talla: item.talla,
        cantidad: objetivo,
        estado: 'Disponible',
        observaciones: obs
      });
      if (resE.ok) r.creados.push('Inventario "' + item.elemento + '" ' + (item.talla || 'Sin talla') + ' → ' + objetivo + ' (INV' + resE.data.id + ')');
      else r.detalles.push('ERROR entrada inventario "' + item.elemento + '": ' + resE.error);
    }
  }
}