"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  type TooltipProps,
} from "recharts";
import type { PuntoLeche } from "@/lib/leche";

// Tooltip personalizado, MISMO patrón que la gráfica de peso (que funciona bien):
// un componente que recibe {active, payload} y se pasa con content={<...>}.
// (El Tooltip "nativo" con formatter/labelFormatter no mostraba nada en recharts 2.15.4.)
function TooltipLeche({ active, payload, tipo }: TooltipProps<number, string> & { tipo: "linea" | "barras" }) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload as PuntoLeche;
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-md dark:border-stone-700 dark:bg-stone-800">
      <div className="text-sm font-bold text-stone-800 dark:text-stone-100">
        {p.litros} <span className="text-xs font-medium text-stone-500 dark:text-stone-400">L/día</span>
      </div>
      <div className="mt-0.5 text-stone-600 dark:text-stone-300">{p.titulo}</div>
      {p.detalle && <div className="text-stone-500 dark:text-stone-400">{p.detalle}</div>}
      <div className="mt-1 border-t border-stone-100 pt-1 text-[11px] text-stone-500 dark:border-stone-700 dark:text-stone-400">
        {tipo === "barras" ? "Promedio de litros por día del periodo" : "Total del día (mañana + tarde)"}
      </div>
    </div>
  );
}

// Gráfica de litros por día. Mismo lenguaje visual que la de peso:
//  - "linea" (una vaca): línea suave con área sombreada y línea de promedio.
//  - "barras" (el hato): un total/promedio por semana o mes.
// La lógica de datos vive en src/lib/leche.ts (no se toca aquí).
export function GraficaLeche({
  puntos,
  tipo = "linea",
  promedio,
}: {
  puntos: PuntoLeche[];
  tipo?: "linea" | "barras";
  // Promedio a dibujar como línea de referencia (solo tiene sentido en el modo "linea").
  promedio?: number | null;
}) {
  // Detectar modo oscuro para ajustar colores de ejes/rejilla (igual que GraficaPeso).
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
        Aún no hay leche registrada. Anótala en &quot;Registrar → Leche&quot; para ver aquí la evolución.
      </p>
    );
  }

  // Color de leche: el mismo tono sky que el estado "En ordeño".
  const color = "#0284c7"; // sky-600
  const colorEje = oscuro ? "#78716c" : "#a8a29e"; // stone-500 / stone-400
  const colorRejilla = oscuro ? "#292524" : "#e7e5e4"; // stone-800 / stone-200
  const idDegradado = `degradadoLeche-${tipo}`;

  // OJO: estas piezas van como hijos DIRECTOS de la gráfica, nunca dentro de un Fragment (<>…</>).
  // recharts 2.x reconoce los Fragments con react-is 18, que no entiende los de React 19: lo que
  // va dentro de un Fragment no lo ve (por eso el Tooltip no aparecía).
  const rejilla = <CartesianGrid strokeDasharray="3 3" stroke={colorRejilla} />;
  const ejeX = (
    <XAxis
      dataKey="etiqueta"
      tick={{ fontSize: 12, fill: colorEje }}
      stroke={colorEje}
      interval="preserveStartEnd"
      minTickGap={16}
    />
  );
  const ejeY = (
    <YAxis
      tick={{ fontSize: 12, fill: colorEje }}
      stroke={colorEje}
      width={44}
      unit=" L"
      domain={[0, "auto"]}
      allowDecimals={false}
    />
  );
  const tooltip = (
    <Tooltip
      content={<TooltipLeche tipo={tipo} />}
      cursor={tipo === "barras" ? { fill: colorRejilla, opacity: 0.5 } : { stroke: color, strokeWidth: 1.5, strokeOpacity: 0.5 }}
    />
  );

  // Línea de promedio (solo en modo "linea" y si viene un promedio válido).
  const refPromedio =
    tipo === "linea" && promedio != null ? (
      <ReferenceLine
        y={promedio}
        stroke={color}
        strokeDasharray="5 4"
        strokeOpacity={0.75}
        label={{
          value: `prom. ${promedio} L`,
          position: "insideTopRight",
          fill: color,
          fontSize: 11,
          fontWeight: 600,
        }}
      />
    ) : null;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {tipo === "barras" ? (
          <BarChart data={puntos} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
            <defs>
              <linearGradient id={idDegradado} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                <stop offset="100%" stopColor={color} stopOpacity={0.55} />
              </linearGradient>
            </defs>
            {rejilla}
            {ejeX}
            {ejeY}
            {tooltip}
            <Bar dataKey="litros" name="Leche" fill={`url(#${idDegradado})`} radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        ) : (
          <AreaChart data={puntos} margin={{ top: 14, right: 12, bottom: 4, left: -8 }}>
            <defs>
              <linearGradient id={idDegradado} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            {rejilla}
            {ejeX}
            {ejeY}
            {tooltip}
            {refPromedio}
            <Area
              type="monotone"
              dataKey="litros"
              name="Leche"
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#${idDegradado})`}
              dot={{ r: 4, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
              isAnimationActive
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
