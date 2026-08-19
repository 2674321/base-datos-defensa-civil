/**
 * 22_Personas.js — Dominio Personas + Voluntarios V2 (fase 2).
 *
 * Separación conceptual: Personas = datos personales permanentes (RUN, contacto,
 * grupo sanguíneo...); Voluntarios V2 = vínculo administrativo con la sede
 * (estado, categoría, fechas de ingreso/egreso, motivo).
 * La hoja "Voluntarios" v0 se conserva intacta; _migrarVoluntariosV2() la
 * convierte en Personas + Voluntarios V2 (idempotente por RUN).
 *
 * API pública:
 *   listarPersonasV2()          → lista con grado/cargo/área vigentes
 *   obtenerPersonaV2(id)        → persona + voluntario + vigentes + antigüedades
 *   crearPersonaV2(datos)       → persona (+ voluntario si datos.voluntario)
 *   actualizarPersonaV2(id, cambios)
 *   darDeBajaVoluntarioV2(id, datos) → estado Egresado + fecha/motivo + evento
 *   reactivarVoluntarioV2(id, datos)
 *   migrarVoluntariosV2()       → wrapper de la migración idempotente
 *   obtenerVigenteGradoV2(voluntarioId) / obtenerVigenteCargoV2(voluntarioId)
 */

