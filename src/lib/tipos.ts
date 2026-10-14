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

export const ETAPA_LABEL: Record<string, string> = {
  LACTANCIA: "Lactancia",
  DESARROLLO: "Desarrollo",
  ENGORDE: "Engorde",
  DESTETE: "Destete", // solo para mostrar datos antiguos; ya no se registra
};

// Orden canónico de las etapas del ternero. La última es ENGORDE.
// Duraciones de referencia (B6): Lactancia ~3-4 meses, Desarrollo ~8 meses, Engorde ~4 meses.
// "DESTETE" se mantiene en el mapa de etiquetas por compatibilidad con datos antiguos,
// pero ya no es una etapa que se ofrezca al registrar.
export const ETAPAS_ORDEN = ["LACTANCIA", "DESARROLLO", "ENGORDE"] as const;

// Identificador visible de un animal. Normalmente es "#<arete>". Pero si el animal no tiene arete
// físico (sinArete), su `arete` es un valor interno que NO debe mostrarse: se usa el arete de
// CENASA, indicando que lo es. Pensado para listas, encabezados y selectores.
export function etiquetaArete(a: {
  arete: string;
  sinArete?: boolean | null;
  areteCenasa?: string | null;
}): string {
  if (a.sinArete) {
    return a.areteCenasa ? `CENASA ${a.areteCenasa}` : "Sin arete";
  }
  return `#${a.arete}`;
}
