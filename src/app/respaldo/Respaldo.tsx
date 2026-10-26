"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconoRespaldo, IconoRestaurar } from "@/components/iconos";
import { hoyLocalISO } from "@/lib/fechas";
import { SIN_CONEXION } from "@/lib/api-cliente";

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
    const confirmar = confirm(
      "¿Restaurar este respaldo?\n\n" +
        "Se reemplazarán TODOS los datos actuales por los del archivo. " +
        "Esto no se puede deshacer.\n\n" +
        "Consejo: descarga un respaldo de lo que tienes ahora antes de continuar."
    );
    if (!confirmar) {
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
    <div className="space-y-6">
      {mensaje && (
        <div
          role={mensaje.tipo === "ok" ? "status" : "alert"}
          className={
            "rounded-lg border px-4 py-3 text-sm " +
            (mensaje.tipo === "ok"
              ? "border-marca-200 bg-marca-50 text-marca-800 dark:border-marca-800 dark:bg-marca-950 dark:text-marca-200"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300")
          }
        >
          {mensaje.texto}
        </div>
      )}

      {/* Descargar respaldo */}
      <div className="rounded-xl border border-stone-200/80 bg-white p-5 shadow-card dark:border-stone-800 dark:bg-stone-900">
        <h2 className="flex items-center gap-2 text-base font-bold text-stone-800 dark:text-stone-100">
<IconoRespaldo className="h-5 w-5 text-marca-600 dark:text-marca-400" /> Descargar respaldo
        </h2>
        <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400">
          Guarda una copia de toda tu información (animales, eventos, pesos, leche) en un
          archivo. Guárdalo en un lugar seguro, como tu correo o la nube. Te recomendamos
          hacerlo cada cierto tiempo.
        </p>
        <button
          onClick={descargar}
          disabled={descargando}
          className="mt-4 w-full rounded-lg bg-marca-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-marca-700 disabled:opacity-50 sm:w-auto"
        >
          {descargando ? "Preparando…" : "Descargar respaldo"}
        </button>
      </div>

      {/* Restaurar respaldo */}
      <div className="rounded-xl border border-stone-200/80 bg-white p-5 shadow-card dark:border-stone-800 dark:bg-stone-900">
        <h2 className="flex items-center gap-2 text-base font-bold text-stone-800 dark:text-stone-100">
<IconoRestaurar className="h-5 w-5 text-marca-600 dark:text-marca-400" /> Restaurar respaldo
        </h2>
        <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400">
          Carga un archivo de respaldo para recuperar tu información. Esto{" "}
          <span className="font-semibold text-stone-700 dark:text-stone-200">
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
          className="mt-4 w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50 sm:w-auto dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
        >
          {restaurando ? "Restaurando…" : "Elegir archivo y restaurar"}
        </button>
      </div>
    </div>
  );
}
