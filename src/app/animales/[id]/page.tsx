import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ANIMAL_SIN_FOTO } from "@/lib/validar";
import { Card, SectionTitle, EstadoBadge, SexoBadge, AnimalLink, Badge } from "@/components/ui";
import { formatearFecha, calcularEdad } from "@/lib/fechas";
import { SEXO_LABEL, ETAPA_LABEL, MODULO_LABEL, CATEGORIA_LABEL, etiquetaArete } from "@/lib/tipos";
import {
  etapaDeAnimal,
  iniciosEtapasEdad,
  situacionReproductivaVaca,
  etiquetaEstadoRepro,
  type EstadoReproductivo,
} from "@/lib/estado";
import {
  obtenerAscendencia,
  obtenerHijos,
  obtenerHermanos,
  obtenerArbol,
  listarAnimales,
  datosCrias,
  opcionesToro,
  type Progenitor,
} from "@/lib/genealogia";
import { ArbolGenealogico } from "@/components/ArbolGenealogico";
import { IconoVaca } from "@/components/iconos";
import { PanelRegistro } from "./PanelRegistro";
import { AccionesAnimal } from "./AccionesAnimal";
import { HistorialEventos } from "./HistorialEventos";
import { AccionesEtapa } from "./AccionesEtapa";
import { FotoAnimal } from "./FotoAnimal";
import { IconoAtras, IconoFlecha } from "@/components/iconos";
import { GraficaPesoDiferida } from "./GraficaPesoDiferida";
import { FichaTabs } from "./FichaTabs";
import { ProduccionLecheVaca } from "./ProduccionLecheVaca";
import { EtapaAutomatica } from "./EtapaAutomatica";
import { EstadoReproductivoManual } from "./EstadoReproductivoManual";
import { ResumenPartos, type PartoResumen } from "./ResumenPartos";

export const dynamic = "force-dynamic";

type EventoFila = {
  id?: string;
  fecha: Date;
  tipo: string;
  detalle: string;
  // Datos para la edicion inline (segun el tipo). Opcionales.
  editable?: boolean;
  cantidad?: number;
  turno?: string | null;
  pesoKg?: number;
  descripcion?: string | null;
  toroId?: string | null;
  notas?: string | null;
  // Solo partos de la vaca: crías actuales (se pueden cambiar al editar).
  crias?: { id: string; arete: string; nombre: string | null; sinArete: boolean; areteCenasa: string | null }[];
  // Página de detalle (partos).
  href?: string;
};

function TextoProgenitor({ p }: { p: Progenitor }) {
  if (p.tipo === "registrado") return <AnimalLink animal={p.animal} />;
  if (p.tipo === "externo") return <span className="text-stone-600 dark:text-stone-300">{p.texto} <span className="text-xs text-stone-500 dark:text-stone-400">(externo)</span></span>;
  return <span className="text-stone-500 dark:text-stone-400">—</span>;
}

