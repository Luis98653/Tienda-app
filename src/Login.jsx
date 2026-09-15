import React, { useState, useEffect } from 'react';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export default function Login({ supabase, onLoginSuccess }) {
  const [usuariosDB, setUsuariosDB] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargandoLista, setCargandoLista] = useState(true);
  const [cargandoLogin, setCargandoLogin] = useState(false);
  const [error, setError] = useState('');

  // Cargar la lista de trabajadores registrados al abrir la app
  useEffect(() => {
    async function obtenerUsuarios() {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, usuario, nombre, rol')
          .order('nombre', { ascending: true });

        if (error) throw error;
        setUsuariosDB(data || []);
      } catch (err) {
        setError('No se pudo conectar con la base de datos de personal.');
        console.error(err);
      } finally {
        setCargandoLista(false);
      }
    }
    obtenerUsuarios();
  }, [supabase]);

  const manejarLogin = async (e) => {
    e.preventDefault();
    if (!usuarioSeleccionado) {
      setError('Por favor, selecciona tu usuario de la lista.');
      return;
    }

    setCargandoLogin(true);
    setError('');

    try {
      const { data, error: dbError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('usuario', usuarioSeleccionado)
        .eq('contrasena', contrasena)
        .single();

      if (dbError || !data) {
        throw new Error('Contraseña incorrecta. Inténtalo de nuevo.');
      }

      onLoginSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargandoLogin(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="bg-white w-full max-w-md p-10 md:p-12 rounded-[3rem] shadow-xl border">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-blue-600 tracking-tighter italic mb-2">HOGAR.SYS</h1>
          <p className="text-slate-400 font-bold">Ingreso al Sistema</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100">
            <AlertCircle size={20} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={manejarLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase ml-2">Selecciona tu Usuario</label>
            <div className="relative">
              <User className="absolute left-4 top-4 text-slate-300" size={20} />
              
              {cargandoLista ? (
                <div className="w-full p-4 pl-12 bg-slate-50 rounded-2xl font-bold text-slate-400 flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} /> Cargando personal...
                </div>
              ) : (
                <select 
                  className="w-full p-4 pl-12 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold appearance-none cursor-pointer text-slate-700"
                  value={usuarioSeleccionado}
                  onChange={e => setUsuarioSeleccionado(e.target.value)}
                  required
                >
                  <option value="">-- Elige tu nombre --</option>
                  {usuariosDB.map((u) => (
                    <option key={u.id} value={u.usuario}>
                      {u.nombre} ({u.rol === 'admin' ? 'Administrador' : 'Vendedor'})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase ml-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-4 text-slate-300" size={20} />
              <input 
                type="password" 
                className="w-full p-4 pl-12 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="••••••••"
                value={contrasena}
                onChange={e => setContrasena(e.target.value)}
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={cargandoLogin || cargandoLista}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
          >
            {cargandoLogin ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}