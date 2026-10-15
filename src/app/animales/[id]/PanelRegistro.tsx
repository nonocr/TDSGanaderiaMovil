"use client";

import { useState } from "react";
import {
  FormPeso,
  FormLeche,
  FormMonta,
  FormMontaDesdeToro,
  FormParto,
} from "./FormulariosEventos";
import { CambiarEtapa } from "./CambiarEtapa";

type Opcion = { id: string; arete: string; nombre: string | null; sinArete?: boolean | null; areteCenasa?: string | null };

// Panel con pestañas para registrar eventos. Lo que se puede registrar depende del módulo:
//  - ENGORDE:     peso y etapa.
//  - LECHERIA:    leche, monta y parto (su ciclo reproductivo).
//  - REPRODUCTOR: monta / inseminación (pajilla).
export function PanelRegistro({
  animalId,
  modulo,
  etapaActual,
  toros,
  vacas,
  posiblesCrias,
  criasSugeridas,
}: {
  animalId: string;
  modulo: string;
  etapaActual: string | null;
  toros: Opcion[];
  vacas: Opcion[];
  posiblesCrias: (Opcion & { fechaNacimiento?: string | null })[];
  criasSugeridas: string[]; // ids de los hijos de esta vaca aún sin parto (van primero)
}) {
  const tabs =
    modulo === "ENGORDE"
      ? [
          { id: "peso", label: "Peso" },
          { id: "etapa", label: "Etapa" },
        ]
      : modulo === "LECHERIA"
      ? [
          { id: "leche", label: "Leche" },
          { id: "monta", label: "Monta" },
          { id: "parto", label: "Parto" },
        ]
      : [{ id: "monta", label: "Monta / inseminación" }];

  const [tab, setTab] = useState(tabs[0].id);

  return (
    <div className="rounded-xl border border-stone-200/80 bg-white shadow-card dark:border-stone-800 dark:bg-stone-900">
      {/* Las pestañas reparten el ancho para que todas quepan en el celular. */}
      <div role="tablist" aria-label="Qué registrar" className="flex items-center border-b border-stone-200 px-1 pt-1 sm:gap-1 sm:px-2 sm:pt-2 dark:border-stone-800">
        {tabs.map((t) => {
          const activo = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activo}
              onClick={() => setTab(t.id)}
              className={
                "flex-1 whitespace-nowrap rounded-t-lg px-1 py-3 text-sm font-medium transition-colors sm:flex-none sm:px-4 sm:py-2.5 " +
                (activo
                  ? "border-b-2 border-marca-600 text-marca-700 dark:border-marca-400 dark:text-marca-300"
                  : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200")
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="p-4 sm:p-5">
        {tab === "peso" && <FormPeso animalId={animalId} />}
        {tab === "etapa" && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Cambiar de etapa</p>
            <CambiarEtapa animalId={animalId} etapaActual={etapaActual} />
          </div>
        )}
        {tab === "leche" && <FormLeche vacaId={animalId} />}
        {tab === "monta" && modulo === "LECHERIA" && <FormMonta vacaId={animalId} toros={toros} />}
        {tab === "parto" && (
          <FormParto vacaId={animalId} toros={toros} posiblesCrias={posiblesCrias} criasSugeridas={criasSugeridas} />
        )}
        {tab === "monta" && modulo === "REPRODUCTOR" && (
          <FormMontaDesdeToro toroId={animalId} vacas={vacas} />
        )}
      </div>
    </div>
  );
}
