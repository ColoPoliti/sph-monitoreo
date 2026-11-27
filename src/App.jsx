import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ActualizacionPWA from './components/ActualizacionPWA';
import Layout from './components/Layout';
import { MonitorProvider } from './context/MonitorContext';
import Dashboard from './pages/Dashboard';
import EtiquetaDigital from './pages/EtiquetaDigital';
import Historial from './pages/Historial';
import Login from './pages/Login';
import Usuarios from './pages/Usuarios';

function App() {
  return (
    <BrowserRouter>
      {/* Web app: service worker y aviso "Hay una versión nueva" */}
      <ActualizacionPWA />
      <MonitorProvider>
        <Routes>
          {/* Acceso (opcional) */}
          <Route path="/login" element={<Login />} />

          {/* Monitor con menú de salas */}
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="historial" element={<Historial />} />
            <Route path="lotes/:id" element={<EtiquetaDigital />} />
            {/* Administración de usuarios: solo superadministrador (la página lo controla) */}
            <Route path="usuarios" element={<Usuarios />} />
            {/* Rutas viejas de aprobación: el login ahora es un modal (navbar) y se aprueba desde el historial */}
            <Route path="admin/login" element={<Navigate to="/historial" replace />} />
            <Route path="admin" element={<Navigate to="/historial" replace />} />
            <Route path="dashboard" element={<Navigate to="/" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MonitorProvider>
    </BrowserRouter>
  );
}

export default App;
