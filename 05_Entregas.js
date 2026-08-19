/**
 * 05_Entregas.js — Dominio equipamiento: Catálogo → Inventario → Entregas → Voluntario.
 *
 * CAPA BACKEND (API JSON, llamable por la futura Web App vía google.script.run):
 *   crearElemento(datos)                  → {ok, data:{id}}         (catálogo)
 *   actualizarElemento(id, cambios)       → {ok, data:{id}}
 *   buscarElementos(consulta)             → {ok, data:[...]}
 *   registrarEntradaInventario(datos)     → {ok, data:{id, cantidad}} (inventario)
 *   ajustarInventario(id, cambios)        → {ok, data:{id}}
 *   obtenerInventario(filtros)            → {ok, data:[...]}
 *   buscarInventario(consulta)            → {ok, data:[...]}
 *   registrarEntrega(datos)               → {ok, data:{id}}         (entregas)
 *   registrarDevolucion(idEntrega, datos) → {ok, data:{id, estado}}
 *   obtenerEquipamientoVoluntario(voluntarioId) → {ok, data:[...]}
 *   obtenerHistorialEntregas(voluntarioId?)     → {ok, data:[...]}
 *   obtenerEntrega(idEntrega)             → {ok, data:{entrega}}    (para boleta futura)
 *
 * Respuestas canónicas {ok, data, error} (01_Utilidades.js). Nunca dependen de la
 * edición manual de hojas ni de ui.prompt/ui.alert.
 *
 * CAPA UI (menús provisionales): menuRegistrarElemento, menuRegistrarEntradaInventario,
 * menuRegistrarEntrega, menuRegistrarDevolucion, menuBuscarElemento, menuEquipamientoVoluntario.
 *
 * Todas las operaciones leen/escriben por bloques; ninguna celda a celda.
 * Concurrencia: LockService en todas las escrituras.
 */

// ============ CATÁLOGO (tipo de elemento) ============

function crearElemento(datos) {
  datos = datos || {};
  var ss = _ss();
  var sh = ss.getSheetByName(HOJA.catalogo);
  if (!sh) return _resErr('ESTRUCTURA_NO_CREADA', 'Estructura no creada: ejecuta menú ⚙️ Sistema → Crear estructura base');
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  try {
    var elemento = _titulo(datos.elemento);
    if (!elemento) return _resErr('DATOS_INCOMPLETOS', 'Elemento: obligatorio');
    var catalogo = _leerCatalogo(ss);
    for (var i = 0; i < catalogo.length; i++) {
      if (_norm(catalogo[i].elemento) === _norm(elemento)) {
        return _resErr('DUPLICADO', 'El elemento "' + catalogo[i].elemento + '" ya existe (' + catalogo[i].id + ')');
      }
    }
    var tipo = _texto(datos.tipo);
    var tipos = _configLista(ss, 'TIPOS_ELEMENTO');
    if (tipo && tipos.length && tipos.indexOf(tipo) === -1) {
      return _resErr('VALIDACION', 'Tipo debe ser: ' + tipos.join(', '));
    }
    var requiereTalla = _bool(datos.requiereTalla, true);
    var requiereDevolucion = _bool(datos.requiereDevolucion, true);
    var nextId = _siguienteIdPrefijo(catalogo.map(function (c) { return c.id; }), ID_PREFIJOS.catalogo);
    // V2: área (Áreas V2) + tallas sugeridas (campo libre) — columnas 8 y 9
    var fila = [nextId, elemento, tipo, requiereTalla, requiereDevolucion, true, _texto(datos.observaciones), _texto(datos.areaId), _texto(datos.tallas)];
    sh.getRange(Math.max(PRIMERA_FILA_DATO, sh.getLastRow() + 1), 1, 1, N_COLS_CATALOGO).setValues([fila]);
    _log(ss, HOJA.catalogo, 'crearElemento', 'OK', nextId + ' — ' + elemento);
    return _resOk({ id: nextId });
  } finally {
    lock.releaseLock();
  }
}

