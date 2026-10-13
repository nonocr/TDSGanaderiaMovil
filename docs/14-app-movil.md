# 14 — App móvil (Android e iPhone)

La app se puede **instalar en el celular**. No es una app distinta: abre la misma web de
Vercel (<https://tdsganaderia.vercel.app>), con la misma base de datos y la misma contraseña.
Cada `git push` actualiza también la app instalada; no hay que reinstalar.

## Cómo se instala

| Teléfono | Cómo |
|---|---|
| **Android** | Instalar el archivo `.apk` (ver "Generar el APK"). Se pasa por WhatsApp, Drive o cable. Android pide permitir "instalar apps de origen desconocido" la primera vez. |
| **iPhone** | En **Safari**, abrir la web → botón **Compartir** → **Agregar a pantalla de inicio**. Queda con ícono propio y abre a pantalla completa. |

## Qué hay en el código

- `src/app/manifest.ts` → `/manifest.webmanifest`: nombre, colores e íconos de la app instalable.
- `public/iconos/` → íconos generados a partir de `public/logo.png`.
- `src/middleware.ts`: el manifest y `/iconos/` se sirven sin sesión (el sistema los pide sin cookie).
- `movil/` → proyecto **Capacitor** (contenedor Android). No forma parte del despliegue web
  (`.vercelignore`).
  - `capacitor.config.json`: id `com.tierradesuenos.ganaderia`, carga la URL de Vercel.
  - `www/sin-conexion.html`: pantalla que aparece si se abre la app sin señal.
  - `assets/`: imágenes fuente del ícono y la pantalla de inicio (`npm run iconos` las aplica).
  - `android/app/src/main/java/.../MainActivity.java`: resuelve lo que el WebView de Android
    no hace solo y la web sí usa:
    - **Descargar respaldo** (archivo generado en la página) → se guarda en **Descargas**.
    - **Exportar CSV** (`/api/exportar`) → gestor de descargas de Android, con la cookie de sesión.
    - **Imprimir** la ficha (`window.print()`) → impresión de Android (permite "Guardar como PDF").

## Generar el APK (una vez por cambio de ícono o del contenedor)

Requisitos en la PC: **Android Studio** (trae Java y el Android SDK).

```powershell
cd movil
npm install
npm run apk
```

El archivo queda en `movil/android/app/build/outputs/apk/debug/app-debug.apk`.
También se puede abrir en Android Studio con `npm run abrir` (Build → Build APK).

> El APK "debug" basta para instalarlo a mano en los teléfonos de la familia. Para publicarlo
> en Play Store haría falta firmarlo con una llave propia (no se hace por ahora).

## Modo sin conexión

Funciona igual en la app Android, en el iPhone instalado y en el navegador.

**Ver sin señal** — `public/sw.js` (service worker):
- Cada página que se abre con señal queda guardada en el teléfono. Sin señal se muestra esa
  copia, con el aviso "Sin señal · ves los datos guardados hace X".
- Una página que nunca se abrió con señal muestra "Sin conexión" (no hay copia).
- Al **cerrar sesión** se borran las copias. `/login` y `/respaldo` no se guardan.
- Si se cambia `sw.js`, subir `VERSION` (y la constante `PAGINAS` de `EstadoConexion.tsx`).

**Registrar sin señal** — `src/lib/cola-offline.ts`:
- Se pueden registrar sin señal: **ordeños, pesos, montas, partos y cambios de etapa**.
  Se guardan en el teléfono (IndexedDB) y se envían solos, en orden, al volver la señal
  (también al abrir la app y cada 30 s). Botón "Enviar ahora" en el aviso.
- Siguen pidiendo señal: dar de alta / editar / borrar animales, editar o borrar eventos, fotos,
  respaldo.
- **Sin duplicados por reintentos**: cada registro lleva un `id` creado en el teléfono; el
  servidor lo usa como id y, si ya existe, responde el registro existente en vez de duplicarlo.
- **Registro rechazado al enviarlo** (p. ej. ya hay un ordeño de ese turno ese día para la vaca,
  o el animal fue borrado): **se avisa** (decisión del dueño, 2026-10-13). Queda en rojo con el
  motivo hasta que alguien toque "Entendido, descartar".
- **Sesión vencida** al volver la señal: los registros se conservan y el aviso pide volver a entrar.
- Los datos que se ven sin señal son los de la última copia: lo registrado sin señal aparece en
  las páginas cuando se envía.

## Limitaciones conocidas

- **Foto del animal**: en la app Android el botón abre la galería/archivos; la cámara se usa
  desde la app de cámara y luego se elige la foto. Para un botón "Tomar foto" directo, el
  frontend tendría que agregar `capture` al campo de archivo (pedido a Kiro, opcional).
