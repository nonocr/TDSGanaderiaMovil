"use client";

import { useEffect, useRef, useState, type ReactNode, type Touch as ReactTouch } from "react";

// Visor con zoom y desplazamiento (pan) para el árbol genealógico ampliado.
// - PC: rueda del mouse para acercar/alejar; arrastrar con el mouse para mover.
// - Celular: pellizcar (pinch) con dos dedos para el zoom; un dedo para mover.
// - Botones +/− y "restablecer" como alternativa accesible.

const MIN = 0.4;
const MAX = 3;

type Punto = { x: number; y: number };

export function VisorArbol({ children }: { children: ReactNode }) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);
  const [desp, setDesp] = useState<Punto>({ x: 0, y: 0 });

  // Refs para gestos (no provocan re-render en cada movimiento).
  const estado = useRef({
    // arrastre con un dedo / mouse
    arrastrando: false,
    inicio: { x: 0, y: 0 } as Punto,
    despInicio: { x: 0, y: 0 } as Punto,
    // pinch con dos dedos
    distInicial: 0,
    escalaInicial: 1,
    // si el puntero se movió más que el umbral, fue un arrastre: cancelar el clic.
    movido: false,
  });

  // Umbral (px) para distinguir un clic de un arrastre.
  const UMBRAL_ARRASTRE = 5;

  const limitar = (v: number) => Math.min(MAX, Math.max(MIN, v));

  // Zoom con la rueda del mouse. preventDefault para que no haga scroll de la página.
  useEffect(() => {
    const el = contenedorRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      setEscala((s) => limitar(s * factor));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // --- Mouse: arrastrar para mover ---
  function onMouseDown(e: React.MouseEvent) {
    estado.current.arrastrando = true;
    estado.current.movido = false;
    estado.current.inicio = { x: e.clientX, y: e.clientY };
    estado.current.despInicio = { ...desp };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!estado.current.arrastrando) return;
    const dx = e.clientX - estado.current.inicio.x;
    const dy = e.clientY - estado.current.inicio.y;
    if (Math.hypot(dx, dy) > UMBRAL_ARRASTRE) estado.current.movido = true;
    setDesp({ x: estado.current.despInicio.x + dx, y: estado.current.despInicio.y + dy });
  }
  function finArrastre() {
    estado.current.arrastrando = false;
  }

  // Si hubo arrastre, cancelar el clic que dispararía la navegación del enlace.
  function onClickCapture(e: React.MouseEvent) {
    if (estado.current.movido) {
      e.preventDefault();
      e.stopPropagation();
      estado.current.movido = false;
    }
  }

  // --- Touch: 1 dedo mueve, 2 dedos hacen pinch ---
  function distancia(t1: ReactTouch, t2: ReactTouch) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  }

  // Fija el punto de referencia del arrastre con el dedo indicado.
  function iniciarArrastreTouch(t: ReactTouch) {
    estado.current.arrastrando = true;
    estado.current.inicio = { x: t.clientX, y: t.clientY };
    estado.current.despInicio = { ...desp };
  }

  function onTouchStart(e: React.TouchEvent) {
    estado.current.movido = false;
    if (e.touches.length === 2) {
      estado.current.distInicial = distancia(e.touches[0], e.touches[1]);
      estado.current.escalaInicial = escala;
      estado.current.arrastrando = false;
    } else if (e.touches.length === 1) {
      iniciarArrastreTouch(e.touches[0]);
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    // No llamamos preventDefault: la clase `touch-none` ya evita el scroll/zoom nativo
    // y React registra touchmove como pasivo (preventDefault daría un aviso en consola).
    if (e.touches.length === 2 && estado.current.distInicial > 0) {
      const d = distancia(e.touches[0], e.touches[1]);
      const factor = d / estado.current.distInicial;
      setEscala(limitar(estado.current.escalaInicial * factor));
    } else if (e.touches.length === 1 && estado.current.arrastrando) {
      const dx = e.touches[0].clientX - estado.current.inicio.x;
      const dy = e.touches[0].clientY - estado.current.inicio.y;
      if (Math.hypot(dx, dy) > UMBRAL_ARRASTRE) estado.current.movido = true;
      setDesp({ x: estado.current.despInicio.x + dx, y: estado.current.despInicio.y + dy });
    }
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      // Se pasó de 2 dedos (pinch) a 1: reiniciar el punto de arrastre con el dedo
      // que queda para que no dé un salto.
      estado.current.distInicial = 0;
      iniciarArrastreTouch(e.touches[0]);
    } else if (e.touches.length === 0) {
      estado.current.arrastrando = false;
      estado.current.distInicial = 0;
    }
  }

  function acercar() {
    setEscala((s) => limitar(s * 1.2));
  }
  function alejar() {
    setEscala((s) => limitar(s / 1.2));
  }
  function restablecer() {
    setEscala(1);
    setDesp({ x: 0, y: 0 });
  }

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-stone-50/50 dark:bg-stone-950/40">
      {/* Lienzo con zoom/pan. touch-action none: gestionamos los gestos nosotros. */}
      <div
        ref={contenedorRef}
        className="h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={finArrastre}
        onMouseLeave={finArrastre}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClickCapture={onClickCapture}
        // Los nodos son enlaces: sin esto el navegador inicia el arrastre nativo del enlace
        // y deja de mandar mousemove (el árbol se "suelta" a mitad del arrastre).
        onDragStart={(e) => e.preventDefault()}
      >
        <div
          className="h-full w-full p-6"
          style={{
            transform: `translate(${desp.x}px, ${desp.y}px) scale(${escala})`,
            transformOrigin: "center center",
            transition: estado.current.arrastrando ? "none" : "transform 0.08s ease-out",
          }}
        >
          <div className="w-max">{children}</div>
        </div>
      </div>

      {/* Controles de zoom (abajo a la derecha, no se imprimen). */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={acercar}
          aria-label="Acercar"
          className="grid h-10 w-10 place-items-center rounded-lg border border-stone-200 bg-white text-lg font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50 active:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
        >
          +
        </button>
        <button
          type="button"
          onClick={alejar}
          aria-label="Alejar"
          className="grid h-10 w-10 place-items-center rounded-lg border border-stone-200 bg-white text-lg font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50 active:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
        >
          −
        </button>
        <button
          type="button"
          onClick={restablecer}
          aria-label="Restablecer zoom"
          title="Restablecer"
          className="grid h-10 w-10 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 shadow-sm transition-colors hover:bg-stone-50 active:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.4 2.6L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>

      {/* Indicador del nivel de zoom. */}
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-md bg-stone-800/70 px-2 py-1 text-xs font-medium text-white">
        {Math.round(escala * 100)}%
      </div>
    </div>
  );
}
