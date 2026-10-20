// Pruebas de seguridad contra una instancia de la app (por defecto la local).
// NO escriben datos: solo lecturas y peticiones que el servidor rechaza antes de guardar.
//
// Uso:  node scripts/probar-seguridad.mjs [URL_BASE]      (por defecto http://localhost:3000)
// Con SESSION_SECRET en .env también prueba como usuario con sesión (firma una cookie local).
import { createHmac } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const COOKIE = "tds_sesion";

let fallos = 0;
const ok = (cond, nombre, detalle = "") => {
  console.log(`${cond ? "OK  " : "FALLA"} ${nombre}${cond ? "" : `  -> ${detalle}`}`);
  if (!cond) fallos++;
};
const pedir = (ruta, opciones = {}) => fetch(BASE + ruta, { redirect: "manual", ...opciones });

function secretoSesion() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (!existsSync(".env")) return null;
  const m = readFileSync(".env", "utf8").match(/^SESSION_SECRET="?([^"\r\n]+)"?/m);
  return m ? m[1] : null;
}
function cookieFirmada(secreto, expiraMs) {
  const expira = String(expiraMs);
  const firma = createHmac("sha256", secreto).update(expira).digest("base64url");
  return `${COOKIE}=${expira}.${firma}`;
}

// --- Sin sesión -----------------------------------------------------------------
{
  const r = await pedir("/api/animales");
  ok(r.status === 401, "API sin sesión -> 401", r.status);
  const p = await pedir("/");
  ok([302, 303, 307].includes(p.status) && (p.headers.get("location") || "").includes("/login"),
    "Página sin sesión -> redirige a /login", `${p.status} ${p.headers.get("location")}`);
  const f = await pedir("/api/animales", { headers: { cookie: `${COOKIE}=99999999999999.firmafalsa` } });
  ok(f.status === 401, "Cookie con firma falsa -> 401", f.status);
  const s = await pedir("/api/respaldo");
  ok(s.status === 401, "Respaldo sin sesión -> 401", s.status);
}

// --- CSRF (se rechaza en el middleware, antes de tocar la base) -----------------
{
  const cuerpo = { method: "POST", body: "{}", headers: { "content-type": "application/json", "sec-fetch-site": "cross-site" } };
  const r = await pedir("/api/animales", cuerpo);
  ok(r.status === 403, "POST desde otro sitio (Sec-Fetch-Site) -> 403", r.status);
  const o = await pedir("/api/sesion", { method: "POST", body: "{}", headers: { "content-type": "application/json", origin: "https://malo.example" } });
  ok(o.status === 403, "Login desde otro origen -> 403", o.status);
  const n = await pedir("/api/animales", { method: "DELETE" });
  ok(n.status === 403, "Modificación sin Origin ni Sec-Fetch-Site -> 403", n.status);
}

// --- Cabeceras ---------------------------------------------------------------
{
  const r = await pedir("/login");
  const h = (k) => r.headers.get(k) || "";
  ok(h("content-security-policy").includes("frame-ancestors 'none'"), "CSP con frame-ancestors 'none'", h("content-security-policy"));
  ok(h("content-security-policy").includes("object-src 'none'"), "CSP con object-src 'none'");
  ok(h("x-content-type-options") === "nosniff", "X-Content-Type-Options: nosniff");
  ok(h("strict-transport-security").includes("max-age="), "HSTS presente");
  ok(h("referrer-policy") !== "", "Referrer-Policy presente");
  ok(h("permissions-policy").includes("geolocation=()"), "Permissions-Policy restrictiva");
  ok(!r.headers.has("x-powered-by"), "Sin X-Powered-By");
}

// --- Con sesión (cookie firmada localmente; no cambia nada en la base) --------
const secreto = secretoSesion();
if (!secreto) {
  console.log("(sin SESSION_SECRET: se omiten las pruebas con sesión)");
} else {
  const cookie = cookieFirmada(secreto, Date.now() + 5 * 60 * 1000);
  const conSesion = (ruta, o = {}) =>
    pedir(ruta, { ...o, headers: { cookie, "sec-fetch-site": "same-origin", ...(o.headers || {}) } });

  const vencida = await pedir("/api/animales", { headers: { cookie: cookieFirmada(secreto, Date.now() - 1000) } });
  ok(vencida.status === 401, "Cookie vencida (aunque bien firmada) -> 401", vencida.status);

  const r = await conSesion("/api/animales");
  const lista = await r.json().catch(() => null);
  ok(r.status === 200 && Array.isArray(lista), "Con sesión: listado -> 200", r.status);
  if (Array.isArray(lista) && lista.length) {
    ok(!("fotoUrl" in lista[0]), "Listado no devuelve la foto completa (datos mínimos)");
  }

  const iny = await conSesion("/api/animales?q=" + encodeURIComponent("' OR '1'='1'; DROP TABLE \"Animal\";--"));
  ok(iny.status === 200 && Array.isArray(await iny.json()), "Búsqueda con texto de inyección SQL -> 200 sin error", iny.status);

  const idMalo = await conSesion("/api/animales/" + encodeURIComponent("../../etc/passwd"));
  ok([400, 404].includes(idMalo.status), "Id manipulado en la URL -> 400/404 (no 500)", idMalo.status);

  // Cuerpos inválidos: se rechazan en la validación, antes de escribir.
  const post = (ruta, cuerpo) =>
    conSesion(ruta, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo) });
  const sexo = await post("/api/animales", { arete: "PRUEBA-SEG", sexo: "GATO" });
  ok(sexo.status === 400, "Valor no permitido (sexo) -> 400", sexo.status);
  const largo = await post("/api/animales", { arete: "x".repeat(500), sexo: "MACHO" });
  ok(largo.status === 400, "Texto demasiado largo -> 400", largo.status);
  const malformado = await conSesion("/api/animales", { method: "POST", headers: { "content-type": "application/json" }, body: "{no es json" });
  ok(malformado.status === 400, "JSON malformado -> 400", malformado.status);
  const enorme = await conSesion("/api/animales", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ notas: "x".repeat(300 * 1024) }) });
  ok(enorme.status === 413 || enorme.status === 400, "Cuerpo de más de 100 KB -> rechazado", enorme.status);
  const foto = await conSesion("/api/animales/no-existe", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ fotoUrl: "data:image/svg+xml;base64,PHN2Zy8+" }) });
  ok([400, 404].includes(foto.status), "Foto SVG rechazada", foto.status);
  const texto = await malformado.text().catch(() => "");
  ok(!/prisma|stack|at \w+ \(/i.test(texto), "Los errores no filtran detalles internos");
}

console.log(fallos ? `\n${fallos} prueba(s) fallaron.` : "\nTodas las pruebas pasaron.");
process.exit(fallos ? 1 : 0);
