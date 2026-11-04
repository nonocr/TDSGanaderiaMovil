import Link from "next/link";
import { ListaAnimales } from "@/components/ListaAnimales";
import { AvisoBajas } from "@/components/AvisoBajas";
import { DesgloseGrid, type Celda } from "@/components/ResumenConteos";
import { ACENTO, TONO_REPRO, claseSuperficie } from "@/components/ui";
import { conteosModulo, desgloseReproLecheria } from "@/lib/modulos";
import { ESTADO_REPRO_LABEL } from "@/lib/estado";
import {
  IconoLeche,
  IconoSecado,
  IconoReloj,
  IconoCorazon,
  IconoVaca,
  IconoGrafica,
  IconoFlecha,
} from "@/components/iconos";

export const dynamic = "force-dynamic";

// Desglose por estado reproductivo. Cada estado con el MISMO color que su etiqueta en la lista y
// en la ficha (TONO_REPRO en ui.tsx).
const REPRO_CELDA = [
  { clave: "ORDENIO", etiqueta: ESTADO_REPRO_LABEL.ORDENIO, Icono: IconoLeche },
  { clave: "SECADO", etiqueta: ESTADO_REPRO_LABEL.SECADO, Icono: IconoSecado },
  { clave: "POR_PARIR", etiqueta: ESTADO_REPRO_LABEL.POR_PARIR, Icono: IconoReloj },
  { clave: "LISTA_MONTAR", etiqueta: ESTADO_REPRO_LABEL.LISTA_MONTAR, Icono: IconoCorazon },
  { clave: "SIN_CICLO", etiqueta: "Sin ciclo", Icono: IconoVaca },
] as const;

export default async function LecheriaPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; q?: string }>;
}) {
  const { filtro, q } = await searchParams;

  // Conteos y lista EN PARALELO (ver engorde/page.tsx): la página no espera los conteos.
  const conteos = conteosModulo("LECHERIA");
  const repro = desgloseReproLecheria();

  return (
    <div className="space-y-6">
      <ListaAnimales
        modulo="LECHERIA"
        titulo="Lechería"
        filtro={filtro}
        q={q}
        basePath="/lecheria"
        soloActivos
        agregarModulo="LECHERIA"
        resumen={
          <>
            <Resumen repro={repro} />
            <Link
              href="/leche"
              className={`${claseSuperficie} group flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-stone-50 active:bg-stone-100 dark:hover:bg-stone-800/70`}
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${ACENTO.azul}`}>
                <IconoGrafica className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-stone-900 dark:text-stone-50">Producción de leche</span>
                <span className="block text-xs text-stone-600 dark:text-stone-400">Litros por día del hato y por vaca</span>
              </span>
              <IconoFlecha className="h-4 w-4 text-stone-400 transition-transform duration-150 group-hover:translate-x-0.5 dark:text-stone-500" />
            </Link>
          </>
        }
      />
      <AvisoBajas cantidad={conteos.then((c) => c.inactivos)} href="/lecheria/bajas" femenino />
    </div>
  );
}

async function Resumen({ repro: reproP }: { repro: Promise<Record<string, number>> }) {
  const repro = await reproP;

  const reproCeldas: Celda[] = REPRO_CELDA.map((e) => ({
    clave: e.clave,
    valor: repro[e.clave] ?? 0,
    etiqueta: e.etiqueta,
    Icono: e.Icono,
    acento: ACENTO[TONO_REPRO[e.clave] ?? "neutral"],
    // "Sin ciclo" no tiene filtro propio en la lista: celda estática.
    href: e.clave === "SIN_CICLO" ? undefined : `/lecheria?filtro=${e.clave}`,
  }));

  return (
    <DesgloseGrid
      titulo="Por estado reproductivo"
      celdas={reproCeldas}
      nota='Estado derivado del ciclo de cada vaca, o el fijado a mano en su ficha. "Sin ciclo" son vacas sin montas registradas.'
    />
  );
}
