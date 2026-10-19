"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { hoyLocalISO, formatearFecha } from "@/lib/fechas";
import { llamarApi } from "@/lib/api-cliente";
import { etiquetaArete, terminoBusqueda } from "@/lib/tipos";
import { claseCampo, claseEtiqueta, claseBotonPrimario } from "@/components/ui";

type Opcion = { id: string; arete: string; nombre: string | null; sinArete?: boolean | null; areteCenasa?: string | null };

const campo = claseCampo;
const etiqueta = claseEtiqueta;
// Área táctil ≥44px (min-h-11), ancho completo en móvil.
const boton = `${claseBotonPrimario} w-full sm:w-auto`;

function useEnviar() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(url: string, payload: unknown, onOk?: () => void) {
    setError(null);
    setCargando(true);
    const r = await llamarApi(url, { method: "POST", body: payload });
    setCargando(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    onOk?.();
    router.refresh();
  }

  return { error, cargando, enviar };
}

function Aviso({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      {error}
    </div>
  );
}

// Fecha de hoy calculada en el NAVEGADOR al montar (no a nivel de módulo ni en el servidor:
// el SSR corre en UTC y un servidor encendido varios días dejaría la fecha del arranque).
// Hasta montar vale "" y los inputs usan key={hoy} para tomar el valor cuando llega.
function useHoy() {
  const [hoy, setHoy] = useState("");
  useEffect(() => setHoy(hoyLocalISO()), []);
  return hoy;
}

// --- Peso: aplica a cualquier animal ---
export function FormPeso({ animalId }: { animalId: string }) {
  const { error, cargando, enviar } = useEnviar();
  const hoy = useHoy();
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const form = e.currentTarget;
        enviar(
          "/api/pesos",
          { animalId, fecha: fd.get("fecha"), pesoKg: fd.get("pesoKg"), notas: fd.get("notas") },
          () => form.reset()
        );
      }}
    >
      <Aviso error={error} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-2">
        <div>
          <label htmlFor="peso-fecha" className={etiqueta}>Fecha</label>
          <input id="peso-fecha" type="date" name="fecha" required key={hoy} defaultValue={hoy} className={campo} />
        </div>
        <div>
          <label htmlFor="peso-kg" className={etiqueta}>Peso (kg)</label>
          <input id="peso-kg" type="number" step="0.1" min={0} max={3000} name="pesoKg" required className={campo} placeholder="Ej. 180" />
        </div>
      </div>
      <input name="notas" aria-label="Notas (opcional)" placeholder="Notas (opcional)" maxLength={2000} className={campo} />
      <button className={boton} disabled={cargando}>Guardar peso</button>
    </form>
  );
}

// --- Leche: solo vacas. Cada registro es UN ordeño (mañana o tarde). ---
export function FormLeche({ vacaId }: { vacaId: string }) {
  const { error, cargando, enviar } = useEnviar();
  const hoy = useHoy();
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const form = e.currentTarget;
        enviar(
          "/api/leche",
          {
            vacaId,
            fecha: fd.get("fecha"),
            turno: fd.get("turno"),
            cantidad: fd.get("cantidad"),
            notas: fd.get("notas"),
          },
          () => form.reset()
        );
      }}
    >
      <Aviso error={error} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-2">
        <div>
          <label htmlFor="leche-fecha" className={etiqueta}>Fecha</label>
          <input id="leche-fecha" type="date" name="fecha" required key={hoy} defaultValue={hoy} className={campo} />
        </div>
        <div>
          <label htmlFor="leche-turno" className={etiqueta}>Ordeño</label>
          <select id="leche-turno" name="turno" required className={campo} defaultValue="MANANA">
            <option value="MANANA">Mañana</option>
            <option value="TARDE">Tarde</option>
          </select>
        </div>
        <div>
          <label htmlFor="leche-cantidad" className={etiqueta}>Litros del ordeño</label>
          <input id="leche-cantidad" type="number" step="0.1" min={0} max={1000} name="cantidad" required className={campo} placeholder="Ej. 6" />
        </div>
      </div>
      <p className="text-xs text-stone-500 dark:text-stone-400">
        Anota los litros de ESE ordeño. Registra el de la mañana y el de la tarde por separado;
        la app suma el total del día.
      </p>
      <input name="notas" aria-label="Notas (opcional)" placeholder="Notas (opcional)" maxLength={2000} className={campo} />
      <button className={boton} disabled={cargando}>Guardar ordeño</button>
    </form>
  );
}