function listarPersonasV2() {
  try {
    var ss = _ss();
    var personas = _tablaV2(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA);
    var voluntarios = _tablaV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2);
    var grados = _tablaV2(ss, HOJA_V2.grados, COL_GRADO, N_COLS_GRADO);
    var cargos = _tablaV2(ss, HOJA_V2.cargos, COL_CARGO, N_COLS_CARGO);
    var areas = _tablaV2(ss, HOJA_V2.areas, COL_AREA, N_COLS_AREA);
    var histG = _tablaV2(ss, HOJA_V2.historialGrados, COL_HIST_GRADO, N_COLS_HIST_GRADO);
    var histC = _tablaV2(ss, HOJA_V2.historialCargos, COL_HIST_CARGO, N_COLS_HIST_CARGO);

    // V3.4C: especialidades/subespecialidades vigentes y unidades activas por
    // voluntario (extensión ADITIVA: el buscador global y la página Voluntarios
    // filtran por especialidad/subespecialidad/unidad sin nuevas llamadas).
    var esp = _tablaV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD);
    var subesp = _tablaV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD);
    var volEsp = _tablaV2(ss, HOJA_V2.voluntarioEspecialidades, COL_VOL_ESPECIALIDAD, N_COLS_VOL_ESPECIALIDAD);
    var unidades = _tablaV2(ss, HOJA_V2.unidadesInternas, COL_UNIDAD, N_COLS_UNIDAD);
    var integrantes = _tablaV2(ss, HOJA_V2.integrantesUnidad, COL_INTEGRANTE_UNIDAD, N_COLS_INTEGRANTE_UNIDAD);

    var espPorId = {};
    for (var ie = 0; ie < esp.length; ie++) espPorId[String(esp[ie].id)] = esp[ie];
    var subPorId = {};
    for (var ise = 0; ise < subesp.length; ise++) subPorId[String(subesp[ise].id)] = subesp[ise];
    var espPorVol = {};
    for (var ive = 0; ive < volEsp.length; ive++) {
      var ve = volEsp[ive];
      if (!_vigenteV2(ve.activo)) continue;
      var vid = String(ve.voluntarioId || '');
      var e = espPorId[String(ve.especialidadId || '')];
      var s = ve.subespecialidadId ? subPorId[String(ve.subespecialidadId)] : null;
      if (!e) continue;
      (espPorVol[vid] = espPorVol[vid] || []).push({
        especialidad: String(e.nombre || ''),
        subespecialidad: s ? String(s.nombre || '') : '',
        nivel: String(ve.nivel || ''),
        origen: String(e.origen || '')
      });
    }
    var unidadPorId = {};
    for (var iu = 0; iu < unidades.length; iu++) unidadPorId[String(unidades[iu].id)] = unidades[iu];
    var unidPorVol = {};
    for (var iin = 0; iin < integrantes.length; iin++) {
      var ing = integrantes[iin];
      if (ing.fechaSalida) continue;
      var uvid = String(ing.voluntarioId || '');
      var u = unidadPorId[String(ing.unidadId || '')];
      if (!u) continue;
      (unidPorVol[uvid] = unidPorVol[uvid] || []).push({
        unidad: String(u.nombre || ''),
        rol: String(ing.rol || ''),
        estado: String(u.estado || '')
      });
    }

    var gradoPorId = {};
    for (var g = 0; g < grados.length; g++) gradoPorId[String(grados[g].id)] = grados[g];
    var cargoPorId = {};
    for (var c = 0; c < cargos.length; c++) cargoPorId[String(cargos[c].id)] = cargos[c];
    var areaPorId = {};
    for (var a = 0; a < areas.length; a++) areaPorId[String(areas[a].id)] = areas[a];

    var vigenteG = {};
    for (var hg = 0; hg < histG.length; hg++) {
      var f = histG[hg];
      if (f.fechaHasta !== '' && f.fechaHasta !== null && f.fechaHasta !== undefined) continue;
      var vid2 = String(f.voluntarioId || '');
      if (!vigenteG[vid2]) vigenteG[vid2] = f;
    }
    var vigenteC = {};
    for (var hc = 0; hc < histC.length; hc++) {
      var fc = histC[hc];
      if (fc.fechaHasta !== '' && fc.fechaHasta !== null && fc.fechaHasta !== undefined) continue;
      var vc2 = String(fc.voluntarioId || '');
      if (!vigenteC[vc2]) vigenteC[vc2] = fc;
    }

    var porPersona = {};
    for (var v = 0; v < voluntarios.length; v++) porPersona[String(voluntarios[v].personaId)] = voluntarios[v];

    var res = [];
    for (var i = 0; i < personas.length; i++) {
      var p = personas[i];
      var vol = porPersona[String(p.id)];
      var hg = vol ? vigenteG[String(vol.id)] : null;
      var hc = vol ? vigenteC[String(vol.id)] : null;
      var grado = hg ? (gradoPorId[String(hg.gradoId)] || {}).nombre || '' : '';
      var cargo = hc ? (cargoPorId[String(hc.cargoId)] || {}).nombre || '' : '';
      var cargoArea = '';
      if (hc && cargoPorId[String(hc.cargoId)]) {
        var ca = cargoPorId[String(hc.cargoId)].areaId;
        cargoArea = ca ? (areaPorId[String(ca)] || {}).nombre || '' : '';
      }
      res.push({
        personaId: p.id,
        voluntarioId: vol ? vol.id : null,
        run: String(p.run || ''),
        nombreCompleto: [p.nombres, p.apPaterno, p.apMaterno].filter(function (s) { return String(s).trim(); }).join(' '),
        estado: vol ? String(vol.estado || '') : '',
        categoria: vol ? String(vol.categoria || '') : '',
        grado: grado,
        cargo: cargo,
        area: cargoArea,
        fechaIngreso: vol ? _fechaV2(vol.fechaIngreso) : '',
        fechaEgreso: vol ? _fechaV2(vol.fechaEgreso) : '',
        especialidades: vol ? (espPorVol[String(vol.id)] || []) : [],
        unidades: vol ? (unidPorVol[String(vol.id)] || []) : []
      });
    }
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function obtenerPersonaV2(id) {
  try {
    var ss = _ss();
    var persona = _buscarV2(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA, function (p) {
      return String(p.id) === String(id);
    });
    if (!persona) return _resErr('NO_ENCONTRADO', 'Persona ' + id + ' no existe');
    var voluntario = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
      return String(v.personaId) === String(id);
    });
    var salida = {
      persona: {
        id: persona.id,
        run: String(persona.run || ''),
        nombres: String(persona.nombres || ''),
        apPaterno: String(persona.apPaterno || ''),
        apMaterno: String(persona.apMaterno || ''),
        fechaNacimiento: _fechaV2(persona.fechaNac),
        sexo: String(persona.sexo || ''),
        nacionalidad: String(persona.nacionalidad || ''),
        direccion: String(persona.direccion || ''),
        comuna: String(persona.comuna || ''),
        telefono: String(persona.telefono || ''),
        correo: String(persona.correo || ''),
        emergenciaNombre: String(persona.emergenciaNombre || ''),
        emergenciaTelefono: String(persona.emergenciaTelefono || ''),
        grupoABO: String(persona.grupoABO || ''),
        factorRh: String(persona.factorRh || ''),
        observaciones: String(persona.observaciones || ''),
        fotoDriveId: String(persona.fotoDriveId || ''),
        fotoFecha: _fechaV2(persona.fotoFecha),
        fotoEstado: String(persona.fotoEstado || '')
      },
      voluntario: voluntario ? {
        id: voluntario.id,
        personaId: voluntario.personaId,
        sedeId: voluntario.sedeId,
        estado: String(voluntario.estado || ''),
        categoria: String(voluntario.categoria || ''),
        fechaIngreso: _fechaV2(voluntario.fechaIngreso),
        fechaEgreso: _fechaV2(voluntario.fechaEgreso),
        motivoEgreso: String(voluntario.motivoEgreso || ''),
        observaciones: String(voluntario.observaciones || '')
      } : null
    };
    if (voluntario) {
      var g = obtenerVigenteGradoV2(voluntario.id);
      var c = obtenerVigenteCargoV2(voluntario.id);
      salida.gradoVigente = g.ok ? g.data : null;
      salida.cargoVigente = c.ok ? c.data : null;
      // V3.4F: cargos múltiples — TODOS los cargos vigentes del voluntario.
      // cargoVigente se conserva (compatibilidad): el más reciente.
      salida.cargosVigentes = obtenerCargosVigentesV2(voluntario.id);
      salida.antiguedades = obtenerAntiguedadesV2(voluntario.id);
    }
    return _resOk(salida);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

