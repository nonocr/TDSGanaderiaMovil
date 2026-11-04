"use client";

import { useState } from "react";
import {
  FormPeso,
  FormLeche,
  FormMonta,
  FormMontaDesdeToro,
  FormParto,
  FormPalpacion,
} from "./FormulariosEventos";
import { EtapaAutomatica } from "./EtapaAutomatica";
import { claseSuperficie } from "@/components/ui";

type Opcion = { id: string; arete: string; nombre: string | null; sinArete?: boolean | null; areteCenasa?: string | null };

// Panel con pestañas para registrar eventos. Lo que se puede registrar depende del módulo:
//  - ENGORDE:     peso; la etapa se calcula sola por la edad (solo se muestra).
//  - LECHERIA:    leche, monta, parto y palpación (su ciclo reproductivo).
//  - REPRODUCTOR: monta / inseminación (pajilla).
export function PanelRegistro({
  animalId,
  modulo,
  etapaActual,
  iniciosEtapas,
  toros,
  vacas,
  posiblesCrias,
  criasSugeridas,
  palpacionesPrevias,
}: {
  animalId: string;
  modulo: string;
  etapaActual: string | null;
  iniciosEtapas: { DESTETE: string; DESARROLLO: string; ENGORDE: string } | null;
  toros: Opcion[]; // solo reproductores
  vacas: Opcion[];
  posiblesCrias: (Opcion & { fechaNacimiento?: string | null; padreId?: string | null })[];
  criasSugeridas: string[]; // ids de los hijos de esta vaca aún sin parto (van primero)
  palpacionesPrevias: { fechaISO: string; notas: string | null; enMonta: boolean }[];
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
          { id: "palpacion", label: "Palpación" },
        ]
      : [{ id: "monta", label: "Monta / inseminación" }];

  const [tab, setTab] = useState(tabs[0].id);

  return (
    <div className={claseSuperficie}>
      {/* Control segmentado: las opciones reparten el ancho para que todas quepan en el celular. */}
      {tabs.length > 1 && (
        <div className="px-3 pt-3 sm:px-4 sm:pt-4">
          <div role="tablist" aria-label="Qué registrar" className="flex gap-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-800">
            {tabs.map((t) => {
              const activo = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`registro-${t.id}`}
                  aria-selected={activo}
                  aria-controls="registro-panel"
                  onClick={() => setTab(t.id)}
                  className={
                    "min-h-10 flex-1 whitespace-nowrap rounded-lg px-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-150 sm:flex-none sm:px-4 " +
                    (activo
                      ? "bg-white text-stone-900 shadow-card dark:bg-stone-600 dark:text-white"
                      : "text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white")
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        role="tabpanel"
        id="registro-panel"
        aria-labelledby={tabs.length > 1 ? `registro-${tab}` : undefined}
        aria-label={tabs.length > 1 ? undefined : tabs[0].label}
        key={tab}
        className="t-aparecer p-4 sm:p-5"
      >
        {tab === "peso" && <FormPeso animalId={animalId} />}
        {tab === "etapa" && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Etapa según la edad</p>
            <EtapaAutomatica etapaActual={etapaActual} inicios={iniciosEtapas} />
          </div>
        )}
        {tab === "leche" && <FormLeche vacaId={animalId} />}
        {tab === "monta" && modulo === "LECHERIA" && <FormMonta vacaId={animalId} toros={toros} />}
        {tab === "parto" && (
          <FormParto vacaId={animalId} toros={toros} posiblesCrias={posiblesCrias} criasSugeridas={criasSugeridas} />
        )}
        {tab === "palpacion" && <FormPalpacion vacaId={animalId} previas={palpacionesPrevias} />}
        {tab === "monta" && modulo === "REPRODUCTOR" && (
          <FormMontaDesdeToro toroId={animalId} vacas={vacas} />
        )}
      </div>
    </div>
  );
}
