// Genera el APK de prueba (debug): `npm run apk` desde la carpeta movil/.
// Si JAVA_HOME / ANDROID_HOME no están definidas, usa el Java y el SDK que instala Android Studio.
import { execSync } from "node:child_process";
import { existsSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const env = { ...process.env };

if (!env.JAVA_HOME) {
  const candidatos = [
    "C:\\Program Files\\Android\\Android Studio\\jbr",
    join(env.LOCALAPPDATA ?? "", "Programs", "Android Studio", "jbr"),
  ];
  const jbr = candidatos.find((d) => existsSync(join(d, "bin", "java.exe")));
  if (!jbr) {
    console.error("No encontré Java. Instala Android Studio o define JAVA_HOME.");
    process.exit(1);
  }
  env.JAVA_HOME = jbr;
}
if (!env.ANDROID_HOME) {
  const sdk = join(env.LOCALAPPDATA ?? "", "Android", "Sdk");
  if (existsSync(sdk)) env.ANDROID_HOME = sdk;
}

const correr = (cmd, cwd) => execSync(cmd, { stdio: "inherit", env, cwd });
correr("npx cap sync android");
correr(".\\gradlew.bat assembleDebug", "android");

const apk = join("android", "app", "build", "outputs", "apk", "debug", "app-debug.apk");
copyFileSync(apk, "TDS-Ganaderia.apk");
console.log("\nListo: movil\\TDS-Ganaderia.apk (pásalo al teléfono e instálalo).");
