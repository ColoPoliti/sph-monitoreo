/**
 * Logo de Saphirus.
 *
 * Hoy usa la imagen `public/logosaphirus.png`.
 * Para cambiarlo por un SVG: colocá el archivo en `public/` y actualizá `ARCHIVO`
 * (o reemplazá el PNG manteniendo el mismo nombre).
 */
const ARCHIVO = 'logosaphirus.png';

export default function SaphirusLogo({ className = '' }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}${ARCHIVO}`}
      alt="Saphirus"
      className={`${className} dark:brightness-0 dark:invert`}
      decoding="async"
      draggable="false"
    />
  );
}
