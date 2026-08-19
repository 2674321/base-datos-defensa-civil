/**
 * 11_Dashboard.js — Agregaciones para la Web App.
 * Una sola llamada de backend para el panel (obtenerResumenDashboard):
 * indicadores, gráficos, alertas reales y actividad reciente.
 * Solo lecturas por bloques; sin locks (no escribe).
 * Funciones públicas: obtenerResumenDashboard, obtenerHistorial, obtenerConfiguracion.
 */

/** Lee las últimas N filas del Log (batch). @return {Array} más reciente primero */
function _leerLog(ss, limite) {
  var sh = ss.getSheetByName(HOJA.log);
  if (!sh) return [];
  var ultima = sh.getLastRow();
  if (ultima < 2) return [];
  var n = Math.min(ultima - 1, limite || 50);
  var desde = ultima - n + 1;
  var datos = sh.getRange(desde, 1, n, 5).getValues();
  var res = [];
  for (var i = datos.length - 1; i >= 0; i--) {
    var f = datos[i];
    var ts = _parseDate(f[0]);
    res.push({
      fecha: ts ? _fmtFecha(ts) : String(f[0] || ''),
      hora: ts ? ('0' + ts.getHours()).slice(-2) + ':' + ('0' + ts.getMinutes()).slice(-2) : '',
      pagina: String(f[1] || ''),
      evento: String(f[2] || ''),
      resultado: String(f[3] || ''),
      detalle: String(f[4] || '')
    });
  }
  return res;
}

/** Mapea página+evento del Log a un ítem de actividad legible. */
function _itemActividad(log) {
  var tipo = 'Sistema';
  var titulo = log.evento || log.pagina;
  if (log.pagina === 'Voluntarios') tipo = 'Voluntario';
  else if (log.pagina === 'Catálogo') tipo = 'Catálogo';
  else if (log.pagina === 'Inventario') tipo = 'Inventario';
  else if (log.pagina === 'Entregas') tipo = 'Entrega';
  else if (log.pagina === 'Devolución') tipo = 'Devolución';
  var ok = log.resultado === 'OK' || !log.resultado;
  return { fecha: log.fecha, hora: log.hora, tipo: tipo, titulo: titulo, detalle: log.detalle, ok: ok };
}

/** Actividad reciente: Log del sistema; si está vacío, respaldo con entregas recientes. */
function _actividadReciente(ss, filasEntregas) {
  var log = _leerLog(ss, 12);
  if (log.length) {
    return log.slice(0, 8).map(_itemActividad);
  }
  var n = Math.min(filasEntregas.length, 5);
  var res = [];
  for (var i = filasEntregas.length - n; i < filasEntregas.length; i++) {
    var e = filasEntregas[i];
    res.push({
      fecha: e.fechaEntrega, hora: '', tipo: 'Entrega',
      titulo: 'Entrega a ' + (e.voluntario || ''),
      detalle: (e.elemento || '') + (e.talla && e.talla !== TALLA_SIN_TALLA ? ' (' + e.talla + ')' : '') + ' × ' + e.cantidad,
      ok: true
    });
  }
  return res;
}

