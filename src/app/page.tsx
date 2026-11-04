import Link from "next/link";
import { calcularPendientes, PENDIENTE_LABEL, type Pendiente, type TipoPendiente } from "@/lib/alertas";
import { conteosTodosModulos } from "@/lib/modulos";
import { Card, SectionTitle, Badge, PageHeader, BotonPrimario, Vacio, claseSuperficie, TONO_REPRO, type Tono } from "@/components/ui";
import {
  IconoFlecha,
  IconoVaca,
  IconoPeso,
  IconoLeche,
  IconoToro,
  IconoCheck,
  IconoMas,
  IconoCalendario,
  type Icono,
} from "@/components/iconos";
import { formatearFecha } from "@/lib/fechas";
import { etiquetaArete } from "@/lib/tipos";

export const dynamic = "force-dynamic";

// Tono de cada pendiente (mismo significado de color que en toda la app, ver ui.tsx).
// Un parto estimado ya vencido es lo único en rojo: falta registrarlo. El secado es ámbar solo
// mientras está por llegar; una vaca que ya está secándose va en neutro, como "En secado" en
// la lista de lechería y en la ficha (TONO_REPRO).
function tonoPendiente(p: Pendiente): Tono {
  const tonos: Record<TipoPendiente, Tono> = {
    ORDENIO: "azul",
    LISTA_MONTAR: "verde",
    SECADO_PROXIMO: "ambar",
    POR_PARIR: "ambar",
  };
  if (p.tipo === "POR_PARIR" && p.diasRestantes < 0) return "rojo";
  if (p.tipo === "SECADO_PROXIMO" && p.diasRestantes <= 0) return TONO_REPRO.SECADO;
  return tonos[p.tipo];
}

