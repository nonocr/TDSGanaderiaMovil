"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MODULO_LABEL, etiquetaArete } from "@/lib/tipos";
import { hoyLocalISO } from "@/lib/fechas";
import { llamarApi } from "@/lib/api-cliente";
import { claseCampo, claseEtiqueta, claseBotonPrimario } from "@/components/ui";

// Prefijo del arete interno que genera el backend para los animales sin arete físico. No se le
// muestra al usuario (ver src/lib/validar.ts, PREFIJO_SIN_ARETE).
const PREFIJO_SIN_ARETE = "S/N-";
const esAreteInterno = (a?: string | null) => typeof a === "string" && a.startsWith(PREFIJO_SIN_ARETE);

type Opcion = {
  id: string;
  arete: string;
  nombre: string | null;
  sinArete?: boolean | null;
  areteCenasa?: string | null;
};

export type ValoresAnimal = {
  id?: string;
  arete?: string;
  nombre?: string | null;
  sexo?: string;
  raza?: string | null;
  fechaNacimiento?: string | null; // ISO o yyyy-mm-dd
  descripcion?: string | null;
  estado?: string;
  modulo?: string;
  codigo?: string | null;
  areteCenasa?: string | null;
  sinArete?: boolean;
  esPajilla?: boolean;
  categoria?: string | null; // "NOVILLA" | "VACA" (solo hembras de lechería)
  fechaBaja?: string | null; // ISO o yyyy-mm-dd
  motivoBaja?: string | null;
  padreId?: string | null;
  madreId?: string | null;
  padreExterno?: string | null;
  madreExterno?: string | null;
};

