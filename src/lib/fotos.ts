import sharp from "sharp";
import { ErrorValidacion } from "@/lib/validar";

// Procesa en el servidor la foto que sube el navegador:
// - La re-codifica como JPEG: si el archivo no es una imagen real, falla aquí.
// - Elimina los metadatos (EXIF), incluida la ubicación GPS que guardan los celulares.
// - Corrige la orientación (fotos "acostadas" del celular).
// - Genera una miniatura liviana (~10 KB) para listas y encabezados, para no enviar la
//   foto completa en cada lista.

const LADO_FOTO = 600;
const LADO_MINIATURA = 160;

const aDataUrl = (b: Buffer) => `data:image/jpeg;base64,${b.toString("base64")}`;

export async function procesarFoto(dataUrl: string): Promise<{ foto: string; miniatura: string }> {
  const entrada = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
  try {
    // limitInputPixels: rechaza "bombas" de descompresión (imágenes gigantes en pocos bytes).
    const imagen = sharp(entrada, { limitInputPixels: 50_000_000, failOn: "error" }).rotate();
    const [foto, miniatura] = await Promise.all([
      imagen
        .clone()
        .resize(LADO_FOTO, LADO_FOTO, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer(),
      imagen
        .clone()
        .resize(LADO_MINIATURA, LADO_MINIATURA, { fit: "cover" })
        .jpeg({ quality: 72, mozjpeg: true })
        .toBuffer(),
    ]);
    return { foto: aDataUrl(foto), miniatura: aDataUrl(miniatura) };
  } catch {
    throw new ErrorValidacion("La imagen está dañada o no es una foto válida.");
  }
}
