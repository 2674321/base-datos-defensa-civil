/**
 * 28_Asistencia.js — Dominio Asistencia (fase 6).
 * 1 fila = 1 marcaje de un voluntario a un servicio. Estados CONFIGURABLES
 * (semilla: Asignado, Presente, Ausente, Ausente justificado, Reemplazado, Retirado).
 * Tipos (ROF-S Art. 18): Operativa / Régimen e instrucción.
 * Resúmenes: FUERZA TOTAL / FORMAN (Presente) / FALTAN.
 * Los % mínimos viven en Config (MIN_ASIST_*) — el sistema INFORMA, no sanciona.
 * API:
 *   listarEstadosAsistenciaV2 / crearEstadoAsistenciaV2
 *   registrarAsistenciaV2(servicioId, registros[])  [batch, upsert por servicio+voluntario]
 *   obtenerAsistenciaServicioV2(servicioId)         [con resumen FUERZA TOTAL/FORMAN/FALTAN]
 *   obtenerResumenAsistenciaVoluntarioV2(voluntarioId)
 *   obtenerEstadisticasAsistenciaV2({anio, trimestre})
 */

function listarEstadosAsistenciaV2() {
  try {
    var ss = _ss();
    var filas = _tablaV2(ss, HOJA_V2.estadosAsistencia, COL_CATALOGO_LISTA, N_COLS_CATALOGO_LISTA);
    var res = filas.map(function (f) {
      return { id: f.id, nombre: String(f.nombre || ''), origen: String(f.origen || 'CONFIGURABLE'), activo: _bool(f.activo, true) };
    }).sort(function (a, b) { return _norm(a.nombre).localeCompare(_norm(b.nombre)); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function crearEstadoAsistenciaV2(datos) {
  datos = datos || {};
  var ss = _ss();
  var nombre = _titulo(datos.nombre);
  if (!nombre) return _resErr('DATOS_INCOMPLETOS', 'Nombre del estado: obligatorio');
  var existentes = _tablaV2(ss, HOJA_V2.estadosAsistencia, COL_CATALOGO_LISTA, N_COLS_CATALOGO_LISTA);
  for (var i = 0; i < existentes.length; i++) {
    if (_norm(existentes[i].nombre) === _norm(nombre)) return _resErr('DUPLICADO', 'El estado "' + nombre + '" ya existe');
  }
  var fila = {};
  fila[COL_CATALOGO_LISTA.nombre] = nombre;
  fila[COL_CATALOGO_LISTA.origen] = 'CONFIGURABLE';
  fila[COL_CATALOGO_LISTA.activo] = true;
  var res = _insertarFilaV2(ss, HOJA_V2.estadosAsistencia, COL_CATALOGO_LISTA, N_COLS_CATALOGO_LISTA, fila);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.estadosAsistencia, 'crearEstadoAsistenciaV2', 'OK', res.data.id + ' — ' + nombre);
  return _resOk({ id: res.data.id });
}

/**
 * Registra asistencia de varios voluntarios a un servicio (1 llamada, N marcajes).
 * registros: [{voluntarioId, estado, tipoAsistencia?, horas?, motivo?, observaciones?}]
 * Upsert: si ya existe un marcaje para el servicio+voluntario, lo actualiza.
 */
function registrarAsistenciaV2(servicioId, registros) {
  registros = registros || [];
  var ss = _ss();
  if (!Array.isArray(registros) || !registros.length) return _resErr('DATOS_INCOMPLETOS', 'Indica al menos un marcaje');
  var servicio = _buscarV2(ss, HOJA_V2.servicios, COL_SERVICIO, N_COLS_SERVICIO, function (s) {
    return String(s.id) === String(servicioId);
  });
  if (!servicio) return _resErr('NO_ENCONTRADO', 'Servicio ' + servicioId + ' no existe');

  var estados = listarEstadosAsistenciaV2().data.map(function (e) { return e.nombre; });
  var voluntarios = _tablaV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2);
  var validos = {};
  for (var v = 0; v < voluntarios.length; v++) validos[String(voluntarios[v].id)] = true;

  var existentes = _tablaV2(ss, HOJA_V2.asistencia, COL_ASISTENCIA, N_COLS_ASISTENCIA);
  var filaPorClave = {};
  for (var e = 0; e < existentes.length; e++) {
    if (String(existentes[e].servicioId) === String(servicioId)) {
      filaPorClave[String(existentes[e].voluntarioId)] = existentes[e];
    }
  }

  var errores = [];
  var aplicados = 0;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  try {
    for (var i = 0; i < registros.length; i++) {
      var r = registros[i] || {};
      var vid = String(r.voluntarioId || '');
      if (!validos[vid]) { errores.push('Voluntario ' + vid + ' no existe'); continue; }
      var estado = _texto(r.estado);
      if (!estado || (estados.length && estados.indexOf(estado) === -1)) {
        errores.push('Voluntario ' + vid + ': estado inválido (' + estados.join(', ') + ')');
        continue;
      }
      var tipo = _texto(r.tipoAsistencia) || 'Operativa';
      if (TIPOS_ASISTENCIA.indexOf(tipo) === -1) { errores.push('Voluntario ' + vid + ': tipo inválido'); continue; }
      var horas = Number(r.horas || 0);
      if (isNaN(horas) || horas < 0) { errores.push('Voluntario ' + vid + ': horas inválidas'); continue; }

      var fila = {};
      fila[COL_ASISTENCIA.servicioId] = servicioId;
      fila[COL_ASISTENCIA.voluntarioId] = vid;
      fila[COL_ASISTENCIA.tipoAsistencia] = tipo;
      fila[COL_ASISTENCIA.estado] = estado;
      fila[COL_ASISTENCIA.horas] = horas || '';
      fila[COL_ASISTENCIA.motivo] = _texto(r.motivo);
      fila[COL_ASISTENCIA.responsableRegistro] = _texto(r.responsableRegistro);
      fila[COL_ASISTENCIA.observaciones] = _texto(r.observaciones);

      var previa = filaPorClave[vid];
      var res;
      if (previa) {
        res = _actualizarFilaV2(ss, HOJA_V2.asistencia, COL_ASISTENCIA, N_COLS_ASISTENCIA, previa.id, fila);
      } else {
        res = _insertarFilaV2(ss, HOJA_V2.asistencia, COL_ASISTENCIA, N_COLS_ASISTENCIA, fila);
      }
      if (res.ok) { aplicados++; filaPorClave[vid] = fila; }
    }
    _log(ss, HOJA_V2.asistencia, 'registrarAsistenciaV2', aplicados ? 'OK' : 'ERROR', 'Servicio ' + servicioId + ' — ' + aplicados + ' marcaje(s)' + (errores.length ? '; errores: ' + errores.length : ''));
    if (aplicados === 0 && errores.length) return _resErr('VALIDACION', errores.join('\n'));
    return _resOk({ aplicados: aplicados, errores: errores });
  } finally {
    lock.releaseLock();
  }
}

function _resumenAsistencia(filas) {
  var fuerza = filas.length;
  var presentes = 0;
  var faltan = 0;
  var porEstado = {};
  for (var i = 0; i < filas.length; i++) {
    var est = String(filas[i].estado || '');
    porEstado[est] = (porEstado[est] || 0) + 1;
    if (est === 'Presente') presentes++;
    else if (est !== 'Asignado' && est !== 'Retirado') faltan++;
  }
  return {
    fuerzaTotal: fuerza,
    forman: presentes,
    faltan: faltan,
    porEstado: porEstado
  };
}

function obtenerAsistenciaServicioV2(servicioId) {
  try {
    var ss = _ss();
    var filas = _tablaV2(ss, HOJA_V2.asistencia, COL_ASISTENCIA, N_COLS_ASISTENCIA).filter(function (a) {
      return String(a.servicioId) === String(servicioId);
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
    var res = filas.map(function (a) {
      return {
        id: a.id,
        voluntarioId: String(a.voluntarioId || ''),
        voluntario: nombrePorVol[String(a.voluntarioId)] || '—',
        tipoAsistencia: String(a.tipoAsistencia || ''),
        estado: String(a.estado || ''),
        horas: Number(a.horas || 0),
        motivo: String(a.motivo || ''),
        responsableRegistro: String(a.responsableRegistro || ''),
        observaciones: String(a.observaciones || '')
      };
    });
    return _resOk({ servicioId: servicioId, resumen: _resumenAsistencia(filas), registros: res });
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function obtenerResumenAsistenciaVoluntarioV2(voluntarioId) {
  try {
    var ss = _ss();
    var filas = _tablaV2(ss, HOJA_V2.asistencia, COL_ASISTENCIA, N_COLS_ASISTENCIA).filter(function (a) {
      return String(a.voluntarioId) === String(voluntarioId);
    });
    var porTipo = { 'Operativa': { total: 0, presente: 0, ausente: 0, otros: 0 }, 'Régimen e instrucción': { total: 0, presente: 0, ausente: 0, otros: 0 } };
    for (var i = 0; i < filas.length; i++) {
      var t = String(filas[i].tipoAsistencia || 'Operativa');
      if (!porTipo[t]) porTipo[t] = { total: 0, presente: 0, ausente: 0, otros: 0 };
      porTipo[t].total++;
      var est = String(filas[i].estado || '');
      if (est === 'Presente') porTipo[t].presente++;
      else if (est === 'Ausente' || est === 'Ausente justificado') porTipo[t].ausente++;
      else porTipo[t].otros++;
    }
    return _resOk({ total: filas.length, porTipo: porTipo });
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

/**
 * Estadísticas de asistencia por período. Los % mínimos de Config se entregan
 * como referencia comparativa — el sistema informa, no sanciona.
 */
function obtenerEstadisticasAsistenciaV2(opciones) {
  opciones = opciones || {};
  try {
    var ss = _ss();
    var filas = _tablaV2(ss, HOJA_V2.asistencia, COL_ASISTENCIA, N_COLS_ASISTENCIA);
    var servicios = _tablaV2(ss, HOJA_V2.servicios, COL_SERVICIO, N_COLS_SERVICIO);
    var porServicio = {};
    for (var s = 0; s < servicios.length; s++) porServicio[String(servicios[s].id)] = servicios[s];
    var anio = opciones.anio ? Number(opciones.anio) : new Date().getFullYear();
    var trimestre = opciones.trimestre ? Number(opciones.trimestre) : 0;
    var filasMes = {};
    for (var m = 1; m <= 12; m++) filasMes[m] = { total: 0, presentes: 0, ausentes: 0 };
    var total = 0, presentes = 0, ausentes = 0;

    for (var i = 0; i < filas.length; i++) {
      var f = filas[i];
      var serv = porServicio[String(f.servicioId)];
      var fecha = serv ? _parseDate(serv.fecha) : null;
      if (!fecha || fecha.getFullYear() !== anio) continue;
      if (trimestre > 0 && Math.floor(fecha.getMonth() / 3) + 1 !== trimestre) continue;
      total++;
      var est = String(f.estado || '');
      if (est === 'Presente') { presentes++; filasMes[fecha.getMonth() + 1].presentes++; }
      else if (est === 'Ausente' || est === 'Ausente justificado') { ausentes++; filasMes[fecha.getMonth() + 1].ausentes++; }
      filasMes[fecha.getMonth() + 1].total++;
    }
    var minVolReg = _configNumero(ss, 'MIN_ASIST_VOLUNTARIOS_REGIMEN', 50);
    var minVolOp = _configNumero(ss, 'MIN_ASIST_VOLUNTARIOS_OPERATIVA', 60);
    var minDispReg = _configNumero(ss, 'MIN_ASIST_DISPONIBLES_REGIMEN', 70);
    var minDispOp = _configNumero(ss, 'MIN_ASIST_DISPONIBLES_OPERATIVA', 80);
    return _resOk({
      anio: anio,
      trimestre: trimestre || null,
      resumen: { total: total, presentes: presentes, ausentes: ausentes },
      porcentajePresencia: total ? Math.round((presentes / total) * 1000) / 10 : 0,
      porMes: Object.keys(filasMes).map(function (k) {
        return { mes: Number(k), total: filasMes[k].total, presentes: filasMes[k].presentes, ausentes: filasMes[k].ausentes };
      }),
      minimosReferencia: {
        voluntariosRegimen: minVolReg,
        voluntariosOperativa: minVolOp,
        disponiblesRegimen: minDispReg,
        disponiblesOperativa: minDispOp
      },
      nota: 'Los porcentajes mínimos son de referencia (ROF-S Art. 18) — el sistema informa, no sanciona.'
    });
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}