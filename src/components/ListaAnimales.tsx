import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EstadoBadge, SexoBadge, AnimalLink, PageHeader, Badge, Vacio, BotonPrimario } from "@/components/ui";
import { formatearFecha, calcularEdad } from "@/lib/fechas";
import {
  etapaDeAnimal,
  situacionReproductivaVaca,
  etiquetaEstadoRepro,
  ESTADO_REPRO_LABEL,
} from "@/lib/estado";
import { ETAPA_LABEL, CATEGORIA_LABEL, etiquetaArete, terminoBusqueda } from "@/lib/tipos";
import { FiltroAnimales } from "@/components/FiltroAnimales";
import { BuscadorAnimales } from "@/components/BuscadorAnimales";
import { IconoFlecha, IconoRespaldo, IconoAnimal, IconoBuscar, IconoMas } from "@/components/iconos";

type Filtro = string | undefined;

// Opciones de filtro segun el tipo de lista.
const FILTROS_VACA = [
  { v: "ORDENIO", label: "En ordeño" },
  { v: "SECADO", label: "En secado" },
  { v: "POR_PARIR", label: "Por parir" },
  { v: "LISTA_MONTAR", label: "Lista para montar" },
];
// Etapas de engorde (calculadas por la edad).
const FILTROS_ETAPA = [
  { v: "DESTETE", label: "Destete" },
  { v: "DESARROLLO", label: "Desarrollo" },
  { v: "ENGORDE", label: "Engorde" },
];
const FILTROS_PERMANENCIA = [
  { v: "ACTIVO", label: "Activos" },
  { v: "VENDIDO", label: "Vendidos" },
  { v: "MUERTO", label: "Muertos" },
  { v: "INACTIVOS", label: "Dados de baja" },
];

