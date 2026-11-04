"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ETAPA_LABEL } from "@/lib/tipos";
import { llamarApi } from "@/lib/api-cliente";
import { IconoEditar, IconoBasura } from "@/components/iconos";
import { AvisoError, BotonEnviar, Spinner, claseBoton, claseBotonIcono, claseCampo, claseEtiqueta } from "@/components/ui";
import { avisar, confirmar } from "@/components/Dialogos";

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
    const si = await confirmar({
      titulo: `¿Eliminar el registro de la etapa “${nombre}”?`,
      mensaje: "Se borrará de forma permanente y no se puede deshacer.",
      accion: "Eliminar",
      peligro: true,
    });
    if (!si) return;
    setBorrando(true);
    const r = await llamarApi(`/api/etapas/${etapaId}`, { method: "DELETE" });
    setBorrando(false);
    if (!r.ok) {
      avisar(r.error);
      return;
    }
    avisar("Registro de etapa eliminado.", "ok");
    router.refresh();
  }

  const campo = claseCampo;
  const etiqueta = claseEtiqueta;

  if (editando) {
    return (
      <form onSubmit={guardar} className="mt-2 space-y-3 rounded-xl bg-stone-50 p-3 ring-1 ring-inset ring-stone-900/5 dark:bg-stone-800/60 dark:ring-white/5">
        {error && <AvisoError>{error}</AvisoError>}
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
          <BotonEnviar cargando={guardando}>Guardar</BotonEnviar>
          <button type="button" onClick={() => setEditando(false)} className={claseBoton("secundario")}>
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
        className={claseBotonIcono("marcaDiscreto")}
      >
        <IconoEditar className="h-4 w-4" />
      </button>
      <button
        onClick={eliminar}
        disabled={borrando}
        aria-label="Eliminar etapa"
        aria-busy={borrando || undefined}
        title="Eliminar"
        className={claseBotonIcono("peligroDiscreto")}
      >
        {borrando ? <Spinner /> : <IconoBasura className="h-4 w-4" />}
      </button>
    </div>
  );
}

