# ESTADO DEL PROYECTO — DEFENSA CIVIL DE CHILE, SEDE LA SERENA

> **Documento de arranque (bootstrap) para sesiones nuevas.** Lectura mínima obligatoria antes de tocar código: este archivo + `AGENTS.md` (reglas operativas) + `MODELO_DATOS_V2.md` (spec del modelo). Generado: **2026-08-19** (cierre de sesión tras FASE V3.4L).

---

## 1. Versión y deployment actuales

| Ítem | Valor |
|---|---|
| **Versión** | `0.8.7 — V3.4L` (00_Constantes.js:9 y 13_UI_App.html:15) |
| **Fase actual** | **V3.4L (ago 2026)** — fix animación de transición entre secciones |
| **Deployment activo** | **@32** — ID `AKfycbxVlTwraU3tClaeLakRkXW3fwmi99-9ZqRtqgvwwEOhQqha9kSTnLxyjRpqZofh6DoO` |
| **URL producción** | `https://script.google.com/macros/s/AKfycbxVlTwraU3tClaeLakRkXW3fwmi99-9ZqRtqgvwwEOhQqha9kSTnLxyjRpqZofh6DoO/exec` (acceso MYSELF — solo cuenta dueña) |
| **URL desarrollo** | `https://script.google.com/macros/s/AKfycbztcY89kv8DJJeg3WI0hSn2ZCPbF8225g7a6XB3gDI/dev` (deployment @HEAD) |
| **Script ID** | `1mV5zmWLJFF13_pDjFaHjMcuRMzfvR6AelT7Xl2Oa06eaLpuA0fGFZc2l` |
| **Spreadsheet** | `SS_ID_REDACTED` — "Proyecto Base de datos D.C 'La serena'" |
| **Git** | 26 commits; HEAD `fdcb3a3` (V3.4L); árbol limpio |
| **Regla de deploy** | NO crear deployments paralelos — siempre `clasp deploy -i AKfycbxVlTwraU3tClaeLakRkXW3fwmi99-9ZqRtqgvwwEOhQqha9kSTnLxyjRpqZofh6DoO` (mantiene la URL) |

**Pendiente del usuario para cerrar V3.4L**: verificación visual en /dev (Ctrl+Shift+R) navegando ≥5 secciones en PC y celular — barra gradiente 3px 0→60%→100% con hold ~400 ms + fundido de página (si Windows tiene "animaciones" desactivadas, V3.4L es justamente el fix que la vuelve visible).

---

## 2. Arquitectura (resumida)

```
Web App (HTML/CSS/JS, 13_UI_*.html)  →  google.script.run (wrapper App.pedir)  →  Apps Script V8 backend (.js)  →  Google Sheets (solo persistencia)
```

- **Frontend**: sin frameworks ni librerías (única dependencia: tipografía Inter vía Google Fonts CDN con fallback). Router por hash `#/ruta` con parámetros (`#/ficha/3`). 18 módulos/páginas registrados con `App.registrarPagina`. Comunicación ÚNICA vía `google.script.run`; respuestas canónicas `{ok, data, error}`.
- **Backend = fuente de verdad**: validaciones, IDs, auditoría, concurrencia, cierres lógicos. Sheets NO es la interfaz (regla §11 de AGENTS.md).
- **Servido HTML** (patrón oficial HTMLService — crítico, causa raíz del bug "HTML básico"): `doGet()` usa `createTemplateFromFile('13_UI_Index').evaluate()` (OBLIGATORIO para evaluar scriptlets `<?!= include(...) ?>`); `include()` usa `createHtmlOutputFromFile(nombre).getContent()`; **cada archivo incluido lleva SUS PROPIAS etiquetas `<style>`/`<script>`** (HTMLService lanza "malformed HTML" con fragmentos JS/CSS puros). Index tiene los 17 scriptlets desnudos; CSS crítico inline `.page{display:none!important}` (blindaje anti-página-en-blanco).
- **Zona de riesgo conocida**: NO editar en script.google.com (solo ejecutar funciones de prueba); si se hace, `clasp pull` antes de tocar local.
- **`clasp run` NO funciona** (OAuth bloqueado por Google, scope `script.external_request`). Pruebas = harnesses jsdom en `/tmp/opencode/` + `node --check` + ejecución manual del usuario en el editor + inspección de la hoja por export xlsx con lectura pública.

