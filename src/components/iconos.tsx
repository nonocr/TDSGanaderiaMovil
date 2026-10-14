// Iconos de línea (SVG) monocromáticos. Heredan el color del texto (currentColor),
// así que no tienen color propio: toman el del elemento que los contiene.
import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;
export type IconoProps = Props;
// Tipo de un componente de icono (para pasarlos como dato en arrays/configs).
export type Icono = (p: Props) => React.JSX.Element;

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconoInicio(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

export function IconoLista(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </svg>
  );
}

export function IconoToro(p: Props) {
  // Cabeza de toro de frente: cuernos grandes y curvos, orejas, hocico ancho con argolla.
  return (
    <svg {...base} {...p}>
      {/* cuernos grandes hacia arriba */}
      <path d="M5 9C2.5 8 1.5 5.5 2 3.5c2 .3 3.6 1.6 4.4 3.6" />
      <path d="M19 9c2.5-1 3.5-3.5 3-5.5-2 .3-3.6 1.6-4.4 3.6" />
      {/* orejas */}
      <path d="M6.4 7.5 4 8.2" />
      <path d="M17.6 7.5 20 8.2" />
      {/* cara */}
      <path d="M6 9.5c0-1.3 2.7-2 6-2s6 .7 6 2v3a6 6 0 0 1-12 0v-3Z" />
      {/* ojos */}
      <path d="M9.5 11v1.2M14.5 11v1.2" />
      {/* hocico y argolla */}
      <path d="M9 16.2c0-1 1.3-1.5 3-1.5s3 .5 3 1.5-1.3 1.8-3 1.8-3-.8-3-1.8Z" />
      <path d="M11 16.3h2" />
      <path d="M12 18v1.4a1.6 1.6 0 0 0 1.6 1.6" />
    </svg>
  );
}

export function IconoVaca(p: Props) {
  // Cabeza de vaca de frente: orejas grandes a los lados, cuernitos cortos, hocico y manchas.
  return (
    <svg {...base} {...p}>
      {/* cuernitos cortos */}
      <path d="M8 6.5c-.6-1-.8-2-.6-3M16 6.5c.6-1 .8-2 .6-3" />
      {/* orejas grandes */}
      <path d="M6.5 8.5C4.5 8 2.8 8.6 2 10c1.2 1 2.9 1.1 4.4.3" />
      <path d="M17.5 8.5c2-.5 3.7.1 4.5 1.5-1.2 1-2.9 1.1-4.4.3" />
      {/* cara */}
      <path d="M6.2 9.5c0-1.1 2.6-1.8 5.8-1.8s5.8.7 5.8 1.8v2.5a5.8 5.8 0 0 1-11.6 0v-2.5Z" />
      {/* ojos */}
      <path d="M9.5 11v1.2M14.5 11v1.2" />
      {/* hocico */}
      <path d="M8.5 15.8c0-1.3 1.6-2 3.5-2s3.5.7 3.5 2-1.6 2.2-3.5 2.2-3.5-.9-3.5-2.2Z" />
      <path d="M10.8 16.2v.01M13.2 16.2v.01" />
    </svg>
  );
}

export function IconoFamilia(p: Props) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="5" r="2.2" />
      <circle cx="5.5" cy="18.5" r="2.2" />
      <circle cx="18.5" cy="18.5" r="2.2" />
      <path d="M12 7.2v4.3M12 11.5H5.5v4.8M12 11.5h6.5v4.8" />
    </svg>
  );
}

export function IconoCalendario(p: Props) {
  return (
    <svg {...base} {...p}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}

export function IconoRespaldo(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M12 3v10" />
      <path d="m8 9 4 4 4-4" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function IconoRestaurar(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M12 21V11" />
      <path d="m8 15 4-4 4 4" />
      <path d="M4 9V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3" />
    </svg>
  );
}

export function IconoMenu(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function IconoMas(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconoBuscar(p: Props) {
  return (
    <svg {...base} {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  );
}

export function IconoFiltro(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M4 5h16l-6 7.5V19l-4-2v-4.5L4 5Z" />
    </svg>
  );
}

export function IconoEditar(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}

export function IconoImprimir(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M7 9V3.5h10V9" />
      <rect x="3.5" y="9" width="17" height="8" rx="2" />
      <path d="M7 14h10v6.5H7z" />
    </svg>
  );
}

export function IconoBasura(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
    </svg>
  );
}

export function IconoCamara(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  );
}

