"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useModalAccesible } from "@/lib/usar-modal";
import { usePresencia } from "@/lib/usar-presencia";
import { claseBoton, claseBotonIcono } from "@/components/ui";
import { IconoAlerta, IconoCheck, IconoCerrar, IconoInfo } from "@/components/iconos";

// Diálogo de confirmación y avisos flotantes propios, en lugar de `confirm()` y `alert()` del
// navegador (que dentro del APK salen con el nombre del sitio, sin la marca y sin modo oscuro).
//
//   if (!(await confirmar({ titulo: "¿Eliminar…?", mensaje: "…", accion: "Eliminar", peligro: true }))) return;
//   avisar("No se pudo guardar la foto.");             // error (por defecto)
//   avisar("Foto actualizada.", "ok");
//
// <Dialogos /> se monta una vez en el layout. Si por algo no estuviera montado, se usan los del
// navegador para no perder la confirmación.

type PeticionConfirmar = {
  titulo: string;
  mensaje?: string;
  accion?: string; // texto del botón que confirma
  cancelar?: string;
  peligro?: boolean; // acción destructiva: botón rojo
};
type TipoAviso = "error" | "ok" | "info";
type Aviso = { id: number; texto: string; tipo: TipoAviso };

let abrirConfirmacion: ((p: PeticionConfirmar, responder: (si: boolean) => void) => void) | null = null;
let mostrarAviso: ((a: Aviso) => void) | null = null;
let siguienteId = 1;

export function confirmar(p: PeticionConfirmar): Promise<boolean> {
  return new Promise((resolve) => {
    if (abrirConfirmacion) abrirConfirmacion(p, resolve);
    else resolve(window.confirm([p.titulo, p.mensaje].filter(Boolean).join("\n\n")));
  });
}

export function avisar(texto: string, tipo: TipoAviso = "error") {
  if (mostrarAviso) mostrarAviso({ id: siguienteId++, texto, tipo });
  else window.alert(texto);
}

const MS_CIERRE_DIALOGO = 150; // = --duration-quick
const MS_CIERRE_AVISO = 250; // salida del toast
const MS_VISIBLE = { error: 7000, ok: 3500, info: 5000 } as const;

export function Dialogos() {
  return (
    <>
      <DialogoConfirmar />
      <AvisoFlotante />
    </>
  );
}

function DialogoConfirmar() {
  const [peticion, setPeticion] = useState<PeticionConfirmar | null>(null);
  const [abierto, setAbierto] = useState(false);
  const responder = useRef<((si: boolean) => void) | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const idTitulo = useId();
  const idMensaje = useId();

  useEffect(() => {
    abrirConfirmacion = (p, r) => {
      // Si quedaba una pregunta abierta, se responde "no" antes de abrir la nueva.
      responder.current?.(false);
      responder.current = r;
      setPeticion(p);
      setAbierto(true);
    };
    return () => {
      abrirConfirmacion = null;
    };
  }, []);

  const cerrar = useCallback((si: boolean) => {
    responder.current?.(si);
    responder.current = null;
    setAbierto(false);
  }, []);
  const cancelar = useCallback(() => cerrar(false), [cerrar]);

  useModalAccesible(abierto, panel, cancelar);
  const { montado, estado } = usePresencia(abierto, MS_CIERRE_DIALOGO);
  if (!montado || !peticion) return null;

  const Icono = peticion.peligro ? IconoAlerta : IconoInfo;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:items-center sm:p-6">
      <div className="t-fondo absolute inset-0 bg-stone-950/50" data-estado={estado} onClick={cancelar} aria-hidden="true" />
      <div
        ref={panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={peticion.mensaje ? idMensaje : undefined}
        data-estado={estado}
        className="t-modal relative w-full max-w-md rounded-3xl bg-white p-5 shadow-flotante ring-1 ring-stone-900/5 sm:p-6 dark:bg-stone-900 dark:ring-white/10"
      >
        <div className="flex items-start gap-3.5">
          <span
            className={
              "grid h-10 w-10 shrink-0 place-items-center rounded-full " +
              (peticion.peligro
                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                : "bg-marca-100 text-marca-700 dark:bg-marca-950 dark:text-marca-300")
            }
          >
            <Icono className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0 pt-1.5">
            <h2 id={idTitulo} className="text-base font-semibold text-stone-900 dark:text-stone-50">
              {peticion.titulo}
            </h2>
            {peticion.mensaje && (
              <p id={idMensaje} className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                {peticion.mensaje}
              </p>
            )}
          </div>
        </div>
        {/* En el DOM "Cancelar" va primero: recibe el foco al abrir (lo seguro ante una acción
            que no se deshace). En móvil se apilan con la acción arriba; en escritorio, en fila. */}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={cancelar} className={claseBoton("secundario")}>
            {peticion.cancelar ?? "Cancelar"}
          </button>
          <button
            type="button"
            onClick={() => cerrar(true)}
            className={claseBoton(peticion.peligro ? "peligro" : "primario")}
          >
            {peticion.accion ?? "Aceptar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AvisoFlotante() {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    mostrarAviso = (a) => {
      setAviso(a);
      setAbierto(true);
    };
    return () => {
      mostrarAviso = null;
    };
  }, []);

  // Se cierra solo; el error se queda más tiempo para poder leerlo.
  useEffect(() => {
    if (!aviso || !abierto) return;
    const t = setTimeout(() => setAbierto(false), MS_VISIBLE[aviso.tipo]);
    return () => clearTimeout(t);
  }, [aviso, abierto]);

  const { montado, estado } = usePresencia(abierto, MS_CIERRE_AVISO);

  const estilos = {
    error: { caja: "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900", icono: "text-red-400 dark:text-red-600", Icono: IconoAlerta },
    ok: { caja: "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900", icono: "text-marca-300 dark:text-marca-700", Icono: IconoCheck },
    info: { caja: "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900", icono: "text-sky-300 dark:text-sky-700", Icono: IconoInfo },
  };

  return (
    // La región viva existe siempre (los lectores de pantalla solo anuncian cambios dentro de
    // una región ya presente). Va encima de la barra inferior en móvil.
    <div
      aria-live={aviso?.tipo === "error" ? "assertive" : "polite"}
      className="no-print pointer-events-none fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[70] flex justify-center px-3 lg:bottom-6 lg:left-60"
    >
      {montado && aviso && (
        <div
          key={aviso.id}
          role={aviso.tipo === "error" ? "alert" : "status"}
          data-estado={estado}
          className={`t-toast pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl py-3 pl-4 pr-1.5 text-sm shadow-flotante ${estilos[aviso.tipo].caja}`}
        >
          {(() => {
            const I = estilos[aviso.tipo].Icono;
            return <I className={`mt-0.5 h-5 w-5 shrink-0 ${estilos[aviso.tipo].icono}`} strokeWidth={2} />;
          })()}
          <p className="min-w-0 flex-1 py-0.5 leading-snug">{aviso.texto}</p>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar aviso"
            className="-my-2 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white/75 transition-colors hover:bg-white/10 hover:text-white dark:text-stone-900/70 dark:hover:bg-stone-900/10 dark:hover:text-stone-900"
          >
            <IconoCerrar className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
