import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, SectionTitle, AnimalLink, SexoBadge, EstadoBadge, Badge, EnlaceVolver } from "@/components/ui";
import { IconoFlecha } from "@/components/iconos";
import { formatearFecha, calcularEdad } from "@/lib/fechas";
import { etiquetaArete } from "@/lib/tipos";
import { FotoCria, contarCrias } from "@/app/animales/[id]/ResumenPartos";

export const dynamic = "force-dynamic";

// Detalle de un parto: sus datos y los de la madre, el padre y cada cría. Todo sale de los
// registros relacionados (la madre y las crías son animales con su propia ficha); no se copia nada.
const IDENT = { id: true, arete: true, nombre: true, sinArete: true, areteCenasa: true } as const;

export default async function PartoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Dos consultas EN PARALELO (la base está en EE. UU.): el parto con madre y padre (un solo nivel
  // de relación) y, aparte, las crías de este parto con los campos que la vista muestra.
  // No se usa listarAnimales(): leería todo el hato solo para identificar a la madre.
  const [parto, crias] = await Promise.all([
    prisma.parto.findUnique({
      where: { id },
      include: {
        vaca: { select: IDENT },
        toro: { select: { ...IDENT, esPajilla: true } },
      },
    }),
    prisma.animal.findMany({
      where: { nacidoEnParto: { some: { partoId: id } } },
      select: {
        ...IDENT,
        sexo: true, fotoMiniatura: true, fechaNacimiento: true, estado: true, fechaBaja: true, raza: true,
      },
    }),
  ]);
  if (!parto) notFound();

  const { vaca, toro } = parto;
  const { machos, hembras } = contarCrias([
    { id: parto.id, fechaISO: "", toro: null, crias: crias.map((c) => ({ ...c, fotoMiniatura: null })) },
  ]);
  const siNo = (v: boolean | null) => (v === null ? "—" : v ? "Sí" : "No");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <EnlaceVolver href={`/animales/${vaca.id}`}>{vaca.nombre ?? etiquetaArete(vaca)}</EnlaceVolver>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-[1.75rem] dark:text-stone-50">
          Parto del {formatearFecha(parto.fecha)}
        </h1>
      </div>

      <Card>
        <SectionTitle>Datos del parto</SectionTitle>
        <dl className="-my-1.5 divide-y divide-stone-100 text-sm dark:divide-stone-800">
          <Fila k="Fecha del parto" v={formatearFecha(parto.fecha)} />
          <Fila k="Madre" v={<AnimalLink animal={vaca} />} />
          <Fila
            k="Padre / toro"
            v={
              toro ? (
                <>
                  <AnimalLink animal={toro} />
                  {toro.esPajilla && <span className="ml-1 text-xs text-stone-500 dark:text-stone-400">(pajilla)</span>}
                </>
              ) : (
                "Sin especificar"
              )
            }
          />
          <Fila
            k="Crías"
            v={`${crias.length}${crias.length ? ` (${machos} macho${machos === 1 ? "" : "s"}, ${hembras} hembra${hembras === 1 ? "" : "s"})` : ""}`}
          />
          <Fila k="¿Cría sana?" v={siNo(parto.criaSana)} />
          <Fila k="¿Necesitó ayuda?" v={siNo(parto.necesitoAyuda)} />
          <Fila k="Peso al nacer" v={parto.pesoNacimientoKg != null ? `${parto.pesoNacimientoKg} kg` : "—"} />
          <Fila k="Notas" v={parto.descripcion ?? "—"} />
        </dl>
        <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
          Para editar o eliminar este parto, ve a la ficha de la madre → Historial.
        </p>
      </Card>

      <Card>
        <SectionTitle>{crias.length === 1 ? "Cría" : "Crías"}</SectionTitle>
        {crias.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Este parto no tiene crías registradas. Puedes agregarlas al editar el parto desde la ficha de la madre.
          </p>
        ) : (
          <ul className="space-y-2">
            {crias.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/animales/${c.id}`}
                  className="flex items-center gap-4 rounded-2xl bg-stone-50 p-3 ring-1 ring-inset ring-stone-900/[0.05] transition-colors hover:bg-stone-100 active:bg-stone-200/70 dark:bg-stone-800/40 dark:ring-white/5 dark:hover:bg-stone-800"
                >
                  <FotoCria cria={c} grande />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-semibold text-stone-800 dark:text-stone-100">
                      {c.nombre ? `${c.nombre} ` : ""}
                      <span className="font-normal text-stone-500 dark:text-stone-400">{etiquetaArete(c)}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {c.sexo ? <SexoBadge sexo={c.sexo} /> : <Badge>Sin sexo</Badge>}
                      <EstadoBadge estado={c.estado} />
                      {c.raza && <Badge>{c.raza}</Badge>}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Nacimiento: {formatearFecha(c.fechaNacimiento)}
                      {c.fechaNacimiento && ` · ${calcularEdad(c.fechaNacimiento, c.estado !== "ACTIVO" ? c.fechaBaja : null)}`}
                    </p>
                  </div>
                  <IconoFlecha className="h-4 w-4 shrink-0 text-stone-300 dark:text-stone-600" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Fila({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-2">
      <dt className="shrink-0 text-stone-500 dark:text-stone-400">{k}</dt>
      <dd className="min-w-0 text-right text-stone-900 [overflow-wrap:anywhere] dark:text-stone-100">{v}</dd>
    </div>
  );
}
