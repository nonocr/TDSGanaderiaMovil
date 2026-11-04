// Esqueleto que se muestra AL INSTANTE al navegar mientras el servidor arma la página.
// Next lo precarga junto con cada enlace visible, así tocar un enlace responde de inmediato.
// Imita la estructura real (título, bloque de resumen, barra de búsqueda y filas) para que
// el cambio al contenido no "salte". El pulso se detiene con movimiento reducido.
export default function Cargando() {
  const bloque = "animate-pulse bg-stone-200/80 motion-reduce:animate-none dark:bg-stone-800/80";
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      <div className="mb-5 sm:mb-6">
        <div className={`h-8 w-44 rounded-lg ${bloque}`} />
        <div className={`mt-2 h-4 w-60 max-w-full rounded-md ${bloque}`} />
      </div>
      <div className={`mb-6 h-24 rounded-2xl ${bloque}`} />
      <div className={`mb-3 h-11 rounded-xl ${bloque}`} />
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={`h-[4.5rem] rounded-2xl ${bloque}`} style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
  );
}