/** Valida campos de persona (sin servicios). @return {Array} errores */
function _validarPersonaV2(datos) {
  var errores = [];
  var run = _validarRUT(datos.run);
  if (!run.ok) errores.push('RUN: ' + run.error);
  if (!_texto(datos.nombres)) errores.push('Nombres: obligatorio');
  if (!_texto(datos.apPaterno)) errores.push('Apellido paterno: obligatorio');
  var abo = _texto(datos.grupoABO);
  if (abo && GRUPOS_ABO.indexOf(abo) === -1) errores.push('Grupo ABO debe ser: ' + GRUPOS_ABO.join(', '));
  var rh = _texto(datos.factorRh);
  if (rh && FACTORES_RH.indexOf(rh) === -1) errores.push('Factor Rh debe ser: + o -');
  if (_texto(datos.correo) && !_esCorreoValido(datos.correo)) errores.push('Correo inválido');
  if (_texto(datos.telefono) && !_esTelefonoValido(datos.telefono)) errores.push('Teléfono inválido');
  if (_texto(datos.emergenciaTelefono) && !_esTelefonoValido(datos.emergenciaTelefono)) errores.push('Teléfono de emergencia inválido');
  if (_texto(datos.fechaNacimiento) && !_parseDate(datos.fechaNacimiento)) errores.push('Fecha de nacimiento inválida (dd/mm/aaaa)');
  return { run: run, errores: errores };
}

/** Crea una persona; si datos.voluntario es true, crea también el vínculo Voluntarios V2. */
function crearPersonaV2(datos) {
  datos = datos || {};
  var ss = _ss();
  var valid = _validarPersonaV2(datos);
  if (valid.errores.length) return _resErr('VALIDACION', valid.errores.join('\n'));
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  try {
    var existentes = _tablaV2(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA);
    for (var i = 0; i < existentes.length; i++) {
      if (_cuerpoRUN(existentes[i].run) === _cuerpoRUN(valid.run.run)) {
        return _resErr('DUPLICADO', 'RUN ya registrado: Persona ' + existentes[i].id + ' (' + (existentes[i].nombres || '') + ' ' + (existentes[i].apPaterno || '') + ')');
      }
    }
    var fila = {};
    fila[COL_PERSONA.run] = valid.run.run;
    fila[COL_PERSONA.nombres] = _mayus(datos.nombres);
    fila[COL_PERSONA.apPaterno] = _mayus(datos.apPaterno);
    fila[COL_PERSONA.apMaterno] = _mayus(datos.apMaterno);
    fila[COL_PERSONA.fechaNac] = _texto(datos.fechaNacimiento) ? _parseDate(datos.fechaNacimiento) : null;
    fila[COL_PERSONA.sexo] = _texto(datos.sexo);
    fila[COL_PERSONA.nacionalidad] = _texto(datos.nacionalidad);
    fila[COL_PERSONA.direccion] = _texto(datos.direccion);
    fila[COL_PERSONA.comuna] = _texto(datos.comuna);
    fila[COL_PERSONA.telefono] = _texto(datos.telefono);
    fila[COL_PERSONA.correo] = _texto(datos.correo);
    fila[COL_PERSONA.emergenciaNombre] = _mayus(datos.emergenciaNombre);
    fila[COL_PERSONA.emergenciaTelefono] = _texto(datos.emergenciaTelefono);
    fila[COL_PERSONA.grupoABO] = _texto(datos.grupoABO);
    fila[COL_PERSONA.factorRh] = _texto(datos.factorRh);
    fila[COL_PERSONA.observaciones] = _texto(datos.observaciones);
    // V3.4D: foto por referencia (Drive ID o URL), nunca binaria.
    if (datos.fotoDriveId !== undefined) {
      fila[COL_PERSONA.fotoDriveId] = _texto(datos.fotoDriveId);
      fila[COL_PERSONA.fotoFecha] = _texto(datos.fotoFecha) ? _parseDate(datos.fotoFecha) : new Date();
      fila[COL_PERSONA.fotoEstado] = _texto(datos.fotoDriveId) ? 'Registrada' : 'No registrada';
    }
    var res = _insertarFilaV2(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA, fila);
    if (!res.ok) return res;

    var voluntarioId = null;
    if (_bool(datos.voluntario, false)) {
      var resV = _crearVoluntarioV2(ss, res.data.id, datos, valid.run.run);
      if (!resV.ok) return resV;
      voluntarioId = resV.data.id;
    }
    _log(ss, HOJA_V2.personas, 'crearPersonaV2', 'OK', 'P' + res.data.id + (voluntarioId ? ' — Vol. ' + voluntarioId : ''));
    return _resOk({ id: res.data.id, voluntarioId: voluntarioId });
  } finally {
    lock.releaseLock();
  }
}

