"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { llamarApi } from "@/lib/api-cliente";
import { ESTADOS_REPRO, ESTADO_REPRO_LABEL } from "@/lib/estado";
import { formatearFecha } from "@/lib/fechas";
import { claseCampo, claseBotonPrimario } from "@/components/ui";

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
    router.refresh();
  }

  const etiqueta = (e: string | null) => (e ? ESTADO_REPRO_LABEL[e] ?? e : "Sin estado");
  const campo = claseCampo;

  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-base font-semibold text-stone-800 dark:text-stone-100">
            {etiqueta(estado)}
            {/* Tras parir sigue en ordeño y, pasados 40 días, además lista para montar. */}
            {listaParaMontar && estado !== "LISTA_MONTAR" && (
              <> · {ESTADO_REPRO_LABEL.LISTA_MONTAR}</>
            )}
          </span>
          <span className="ml-2 text-xs text-stone-500 dark:text-stone-400">
            {manual ? "fijado a mano" : "calculado por montas y partos"}
          </span>
        </div>
        {!abierto && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setAbierto(true);
            }}
            className="no-print min-h-11 rounded-lg border border-stone-300 px-3 font-medium text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            Cambiar estado
          </button>
        )}
      </div>

      {abierto && (
        <form
          className="no-print space-y-2 rounded-lg bg-stone-50 p-3 dark:bg-stone-800/60"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            guardar(String(fd.get("estado")), String(fd.get("descripcion") ?? ""));
          }}
        >
          {error && (
            <div role="alert" className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="estado-nuevo" className="block text-xs font-medium text-stone-600 dark:text-stone-400">
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
            <label htmlFor="estado-desc" className="block text-xs font-medium text-stone-600 dark:text-stone-400">
              Motivo / observación (opcional)
            </label>
            <input id="estado-desc" name="descripcion" maxLength={2000} className={campo} />
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            La fecha del cambio se guarda sola. El estado elegido se mantiene hasta que registres una monta
            o un parto; entonces vuelve el cálculo automático.
          </p>
          <div className="flex gap-2">
            <button type="submit" disabled={guardando} className={claseBotonPrimario}>
              {guardando ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="inline-flex min-h-11 items-center rounded-lg border border-stone-300 px-4 text-sm text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-700"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cambios.length > 0 && (
        <div>
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">Cambios manuales</p>
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
