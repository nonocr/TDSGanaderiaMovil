const dev = process.env.NODE_ENV !== "production";

// Content Security Policy: solo recursos de la propia app.
// 'unsafe-inline' en scripts es necesario por el script anti-parpadeo del tema y los
// scripts de hidratación de Next; 'unsafe-eval' y ws: solo en desarrollo (recarga en caliente).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${dev ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const cabecerasSeguridad = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // HSTS solo tiene efecto cuando la app se sirve por HTTPS.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // La app "en uso" (npm run prod:*) compila en su propia carpeta para que un `npm run dev`
  // o `npm run build` de desarrollo (p. ej. de Kiro) no le borre los archivos y la tumbe.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  experimental: {
    // El navegador guarda 30 s las páginas ya visitadas: volver a una pestaña (Inicio, Vacas…)
    // es instantáneo. Tras guardar algo, `router.refresh()` descarta esta caché.
    staleTimes: { dynamic: 30 },
  },
  async headers() {
    return [{ source: "/:path*", headers: cabecerasSeguridad }];
  },
  // Los navegadores piden /favicon.ico por su cuenta; se sirve el favicon.png existente.
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/favicon.png" }];
  },
};

export default nextConfig;