---

## 3. Mapa de archivos COMPLETO

### 3.1 Backend (Apps Script, 21 archivos `.js` + manifest)

| Archivo | Qué hace |
|---|---|
| `00_Constantes.js` | Solo constantes puras: nombres de hojas, mapas de columnas `COL`/`COL_*_V2`, catálogos (`GRADOS_V2`=7, `ESPECIALIDADES_V2`=10, `SUBESPECIALIDADES_V2`=2, `CARGOS_V2`, `ESTADOS_TIPO_CREDENCIAL`, `ESTADOS_*`), paleta/versión `PROYECTO.version` (línea 9) |
| `00_Diagnostico.js` | `describeSpreadsheet()` — inspección de la hoja (diagnóstico) |
| `01_Utilidades.js` | Helpers sin lógica de negocio: RUT (módulo 11), fechas, normalización, batch, caché, `_log` con LockService + autoacote |
| `03_Voluntarios.js` | Dominio v0: `crearVoluntario`, `buscarVoluntarios`, `obtenerFichaVoluntario`, `darDeBajaVoluntario`… (API v0 conservada) |
| `04_Eventos.js` | `onOpen`/`onEdit`/`onSelectionChange` (protección de columnas de sistema; NO es lógica principal) |
| `05_Entregas.js` | Dominio v0 Catálogo→Inventario→Entregas (buscar/crear elementos, entradas, ajustes, entregas, devoluciones parciales, `obtenerEntrega` para boleta) + wrappers de menú; extendido V2 (área, tallas, ubicacion/serieSede) |
| `07_Formato.js` | Formato de hojas, DataValidation, formato condicional |
| `08_Config.js` | Menús, inicialización, organizar hojas, `_migrarColumnas` (idempotente) |
| `09_Pruebas.js` | Auto-diagnóstico `ejecutarPruebas` (115+ checks en node) |
| `11_Dashboard.js` | Agregador `obtenerResumenDashboardV2` (UNA llamada: voluntarios/catalogo/inventario/entregas/servicios/asistencia/alertas/actividad/version/generado; helpers `_resumenCatalogo`/`_resumenInventario` con 'Sin estado'/`_resumenEntregas`/`_resumenServicios`) + `obtenerHistorial(limite, offset)` paginado + `obtenerConfiguracion()` |
| `12_WebApp.js` | `doGet()` (template + evaluate), `include()` (getContent), `getSesion()` |
| `21_MigracionV2.js` | `crearEstructuraV2()` (30 hojas, `ESQUEMA_V2`), helpers `_hojaV2/_tablaV2/_buscarV2/_insertarFilaV2/_actualizarFilaV2/_fechaV2/_agregarEventoHojaV2`, `_sincronizarGradosV2/_sincronizarConfigV2/_sincronizarCatalogosV2`, `_repararCatalogosV2`, `_migrarColumnasV2`, `_cerrarFilaV2`, `_vigenteV2`, `estadoMigracionV2` |
| `22_Personas.js` | V2: personas + vínculo voluntario (CRUD, alta/baja/reactivación, `crearPersonaV2({voluntario:true})`, `listarPersonasV2`, `obtenerPersonaV2`) — NO es huérfano (lo usan Dashboard, Entregas, Ficha, Voluntarios, Módulos) |
| `23_GradosCargos.js` | V2: grados (semilla OFICIAL 7), cargos y áreas (CRUD), requisitos de ascenso (advierten, no bloquean), asignación con historial, guard anti-duplicación Jefe de Sede |
| `24_Especialidades.js` | V2: especialidades/subespecialidades (CRUD, campo `niveles`) + asignación N:N; `quitarEspecialidadV2` = cierre lógico |
| `25_Credenciales.js` | V2: catálogo plantilla-only (nombre/emisor/estado) + asignación (nivel, modelosHabilitados, fecha) + `obtenerVencimientosV2`; `quitarCredencialV2` = Revocada |
| `26_Capacitaciones.js` | V2: catálogo (vigencia meses) + asignación N:N con `fechaVencimiento` + `obtenerCapacitacionesVencidasV2` |
| `27_Servicios.js` | V2: tipos + servicios CRUD (Planificado/Activo/Finalizado/Cancelado) + asignación masiva con lock; cierres Retirado/Reemplazado |
| `28_Asistencia.js` | V2: estados + marcaje batch + resumen FUERZA TOTAL/FORMAN/FALTAN + estadísticas (mínimos solo referencia) |
| `29_HojaServicios.js` | V2: eventos/anotaciones/documentos del voluntario (append-only, anclados a voluntarioId); cierres lógicos |
| `30_Unidades.js` | V2: unidades internas + integrantes (append-only, egreso cierra fila) |
| `31_EquipamientoV2.js` | V2: `registrarEntregaV2`/`registrarDevolucionV2` (parciales múltiples, recálculo, stock con ubicación/serieSede), historiales |
| `32_ConfigV2.js` | V2: sedes CRUD + `listarParametrosV2` + `actualizarParametroV2` |
| `33_Usuarios.js` | V2: perfiles, usuarios, `MATRIZ_PERMISOS_BASE` + excepciones, `permisoUsuarioV2` (fallback Consulta), `puedeV2` |
| `34_Reportes.js` | V2: `obtenerReporteGeneralV2`, `obtenerNominaV2` (filtros + antigüedad), `obtenerAlertasV2` |
| `35_Retiros.js` | V3.2: retiros temporales (crear/reincorporar/anular/listar) + antigüedad (`obtenerAntiguedadV2`, `_calcularAntiguedadV2`, `_textoDuracionV2`, `_periodosDescontablesV2`) |
| `36_SeedDemo.js` | V3.4A/H: siembra DEMO idempotente `crearDatosDemoV2()` — Patricio Varela (real, autorizado) + DEMO 01–05 (ficticios), lookup-only de catálogos, obs descriptivas |
| `38_Migraciones.js` | **ÚNICO archivo de migraciones** (consolidado V3.4H): ejecutadas (V3.4D/F/G) comentadas como historial; solo activa `resetYSembrarV34H()` (respaldo 19 hojas + limpieza + re-siembra) |
| `appsscript.json` | Manifest: webapp {executeAs: USER_DEPLOYING, access: MYSELF}, executionApi, runtime V8 |