function soloFecha(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function FormularioAnimal({
  machos,
  hembras,
  valores,
  moduloInicial,
}: {
  machos: Opcion[];
  hembras: Opcion[];
  valores?: ValoresAnimal;
  // Módulo preseleccionado al dar de alta (p. ej. desde la página de Lechería).
  moduloInicial?: string;
}) {
  const router = useRouter();
  const esEdicion = Boolean(valores?.id);

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [padreModo, setPadreModo] = useState<"registrado" | "externo">(
    valores?.padreExterno ? "externo" : "registrado"
  );
  const [madreModo, setMadreModo] = useState<"registrado" | "externo">(
    valores?.madreExterno ? "externo" : "registrado"
  );
  const [estado, setEstado] = useState<string>(valores?.estado ?? "ACTIVO");
  const esBaja = estado === "VENDIDO" || estado === "MUERTO";

  // El animal no tiene arete físico: se identifica por el arete de SENASA (que pasa a ser
  // obligatorio). El arete interno lo genera/conserva el backend.
  const [sinArete, setSinArete] = useState<boolean>(valores?.sinArete ?? false);

  // El módulo determina qué campos se muestran. Controlado para poder reaccionar al cambio.
  const [modulo, setModulo] = useState<string>(valores?.modulo ?? moduloInicial ?? "ENGORDE");
  const esEngorde = modulo === "ENGORDE";
  const esLecheria = modulo === "LECHERIA";
  const esReproductor = modulo === "REPRODUCTOR";

  // Dentro de Reproductores: un TORO (animal físico, formulario completo) o una PAJILLA
  // (semen: solo se captura el código, sin arete ni más datos).
  const [tipoReproductor, setTipoReproductor] = useState<"TORO" | "PAJILLA">(
    valores?.esPajilla ? "PAJILLA" : "TORO"
  );
  const esPajilla = esReproductor && tipoReproductor === "PAJILLA";

  // Sexo fijo por módulo: lechería = hembra, reproductor = macho. Engorde pregunta.
  const sexoFijo = esLecheria ? "HEMBRA" : esReproductor ? "MACHO" : null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    const fd = new FormData(e.currentTarget);

    // El prefijo "S/N-" está reservado para el arete interno de los animales sin arete: no se
    // puede escribir a mano (el backend lo rechaza con 400; avisamos antes para mejor UX).
    const areteEscrito = String(fd.get(esPajilla ? "codigo" : "arete") ?? "");
    if (!sinArete && esAreteInterno(areteEscrito.trim())) {
      setError(`El ${esPajilla ? "código" : "arete"} no puede empezar con "${PREFIJO_SIN_ARETE}" (es un valor reservado).`);
      setGuardando(false);
      return;
    }

    let payload: Record<string, unknown>;
    if (esPajilla) {
      // Pajilla: solo el código. El backend lo usa como arete y rellena el resto (MACHO,
      // módulo REPRODUCTOR). Si está dada de baja, se mandan los datos de baja.
      payload = {
        modulo: "REPRODUCTOR",
        esPajilla: true,
        codigo: fd.get("codigo"),
        // Arete oficial de SENASA (opcional).
        areteCenasa: fd.get("areteCenasa") || null,
        estado: fd.get("estado") ?? "ACTIVO",
        fechaBaja: fd.get("fechaBaja") || null,
        motivoBaja: fd.get("motivoBaja") || null,
      };
    } else {
      // En reproductores el campo fecha no se muestra: se conserva la que ya tuviera.
      const fechaNacimiento = esReproductor
        ? soloFecha(valores?.fechaNacimiento) || null
        : (fd.get("fechaNacimiento") as string) || null;
      payload = {
        // Si no tiene arete, se reenvía el arete interno existente (al editar) para que el
        // backend lo conserve; en el alta va vacío y el backend genera uno.
        arete: sinArete ? (valores?.arete ?? "") : fd.get("arete"),
        sinArete,
        nombre: fd.get("nombre"),
        // Sexo: el fijo por módulo, o el elegido en engorde.
        sexo: sexoFijo ?? fd.get("sexo"),
        raza: fd.get("raza"),
        fechaNacimiento,
        descripcion: fd.get("descripcion"),
        estado: fd.get("estado") ?? "ACTIVO",
        modulo,
        // Código solo en reproductores.
        codigo: esReproductor ? fd.get("codigo") || null : null,
        // Arete oficial de SENASA (opcional, cualquier módulo).
        areteCenasa: fd.get("areteCenasa") || null,
        esPajilla: false,
        // Novilla / Vaca: solo hembras de lechería.
        categoria: esLecheria ? fd.get("categoria") || null : null,
        fechaBaja: fd.get("fechaBaja") || null,
        motivoBaja: fd.get("motivoBaja") || null,
      };

      if (padreModo === "registrado") payload.padreId = fd.get("padreId") || null;
      else payload.padreExterno = fd.get("padreExterno") || null;

      if (madreModo === "registrado") payload.madreId = fd.get("madreId") || null;
      else payload.madreExterno = fd.get("madreExterno") || null;
    }

    const url = esEdicion ? `/api/animales/${valores!.id}` : "/api/animales";
    const method = esEdicion ? "PUT" : "POST";

    // llamarApi nunca lanza: sin señal o con red lenta devuelve { ok:false, error } en vez de
    // dejar el botón en "Guardando…" para siempre (ver src/lib/api-cliente.ts).
    const r = await llamarApi<{ id: string }>(url, { method, body: payload });
    if (!r.ok) {
      setError(r.error);
      setGuardando(false);
      return;
    }
    const animal = r.data!;

    // Engorde en alta: si se indicó peso al nacer, se guarda como el primer registro de
    // peso, con la fecha de nacimiento (o la de hoy si no hay fecha de nacimiento).
    // Si falla, el animal ya existe: se avisa y se sigue a su ficha (allí se puede añadir).
    const pesoNacer = (fd.get("pesoNacer") as string) || "";
    if (!esEdicion && esEngorde && pesoNacer.trim()) {
      // En engorde la fecha de nacimiento sale del formulario; si no hay, se usa hoy.
      const fechaNac = (fd.get("fechaNacimiento") as string) || hoyLocalISO();
      const rPeso = await llamarApi("/api/pesos", {
        method: "POST",
        body: { animalId: animal.id, fecha: fechaNac, pesoKg: pesoNacer, notas: "Peso al nacer" },
      });
      if (!rPeso.ok) {
        alert(
          `El animal se guardó, pero no el peso al nacer: ${rPeso.error} ` +
            "Puedes añadirlo desde su ficha en Registrar → Peso."
        );
      }
    }

    router.push(`/animales/${animal.id}`);
    router.refresh();
  }

  const campo = claseCampo;
  const etiqueta = claseEtiqueta;

  // Evitar que el animal sea su propio progenitor: lo quitamos de las listas.
  const machosFiltrados = machos.filter((m) => m.id !== valores?.id);
  const hembrasFiltradas = hembras.filter((h) => h.id !== valores?.id);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Módulo: define el resto del formulario. En edición no se cambia (regla de negocio). */}
      <div>
        <label htmlFor="fa-modulo" className={etiqueta}>Módulo *</label>
        {esEdicion ? (
          <>
            <input type="hidden" name="modulo" value={modulo} />
            <p className="mt-1 text-sm text-stone-700 dark:text-stone-200">
              {MODULO_LABEL[modulo] ?? modulo}{" "}
              <span className="text-xs text-stone-400">(no se puede cambiar)</span>
            </p>
          </>
        ) : (
          <>
            <select
              id="fa-modulo"
              name="modulo"
              required
              className={campo}
              value={modulo}
              onChange={(e) => {
                setModulo(e.target.value);
                // En el alta de lechería no se pregunta el estado: siempre Activo.
                if (e.target.value === "LECHERIA") setEstado("ACTIVO");
              }}
            >
              <option value="ENGORDE">{MODULO_LABEL.ENGORDE} (crías para carne)</option>
              <option value="LECHERIA">{MODULO_LABEL.LECHERIA} (vacas de leche)</option>
              <option value="REPRODUCTOR">{MODULO_LABEL.REPRODUCTOR} (toros / pajillas)</option>
            </select>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              A qué grupo pertenece. No se cambia después.
            </p>
          </>
        )}
      </div>

      {/* Reproductores: ¿toro físico o pajilla (semen)? Solo al dar de alta. */}
      {esReproductor && !esEdicion && (
        <div>
          <span className={etiqueta}>Tipo *</span>
          <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <label className="flex items-center gap-2 py-1">
              <input
                type="radio"
                name="tipoReproductor"
                className="h-4 w-4 accent-marca-600"
                checked={tipoReproductor === "TORO"}
                onChange={() => setTipoReproductor("TORO")}
              />
              Toro
            </label>
            <label className="flex items-center gap-2 py-1">
              <input
                type="radio"
                name="tipoReproductor"
                className="h-4 w-4 accent-marca-600"
                checked={tipoReproductor === "PAJILLA"}
                onChange={() => setTipoReproductor("PAJILLA")}
              />
              Pajilla
            </label>
          </div>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Un toro es un animal físico. Una pajilla es semen comprado: solo se registra su código.
          </p>
        </div>
      )}

      {/* PAJILLA: solo el código. */}
      {esPajilla ? (
        <div>
          <label htmlFor="fa-codigo-pajilla" className={etiqueta}>Código de la pajilla *</label>
          <input
            id="fa-codigo-pajilla"
            name="codigo"
            maxLength={60}
            required
            className={campo}
            placeholder="Ej. ANGUS-07"
            defaultValue={valores?.codigo ?? ""}
          />
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Luego podrás añadir más datos del código.
          </p>
          {/* Arete oficial de SENASA: opcional, también para pajillas. */}
          <div className="mt-4">
            <label htmlFor="fa-arete-cenasa-pajilla" className={etiqueta}>Arete de SENASA (opcional)</label>
            <input
              id="fa-arete-cenasa-pajilla"
              name="areteCenasa"
              maxLength={60}
              className={campo}
              placeholder="Ej. CR-000123456"
              defaultValue={valores?.areteCenasa ?? ""}
            />
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Arete oficial de trazabilidad. Déjalo en blanco si no aplica.
            </p>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
            <input
              type="checkbox"
              className="h-5 w-5 shrink-0 accent-marca-600"
              checked={sinArete}
              onChange={(e) => setSinArete(e.target.checked)}
            />
            Este animal no tiene arete (se identifica por el arete de SENASA)
          </label>
        </div>

        {!sinArete ? (
          <div>
            <label htmlFor="fa-arete" className={etiqueta}>Número de arete *</label>
            <input id="fa-arete" name="arete" maxLength={60} required className={campo} placeholder="Ej. 025" defaultValue={esAreteInterno(valores?.arete) ? "" : valores?.arete ?? ""} />
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              El número de la chapa/caravana. No se puede repetir entre animales.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-400">
            Sin arete de la finca. Completa abajo el <strong>arete de SENASA</strong>: será lo que
            identifique a este animal.
          </div>
        )}
        <div>
          <label htmlFor="fa-nombre" className={etiqueta}>Nombre (opcional)</label>
          <input id="fa-nombre" name="nombre" maxLength={120} className={campo} placeholder="Ej. Estrella" defaultValue={valores?.nombre ?? ""} />
        </div>

        {/* Sexo: solo se pregunta en engorde. En lechería/reproductor es fijo (campo oculto). */}
        {esEngorde ? (
          <div>
            <label htmlFor="fa-sexo" className={etiqueta}>Sexo *</label>
            <select id="fa-sexo" name="sexo" required className={campo} defaultValue={valores?.sexo ?? "HEMBRA"}>
              <option value="HEMBRA">Hembra</option>
              <option value="MACHO">Macho</option>
            </select>
          </div>
        ) : (
          <input type="hidden" name="sexo" value={sexoFijo ?? "HEMBRA"} />
        )}

        {/* Novilla o vaca: solo hembras de lechería. Obligatorio al dar de alta. Una novilla
            pasa sola a vaca al registrar su primer parto. */}
        {esLecheria && (
          <div>
            <label htmlFor="fa-categoria" className={etiqueta}>Categoría {esEdicion ? "" : "*"}</label>
            <select
              id="fa-categoria"
              name="categoria"
              required={!esEdicion}
              className={campo}
              defaultValue={valores?.categoria ?? ""}
            >
              <option value="" disabled={!esEdicion}>
                {esEdicion ? "— Sin indicar —" : "— Elegir —"}
              </option>
              <option value="NOVILLA">Novilla (aún no ha parido)</option>
              <option value="VACA">Vaca</option>
            </select>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Una novilla pasa a vaca sola cuando se registra su primer parto.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="fa-raza" className={etiqueta}>Raza</label>
          <input id="fa-raza" name="raza" maxLength={60} className={campo} defaultValue={valores?.raza ?? ""} />
        </div>

        {/* Arete oficial de SENASA: opcional, salvo cuando el animal no tiene arete de la finca
            (entonces es su identificador y pasa a ser obligatorio). */}
        <div>
          <label htmlFor="fa-arete-cenasa" className={etiqueta}>
            Arete de SENASA {sinArete ? "*" : "(opcional)"}
          </label>
          <input
            id="fa-arete-cenasa"
            name="areteCenasa"
            maxLength={60}
            required={sinArete}
            className={campo}
            placeholder="Ej. CR-000123456"
            defaultValue={valores?.areteCenasa ?? ""}
          />
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {sinArete
              ? "Obligatorio: identifica al animal al no tener arete de la finca."
              : "Arete oficial de trazabilidad. Déjalo en blanco si el animal no lo tiene."}
          </p>
        </div>

        {/* Fecha de nacimiento: en reproductor no hace falta. */}
        {!esReproductor && (
          <div>
            <label htmlFor="fa-nacimiento" className={etiqueta}>Fecha de nacimiento {esLecheria ? "(opcional)" : ""}</label>
            <input id="fa-nacimiento" type="date" name="fechaNacimiento" className={campo} defaultValue={soloFecha(valores?.fechaNacimiento)} />
          </div>
        )}

        {/* Peso al nacer: solo engorde y solo al dar de alta. */}
        {esEngorde && !esEdicion && (
          <div>
            <label htmlFor="fa-peso" className={etiqueta}>Peso al nacer (kg)</label>
            <input id="fa-peso" type="number" step="0.1" min={0} max={200} name="pesoNacer" className={campo} placeholder="Ej. 32" />
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Se guarda como su primer registro de peso.
            </p>
          </div>
        )}

        {/* Código: solo reproductores. */}
        {esReproductor && (
          <div>
            <label htmlFor="fa-codigo" className={etiqueta}>Código</label>
            <input id="fa-codigo" name="codigo" maxLength={60} className={campo} placeholder="Ej. TORO-123" defaultValue={valores?.codigo ?? ""} />
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Código del toro o de la pajilla.
            </p>
          </div>
        )}

        {/* Estado: en el alta mínima de lechería no se pregunta (siempre Activo). En edición sí. */}
        {(!esLecheria || esEdicion) && (
          <div>
            <label htmlFor="fa-estado" className={etiqueta}>Estado</label>
            <select
              id="fa-estado"
              name="estado"
              className={campo}
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="ACTIVO">Activo</option>
              <option value="VENDIDO">Vendido</option>
              <option value="MUERTO">Muerto</option>
            </select>
          </div>
        )}
      </div>
      )}

      {/* Estado de la pajilla (para poder darla de baja). Solo en edición de una pajilla. */}
      {esPajilla && esEdicion && (
        <div>
          <label htmlFor="fa-estado-pajilla" className={etiqueta}>Estado</label>
          <select
            id="fa-estado-pajilla"
            name="estado"
            className={campo}
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="ACTIVO">Activo</option>
            <option value="VENDIDO">Vendido</option>
            <option value="MUERTO">Muerto</option>
          </select>
        </div>
      )}

      {/* Datos de baja: solo cuando el animal está Vendido o Muerto. */}
      {esBaja && (
        <fieldset className="rounded border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/60 dark:bg-amber-950/20">
          <legend className="px-1 text-sm font-semibold text-amber-700 dark:text-amber-400">
            {estado === "VENDIDO" ? "Datos de la venta" : "Datos de la baja"}
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fa-fecha-baja" className={etiqueta}>
                {estado === "VENDIDO" ? "Fecha de venta" : "Fecha de muerte"}
              </label>
              <input
                id="fa-fecha-baja"
                type="date"
                name="fechaBaja"
                className={campo}
                defaultValue={soloFecha(valores?.fechaBaja)}
              />
            </div>
            <div>
              <label htmlFor="fa-motivo" className={etiqueta}>Motivo</label>
              <input
                id="fa-motivo"
                name="motivoBaja"
                maxLength={2000}
                className={campo}
                placeholder={
                  estado === "VENDIDO"
                    ? "Ej. Vendido a Finca El Roble"
                    : "Ej. Enfermedad"
                }
                defaultValue={valores?.motivoBaja ?? ""}
              />
            </div>
          </div>
        </fieldset>
      )}

      {/* Descripción: en el alta mínima de lechería no se pide; en pajilla tampoco. */}
      {!esPajilla && (!esLecheria || esEdicion) && (
        <div>
          <label htmlFor="fa-descripcion" className={etiqueta}>Descripción / notas</label>
          <textarea id="fa-descripcion" name="descripcion" maxLength={2000} rows={2} className={campo} defaultValue={valores?.descripcion ?? ""} />
        </div>
      )}

      {/* Genealogía: una pajilla no tiene padres registrados. */}
      {!esPajilla && (
      <>
      {/* Genealogia: padre */}
      <fieldset className="rounded border border-stone-200 p-3 dark:border-stone-700">
        <legend className="px-1 text-sm font-semibold text-stone-600 dark:text-stone-300">Padre (opcional)</legend>
        <p className="mb-2 text-xs text-stone-500 dark:text-stone-400">
          Elige &quot;Registrado&quot; si el padre ya está en la app (solo aparecen los toros y pajillas de
          Reproductores). Elige &quot;De otra finca&quot; si es un animal que no tienes registrado (solo
          escribes su nombre). Puedes dejarlo en blanco si no lo sabes.
        </p>
        <div className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <label className="flex items-center gap-2 py-1">
            <input type="radio" name="padreModo" className="h-4 w-4 accent-marca-600" checked={padreModo === "registrado"} onChange={() => setPadreModo("registrado")} />
            Registrado
          </label>
          <label className="flex items-center gap-2 py-1">
            <input type="radio" name="padreModo" className="h-4 w-4 accent-marca-600" checked={padreModo === "externo"} onChange={() => setPadreModo("externo")} />
            De otra finca
          </label>
        </div>
        {padreModo === "registrado" ? (
          <select name="padreId" aria-label="Padre registrado" className={campo} defaultValue={valores?.padreId ?? ""}>
            <option value="">— Sin especificar —</option>
            {machosFiltrados.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre ? `${m.nombre} (${etiquetaArete(m)})` : etiquetaArete(m)}
              </option>
            ))}
          </select>
        ) : (
          <input name="padreExterno" aria-label="Nombre del padre de otra finca" maxLength={120} className={campo} placeholder="Ej. Toro de la finca vecina" defaultValue={valores?.padreExterno ?? ""} />
        )}
      </fieldset>

      {/* Genealogia: madre */}
      <fieldset className="rounded border border-stone-200 p-3 dark:border-stone-700">
        <legend className="px-1 text-sm font-semibold text-stone-600 dark:text-stone-300">Madre (opcional)</legend>
        <p className="mb-2 text-xs text-stone-500 dark:text-stone-400">
          Elige &quot;Registrada&quot; si la madre ya está en la app. Elige &quot;De otra finca&quot; si no la tienes
          registrada (solo escribes su nombre). Puedes dejarlo en blanco si no lo sabes.
        </p>
        <div className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <label className="flex items-center gap-2 py-1">
            <input type="radio" name="madreModo" className="h-4 w-4 accent-marca-600" checked={madreModo === "registrado"} onChange={() => setMadreModo("registrado")} />
            Registrada
          </label>
          <label className="flex items-center gap-2 py-1">
            <input type="radio" name="madreModo" className="h-4 w-4 accent-marca-600" checked={madreModo === "externo"} onChange={() => setMadreModo("externo")} />
            De otra finca
          </label>
        </div>
        {madreModo === "registrado" ? (
          <select name="madreId" aria-label="Madre registrada" className={campo} defaultValue={valores?.madreId ?? ""}>
            <option value="">— Sin especificar —</option>
            {hembrasFiltradas.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nombre ? `${h.nombre} (${etiquetaArete(h)})` : etiquetaArete(h)}
              </option>
            ))}
          </select>
        ) : (
          <input name="madreExterno" aria-label="Nombre de la madre de otra finca" maxLength={120} className={campo} placeholder="Ej. Vaca no registrada" defaultValue={valores?.madreExterno ?? ""} />
        )}
      </fieldset>
      </>
      )}

      <button
        type="submit"
        disabled={guardando}
        className={`${claseBotonPrimario} w-full sm:w-auto`}
      >
        {guardando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Guardar animal"}
      </button>
    </form>
  );
}
