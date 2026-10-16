"use client";

import { useEffect, type RefObject } from "react";

// Accesibilidad de un modal/overlay abierto: atrapa el foco dentro del panel (Tab/Shift+Tab no se
// escapan al fondo), cierra con Escape, bloquea el scroll del fondo y devuelve el foco al elemento
// que tenía antes de abrir. Pensado para los diálogos con `role="dialog" aria-modal="true"`.
//
// Uso:
//   const panel = useRef<HTMLDivElement>(null);
//   useModalAccesible(abierto, panel, () => setAbierto(false));
//   ...
//   {abierto && <div role="dialog" aria-modal="true"><div ref={panel}>…</div></div>}
export function useModalAccesible(
  abierto: boolean,
  panelRef: RefObject<HTMLElement | null>,
  alCerrar: () => void
) {
  useEffect(() => {
    if (!abierto) return;

    const panel = panelRef.current;
    const focoPrevio = document.activeElement as HTMLElement | null;

    // Selector de elementos enfocables dentro del panel.
    const SELECTOR =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const enfocables = () =>
      panel ? Array.from(panel.querySelectorAll<HTMLElement>(SELECTOR)).filter((el) => el.offsetParent !== null) : [];

    // Foco inicial: el primer elemento enfocable del panel (o el panel mismo).
    const primeros = enfocables();
    if (primeros.length > 0) primeros[0].focus();
    else panel?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        alCerrar();
        return;
      }
      if (e.key !== "Tab") return;
      const lista = enfocables();
      if (lista.length === 0) return;
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      const activo = document.activeElement as HTMLElement | null;
      // Ciclo: desde el último con Tab vuelve al primero; desde el primero con Shift+Tab va al último.
      if (!e.shiftKey && activo === ultimo) {
        e.preventDefault();
        primero.focus();
      } else if (e.shiftKey && activo === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (panel && activo && !panel.contains(activo)) {
        // El foco se escapó del panel: lo traemos de vuelta.
        e.preventDefault();
        primero.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowPrevio;
      // Devolver el foco a quien lo tenía antes de abrir (si sigue en el documento).
      if (focoPrevio && document.contains(focoPrevio)) focoPrevio.focus();
    };
  }, [abierto, panelRef, alCerrar]);
}