export async function ListaAnimales({
  sexo,
  modulo,
  titulo,
  filtro,
  q,
  basePath,
  soloActivos = false,
  soloBajas = false,
  agregarModulo,
}: {
  sexo?: "MACHO" | "HEMBRA";
  modulo?: "ENGORDE" | "LECHERIA" | "REPRODUCTOR";
  titulo: string;
  filtro?: Filtro;
  q?: string;
  basePath: string; // p.ej. "/animales", "/engorde", "/lecheria"
  // Si es true, solo se muestran animales ACTIVOS (los dados de baja se ven en otra página).
  soloActivos?: boolean;
  // Si es true, solo se muestran animales dados de baja (vendidos/muertos).
  soloBajas?: boolean;
  // Si viene, se muestra un botón "+ Agregar" que preselecciona ese módulo en el alta.
  agregarModulo?: "ENGORDE" | "LECHERIA" | "REPRODUCTOR";
}) {
  // El estado reproductivo (y por tanto las montas/partos) solo se usa en LECHERÍA o en
  // una lista exclusiva de hembras. En engorde/reproductores, en "todos los animales" y en
  // machos no se cargan: evita leer las tablas completas de monta y parto sin necesidad.
  const usaRepro = modulo === "LECHERIA" || (!modulo && sexo === "HEMBRA");

  // Consultas EN PARALELO (un `include` las encadenaría) y solo los campos que se muestran:
  // la miniatura de la foto, nunca la foto completa.
  // El filtro de activos/bajas va en la consulta: así no se traen (ni sus etapas) los que no se muestran.
  const filtroAnimal = {
    ...(sexo ? { sexo } : {}),
    ...(modulo ? { modulo } : {}),
    ...(soloActivos ? { estado: "ACTIVO" } : soloBajas ? { estado: { not: "ACTIVO" } } : {}),
  };
  const [base, montas, partos, etapas, cambios] = await Promise.all([
    prisma.animal.findMany({
      where: filtroAnimal,
      orderBy: { arete: "asc" },
      select: {
        id: true,
        arete: true,
        sinArete: true,
        areteCenasa: true,
        nombre: true,
        sexo: true,
        raza: true,
        estado: true,
        modulo: true,
        categoria: true,
        fechaNacimiento: true,
        fechaBaja: true,
        fotoMiniatura: true,
      },
    }),
    // Solo las montas/partos de las vacas de esta lista (filtro de relación: misma consulta).
    usaRepro
      ? prisma.monta.findMany({ where: { vaca: filtroAnimal }, select: { vacaId: true, fecha: true, createdAt: true } })
      : Promise.resolve([]),
    usaRepro
      ? prisma.parto.findMany({ where: { vaca: filtroAnimal }, select: { vacaId: true, fecha: true, createdAt: true } })
      : Promise.resolve([]),
    // En Engorde la etapa sale de la edad: las etapas manuales solo hacen falta fuera de Engorde.
    modulo === "ENGORDE"
      ? Promise.resolve([])
      : prisma.etapaTernero.findMany({
          where: { animal: { AND: [filtroAnimal, { modulo: { not: "ENGORDE" } }] } },
          select: { animalId: true, etapa: true, fechaInicio: true, fechaFin: true },
        }),
    // Cambios manuales del estado reproductivo.
    usaRepro
      ? prisma.cambioEstadoReproductivo.findMany({
          where: { vaca: filtroAnimal },
          select: { vacaId: true, fecha: true, estadoNuevo: true },
        })
      : Promise.resolve([]),
  ]);

  const agrupar = <T,>(filas: T[], clave: (f: T) => string) => {
    const m = new Map<string, T[]>();
    for (const f of filas) {
      const k = clave(f);
      const lista = m.get(k);
      if (lista) lista.push(f);
      else m.set(k, [f]);
    }
    return m;
  };
  const montasPor = agrupar(montas, (m) => m.vacaId);
  const partosPor = agrupar(partos, (p) => p.vacaId);
  const etapasPor = agrupar(etapas, (e) => e.animalId);
  const cambiosPor = agrupar(cambios, (c) => c.vacaId);
  const animales = base.map((a) => ({
    ...a,
    montasComoVaca: montasPor.get(a.id) ?? [],
    partosComoVaca: partosPor.get(a.id) ?? [],
    etapas: etapasPor.get(a.id) ?? [],
    cambios: cambiosPor.get(a.id) ?? [],
  }));

  const hoy = new Date();

  // Razas distintas presentes (para el filtro dinamico por raza).
  const razas = Array.from(
    new Set(animales.map((a) => a.raza).filter((r): r is string => Boolean(r)))
  ).sort((a, b) => a.localeCompare(b, "es"));

  // Calcular situacion (etapa de ternero o estado reproductivo) de cada animal.
  const filas = animales.map((a) => {
    // En Engorde, la etapa de su edad; en otros módulos, la manual (como antes).
    const etapa = etapaDeAnimal(a, a.etapas, hoy);
    const sit =
      usaRepro && a.sexo === "HEMBRA"
        ? situacionReproductivaVaca(a.montasComoVaca, a.partosComoVaca, hoy, a.cambios)
        : { estado: null, partoEstimado: null, listaParaMontar: false };
    // "Situacion": en engorde se muestra la etapa; en lechería el estado reproductivo.
    return { a, etapa, repro: sit.estado, partoEstimado: sit.partoEstimado, listaParaMontar: sit.listaParaMontar };
  });

  // Busqueda por arete, arete de SENASA o nombre (texto libre, sin distinguir mayusculas).
  // Si el animal no tiene arete físico, el `arete` es interno (no se busca por él); sí por SENASA.
  const termino = terminoBusqueda(q).toLowerCase();
  const porBusqueda = termino
    ? filas.filter(({ a }) => {
        const arete = a.sinArete ? "" : a.arete.toLowerCase();
        const cenasa = (a.areteCenasa ?? "").toLowerCase();
        const nombre = (a.nombre ?? "").toLowerCase();
        return arete.includes(termino) || cenasa.includes(termino) || nombre.includes(termino);
      })
    : filas;

  // soloActivos/soloBajas ya se aplicaron en la consulta.
  const base2 = porBusqueda;

  // Aplicar filtro (incluye razas con prefijo "raza:").
  const filtradas = filtro
    ? base2.filter(({ a, etapa, repro, listaParaMontar }) => {
        if (filtro.startsWith("raza:")) return a.raza === filtro.slice(5);
        if (filtro === "INACTIVOS") return a.estado !== "ACTIVO";
        if (["ACTIVO", "VENDIDO", "MUERTO"].includes(filtro)) return a.estado === filtro;
        if (["DESTETE", "DESARROLLO", "ENGORDE"].includes(filtro))
          return etapa === filtro;
        // "Lista para montar" es un indicador aparte: incluye a las vacas en ordeño que ya pasaron
        // los 40 días del parto (listaParaMontar), no solo a las que tienen ese estado principal.
        if (filtro === "LISTA_MONTAR") return repro === "LISTA_MONTAR" || listaParaMontar;
        // resto de estados reproductivos
        return repro === filtro;
      })
    : base2;

  const n = filtradas.length;
  const subtitulo = n === 1 ? "1 animal" : `${n} animales`;

  // Construir las opciones de filtro visibles segun el tipo de lista.
  // Lechería: estados reproductivos (son vacas). Engorde: etapas. Reproductores: ninguno.
  // Las listas por sexo (sin módulo) conservan el comportamiento anterior.
  const grupos: { titulo: string; opciones: { v: string; label: string }[] }[] = [];
  const mostrarRepro = modulo === "LECHERIA" || (!modulo && sexo === "HEMBRA");
  const mostrarEtapa = modulo === "ENGORDE" || !modulo;
  if (mostrarRepro) grupos.push({ titulo: "Reproducción", opciones: FILTROS_VACA });
  if (mostrarEtapa) grupos.push({ titulo: "Etapa", opciones: FILTROS_ETAPA });
  // Si la página solo muestra activos o solo bajas, el filtro de estado no aplica.
  if (!soloActivos && !soloBajas) grupos.push({ titulo: "Estado", opciones: FILTROS_PERMANENCIA });
  if (razas.length > 0)
    grupos.push({
      titulo: "Raza",
      opciones: razas.map((r) => ({ v: `raza:${r}`, label: r })),
    });

  return (
    <div>
      <PageHeader titulo={titulo} subtitulo={subtitulo}>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <BuscadorAnimales q={q} basePath={basePath} filtro={filtro} />
          <div className="flex gap-2">
            <FiltroAnimales grupos={grupos} valor={filtro} basePath={basePath} q={q} />
            <a
              href={`/api/exportar?${new URLSearchParams({
                ...(modulo ? { modulo } : sexo ? { sexo } : {}),
                ...(soloActivos ? { estado: "ACTIVOS" } : soloBajas ? { estado: "BAJAS" } : {}),
              })}`}
              title="Exportar a Excel (CSV) los animales de esta lista"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-medium text-stone-700 hover:bg-stone-50 active:bg-stone-100 sm:h-10 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
            >
              <IconoRespaldo className="h-[18px] w-[18px]" />
              CSV
            </a>
            {agregarModulo && (
              <BotonPrimario
                href={`/animales/nuevo?modulo=${agregarModulo}`}
                icono={<IconoMas className="h-[18px] w-[18px]" strokeWidth={2.2} />}
                className="h-11 shrink-0 sm:h-10"
              >
                Agregar
              </BotonPrimario>
            )}
          </div>
        </div>
      </PageHeader>

      {n === 0 ? (
        <Card>
          {q || filtro ? (
            <Vacio
              icono={<IconoBuscar className="h-6 w-6" />}
              mensaje="Ningún animal coincide con la búsqueda o el filtro. Prueba quitando el filtro o buscando otra cosa."
            />
          ) : (
            soloBajas ? (
              <Vacio mensaje="No hay animales dados de baja (vendidos o muertos)." />
            ) : (
              <Vacio
                mensaje="Todavía no hay animales aquí. Empieza registrando el primero."
                accionHref={agregarModulo ? `/animales/nuevo?modulo=${agregarModulo}` : "/animales/nuevo"}
                accionLabel="+ Agregar animal"
              />
            )
          )}
        </Card>
      ) : (
        <>
          {/* Vista MÓVIL: tarjetas apiladas, cómodas para tocar. */}
          <ul className="space-y-2 sm:hidden">
            {filtradas.map(({ a, etapa, repro, partoEstimado, listaParaMontar }) => (
              <li key={a.id}>
                <Link
                  href={`/animales/${a.id}`}
                  className="flex items-center gap-3 rounded-xl border border-stone-200/80 bg-white p-3 shadow-card active:bg-marca-50/40 dark:border-stone-800 dark:bg-stone-900 dark:active:bg-stone-800/60"
                >
                  {a.fotoMiniatura ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.fotoMiniatura}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-stone-200 dark:ring-stone-700"
                    />
                  ) : (
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                      <IconoAnimal sexo={a.sexo} className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold text-stone-800 dark:text-stone-100">
                        {a.nombre ? a.nombre : etiquetaArete(a)}
                        {a.nombre && (
                          <span className="ml-1 font-normal text-stone-400 dark:text-stone-500">{etiquetaArete(a)}</span>
                        )}
                      </span>
                      {/* Solo se marca el estado cuando NO está activo (lo normal no necesita etiqueta). */}
                      {a.estado !== "ACTIVO" && <EstadoBadge estado={a.estado} />}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {/* En Toros/Vacas el sexo ya se sabe por la lista. */}
                      {!sexo && <SexoBadge sexo={a.sexo} />}
                      {a.modulo === "LECHERIA" && a.categoria && <Badge>{CATEGORIA_LABEL[a.categoria] ?? a.categoria}</Badge>}
                      <Situacion etapa={etapa} repro={repro} partoEstimado={partoEstimado} listaParaMontar={listaParaMontar} compacta />
                    </div>
                  </div>
                  <IconoFlecha className="h-4 w-4 shrink-0 text-stone-300 dark:text-stone-600" />
                </Link>
              </li>
            ))}
          </ul>

          {/* Vista ESCRITORIO: tabla. */}
          <Card className="hidden overflow-hidden p-0 sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-stone-200 bg-stone-50/80 text-left text-xs uppercase tracking-wider text-stone-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
                  <tr>
                    <th className="w-14 px-4 py-3 font-semibold"></th>
                    <th className="px-4 py-3 font-semibold">Arete</th>
                    <th className="px-4 py-3 font-semibold">Nombre</th>
                    <th className="px-4 py-3 font-semibold">Sexo</th>
                    <th className="px-4 py-3 font-semibold">Situación</th>
                    <th className="px-4 py-3 font-semibold">Nacimiento</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filtradas.map(({ a, etapa, repro, partoEstimado, listaParaMontar }) => (
                    <tr key={a.id} className="transition-colors hover:bg-marca-50/40 dark:hover:bg-stone-800/40">
                      <td className="py-2 pl-4">
                        {a.fotoMiniatura ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={a.fotoMiniatura}
                            alt=""
                            className="h-9 w-9 rounded-lg object-cover ring-1 ring-stone-200 dark:ring-stone-700"
                          />
                        ) : (
                          <div className="grid h-9 w-9 place-items-center rounded-lg bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                            <IconoAnimal sexo={a.sexo} className="h-5 w-5" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <AnimalLink animal={a} />
                      </td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-300">{a.nombre ?? "—"}</td>
                      <td className="px-4 py-3"><SexoBadge sexo={a.sexo} /></td>
                      <td className="px-4 py-3">
                        <Situacion etapa={etapa} repro={repro} partoEstimado={partoEstimado} listaParaMontar={listaParaMontar} />
                      </td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-300">
                        {formatearFecha(a.fechaNacimiento)}
                        {a.fechaNacimiento && (
                          <span className="block text-xs text-stone-400 dark:text-stone-500">
                            {calcularEdad(a.fechaNacimiento, a.estado !== "ACTIVO" ? a.fechaBaja : null)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3"><EstadoBadge estado={a.estado} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Situacion({
  etapa,
  repro,
  partoEstimado,
  listaParaMontar = false,
  compacta = false,
}: {
  etapa: string | null;
  repro: string | null;
  partoEstimado: Date | null;
  // Tras parir la vaca está en ordeño y, pasados 40 días, además "lista para montar": se muestran
  // los dos. Solo aplica cuando el estado principal no es ya "lista para montar".
  listaParaMontar?: boolean;
  // En las tarjetas móviles no se muestra el "—" de "sin situación".
  compacta?: boolean;
}) {
  if (etapa) return <Badge tono="azul" punto>{ETAPA_LABEL[etapa] ?? etapa}</Badge>;
  if (repro) {
    const tono =
      repro === "LISTA_MONTAR" || repro === "ORDENIO"
        ? "verde"
        : repro === "SECADO" || repro === "POR_PARIR"
        ? "ambar"
        : "neutral";
    const tambienLista = listaParaMontar && repro !== "LISTA_MONTAR";
    return (
      <div className={compacta ? "flex flex-wrap items-center gap-x-2 gap-y-1" : "flex flex-col items-start gap-1"}>
        <div className="flex flex-wrap items-center gap-1">
          <Badge tono={tono as any} punto>{etiquetaEstadoRepro(repro as any)}</Badge>
          {tambienLista && <Badge tono="verde" punto>{ESTADO_REPRO_LABEL.LISTA_MONTAR}</Badge>}
        </div>
        {partoEstimado && (
          <span className="text-xs text-stone-400 dark:text-stone-500">
            Parto est.: {formatearFecha(partoEstimado)}
          </span>
        )}
      </div>
    );
  }
  if (compacta) return null;
  return <span className="text-stone-400 dark:text-stone-500">—</span>;
}
