# INFORME V3.4B — UNIFICACIÓN REAL DE DATOS EN FRONTEND

**Fecha:** 17/08/2026 · **Fase:** V3.4B · **Alcance:** SOLO frontend (backend sin cambios) · **Deployment:** @20 (misma URL)

---

## 1. Causa raíz ("Voluntarios vacío")

Dos causas encadenadas:

1. **Bug de arranque en `15_UI_Voluntarios.html`:** el `cargar()` que poblaba `lista` (llamando `listarVoluntarios`) **nunca se invocaba en `init`** → `lista = []` → la página mostraba el empty state "Aún no hay voluntarios" siempre, aunque la hoja tuviera registros.
2. **Cadena v0 en el frontend:** Dashboard, Voluntarios, Ficha y Entregas consumían las APIs v0 (`obtenerResumenDashboard`, `listarVoluntarios`, `crearVoluntario`, `darDeBajaVoluntario`, `obtenerFichaVoluntario`, `obtenerEquipamientoVoluntario`, `obtenerHistorialEntregas`, `obtenerEntrega`, `registrarEntrega`, `registrarDevolucion`) que leen las **hojas v0** (Voluntarios/Entregas/Ficha, filas 3-8) — mientras el modelo institucional real (V2) vive en Personas/VoluntariosV2. La Web App mostraba un mundo paralelo v0 casi vacío.

## 2. Páginas afectadas

| Página | Cambio |
|---|---|
| `14_UI_Dashboard.html` | Migrado a V2 (reescrito) |
| `15_UI_Voluntarios.html` | Migrado a V2 + fix de arranque (reescrito) |
| `17_UI_Entregas.html` | Migrado a V2 (selector, registro, historial, devolución) |
| `18_UI_Ficha.html` | Migrado a V2 (7 tabs) + 1 bug real corregido |
| `13_UI_App.html` | `refrescarAlertas()` → `obtenerResumenDashboardV2` (mismo `memo('dashboard', 30 s)`) |
| `16_UI_Inventario.html`, `20_UI_Catalogo.html` | **Sin cambios** — única fuente física del equipamiento (hojas Catálogo/Inventario/Entregas compartidas con `31_EquipamientoV2.js`) |

## 3. APIs: antes → ahora

| Página | Antes (v0) | Ahora (V2) |
|---|---|---|
| Dashboard | `obtenerResumenDashboard`, `crearVoluntario` | `obtenerResumenDashboardV2` + composición `buscarElementos` + `obtenerInventario` + `obtenerHistorialEntregasV2` + `listarServiciosV2` + `obtenerEstadisticasAsistenciaV2`; alta rápida `crearPersonaV2` |
| Voluntarios | `listarVoluntarios`, `crearVoluntario`, `darDeBajaVoluntario` | `listarPersonasV2` (filtro `voluntarioId != null`), `crearPersonaV2({voluntario:true})`, `darDeBajaVoluntarioV2`, `reactivarVoluntarioV2`, `obtenerConfiguracion` (estados/categorías) |
| Ficha | `obtenerFichaVoluntario`, `obtenerEquipamientoVoluntario`, `obtenerHistorialEntregas` | `listarPersonasV2` → `obtenerPersonaV2` + `listarRetirosTemporalesV2` + `listarUnidadesV2`/`listarIntegrantesUnidadV2` + `listarEspecialidadesVoluntarioV2` + `listarCredencialesVoluntarioV2` + `listarCapacitacionesVoluntarioV2` + `obtenerEquipamientoVoluntarioV2` + `listarServiciosV2`/`obtenerServicioV2` + `obtenerResumenAsistenciaVoluntarioV2` + `obtenerHistorialGradosV2`/`obtenerHistorialCargosV2`/`listarEventosVoluntarioV2` + `darDeBajaVoluntarioV2`/`reactivarVoluntarioV2` |
| Entregas | `listarVoluntarios`, `registrarEntrega`, `obtenerEntrega`, `obtenerHistorialEntregas`, `registrarDevolucion`, `obtenerFichaVoluntario` | `listarPersonasV2`, `registrarEntregaV2`, `obtenerEntregaV2`, `obtenerHistorialEntregasV2`, `registrarDevolucionV2` (mismos shapes de datos: `voluntarioId`, `cantidadDevuelta/cantidadDanada/cantidadExtraviada`, `{entrega, devoluciones}`) |

## 4. Correcciones aplicadas

1. `15_UI_Voluntarios`: `init` ahora llama `cargarListas().then(render; cargar)` (causa raíz).
2. `18_UI_Ficha` — **bug real detectado por el test de integración**: `renderServicios` leía `det.asignados` (dentro de `d.servicio`) pero la API real devuelve `asignados`/`cerrados` **a nivel raíz** de `data` → el tab Servicios siempre mostraba "Sin servicios" con datos reales. Corregido a `d.asignados`/`d.cerrados`.
3. `13_UI_App`: `refrescarAlertas()` usa `obtenerResumenDashboardV2` (las alertas del badge salen del agregador V2, no del v0).
4. `14_UI_Dashboard`: la composición ya no incluye `obtenerHistorialEntregas` v0 (era la única llamada v0 restante tras la migración).

## 5. Datos que ahora muestra la Web App (fuente única V2)