/** Crea el vínculo Voluntarios V2 para una persona existente. @return {Object} {ok, data:{id}} */
function _crearVoluntarioV2(ss, personaId, datos, run) {
  var estados = _configLista(ss, 'ESTADOS');
  var estado = _texto(datos.estado) || ESTADO_VOLUNTARIO_V2_DEFECTO;
  if (estados.length && estados.indexOf(estado) === -1) {
    return _resErr('VALIDACION', 'Estado debe ser: ' + estados.join(', '));
  }
  var categorias = _configLista(ss, 'CATEGORIAS');
  var categoria = _texto(datos.categoria) || CATEGORIA_VOLUNTARIO_V2_DEFECTO;
  if (categorias.length && categorias.indexOf(categoria) === -1) {
    return _resErr('VALIDACION', 'Categoría debe ser: ' + categorias.join(', '));
  }
  var fechaIng = _texto(datos.fechaIngreso) ? _parseDate(datos.fechaIngreso) : new Date();
  if (!fechaIng) return _resErr('VALIDACION', 'Fecha de ingreso inválida (dd/mm/aaaa)');

  var fila = {};
  fila[COL_VOLUNTARIO_V2.personaId] = personaId;
  fila[COL_VOLUNTARIO_V2.sedeId] = _texto(datos.sedeId) || 1;
  fila[COL_VOLUNTARIO_V2.estado] = estado;
  fila[COL_VOLUNTARIO_V2.categoria] = categoria;
  fila[COL_VOLUNTARIO_V2.fechaIngreso] = fechaIng;
  if (estado === 'Egresado') {
    fila[COL_VOLUNTARIO_V2.fechaEgreso] = _texto(datos.fechaEgreso) ? _parseDate(datos.fechaEgreso) : new Date();
    fila[COL_VOLUNTARIO_V2.motivoEgreso] = _texto(datos.motivoEgreso);
  }
  fila[COL_VOLUNTARIO_V2.observaciones] = _texto(datos.observacionesVoluntario);
  var res = _insertarFilaV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, fila);
  if (!res.ok) return res;
  _agregarEventoHojaV2(ss, personaId, 'INGRESO', _fmtFecha(fechaIng), 'Ingreso a la sede (categoría ' + categoria + ')', String(res.data.id));
  return _resOk({ id: res.data.id });
}

