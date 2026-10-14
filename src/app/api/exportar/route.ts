import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SEXO_LABEL, ESTADO_LABEL, MODULO_LABEL } from "@/lib/tipos";
import { ruta, opcion, SEXOS, MODULOS } from "@/lib/validar";
import { listarAnimales } from "@/lib/genealogia";

// GET /api/exportar?sexo=HEMBRA&modulo=LECHERIA&estado=ACTIVOS|BAJAS  -> descarga CSV de los animales.
// Incluye datos basicos + nombres de padre/madre (registrado o externo).

function csvCampo(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  let s = String(valor);
  // Evita inyección de fórmulas: Excel ejecuta celdas que empiezan con = + - @ (o tab/CR).
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  // Escapar comillas y envolver si hay separadores o saltos de linea.
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function fecha(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export const GET = ruta(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const sexo = searchParams.get("sexo") ? opcion(searchParams.get("sexo"), SEXOS, "Sexo") : null;
  const modulo = searchParams.get("modulo") ? opcion(searchParams.get("modulo"), MODULOS, "Módulo") : null;
  // ACTIVOS = solo activos; BAJAS = vendidos y muertos; sin valor = todos (como la lista que se ve).
  const estado = searchParams.get("estado") ? opcion(searchParams.get("estado"), ["ACTIVOS", "BAJAS"] as const, "Estado") : null;

  // Dos consultas en paralelo (un `select` de padre/madre las encadenaría) y sin fotos.
  const [animales, todos] = await Promise.all([
    prisma.animal.findMany({
      where: {
        ...(sexo ? { sexo } : {}),
        ...(modulo ? { modulo } : {}),
        ...(estado === "ACTIVOS" ? { estado: "ACTIVO" } : estado === "BAJAS" ? { estado: { not: "ACTIVO" } } : {}),
      },
      orderBy: { arete: "asc" },
      select: {
        arete: true,
        nombre: true,
        sexo: true,
        raza: true,
        fechaNacimiento: true,
        estado: true,
        modulo: true,
        codigo: true,
        areteCenasa: true,
        esPajilla: true,
        descripcion: true,
        padreId: true,
        madreId: true,
        padreExterno: true,
        madreExterno: true,
      },
    }),
    listarAnimales(),
  ]);
  const porId = new Map(todos.map((a) => [a.id, a]));

  const encabezados = [
    "Arete",
    "Nombre",
    "Sexo",
    "Raza",
    "Fecha de nacimiento",
    "Estado",
    "Modulo",
    "Tipo",
    "Codigo",
    "Arete CENASA",
    "Padre",
    "Madre",
    "Descripcion",
  ];

  // Progenitor registrado "Nombre (#arete)", externo "Texto (externo)" o vacío.
  const progenitor = (idRegistrado: string | null, externo: string | null) => {
    const p = idRegistrado ? porId.get(idRegistrado) : undefined;
    if (p) return p.nombre ? `${p.nombre} (#${p.arete})` : `#${p.arete}`;
    return externo ? `${externo} (externo)` : "";
  };

  const filas = animales.map((a) => {
    const padre = progenitor(a.padreId, a.padreExterno);
    const madre = progenitor(a.madreId, a.madreExterno);

    return [
      a.arete,
      a.nombre ?? "",
      SEXO_LABEL[a.sexo] ?? a.sexo,
      a.raza ?? "",
      fecha(a.fechaNacimiento),
      ESTADO_LABEL[a.estado] ?? a.estado,
      MODULO_LABEL[a.modulo] ?? a.modulo,
      // Toro o pajilla: solo aplica a reproductores.
      a.modulo === "REPRODUCTOR" ? (a.esPajilla ? "Pajilla" : "Toro") : "",
      a.codigo ?? "",
      a.areteCenasa ?? "",
      padre,
      madre,
      a.descripcion ?? "",
    ]
      .map(csvCampo)
      .join(",");
  });

  // BOM para que Excel abra bien los acentos.
  const csv = "\uFEFF" + [encabezados.join(","), ...filas].join("\r\n");

  const nombre =
    (modulo ? modulo.toLowerCase() : sexo === "MACHO" ? "toros" : sexo === "HEMBRA" ? "vacas" : "animales") +
    (estado === "BAJAS" ? "-bajas" : "");
  const fechaHoy = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}-${fechaHoy}.csv"`,
      "Cache-Control": "no-store",
    },
  });
});
