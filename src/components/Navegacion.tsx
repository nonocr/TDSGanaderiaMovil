"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ToggleTema } from "@/components/ToggleTema";
import { BusquedaGlobal } from "@/components/BusquedaGlobal";
import { llamarApi } from "@/lib/api-cliente";
import { useModalAccesible } from "@/lib/usar-modal";
import {
  IconoInicio,
  IconoLista,
  IconoToro,
  IconoCalendario,
  IconoRespaldo,
  IconoMenu,
  IconoMas,
  IconoSalir,
  IconoFlecha,
  IconoPeso,
  IconoLeche,
  IconoGrafica,
  IconoBasura,
  IconoBuscar,
  IconoCerrar,
} from "@/components/iconos";

const NAV = [
  { href: "/", label: "Inicio", Icono: IconoInicio },
  { href: "/engorde", label: "Engorde", Icono: IconoPeso },
  { href: "/lecheria", label: "Lechería", Icono: IconoLeche },
  { href: "/leche", label: "Producción de leche", Icono: IconoGrafica },
  { href: "/reproductores", label: "Reproductores", Icono: IconoToro },
  { href: "/animales", label: "Todos los animales", Icono: IconoLista },
  { href: "/animales/bajas", label: "Dados de baja", Icono: IconoBasura },
  { href: "/calendario", label: "Calendario", Icono: IconoCalendario },
  { href: "/respaldo", label: "Respaldo", Icono: IconoRespaldo },
  // Familias: oculta por ahora (se puede reactivar añadiéndola de nuevo aquí).
  // { href: "/familias", label: "Familias", Icono: IconoFamilia },
];

// Secciones que en móvil viven en la hoja "Más" (no caben en la barra inferior).
const EN_MAS = ["/leche", "/reproductores", "/animales", "/animales/bajas", "/calendario", "/respaldo"];

function esActivo(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  // "Todos los animales" no debe marcarse activo en la sección de bajas (es su propio item).
  if (href === "/animales" && pathname.startsWith("/animales/bajas")) return false;
  return pathname === href || pathname.startsWith(href + "/");
}

async function cerrarSesion() {
  const r = await llamarApi("/api/sesion", { method: "DELETE" });
  if (!r.ok) {
    alert(r.error);
    return;
  }
  window.location.assign("/login");
}