// --- Monta: solo vacas; requiere elegir toro ---
export function FormMonta({ vacaId, toros }: { vacaId: string; toros: Opcion[] }) {
  const { error, cargando, enviar } = useEnviar();
  const hoy = useHoy();
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const form = e.currentTarget;
        enviar(
          "/api/montas",
          {
            vacaId,
            toroId: fd.get("toroId"),
            fecha: fd.get("fecha"),
            notas: fd.get("notas"),
            inseminacion: fd.get("inseminacion") === "on",
          },
          () => form.reset()
        );
      }}
    >
      <Aviso error={error} />
      <div>
        <label htmlFor="monta-toro" className={etiqueta}>Toro</label>
        <select id="monta-toro" name="toroId" required className={campo} defaultValue="">
          <option value="" disabled>— Elegir toro —</option>
          {toros.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre ? `${t.nombre} (${etiquetaArete(t)})` : etiquetaArete(t)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="monta-fecha" className={etiqueta}>Fecha de la monta</label>
        <input id="monta-fecha" type="date" name="fecha" required key={hoy} defaultValue={hoy} className={campo} />
      </div>

      {/* Inseminación con pajilla en vez de monta natural. */}
      <label className="flex items-center gap-2.5 rounded-md py-1 text-sm text-stone-700 dark:text-stone-200">
        <input type="checkbox" name="inseminacion" className="h-4 w-4 accent-marca-600" />
        Fue inseminación (pajilla), no monta natural
      </label>

      <input name="notas" aria-label="Notas (opcional)" placeholder="Notas (opcional)" maxLength={2000} className={campo} />
      <p className="text-xs text-stone-500 dark:text-stone-400">
        Esto solo registra la monta. La palpación y el parto se anotan aparte, en sus pestañas.
      </p>
      <button className={boton} disabled={cargando}>Guardar monta</button>
    </form>
  );
}

// --- Monta desde el toro: el toro es fijo (animal actual); se elige la vaca ---
export function FormMontaDesdeToro({ toroId, vacas }: { toroId: string; vacas: Opcion[] }) {
  const { error, cargando, enviar } = useEnviar();
  const hoy = useHoy();
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const form = e.currentTarget;
        enviar(
          "/api/montas",
          {
            toroId,
            vacaId: fd.get("vacaId"),
            fecha: fd.get("fecha"),
            notas: fd.get("notas"),
            inseminacion: fd.get("inseminacion") === "on",
          },
          () => form.reset()
        );
      }}
    >
      <Aviso error={error} />
      <div>
        <label htmlFor="montatoro-vaca" className={etiqueta}>Vaca</label>
        <select id="montatoro-vaca" name="vacaId" required className={campo} defaultValue="">
          <option value="" disabled>— Elegir vaca —</option>
          {vacas.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nombre ? `${v.nombre} (${etiquetaArete(v)})` : etiquetaArete(v)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="montatoro-fecha" className={etiqueta}>Fecha de la monta</label>
        <input id="montatoro-fecha" type="date" name="fecha" required key={hoy} defaultValue={hoy} className={campo} />
      </div>
      <label className="flex items-center gap-2.5 rounded-md py-1 text-sm text-stone-700 dark:text-stone-200">
        <input type="checkbox" name="inseminacion" className="h-4 w-4 accent-marca-600" />
        Fue inseminación (pajilla), no monta natural
      </label>
      <input name="notas" aria-label="Notas (opcional)" placeholder="Notas (opcional)" maxLength={2000} className={campo} />
      <p className="text-xs text-stone-500 dark:text-stone-400">Esto solo registra la monta. El parto se anota aparte cuando ocurra.</p>
      <button className={boton} disabled={cargando}>Guardar monta</button>
    </form>
  );
}

