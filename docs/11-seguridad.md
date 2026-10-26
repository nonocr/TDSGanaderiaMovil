# 11 — Seguridad

Medidas de seguridad de la app (2026-10-08) y lo que queda pendiente.

## Acceso (login)

- Toda la app y toda la API piden sesión (`src/middleware.ts`). Sin sesión, las páginas
  redirigen a `/login` y la API responde 401.
- Hay **una contraseña** compartida para entrar. En `.env` solo se guarda su **hash scrypt**
  (`APP_PASSWORD_HASH`), nunca la contraseña.
- Para definirla o cambiarla: `npm.cmd run clave` (la pide dos veces). Cambiarla también
  renueva `SESSION_SECRET`, lo que **cierra todas las sesiones abiertas**.
- La sesión es una cookie firmada con HMAC-SHA256 (`src/lib/sesion.ts`): `HttpOnly`,
  `SameSite=Lax`, `Secure` cuando se sirve por HTTPS. Casilla **"Mantener la sesión
  iniciada"** (marcada por defecto): dura **1 año**; sin marcar, se borra al cerrar el
  navegador (y caduca a las 12 h).
- `Lax` y no `Strict`: con `Strict` el navegador no enviaba la cookie al abrir la app desde
  un enlace de otra app (WhatsApp, correo…) y pedía la contraseña cada vez. El CSRF no
  depende de la cookie: lo frena el middleware (ver abajo).
- Con sesión activa, `/login` redirige directo a la app. El formulario tiene un usuario
  oculto para que el navegador ofrezca guardar la contraseña.
- Tras **10 intentos fallidos** desde la misma IP se bloquea el login 15 minutos (10 y no 5
  porque varias personas comparten el Wi-Fi de la finca, y con él la IP). Los intentos
  se guardan en la tabla `IntentoLogin` (no en memoria), así el bloqueo vale también en Vercel.
- Botón **Cerrar sesión** al final del menú lateral.

## Protección de la API

- **CSRF**: toda petición que modifica datos (POST/PUT/PATCH/DELETE) debe venir de la propia
  app; si no, 403. Se usa la cabecera `Sec-Fetch-Site` del navegador (funciona detrás de
  túneles como el reenvío de puertos de VS Code) y, si falta, se compara `Origin` con el host.
- **Validación** de todas las entradas (`src/lib/validar.ts`): tipos, valores permitidos
  (sexo, estado, etapa), fechas válidas (1950–2100), rangos numéricos, largo máximo de textos,
  formato de identificadores y tamaño máximo del cuerpo (100 KB; 4 MB fotos; 80 MB respaldos).
- **Errores sin detalles internos**: el usuario ve un mensaje claro; el detalle técnico solo
  va al log del servidor.
- **Fotos**: solo JPEG, PNG o WebP en base64 (se rechaza SVG, que puede contener código).
- **Respaldo**: al restaurar se valida todo el archivo antes de borrar nada; si algo falla, la
  base queda intacta (transacción).
- **CSV**: las celdas que empiezan con `= + - @` se neutralizan para que Excel no las ejecute
  como fórmulas.

## Cabeceras HTTP (`next.config.mjs`)

Content-Security-Policy (solo recursos propios), `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`,
`Cross-Origin-Opener-Policy`, HSTS, y sin `X-Powered-By`.

## Base de datos (Supabase)

- Conexión **cifrada obligatoria** (`sslmode=require` en `.env`).
- **RLS activado** en todas las tablas (`prisma/supabase-rls.sql`): la API REST pública de
  Supabase no da acceso a los datos. Si se agregan tablas, añadirlas a ese archivo.
- `.env` (contraseña de la base, hash y secreto de sesión) no se sube al repositorio.

## Dependencias

- Next.js 15.5.27 + React 19: corrige vulnerabilidades críticas de la 14.2.15 (ejecución
  remota de código en Windows, bypass del middleware de autenticación, entre otras).
- `npm audit --omit=dev`: **0 vulnerabilidades**.
- Quedan avisos en dependencias de **desarrollo** de Tailwind 3 (`braces`, `micromatch`):
  solo corren al compilar el CSS, nunca en el servidor. Se resuelven migrando a Tailwind 4.
- Revisar cada tanto con `npm.cmd audit`.

## Revisión 2026-10-20 (Claude Code)