function actualizarPersonaV2(id, cambios) {
  cambios = cambios || {};
  var ss = _ss();
  var persona = _buscarV2(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA, function (p) {
    return String(p.id) === String(id);
  });
  if (!persona) return _resErr('NO_ENCONTRADO', 'Persona ' + id + ' no existe');

  var aplicar = {};
  var errores = [];
  if (cambios.run !== undefined) {
    var rv = _validarRUT(cambios.run);
    if (!rv.ok) errores.push('RUN: ' + rv.error);
    else {
      var cuerpoNuevo = _cuerpoRUN(rv.run);
      var otras = _tablaV2(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA);
      for (var i = 0; i < otras.length; i++) {
        if (String(otras[i].id) !== String(id) && _cuerpoRUN(otras[i].run) === cuerpoNuevo) {
          errores.push('RUN ya registrado: Persona ' + otras[i].id);
          break;
        }
      }
      if (!errores.length) aplicar[COL_PERSONA.run] = rv.run;
    }
  }
  if (cambios.grupoABO !== undefined) {
    var abo = _texto(cambios.grupoABO);
    if (abo && GRUPOS_ABO.indexOf(abo) === -1) errores.push('Grupo ABO debe ser: ' + GRUPOS_ABO.join(', '));
    else aplicar[COL_PERSONA.grupoABO] = abo;
  }
  if (cambios.factorRh !== undefined) {
    var rh = _texto(cambios.factorRh);
    if (rh && FACTORES_RH.indexOf(rh) === -1) errores.push('Factor Rh debe ser: + o -');
    else aplicar[COL_PERSONA.factorRh] = rh;
  }
  if (cambios.correo !== undefined && _texto(cambios.correo) && !_esCorreoValido(cambios.correo)) errores.push('Correo inválido');
  if (cambios.telefono !== undefined && _texto(cambios.telefono) && !_esTelefonoValido(cambios.telefono)) errores.push('Teléfono inválido');
  if (cambios.emergenciaTelefono !== undefined && _texto(cambios.emergenciaTelefono) && !_esTelefonoValido(cambios.emergenciaTelefono)) errores.push('Teléfono de emergencia inválido');
  if (cambios.fechaNacimiento !== undefined && _texto(cambios.fechaNacimiento) && !_parseDate(cambios.fechaNacimiento)) errores.push('Fecha de nacimiento inválida');
  if (cambios.fotoFecha !== undefined && _texto(cambios.fotoFecha) && !_parseDate(cambios.fotoFecha)) errores.push('Fecha de foto inválida');
  if (errores.length) return _resErr('VALIDACION', errores.join('\n'));

  if (cambios.nombres !== undefined) aplicar[COL_PERSONA.nombres] = _mayus(cambios.nombres);
  if (cambios.apPaterno !== undefined) aplicar[COL_PERSONA.apPaterno] = _mayus(cambios.apPaterno);
  if (cambios.apMaterno !== undefined) aplicar[COL_PERSONA.apMaterno] = _mayus(cambios.apMaterno);
  if (cambios.fechaNacimiento !== undefined) aplicar[COL_PERSONA.fechaNac] = _texto(cambios.fechaNacimiento) ? _parseDate(cambios.fechaNacimiento) : null;
  if (cambios.sexo !== undefined) aplicar[COL_PERSONA.sexo] = _texto(cambios.sexo);
  if (cambios.nacionalidad !== undefined) aplicar[COL_PERSONA.nacionalidad] = _texto(cambios.nacionalidad);
  if (cambios.direccion !== undefined) aplicar[COL_PERSONA.direccion] = _texto(cambios.direccion);
  if (cambios.comuna !== undefined) aplicar[COL_PERSONA.comuna] = _texto(cambios.comuna);
  if (cambios.correo !== undefined) aplicar[COL_PERSONA.correo] = _texto(cambios.correo);
  if (cambios.telefono !== undefined) aplicar[COL_PERSONA.telefono] = _texto(cambios.telefono);
  if (cambios.emergenciaNombre !== undefined) aplicar[COL_PERSONA.emergenciaNombre] = _mayus(cambios.emergenciaNombre);
  if (cambios.emergenciaTelefono !== undefined) aplicar[COL_PERSONA.emergenciaTelefono] = _texto(cambios.emergenciaTelefono);
  if (cambios.observaciones !== undefined) aplicar[COL_PERSONA.observaciones] = _texto(cambios.observaciones);
  // V3.4D: foto por referencia (Drive ID o URL), nunca binaria. Si se registra
  // una foto sin fecha, la fecha queda en hoy; el estado se deriva del valor.
  if (cambios.fotoDriveId !== undefined) {
    aplicar[COL_PERSONA.fotoDriveId] = _texto(cambios.fotoDriveId);
    aplicar[COL_PERSONA.fotoFecha] = _texto(cambios.fotoFecha) ? _parseDate(cambios.fotoFecha) : new Date();
    aplicar[COL_PERSONA.fotoEstado] = _texto(cambios.fotoDriveId) ? 'Registrada' : 'No registrada';
  } else if (cambios.fotoFecha !== undefined) {
    aplicar[COL_PERSONA.fotoFecha] = _texto(cambios.fotoFecha) ? _parseDate(cambios.fotoFecha) : null;
  } else if (cambios.fotoEstado !== undefined) {
    aplicar[COL_PERSONA.fotoEstado] = _texto(cambios.fotoEstado);
  }

  var res = _actualizarFilaV2(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA, id, aplicar);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.personas, 'actualizarPersonaV2', 'OK', 'P' + id);
  return _resOk({ id: id });
}

