/**
 * 09_Pruebas.js — Autodiagnóstico: verifica constantes, validadores, estructura y log.
 * Ejecutar desde el menú ⚙️ Sistema → Ejecutar pruebas.
 */

function ejecutarPruebas() {
  var ss = _ss();
  var fallas = 0;
  var lineas = [];

  function marcar(nombre, ok, detalle) {
    if (!ok) fallas++;
    lineas.push((ok ? '✔' : '✘') + ' ' + nombre + (detalle ? ' — ' + detalle : ''));
  }

  // 1. Coherencia de constantes (20 columnas Voluntarios)
  var cols = [
    COL.id, COL.run, COL.nombres, COL.apPaterno, COL.apMaterno, COL.fechaNac,
    COL.sexo, COL.telefono, COL.correo, COL.direccion, COL.comuna,
    COL.emergenciaNombre, COL.emergenciaTelefono, COL.fechaIngreso,
    COL.estado, COL.categoria, COL.cargo, COL.observaciones,
    COL.fechaRegistro, COL.ultimaActualizacion
  ];
  marcar('Constantes: columnas 1..' + N_COLS, cols.length === N_COLS && cols.every(function (c, i) { return c === i + 1; }));
  marcar('Constantes: ENCABEZADOS = N_COLS', ENCABEZADOS.length === N_COLS);
  marcar('Constantes: columnas sistema (19, 20)', COL_SISTEMA_VOLUNTARIOS.join(',') === '19,20');
  marcar('Constantes: CONFIG_DEF coherente', CONFIG_DEF.length === 13 && CONFIG_DEF[1][0] === 'ESTADOS' && CONFIG_DEF[4][0] === 'CARGO' && CONFIG_DEF[5][0] === 'TIPOS_ELEMENTO' && CONFIG_DEF[6][0] === 'STOCK_BAJO' && CONFIG_DEF[6][2] === 'numero' && CONFIG_DEF[7][0] === 'MIN_ASIST_VOLUNTARIOS_REGIMEN' && CONFIG_DEF[12][0] === 'ALERTA_CAPACITACION_DIAS');

  // 2. Catálogo / Inventario / Entregas
  marcar('Constantes: prefijos de ID', ID_PREFIJOS.catalogo === 'E-' && ID_PREFIJOS.inventario === 'INV-' && ID_PREFIJOS.entrega === 'ENT-');
  marcar('Constantes: estados inventario', ESTADOS_INVENTARIO.length === 5 && ESTADOS_INVENTARIO[0] === 'Disponible');
  marcar('Constantes: estados entrega', ESTADOS_ENTREGA.length === 6 && ESTADOS_ENTREGA[0] === 'Pendiente de devolución');
  marcar('Constantes: catálogo inicial (12)', CATALOGO_INICIAL.length === 12, String(CATALOGO_INICIAL.length));
  marcar('Constantes: catálogo inicial coherente', CATALOGO_INICIAL.every(function (e) { return e.length === 3 && typeof e[1] === 'boolean' && typeof e[2] === 'boolean'; }));

  // 3. Validación RUT
  marcar('RUT válido "11111111-1"', _validarRUT('11111111-1').ok);
  marcar('RUT válido "12345678-5"', _validarRUT('12345678-5').ok);
  marcar('RUT con DV malo "12345678-0"', !_validarRUT('12345678-0').ok, _validarRUT('12345678-0').error);
  marcar('RUT sin DV calcula "12345678"', _validarRUT('12345678').ok && _validarRUT('12345678').run === '12345678-5', _validarRUT('12345678').run);
  marcar('RUT pegado "123456785"', _validarRUT('123456785').ok && _validarRUT('123456785').run === '12345678-5', _validarRUT('123456785').run);
  marcar('RUT con puntos "11.111.111-1"', _validarRUT('11.111.111-1').ok);
  marcar('RUT inválido "abc"', !_validarRUT('abc').ok);
  marcar('RUT vacío', !_validarRUT('').ok);

  // 4. Fechas
  marcar('Fecha "15/08/2026"', _parseDate('15/08/2026') !== null);
  marcar('Fecha imposible "31/02/2026"', _parseDate('31/02/2026') === null);
  marcar('Fecha serial 46250', _parseDate(46250) !== null);
  marcar('Fecha inválida "hola"', _parseDate('hola') === null);
  marcar('Formato fecha', _fmtFecha(new Date(2026, 7, 15)) === '15/08/2026', _fmtFecha(new Date(2026, 7, 15)));

  // 5. Texto
  marcar('Mayúsculas "josé pérez"', _mayus('josé pérez') === 'José Pérez', _mayus('josé pérez'));
  marcar('Búsqueda sin acentos', _norm('José ÁLVAREZ') === 'jose alvarez', _norm('José ÁLVAREZ'));
  marcar('Título gramatical "gorra con cubrenuca"', _titulo('gorra con cubrenuca') === 'Gorra con Cubrenuca', _titulo('gorra con cubrenuca'));
  marcar('Título gramatical "polera pique"', _titulo('polera pique') === 'Polera Pique', _titulo('polera pique'));

  // 6. Helpers de respuesta canónica
  marcar('_resOk formato', _resOk({ a: 1 }).ok === true && _resOk({ a: 1 }).error === null);
  marcar('_resErr formato', _resErr('X', 'm').ok === false && _resErr('X', 'm').error.code === 'X');
  marcar('_siguienteIdPrefijo', _siguienteIdPrefijo(['E-001', 'E-012', 'x'], 'E-') === 'E-013', _siguienteIdPrefijo(['E-001', 'E-012', 'x'], 'E-'));
  marcar('_estadoFinalDevolucion completo', _estadoFinalDevolucion(3, 3, 0, 0) === 'Devuelto');
  marcar('_estadoFinalDevolucion parcial', _estadoFinalDevolucion(3, 2, 1, 0) === 'Devuelto parcial');
  marcar('_estadoFinalDevolucion dañado', _estadoFinalDevolucion(3, 0, 1, 0) === 'Dañado');
  marcar('_estadoFinalDevolucion extraviado', _estadoFinalDevolucion(3, 0, 0, 1) === 'Extraviado');

  // 7. Correo y teléfono
  marcar('Correo válido "a@b.cl"', _esCorreoValido('a@b.cl'));
  marcar('Correo inválido "a@b"', !_esCorreoValido('a@b'));
  marcar('Teléfono válido "+56 9 8765 4321"', _esTelefonoValido('+56 9 8765 4321'));
  marcar('Teléfono inválido "123"', !_esTelefonoValido('123'));

  // 8. Estructura (6 pestañas)
  var shV = ss.getSheetByName(HOJA.voluntarios);
  var shC = ss.getSheetByName(HOJA.catalogo);
  var shI = ss.getSheetByName(HOJA.inventario);
  var shE = ss.getSheetByName(HOJA.entregas);
  var shCf = ss.getSheetByName(HOJA.config);
  var shL = ss.getSheetByName(HOJA.log);
  marcar('Pestaña ' + HOJA.voluntarios, !!shV);
  marcar('Pestaña ' + HOJA.catalogo, !!shC);
  marcar('Pestaña ' + HOJA.inventario, !!shI);
  marcar('Pestaña ' + HOJA.entregas, !!shE);
  marcar('Pestaña ' + HOJA.config, !!shCf);
  marcar('Pestaña ' + HOJA.log, !!shL);
  if (shV && shV.getLastRow() > 0) {
    var cab = shV.getRange(1, 1, 1, N_COLS).getValues()[0];
    marcar('Encabezados de Voluntarios', ENCABEZADOS.every(function (h, i) { return String(cab[i] || '') === h; }));
  } else {
    marcar('Encabezados de Voluntarios', false, 'hoja vacía: ejecuta Crear estructura base');
  }
  if (shC && shC.getLastRow() > 1) {
    var ids = shC.getRange(PRIMERA_FILA_DATO, 1, shC.getLastRow() - PRIMERA_FILA_DATO + 1, 1).getValues();
    var idsOK = ids.every(function (f) { return String(f[0]).indexOf('E-') === 0; });
    marcar('Catálogo sembrado (IDs E-*)', idsOK && ids.length >= 12, 'filas: ' + ids.length);
  } else {
    marcar('Catálogo sembrado (IDs E-*)', false, 'vacío: ejecuta Crear estructura base');
  }

  // 9. Backend API (funciones JSON llamables por la futura Web App)
  var apis = ['crearVoluntario', 'actualizarVoluntario', 'buscarVoluntarios', 'obtenerFichaVoluntario', 'darDeBajaVoluntario',
    'crearElemento', 'actualizarElemento', 'buscarElementos', 'registrarEntradaInventario', 'ajustarInventario',
    'obtenerInventario', 'buscarInventario', 'registrarEntrega', 'registrarDevolucion', 'obtenerEquipamientoVoluntario',
    'obtenerHistorialEntregas', 'obtenerEntrega', 'obtenerHistorial', 'obtenerConfiguracion'];
  for (var a = 0; a < apis.length; a++) {
    marcar('API: ' + apis[a] + ' expuesta', typeof eval(apis[a]) === 'function');
  }

  // 10. Validador compartido (usado por onEdit y por la API)
  var ctxVacio = { estados: [], categorias: [], sexos: [], cargos: [] };
  marcar('Validador: normaliza nombre', _validarCampoVoluntario(COL.nombres, 'juan  carlos', ctxVacio).normalizado === 'Juan Carlos');
  marcar('Validador: RUN con puntos normaliza', _validarCampoVoluntario(COL.run, '11.111.111-1', ctxVacio).normalizado === '11111111-1');
  marcar('Validador: fecha imposible rechazada', !_validarCampoVoluntario(COL.fechaNac, '31/02/2026', ctxVacio).valido);
  marcar('Validador: estado fuera de lista rechazado', !_validarCampoVoluntario(COL.estado, 'Fuera', { estados: ['Activo'], categorias: [], sexos: [], cargos: [] }).valido);
  marcar('Validador: estado válido aceptado', _validarCampoVoluntario(COL.estado, 'Activo', { estados: ['Activo'], categorias: [], sexos: [], cargos: [] }).valido);
  marcar('Validador: cargo fuera de lista rechazado', !_validarCampoVoluntario(COL.cargo, 'Fuera', { estados: [], categorias: [], sexos: [], cargos: ['Jefe de Grupo'] }).valido);
  marcar('Validador: cargo válido aceptado', _validarCampoVoluntario(COL.cargo, 'Jefe de Grupo', { estados: [], categorias: [], sexos: [], cargos: ['Jefe de Grupo'] }).valido);
  marcar('Validador: correo inválido rechazado', !_validarCampoVoluntario(COL.correo, 'a@b', ctxVacio).valido);

  // 11. Fila → objeto (contrato de datos de la API)
  var filaDemo = ['1', '11111111-1', 'Juan', 'Pérez', '', '15/08/1990', 'Masculino', '987654321', '', '', '', '', '', '', 'Activo', 'Voluntario', 'Jefe de Grupo', '', '01/01/2026', '02/01/2026'];
  var objDemo = _filaAObjeto(filaDemo);
  marcar('API: fila → objeto (nombreCompleto)', objDemo.nombreCompleto === 'Juan Pérez', objDemo.nombreCompleto);
  marcar('API: fila → objeto (cargo)', objDemo.cargo === 'Jefe de Grupo', objDemo.cargo);
  marcar('API: fila → objeto (fecha texto)', objDemo.fechaNacimiento === '15/08/1990', objDemo.fechaNacimiento);
  marcar('API: fila → objeto (fecha sistema)', objDemo.fechaRegistro === '01/01/2026', objDemo.fechaRegistro);

  // 12. Config
  var estados = _configLista(ss, 'ESTADOS');
  marcar('Config ESTADOS leídos', estados.length > 0, estados.join(', '));

  // 12b. V2 — coherencia de constantes y semillas
  marcar('V2: HOJA_V2 30 hojas', Object.keys(HOJA_V2).length === 30, String(Object.keys(HOJA_V2).length));
  marcar('V2: GRADOS_V2 7 grados oficiales (sin Disponible)', GRADOS_V2.length === 7 && GRADOS_V2[0][0] === 'Comandante Local' && GRADOS_V2[6][0] === 'Voluntario' && GRADOS_V2[1][0] === 'Jefe de sede' && GRADOS_V2.every(function (g) { return g[0] !== 'Disponible'; }));
  marcar('V3.4H: GRADOS_V2 Jefe de sede en posición 2', GRADOS_V2[1][0] === 'Jefe de sede' && GRADOS_V2[1][1] === 2);
  marcar('V2: AREAS_V2 9 áreas (Mando primero)', AREAS_V2.length === 9 && AREAS_V2[0][0] === 'Mando');
  marcar('V2: CARGOS_V2 6 cargos', CARGOS_V2.length === 6 && CARGOS_V2[0][0] === 'Comandante Local');
  marcar('V2: ESPECIALIDADES_V2 10', ESPECIALIDADES_V2.length === 10);
  marcar('V2: SUBESPECIALIDADES_V2 2', SUBESPECIALIDADES_V2.length === 2);
  marcar('V3.4H: ESTADOS_TIPO_CREDENCIAL 2', typeof ESTADOS_TIPO_CREDENCIAL !== 'undefined' && ESTADOS_TIPO_CREDENCIAL.length === 2 && ESTADOS_TIPO_CREDENCIAL[0] === 'Activo' && ESTADOS_TIPO_CREDENCIAL[1] === 'Inactivo');
  marcar('V2: UNIDADES_V2 2 (F.T. Delta INTERNA)', UNIDADES_V2.length === 2 && UNIDADES_V2[0][0] === 'Fuerza de Tarea Delta');
  marcar('V2: TIPOS_SERVICIO_V2 11', TIPOS_SERVICIO_V2.length === 11);
  marcar('V2: ESTADOS_ASISTENCIA_V2 6', ESTADOS_ASISTENCIA_V2.length === 6);
  marcar('V2: TIPOS_DOCUMENTO_V2 6', TIPOS_DOCUMENTO_V2.length === 6);
  marcar('V2: TIPOS_EVENTO_HOJA 13 (con REINCORPORACION)', TIPOS_EVENTO_HOJA.length === 13 && TIPOS_EVENTO_HOJA.indexOf('INGRESO') === 0 && TIPOS_EVENTO_HOJA.indexOf('REINCORPORACION') === 11 && TIPOS_EVENTO_HOJA.indexOf('EGRESO') === 12);
  marcar('V2: PERFILES 4', PERFILES.length === 4 && PERFILES[0] === 'Administrador');
  marcar('V2: columnas extendidas Catálogo (9) / Inventario (10) / Servicio (23) / Devolución (10)', N_COLS_CATALOGO === 9 && N_COLS_INVENTARIO === 10 && N_COLS_SERVICIO === 23 && N_COLS_DEVOLUCION === 10);
  marcar('V2: MATRIZ_PERMISOS_BASE coherente', MATRIZ_PERMISOS_BASE.length >= 17 && MATRIZ_PERMISOS_BASE[0].join('/') === 'Administrador/*/*');

  // 12b2. V3.1 — separación Grado/Categoría/Estado + sincronización idempotente de catálogos
  var catDefault = '';
  for (var cdi = 1; cdi < CONFIG_DEF.length; cdi++) {
    if (CONFIG_DEF[cdi][0] === 'CATEGORIAS') catDefault = String(CONFIG_DEF[cdi][1]);
  }
  var estDefault = '';
  for (var edi = 1; edi < CONFIG_DEF.length; edi++) {
    if (CONFIG_DEF[edi][0] === 'ESTADOS') estDefault = String(CONFIG_DEF[edi][1]);
  }
  marcar('V3.1: CATEGORIAS default = Aspirante,Disponible,Voluntario,Reserva', catDefault === 'Aspirante,Disponible,Voluntario,Reserva', catDefault);
  marcar('V3.1: ESTADOS default sin Disponible', estDefault === 'Activo,Inactivo,Suspendido,Egresado' && estDefault.indexOf('Disponible') === -1, estDefault);
  marcar('V3.1: ESQUEMA_V2 = 1.2', ESQUEMA_V2 === '1.2', ESQUEMA_V2);

  function _hojaV2Mock(filas, nombre) {
    var f = filas.map(function (r) { return r.slice(); });
    return {
      getName: function () { return nombre; },
      getLastRow: function () { return f.length; },
      getRange: function (a, b, r, n) {
        var self = this;
        return {
          getValues: function () {
            var out = [];
            for (var i = 0; i < r; i++) {
              var src = f[a - 1 + i] || [];
              out.push(src.slice(b - 1, b - 1 + (n || 1)));
            }
            return out;
          },
          setValue: function (v) { f[a - 1][b - 1] = v; },
          setValues: function (vals) {
            for (var i = 0; i < vals.length; i++) {
              if (!f[a - 1 + i]) f[a - 1 + i] = [];
              for (var j = 0; j < vals[i].length; j++) f[a - 1 + i][b - 1 + j] = vals[i][j];
            }
          }
        };
      },
      deleteRow: function (fila) { f.splice(fila - 1, 1); },
      insertRowAfter: function (fila) { f.splice(fila, 0, []); },
      _filas: function () { return f; }
    };
  }
  function _ssV2Mock(hojas) {
    return { getSheetByName: function (n) { return hojas[n] || null; } };
  }
  function _filaGrado(id, nombre, orden, origen, activo) {
    return [id, nombre, orden, '', origen, activo, ''];
  }

  var gradosConDisponible = [
    ['ID', 'Nombre', 'Orden', 'Insignia', 'Origen', 'Activo', 'Observaciones'],
    ['', '', '', '', '', '', ''],
    _filaGrado(1, 'Comandante Local', 1, 'OFICIAL', true), _filaGrado(2, 'Instructor Mayor', 2, 'OFICIAL', true),
    _filaGrado(3, 'Instructor', 3, 'OFICIAL', true), _filaGrado(4, 'Subinstructor', 4, 'OFICIAL', true),
    _filaGrado(5, 'Voluntario Mayor', 5, 'OFICIAL', true), _filaGrado(6, 'Voluntario', 6, 'OFICIAL', true),
    _filaGrado(7, 'Disponible', 7, 'INTERNO', true)
  ];
  var shGrados = _hojaV2Mock(gradosConDisponible, 'Grados');
  var ssMock = _ssV2Mock({ 'Grados': shGrados, 'Historial Grados': _hojaV2Mock([['ID', 'Voluntario ID', 'Grado ID'], ['', '', '']], 'Historial Grados') });
  var rG1 = _sincronizarGradosV2(ssMock, shGrados);
  marcar('V3.1: Disponible sin referencias se elimina (7→6)', rG1.eliminados === 1 && shGrados._filas().length === 8, JSON.stringify(rG1));
  marcar('V3.1: sincronización idempotente (2ª ejecución sin cambios)', _sincronizarGradosV2(ssMock, shGrados).eliminados === 0 && _sincronizarGradosV2(ssMock, shGrados).desactivados === 0);

  var shGradosRef = _hojaV2Mock(gradosConDisponible, 'Grados');
  var ssMockRef = _ssV2Mock({
    'Grados': shGradosRef,
    'Historial Grados': _hojaV2Mock([['ID', 'Voluntario ID', 'Grado ID'], ['', '', ''], [1, 10, 7]], 'Historial Grados')
  });
  var rG2 = _sincronizarGradosV2(ssMockRef, shGradosRef);
  var fila8 = shGradosRef._filas()[8];
  marcar('V3.1: Disponible con referencias NO se elimina (se desactiva)', rG2.eliminados === 0 && rG2.desactivados === 1 && shGradosRef._filas().length === 9 && fila8[5] === false && String(fila8[6]).indexOf('V3.1') !== -1);

  var shGradosFaltante = _hojaV2Mock([
    ['ID', 'Nombre', 'Orden', 'Insignia', 'Origen', 'Activo', 'Observaciones'],
    ['', '', '', '', '', '', ''],
    _filaGrado(1, 'Comandante Local', 1, 'OFICIAL', true), _filaGrado(2, 'Instructor Mayor', 2, 'OFICIAL', true),
    _filaGrado(3, 'Instructor', 3, 'OFICIAL', true), _filaGrado(4, 'Subinstructor', 4, 'OFICIAL', true),
    _filaGrado(5, 'Voluntario Mayor', 5, 'OFICIAL', true)
  ], 'Grados');
  var ssMockFalt = _ssV2Mock({ 'Grados': shGradosFaltante, 'Historial Grados': _hojaV2Mock([['ID', 'Voluntario ID', 'Grado ID'], ['', '', '']], 'Historial Grados') });
  marcar('V3.1: grados faltantes de la semilla se agregan', _sincronizarGradosV2(ssMockFalt, shGradosFaltante).agregados === 1 && shGradosFaltante._filas().length === 8 && shGradosFaltante._filas()[7][1] === 'Voluntario');

  function _configMockFilas(valorCategorias) {
    return [['Parámetro', 'Valor'], ['ESTADOS', 'Activo,Inactivo,Suspendido,Egresado'], ['CATEGORIAS', valorCategorias]];
  }
  var shCfgDefault = _hojaV2Mock(_configMockFilas('Aspirante,Voluntario'), 'Config');
  var rC1 = _sincronizarConfigV2(_ssV2Mock({ 'Config': shCfgDefault }));
  marcar('V3.1: CATEGORIAS default anterior se actualiza', rC1.actualizado === true && shCfgDefault._filas()[2][1] === 'Aspirante,Disponible,Voluntario,Reserva');
  var shCfgNuevo = _hojaV2Mock(_configMockFilas('Aspirante,Disponible,Voluntario,Reserva'), 'Config');
  marcar('V3.1: CATEGORIAS ya actualizada no se reescribe', _sincronizarConfigV2(_ssV2Mock({ 'Config': shCfgNuevo })).actualizado === false);
  var shCfgPers = _hojaV2Mock(_configMockFilas('Personalizada'), 'Config');
  var rC2 = _sincronizarConfigV2(_ssV2Mock({ 'Config': shCfgPers }));
  marcar('V3.1: CATEGORIAS personalizada NO se sobrescribe y se reporta', rC2.actualizado === false && rC2.personalizado === 'Personalizada' && shCfgPers._filas()[2][1] === 'Personalizada');

  // 12b3. V3.2 — Retiros temporales: constantes, antigüedad pura y reparación estructural
  marcar('V3.2: HOJA_V2.retirosTemporales = RetirosTemporales', HOJA_V2.retirosTemporales === 'RetirosTemporales');
  marcar('V3.2: COL_RETIRO_TEMPORAL 16 columnas', N_COLS_RETIRO_TEMPORAL === 16 && Object.keys(COL_RETIRO_TEMPORAL).length === 16);
  marcar('V3.2: ESTADOS_RETIRO_TEMPORAL Activo/Finalizado/Anulado', ESTADOS_RETIRO_TEMPORAL.length === 3 && ESTADOS_RETIRO_TEMPORAL[0] === 'Activo' && ESTADOS_RETIRO_TEMPORAL[1] === 'Finalizado' && ESTADOS_RETIRO_TEMPORAL[2] === 'Anulado');
  var retirosCfg = 0;
  for (var rci = 1; rci < CONFIG_DEF.length; rci++) {
    if (String(CONFIG_DEF[rci][0]).indexOf('RETIRO_AFECTA_ANTIGUEDAD_') === 0) retirosCfg++;
  }
  marcar('V3.2: Config RETIRO_AFECTA_ANTIGUEDAD_* (3)', retirosCfg === 3, String(retirosCfg));

  var ant0 = _calcularAntiguedadV2({ desde: '01/01/2020', hasta: '01/01/2022', periodos: [{ inicio: '01/01/2021', termino: '01/03/2021' }], descontar: false });
  var ant1 = _calcularAntiguedadV2({ desde: '01/01/2020', hasta: '01/01/2022', periodos: [{ inicio: '01/01/2021', termino: '01/03/2021' }], descontar: true });
  marcar('V3.2: antigüedad sin descuento = 731 días', ant0.dias === 731, String(ant0.dias));
  marcar('V3.2: retiro de 59 días descuenta (731-59=672)', ant1.dias === 672, String(ant1.dias));
  marcar('V3.2: texto duración derivado', _textoDuracionV2(0) === '0 días' && _textoDuracionV2(365.25 * 86400000) === '1 año');

  var shGRep = _hojaV2Mock([
    ['ID', 'Nombre', 'Orden', 'Insignia', 'Origen', 'Activo', 'Observaciones'],
    _filaGrado(1, 'Comandante Local', 1, 'OFICIAL', true),
    _filaGrado(2, 'Instructor Mayor', 2, 'OFICIAL', true), _filaGrado(3, 'Instructor', 3, 'OFICIAL', true),
    _filaGrado(4, 'Subinstructor', 4, 'OFICIAL', true), _filaGrado(5, 'Voluntario Mayor', 5, 'OFICIAL', true),
    _filaGrado(6, 'Voluntario', 6, 'OFICIAL', true), _filaGrado(7, 'Comandante Local', 1, 'OFICIAL', true)
  ], 'Grados');
  var ssMockRep = _ssV2Mock({
    'Grados': shGRep,
    'Historial Grados': _hojaV2Mock([['ID', 'Voluntario ID', 'Grado ID'], ['', '', ''], [1, 10, 7]], 'Historial Grados')
  });
  var rRep = _repararCatalogosV2(ssMockRep);
  var filasRep = shGRep._filas();
  var gR = rRep.porHoja.filter(function (x) { return x.key === 'grados'; })[0];
  marcar('V3.2: reparación mueve fila 2 (artefacto de siembra)', gR.movidasFila2 === 1, JSON.stringify(gR));
  marcar('V3.2: duplicado CON referencias se desactiva (no se elimina)', gR.eliminados === 0 && gR.desactivados === 1 && filasRep.length === 9, 'filas ' + filasRep.length);
  var rRep2 = _repararCatalogosV2(ssMockRep);
  var gR2 = rRep2.porHoja.filter(function (x) { return x.key === 'grados'; })[0];
  marcar('V3.2: reparación idempotente (2ª ejecución sin cambios)', gR2.movidasFila2 === 0 && gR2.eliminados === 0 && gR2.desactivados === 0);

  var shGRep2 = _hojaV2Mock([
    ['ID', 'Nombre', 'Orden', 'Insignia', 'Origen', 'Activo', 'Observaciones'],
    _filaGrado(1, 'Comandante Local', 1, 'OFICIAL', true),
    _filaGrado(2, 'Instructor Mayor', 2, 'OFICIAL', true), _filaGrado(3, 'Instructor', 3, 'OFICIAL', true),
    _filaGrado(4, 'Subinstructor', 4, 'OFICIAL', true), _filaGrado(5, 'Voluntario Mayor', 5, 'OFICIAL', true),
    _filaGrado(6, 'Voluntario', 6, 'OFICIAL', true), _filaGrado(7, 'Comandante Local', 1, 'OFICIAL', true)
  ], 'Grados');
  var ssMockRep2 = _ssV2Mock({ 'Grados': shGRep2, 'Historial Grados': _hojaV2Mock([['ID', 'Voluntario ID', 'Grado ID'], ['', '', '']], 'Historial Grados') });
  var rRep3 = _repararCatalogosV2(ssMockRep2);
  var gR3 = rRep3.porHoja.filter(function (x) { return x.key === 'grados'; })[0];
  marcar('V3.2: duplicado SIN referencias se elimina', gR3.eliminados === 1 && gR3.desactivados === 0 && shGRep2._filas().length === 8, 'filas ' + shGRep2._filas().length);

  function _sinDeleteRow(nombresFn) {
    for (var i = 0; i < nombresFn.length; i++) {
      try {
        if (String(eval(nombresFn[i])).indexOf('deleteRow') !== -1) return false;
      } catch (e) { return false; }
    }
    return true;
  }
  function _hojaEventosV2Mock() {
    return _hojaV2Mock([['ID', 'Voluntario ID', 'Tipo Evento', 'Fecha', 'Detalle', 'Referencia ID', 'Quien Registró', 'Fecha Registro', 'Última Actualización']], HOJA_V2.hojaServicios);
  }

  // 12b4. V3.3 — INTEGRIDAD HISTÓRICA: constantes (activo al final de las 4 tablas)
  marcar('V3.3: COL_VOL_ESPECIALIDAD con activo (11)', N_COLS_VOL_ESPECIALIDAD === 11 && COL_VOL_ESPECIALIDAD.activo === 11);
  marcar('V3.3: COL_VOL_CAPACITACION con activo (12)', N_COLS_VOL_CAPACITACION === 12 && COL_VOL_CAPACITACION.activo === 12);
  marcar('V3.3: COL_ANOTACION con activo (12)', N_COLS_ANOTACION === 12 && COL_ANOTACION.activo === 12);
  marcar('V3.3: COL_DOCUMENTO con activo (12)', N_COLS_DOCUMENTO === 12 && COL_DOCUMENTO.activo === 12);
  marcar('V3.3: encabezados terminan en Activo (4 tablas)', ENCABEZADOS_VOL_ESPECIALIDAD[10] === 'Activo' && ENCABEZADOS_VOL_CAPACITACION[11] === 'Activo' && ENCABEZADOS_ANOTACION[11] === 'Activo' && ENCABEZADOS_DOCUMENTO[11] === 'Activo');
  marcar('V3.3: sin deleteRow en las 7 funciones de cierre', _sinDeleteRow(['quitarEspecialidadV2', 'quitarCredencialV2', 'quitarCapacitacionV2', 'quitarVoluntarioServicioV2', 'quitarAnotacionV2', 'quitarDocumentoV2', 'eliminarPermisoV2']));

  // 12b5. V3.3 — cierres lógicos con mocks de hoja (filas NUNCA se eliminan)
  var _ssOriginal33 = _ss;
  _ss = function () { return ssEsp; };
  var shEsp = _hojaV2Mock([
    ['ID', 'Voluntario ID', 'Especialidad ID', 'Subespecialidad ID', 'Fecha Asignación', 'Nivel', 'Credencial ID', 'Observaciones', 'Fecha Registro', 'Última Actualización', 'Activo'],
    ['', '', '', '', '', '', '', '', '', '', ''],
    [1, 10, 5, '', '10/01/2026', 'Básico', '', '', '10/01/2026', '10/01/2026', '']
  ], HOJA_V2.voluntarioEspecialidades);
  var ssEsp = _ssV2Mock({ [HOJA_V2.voluntarioEspecialidades]: shEsp, [HOJA_V2.hojaServicios]: _hojaEventosV2Mock() });
  var rE = quitarEspecialidadV2(1, { motivo: 'Retiro de especialidad' });
  marcar('V3.3: cierre especialidad conserva la fila', rE.ok && shEsp._filas().length === 3, 'filas ' + shEsp._filas().length);
  marcar('V3.3: cierre especialidad activo=false + motivo', rE.ok && shEsp._filas()[2][10] === false && String(shEsp._filas()[2][7]).indexOf('Cierre (V3.3)') !== -1, JSON.stringify(shEsp._filas()[2]));
  var rE2 = quitarEspecialidadV2(1);
  marcar('V3.3: cierre especialidad idempotente (sin duplicar motivo)', rE2.ok && rE2.data.yaCerrado === true && String(shEsp._filas()[2][7]).indexOf('Cierre (V3.3)') !== -1 && String(shEsp._filas()[2][7]).split('Cierre (V3.3)').length === 2);

  _ss = function () { return ssCred; };
  var shCred = _hojaV2Mock([
    ['ID', 'Voluntario ID', 'Credencial ID', 'Fecha Obtención', 'Estado', 'Observaciones', 'Fecha Registro', 'Última Actualización'],
    ['', '', '', '', '', '', '', ''],
    [1, 10, 3, '10/01/2026', 'Vigente', '', '10/01/2026', '10/01/2026']
  ], HOJA_V2.voluntarioCredenciales);
  var ssCred = _ssV2Mock({ [HOJA_V2.voluntarioCredenciales]: shCred, [HOJA_V2.hojaServicios]: _hojaEventosV2Mock() });
  var rC3 = quitarCredencialV2(1, { motivo: 'Extravío' });
  marcar('V3.3: revocación credencial conserva la fila (estado Revocada)', rC3.ok && shCred._filas().length === 3 && shCred._filas()[2][4] === 'Revocada', JSON.stringify(shCred._filas()[2]));

  _ss = function () { return ssCap; };
  var shCap = _hojaV2Mock([
    ['ID', 'Voluntario ID', 'Capacitación ID', 'Fecha', 'Fecha Vencimiento', 'Aprobado', 'Calificación', 'Respaldo', 'Observaciones', 'Fecha Registro', 'Última Actualización', 'Activo'],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    [1, 10, 4, '10/01/2026', '10/01/2027', 'TRUE', '', '', '', '10/01/2026', '10/01/2026', '']
  ], HOJA_V2.voluntarioCapacitaciones);
  var ssCap = _ssV2Mock({ [HOJA_V2.voluntarioCapacitaciones]: shCap, [HOJA_V2.hojaServicios]: _hojaEventosV2Mock() });
  var rCap = quitarCapacitacionV2(1, { motivo: 'No aprobada' });
  marcar('V3.3: cierre capacitación conserva la fila', rCap.ok && shCap._filas().length === 3 && shCap._filas()[2][11] === false, 'filas ' + shCap._filas().length);

  _ss = function () { return ssSV; };
  var shSV = _hojaV2Mock([
    ['ID', 'Servicio ID', 'Voluntario ID', 'Rol En Servicio', 'Asignado Por', 'Fecha Asignación', 'Estado', 'Observaciones'],
    ['', '', '', '', '', '', '', ''],
    [1, 20, 10, 'Radiocomunicaciones', 'Admin', '10/01/2026', 'Asignado', '']
  ], HOJA_V2.servicioVoluntarios);
  var ssSV = _ssV2Mock({ [HOJA_V2.servicioVoluntarios]: shSV });
  var rSV = quitarVoluntarioServicioV2(1, { motivo: 'Reemplazado' });
  marcar('V3.3: retiro de servicio conserva la fila (estado Retirado)', rSV.ok && shSV._filas().length === 3 && shSV._filas()[2][6] === 'Retirado', JSON.stringify(shSV._filas()[2]));

  _ss = function () { return ssAn; };
  var shAn = _hojaV2Mock([
    ['ID', 'Voluntario ID', 'Tipo', 'Fecha', 'Detalle', 'Autor', 'Sanción', 'Vigencia Hasta', 'Observaciones', 'Fecha Registro', 'Última Actualización', 'Activo'],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    [1, 10, 'Llamada de atención', '10/01/2026', 'Atraso', 'Admin', '', '', '', '10/01/2026', '10/01/2026', '']
  ], HOJA_V2.anotaciones);
  var ssAn = _ssV2Mock({ [HOJA_V2.anotaciones]: shAn });
  var rAn = quitarAnotacionV2(1, { motivo: 'Anotación sin fundamento' });
  marcar('V3.3: desactivación anotación conserva la fila', rAn.ok && shAn._filas().length === 3 && shAn._filas()[2][11] === false, 'filas ' + shAn._filas().length);

  _ss = function () { return ssDoc; };
  var shDoc = _hojaV2Mock([
    ['ID', 'Voluntario ID', 'Sede ID', 'Tipo', 'Fecha', 'Descripción', 'Referencia', 'Enlace', 'Observaciones', 'Fecha Registro', 'Última Actualización', 'Activo'],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    [1, 10, 1, 'Certificado', '10/01/2026', 'Certificado médico', '', '', '', '10/01/2026', '10/01/2026', '']
  ], HOJA_V2.documentos);
  var ssDoc = _ssV2Mock({ [HOJA_V2.documentos]: shDoc });
  var rDoc = quitarDocumentoV2(1, { motivo: 'Duplicado' });
  marcar('V3.3: desactivación documento conserva la fila', rDoc.ok && shDoc._filas().length === 3 && shDoc._filas()[2][11] === false, 'filas ' + shDoc._filas().length);

  _ss = function () { return ssPerm; };
  var shPerm = _hojaV2Mock([
    ['ID', 'Perfil', 'Módulo', 'Acción', 'Activo', 'Observaciones'],
    ['', '', '', '', '', ''],
    [1, 'Coordinador', 'voluntarios', 'crear', 'TRUE', '']
  ], HOJA_V2.permisos);
  var ssPerm = _ssV2Mock({ [HOJA_V2.permisos]: shPerm });
  var rPerm = eliminarPermisoV2(1, { motivo: 'Ya no aplica' });
  marcar('V3.3: revocación excepción conserva la fila (activo=false)', rPerm.ok && shPerm._filas().length === 3 && shPerm._filas()[2][4] === false, JSON.stringify(shPerm._filas()[2]));
  _ss = _ssOriginal33;

// 12c. V2 — funciones puras
  var base = new Date(1899, 11, 30);
  var hoySerial = Math.floor((new Date() - base.getTime()) / 86400000);
  marcar('V2: estado credencial vencida', _estadoCredencialDerivado({ fechaVencimiento: hoySerial - 5 }, 30) === 'Vencida');
  marcar('V2: estado credencial por vencer', _estadoCredencialDerivado({ fechaVencimiento: hoySerial + 10 }, 30) === 'Por vencer');
  marcar('V2: estado credencial vigente', _estadoCredencialDerivado({ fechaVencimiento: hoySerial + 60 }, 30) === 'Vigente');
  marcar('V2: estado credencial revocada manual', _estadoCredencialDerivado({ fechaVencimiento: hoySerial + 60, estado: 'Revocada' }, 30) === 'Revocada');
  var resumen = _resumenAsistencia([{ estado: 'Presente' }, { estado: 'Ausente' }, { estado: 'Asignado' }, { estado: 'Ausente justificado' }]);
  marcar('V2: resumen asistencia FUERZA TOTAL/FORMAN/FALTAN', resumen.fuerzaTotal === 4 && resumen.forman === 1 && resumen.faltan === 2, 'FT ' + resumen.fuerzaTotal + ' / forman ' + resumen.forman + ' / faltan ' + resumen.faltan);

  // 12d. V2 — API expuesta
  var apisV2 = ['crearEstructuraV2', 'estadoMigracionV2', 'migrarVoluntariosV2', 'listarPersonasV2', 'crearPersonaV2', 'actualizarPersonaV2', 'actualizarVoluntarioV2', 'darDeBajaVoluntarioV2', 'reactivarVoluntarioV2',
    'listarGradosV2', 'listarCargosV2', 'listarAreasV2', 'crearCargoV2', 'crearAreaV2', 'obtenerRequisitosGradoV2', 'asignarGradoV2', 'asignarCargoV2', 'obtenerHistorialGradosV2', 'obtenerHistorialCargosV2',
    'listarEspecialidadesV2', 'asignarEspecialidadV2', 'listarCredencialesV2', 'crearCredencialV2', 'asignarCredencialV2', 'obtenerVencimientosV2',
    'listarCapacitacionesV2', 'asignarCapacitacionV2', 'obtenerCapacitacionesVencidasV2',
    'listarTiposServicioV2', 'crearServicioV2', 'listarServiciosV2', 'obtenerServicioV2', 'asignarVoluntariosServicioV2', 'cambiarEstadoServicioV2',
    'registrarAsistenciaV2', 'obtenerAsistenciaServicioV2', 'obtenerResumenAsistenciaVoluntarioV2', 'obtenerEstadisticasAsistenciaV2',
    'agregarEventoV2', 'agregarAnotacionV2', 'agregarDocumentoV2', 'listarAnotacionesVoluntarioV2', 'listarDocumentosVoluntarioV2',
    'listarUnidadesV2', 'crearUnidadV2', 'asignarIntegranteUnidadV2',
    'listarElementosV2', 'listarInventarioV2', 'registrarEntregaV2', 'registrarDevolucionV2', 'obtenerHistorialDevolucionesV2', 'obtenerEntregaV2',
    'listarSedesV2', 'crearSedeV2', 'listarParametrosV2', 'actualizarParametroV2',
    'listarUsuariosV2', 'crearUsuarioV2', 'permisoUsuarioV2', 'puedeV2', 'listarPermisosV2',
    'obtenerReporteGeneralV2', 'obtenerNominaV2', 'obtenerAlertasV2', 'obtenerResumenDashboardV2',
    'crearRetiroTemporalV2', 'reincorporarVoluntarioV2', 'anularRetiroTemporalV2', 'listarRetirosTemporalesV2', 'obtenerAntiguedadV2',
    'quitarEspecialidadV2', 'quitarCredencialV2', 'quitarCapacitacionV2', 'quitarVoluntarioServicioV2', 'quitarAnotacionV2', 'quitarDocumentoV2', 'eliminarPermisoV2'];
  for (var av = 0; av < apisV2.length; av++) {
    var existe = false;
    try { existe = typeof eval(apisV2[av]) === 'function'; } catch (e) {}
    marcar('V2 API: ' + apisV2[av] + ' expuesta', existe);
  }

  // 12e. V2 — estructura creada
  var estadoV2 = estadoMigracionV2();
  marcar('V2: estadoMigracionV2 responde', estadoV2.ok === true && typeof estadoV2.data === 'object');
  if (estadoV2.ok && estadoV2.data.esquemaCreado) {
    var shG = ss.getSheetByName(HOJA_V2.grados);
    marcar('V2: pestaña Grados creada', !!shG);
    if (shG && shG.getLastRow() > 1) {
      var nGrados = shG.getLastRow() - 1;
      marcar('V2: Grados sembrados (7)', nGrados >= 7, 'filas: ' + nGrados);
    }
  } else {
    marcar('V2: pestaña Grados creada', false, 'estructura V2 no creada: ejecuta Crear estructura V2');
  }

  // 13. Log
  _log(ss, 'Pruebas', 'ejecutarPruebas', 'OK', 'autodiagnóstico');
  marcar('Log escrito', true);

  var titulo = fallas === 0 ? 'Autodiagnóstico: TODO OK ✔' : 'Autodiagnóstico: ' + fallas + ' falla(s) ✘';
  SpreadsheetApp.getUi().alert(titulo, lineas.join('\n'), SpreadsheetApp.getUi().ButtonSet.OK);
  _log(ss, 'Pruebas', 'ejecutarPruebas', fallas === 0 ? 'OK' : 'FALLAS', fallas + ' falla(s)');
}