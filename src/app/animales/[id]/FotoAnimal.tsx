"use client";

import { llamarApi } from "@/lib/api-cliente";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { IconoCamara, IconoBasura, IconoAnimal } from "@/components/iconos";

// Redimensiona una imagen en el navegador a un maximo de LADO px y la devuelve
// como data URL JPEG (comprimida), para no guardar archivos enormes.
const LADO_MAX = 600;

function redimensionar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Archivo de imagen inválido."));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > LADO_MAX) {
          height = Math.round((height * LADO_MAX) / width);
          width = LADO_MAX;
        } else if (height >= width && height > LADO_MAX) {
          width = Math.round((width * LADO_MAX) / height);
          height = LADO_MAX;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No se pudo procesar la imagen."));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Foto del animal como avatar del encabezado: tocarla abre la cámara/galería.
export function FotoAnimal({
  animalId,
  fotoUrl,
  sexo,
  alt,
}: {
  animalId: string;
  fotoUrl: string | null;
  sexo: string;
  alt: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function guardar(foto: string | null) {
    setSubiendo(true);
    const r = await llamarApi(`/api/animales/${animalId}`, { method: "PATCH", body: { fotoUrl: foto } });
    setSubiendo(false);
    if (!r.ok) {
      alert(r.error);
      return;
    }
    router.refresh();
  }

  async function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await guardar(await redimensionar(file));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al procesar la imagen.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function quitar() {
    if (confirm("¿Quitar la foto de este animal?")) guardar(null);
  }

  const idInput = `foto-${animalId}`;

  return (
    <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
      <label
        htmlFor={idInput}
        aria-label={fotoUrl ? "Cambiar foto" : "Agregar foto"}
        className="block h-full w-full cursor-pointer overflow-hidden rounded-2xl ring-1 ring-stone-200 dark:ring-stone-700"
      >
        {fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fotoUrl} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center bg-marca-100 text-marca-700 dark:bg-marca-950 dark:text-marca-300">
            <IconoAnimal sexo={sexo} className="h-12 w-12" />
          </span>
        )}
        {subiendo && (
          <span className="absolute inset-0 grid place-items-center rounded-2xl bg-black/45 text-xs font-medium text-white">
            Guardando…
          </span>
        )}
      </label>

      {/* Botón de cámara */}
      <label
        htmlFor={idInput}
        aria-hidden="true"
        className="no-print absolute -bottom-1.5 -right-1.5 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-marca-600 text-white shadow-md ring-2 ring-white dark:ring-stone-900"
      >
        <IconoCamara className="h-4 w-4" />
      </label>

      {fotoUrl && !subiendo && (
        <button
          type="button"
          onClick={quitar}
          aria-label="Quitar foto"
          className="no-print absolute -left-2 -top-2 grid h-9 w-9 place-items-center rounded-full bg-white text-red-600 shadow-md ring-1 ring-stone-200 dark:bg-stone-800 dark:text-red-400 dark:ring-stone-700"
        >
          <IconoBasura className="h-3.5 w-3.5" />
        </button>
      )}

      <input
        ref={inputRef}
        id={idInput}
        type="file"
        accept="image/*"
        onChange={onArchivo}
        className="hidden"
      />
    </div>
  );
}