- **Voluntarios:** Patricio Andrés Varela Contreras + DEMO 01–05 (6 filas; KPIs Activos 6 / Total 6; filtros por estado y categoría desde Config sin eliminar registros).
- **Ficha de Patricio:** RUN 21.889.985-4, grado Voluntario Mayor, cargo Asesor de Telecomunicaciones, antigüedades; especialidades (Sanidad TENS, Telecomunicaciones + Radioaficionado CA2OPX, Operador RPAS con habilitaciones MAVIC respaldadas por la **misma credencial** Licencia de Radioaficionado N° 16418 — sin duplicar); 7 entregas de equipamiento; 3 servicios (1 activo + 2 históricos); 11 marcajes de asistencia; historial de grados/cargos/eventos; unidad Fuerza de Tarea Delta.
- **Dashboard:** KPIs compuestos (activos, total, servicios, % presencia, catalogados, stock, pendientes devolución, alertas), donuts por estado/categoría, apiladas de inventario.
- **Entregas:** historial completo desde `obtenerHistorialEntregasV2`; selector de voluntarios desde `listarPersonasV2`.
- Nada de esto está hardcodeado en el frontend (verificado por test estático: sin literales "Patricio", "DEMO", "16418" en los HTML).

## 6. Matriz de cobertura FRONTEND → BACKEND (V3.4B)

| Página | APIs frontend (pedir) | Backend real | Estado |
|---|---|---|---|
| 14 Dashboard | obtenerResumenDashboardV2 | 11_Dashboard.js:223 | ✔ V2 |
| 14 Dashboard | buscarElementos, obtenerInventario | 05_Entregas.js:107, :209 | ✔ (cadena física) |
| 14 Dashboard | obtenerHistorialEntregasV2 | 31_EquipamientoV2.js:239 | ✔ V2 |
| 14 Dashboard | listarServiciosV2 | 27_Servicios.js:136 | ✔ V2 |
| 14 Dashboard | obtenerEstadisticasAsistenciaV2 | 28_Asistencia.js:~230 | ✔ V2 |
| 15 Voluntarios | listarPersonasV2 | 22_Personas.js:21 | ✔ V2 |
| 15 Voluntarios | crearPersonaV2 | 22_Personas.js | ✔ V2 |
| 15 Voluntarios | darDeBajaVoluntarioV2 / reactivarVoluntarioV2 | 22_Personas.js:348 / :369 | ✔ V2 |
| 17 Entregas | registrarEntregaV2 | 31_EquipamientoV2.js | ✔ V2 |
| 17 Entregas | obtenerEntregaV2 / obtenerHistorialEntregasV2 / registrarDevolucionV2 | 31_EquipamientoV2.js:248 / :239 | ✔ V2 |
| 18 Ficha | obtenerPersonaV2 (+gradoVigente/cargoVigente/antiguedades) | 22_Personas.js | ✔ V2 |
| 18 Ficha | listarEspecialidades/Credenciales/Capacitaciones VoluntarioV2 | 24/25/26 | ✔ V2 |
| 18 Ficha | obtenerEquipamientoVoluntarioV2 | 31_EquipamientoV2.js | ✔ V2 (misma hoja v0) |
| 18 Ficha | obtenerServicioV2 | 27_Servicios.js:192 | ✔ V2 |
| 18 Ficha | obtenerResumenAsistenciaVoluntarioV2 | 28_Asistencia.js:174 | ✔ V2 |
| 18 Ficha | obtenerHistorialGradosV2 / obtenerHistorialCargosV2 / listarEventosVoluntarioV2 | 23_GradosCargos.js / 29_HojaServicios.js:13 | ✔ V2 |
| 18 Ficha | listarRetirosTemporalesV2 / listarUnidadesV2 / listarIntegrantesUnidadV2 | 35_Retiros.js / 30_Unidades.js | ✔ V2 |
| 13 App | refrescarAlertas → obtenerResumenDashboardV2 | 11_Dashboard.js:223 | ✔ V2 |
| 16/20 Inventario/Catálogo | buscarElementos/obtenerInventario/crearElemento… | 05_Entregas.js | ✔ v0 (única fuente física) |
| 19/21–28 | Ya V2 desde fases anteriores | 27/28/21–34 | ✔ V2 |

## 7. Tests ejecutados (todo verde)

| Suite | Resultado |
|---|---|
| node --check (37 .js + 16 HTML) | OK |
| test_core / test_v2 / test_v31 / test_v32 | TODAS OK |
| test_v33 | 31/31 |
| test_v34_estructura | 28/28 |
| test_v32_pruebas | OK |
| test_seed_demo | 63/63 |
| test_rutas_v2 (17 rutas jsdom) | TODAS OK, 0 errores JS |
| test_ux | 26/26 |
| audit_ui_v2 | SIN FALLOS |
| **test_v34b_integracion (nuevo)** | **91/91 OK** — estático (0 v0, 0 hardcode) + Voluntarios 6 filas/filtros + Ficha 7 tabs (especialidades/credencial 16418/7 entregas/3 servicios/11 marcajes/historial) + Dashboard KPIs + Entregas historial 7 |
| audit_ui (legacy v0) | 7 "fallos" esperados: nombres V2 desconocidos para el auditor v0; superado por audit_ui_v2 |

## 8. Deployment

- `clasp push` → `clasp deploy -i AKfycbzay31fDxiH0QGG29J77deMMJ7y19Ji_PrxQDYdn13zLiDI-F7TVprYBsDdNdikOplL` → **@20**, misma URL `https://script.google.com/macros/s/AKfycbzay31fDxiH0QGG29J77deMMJ7y19Ji_PrxQDYdn13zLiDI-F7TVprYBsDdNdikOplL/exec`. Sin deployment paralelo.

## 9. Pendientes

- Verificación visual del usuario en `/dev` (recarga forzada): Voluntarios con 6 registros, ficha de Patricio completa, Dashboard con KPIs reales.
- Nada pendiente de backend. El modelo, las hojas y los datos sembrados en V3.4A no fueron tocados.