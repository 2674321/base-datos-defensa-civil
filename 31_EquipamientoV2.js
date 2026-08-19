/**
 * 31_EquipamientoV2.js — Dominio equipamiento V2 (fase 9).
 * Usa las MISMA hojas Catálogo/Inventario/Entregas (columnas extendidas V2:
 * catálogo áreaId+tallas; inventario ubicación+serie institucional) y la NUEVA
 * tabla Devoluciones (múltiples parciales por entrega, append-only).
 * Los voluntarios referenciados son V2 (VoluntariosV2 + Personas).
 * API:
 *   registrarEntregaV2(datos)                    → {ok, data:{id}}
 *   registrarDevolucionV2(idEntrega, datos)      → {ok, data:{id, estado}} (inserta en Devoluciones,
 *                                                 recalcula totales desde la tabla, cierra la entrega,
 *                                                 devuelve stock con ubicación/serie institucional)
 *   obtenerHistorialDevolucionesV2(entregaId)    → {ok, data:[...]}
 *   obtenerEquipamientoVoluntarioV2(voluntarioId)
 *   obtenerHistorialEntregasV2(voluntarioId?)
 *   obtenerEntregaV2(idEntrega)
 */

function _datosVoluntarioV2(ss, voluntarioId) {
  var vol = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
    return String(v.id) === String(voluntarioId);
  });
  if (!vol) return null;
  var persona = _buscarV2(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA, function (p) {
    return String(p.id) === String(vol.personaId);
  });
  var nombre = persona ? [persona.nombres, persona.apPaterno, persona.apMaterno].filter(function (s) { return String(s).trim(); }).join(' ') : '';
  return { id: String(vol.id), nombre: nombre || '—', run: persona ? String(persona.run || '') : '' };
}

