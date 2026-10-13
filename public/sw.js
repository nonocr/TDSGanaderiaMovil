// Service worker de TDS Ganadería: permite VER sin señal las páginas ya visitadas.
// (Registrar sin señal lo hace la cola de src/lib/cola-offline.ts, no este archivo.)
//
// - Páginas (HTML): primero la red; si no hay señal, la última copia guardada.
// - Archivos de Next (/_next/static/, con hash en el nombre): de la copia guardada.
// - Al navegar dentro de la app, Next pide la página en formato RSC (no HTML): si va bien, aquí se
//   baja también su HTML en segundo plano para tenerlo guardado (máx. una vez cada 15 s por página).
// - Al cerrar sesión se borran las páginas guardadas (tienen datos de la finca).
//
// Al cambiar este archivo, subir VERSION: así se borran las copias de la versión anterior.

const VERSION = "v1";
const PAGINAS = "tds-paginas-" + VERSION;
const ESTATICOS = "tds-estaticos-" + VERSION;
const REFRESCO_MS = 15000;
const NO_GUARDAR = ["/login", "/respaldo"];

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      for (const k of await caches.keys()) {
        if (k.startsWith("tds-") && !k.endsWith(VERSION)) await caches.delete(k);
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
        if (res.ok) await caches.delete(PAGINAS);
        return res;
      })
    );
    return;
  }

  if (req.method !== "GET") return;

  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(primeroGuardado(req));
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

async function primeroGuardado(req) {
  const cache = await caches.open(ESTATICOS);
  const guardado = await cache.match(req);
  if (guardado) return guardado;
  const res = await fetch(req);
  if (res.ok) await cache.put(req, res.clone());
  return res;
}

async function primeroRed(req) {
  try {
    const res = await fetch(req);
    await guardarSiSirve(req.url, res.clone());
    return res;
  } catch {
    const cache = await caches.open(PAGINAS);
    return (
      (await cache.match(req.url)) ||
      (await cache.match(req.url, { ignoreSearch: true })) ||
      paginaSinConexion()
    );
  }
}

async function guardarHtml(url) {
  const cache = await caches.open(PAGINAS);
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
  const cache = await caches.open(PAGINAS);
  await cache.put(url, copia);
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
