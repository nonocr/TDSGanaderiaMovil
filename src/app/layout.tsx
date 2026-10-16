import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navegacion } from "@/components/Navegacion";
import { EstadoConexion } from "@/components/EstadoConexion";

export const metadata: Metadata = {
  title: "TDS Ganadería",
  description: "TDS Ganadería · Finca Tierra de Sueños: registro del ganado, historial, genealogía y reproducción.",
  icons: {
    icon: "/favicon.png",
    apple: "/iconos/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "TDS Ganadería",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Permite acercar (accesibilidad) pero evita que la app se vea diminuta al abrir.
  maximumScale: 5,
  // Ocupa toda la pantalla en iPhone; las barras respetan las zonas seguras (notch).
  viewportFit: "cover",
  // Color de la barra del sistema según el tema: verde de marca en claro, piedra oscuro en oscuro.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4b7a3f" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1917" },
  ],
};

// Script que aplica el tema guardado ANTES de pintar, para evitar parpadeo.
const temaInicial = `
(function(){
  try {
    var t = localStorage.getItem("tema");
    if (t === "oscuro" || (!t && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaInicial }} />
      </head>
      <body>
        <Navegacion />
        <div className="flex min-h-screen flex-col lg:pl-60">
          {/* En móvil se deja espacio abajo para la barra de navegación inferior. */}
          <main className="print-main mx-auto w-full max-w-6xl flex-1 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-8 lg:pb-8">
            <EstadoConexion />
            {children}
          </main>
          <footer className="no-print hidden border-t border-stone-200/70 py-5 text-center text-xs text-stone-400 lg:block dark:border-stone-800 dark:text-stone-500">
            TDS Ganadería · Finca Tierra de Sueños
          </footer>
        </div>
      </body>
    </html>
  );
}
