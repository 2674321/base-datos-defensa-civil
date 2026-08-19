/**
 * 34_Reportes.js — Reportes y estadísticas V2 (fase 12).
 * Agregador de lectura (batch) para reportes y alertas del panel.
 * API:
 *   obtenerReporteGeneralV2()      → conteos por estado/categoría/grado/cargo/área
 *                                   + credenciales y capacitaciones por vencer
 *                                   + entregas pendientes de devolución
 *   obtenerNominaV2(filtros?)      → nómina con grado/cargo/área vigentes y antigüedad
 *   obtenerAlertasV2()             → alertas priorizadas (credenciales, capacitaciones,
 *                                   devoluciones pendientes, stock bajo)
 */

function _nombreVoluntarioV2(personas, porPersona, vol) {
  var p = porPersona[String(vol.personaId)];
  return p ? [p.nombres, p.apPaterno, p.apMaterno].filter(function (s) { return String(s).trim(); }).join(' ') : '—';
}

function obtenerReporteGeneralV2() {
  try {
    var ss = _ss();
    var voluntarios = _tablaV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2);
    var personas = _tablaV2(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA);
    var porPersona = {};
    for (var p = 0; p < personas.length; p++) porPersona[String(personas[p].id)] = personas[p];

    var porEstado = {};
    var porCategoria = {};
    for (var v = 0; v < voluntarios.length; v++) {
      var est = String(voluntarios[v].estado || 'Sin estado');
      var cat = String(voluntarios[v].categoria || 'Sin categoría');
      porEstado[est] = (porEstado[est] || 0) + 1;
      porCategoria[cat] = (porCategoria[cat] || 0) + 1;
    }

    var grados = _tablaV2(ss, HOJA_V2.grados, COL_GRADO, N_COLS_GRADO);
    var porGrado = {};
    for (var g = 0; g < grados.length; g++) porGrado[String(grados[g].id)] = grados[g].nombre;
    var cargos = _tablaV2(ss, HOJA_V2.cargos, COL_CARGO, N_COLS_CARGO);
    var porCargo = {};
    for (var c = 0; c < cargos.length; c++) porCargo[String(cargos[c].id)] = cargos[c].nombre;
    var areas = _tablaV2(ss, HOJA_V2.areas, COL_AREA, N_COLS_AREA);
    var porArea = {};
    for (var a = 0; a < areas.length; a++) porArea[String(areas[a].id)] = areas[a].nombre;

    var gradosPorVol = {};
    var cargosPorVol = {};
    var histGrados = _tablaV2(ss, HOJA_V2.historialGrados, COL_HIST_GRADO, N_COLS_HIST_GRADO);
    for (var hg = 0; hg < histGrados.length; hg++) {
      if (histGrados[hg].fechaHasta) continue;
      gradosPorVol[String(histGrados[hg].voluntarioId)] = histGrados[hg];
    }
    var histCargos = _tablaV2(ss, HOJA_V2.historialCargos, COL_HIST_CARGO, N_COLS_HIST_CARGO);
    for (var hc = 0; hc < histCargos.length; hc++) {
      if (histCargos[hc].fechaHasta) continue;
      cargosPorVol[String(histCargos[hc].voluntarioId)] = histCargos[hc];
    }

    var porGradoConteo = {};
    var porCargoConteo = {};
    var porAreaConteo = {};
    for (var v2 = 0; v2 < voluntarios.length; v2++) {
      var vid = String(voluntarios[v2].id);
      var hg2 = gradosPorVol[vid];
      var hc2 = cargosPorVol[vid];
      var gNombre = hg2 ? (porGrado[String(hg2.gradoId)] || 'Sin grado') : 'Sin grado';
      var cNombre = hc2 ? (porCargo[String(hc2.cargoId)] || 'Sin cargo') : 'Sin cargo';
      var areaNombre = hc2 ? (porArea[String(cargos.length ? (porCargo[String(hc2.cargoId)] ? _areaDeCargo(ss, hc2.cargoId) : '') : '')] || 'Sin área') : 'Sin área';
      porGradoConteo[gNombre] = (porGradoConteo[gNombre] || 0) + 1;
      porCargoConteo[cNombre] = (porCargoConteo[cNombre] || 0) + 1;
      porAreaConteo[areaNombre] = (porAreaConteo[areaNombre] || 0) + 1;
    }

    var vencimientos = obtenerVencimientosV2().data;
    var capacitacionesVencidas = obtenerCapacitacionesVencidasV2().data;
    var entregasPendientes = _leerEntregas(ss).filter(function (x) {
      return x.estado === ESTADO_ENTREGA_INICIAL;
    });

    return _resOk({
      totales: {
        voluntarios: voluntarios.length,
        activos: porEstado['Activo'] || 0,
        porEstado: porEstado,
        porCategoria: porCategoria,
        porGrado: porGradoConteo,
        porCargo: porCargoConteo,
        porArea: porAreaConteo
      },
      alertas: {
        credencialesPorVencer: vencimientos.length,
        capacitacionesVencidas: capacitacionesVencidas.length,
        devolucionesPendientes: entregasPendientes.length
      }
    });
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function _areaDeCargo(ss, cargoId) {
  var cargo = _buscarV2(ss, HOJA_V2.cargos, COL_CARGO, N_COLS_CARGO, function (c) {
    return String(c.id) === String(cargoId);
  });
  return cargo ? String(cargo.areaId || '') : '';
}

function obtenerNominaV2(filtros) {
  filtros = filtros || {};
  try {
    var ss = _ss();
    var voluntarios = _tablaV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2);
    var personas = _tablaV2(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA);
    var porPersona = {};
    for (var p = 0; p < personas.length; p++) porPersona[String(personas[p].id)] = personas[p];

    var grados = _tablaV2(ss, HOJA_V2.grados, COL_GRADO, N_COLS_GRADO);
    var porGrado = {};
    for (var g = 0; g < grados.length; g++) porGrado[String(grados[g].id)] = grados[g];
    var cargos = _tablaV2(ss, HOJA_V2.cargos, COL_CARGO, N_COLS_CARGO);
    var porCargo = {};
    for (var c = 0; c < cargos.length; c++) porCargo[String(cargos[c].id)] = cargos[c];
    var areas = _tablaV2(ss, HOJA_V2.areas, COL_AREA, N_COLS_AREA);
    var porArea = {};
    for (var a = 0; a < areas.length; a++) porArea[String(areas[a].id)] = areas[a];

    var gradosPorVol = {};
    var histGrados = _tablaV2(ss, HOJA_V2.historialGrados, COL_HIST_GRADO, N_COLS_HIST_GRADO);
    for (var hg = 0; hg < histGrados.length; hg++) {
      if (histGrados[hg].fechaHasta) continue;
      gradosPorVol[String(histGrados[hg].voluntarioId)] = histGrados[hg];
    }
    var cargosPorVol = {};
    var histCargos = _tablaV2(ss, HOJA_V2.historialCargos, COL_HIST_CARGO, N_COLS_HIST_CARGO);
    for (var hc = 0; hc < histCargos.length; hc++) {
      if (histCargos[hc].fechaHasta) continue;
      cargosPorVol[String(histCargos[hc].voluntarioId)] = histCargos[hc];
    }

    var res = [];
    var retiros = _tablaV2(ss, HOJA_V2.retirosTemporales, COL_RETIRO_TEMPORAL, N_COLS_RETIRO_TEMPORAL);
    var retiroPorVol = {};
    for (var rv = 0; rv < retiros.length; rv++) {
      if (String(retiros[rv].estado || '') === 'Activo') retiroPorVol[String(retiros[rv].voluntarioId)] = retiros[rv];
    }
    for (var v = 0; v < voluntarios.length; v++) {
      var vol = voluntarios[v];
      if (filtros.estado && String(vol.estado || '') !== String(filtros.estado)) continue;
      if (filtros.categoria && String(vol.categoria || '') !== String(filtros.categoria)) continue;
      var vid = String(vol.id);
      var hg2 = gradosPorVol[vid];
      var hc2 = cargosPorVol[vid];
      var grado = hg2 ? porGrado[String(hg2.gradoId)] : null;
      var cargo = hc2 ? porCargo[String(hc2.cargoId)] : null;
      var area = cargo ? porArea[String(cargo.areaId)] : null;
      if (filtros.areaId && !(area && String(area.id) === String(filtros.areaId))) continue;
      var persona = porPersona[String(vol.personaId)];
      var ant = _calcularAntiguedadV2({
        desde: vol.fechaIngreso,
        hasta: _parseDate(vol.fechaEgreso) || null,
        periodos: _periodosDescontablesV2(ss, vid),
        descontar: _configSi(ss, 'RETIRO_AFECTA_ANTIGUEDAD_INSTITUCIONAL', true)
      });
      var retiroActivo = retiroPorVol[vid] || null;
      res.push({
        id: vid,
        run: persona ? String(persona.run || '') : '',
        nombre: _nombreVoluntarioV2(personas, porPersona, vol),
        estado: String(vol.estado || ''),
        categoria: String(vol.categoria || ''),
        grado: grado ? String(grado.nombre || '') : '',
        gradoOrden: grado ? Number(grado.orden || 0) : 99,
        cargo: cargo ? String(cargo.nombre || '') : '',
        area: area ? String(area.nombre || '') : '',
        fechaIngreso: _fechaV2(vol.fechaIngreso),
        antiguedadAnios: Math.round(ant.ms / (365.25 * 24 * 3600 * 1000) * 10) / 10,
        antiguedadTexto: ant.texto,
        enRetiro: !!retiroActivo,
        retiroDesde: retiroActivo ? _fechaV2(retiroActivo.fechaInicio) : ''
      });
    }
    res.sort(function (a, b) { return a.gradoOrden - b.gradoOrden || _norm(a.nombre).localeCompare(_norm(b.nombre)); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function obtenerAlertasV2() {
  try {
    var ss = _ss();
    var alertas = [];
    var vencimientos = obtenerVencimientosV2().data;
    for (var i = 0; i < vencimientos.length; i++) {
      alertas.push({
        severidad: vencimientos[i].estado === 'Vencida' ? 'critica' : 'aviso',
        modulo: 'credenciales',
        texto: vencimientos[i].voluntario + ' — credencial "' + vencimientos[i].credencial + '" ' + (vencimientos[i].estado === 'Vencida' ? 'VENCIDA' : 'por vencer') + ' (' + vencimientos[i].fechaVencimiento + ')'
      });
    }
    var capacitaciones = obtenerCapacitacionesVencidasV2().data;
    for (var j = 0; j < capacitaciones.length; j++) {
      alertas.push({
        severidad: 'aviso',
        modulo: 'capacitaciones',
        texto: capacitaciones[j].voluntario + ' — capacitación "' + capacitaciones[j].capacitacion + '" vencida (' + capacitaciones[j].fechaVencimiento + ')'
      });
    }
    var pendientes = _leerEntregas(ss).filter(function (x) {
      return x.estado === ESTADO_ENTREGA_INICIAL;
    });
    for (var k = 0; k < pendientes.length; k++) {
      alertas.push({
        severidad: 'aviso',
        modulo: 'equipamiento',
        texto: pendientes[k].voluntario + ' — ' + pendientes[k].elemento + (pendientes[k].talla ? ' ' + pendientes[k].talla : '') + ' x' + pendientes[k].cantidad + ' pendiente de devolución (' + pendientes[k].id + ')'
      });
    }
    var inventario = _leerInventario(ss);
    var umbral = _configNumero(ss, 'STOCK_BAJO', STOCK_BAJO_DEFECTO);
    // V3.4D: solo alerta si hay stock registrado (>0). Un elemento sin
    // existencias (cantidad 0/vacía) no debe alertar "quedan 0".
    for (var l = 0; l < inventario.length; l++) {
      if (inventario[l].estado === 'Disponible' && Number(inventario[l].cantidad) > 0 && Number(inventario[l].cantidad) <= umbral) {
        alertas.push({
          severidad: 'critica',
          modulo: 'equipamiento',
          texto: 'Stock bajo: ' + inventario[l].elemento + (inventario[l].talla ? ' ' + inventario[l].talla : '') + ' — quedan ' + inventario[l].cantidad
        });
      }
    }
    // V3.4E: 3+ inasistencias injustificadas (estado 'Ausente') en el mes en
    // curso → ALERTA / REVISIÓN (NUNCA baja automática). La falta relevante
    // queda analizable por separado, sin mezclar con la actividad operativa.
    try {
      var servicios = _tablaV2(ss, HOJA_V2.servicios, COL_SERVICIO, N_COLS_SERVICIO);
      var ahoraE = new Date();
      var mesActual = ahoraE.getFullYear() + '-' + ('0' + (ahoraE.getMonth() + 1)).slice(-2);
      var serviciosMes = {};
      for (var sm = 0; sm < servicios.length; sm++) {
        var fServ = String(servicios[sm].fecha || '');
        var partesF = fServ.split('/');
        if (partesF.length === 3 && partesF[2].length === 4 && (partesF[2] + '-' + partesF[1]) === mesActual) {
          serviciosMes[String(servicios[sm].id)] = true;
        }
      }
      if (Object.keys(serviciosMes).length) {
        var marcajes = _tablaV2(ss, HOJA_V2.asistencia, COL_ASISTENCIA, N_COLS_ASISTENCIA);
        var personas = _tablaV2(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA);
        var nombrePorPersona = {};
        for (var np = 0; np < personas.length; np++) {
          nombrePorPersona[String(personas[np].id)] = [personas[np].nombres, personas[np].apPaterno, personas[np].apMaterno]
            .filter(function (s) { return String(s).trim(); }).join(' ');
        }
        var faltasPorVol = {};
        for (var mj = 0; mj < marcajes.length; mj++) {
          if (!serviciosMes[String(marcajes[mj].servicioId)]) continue;
          if (String(marcajes[mj].estado || '') !== 'Ausente') continue;
          var vid = String(marcajes[mj].voluntarioId);
          faltasPorVol[vid] = (faltasPorVol[vid] || 0) + 1;
        }
        for (var fv in faltasPorVol) {
          if (faltasPorVol.hasOwnProperty(fv) && faltasPorVol[fv] >= 3) {
            alertas.push({
              severidad: 'aviso',
              modulo: 'asistencia',
              texto: (nombrePorPersona[fv] || 'Vol. N° ' + fv) + ' — ' + faltasPorVol[fv] + ' inasistencias injustificadas este mes (revisión)'
            });
          }
        }
      }
    } catch (eAsist) {
      // La alerta de asistencia es complementaria: un fallo aquí no debe
      // bloquear el resto de las alertas.
    }
    alertas.sort(function (a, b) {
      var s = { critica: 0, aviso: 1, info: 2 };
      return (s[a.severidad] || 2) - (s[b.severidad] || 2);
    });
    return _resOk({
      total: alertas.length,
      criticas: alertas.filter(function (x) { return x.severidad === 'critica'; }).length,
      alertas: alertas
    });
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}