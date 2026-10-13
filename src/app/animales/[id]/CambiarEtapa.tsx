"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ETAPAS_ORDEN, ETAPA_LABEL } from "@/lib/tipos";
import { hoyLocalISO } from "@/lib/fechas";
import { llamarApi } from "@/lib/api-cliente";

// Control para cambiar la ETAPA ACTUAL de un animal de engorde.
// Al elegir una etapa, el backend cierra la etapa abierta anterior (fechaFin = hoy)
// y abre la nueva (fechaInicio = hoy). Las fechas quedan editables luego en el historial.
export function CambiarEtapa({
  animalId,
  etapaActual,
}: {
  animalId: string;
  etapaActual: string | null;
}) {
  const router = useRouter();
  const [guardando, setGuardando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cambiar(etapa: string) {
    if (etapa === etapaActual) return; // ya está en esa etapa
    setError(null);
    setGuardando(etapa);
    const r = await llamarApi("/api/etapas/cambiar", {
      method: "POST",
      body: { animalId, etapa, fecha: hoyLocalISO() },
    });
    setGuardando(null);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {ETAPAS_ORDEN.map((etapa) => {
          const activa = etapa === etapaActual;
          return (
            <button
              key={etapa}
              type="button"
              onClick={() => cambiar(etapa)}
              disabled={guardando !== null || activa}
              aria-pressed={activa}
              className={
                "min-h-11 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 " +
                (activa
                  ? "border-marca-600 bg-marca-600 text-white shadow-sm"
                  : "border-stone-300 bg-white text-stone-700 hover:border-marca-300 hover:bg-marca-50/40 active:bg-marca-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:border-marca-700 dark:hover:bg-stone-700")
              }
            >
              {guardando === etapa ? "Cambiando…" : ETAPA_LABEL[etapa] ?? etapa}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-stone-500 dark:text-stone-400">
        {etapaActual
          ? `Etapa actual: ${ETAPA_LABEL[etapaActual] ?? etapaActual}. Al cambiarla se cierra la anterior con la fecha de hoy y empieza la nueva hoy.`
          : "Este animal aún no tiene etapa. Elige una para empezar; se registrará con la fecha de hoy."}
      </p>
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
