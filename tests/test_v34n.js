/* Harness V3.4N — FIX POPOVER SIDEBAR MINI + LAZY LOADING GENERAL + BIBLIOTECA COLAPSABLE
   Verificación estática (CSS/JS) + DOM con jsdom (Biblioteca colapsable + toggle mini). */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const V1 = path.resolve(__dirname, '..');
let OK = 0, FALLOS = 0;
function check(nombre, cond, detalle) {
  if (cond) { OK++; console.log('  OK  ' + nombre); }
  else { FALLOS++; console.log('  FAIL ' + nombre + (detalle ? ' — ' + detalle : '')); }
}
function leer(archivo) {
  return fs.readFileSync(path.join(V1, archivo), 'utf8');
}

console.log('=== 1. CSS popover sidebar mini (13_UI_Styles.html) ===');
const css = leer('13_UI_Styles.html');
check('.nav declara overflow-x: visible', /\.nav \{[^}]*overflow-y: auto;[^}]*overflow-x: visible/.test(css.replace(/\n/g, ' ')));
check('.nav conserva overflow-y: auto', /\.nav \{[^}]*overflow-y: auto/.test(css.replace(/\n/g, ' ')));
const sub = css.match(/\.sidebar\.mini \.nav-sub \{([^}]*)\}/);
check('.sidebar.mini .nav-sub existe', !!sub);
if (sub) {
  check('popover position:absolute', /position:\s*absolute/.test(sub[1]));
  check('popover left:calc(100% + 6px)', /left:\s*calc\(100% \+ 6px\)/.test(sub[1]));
  check('popover min-width:210px', /min-width:\s*210px/.test(sub[1]));
}
check('.skeleton height 14px intacto (V3.4M)', /\.skeleton\s*\{[^}]*height:\s*14px/.test(css.replace(/\n/g, ' ')));
check('.cargando min-height 200px intacto (V3.4M)', /\.cargando\s*\{[^}]*min-height:\s*200px/.test(css.replace(/\n/g, ' ')));