function actualizarElemento(id, cambios) {
  cambios = cambios || {};
  var ss = _ss();
  var sh = ss.getSheetByName(HOJA.catalogo);
  if (!sh) return _resErr('ESTRUCTURA_NO_CREADA', 'Estructura no creada');
  var filaN = _filaPorIdEn(sh, id);
  if (!filaN) return _resErr('NO_ENCONTRADO', 'Elemento ' + id + ' no existe');
  var filaActual = sh.getRange(filaN, 1, 1, N_COLS_CATALOGO).getValues()[0];
  if (cambios.elemento !== undefined) {
    var nombre = _titulo(cambios.elemento);
    if (!nombre) return _resErr('DATOS_INCOMPLETOS', 'Elemento: obligatorio');
    var catalogo = _leerCatalogo(ss);
    for (var i = 0; i < catalogo.length; i++) {
      if (catalogo[i].id !== id && _norm(catalogo[i].elemento) === _norm(nombre)) {
        return _resErr('DUPLICADO', 'El elemento "' + catalogo[i].elemento + '" ya existe (' + catalogo[i].id + ')');
      }
    }
    filaActual[COL_CATALOGO.elemento - 1] = nombre;
  }
  if (cambios.tipo !== undefined) {
    var tipo = _texto(cambios.tipo);
    var tipos = _configLista(ss, 'TIPOS_ELEMENTO');
    if (tipo && tipos.length && tipos.indexOf(tipo) === -1) {
      return _resErr('VALIDACION', 'Tipo debe ser: ' + tipos.join(', '));
    }
    filaActual[COL_CATALOGO.tipo - 1] = tipo;
  }
  if (cambios.requiereTalla !== undefined) filaActual[COL_CATALOGO.requiereTalla - 1] = _bool(cambios.requiereTalla, true);
  if (cambios.requiereDevolucion !== undefined) filaActual[COL_CATALOGO.requiereDevolucion - 1] = _bool(cambios.requiereDevolucion, true);
  if (cambios.activo !== undefined) filaActual[COL_CATALOGO.activo - 1] = _bool(cambios.activo, true);
  if (cambios.observaciones !== undefined) filaActual[COL_CATALOGO.observaciones - 1] = _texto(cambios.observaciones);
  if (cambios.areaId !== undefined) filaActual[COL_CATALOGO.areaId - 1] = _texto(cambios.areaId);
  if (cambios.tallas !== undefined) filaActual[COL_CATALOGO.tallas - 1] = _texto(cambios.tallas);
  sh.getRange(filaN, 1, 1, N_COLS_CATALOGO).setValues([filaActual]);
  _log(ss, HOJA.catalogo, 'actualizarElemento', 'OK', id);
  return _resOk({ id: id });
}

/** V2: catálogo con área y tallas sugeridas. */
function listarElementosV2() {
  return buscarElementos('');
}

function buscarElementos(consulta) {
  var ss = _ss();
  var q = _norm(consulta);
  var res = [];
  var catalogo = _leerCatalogo(ss);
  for (var i = 0; i < catalogo.length; i++) {
    var c = catalogo[i];
    if (!q || _norm(c.elemento).indexOf(q) !== -1 || _norm(c.tipo).indexOf(q) !== -1 || _norm(c.id).indexOf(q) !== -1) {
      res.push({
        id: c.id,
        elemento: c.elemento,
        tipo: c.tipo,
        requiereTalla: c.requiereTalla,
        requiereDevolucion: c.requiereDevolucion,
        activo: c.activo,
        areaId: c.areaId,
        tallas: c.tallas,
        observaciones: c.observaciones
      });
    }
  }
  return _resOk(res);
}

// ============ INVENTARIO FÍSICO (existencias reales) ============

function registrarEntradaInventario(datos) {
  datos = datos || {};
  var ss = _ss();
  var shC = ss.getSheetByName(HOJA.catalogo);
  var shI = ss.getSheetByName(HOJA.inventario);
  if (!shC || !shI) return _resErr('ESTRUCTURA_NO_CREADA', 'Estructura no creada: ejecuta Crear estructura base');
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  try {
    var catalogo = _leerCatalogo(ss);
    var elemento = null;
    for (var i = 0; i < catalogo.length; i++) {
      if (catalogo[i].id === _texto(datos.elementoId)) { elemento = catalogo[i]; break; }
    }
    if (!elemento) return _resErr('NO_ENCONTRADO', 'Elemento ' + _texto(datos.elementoId) + ' no existe en el catálogo');
    if (!elemento.activo) return _resErr('ELEMENTO_INACTIVO', 'El elemento "' + elemento.elemento + '" está inactivo');

    var t = _normalizarTalla(elemento.requiereTalla, datos.talla);
    if (!t.ok) return _resErr('VALIDACION', t.mensaje);

    var cantidad = _cantidadEntera(datos.cantidad, 1);
    if (cantidad === null) return _resErr('CANTIDAD_INVALIDA', 'Cantidad: debe ser un entero mayor que 0');
    var serie = _texto(datos.serie);
    if (serie && cantidad !== 1) return _resErr('CANTIDAD_INVALIDA', 'Con N° Serie la cantidad debe ser 1');

    var estado = _texto(datos.estado) || ESTADO_INVENTARIO_DEFECTO;
    if (ESTADOS_INVENTARIO.indexOf(estado) === -1) {
      return _resErr('VALIDACION', 'Estado debe ser: ' + ESTADOS_INVENTARIO.join(', '));
    }

    var filas = _leerInventario(ss);
    if (serie) {
      for (var j = 0; j < filas.length; j++) {
        if (filas[j].serie === serie) {
          return _resErr('DUPLICADO', 'El N° de serie ya existe (' + filas[j].id + ')');
        }
      }
    }
    var res = _sumarStock(ss, filas, elemento.id, elemento.elemento, t.talla, estado, serie, cantidad, _texto(datos.observaciones), _texto(datos.ubicacion), _texto(datos.serieSede));
    _log(ss, HOJA.inventario, 'registrarEntradaInventario', 'OK', res.id + ' — ' + elemento.elemento + ' ' + t.talla + ' +' + cantidad + ' [' + estado + ']');
    return _resOk({ id: res.id, cantidad: cantidad });
  } finally {
    lock.releaseLock();
  }
}

