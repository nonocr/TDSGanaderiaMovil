"use client";

import { useCallback, useRef, useState } from "react";
import { FilaEvento, type DatosFila } from "./FilaEvento";
import { IconoHistorial, IconoCerrar } from "@/components/iconos";
import { useModalAccesible } from "@/lib/usar-modal";
import { usePresencia } from "@/lib/usar-presencia";
import { claseBoton, claseBotonIcono } from "@/components/ui";

type Opcion = { id: string; arete: string; nombre: string | null; sinArete?: boolean | null; areteCenasa?: string | null };

// Cuántos registros se muestran antes de pedir "Ver todo".
const LIMITE_VISIBLE = 5;

export function HistorialEventos({
  eventos,
  toros,
  posiblesCrias,
}: {
  eventos: DatosFila[];
  toros: Opcion[];
  posiblesCrias: Opcion[]; // animales que se pueden agregar como cría al editar un parto
}) {
  const [ampliado, setAmpliado] = useState(false);
  const botonAbrir = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Accesibilidad del modal: atrapa el foco, cierra con Escape, bloquea el scroll del fondo y
  // devuelve el foco a "Ver todo" al cerrar (ver src/lib/usar-modal.ts).
  const cerrar = useCallback(() => setAmpliado(false), []);
  useModalAccesible(ampliado, panel, cerrar);
  const modal = usePresencia(ampliado, 150);

  if (eventos.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-stone-500 dark:text-stone-400">
        Sin eventos registrados todavía. Se agregan desde la pestaña Registrar.
      </p>
    );
  }

  const hayMas = eventos.length > LIMITE_VISIBLE;
  const visibles = hayMas ? eventos.slice(0, LIMITE_VISIBLE) : eventos;

  const lista = (items: DatosFila[]) => (
    <ul className="divide-y divide-stone-100 text-sm dark:divide-stone-800">
      {items.map((e, i) => (
        <FilaEvento key={e.id ?? `n-${i}`} toros={toros} posiblesCrias={posiblesCrias} datos={e} />
      ))}
    </ul>
  );

  // Lista para el modal: tarjetas con icono y botones amigables, sin divisores.
  const listaAmpliada = (items: DatosFila[]) => (
    <ul className="space-y-2">
      {items.map((e, i) => (
        <FilaEvento key={e.id ?? `n-${i}`} toros={toros} posiblesCrias={posiblesCrias} datos={e} variante="ampliada" />
      ))}
    </ul>
  );

  return (
    <>
      {/* En pantalla: vista corta (5) + botón "ver todo". No se imprime. */}
      <div className="no-print">
        {lista(visibles)}

        {hayMas && (
          <button
            ref={botonAbrir}
            type="button"
            onClick={() => setAmpliado(true)}
            className={`${claseBoton("secundario")} mt-3 w-full`}
          >
            Ver todo el historial ({eventos.length} registros)
          </button>
        )}
      </div>

      {/* Al imprimir: TODOS los registros, sin botón ni modal. */}
      <div className="hidden print:block">{lista(eventos)}</div>

      {/* Modal ampliado: pantalla casi completa con scroll. */}
      {modal.montado && (
        <div
          className="fixed inset-0 z-50 flex flex-col p-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-historial"
        >
          {/* Fondo oscuro */}
          <div
            className="t-fondo absolute inset-0 bg-stone-950/50"
            data-estado={modal.estado}
            onClick={() => setAmpliado(false)}
          />
          {/* Panel */}
          <div
            ref={panel}
            data-estado={modal.estado}
            className="t-modal relative z-10 mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-hidden rounded-3xl bg-stone-50 shadow-flotante ring-1 ring-stone-900/5 dark:bg-stone-950 dark:ring-white/10"
          >
            {/* Encabezado */}
            <div className="flex items-center justify-between gap-3 bg-white px-4 py-3 shadow-[0_1px_0_rgb(28_25_23/0.07)] sm:px-5 sm:py-4 dark:bg-stone-900 dark:shadow-[0_1px_0_rgb(255_255_255/0.07)]">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-marca-100 text-marca-700 dark:bg-marca-950 dark:text-marca-300">
                  <IconoHistorial className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 id="titulo-historial" className="text-base font-semibold text-stone-900 dark:text-stone-50">
                    Historial completo
                  </h3>
                  <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                    {eventos.length} registros · del más reciente al más antiguo
                  </p>
                </div>
              </div>
              <button type="button" onClick={cerrar} aria-label="Cerrar historial" className={claseBotonIcono("discreto")}>
                <IconoCerrar className="h-5 w-5" />
              </button>
            </div>
            {/* Área desplazable con todos los eventos. */}
            <div className="min-h-0 flex-1 overflow-auto overscroll-contain p-3 sm:p-4">
              {listaAmpliada(eventos)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
