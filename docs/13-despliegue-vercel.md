# 13 — Despliegue en Vercel

La app se publica en Vercel desde el repositorio de GitHub **`nonocr/TDSGanaderiaMovil`**
(desde el 2026-10-13; antes era `nonocr/TDSGanaderia`, que queda solo como histórico).
Cada `git push` a `master` publica una versión nueva sola. Un solo repo y un solo despliegue
sirven a la web y a la app Android (que carga esta misma URL, ver `14-app-movil.md`).

## Preparado en el código

- `vercel.json`: las funciones corren en **`cle1` (Cleveland)**, junto a la base de Supabase
  (`us-east-2`, Ohio). Así cada consulta tarda unos pocos ms en vez de ~85 ms.
- Bloqueo de intentos de login guardado en la base (`IntentoLogin`), no en memoria.
- La cookie de sesión sale con `Secure` porque Vercel sirve todo por HTTPS.
- `postinstall` corre `prisma generate`, así Vercel genera el cliente de Prisma al compilar.

## Pasos (una sola vez)

1. Entrar a <https://vercel.com> con la cuenta de GitHub → **Add New… → Project** →
   importar `TDSGanaderia`. Framework: Next.js (lo detecta solo). No cambiar los comandos.
2. Antes de **Deploy**, en **Environment Variables** cargar estas cuatro variables:

   | Variable | Valor |
   | --- | --- |
   | `DATABASE_URL` | La del `.env`, cambiando el puerto **5432 → 6543** y los parámetros por `?pgbouncer=true&connection_limit=10&sslmode=require` |
   | `DIRECT_URL` | Igual que en `.env` |
   | `APP_PASSWORD_HASH` | Igual que en `.env` |
   | `SESSION_SECRET` | Igual que en `.env` |

   Vercel permite pegar varias variables de una vez en formato `.env`.
3. **Deploy**. Al terminar da una dirección `https://<proyecto>.vercel.app`.
4. Opcional: **Settings → Domains** para usar un dominio propio.

Cambiar la contraseña (`npm.cmd run clave`) actualiza el `.env` local; después hay que copiar
`APP_PASSWORD_HASH` y `SESSION_SECRET` nuevos a Vercel y volver a desplegar
(**Deployments → … → Redeploy**).

`connection_limit=10`: las páginas lanzan hasta 8 consultas en paralelo; con un límite menor
hacen fila (medido: con 3, ocho consultas tardan el triple que con 10).

## Rendimiento (medido 2026-10-08)

Cada página tarda ~150–200 ms de punta a punta, de los cuales ~75–95 ms son solo la red
hasta Vercel. Para que se *sienta* rápida:
- `src/app/loading.tsx`: al tocar un enlace aparece al instante un esqueleto de carga.
- `staleTimes.dynamic = 30` (`next.config.mjs`): volver a una página visitada hace menos de
  30 s es instantáneo. Guardar algo llama `router.refresh()`, que descarta esa caché.
- La primera visita tras un rato sin uso puede tardar ~1 s más (arranque en frío de la función).

## Límites a tener en cuenta

- **4,5 MB por petición** (subida y descarga). Afecta al **respaldo**: hoy pesa unos KB, pero
  las fotos van dentro (~90 KB cada una); con unas 50 fotos, descargar o restaurar el respaldo
  fallará con 413. Pendiente: partir el respaldo en datos + fotos por lotes (backend y frontend).
  Las fotos sueltas (≤ 4 MB) no tienen problema.
- Plan **Hobby** (gratis): solo uso no comercial y funciones de hasta 300 s. Para la finca
  corresponde el plan **Pro**.
- Seguir usando la app local (`npm.cmd run prod`) es posible: las dos usan la misma base.
