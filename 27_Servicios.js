/**
 * 27_Servicios.js — Dominio Servicios (fase 5).
 * Servicios = operativos/institucionales de la sede (tipos CONFIGURABLES).
 * Asignación masiva de voluntarios (Servicio Voluntarios, N:N) con rol en el
 * servicio — el rol dentro del servicio NO es cargo institucional.
 * Estado del servicio: Planificado → Activo → Finalizado/Cancelado.
 * API:
 *   listarTiposServicioV2 / crearTipoServicioV2
 *   crearServicioV2 / actualizarServicioV2 / listarServiciosV2 / obtenerServicioV2
 *   asignarVoluntariosServicioV2(servicioId, voluntarioIds, datos) [masiva]
 *   quitarVoluntarioServicioV2(id)
 *   cambiarEstadoServicioV2(servicioId, estado)
 */

function listarTiposServicioV2() {
  try {
    var ss = _ss();
    var filas = _tablaV2(ss, HOJA_V2.tiposServicio, COL_CATALOGO_LISTA, N_COLS_CATALOGO_LISTA);
    var res = filas.map(function (f) {
      return { id: f.id, nombre: String(f.nombre || ''), origen: String(f.origen || 'CONFIGURABLE'), activo: _bool(f.activo, true), observaciones: String(f.observaciones || '') };
    }).sort(function (a, b) { return _norm(a.nombre).localeCompare(_norm(b.nombre)); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function crearTipoServicioV2(datos) {
  datos = datos || {};
  var ss = _ss();
  var nombre = _titulo(datos.nombre);
  if (!nombre) return _resErr('DATOS_INCOMPLETOS', 'Nombre del tipo de servicio: obligatorio');
  var existentes = _tablaV2(ss, HOJA_V2.tiposServicio, COL_CATALOGO_LISTA, N_COLS_CATALOGO_LISTA);
  for (var i = 0; i < existentes.length; i++) {
    if (_norm(existentes[i].nombre) === _norm(nombre)) return _resErr('DUPLICADO', 'El tipo "' + nombre + '" ya existe');
  }
  var fila = {};
  fila[COL_CATALOGO_LISTA.nombre] = nombre;
  fila[COL_CATALOGO_LISTA.origen] = 'CONFIGURABLE';
  fila[COL_CATALOGO_LISTA.activo] = true;
  fila[COL_CATALOGO_LISTA.observaciones] = _texto(datos.observaciones);
  var res = _insertarFilaV2(ss, HOJA_V2.tiposServicio, COL_CATALOGO_LISTA, N_COLS_CATALOGO_LISTA, fila);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.tiposServicio, 'crearTipoServicioV2', 'OK', res.data.id + ' — ' + nombre);
  return _resOk({ id: res.data.id });
}

function crearServicioV2(datos) {
  datos = datos || {};
  var ss = _ss();
  if (!_texto(datos.tipoServicioId)) return _resErr('DATOS_INCOMPLETOS', 'Tipo de servicio: obligatorio');
  var tipo = _buscarV2(ss, HOJA_V2.tiposServicio, COL_CATALOGO_LISTA, N_COLS_CATALOGO_LISTA, function (t) {
    return String(t.id) === _texto(datos.tipoServicioId);
  });
  if (!tipo) return _resErr('NO_ENCONTRADO', 'Tipo de servicio no existe');
  var fecha = _texto(datos.fecha) ? _parseDate(datos.fecha) : new Date();
  if (!fecha) return _resErr('VALIDACION', 'Fecha del servicio inválida');
  var estado = _texto(datos.estado) || ESTADO_SERVICIO_DEFECTO;
  if (ESTADOS_SERVICIO.indexOf(estado) === -1) return _resErr('VALIDACION', 'Estado debe ser: ' + ESTADOS_SERVICIO.join(', '));
  // V3.4D: fecha término e institución solicitante (servicios en todo Chile).
  var fechaTermino = _texto(datos.fechaTermino) ? _parseDate(datos.fechaTermino) : null;
  if (_texto(datos.fechaTermino) && !fechaTermino) return _resErr('VALIDACION', 'Fecha de término inválida (dd/mm/aaaa)');

  var fila = {};
  fila[COL_SERVICIO.tipoServicioId] = _texto(datos.tipoServicioId);
  fila[COL_SERVICIO.nombre] = _texto(datos.nombre);
  fila[COL_SERVICIO.descripcion] = _texto(datos.descripcion);
  fila[COL_SERVICIO.fecha] = fecha;
  fila[COL_SERVICIO.horarioInicio] = _texto(datos.horarioInicio);
  fila[COL_SERVICIO.horarioFin] = _texto(datos.horarioFin);
  fila[COL_SERVICIO.lugar] = _texto(datos.lugar);
  fila[COL_SERVICIO.direccion] = _texto(datos.direccion);
  fila[COL_SERVICIO.comuna] = _texto(datos.comuna);
  fila[COL_SERVICIO.region] = _texto(datos.region);
  fila[COL_SERVICIO.responsableId] = _texto(datos.responsableId);
  fila[COL_SERVICIO.telefonoContacto] = _texto(datos.telefonoContacto);
  fila[COL_SERVICIO.rolesRequeridos] = _texto(datos.rolesRequeridos);
  fila[COL_SERVICIO.alimentacion] = _bool(datos.alimentacion, false);
  fila[COL_SERVICIO.agua] = _bool(datos.agua, false);
  fila[COL_SERVICIO.alojamiento] = _bool(datos.alojamiento, false);
  fila[COL_SERVICIO.transporte] = _bool(datos.transporte, false);
  fila[COL_SERVICIO.apoyoLogistico] = _bool(datos.apoyoLogistico, false);
  fila[COL_SERVICIO.estado] = estado;
  fila[COL_SERVICIO.observaciones] = _texto(datos.observaciones);
  fila[COL_SERVICIO.fechaTermino] = fechaTermino;
  fila[COL_SERVICIO.institucionSolicitante] = _texto(datos.institucionSolicitante);
  var res = _insertarFilaV2(ss, HOJA_V2.servicios, COL_SERVICIO, N_COLS_SERVICIO, fila);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.servicios, 'crearServicioV2', 'OK', res.data.id + ' — ' + (tipo.nombre) + ' ' + _fmtFecha(fecha));
  return _resOk({ id: res.data.id });
}

function actualizarServicioV2(id, cambios) {
  cambios = cambios || {};
  var ss = _ss();
  var aplicar = {};
  var errores = [];
  if (cambios.fecha !== undefined) {
    if (_texto(cambios.fecha) && !_parseDate(cambios.fecha)) errores.push('Fecha inválida');
    else aplicar[COL_SERVICIO.fecha] = _texto(cambios.fecha) ? _parseDate(cambios.fecha) : null;
  }
  if (cambios.fechaTermino !== undefined) {
    if (_texto(cambios.fechaTermino) && !_parseDate(cambios.fechaTermino)) errores.push('Fecha de término inválida');
    else aplicar[COL_SERVICIO.fechaTermino] = _texto(cambios.fechaTermino) ? _parseDate(cambios.fechaTermino) : null;
  }
  if (cambios.estado !== undefined) {
    var estado = _texto(cambios.estado);
    if (ESTADOS_SERVICIO.indexOf(estado) === -1) errores.push('Estado debe ser: ' + ESTADOS_SERVICIO.join(', '));
    else aplicar[COL_SERVICIO.estado] = estado;
  }
  if (errores.length) return _resErr('VALIDACION', errores.join('\n'));
  if (cambios.tipoServicioId !== undefined) aplicar[COL_SERVICIO.tipoServicioId] = _texto(cambios.tipoServicioId);
  if (cambios.nombre !== undefined) aplicar[COL_SERVICIO.nombre] = _texto(cambios.nombre);
  if (cambios.descripcion !== undefined) aplicar[COL_SERVICIO.descripcion] = _texto(cambios.descripcion);
  if (cambios.horarioInicio !== undefined) aplicar[COL_SERVICIO.horarioInicio] = _texto(cambios.horarioInicio);
  if (cambios.horarioFin !== undefined) aplicar[COL_SERVICIO.horarioFin] = _texto(cambios.horarioFin);
  if (cambios.lugar !== undefined) aplicar[COL_SERVICIO.lugar] = _texto(cambios.lugar);
  if (cambios.direccion !== undefined) aplicar[COL_SERVICIO.direccion] = _texto(cambios.direccion);
  if (cambios.comuna !== undefined) aplicar[COL_SERVICIO.comuna] = _texto(cambios.comuna);
  if (cambios.region !== undefined) aplicar[COL_SERVICIO.region] = _texto(cambios.region);
  if (cambios.responsableId !== undefined) aplicar[COL_SERVICIO.responsableId] = _texto(cambios.responsableId);
  if (cambios.telefonoContacto !== undefined) aplicar[COL_SERVICIO.telefonoContacto] = _texto(cambios.telefonoContacto);
  if (cambios.rolesRequeridos !== undefined) aplicar[COL_SERVICIO.rolesRequeridos] = _texto(cambios.rolesRequeridos);
  if (cambios.alimentacion !== undefined) aplicar[COL_SERVICIO.alimentacion] = _bool(cambios.alimentacion, false);
  if (cambios.agua !== undefined) aplicar[COL_SERVICIO.agua] = _bool(cambios.agua, false);
  if (cambios.alojamiento !== undefined) aplicar[COL_SERVICIO.alojamiento] = _bool(cambios.alojamiento, false);
  if (cambios.transporte !== undefined) aplicar[COL_SERVICIO.transporte] = _bool(cambios.transporte, false);
  if (cambios.apoyoLogistico !== undefined) aplicar[COL_SERVICIO.apoyoLogistico] = _bool(cambios.apoyoLogistico, false);
  if (cambios.observaciones !== undefined) aplicar[COL_SERVICIO.observaciones] = _texto(cambios.observaciones);
  if (cambios.institucionSolicitante !== undefined) aplicar[COL_SERVICIO.institucionSolicitante] = _texto(cambios.institucionSolicitante);
  var res = _actualizarFilaV2(ss, HOJA_V2.servicios, COL_SERVICIO, N_COLS_SERVICIO, id, aplicar);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.servicios, 'actualizarServicioV2', 'OK', id);
  return _resOk({ id: id });
}

function cambiarEstadoServicioV2(servicioId, estado) {
  estado = _texto(estado);
  if (ESTADOS_SERVICIO.indexOf(estado) === -1) return _resErr('VALIDACION', 'Estado debe ser: ' + ESTADOS_SERVICIO.join(', '));
  var res = _actualizarFilaV2(_ss(), HOJA_V2.servicios, COL_SERVICIO, N_COLS_SERVICIO, servicioId, { estado: estado });
  if (!res.ok) return res;
  _log(_ss(), HOJA_V2.servicios, 'cambiarEstadoServicioV2', 'OK', servicioId + ' → ' + estado);
  return _resOk({ id: servicioId, estado: estado });
}

function listarServiciosV2(filtros) {
  filtros = filtros || {};
  try {
    var ss = _ss();
    var filas = _tablaV2(ss, HOJA_V2.servicios, COL_SERVICIO, N_COLS_SERVICIO);
    var tipos = _tablaV2(ss, HOJA_V2.tiposServicio, COL_CATALOGO_LISTA, N_COLS_CATALOGO_LISTA);
    var porTipo = {};
    for (var t = 0; t < tipos.length; t++) porTipo[String(tipos[t].id)] = tipos[t];
    var asignaciones = _tablaV2(ss, HOJA_V2.servicioVoluntarios, COL_SERVICIO_VOLUNTARIO, N_COLS_SERVICIO_VOLUNTARIO);
    var porServicio = {};
    for (var a = 0; a < asignaciones.length; a++) {
      var st = String(asignaciones[a].estado || '');
      if (st === 'Retirado' || st === 'Reemplazado') continue;
      var sid = String(asignaciones[a].servicioId || '');
      porServicio[sid] = (porServicio[sid] || 0) + 1;
    }
    var res = [];
    for (var i = 0; i < filas.length; i++) {
      var f = filas[i];
      if (filtros.estado && String(f.estado || '') !== String(filtros.estado)) continue;
      if (filtros.tipoServicioId && String(f.tipoServicioId || '') !== String(filtros.tipoServicioId)) continue;
      var tipo = porTipo[String(f.tipoServicioId)];
      res.push({
        id: f.id,
        tipoServicioId: String(f.tipoServicioId || ''),
        tipo: tipo ? tipo.nombre : '',
        nombre: String(f.nombre || ''),
        descripcion: String(f.descripcion || ''),
        fecha: _fechaV2(f.fecha),
        horarioInicio: String(f.horarioInicio || ''),
        horarioFin: String(f.horarioFin || ''),
        lugar: String(f.lugar || ''),
        comuna: String(f.comuna || ''),
        estado: String(f.estado || ''),
        responsablesId: String(f.responsableId || ''),
        alimentacion: _bool(f.alimentacion, false),
        agua: _bool(f.agua, false),
        alojamiento: _bool(f.alojamiento, false),
        transporte: _bool(f.transporte, false),
        apoyoLogistico: _bool(f.apoyoLogistico, false),
        asignados: porServicio[String(f.id)] || 0,
        observaciones: String(f.observaciones || ''),
        fechaTermino: _fechaV2(f.fechaTermino),
        institucionSolicitante: String(f.institucionSolicitante || '')
      });
    }
    res.sort(function (a, b) { return _parseDate(b.fecha || '01/01/2000') - _parseDate(a.fecha || '01/01/2000'); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

/**
 * Detalle de un servicio (V3.3): `asignados` = solo asignaciones vigentes;
 * `cerrados` = retirados/reemplazados (historial). Con opciones.incluirCerradas
 * se devuelven juntos en `asignados` (con estado) para vistas administrativas.
 */
function obtenerServicioV2(servicioId, opciones) {
  try {
    var ss = _ss();
    var incluirCerradas = !!(opciones && opciones.incluirCerradas);
    var f = _buscarV2(ss, HOJA_V2.servicios, COL_SERVICIO, N_COLS_SERVICIO, function (s) {
      return String(s.id) === String(servicioId);
    });
    if (!f) return _resErr('NO_ENCONTRADO', 'Servicio ' + servicioId + ' no existe');
    var tipos = _tablaV2(ss, HOJA_V2.tiposServicio, COL_CATALOGO_LISTA, N_COLS_CATALOGO_LISTA);
    var porTipo = {};
    for (var t = 0; t < tipos.length; t++) porTipo[String(tipos[t].id)] = tipos[t];
    var todas = _tablaV2(ss, HOJA_V2.servicioVoluntarios, COL_SERVICIO_VOLUNTARIO, N_COLS_SERVICIO_VOLUNTARIO).filter(function (a) {
      return String(a.servicioId) === String(servicioId);
    });
    var asignaciones = todas.filter(function (a) {
      if (incluirCerradas) return true;
      var st = String(a.estado || '');
      return st !== 'Retirado' && st !== 'Reemplazado';
    });
    var cerrados = incluirCerradas ? [] : todas.filter(function (a) {
      var st = String(a.estado || '');
      return st === 'Retirado' || st === 'Reemplazado';
    });
    var voluntarios = _tablaV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2);
    var personas = _tablaV2(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA);
    var porPersona = {};
    for (var p = 0; p < personas.length; p++) porPersona[String(personas[p].id)] = personas[p];
    var nombrePorVol = {};
    for (var v = 0; v < voluntarios.length; v++) {
      var pe = porPersona[String(voluntarios[v].personaId)];
      nombrePorVol[String(voluntarios[v].id)] = pe ? [pe.nombres, pe.apPaterno, pe.apMaterno].filter(function (s) { return String(s).trim(); }).join(' ') : '';
    }
    var enRetiro = {};
    var retiros = _tablaV2(ss, HOJA_V2.retirosTemporales, COL_RETIRO_TEMPORAL, N_COLS_RETIRO_TEMPORAL);
    for (var r = 0; r < retiros.length; r++) {
      if (String(retiros[r].estado || '') === 'Activo') enRetiro[String(retiros[r].voluntarioId)] = _fechaV2(retiros[r].fechaInicio);
    }
    var tipo = porTipo[String(f.tipoServicioId)];
    return _resOk({
      servicio: {
        id: f.id,
        tipoServicioId: String(f.tipoServicioId || ''),
        tipo: tipo ? tipo.nombre : '',
        nombre: String(f.nombre || ''),
        descripcion: String(f.descripcion || ''),
        fecha: _fechaV2(f.fecha),
        horarioInicio: String(f.horarioInicio || ''),
        horarioFin: String(f.horarioFin || ''),
        lugar: String(f.lugar || ''),
        direccion: String(f.direccion || ''),
        comuna: String(f.comuna || ''),
        region: String(f.region || ''),
        responsableId: String(f.responsableId || ''),
        telefonoContacto: String(f.telefonoContacto || ''),
        rolesRequeridos: String(f.rolesRequeridos || ''),
        alimentacion: _bool(f.alimentacion, false),
        agua: _bool(f.agua, false),
        alojamiento: _bool(f.alojamiento, false),
        transporte: _bool(f.transporte, false),
        apoyoLogistico: _bool(f.apoyoLogistico, false),
        estado: String(f.estado || ''),
        observaciones: String(f.observaciones || ''),
        fechaTermino: _fechaV2(f.fechaTermino),
        institucionSolicitante: String(f.institucionSolicitante || '')
      },
      asignados: asignaciones.map(function (a) {
        return {
          id: a.id,
          voluntarioId: String(a.voluntarioId || ''),
          voluntario: nombrePorVol[String(a.voluntarioId)] || '—',
          rolEnServicio: String(a.rolEnServicio || ''),
          asignadoPor: String(a.asignadoPor || ''),
          fechaAsignacion: _fechaV2(a.fechaAsignacion),
          estado: String(a.estado || ''),
          observaciones: String(a.observaciones || ''),
          enRetiro: !!enRetiro[String(a.voluntarioId)],
          retiroDesde: enRetiro[String(a.voluntarioId)] || ''
        };
      }),
      cerrados: cerrados.map(function (a) {
        return {
          id: a.id,
          voluntarioId: String(a.voluntarioId || ''),
          voluntario: nombrePorVol[String(a.voluntarioId)] || '—',
          rolEnServicio: String(a.rolEnServicio || ''),
          asignadoPor: String(a.asignadoPor || ''),
          fechaAsignacion: _fechaV2(a.fechaAsignacion),
          estado: String(a.estado || ''),
          observaciones: String(a.observaciones || '')
        };
      })
    });
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

/**
 * Asignación MASIVA de voluntarios a un servicio (una llamada, N filas).
 * datos: {rolEnServicio?, asignadoPor?, estado?, observaciones?}
 */
function asignarVoluntariosServicioV2(servicioId, voluntarioIds, datos) {
  datos = datos || {};
  var ss = _ss();
  var ids = voluntarioIds || [];
  if (!Array.isArray(ids) || !ids.length) return _resErr('DATOS_INCOMPLETOS', 'Indica al menos un voluntario');
  var servicio = _buscarV2(ss, HOJA_V2.servicios, COL_SERVICIO, N_COLS_SERVICIO, function (s) {
    return String(s.id) === String(servicioId);
  });
  if (!servicio) return _resErr('NO_ENCONTRADO', 'Servicio ' + servicioId + ' no existe');

  var existentes = _tablaV2(ss, HOJA_V2.servicioVoluntarios, COL_SERVICIO_VOLUNTARIO, N_COLS_SERVICIO_VOLUNTARIO);
  var yaAsignados = {};
  for (var i = 0; i < existentes.length; i++) {
    if (String(existentes[i].servicioId) === String(servicioId)) {
      var stA = String(existentes[i].estado || '');
      if (stA === 'Retirado' || stA === 'Reemplazado') continue;
      yaAsignados[String(existentes[i].voluntarioId)] = true;
    }
  }
  var voluntarios = _tablaV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2);
  var validos = {};
  var enRetiro = {};
  var retiros = _tablaV2(ss, HOJA_V2.retirosTemporales, COL_RETIRO_TEMPORAL, N_COLS_RETIRO_TEMPORAL);
  for (var v = 0; v < voluntarios.length; v++) validos[String(voluntarios[v].id)] = true;
  for (var r = 0; r < retiros.length; r++) {
    if (String(retiros[r].estado || '') === 'Activo') enRetiro[String(retiros[r].voluntarioId)] = true;
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  try {
    var creados = 0;
    var omitidos = [];
    var advertencias = [];
    var ahora = new Date();
    var estadoInicial = _texto(datos.estado) || 'Asignado';
    for (var j = 0; j < ids.length; j++) {
      var vid = String(ids[j]);
      if (!validos[vid]) { omitidos.push(vid); continue; }
      if (yaAsignados[vid]) { omitidos.push(vid); continue; }
      var fila = {};
      fila[COL_SERVICIO_VOLUNTARIO.servicioId] = servicioId;
      fila[COL_SERVICIO_VOLUNTARIO.voluntarioId] = vid;
      fila[COL_SERVICIO_VOLUNTARIO.rolEnServicio] = _texto(datos.rolEnServicio);
      fila[COL_SERVICIO_VOLUNTARIO.asignadoPor] = _texto(datos.asignadoPor);
      fila[COL_SERVICIO_VOLUNTARIO.fechaAsignacion] = ahora;
      fila[COL_SERVICIO_VOLUNTARIO.estado] = estadoInicial;
      fila[COL_SERVICIO_VOLUNTARIO.observaciones] = _texto(datos.observaciones);
      var res = _insertarFilaV2(ss, HOJA_V2.servicioVoluntarios, COL_SERVICIO_VOLUNTARIO, N_COLS_SERVICIO_VOLUNTARIO, fila);
      if (res.ok) {
        creados++;
        if (enRetiro[vid]) advertencias.push(vid);
      }
    }
    _log(ss, HOJA_V2.servicioVoluntarios, 'asignarVoluntariosServicioV2', creados ? 'OK' : 'SIN CAMBIOS', 'Servicio ' + servicioId + ' — ' + creados + ' asignado(s)' + (advertencias.length ? ', en retiro temporal: ' + advertencias.join(',') : '') + (omitidos.length ? ', omitidos: ' + omitidos.join(',') : ''));
    return _resOk({ creados: creados, omitidos: omitidos, advertencias: advertencias });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Cierra lógicamente una asignación de voluntario a servicio (V3.3): NO elimina
 * la fila; la marca con estado 'Retirado' (o 'Reemplazado' si datos.estado lo
 * indica — valida contra ESTADOS_ASISTENCIA_V2). La asignación anterior queda
 * en el historial (cerrados) y el voluntario puede ser re-asignado luego con una
 * fila NUEVA. datos: {motivo?, estado?} — opcional y compatible con la firma previa.
 */
function quitarVoluntarioServicioV2(id, datos) {
  datos = datos || {};
  var ss = _ss();
  var estadoCierre = _texto(datos.estado) || 'Retirado';
  if (ESTADOS_ASISTENCIA_V2.indexOf(estadoCierre) === -1) {
    return _resErr('VALIDACION', 'Estado de cierre debe ser: ' + ESTADOS_ASISTENCIA_V2.join(', '));
  }
  var sh = _hojaV2(ss, HOJA_V2.servicioVoluntarios);
  if (!sh) return _resErr('ESTRUCTURA_NO_CREADA', 'Estructura V2 no creada');
  var filaN = _filaPorIdEn(sh, id);
  if (!filaN) return _resErr('NO_ENCONTRADO', 'Asignación ' + id + ' no existe');
  var estadoActual = String(sh.getRange(filaN, COL_SERVICIO_VOLUNTARIO.estado, 1, 1).getValues()[0][0] || '');
  if (estadoActual === 'Retirado' || estadoActual === 'Reemplazado') {
    _log(ss, HOJA_V2.servicioVoluntarios, 'quitarVoluntarioServicioV2', 'OK', id + ' (ya cerrada: ' + estadoActual + ')');
    return _resOk({ id: id, yaCerrado: true });
  }
  var res = _cerrarFilaV2(ss, HOJA_V2.servicioVoluntarios, COL_SERVICIO_VOLUNTARIO, N_COLS_SERVICIO_VOLUNTARIO, id, datos, 'estado', estadoCierre, 'Retiro (V3.3)');
  if (!res.ok) return res;
  _log(ss, HOJA_V2.servicioVoluntarios, 'quitarVoluntarioServicioV2', 'OK', id + ' → ' + estadoCierre);
  return res;
}