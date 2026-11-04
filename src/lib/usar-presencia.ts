"use client";

import { useEffect, useState } from "react";

// Montaje con transición de entrada y salida para hojas, diálogos y avisos.
//
// Sin esto, `{abierto && <Panel/>}` hace aparecer y desaparecer el panel de golpe: no hay
// tiempo para animar la salida. El hook mantiene el panel montado mientras sale y da un
// `estado` para el atributo `data-estado` que leen las clases `.t-*` de globals.css:
//   - al abrir: se monta en ese mismo render (así el foco inicial encuentra el panel) en
//     estado "cerrado" y, dos cuadros después, pasa a "abierto": la transición tiene de dónde partir;
//   - al cerrar: pasa a "cerrado" y se desmonta cuando termina la salida (`msSalida`).
// Con movimiento reducido las transiciones duran 0 (globals.css): solo se retrasa el desmontaje.
//
// Uso:
//   const { montado, estado } = usePresencia(abierto, 150);
//   {montado && <div className="t-modal" data-estado={estado}>…</div>}
export function usePresencia(abierto: boolean, msSalida: number) {
  const [previo, setPrevio] = useState(abierto);
  const [saliendo, setSaliendo] = useState(false);
  const [visible, setVisible] = useState(false);

  // Estado derivado del cambio de `abierto` (patrón de React: ajustar el estado durante el
  // render). Al cerrar, `saliendo` se activa en el mismo render: el panel no parpadea.
  if (previo !== abierto) {
    setPrevio(abierto);
    setSaliendo(!abierto);
    if (!abierto) setVisible(false);
  }

  useEffect(() => {
    if (abierto) {
      let r2 = 0;
      const r1 = requestAnimationFrame(() => {
        r2 = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(r1);
        cancelAnimationFrame(r2);
      };
    }
    const t = setTimeout(() => setSaliendo(false), msSalida);
    return () => clearTimeout(t);
  }, [abierto, msSalida]);

  return { montado: abierto || saliendo, estado: visible ? "abierto" : "cerrado" } as const;
}
