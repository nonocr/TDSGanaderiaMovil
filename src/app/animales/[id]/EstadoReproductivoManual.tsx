"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { llamarApi } from "@/lib/api-cliente";
import { ESTADOS_REPRO, ESTADO_REPRO_LABEL } from "@/lib/estado";
import { formatearFecha } from "@/lib/fechas";
import { avisar } from "@/components/Dialogos";
import { AvisoError, Badge, BotonEnviar, TONO_REPRO, claseBoton, claseCampo, claseEtiqueta } from "@/components/ui";

// Estado reproductivo de una vaca de lechería: el actual (automático o manual), un formulario para
// cambiarlo a mano con descripción opcional, y el historial de cambios manuales.
// Los tiempos del ciclo no cambian: el estado manual manda hasta que se registre una monta o un
// parto después del cambio, y luego vuelve el cálculo automático (o con "Volver a automático").
export function EstadoReproductivoManual({
  vacaId,
  estado,
  manual,
  listaParaMontar = false,
  cambios,
}: {
  vacaId: string;
  estado: string | null;
  manual: boolean;
  // Tras parir la vaca está "En ordeño" y, pasados 40 días, además "Lista para montar".
  listaParaMontar?: boolean;
  cambios: { id: string; fechaISO: string; anterior: string | null; nuevo: string | null; descripcion: string | null }[];
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(nuevo: string, descripcion: string) {
    setError(null);
    setGuardando(true);
    const r = await llamarApi("/api/estado-reproductivo", {
      method: "POST",
      body: { vacaId, estado: nuevo, descripcion },
    });
    setGuardando(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setAbierto(false);
    avisar(nuevo === "AUTOMATICO" ? "El estado vuelve al cálculo automático." : "Estado reproductivo actualizado.", "ok");
    router.refresh();
  }

  const etiqueta = (e: string | null) => (e ? ESTADO_REPRO_LABEL[e] ?? e : "Sin estado");
  const campo = claseCampo;

  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tono={TONO_REPRO[estado ?? ""] ?? "neutral"} punto>
              {etiqueta(estado)}
            </Badge>
            {/* Tras parir sigue en ordeño y, pasados 40 días, además lista para montar. */}
            {listaParaMontar && estado !== "LISTA_MONTAR" && (
              <Badge tono="verde" punto>
                {ESTADO_REPRO_LABEL.LISTA_MONTAR}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {manual ? "Fijado a mano" : "Calculado por montas y partos"}
          </p>
        </div>
        {!abierto && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setAbierto(true);
            }}
            className={`${claseBoton("secundario")} no-print`}
          >
            Cambiar estado
          </button>
        )}
      </div>

      {abierto && (
        <form
          className="no-print space-y-3 rounded-xl bg-stone-50 p-3 ring-1 ring-inset ring-stone-900/5 dark:bg-stone-800/60 dark:ring-white/5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            guardar(String(fd.get("estado")), String(fd.get("descripcion") ?? ""));
          }}
        >
          {error && <AvisoError>{error}</AvisoError>}
          <div>
            <label htmlFor="estado-nuevo" className={claseEtiqueta}>
              Nuevo estado
            </label>
            <select id="estado-nuevo" name="estado" required defaultValue="" className={campo}>
              <option value="" disabled>— Elegir —</option>
              {ESTADOS_REPRO.map((e) => (
                <option key={e} value={e}>{ESTADO_REPRO_LABEL[e]}</option>
              ))}
              {manual && <option value="AUTOMATICO">Volver al cálculo automático</option>}
            </select>
          </div>
          <div>
            <label htmlFor="estado-desc" className={claseEtiqueta}>
              Motivo / observación (opcional)
            </label>
            <input id="estado-desc" name="descripcion" maxLength={2000} className={campo} />
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            La fecha del cambio se guarda sola. El estado elegido se mantiene hasta que registres una monta
            o un parto; entonces vuelve el cálculo automático.
          </p>
          <div className="flex gap-2">
            <BotonEnviar cargando={guardando}>Guardar</BotonEnviar>
            <button type="button" onClick={() => setAbierto(false)} className={claseBoton("secundario")}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cambios.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300">Cambios manuales</h3>
          <ul className="mt-1 divide-y divide-stone-100 dark:divide-stone-800">
            {cambios.map((c) => (
              <li key={c.id} className="py-1.5">
                <span className="text-stone-700 dark:text-stone-200">
                  {etiqueta(c.anterior)} → {c.nuevo ? etiqueta(c.nuevo) : "Automático"}
                </span>
                <span className="ml-2 text-xs text-stone-500 dark:text-stone-400">{formatearFecha(c.fechaISO)}</span>
                {c.descripcion && <p className="text-xs text-stone-500 dark:text-stone-400">{c.descripcion}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
