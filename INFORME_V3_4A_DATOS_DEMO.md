# INFORME V3.4A — DATOS DE PRUEBA CONTROLADOS + REFINAMIENTO VISUAL AVANZADO

**Fecha:** 17/08/2026 · **Alcance:** FASE V3.4A · **Deployment:** **@19** (misma URL)
**Regla respetada:** NO se modificó la arquitectura backend; solo se agregó `36_SeedDemo.js` (siembra con APIs existentes) y refinamiento visual SOLO frontend.

---

## 1. Registro real autorizado — Patricio Andrés Varela Contreras

> Autorización expresa del usuario para registrar estos datos como prueba controlada.
> **No eliminar, no modificar sin autorización.**

| Dato | Valor |
|---|---|
| RUN | 21.889.985-4 |
| Nombre | Patricio Andrés Varela Contreras |
| Grado | Voluntario Mayor (historial: Voluntario desde 01/04/2023 → Voluntario Mayor, fecha de ascenso no informada, requisitos ✓ sin excepción) |
| Categoría / Estado | Voluntario / Activo |
| Fecha de ingreso | 01/04/2023 |
| Cargo | **Asesor de Telecomunicaciones** (INTERNO, área Telecomunicaciones e Informática) — observación: *"Cargo asumido aproximadamente 10 meses después del ingreso."* (fecha exacta NO inventada: el modelo no soporta fechas aproximadas → fecha vacía = fecha real de registro; observación documentada) |
| Grupo sanguíneo | ABO **O** · Rh **+** → O+ (campos separados del modelo) |
| Especialidades | Sanidad (**nivel TENS** — variante, NO especialidad separada) · Telecomunicaciones + subespecialidad **Radioaficionado** (distintivo **CA2OPX**) · **Operador RPAS** (INTERNO — SEDE) |
| Credencial | **Licencia de Radioaficionado N° 16418**, otorgada 26/09/2024, vence 26/09/2027, **Vigente**, distintivo CA2OPX. **Una sola credencial** respalda Radioaficionado Y Operador RPAS (las asignaciones RPAS referencian `credencialId` — sin duplicar) |
| Habilitaciones RPAS | MAVIC SERIES MINI 2 · ENTERPRISE 3 · ENTERPRISE 3 PRO (subespecialidades INTERNO bajo Operador RPAS, todas con la misma credencial) |
| Unidad | **Fuerza de Tarea Delta** (INTERNO — SEDE), integrante **sin rol específico** |
| Equipamiento entregado | Botas de combate (45), Polera (L), Blusa (L), Pantalón (L), Gorra sin cubrenuca, Cinturón de combate, Cinturón de vestir — 7 entregas, 1 unidad disponible restante de cada ítem |
| NO entregado (correcto) | Gorra con cubrenuca, Porta equipo, Cortavientos, Parka, Polera pique (0 entregados) |

## 2. Voluntarios ficticios DEMO 01–05 (reversibles)

RUNs válidos e inequívocamente DEMO: **11.111.111-1 … 55.555.555-5**. Apellido "PRUEBA DEL SISTEMA".

| ID | Categoría | Especialidad | Notas |
|---|---|---|---|
| DEMO 01 | Voluntario | Sanidad | grado Voluntario (ingreso 01/01/2024) |
| DEMO 02 | Voluntario | Telecomunicaciones | grado Voluntario (01/02/2024) |
| DEMO 03 | Voluntario | Operador RPAS (INTERNO) | grado Voluntario (01/03/2024) |
| DEMO 04 | Disponible | Administración Logística | grado Voluntario (01/04/2024) |
| DEMO 05 | Aspirante | (sin especialidad) | sin grado (coherente con Aspirante) |

## 3. Servicios, asignaciones, retiros y asistencia DEMO

| Servicio | Tipo | Fecha | Estado | Asignados | Asistencia |
|---|---|---|---|---|---|
| **DEMO — PRUEBA DEL SISTEMA** | Operativo | 17/08/2026 | **Activo** | Patricio + DEMO 01–04 (5) | 3 Presente · 1 Ausente · 1 Ausente justificado |
| DEMO — PRUEBA HISTÓRICA 1 | Capacitación | 10/06/2026 | Finalizado | Patricio + DEMO 01 + DEMO 02 (3) | 2 Presente · 1 **Retirado** (retiro V3.3) |
| DEMO — PRUEBA HISTÓRICA 2 | Otro | 15/07/2026 | Finalizado | Patricio + DEMO 03 + DEMO 04 (3) | 2 Presente · 1 **Reemplazado** (retiro V3.3) |

- Lugar de todos: **"DEMO / Sede La Serena"**; S1 descripción: *"Registro de prueba para validación de la Web App."*
- Roles de asignación: **"Otro"** (no se inventaron roles institucionales).
- Totales asistencia: Presente 7 · Ausente 1 · Ausente justificado 1 · Reemplazado 1 · Retirado 1 = **11 marcajes** (los 6 estados del catálogo, salvo Asignado que es el estado previo al marcaje).

## 4. Refinamiento visual avanzado (SOLO frontend)

