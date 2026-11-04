"use client";

import { useEffect, useState } from "react";
import { IconoSol, IconoLuna } from "@/components/iconos";
import { claseBotonIcono } from "@/components/ui";

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

  // Los dos iconos están siempre en el DOM, uno encima del otro, y se cruzan con fundido,
  // escala y desenfoque (icon swap). El que no toca queda invisible.
  const icono = (visible: boolean) =>
    "absolute inset-0 m-auto h-5 w-5 transition-[opacity,transform,filter] duration-[250ms] ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none " +
    (visible ? "scale-100 opacity-100 blur-0" : "scale-[0.25] opacity-0 blur-[4px]");

  return (
    <button
      onClick={alternar}
      aria-label={oscuro ? "Activar modo claro" : "Activar modo oscuro"}
      title={oscuro ? "Modo claro" : "Modo oscuro"}
      className={`${claseBotonIcono("discreto")} relative`}
    >
      {/* Evita desajuste de hidratacion: no renderiza icono hasta montar */}
      {montado && (
        <>
          <IconoSol className={icono(oscuro)} />
          <IconoLuna className={icono(!oscuro)} />
        </>
      )}
    </button>
  );
}
