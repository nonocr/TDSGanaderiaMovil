"use client";

import { llamarApi } from "@/lib/api-cliente";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
// IconoImprimir se mantiene importado para el botón de imprimir oculto (ver abajo).
import { IconoEditar, IconoImprimir, IconoBasura } from "@/components/iconos";

const BOTON =
  "inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-xl border px-2 text-sm font-medium transition-colors disabled:opacity-50 sm:gap-1.5 sm:px-3";
const NEUTRO =
  "border-stone-300 bg-white text-stone-700 hover:bg-stone-50 active:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700";

// Acciones de la ficha: Editar, Imprimir (o guardar en PDF) y Eliminar.
export function AccionesAnimal({
  animalId,
  etiqueta,
}: {
  animalId: string;
  etiqueta: string; // texto para el mensaje de confirmacion, p.ej. "Chispa (#020)"
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [borrando, setBorrando] = useState(false);

  async function eliminar() {
    if (
      !confirm(
        `¿Eliminar a ${etiqueta}? Se borrarán también sus eventos (montas, partos, leche, pesos, etapas). Esta acción no se puede deshacer.`
      )
    )
      return;

    setError(null);
    setBorrando(true);
    const r = await llamarApi(`/api/animales/${animalId}`, { method: "DELETE" });
    setBorrando(false);

    if (!r.ok) {
      setError(r.error);
      return;
    }
    router.push("/animales");
    router.refresh();
  }

  return (
    <div className="no-print flex w-full flex-col gap-2 sm:w-auto sm:items-end">
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Link href={`/animales/${animalId}/editar`} className={`${BOTON} ${NEUTRO}`}>
          <IconoEditar className="h-4 w-4 shrink-0" />
          Editar
        </Link>
        {/* Botón de imprimir oculto a petición del dueño (2026-10-13). No se borra por si
            se quiere restaurar: basta con descomentar este bloque y volver la rejilla de arriba
            a `grid-cols-3`. Abre el diálogo de impresión (imprimir o guardar como PDF). */}
        {/* <button type="button" onClick={() => window.print()} className={`${BOTON} ${NEUTRO}`}>
          <IconoImprimir className="h-4 w-4 shrink-0" />
          Imprimir
        </button> */}
        <button
          type="button"
          onClick={eliminar}
          disabled={borrando}
          className={`${BOTON} border-red-200 bg-white text-red-700 hover:bg-red-50 active:bg-red-100 dark:border-red-900 dark:bg-stone-800 dark:text-red-300 dark:hover:bg-stone-700`}
        >
          <IconoBasura className="h-4 w-4 shrink-0" />
          {borrando ? "…" : "Eliminar"}
        </button>
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:max-w-md dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
