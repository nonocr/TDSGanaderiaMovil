// Frena un commit que intente subir secretos (lo llama .githooks/pre-commit).
// Revisa los archivos PREPARADOS (git add) y bloquea si:
//   - se intenta subir un .env (salvo .env.example) o una llave de firma Android;
//   - el contenido trae algo con forma de secreto (URL de Postgres con contraseña, hash de la
//     clave, SESSION_SECRET, llaves de Supabase/JWT, llaves privadas, etc.).
// Nunca imprime el valor encontrado, solo archivo y línea.
//
// Activarlo (una vez por clon):  git config core.hooksPath .githooks
// Revisar todo el repo a mano:    node scripts/revisar-secretos.mjs --todo
import { execFileSync } from "node:child_process";

const ARCHIVO_PROHIBIDO = /(^|\/)\.env(?!\.example$)(\..*)?$|\.(jks|keystore|p12|pem|key)$|(^|\/)keystore\.properties$/i;

const PATRONES = [
  ["URL de base de datos con contraseña", /postgres(ql)?:\/\/[^:\s/]+:(?![[<]|TU_)[^@\s"]{6,}@/], // ignora ejemplos: [YOUR-PASSWORD], <clave>, TU_PASSWORD
  ["APP_PASSWORD_HASH real", /APP_PASSWORD_HASH\s*=\s*"?scrypt\.\d/],
  ["SESSION_SECRET real", /SESSION_SECRET\s*=\s*"?[A-Za-z0-9_\-+/]{20,}/],
  ["JWT / llave de Supabase", /eyJhbGciOi[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ["Llave secreta de Supabase", /sb_secret_[A-Za-z0-9_-]{10,}/],
  ["Llave privada", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["Llave de AWS", /AKIA[0-9A-Z]{16}/],
  ["Token de GitHub", /gh[pousr]_[A-Za-z0-9]{30,}/],
  ["Contraseña de firma Android", /(storePassword|keyPassword)\s*[=:]\s*\S+/],
];

const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

const todo = process.argv.includes("--todo");
const archivos = (todo ? git("ls-files") : git("diff", "--cached", "--name-only", "--diff-filter=ACMR"))
  .split("\n")
  .filter(Boolean);

const problemas = [];
for (const archivo of archivos) {
  if (ARCHIVO_PROHIBIDO.test(archivo)) {
    problemas.push(`${archivo}: este tipo de archivo no debe subirse al repositorio`);
    continue;
  }
  let contenido;
  try {
    contenido = todo ? git("show", `HEAD:${archivo}`) : git("show", `:${archivo}`);
  } catch {
    continue;
  }
  if (contenido.includes("\u0000")) continue; // binario
  contenido.split("\n").forEach((linea, i) => {
    for (const [nombre, re] of PATRONES) {
      if (re.test(linea)) problemas.push(`${archivo}:${i + 1}: posible ${nombre}`);
    }
  });
}

if (problemas.length) {
  console.error("Se encontraron posibles secretos (no se muestra el valor):\n  " + problemas.join("\n  "));
  console.error("\nQuítalos (van en .env o en las variables de Vercel). Si es un falso positivo: git commit --no-verify");
  process.exit(1);
}
if (todo) console.log(`Sin secretos en ${archivos.length} archivos versionados.`);
