"use client";

import { useRouter } from "next/navigation";
import { IconoFiltro } from "@/components/iconos";

type Opcion = { v: string; label: string };
type Grupo = { titulo: string; opciones: Opcion[] };

// Selector de filtro como lista desplegable. Al elegir, navega a basePath?filtro=valor
// (conservando la busqueda q si existe).
export function FiltroAnimales({
  grupos,
  valor,
  basePath,
  q,
}: {
  grupos: Grupo[];
  valor?: string;
  basePath: string;
  q?: string;
}) {
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    const params = new URLSearchParams();
    if (v) params.set("filtro", v);
    if (q) params.set("q", q);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  const activo = Boolean(valor);

  return (
    <label className="relative block min-w-0 flex-1 sm:flex-none">
      <span className="sr-only">Filtrar</span>
      <IconoFiltro
        className={
          "pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 " +
          (activo ? "text-marca-600 dark:text-marca-400" : "text-stone-400")
        }
      />
      <select
        value={valor ?? ""}
        onChange={onChange}
        className={
          "h-11 w-full rounded-xl border bg-white pl-10 pr-8 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-200 sm:h-10 sm:w-48 dark:bg-stone-800 dark:text-stone-100 " +
          (activo
            ? "border-marca-400 font-medium text-marca-800 dark:border-marca-700 dark:text-marca-200"
            : "border-stone-300 dark:border-stone-700")
        }
      >
        <option value="">Todos</option>
        {grupos.map((g) => (
          <optgroup key={g.titulo} label={g.titulo}>
            {g.opciones.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
