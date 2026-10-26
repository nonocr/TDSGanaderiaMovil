import Link from "next/link";
import { Badge, SexoBadge } from "@/components/ui";
import { IconoAnimal, IconoFlecha, IconoMacho, IconoHembra } from "@/components/iconos";
import { formatearFecha } from "@/lib/fechas";
import { etiquetaArete } from "@/lib/tipos";

export type CriaResumen = {
  id: string;
  arete: string;
  nombre: string | null;
  sinArete: boolean;
  areteCenasa: string | null;
  sexo: string | null; // null si no se encontró la ficha (no se inventa)
  fotoMiniatura: string | null;
};

export type PartoResumen = {
  id: string;
  fechaISO: string;
  toro: string | null; // texto del padre, si se registró
  crias: CriaResumen[];
};

// Cuenta crías por sexo según su ficha. Cada cría una sola vez (aunque apareciera repetida) y las
// que no tienen sexo registrado no cuentan como macho ni hembra.
export function contarCrias(partos: PartoResumen[]) {
  const vistas = new Map<string, string | null>();
  for (const p of partos) for (const c of p.crias) vistas.set(c.id, c.sexo);
  let machos = 0;
  let hembras = 0;
  let sinSexo = 0;
  for (const sexo of vistas.values()) {
    if (sexo === "MACHO") machos++;
    else if (sexo === "HEMBRA") hembras++;
    else sinSexo++;
  }
  return { machos, hembras, sinSexo };
}

// Historial resumido de partos de una vaca: cada parto con la foto (o un marcador) y el sexo de
// sus crías; tocar un parto abre su detalle. Arriba, cuántos machos y hembras han nacido.
export function ResumenPartos({ partos }: { partos: PartoResumen[] }) {
  const { machos, hembras, sinSexo } = contarCrias(partos);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Conteo valor={partos.length} texto={partos.length === 1 ? "parto" : "partos"} />
        <Conteo
          valor={machos}
          texto={machos === 1 ? "macho" : "machos"}
          icono={<IconoMacho className="h-4 w-4" />}
          acento="bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900"
        />
        <Conteo
          valor={hembras}
          texto={hembras === 1 ? "hembra" : "hembras"}
          icono={<IconoHembra className="h-4 w-4" />}
          acento="bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900"
        />
        {sinSexo > 0 && <Conteo valor={sinSexo} texto="sin sexo registrado" />}
      </div>

      {partos.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">Sin partos registrados.</p>
      ) : (
        <ul className="-mx-2">
          {partos.map((p) => (
            <li key={p.id}>
              <Link
                href={`/partos/${p.id}`}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-stone-50 active:bg-stone-100 dark:hover:bg-stone-800/50 dark:active:bg-stone-800"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium text-stone-800 dark:text-stone-100">{formatearFecha(p.fechaISO)}</span>
                    {p.toro && <span className="text-xs text-stone-500 dark:text-stone-400">padre: {p.toro}</span>}
                  </div>
                  {p.crias.length === 0 ? (
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Sin cría registrada</p>
                  ) : (
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {p.crias.map((c) => (
                        <span key={c.id} className="inline-flex items-center gap-2">
                          <FotoCria cria={c} />
                          <span className="text-sm text-stone-700 dark:text-stone-200">
                            {c.nombre ?? etiquetaArete(c)}
                          </span>
                          {c.sexo ? <SexoBadge sexo={c.sexo} /> : <Badge>Sin sexo</Badge>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <IconoFlecha className="h-4 w-4 shrink-0 text-stone-300 dark:text-stone-600" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Foto de la cría o, si no tiene, un marcador con el icono según el sexo.
export function FotoCria({ cria, grande = false }: { cria: CriaResumen; grande?: boolean }) {
  const tam = grande ? "h-24 w-24" : "h-10 w-10";
  if (cria.fotoMiniatura) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={cria.fotoMiniatura}
        alt=""
        className={`${tam} shrink-0 rounded-lg object-cover ring-1 ring-stone-200 dark:ring-stone-700`}
      />
    );
  }
  return (
    <span
      className={`${tam} grid shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400`}
      aria-label="Sin foto"
    >
      <IconoAnimal sexo={cria.sexo ?? ""} className={grande ? "h-10 w-10" : "h-5 w-5"} />
    </span>
  );
}

function Conteo({
  valor,
  texto,
  icono,
  acento = "bg-stone-50 text-stone-700 ring-stone-200 dark:bg-stone-800/60 dark:text-stone-200 dark:ring-stone-700",
}: {
  valor: number;
  texto: string;
  icono?: React.ReactNode;
  acento?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ring-1 ring-inset ${acento}`}>
      {icono}
      <span className="text-lg font-bold leading-none">{valor}</span>
      {texto}
    </span>
  );
}
