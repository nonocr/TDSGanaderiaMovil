import { prisma } from "@/lib/prisma";
import { cargarVacasConCiclo } from "@/lib/alertas";
import { etapaPorEdad, situacionReproductivaVaca } from "@/lib/estado";
import { ETAPAS_ORDEN } from "@/lib/tipos";

// Conteos y desgloses por módulo. Pensado para las páginas de Engorde / Lechería y la Home.
// Todo se calcula a partir de pocas consultas planas en paralelo (la base está en la nube).

export type ConteosModulo = {
  total: number; // animales ACTIVOS del módulo
  machos: number;
  hembras: number;
  inactivos: number; // vendidos/muertos del módulo (no cuentan en total)
};

type Grupo = { sexo: string; estado: string; _count: { _all: number } };

function sumarConteos(grupos: Grupo[]): ConteosModulo {
  const sum = (f: (g: Grupo) => boolean) => grupos.filter(f).reduce((n, g) => n + g._count._all, 0);
  return {
    total: sum((g) => g.estado === "ACTIVO"),
    machos: sum((g) => g.estado === "ACTIVO" && g.sexo === "MACHO"),
    hembras: sum((g) => g.estado === "ACTIVO" && g.sexo === "HEMBRA"),
    inactivos: sum((g) => g.estado !== "ACTIVO"),
  };
}

// Conteo básico (total/machos/hembras/inactivos) de un módulo, con un solo groupBy.
export async function conteosModulo(modulo: string): Promise<ConteosModulo> {
  const grupos = await prisma.animal.groupBy({
    by: ["sexo", "estado"],
    where: { modulo },
    _count: { _all: true },
  });
  return sumarConteos(grupos);
}

// Conteos de LOS TRES módulos con un solo groupBy (para Inicio).
export async function conteosTodosModulos(): Promise<Record<"ENGORDE" | "LECHERIA" | "REPRODUCTOR", ConteosModulo>> {
  const grupos = await prisma.animal.groupBy({
    by: ["modulo", "sexo", "estado"],
    _count: { _all: true },
  });
  const de = (m: string) => sumarConteos(grupos.filter((g) => g.modulo === m));
  return { ENGORDE: de("ENGORDE"), LECHERIA: de("LECHERIA"), REPRODUCTOR: de("REPRODUCTOR") };
}

// --- ENGORDE: desglose por etapa actual ------------------------------------
// Cuenta cuántos animales ACTIVOS de engorde están en cada etapa según su EDAD (y cuántos no
// tienen fecha de nacimiento, que no se pueden ubicar: "SIN_ETAPA").
export async function desgloseEtapasEngorde(hoy: Date = new Date()): Promise<Record<string, number>> {
  const animales = await prisma.animal.findMany({
    where: { modulo: "ENGORDE", estado: "ACTIVO" },
    select: { fechaNacimiento: true },
  });

  const conteo: Record<string, number> = { SIN_ETAPA: 0 };
  for (const et of ETAPAS_ORDEN) conteo[et] = 0;

  for (const a of animales) {
    const clave = etapaPorEdad(a.fechaNacimiento, hoy) ?? "SIN_ETAPA";
    conteo[clave] = (conteo[clave] ?? 0) + 1;
  }
  return conteo;
}

// --- LECHERÍA: desglose por estado reproductivo ----------------------------
// Las vacas (y sus montas/partos) vienen del mismo cargador que los pendientes, pero solo lechería.
// Un cambio manual vigente manda sobre el cálculo automático.
export async function desgloseReproLecheria(
  hoy: Date = new Date()
): Promise<Record<string, number>> {
  const [vacas, cambios] = await Promise.all([
    cargarVacasConCiclo("LECHERIA"),
    prisma.cambioEstadoReproductivo.findMany({
      where: { vaca: { modulo: "LECHERIA", sexo: "HEMBRA", estado: "ACTIVO" } },
      select: { vacaId: true, fecha: true, estadoNuevo: true },
    }),
  ]);
  const cambiosPor = new Map<string, { fecha: Date; estadoNuevo: string | null }[]>();
  for (const c of cambios) cambiosPor.set(c.vacaId, [...(cambiosPor.get(c.vacaId) ?? []), c]);
  const conteo: Record<string, number> = {
    ORDENIO: 0,
    SECADO: 0,
    POR_PARIR: 0,
    POSPARTO: 0,
    LISTA_MONTAR: 0,
    SIN_CICLO: 0,
  };
  for (const v of vacas) {
    const { estado } = situacionReproductivaVaca(v.montasComoVaca, v.partosComoVaca, hoy, cambiosPor.get(v.id));
    const clave = estado ?? "SIN_CICLO";
    conteo[clave] = (conteo[clave] ?? 0) + 1;
  }
  return conteo;
}
