// Llamadas a la API desde el navegador. NUNCA lanza: sin conexión (algo habitual en el campo)
// devuelve un error legible en vez de dejar los botones en "Guardando…" para siempre.
//
// Las altas de eventos (ordeño, peso, monta, parto, cambio de etapa) NO fallan sin señal: se
// guardan en el teléfono y se envían al volver la conexión (src/lib/cola-offline.ts). En ese
// caso la respuesta es { ok: true, encolado: true } y `data` no viene.

import { encolar, enviarConLimite, esEncolable, nuevoId } from "@/lib/cola-offline";

export const SIN_CONEXION = "Sin conexión. Revisa la señal e intenta de nuevo.";

export type RespuestaApi<T> =
  | { ok: true; data: T; encolado?: false }
  | { ok: true; data: undefined; encolado: true }
  | { ok: false; error: string };

export async function llamarApi<T = unknown>(
  url: string,
  { method = "GET", body }: { method?: string; body?: unknown } = {}
): Promise<RespuestaApi<T>> {
  if (esEncolable(url, method) && body && typeof body === "object") {
    return llamarEncolable<T>(url, body as Record<string, unknown>);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      ...(body !== undefined
        ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
        : {}),
    });
  } catch {
    return { ok: false, error: SIN_CONEXION };
  }
  return leerRespuesta<T>(res);
}

async function leerRespuesta<T>(res: Response): Promise<RespuestaApi<T>> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: (data as { error?: string }).error ?? "No se pudo completar la acción." };
  }
  return { ok: true, data: data as T };
}

// El id se fija ANTES del primer intento: si la petición llegó al servidor pero la respuesta no
// volvió (señal débil), el reenvío desde la cola lleva el mismo id y no se duplica.
async function llamarEncolable<T>(url: string, body: Record<string, unknown>): Promise<RespuestaApi<T>> {
  const conId = { ...body, id: typeof body.id === "string" ? body.id : nuevoId() };

  if (navigator.onLine) {
    try {
      return leerRespuesta<T>(await enviarConLimite(url, conId));
    } catch {
      // sin señal o tiempo agotado: a la cola
    }
  }
  try {
    await encolar(url, conId);
    return { ok: true, data: undefined, encolado: true };
  } catch {
    // IndexedDB no disponible (p. ej. navegación privada en algunos navegadores).
    return { ok: false, error: SIN_CONEXION };
  }
}
