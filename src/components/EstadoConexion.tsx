"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-medium">Sin señal</p>
          <p className="mt-0.5">
            {copiaDe ? `Ves los datos guardados ${haceCuanto(copiaDe)}. ` : "Ves la última copia guardada. "}
            Lo que registres se guarda en el teléfono y se envía al volver la señal.
          </p>
        </div>
      )}

      {n > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200">
          <span>
            {sesionVencida ? (
              <>
                {registros} por enviar. Tu sesión venció:{" "}
                <Link href="/login" className="font-medium underline">
                  vuelve a entrar
                </Link>{" "}
                para enviarlos.
              </>
            ) : (
              <>{registros} guardado{n === 1 ? "" : "s"} en el teléfono, por enviar.</>
            )}
          </span>
          {enLinea && !sesionVencida && (
            <button
              type="button"
              onClick={enviar}
              disabled={enviando}
              className="min-h-11 rounded-lg bg-sky-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {enviando ? "Enviando…" : "Enviar ahora"}
            </button>
          )}
        </div>
      )}

      {rechazados.map((p) => (
        <div
          key={p.id}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          <p className="font-medium">No se guardó: {p.descripcion}</p>
          <p className="mt-0.5">{p.error}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href={p.pagina}
              className="flex min-h-11 items-center rounded-lg border border-red-300 px-3 text-sm font-medium dark:border-red-800"
            >
              Ver ficha
            </Link>
            <button
              type="button"
              onClick={() => descartar(p.id)}
              className="min-h-11 rounded-lg bg-red-700 px-3 text-sm font-medium text-white"
            >
              Entendido, descartar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