### 3.2 Frontend (9 archivos `.html`)

| Archivo | Qué hace |
|---|---|
| `13_UI_Index.html` | Esqueleto: splash institucional, header (logo + usuario + campana), sidebar agrupado + mini + badge alertas, banner error global, CSS crítico inline, 17 scriptlets include |
| `13_UI_Styles.html` | **Design system completo** (envuelto en `<style>`): tokens 7 escalas × 10 pasos, semántica, componentes, responsive 5 breakpoints, splash/transiciones/feedback (sección 26), historial acordeón (19b), `@media (prefers-reduced-motion)` con exenciones V3.4L (final del archivo) |
| `13_UI_App.html` | **Núcleo frontend** (envuelto en `<script>`): `App.api` (con aviso de conexión + Reintentar + piso 300ms), `App.pedir`, memo/invalidar, `navegar()` (router + barra `.barra-carga` floor 400ms + transición), modal/confirmar/dropdown/toast/skeleton/badge/`botonEstado`/`ocultarSplash` (floor 1200ms), `refrescarAlertas` (memo 30s), `iniciar()` (sidebar mini, drawer móvil, accesos rápidos, ⋮ móvil, campana, hashchange), `App.LOGO` (base64 ~17KB) |
| `13_UI_Parches.html` | **META institucional** (envuelto en `<script>`): `App.PARCHES` (data URIs grados/especialidades/parches), `App.meta(nombre)`/`App.metaLista(tipo)` (20 entradas META: 7 GRADO + 7 ESPECIALIDAD + 2 SUBESPECIALIDAD + 3 UNIDAD), `App.patch(nombre, alt)` con ALIAS |
| `14_UI_Dashboard.html` | Panel de control (UNA llamada `obtenerResumenDashboardV2` con memo 30s compartido con la campana): 8 KPIs con barras proporcionales, alertas, actividad, accesos rápidos (alta vía `crearPersonaV2`), donuts por estado/categoría, apiladas inventario con 'Sin estado' |
| `15_UI_Voluntarios.html` | Voluntarios: `listarPersonasV2`, KPIs, filtros estado+categoría, alta/baja/reactivación |
| `16_UI_Inventario.html` | Inventario: agrupado por elemento, chips de talla, distribución por estado (normaliza 'Sin estado'), ajustes |
| `17_UI_Entregas.html` | Entregas V2: asistente 6 pasos con disponibilidad en vivo, comprobante imprimible con firmas, historial con devoluciones parciales |
| `18_UI_Ficha.html` | Ficha `#/ficha/:id`: 7 tabs lazy (Personal/Administrativo/Especialidades y credenciales/Equipamiento/Servicios/Asistencia/Historial), baja/reactivación |
| `19_UI_Modulos.html` | Servicios V2 (CRUD + asignación masiva) + Asistencia V2 (marcaje batch, resumen) + **Historial colapsable año→mes→semana** (lotes de 80, carga perezosa, buscador) + Configuración (lectura) |
| `20_UI_Catalogo.html` | Catálogo: listar/crear/editar/activar-desactivar elementos |
| `22_UI_GradosCargos.html` | Grados (lectura + requisitos) + Cargos/Áreas CRUD + asignación con excepción |
| `23_UI_Especialidades.html` | Especialidades: catálogos + subespecialidades (niveles) + asignación |
| `24_UI_Credenciales.html` | Credenciales: catálogo plantilla-only, asignación (nivel/modelos), vencimientos |
| `25_UI_Capacitaciones.html` | Capacitaciones: catálogo, asignación, vencidas |
| `26_UI_Unidades.html` | Unidades + integrantes (asignar/egresar append-only) |
| `27_UI_Reportes.html` | Reportes: general, nómina, alertas |
| `28_UI_Usuarios.html` | Usuarios CRUD + excepciones de permisos |
| `29_UI_Licencias.html` | Licencias: KPIs por tipo + tabla 3 columnas (solo lectura) |
| `32_UI_Biblioteca.html` | Biblioteca institucional: grados/distintivos, especialidades, parches (solo lectura) |

