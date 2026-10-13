import type { MetadataRoute } from "next";

// Manifest de la app instalable (/manifest.webmanifest): permite "Agregar a pantalla de inicio"
// en Android e iPhone y abrir la app a pantalla completa, sin la barra del navegador.
// La app Android (carpeta movil/) carga esta misma web.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TDS Ganadería",
    short_name: "TDS Ganadería",
    description: "Registro del ganado de la Finca Tierra de Sueños.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#4b7a3f",
    icons: [
      { src: "/iconos/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/iconos/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/iconos/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
