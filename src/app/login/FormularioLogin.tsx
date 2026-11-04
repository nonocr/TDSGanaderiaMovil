"use client";

import { useState } from "react";
import { llamarApi } from "@/lib/api-cliente";
import { IconoOjo, IconoOjoTachado } from "@/components/iconos";
import { AvisoError, BotonEnviar, claseCampo, claseEtiqueta } from "@/components/ui";

export function FormularioLogin({ destino }: { destino: string }) {
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mostrarClave, setMostrarClave] = useState(false);

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
      <div>
        <label htmlFor="login-clave" className={claseEtiqueta}>
          Contraseña
        </label>
        <div className="relative">
          <input
            id="login-clave"
            type={mostrarClave ? "text" : "password"}
            name="clave"
            required
            autoFocus
            autoComplete="current-password"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "login-error" : undefined}
            className={`${claseCampo} min-h-12 pr-12 text-base sm:min-h-12`}
          />
          <button
            type="button"
            onClick={() => setMostrarClave((v) => !v)}
            aria-label={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={mostrarClave}
            title={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute bottom-0.5 right-0.5 top-[calc(0.25rem+2px)] grid w-11 place-items-center rounded-xl text-stone-500 hover:text-stone-800 active:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          >
            {mostrarClave ? (
              <IconoOjoTachado className="h-5 w-5" />
            ) : (
              <IconoOjo className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-stone-700 dark:text-stone-300">
        <input
          type="checkbox"
          name="recordar"
          defaultChecked
          className="h-5 w-5 shrink-0 accent-marca-600"
        />
        Mantener la sesión iniciada en este dispositivo
      </label>
      {error && (
        <div id="login-error">
          <AvisoError>{error}</AvisoError>
        </div>
      )}
      <BotonEnviar cargando={cargando} textoCargando="Entrando…" className="min-h-12 w-full text-base sm:min-h-12">
        Entrar
      </BotonEnviar>
    </form>
  );
}