function registrarEntregaV2(datos) {
  datos = datos || {};
  var ss = _ss();
  var shE = ss.getSheetByName(HOJA.entregas);
  if (!shE) return _resErr('ESTRUCTURA_NO_CREADA', 'Estructura no creada: ejecuta Crear estructura base');
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  try {
    return _registrarEntregaV2Interna(ss, shE, datos);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Núcleo de registro de UNA entrega V2 (validación + escritura + stock).
 * NO toma LockService: el llamador es dueño de la sección crítica.
 * Reutilizado por registrarEntregaV2 (individual) y
 * registrarEntregaMultipleV2 (lote) — sin duplicar la lógica.
 */
function _registrarEntregaV2Interna(ss, shE, datos) {
  datos = datos || {};
  // Voluntario V2 (VoluntariosV2 + Personas)
  var voluntarioId = _texto(datos.voluntarioId);
  if (!voluntarioId) return _resErr('DATOS_INCOMPLETOS', 'Voluntario ID: obligatorio');
  var vol = _datosVoluntarioV2(ss, voluntarioId);
  if (!vol) return _resErr('NO_ENCONTRADO', 'Voluntario V2 N° ' + voluntarioId + ' no existe');

  // Inventario (fila V2 con ubicación/serie institucional)
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

  var entregas = _leerEntregas(ss);
  for (var j = 0; j < entregas.length; j++) {
    var x = entregas[j];
    if (x.voluntarioId === voluntarioId && x.inventarioId === inventarioId && x.estado === ESTADO_ENTREGA_INICIAL) {
      return _resErr('ENTREGA_DUPLICADA', 'Ya existe una entrega pendiente de este elemento a este voluntario (' + x.id + ')');
    }
  }

  var catalogo = _leerCatalogo(ss);
  var elemento = null;
  for (var k = 0; k < catalogo.length; k++) {
    if (catalogo[k].id === inv.elementoId) { elemento = catalogo[k]; break; }
  }
  if (!elemento) return _resErr('NO_ENCONTRADO', 'Elemento ' + inv.elementoId + ' no existe en el catálogo');
  if (!elemento.activo) return _resErr('ELEMENTO_INACTIVO', 'El elemento "' + elemento.elemento + '" está inactivo');

  var fechaEntrega = _texto(datos.fechaEntrega) ? _parseDate(datos.fechaEntrega) : new Date();
  if (!fechaEntrega) return _resErr('VALIDACION', 'Fecha de entrega inválida (dd/mm/aaaa)');
  // V3.4D: talla opcional por entrega (campo libre de la UI múltiple); si no
  // se envía, se usa la talla de la línea de inventario (snapshot original).
  var tallaEntrega = String(inv.talla || '');
  if (datos.talla !== undefined && _texto(datos.talla)) {
    tallaEntrega = _texto(datos.talla);
    if (tallaEntrega.length > 30) return _resErr('VALIDACION', 'Talla: máximo 30 caracteres');
  }
  var estadoEntrega = elemento.requiereDevolucion ? ESTADO_ENTREGA_INICIAL : ESTADO_ENTREGA_SIN_DEVOLUCION;

  var shInv = ss.getSheetByName(HOJA.inventario);
  var filaInvActual = shInv.getRange(inv.fila, 1, 1, N_COLS_INVENTARIO).getValues()[0];
  if (inv.serie) {
    filaInvActual[COL_INVENTARIO.estado - 1] = 'Entregado';
  } else {
    filaInvActual[COL_INVENTARIO.cantidad - 1] = Number(filaInvActual[COL_INVENTARIO.cantidad - 1] || 0) - cantidad;
  }
  shInv.getRange(inv.fila, 1, 1, N_COLS_INVENTARIO).setValues([filaInvActual]);

  var nextId = _siguienteIdPrefijo(entregas.map(function (e) { return e.id; }), ID_PREFIJOS.entrega);
  var nueva = [
    nextId, voluntarioId, vol.nombre, vol.run,
    inv.id, elemento.id, elemento.elemento, tallaEntrega, cantidad,
    fechaEntrega, estadoEntrega, _texto(datos.responsable), '', 0, 0, 0, _texto(datos.observaciones)
  ];
  shE.getRange(Math.max(PRIMERA_FILA_DATO, shE.getLastRow() + 1), 1, 1, N_COLS_ENTREGA).setValues([nueva]);
  _log(ss, HOJA.entregas, 'registrarEntregaV2', 'OK', nextId + ' — Vol. V2 ' + voluntarioId + ' — ' + elemento.elemento + ' x' + cantidad);
  return _resOk({
    id: nextId,
    elemento: elemento.elemento,
    talla: tallaEntrega,
    cantidad: cantidad,
    estado: estadoEntrega
  });
}

/**
 * Entrega MÚLTIPLE (V3.4D): registra N entregas de un voluntario en UNA
 * operación. Apps Script/Sheets no ofrecen transacciones reales, por eso:
 * 1) VALIDA todo el lote ANTES de escribir (nunca escrituras parciales por
 *    error de validación);
 * 2) el LockService protege la sección crítica completa;
 * 3) si una escritura falla a mitad del lote (caso imprevisto), se reporta en
 *    `errores` y el resultado queda `parcial:true` — nunca se ocultan fallos.
 * datos = { voluntarioId, items:[{inventarioId, cantidad}], responsable?,
 *           observaciones?, fechaEntrega? }
 * @return {ok, data:{registradas:[{id, inventarioId, elemento, talla, cantidad, estado}], errores:[{indice, inventarioId, elemento, error}], parcial}}
 */
function registrarEntregaMultipleV2(datos) {
  datos = datos || {};
  var ss = _ss();
  var shE = ss.getSheetByName(HOJA.entregas);
  if (!shE) return _resErr('ESTRUCTURA_NO_CREADA', 'Estructura no creada: ejecuta Crear estructura base');
  var voluntarioId = _texto(datos.voluntarioId);
  if (!voluntarioId) return _resErr('DATOS_INCOMPLETOS', 'Voluntario ID: obligatorio');
  var items = (datos.items || []).filter(function (it) { return it && _texto(it.inventarioId); });
  if (!items.length) return _resErr('DATOS_INCOMPLETOS', 'Selecciona al menos un elemento');
  if (items.length > 50) return _resErr('LIMITE_BATCH', 'Máximo 50 elementos por lote');

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  try {
    var vol = _datosVoluntarioV2(ss, voluntarioId);
    if (!vol) return _resErr('NO_ENCONTRADO', 'Voluntario V2 N° ' + voluntarioId + ' no existe');

    // Fase A: validación de TODO el lote antes de escribir nada.
    var inventario = _leerInventario(ss);
    var catalogo = _leerCatalogo(ss);
    var entregas = _leerEntregas(ss);
    var porInv = {};
    for (var a = 0; a < inventario.length; a++) porInv[inventario[a].id] = inventario[a];
    var porCat = {};
    for (var b = 0; b < catalogo.length; b++) porCat[String(catalogo[b].id)] = catalogo[b];
    var usados = {};
    var validados = [];
    var errores = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var invId = _texto(it.inventarioId);
      var inv = porInv[invId];
      var err = null;
      if (!inv) {
        err = 'Inventario ' + invId + ' no existe';
      } else if (inv.estado !== ESTADO_INVENTARIO_DEFECTO) {
        err = 'No disponible (estado: ' + inv.estado + ')';
      } else {
        var cantidad = _cantidadEntera(it.cantidad, 1);
        if (cantidad === null) err = 'Cantidad debe ser un entero mayor que 0';
        else if (inv.serie && cantidad !== 1) err = 'Unidades con N° Serie se entregan de a 1';
        else if (cantidad > inv.cantidad) err = 'Stock insuficiente: hay ' + inv.cantidad + ' de ' + inv.elemento + (inv.talla ? ' ' + inv.talla : '');
        else if (usados[invId]) err = 'Elemento repetido en el lote';
        else {
          var elemento = porCat[String(inv.elementoId)];
          if (!elemento) err = 'Elemento ' + inv.elementoId + ' no existe en el catálogo';
          else if (!elemento.activo) err = 'El elemento "' + elemento.elemento + '" está inactivo';
          else {
            for (var j = 0; j < entregas.length; j++) {
              var x = entregas[j];
              if (x.voluntarioId === voluntarioId && x.inventarioId === invId && x.estado === ESTADO_ENTREGA_INICIAL) {
                err = 'Ya existe una entrega pendiente (' + x.id + ')';
                break;
              }
            }
          }
          if (!err) usados[invId] = true;
        }
      }
      if (err) {
        errores.push({ indice: i, inventarioId: invId, elemento: inv ? String(inv.elemento || '') : '', error: err });
      } else {
        var tallaIt = it.talla !== undefined && _texto(it.talla) ? _texto(it.talla) : '';
        if (tallaIt.length > 30) {
          errores.push({ indice: i, inventarioId: invId, elemento: String(inv.elemento || ''), error: 'Talla: máximo 30 caracteres' });
        } else {
          validados.push({ inventarioId: invId, cantidad: _cantidadEntera(it.cantidad, 1), talla: tallaIt || null });
        }
      }
    }
    if (errores.length) {
      var msj = errores.slice(0, 5).map(function (e) {
        return (e.elemento || e.inventarioId) + ': ' + e.error;
      }).join(' | ');
      if (errores.length > 5) msj += ' (+' + (errores.length - 5) + ' más)';
      return _resErr('VALIDACION_BATCH', msj);
    }

    // Fase B: escribe cada entrega con el núcleo compartido (mismo lock).
    var registradas = [];
    for (var w = 0; w < validados.length; w++) {
      var res = _registrarEntregaV2Interna(ss, shE, {
        voluntarioId: voluntarioId,
        inventarioId: validados[w].inventarioId,
        cantidad: validados[w].cantidad,
        talla: validados[w].talla,
        fechaEntrega: datos.fechaEntrega,
        responsable: datos.responsable,
        observaciones: datos.observaciones
      });
      if (res.ok) {
        registradas.push({
          id: res.data.id,
          inventarioId: validados[w].inventarioId,
          elemento: res.data.elemento,
          talla: res.data.talla,
          cantidad: res.data.cantidad,
          estado: res.data.estado
        });
      } else {
        errores.push({ indice: w, inventarioId: validados[w].inventarioId, elemento: '', error: res.error ? res.error.message : 'Error inesperado' });
      }
    }
    _log(ss, HOJA.entregas, 'registrarEntregaMultipleV2', errores.length ? 'PARCIAL' : 'OK',
      voluntarioId + ' — ' + registradas.length + ' registradas' + (errores.length ? ', ' + errores.length + ' con error' : ''));
    return _resOk({ registradas: registradas, errores: errores, parcial: errores.length > 0 });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Devolución V2: inserta la fila en Devoluciones (append-only, múltiples parciales),
 * recalcula los totales desde la tabla, cierra la entrega y devuelve stock.
 */
function registrarDevolucionV2(idEntrega, datos) {
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
    var nuevaDevuelta = _cantidadEntera(datos.cantidadDevuelta, 0) || 0;
    var nuevaDanada = _cantidadEntera(datos.cantidadDanada, 0) || 0;
    var nuevaExtraviada = _cantidadEntera(datos.cantidadExtraviada, 0) || 0;
    if (nuevaDevuelta + nuevaDanada + nuevaExtraviada < 1) {
      return _resErr('DATOS_INCOMPLETOS', 'Indica al menos una cantidad (devuelta, dañada o extraviada)');
    }

    // Total ya devuelto en parciales anteriores (recalculado desde la tabla)
    var previos = _tablaV2(ss, HOJA_V2.devoluciones, COL_DEVOLUCION, N_COLS_DEVOLUCION).filter(function (d) {
      return String(d.entregaId) === String(idEntrega);
    });
    var prev = { devuelta: 0, danada: 0, extraviada: 0 };
    for (var p = 0; p < previos.length; p++) {
      prev.devuelta += Number(previos[p].cantidadDevuelta || 0);
      prev.danada += Number(previos[p].cantidadDanada || 0);
      prev.extraviada += Number(previos[p].cantidadExtraviada || 0);
    }
    if (prev.devuelta + nuevaDevuelta + prev.danada + nuevaDanada + prev.extraviada + nuevaExtraviada > entregada) {
      return _resErr('VALIDACION', 'La suma de cantidades excede lo entregado (' + entregada + '; ya devuelto: ' + (prev.devuelta + prev.danada + prev.extraviada) + ')');
    }

    // 1) Insertar el parcial en Devoluciones
    var filaDev = {};
    filaDev[COL_DEVOLUCION.entregaId] = idEntrega;
    filaDev[COL_DEVOLUCION.fecha] = _texto(datos.fecha) ? _parseDate(datos.fecha) : new Date();
    filaDev[COL_DEVOLUCION.cantidadDevuelta] = nuevaDevuelta;
    filaDev[COL_DEVOLUCION.cantidadDanada] = nuevaDanada;
    filaDev[COL_DEVOLUCION.cantidadExtraviada] = nuevaExtraviada;
    filaDev[COL_DEVOLUCION.responsable] = _texto(datos.responsable);
    filaDev[COL_DEVOLUCION.observaciones] = _texto(datos.observaciones);
    var resDev = _insertarFilaV2(ss, HOJA_V2.devoluciones, COL_DEVOLUCION, N_COLS_DEVOLUCION, filaDev);
    if (!resDev.ok) return resDev;

    // 2) Totales finales (desde la tabla, incluye el nuevo parcial)
    var devuelta = prev.devuelta + nuevaDevuelta;
    var danada = prev.danada + nuevaDanada;
    var extraviada = prev.extraviada + nuevaExtraviada;
    var estadoFinal = _estadoFinalDevolucion(entregada, devuelta, danada, extraviada);

    // 3) Actualizar inventario (solo el delta de este parcial; ubicación/serie institucional conservadas)
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
      var shInv = ss.getSheetByName(HOJA.inventario);
      var filaInvActual = shInv.getRange(inv.fila, 1, 1, N_COLS_INVENTARIO).getValues()[0];
      filaInvActual[COL_INVENTARIO.estado - 1] = estadoFinal === 'Dañado' ? 'Dañado' : (estadoFinal === 'Extraviado' ? 'Extraviado' : 'Disponible');
      shInv.getRange(inv.fila, 1, 1, N_COLS_INVENTARIO).setValues([filaInvActual]);
    } else {
      if (nuevaDevuelta > 0) _sumarStock(ss, filasInv, elementoId, elementoNombre, talla, 'Disponible', '', nuevaDevuelta, '', inv.ubicacion, inv.serieSede);
      if (nuevaDanada > 0) _sumarStock(ss, filasInv, elementoId, elementoNombre, talla, 'Dañado', '', nuevaDanada, '', inv.ubicacion, inv.serieSede);
      if (nuevaExtraviada > 0) _sumarStock(ss, filasInv, elementoId, elementoNombre, talla, 'Extraviado', '', nuevaExtraviada, '', inv.ubicacion, inv.serieSede);
    }

    // 4) Cerrar la entrega con los totales recalculados (trazabilidad histórica intacta)
    filaEntrega[COL_ENTREGA.estado - 1] = estadoFinal;
    filaEntrega[COL_ENTREGA.fechaDevolucion - 1] = new Date();
    filaEntrega[COL_ENTREGA.cantidadDevuelta - 1] = devuelta;
    filaEntrega[COL_ENTREGA.cantidadDanada - 1] = danada;
    filaEntrega[COL_ENTREGA.cantidadExtraviada - 1] = extraviada;
    var obsNueva = _texto(datos.observaciones);
    if (obsNueva) {
      var prevObs = _texto(filaEntrega[COL_ENTREGA.observaciones - 1]);
      filaEntrega[COL_ENTREGA.observaciones - 1] = prevObs ? prevObs + '\n' + obsNueva : obsNueva;
    }
    sh.getRange(filaN, 1, 1, N_COLS_ENTREGA).setValues([filaEntrega]);
    _log(ss, HOJA_V2.devoluciones, 'registrarDevolucionV2', 'OK', idEntrega + ' → ' + estadoFinal + ' (dev ' + devuelta + ' / dañ ' + danada + ' / ext ' + extraviada + ')');
    return _resOk({ id: idEntrega, estado: estadoFinal, devolucionId: resDev.data.id });
  } finally {
    lock.releaseLock();
  }
}

function obtenerHistorialDevolucionesV2(entregaId) {
  try {
    var ss = _ss();
    var filas = _tablaV2(ss, HOJA_V2.devoluciones, COL_DEVOLUCION, N_COLS_DEVOLUCION).filter(function (d) {
      return String(d.entregaId) === String(entregaId);
    });
    var res = filas.map(function (d) {
      return {
        id: d.id,
        entregaId: String(d.entregaId || ''),
        fecha: _fechaV2(d.fecha),
        cantidadDevuelta: Number(d.cantidadDevuelta || 0),
        cantidadDanada: Number(d.cantidadDanada || 0),
        cantidadExtraviada: Number(d.cantidadExtraviada || 0),
        responsable: String(d.responsable || ''),
        observaciones: String(d.observaciones || '')
      };
    });
    res.sort(function (a, b) { return _parseDate(a.fecha || '01/01/2000') - _parseDate(b.fecha || '01/01/2000'); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function obtenerEquipamientoVoluntarioV2(voluntarioId) {
  var ss = _ss();
  var list = _leerEntregas(ss).filter(function (x) {
    return x.voluntarioId === _texto(voluntarioId);
  }).reverse();
  return _resOk(list);
}

function obtenerHistorialEntregasV2(voluntarioId) {
  var ss = _ss();
  var list = _leerEntregas(ss);
  if (_texto(voluntarioId)) {
    list = list.filter(function (x) { return x.voluntarioId === _texto(voluntarioId); });
  }
  return _resOk(list.reverse());
}

function obtenerEntregaV2(idEntrega) {
  var ss = _ss();
  var entregas = _leerEntregas(ss);
  for (var i = 0; i < entregas.length; i++) {
    if (entregas[i].id === _texto(idEntrega)) {
      var devoluciones = obtenerHistorialDevolucionesV2(_texto(idEntrega)).data;
      return _resOk({ entrega: entregas[i], devoluciones: devoluciones });
    }
  }
  return _resErr('NO_ENCONTRADO', 'Entrega ' + idEntrega + ' no existe');
}