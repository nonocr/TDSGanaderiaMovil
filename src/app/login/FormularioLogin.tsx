"use client";

import { useState } from "react";
import { llamarApi } from "@/lib/api-cliente";

export function FormularioLogin({ destino }: { destino: string }) {
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const fd = new FormData(e.currentTarget);
    const r = await llamarApi("/api/sesion", {
      method: "POST",
      body: { clave: fd.get("clave"), recordar: fd.get("recordar") === "on" },
    });
    if (!r.ok) {
      setError(r.error);
      setCargando(false);
      return;
    }
    // Recarga completa para que todo se pida ya con la sesión.
    window.location.assign(destino);
  }

  return (
    <form onSubmit={entrar} className="space-y-4">
      {/* Usuario fijo y oculto: los gestores de contraseñas (Chrome, Safari, Google…) lo
          necesitan para ofrecer guardar la contraseña y rellenarla sola la próxima vez. */}
      <input
        type="text"
        name="usuario"
        value="Finca Tierra de Sueños"
        autoComplete="username"
        readOnly
        hidden
      />
      <input
        type="password"
        name="clave"
        required
        autoFocus
        autoComplete="current-password"
        aria-label="Contraseña"
        placeholder="Contraseña"
        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
      />
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-stone-600 dark:text-stone-300">
        <input
          type="checkbox"
          name="recordar"
          defaultChecked
          className="h-5 w-5 shrink-0 accent-marca-600"
        />
        Mantener la sesión iniciada en este dispositivo
      </label>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={cargando}
        className="min-h-11 w-full rounded-lg bg-marca-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-marca-700 disabled:opacity-60"
      >
        {cargando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
