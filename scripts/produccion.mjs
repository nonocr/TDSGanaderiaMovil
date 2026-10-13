// Compila o sirve la app "en uso" desde su propia carpeta (.next-produccion).
// Así los `npm run dev` / `npm run build` de desarrollo (que usan .next) no la tumban.
//
// Uso:  npm.cmd run prod:build   -> compila la versión en uso
//       npm.cmd run prod:start   -> la sirve en el puerto 3000 (también en la red local)
//       npm.cmd run prod         -> compila y luego sirve
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const next = path.join(raiz, "node_modules", "next", "dist", "bin", "next");
const env = { ...process.env, NEXT_DIST_DIR: ".next-produccion" };

function correr(args) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [next, ...args], { cwd: raiz, env, stdio: "inherit" });
    p.on("exit", (codigo) => (codigo === 0 ? resolve() : reject(new Error(`next ${args[0]} terminó con código ${codigo}`))));
  });
}

const accion = process.argv[2];
try {
  if (accion === "build" || accion === "todo") await correr(["build"]);
  if (accion === "start" || accion === "todo") await correr(["start", "-H", "0.0.0.0", "-p", process.env.PORT ?? "3000"]);
  if (!["build", "start", "todo"].includes(accion)) {
    console.error("Uso: node scripts/produccion.mjs build|start|todo");
    process.exit(1);
  }
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
