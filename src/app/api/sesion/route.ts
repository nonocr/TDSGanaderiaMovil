import { NextRequest, NextResponse } from "next/server";
import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import {
  COOKIE_SESION, DURACION_RECORDAR_S, DURACION_SIN_RECORDAR_S, crearSesion,
} from "@/lib/sesion";
import { prisma } from "@/lib/prisma";
import { ruta, leerJson, ErrorValidacion, KB } from "@/lib/validar";

const scryptAsync = promisify(scrypt) as (
  clave: string, sal: Buffer, largo: number, opciones: { N: number; r: number; p: number }
) => Promise<Buffer>;

// Bloqueo por intentos fallidos, por IP. Se guarda en la base (tabla IntentoLogin) para que
// valga en todas las instancias del servidor (en Vercel no se comparte la memoria).
// 10 y no 5: varias personas entran desde el mismo Wi-Fi de la finca (misma IP) y los
// errores de todas cuentan juntos.
const MAX_INTENTOS = 10;
const BLOQUEO_MS = 15 * 60 * 1000;

function ipDe(req: NextRequest): string {
  // En Vercel, x-real-ip la pone el propio Vercel (x-forwarded-for la puede enviar el cliente).
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "local"
  ).slice(0, 64);
}

// APP_PASSWORD_HASH = "scrypt.<N>.<r>.<p>.<sal_b64url>.<hash_b64url>" (lo genera `npm run clave`).
async function claveCorrecta(clave: string): Promise<boolean> {
  const guardado = process.env.APP_PASSWORD_HASH ?? "";
  const [alg, N, r, p, sal, hash] = guardado.split(".");
  if (alg !== "scrypt" || !sal || !hash) {
    throw new Error("Falta APP_PASSWORD_HASH en .env. Corre: npm run clave");
  }
  const esperado = Buffer.from(hash, "base64url");
  const calculado = await scryptAsync(clave, Buffer.from(sal, "base64url"), esperado.length, {
    N: Number(N), r: Number(r), p: Number(p),
  });
  return timingSafeEqual(calculado, esperado);
}

// POST /api/sesion -> iniciar sesión con la contraseña de la app.
export const POST = ruta(async (req: NextRequest) => {
  const ip = ipDe(req);
  const estado = await prisma.intentoLogin.findUnique({ where: { ip } });
  if (estado?.hasta && estado.hasta.getTime() > Date.now()) {
    throw new ErrorValidacion("Demasiados intentos. Espera 15 minutos e intenta de nuevo.", 429);
  }

  const body = await leerJson(req, 2 * KB);
  const clave = typeof body.clave === "string" ? body.clave : "";

  if (!clave || !(await claveCorrecta(clave))) {
    // Suma el fallo en la base (atómico); al llegar al máximo, bloquea y reinicia la cuenta.
    const { fallos } = await prisma.intentoLogin.upsert({
      where: { ip },
      create: { ip, fallos: 1 },
      update: { fallos: { increment: 1 } },
    });
    if (fallos >= MAX_INTENTOS) {
      await prisma.intentoLogin.update({
        where: { ip },
        data: { fallos: 0, hasta: new Date(Date.now() + BLOQUEO_MS) },
      });
    }
    // Pausa para frenar ataques de fuerza bruta.
    await new Promise((r) => setTimeout(r, 600));
    throw new ErrorValidacion("Contraseña incorrecta.", 401);
  }

  // Limpia los fallos de esta IP y, de paso, los bloqueos ya vencidos de otras (si no, se acumulan).
  await prisma.intentoLogin.deleteMany({ where: { OR: [{ ip }, { hasta: { lt: new Date() } }] } });
  // Por defecto se recuerda; solo `recordar: false` da una sesión corta.
  const recordar = body.recordar !== false;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(
    COOKIE_SESION,
    await crearSesion(recordar ? DURACION_RECORDAR_S : DURACION_SIN_RECORDAR_S),
    {
      httpOnly: true,
      // Lax (no Strict): con Strict el navegador no manda la cookie al abrir la app desde un
      // enlace de otra app/web (WhatsApp, correo…) y pediría la contraseña cada vez.
      // El CSRF lo frena el middleware (Sec-Fetch-Site / Origin), no esta cookie.
      sameSite: "lax",
      // Solo-HTTPS cuando la app se sirve por HTTPS (en la red local suele ser HTTP).
      secure:
        req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https",
      path: "/",
      // Sin maxAge = cookie de sesión del navegador (se borra al cerrarlo).
      ...(recordar ? { maxAge: DURACION_RECORDAR_S } : {}),
    }
  );
  return res;
});

// DELETE /api/sesion -> cerrar sesión.
export const DELETE = ruta(async () => {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_SESION);
  return res;
});
