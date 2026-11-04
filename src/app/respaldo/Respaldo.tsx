"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconoRespaldo, IconoRestaurar } from "@/components/iconos";
import { hoyLocalISO } from "@/lib/fechas";
import { SIN_CONEXION } from "@/lib/api-cliente";
import { ACENTO, AvisoError, AvisoExito, Spinner, claseBoton, claseSuperficie } from "@/components/ui";
import { confirmar } from "@/components/Dialogos";

export function Respaldo() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [restaurando, setRestaurando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  // Descargar: pedimos el JSON y forzamos la descarga en el navegador.
  async function descargar() {
    setMensaje(null);
    setDescargando(true);
    try {
      const res = await fetch("/api/respaldo").catch(() => {
        throw new Error(SIN_CONEXION);
      });
      if (!res.ok) throw new Error("No se pudo generar el respaldo.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const fecha = hoyLocalISO(); // día local (en UTC, desde las 18:00 saldría la fecha de mañana)
      a.href = url;
      a.download = `respaldo-ganaderia-${fecha}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setMensaje({ tipo: "error", texto: e instanceof Error ? e.message : "Error al descargar." });
    } finally {
      setDescargando(false);
    }
  }

  // Restaurar: leer el archivo elegido y enviarlo. Reemplaza TODOS los datos.
  async function restaurar(archivo: File) {
    const si = await confirmar({
      titulo: "¿Restaurar este respaldo?",
      mensaje:
        `Archivo: ${archivo.name}\n\n` +
        "Se reemplazarán TODOS los datos actuales por los del archivo. Esto no se puede deshacer.\n\n" +
        "Consejo: descarga un respaldo de lo que tienes ahora antes de continuar.",
      accion: "Reemplazar todos los datos",
      peligro: true,
    });
    if (!si) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setMensaje(null);
    setRestaurando(true);
    try {
      const texto = await archivo.text();
      let datos: unknown;
      try {
        datos = JSON.parse(texto);
      } catch {
        throw new Error("El archivo no es un respaldo válido (no se pudo leer).");
      }
      const res = await fetch("/api/respaldo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      }).catch(() => {
        throw new Error(SIN_CONEXION);
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "No se pudo restaurar el respaldo.");
      setMensaje({
        tipo: "ok",
        texto: `Respaldo restaurado. Ahora hay ${data.animales} animal(es) registrados.`,
      });
      router.refresh();
    } catch (e) {
      setMensaje({ tipo: "error", texto: e instanceof Error ? e.message : "Error al restaurar." });
    } finally {
      setRestaurando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      {mensaje &&
        (mensaje.tipo === "ok" ? <AvisoExito>{mensaje.texto}</AvisoExito> : <AvisoError>{mensaje.texto}</AvisoError>)}

      {/* En escritorio, las dos acciones lado a lado; en móvil, una debajo de la otra. */}
      <div className="grid gap-4 lg:grid-cols-2">
      {/* Descargar respaldo */}
      <div className={`${claseSuperficie} flex flex-col p-5`}>
        <h2 className="flex items-center gap-2.5 text-base font-semibold text-stone-900 dark:text-stone-50">
          <span className={`grid h-9 w-9 place-items-center rounded-lg ${ACENTO.marca}`}>
            <IconoRespaldo className="h-5 w-5" />
          </span>
          Descargar respaldo
        </h2>
        <p className="mt-2 flex-1 text-sm text-stone-600 dark:text-stone-400">
          Guarda una copia de toda tu información (animales, eventos, pesos, leche) en un
          archivo. Guárdalo en un lugar seguro, como tu correo o la nube. Te recomendamos
          hacerlo cada cierto tiempo.
        </p>
        <button
          onClick={descargar}
          disabled={descargando}
          aria-busy={descargando || undefined}
          className={`${claseBoton("primario")} mt-4 w-full sm:w-auto sm:self-start`}
        >
          {descargando && <Spinner />}
          {descargando ? "Preparando…" : "Descargar respaldo"}
        </button>
      </div>

      {/* Restaurar respaldo */}
      <div className={`${claseSuperficie} flex flex-col p-5`}>
        <h2 className="flex items-center gap-2.5 text-base font-semibold text-stone-900 dark:text-stone-50">
          <span className={`grid h-9 w-9 place-items-center rounded-lg ${ACENTO.ambar}`}>
            <IconoRestaurar className="h-5 w-5" />
          </span>
          Restaurar respaldo
        </h2>
        <p className="mt-2 flex-1 text-sm text-stone-600 dark:text-stone-400">
          Carga un archivo de respaldo para recuperar tu información. Esto{" "}
          <span className="font-semibold text-stone-800 dark:text-stone-200">
            reemplaza todos los datos actuales
          </span>{" "}
          por los del archivo, así que úsalo con cuidado.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) restaurar(f);
          }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={restaurando}
          aria-busy={restaurando || undefined}
          className={`${claseBoton("secundario")} mt-4 w-full sm:w-auto sm:self-start`}
        >
          {restaurando && <Spinner />}
          {restaurando ? "Restaurando…" : "Elegir archivo y restaurar"}
        </button>
      </div>
      </div>
    </div>
  );
}
