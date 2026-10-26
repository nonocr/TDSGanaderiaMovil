"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui";
import { formatearFecha } from "@/lib/fechas";
import { llamarApi } from "@/lib/api-cliente";
import {
  IconoNacimiento,
  IconoCorazon,
  IconoBiberon,
  IconoLeche,
  IconoPeso,
  IconoPin,
  IconoEditar,
  IconoBasura,
  IconoCheck,
  IconoReloj,
  IconoFlecha,
  type IconoProps,
} from "@/components/iconos";
import { etiquetaArete, terminoBusqueda } from "@/lib/tipos";
import { EditorCriasNuevas, criasNuevasPayload, type CriaNuevaForm } from "./FormulariosEventos";

type Opcion = { id: string; arete: string; nombre: string | null; sinArete?: boolean | null; areteCenasa?: string | null };

const ENDPOINT: Record<string, string> = {
  Monta: "/api/montas",
  Parto: "/api/partos",
  Leche: "/api/leche",
  Peso: "/api/pesos",
  "Palpación": "/api/palpaciones",
};

export type DatosFila = {
  id?: string;
  tipo: string;
  fechaISO: string; // ISO completo
  detalle: string;
  editable?: boolean;
  cantidad?: number;
  turno?: string | null;
  pesoKg?: number;
  descripcion?: string | null;
  toroId?: string | null;
  notas?: string | null;
  puedeEditarToro?: boolean;
  // Solo partos de la vaca: crías actuales (se pueden cambiar al editar).
  crias?: Opcion[];
  // Página de detalle del registro (partos).
  href?: string;
};

const campo =
  "w-full rounded-lg border border-stone-300 px-2 py-1 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100";
const etiqueta = "block text-xs font-medium text-stone-600 dark:text-stone-400";

