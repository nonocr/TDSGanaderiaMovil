"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ToggleTema } from "@/components/ToggleTema";
import { BusquedaGlobal } from "@/components/BusquedaGlobal";
import { llamarApi } from "@/lib/api-cliente";
import { useModalAccesible } from "@/lib/usar-modal";
import { usePresencia } from "@/lib/usar-presencia";
import { avisar } from "@/components/Dialogos";
import { claseBotonIcono } from "@/components/ui";
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

// Grupos del menú lateral (escritorio).
const GRUPOS_NAV = [
  { titulo: "Ganado", items: ["/", "/engorde", "/lecheria", "/reproductores"] },
  { titulo: "Consultas", items: ["/leche", "/calendario", "/animales", "/animales/bajas"] },
  { titulo: "Datos", items: ["/respaldo"] },
];

// Secciones que en móvil viven en la hoja "Más" (no caben en la barra inferior).
const EN_MAS = ["/leche", "/reproductores", "/animales", "/animales/bajas", "/calendario", "/respaldo"];

function esActivo(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  // "Todos los animales" no debe marcarse activo en la sección de bajas (es su propio item).
  if (href === "/animales" && pathname.startsWith("/animales/bajas")) return false;
  // "Agregar animal" tiene su propio botón (el + de la barra): no marca "Más" ni "Todos los animales".
  if (href === "/animales" && pathname === "/animales/nuevo") return false;
  return pathname === href || pathname.startsWith(href + "/");
}

async function cerrarSesion() {
  const r = await llamarApi("/api/sesion", { method: "DELETE" });
  if (!r.ok) {
    avisar(r.error);
    return;
  }
  window.location.assign("/login");
}

