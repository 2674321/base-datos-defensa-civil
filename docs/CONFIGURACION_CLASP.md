# Configuración local de Apps Script (`clasp`)

`.clasp.json` contiene el `scriptId` real del proyecto. **No debe versionarse**
(el repositorio es público). La copia versionada queda pendiente de retiro en el
commit y de purga del historial; ver `PLAN_PURGA_HISTORIAL.md`.

## Configuración recomendada

1. Copia el ejemplo y completa tu ID localmente:

   ```bash
   cp .clasp.example.json .clasp.json
   # edita .clasp.json con tu scriptId
   ```

2. `.clasp.json` está en `.gitignore`; tus credenciales de `clasp`
   (`.clasprc.json`) viven en tu HOME y tampoco se versionan.

3. Para CI, define el `scriptId` como *GitHub Secret* y genera `.clasp.json`
   en el workflow, en lugar de dejarlo en el repositorio.

## Identificador de hoja (`SS_ID`)

El ID de la hoja de producción **ya no se versiona**. `01_Utilidades.js`
incorpora el helper `getSpreadsheetId_()`, que lo lee de las *Script Properties*
y lanza un error claro si falta:

```
PropertiesService.getScriptProperties().getProperty('SS_ID')
```

### Configuración (una sola vez por despliegue)

1. Abre el proyecto en el editor de Apps Script.
2. **Configuración del proyecto → Propiedades de la secuencia de comandos**.
3. Añade la propiedad `SS_ID` con el ID de la hoja (no se guarda en el repo).
4. Alternativa por código (solo para el propietario del script):

   ```javascript
   PropertiesService.getScriptProperties().setProperty('SS_ID', '<ID_HOJA>');
   ```

Sin `SS_ID` configurado, cualquier operación que necesite abrir la hoja (cuando
el script no está vinculado) fallará con un mensaje explícito; no hay valor
por defecto. Los triggers no requieren cambios.
