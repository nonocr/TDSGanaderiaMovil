"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { PuntoPeso } from "./GraficaPeso";

// La librería de gráficas (recharts) pesa ~350 KB: se descarga SOLO cuando la pestaña
// "Peso" se hace visible, no con cada ficha.
const GraficaPeso = dynamic(() => import("./GraficaPeso").then((m) => m.GraficaPeso), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-lg bg-stone-100 dark:bg-stone-800" />,
});

export function GraficaPesoDiferida({ puntos }: { puntos: PuntoPeso[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    // Mientras la pestaña está oculta (display: none) el ancho es 0.
    const obs = new ResizeObserver(() => {
      if (el.offsetWidth > 0) setVisible(true);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible]);

  // Sin datos no hace falta descargar recharts: el aviso se muestra aquí mismo.
  if (puntos.length === 0) {
    return (
      <p className="text-sm text-stone-500 dark:text-stone-400">
        Aún no hay pesos registrados. Agrega pesajes en &quot;Registrar evento&quot; para ver aquí la evolución.
      </p>
    );
  }
  return <div ref={ref}>{visible && <GraficaPeso puntos={puntos} />}</div>;
}