### 3.3 Infraestructura / documentación

| Archivo | Qué hace |
|---|---|
| `AGENTS.md` | Reglas operativas del proyecto (leer SIEMPRE; §0 contexto, §12 historial de decisiones) |
| `MODELO_DATOS_V2.md` | Spec del modelo V2 aprobado (hojas, entidades, decisiones) |
| `INFORME_*.md` (V3.2…V3.4L, ARQUITECTURA, UX) | Informes por fase (causa raíz, cambios, verificación, pendientes) |
| `appsscript.json` / `.clasp.json` / `.claspignore` | Manifest / config clasp (scriptId) / exclusión de push (assets, carpeta web oficial, .git) |
| `assets/` (grados, especialidades, parches) | PNG originales de insignias (optimizados a data URI en 13_UI_Parches) |
| `IMG-GRADOS-ESPECIALIDADES-PARCHES/` | Material de referencia del usuario (imágenes de grados/parches) |
| `Defensa Civil – Al servicio de la ciudadaní*.html|files/` | Web oficial guardada (referencia visual SOLO; excluida de clasp) |
| `opencode.json` | Config del agente |

> ⚠️ `21_UI_Personas.html` **fue eliminado en V3.4K (commit 7efb975)** — no existe en el repo. `#/personas` no es navegable (el router cae a dashboard: `if (!PAGINAS[nombre]) { nombre='dashboard'; }` en 13_UI_App.html:433). El backend `22_Personas.js` está intacto y es usado por otras páginas.

---

## 4. Decisiones de modelo de datos CONFIRMADAS (no revertir)

