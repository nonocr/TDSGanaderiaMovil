// Service worker de TDS Ganadería: permite VER sin señal las páginas ya visitadas.
// (Registrar sin señal lo hace la cola de src/lib/cola-offline.ts, no este archivo.)
//
// - Páginas (HTML): primero la red; si no hay señal, la última copia guardada.
// - Archivos de Next con hash en el nombre (/_next/static/…-a1b2c3d4e5f6.js): de la copia guardada.
//   Son inmutables: si el archivo cambia, cambia su nombre. Los que NO llevan hash (los chunks de
//   `npm run dev`, p. ej. /_next/static/chunks/app/layout.js) no se guardan nunca: con "primero la
//   copia guardada" el navegador recibía un layout viejo y fallaba ("reading 'call'"). (v2)
// - Al navegar dentro de la app, Next pide la página en formato RSC (no HTML): si va bien, aquí se
//   baja también su HTML en segundo plano para tenerlo guardado (máx. una vez cada 15 s por página).
// - Al cerrar sesión se borran las páginas guardadas (tienen datos de la finca).
//
// Al cambiar este archivo, subir VERSION: así se borran las copias de la versión anterior.

// v2: no guarda archivos de /_next/static/ sin hash (ver arriba). Al activarse borra las copias v1.
// Al cambiarla, cambiar también PAGINAS en src/components/EstadoConexion.tsx.
const VERSION = "v2";
const PAGINAS = "tds-paginas-" + VERSION;
const ESTATICOS = "tds-estaticos-" + VERSION;
const REFRESCO_MS = 15000;
const NO_GUARDAR = ["/login", "/respaldo"];

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      try {
        for (const k of await caches.keys()) {
          if (k.startsWith("tds-") && !k.endsWith(VERSION)) await caches.delete(k);
        }
      } catch {
        // Sin acceso a las cachés: no hay copias viejas que borrar.
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname === "/api/sesion" && req.method === "DELETE") {
    e.respondWith(
      fetch(req).then(async (res) => {
        // Si no se pueden borrar las copias, la sesión se cierra igual.
        if (res.ok) await caches.delete(PAGINAS).catch(() => {});
        return res;
      })
    );
    return;
  }

  if (req.method !== "GET") return;

  if (url.pathname.startsWith("/_next/static/")) {
    // Sin hash en el nombre: lo maneja el navegador (red), sin copia guardada.
    if (conHash(url.pathname)) e.respondWith(primeroGuardado(req));
    return;
  }

  if (req.mode === "navigate") {
    e.respondWith(primeroRed(req));
    return;
  }

  if (req.headers.get("RSC") === "1" && !req.headers.get("Next-Router-Prefetch")) {
    url.searchParams.delete("_rsc");
    e.waitUntil(guardarHtml(url.toString()).catch(() => {}));
  }
});

// ¿El nombre del archivo lleva un hash de contenido? En producción Next nombra los archivos así:
// "1255-d086140ba3334809.js", "css/2b4f6a8c9d0e1f23.css", "media/a1b2c3d4e5f6.woff2". En
// desarrollo no ("layout.js", "webpack.js"). Basta con 8 o más caracteres hexadecimales seguidos.
function conHash(ruta) {
  const archivo = ruta.slice(ruta.lastIndexOf("/") + 1);
  return /[0-9a-f]{8,}/i.test(archivo);
}

// Las copias guardadas son una ayuda, nunca un requisito: si el almacenamiento de cachés falla
// (memoria llena, modo privado, perfil dañado), se sigue con la red. Antes un fallo de
// `caches.open` dejaba la página y sus archivos en ERR_FAILED y la app no abría. (v2)
async function abrirCache(nombre) {
  try {
    return await caches.open(nombre);
  } catch {
    return null;
  }
}

async function primeroGuardado(req) {
  const cache = await abrirCache(ESTATICOS);
  const guardado = cache ? await cache.match(req).catch(() => undefined) : undefined;
  if (guardado) return guardado;
  const res = await fetch(req);
  if (res.ok && cache) await cache.put(req, res.clone()).catch(() => {});
  return res;
}

async function primeroRed(req) {
  let res;
  try {
    res = await fetch(req);
  } catch {
    const cache = await abrirCache(PAGINAS);
    const copia = cache
      ? (await cache.match(req.url).catch(() => undefined)) ||
        (await cache.match(req.url, { ignoreSearch: true }).catch(() => undefined))
      : undefined;
    return copia || paginaSinConexion();
  }
  // Guardar la copia no debe impedir mostrar la página que ya llegó.
  await guardarSiSirve(req.url, res.clone()).catch(() => {});
  return res;
}

async function guardarHtml(url) {
  const cache = await abrirCache(PAGINAS);
  if (!cache) return;
  const previa = await cache.match(url);
  const cuando = Number(previa?.headers.get("x-tds-guardado") ?? 0);
  if (Date.now() - cuando < REFRESCO_MS) return;
  const res = await fetch(url, { credentials: "same-origin", redirect: "manual" });
  await guardarSiSirve(url, res);
}

// Solo páginas reales (200, sin redirección al login). Se anota cuándo se guardaron para que la
// app pueda decir "datos de hace X" sin señal.
async function guardarSiSirve(url, res) {
  if (!res.ok || res.type !== "basic") return;
  if (NO_GUARDAR.includes(new URL(url).pathname)) return;
  if (!(res.headers.get("Content-Type") || "").includes("text/html")) return;
  const headers = new Headers(res.headers);
  headers.set("x-tds-guardado", String(Date.now()));
  const copia = new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers });
  const cache = await abrirCache(PAGINAS);
  if (cache) await cache.put(url, copia);
}

function paginaSinConexion() {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Sin conexión · TDS Ganadería</title>
<style>
:root{--f:#fafaf9;--t:#1c1917;--s:#57534e;--m:#4b7a3f}
@media (prefers-color-scheme:dark){:root{--f:#1c1917;--t:#f5f5f4;--s:#a8a29e;--m:#7fb069}}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
background:var(--f);color:var(--t);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center}
main{max-width:340px}h1{font-size:1.25rem;margin:0 0 8px}p{color:var(--s);line-height:1.5;margin:0 0 24px}
a{display:flex;align-items:center;justify-content:center;min-height:48px;border-radius:12px;
background:var(--m);color:#fff;font-weight:600;text-decoration:none;margin-bottom:12px}
</style></head><body><main>
<h1>Sin conexión</h1>
<p>Esta página no se había abierto con señal, así que no hay una copia guardada en el teléfono.</p>
<a href="/">Ir al inicio</a>
<a href="javascript:history.back()">Volver</a>
</main></body></html>`;
  return new Response(html, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
