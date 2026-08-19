/**
 * 23_GradosCargos.js — Dominio Grados / Cargos / Áreas (fase 3).
 *
 * Grados: catálogo OFICIAL (UNI 2018, 6 grados; Disponible no es grado — V3.1).
 * Cargos: configurables (OFICIAL + INTERNO); cargo ≠ grado (ROF-S Art. 58).
 * Áreas: estructura interna de la sede (INTERNO).
 * Historiales: asignación = cerrar la fila vigente (fechaHasta) + abrir la nueva.
 *   NUNCA se modifica una fila ya cerrada.
 * Requisitos de ascenso: evaluación administrativa (✓/✗/⚠) que ADVIERTE y permite
 *   excepción registrada (quién/fecha/motivo) — nunca bloquea.
 * API:
 *   listarGradosV2 / listarCargosV2 / listarAreasV2
 *   crearCargoV2 / actualizarCargoV2 / crearAreaV2 / actualizarAreaV2
 *   asignarGradoV2(voluntarioId, gradoId, datos) / asignarCargoV2(voluntarioId, cargoId, datos)
 *   obtenerRequisitosGradoV2(voluntarioId, gradoId)
 *   obtenerHistorialGradosV2(voluntarioId) / obtenerHistorialCargosV2(voluntarioId)
 */

