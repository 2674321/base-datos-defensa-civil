# INFORME V3.4E — PULIDO INTEGRAL (v0.8.1)

**Fecha:** ago 2026 · **Versión:** 0.8.1 — V3.4E · **Deployment:** @24 (misma URL) · **Objetivo:** auditar, corregir y pulir integralmente la aplicación según el spec §1–§43.

---

## 1. AUDITORÍA (qué se detectó)

| Hallazgo | Severidad | Archivo | Resultado |
|---|---|---|---|
| `ALIAS` referenciado en `App.patch` pero **nunca definido** | ALTA (ReferenceError latente con cualquier nombre fuera de DATA) | 13_UI_Parches.html | Corregido |
| `getSesion` no devolvía `version` (dropdown y sidebar podían mostrar versiones distintas) | MEDIA | 12_WebApp.js | Corregido |
| `TIPOS_SERVICIO_V2` sin 'Régimen e instrucción' (§25 del spec) | MEDIA | 00_Constantes.js | Corregido |
| Sin alerta por inasistencias (asistencia no vigilada) | MEDIA | 34_Reportes.js | Corregido |
| Unidad "En formación" no ofrecida en modal de edición ni reflejada en badges | MEDIA | 26_UI_Unidades.html | Corregido |
| Biblioteca no existía como catálogo institucional (6 secciones del spec) | MEDIA | 32_UI_Biblioteca.html | Reescrita |
| `_seedUnidadPatricio` duplicaba lógica por unidad (Patricio debía integrar también Operadores RPA) | BAJA | 36_SeedDemo.js | Corregido |
| Iconos no existentes ('grados', 'especialidades', 'unidades', 'ver', …) usados en biblioteca → reemplazados por ICONOS reales | BAJA | 32_UI_Biblioteca.html | Corregido |
| Grados 'Instructor Mayor'/'Voluntario Mayor' etc. caían a placeholder SVG en chips de la ficha (patch no resolvía por nombre de grado) | MEDIA (UX) | 13_UI_Parches.html (ALIAS ampliado) | Corregido |
| Patricio integraba solo F.T. Delta; con Operadores RPA como unidad, debía integrar ambas | BAJA | 36_SeedDemo.js | Corregido |

## 2. CORRECCIONES

### Backend
- **`00_Constantes.js`** — `TIPOS_SERVICIO_V2` ahora incluye **'Régimen e instrucción'** (tras 'Operativo'); `version: '0.8.1 — V3.4E'`.
- **`34_Reportes.js`** — `obtenerAlertasV2` agrega alerta `{severidad:'aviso', modulo:'asistencia', texto:"<Nombre> — N inasistencias injustificadas este mes (revisión)"}` cuando un voluntario tiene **≥3 marcajes 'Ausente'** en servicios del **mes actual** (fecha dd/mm/aaaa leída de Servicios + Asistencia + Personas vía `_tablaV2`; try/catch para no bloquear otras alertas).
- **`36_SeedDemo.js`** — `_seedUnidadPatricio` refactorizado a loop idempotente sobre `[SEED_DEMO_PATRICIO.unidad, SEED_DEMO_PATRICIO.unidadRpa]`; nueva constante `unidadRpa: 'Operadores RPA'`. Patricio queda como integrante (sin rol) de **Fuerza de Tarea Delta** y **Operadores RPA**.
- **`12_WebApp.js`** — `getSesion` devuelve `version: PROYECTO.version` (también en el catch).