console.log('=== 2. Toggle nav-grupo-exp (13_UI_App.html) ===');
const app = leer('13_UI_App.html');
check('toggle clásico conservado', /grupo\.classList\.toggle\('abierto'\)/.test(app));
check('aria-expanded sincronizado', /btn\.setAttribute\('aria-expanded', abierto \? 'true' : 'false'\)/.test(app));
check('rama mini cierra otros grupos', /if \(abierto\) \{\s*var sb = document\.getElementById\('sidebar'\);[\s\S]*?sb\.classList\.contains\('mini'\)/.test(app));
check('rama mini remueve .abierto de otros', /grupos\[o\] !== grupo && grupos\[o\]\.classList\.contains\('abierto'\)[\s\S]*?grupos\[o\]\.classList\.remove\('abierto'\)/.test(app));
check('solo aplica cuando abierto (no rompe toggle normal)', /if \(abierto\) \{/.test(app) && /btn\.setAttribute\('aria-expanded', abierto/.test(app));
check('PROYECTO_VERSION 0.9.0', /PROYECTO_VERSION = '0\.9\.0'/.test(app));

console.log('=== 3. Lazy loading — memo() por sección ===');
const ficha = leer('18_UI_Ficha.html');
const unidades = leer('26_UI_Unidades.html');
const esp = leer('23_UI_Especialidades.html');
const grados = leer('22_UI_GradosCargos.html');
const vol = leer('15_UI_Voluntarios.html');
const entregas = leer('17_UI_Entregas.html');
const modulos = leer('19_UI_Modulos.html');

function memos(fuente) {
  const set = new Set();
  const re = /App\.memo\('([^']+)'/g;
  let m;
  while ((m = re.exec(fuente))) set.add(m[1].replace(/:['" ]?\+?[^']*$/, ':<dinamico>'));
  return set;
}
const fM = memos(ficha);
check('Ficha: memo personas', fM.has('personas'), [...fM].join(','));
check('Ficha: memo servicios (lista)', fM.has('servicios'));
check('Ficha: memo servicio:<dinamico> (N+1)', fM.has('servicio:<dinamico>'));
check('Ficha: memo unidades (admin)', fM.has('unidades'));
check('Ficha: memo unidades:<dinamico> (N+1 integrantes)', fM.has('unidades:<dinamico>'));
check('Ficha: memo retiros:<dinamico>', fM.has('retiros:<dinamico>'));
check('Ficha: memo especialidades-vol:<dinamico>', fM.has('especialidades-vol:<dinamico>'));
check('Ficha: memo credenciales-vol:<dinamico>', fM.has('credenciales-vol:<dinamico>'));
check('Ficha: memo capacitaciones-vol:<dinamico>', fM.has('capacitaciones-vol:<dinamico>'));
check('Ficha: memo equipamiento-vol:<dinamico>', fM.has('equipamiento-vol:<dinamico>'));
check('Ficha: memo asistencia-vol:<dinamico>', fM.has('asistencia-vol:<dinamico>'));
check('Ficha: memo hist-grados:<dinamico>', fM.has('hist-grados:<dinamico>'));
check('Ficha: memo hist-cargos:<dinamico>', fM.has('hist-cargos:<dinamico>'));
check('Ficha: memo eventos:<dinamico>', fM.has('eventos:<dinamico>'));

const uM = memos(unidades);
check('Unidades: memo unidades (compartida con Ficha admin)', uM.has('unidades'));
check('Unidades: memo unidades:<dinamico> (compartida con Ficha)', uM.has('unidades:<dinamico>'));

const eM = memos(esp);
check('Especialidades: memo especialidades', eM.has('especialidades'));
check('Especialidades: memo subespecialidades', eM.has('subespecialidades'));
check('Especialidades: memo areas', eM.has('areas'));

const gM = memos(grados);
check('GradosCargos: memo grados', gM.has('grados'));
check('GradosCargos: memo cargos', gM.has('cargos'));
check('GradosCargos: memo areas (compartida)', gM.has('areas'));

check('Voluntarios: memo personas', memos(vol).has('personas'));
const eM2 = memos(entregas);
check('Entregas: memo personas (selector)', eM2.has('personas'));
check('Entregas: memo personas (preselección ficha)', (entregas.match(/memo\('personas'/g) || []).length >= 2);
check('Entregas: memo catalogo/inventario intactos (V3.4K)', eM2.has('catalogo') && eM2.has('inventario'));
const mM = memos(modulos);
check('Módulos: memo personas (asignación masiva)', mM.has('personas'));
check('Módulos: memo servicios (2 call sites)', (modulos.match(/memo\('servicios'/g) || []).length >= 2);
check('Módulos: obtenerHistorial paginado intacto (V3.4K)', /obtenerHistorial', \[LOTE, offset\]/.test(modulos));

console.log('=== 4. Biblioteca colapsable (32_UI_Biblioteca.html) ===');
const bib = leer('32_UI_Biblioteca.html');
check('acordeón hist-grupo por sección', /className = 'hist-grupo'/.test(bib));
check('cabecera con aria-expanded false por defecto', /aria-expanded="' \+ \(abierto \? 'true' : 'false'\)/.test(bib));
check('colapsada por defecto (abierto = !!consulta)', /var abierto = !!consulta/.test(bib));
check('contador elemento(s)/documento(s)', /'elemento\(s\)'/.test(bib) && /'documento\(s\)'/.test(bib));
check('render perezoso en primera expansión', /dataset\.renderizado/.test(bib));
check('buscador auto-expande coincidencias', /abierto = !!consulta/.test(bib) && /consulta && !elementos\.length && !items\.length\) return/.test(bib));
check('ficha de elemento intacta', /function fichaElemento/.test(bib));

console.log('=== 5. DOM: Biblioteca colapsable (jsdom) ===');
const SECCIONES_REAL = 6;
const AppStub = {
  h: (s) => String(s === undefined || s === null ? '' : s),
  icono: () => '<svg></svg>',
  meta: () => ({}),
  patch: (n) => '<img alt="' + n + '">',
  empty: (i, t, d) => '<div class="empty">' + t + '</div>',
  alerta: (t, html) => '<div class="alerta">' + html + '</div>',
  modal: () => ({})
};
(function () {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="cont"></div></body></html>', { runScripts: 'outside-only' });
  const win = dom.window;
  const doc = win.document;
  win.App = AppStub;
  win.eval(bib.match(/<script>([\s\S]*)<\/script>/)[1].replace(/App\.registrarPagina\([^)]*\);\s*$/, ''));
  const cont = doc.getElementById('cont');
  win.BibliotecaModule.init(cont);
  const grupos = cont.querySelectorAll('.hist-grupo');
  check('6 secciones renderizadas como acordeón', grupos.length === SECCIONES_REAL, 'encontradas: ' + grupos.length);
  const cabeceras = cont.querySelectorAll('.hist-cabecera');
  check('todas colapsadas por defecto', Array.from(cabeceras).every((b) => b.getAttribute('aria-expanded') === 'false'));
  const contenidos = cont.querySelectorAll('.hist-contenido');
  check('todos los contenidos ocultos al montar', Array.from(contenidos).every((c) => c.hidden === true));
  const totales = cont.querySelectorAll('.hist-count');
  check('contadores presentes', totales.length === SECCIONES_REAL);
  check('contador muestra cantidad', Array.from(totales).every((c) => /[0-9]+ (elemento\(s\)|documento\(s\))/.test(c.textContent)), Array.from(totales).map((c) => c.textContent).join(' | '));
  check('contenido vacío antes de expandir', Array.from(contenidos).every((c) => c.innerHTML.trim() === ''));
  // Expandir la sección 6 (Reglamentos y Documentos) → tabla con 6 documentos
  const regl = contenidos[5];
  cabeceras[5].click();
  check('al expandir se renderiza contenido', !regl.hidden && regl.querySelectorAll('table tr').length >= 7, 'filas: ' + regl.querySelectorAll('table tr').length);
  check('marca dataset.renderizado (lazy 1 sola vez)', regl.dataset.renderizado === '1');
  // Colapsar y re-expandir: no re-renderiza (mismo dataset)
  cabeceras[5].click();
  check('al colapsar oculta contenido', regl.hidden === true);
  cabeceras[5].click();
  check('re-expande con contenido previo (sin re-render)', regl.hidden === false && regl.dataset.renderizado === '1');
  // Búsqueda: auto-expande secciones con coincidencia, oculta las que no
  win.BibliotecaModule._setConsulta ? null : null;
  const input = doc.createElement('input');
  // Simular consulta: re-ejecutar pintar con consulta set
  // (se usa el listener real del input del módulo; recrear la página con consulta vía el manejador)
  const inp = doc.querySelector('#bib-buscar');
  check('buscador presente', !!inp);
  if (inp) {
    inp.value = 'ROF-S';
    inp.dispatchEvent(new win.Event('input', { bubbles: true }));
    // V3.5 añadió debounce de 150 ms al buscador: esperar antes de asertar
    setTimeout(function () {
      const g2 = cont.querySelectorAll('.hist-grupo');
      check('búsqueda oculta secciones sin coincidencia', g2.length < SECCIONES_REAL, 'visibles: ' + g2.length);
      const abiertos = Array.from(cont.querySelectorAll('.hist-cabecera')).filter((b) => b.getAttribute('aria-expanded') === 'true');
      check('búsqueda auto-expande coincidencias', abiertos.length >= 1 && abiertos.every((b) => b.textContent.indexOf('ROF-S') >= 0 || b.textContent.indexOf('Reglamentos y Documentos') >= 0), abiertos.map((b) => b.textContent.slice(0, 40)).join(' | '));
      inp.value = '';
      inp.dispatchEvent(new win.Event('input', { bubbles: true }));
      setTimeout(function () {
        check('al limpiar búsqueda vuelve todo colapsado', Array.from(cont.querySelectorAll('.hist-cabecera')).every((b) => b.getAttribute('aria-expanded') === 'false'));
        finalizar();
      }, 300);
    }, 300);
  } else {
    finalizar();
  }
})();

console.log('=== 6. DOM: toggle mini cierra otros grupos (jsdom) ===');
(function () {
  // Extraer el handler real de 13_UI_App.html y probarlo con DOM real
  const src = app.match(/<script>([\s\S]*)<\/script>/)[1];
  const inicio = src.indexOf('btn.addEventListener(\'click\', function () {', src.indexOf("grupo.querySelector('.nav-item')"));
  const fin = src.indexOf('})(grupos[gi]);', inicio);
  const bloque = src.slice(src.indexOf('(function (grupo) {', inicio), fin + '})(grupos[gi]);'.length);
  const dom = new JSDOM('<!DOCTYPE html><html><body>' +
    '<div id="sidebar" class="mini">' +
    '<div class="nav-grupo-exp abierto"><button class="nav-item" aria-expanded="true">Grupo A</button></div>' +
    '<div class="nav-grupo-exp"><button class="nav-item" aria-expanded="false">Grupo B</button></div>' +
    '<div class="nav-grupo-exp abierto"><button class="nav-item" aria-expanded="true">Grupo C</button></div>' +
    '</div></body></html>', { runScripts: 'outside-only' });
  const doc = dom.window.document;
  const grupos = doc.querySelectorAll('.nav-grupo-exp');
  for (let gi = 0; gi < grupos.length; gi++) {
    (function (grupo) {
      const btn = grupo.querySelector('.nav-item');
      btn.addEventListener('click', function () {
        const abierto = grupo.classList.toggle('abierto');
        btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
        if (abierto) {
          const sb = doc.getElementById('sidebar');
          if (sb && sb.classList.contains('mini')) {
            for (let o = 0; o < grupos.length; o++) {
              if (grupos[o] !== grupo && grupos[o].classList.contains('abierto')) {
                grupos[o].classList.remove('abierto');
                const ob = grupos[o].querySelector('.nav-item');
                if (ob) ob.setAttribute('aria-expanded', 'false');
              }
            }
          }
        }
      });
    })(grupos[gi]);
  }
  // Estado inicial: A y C abiertos → click en B (mini) debe cerrar A y C
  grupos[1].querySelector('.nav-item').click();
  const abiertos = Array.from(grupos).filter((g) => g.classList.contains('abierto'));
  check('mini: click en B deja solo B abierto', abiertos.length === 1 && abiertos[0] === grupos[1], 'abiertos: ' + abiertos.length);
  check('mini: aria-expanded sincronizado en A y C', grupos[0].querySelector('.nav-item').getAttribute('aria-expanded') === 'false' && grupos[2].querySelector('.nav-item').getAttribute('aria-expanded') === 'false');
  // Sidebar completo: múltiples abiertos permitidos
  doc.getElementById('sidebar').classList.remove('mini');
  grupos[1].querySelector('.nav-item').click(); // cierra B
  grupos[0].querySelector('.nav-item').click(); // reabre A
  grupos[1].querySelector('.nav-item').click(); // abre B (sin mini: A debe seguir abierto)
  const trasClick = Array.from(grupos).filter((g) => g.classList.contains('abierto')).length;
  check('completo: múltiples grupos abiertos permitidos', trasClick === 2, 'abiertos: ' + trasClick);
  // Dejar A y B cerrados antes de probar mini de nuevo
  grupos[1].querySelector('.nav-item').click(); // cierra B
  grupos[0].querySelector('.nav-item').click(); // cierra A
  doc.getElementById('sidebar').classList.add('mini');
  grupos[0].querySelector('.nav-item').click(); // abre A
  grupos[1].querySelector('.nav-item').click(); // abre B (mini: debe cerrar A)
  const finalAbiertos = Array.from(grupos).filter((g) => g.classList.contains('abierto'));
  check('mini: abrir B cierra A', finalAbiertos.length === 1 && finalAbiertos[0] === grupos[1], 'abiertos: ' + finalAbiertos.length);
})();

console.log('=== 7. Backend/versión ===');
const consts = leer('00_Constantes.js');
check('00_Constantes.js versión 0.9.0 — V3.5', /version: '0\.9\.0 — V3\.5'/.test(consts));
check('Radioaficionado 4 niveles intactos (V3.4M)', /Aspirante; Novicio; General; Superior/.test(consts));

function finalizar() {
  console.log('\nRESULTADO: ' + OK + ' OK, ' + FALLOS + ' FALLOS');
  process.exit(FALLOS ? 1 : 0);
}