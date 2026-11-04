"use client";

import { llamarApi } from "@/lib/api-cliente";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
// IconoImprimir se mantiene importado para el botón de imprimir oculto (ver abajo).
import { IconoEditar, IconoImprimir, IconoBasura } from "@/components/iconos";
import { AvisoError, Spinner, claseBoton, claseBotonIcono } from "@/components/ui";
import { confirmar } from "@/components/Dialogos";

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
    const si = await confirmar({
      titulo: `¿Eliminar a ${etiqueta}?`,
      mensaje:
        "Se borrarán también sus eventos (montas, partos, leche, pesos, etapas), las montas donde fue el toro y el parto en que nació (si fue su única cría). Sus crías registradas se conservan, pero quedan sin ese padre/madre.\n\nSi murió o se vendió, mejor cambia su estado en Editar. Esta acción no se puede deshacer.",
      accion: "Eliminar animal",
      peligro: true,
    });
    if (!si) return;

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
      {/* "Editar" es la acción del día a día; "Eliminar" queda aparte y discreto (solo icono, con
          su nombre para lectores de pantalla), para no tocarlo por error con el pulgar. Sigue
          pidiendo confirmación. */}
      <div className="flex items-center gap-3">
        <Link href={`/animales/${animalId}/editar`} className={`${claseBoton("secundario")} flex-1 sm:flex-none`}>
          <IconoEditar className="h-4 w-4 shrink-0" />
          Editar
        </Link>
        {/* Botón de imprimir oculto a petición del dueño (2026-10-13). No se borra por si
            se quiere restaurar: basta con descomentar este bloque y volver la rejilla de arriba
            a `grid-cols-3`. Abre el diálogo de impresión (imprimir o guardar como PDF). */}
        {/* <button type="button" onClick={() => window.print()} className={claseBoton("secundario")}>
          <IconoImprimir className="h-4 w-4 shrink-0" />
          Imprimir
        </button> */}
        <button
          type="button"
          onClick={eliminar}
          disabled={borrando}
          aria-busy={borrando || undefined}
          aria-label={borrando ? "Eliminando…" : `Eliminar a ${etiqueta}`}
          title="Eliminar animal"
          className={claseBotonIcono("peligroDiscreto")}
        >
          {borrando ? <Spinner /> : <IconoBasura className="h-5 w-5" />}
        </button>
      </div>
      {error && <AvisoError className="sm:max-w-md">{error}</AvisoError>}
    </div>
  );
}
