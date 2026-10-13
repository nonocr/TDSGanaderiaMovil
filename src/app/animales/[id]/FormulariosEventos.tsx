"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { hoyLocalISO } from "@/lib/fechas";
import { llamarApi } from "@/lib/api-cliente";

type Opcion = { id: string; arete: string; nombre: string | null };

const campo =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500";
const etiqueta = "block text-sm font-medium text-stone-600 dark:text-stone-400";
const boton =
  "w-full rounded-lg bg-marca-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-marca-700 disabled:opacity-50 sm:w-auto";

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
  const [prenez, setPrenez] = useState(false);
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
            prenezConfirmada: prenez,
            fechaConfirmacion: prenez ? fd.get("fechaConfirmacion") : null,
            inseminacion: fd.get("inseminacion") === "on",
          },
          () => {
            form.reset();
            setPrenez(false);
          }
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
              {t.nombre ? `${t.nombre} (#${t.arete})` : `#${t.arete}`}
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

      {/* Confirmación de preñez por palpación (B1). */}
      <label className="flex items-center gap-2.5 rounded-md py-1 text-sm text-stone-700 dark:text-stone-200">
        <input
          type="checkbox"
          checked={prenez}
          onChange={(e) => setPrenez(e.target.checked)}
          className="h-4 w-4 accent-marca-600"
        />
        Preñez confirmada por palpación
      </label>
      {prenez && (
        <div>
          <label htmlFor="monta-fecha-palpacion" className={etiqueta}>Fecha de la palpación</label>
          <input id="monta-fecha-palpacion" type="date" name="fechaConfirmacion" key={hoy} defaultValue={hoy} className={campo} />
        </div>
      )}

      <input name="notas" aria-label="Notas (opcional)" placeholder="Notas (opcional)" maxLength={2000} className={campo} />
      <p className="text-xs text-stone-500 dark:text-stone-400">Esto solo registra la monta. El parto se anota aparte cuando ocurra.</p>
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
              {v.nombre ? `${v.nombre} (#${v.arete})` : `#${v.arete}`}
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
}: {
  vacaId: string;
  toros: Opcion[];
  posiblesCrias: Opcion[];
}) {
  const { error, cargando, enviar } = useEnviar();
  const hoy = useHoy();
  const [crias, setCrias] = useState<string[]>([]);

  function toggleCria(id: string) {
    setCrias((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

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
          },
          () => {
            form.reset();
            setCrias([]);
          }
        );
      }}
    >
      <Aviso error={error} />
      <div>
        <label htmlFor="parto-fecha" className={etiqueta}>Fecha del parto</label>
        <input id="parto-fecha" type="date" name="fecha" required key={hoy} defaultValue={hoy} className={campo} />
      </div>
      <div>
        <label htmlFor="parto-toro" className={etiqueta}>Toro / padre (opcional)</label>
        <select id="parto-toro" name="toroId" className={campo} defaultValue="">
          <option value="">— No lo sé / sin especificar —</option>
          {toros.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre ? `${t.nombre} (#${t.arete})` : `#${t.arete}`}
            </option>
          ))}
        </select>
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
          Primero agrega la cría como un animal nuevo; luego aquí la marcas. Puedes marcar más de una si fueron gemelos.
        </p>
        <div className="max-h-32 overflow-y-auto rounded border border-stone-200 p-2 text-sm">
          {posiblesCrias.length === 0 ? (
            <span className="text-stone-400">No hay animales para vincular todavía.</span>
          ) : (
            posiblesCrias.map((c) => (
              <label key={c.id} className="flex items-center gap-2.5 rounded-md px-1 py-2 hover:bg-stone-50 dark:hover:bg-stone-800/50">
                <input
                  type="checkbox"
                  checked={crias.includes(c.id)}
                  onChange={() => toggleCria(c.id)}
                  className="h-4 w-4 accent-marca-600"
                />
                {c.nombre ? `${c.nombre} (#${c.arete})` : `#${c.arete}`}
              </label>
            ))
          )}
        </div>
      </div>
      <button className={boton} disabled={cargando}>Guardar parto</button>
    </form>
  );
}

