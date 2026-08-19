/**
 * 33_Usuarios.js — Dominio Usuarios y Permisos (fase 11).
 * Perfiles (PERFILES: Administrador, Encargado, Voluntario, Consulta) con matriz
 * base de permisos por módulo+acción en constantes; la tabla Permisos guarda
 * EXCEPCIONES (activo = otorga/revoca el permiso base).
 * API:
 *   listarPerfilesV2()
 *   listarUsuariosV2 / crearUsuarioV2 / actualizarUsuarioV2
 *   listarPermisosV2(filtros?) / agregarPermisoV2 / actualizarPermisoV2 / eliminarPermisoV2
 *   permisoUsuarioV2(correo) → {perfil, permisos:[{modulo, accion, permitido}], esExcepcion}
 */

// Matriz base de permisos: [perfil, modulo, accion]
var MATRIZ_PERMISOS_BASE = [
  ['Administrador', '*', '*'],
  ['Encargado', 'voluntarios', 'leer'],
  ['Encargado', 'voluntarios', 'escribir'],
  ['Encargado', 'gradosCargos', 'leer'],
  ['Encargado', 'gradosCargos', 'escribir'],
  ['Encargado', 'servicios', 'leer'],
  ['Encargado', 'servicios', 'escribir'],
  ['Encargado', 'asistencia', 'leer'],
  ['Encargado', 'asistencia', 'escribir'],
  ['Encargado', 'equipamiento', 'leer'],
  ['Encargado', 'equipamiento', 'escribir'],
  ['Encargado', 'reportes', 'leer'],
  ['Voluntario', 'voluntarios', 'leer'],
  ['Voluntario', 'servicios', 'leer'],
  ['Voluntario', 'asistencia', 'leer'],
  ['Voluntario', 'equipamiento', 'leer'],
  ['Consulta', 'voluntarios', 'leer'],
  ['Consulta', 'reportes', 'leer']
];

function listarPerfilesV2() {
  return _resOk(PERFILES.map(function (p) { return { nombre: p }; }));
}

function listarUsuariosV2() {
  try {
    var ss = _ss();
    var filas = _tablaV2(ss, HOJA_V2.usuarios, COL_USUARIO, N_COLS_USUARIO);
    var res = filas.map(function (f) {
      return {
        id: f.id,
        correo: String(f.correo || ''),
        perfil: String(f.perfil || ''),
        activo: _bool(f.activo, true),
        observaciones: String(f.observaciones || '')
      };
    });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function crearUsuarioV2(datos) {
  datos = datos || {};
  var ss = _ss();
  var correo = _texto(datos.correo).toLowerCase();
  if (!correo || correo.indexOf('@') === -1) return _resErr('DATOS_INCOMPLETOS', 'Correo: obligatorio y válido');
  var perfil = _texto(datos.perfil);
  if (PERFILES.indexOf(perfil) === -1) return _resErr('VALIDACION', 'Perfil debe ser: ' + PERFILES.join(', '));
  var existentes = _tablaV2(ss, HOJA_V2.usuarios, COL_USUARIO, N_COLS_USUARIO);
  for (var i = 0; i < existentes.length; i++) {
    if (_norm(existentes[i].correo) === _norm(correo)) return _resErr('DUPLICADO', 'El usuario ' + correo + ' ya existe');
  }
  var fila = {};
  fila[COL_USUARIO.correo] = correo;
  fila[COL_USUARIO.perfil] = perfil;
  fila[COL_USUARIO.activo] = true;
  fila[COL_USUARIO.observaciones] = _texto(datos.observaciones);
  var res = _insertarFilaV2(ss, HOJA_V2.usuarios, COL_USUARIO, N_COLS_USUARIO, fila);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.usuarios, 'crearUsuarioV2', 'OK', res.data.id + ' — ' + correo + ' [' + perfil + ']');
  return _resOk({ id: res.data.id });
}

function actualizarUsuarioV2(id, cambios) {
  cambios = cambios || {};
  var ss = _ss();
  var aplicar = {};
  var errores = [];
  if (cambios.correo !== undefined) {
    var correo = _texto(cambios.correo).toLowerCase();
    if (!correo || correo.indexOf('@') === -1) errores.push('Correo: obligatorio y válido');
    else aplicar[COL_USUARIO.correo] = correo;
  }
  if (cambios.perfil !== undefined) {
    var perfil = _texto(cambios.perfil);
    if (PERFILES.indexOf(perfil) === -1) errores.push('Perfil debe ser: ' + PERFILES.join(', '));
    else aplicar[COL_USUARIO.perfil] = perfil;
  }
  if (cambios.activo !== undefined) aplicar[COL_USUARIO.activo] = _bool(cambios.activo, true);
  if (cambios.observaciones !== undefined) aplicar[COL_USUARIO.observaciones] = _texto(cambios.observaciones);
  if (errores.length) return _resErr('VALIDACION', errores.join('\n'));
  var res = _actualizarFilaV2(ss, HOJA_V2.usuarios, COL_USUARIO, N_COLS_USUARIO, id, aplicar);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.usuarios, 'actualizarUsuarioV2', 'OK', id);
  return _resOk({ id: id });
}

// ============ PERMISOS (excepciones sobre la matriz base) ============