### Frontend
- **`26_UI_Unidades.html`** — select del modal con `['En formación','Activa','Inactiva']`; badge: `Activa → ok`, `En formación → aviso`, resto `gris`.
- **`13_UI_Parches.html`** — `META_CAMPOS` + `META` (19 entradas: GRADO g-1..g-7, ESPECIALIDAD e-1..e-6, SUBESPECIALIDAD s-1/s-2, UNIDAD u-1..u-3, DISTINTIVO d-1) con `App.meta(nombre)` y `App.metaLista(tipo)`; `App.patch` reescrito (resolución DATA → ALIAS → placeholder, misma semántica); **`var ALIAS` materializado y ampliado** (antes: ReferenceError garantizado con nombres desconocidos; ahora incluye grados 'instructor mayor'→parche, 'voluntario mayor'→grado, 'comandante local', 'sub instructor', 'jefe de sede', 'enfermero', 'medico', variantes 'operador rpa(s)', 'radioaficion', etc.).
- **`32_UI_Biblioteca.html`** — reescrita con las 6 secciones del spec: **Grados y Distintivos**, **Especialidades y Parches**, **Subespecialidades** (tarjetas con imagen + ficha modal de elemento vía `App.meta`/`App.patch`), **Unidades** (tarjetas con estado), **Formación y Acreditaciones** y **Reglamentos y Documentos** (tablas con badges Disponible/Próximamente). Buscador que filtra elementos y documentos. Iconos limitados a `ICONOS` existentes ('usuario','paquete','historial','voluntarios','documento','chevronR').
- **`13_UI_App.html`** — `PROYECTO_VERSION = '0.8.1'`; en `pSesion`: `if (s.version) PROYECTO_VERSION = s.version` (fuente única de verdad).

## 3. DATOS (seed demo)
- Siembra idempotente; Patricio ahora integra **2 unidades** (F.T. Delta + Operadores RPA) sin rol.
- Licencias intactas: **RPAS DGAC N.º 16418** (26/09/2024→26/09/2027, Vigente, 4 habilitaciones) y **radioaficionado Novicio CA2OPX** (N.º "No informado").

## 4. UX
- Unidades: estado 'En formación' visible y consistente (modal + badge).
- Biblioteca institucional navegable con fichas de elemento y documentos.
- Grados reales en chips/timeline (sin placeholders para Voluntario Mayor, Instructor Mayor, …).
- Versión unificada backend→frontend (sidebar = dropdown).

## 5. TESTS
- **`test_v34e` (nuevo, 43 puntos del §34):** backend **29/29 OK** + DOM **TODO OK** (3 ejecuciones consecutivas estables).
  - Constantes: 12 TIPOS_SERVICIO_V2, 3 ESTADOS_UNIDAD, áreas/especialidades (Telecomunicaciones, A-4 ×3 independientes).
  - Licencias: RPAS 16418 + radio Novicio CA2OPX + Clase F sin asignar.
  - Seed: estructura + 2 pasadas idempotentes + unidades del spec + Patricio en 2 unidades.
  - Reportes: alerta de inasistencias (0 no alerta; 3+ en mes actual sí).
  - DOM: splash, búsquedas (nombre/RUN/N°/TENS), filtros (especialidad/subespecialidad/unidad), ficha A→B con limpieza, foto `<img>` / sin-foto, badge y modal de unidad, biblioteca (6 secciones, ficha, placeholder SVG), `App.meta`, cero errores JS.
- **Regresión completa (14 harnesses) verde:** test_v2 25/25 (12 tipos), test_v31 OK, test_v32 OK, test_v33 31/31, test_v34_estructura 28/28, test_v34b_integracion OK, test_v34d 46/46, test_seed_demo 101/101, test_core OK, test_ux OK, test_rutas_v2 TODAS OK, check_ui TODO OK, audit_ui / audit_ui_v2 SIN FALLOS. (test_rutas v1 quedó obsoleto: el router actual es V2).
- `node --check`: 52/52 archivos OK (JS + `<script>` extraídos de HTML).

## 6. DEPLOYMENT
- `clasp push` + `clasp deploy -i AKfycbxmPwM2BsWL42gqvoLg9RShm246tizyBRewLvo9yEgj7aYx8ZWBptSnSJ0i4kb32fU -d "V3.4E pulido integral"` → **@24, misma URL** (sin deployments paralelos).
- URL: `https://script.google.com/macros/s/AKfycbxmPwM2BsWL42gqvoLg9RShm246tizyBRewLvo9yEgj7aYx8ZWBptSnSJ0i4kb32fU/exec`

## 7. PENDIENTES / NOTAS
- Verificación visual del usuario (recarga forzada).
- El fix de `ALIAS` corrige un bug real que también afectaba a la ficha (chips de grado mostraban placeholder para grados oficiales).
- No se implementaron (excluidos por spec): motor de ascensos, permisos avanzados, multi-sede, bitácoras completas, workflows, informe DG, vehículos.