export function IconoInfo(p: Props) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.8v.01" />
    </svg>
  );
}

export function IconoHistorial(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
      <path d="M3.5 4v4h4" />
      <path d="M12 8v4.5l3 2" />
    </svg>
  );
}

export function IconoPeso(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M4 20 6.5 9h11L20 20H4Z" />
      <circle cx="12" cy="6" r="2.5" />
    </svg>
  );
}

export function IconoGrafica(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M4 4v16h16" />
      <path d="M8 16v-4M12 16V8M16 16v-6" />
    </svg>
  );
}

export function IconoArbol(p: Props) {
  return (
    <svg {...base} {...p}>
      <rect x="9" y="3" width="6" height="4.5" rx="1" />
      <rect x="3" y="16.5" width="6" height="4.5" rx="1" />
      <rect x="15" y="16.5" width="6" height="4.5" rx="1" />
      <path d="M12 7.5V12M6 16.5V12h12v4.5" />
    </svg>
  );
}

export function IconoFlecha(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function IconoAtras(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="m15 5-7 7 7 7" />
    </svg>
  );
}

export function IconoSalir(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 16l-4-4 4-4M6 12h10" />
    </svg>
  );
}

export function IconoCerrar(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconoCheck(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M4 12.5 9 17.5 20 6.5" />
    </svg>
  );
}

export function IconoMacho(p: Props) {
  return (
    <svg {...base} {...p}>
      <circle cx="10" cy="14" r="5.5" />
      <path d="M14 10 20 4M15 4h5v5" />
    </svg>
  );
}

export function IconoHembra(p: Props) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M12 14.5V21M9 18h6" />
    </svg>
  );
}

export function IconoSol(p: Props) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function IconoLuna(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

// --- Estados reproductivos / eventos (gotas, relojes, etc.) ---

export function IconoLeche(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M8 3h8M8 3l-.5 4.5c-.1.8-.5 1.5-1 2.1C5.5 11 5 12.3 5 13.7V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5.3c0-1.4-.5-2.7-1.5-4.1-.5-.6-.9-1.3-1-2.1L16 3" />
      <path d="M5.4 11h13.2" />
    </svg>
  );
}

export function IconoSecado(p: Props) {
  // Gota con línea: "sin leche / secado".
  return (
    <svg {...base} {...p}>
      <path d="M12 3.5c3 3.5 5 6.3 5 9a5 5 0 0 1-10 0c0-2.7 2-5.5 5-9Z" />
      <path d="M5 19 19 5" />
    </svg>
  );
}

export function IconoReloj(p: Props) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconoBiberon(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M9 7h6v12a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V7Z" />
      <path d="M9.5 7l1-2.5h3L14.5 7" />
      <path d="M9 11h6M9 14h6" />
    </svg>
  );
}

export function IconoCorazon(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M12 20s-7-4.3-9.2-8.6C1.3 8.3 2.7 5 6 5c2 0 3.2 1.2 4 2.3C10.8 6.2 12 5 14 5c3.3 0 4.7 3.3 3.2 6.4C19 15.7 12 20 12 20Z" />
    </svg>
  );
}

export function IconoNacimiento(p: Props) {
  // Brote / planta nueva.
  return (
    <svg {...base} {...p}>
      <path d="M12 20v-7" />
      <path d="M12 13c0-3 2-5 5-5 0 3-2 5-5 5Z" />
      <path d="M12 15c0-2.5-1.7-4.3-4.3-4.3C7.7 13.2 9.4 15 12 15Z" />
    </svg>
  );
}

export function IconoPin(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10Z" />
      <circle cx="12" cy="11" r="2.2" />
    </svg>
  );
}

// Devuelve el icono de animal según el sexo (toro para macho, vaca para hembra).
export function IconoAnimal({ sexo, ...p }: Props & { sexo: string }) {
  return sexo === "MACHO" ? <IconoToro {...p} /> : <IconoVaca {...p} />;
}

// Ojo abierto: "mostrar la contraseña".
export function IconoOjo(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// Ojo tachado: "ocultar la contraseña".
export function IconoOjoTachado(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c6.5 0 10 7 10 7a16.9 16.9 0 0 1-3 3.8" />
      <path d="M6.5 7.9A16.6 16.6 0 0 0 2 13s3.5 7 10 7a9.8 9.8 0 0 0 4.2-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m3 3 18 18" />
    </svg>
  );
}