export default async function AnimalDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Todo se pide EN PARALELO (la base está en la nube: cada consulta encadenada suma
  // una ida y vuelta). De los animales relacionados solo se piden los campos que se
  // muestran, nunca la foto (puede pesar MB).
  // Lo que manda en el tiempo es la cadena MÁS LARGA de consultas (cada `include` espera a
  // la anterior). Por eso todo se pide "plano" y en paralelo, y los nombres del toro/vaca
  // se completan con la lista de animales que ya carga la genealogía (una sola lectura
  // compartida, ver `cache` en src/lib/genealogia.ts). Nunca se traen fotos de relacionados.
  const [
    base,
    montas,
    partos,
    crias,
    registrosLeche,
    registrosPeso,
    etapas,
    ascendencia,
    hijos,
    hermanos,
    arbol,
    todos,
    datosDeCrias,
    criasEnPartos,
    palpaciones,
    cambiosEstado,
    fotosCrias,
  ] = await Promise.all([
    prisma.animal.findUnique({ where: { id }, select: ANIMAL_SIN_FOTO }),
    prisma.monta.findMany({ where: { OR: [{ vacaId: id }, { toroId: id }] }, orderBy: { fecha: "desc" } }),
    prisma.parto.findMany({ where: { OR: [{ vacaId: id }, { toroId: id }] }, orderBy: { fecha: "desc" } }),
    prisma.cria.findMany({ where: { parto: { vacaId: id } }, select: { id: true, partoId: true, criaId: true } }),
    prisma.registroLeche.findMany({ where: { vacaId: id }, orderBy: { fecha: "desc" } }),
    prisma.registroPeso.findMany({ where: { animalId: id }, orderBy: { fecha: "desc" } }),
    prisma.etapaTernero.findMany({ where: { animalId: id }, orderBy: { fechaInicio: "desc" } }),
    obtenerAscendencia(id),
    obtenerHijos(id),
    obtenerHermanos(id),
    obtenerArbol(id),
    listarAnimales(), // nombres de relacionados + selectores de toro, vaca y crías
    datosCrias(), // misma lectura (cache): fecha y toro propuestos del parto al marcar una cría
    prisma.cria.findMany({ select: { criaId: true } }), // crías ya vinculadas a cualquier parto
    prisma.palpacion.findMany({ where: { vacaId: id }, orderBy: { fecha: "desc" } }),
    prisma.cambioEstadoReproductivo.findMany({ where: { vacaId: id }, orderBy: { fecha: "desc" } }),
    // Miniaturas y sexo de las crías de sus partos (para el historial de partos).
    prisma.animal.findMany({
      where: { nacidoEnParto: { some: { parto: { vacaId: id } } } },
      select: { id: true, sexo: true, fotoMiniatura: true },
    }),
  ]);

  if (!base) notFound();

  const porId = new Map(todos.map((a) => [a.id, a]));
  const desconocido = { id: "", arete: "?", nombre: null as string | null, sexo: "" };
  const animalDe = (aid: string) => porId.get(aid) ?? desconocido;

  const montasComoVaca = montas.filter((m) => m.vacaId === id).map((m) => ({ ...m, toro: animalDe(m.toroId) }));
  const montasComoToro = montas.filter((m) => m.toroId === id).map((m) => ({ ...m, vaca: animalDe(m.vacaId) }));
  const partosComoVaca = partos
    .filter((p) => p.vacaId === id)
    .map((p) => ({
      ...p,
      toro: p.toroId ? animalDe(p.toroId) : null,
      crias: crias.filter((c) => c.partoId === p.id),
    }));
  const partosComoToro = partos.filter((p) => p.toroId === id).map((p) => ({ ...p, vaca: animalDe(p.vacaId) }));

  const animal = {
    ...base,
    montasComoVaca,
    montasComoToro,
    partosComoVaca,
    partosComoToro,
    registrosLeche,
    registrosPeso,
    etapas,
  };

  const sinSexo = ({ id, arete, nombre, sinArete, areteCenasa }: (typeof todos)[number]) =>
    ({ id, arete, nombre, sinArete, areteCenasa });
  // Toro / padre: solo reproductores. Para editar registros ya hechos, el toro que tenían sigue en
  // la lista aunque no sea reproductor (así no se pierde la relación al guardar).
  const toros = opcionesToro(todos);
  const torosEdicion = opcionesToro(todos, [...montas.map((m) => m.toroId), ...partos.map((p) => p.toroId)]);
  const vacas = todos.filter((a) => a.sexo === "HEMBRA").map(sinSexo);
  // Una cría tiene una sola madre: no se ofrecen los animales que ya están en algún parto ni los
  // que tienen otra madre (registrada o externa). La API lo valida igual (409).
  const enAlgunParto = new Set(criasEnPartos.map((c) => c.criaId));
  const posiblesCrias = todos
    .filter((a) => {
      if (a.id === id || enAlgunParto.has(a.id)) return false;
      const d = datosDeCrias.get(a.id);
      return !d || (d.madreId ? d.madreId === id : !d.madreExterna);
    })
    .map((a) => ({
      ...sinSexo(a),
      fechaNacimiento: datosDeCrias.get(a.id)?.fechaNacimiento ?? null,
      padreId: datosDeCrias.get(a.id)?.padreId ?? null,
    }));
  // Parto: se sugieren primero los hijos registrados de esta vaca (los que tienen a esta vaca
  // como madre) que aún no están en ninguno de sus partos; los más recientes primero.
  const yaEnParto = new Set(crias.map((c) => c.criaId));
  const criasSugeridas = hijos.filter((h) => !yaEnParto.has(h.id)).reverse().map((h) => h.id);

  // --- Construir historial unificado ordenado por fecha desc ---
  const eventos: EventoFila[] = [];
  if (animal.fechaNacimiento)
    eventos.push({ fecha: animal.fechaNacimiento, tipo: "Nacimiento", detalle: "" });
  for (const m of animal.montasComoVaca)
    eventos.push({
      id: m.id,
      fecha: m.fecha,
      tipo: "Monta",
      detalle:
        `${m.inseminacion ? "inseminada" : "montada"} por ${m.toro.nombre ?? etiquetaArete(m.toro)}` +
        (m.inseminacion ? " (pajilla)" : "") +
        // Palpación anotada en la monta (registros anteriores a la palpación propia): se conserva.
        (m.prenezConfirmada
          ? ` · preñez confirmada${m.fechaConfirmacion ? ` (${formatearFecha(m.fechaConfirmacion)})` : ""}`
          : ""),
      editable: true,
      toroId: m.toroId,
      notas: m.notas,
    });
  for (const m of animal.montasComoToro)
    eventos.push({
      id: m.id,
      fecha: m.fecha,
      tipo: "Monta",
      detalle:
        `${m.inseminacion ? "inseminó a" : "montó a"} ${m.vaca.nombre ?? etiquetaArete(m.vaca)}` +
        (m.inseminacion ? " (pajilla)" : "") +
        (m.prenezConfirmada ? " · preñez confirmada" : ""),
      // Desde el toro no se edita el toro mismo; solo fecha y notas.
      editable: true,
      notas: m.notas,
    });
  for (const p of animal.partosComoVaca)
  {
    // Detalle del parto: crías + datos del nacimiento (sano, ayuda, peso) + notas.
    const extras: string[] = [];
    if (p.criaSana === true) extras.push("nació sana");
    if (p.criaSana === false) extras.push("nació con problemas");
    if (p.necesitoAyuda === true) extras.push("necesitó ayuda");
    if (p.necesitoAyuda === false) extras.push("sin ayuda");
    if (p.pesoNacimientoKg != null) extras.push(`${p.pesoNacimientoKg} kg al nacer`);
    if (p.descripcion) extras.push(p.descripcion);
    eventos.push({
      id: p.id,
      fecha: p.fecha,
      tipo: "Parto",
      detalle: `${p.crias.length} cría(s)${extras.length ? " · " + extras.join(" · ") : ""}`,
      editable: true,
      toroId: p.toroId,
      descripcion: p.descripcion,
      crias: p.crias.flatMap((c) => {
        const a = porId.get(c.criaId);
        return a ? [sinSexo(a)] : [];
      }),
      href: `/partos/${p.id}`,
    });
  }
  for (const p of animal.partosComoToro)
    eventos.push({
      id: p.id,
      fecha: p.fecha,
      tipo: "Parto",
      detalle: `padre · parto de ${p.vaca.nombre ?? etiquetaArete(p.vaca)}`,
      // Vista desde el toro: no editable aqui (se edita desde la vaca).
      href: `/partos/${p.id}`,
    });
  for (const p of palpaciones)
    eventos.push({ id: p.id, fecha: p.fecha, tipo: "Palpación", detalle: "revisión por palpación", editable: true, notas: p.notas });
  for (const c of cambiosEstado)
    eventos.push({
      fecha: c.fecha,
      tipo: "Estado",
      detalle:
        `${etiquetaEstadoRepro(c.estadoAnterior as EstadoReproductivo) ?? "Sin estado"} → ` +
        (c.estadoNuevo ? etiquetaEstadoRepro(c.estadoNuevo as EstadoReproductivo) : "cálculo automático") +
        " (cambio manual)",
      notas: c.descripcion,
    });
  for (const r of animal.registrosLeche)
    eventos.push({
      id: r.id,
      fecha: r.fecha,
      tipo: "Leche",
      detalle: `${r.cantidad} L${r.turno === "MANANA" ? " · mañana" : r.turno === "TARDE" ? " · tarde" : ""}`,
      editable: true,
      cantidad: r.cantidad,
      turno: r.turno,
      notas: r.notas,
    });
  for (const r of animal.registrosPeso)
    eventos.push({
      id: r.id,
      fecha: r.fecha,
      tipo: "Peso",
      detalle: `${r.pesoKg} kg`,
      editable: true,
      pesoKg: r.pesoKg,
      notas: r.notas,
    });
  for (const et of animal.etapas)
    eventos.push({ fecha: et.fechaInicio, tipo: "Etapa", detalle: ETAPA_LABEL[et.etapa] ?? et.etapa });

  eventos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  const padreTexto: Progenitor =
    animal.padreId && ascendencia[0]
      ? ascendencia[0].progenitor
      : animal.padreExterno
      ? { tipo: "externo", texto: animal.padreExterno }
      : { tipo: "desconocido" };
  const madreTexto: Progenitor =
    animal.madreId && ascendencia[1]
      ? ascendencia[1].progenitor
      : animal.madreExterno
      ? { tipo: "externo", texto: animal.madreExterno }
      : { tipo: "desconocido" };

  const identAnimal = etiquetaArete(animal);
  const etiquetaAnimal = animal.nombre
    ? `${animal.nombre} (${identAnimal})`
    : identAnimal;

  // Etapas en orden cronologico ascendente para leerlas como linea de vida.
  const etapasOrdenadas = [...animal.etapas].sort(
    (a, b) => a.fechaInicio.getTime() - b.fechaInicio.getTime()
  );

  // Situacion actual DERIVADA (A18): etapa (en engorde, por la edad) o estado reproductivo de la vaca.
  const esEngorde = animal.modulo === "ENGORDE";
  const esLecheria = animal.modulo === "LECHERIA";
  const esVacaLeche = esLecheria && animal.sexo === "HEMBRA";
  const hoy = new Date();
  const etapaActual = etapaDeAnimal(animal, animal.etapas, hoy);
  const iniciosEtapas = esEngorde ? iniciosEtapasEdad(animal.fechaNacimiento) : null;
  // La situación reproductiva solo tiene sentido para vacas de lechería. Un cambio manual vigente manda.
  const situacionVaca = esVacaLeche
    ? situacionReproductivaVaca(animal.montasComoVaca, animal.partosComoVaca, hoy, cambiosEstado)
    : { estado: null, partoEstimado: null, manual: false, listaParaMontar: false };

  // Palpaciones anteriores: las propias y las que se anotaban en la monta (registros viejos).
  const palpacionesPrevias = [
    ...palpaciones.map((p) => ({ fecha: p.fecha, notas: p.notas, enMonta: false })),
    ...animal.montasComoVaca
      .filter((m) => m.prenezConfirmada)
      .map((m) => ({ fecha: m.fechaConfirmacion ?? m.fecha, notas: "Preñez confirmada", enMonta: true })),
  ]
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
    .map((p) => ({ fechaISO: p.fecha.toISOString(), notas: p.notas, enMonta: p.enMonta }));

  // Historial de partos con sus crías (sexo y foto de la ficha de cada cría, sin duplicar datos).
  const fotoPorId = new Map(fotosCrias.map((f) => [f.id, f]));
  const partosResumen: PartoResumen[] = animal.partosComoVaca.map((p) => ({
    id: p.id,
    fechaISO: p.fecha.toISOString(),
    toro: p.toro ? p.toro.nombre ?? etiquetaArete(p.toro) : null,
    crias: p.crias.flatMap((c) => {
      const a = porId.get(c.criaId);
      if (!a) return [];
      const f = fotoPorId.get(c.criaId);
      return [{ ...sinSexo(a), sexo: f?.sexo ?? a.sexo ?? null, fotoMiniatura: f?.fotoMiniatura ?? null }];
    }),
  }));
  const situacionTexto = etapaActual
    ? ETAPA_LABEL[etapaActual] ?? etapaActual
    : etiquetaEstadoRepro(situacionVaca.estado);

  return (
    // `gap` (no `space-y`) para que la cabecera de impresión oculta no deje un hueco arriba.
    <div className="flex flex-col gap-5">
      {/* Cabecera visible SOLO al imprimir: identifica el reporte, con color de marca. */}
      <div className="hidden print:mb-4 print:flex print:items-center print:justify-between print:gap-3 print:rounded-lg print:bg-marca-600 print:px-4 print:py-3 print:text-white">
        <span className="flex items-center gap-2 text-base font-bold">
          <IconoVaca className="h-5 w-5" /> TDS Ganadería
        </span>
        <span className="text-right text-xs text-marca-50">
          Ficha del animal
          <br />
          Impreso el {formatearFecha(new Date())}
        </span>
      </div>

      <div>
        <Link
          href="/animales"
          className="no-print -ml-1 mb-2 inline-flex items-center gap-0.5 rounded-lg py-1.5 pl-1 pr-2 text-sm text-stone-500 hover:text-marca-700 active:bg-stone-200/60 dark:text-stone-400 dark:hover:text-marca-400"
        >
          <IconoAtras className="h-4 w-4" />
          Animales
        </Link>
        <div className="flex flex-col gap-4 rounded-xl border border-stone-200/80 bg-white p-4 shadow-card sm:flex-row sm:items-start sm:justify-between sm:p-5 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center gap-4">
            <FotoAnimal
              animalId={animal.id}
              fotoUrl={animal.fotoMiniatura}
              sexo={animal.sexo}
              alt={etiquetaAnimal}
            />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-stone-800 dark:text-stone-100">
                {animal.nombre ? `${animal.nombre} ` : ""}
                <span className="text-stone-500 dark:text-stone-400">{identAnimal}</span>
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <SexoBadge sexo={animal.sexo} />
                <Badge tono="neutral">{MODULO_LABEL[animal.modulo] ?? animal.modulo}</Badge>
                {esVacaLeche && animal.categoria && (
                  <Badge tono="neutral">{CATEGORIA_LABEL[animal.categoria] ?? animal.categoria}</Badge>
                )}
                <EstadoBadge estado={animal.estado} />
                {situacionTexto && (
                  <Badge tono={etapaActual ? "azul" : "verde"} punto>
                    {situacionTexto}
                    {situacionVaca.manual ? " (manual)" : ""}
                  </Badge>
                )}
                {situacionVaca.partoEstimado && (
                  <Badge tono="ambar" punto>
                    Parto estimado: {formatearFecha(situacionVaca.partoEstimado)}
                  </Badge>
                )}
                {animal.raza && <Badge tono="neutral">{animal.raza}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <AccionesAnimal animalId={animal.id} etiqueta={etiquetaAnimal} />
            {/* Cantidad de partos de la vaca (gemelos = un parto), bien visible. */}
            {animal.sexo === "HEMBRA" && (
              <div className="inline-flex items-center gap-2.5 self-start rounded-lg bg-marca-50 px-3 py-1.5 ring-1 ring-inset ring-marca-200 sm:self-end dark:bg-marca-950/40 dark:ring-marca-900">
                <span className="text-2xl font-bold leading-none text-marca-700 dark:text-marca-300">
                  {animal.partosComoVaca.length}
                </span>
                <span className="text-sm leading-tight text-stone-700 dark:text-stone-200">
                  {animal.partosComoVaca.length === 1 ? "parto" : "partos"}
                  {animal.partosComoVaca[0] && (
                    <span className="block text-xs text-stone-500 dark:text-stone-400">
                      Último: {formatearFecha(animal.partosComoVaca[0].fecha)}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <FichaTabs
        info={
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            {/* Gestión reproductiva: estado actual y cambio manual (solo vacas de lechería). */}
            {esVacaLeche && (
              <Card>
                <SectionTitle>Estado reproductivo</SectionTitle>
                <EstadoReproductivoManual
                  vacaId={animal.id}
                  estado={situacionVaca.estado}
                  manual={Boolean(situacionVaca.manual)}
                  listaParaMontar={situacionVaca.listaParaMontar}
                  cambios={cambiosEstado.map((c) => ({
                    id: c.id,
                    fechaISO: c.fecha.toISOString(),
                    anterior: c.estadoAnterior,
                    nuevo: c.estadoNuevo,
                    descripcion: c.descripcion,
                  }))}
                />
              </Card>
            )}
            <Card>
              <SectionTitle>Datos básicos</SectionTitle>
              <dl className="space-y-1 text-sm">
                <Dato k="Arete" v={animal.sinArete ? "Sin arete (identificado por SENASA)" : animal.arete} />
                <Dato k="Nombre" v={animal.nombre ?? "—"} />
                <Dato k="Módulo" v={MODULO_LABEL[animal.modulo] ?? animal.modulo} />
                {esVacaLeche && (
                  <Dato k="Categoría" v={animal.categoria ? CATEGORIA_LABEL[animal.categoria] ?? animal.categoria : "—"} />
                )}
                {animal.modulo === "REPRODUCTOR" && (
                  <Dato k="Tipo" v={animal.esPajilla ? "Pajilla" : "Toro"} />
                )}
                {animal.codigo && <Dato k="Código" v={animal.codigo} />}
                {animal.areteCenasa && <Dato k="Arete SENASA" v={animal.areteCenasa} />}
                <Dato k="Sexo" v={SEXO_LABEL[animal.sexo]} />
                <Dato k="Raza" v={animal.raza ?? "—"} />
                <Dato k="Nacimiento" v={formatearFecha(animal.fechaNacimiento)} />
                <Dato k="Edad" v={edadTexto(animal.fechaNacimiento, animal.fechaBaja)} />
                <Dato k="Descripción" v={animal.descripcion ?? "—"} />
                {animal.estado !== "ACTIVO" && (
                  <>
                    <Dato
                      k={animal.estado === "VENDIDO" ? "Fecha de venta" : "Fecha de baja"}
                      v={formatearFecha(animal.fechaBaja)}
                    />
                    <Dato k="Motivo" v={animal.motivoBaja ?? "—"} />
                  </>
                )}
              </dl>
            </Card>

            <Card>
              <SectionTitle>Padres y abuelos</SectionTitle>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-stone-500 dark:text-stone-400">Padre</dt>
                  <dd className="text-right"><TextoProgenitor p={padreTexto} /></dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-stone-500 dark:text-stone-400">Madre</dt>
                  <dd className="text-right"><TextoProgenitor p={madreTexto} /></dd>
                </div>
                {ascendencia.slice(2).map((a, i) => (
                  <div key={i} className="flex justify-between gap-2">
                    <dt className="text-stone-500 dark:text-stone-400">{a.relacion}</dt>
                    <dd className="text-right"><TextoProgenitor p={a.progenitor} /></dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card>
              <SectionTitle>Familia</SectionTitle>
              <div className="text-sm">
                <p className="text-stone-500 dark:text-stone-400">Hijos ({hijos.length})</p>
                <ListaParientes animales={hijos} />
                <p className="mt-3 text-stone-500 dark:text-stone-400">Hermanos ({hermanos.length})</p>
                <ListaParientes animales={hermanos} />
                <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                  Se consideran hermanos si comparten el mismo padre o la misma madre.
                </p>
              </div>
            </Card>
          </div>
        }
        arbol={
          <Card className="print-evitar-corte">
            <SectionTitle>Árbol genealógico</SectionTitle>
            <ArbolGenealogico arbol={arbol} />
          </Card>
        }
        grafica={
          esEngorde
            ? {
                tipo: "peso",
                contenido: (
                  <Card className="print-evitar-corte">
                    <SectionTitle>Evolución del peso</SectionTitle>
                    <GraficaPesoDiferida
                      puntos={animal.registrosPeso.map((r) => ({
                        fechaISO: r.fecha.toISOString(),
                        pesoKg: r.pesoKg,
                      }))}
                    />
                  </Card>
                ),
              }
            : esLecheria
            ? { tipo: "leche", contenido: <ProduccionLecheVaca registros={animal.registrosLeche} /> }
            : null
        }
        historial={
          <div className="space-y-6">
            {/* Partos de la hembra: crías con foto y sexo, y cuántos machos y hembras nacieron. */}
            {animal.sexo === "HEMBRA" && (esLecheria || partosResumen.length > 0) && (
              <Card>
                <SectionTitle>Partos y crías</SectionTitle>
                <ResumenPartos partos={partosResumen} />
              </Card>
            )}
            <Card>
              <SectionTitle>Historial</SectionTitle>
              <HistorialEventos
                toros={torosEdicion}
                posiblesCrias={posiblesCrias}
                eventos={eventos.map((e) => ({
                  id: e.id,
                  tipo: e.tipo,
                  fechaISO: e.fecha.toISOString(),
                  detalle: e.detalle,
                  editable: e.editable,
                  cantidad: e.cantidad,
                  turno: e.turno,
                  pesoKg: e.pesoKg,
                  descripcion: e.descripcion,
                  toroId: e.toroId,
                  notas: e.notas,
                  crias: e.crias,
                  href: e.href,
                  puedeEditarToro: e.toroId !== undefined,
                }))}
              />
            </Card>

            {/* Etapas de engorde: se calculan por la edad. Las registradas a mano antes se
                conservan abajo como historial (editables). */}
            {esEngorde && (
              <Card>
                <SectionTitle>Etapa de engorde</SectionTitle>
                <EtapaAutomatica etapaActual={etapaActual} inicios={iniciosEtapas} />
                {etapasOrdenadas.length > 0 && (
                  <>
                  <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Etapas registradas a mano (historial)
                  </p>
                  <ol className="space-y-3">
                    {etapasOrdenadas.map((et) => {
                      const actual = !et.fechaFin;
                      return (
                        <li key={et.id} className="relative border-l-2 border-marca-200 pl-4 dark:border-marca-800">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-stone-700 dark:text-stone-200">
                                {ETAPA_LABEL[et.etapa] ?? et.etapa}
                              </span>
                              {actual && <Badge>Sin fecha de fin</Badge>}
                            </div>
                            <AccionesEtapa
                              etapaId={et.id}
                              etapaActual={et.etapa}
                              fechaInicio={et.fechaInicio.toISOString().slice(0, 10)}
                              fechaFin={et.fechaFin ? et.fechaFin.toISOString().slice(0, 10) : null}
                              notas={et.notas}
                            />
                          </div>
                          <div className="text-sm text-stone-500 dark:text-stone-400">
                            Inicio: {formatearFecha(et.fechaInicio)}
                            {" · "}
                            Fin: {et.fechaFin ? formatearFecha(et.fechaFin) : "—"}
                          </div>
                          {et.notas && <div className="text-xs text-stone-500 dark:text-stone-400">{et.notas}</div>}
                        </li>
                      );
                    })}
                  </ol>
                  </>
                )}
              </Card>
            )}
          </div>
        }
        registrar={
          <div className="no-print">
            <SectionTitle>Registrar evento</SectionTitle>
            <PanelRegistro
              animalId={animal.id}
              modulo={animal.modulo}
              etapaActual={etapaActual}
              iniciosEtapas={iniciosEtapas}
              toros={toros}
              vacas={vacas}
              posiblesCrias={posiblesCrias}
              criasSugeridas={criasSugeridas}
              palpacionesPrevias={palpacionesPrevias}
            />
          </div>
        }
      />
    </div>
  );
}

// Hijos o hermanos como filas táctiles (área cómoda para el dedo).
function ListaParientes({
  animales,
}: {
  animales: { id: string; arete: string; nombre: string | null; sinArete?: boolean; areteCenasa?: string | null }[];
}) {
  if (animales.length === 0) return <p className="py-1 text-stone-500 dark:text-stone-400">—</p>;
  return (
    <ul className="-mx-2 mt-1">
      {animales.map((h) => (
        <li key={h.id}>
          <Link
            href={`/animales/${h.id}`}
            className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 font-medium text-marca-700 hover:bg-stone-50 active:bg-stone-100 dark:text-marca-400 dark:hover:bg-stone-800/50 dark:active:bg-stone-800"
          >
            <span>
              {h.nombre ?? etiquetaArete(h)}
              {h.nombre && <span className="ml-1 font-normal text-stone-500 dark:text-stone-400">{etiquetaArete(h)}</span>}
            </span>
            <IconoFlecha className="no-print h-4 w-4 text-stone-300 dark:text-stone-600" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-stone-500 dark:text-stone-400">{k}</dt>
      <dd className="text-right dark:text-stone-200">{v}</dd>
    </div>
  );
}

// Edad del animal. Si está dado de baja, la calcula hasta la fecha de baja
// y lo indica entre paréntesis; si no, hasta hoy.
function edadTexto(nacimiento: Date | null, fechaBaja: Date | null): string {
  if (!nacimiento) return "—";
  if (fechaBaja) return `${calcularEdad(nacimiento, fechaBaja)} (al dar de baja)`;
  return calcularEdad(nacimiento);
}
