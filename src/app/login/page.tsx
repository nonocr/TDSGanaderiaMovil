import Image from "next/image";
import { FormularioLogin } from "./FormularioLogin";

export const metadata = { title: "Iniciar sesión · TDS Ganadería" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ volver?: string }>;
}) {
  const { volver } = await searchParams;
  // Solo rutas internas ("/algo"), nunca "//otro-sitio" ni URLs completas.
  const destino = volver && /^\/(?![/\\])/.test(volver) ? volver : "/";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-stone-900 px-4">
      {/* Imagen de fondo que cubre toda la pantalla */}
      <Image
        src="/fondoTDS.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Capa oscura semitransparente para que la tarjeta y el texto se lean bien */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-xl dark:border-stone-800 dark:bg-stone-900">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Image
            src="/logo.png"
            alt="TDS Ganadería"
            width={64}
            height={64}
            className="h-16 w-16 rounded-full bg-white object-contain ring-1 ring-stone-200 dark:ring-stone-700"
            priority
          />
          <div>
            <h1 className="text-lg font-bold text-stone-800 dark:text-stone-100">Finca Tierra de Sueños</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">Ingresa la contraseña para continuar</p>
          </div>
        </div>
        <FormularioLogin destino={destino} />
      </div>
    </div>
  );
}
