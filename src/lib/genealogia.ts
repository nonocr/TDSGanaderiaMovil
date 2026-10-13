// Genealogia DERIVADA (docs/05). Nunca se duplica: se arma desde padre/madre.
//
// Rendimiento: en vez de subir por el árbol con una consulta por animal (hasta ~9 consultas
// encadenadas, lento con la base en la nube), se lee UNA vez la tabla de parentesco de todo
// el hato (pocas columnas por animal) y se recorre en memoria. `cache` hace que esa lectura
// se comparta entre todas las funciones de este archivo durante una misma petición.
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type NodoAnimal = {
  id: string;
  arete: string;
  nombre: string | null;
  sexo: string;
};

export type Progenitor =
  | { tipo: "registrado"; animal: NodoAnimal }
  | { tipo: "externo"; texto: string }
  | { tipo: "desconocido" };

type FilaParentesco = NodoAnimal & {
  padreId: string | null;
  madreId: string | null;
  padreExterno: string | null;
  madreExterno: string | null;
  fechaNacimiento: Date | null;
};

const cargarParentesco = cache(async (): Promise<Map<string, FilaParentesco>> => {
  const filas = await prisma.animal.findMany({
    select: {
      id: true,
      arete: true,
      nombre: true,
      sexo: true,
      padreId: true,
      madreId: true,
      padreExterno: true,
      madreExterno: true,
      fechaNacimiento: true,
    },
    orderBy: { arete: "asc" },
  });
  return new Map(filas.map((f) => [f.id, f]));
});

// Todos los animales (id, arete, nombre, sexo) ordenados por arete. Reutiliza la misma
// lectura de la genealogía: sirve para los selectores de toro/vaca/cría sin otra consulta.
export async function listarAnimales(): Promise<NodoAnimal[]> {
  return [...(await cargarParentesco()).values()].map(nodo);
}

function nodo(f: FilaParentesco): NodoAnimal {
  return { id: f.id, arete: f.arete, nombre: f.nombre, sexo: f.sexo };
}

function progenitorDe(
  mapa: Map<string, FilaParentesco>,
  animalId: string
): { padre: Progenitor; madre: Progenitor } {
  const a = mapa.get(animalId);
  if (!a) return { padre: { tipo: "desconocido" }, madre: { tipo: "desconocido" } };

  const padreFila = a.padreId ? mapa.get(a.padreId) : undefined;
  const madreFila = a.madreId ? mapa.get(a.madreId) : undefined;

  const padre: Progenitor = padreFila
    ? { tipo: "registrado", animal: nodo(padreFila) }
    : a.padreExterno
    ? { tipo: "externo", texto: a.padreExterno }
    : { tipo: "desconocido" };

  const madre: Progenitor = madreFila
    ? { tipo: "registrado", animal: nodo(madreFila) }
    : a.madreExterno
    ? { tipo: "externo", texto: a.madreExterno }
    : { tipo: "desconocido" };

  return { padre, madre };
}

// Construye la ascendencia recorriendo padre/madre hasta `niveles` de profundidad.
export type Ancestro = {
  relacion: string; // "Padre", "Madre", "Abuelo paterno", etc.
  progenitor: Progenitor;
};

// Devuelve padres y abuelos derivados.
export async function obtenerAscendencia(animalId: string): Promise<Ancestro[]> {
  const mapa = await cargarParentesco();
  const resultado: Ancestro[] = [];

  const { padre, madre } = progenitorDe(mapa, animalId);
  resultado.push({ relacion: "Padre", progenitor: padre });
  resultado.push({ relacion: "Madre", progenitor: madre });

  // Abuelos (nivel 2) solo para progenitores registrados.
  for (const [lado, prog] of [
    ["paterno", padre],
    ["materno", madre],
  ] as const) {
    if (prog.tipo === "registrado") {
      const abuelos = progenitorDe(mapa, prog.animal.id);
      resultado.push({ relacion: `Abuelo ${lado}`, progenitor: abuelos.padre });
      resultado.push({ relacion: `Abuela ${lado}`, progenitor: abuelos.madre });
    }
  }

  return resultado;
}

// --- Árbol de ascendencia (estructura anidada para dibujar) ---
// Cada nodo tiene al animal (o progenitor externo/desconocido) y, si es registrado,
// sus propios padre y madre hasta `profundidad` niveles.
export type NodoArbol = {
  progenitor: Progenitor;
  padre?: NodoArbol;
  madre?: NodoArbol;
};

function construirRama(
  mapa: Map<string, FilaParentesco>,
  prog: Progenitor,
  profundidad: number
): NodoArbol {
  // Solo seguimos subiendo si es un animal registrado y queda profundidad.
  if (prog.tipo !== "registrado" || profundidad <= 0) {
    return { progenitor: prog };
  }
  const { padre, madre } = progenitorDe(mapa, prog.animal.id);
  return {
    progenitor: prog,
    padre: construirRama(mapa, padre, profundidad - 1),
    madre: construirRama(mapa, madre, profundidad - 1),
  };
}

// Árbol del animal raíz con su ascendencia hasta `niveles` de ancestros
// (1 = padres, 2 = + abuelos, 3 = + bisabuelos).
export async function obtenerArbol(animalId: string, niveles = 3): Promise<NodoArbol> {
  const mapa = await cargarParentesco();
  const raiz = mapa.get(animalId);
  if (!raiz) return { progenitor: { tipo: "desconocido" } };
  return construirRama(mapa, { tipo: "registrado", animal: nodo(raiz) }, niveles);
}

// Hijos: animales que referencian a este como padre o madre.
// Orden: por fecha de nacimiento (los que no la tienen, al final).
export async function obtenerHijos(animalId: string): Promise<NodoAnimal[]> {
  const mapa = await cargarParentesco();
  return [...mapa.values()]
    .filter((f) => f.padreId === animalId || f.madreId === animalId)
    .sort((a, b) => {
      if (!a.fechaNacimiento) return b.fechaNacimiento ? 1 : 0;
      if (!b.fechaNacimiento) return -1;
      return a.fechaNacimiento.getTime() - b.fechaNacimiento.getTime();
    })
    .map(nodo);
}

// Hermanos: comparten padre Y/O madre registrados (criterio exacto pendiente B10).
// En v1 se consideran hermanos si comparten al menos un progenitor registrado.
export async function obtenerHermanos(animalId: string): Promise<NodoAnimal[]> {
  const mapa = await cargarParentesco();
  const a = mapa.get(animalId);
  if (!a || (!a.padreId && !a.madreId)) return [];

  return [...mapa.values()]
    .filter(
      (f) =>
        f.id !== animalId &&
        ((a.padreId && f.padreId === a.padreId) || (a.madreId && f.madreId === a.madreId))
    )
    .sort((x, y) => x.arete.localeCompare(y.arete, "es", { numeric: true }))
    .map(nodo);
}
