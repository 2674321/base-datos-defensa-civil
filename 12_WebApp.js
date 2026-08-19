/**
 * 12_WebApp.js — Punto de entrada de la Web App (doGet) y helpers de sesión.
 * La Web App es la INTERFAZ PRINCIPAL del sistema; Sheets es solo persistencia (§11 AGENTS.md).
 * doGet no hace operaciones pesadas contra Sheets: solo sirve el HTML.
 */

function doGet(e) {
  return HtmlService.createTemplateFromFile('13_UI_Index')
    .evaluate()
    .setTitle(PROYECTO.nombre)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Incluye un archivo HTML dentro del índice (patrón oficial de HTMLService).
 *  IMPORTANTE: los archivos incluidos llevan SUS PROPIAS etiquetas <style>/<script>
 *  (ver guía oficial "HTML Service: Best Practices"): createHtmlOutputFromFile
 *  valida la estructura HTML y lanza "malformed HTML" si el archivo es JS/CSS puro
 *  (strings con <div>/<svg> se ven como etiquetas abiertas); lo mismo ocurre con
 *  createTemplateFromFile(...).evaluate(). */
function include(nombre) {
  return HtmlService.createHtmlOutputFromFile(nombre).getContent();
}

/** Identidad del usuario que abrió la Web App (header + permisos V2). */
function getSesion() {
  try {
    var u = Session.getActiveUser();
    var correo = String(u.getEmail() || '');
    var nombre = correo ? correo.split('@')[0] : 'Usuario';
    var perfil = 'Consulta';
    var permisos = [];
    if (correo) {
      var res = permisoUsuarioV2(correo);
      if (res.ok && res.data) {
        perfil = res.data.perfil || 'Consulta';
        permisos = res.data.permisos || [];
      }
    }
    return _resOk({ correo: correo, nombre: nombre, perfil: perfil, permisos: permisos, version: PROYECTO.version });
  } catch (err) {
    return _resOk({ correo: '', nombre: 'Usuario', perfil: 'Consulta', permisos: [], version: PROYECTO.version });
  }
}