# INFORME V3.4I — CORRECCIONES

**Fecha:** 18 de agosto, 2026
**Versión:** 0.8.4
**Deployment:** @29 (AKfycbwcbkKcJI5BgirGPPnJ5QH6KprZGFPrM9iYBVP2FDBI4rkPzWVSW3KRQ-F2F82Uadxt)
**Commit:** `dcb5163`

---

## Cambios realizados

### 1. Fix imagen Subinstructor (13_UI_Parches.html)

**Causa raíz:** `GRADOS_V2` usa `'Subinstructor'` (una palabra), pero la META de parches tiene `'Sub Instructor'` (dos palabras). El ALIAS solo tenía `'sub instructor'` → lookup fallaba para `'subinstructor'`.

**Fix:** Agregado alias `'subinstructor': 'grado sub instructor'` en ALIAS (línea 70).

### 2. Fix lema institucional

**Causa:** El lema institucional correcto es "AL SERVICIO DE LA COMUNIDAD", no "Al servicio de la ciudadanía".

**Archivos corregidos:**
- `13_UI_Index.html`: splash (línea 26) y sidebar (línea 43)
- `17_UI_Entregas.html`: comprobante (líneas 353, 682)
- `AGENTS.md`: todas las referencias

### 3. Fix splash en PC (13_UI_App.html)

**Causa:** `ocultarSplash()` se ejecutaba tan pronto como `getSesion` + `refrescarAlertas` resolvían. En PC con conexión rápida, esto podía ser <100ms — el splash aparecía y desaparecía instantáneamente.

**Fix:** Floor de 1200ms:
- `_splashInicio = Date.now()` se registra al inicio del módulo
- `ocultarSplash()` calcula `restante = SPLASH_MIN_MS - elapsed`
- Si `restante > 0`, re programación con `setTimeout`
- Splash siempre visible al menos 1.2s

### 4. Fix transiciones entre secciones (13_UI_App.html)

**Causa:** `navegar()` tenía solo 150ms de fade-out de la página anterior, sin indicador visual de carga. El usuario no veía feedback al cambiar de sección.

**Fix:** Barra de carga global:
- Elemento `<div>` fijo arriba (3px, gradiente azul-celeste, z-index 10000)
- Se muestra al 60% durante fade-out (150ms)
- Se muestra al 100% al renderizar nueva página
- Se oculta (width: 0) 100ms después del render
- `prefers-reduced-motion` respeta la funcionalidad

### 5. 22_Personas.js — NO es huérfano

**Verificación:** Las funciones de `22_Personas.js` son consumidas por 6+ archivos HTML:
- `listarPersonasV2`: Dashboard, Entregas, Ficha, Voluntarios, Módulos, Personas
- `obtenerPersonaV2`: Ficha
- `crearPersonaV2`: Dashboard, Voluntarios, Personas
- `reactivarVoluntarioV2`: Ficha, Voluntarios, Personas

**Decisión:** Se conserva el archivo. 21_UI_Personas.html es huérfano (no incluido en Index), pero 22_Personas.js NO lo es.

## Pendiente verificación visual

- **Splash:** Confirmar que se ve en PC (1.2s mínimo) y celular
- **Transiciones:** Confirmar barra de carga al cambiar de sección
- **Subinstructor:** Confirmar parche visible en Grados y Cargos
- **Lema:** Confirmar "Al servicio de la comunidad" en header/sidebar/comprobante
