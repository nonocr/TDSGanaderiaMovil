"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  type TooltipProps,
} from "recharts";

export type PuntoPeso = {
  fechaISO: string; // ISO completo
  pesoKg: number;
};

// Formatea una fecha ISO como "ene 2024" / "10 ene" para el eje y el tooltip.
function fechaCorta(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short", timeZone: "UTC" });
}
function fechaLarga(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Tooltip personalizado para que combine con el estilo de la app (claro/oscuro).
function TooltipPeso({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const punto = payload[0].payload as { fechaISO: string; pesoKg: number };
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-md dark:border-stone-700 dark:bg-stone-800">
      <div className="font-semibold text-stone-800 dark:text-stone-100">{punto.pesoKg} kg</div>
      <div className="text-stone-500 dark:text-stone-400">{fechaLarga(punto.fechaISO)}</div>
    </div>
  );
}

export function GraficaPeso({ puntos }: { puntos: PuntoPeso[] }) {
  // Detectar modo oscuro para ajustar colores de ejes/rejilla.
  const [oscuro, setOscuro] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const actualizar = () => setOscuro(el.classList.contains("dark"));
    actualizar();
    const obs = new MutationObserver(actualizar);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  if (puntos.length === 0) {
    return (
      <p className="text-sm text-stone-500 dark:text-stone-400">
        Aún no hay pesos registrados. Agrega pesajes en &quot;Registrar evento&quot; para ver aquí la evolución.
      </p>
    );
  }

  // Ordenar cronológicamente y preparar los datos para la gráfica.
  const datos = puntos
    .slice()
    .sort((a, b) => a.fechaISO.localeCompare(b.fechaISO))
    .map((p) => ({ ...p, etiqueta: fechaCorta(p.fechaISO) }));

  // Resumen rápido: peso actual y variación desde el primer registro.
  const primero = datos[0];
  const ultimo = datos[datos.length - 1];
  const variacion = +(ultimo.pesoKg - primero.pesoKg).toFixed(1);

  const colorLinea = "#4b7a3f"; // marca-600
  const colorEje = oscuro ? "#78716c" : "#a8a29e"; // stone-500 / stone-400
  const colorRejilla = oscuro ? "#292524" : "#e7e5e4"; // stone-800 / stone-200

  return (
    <div>
      {datos.length >= 2 && (
        <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
          <span className="text-stone-500 dark:text-stone-400">
            Peso actual:{" "}
            <span className="font-semibold text-stone-800 dark:text-stone-100">{ultimo.pesoKg} kg</span>
          </span>
          <span className="text-stone-500 dark:text-stone-400">
            Desde el primer registro:{" "}
            <span
              className={
                variacion > 0
                  ? "font-semibold text-marca-700 dark:text-marca-400"
                  : variacion < 0
                  ? "font-semibold text-red-600 dark:text-red-400"
                  : "font-semibold text-stone-600 dark:text-stone-300"
              }
            >
              {variacion > 0 ? "+" : ""}
              {variacion} kg
            </span>
          </span>
          <span className="text-stone-500 dark:text-stone-400">({datos.length} pesajes)</span>
        </div>
      )}

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datos} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colorRejilla} />
            <XAxis
              dataKey="etiqueta"
              tick={{ fontSize: 12, fill: colorEje }}
              stroke={colorEje}
            />
            <YAxis
              tick={{ fontSize: 12, fill: colorEje }}
              stroke={colorEje}
              width={48}
              unit=" kg"
              domain={["auto", "auto"]}
            />
            <Tooltip content={<TooltipPeso />} />
            <Line
              type="monotone"
              dataKey="pesoKg"
              stroke={colorLinea}
              strokeWidth={2.5}
              dot={{ r: 4, fill: colorLinea, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
              isAnimationActive
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
