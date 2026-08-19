# INFORME UX v0.8 — Sistema de carga, transiciones y feedback visual

**Fecha:** ago 2026 · **Alcance:** SOLO frontend (13_UI_Index / 13_UI_Styles / 13_UI_App / 8 páginas con operaciones) · **Backend y arquitectura: intactos** · **Deployment @18** (misma URL).

## 1. Splash inicial con identidad institucional
- Marcado nuevo en `13_UI_Index.html` (`#splash`): logo oficial (mismo data URI `App.LOGO`, asignado por `iniciar()` al selector `.logo-institucional`), "DEFENSA CIVIL DE CHILE", "Sede La Serena · Al servicio de la ciudadanía" y "Cargando sistema…" con spinner.
- Animación de entrada: logo fade-in + escala 0.96→1 (600 ms), textos escalonados (150/300/450 ms). Fondo gradiente azul institucional; rojo solo como acento (nunca de fondo).
- **Sin delays artificiales**: desaparece con fade-out cuando `getSesion` + `refrescarAlertas` resuelven (`Promise.all`). Cap de seguridad de 6 s para que jamás bloquee la app. `role="status"` + `aria-label`.

## 2. Transiciones de página
- Salida: `.page.saliendo` (fade + `translateY(-4px)`, 150 ms) → entrada: `.page.activa` (fade + `translateY(4px)`, 200 ms). Ambas respetan `prefers-reduced-motion` (sin animación y sin espera).
- Invariante de blindaje intacta: nunca dos páginas visibles; al reposo siempre una sola `.activa`/`hidden` correcto (verificado por test de rutas, ahora con espera de transición).

## 3. Skeletons
- Ya existían en todas las páginas (`App.skeleton`). Nuevo: `App.skeletonTarjetas` para el Dashboard (filas tipo card con chip) — aplicado en `14_UI_Dashboard` (KPIs, gráficos y alertas).

## 4. Botones con estados Normal → Procesando → Éxito / Error
- Helper central `App.botonEstado(btn, estado, texto)`: procesando (spinner-mini + "Registrando…/Guardando…/Asignando…", deshabilitado, cursor progress), éxito (✓ verde + "Registrada", restaura el HTML original a los 1,6 s), normal (restauración inmediata, usado en errores).
- Aplicado a las 10 operaciones clave: crear voluntario (Dashboard y Voluntarios), entrada y ajuste de inventario, confirmar entrega, devolución, crear servicio, asignación masiva, marcaje de asistencia.

## 5. Toasts estructurados
- Nueva estructura: icono con fondo de color semántico (ok/aviso/error/info), título, detalle opcional, botón cerrar y botón de acción opcional. Animación de entrada slide+fade y de salida limpia.
- Accesibilidad: `role="alert"` + `aria-live` para errores; cierre automático 3,2/3,8/4,5 s según tipo.
- Compatibilidad total: la firma antigua `App.toast('mensaje', 'tipo')` sigue funcionando (0 cambios en páginas no tocadas).

## 6. Modales con animación de salida
- `App.modal` agrega `.saliendo` al cerrar (fade del overlay + contracción del panel, 170 ms) y elimina el nodo después. Se conservan: ESC, focus trap, retorno de foco al disparador y cierre por clic fuera.

## 7. Feedback de operaciones Inicio → Procesando → Resultado
- Sin mensajes redundantes: el botón muestra el estado durante la operación y el resultado llega por toast (éxito) o toast de error (con botón restaurado). Las validaciones previas (cantidades, campos) no cambian.

## 8. Error de conexión con Reintentar
- `App.api` intercepta fallos de `google.script.run`: toast "No fue posible completar la operación / Comprueba tu conexión o vuelve a intentarlo." con botón **Reintentar** que re-ejecuta la misma llamada (mismo nombre y argumentos). Sin stack traces en pantalla: el detalle técnico va solo a `console.error`. Si el usuario cierra el aviso, la promesa rechaza con el mensaje amigable (las páginas lo muestran tal cual).

## 9. Navegación: activo inmediato, transición y scroll reset
- El ítem del sidebar se marca activo de inmediato; la transición es solo visual. `window.scrollTo(0,0)` se mantiene en cada cambio de ruta. Clicks rápidos encadenados convergen correctamente al último destino.

## 10. Sidebar / badges / KPIs
- Badge de alertas con microanimación de pulso (400 ms) solo cuando el total cambia (nunca en el primer pintado).
- KPIs con microanimación de entrada discreta (fade + 3 px, 320 ms) en cada actualización significativa; sin count-up exagerado.

## 11. Stepper de entregas y comprobante
- Stepper corregido a las clases reales del design system: `activo`/`completado` (antes `actual`/`hecho`, que nunca estilizaban) + línea de progreso `.step-linea` entre pasos + transición de contenido `.paso-animado` (slide 12 px). Sin carrusel.
- Comprobante: "Entrega registrada correctamente" (toast + botón ✓) → paso 6 muestra "Preparando comprobante…" con spinner mientras `obtenerEntrega` resuelve → boleta imprimible. Nunca un loading indefinido.

## 12. Verificación
| Prueba | Resultado |
|---|---|
| `test_ux.js` (DOM: splash, transición, toast, aviso conexión, botón, modal, pulso, reduced-motion) | **24/24 OK** |
| `test_rutas_v2.js` (17 rutas, con espera de transición) | **TODAS OK, 0 errores JS** |
| `audit_ui_v2` | **SIN FALLOS** |
| node --check (backend 18 .js + 7 frontend modificados) | **OK** |
| `test_core`, `test_v2`, `test_v31`, `test_v32`, `test_v33` (31/31), `test_v34_estructura` (28/28), `09_Pruebas` (115 OK) | **Regresión completa verde** |
| Deployment | **@18, misma URL** (`clasp deploy -i`) |

**Pendiente del usuario:** verificación visual con recarga forzada en /dev (Ctrl+Shift+R o `?new=1`): splash al abrir, transiciones entre páginas, botones con spinner al registrar una entrega, toast con Reintentar si hay fallo de conexión, comprobante con "Preparando comprobante…".