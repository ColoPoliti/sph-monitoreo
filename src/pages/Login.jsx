import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Acá después se valida usuario y contraseña; por ahora solo ingresa.
    navigate('/');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 p-8 shadow-md dark:shadow-none">
        <h1 className="mb-6 text-2xl font-extrabold text-gray-900 dark:text-white">Acceso SPH</h1>
        <button
          type="button"
          onClick={handleLogin}
          className="w-full cursor-pointer rounded-lg bg-violet-700 dark:bg-violet-300 py-2.5 font-bold text-white dark:text-gray-900 transition-opacity hover:opacity-90"
        >
          Entrar al monitor
        </button>
      </div>
    </main>
  );
}
