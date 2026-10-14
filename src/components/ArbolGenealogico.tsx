"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { NodoArbol, Progenitor } from "@/lib/genealogia";
import { VisorArbol } from "@/components/VisorArbol";
import { IconoAnimal, IconoCerrar } from "@/components/iconos";
import { etiquetaArete } from "@/lib/tipos";

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
    // Franja de color a la izquierda según el sexo (mismos tonos que SexoBadge).
    // (con variante dark y hover para que el color de borde general no la tape).
    const franja = macho
      ? "border-l-sky-500 hover:border-l-sky-500 dark:border-l-sky-500"
      : "border-l-amber-500 hover:border-l-amber-500 dark:border-l-amber-500";
    const contenido = (
      <>
        <span
          className={
            "grid h-9 w-9 shrink-0 place-items-center rounded-full " +
            (macho
              ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
              : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300")
          }
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
          className={`${base} flex items-center gap-2.5 border-l-4 border-marca-300 ${franja} bg-marca-50 py-3 shadow-sm ring-2 ring-marca-500/30 dark:border-marca-800 dark:bg-marca-950`}
        >
          {contenido}
        </div>
      );
    }
    return (
      <Link
        href={`/animales/${animal.id}`}
        title={titulo}
        className={`${base} flex items-center gap-2.5 border-l-4 border-stone-200 ${franja} bg-white py-2.5 shadow-sm transition-colors hover:border-marca-300 hover:bg-marca-50/50 active:bg-marca-50 dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700`}
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
        <span className="block text-xs text-stone-400 dark:text-stone-500">Externo</span>
      </div>
    );
  }

  return (
    <div className={`${base} border-dashed border-stone-200 py-2 text-xs text-stone-400 dark:border-stone-700 dark:text-stone-500`}>
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
          <div className={`${COLUMNA} text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500`}>
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
  const cerrarRef = useRef<HTMLButtonElement>(null);
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

  // Cerrar con Escape, bloquear el scroll del fondo y gestionar el foco mientras está abierto.
  useEffect(() => {
    if (!ampliado) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAmpliado(false);
    };
    window.addEventListener("keydown", onKey);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Recordar qué tenía el foco para devolverlo al cerrar, y mover el foco al botón Cerrar.
    const focoPrevio = document.activeElement as HTMLElement | null;
    cerrarRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowPrevio;
      focoPrevio?.focus?.();
    };
  }, [ampliado]);

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
        <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-1 rounded-full bg-sky-500" /> Macho
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-1 rounded-full bg-amber-500" /> Hembra
          </span>
          <span className="hidden sm:inline">· Toca un animal para ver su ficha</span>
        </div>
        <button
          type="button"
          onClick={() => setAmpliado(true)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm transition-colors hover:border-marca-300 hover:text-marca-700 active:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-marca-700 dark:hover:text-marca-300"
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
        <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">Desliza a la izquierda para ver más generaciones →</p>
      )}

      {/* Pantalla completa: visor con zoom (pellizco/rueda) y arrastre. */}
      {ampliado && (
        <div
          className="fixed inset-0 z-50 flex flex-col p-2 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-arbol-completo"
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setAmpliado(false)} />
          <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-stone-800">
              <h3 id="titulo-arbol-completo" className="text-sm font-semibold text-stone-700 dark:text-stone-200">Árbol genealógico</h3>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-stone-400 sm:inline dark:text-stone-500">
                  Rueda del mouse o pellizca para acercar · arrastra para mover
                </span>
                <button
                  ref={cerrarRef}
                  type="button"
                  onClick={() => setAmpliado(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
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