// --- Parto: solo vacas; crias elegidas entre animales existentes ---
export function FormParto({
  vacaId,
  toros,
  posiblesCrias,
  criasSugeridas = [],
}: {
  vacaId: string;
  toros: Opcion[];
  // fechaNacimiento ("YYYY-MM-DD") y padreId: al marcar la cría se proponen como fecha y toro.
  posiblesCrias: (Opcion & { fechaNacimiento?: string | null; padreId?: string | null })[];
  criasSugeridas?: string[]; // ids de los hijos de esta vaca aún sin parto: se muestran primero
}) {
  const { error, cargando, enviar } = useEnviar();
  const hoy = useHoy();
  const [crias, setCrias] = useState<string[]>([]);
  // Crías que no están registradas: se crean como animales nuevos al guardar el parto.
  const [criasNuevas, setCriasNuevas] = useState<CriaNuevaForm[]>([]);
  // Fecha controlada: empieza en hoy (cuando el navegador la calcula) y se reemplaza por la fecha
  // de nacimiento de la cría que se marque. Se puede cambiar a mano igual.
  const [fecha, setFecha] = useState("");
  const [fechaDeCria, setFechaDeCria] = useState<string | null>(null); // etiqueta de la cría usada
  useEffect(() => {
    if (hoy) setFecha((f) => f || hoy);
  }, [hoy]);
  // Toro controlado: se propone el padre registrado de la cría marcada (si es uno de los toros).
  const [toroId, setToroId] = useState("");
  const [toroDeCria, setToroDeCria] = useState<string | null>(null);
  // "Otros animales": ocultos si hay sugeridas (se abren con un botón), con buscador.
  const [verOtros, setVerOtros] = useState(false);
  const [filtro, setFiltro] = useState("");

  function toggleCria(id: string) {
    const marcando = !crias.includes(id);
    setCrias((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    const c = porId.get(id);
    if (!marcando || !c) return;
    const nombreCria = c.nombre ?? etiquetaArete(c);
    if (c.fechaNacimiento) {
      setFecha(c.fechaNacimiento);
      setFechaDeCria(nombreCria);
    }
    if (c.padreId && toros.some((t) => t.id === c.padreId)) {
      setToroId(c.padreId);
      setToroDeCria(nombreCria);
    }
  }

  const porId = new Map(posiblesCrias.map((c) => [c.id, c]));
  const sugeridas = criasSugeridas.map((cid) => porId.get(cid)).filter((c): c is Opcion => !!c);
  const idsSugeridas = new Set(sugeridas.map((c) => c.id));
  const otros = posiblesCrias.filter((c) => !idsSugeridas.has(c.id));
  const otrosAbiertos = verOtros || sugeridas.length === 0;
  const termino = terminoBusqueda(filtro).toLowerCase();
  // Las ya marcadas siempre se ven, aunque el buscador o la lista cerrada las oculten.
  const otrosVisibles = otros.filter((c) => {
    if (crias.includes(c.id)) return true;
    if (!otrosAbiertos) return false;
    if (!termino) return true;
    return [c.sinArete ? "" : c.arete, c.areteCenasa ?? "", c.nombre ?? ""].some((t) =>
      t.toLowerCase().includes(termino)
    );
  });

  const casilla = (c: Opcion) => (
    <label key={c.id} className="flex min-h-11 items-center gap-2.5 rounded-md px-1 py-1.5 hover:bg-stone-50 dark:hover:bg-stone-800/50">
      <input
        type="checkbox"
        checked={crias.includes(c.id)}
        onChange={() => toggleCria(c.id)}
        className="h-4 w-4 accent-marca-600"
      />
      {c.nombre ? `${c.nombre} (${etiquetaArete(c)})` : etiquetaArete(c)}
    </label>
  );

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const form = e.currentTarget;
        enviar(
          "/api/partos",
          {
            vacaId,
            toroId: fd.get("toroId") || null,
            fecha: fd.get("fecha"),
            descripcion: fd.get("descripcion"),
            criaSana: fd.get("criaSana"),
            necesitoAyuda: fd.get("necesitoAyuda"),
            pesoNacimientoKg: fd.get("pesoNacimientoKg"),
            crias: crias.map((criaId) => ({ criaId })),
            criasNuevas: criasNuevasPayload(criasNuevas),
          },
          () => {
            form.reset();
            setCrias([]);
            setCriasNuevas([]);
            setFecha(hoy);
            setFechaDeCria(null);
            setToroId("");
            setToroDeCria(null);
            setVerOtros(false);
            setFiltro("");
          }
        );
      }}
    >
      <Aviso error={error} />
      <div>
        <label htmlFor="parto-fecha" className={etiqueta}>Fecha del parto</label>
        <input
          id="parto-fecha"
          type="date"
          name="fecha"
          required
          value={fecha}
          onChange={(e) => {
            setFecha(e.target.value);
            setFechaDeCria(null);
          }}
          className={campo}
        />
        {fechaDeCria && (
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Tomada del nacimiento de {fechaDeCria}. Puedes cambiarla.
          </p>
        )}
      </div>
      <div>
        <label htmlFor="parto-toro" className={etiqueta}>Toro / padre (opcional)</label>
        <select
          id="parto-toro"
          name="toroId"
          className={campo}
          value={toroId}
          onChange={(e) => {
            setToroId(e.target.value);
            setToroDeCria(null);
          }}
        >
          <option value="">— No lo sé / sin especificar —</option>
          {toros.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre ? `${t.nombre} (${etiquetaArete(t)})` : etiquetaArete(t)}
            </option>
          ))}
        </select>
        {toroDeCria && (
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Tomado del padre de {toroDeCria}. Puedes cambiarlo.
          </p>
        )}
      </div>
      {/* Datos del nacimiento (B4). Todos opcionales. */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <label htmlFor="parto-sana" className={etiqueta}>¿La cría nació sana?</label>
          <select id="parto-sana" name="criaSana" className={campo} defaultValue="">
            <option value="">— No indicar —</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label htmlFor="parto-ayuda" className={etiqueta}>¿Necesitó ayuda?</label>
          <select id="parto-ayuda" name="necesitoAyuda" className={campo} defaultValue="">
            <option value="">— No indicar —</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label htmlFor="parto-peso" className={etiqueta}>Peso al nacer (kg)</label>
          <input id="parto-peso" type="number" step="0.1" min={0} max={200} name="pesoNacimientoKg" className={campo} placeholder="Ej. 32" />
        </div>
      </div>
      <div>
        <label htmlFor="parto-desc" className={etiqueta}>Notas del parto (opcional)</label>
        <input id="parto-desc" name="descripcion" maxLength={2000} className={campo} placeholder="Ej. parto sin complicaciones" />
      </div>
      <div>
        <span className={etiqueta}>Cría(s) que nacieron</span>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">
          Registra la cría aquí mismo con &quot;Registrar cría nueva&quot;, o márcala si ya la agregaste como
          animal. Si fueron gemelos, agrega o marca cada una.
        </p>
        <EditorCriasNuevas crias={criasNuevas} onChange={setCriasNuevas} claseCampo={campo} claseEtiqueta={etiqueta} />
        {posiblesCrias.length === 0 ? null : (
          <div className="mt-2 space-y-2 text-sm">
            {/* Hijos registrados de esta vaca que aún no están en un parto: lo más probable. */}
            {sugeridas.length > 0 && (
              <div className="rounded border border-marca-200 bg-marca-50/50 p-2 dark:border-marca-900 dark:bg-marca-950/30">
                <p className="px-1 pb-1 text-xs font-medium text-marca-700 dark:text-marca-300">
                  Hijos de esta vaca sin parto registrado
                </p>
                {sugeridas.map(casilla)}
              </div>
            )}

            {otros.length > 0 && (
              <div className="rounded border border-stone-200 p-2 dark:border-stone-700">
                {otrosAbiertos ? (
                  <>
                    <input
                      type="search"
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                      aria-label="Buscar otra cría por arete, SENASA o nombre"
                      placeholder="Buscar arete, SENASA o nombre…"
                      className={campo + " mt-0 mb-1"}
                    />
                    <div className="max-h-48 overflow-y-auto">
                      {otrosVisibles.length === 0 ? (
                        <p className="px-1 py-2 text-stone-400">Ningún animal coincide.</p>
                      ) : (
                        otrosVisibles.map(casilla)
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {otrosVisibles.map(casilla)}
                    <button
                      type="button"
                      onClick={() => setVerOtros(true)}
                      className="min-h-11 w-full rounded-md px-1 text-left text-sm font-medium text-marca-700 hover:bg-stone-50 dark:text-marca-400 dark:hover:bg-stone-800/50"
                    >
                      Elegir otro animal ({otros.length})
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <button className={boton} disabled={cargando}>Guardar parto</button>
    </form>
  );
}

// --- Crías nuevas del parto --------------------------------------------------
// Filas para registrar crías que aún no existen como animales. Al guardar el parto, el servidor
// las crea en Engorde con la vaca como madre, el toro del parto como padre y la fecha del parto
// como nacimiento. Se usa al registrar y al editar un parto.
export type CriaNuevaForm = {
  clave: string;
  sinArete: boolean;
  arete: string;
  areteCenasa: string;
  nombre: string;
  sexo: string;
};

export function criasNuevasPayload(crias: CriaNuevaForm[]) {
  return crias.map(({ sinArete, arete, areteCenasa, nombre, sexo }) => ({
    sinArete,
    arete: sinArete ? null : arete,
    areteCenasa: areteCenasa || null,
    nombre: nombre || null,
    sexo,
  }));
}

export function EditorCriasNuevas({
  crias,
  onChange,
  claseCampo,
  claseEtiqueta,
}: {
  crias: CriaNuevaForm[];
  onChange: (crias: CriaNuevaForm[]) => void;
  claseCampo: string;
  claseEtiqueta: string;
}) {
  const cambiar = (clave: string, cambio: Partial<CriaNuevaForm>) =>
    onChange(crias.map((c) => (c.clave === clave ? { ...c, ...cambio } : c)));
  const agregar = () =>
    onChange([
      ...crias,
      { clave: Math.random().toString(36).slice(2), sinArete: false, arete: "", areteCenasa: "", nombre: "", sexo: "" },
    ]);

  return (
    <div className="space-y-2">
      {crias.map((c, i) => {
        const pre = `cria-nueva-${c.clave}`;
        return (
          <fieldset
            key={c.clave}
            className="rounded-lg border border-marca-200 bg-marca-50/40 p-3 dark:border-marca-900 dark:bg-marca-950/20"
          >
            <legend className="px-1 text-xs font-semibold text-marca-700 dark:text-marca-300">
              Cría nueva{crias.length > 1 ? ` ${i + 1}` : ""}
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {c.sinArete ? (
                <div>
                  <label htmlFor={`${pre}-senasa`} className={claseEtiqueta}>Arete SENASA (opcional)</label>
                  <input
                    id={`${pre}-senasa`}
                    maxLength={60}
                    value={c.areteCenasa}
                    onChange={(e) => cambiar(c.clave, { areteCenasa: e.target.value })}
                    className={claseCampo}
                    placeholder="Si ya lo tiene"
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor={`${pre}-arete`} className={claseEtiqueta}>Arete *</label>
                  <input
                    id={`${pre}-arete`}
                    required
                    maxLength={60}
                    value={c.arete}
                    onChange={(e) => cambiar(c.clave, { arete: e.target.value })}
                    className={claseCampo}
                    placeholder="Ej. 031"
                  />
                </div>
              )}
              <div>
                <label htmlFor={`${pre}-nombre`} className={claseEtiqueta}>Nombre (opcional)</label>
                <input
                  id={`${pre}-nombre`}
                  maxLength={120}
                  value={c.nombre}
                  onChange={(e) => cambiar(c.clave, { nombre: e.target.value })}
                  className={claseCampo}
                />
              </div>
              <div>
                <label htmlFor={`${pre}-sexo`} className={claseEtiqueta}>Sexo *</label>
                <select
                  id={`${pre}-sexo`}
                  required
                  value={c.sexo}
                  onChange={(e) => cambiar(c.clave, { sexo: e.target.value })}
                  className={claseCampo}
                >
                  <option value="" disabled>— Elegir —</option>
                  <option value="HEMBRA">Hembra</option>
                  <option value="MACHO">Macho</option>
                </select>
              </div>
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <label className="flex min-h-11 items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={c.sinArete}
                  onChange={(e) => cambiar(c.clave, { sinArete: e.target.checked })}
                  className="h-4 w-4 accent-marca-600"
                />
                No tiene arete todavía (aparece como &quot;Sin arete&quot;)
              </label>
              <button
                type="button"
                onClick={() => onChange(crias.filter((x) => x.clave !== c.clave))}
                className="min-h-11 rounded-lg px-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-stone-800"
              >
                Quitar
              </button>
            </div>
          </fieldset>
        );
      })}
      <button
        type="button"
        onClick={agregar}
        className="min-h-11 w-full rounded-lg border border-dashed border-marca-300 px-3 text-sm font-medium text-marca-700 hover:bg-marca-50 dark:border-marca-800 dark:text-marca-400 dark:hover:bg-stone-800/50"
      >
        + Registrar cría nueva
      </button>
      {crias.length > 0 && (
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Se guardará como animal de Engorde, con esta vaca como madre, el toro elegido como padre y la
          fecha del parto como nacimiento. La foto se agrega después desde su ficha.
        </p>
      )}
    </div>
  );
}

// --- Palpación: solo hembras; fecha + notas opcionales ---
// `previas`: palpaciones anteriores (las nuevas y las que se anotaban en la monta), más reciente primero.
export function FormPalpacion({
  vacaId,
  previas,
}: {
  vacaId: string;
  previas: { fechaISO: string; notas: string | null; enMonta: boolean }[];
}) {
  const { error, cargando, enviar } = useEnviar();
  const hoy = useHoy();
  return (
    <div className="space-y-4">
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const form = e.currentTarget;
          enviar("/api/palpaciones", { vacaId, fecha: fd.get("fecha"), notas: fd.get("notas") }, () => form.reset());
        }}
      >
        <Aviso error={error} />
        <div>
          <label htmlFor="palpacion-fecha" className={etiqueta}>Fecha de la palpación</label>
          <input id="palpacion-fecha" type="date" name="fecha" required key={hoy} defaultValue={hoy} className={campo} />
        </div>
        <div>
          <label htmlFor="palpacion-notas" className={etiqueta}>Notas (opcional)</label>
          <textarea
            id="palpacion-notas"
            name="notas"
            rows={2}
            maxLength={2000}
            className={campo}
            placeholder="Ej. preñada de ~2 meses"
          />
        </div>
        <button className={boton} disabled={cargando}>Guardar palpación</button>
      </form>

      <div>
        <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Palpaciones anteriores</p>
        {previas.length === 0 ? (
          <p className="mt-1 text-sm text-stone-400 dark:text-stone-500">Sin palpaciones registradas.</p>
        ) : (
          <ul className="mt-1 divide-y divide-stone-100 text-sm dark:divide-stone-800">
            {previas.map((p, i) => (
              <li key={i} className="py-1.5">
                <span className="font-medium text-stone-700 dark:text-stone-200">{formatearFecha(p.fechaISO)}</span>
                {p.enMonta && (
                  <span className="ml-2 text-xs text-stone-400 dark:text-stone-500">(anotada en la monta)</span>
                )}
                {p.notas && <p className="text-xs text-stone-500 dark:text-stone-400">{p.notas}</p>}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">Se editan o eliminan desde el Historial.</p>
      </div>
    </div>
  );
}