function listarGradosV2() {
  try {
    var ss = _ss();
    var grados = _tablaV2(ss, HOJA_V2.grados, COL_GRADO, N_COLS_GRADO);
    var res = grados.map(function (g) {
      return { id: g.id, nombre: String(g.nombre || ''), orden: Number(g.orden || 0), insignia: String(g.insignia || ''), origen: String(g.origen || ''), activo: _bool(g.activo, true), observaciones: String(g.observaciones || '') };
    }).sort(function (a, b) { return a.orden - b.orden; });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function listarCargosV2() {
  try {
    var ss = _ss();
    var cargos = _tablaV2(ss, HOJA_V2.cargos, COL_CARGO, N_COLS_CARGO);
    var areas = _tablaV2(ss, HOJA_V2.areas, COL_AREA, N_COLS_AREA);
    var porArea = {};
    for (var a = 0; a < areas.length; a++) porArea[String(areas[a].id)] = areas[a];
    var res = cargos.map(function (c) {
      var area = c.areaId ? porArea[String(c.areaId)] : null;
      return {
        id: c.id,
        nombre: String(c.nombre || ''),
        areaId: c.areaId ? String(c.areaId) : '',
        area: area ? area.nombre : '',
        ordenJerarquico: Number(c.ordenJerarquico || 0),
        descripcion: String(c.descripcion || ''),
        origen: String(c.origen || ''),
        activo: _bool(c.activo, true),
        observaciones: String(c.observaciones || '')
      };
    }).sort(function (a, b) { return a.ordenJerarquico - b.ordenJerarquico; });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function listarAreasV2() {
  try {
    var ss = _ss();
    var areas = _tablaV2(ss, HOJA_V2.areas, COL_AREA, N_COLS_AREA);
    var res = areas.map(function (a) {
      return { id: a.id, nombre: String(a.nombre || ''), orden: Number(a.orden || 0), encargadoId: a.encargadoId ? String(a.encargadoId) : '', descripcion: String(a.descripcion || ''), origen: String(a.origen || ''), activo: _bool(a.activo, true) };
    }).sort(function (a, b) { return a.orden - b.orden; });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function crearCargoV2(datos) {
  datos = datos || {};
  var ss = _ss();
  var nombre = _titulo(datos.nombre);
  if (!nombre) return _resErr('DATOS_INCOMPLETOS', 'Nombre del cargo: obligatorio');
  var existentes = _tablaV2(ss, HOJA_V2.cargos, COL_CARGO, N_COLS_CARGO);
  for (var i = 0; i < existentes.length; i++) {
    if (_norm(existentes[i].nombre) === _norm(nombre)) return _resErr('DUPLICADO', 'El cargo "' + nombre + '" ya existe');
  }
  var fila = {};
  fila[COL_CARGO.nombre] = nombre;
  fila[COL_CARGO.areaId] = _texto(datos.areaId);
  fila[COL_CARGO.ordenJerarquico] = _texto(datos.ordenJerarquico) || 99;
  fila[COL_CARGO.descripcion] = _texto(datos.descripcion);
  fila[COL_CARGO.origen] = 'INTERNO';
  fila[COL_CARGO.activo] = true;
  fila[COL_CARGO.observaciones] = _texto(datos.observaciones);
  var res = _insertarFilaV2(ss, HOJA_V2.cargos, COL_CARGO, N_COLS_CARGO, fila);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.cargos, 'crearCargoV2', 'OK', res.data.id + ' — ' + nombre);
  return _resOk({ id: res.data.id });
}

function actualizarCargoV2(id, cambios) {
  cambios = cambios || {};
  var ss = _ss();
  var aplicar = {};
  if (cambios.nombre !== undefined) {
    var nombre = _titulo(cambios.nombre);
    if (!nombre) return _resErr('DATOS_INCOMPLETOS', 'Nombre del cargo: obligatorio');
    aplicar[COL_CARGO.nombre] = nombre;
  }
  if (cambios.areaId !== undefined) aplicar[COL_CARGO.areaId] = _texto(cambios.areaId);
  if (cambios.ordenJerarquico !== undefined) aplicar[COL_CARGO.ordenJerarquico] = _texto(cambios.ordenJerarquico) || 99;
  if (cambios.descripcion !== undefined) aplicar[COL_CARGO.descripcion] = _texto(cambios.descripcion);
  if (cambios.activo !== undefined) aplicar[COL_CARGO.activo] = _bool(cambios.activo, true);
  if (cambios.observaciones !== undefined) aplicar[COL_CARGO.observaciones] = _texto(cambios.observaciones);
  var res = _actualizarFilaV2(ss, HOJA_V2.cargos, COL_CARGO, N_COLS_CARGO, id, aplicar);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.cargos, 'actualizarCargoV2', 'OK', id);
  return _resOk({ id: id });
}

function crearAreaV2(datos) {
  datos = datos || {};
  var ss = _ss();
  var nombre = _titulo(datos.nombre);
  if (!nombre) return _resErr('DATOS_INCOMPLETOS', 'Nombre del área: obligatorio');
  var existentes = _tablaV2(ss, HOJA_V2.areas, COL_AREA, N_COLS_AREA);
  for (var i = 0; i < existentes.length; i++) {
    if (_norm(existentes[i].nombre) === _norm(nombre)) return _resErr('DUPLICADO', 'El área "' + nombre + '" ya existe');
  }
  var maxOrden = 0;
  for (var j = 0; j < existentes.length; j++) {
    var o = Number(existentes[j].orden || 0);
    if (o > maxOrden) maxOrden = o;
  }
  var fila = {};
  fila[COL_AREA.nombre] = nombre;
  fila[COL_AREA.orden] = maxOrden + 1;
  fila[COL_AREA.encargadoId] = _texto(datos.encargadoId);
  fila[COL_AREA.descripcion] = _texto(datos.descripcion);
  fila[COL_AREA.origen] = 'INTERNO';
  fila[COL_AREA.activo] = true;
  var res = _insertarFilaV2(ss, HOJA_V2.areas, COL_AREA, N_COLS_AREA, fila);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.areas, 'crearAreaV2', 'OK', res.data.id + ' — ' + nombre);
  return _resOk({ id: res.data.id });
}

function actualizarAreaV2(id, cambios) {
  cambios = cambios || {};
  var ss = _ss();
  var aplicar = {};
  if (cambios.nombre !== undefined) {
    var nombre = _titulo(cambios.nombre);
    if (!nombre) return _resErr('DATOS_INCOMPLETOS', 'Nombre del área: obligatorio');
    aplicar[COL_AREA.nombre] = nombre;
  }
  if (cambios.encargadoId !== undefined) aplicar[COL_AREA.encargadoId] = _texto(cambios.encargadoId);
  if (cambios.descripcion !== undefined) aplicar[COL_AREA.descripcion] = _texto(cambios.descripcion);
  if (cambios.activo !== undefined) aplicar[COL_AREA.activo] = _bool(cambios.activo, true);
  var res = _actualizarFilaV2(ss, HOJA_V2.areas, COL_AREA, N_COLS_AREA, id, aplicar);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.areas, 'actualizarAreaV2', 'OK', id);
  return _resOk({ id: id });
}

// ============ Evaluación de requisitos (advertencia, no bloqueo) ============

/**
 * Requisitos OFICIALES para ascender a un grado (UNI 2018). Devuelve lista
 * {requisito, estado(✓|✗|⚠), detalle}. Comandante Local no es evaluable
 * (designación por resolución exenta de la DG).
 */
function _requisitosGrado(voluntarioId, gradoId) {
  var ss = _ss();
  var grados = _tablaV2(ss, HOJA_V2.grados, COL_GRADO, N_COLS_GRADO);
  var grado = null;
  for (var g = 0; g < grados.length; g++) {
    if (String(grados[g].id) === String(gradoId)) { grado = grados[g]; break; }
  }
  if (!grado) return { grado: null, requisitos: [] };
  var nombre = _norm(grado.nombre);

  // Grado anterior en la cadena de ascenso
  var anterior = null;
  var prev = null;
  for (var g2 = 0; g2 < grados.length; g2++) {
    var o = Number(grados[g2].orden || 0);
    if (o < Number(grado.orden || 0) && (!anterior || o > Number(anterior.orden || 0))) anterior = grados[g2];
  }
  prev = anterior;

  var histG = _tablaV2(ss, HOJA_V2.historialGrados, COL_HIST_GRADO, N_COLS_HIST_GRADO);
  var espV = _tablaV2(ss, HOJA_V2.voluntarioEspecialidades, COL_VOL_ESPECIALIDAD, N_COLS_VOL_ESPECIALIDAD);
  var nEspecialidades = 0;
  for (var e = 0; e < espV.length; e++) {
    // V3.3: las relaciones cerradas (activo=false) no cuentan para requisitos.
    if (String(espV[e].voluntarioId) === String(voluntarioId) && _texto(espV[e].especialidadId) && _vigenteV2(espV[e].activo)) nEspecialidades++;
  }

  // Último período cerrado (o vigente) del grado anterior
  var aniosPrev = 0;
  if (prev) {
    var mejor = null;
    for (var h = 0; h < histG.length; h++) {
      var f = histG[h];
      if (String(f.voluntarioId) === String(voluntarioId) && String(f.gradoId) === String(prev.id)) {
        if (!mejor || (mejor.fechaHasta !== '' && _texto(mejor.fechaHasta))) mejor = f;
      }
    }
    if (mejor) aniosPrev = _aniosEntre(mejor.fechaDesde, mejor.fechaHasta);
  }

  var requisitos = [];
  var aniosCumple = aniosPrev >= 2;
  switch (nombre) {
    case 'voluntario':
      requisitos.push({ requisito: 'Grado de ingreso / sin requisitos previos', estado: '✓', detalle: 'Se asigna directamente' });
      break;
    case 'voluntario mayor':
      requisitos.push({ requisito: 'Mín. 2 años en el grado anterior (' + (prev ? prev.nombre : '?') + ')', estado: aniosCumple ? '✓' : '✗', detalle: aniosCumple ? aniosPrev.toFixed(1) + ' año(s)' : 'Faltan: ' + Math.max(0, 2 - aniosPrev).toFixed(1) + ' año(s) — se puede asignar con excepción' });
      break;
    case 'subinstructor':
      requisitos.push({ requisito: 'Mín. 2 años como Voluntario Mayor', estado: aniosCumple ? '✓' : '✗', detalle: aniosPrev.toFixed(1) + ' año(s) registrado(s)' });
      break;
    case 'instructor':
      requisitos.push({ requisito: 'Mín. 2 años como Subinstructor', estado: aniosCumple ? '✓' : '✗', detalle: aniosPrev.toFixed(1) + ' año(s) registrado(s)' });
      requisitos.push({ requisito: 'Al menos 1 especialidad', estado: nEspecialidades >= 1 ? '✓' : '✗', detalle: nEspecialidades + ' especialidad(es) registrada(s)' });
      break;
    case 'instructor mayor':
      requisitos.push({ requisito: 'Mín. 2 años como Instructor', estado: aniosCumple ? '✓' : '✗', detalle: aniosPrev.toFixed(1) + ' año(s) registrado(s)' });
      requisitos.push({ requisito: 'Al menos 2 especialidades', estado: nEspecialidades >= 2 ? '✓' : '✗', detalle: nEspecialidades + ' especialidad(es) registrada(s)' });
      break;
    case 'comandante local':
      requisitos.push({ requisito: 'Designación por resolución exenta de la DG', estado: '⚠', detalle: 'No se evalúa automáticamente: proceso institucional' });
      break;
    default:
      requisitos.push({ requisito: 'Sin requisitos documentados para este grado', estado: '⚠', detalle: 'Registrar manualmente' });
  }
  return { grado: grado, requisitos: requisitos };
}

/** Evaluación de requisitos para ascender (Web App: panel ✓/✗/⚠). */
function obtenerRequisitosGradoV2(voluntarioId, gradoId) {
  try {
    var r = _requisitosGrado(voluntarioId, gradoId);
    if (!r.grado) return _resErr('NO_ENCONTRADO', 'Grado ' + gradoId + ' no existe');
    return _resOk({ grado: { id: r.grado.id, nombre: r.grado.nombre }, requisitos: r.requisitos, todosCumplidos: r.requisitos.every(function (q) { return q.estado === '✓'; }) });
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

/**
 * Asigna un grado: cierra el vigente (fechaHasta) y abre el nuevo.
 * Los requisitos solo ADVIERTEN: si hay ✗ y no se indica excepción, el sistema
 * informa y permite "Asignar igualmente" con quién/fecha/motivo.
 */
function asignarGradoV2(voluntarioId, gradoId, datos) {
  datos = datos || {};
  var ss = _ss();
  var vol = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
    return String(v.id) === String(voluntarioId);
  });
  if (!vol) return _resErr('NO_ENCONTRADO', 'Voluntario ' + voluntarioId + ' no existe');
  var grado = _buscarV2(ss, HOJA_V2.grados, COL_GRADO, N_COLS_GRADO, function (g) {
    return String(g.id) === String(gradoId);
  });
  if (!grado) return _resErr('NO_ENCONTRADO', 'Grado ' + gradoId + ' no existe');

  var desde = _texto(datos.fechaDesde) ? _parseDate(datos.fechaDesde) : new Date();
  if (!desde) return _resErr('VALIDACION', 'Fecha de asignación inválida');
  var resReq = _requisitosGrado(voluntarioId, gradoId);
  var hayIncidencia = resReq.requisitos.some(function (q) { return q.estado === '✗' || q.estado === '⚠'; });
  var excepcion = _bool(datos.excepcion, false);
  var detalleExcepcion = _texto(datos.excepcionDetalle);

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  try {
    // Cerrar vigente
    var hist = _tablaV2(ss, HOJA_V2.historialGrados, COL_HIST_GRADO, N_COLS_HIST_GRADO);
    var shHist = _hojaV2(ss, HOJA_V2.historialGrados);
    for (var i = 0; i < hist.length; i++) {
      var h = hist[i];
      if (String(h.voluntarioId) === String(voluntarioId) && !_texto(h.fechaHasta)) {
        var filaActual = shHist.getRange(h.fila, 1, 1, N_COLS_HIST_GRADO).getValues()[0];
        filaActual[COL_HIST_GRADO.fechaHasta - 1] = desde;
        shHist.getRange(h.fila, 1, 1, N_COLS_HIST_GRADO).setValues([filaActual]);
      }
    }
    var textoReq = resReq.requisitos.map(function (q) { return q.requisito + ' → ' + q.estado; }).join(' | ');
    var fila = {};
    fila[COL_HIST_GRADO.voluntarioId] = voluntarioId;
    fila[COL_HIST_GRADO.gradoId] = gradoId;
    fila[COL_HIST_GRADO.fechaDesde] = desde;
    fila[COL_HIST_GRADO.resolucion] = _texto(datos.resolucion);
    fila[COL_HIST_GRADO.quienAsigno] = _texto(datos.quienAsigno);
    fila[COL_HIST_GRADO.motivo] = _texto(datos.motivo);
    fila[COL_HIST_GRADO.requisitosEvaluados] = textoReq;
    fila[COL_HIST_GRADO.excepcion] = excepcion;
    fila[COL_HIST_GRADO.excepcionDetalle] = detalleExcepcion;
    fila[COL_HIST_GRADO.observaciones] = _texto(datos.observaciones);
    var res = _insertarFilaV2(ss, HOJA_V2.historialGrados, COL_HIST_GRADO, N_COLS_HIST_GRADO, fila);
    if (!res.ok) return res;

    if (hayIncidencia && !excepcion) {
      _agregarEventoHojaV2(ss, voluntarioId, 'ASCENSO', _fmtFecha(desde), 'Asignación de grado ' + grado.nombre + ' — requisitos incompletos SIN excepción registrada', String(res.data.id));
    } else {
      _agregarEventoHojaV2(ss, voluntarioId, 'ASCENSO', _fmtFecha(desde), 'Asignación de grado ' + grado.nombre + (excepcion ? ' (con excepción: ' + detalleExcepcion + ')' : ''), String(res.data.id));
    }
    _log(ss, HOJA_V2.historialGrados, 'asignarGradoV2', 'OK', 'Vol. ' + voluntarioId + ' → ' + grado.nombre);
    return _resOk({ id: res.data.id, requisitos: resReq.requisitos });
  } finally {
    lock.releaseLock();
  }
}

function obtenerHistorialGradosV2(voluntarioId) {
  try {
    var ss = _ss();
    var hist = _tablaV2(ss, HOJA_V2.historialGrados, COL_HIST_GRADO, N_COLS_HIST_GRADO);
    var grados = _tablaV2(ss, HOJA_V2.grados, COL_GRADO, N_COLS_GRADO);
    var porId = {};
    for (var g = 0; g < grados.length; g++) porId[String(grados[g].id)] = grados[g];
    var res = hist.filter(function (h) { return String(h.voluntarioId) === String(voluntarioId); }).map(function (h) {
      var gr = porId[String(h.gradoId)];
      return {
        id: h.id,
        grado: gr ? gr.nombre : String(h.gradoId),
        orden: gr ? gr.orden : 0,
        fechaDesde: _fechaV2(h.fechaDesde),
        fechaHasta: _fechaV2(h.fechaHasta),
        vigente: !_texto(h.fechaHasta),
        resolucion: String(h.resolucion || ''),
        quienAsigno: String(h.quienAsigno || ''),
        requisitos: String(h.requisitosEvaluados || ''),
        excepcion: _bool(h.excepcion, false),
        excepcionDetalle: String(h.excepcionDetalle || ''),
        observaciones: String(h.observaciones || '')
      };
    }).sort(function (a, b) { return _parseDate(a.fechaDesde || '01/01/2000') - _parseDate(b.fechaDesde || '01/01/2000'); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function asignarCargoV2(voluntarioId, cargoId, datos) {
  datos = datos || {};
  var ss = _ss();
  var vol = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
    return String(v.id) === String(voluntarioId);
  });
  if (!vol) return _resErr('NO_ENCONTRADO', 'Voluntario ' + voluntarioId + ' no existe');
  var cargo = _buscarV2(ss, HOJA_V2.cargos, COL_CARGO, N_COLS_CARGO, function (c) {
    return String(c.id) === String(cargoId);
  });
  if (!cargo) return _resErr('NO_ENCONTRADO', 'Cargo ' + cargoId + ' no existe');
  var desde = _texto(datos.fechaDesde) ? _parseDate(datos.fechaDesde) : new Date();
  if (!desde) return _resErr('VALIDACION', 'Fecha de asignación inválida');

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  try {
    // V3.4F: los cargos pueden COEXISTIR (un voluntario con más de un cargo
    // vigente a la vez, ROF-S Art. 58). NO se cierran los cargos vigentes al
    // asignar uno nuevo; solo se impide duplicar el MISMO cargo vigente.
    var hist = _tablaV2(ss, HOJA_V2.historialCargos, COL_HIST_CARGO, N_COLS_HIST_CARGO);
    for (var i = 0; i < hist.length; i++) {
      var h = hist[i];
      if (String(h.voluntarioId) === String(voluntarioId) && !_texto(h.fechaHasta) && String(h.cargoId) === String(cargoId)) {
        return _resErr('DUPLICADO', 'El voluntario ya tiene el cargo "' + cargo.nombre + '" vigente (HC' + h.id + ')');
      }
    }
    var fila = {};
    fila[COL_HIST_CARGO.voluntarioId] = voluntarioId;
    fila[COL_HIST_CARGO.cargoId] = cargoId;
    fila[COL_HIST_CARGO.fechaDesde] = desde;
    fila[COL_HIST_CARGO.quienAsigno] = _texto(datos.quienAsigno);
    fila[COL_HIST_CARGO.resolucion] = _texto(datos.resolucion);
    fila[COL_HIST_CARGO.observaciones] = _texto(datos.observaciones);
    var res = _insertarFilaV2(ss, HOJA_V2.historialCargos, COL_HIST_CARGO, N_COLS_HIST_CARGO, fila);
    if (!res.ok) return res;
    _agregarEventoHojaV2(ss, voluntarioId, 'CARGO', _fmtFecha(desde), 'Asignación de cargo ' + cargo.nombre, String(res.data.id));
    _log(ss, HOJA_V2.historialCargos, 'asignarCargoV2', 'OK', 'Vol. ' + voluntarioId + ' → ' + cargo.nombre);
    return _resOk({ id: res.data.id });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Cierra UN cargo específico del historial (fechaHasta), sin afectar los otros
 * cargos vigentes del voluntario (V3.4F: cargos múltiples). Idempotente.
 * datos: {fechaHasta?, quienAsigno?, resolucion?, observaciones?}
 */
function terminarCargoV2(id, datos) {
  datos = datos || {};
  var ss = _ss();
  var hist = _tablaV2(ss, HOJA_V2.historialCargos, COL_HIST_CARGO, N_COLS_HIST_CARGO);
  var registro = null;
  for (var i = 0; i < hist.length; i++) {
    if (String(hist[i].id) === String(id)) { registro = hist[i]; break; }
  }
  if (!registro) return _resErr('NO_ENCONTRADO', 'Registro de cargo ' + id + ' no existe');
  if (_texto(registro.fechaHasta)) {
    return _resOk({ id: id, yaCerrado: true, registro: registro });
  }
  var hasta = _texto(datos.fechaHasta) ? _parseDate(datos.fechaHasta) : new Date();
  if (!hasta) return _resErr('VALIDACION', 'Fecha de término inválida');
  var cargos = _tablaV2(ss, HOJA_V2.cargos, COL_CARGO, N_COLS_CARGO);
  var cargoNombre = '';
  for (var c = 0; c < cargos.length; c++) {
    if (String(cargos[c].id) === String(registro.cargoId)) { cargoNombre = cargos[c].nombre; break; }
  }
  var aplicar = {};
  aplicar[COL_HIST_CARGO.fechaHasta] = hasta;
  if (datos.quienAsigno !== undefined) aplicar[COL_HIST_CARGO.quienAsigno] = _texto(datos.quienAsigno);
  if (datos.resolucion !== undefined) aplicar[COL_HIST_CARGO.resolucion] = _texto(datos.resolucion);
  var obs = String(registro.observaciones || '');
  var motivo = _texto(datos.observaciones);
  if (motivo && obs.indexOf(motivo) === -1) {
    obs = (obs ? obs + ' | ' : '') + motivo;
  }
  aplicar[COL_HIST_CARGO.observaciones] = obs;
  var res = _actualizarFilaV2(ss, HOJA_V2.historialCargos, COL_HIST_CARGO, N_COLS_HIST_CARGO, id, aplicar);
  if (!res.ok) return res;
  _agregarEventoHojaV2(ss, String(registro.voluntarioId), 'CARGO', _fmtFecha(hasta), 'Término de cargo ' + (cargoNombre || registro.cargoId), String(id));
  _log(ss, HOJA_V2.historialCargos, 'terminarCargoV2', 'OK', 'HC' + id);
  return _resOk({ id: id });
}

/**
 * Cierra el cargo vigente de un voluntario identificado por voluntarioId +
 * cargoId (V3.4F, cargos múltiples): solo afecta esa relación, no las demás.
 * Idempotente (si el cargo ya no está vigente → yaCerrado). datos igual que
 * terminarCargoV2.
 */
function terminarCargoVoluntarioV2(voluntarioId, cargoId, datos) {
  datos = datos || {};
  var ss = _ss();
  var vol = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
    return String(v.id) === String(voluntarioId);
  });
  if (!vol) return _resErr('NO_ENCONTRADO', 'Voluntario ' + voluntarioId + ' no existe');
  var hist = _tablaV2(ss, HOJA_V2.historialCargos, COL_HIST_CARGO, N_COLS_HIST_CARGO);
  var vigente = null;
  for (var i = 0; i < hist.length; i++) {
    var h = hist[i];
    if (String(h.voluntarioId) === String(voluntarioId) && String(h.cargoId) === String(cargoId) && !_texto(h.fechaHasta)) {
      vigente = h;
      break;
    }
  }
  if (!vigente) {
    return _resOk({ id: null, yaCerrado: true, detalle: 'El voluntario no tiene ese cargo vigente' });
  }
  return terminarCargoV2(vigente.id, datos);
}

function obtenerHistorialCargosV2(voluntarioId) {
  try {
    var ss = _ss();
    var hist = _tablaV2(ss, HOJA_V2.historialCargos, COL_HIST_CARGO, N_COLS_HIST_CARGO);
    var cargos = _tablaV2(ss, HOJA_V2.cargos, COL_CARGO, N_COLS_CARGO);
    var porId = {};
    for (var c = 0; c < cargos.length; c++) porId[String(cargos[c].id)] = cargos[c];
    var res = hist.filter(function (h) { return String(h.voluntarioId) === String(voluntarioId); }).map(function (h) {
      var ca = porId[String(h.cargoId)];
      return {
        id: h.id,
        cargo: ca ? ca.nombre : String(h.cargoId),
        fechaDesde: _fechaV2(h.fechaDesde),
        fechaHasta: _fechaV2(h.fechaHasta),
        vigente: !_texto(h.fechaHasta),
        quienAsigno: String(h.quienAsigno || ''),
        resolucion: String(h.resolucion || ''),
        observaciones: String(h.observaciones || '')
      };
    }).sort(function (a, b) { return _parseDate(a.fechaDesde || '01/01/2000') - _parseDate(b.fechaDesde || '01/01/2000'); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}