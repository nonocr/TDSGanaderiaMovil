// Esqueleto que se muestra AL INSTANTE al navegar mientras el servidor arma la página.
// Next lo precarga junto con cada enlace visible, así tocar un enlace responde de inmediato.
export default function Cargando() {
  const bloque = "animate-pulse rounded-xl bg-stone-200/70 dark:bg-stone-800/70";
  return (
    <div aria-busy="true" aria-label="Cargando">
      <div className="mb-5 border-b border-stone-200 pb-4 sm:mb-6 dark:border-stone-800">
        <div className={`h-7 w-48 ${bloque}`} />
        <div className={`mt-2 h-4 w-64 max-w-full ${bloque}`} />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={`h-16 ${bloque}`} />
        ))}
      </div>
    </div>
  );
}