1. **Jefe de Sede = GRADO real g-7** (UNI 2018, '3 barras', orden 2) — no distintivo, no cargo. `GRADOS_V2` = 7. El **cargo** 'Jefe de Sede / Jefe Local' coexiste (CARGOS_V2). META: entrada GRADO g-7 con archivo 'parche jefe sede' (V3.4H + V3.4K 0.2).
2. **Grados = 7 oficiales jerárquicos** (Comandante Local → Voluntario). **"Disponible" NO es grado** — es **categoría** (Aspirante, Disponible, Voluntario, Reserva, configurable) (V3.1).
3. **SCI = UNA especialidad** (e-7, área A-3 Operaciones, origen INTERNO) con **`niveles` en el campo**: `Introductorio; Básico Online; Básico; Intermedio; Avanzado`. NO son subespecialidades (V3.4F/G). ⚠️ Los arrays de catálogo son de 6 columnas → niveles en índice `[5]`, no `COL_ESPECIALIDAD.niveles - 1`.
4. **Radioaficionado = subespecialidad** (s-1) con niveles. ⚠️ **DISCREPANCIA DETECTADA (2026-08-19)**: constantes dicen 4 niveles `Aspirante; Novicio; General; Superior` (V3.4H, 00_Constantes.js:487) pero META UI dice 3 (`Aspirante; Novicio; General`, 13_UI_Parches.html:41) — **pendiente de alinear**.
5. **RPAS**: 'Operador RPAS' = especialidad e-6 INTERNA; **los modelos son datos de la credencial individual** (`VolCredenciales.modelosHabilitados`: Enterprise 3; Enterprise 3 Pro; Mavic Series; Mini 2), NO subespecialidades; la licencia DGAC es externa (V3.4F/G/H).
6. **Administración Logística dividida en 3 especialidades**: e-3 Administrador de Albergues, e-4 Administrador de Centros de Acopio, e-5 Operador de Equipos Logísticos (área A-4) (V3.4C).
7. **Sanidad → 'Auxiliar de Sanidad'** (e-1, renombrado por ID en migración V3.4F antes del seed; niveles: TENS, Enfermero, Médico, Auxiliar).
8. **Credenciales = plantilla-only**: catálogo sin datos de instancia (solo nombre/emisor/estado Activo|Inactivo); la instancia (nivel, modelos, fecha) vive en la asignación VolCredenciales (V3.4H).
9. **Subespecialidad s-2 'Stop The Bleed'** (área Sanidad, INTERNA).
10. **Unidades internas** (u-1 Fuerza de Tarea Delta, u-2 Operadores RPA, u-3 Grupo de Rescate Animal) — integrantes append-only con cierre de fila.
11. **Estados separados por entidad** (nunca mezclar): Voluntario = Activo|Inactivo|Suspendido|Egresado; Inventario = Disponible|Entregado|Dañado|Extraviado|Baja (+ 'Sin estado' como categoría explícita de robustez V3.4K); Entrega = Pendiente de devolución|Devuelto|Devuelto parcial|Dañado|Extraviado|Entregado; Catálogo = Activo|Inactivo.
12. **Integridad histórica (V3.3)**: TODAS las eliminaciones son **cierres lógicos** (`activo=false`, `estado='Revocada'`, `Retirado`/`Reemplazado`) — nunca `deleteRow` en entidades transaccionales. Helper `_cerrarFilaV2`/`_vigenteV2`.
13. **RUN único** (módulo 11, normalización de sinónimos) — bloqueo total incluye Egresados (reactivación = operación explícita).
14. **IDs**: N° correlativo en hoja para voluntarios; prefijos `E-xxx`/`INV-xxx`/`ENT-xxx` para catálogo/inventario/entregas. **Relaciones por ID, nunca por nombre** (snapshots históricos no son FK).
15. **Sheets = solo persistencia; backend = fuente de verdad; Web App = interfaz principal** (los menús de la hoja son wrappers de respaldo; onEdit solo protección).
16. **Categorías/estados/grados cargados dinámicamente desde Config** en el frontend (fallback = defaults del sistema).
17. **Indicativo de radio = dato personal de la credencial**, no catálogo (se eliminó distintivo d-1 'Radioaficionado CA2OPX' de META, V3.4G).
18. **Catálogo inicial = 12 elementos conocidos** (vestuario + Botas de Combate); inventario partió vacío (no se inventó stock).
19. **Cargos múltiples coexistentes** (asignar un cargo no cierra el anterior; `terminarCargoV2` explícito; duplicado rechazado) (V3.4F).
20. **Retiros temporales + antigüedad** (V3.2): estados Activo|Finalizado|Anulado; anulados nunca descuentan; switches `RETIRO_AFECTA_ANTIGUEDAD_*` en Config.

---

## 5. Bugs conocidos y resueltos (fase que los resolvió)