function listarPermisosV2(filtros) {
  filtros = filtros || {};
  try {
    var ss = _ss();
    var filas = _tablaV2(ss, HOJA_V2.permisos, COL_PERMISO, N_COLS_PERMISO);
    if (filtros.perfil) filas = filas.filter(function (p) { return String(p.perfil) === String(filtros.perfil); });
    var res = filas.map(function (p) {
      return {
        id: p.id,
        perfil: String(p.perfil || ''),
        modulo: String(p.modulo || ''),
        accion: String(p.accion || ''),
        activo: _bool(p.activo, true),
        observaciones: String(p.observaciones || '')
      };
    });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function agregarPermisoV2(datos) {
  datos = datos || {};
  var ss = _ss();
  var perfil = _texto(datos.perfil);
  var modulo = _texto(datos.modulo);
  var accion = _texto(datos.accion);
  if (PERFILES.indexOf(perfil) === -1) return _resErr('VALIDACION', 'Perfil debe ser: ' + PERFILES.join(', '));
  if (!modulo || !accion) return _resErr('DATOS_INCOMPLETOS', 'Módulo y acción: obligatorios');
  var fila = {};
  fila[COL_PERMISO.perfil] = perfil;
  fila[COL_PERMISO.modulo] = modulo;
  fila[COL_PERMISO.accion] = accion;
  fila[COL_PERMISO.activo] = _bool(datos.activo, true);
  fila[COL_PERMISO.observaciones] = _texto(datos.observaciones);
  var res = _insertarFilaV2(ss, HOJA_V2.permisos, COL_PERMISO, N_COLS_PERMISO, fila);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.permisos, 'agregarPermisoV2', 'OK', res.data.id + ' — ' + perfil + ':' + modulo + '/' + accion);
  return _resOk({ id: res.data.id });
}

function actualizarPermisoV2(id, cambios) {
  cambios = cambios || {};
  var ss = _ss();
  var aplicar = {};
  if (cambios.activo !== undefined) aplicar[COL_PERMISO.activo] = _bool(cambios.activo, true);
  if (cambios.observaciones !== undefined) aplicar[COL_PERMISO.observaciones] = _texto(cambios.observaciones);
  var res = _actualizarFilaV2(ss, HOJA_V2.permisos, COL_PERMISO, N_COLS_PERMISO, id, aplicar);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.permisos, 'actualizarPermisoV2', 'OK', id);
  return _resOk({ id: id });
}

/**
 * Revoca lógicamente una excepción de permiso (V3.3): NO elimina la fila; la
 * marca activo=false y registra el motivo en observaciones. Es equivalente a
 * `actualizarPermisoV2(id, {activo:false})` pero mantiene el lenguaje de la UI.
 * datos: {motivo?} — opcional y compatible con la firma previa (id).
 */
function eliminarPermisoV2(id, datos) {
  var ss = _ss();
  var res = _cerrarFilaV2(ss, HOJA_V2.permisos, COL_PERMISO, N_COLS_PERMISO, id, datos || {}, 'activo', false, 'Revocación (V3.3)');
  if (!res.ok) return res;
  _log(ss, HOJA_V2.permisos, 'eliminarPermisoV2', 'OK', id + (res.data.yaCerrado ? ' (ya revocado)' : ''));
  return res;
}

/**
 * Permisos efectivos de un correo: perfil del usuario + matriz base + excepciones.
 * Excepción activa=true otorga lo que la matriz no daba; activa=false lo revoca.
 */
function permisoUsuarioV2(correo) {
  correo = _texto(correo).toLowerCase();
  try {
    var ss = _ss();
    var usuario = null;
    var usuarios = _tablaV2(ss, HOJA_V2.usuarios, COL_USUARIO, N_COLS_USUARIO);
    for (var i = 0; i < usuarios.length; i++) {
      if (_norm(usuarios[i].correo) === _norm(correo) && _bool(usuarios[i].activo, true)) { usuario = usuarios[i]; break; }
    }
    if (!usuario) return _resOk({ correo: correo, perfil: 'Consulta', permisos: [], esExcepcion: false });
    var perfil = String(usuario.perfil || 'Consulta');
    var mapa = {};
    for (var m = 0; m < MATRIZ_PERMISOS_BASE.length; m++) {
      var row = MATRIZ_PERMISOS_BASE[m];
      if (row[0] !== perfil) continue;
      var clave = row[1] + '/' + row[2];
      mapa[clave] = { modulo: row[1], accion: row[2], permitido: true, base: true };
    }
    var excepciones = _tablaV2(ss, HOJA_V2.permisos, COL_PERMISO, N_COLS_PERMISO).filter(function (p) {
      return String(p.perfil) === perfil;
    });
    var esExcepcion = excepciones.length > 0;
    for (var e = 0; e < excepciones.length; e++) {
      var clave2 = String(excepciones[e].modulo || '') + '/' + String(excepciones[e].accion || '');
      mapa[clave2] = { modulo: String(excepciones[e].modulo || ''), accion: String(excepciones[e].accion || ''), permitido: _bool(excepciones[e].activo, true), base: false };
    }
    var permisos = [];
    for (var k in mapa) {
      if (Object.prototype.hasOwnProperty.call(mapa, k)) permisos.push(mapa[k]);
    }
    permisos.sort(function (a, b) { return a.modulo.localeCompare(b.modulo) || a.accion.localeCompare(b.accion); });
    return _resOk({ correo: correo, perfil: perfil, permisos: permisos, esExcepcion: esExcepcion });
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

/** Helper para el frontend: ¿puede este correo hacer modulo/accion? */
function puedeV2(correo, modulo, accion) {
  var res = permisoUsuarioV2(correo);
  if (!res.ok) return false;
  var p = res.data;
  if (p.perfil === 'Administrador') return true;
  for (var i = 0; i < p.permisos.length; i++) {
    var perm = p.permisos[i];
    if (perm.modulo === '*' || perm.modulo === modulo) {
      if (perm.accion === '*' || perm.accion === accion) return perm.permitido;
    }
  }
  return false;
}