Sección **26.5** nueva en `13_UI_Styles.html` + 4 líneas en `navegar()` (`13_UI_App.html`):

| Elemento | Efecto | Duración |
|---|---|---|
| Cards | hover de borde en todas; presión (`translateY(0) scale(0.99)`) en interactivas | 150–220 ms |
| Tablas | fila seleccionada (`.fila-seleccion`/`.seleccionada`) + transición de celdas | 150 ms |
| KPIs | entrada **escalonada** (delays 55–220 ms), UNA vez por sesión | 260 ms |
| Actividad reciente | entrada escalonada de ítems, UNA vez por sesión | 260 ms |
| Gráficos | barras crecen (`barra-crecer`), UNA vez por sesión | 380 ms |
| Tabs | subrayado **deslizante** `::after` (scaleX) | 220 ms |
| Dropdown/inputs | hover de borde | 150 ms |
| Badges | hover sutil (brightness) | 150 ms |
| Stepper (wizard) | pop del paso al cambiar de estado (`paso-pop`) | 220 ms |
| Timeline | hover con fondo + punto ampliado | 150 ms |

- **Una sola vez:** la clase `vista-nueva` se añade en la 1ª visita de cada página y se retira a los 700 ms → al volver a una página las entradas NO re-animan (verificado por test).
- `@media (hover:hover)`: los estados hover solo aplican con dispositivo con hover (táctiles no se ven afectados).
- `prefers-reduced-motion` global (sección 27) neutraliza todas las animaciones nuevas.
- Paleta institucional intacta (`#004C90`/`#E20615`/`#A6861A` + escalas), responsive sin cambios de layout.

## 5. Verificación (todo verde)

| Prueba | Resultado |
|---|---|
| node --check (backend + frontend) | OK |
| **test_seed_demo (nuevo)** | **63/63** — siembra completa + idempotencia (2ª ejecución: 42 omitidos, 0 errores, 0 duplicados) |
| test_core / test_v31 / test_v32 | PASARON / 15/15 / OK |
| test_v33 (integridad histórica) | 31/31 |
| test_v34_estructura | 28/28 |
| test_v32_pruebas (09_Pruebas) | 115 OK / 0 FALLO |
| test_ux (extendido) | **26/26** (vista-nueva + selectores CSS V3.4A) |
| test_rutas_v2 (jsdom, 18 rutas) | TODAS OK, 0 errores JS |
| audit_ui_v2 | SIN FALLOS |

**Deployment:** `clasp push` + `clasp deploy -i AKfycbzay31fDxiH0QGG29J77deMMJ7y19Ji_PrxQDYdn13zLiDI-F7TVprYBsDdNdikOplL` → **@19** (misma URL, sin deployment paralelo). @HEAD/@2 intactos.

## 6. Cómo ejecutar la siembra (PASO OBLIGATORIO)

1. Abrir el proyecto en script.google.com → **Editor** → función `crearDatosDemoV2` → **Ejecutar** → autorizar.
2. En el editor elegir la función en el desplegable de arriba (junto a "Depurar").
3. Se crea todo lo descrito; re-ejecutar es seguro (idempotente).

## 7. Limpieza posterior (reversibilidad documentada — SIN función de borrado)

Los datos DEMO son reversibles sin borrado destructivo (regla del sistema: nunca `deleteRow` por API):

- **Cierre lógico (vía Web App, recomendado):** quitar especialidades/credenciales (Cerrar/Revocar), retirar voluntarios de servicios, dar de baja a DEMO 01–05 (páginas Personas/Voluntarios).
- **Eliminación física (solo a mano, si se requiere):** en cada hoja (Personas, VoluntariosV2, Voluntario Especialidades, Voluntario Credenciales, Historial Grados, Historial Cargos, Integrantes Unidad, Servicios, Servicio Voluntarios, Asistencia, Voluntarios v0, Inventario, Entregas, Subespecialidades, Credenciales) eliminar las filas cuyo contenido contenga "DEMO", "FASE V3.4A", "PRUEBA DEL SISTEMA" o el RUN de Patricio (este último SOLO si se revoca la autorización).
- **Registros que NO son DEMO y quedan para siempre:** el cargo "Asesor de Telecomunicaciones" (INTERNO — usado por Patricio; si se elimina el cargo, su historial queda huérfano → mantenerlo o cerrarlo vía UI), las 3 subespecialidades RPAS, la credencial "Licencia de Radioaficionado" y la unidad "Fuerza de Tarea Delta" (ya existía en semillas; solo se agregó al integrante).

## 8. Archivos tocados

| Archivo | Cambio |
|---|---|
| `36_SeedDemo.js` | **NUEVO** — siembra DEMO idempotente (único cambio backend) |
| `13_UI_Styles.html` | sección 26.5 (microinteracciones V3.4A) |
| `13_UI_App.html` | `navegar()`: clase `vista-nueva` (1ª visita, retirada a los 700 ms) |
| `AGENTS.md` | §0 V3.4A + fila de tabla de módulos |
| `/tmp/opencode/test_seed_demo.js` | **NUEVO** — harness 63/63 |
| `/tmp/opencode/test_ux.js` | extendido: tests 13–14 (vista-nueva + CSS) |