/** Actualiza el vínculo Voluntarios V2 (estado/categoría/fechas). */
function actualizarVoluntarioV2(id, cambios) {
  cambios = cambios || {};
  var ss = _ss();
  var vol = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
    return String(v.id) === String(id);
  });
  if (!vol) return _resErr('NO_ENCONTRADO', 'Voluntario ' + id + ' no existe');

  var aplicar = {};
  var errores = [];
  if (cambios.estado !== undefined) {
    var est = _texto(cambios.estado);
    var estados = _configLista(ss, 'ESTADOS');
    if (estados.length && estados.indexOf(est) === -1) errores.push('Estado debe ser: ' + estados.join(', '));
    else aplicar[COL_VOLUNTARIO_V2.estado] = est;
    if (est === 'Egresado') {
      aplicar[COL_VOLUNTARIO_V2.fechaEgreso] = _texto(cambios.fechaEgreso) ? _parseDate(cambios.fechaEgreso) : new Date();
      aplicar[COL_VOLUNTARIO_V2.motivoEgreso] = _texto(cambios.motivoEgreso);
    }
  }
  if (cambios.categoria !== undefined) {
    var cat = _texto(cambios.categoria);
    var categorias = _configLista(ss, 'CATEGORIAS');
    if (categorias.length && categorias.indexOf(cat) === -1) errores.push('Categoría debe ser: ' + categorias.join(', '));
    else aplicar[COL_VOLUNTARIO_V2.categoria] = cat;
  }
  if (cambios.fechaIngreso !== undefined) {
    var fi = _texto(cambios.fechaIngreso);
    if (fi && !_parseDate(fi)) errores.push('Fecha de ingreso inválida');
    else aplicar[COL_VOLUNTARIO_V2.fechaIngreso] = fi ? _parseDate(fi) : null;
  }
  if (cambios.observaciones !== undefined) aplicar[COL_VOLUNTARIO_V2.observaciones] = _texto(cambios.observaciones);
  if (errores.length) return _resErr('VALIDACION', errores.join('\n'));

  var res = _actualizarFilaV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, id, aplicar);
  if (!res.ok) return res;
  if (aplicar[COL_VOLUNTARIO_V2.estado]) {
    _agregarEventoHojaV2(ss, vol.personaId, 'SITUACION_ADMINISTRATIVA', _fmtFecha(new Date()), 'Estado → ' + aplicar[COL_VOLUNTARIO_V2.estado], String(id));
  }
  _log(ss, HOJA_V2.voluntarios, 'actualizarVoluntarioV2', 'OK', 'Vol. ' + id);
  return _resOk({ id: id });
}

function darDeBajaVoluntarioV2(id, datos) {
  datos = datos || {};
  var ss = _ss();
  var vol = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
    return String(v.id) === String(id);
  });
  if (!vol) return _resErr('NO_ENCONTRADO', 'Voluntario ' + id + ' no existe');
  if (String(vol.estado || '') === 'Egresado') return _resOk({ id: id, yaEgresado: true });
  var fechaE = _texto(datos.fechaEgreso) ? _parseDate(datos.fechaEgreso) : new Date();
  if (!fechaE) return _resErr('VALIDACION', 'Fecha de egreso inválida');
  var res = _actualizarFilaV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, id, {
    estado: 'Egresado',
    fechaEgreso: fechaE,
    motivoEgreso: _texto(datos.motivoEgreso)
  });
  if (!res.ok) return res;
  _agregarEventoHojaV2(ss, vol.personaId, 'EGRESO', _fmtFecha(fechaE), 'Egreso: ' + (_texto(datos.motivoEgreso) || 'sin motivo registrado'), String(id));
  _log(ss, HOJA_V2.voluntarios, 'darDeBajaVoluntarioV2', 'OK', 'Vol. ' + id);
  return _resOk({ id: id });
}

