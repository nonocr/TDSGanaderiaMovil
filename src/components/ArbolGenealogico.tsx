"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { NodoArbol, Progenitor } from "@/lib/genealogia";
import { VisorArbol } from "@/components/VisorArbol";
import { IconoAnimal, IconoCerrar } from "@/components/iconos";
import { etiquetaArete } from "@/lib/tipos";
import { useModalAccesible } from "@/lib/usar-modal";
import { usePresencia } from "@/lib/usar-presencia";
import { claseBoton, claseBotonIcono } from "@/components/ui";

// Árbol de ascendencia de izquierda (este animal) a derecha (bisabuelos). Cada generación es
// una columna de ancho fijo; las ramas padre/madre se unen con conectores en corchete.
// Mobile-first: en la pestaña se ve a tamaño real y, si no cabe, se desliza de lado con el
// dedo (scroll nativo). "Pantalla completa" abre el visor con zoom.

const GENERACIONES = ["Este animal", "Padres", "Abuelos", "Bisabuelos"];

// Ancho de cada columna y separación entre columnas (debe coincidir con el conector:
// w-3 de tramo horizontal + pl-3 de la rama = 1.5rem).
const COLUMNA = "w-36 sm:w-44";
const SEPARACION = "w-6";

const LINEA = "bg-stone-300 dark:bg-stone-600";

function Nodo({ p, raiz }: { p: Progenitor; raiz: boolean }) {
  const base = `${COLUMNA} shrink-0 rounded-xl border px-3 text-sm`;

  if (p.tipo === "registrado") {
    const { animal } = p;
    const macho = animal.sexo === "MACHO";
    // El sexo se ve en el icono (toro / vaca) y en el texto: el color queda para los estados
    // (ver "Tonos" en ui.tsx), así que el recuadro va en neutro.
    const contenido = (
      <>
        <span
          className={
            "grid h-9 w-9 shrink-0 place-items-center rounded-full " +
            (raiz
              ? "bg-white text-marca-700 dark:bg-marca-900 dark:text-marca-200"
              : "bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-300")
          }
          title={macho ? "Macho" : "Hembra"}
        >
          <IconoAnimal sexo={animal.sexo} className="h-5 w-5" />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate font-semibold text-stone-800 dark:text-stone-100">
            {animal.nombre ?? etiquetaArete(animal)}
          </span>
          <span className="block truncate text-xs text-stone-500 dark:text-stone-400">
            {animal.nombre ? etiquetaArete(animal) : macho ? "Macho" : "Hembra"}
          </span>
        </span>
      </>
    );
    const titulo = animal.nombre ? `${animal.nombre} (${etiquetaArete(animal)})` : etiquetaArete(animal);

    // El animal de la ficha no es enlace (ya estás en él): va resaltado.
    if (raiz) {
      return (
        <div
          title={titulo}
          className={`${base} flex items-center gap-2.5 border-marca-400 bg-marca-50 py-3 shadow-card ring-2 ring-marca-500/25 dark:border-marca-700 dark:bg-marca-950`}
        >
          {contenido}
        </div>
      );
    }
    return (
      <Link
        href={`/animales/${animal.id}`}
        title={titulo}
        className={`${base} flex items-center gap-2.5 border-stone-200 bg-white py-2.5 shadow-card transition-colors hover:border-marca-300 hover:bg-marca-50/50 active:bg-marca-50 dark:border-stone-700 dark:bg-stone-800 dark:hover:border-marca-700 dark:hover:bg-stone-700`}
      >
        {contenido}
      </Link>
    );
  }

  if (p.tipo === "externo") {
    return (
      <div
        title={p.texto}
        className={`${base} border-dashed border-stone-300 bg-stone-50 py-2.5 dark:border-stone-600 dark:bg-stone-800/50`}
      >
        <span className="block truncate font-medium text-stone-700 dark:text-stone-200">{p.texto}</span>
        <span className="block text-xs text-stone-500 dark:text-stone-400">Externo</span>
      </div>
    );
  }

  return (
    <div className={`${base} border-dashed border-stone-200 py-2 text-xs text-stone-500 dark:border-stone-700 dark:text-stone-400`}>
      Sin registro
    </div>
  );
}

