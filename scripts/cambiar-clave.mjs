// Define (o cambia) la contraseña para entrar a la app.
// Guarda en .env solo el hash (scrypt) en APP_PASSWORD_HASH, nunca la contraseña.
// También genera un SESSION_SECRET nuevo: al cambiar la contraseña se cierran todas las sesiones.
//
// Uso:  npm.cmd run clave              (pide la contraseña dos veces)
//       npm.cmd run clave -- --generar (crea una contraseña aleatoria y la muestra)
import { randomBytes, scryptSync } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import readline from "node:readline";

const ARCHIVO_ENV = ".env";
const MINIMO = 10;

function preguntarOculto(pregunta) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      if (s.includes(pregunta)) rl.output.write(s);
    };
    rl.question(pregunta, (r) => {
      rl.close();
      process.stdout.write("\n");
      resolve(r);
    });
  });
}

function fijar(contenido, nombre, valor) {
  const linea = `${nombre}="${valor}"`;
  const re = new RegExp(`^${nombre}=.*$`, "m");
  return re.test(contenido) ? contenido.replace(re, linea) : contenido.replace(/\n*$/, "\n") + linea + "\n";
}

async function main() {
  let clave;
  if (process.argv.includes("--generar")) {
    clave = randomBytes(12).toString("base64url");
  } else {
    clave = await preguntarOculto(`Nueva contraseña (mínimo ${MINIMO} caracteres): `);
    const repetida = await preguntarOculto("Repite la contraseña: ");
    if (clave !== repetida) throw new Error("Las contraseñas no coinciden.");
  }
  if (clave.length < MINIMO) throw new Error(`La contraseña debe tener al menos ${MINIMO} caracteres.`);

  const N = 16384, r = 8, p = 1;
  const sal = randomBytes(16);
  const hash = scryptSync(clave, sal, 32, { N, r, p });
  const valorHash = ["scrypt", N, r, p, sal.toString("base64url"), hash.toString("base64url")].join(".");

  let env = existsSync(ARCHIVO_ENV) ? readFileSync(ARCHIVO_ENV, "utf8") : "";
  env = fijar(env, "APP_PASSWORD_HASH", valorHash);
  env = fijar(env, "SESSION_SECRET", randomBytes(32).toString("base64url"));
  writeFileSync(ARCHIVO_ENV, env, "utf8");

  console.log("Contraseña guardada en .env (solo el hash). Reinicia la app para aplicarla.");
  if (process.argv.includes("--generar")) console.log(`Contraseña generada: ${clave}`);
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
