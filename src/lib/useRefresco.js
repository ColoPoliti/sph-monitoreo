import { useEffect, useRef } from 'react';

/**
 * Vuelve a llamar a `fn` cada `ms` milisegundos mientras la pestaña está visible,
 * y también al volver a la pestaña o a la ventana. Sirve para que un cambio hecho
 * en otra PC (por ejemplo, Calidad aprobando un lote) aparezca sin apretar F5.
 */
export function useRefresco(fn, ms = 10000) {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    const correr = () => {
      if (document.visibilityState === 'hidden') return;
      fnRef.current();
    };
    const id = setInterval(correr, ms);
    document.addEventListener('visibilitychange', correr);
    window.addEventListener('focus', correr);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', correr);
      window.removeEventListener('focus', correr);
    };
  }, [ms]);
}
