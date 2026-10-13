// Cookie de sesión firmada con HMAC-SHA256. Usa Web Crypto para funcionar también
// en el middleware (runtime Edge). Formato del valor: "<expira_ms>.<firma_base64url>".

export const COOKIE_SESION = "tds_sesion";
// "Mantener la sesión iniciada": 1 año. Sin marcarla: la cookie se borra al cerrar el
// navegador y, por si no lo hace, la sesión caduca igual a las 12 horas.
export const DURACION_RECORDAR_S = 365 * 24 * 60 * 60;
export const DURACION_SIN_RECORDAR_S = 12 * 60 * 60;

function secreto(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("Falta SESSION_SECRET (mínimo 32 caracteres) en .env. Corre: npm run clave");
  }
  return s;
}

function aBase64Url(buf: ArrayBuffer): string {
  let bin = "";
  for (const b of new Uint8Array(buf)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// La clave HMAC se prepara una sola vez y se reutiliza en cada petición.
let claveHmac: Promise<CryptoKey> | null = null;

async function firmar(mensaje: string): Promise<string> {
  claveHmac ??= crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return aBase64Url(await crypto.subtle.sign("HMAC", await claveHmac, new TextEncoder().encode(mensaje)));
}

// Comparación en tiempo constante.
function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function crearSesion(duracionS: number): Promise<string> {
  const expira = String(Date.now() + duracionS * 1000);
  return `${expira}.${await firmar(expira)}`;
}

export async function sesionValida(valor: string | undefined): Promise<boolean> {
  if (!valor) return false;
  const [expira, firma] = valor.split(".");
  if (!expira || !firma || !/^\d+$/.test(expira)) return false;
  if (Number(expira) < Date.now()) return false;
  return iguales(firma, await firmar(expira));
}