function obtenerResumenDashboard() {
  var ss = _ss();
  try {
    var shV = ss.getSheetByName(HOJA.voluntarios);
    if (!shV) return _resErr('ESTRUCTURA_NO_CREADA', 'Estructura no creada: ejecuta Crear estructura base');

    // Voluntarios: batch de 2 columnas (N°, Estado) → totales + distribución por estado
    var voluntarios = { total: 0, activos: 0, egresados: 0, otros: 0, porEstado: [] };
    var porEstado = {};
    var ultV = shV.getLastRow();
    if (ultV >= PRIMERA_FILA_DATO) {
      var datosV = shV.getRange(PRIMERA_FILA_DATO, 1, ultV - PRIMERA_FILA_DATO + 1, 2).getValues();
      for (var i = 0; i < datosV.length; i++) {
        if (!String(datosV[i][0] || '')) continue;
        voluntarios.total++;
        var est = String(datosV[i][1] || '');
        if (est === 'Activo') voluntarios.activos++;
        else if (est === 'Egresado') voluntarios.egresados++;
        else if (est) voluntarios.otros++;
        if (est) porEstado[est] = (porEstado[est] || 0) + 1;
      }
    }
    voluntarios.porEstado = Object.keys(porEstado).map(function (k) {
      return { estado: k, n: porEstado[k] };
    }).sort(function (a, b) { return b.n - a.n; });

    // Catálogo (batch)
    var catalogo = _leerCatalogo(ss);
    var catalogoRes = { total: catalogo.length, activos: 0 };
    for (var c = 0; c < catalogo.length; c++) {
      if (catalogo[c].activo) catalogoRes.activos++;
    }

    // Inventario (batch): totales por estado + por elemento (para distribución)
    var inventario = { disponible: 0, entregado: 0, danado: 0, extraviado: 0, baja: 0, filas: 0, porElemento: [] };
    var filasInv = _leerInventario(ss);
    var porElem = {};
    var porEstadoInv = {};
    for (var k = 0; k < filasInv.length; k++) {
      var f = filasInv[k];
      inventario.filas++;
      var suma = function (campo) {
        if (f.estado === campo) inventario[campo] += f.cantidad;
      };
      suma('Disponible'); suma('Entregado'); suma('Dañado'); suma('Extraviado'); suma('Baja');
      if (!porElem[f.elementoId]) porElem[f.elementoId] = { elemento: f.elemento, porEstado: {}, total: 0 };
      porElem[f.elementoId].porEstado[f.estado] = (porElem[f.elementoId].porEstado[f.estado] || 0) + f.cantidad;
      porElem[f.elementoId].total += f.cantidad;
    }
    inventario.porElemento = Object.keys(porElem).map(function (id) {
      return { elemento: porElem[id].elemento, total: porElem[id].total, porEstado: porElem[id].porEstado };
    }).sort(function (a, b) { return b.total - a.total; }).slice(0, 8);

    // Entregas (batch): conteo por estado + últimos 6 meses
    var entregas = { total: 0, pendientes: 0, devueltas: 0, parciales: 0, danadas: 0, extraviadas: 0, entregadas: 0, porMes: [] };
    var filasE = _leerEntregas(ss);
    for (var e = 0; e < filasE.length; e++) {
      entregas.total++;
      var es = filasE[e].estado;
      if (es === ESTADO_ENTREGA_INICIAL) entregas.pendientes++;
      else if (es === 'Devuelto') entregas.devueltas++;
      else if (es === 'Devuelto parcial') entregas.parciales++;
      else if (es === 'Dañado') entregas.danadas++;
      else if (es === 'Extraviado') entregas.extraviadas++;
      else if (es === ESTADO_ENTREGA_SIN_DEVOLUCION) entregas.entregadas++;
    }
    var ahora = new Date();
    var MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    var porMes = {};
    for (var m = 5; m >= 0; m--) {
      var d = new Date(ahora.getFullYear(), ahora.getMonth() - m, 1);
      var clave = d.getFullYear() + '-' + d.getMonth();
      porMes[clave] = { mes: MESES[d.getMonth()], anio: d.getFullYear(), n: 0 };
    }
    for (var e2 = 0; e2 < filasE.length; e2++) {
      var fe = _parseDate(filasE[e2].fechaEntrega);
      if (fe) {
        var c2 = fe.getFullYear() + '-' + fe.getMonth();
        if (porMes[c2]) porMes[c2].n++;
      }
    }
    entregas.porMes = Object.keys(porMes).map(function (c3) { return porMes[c3]; });

    // Alertas reales (solo hechos; severidad para priorización visual)
    var alertas = [];
    var umbral = _configNumero(ss, 'STOCK_BAJO', STOCK_BAJO_DEFECTO);
    for (var a = 0; a < filasInv.length; a++) {
      var fi = filasInv[a];
      if (fi.estado === 'Disponible' && fi.cantidad > 0 && fi.cantidad <= umbral) {
        alertas.push({
          severidad: 'aviso',
          texto: 'Stock bajo: ' + fi.elemento + (fi.talla && fi.talla !== TALLA_SIN_TALLA ? ' (' + fi.talla + ')' : '') + ' — ' + fi.cantidad + ' disponible(s)'
        });
      }
    }
    if (entregas.pendientes > 0) alertas.push({ severidad: 'aviso', texto: entregas.pendientes + ' entrega(s) pendiente(s) de devolución' });
    if (inventario.danado > 0) alertas.push({ severidad: 'critica', texto: inventario.danado + ' unidad(es) dañada(s) en inventario' });
    if (inventario.extraviado > 0) alertas.push({ severidad: 'critica', texto: inventario.extraviado + ' unidad(es) extraviada(s) en inventario' });
    if (!catalogoRes.total) alertas.push({ severidad: 'aviso', texto: 'Catálogo vacío: registra elementos' });
    var criticas = alertas.filter(function (al) { return al.severidad === 'critica'; }).length;

    return _resOk({
      voluntarios: voluntarios,
      catalogo: catalogoRes,
      inventario: inventario,
      entregas: entregas,
      alertas: alertas,
      resumenAlerta: { total: alertas.length, criticas: criticas },
      actividadReciente: _actividadReciente(ss, filasE),
      version: PROYECTO.version,
      generado: _fmtFecha(new Date())
    });
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

/** Historial global (página Historial): últimos eventos del Log. @param {Number} limite */
function obtenerHistorial(limite) {
  try {
    return _resOk(_leerLog(_ss(), Math.min(Math.max(limite || 60, 1), 200)).map(_itemActividad));
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

/** Configuración (página Config, solo lectura). Lee la hoja Config sin exponer hojas. */
function obtenerConfiguracion() {
  try {
    var ss = _ss();
    var sh = ss.getSheetByName(HOJA.config);
    if (!sh) return _resOk([]);
    var ult = sh.getLastRow();
    if (ult < 2) return _resOk([]);
    var datos = sh.getRange(2, 1, ult - 1, 4).getValues();
    var res = [];
    for (var i = 0; i < datos.length; i++) {
      if (!String(datos[i][0] || '')) continue;
      res.push({
        parametro: String(datos[i][0]),
        valor: String(datos[i][1] || ''),
        tipo: String(datos[i][2] || ''),
        ayuda: String(datos[i][3] || '')
      });
    }
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

/**
 * Agregador V2 (una sola llamada para el panel V2): voluntarios por
 * estado/categoría/grado/cargo/área, alertas reales, actividad reciente y
 * referencias de configuración. Solo lecturas batch.
 */
function obtenerResumenDashboardV2() {
  try {
    var ss = _ss();
    var shV = ss.getSheetByName(HOJA_V2.voluntarios);
    if (!shV) return _resErr('ESTRUCTURA_NO_CREADA', 'Estructura V2 no creada: ejecuta Crear estructura V2');

    var voluntarios = _tablaV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2);
    var personas = _tablaV2(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA);
    var grados = _tablaV2(ss, HOJA_V2.grados, COL_GRADO, N_COLS_GRADO);
    var cargos = _tablaV2(ss, HOJA_V2.cargos, COL_CARGO, N_COLS_CARGO);
    var areas = _tablaV2(ss, HOJA_V2.areas, COL_AREA, N_COLS_AREA);
    var histGrados = _tablaV2(ss, HOJA_V2.historialGrados, COL_HIST_GRADO, N_COLS_HIST_GRADO);
    var histCargos = _tablaV2(ss, HOJA_V2.historialCargos, COL_HIST_CARGO, N_COLS_HIST_CARGO);

    var porGradoNombre = {};
    for (var g = 0; g < grados.length; g++) porGradoNombre[String(grados[g].id)] = grados[g].nombre;
    var porCargoNombre = {};
    for (var c = 0; c < cargos.length; c++) porCargoNombre[String(cargos[c].id)] = cargos[c].nombre;
    var porAreaNombre = {};
    for (var a = 0; a < areas.length; a++) porAreaNombre[String(areas[a].id)] = areas[a].nombre;
    var cargoArea = {};
    for (var c2 = 0; c2 < cargos.length; c2++) cargoArea[String(cargos[c2].id)] = String(cargos[c2].areaId || '');

    var gradosVigentes = {};
    for (var hg = 0; hg < histGrados.length; hg++) {
      if (!histGrados[hg].fechaHasta) gradosVigentes[String(histGrados[hg].voluntarioId)] = histGrados[hg];
    }
    var cargosVigentes = {};
    for (var hc = 0; hc < histCargos.length; hc++) {
      if (!histCargos[hc].fechaHasta) cargosVigentes[String(histCargos[hc].voluntarioId)] = histCargos[hc];
    }

    var porEstado = {};
    var porCategoria = {};
    var porGrado = {};
    var porCargo = {};
    var porArea = {};
    for (var v = 0; v < voluntarios.length; v++) {
      var vid = String(voluntarios[v].id);
      var est = String(voluntarios[v].estado || 'Sin estado');
      var cat = String(voluntarios[v].categoria || 'Sin categoría');
      porEstado[est] = (porEstado[est] || 0) + 1;
      porCategoria[cat] = (porCategoria[cat] || 0) + 1;
      var hg2 = gradosVigentes[vid];
      var hc2 = cargosVigentes[vid];
      var gN = hg2 ? (porGradoNombre[String(hg2.gradoId)] || 'Sin grado') : 'Sin grado';
      var cN = hc2 ? (porCargoNombre[String(hc2.cargoId)] || 'Sin cargo') : 'Sin cargo';
      var aN = hc2 ? (porAreaNombre[cargoArea[String(hc2.cargoId)]] || 'Sin área') : 'Sin área';
      porGrado[gN] = (porGrado[gN] || 0) + 1;
      porCargo[cN] = (porCargo[cN] || 0) + 1;
      porArea[aN] = (porArea[aN] || 0) + 1;
    }

    var alertasRes = obtenerAlertasV2();
    var alertas = alertasRes.ok ? alertasRes.data : { total: 0, criticas: 0, alertas: [] };
    var filasE = _leerEntregas(ss);

    return _resOk({
      esquemaV2: ESQUEMA_V2,
      voluntarios: {
        total: voluntarios.length,
        activos: porEstado['Activo'] || 0,
        personas: personas.length,
        porEstado: Object.keys(porEstado).map(function (k) { return { estado: k, n: porEstado[k] }; }).sort(function (x, y) { return y.n - x.n; }),
        porCategoria: porCategoria,
        porGrado: porGrado,
        porCargo: porCargo,
        porArea: porArea
      },
      alertas: alertas,
      resumenAlerta: { total: alertas.total, criticas: alertas.criticas },
      actividadReciente: _actividadReciente(ss, filasE),
      minimosReferencia: {
        voluntariosRegimen: _configNumero(ss, 'MIN_ASIST_VOLUNTARIOS_REGIMEN', 50),
        voluntariosOperativa: _configNumero(ss, 'MIN_ASIST_VOLUNTARIOS_OPERATIVA', 60),
        disponiblesRegimen: _configNumero(ss, 'MIN_ASIST_DISPONIBLES_REGIMEN', 70),
        disponiblesOperativa: _configNumero(ss, 'MIN_ASIST_DISPONIBLES_OPERATIVA', 80)
      },
      version: PROYECTO.version,
      generado: _fmtFecha(new Date())
    });
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}