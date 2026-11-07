/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import mqtt from 'mqtt';
import { CONFIG, primeraSala, roomKey } from '../config/monitor';
import { DEMO, iniciarDemo } from '../lib/demo';

const MonitorContext = createContext(null);

function crearSalas() {
  const salas = {};
  CONFIG.AREAS.forEach((area) => {
    area.plcs.forEach((plc) => {
      const key = roomKey(area.key, plc);
      salas[key] = {
        key,
        area,
        plc,
        lastRx: 0,
        etapaIni: 0,
        etapa: null,
        estado: 0,
        peso: 0,
        sp: 0,
        receta: null,
        terminado: false,
        maxEtapa: {},
        serie: [],
      };
    });
  });
  return salas;
}

export function MonitorProvider({ children }) {
  const [rooms, setRooms] = useState(crearSalas);
  const roomsRef = useRef(rooms);
  const [mqttOk, setMqttOk] = useState(DEMO); // en demo no hay broker: se muestra conectado
  const [selectedKey, setSelectedKey] = useState(primeraSala);
  const [now, setNow] = useState(() => Date.now());
  const [lotesVersion, setLotesVersion] = useState(0);

  // Re-render cada segundo para tiempos transcurridos y estado "en línea".
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const actualizarSala = useCallback((key, fn) => {
    const previa = roomsRef.current[key];
    if (!previa) return;
    const siguiente = fn(previa);
    if (!siguiente || siguiente === previa) return;
    roomsRef.current = { ...roomsRef.current, [key]: siguiente };
    setRooms(roomsRef.current);
  }, []);

  useEffect(() => {
    const topics = Object.keys(roomsRef.current).flatMap((k) => [
      k + '/producto',
      k + '/receta',
    ]);

    const aplicarProducto = (key, d) => {
      const etapa = Number(d.etapa);
      const estado = Number(d.estado);
      const peso = Number(d.peso) * CONFIG.ESCALA_PESO;
      const sp = Number(d.sp) * CONFIG.ESCALA_PESO;
      if (![etapa, estado, peso, sp].every(Number.isFinite)) return;

      const previa = roomsRef.current[key];
      const etapaAnt = previa ? previa.etapa : null;

      actualizarSala(key, (s) => {
        let maxEtapa = s.maxEtapa;
        let terminado = s.terminado;
        let serie = s.serie;

        // nuevo ciclo: el anterior ya terminó y arranca otra vez desde la etapa 0
        if (terminado && etapa === 0 && !(sp === 0 && estado === 0)) {
          maxEtapa = {};
          terminado = false;
          serie = [];
        }

        const espera = etapa === null || etapa === 7 || (etapa === 0 && sp === 0 && estado === 0);
        if (!espera) {
          if (etapa >= 0 && etapa <= 5) {
            maxEtapa = { ...maxEtapa, [etapa]: Math.max(maxEtapa[etapa] || 0, peso) };
          }
          if (etapa >= 5) terminado = true;
        }

        serie = [...serie, { t: Date.now(), peso, sp }];
        if (serie.length > 900) serie = serie.slice(serie.length - 900);

        return {
          ...s,
          etapa,
          estado,
          peso,
          sp,
          lastRx: Date.now(),
          etapaIni: etapa !== etapaAnt ? Date.now() : s.etapaIni,
          maxEtapa,
          terminado,
          serie,
        };
      });

      // Al salir de la etapa de etiqueta Node-RED guarda el lote: refrescar el listado.
      if (etapaAnt === 5 && etapa !== 5) {
        [4000, 12000].forEach((ms) =>
          setTimeout(() => setLotesVersion((v) => v + 1), ms),
        );
      }
    };

    const aplicarReceta = (key, d) => {
      if (!d || !d.producto || !Array.isArray(d.insumos)) return;
      actualizarSala(key, (s) => {
        if (s.receta && s.receta.ts === d.ts) return s; // la retenida al reconectar
        return { ...s, receta: d, maxEtapa: {}, terminado: false };
      });
    };

    // Modo demostración (?demo en la URL): datos simulados, sin broker
    if (DEMO) {
      return iniciarDemo({ producto: aplicarProducto, receta: aplicarReceta });
    }

    const client = mqtt.connect(CONFIG.MQTT_URL, {
      username: CONFIG.MQTT_USER,
      password: CONFIG.MQTT_PASS,
      clientId: 'web-' + Math.random().toString(16).slice(2, 10),
      clean: true,
      reconnectPeriod: 3000,
      connectTimeout: 10000,
    });

    client.on('connect', () => {
      setMqttOk(true);
      client.subscribe(topics, { qos: 0 });
    });

    ['close', 'offline', 'error'].forEach((ev) =>
      client.on(ev, () => setMqttOk(false)),
    );

    client.on('message', (topic, buf) => {
      const p = topic.split('/');
      const key = p[0] + '/' + p[1];
      if (!roomsRef.current[key]) return;

      let d;
      try {
        d = JSON.parse(buf.toString());
      } catch {
        return;
      }

      const sufijo = p.slice(2).join('/');
      if (sufijo === 'producto') aplicarProducto(key, d);
      else if (sufijo === 'receta') aplicarReceta(key, d);
    });

    return () => client.end(true);
  }, [actualizarSala]);

  const value = useMemo(
    () => ({
      rooms,
      selectedKey,
      setSelectedKey,
      selectedRoom: rooms[selectedKey],
      mqttOk,
      now,
      lotesVersion,
    }),
    [rooms, selectedKey, mqttOk, now, lotesVersion],
  );

  return <MonitorContext.Provider value={value}>{children}</MonitorContext.Provider>;
}

export function useMonitor() {
  const ctx = useContext(MonitorContext);
  if (!ctx) throw new Error('useMonitor debe usarse dentro de <MonitorProvider>');
  return ctx;
}