- **Permisos de Supabase**: además de RLS, se quitaron todos los permisos de los roles públicos
  `anon` y `authenticated` sobre tablas, secuencias y funciones (también para tablas futuras):
  `prisma/supabase-privilegios.sql` (aplicado y verificado: 0 permisos). Si se crea una tabla
  nueva, correr de nuevo `supabase-rls.sql` y este archivo.
- **Secretos en Git**: el historial (31 commits) no tiene secretos. `.gitignore` excluye todo
  `.env.*` (menos `.env.example`) y las llaves de firma Android. Hook `.githooks/pre-commit`
  (`scripts/revisar-secretos.mjs`) bloquea commits con secretos. Activarlo en cada clon:
  `git config core.hooksPath .githooks`. Revisión completa: `node scripts/revisar-secretos.mjs --todo`.
- **Login bloqueado** responde 429 con `Retry-After`.
- **APK Android**: `allowBackup="false"` (una copia de seguridad del teléfono ya no se lleva la
  cookie de sesión) y sin tráfico HTTP sin cifrar. Requiere generar el APK de nuevo.
- **Pruebas**: `npm.cmd run seguridad` (o `node scripts/probar-seguridad.mjs <url>`) contra la app
  local: sesión, CSRF, cabeceras, validación, inyección y errores. No escribe datos.
- **Dependencias**: Next 15.5.28, React 19.3.1, PostCSS 8.5.31. `npm audit --omit=dev`: 0.

### Riesgos que quedan (aceptados)
- La sesión es una cookie firmada sin registro en el servidor: **cerrar sesión borra la cookie
  del dispositivo, pero una cookie robada sigue valiendo** hasta que vence (1 año). La única
  forma de invalidarlas todas es cambiar la contraseña (`npm run clave`, que rota
  `SESSION_SECRET`) y actualizar las variables en Vercel.
- La CSP permite `'unsafe-inline'` en scripts (lo exige el script del tema y Next sin nonces).
  React escapa todo el texto y no hay HTML de usuario, así que el riesgo es bajo.
- Una sola contraseña compartida: no hay roles ni usuarios separados (todos pueden todo).

## Revisión 2026-10-26 (Claude Code)

- **Bloqueo de login evitable en la red local (corregido)**: el contador de intentos usaba
  `x-real-ip` / `x-forwarded-for`. En Vercel esa cabecera la fija la plataforma, pero en
  `npm run prod` (sin proxy delante) la escribe el cliente: cambiándola en cada intento nunca se
  llegaba a 10 fallos. Ahora solo se confía en `x-real-ip` cuando `VERCEL` está definido; fuera de
  Vercel todos los intentos cuentan en un único contador (`local`). Efecto: en la red local, 10
  fallos de cualquiera bloquean el login 15 min para todos.
- `npm run seguridad` suma 2 pruebas (cerrar sesión borra la cookie; cerrar sesión desde otro sitio
  → 403): 27/27. No se agregó una prueba del bloqueo porque escribiría en `IntentoLogin` de la base
  de producción.
- `npm audit --omit=dev`: 0. `npm audit` completo: 1 moderada en `postcss-selector-parser`
  (dependencia de Tailwind 3, solo al compilar el CSS propio; no llega al servidor).
- Revisado sin cambios: sesión firmada y cookies, CSRF, validación de todas las rutas (todas usan
  `ruta()`), SQL parametrizado (único `$executeRaw` con parámetros), fotos re-codificadas con
  límite de píxeles, CSV contra fórmulas, cabeceras, service worker (no guarda `/login` ni
  `/respaldo`; borra la caché al cerrar sesión).
- **Pendiente (informativo)**: si la sesión vence sin "Cerrar sesión", las páginas guardadas por el
  service worker siguen en el teléfono hasta el próximo cierre de sesión.

## Recomendaciones fuera del código

1. **Cuenta de Supabase**: activar verificación en dos pasos (MFA).
2. Supabase → Project Settings → Database → **Network restrictions**: si la app solo corre
   desde una ubicación fija, limitar las IP que pueden conectarse.
3. Si se publica en internet (p. ej. Vercel), servirla **solo por HTTPS** y poner las
   variables de `.env` en la configuración del hosting, nunca en el repositorio.
4. Usar una contraseña de acceso larga (12+ caracteres) y no reutilizarla.
5. Si algún día hay varios usuarios con permisos distintos, pasar a Supabase Auth
   (usuarios individuales) en lugar de la contraseña compartida.