function ajustarInventario(id, cambios) {
  cambios = cambios || {};
  var ss = _ss();
  var sh = ss.getSheetByName(HOJA.inventario);
  if (!sh) return _resErr('ESTRUCTURA_NO_CREADA', 'Estructura no creada');
  var filaN = _filaPorIdEn(sh, id);
  if (!filaN) return _resErr('NO_ENCONTRADO', 'Inventario ' + id + ' no existe');
  var filaActual = sh.getRange(filaN, 1, 1, N_COLS_INVENTARIO).getValues()[0];
  if (cambios.cantidad !== undefined) {
    var n = _cantidadEntera(cambios.cantidad, 0);
    if (n === null) return _resErr('CANTIDAD_INVALIDA', 'Cantidad: debe ser un entero >= 0');
    filaActual[COL_INVENTARIO.cantidad - 1] = n;
  }
  if (cambios.estado !== undefined) {
    var est = _texto(cambios.estado);
    if (ESTADOS_INVENTARIO.indexOf(est) === -1) {
      return _resErr('VALIDACION', 'Estado debe ser: ' + ESTADOS_INVENTARIO.join(', '));
    }
    filaActual[COL_INVENTARIO.estado - 1] = est;
  }
  if (cambios.observaciones !== undefined) filaActual[COL_INVENTARIO.observaciones - 1] = _texto(cambios.observaciones);
  if (cambios.ubicacion !== undefined) filaActual[COL_INVENTARIO.ubicacion - 1] = _texto(cambios.ubicacion);
  if (cambios.serieSede !== undefined) filaActual[COL_INVENTARIO.serieSede - 1] = _texto(cambios.serieSede);
  sh.getRange(filaN, 1, 1, N_COLS_INVENTARIO).setValues([filaActual]);
  _log(ss, HOJA.inventario, 'ajustarInventario', 'OK', id);
  return _resOk({ id: id });
}

/** V2: inventario con ubicación física y serie institucional. */
function listarInventarioV2() {
  return obtenerInventario({});
}

function obtenerInventario(filtros) {
  filtros = filtros || {};
  var ss = _ss();
  var salida = [];
  var filas = _leerInventario(ss);
  for (var i = 0; i < filas.length; i++) {
    var f = filas[i];
    if (filtros.elementoId && f.elementoId !== _texto(filtros.elementoId)) continue;
    if (filtros.talla && f.talla !== _texto(filtros.talla)) continue;
    if (filtros.estado && f.estado !== _texto(filtros.estado)) continue;
    salida.push({
      id: f.id,
      elementoId: f.elementoId,
      elemento: f.elemento,
      talla: f.talla,
      cantidad: f.cantidad,
      estado: f.estado,
      serie: f.serie,
      ubicacion: f.ubicacion,
      serieSede: f.serieSede,
      observaciones: f.observaciones
    });
  }
  return _resOk(salida);
}

function buscarInventario(consulta) {
  var ss = _ss();
  var q = _norm(consulta);
  var salida = [];
  var filas = _leerInventario(ss);
  for (var i = 0; i < filas.length; i++) {
    var f = filas[i];
    if (!q || _norm(f.id + ' ' + f.elementoId + ' ' + f.elemento + ' ' + f.talla + ' ' + f.estado + ' ' + f.serie + ' ' + f.ubicacion + ' ' + f.serieSede).indexOf(q) !== -1) {
      salida.push({
        id: f.id,
        elementoId: f.elementoId,
        elemento: f.elemento,
        talla: f.talla,
        cantidad: f.cantidad,
        estado: f.estado,
        serie: f.serie,
        ubicacion: f.ubicacion,
        serieSede: f.serieSede,
        observaciones: f.observaciones
      });
    }
  }
  return _resOk(salida);
}

// ============ ENTREGAS (movimientos) ============