// Un nodo y, a su derecha, sus padres unidos con un corchete:
// tramo horizontal desde el nodo -> línea vertical entre padre y madre -> tramo a cada uno.
function Rama({ nodo, nivel = 0 }: { nodo: NodoArbol; nivel?: number }) {
  const padres = [nodo.padre, nodo.madre].filter((n): n is NodoArbol => Boolean(n));

  return (
    <div className="flex items-center">
      <Nodo p={nodo.progenitor} raiz={nivel === 0} />
      {padres.length > 0 && (
        <>
          <div className={`h-px w-3 shrink-0 ${LINEA}`} />
          <div className="flex flex-col">
            {padres.map((p, i) => (
              <div
                key={i}
                className={
                  "relative flex items-center py-1.5 pl-3 " +
                  // tramo horizontal hacia el progenitor
                  "before:absolute before:left-0 before:top-1/2 before:h-px before:w-3 before:bg-stone-300 dark:before:bg-stone-600 " +
                  // línea vertical: del centro del primero hacia abajo y del último hacia su centro
                  "after:absolute after:left-0 after:w-px after:bg-stone-300 dark:after:bg-stone-600 " +
                  "first:after:bottom-0 first:after:top-1/2 last:after:bottom-1/2 last:after:top-0"
                }
              >
                <Rama nodo={p} nivel={nivel + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Número de generaciones dibujadas (1 = solo el animal).
function generaciones(nodo: NodoArbol): number {
  return 1 + Math.max(0, ...[nodo.padre, nodo.madre].map((n) => (n ? generaciones(n) : 0)));
}

// Fila de títulos alineada con las columnas del árbol.
function Encabezados({ n }: { n: number }) {
  return (
    <div className="mb-2 flex">
      {GENERACIONES.slice(0, n).map((g, i) => (
        <div key={g} className="flex shrink-0">
          {i > 0 && <div className={`${SEPARACION} shrink-0`} />}
          <div className={`${COLUMNA} text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400`}>
            {g}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ArbolGenealogico({ arbol }: { arbol: NodoArbol }) {
  const [ampliado, setAmpliado] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [desborda, setDesborda] = useState(false);
  const [alFinal, setAlFinal] = useState(false);
  const sinAncestros = !arbol.padre && !arbol.madre;
  const n = generaciones(arbol);

  // ¿El árbol no cabe a lo ancho? Entonces se muestra la pista "desliza" y un degradado.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const medir = () => {
      setDesborda(el.scrollWidth > el.clientWidth + 1);
      setAlFinal(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    el.addEventListener("scroll", medir, { passive: true });
    return () => {
      obs.disconnect();
      el.removeEventListener("scroll", medir);
    };
  }, [sinAncestros]);

  // Accesibilidad del modal de pantalla completa: atrapa el foco, cierra con Escape, bloquea el
  // scroll del fondo y devuelve el foco al abridor al cerrar (ver src/lib/usar-modal.ts).
  const cerrarAmpliado = useCallback(() => setAmpliado(false), []);
  useModalAccesible(ampliado, panelRef, cerrarAmpliado);
  const modal = usePresencia(ampliado, 150);

  if (sinAncestros) {
    return (
      <p className="text-sm text-stone-500 dark:text-stone-400">
        Sin ascendencia registrada. Al editar el animal puedes indicar su padre y su madre.
      </p>
    );
  }

  return (
    <>
      {/* Leyenda + pantalla completa */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-stone-500 dark:text-stone-400">Toca un animal para ver su ficha.</p>
        <button
          type="button"
          onClick={() => setAmpliado(true)}
          className={claseBoton("secundario", "sm")}
        >
          <IconoExpandir />
          Pantalla completa
        </button>
      </div>

      {/* Árbol a tamaño real. En móvil ocupa todo el ancho de la tarjeta (-mx) y se desliza. */}
      <div className="relative -mx-4 sm:mx-0">
        <div ref={scrollRef} className="overflow-x-auto overscroll-x-contain px-4 pb-2 sm:px-0">
          <div className="w-max">
            <Encabezados n={n} />
            <Rama nodo={arbol} />
          </div>
        </div>
        {/* Degradado a la derecha mientras quede árbol por ver. */}
        {desborda && !alFinal && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent dark:from-stone-900" />
        )}
      </div>
      {desborda && !alFinal && (
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Desliza a la izquierda para ver más generaciones →</p>
      )}

      {/* Pantalla completa: visor con zoom (pellizco/rueda) y arrastre. */}
      {modal.montado && (
        <div
          className="fixed inset-0 z-50 flex flex-col p-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-arbol-completo"
        >
          <div className="t-fondo absolute inset-0 bg-stone-950/50" data-estado={modal.estado} onClick={() => setAmpliado(false)} />
          <div
            ref={panelRef}
            data-estado={modal.estado}
            className="t-modal relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl bg-white shadow-flotante ring-1 ring-stone-900/5 dark:bg-stone-900 dark:ring-white/10"
          >
            <div className="flex items-center justify-between px-4 py-2 shadow-[0_1px_0_rgb(28_25_23/0.07)] dark:shadow-[0_1px_0_rgb(255_255_255/0.07)]">
              <h3 id="titulo-arbol-completo" className="text-base font-semibold text-stone-900 dark:text-stone-50">Árbol genealógico</h3>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-stone-500 sm:inline dark:text-stone-400">
                  Rueda del mouse o pellizca para acercar · arrastra para mover
                </span>
                <button
                  type="button"
                  onClick={() => setAmpliado(false)}
                  className={`${claseBotonIcono("discreto")} -mr-2`}
                  aria-label="Cerrar"
                >
                  <IconoCerrar className="h-5 w-5" />
                </button>
              </div>
            </div>
            <VisorArbol>
              <Encabezados n={n} />
              <Rama nodo={arbol} />
            </VisorArbol>
          </div>
        </div>
      )}
    </>
  );
}

function IconoExpandir() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}
