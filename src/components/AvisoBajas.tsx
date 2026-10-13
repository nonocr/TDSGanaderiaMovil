import Link from "next/link";

// "Hay N dados de baja (vendidos o muertos), no contados arriba", con enlace a su lista.
// Recibe la PROMESA del número: así la página no espera el conteo antes de empezar la lista
// (las dos consultas van en paralelo) y la página sigue apareciendo entera de una vez.
export async function AvisoBajas({
  cantidad,
  href,
  femenino = false,
  donde = "arriba",
}: {
  cantidad: Promise<number>;
  href: string;
  femenino?: boolean; // "vacas dadas de baja" en vez de "animales dados de baja"
  donde?: string; // "arriba" / "aquí"
}) {
  const n = await cantidad;
  if (n === 0) return null;
  const nombre = femenino
    ? n === 1 ? "vaca dada de baja" : "vacas dadas de baja"
    : n === 1 ? "animal dado de baja" : "animales dados de baja";
  return (
    <p className="text-sm text-stone-500 dark:text-stone-400">
      Hay{" "}
      <Link href={href} className="font-medium text-marca-700 hover:underline dark:text-marca-400">
        {n} {nombre}
      </Link>{" "}
      {femenino ? "(vendidas o muertas), no contadas" : "(vendidos o muertos), no contados"} {donde}.
    </p>
  );
}
