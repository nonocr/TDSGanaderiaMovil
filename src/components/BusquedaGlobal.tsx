"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconoBuscar, IconoCerrar, IconoAnimal } from "@/components/iconos";
import { MODULO_LABEL, etiquetaArete } from "@/lib/tipos";

// Un resultado de búsqueda (lo que devuelve GET /api/animales, campos que mostramos).
type Resultado = {
  id: string;
  arete: string;
  sinArete: boolean;
  areteCenasa: string | null;
  nombre: string | null;
  sexo: string;
  modulo: string;
  estado: string;
  fotoMiniatura: string | null;
};

// Caja de búsqueda con resultados instantáneos. Reutilizable en el sidebar (escritorio) y
// dentro del panel a pantalla completa (móvil). Al elegir un animal navega a su ficha.
//  - `autoFocus`: enfoca el input al montar (para el panel móvil).
//  - `onNavegar`: se llama tras elegir un resultado (p. ej. cerrar el panel móvil).
export function BusquedaGlobal({
  autoFocus = false,
  onNavegar,
}: {
  autoFocus?: boolean;
  onNavegar?: () => void;
}) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [cargando, setCargando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Buscar con "debounce": espera a que el usuario deje de teclear ~250 ms para no
  // disparar una consulta por cada letra. Cancela la petición anterior si llega otra.
  useEffect(() => {
    const q = texto.trim();
    if (q.length < 1) {
      setResultados([]);
      setCargando(false);
      return;
    }
    setCargando(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/animales?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error();
        const datos: Resultado[] = await res.json();
        setResultados(datos.slice(0, 20)); // tope visual
        setAbierto(true);
      } catch {
        // Petición cancelada o error de red: no rompemos la UI.
      } finally {
        setCargando(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [texto]);

  function elegir(id: string) {
    setTexto("");
    setResultados([]);
    setAbierto(false);
    onNavegar?.();
    router.push(`/animales/${id}`);
  }

  const q = texto.trim();
  const sinResultados = abierto && !cargando && q.length >= 1 && resultados.length === 0;

  return (
    <div className="relative">
      <div className="relative">
        <IconoBuscar className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-stone-400" />
        <input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onFocus={() => resultados.length > 0 && setAbierto(true)}
          placeholder="Buscar arete, CENASA o nombre…"
          aria-label="Buscar animal por arete, arete de CENASA o nombre"
          className="h-11 w-full rounded-xl border border-stone-300 bg-white pl-10 pr-10 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500 [&::-webkit-search-cancel-button]:hidden"
        />
        {texto && (
          <button
            type="button"
            onClick={() => {
              setTexto("");
              setResultados([]);
              inputRef.current?.focus();
            }}
            aria-label="Limpiar búsqueda"
            className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-700 dark:hover:text-stone-300"
          >
            <IconoCerrar className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Resultados */}
      {q.length >= 1 && (
        <ul className="mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-card dark:border-stone-800 dark:bg-stone-900">
          {cargando && resultados.length === 0 && (
            <li className="px-3 py-3 text-sm text-stone-400 dark:text-stone-500">Buscando…</li>
          )}
          {sinResultados && (
            <li className="px-3 py-3 text-sm text-stone-500 dark:text-stone-400">
              Ningún animal coincide con “{q}”.
            </li>
          )}
          {resultados.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => elegir(a.id)}
                className="flex w-full items-center gap-3 border-b border-stone-100 px-3 py-2.5 text-left last:border-0 hover:bg-stone-50 active:bg-marca-50/60 dark:border-stone-800 dark:hover:bg-stone-800/60"
              >
                {a.fotoMiniatura ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.fotoMiniatura} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-stone-200 dark:ring-stone-700" />
                ) : (
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                    <IconoAnimal sexo={a.sexo} className="h-5 w-5" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-stone-800 dark:text-stone-100">
                    {a.nombre ? a.nombre : etiquetaArete(a)}
                    {a.nombre && <span className="ml-1 font-normal text-stone-400 dark:text-stone-500">{etiquetaArete(a)}</span>}
                  </span>
                  <span className="block truncate text-xs text-stone-400 dark:text-stone-500">
                    {MODULO_LABEL[a.modulo] ?? a.modulo}
                    {a.estado !== "ACTIVO" ? " · dado de baja" : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