function registrarEntrega(datos) {
  datos = datos || {};
  var ss = _ss();
  var shE = ss.getSheetByName(HOJA.entregas);
  if (!shE) return _resErr('ESTRUCTURA_NO_CREADA', 'Estructura no creada: ejecuta Crear estructura base');
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  try {
    // Voluntario
    var voluntarioId = _texto(datos.voluntarioId);
    if (!voluntarioId) return _resErr('DATOS_INCOMPLETOS', 'Voluntario ID: obligatorio');
    var filaV = _filaPorId(ss, voluntarioId);
    if (!filaV) return _resErr('NO_ENCONTRADO', 'Voluntario N° ' + voluntarioId + ' no existe');
    var filaVoluntario = ss.getSheetByName(HOJA.voluntarios).getRange(filaV, 1, 1, N_COLS).getValues()[0];
    var voluntarioObj = _filaAObjeto(filaVoluntario);

    // Inventario
    var inventarioId = _texto(datos.inventarioId);
    if (!inventarioId) return _resErr('DATOS_INCOMPLETOS', 'Inventario ID: obligatorio');
    var filasInv = _leerInventario(ss);
    var inv = null;
    for (var i = 0; i < filasInv.length; i++) {
      if (filasInv[i].id === inventarioId) { inv = filasInv[i]; break; }
    }
    if (!inv) return _resErr('NO_ENCONTRADO', 'Inventario ' + inventarioId + ' no existe');
    if (inv.estado !== ESTADO_INVENTARIO_DEFECTO) {
      return _resErr('ESTADO_INCOMPATIBLE', 'El inventario no está disponible (estado: ' + inv.estado + ')');
    }
    var cantidad = _cantidadEntera(datos.cantidad, 1);
    if (cantidad === null) return _resErr('CANTIDAD_INVALIDA', 'Cantidad: debe ser un entero mayor que 0');
    if (inv.serie && cantidad !== 1) return _resErr('CANTIDAD_INVALIDA', 'Unidades con N° Serie se entregan de a 1');
    if (cantidad > inv.cantidad) {
      return _resErr('STOCK_INSUFICIENTE', 'Stock insuficiente: hay ' + inv.cantidad + ' de ' + inv.elemento + (inv.talla ? ' ' + inv.talla : ''));
    }

    // Entrega duplicada: misma unidad de inventario al mismo voluntario con devolución pendiente
    var entregas = _leerEntregas(ss);
    for (var j = 0; j < entregas.length; j++) {
      var x = entregas[j];
      if (x.voluntarioId === voluntarioId && x.inventarioId === inventarioId && x.estado === ESTADO_ENTREGA_INICIAL) {
        return _resErr('ENTREGA_DUPLICADA', 'Ya existe una entrega pendiente de este elemento a este voluntario (' + x.id + ')');
      }
    }

    // Catálogo (reglas del elemento)
    var catalogo = _leerCatalogo(ss);
    var elemento = null;
    for (var k = 0; k < catalogo.length; k++) {
      if (catalogo[k].id === inv.elementoId) { elemento = catalogo[k]; break; }
    }
    if (!elemento) return _resErr('NO_ENCONTRADO', 'Elemento ' + inv.elementoId + ' no existe en el catálogo');
    if (!elemento.activo) return _resErr('ELEMENTO_INACTIVO', 'El elemento "' + elemento.elemento + '" está inactivo');

    var fechaEntrega = _texto(datos.fechaEntrega) ? _parseDate(datos.fechaEntrega) : new Date();
    if (!fechaEntrega) return _resErr('VALIDACION', 'Fecha de entrega inválida (dd/mm/aaaa)');
    var estadoEntrega = elemento.requiereDevolucion ? ESTADO_ENTREGA_INICIAL : ESTADO_ENTREGA_SIN_DEVOLUCION;

    // Actualizar stock
    var shInv = ss.getSheetByName(HOJA.inventario);
    var filaInvActual = shInv.getRange(inv.fila, 1, 1, N_COLS_INVENTARIO).getValues()[0];
    if (inv.serie) {
      filaInvActual[COL_INVENTARIO.estado - 1] = 'Entregado';
    } else {
      filaInvActual[COL_INVENTARIO.cantidad - 1] = Number(filaInvActual[COL_INVENTARIO.cantidad - 1] || 0) - cantidad;
    }
    shInv.getRange(inv.fila, 1, 1, N_COLS_INVENTARIO).setValues([filaInvActual]);

    // Crear entrega (con snapshots históricos)
    var nextId = _siguienteIdPrefijo(entregas.map(function (e) { return e.id; }), ID_PREFIJOS.entrega);
    var nueva = [
      nextId, voluntarioId, voluntarioObj.nombreCompleto, voluntarioObj.run,
      inv.id, elemento.id, elemento.elemento, inv.talla, cantidad,
      fechaEntrega, estadoEntrega, _texto(datos.responsable), '', 0, 0, 0, _texto(datos.observaciones)
    ];
    shE.getRange(Math.max(PRIMERA_FILA_DATO, shE.getLastRow() + 1), 1, 1, N_COLS_ENTREGA).setValues([nueva]);
    _log(ss, HOJA.entregas, 'registrarEntrega', 'OK', nextId + ' — Vol. ' + voluntarioId + ' — ' + elemento.elemento + ' x' + cantidad);
    return _resOk({ id: nextId });
  } finally {
    lock.releaseLock();
  }
}