| Bug | Causa raíz | Fase |
|---|---|---|
| Barra de transición invisible / sin fundido entre secciones | `prefers-reduced-motion: reduce` (Windows): rama JS `!reducido` saltaba la animación + CSS colapsaba a 0.01ms → destello ~100ms. Fix: barra SIEMPRE activa + floor 400ms + exenciones CSS | **V3.4L** |
| Spinner "círculos apilados" en PC (splash) | `.spinner` sin `display` en `<span>` inline → width/height ignorados → píldora bicolor | **V3.4J** |
| `crearEstructuraV2()` con ReferenceError `_migrarV34D` | Regresión V3.4H (archivo eliminado) — retorno vacío con contrato | **V3.4J (d)** |
| Subinstructor sin parche | ALIAS faltante `'subinstructor'` | **V3.4I** |
| Splash desaparecía al instante en PC | Sin floor → `SPLASH_MIN_MS=1200` | **V3.4I** |
| Dashboard 6 llamadas/6000 filas | Frontend recomputaba; ahora 1 llamada/3000 filas; filtro de filas fantasma (E-001) | **V3.4K (0.1)** |
| Jefe de Sede renderizado como distintivo en vez de grado | META d-2 origen CARGO → ahora GRADO g-7 | **V3.4K (0.2)** + V3.4H |
| Historial plano sin navegación | Acordeón año→mes→semana + paginación | **V3.4K (1)** |
| Sidebar no colapsable / topbar no responsiva | Colapso mini + accesos rápidos + ⋮ móvil | **V3.4K (2-6)** |
| `_sincronizarCatalogosV2` no definido | Coordinador V3.1 nunca definido (hotfix) | **V3.4H/HOTFIX** |
| SCI con 5 subespecialidades de nivel / RPAS como subespecialidades | Modelo V3.4F mal diseñado → niveles en campo / modelos en credencial | **V3.4G** |
| Sanidad renombrada sin migrar referencias / seed re-creaba grados y re-contaba asistencia | Renombre por ID antes del seed; seed idempotente (hierarquía, upsert) | **V3.4F** |
| 7 funciones con `deleteRow` destruían historial | Cierres lógicos en todas (V3.3) | **V3.3** |
| Toda escritura V2 dejaba campos vacíos | `_insertarFilaV2`/`_actualizarFilaV2` leían claves por nombre; llamadores usan claves numéricas | **V3.2** |
| Artefacto de siembra en fila 2 / duplicados de catálogos | `_repararCatalogosV2` idempotente | **V3.2** |
| "Disponible" como grado 7 | V3.1: categoría, no grado; sync idempotente de grados/config | **V3.1** |
| HTML "básico" en producción (nunca cargó el diseño) | `createHtmlOutputFromFile` NO evalúa scriptlets → include roto; fix template+evaluate+wrappers | **FASE A/Web App** |
| RUN duplicado nunca detectado | Comparaba cuerpo+DV (9) contra cuerpo (8) → `_cuerpoRUN` | **Web App** |

---

## 6. Pendientes reales

1. **Verificación visual del usuario en /dev** de V3.4L (barra + fundido, PC + celular) — el único pendiente de la fase actual.
2. **Discrepancia niveles Radioaficionado**: constantes `Aspirante; Novicio; General; Superior` vs META `Aspirante; Novicio; General` (detectada 2026-08-19, sin resolver).
3. **Acceso de la Web App**: `access: MYSELF` — para uso con otros usuarios habrá que cambiar `access` y re-crear deployment (fase seguridad/despliegue).
4. **`clasp run` no funciona** (limitación permanente de OAuth) — pruebas vía harnesses jsdom + ejecución manual del usuario.
5. **Entidades fuera de alcance del modelo V2**: `Agrupaciones` y `RadiocomSede` (roadmap futuro, MODELO_DATOS_V2 §2.32/§2.11).
6. **Relación Cargo→equipamiento** pendiente de propuesta (entidad "Equipamiento permitido por cargo").
7. **Fotos de voluntario**: referencia Drive/URL con placeholder; sin carga/gestión de imágenes aún.
8. **Triggers**: ninguno instalado todavía (el primero será `onOpen` simple; `onFormSubmit` solo si se adopta un Form).
9. **Backups automáticos a Drive** (fase futura).

---

## 7. Convenciones establecidas (respetar)

