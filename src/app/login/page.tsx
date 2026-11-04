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
      {/* Imagen de fondo que cubre toda la pantalla. */}
      <Image
        src="/FondoTDS2.jpeg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Capa oscura suave: lo justo para que la tarjeta y el texto se lean sin tapar la foto. */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/45"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-flotante ring-1 ring-black/5 sm:p-7 dark:bg-stone-900 dark:ring-white/10">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Image
            src="/logo.png"
            alt="TDS Ganadería"
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-full bg-white object-contain shadow-card ring-1 ring-black/5"
            priority
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50">Finca Tierra de Sueños</h1>
            <p className="mt-0.5 text-sm font-medium text-marca-700 dark:text-marca-400">Ganadería</p>
          </div>
        </div>
        <FormularioLogin destino={destino} />
      </div>
    </div>
  );
}