function reactivarVoluntarioV2(id, datos) {
  datos = datos || {};
  var ss = _ss();
  var vol = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
    return String(v.id) === String(id);
  });
  if (!vol) return _resErr('NO_ENCONTRADO', 'Voluntario ' + id + ' no existe');
  if (String(vol.estado || '') !== 'Egresado') return _resErr('ESTADO_INCOMPATIBLE', 'Solo se reactiva un voluntario Egresado');
  var fechaIng = _texto(datos.fechaIngreso) ? _parseDate(datos.fechaIngreso) : new Date();
  var res = _actualizarFilaV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, id, {
    estado: _texto(datos.estado) || 'Activo',
    fechaIngreso: fechaIng,
    fechaEgreso: '',
    motivoEgreso: ''
  });
  if (!res.ok) return res;
  _agregarEventoHojaV2(ss, vol.personaId, 'INGRESO', _fmtFecha(fechaIng), 'Reincorporación tras egreso', String(id));
  _log(ss, HOJA_V2.voluntarios, 'reactivarVoluntarioV2', 'OK', 'Vol. ' + id);
  return _resOk({ id: id });
}

/** Migración pública (fase 2): hoja Voluntarios v0 → Personas + Voluntarios V2. */
function migrarVoluntariosV2() {
  try {
    return _migrarVoluntariosV2();
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

// ============ Vigentes y antigüedades (usados por ficha y otros dominios) ============

/** Grado vigente de un voluntario (historial con fechaHasta vacía). */
function obtenerVigenteGradoV2(voluntarioId) {
  try {
    var ss = _ss();
    var hist = _tablaV2(ss, HOJA_V2.historialGrados, COL_HIST_GRADO, N_COLS_HIST_GRADO);
    var grados = _tablaV2(ss, HOJA_V2.grados, COL_GRADO, N_COLS_GRADO);
    var porId = {};
    for (var g = 0; g < grados.length; g++) porId[String(grados[g].id)] = grados[g];
    for (var i = hist.length - 1; i >= 0; i--) {
      var h = hist[i];
      if (String(h.voluntarioId) === String(voluntarioId) && !_texto(h.fechaHasta)) {
        var gr = porId[String(h.gradoId)];
        return _resOk(gr ? {
          gradoId: gr.id,
          grado: gr.nombre,
          orden: gr.orden,
          insignia: String(gr.insignia || ''),
          fechaDesde: _fechaV2(h.fechaDesde),
          requisitos: String(h.requisitosEvaluados || ''),
          excepcion: _bool(h.excepcion, false),
          excepcionDetalle: String(h.excepcionDetalle || '')
        } : null);
      }
    }
    return _resOk(null);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

/** Cargo vigente de un voluntario (historial con fechaHasta vacía). */
function obtenerVigenteCargoV2(voluntarioId) {
  try {
    var ss = _ss();
    var hist = _tablaV2(ss, HOJA_V2.historialCargos, COL_HIST_CARGO, N_COLS_HIST_CARGO);
    var cargos = _tablaV2(ss, HOJA_V2.cargos, COL_CARGO, N_COLS_CARGO);
    var areas = _tablaV2(ss, HOJA_V2.areas, COL_AREA, N_COLS_AREA);
    var porCargo = {};
    for (var c = 0; c < cargos.length; c++) porCargo[String(cargos[c].id)] = cargos[c];
    var porArea = {};
    for (var a = 0; a < areas.length; a++) porArea[String(areas[a].id)] = areas[a];
    for (var i = hist.length - 1; i >= 0; i--) {
      var h = hist[i];
      if (String(h.voluntarioId) === String(voluntarioId) && !_texto(h.fechaHasta)) {
        var ca = porCargo[String(h.cargoId)];
        if (!ca) continue;
        var area = ca.areaId ? porArea[String(ca.areaId)] : null;
        return _resOk({
          cargoId: ca.id,
          cargo: ca.nombre,
          area: area ? area.nombre : '',
          areaId: ca.areaId || '',
          fechaDesde: _fechaV2(h.fechaDesde),
          resolucion: String(h.resolucion || ''),
          quienAsigno: String(h.quienAsigno || '')
        });
      }
    }
    return _resOk(null);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

/**
 * TODOS los cargos vigentes de un voluntario (V3.4F: cargos múltiples).
 * Devuelve array (vacío si ninguno), ordenado por fechaDesde ascendente.
 */
function obtenerCargosVigentesV2(voluntarioId) {
  var ss = _ss();
  var hist = _tablaV2(ss, HOJA_V2.historialCargos, COL_HIST_CARGO, N_COLS_HIST_CARGO);
  var cargos = _tablaV2(ss, HOJA_V2.cargos, COL_CARGO, N_COLS_CARGO);
  var areas = _tablaV2(ss, HOJA_V2.areas, COL_AREA, N_COLS_AREA);
  var porCargo = {};
  for (var c = 0; c < cargos.length; c++) porCargo[String(cargos[c].id)] = cargos[c];
  var porArea = {};
  for (var a = 0; a < areas.length; a++) porArea[String(areas[a].id)] = areas[a];
  var res = [];
  for (var i = 0; i < hist.length; i++) {
    var h = hist[i];
    if (String(h.voluntarioId) !== String(voluntarioId)) continue;
    if (_texto(h.fechaHasta)) continue;
    var ca = porCargo[String(h.cargoId)];
    if (!ca) continue;
    var area = ca.areaId ? porArea[String(ca.areaId)] : null;
    res.push({
      cargoId: ca.id,
      cargo: ca.nombre,
      area: area ? area.nombre : '',
      areaId: ca.areaId || '',
      fechaDesde: _fechaV2(h.fechaDesde),
      resolucion: String(h.resolucion || ''),
      quienAsigno: String(h.quienAsigno || '')
    });
  }
  res.sort(function (x, y) {
    return (_parseDate(x.fechaDesde || '01/01/2000') - _parseDate(y.fechaDesde || '01/01/2000')) ||
      String(x.cargo).localeCompare(String(y.cargo));
  });
  return res;
}

/** Años entre dos fechas (fracción). Puro. */
function _aniosEntre(desde, hasta) {
  var d = _parseDate(desde);
  var h = hasta ? _parseDate(hasta) : new Date();
  if (!d) return 0;
  var ms = h.getTime() - d.getTime();
  return ms > 0 ? ms / (365.25 * 24 * 3600 * 1000) : 0;
}

/**
 * Antigüedades de un voluntario: institucional, en grado y en cargo.
 * V3.2: la antigüedad es derivada y descuenta los retiros temporales según la regla
 * configurable RETIRO_AFECTA_ANTIGUEDAD_* de la hoja Config (ver 35_Retiros.js).
 */
function obtenerAntiguedadesV2(voluntarioId) {
  try {
    var ss = _ss();
    var vol = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
      return String(v.id) === String(voluntarioId);
    });
    if (!vol) return _resErr('NO_ENCONTRADO', 'Voluntario ' + voluntarioId + ' no existe');
    var periodos = _periodosDescontablesV2(ss, voluntarioId);
    var hastaBase = _parseDate(vol.fechaEgreso) || new Date();
    var institucional = _calcularAntiguedadV2({
      desde: vol.fechaIngreso,
      hasta: hastaBase,
      periodos: periodos,
      descontar: _configSi(ss, 'RETIRO_AFECTA_ANTIGUEDAD_INSTITUCIONAL', true)
    });

    var histG = _tablaV2(ss, HOJA_V2.historialGrados, COL_HIST_GRADO, N_COLS_HIST_GRADO);
    var hg = null;
    for (var g = 0; g < histG.length; g++) {
      if (String(histG[g].voluntarioId) === String(voluntarioId) && !_texto(histG[g].fechaHasta)) hg = histG[g];
    }
    var enGrado = hg ? _calcularAntiguedadV2({
      desde: hg.fechaDesde,
      hasta: _parseDate(hg.fechaHasta) || hastaBase,
      periodos: periodos,
      descontar: _configSi(ss, 'RETIRO_AFECTA_ANTIGUEDAD_GRADO', false)
    }) : { ms: 0 };

    var histC = _tablaV2(ss, HOJA_V2.historialCargos, COL_HIST_CARGO, N_COLS_HIST_CARGO);
    var hc = null;
    for (var c = 0; c < histC.length; c++) {
      if (String(histC[c].voluntarioId) === String(voluntarioId) && !_texto(histC[c].fechaHasta)) hc = histC[c];
    }
    var enCargo = hc ? _calcularAntiguedadV2({
      desde: hc.fechaDesde,
      hasta: _parseDate(hc.fechaHasta) || hastaBase,
      periodos: periodos,
      descontar: _configSi(ss, 'RETIRO_AFECTA_ANTIGUEDAD_CARGO', false)
    }) : { ms: 0 };

    var aAnios = function (ms) { return Math.round(ms / (365.25 * 24 * 3600 * 1000) * 10) / 10; };
    return {
      institucionalAnios: aAnios(institucional.ms),
      enGradoAnios: aAnios(enGrado.ms),
      enCargoAnios: aAnios(enCargo.ms)
    };
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}