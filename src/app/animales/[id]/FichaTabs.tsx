"use client";

import { useState, type ReactNode } from "react";
import { IconoInfo, IconoMas, IconoHistorial, IconoPeso, IconoLeche, IconoArbol } from "@/components/iconos";

type SeccionId = "info" | "arbol" | "grafica" | "historial" | "registrar";
type IconoTab = (p: React.SVGProps<SVGSVGElement>) => React.ReactElement;

// Pestaña de gráfica según el módulo: Peso (engorde) o Leche (lechería).
// Se pasa el tipo como texto: un componente de icono no puede viajar del servidor al cliente.
const GRAFICAS: Record<"peso" | "leche", { label: string; Icono: IconoTab }> = {
  peso: { label: "Peso", Icono: IconoPeso },
  leche: { label: "Leche", Icono: IconoLeche },
};

export function FichaTabs({
  info,
  arbol,
  grafica,
  historial,
  registrar,
}: {
  info: ReactNode;
  arbol: ReactNode;
  // null: el módulo no tiene gráfica (reproductores) y la pestaña no se muestra.
  grafica: { tipo: "peso" | "leche"; contenido: ReactNode } | null;
  historial: ReactNode;
  registrar: ReactNode;
}) {
  const [activa, setActiva] = useState<SeccionId>("info");

  const tabsVisibles: { id: SeccionId; label: string; Icono: IconoTab }[] = [
    { id: "info", label: "Info", Icono: IconoInfo },
    { id: "registrar", label: "Registrar", Icono: IconoMas },
    { id: "historial", label: "Historial", Icono: IconoHistorial },
    ...(grafica ? [{ id: "grafica" as const, ...GRAFICAS[grafica.tipo] }] : []),
    { id: "arbol", label: "Árbol", Icono: IconoArbol },
  ];

  const contenido: Record<SeccionId, ReactNode> = {
    info,
    arbol,
    grafica: grafica?.contenido,
    historial,
    registrar,
  };

  function elegir(id: SeccionId) {
    setActiva(id);
    // Si ya se bajó por la página (barra pegada arriba), volver al inicio del contenido nuevo.
    const barra = document.getElementById("pestanas-ficha");
    if (barra && barra.getBoundingClientRect().top < 100) {
      barra.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }

  // Navegación por teclado del patrón ARIA tabs: flechas mueven entre pestañas, Inicio/Fin a los
  // extremos. Mueve la selección y enfoca la nueva pestaña.
  function onTeclaTab(e: React.KeyboardEvent<HTMLDivElement>) {
    const teclas: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1 };
    const i = tabsVisibles.findIndex((t) => t.id === activa);
    let destino = -1;
    if (e.key in teclas) destino = (i + teclas[e.key] + tabsVisibles.length) % tabsVisibles.length;
    else if (e.key === "Home") destino = 0;
    else if (e.key === "End") destino = tabsVisibles.length - 1;
    else return;
    e.preventDefault();
    const nueva = tabsVisibles[destino].id;
    setActiva(nueva);
    document.getElementById(`tab-${nueva}`)?.focus();
  }

  return (
    <div>
      {/* Barra de pestañas: en móvil las 5 caben a lo ancho (icono + texto); no se imprime. */}
      <div
        id="pestanas-ficha"
        className="no-print sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mx-4 mb-4 scroll-mt-[calc(3.5rem+env(safe-area-inset-top))] border-b border-stone-200 bg-stone-100 px-2 sm:mx-0 sm:rounded-xl sm:border sm:bg-white sm:shadow-card lg:top-0 lg:scroll-mt-0 dark:border-stone-800 dark:bg-stone-950 sm:dark:bg-stone-900"
      >
        <div role="tablist" aria-label="Secciones del animal" onKeyDown={onTeclaTab} className={`grid gap-1 py-1.5 sm:flex ${tabsVisibles.length === 5 ? "grid-cols-5" : "grid-cols-4"}`}>
          {tabsVisibles.map((t) => {
            const activo = activa === t.id;
            const Icono = t.Icono;
            return (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                role="tab"
                aria-selected={activo}
                aria-controls={`panel-${t.id}`}
                tabIndex={activo ? 0 : -1}
                onClick={() => elegir(t.id)}
                className={
                  "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[11px] font-medium transition-colors sm:min-h-0 sm:flex-row sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm " +
                  (activo
                    ? "bg-marca-600 text-white shadow-sm"
                    : "text-stone-600 active:bg-stone-200/70 sm:hover:bg-stone-200/60 dark:text-stone-300 dark:active:bg-stone-800 sm:dark:hover:bg-stone-800")
                }
              >
                <Icono className="h-5 w-5 sm:h-4 sm:w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Secciones renderizadas UNA sola vez (sin duplicar componentes).
          - En pantalla: se ve solo la activa (las demás con 'hidden').
          - Al imprimir: todas se muestran (print:block), en un orden propio
            controlado con flex 'order', con título por sección y sin "Registrar". */}
      <div className="print:flex print:flex-col print:gap-6">
        {tabsVisibles.map((t) => {
          const esActiva = activa === t.id;
          const impr = IMPRESION[t.id];
          const seImprime = Boolean(impr);
          return (
            <section
              key={t.id}
              id={`panel-${t.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${t.id}`}
              className={
                (esActiva ? "block" : "hidden") +
                " " +
                (seImprime
                  ? `print:block print-evitar-corte ${impr!.orderClass}`
                  : "print:hidden")
              }
            >
              {seImprime && (
                <h2 className="hidden print:mb-2 print:flex print:items-center print:gap-2 print:border-b-2 print:border-marca-500 print:pb-1 print:text-sm print:font-bold print:uppercase print:tracking-wider print:text-marca-700">
                  <span className="print:inline-block print:h-3 print:w-1.5 print:rounded-full print:bg-marca-500" />
                  {impr!.titulo}
                </h2>
              )}
              {contenido[t.id]}
            </section>
          );
        })}
      </div>
    </div>
  );
}

// Config de impresión por sección: solo Información e Historial salen en papel.
// Las gráficas y el Árbol no se imprimen; "registrar" tampoco.
const IMPRESION: Partial<Record<SeccionId, { orderClass: string; titulo: string }>> = {
  info: { orderClass: "print:order-1", titulo: "Información del animal" },
  historial: { orderClass: "print:order-2", titulo: "Historial y etapas" },
};
