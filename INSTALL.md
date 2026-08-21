# Instalación — Base de Datos Defensa Civil

Sistema **Google Apps Script** con UI web propia servida por el mismo script
(`doGet` en `12_WebApp.js`) y Google Sheets como capa de datos.

## Requisitos

- Cuenta de Google
- Node.js ≥ 16 y npm (para clasp y las pruebas locales)

## Despliegue

1. Instalar y autenticar clasp:
   ```bash
   npm install -g @google/clasp
   clasp login
   ```
2. Crear el proyecto vinculado a una hoja de cálculo:
   ```bash
   clasp create --title "Base Datos DC" --type sheets --parentId ID_DE_TU_HOJA
   ```
3. Copiar los archivos `*.js`, `*.html` y `appsscript.json` de este repositorio
   a esa carpeta y subirlos:
   ```bash
   clasp push
   ```
4. Publicar la interfaz: en el editor de Apps Script →
   *Implementar → Nueva implementación → Aplicación web*
   (ejecutar como propietario; acceso según el uso previsto).
5. Primer arranque: el sistema genera sus hojas (voluntarios, eventos,
   inventario, usuarios…) automáticamente.

## Desarrollo y pruebas

```bash
npm ci                      # instala jsdom
node tests/test_v34n.js     # suite completa (70 verificaciones)
```

El CI verifica sintaxis (`node --check`) y pruebas en cada push.
