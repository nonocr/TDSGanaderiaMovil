"use client";

import { useEffect, useRef, useState } from "react";
import { FilaEvento, type DatosFila } from "./FilaEvento";
import { IconoHistorial, IconoCerrar } from "@/components/iconos";

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
  const botonCerrar = useRef<HTMLButtonElement>(null);

  // Cerrar con Escape y bloquear el scroll del fondo mientras el modal está abierto.
  // Accesibilidad: al abrir, el foco va a "Cerrar"; al cerrar, vuelve a "Ver todo".
  useEffect(() => {
    if (!ampliado) return;
    botonCerrar.current?.focus();
    const abridor = botonAbrir.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAmpliado(false);
    };
    window.addEventListener("keydown", onKey);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowPrevio;
      abridor?.focus();
    };
  }, [ampliado]);

  if (eventos.length === 0) {
    return (
      <p className="text-sm text-stone-500 dark:text-stone-400">
        Sin eventos registrados todavía.
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
            className="mt-3 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:border-marca-300 hover:text-marca-700 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-300 dark:hover:border-marca-700 dark:hover:text-marca-300"
          >
            Ver todo el historial ({eventos.length} registros)
          </button>
        )}
      </div>

      {/* Al imprimir: TODOS los registros, sin botón ni modal. */}
      <div className="hidden print:block">{lista(eventos)}</div>

      {/* Modal ampliado: pantalla casi completa con scroll. */}
      {ampliado && (
        <div
          className="fixed inset-0 z-50 flex flex-col p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-historial"
        >
          {/* Fondo oscuro */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setAmpliado(false)}
          />
          {/* Panel */}
          <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-stone-900">
            {/* Encabezado */}
            <div className="flex items-center justify-between gap-3 border-b border-stone-200 bg-stone-50/80 px-5 py-4 dark:border-stone-800 dark:bg-stone-800/40">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-marca-100 text-marca-700 dark:bg-marca-950 dark:text-marca-300">
                  <IconoHistorial className="h-5 w-5" />
                </span>
                <div>
                  <h3 id="titulo-historial" className="text-base font-bold text-stone-800 dark:text-stone-100">
                    Historial completo
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {eventos.length} registros · del más reciente al más antiguo
                  </p>
                </div>
              </div>
              <button
                ref={botonCerrar}
                type="button"
                onClick={() => setAmpliado(false)}
                className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
              >
                <IconoCerrar className="h-4 w-4" /> Cerrar
              </button>
            </div>
            {/* Área desplazable con todos los eventos. */}
            <div className="min-h-0 flex-1 overflow-auto bg-stone-50/40 p-4 dark:bg-stone-950/30">
              {listaAmpliada(eventos)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
