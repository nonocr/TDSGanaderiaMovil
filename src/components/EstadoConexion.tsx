"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { IconoInfo, IconoReloj, IconoRestaurar, IconoCheck } from "@/components/iconos";
import {
  EVENTO_COLA, descartar, enviarPendientes, listarPendientes, type Pendiente,
} from "@/lib/cola-offline";

// Aviso de conexión y de registros guardados en el teléfono (modo sin señal).
// - Registra el service worker (public/sw.js), que guarda las páginas visitadas.
// - Sin señal: avisa que se ve la última copia guardada y desde cuándo.
// - Envía los pendientes al volver la señal, al abrir la app y cada 30 s mientras haya.
// - Si el servidor rechaza un registro (p. ej. ordeño repetido), lo muestra hasta que se descarte.
// (Componente funcional del backend; Kiro puede ajustar su diseño. Ver docs/14-app-movil.md.)

const PAGINAS = "tds-paginas-v1"; // = PAGINAS en public/sw.js

function haceCuanto(ms: number): string {
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} día${d === 1 ? "" : "s"}`;
}

export function EstadoConexion() {
  const router = useRouter();
  const [enLinea, setEnLinea] = useState(true);
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [sesionVencida, setSesionVencida] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [copiaDe, setCopiaDe] = useState<number | null>(null);

  const recargar = useCallback(async () => {
    try {
      setPendientes(await listarPendientes());
    } catch {
      // IndexedDB no disponible: no hay cola que mostrar.
    }
  }, []);

  const enviar = useCallback(async () => {
    if (!navigator.onLine) return;
    setEnviando(true);
    try {
      const r = await enviarPendientes();
      setSesionVencida(r.sesionVencida);
      if (r.enviados > 0) router.refresh();
    } catch {
      // se reintenta en el siguiente ciclo
    } finally {
      setEnviando(false);
      recargar();
    }
  }, [recargar, router]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    setEnLinea(navigator.onLine);
    recargar().then(enviar);

    const alConectar = () => {
      setEnLinea(true);
      enviar();
    };
    const alDesconectar = () => setEnLinea(false);
    const alVolver = () => {
      if (document.visibilityState === "visible") enviar();
    };
    window.addEventListener("online", alConectar);
    window.addEventListener("offline", alDesconectar);
    window.addEventListener(EVENTO_COLA, recargar);
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      window.removeEventListener("online", alConectar);
      window.removeEventListener("offline", alDesconectar);
      window.removeEventListener(EVENTO_COLA, recargar);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [recargar, enviar]);

  const porEnviar = pendientes.filter((p) => p.estado === "pendiente");
  const rechazados = pendientes.filter((p) => p.estado === "rechazado");

  // Reintento periódico mientras queden pendientes (navigator.onLine puede decir "en línea"
  // con una señal que no alcanza).
  useEffect(() => {
    if (porEnviar.length === 0) return;
    const t = setInterval(enviar, 30000);
    return () => clearInterval(t);
  }, [porEnviar.length, enviar]);

  // Sin señal: ¿de cuándo es la copia de esta página?
  useEffect(() => {
    if (enLinea || !("caches" in window)) {
      setCopiaDe(null);
      return;
    }
    caches
      .open(PAGINAS)
      .then((c) => c.match(location.href))
      .then((r) => setCopiaDe(Number(r?.headers.get("x-tds-guardado")) || null))
      .catch(() => setCopiaDe(null));
  }, [enLinea]);

  if (enLinea && porEnviar.length === 0 && rechazados.length === 0) return null;

  const n = porEnviar.length;
  const registros = `${n} registro${n === 1 ? "" : "s"}`;

  return (
    <div className="no-print mb-4 space-y-2" role="status" aria-live="polite">
      {!enLinea && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <span
            aria-hidden="true"
            className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
          >
            {/* Punto que "respira" para indicar que seguimos buscando señal */}
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-600" />
            </span>
          </span>
          <div className="min-w-0">
            <p className="font-semibold">Sin señal</p>
            <p className="mt-0.5 leading-snug">
              {copiaDe ? `Ves los datos guardados ${haceCuanto(copiaDe)}. ` : "Ves la última copia guardada. "}
              Lo que registres se guarda en el teléfono y se envía al volver la señal.
            </p>
          </div>
        </div>
      )}

      {n > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300"
          >
            <IconoReloj className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            {sesionVencida ? (
              <>
                <span className="font-semibold">{registros} por enviar.</span> Tu sesión venció:{" "}
                <Link href="/login" className="font-medium underline underline-offset-2">
                  vuelve a entrar
                </Link>{" "}
                para enviarlos.
              </>
            ) : (
              <>
                <span className="font-semibold">{registros}</span> guardado{n === 1 ? "" : "s"} en el
                teléfono, por enviar.
              </>
            )}
          </span>
          {enLinea && !sesionVencida && (
            <button
              type="button"
              onClick={enviar}
              disabled={enviando}
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-sky-700 px-3 py-2 text-sm font-medium text-white transition-opacity hover:bg-sky-800 disabled:opacity-60"
            >
              {enviando ? (
                <>
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  />
                  Enviando…
                </>
              ) : (
                <>
                  <IconoRestaurar className="h-4 w-4" />
                  Enviar ahora
                </>
              )}
            </button>
          )}
        </div>
      )}

      {rechazados.map((p) => (
        <div
          key={p.id}
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          <span
            aria-hidden="true"
            className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
          >
            <IconoInfo className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">No se guardó: {p.descripcion}</p>
            <p className="mt-0.5 leading-snug">{p.error}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={p.pagina}
                className="inline-flex min-h-11 items-center rounded-lg border border-red-300 px-3 text-sm font-medium hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/50"
              >
                Ver ficha
              </Link>
              <button
                type="button"
                onClick={() => descartar(p.id)}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-700 px-3 text-sm font-medium text-white hover:bg-red-800"
              >
                <IconoCheck className="h-4 w-4" />
                Entendido, descartar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
