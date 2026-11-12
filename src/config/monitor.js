// Configuración del monitor de salas.
// Los valores se pueden sobrescribir con variables de entorno de Vite (.env.local).
// OJO: el usuario MQTT debe ser de SOLO LECTURA.

export const CONFIG = {
  // MQTT por WebSocket. En producción: wss://servidor/mqtt
  MQTT_URL: import.meta.env.VITE_MQTT_URL || 'ws://10.200.1.243:9001',
  MQTT_USER: import.meta.env.VITE_MQTT_USER || 'web_lectura',
  MQTT_PASS: import.meta.env.VITE_MQTT_PASS || 'admin.sph',
  BROKER_ETIQUETA: import.meta.env.VITE_BROKER_ETIQUETA || '10.200.1.243',

  // API PHP (lotes.php). En desarrollo /api lo redirige el proxy de Vite.
  // En producción: definir VITE_API_BASE con la URL pública de la API.
  API_BASE: import.meta.env.VITE_API_BASE || '/api',

  // Sin telemetría durante tantos segundos = PLC sin conexión (el PLC publica cada 1 s)
  SEGUNDOS_SIN_CONEXION: 5,

  // Ventana del gráfico "peso en el tiempo", en segundos
  VENTANA_GRAFICO_S: 60,

  // El PLC manda peso y SP en kg. Si los mandara en gramos, poner 0.001
  ESCALA_PESO: 1,

  // El campo "estado" de la telemetría es el estado de la válvula (DBHMI.sal_est_valv).
  // true: se muestra como porcentaje 0 a 100 en la barra "Válvula"; false: la barra queda en 0
  VALVULA_COMO_PORCENTAJE: true,

  // Diferencia (en %) a partir de la cual la etiqueta digital marca un insumo como "Fuera"
  TOLERANCIA_PCT: 1.5,

  // Salas. "key" es el AREA del topic y "plcs" las SALA: se escucha AREA/SALA/producto y AREA/SALA/receta
  // "etapas" es el nombre de cada número de etapa que informa el PLC (0, 1, 2...). Elaboración:
  // 0 alcohol, 1 colorante, 2 glicerina, 3 agua, 4 esencia, 5 etiqueta y agitado (6 fin, 7 en espera).
  // "unidades": unidad de cada etapa si no es kg.
  AREAS: [
    {
      key: 'elaboracion',
      label: 'Elaboración',
      plcs: ['001', '002'],
      etapas: ['Alcohol', 'Colorante', 'Glicerina', 'Agua', 'Esencia', 'Etiqueta y agitado'],
      unidades: { 1: 'ml' },
    },
    {
      // PENDIENTE: poner las etapas reales de aerosoles
      key: 'aerosoles',
      label: 'Aerosoles',
      plcs: ['001', '002'],
      etapas: ['Etapa 0', 'Etapa 1', 'Etapa 2', 'Etapa 3', 'Etapa 4', 'Etapa 5'],
      unidades: {},
    },
  ],
};

export const roomKey = (area, plc) => `${area}/${plc}`;

export const primeraSala = roomKey(CONFIG.AREAS[0].key, CONFIG.AREAS[0].plcs[0]);

export const areaDe = (key) => CONFIG.AREAS.find((a) => a.key === key);
