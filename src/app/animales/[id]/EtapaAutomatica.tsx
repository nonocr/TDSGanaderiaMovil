import { ETAPAS_ORDEN, ETAPA_LABEL } from "@/lib/tipos";
import { formatearFecha } from "@/lib/fechas";

// Etapa de engorde calculada por la edad (etapaPorEdad en src/lib/estado.ts): línea de tiempo
// Destete → Desarrollo → Engorde con las fechas en que empieza cada una, y la actual marcada.
// Las fechas las calcula el servidor (inicios: nacimiento, +4 meses, +16 meses).
export function EtapaAutomatica({
  etapaActual,
  inicios,
}: {
  etapaActual: string | null;
  // ISO del inicio de cada etapa; null si el animal no tiene fecha de nacimiento.
  inicios: { DESTETE: string; DESARROLLO: string; ENGORDE: string } | null;
}) {
  if (!inicios) {
    return (
      <p className="text-sm text-stone-500 dark:text-stone-400">
        Sin fecha de nacimiento: no se puede calcular la etapa. Agrégala en <strong>Editar</strong> y la
        etapa se asignará sola (Destete hasta los 4 meses, Desarrollo hasta los 16, luego Engorde).
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <ol className="grid grid-cols-3 gap-2">
        {ETAPAS_ORDEN.map((et) => {
          const activa = et === etapaActual;
          return (
            <li
              key={et}
              className={
                "rounded-lg border px-2 py-2 text-center text-sm " +
                (activa
                  ? "border-marca-600 bg-marca-600 text-white shadow-sm"
                  : "border-stone-200 text-stone-600 dark:border-stone-700 dark:text-stone-300")
              }
            >
              <span className="block font-medium">{ETAPA_LABEL[et]}</span>
              <span className={"block text-xs " + (activa ? "text-marca-50" : "text-stone-400 dark:text-stone-500")}>
                desde {formatearFecha(inicios[et])}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-stone-500 dark:text-stone-400">
        La etapa se calcula sola con la fecha de nacimiento y cambia cuando el animal cumple 4 y 16 meses.
      </p>
    </div>
  );
}