export default async function HomePage() {
  // En paralelo: conteos de los tres módulos (un solo groupBy) + pendientes.
  const [conteos, pendientesTodos] = await Promise.all([conteosTodosModulos(), calcularPendientes()]);
  const { ENGORDE: engorde, LECHERIA: lecheria, REPRODUCTOR: reproductores } = conteos;

  const total = engorde.total + lecheria.total + reproductores.total;
  const inactivos = engorde.inactivos + lecheria.inactivos + reproductores.inactivos;

  // Pendientes del mes actual (lo más futuro se consulta en el calendario), más los partos
  // estimados ya VENCIDOS de meses anteriores: falta registrar el parto y no saldrían en
  // ningún otro aviso. Mes en UTC, como se guardan y se muestran las fechas (formatearFecha).
  const ahora = new Date();
  const anio = ahora.getUTCFullYear();
  const mes = ahora.getUTCMonth();
  const pendientes = pendientesTodos.filter((p) => {
    const f = new Date(p.fecha);
    const delMes = f.getUTCFullYear() === anio && f.getUTCMonth() === mes;
    return delMes || (p.tipo === "POR_PARIR" && p.diasRestantes < 0);
  });

  // Base completamente vacía: pantalla de bienvenida para orientar al usuario nuevo.
  if (total === 0 && inactivos === 0) {
    return (
      <div>
        <PageHeader titulo="Inicio" subtitulo="Bienvenido a TDS Ganadería." />
        <Card>
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-marca-100 text-marca-700 dark:bg-marca-950 dark:text-marca-300">
              <IconoVaca className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                Empieza agregando tu primer animal
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-stone-600 dark:text-stone-400">
                Aquí llevarás el registro de tu ganado por módulos: engorde (crías para
                carne), lechería (vacas de leche) y los reproductores. Para comenzar, agrega
                un animal.
              </p>
            </div>
            <BotonPrimario href="/animales/nuevo" icono={<IconoMas className="h-[18px] w-[18px]" strokeWidth={2.2} />}>
              Agregar primer animal
            </BotonPrimario>
          </div>
        </Card>
      </div>
    );
  }

  const nombreMes = ahora.toLocaleDateString("es-MX", { month: "long", timeZone: "UTC" });
  const atrasados = pendientes.filter((p) => tonoPendiente(p) === "rojo").length;

  const modulos: { href: string; etiqueta: string; valor: number; Icono: Icono }[] = [
    { href: "/engorde", etiqueta: "Engorde", valor: engorde.total, Icono: IconoPeso },
    { href: "/lecheria", etiqueta: "Lechería", valor: lecheria.total, Icono: IconoLeche },
    { href: "/reproductores", etiqueta: "Reproductores", valor: reproductores.total, Icono: IconoToro },
  ];

  return (
    <div>
      <PageHeader
        titulo="Inicio"
        subtitulo={`${total} ${total === 1 ? "animal activo" : "animales activos"} en la finca.`}
      >
        {/* En móvil, "Agregar" ya está en la barra inferior. */}
        <span className="hidden lg:inline-flex">
          <BotonPrimario href="/animales/nuevo" icono={<IconoMas className="h-[18px] w-[18px]" strokeWidth={2.2} />}>
            Agregar animal
          </BotonPrimario>
        </span>
      </PageHeader>

      {/* Móvil: módulos (compactos) arriba y pendientes debajo, a la vista sin desplazar.
          Escritorio: pendientes a la izquierda (lo que se atiende) y módulos en una columna. */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-6">
        <section aria-labelledby="titulo-modulos" className="lg:order-2">
          <h2 id="titulo-modulos" className="sr-only">
            Ganado por módulo
          </h2>
          <div className={`${claseSuperficie} overflow-hidden`}>
            <ul className="grid grid-cols-3 divide-x divide-stone-100 lg:grid-cols-1 lg:divide-x-0 lg:divide-y dark:divide-stone-800">
              {modulos.map((m) => (
                <li key={m.href}>
                  <Link
                    href={m.href}
                    className="group flex h-full flex-col items-center gap-1.5 px-2 py-4 text-center transition-colors hover:bg-stone-50 active:bg-stone-100 lg:flex-row lg:gap-3 lg:px-4 lg:py-3.5 lg:text-left dark:hover:bg-stone-800/60 dark:active:bg-stone-800"
                  >
                    {/* Neutro: el icono distingue el módulo; el verde queda para acciones y lo activo. */}
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-700 transition-colors group-hover:bg-stone-200/70 dark:bg-stone-800 dark:text-stone-300">
                      <m.Icono className="h-5 w-5" />
                    </span>
                    <span className="text-2xl font-bold leading-none tracking-tight text-stone-900 lg:order-last lg:ml-auto lg:text-xl dark:text-stone-50">
                      {m.valor}
                    </span>
                    <span className="text-xs font-medium leading-tight text-stone-600 lg:text-sm dark:text-stone-400">
                      {m.etiqueta}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/animales"
              className="flex min-h-11 items-center justify-between gap-2 border-t border-stone-100 px-4 py-2.5 text-sm font-medium text-marca-700 transition-colors hover:bg-stone-50 active:bg-stone-100 dark:border-stone-800 dark:text-marca-400 dark:hover:bg-stone-800/60"
            >
              Todos los animales
              <span className="flex items-center gap-1 text-stone-500 dark:text-stone-400">
                {total}
                <IconoFlecha className="h-4 w-4" />
              </span>
            </Link>
            {/* Vendidos y muertos: no cuentan en los totales; una fila más del bloque (antes era un
                párrafo que empujaba los pendientes hacia abajo en el celular). */}
            {inactivos > 0 && (
              <Link
                href="/animales/bajas"
                className="flex min-h-11 items-center justify-between gap-2 border-t border-stone-100 px-4 py-2.5 text-sm text-stone-600 transition-colors hover:bg-stone-50 active:bg-stone-100 dark:border-stone-800 dark:text-stone-400 dark:hover:bg-stone-800/60"
              >
                <span>
                  Dados de baja <span className="text-stone-500 dark:text-stone-400">· no cuentan en los totales</span>
                </span>
                <span className="flex items-center gap-1 text-stone-500 dark:text-stone-400">
                  {inactivos}
                  <IconoFlecha className="h-4 w-4" />
                </span>
              </Link>
            )}
          </div>
        </section>

        {/* Pendientes del mes actual */}
        <Card className="lg:order-1">
          <SectionTitle
            conteo={pendientes.length}
            accion={
              <Link
                href="/calendario"
                className="-mr-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-medium text-marca-700 hover:bg-marca-50 active:bg-marca-100 dark:text-marca-400 dark:hover:bg-marca-950"
              >
                <IconoCalendario className="h-4 w-4" />
                Calendario
              </Link>
            }
          >
            Pendientes de {nombreMes}
          </SectionTitle>
          {atrasados > 0 && (
            <p className="-mt-1 mb-2 text-sm font-medium text-red-700 dark:text-red-400">
              {atrasados === 1
                ? "1 parto estimado ya pasó y falta registrarlo."
                : `${atrasados} partos estimados ya pasaron y falta registrarlos.`}
            </p>
          )}
          {pendientes.length === 0 ? (
            <Vacio icono={<IconoCheck className="h-6 w-6" />} mensaje={`No hay pendientes para ${nombreMes}. Todo al día este mes.`} />
          ) : (
            <ul className="-mx-2 divide-y divide-stone-100 dark:divide-stone-800">
              {pendientes.map((p) => {
                const tono = tonoPendiente(p);
                return (
                  <li key={`${p.tipo}-${p.animalId}`}>
                    <Link
                      href={`/animales/${p.animalId}`}
                      className="flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-stone-50 active:bg-stone-100 dark:hover:bg-stone-800/50 dark:active:bg-stone-800"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="truncate font-semibold text-stone-900 dark:text-stone-50">
                            {p.nombre ?? etiquetaArete(p)}
                            {p.nombre && (
                              <span className="ml-1.5 font-normal text-stone-500 dark:text-stone-400">{etiquetaArete(p)}</span>
                            )}
                          </span>
                          <span
                            className={
                              "shrink-0 whitespace-nowrap text-xs " +
                              (tono === "rojo" ? "font-semibold text-red-700 dark:text-red-400" : "text-stone-500 dark:text-stone-400")
                            }
                          >
                            {formatearFecha(p.fecha)}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Badge tono={tono} punto>
                            {PENDIENTE_LABEL[p.tipo]}
                          </Badge>
                          <span className="text-sm text-stone-600 dark:text-stone-400">{p.mensaje}</span>
                        </div>
                      </div>
                      <IconoFlecha className="h-4 w-4 shrink-0 text-stone-400 dark:text-stone-600" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 border-t border-stone-100 pt-3 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
            Solo se muestran los pendientes de este mes y los partos atrasados. Lo que viene más
            adelante está en el calendario.
          </p>
        </Card>
      </div>
    </div>
  );
}