// Icono y color de acento por tipo de evento (para la variante ampliada).
const ESTILO_TIPO: Record<string, { Icono: (p: IconoProps) => React.JSX.Element; acento: string }> = {
  Nacimiento: { Icono: IconoNacimiento, acento: "bg-marca-100 text-marca-700 dark:bg-marca-950 dark:text-marca-300" },
  Monta: { Icono: IconoCorazon, acento: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
  Parto: { Icono: IconoBiberon, acento: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  Leche: { Icono: IconoLeche, acento: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
  Peso: { Icono: IconoPeso, acento: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  Etapa: { Icono: IconoPin, acento: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300" },
  "Palpación": { Icono: IconoCheck, acento: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300" },
  Estado: { Icono: IconoReloj, acento: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
};

export function FilaEvento({
  datos,
  toros,
  posiblesCrias = [],
  variante = "compacta",
}: {
  datos: DatosFila;
  toros: Opcion[];
  posiblesCrias?: Opcion[]; // animales que se pueden agregar como cría al editar un parto
  variante?: "compacta" | "ampliada";
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crias, setCrias] = useState<string[]>([]);
  const [criasNuevas, setCriasNuevas] = useState<CriaNuevaForm[]>([]);
  const [filtroCria, setFiltroCria] = useState("");

  // Al abrir la edición se parte siempre de lo guardado (por si antes se canceló a medias).
  function abrirEdicion() {
    setCrias(datos.crias?.map((c) => c.id) ?? []);
    setCriasNuevas([]);
    setFiltroCria("");
    setError(null);
    setEditando(true);
  }

  const base = ENDPOINT[datos.tipo];
  const gestionable = Boolean(datos.id && base);
  const fechaInput = datos.fechaISO.slice(0, 10);

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    const fd = new FormData(e.currentTarget);

    const payload: Record<string, unknown> = { fecha: fd.get("fecha") };
    if (datos.tipo === "Leche") {
      payload.cantidad = fd.get("cantidad");
      payload.turno = fd.get("turno") || null;
    }
    if (datos.tipo === "Peso") payload.pesoKg = fd.get("pesoKg");
    if (datos.tipo === "Parto") payload.descripcion = fd.get("descripcion");
    if (datos.tipo === "Parto" && datos.crias) {
      payload.crias = crias.map((criaId) => ({ criaId }));
      payload.criasNuevas = criasNuevasPayload(criasNuevas);
    }
    if ((datos.tipo === "Monta" || datos.tipo === "Parto") && datos.puedeEditarToro)
      payload.toroId = fd.get("toroId") || null;
    if (datos.tipo === "Monta" || datos.tipo === "Leche" || datos.tipo === "Peso" || datos.tipo === "Palpación")
      payload.notas = fd.get("notas");

    const r = await llamarApi(`${base}/${datos.id}`, { method: "PUT", body: payload });
    setGuardando(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setEditando(false);
    router.refresh();
  }

  async function eliminar() {
    const cuando = formatearFecha(datos.fechaISO);
    const resumen = datos.detalle ? ` “${datos.detalle}”` : "";
    if (
      !confirm(
        `¿Eliminar este registro de ${datos.tipo}${resumen} del ${cuando}?\n\n` +
          `Se borrará de forma permanente y no se puede deshacer.`
      )
    )
      return;
    setBorrando(true);
    const r = await llamarApi(`${base}/${datos.id}`, { method: "DELETE" });
    setBorrando(false);
    if (!r.ok) {
      alert(r.error);
      return;
    }
    router.refresh();
  }

  const estilo = ESTILO_TIPO[datos.tipo] ?? { Icono: IconoPin, acento: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300" };
  const IconoTipo = estilo.Icono;

  // --- Variante AMPLIADA: tarjeta con icono y botones amigables (para el modal) ---
  if (variante === "ampliada") {
    return (
      <li className="py-2">
        <div className="flex items-start gap-3 rounded-xl border border-stone-200/70 bg-white p-3 transition-colors hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${estilo.acento}`}>
            <IconoTipo className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <span className="font-semibold text-stone-800 dark:text-stone-100">{datos.tipo}</span>
              <span className="whitespace-nowrap text-xs text-stone-500 dark:text-stone-400">
                {formatearFecha(datos.fechaISO)}
              </span>
            </div>
            {datos.detalle && (
              <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-300">{datos.detalle}</p>
            )}
            {datos.href && (
              <Link href={datos.href} className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:underline dark:text-marca-400">
                Ver detalle <IconoFlecha className="h-3.5 w-3.5" />
              </Link>
            )}
            {datos.notas && (
              <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{datos.notas}</p>
            )}

            {gestionable && !editando && (
              <div className="mt-2 flex gap-2">
                {datos.editable && (
                  <button
                    onClick={abrirEdicion}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:border-marca-300 hover:text-marca-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-marca-700 dark:hover:text-marca-300"
                  >
                    <IconoEditar className="h-3.5 w-3.5" /> Editar
                  </button>
                )}
                <button
                  onClick={eliminar}
                  disabled={borrando}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:bg-stone-800 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <IconoBasura className="h-3.5 w-3.5" /> {borrando ? "Eliminando…" : "Eliminar"}
                </button>
              </div>
            )}

            {editando && formEdicion()}
          </div>
        </div>
      </li>
    );
  }

  // --- Variante COMPACTA (por defecto): optimizada para toque en móvil ---
  return (
    <li className="py-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge>{datos.tipo}</Badge>
            {datos.href ? (
              <Link href={datos.href} className="truncate text-marca-700 underline-offset-2 hover:underline dark:text-marca-400">
                {datos.detalle}
              </Link>
            ) : (
              <span className="truncate text-stone-600 dark:text-stone-300">{datos.detalle}</span>
            )}
          </div>
          <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">
            {formatearFecha(datos.fechaISO)}
          </span>
        </div>

        {gestionable && !editando && (
          <div className="no-print flex shrink-0 items-center gap-1">
            {datos.editable && (
              <button
                onClick={abrirEdicion}
                aria-label="Editar evento"
                title="Editar"
                className="grid h-11 w-11 place-items-center rounded-lg text-marca-700 transition-colors hover:bg-marca-50 active:bg-marca-100 dark:text-marca-400 dark:hover:bg-stone-800"
              >
                <IconoEditar className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={eliminar}
              disabled={borrando}
              aria-label="Eliminar evento"
              title="Eliminar"
              className="grid h-11 w-11 place-items-center rounded-lg text-red-600 transition-colors hover:bg-red-50 active:bg-red-100 disabled:opacity-50 dark:text-red-400 dark:hover:bg-stone-800"
            >
              {borrando ? <span className="text-xs">…</span> : <IconoBasura className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>

      {editando && formEdicion()}
    </li>
  );

  // Formulario de edición compartido por ambas variantes. Se LLAMA como función, no como
  // <Componente/>: declarado dentro del render, React lo remontaría en cada cambio de estado
  // y se perdería lo escrito (p. ej. al mostrar un error de guardado).
  function formEdicion() {
    return (
        <form onSubmit={guardar} className="mt-2 space-y-2 rounded-lg bg-stone-50 p-3 dark:bg-stone-800/60">
          {error && (
            <div role="alert" className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label htmlFor={`ev-fecha-${datos.id}`} className={etiqueta}>Fecha</label>
              <input id={`ev-fecha-${datos.id}`} type="date" name="fecha" required defaultValue={fechaInput} className={campo} />
            </div>
            {datos.tipo === "Leche" && (
              <>
                <div>
                  <label htmlFor={`ev-cantidad-${datos.id}`} className={etiqueta}>Litros del ordeño</label>
                  <input id={`ev-cantidad-${datos.id}`} type="number" step="0.1" min={0} max={1000} name="cantidad" defaultValue={datos.cantidad} className={campo} />
                </div>
                <div>
                  <label htmlFor={`ev-turno-${datos.id}`} className={etiqueta}>Ordeño</label>
                  <select id={`ev-turno-${datos.id}`} name="turno" defaultValue={datos.turno ?? ""} className={campo}>
                    <option value="">Sin indicar</option>
                    <option value="MANANA">Mañana</option>
                    <option value="TARDE">Tarde</option>
                  </select>
                </div>
              </>
            )}
            {datos.tipo === "Peso" && (
              <div>
                <label htmlFor={`ev-peso-${datos.id}`} className={etiqueta}>Peso (kg)</label>
                <input id={`ev-peso-${datos.id}`} type="number" step="0.1" min={0} max={3000} name="pesoKg" defaultValue={datos.pesoKg} className={campo} />
              </div>
            )}
            {(datos.tipo === "Monta" || datos.tipo === "Parto") && datos.puedeEditarToro && (
              <div>
                <label htmlFor={`ev-toro-${datos.id}`} className={etiqueta}>{datos.tipo === "Monta" ? "Toro" : "Toro / padre"}</label>
                <select id={`ev-toro-${datos.id}`} name="toroId" defaultValue={datos.toroId ?? ""} className={campo}>
                  <option value="">{datos.tipo === "Parto" ? "— Sin especificar —" : "— Elegir toro —"}</option>
                  {toros.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre ? `${t.nombre} (${etiquetaArete(t)})` : etiquetaArete(t)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {datos.tipo === "Parto" && (
            <div>
              <label htmlFor={`ev-desc-${datos.id}`} className={etiqueta}>Descripción</label>
              <input id={`ev-desc-${datos.id}`} name="descripcion" maxLength={2000} defaultValue={datos.descripcion ?? ""} className={campo} />
            </div>
          )}
          {datos.tipo === "Parto" && datos.crias && selectorCrias(datos.crias)}
          {(datos.tipo === "Monta" || datos.tipo === "Leche" || datos.tipo === "Peso" || datos.tipo === "Palpación") && (
            <div>
              <label htmlFor={`ev-notas-${datos.id}`} className={etiqueta}>Notas</label>
              <input id={`ev-notas-${datos.id}`} name="notas" maxLength={2000} defaultValue={datos.notas ?? ""} className={campo} />
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-marca-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-marca-700 disabled:opacity-50"
            >
              {guardando ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-700"
            >
              Cancelar
            </button>
          </div>
        </form>
    );
  }

  // Crías del parto: las actuales arriba (marcadas) y, con el buscador, otros animales que se
  // pueden agregar. Se llama como función por la misma razón que formEdicion.
  function selectorCrias(actuales: Opcion[]) {
    const idsActuales = new Set(actuales.map((c) => c.id));
    const otros = posiblesCrias.filter((c) => !idsActuales.has(c.id));
    const termino = terminoBusqueda(filtroCria).toLowerCase();
    // Las ya marcadas siempre se ven; el resto solo al buscar.
    const otrosVisibles = otros.filter((c) => {
      if (crias.includes(c.id)) return true;
      if (!termino) return false;
      return [c.sinArete ? "" : c.arete, c.areteCenasa ?? "", c.nombre ?? ""].some((t) =>
        t.toLowerCase().includes(termino)
      );
    });
    const casilla = (c: Opcion) => (
      <label key={c.id} className="flex min-h-11 items-center gap-2.5 rounded-md px-1 py-1 text-sm text-stone-700 dark:text-stone-200">
        <input
          type="checkbox"
          checked={crias.includes(c.id)}
          onChange={() => setCrias((prev) => (prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]))}
          className="h-5 w-5 accent-marca-600"
        />
        {c.nombre ? `${c.nombre} (${etiquetaArete(c)})` : etiquetaArete(c)}
      </label>
    );
    return (
      <div>
        <span className={etiqueta}>Cría(s) que nacieron</span>
        {actuales.map(casilla)}
        {otros.length > 0 && (
          <>
            <input
              type="search"
              value={filtroCria}
              onChange={(e) => setFiltroCria(e.target.value)}
              aria-label="Buscar otra cría por arete, SENASA o nombre"
              placeholder="Agregar otra cría: buscar arete, SENASA o nombre…"
              className={campo + " mt-1"}
            />
            <div className="max-h-48 overflow-y-auto">
              {otrosVisibles.map(casilla)}
              {termino && otrosVisibles.length === 0 && (
                <p className="px-1 py-2 text-sm text-stone-500 dark:text-stone-400">Ningún animal coincide.</p>
              )}
            </div>
          </>
        )}
        <p className="mt-1 mb-2 text-xs text-stone-500 dark:text-stone-400">
          Desmarca la cría equivocada y marca la correcta. Si la cría no está registrada, regístrala aquí.
        </p>
        <EditorCriasNuevas crias={criasNuevas} onChange={setCriasNuevas} claseCampo={campo} claseEtiqueta={etiqueta} />
      </div>
    );
  }
}

