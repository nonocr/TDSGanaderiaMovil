import { NextRequest, NextResponse } from "next/server";
import { COOKIE_SESION, sesionValida } from "@/lib/sesion";

// Rutas que se pueden abrir sin sesión.
const PUBLICAS = ["/login", "/api/sesion"];

// ¿La petición sale de una página de esta misma app?
// 1) Sec-Fetch-Site: lo pone el navegador (no se puede falsificar desde otra web) y funciona
//    detrás de túneles/proxies (p. ej. el reenvío de puertos de VS Code), que cambian el Host.
// 2) Navegadores sin esa cabecera: comparar Origin con el Host (o el host reenviado por el proxy).
function mismoOrigen(req: NextRequest): boolean {
  const sitio = req.headers.get("sec-fetch-site");
  if (sitio) return sitio === "same-origin";

  const origen = req.headers.get("origin");
  if (!origen) return false;
  let hostOrigen: string;
  try {
    hostOrigen = new URL(origen).host;
  } catch {
    return false;
  }
  const hosts = [req.headers.get("host"), req.headers.get("x-forwarded-host")];
  return hosts.some((h) => h && h.split(",")[0].trim() === hostOrigen);
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const esApi = pathname.startsWith("/api/");

  // CSRF: toda petición que modifica datos debe venir de esta misma app.
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && !mismoOrigen(req)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }

  const conSesion = await sesionValida(req.cookies.get(COOKIE_SESION)?.value);

  // Con sesión activa, /login no tiene sentido: se va directo a la app.
  if (pathname === "/login" && conSesion && req.method === "GET") {
    const volver = req.nextUrl.searchParams.get("volver");
    const destino = volver && /^\/(?![/\\])/.test(volver) ? volver : "/";
    return NextResponse.redirect(new URL(destino, req.url));
  }

  if (PUBLICAS.some((p) => pathname === p)) return NextResponse.next();

  if (conSesion) return NextResponse.next();

  if (esApi) {
    return NextResponse.json({ error: "Sesión expirada. Vuelve a iniciar sesión." }, { status: 401 });
  }
  const login = new URL("/login", req.url);
  login.searchParams.set("volver", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Todo excepto archivos estáticos de Next, las imágenes públicas (logo y fondo del login,
  // que se ven sin sesión), el manifest de la app instalable (el sistema lo pide sin cookie
  // de sesión) y el service worker (public/sw.js).
  matcher: ["/((?!_next/static|_next/image|favicon.png|favicon.ico|logo.png|fondoTDS.jpg|FondoTDS2.jpeg|iconos/|manifest.webmanifest|sw.js).*)"],
};