- **Migraciones consolidadas en UN solo archivo** (`38_Migraciones.js`); las ejecutadas quedan comentadas como historial; solo una función activa a la vez.
- **Git desde V3.4G/H: un commit por cambio lógico** (0.1, 0.2, a, b, c…), mensajes con prefijo de fase; documentación (AGENTS.md + informe) en commit aparte al cierre.
- **Patrón floor mínimo para animaciones**: `SPLASH_MIN_MS=1200` (splash), `_barraMinMs=400` (barra de navegación) — consistencia en navegación rápida o lenta.
- **`App.botonEstado(btn, estado, texto)`** para feedback de botones (Normal→Procesando→Éxito/Reintentar); restaurar en catch.
- **`App.api`**: piso 300ms (skeletons visibles) + aviso de conexión con Reintentar.
- **Respuestas canónicas `{ok, data, error:{code,message}}`** (`_resOk`/`_resErr`); `pedir` lanza si `ok===false`.
- **Índices fijos centralizados en `COL`/`COL_*_V2`** (00_Constantes.js); columnas nuevas SIEMPRE al final.
- **Operaciones batch** (`getValues`/`setValues`), nunca celda a celda; índices en memoria; `LockService` en secciones críticas.
- **Caché en memoria con TTL** (`App.memo`); `trasCambio()` invalida TODO; claves compartidas (`dashboard`, `catalogo`, `inventario`, `config`).
- **Versión sincronizada** en `00_Constantes.js:9` (`PROYECTO.version`) y `13_UI_App.html:15` (`PROYECTO_VERSION`); el backend la entrega al frontend por `getSesion`/agregador.
- **HTMLService**: includes envueltos en `<style>`/`<script>`; sin `<?` ni `</script>` internos; Index con scriptlets desnudos; blindaje `.page{display:none!important}`.
- **`prefers-reduced-motion`**: el resto de animaciones decorativas respeta reduce-motion; SOLO navegación (barra + fundido) tiene exención explícita (decisión del dueño del producto).
- **Harnesses en `/tmp/opencode/`** (jsdom, sin navegador headless): test_core, test_v2, test_v31…test_v34l, test_seed_demo, test_ux, test_rutas(_v2), audit_ui(_v2), check_ui → correr TODOS antes de cerrar una fase (regresión 19 suites).
- **Deploy**: `clasp push` + `clasp deploy -i <ID>` (actualizar el existente, nunca crear otro); la verificación de UI la hace el usuario en /dev (Ctrl+Shift+R).
- **Identidad**: logo oficial SIEMPRE como data URI `App.LOGO` (prohibido monograma/CSS/texto); paleta solo de tokens `--dc-*`; lema "Al servicio de la comunidad".
- **Datos sensibles**: nunca pegar datos reales de voluntarios en el chat; anonimizar; usar datos de ejemplo con la misma forma.
- **Prohibiciones**: no mezclar lógica de CESFAM/PADDS; no hardcodear IDs/nombres; no borrar archivos sin comprobar; una etapa a la vez con verificación.

---

## 8. Historial git (referencia rápida)

```
fdcb3a3 V3.4L (todo: fix barra + floor 400ms + 0.8.7 + informe + AGENTS.md)
65bfb97 V3.4K: informe (confirmaciones 0.3/0.4)
512ecde V3.4K: informe + AGENTS.md
89e02c2 V3.4K: bump 0.8.6      ·  4d4437b V3.4K (2-6)  ·  5398889 V3.4K (1)
ce0a1dc V3.4K (0.2)  ·  9185ea1 V3.4K (0.1+7+8)  ·  7efb975 V3.4K (0.3)  ·  a6e1762 chore .gitignore
1d577c4 V3.4J: informe + AGENTS  ·  ecf32c1 bump 0.8.5  ·  49ab644 V3.4J (d)  ·  530e9c2 V3.4J (c)  ·  c914b78 V3.4J (b)  ·  b2b2b3e V3.4J (a)
be46415 V3.4I: informe  ·  dcb5163 V3.4I: fixes
80c5920 V3.4H: reordenamiento  ·  78d4def V3.4H: 38_Migraciones.js  ·  … (26 commits en total)
```

---

*Generado por cierre de sesión (2026-08-19). Siguiente fase sugerida: verificación visual V3.4L del usuario + alineación de niveles de Radioaficionado (constantes vs META).*