# Instrucciones para Claude Code — TDS Ganadería

Contexto del producto en `PRODUCT.md`, sistema visual en `DESIGN.md` y reglas del frontend en
`.kiro/steering/frontend.md`. Documentación del negocio en `docs/`.

## APK de Android: avisar y generarlo cuando haga falta (pedido del dueño, 2026-11-04)

El APK (`movil/`, Capacitor) es solo un contenedor que abre la web publicada en Vercel
(`https://tdsganaderia.vercel.app`). Los cambios de la web llegan solos a la app instalada con
cada push a `master`: **no** necesitan APK nuevo.

**Sí hace falta un APK nuevo** cuando un cambio toca el contenedor, por ejemplo:
- cualquier archivo de `movil/` (`capacitor.config.json`: URL, appId, nombre; `www/sin-conexion.html`;
  `assets/` y los íconos o la pantalla de inicio generados con `npm run iconos`;
  `android/`, incluido `MainActivity.java`, permisos, `build.gradle`, versión de Gradle);
- dependencias de `movil/package.json` (versiones de Capacitor o sus plugins);
- un cambio en la web que dependa de algo nuevo del contenedor (p. ej. un permiso o una función
  nativa que la app todavía no tiene).

**Cada vez que un cambio requiera APK nuevo:**
1. Decírselo al dueño de forma explícita en la respuesta (qué cambió y por qué hace falta).
2. Generarlo:
   ```powershell
   cd movil          # desde la carpeta movil, no desde la raíz
   npm install       # si cambió movil/package.json o es la primera vez
   npm run apk
   ```
   Queda en `movil/TDS-Ganaderia.apk` (no se sube al repo). Requiere Android Studio en la PC.
   Detalles y problemas conocidos: `docs/14-app-movil.md`, "Generar el APK".
3. Indicarle la ruta del archivo para que lo instale en los teléfonos. Si la generación falla,
   decirlo con el error; no dar el APK por generado.

Cuando un cambio **no** requiera APK nuevo y el dueño pueda dudarlo (p. ej. tras cambios grandes
de diseño), decirlo también en una línea.