function registrarDevolucion(idEntrega, datos) {
  datos = datos || {};
  var ss = _ss();
  var sh = ss.getSheetByName(HOJA.entregas);
  if (!sh) return _resErr('ESTRUCTURA_NO_CREADA', 'Estructura no creada');
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  try {
    var filaN = _filaPorIdEn(sh, idEntrega);
    if (!filaN) return _resErr('NO_ENCONTRADO', 'Entrega ' + idEntrega + ' no existe');
    var filaEntrega = sh.getRange(filaN, 1, 1, N_COLS_ENTREGA).getValues()[0];
    var estado = String(filaEntrega[COL_ENTREGA.estado - 1] || '');
    if (estado !== ESTADO_ENTREGA_INICIAL) {
      return _resErr('ESTADO_INCOMPATIBLE', 'La entrega ya fue cerrada (estado: ' + estado + ') — devolución duplicada');
    }

    var entregada = Number(filaEntrega[COL_ENTREGA.cantidad - 1] || 0);
    var devuelta = _cantidadEntera(datos.cantidadDevuelta, 0) || 0;
    var danada = _cantidadEntera(datos.cantidadDanada, 0) || 0;
    var extraviada = _cantidadEntera(datos.cantidadExtraviada, 0) || 0;
    if (devuelta + danada + extraviada < 1) {
      return _resErr('DATOS_INCOMPLETOS', 'Indica al menos una cantidad (devuelta, dañada o extraviada)');
    }
    if (devuelta + danada + extraviada > entregada) {
      return _resErr('VALIDACION', 'La suma de cantidades excede lo entregado (' + entregada + ')');
    }

    var estadoFinal = _estadoFinalDevolucion(entregada, devuelta, danada, extraviada);
    var obsNueva = _texto(datos.observaciones);

    // Actualizar inventario
    var inventarioId = String(filaEntrega[COL_ENTREGA.inventarioId - 1] || '');
    var elementoId = String(filaEntrega[COL_ENTREGA.elementoId - 1] || '');
    var elementoNombre = String(filaEntrega[COL_ENTREGA.elemento - 1] || '');
    var talla = String(filaEntrega[COL_ENTREGA.talla - 1] || '');
    var filasInv = _leerInventario(ss);
    var inv = null;
    for (var i = 0; i < filasInv.length; i++) {
      if (filasInv[i].id === inventarioId) { inv = filasInv[i]; break; }
    }
    if (inv && inv.serie) {
      // Unidad con N° Serie: la fila vuelve a su estado según el resultado
      var shInv = ss.getSheetByName(HOJA.inventario);
      var filaInvActual = shInv.getRange(inv.fila, 1, 1, N_COLS_INVENTARIO).getValues()[0];
      filaInvActual[COL_INVENTARIO.estado - 1] = estadoFinal === 'Dañado' ? 'Dañado' : (estadoFinal === 'Extraviado' ? 'Extraviado' : 'Disponible');
      shInv.getRange(inv.fila, 1, 1, N_COLS_INVENTARIO).setValues([filaInvActual]);
    } else {
      if (devuelta > 0) _sumarStock(ss, filasInv, elementoId, elementoNombre, talla, 'Disponible', '', devuelta, '', inv.ubicacion, inv.serieSede);
      if (danada > 0) _sumarStock(ss, filasInv, elementoId, elementoNombre, talla, 'Dañado', '', danada, '', inv.ubicacion, inv.serieSede);
      if (extraviada > 0) _sumarStock(ss, filasInv, elementoId, elementoNombre, talla, 'Extraviado', '', extraviada, '', inv.ubicacion, inv.serieSede);
    }

    // Cerrar la entrega (trazabilidad histórica intacta)
    filaEntrega[COL_ENTREGA.estado - 1] = estadoFinal;
    filaEntrega[COL_ENTREGA.fechaDevolucion - 1] = new Date();
    filaEntrega[COL_ENTREGA.cantidadDevuelta - 1] = devuelta;
    filaEntrega[COL_ENTREGA.cantidadDanada - 1] = danada;
    filaEntrega[COL_ENTREGA.cantidadExtraviada - 1] = extraviada;
    if (obsNueva) {
      var prev = _texto(filaEntrega[COL_ENTREGA.observaciones - 1]);
      filaEntrega[COL_ENTREGA.observaciones - 1] = prev ? prev + '\n' + obsNueva : obsNueva;
    }
    sh.getRange(filaN, 1, 1, N_COLS_ENTREGA).setValues([filaEntrega]);
    _log(ss, HOJA.entregas, 'registrarDevolucion', 'OK', idEntrega + ' → ' + estadoFinal + ' (dev ' + devuelta + ' / dañ ' + danada + ' / ext ' + extraviada + ')');
    return _resOk({ id: idEntrega, estado: estadoFinal });
  } finally {
    lock.releaseLock();
  }
}

function obtenerEquipamientoVoluntario(voluntarioId) {
  var ss = _ss();
  var list = _leerEntregas(ss).filter(function (x) {
    return x.voluntarioId === _texto(voluntarioId);
  }).reverse();
  return _resOk(list);
}

function obtenerHistorialEntregas(voluntarioId) {
  var ss = _ss();
  var list = _leerEntregas(ss);
  if (_texto(voluntarioId)) {
    list = list.filter(function (x) { return x.voluntarioId === _texto(voluntarioId); });
  }
  return _resOk(list.reverse());
}

function obtenerEntrega(idEntrega) {
  var ss = _ss();
  var entregas = _leerEntregas(ss);
  for (var i = 0; i < entregas.length; i++) {
    if (entregas[i].id === _texto(idEntrega)) return _resOk({ entrega: entregas[i] });
  }
  return _resErr('NO_ENCONTRADO', 'Entrega ' + idEntrega + ' no existe');
}

// ============ CAPA UI (menús provisionales — NO es la interfaz final) ============

