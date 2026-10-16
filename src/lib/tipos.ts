// Tipos y etiquetas de dominio compartidos por la UI.

export const SEXO_LABEL: Record<string, string> = {
  MACHO: "Macho",
  HEMBRA: "Hembra",
};

export const ESTADO_LABEL: Record<string, string> = {
  ACTIVO: "Activo",
  VENDIDO: "Vendido",
  MUERTO: "Muerto",
};

// Módulos de la finca. Un animal pertenece a uno solo y no se mueve entre ellos.
export const MODULO_LABEL: Record<string, string> = {
  ENGORDE: "Engorde",
  LECHERIA: "Lechería",
  REPRODUCTOR: "Reproductor",
};

// Categoría de una hembra de lechería (Animal.categoria).
export const CATEGORIA_LABEL: Record<string, string> = {
  NOVILLA: "Novilla",
  VACA: "Vaca",
};

export const ETAPA_LABEL: Record<string, string> = {
  DESTETE: "Destete",
  DESARROLLO: "Desarrollo",
  ENGORDE: "Engorde",
  LACTANCIA: "Lactancia", // solo para mostrar etapas manuales antiguas
};

// Etapas de engorde, calculadas solas por la edad (etapaPorEdad en src/lib/estado.ts):
// Destete (0 a 4 meses) → Desarrollo (4 a 16 meses) → Engorde (16 meses en adelante).
export const ETAPAS_ORDEN = ["DESTETE", "DESARROLLO", "ENGORDE"] as const;

// Identificador visible de un animal. Normalmente es "#<arete>". Pero si el animal no tiene arete
// físico (sinArete), su `arete` es un valor interno que NO debe mostrarse: se usa el arete de
// SENASA, indicando que lo es. Pensado para listas, encabezados y selectores.
export function etiquetaArete(a: {
  arete: string;
  sinArete?: boolean | null;
  areteCenasa?: string | null;
}): string {
  if (a.sinArete) {
    return a.areteCenasa ? `SENASA ${a.areteCenasa}` : "Sin arete";
  }
  return `#${a.arete}`;
}

// Texto de búsqueda normalizado: quita espacios y los prefijos que se ven en pantalla, para que
// copiar "SENASA 12345" o "#025" encuentre el animal igual que escribir "12345" o "025".
// También acepta "CENASA" (nombre que se mostraba antes por error).
export function terminoBusqueda(q: string | null | undefined): string {
  return (q ?? "").trim().replace(/^[cs]enasa[\s:#-]*/i, "").replace(/^#\s*/, "").trim();
}
