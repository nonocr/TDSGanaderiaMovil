import { PageHeader } from "@/components/ui";
import { Respaldo } from "./Respaldo";

export const dynamic = "force-dynamic";

export default function RespaldoPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        titulo="Respaldo"
        subtitulo="Guarda una copia de tu información o recupérala desde un archivo."
      />
      <Respaldo />
    </div>
  );
}
