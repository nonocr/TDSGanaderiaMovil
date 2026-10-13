"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ETAPA_LABEL } from "@/lib/tipos";
import { llamarApi } from "@/lib/api-cliente";
import { IconoEditar, IconoBasura } from "@/components/iconos";

// Acciones por etapa: editar (sobre todo para agregar/cambiar la fecha de fin) y eliminar.
export function AccionesEtapa({
  etapaId,
  etapaActual,
  fechaInicio,
  fechaFin,
  notas,
}: {
  etapaId: string;
  etapaActual: string;
  fechaInicio: string; // yyyy-mm-dd
  fechaFin: string | null; // yyyy-mm-dd o null
  notas: string | null;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    const fd = new FormData(e.currentTarget);
    const r = await llamarApi(`/api/etapas/${etapaId}`, {
      method: "PUT",
      body: {
        etapa: etapaActual,
        fechaInicio: fd.get("fechaInicio"),
        fechaFin: fd.get("fechaFin") || null,
        notas: fd.get("notas"),
      },
    });
    setGuardando(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setEditando(false);
    router.refresh();
  }

  async function eliminar() {
    const nombre = ETAPA_LABEL[etapaActual] ?? etapaActual;
    if (
      !confirm(
        `¿Eliminar el registro de la etapa “${nombre}”?\n\n` +
          `Se borrará de forma permanente y no se puede deshacer.`
      )
    )
      return;
    setBorrando(true);
    const r = await llamarApi(`/api/etapas/${etapaId}`, { method: "DELETE" });
    setBorrando(false);
    if (!r.ok) {
      alert(r.error);
      return;
    }
    router.refresh();
  }

  const campo = "mt-1 w-full rounded border border-stone-300 px-2 py-1 text-sm dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100";
  const etiqueta = "block text-xs font-medium text-stone-600 dark:text-stone-400";

  if (editando) {
    return (
      <form onSubmit={guardar} className="mt-2 space-y-2 rounded bg-stone-50 p-2 dark:bg-stone-800/60">
        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-2">
          <div>
            <label htmlFor={`etapa-inicio-${etapaId}`} className={etiqueta}>Inicio</label>
            <input id={`etapa-inicio-${etapaId}`} type="date" name="fechaInicio" required defaultValue={fechaInicio} className={campo} />
          </div>
          <div>
            <label htmlFor={`etapa-fin-${etapaId}`} className={etiqueta}>Fin</label>
            <input id={`etapa-fin-${etapaId}`} type="date" name="fechaFin" defaultValue={fechaFin ?? ""} className={campo} />
          </div>
        </div>
        <input name="notas" aria-label="Notas" maxLength={2000} placeholder="Notas (opcional)" defaultValue={notas ?? ""} className={campo} />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={guardando}
            className="rounded-lg bg-marca-700 px-4 py-2 text-sm font-medium text-white hover:bg-marca-800 disabled:opacity-50"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-700"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        onClick={() => setEditando(true)}
        aria-label="Editar etapa"
        title="Editar"
        className="grid h-11 w-11 place-items-center rounded-lg text-marca-700 transition-colors hover:bg-marca-50 active:bg-marca-100 dark:text-marca-400 dark:hover:bg-stone-800"
      >
        <IconoEditar className="h-4 w-4" />
      </button>
      <button
        onClick={eliminar}
        disabled={borrando}
        aria-label="Eliminar etapa"
        title="Eliminar"
        className="grid h-11 w-11 place-items-center rounded-lg text-red-600 transition-colors hover:bg-red-50 active:bg-red-100 disabled:opacity-50 dark:text-red-400 dark:hover:bg-stone-800"
      >
        {borrando ? <span className="text-xs">…</span> : <IconoBasura className="h-4 w-4" />}
      </button>
    </div>
  );
}