// Sidebar de escritorio: logo + nav + acciones.
function Sidebar() {
  const pathname = usePathname() ?? "/";

  return (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-stone-200 dark:ring-stone-700">
          <Image src="/logo.png" alt="TDS Ganadería" width={44} height={44} className="h-11 w-11 object-contain" priority />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-bold leading-tight tracking-tight text-stone-800 dark:text-stone-100">Finca Tierra de Sueños</span>
          <span className="block text-xs font-semibold text-marca-700 dark:text-marca-400">Ganadería</span>
        </span>
      </Link>

      <div className="mx-5 border-t border-stone-100 dark:border-stone-800" />

      {/* Búsqueda global: siempre disponible en el sidebar. */}
      <div className="px-3 pt-4">
        <BusquedaGlobal />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((n) => {
          const activo = esActivo(pathname, n.href);
          const Icono = n.Icono;
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={activo ? "page" : undefined}
              className={
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors " +
                (activo
                  ? "bg-marca-100 text-marca-800 dark:bg-marca-950 dark:text-marca-300"
                  : "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800")
              }
            >
              {activo && (
                <span className="absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-full border-l-[3px] border-marca-600 dark:border-marca-400" />
              )}
              <Icono className="h-5 w-5 shrink-0" />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-5 border-t border-stone-100 dark:border-stone-800" />
      <div className="m-4 flex items-center gap-2">
        <button
          onClick={cerrarSesion}
          className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-stone-500 transition-colors hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
        >
          <IconoSalir className="h-4 w-4 shrink-0" />
          Cerrar sesión
        </button>
        <ToggleTema />
      </div>
    </div>
  );
}

// Botón de la barra inferior móvil.
function Pestana({
  href,
  label,
  Icono,
  activo,
  expandido,
  onClick,
}: {
  href?: string;
  label: string;
  Icono: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  activo: boolean;
  expandido?: boolean; // solo botones que abren algo (la hoja "Más")
  onClick?: () => void;
}) {
  const clase =
    "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors " +
    (activo ? "text-marca-700 dark:text-marca-400" : "text-stone-500 active:text-stone-700 dark:text-stone-400");
  const interior = (
    <>
      <span className={"grid h-7 w-12 place-items-center rounded-full transition-colors " + (activo ? "bg-marca-100 dark:bg-marca-950" : "")}>
        <Icono className="h-[22px] w-[22px]" />
      </span>
      {label}
    </>
  );
  if (href) {
    return (
      <Link href={href} aria-current={activo ? "page" : undefined} className={clase}>
        {interior}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-expanded={expandido} className={clase}>
      {interior}
    </button>
  );
}

export function Navegacion() {
  const pathname = usePathname() ?? "/";
  const [masAbierto, setMasAbierto] = useState(false);
  const [buscarAbierto, setBuscarAbierto] = useState(false);
  const [escribiendo, setEscribiendo] = useState(false);

  // Cerrar la hoja "Más" y el buscador al navegar.
  useEffect(() => {
    setMasAbierto(false);
    setBuscarAbierto(false);
  }, [pathname]);

  // Hoja "Más" y buscador (móvil): foco atrapado dentro, Escape cierra, fondo sin scroll y, al
  // cerrar, el foco vuelve al botón que los abrió.
  const panelMas = useRef<HTMLDivElement>(null);
  const panelBuscar = useRef<HTMLDivElement>(null);
  const cerrarMas = useCallback(() => setMasAbierto(false), []);
  const cerrarBuscar = useCallback(() => setBuscarAbierto(false), []);
  useModalAccesible(masAbierto, panelMas, cerrarMas);
  useModalAccesible(buscarAbierto, panelBuscar, cerrarBuscar);

  // Ocultar la barra inferior mientras se escribe, para que no tape el teclado en Android.
  useEffect(() => {
    const esCampo = (el: EventTarget | null) =>
      el instanceof HTMLElement && el.matches("input:not([type=checkbox]):not([type=radio]):not([type=file]), textarea, select");
    const entrar = (e: FocusEvent) => esCampo(e.target) && setEscribiendo(true);
    const salir = () => setEscribiendo(false);
    document.addEventListener("focusin", entrar);
    document.addEventListener("focusout", salir);
    return () => {
      document.removeEventListener("focusin", entrar);
      document.removeEventListener("focusout", salir);
    };
  }, []);

  // La pantalla de login no lleva menú.
  if (pathname === "/login") return null;

  const enMas = EN_MAS.some((h) => esActivo(pathname, h));

  return (
    <>
      {/* Barra superior (solo móvil): identidad + tema */}
      <header className="no-print sticky top-0 z-30 border-b border-stone-200/80 bg-white pt-[env(safe-area-inset-top)] lg:hidden dark:border-stone-800 dark:bg-stone-900">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-full bg-white object-contain ring-1 ring-stone-200 dark:ring-stone-700" />
            <span className="truncate text-sm font-bold leading-tight text-stone-800 dark:text-stone-100">
              Tierra de Sueños <span className="text-marca-700 dark:text-marca-400">Ganadería</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setBuscarAbierto(true)}
              aria-label="Buscar animal"
              className="grid h-11 w-11 place-items-center rounded-lg text-stone-600 transition-colors hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              <IconoBuscar className="h-5 w-5" />
            </button>
            <ToggleTema />
          </div>
        </div>
      </header>

      {/* Buscador a pantalla completa (solo móvil): se abre con la lupa de la barra superior. */}
      {buscarAbierto && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden dark:bg-stone-950" role="dialog" aria-modal="true" aria-label="Buscar animal">
          <div ref={panelBuscar} className="flex items-center gap-2 border-b border-stone-200 px-3 py-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] dark:border-stone-800">
            <div className="flex-1">
              {/* Sin autoFocus: el campo lo enfoca useModalAccesible; con autoFocus se enfocaba
                  antes y el hook ya no sabía que debía devolver el foco a la lupa al cerrar. */}
              <BusquedaGlobal onNavegar={() => setBuscarAbierto(false)} />
            </div>
            <button
              type="button"
              onClick={() => setBuscarAbierto(false)}
              aria-label="Cerrar búsqueda"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
            >
              <IconoCerrar className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Sidebar fijo en escritorio */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-stone-200 bg-white lg:block dark:border-stone-800 dark:bg-stone-900">
        <Sidebar />
      </aside>

      {/* Barra inferior (solo móvil): al alcance del pulgar */}
      <nav
        aria-label="Navegación principal"
        className={
          "no-print fixed inset-x-0 bottom-0 z-30 border-t border-stone-200/80 bg-white pb-[env(safe-area-inset-bottom)] transition-transform duration-200 lg:hidden dark:border-stone-800 dark:bg-stone-900 " +
          (escribiendo ? "translate-y-full" : "")
        }
      >
        <div className="mx-auto flex max-w-md items-stretch">
          <Pestana href="/" label="Inicio" Icono={IconoInicio} activo={pathname === "/"} />
          <Pestana href="/engorde" label="Engorde" Icono={IconoPeso} activo={esActivo(pathname, "/engorde")} />
          <div className="flex flex-1 items-center justify-center">
            <Link
              href="/animales/nuevo"
              aria-label="Agregar animal"
              className={
                "-mt-5 grid h-14 w-14 place-items-center rounded-full bg-marca-600 text-white shadow-lg shadow-marca-900/25 ring-4 ring-stone-100 transition-transform active:scale-95 dark:ring-stone-950 " +
                (pathname === "/animales/nuevo" ? "bg-marca-700" : "")
              }
            >
              <IconoMas className="h-7 w-7" strokeWidth={2.2} />
            </Link>
          </div>
          <Pestana href="/lecheria" label="Lechería" Icono={IconoLeche} activo={esActivo(pathname, "/lecheria")} />
          <Pestana label="Más" Icono={IconoMenu} activo={masAbierto || enMas} expandido={masAbierto} onClick={() => setMasAbierto(true)} />
        </div>
      </nav>

      {/* Hoja "Más" (móvil): sube desde abajo */}
      {masAbierto && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Más opciones">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMasAbierto(false)} />
          <div ref={panelMas} className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-xl dark:bg-stone-900">
            <div className="mx-auto mb-1 mt-2.5 h-1.5 w-10 rounded-full bg-stone-300 dark:bg-stone-700" />
            <ul className="px-3 py-2">
              {NAV.filter((n) => EN_MAS.includes(n.href)).map((n) => {
                const Icono = n.Icono;
                const activo = esActivo(pathname, n.href);
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      // Si es la sección actual no cambia la ruta: se cierra aquí.
                      onClick={() => setMasAbierto(false)}
                      className={
                        "flex items-center gap-3 rounded-xl px-3 py-3.5 text-base font-medium " +
                        (activo
                          ? "bg-marca-100 text-marca-800 dark:bg-marca-950 dark:text-marca-300"
                          : "text-stone-700 active:bg-stone-100 dark:text-stone-200 dark:active:bg-stone-800")
                      }
                    >
                      <Icono className="h-5 w-5 shrink-0" />
                      <span className="flex-1">{n.label}</span>
                      <IconoFlecha className="h-4 w-4 text-stone-400" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mx-6 border-t border-stone-100 dark:border-stone-800" />
            <button
              onClick={cerrarSesion}
              className="mx-3 mt-2 flex w-[calc(100%-1.5rem)] items-center gap-3 rounded-xl px-3 py-3.5 text-base font-medium text-red-700 active:bg-red-50 dark:text-red-400 dark:active:bg-red-950"
            >
              <IconoSalir className="h-5 w-5" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </>
  );
}
