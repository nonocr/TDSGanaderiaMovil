"use client";

import { useEffect, useState } from "react";
import { IconoSol, IconoLuna } from "@/components/iconos";

// Botón sol/luna para alternar modo oscuro. Guarda la preferencia en localStorage.
// Hay dos montados a la vez (menú lateral y barra móvil): la verdad es la clase "dark" del
// <html>, y cada botón la observa para que ninguno quede con el icono o el valor viejo.
export function ToggleTema() {
  const [oscuro, setOscuro] = useState(false);
  const [montado, setMontado] = useState(false);

  // Al montar, leer el estado real del DOM (lo aplica el script del layout) y seguirlo.
  useEffect(() => {
    const html = document.documentElement;
    const leer = () => setOscuro(html.classList.contains("dark"));
    leer();
    setMontado(true);
    const obs = new MutationObserver(leer);
    obs.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  function alternar() {
    const html = document.documentElement;
    const nuevo = !html.classList.contains("dark");
    html.classList.toggle("dark", nuevo);
    try {
      localStorage.setItem("tema", nuevo ? "oscuro" : "claro");
    } catch {
      // Navegación privada / almacenamiento bloqueado: el tema vale solo para esta visita.
    }
  }

  return (
    <button
      onClick={alternar}
      aria-label={oscuro ? "Activar modo claro" : "Activar modo oscuro"}
      title={oscuro ? "Modo claro" : "Modo oscuro"}
      className="grid h-11 w-11 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
    >
      {/* Evita desajuste de hidratacion: no renderiza icono hasta montar */}
      {montado ? (oscuro ? <IconoSol className="h-5 w-5" /> : <IconoLuna className="h-5 w-5" />) : null}
    </button>
  );
}