function menuRegistrarElemento() {
  var ss = _ss();
  var sh = ss.getSheetByName(HOJA.catalogo);
  if (!sh) {
    ss.toast('Primero crea la estructura: menú ⚙️ Sistema → Crear estructura base', '⚠️', 8);
    return;
  }
  var entrada = sh.getRange(FILA_ENTRADA, 1, 1, N_COLS_CATALOGO).getValues()[0];
  var res = crearElemento({
    elemento: entrada[COL_CATALOGO.elemento - 1],
    tipo: entrada[COL_CATALOGO.tipo - 1],
    requiereTalla: entrada[COL_CATALOGO.requiereTalla - 1],
    requiereDevolucion: entrada[COL_CATALOGO.requiereDevolucion - 1],
    observaciones: entrada[COL_CATALOGO.observaciones - 1],
    areaId: entrada[COL_CATALOGO.areaId - 1],
    tallas: entrada[COL_CATALOGO.tallas - 1]
  });
  if (!res.ok) {
    SpreadsheetApp.getUi().alert('⚠️ ' + res.error.message, '', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  sh.getRange(FILA_ENTRADA, 2, 1, N_COLS_CATALOGO - 1).clearContent();
  ss.toast('Elemento ' + res.data.id + ' creado ✔', PROYECTO.nombre, 6);
}

function menuRegistrarEntradaInventario() {
  var ss = _ss();
  var sh = ss.getSheetByName(HOJA.inventario);
  if (!sh) {
    ss.toast('Primero crea la estructura: menú ⚙️ Sistema → Crear estructura base', '⚠️', 8);
    return;
  }
  var entrada = sh.getRange(FILA_ENTRADA, 1, 1, N_COLS_INVENTARIO).getValues()[0];
  var res = registrarEntradaInventario({
    elementoId: entrada[COL_INVENTARIO.elementoId - 1],
    talla: entrada[COL_INVENTARIO.talla - 1],
    cantidad: entrada[COL_INVENTARIO.cantidad - 1],
    estado: entrada[COL_INVENTARIO.estado - 1],
    serie: entrada[COL_INVENTARIO.serie - 1],
    observaciones: entrada[COL_INVENTARIO.observaciones - 1],
    ubicacion: entrada[COL_INVENTARIO.ubicacion - 1],
    serieSede: entrada[COL_INVENTARIO.serieSede - 1]
  });
  if (!res.ok) {
    SpreadsheetApp.getUi().alert('⚠️ ' + res.error.message, '', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  sh.getRange(FILA_ENTRADA, 2, 1, N_COLS_INVENTARIO - 1).clearContent();
  ss.toast('Entrada registrada en ' + res.data.id + ' ✔', PROYECTO.nombre, 6);
}

function menuRegistrarEntrega() {
  var ss = _ss();
  var sh = ss.getSheetByName(HOJA.entregas);
  if (!sh) {
    ss.toast('Primero crea la estructura: menú ⚙️ Sistema → Crear estructura base', '⚠️', 8);
    return;
  }
  var entrada = sh.getRange(FILA_ENTRADA, 1, 1, N_COLS_ENTREGA).getValues()[0];
  var res = registrarEntrega({
    voluntarioId: entrada[COL_ENTREGA.voluntarioId - 1],
    inventarioId: entrada[COL_ENTREGA.inventarioId - 1],
    cantidad: entrada[COL_ENTREGA.cantidad - 1],
    responsable: entrada[COL_ENTREGA.responsable - 1],
    observaciones: entrada[COL_ENTREGA.observaciones - 1]
  });
  if (!res.ok) {
    SpreadsheetApp.getUi().alert('⚠️ Revisa la fila ' + FILA_ENTRADA + ':\n\n- ' + res.error.message.split('\n').join('\n- '), '', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  sh.getRange(FILA_ENTRADA, 2, 1, N_COLS_ENTREGA - 1).clearContent();
  ss.toast('Entrega ' + res.data.id + ' registrada ✔', PROYECTO.nombre, 6);
}

function menuRegistrarDevolucion() {
  var ss = _ss();
  var sh = ss.getSheetByName(HOJA.entregas);
  if (!sh) return;
  var ui = SpreadsheetApp.getUi();
  var r1 = ui.prompt('Registrar devolución', 'ID de la entrega (ENT-xxx):', ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return;
  var idE = r1.getResponseText().trim();
  if (!idE) return;
  var r2 = ui.prompt('Registrar devolución', 'Cantidad devuelta:', ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton() !== ui.Button.OK) return;
  var r3 = ui.prompt('Registrar devolución', 'Cantidad dañada:', ui.ButtonSet.OK_CANCEL);
  if (r3.getSelectedButton() !== ui.Button.OK) return;
  var r4 = ui.prompt('Registrar devolución', 'Cantidad extraviada:', ui.ButtonSet.OK_CANCEL);
  if (r4.getSelectedButton() !== ui.Button.OK) return;
  var res = registrarDevolucion(idE, {
    cantidadDevuelta: r2.getResponseText(),
    cantidadDanada: r3.getResponseText(),
    cantidadExtraviada: r4.getResponseText()
  });
  if (!res.ok) {
    ui.alert('⚠️ ' + res.error.message, '', ui.ButtonSet.OK);
    return;
  }
  ss.toast('Devolución ' + res.data.id + ' → ' + res.data.estado + ' ✔', PROYECTO.nombre, 6);
}

function menuBuscarElemento() {
  var ss = _ss();
  var sh = ss.getSheetByName(HOJA.catalogo);
  if (!sh) return;
  var ui = SpreadsheetApp.getUi();
  var resp = ui.prompt('Buscar elemento', 'Nombre, tipo o ID:', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var res = buscarElementos(resp.getResponseText());
  var list = res.data;
  if (!list.length) {
    ss.toast('No se encontró ningún elemento', '🔍', 6);
    return;
  }
  var texto = list.slice(0, 20).map(function (e) {
    return e.id + ' — ' + e.elemento + (e.tipo ? ' (' + e.tipo + ')' : '') + (e.activo ? '' : ' [inactivo]');
  }).join('\n');
  if (list.length > 20) texto += '\n… y ' + (list.length - 20) + ' más';
  ui.alert('🔍 ' + list.length + ' elemento(s)', texto, ui.ButtonSet.OK);
}

function menuEquipamientoVoluntario() {
  var ss = _ss();
  var sh = ss.getSheetByName(HOJA.entregas);
  if (!sh) return;
  var ui = SpreadsheetApp.getUi();
  var resp = ui.prompt('Equipamiento de voluntario', 'N° del voluntario:', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var res = obtenerEquipamientoVoluntario(resp.getResponseText());
  if (!res.ok) {
    ui.alert('⚠️ ' + res.error.message, '', ui.ButtonSet.OK);
    return;
  }
  var list = res.data;
  if (!list.length) {
    ss.toast('El voluntario no tiene entregas registradas', '📦', 6);
    return;
  }
  var texto = list.slice(0, 20).map(function (x) {
    return x.id + ' — ' + x.elemento + (x.talla ? ' ' + x.talla : '') + ' x' + x.cantidad + ' [' + x.estado + '] ' + x.fechaEntrega;
  }).join('\n');
  if (list.length > 20) texto += '\n… y ' + (list.length - 20) + ' más';
  ui.alert('📦 ' + list.length + ' entrega(s)', texto, ui.ButtonSet.OK);
}

// ============ HELPERS DEL DOMINIO ============

/** Lee todo el catálogo (batch) en objetos. Incluye `fila` para escrituras. */
function _leerCatalogo(ss) {
  var sh = ss.getSheetByName(HOJA.catalogo);
  var ultima = sh.getLastRow();
  if (ultima < PRIMERA_FILA_DATO) return [];
  var datos = sh.getRange(PRIMERA_FILA_DATO, 1, ultima - PRIMERA_FILA_DATO + 1, N_COLS_CATALOGO).getValues();
  var res = [];
  for (var i = 0; i < datos.length; i++) {
    var f = datos[i];
    if (!f[COL_CATALOGO.id - 1]) continue;
    res.push({
      fila: PRIMERA_FILA_DATO + i,
      id: String(f[COL_CATALOGO.id - 1] || ''),
      elemento: String(f[COL_CATALOGO.elemento - 1] || ''),
      tipo: String(f[COL_CATALOGO.tipo - 1] || ''),
      requiereTalla: _bool(f[COL_CATALOGO.requiereTalla - 1], true),
      requiereDevolucion: _bool(f[COL_CATALOGO.requiereDevolucion - 1], true),
      activo: _bool(f[COL_CATALOGO.activo - 1], true),
      areaId: String(f[COL_CATALOGO.areaId - 1] || ''),
      tallas: String(f[COL_CATALOGO.tallas - 1] || ''),
      observaciones: String(f[COL_CATALOGO.observaciones - 1] || '')
    });
  }
  return res;
}

/** Lee todo el inventario (batch) en objetos. Incluye `fila` para escrituras. */
function _leerInventario(ss) {
  var sh = ss.getSheetByName(HOJA.inventario);
  var ultima = sh.getLastRow();
  if (ultima < PRIMERA_FILA_DATO) return [];
  var datos = sh.getRange(PRIMERA_FILA_DATO, 1, ultima - PRIMERA_FILA_DATO + 1, N_COLS_INVENTARIO).getValues();
  var res = [];
  for (var i = 0; i < datos.length; i++) {
    var f = datos[i];
    if (!f[COL_INVENTARIO.id - 1]) continue;
    res.push({
      fila: PRIMERA_FILA_DATO + i,
      id: String(f[COL_INVENTARIO.id - 1] || ''),
      elementoId: String(f[COL_INVENTARIO.elementoId - 1] || ''),
      elemento: String(f[COL_INVENTARIO.elemento - 1] || ''),
      talla: String(f[COL_INVENTARIO.talla - 1] || ''),
      cantidad: Number(f[COL_INVENTARIO.cantidad - 1] || 0),
      estado: String(f[COL_INVENTARIO.estado - 1] || ''),
      serie: String(f[COL_INVENTARIO.serie - 1] || ''),
      ubicacion: String(f[COL_INVENTARIO.ubicacion - 1] || ''),
      serieSede: String(f[COL_INVENTARIO.serieSede - 1] || ''),
      observaciones: String(f[COL_INVENTARIO.observaciones - 1] || '')
    });
  }
  return res;
}

/** Lee todas las entregas (batch) en objetos con fechas como texto dd/mm/aaaa. */
function _leerEntregas(ss) {
  var sh = ss.getSheetByName(HOJA.entregas);
  var ultima = sh.getLastRow();
  if (ultima < PRIMERA_FILA_DATO) return [];
  var datos = sh.getRange(PRIMERA_FILA_DATO, 1, ultima - PRIMERA_FILA_DATO + 1, N_COLS_ENTREGA).getValues();
  var res = [];
  for (var i = 0; i < datos.length; i++) {
    var f = datos[i];
    if (!f[COL_ENTREGA.id - 1]) continue;
    res.push({
      id: String(f[COL_ENTREGA.id - 1] || ''),
      voluntarioId: String(f[COL_ENTREGA.voluntarioId - 1] || ''),
      voluntario: String(f[COL_ENTREGA.voluntario - 1] || ''),
      run: String(f[COL_ENTREGA.run - 1] || ''),
      inventarioId: String(f[COL_ENTREGA.inventarioId - 1] || ''),
      elementoId: String(f[COL_ENTREGA.elementoId - 1] || ''),
      elemento: String(f[COL_ENTREGA.elemento - 1] || ''),
      talla: String(f[COL_ENTREGA.talla - 1] || ''),
      cantidad: Number(f[COL_ENTREGA.cantidad - 1] || 0),
      fechaEntrega: _fmtFecha(_parseDate(f[COL_ENTREGA.fechaEntrega - 1])),
      estado: String(f[COL_ENTREGA.estado - 1] || ''),
      responsable: String(f[COL_ENTREGA.responsable - 1] || ''),
      fechaDevolucion: _fmtFecha(_parseDate(f[COL_ENTREGA.fechaDevolucion - 1])),
      cantidadDevuelta: Number(f[COL_ENTREGA.cantidadDevuelta - 1] || 0),
      cantidadDanada: Number(f[COL_ENTREGA.cantidadDanada - 1] || 0),
      cantidadExtraviada: Number(f[COL_ENTREGA.cantidadExtraviada - 1] || 0),
      observaciones: String(f[COL_ENTREGA.observaciones - 1] || '')
    });
  }
  return res;
}

/**
 * Suma cantidad a la fila de inventario (elemento + talla + estado + serie +
 * ubicación + serie institucional) o la crea si no existe. `filas` es el batch
 * ya leído (no releer). @return {Object} {id, fila}
 */
function _sumarStock(ss, filas, elementoId, nombreElemento, talla, estado, serie, cantidad, obs, ubicacion, serieSede) {
  ubicacion = _texto(ubicacion);
  serieSede = _texto(serieSede);
  var sh = ss.getSheetByName(HOJA.inventario);
  for (var i = 0; i < filas.length; i++) {
    var f = filas[i];
    if (f.elementoId === elementoId && f.talla === talla && f.estado === estado && f.serie === serie && f.ubicacion === ubicacion && f.serieSede === serieSede) {
      var filaActual = sh.getRange(f.fila, 1, 1, N_COLS_INVENTARIO).getValues()[0];
      filaActual[COL_INVENTARIO.cantidad - 1] = Number(filaActual[COL_INVENTARIO.cantidad - 1] || 0) + cantidad;
      if (obs) {
        var prev = _texto(filaActual[COL_INVENTARIO.observaciones - 1]);
        filaActual[COL_INVENTARIO.observaciones - 1] = prev ? prev + '\n' + obs : obs;
      }
      sh.getRange(f.fila, 1, 1, N_COLS_INVENTARIO).setValues([filaActual]);
      return { id: f.id, fila: f.fila };
    }
  }
  var nextRow = filas.length ? filas[filas.length - 1].fila + 1 : PRIMERA_FILA_DATO;
  var nextId = _siguienteIdPrefijo(filas.map(function (x) { return x.id; }), ID_PREFIJOS.inventario);
  // V2: 10 columnas (ubicación física + serie institucional)
  var nueva = [nextId, elementoId, nombreElemento, talla, cantidad, estado, serie, obs || '', ubicacion, serieSede];
  sh.getRange(nextRow, 1, 1, N_COLS_INVENTARIO).setValues([nueva]);
  return { id: nextId, fila: nextRow };
}

/**
 * Normaliza la talla según el elemento: si no requiere talla → 'Sin talla';
 * si la requiere → obligatoria y flexible (S, M, L, 38, 40, 42...).
 * @return {Object} {ok, talla, mensaje}
 */
function _normalizarTalla(requiereTalla, talla) {
  var t = _texto(talla);
  if (!requiereTalla) return { ok: true, talla: TALLA_SIN_TALLA, mensaje: '' };
  if (!t) return { ok: false, talla: '', mensaje: 'Talla: obligatoria para este elemento' };
  return { ok: true, talla: t, mensaje: '' };
}

/** Entero >= minimo; null si no es un entero válido. */
function _cantidadEntera(v, minimo) {
  var n = Number(v);
  if (isNaN(n) || n !== Math.floor(n) || n < minimo) return null;
  return n;
}

/** Estado final de una devolución según cantidades. Puro y testeable. */
function _estadoFinalDevolucion(entregada, devuelta, danada, extraviada) {
  if (devuelta >= entregada && danada === 0 && extraviada === 0) return 'Devuelto';
  if (devuelta === 0 && danada > 0 && extraviada === 0) return 'Dañado';
  if (devuelta === 0 && danada === 0 && extraviada > 0) return 'Extraviado';
  if (devuelta > 0) return 'Devuelto parcial';
  return 'Dañado'; // daño + extravío sin devolución
}