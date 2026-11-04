"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconoBuscar, IconoCerrar } from "@/components/iconos";

// Campo de búsqueda (lupa a la izquierda, botón de limpiar a la derecha). Compartido con
// BusquedaGlobal para que las dos cajas se vean iguales.
export const claseBusqueda =
  "h-11 w-full rounded-xl border border-stone-300 bg-white pl-10 pr-10 text-sm text-stone-900 shadow-[inset_0_1px_1px_rgb(28_25_23/0.04)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-stone-500 hover:border-stone-400 focus:border-marca-500 focus:ring-[3px] focus:ring-marca-500/20 sm:h-10 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-400 dark:hover:border-stone-600 dark:focus:border-marca-400 dark:focus:ring-marca-400/25 [&::-webkit-search-cancel-button]:hidden";

// Caja de busqueda por arete o nombre. Al enviar (Enter / "Buscar" del teclado del
// celular), navega a basePath?q=... conservando el filtro.
export function BuscadorAnimales({
  q,
  filtro,
  basePath,
}: {
  q?: string;
  filtro?: string;
  basePath: string;
}) {
  const router = useRouter();
  const [texto, setTexto] = useState(q ?? "");

  function navegar(valor: string) {
    const params = new URLSearchParams();
    if (valor.trim()) params.set("q", valor.trim());
    if (filtro) params.set("filtro", filtro);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Cierra el teclado del celular tras buscar.
    (document.activeElement as HTMLElement | null)?.blur();
    navegar(texto);
  }

  function limpiar() {
    setTexto("");
    navegar("");
  }

  return (
    <form onSubmit={onSubmit} role="search" className="relative w-full sm:max-w-sm sm:flex-1">
      <IconoBuscar className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-stone-500 dark:text-stone-400" />
      <input
        type="search"
        enterKeyHint="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar arete, SENASA o nombre…"
        aria-label="Buscar por arete, arete de SENASA o nombre"
        className={claseBusqueda}
      />
      {texto && (
        <button
          type="button"
          onClick={limpiar}
          aria-label="Limpiar búsqueda"
          className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-100"
        >
          <IconoCerrar className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
