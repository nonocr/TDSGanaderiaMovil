import Link from "next/link";
import { calcularPendientes, PENDIENTE_LABEL, type TipoPendiente } from "@/lib/alertas";
import { conteosTodosModulos } from "@/lib/modulos";
import { Card, SectionTitle, Badge, PageHeader, BotonPrimario, Vacio } from "@/components/ui";
import {
  IconoFlecha,
  IconoVaca,
  IconoPeso,
  IconoLeche,
  IconoToro,
  IconoCheck,
  type IconoProps,
} from "@/components/iconos";
import { formatearFecha } from "@/lib/fechas";
import { etiquetaArete } from "@/lib/tipos";

export const dynamic = "force-dynamic";

function Estadistica({
  valor,
  etiqueta,
  Icono,
  acento,
  href,
}: {
  valor: number;
  etiqueta: string;
  Icono: (p: IconoProps) => React.JSX.Element;
  acento: string;
  href?: string;
}) {
  // Móvil: columna compacta (icono, número, etiqueta) para que quepan en una fila.
  // Escritorio: icono a la izquierda y número grande.
  const contenido = (
    <>
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-14 sm:w-14 sm:rounded-2xl ${acento}`}>
        <Icono className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>
      <div className="text-center sm:text-left">
        <div className="text-2xl font-bold leading-none tracking-tight text-stone-900 sm:text-3xl dark:text-stone-100">
          {valor}
        </div>
        <div className="mt-1 text-xs leading-tight text-stone-500 sm:mt-1.5 sm:text-sm dark:text-stone-400">{etiqueta}</div>
      </div>
    </>
  );

  const clase =
    "flex flex-col items-center gap-2 rounded-xl border border-stone-200/80 bg-white p-3 shadow-card sm:flex-row sm:gap-4 sm:p-5 dark:border-stone-800 dark:bg-stone-900";

  if (href) {
    return (
      <Link
        href={href}
        className={`${clase} transition-colors hover:border-marca-300 hover:bg-marca-50/40 active:bg-marca-50/60 dark:hover:border-marca-700 dark:hover:bg-stone-800/60`}
      >
        {contenido}
      </Link>
    );
  }

  return <div className={clase}>{contenido}</div>;
}

// Color del badge segun el tipo de pendiente.
const TONO_PENDIENTE: Record<TipoPendiente, "verde" | "ambar" | "rojo" | "azul"> = {
  ORDENIO: "azul",
  LISTA_MONTAR: "verde",
  SECADO_PROXIMO: "ambar",
  POR_PARIR: "rojo",
};

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
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-marca-100 text-marca-700 ring-1 ring-marca-200 dark:bg-marca-950 dark:text-marca-300 dark:ring-marca-800">
              <IconoVaca className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">
                Empieza agregando tu primer animal
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-stone-500 dark:text-stone-400">
                Aquí llevarás el registro de tu ganado por módulos: engorde (crías para
                carne), lechería (vacas de leche) y los reproductores. Para comenzar, agrega
                un animal.
              </p>
            </div>
            <BotonPrimario href="/animales/nuevo">+ Agregar primer animal</BotonPrimario>
          </div>
        </Card>
      </div>
    );
  }

  const nombreMes = ahora.toLocaleDateString("es-MX", { month: "long" });

  return (
    <div>
      <PageHeader titulo="Inicio" subtitulo="Un vistazo rápido a tu ganado y lo que viene este mes.">
        {/* En móvil, "Agregar" ya está en la barra inferior. */}
        <span className="hidden lg:inline-flex">
          <BotonPrimario href="/animales/nuevo">+ Agregar animal</BotonPrimario>
        </span>
      </PageHeader>

      {/* Total global */}
      <div className="mb-4">
        <Estadistica
          href="/animales"
          valor={total}
          etiqueta="Animales en total"
          Icono={IconoVaca}
          acento="bg-marca-100 text-marca-700 dark:bg-marca-950 dark:text-marca-300"
        />
      </div>

      {/* Desglose por módulo */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <Estadistica href="/engorde" valor={engorde.total} etiqueta="Engorde" Icono={IconoPeso} acento="bg-marca-100 text-marca-700 dark:bg-marca-950 dark:text-marca-300" />
        <Estadistica href="/lecheria" valor={lecheria.total} etiqueta="Lechería" Icono={IconoLeche} acento="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" />
        <Estadistica href="/reproductores" valor={reproductores.total} etiqueta="Reproductores" Icono={IconoToro} acento="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" />
      </div>

      {inactivos > 0 && (
        <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
          Además hay{" "}
          <Link href="/animales/bajas" className="font-medium text-marca-700 hover:underline dark:text-marca-400">
            {inactivos} {inactivos === 1 ? "animal dado de baja" : "animales dados de baja"}
          </Link>{" "}
          (vendidos o muertos), no contados en los totales.
        </p>
      )}

      {/* Pendientes del mes actual */}
      <div className="mt-6">
        <Card>
          <SectionTitle>Pendientes de {nombreMes}</SectionTitle>
          {pendientes.length === 0 ? (
            <Vacio icono={<IconoCheck className="h-6 w-6" />} mensaje={`No hay pendientes para ${nombreMes}. Todo al día este mes.`} />
          ) : (
            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {pendientes.map((p) => (
                <li key={`${p.tipo}-${p.animalId}`}>
                  <Link
                    href={`/animales/${p.animalId}`}
                    className="-mx-2 flex items-center gap-2 rounded-lg px-2 py-3 transition-colors hover:bg-stone-50 active:bg-stone-100 dark:hover:bg-stone-800/50 dark:active:bg-stone-800"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-semibold text-stone-800 dark:text-stone-100">
                          {p.nombre ?? etiquetaArete(p)}
                          {p.nombre && (
                            <span className="ml-1 font-normal text-stone-500 dark:text-stone-400">{etiquetaArete(p)}</span>
                          )}
                        </span>
                        <span className="shrink-0 whitespace-nowrap text-xs text-stone-500 dark:text-stone-400">
                          {formatearFecha(p.fecha)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Badge tono={TONO_PENDIENTE[p.tipo]} punto>
                          {PENDIENTE_LABEL[p.tipo]}
                        </Badge>
                        <span className="text-sm text-stone-500 dark:text-stone-400">{p.mensaje}</span>
                      </div>
                    </div>
                    <IconoFlecha className="h-4 w-4 shrink-0 text-stone-300 dark:text-stone-600" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 border-t border-stone-100 pt-3 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
            Solo se muestran los pendientes de este mes. Para ver lo que viene más adelante,
            usa el{" "}
            <Link href="/calendario" className="font-medium text-marca-700 hover:underline dark:text-marca-400">
              calendario
            </Link>
            .
          </p>
        </Card>
      </div>
    </div>
  );
}