// Sidebar de escritorio: logo + nav + acciones.
function Sidebar() {
  const pathname = usePathname() ?? "/";

  return (
    <div className="flex h-full flex-col">
      <Link href="/" className="mx-2 mt-3 flex items-center gap-3 rounded-xl px-3 py-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-card ring-1 ring-stone-900/[0.08] dark:ring-white/10">
          <Image src="/logo.png" alt="TDS Ganadería" width={44} height={44} className="h-11 w-11 object-contain" priority />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-bold leading-tight tracking-tight text-stone-900 dark:text-stone-50">Finca Tierra de Sueños</span>
          <span className="block text-xs font-semibold text-marca-700 dark:text-marca-400">Ganadería</span>
        </span>
      </Link>

      {/* Búsqueda global: siempre disponible en el sidebar. */}
      <div className="px-3 pt-3">
        <BusquedaGlobal />
      </div>

      {/* Agrupado por lo que se hace: los módulos del ganado arriba, las vistas generales
          después y las herramientas al final. */}
      <nav aria-label="Menú" className="flex-1 overflow-y-auto px-3 py-4">
        {GRUPOS_NAV.map((g, gi) => (
          <div key={g.titulo} className={gi > 0 ? "mt-5" : ""}>
            <p className="mb-1 px-3 text-xs font-medium text-stone-500 dark:text-stone-400">{g.titulo}</p>
            <ul className="space-y-0.5">
              {NAV.filter((n) => g.items.includes(n.href)).map((n) => {
                const activo = esActivo(pathname, n.href);
                const Icono = n.Icono;
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      aria-current={activo ? "page" : undefined}
                      className={
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors " +
                        (activo
                          ? "bg-marca-100/80 text-marca-900 dark:bg-marca-950 dark:text-marca-200"
                          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100")
                      }
                    >
                      <Icono className={"h-5 w-5 shrink-0 " + (activo ? "text-marca-700 dark:text-marca-400" : "")} />
                      {n.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mx-5 border-t border-stone-200/70 dark:border-stone-800" />
      <div className="m-3 flex items-center gap-2">
        <button
          onClick={cerrarSesion}
          className="flex min-h-11 flex-1 items-center gap-2.5 rounded-xl px-3 text-left text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
        >
          <IconoSalir className="h-[18px] w-[18px] shrink-0" />
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
    "group flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors " +
    (activo ? "text-marca-800 dark:text-marca-300" : "text-stone-600 active:text-stone-900 dark:text-stone-400 dark:active:text-stone-100");
  const interior = (
    <>
      <span
        className={
          "grid h-7 w-14 place-items-center rounded-full transition-[background-color,transform] duration-150 group-active:scale-[0.96] " +
          (activo ? "bg-marca-100 dark:bg-marca-950" : "group-active:bg-stone-100 dark:group-active:bg-stone-800")
        }
      >
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
  // Entrada y salida animadas (cerrar es más rápido que abrir: 150 ms).
  const hojaMas = usePresencia(masAbierto, 150);
  const pantallaBuscar = usePresencia(buscarAbierto, 150);

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
      <header className="no-print sticky top-0 z-30 bg-white/95 pt-[env(safe-area-inset-top)] shadow-[0_1px_0_rgb(28_25_23/0.07)] backdrop-blur-md lg:hidden dark:bg-stone-900/95 dark:shadow-[0_1px_0_rgb(255_255_255/0.07)]">
        <div className="flex h-14 items-center justify-between gap-3 pl-4 pr-2">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-lg">
            <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-full bg-white object-contain ring-1 ring-stone-900/[0.08] dark:ring-white/10" />
            <span className="truncate text-[15px] font-bold leading-tight text-stone-900 dark:text-stone-50">
              Tierra de Sueños <span className="text-marca-700 dark:text-marca-400">Ganadería</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setBuscarAbierto(true)}
              aria-label="Buscar animal"
              aria-expanded={buscarAbierto}
              className={claseBotonIcono("discreto")}
            >
              <IconoBuscar className="h-5 w-5" />
            </button>
            <ToggleTema />
          </div>
        </div>
      </header>

      {/* Buscador a pantalla completa (solo móvil): se abre con la lupa de la barra superior. */}
      {pantallaBuscar.montado && (
        <div
          className="t-pantalla fixed inset-0 z-50 flex flex-col bg-stone-100 lg:hidden dark:bg-stone-950"
          data-estado={pantallaBuscar.estado}
          role="dialog"
          aria-modal="true"
          aria-label="Buscar animal"
        >
          <div ref={panelBuscar} className="min-h-0 flex-1 px-3 pb-3 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
            {/* Sin autoFocus: el campo lo enfoca useModalAccesible; con autoFocus se enfocaba
                antes y el hook ya no sabía que debía devolver el foco a la lupa al cerrar.
                "Cancelar" va en la fila del campo; los resultados, debajo y a todo lo ancho. */}
            <BusquedaGlobal
              onNavegar={() => setBuscarAbierto(false)}
              accion={
                <button
                  type="button"
                  onClick={() => setBuscarAbierto(false)}
                  className="min-h-11 shrink-0 rounded-xl px-2.5 text-sm font-medium text-marca-700 active:bg-marca-50 dark:text-marca-400 dark:active:bg-marca-950"
                >
                  Cancelar
                </button>
              }
            />
          </div>
        </div>
      )}

      {/* Sidebar fijo en escritorio */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-60 bg-white shadow-[1px_0_0_rgb(28_25_23/0.07)] lg:block dark:bg-stone-900 dark:shadow-[1px_0_0_rgb(255_255_255/0.07)]">
        <Sidebar />
      </aside>

      {/* Barra inferior (solo móvil): al alcance del pulgar. Se esconde mientras se escribe
          (en Android taparía el teclado). */}
      <nav
        aria-label="Navegación principal"
        className={
          "no-print fixed inset-x-0 bottom-0 z-30 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_rgb(28_25_23/0.07)] backdrop-blur-md transition-transform duration-200 ease-out lg:hidden dark:bg-stone-900/95 dark:shadow-[0_-1px_0_rgb(255_255_255/0.07)] " +
          (escribiendo ? "translate-y-full" : "")
        }
      >
        <div className="mx-auto flex max-w-md items-stretch px-1">
          <Pestana href="/" label="Inicio" Icono={IconoInicio} activo={pathname === "/"} />
          <Pestana href="/engorde" label="Engorde" Icono={IconoPeso} activo={esActivo(pathname, "/engorde")} />
          <div className="flex flex-1 items-center justify-center">
            <Link
              href="/animales/nuevo"
              aria-label="Agregar animal"
              aria-current={pathname === "/animales/nuevo" ? "page" : undefined}
              className={
                "-mt-5 grid h-14 w-14 place-items-center rounded-full text-white shadow-[0_6px_16px_-4px_rgb(39_63_34/0.55)] ring-4 ring-stone-100 transition-[transform,background-color] duration-150 active:scale-[0.96] dark:ring-stone-950 " +
                (pathname === "/animales/nuevo" ? "bg-marca-700" : "bg-marca-600 hover:bg-marca-700")
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
      {hojaMas.montado && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Más opciones">
          <div className="t-fondo absolute inset-0 bg-stone-950/45" data-estado={hojaMas.estado} onClick={() => setMasAbierto(false)} />
          <div
            ref={panelMas}
            data-estado={hojaMas.estado}
            className="t-hoja absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-flotante dark:bg-stone-900"
          >
            <div className="flex items-center justify-between px-5 pb-1 pt-3">
              <span aria-hidden="true" className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-stone-300 dark:bg-stone-700" />
              <h2 className="pt-2 text-base font-semibold text-stone-900 dark:text-stone-50">Más secciones</h2>
              <button
                type="button"
                onClick={() => setMasAbierto(false)}
                aria-label="Cerrar"
                className={`${claseBotonIcono("discreto")} -mr-1 mt-1`}
              >
                <IconoCerrar className="h-5 w-5" />
              </button>
            </div>
            <ul className="px-3 pb-2 pt-1">
              {NAV.filter((n) => EN_MAS.includes(n.href)).map((n) => {
                const Icono = n.Icono;
                const activo = esActivo(pathname, n.href);
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      aria-current={activo ? "page" : undefined}
                      // Si es la sección actual no cambia la ruta: se cierra aquí.
                      onClick={() => setMasAbierto(false)}
                      className={
                        "flex min-h-12 items-center gap-3.5 rounded-2xl px-3 py-3 text-base font-medium " +
                        (activo
                          ? "bg-marca-100/80 text-marca-900 dark:bg-marca-950 dark:text-marca-200"
                          : "text-stone-800 active:bg-stone-100 dark:text-stone-100 dark:active:bg-stone-800")
                      }
                    >
                      <span
                        className={
                          "grid h-9 w-9 shrink-0 place-items-center rounded-xl " +
                          (activo
                            ? "bg-white text-marca-700 dark:bg-marca-900 dark:text-marca-300"
                            : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300")
                        }
                      >
                        <Icono className="h-5 w-5" />
                      </span>
                      <span className="flex-1">{n.label}</span>
                      <IconoFlecha className="h-4 w-4 text-stone-400 dark:text-stone-500" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mx-5 border-t border-stone-200/70 dark:border-stone-800" />
            <button
              onClick={cerrarSesion}
              className="mx-3 mt-2 flex min-h-12 w-[calc(100%-1.5rem)] items-center gap-3.5 rounded-2xl px-3 py-3 text-base font-medium text-red-700 active:bg-red-50 dark:text-red-400 dark:active:bg-red-950"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-50 dark:bg-red-950/60">
                <IconoSalir className="h-5 w-5" />
              </span>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </>
  );
}
