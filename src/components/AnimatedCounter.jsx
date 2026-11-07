import { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

/**
 * Número que se anima (efecto contador) cada vez que cambia su valor.
 * `decimals`: cantidad de decimales a mostrar (por defecto 1).
 */
export default function AnimatedCounter({ value, decimals = 1, className = '' }) {
  const numericValue = Number(value) || 0;

  const spring = useSpring(numericValue, {
    mass: 0.5,
    stiffness: 80,
    damping: 15,
  });

  const display = useTransform(spring, (current) => current.toFixed(decimals));

  useEffect(() => {
    spring.set(numericValue);
  }, [spring, numericValue]);

  return <motion.span className={className}>{display}</motion.span>;
}
