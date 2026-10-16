// Cola de registros hechos SIN SEÑAL (solo navegador). En el campo es normal no tener conexión:
// en vez de perder el registro, se guarda en el teléfono (IndexedDB) y se envía solo cuando
// vuelve la señal (ver EstadoConexion.tsx).
//
// - Solo se encolan ALTAS de eventos (ordeño, peso, monta, parto, palpación, cambio de etapa). Editar,
//   borrar y dar de alta animales siguen pidiendo conexión.
// - Cada registro lleva un `id` generado aquí. El servidor lo usa como id del registro: si un
//   envío llegó pero la respuesta se perdió, reenviarlo no crea un duplicado.
// - Si el servidor RECHAZA un registro al enviarlo (p. ej. ya había un ordeño de ese turno), no se
//   borra: queda "rechazado" con el mensaje para avisar a quien lo registró (decisión del dueño,
//   2026-10-13: ante un duplicado, se avisa).

export type Pendiente = {
  id: string; // = id del registro en la base
  url: string;
  body: Record<string, unknown>;
  descripcion: string; // "Ordeño del 12/10 (mañana): 6 L"
  pagina: string; // dónde se registró (ficha del animal), para poder volver a ella
  creado: number;
  estado: "pendiente" | "rechazado";
  error?: string;
};

const TIPOS: Record<string, string> = {
  "/api/leche": "Ordeño",
  "/api/pesos": "Peso",
  "/api/montas": "Monta",
  "/api/partos": "Parto",
  "/api/palpaciones": "Palpación",
  "/api/etapas/cambiar": "Cambio de etapa",
};

export const EVENTO_COLA = "tds-cola";
const BASE = "tds-ganaderia";
const ALMACEN = "pendientes";
const LIMITE_MS = 15_000;

export function esEncolable(url: string, method: string): boolean {
  return method === "POST" && url in TIPOS;
}

export function nuevoId(): string {
  return crypto.randomUUID();
}

// --- IndexedDB ----------------------------------------------------------------

let baseP: Promise<IDBDatabase> | null = null;

function abrir(): Promise<IDBDatabase> {
  baseP ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(BASE, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(ALMACEN, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      baseP = null;
      reject(req.error);
    };
  });
  return baseP;
}

async function operar<T>(modo: IDBTransactionMode, fn: (a: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ALMACEN, modo);
    const req = fn(tx.objectStore(ALMACEN));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
  });
}

function avisarCambio() {
  window.dispatchEvent(new Event(EVENTO_COLA));
}

export async function listarPendientes(): Promise<Pendiente[]> {
  const todos = await operar("readonly", (a) => a.getAll() as IDBRequest<Pendiente[]>);
  return todos.sort((x, y) => x.creado - y.creado);
}

async function guardar(p: Pendiente) {
  await operar("readwrite", (a) => a.put(p));
  avisarCambio();
}

export async function descartar(id: string) {
  await operar("readwrite", (a) => a.delete(id));
  avisarCambio();
}

// --- Encolar ------------------------------------------------------------------

function fechaCorta(v: unknown): string {
  const m = typeof v === "string" ? /^(\d{4})-(\d{2})-(\d{2})/.exec(v) : null;
  return m ? `${m[3]}/${m[2]}` : "";
}

function describir(url: string, b: Record<string, unknown>): string {
  const tipo = TIPOS[url] ?? "Registro";
  const dia = fechaCorta(b.fecha);
  const del = dia ? ` del ${dia}` : "";
  switch (url) {
    case "/api/leche":
      return `${tipo}${del}${b.turno === "MANANA" ? " (mañana)" : b.turno === "TARDE" ? " (tarde)" : ""}: ${b.cantidad} L`;
    case "/api/pesos":
      return `${tipo}${del}: ${b.pesoKg} kg`;
    case "/api/etapas/cambiar":
      return `${tipo} a ${String(b.etapa ?? "").toLowerCase()}${del}`;
    default:
      return `${tipo}${del}`;
  }
}

export async function encolar(url: string, body: Record<string, unknown> & { id: string }) {
  await guardar({
    id: body.id,
    url,
    body,
    descripcion: describir(url, body),
    pagina: location.pathname + location.search,
    creado: Date.now(),
    estado: "pendiente",
  });
}

// --- Enviar -------------------------------------------------------------------

// fetch con tiempo límite: con señal débil una petición puede quedarse colgada minutos.
export async function enviarConLimite(url: string, body: unknown): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), LIMITE_MS);
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

export type ResultadoEnvio = { enviados: number; sesionVencida: boolean };

let enCurso: Promise<ResultadoEnvio> | null = null;

// Envía los pendientes en el orden en que se registraron. Se detiene sin señal o si el servidor
// falla (se reintenta luego). Una sola ejecución a la vez.
export function enviarPendientes(): Promise<ResultadoEnvio> {
  enCurso ??= enviar().finally(() => {
    enCurso = null;
  });
  return enCurso;
}

async function enviar(): Promise<ResultadoEnvio> {
  const lista = (await listarPendientes()).filter((p) => p.estado === "pendiente");
  let enviados = 0;
  for (const p of lista) {
    let res: Response;
    try {
      res = await enviarConLimite(p.url, p.body);
    } catch {
      break; // sin señal: se reintenta después
    }
    if (res.ok) {
      await descartar(p.id);
      enviados++;
      continue;
    }
    if (res.status === 401) return { enviados, sesionVencida: true };
    if (res.status >= 500 || res.status === 408 || res.status === 429) break;
    // Rechazo definitivo (datos inválidos, duplicado, animal borrado…): se avisa.
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    await guardar({ ...p, estado: "rechazado", error: data.error ?? "El servidor no aceptó este registro." });
  }
  return { enviados, sesionVencida: false };
}
