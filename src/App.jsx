import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  PlusCircle, 
  ShoppingBag, 
  Search, 
  CheckCircle, 
  BarChart3, 
  Users, 
  Image as ImageIcon, 
  AlertCircle, 
  ArrowRight, 
  Clock, 
  Edit, 
  Calendar, 
  Trash2, 
  LogOut, 
  ShieldAlert, 
  X, 
  Menu, 
  TrendingUp 
} from 'lucide-react';
import Login from './Login';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  // --- CONTROL DE ACCESO ---
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);

  // --- ESTADOS GENERALES DE LA APP ---
  const [pestana, setPestana] = useState('vender'); 
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [productos, setProductos] = useState([]);
  const [ventasDia, setVentasDia] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  
  const [form, setForm] = useState({ nombre: '', stock: '', precio_lista: '', imagen_url: '' });
  const [seleccionado, setSeleccionado] = useState(null);
  const [precioFinal, setPrecioFinal] = useState(0);
  const [productoAEditar, setProductoAEditar] = useState(null);

  // --- ESTADOS DE GESTIÓN DE PERSONAL (NUEVO) ---
  const [usuariosLista, setUsuariosLista] = useState([]);
  const [vendedorForm, setVendedorForm] = useState({ usuario: '', contrasena: '', nombre: '', rol: 'empleado' });
  const [vendedorAEditar, setVendedorAEditar] = useState(null);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario_hogarsys');
    if (usuarioGuardado) {
      setUsuarioLogueado(JSON.parse(usuarioGuardado));
    }
  }, []);

  useEffect(() => {
    if (!usuarioLogueado) return;
    fetchProductos();
    if (pestana === 'caja') fetchVentas();
    if (pestana === 'personal' && usuarioLogueado.rol === 'admin') fetchUsuarios();
  }, [pestana, usuarioLogueado]);

  async function fetchProductos() {
    const { data } = await supabase.from('productos').select('*').order('nombre');
    setProductos(data || []);
  }

  async function fetchUsuarios() {
    const { data } = await supabase.from('usuarios').select('*').order('nombre');
    setUsuariosLista(data || []);
  }

  async function fetchVentas() {
    let query = supabase.from('ventas').select('*');

    if (usuarioLogueado.rol === 'empleado') {
      const hoy = new Date().toISOString().split('T')[0];
      query = query
        .eq('vendedor_nombre', usuarioLogueado.nombre)
        .gte('fecha_venta', `${hoy}T00:00:00`)
        .lte('fecha_venta', `${hoy}T23:59:59`);
    }

    const { data } = await query.order('fecha_venta', { ascending: false });
    setVentasDia(data || []);
  }

  const realizarVenta = async () => {
    if (seleccionado.stock <= 0) {
      alert("Error: No queda stock disponible.");
      return;
    }

    const { error: errStock } = await supabase.from('productos')
      .update({ stock: seleccionado.stock - 1 })
      .eq('id', seleccionado.id);

    const { error: errVenta } = await supabase.from('ventas').insert([{
      nombre_producto: seleccionado.nombre,
      precio_venta: parseFloat(precioFinal),
      fecha_venta: new Date().toISOString(),
      vendedor_nombre: usuarioLogueado.nombre
    }]);

    if (!errStock && !errVenta) {
      setSeleccionado(null);
      fetchProductos();
      alert("Venta realizada con éxito.");
    }
  };

  // --- MÉTODOS DE CONTROL DE PRODUCTOS ---
  const guardarEdicionProducto = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('productos')
      .update({
        nombre: productoAEditar.nombre,
        stock: parseInt(productoAEditar.stock),
        precio_lista: parseFloat(productoAEditar.precio_lista),
        imagen_url: productoAEditar.imagen_url
      })
      .eq('id', productoAEditar.id);

    if (!error) {
      setProductoAEditar(null);
      fetchProductos();
      alert("¡Producto actualizado!");
    }
  };

  const eliminarProducto = async (id, nombre) => {
    if (window.confirm(`¿Seguro de eliminar "${nombre}"?`)) {
      setProductos(prev => prev.filter(p => p.id !== id));
      await supabase.from('productos').delete().eq('id', id);
      fetchProductos();
    }
  };

  // --- MÉTODOS DE CONTROL DE PERSONAL ---
  const agregarVendedor = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('usuarios').insert([
      { 
        usuario: vendedorForm.usuario.trim().toLowerCase(), 
        contrasena: vendedorForm.contrasena, 
        nombre: vendedorForm.nombre, 
        rol: vendedorForm.rol 
      }
    ]);

    if (error) {
      alert("Error al registrar vendedor: " + error.message);
    } else {
      alert("¡Usuario registrado con éxito!");
      setVendedorForm({ usuario: '', contrasena: '', nombre: '', rol: 'empleado' });
      fetchUsuarios();
    }
  };

  const guardarEdicionVendedor = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('usuarios')
      .update({
        usuario: vendedorAEditar.usuario.trim().toLowerCase(),
        contrasena: vendedorAEditar.contrasena,
        nombre: vendedorAEditar.nombre,
        rol: vendedorAEditar.rol
      })
      .eq('id', vendedorAEditar.id);

    if (!error) {
      setVendedorAEditar(null);
      fetchUsuarios();
      alert("Datos de usuario actualizados correctamente.");
    } else {
      alert("Error al actualizar: " + error.message);
    }
  };

  const eliminarVendedor = async (id, nombre) => {
    if (id === usuarioLogueado.id) {
      alert("No puedes eliminar tu propia cuenta activa de administrador.");
      return;
    }
    if (window.confirm(`¿Estás seguro de que deseas eliminar al usuario "${nombre}" del sistema?`)) {
      const { error } = await supabase.from('usuarios').delete().eq('id', id);
      if (!error) {
        alert("Usuario eliminado.");
        fetchUsuarios();
      }
    }
  };

  // --- MANEJO DE SESIÓN ---
  const manejarLoginExitoso = (datosUsuario) => {
    setUsuarioLogueado(datosUsuario);
    localStorage.setItem('usuario_hogarsys', JSON.stringify(datosUsuario));
  };

  const manejarCerrarSesion = () => {
    setUsuarioLogueado(null);
    localStorage.removeItem('usuario_hogarsys');
    setPestana('vender');
  };

  // --- CÓMPUTO DE REPORTES ---
  const formatearFechaCabecera = (fechaString) => {
    const fechaVenta = new Date(fechaString);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    if (fechaVenta.toDateString() === hoy.toDateString()) return 'Hoy';
    if (fechaVenta.toDateString() === ayer.toDateString()) return 'Ayer';
    return fechaVenta.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const ventasAgrupadasPorDia = ventasDia.reduce((grupos, venta) => {
    const fechaClave = new Date(venta.fecha_venta).toDateString();
    if (!grupos[fechaClave]) {
      grupos[fechaClave] = {
        fechaTexto: formatearFechaCabecera(venta.fecha_venta),
        totalDia: 0,
        transacciones: []
      };
    }
    grupos[fechaClave].totalDia += venta.precio_venta;
    grupos[fechaClave].transacciones.push(venta);
    return grupos;
  }, {});

  const listaVentasAgrupadas = Object.values(ventasAgrupadasPorDia);

  const ingresosDeHoy = ventasDia
    .filter(v => new Date(v.fecha_venta).toDateString() === new Date().toDateString())
    .reduce((acc, v) => acc + v.precio_venta, 0);

  const transaccionesDeHoy = ventasDia.filter(
    v => new Date(v.fecha_venta).toDateString() === new Date().toDateString()
  ).length;

  if (!usuarioLogueado) {
    return <Login supabase={supabase} onLoginSuccess={manejarLoginExitoso} />;
  }

  const esAdmin = usuarioLogueado.rol === 'admin';

  const MenuLink = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => { setPestana(id); setMenuAbierto(false); }}
      className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all font-bold ${
        pestana === id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <Icon size={22} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      
      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 
        ${menuAbierto ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex flex-col h-full">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-blue-600 tracking-tighter italic">HOGAR.SYS</h1>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">
                {usuarioLogueado.nombre} ({usuarioLogueado.rol === 'admin' ? 'Administrador' : 'Vendedor'})
              </p>
            </div>
            <button className="md:hidden" onClick={() => setMenuAbierto(false)}><X /></button>
          </div>

          <nav className="space-y-2 flex-1">
            <MenuLink id="vender" icon={ShoppingBag} label="Tienda" />
            {esAdmin && <MenuLink id="agregar" icon={PlusCircle} label="Nuevo Producto" />}
            {esAdmin && <MenuLink id="personal" icon={Users} label="Personal / Vendedores" />}
            <MenuLink id="caja" icon={BarChart3} label={esAdmin ? "Caja y Reportes" : "Mis Ventas de Hoy"} />
          </nav>

          <div className="pt-6 border-t">
            <button 
              onClick={manejarCerrarSesion}
              className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all font-bold text-red-500 hover:bg-red-50"
            >
              <LogOut size={22} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        <header className="md:hidden p-4 bg-white border-b flex justify-between items-center">
          <div>
            <h1 className="font-black text-blue-600">HOGAR.SYS</h1>
            <p className="text-[9px] text-slate-400 font-bold">{usuarioLogueado.nombre}</p>
          </div>
          <button onClick={() => setMenuAbierto(true)} className="p-2 bg-slate-100 rounded-xl"><Menu /></button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10">
          <div className="max-w-6xl mx-auto">
            
            <div className="mb-8">
              <h2 className="text-4xl font-black text-slate-800 capitalize">
                {pestana === 'personal' ? 'Gestión de Personal' : (pestana === 'caja' && !esAdmin ? 'Mis Ventas de Hoy' : pestana)}
              </h2>
              <p className="text-slate-400 font-medium">
                {esAdmin ? 'Panel integral de administración' : 'Punto de facturación autorizado'}
              </p>
            </div>

            {/* VISTA: GESTIÓN DE PERSONAL / VENDEDORES (SOLO ADMIN) */}
            {pestana === 'personal' && esAdmin && (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Formulario para registrar usuarios */}
                <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm h-fit">
                  <h3 className="text-lg font-black text-slate-700 mb-6 uppercase tracking-tight">Agregar Usuario</h3>
                  <form onSubmit={agregarVendedor} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre Completo</label>
                      <input 
                        className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-600 text-sm font-bold" 
                        placeholder="Ej. Juan Pérez" 
                        value={vendedorForm.nombre} 
                        onChange={e => setVendedorForm({...vendedorForm, nombre: e.target.value})} 
                        required 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Usuario de Ingreso (Identificador)</label>
                      <input 
                        className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-600 text-sm font-bold" 
                        placeholder="Ej. juanp" 
                        value={vendedorForm.usuario} 
                        onChange={e => setVendedorForm({...vendedorForm, usuario: e.target.value})} 
                        required 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Contraseña</label>
                      <input 
                        type="password"
                        className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-600 text-sm" 
                        placeholder="••••••••" 
                        value={vendedorForm.contrasena} 
                        onChange={e => setVendedorForm({...vendedorForm, contrasena: e.target.value})} 
                        required 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Rol del Sistema</label>
                      <select 
                        className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-600 text-sm font-bold" 
                        value={vendedorForm.rol} 
                        onChange={e => setVendedorForm({...vendedorForm, rol: e.target.value})}
                      >
                        <option value="empleado">Vendedor (Empleado)</option>
                        <option value="admin">Administrador (Control total)</option>
                      </select>
                    </div>

                    <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-xs tracking-wider shadow-lg hover:bg-blue-600 transition-all active:scale-95">
                      Registrar en el Sistema
                    </button>
                  </form>
                </div>

                {/* Lista de usuarios activos en el sistema */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
                  <div className="p-6 bg-slate-50 border-b">
                    <h3 className="font-black text-slate-700 text-md uppercase tracking-tight">Vendedores y Personal Activo</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {usuariosLista.map(u => (
                      <div key={u.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all">
                        <div>
                          <p className="font-black text-slate-800 text-lg">{u.nombre}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400 font-bold">Identificador: <strong className="text-slate-600">{u.usuario}</strong></span>
                            <span className="text-slate-300">•</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${u.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                              {u.rol === 'admin' ? 'ADMIN' : 'VENDEDOR'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setVendedorAEditar(u)}
                            className="bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-500 p-3 rounded-full transition-all active:scale-95 border"
                            title="Editar usuario"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => eliminarVendedor(u.id, u.nombre)}
                            className="bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-500 p-3 rounded-full transition-all active:scale-95 border"
                            title="Eliminar usuario"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VISTA: VENDER */}
            {pestana === 'vender' && (
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-5 top-5 text-slate-300" />
                  <input 
                    className="w-full p-5 pl-14 rounded-3xl bg-white border-none shadow-md outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg"
                    placeholder="¿Qué estás buscando?"
                    onChange={e => setBusqueda(e.target.value)}
                  />
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {productos.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(p => (
                    <div 
                      key={p.id} 
                      className={`group bg-white rounded-[2.5rem] border-2 border-transparent overflow-hidden transition-all shadow-sm flex flex-col relative
                        ${p.stock <= 0 ? 'opacity-70 grayscale' : 'hover:border-blue-500 hover:shadow-xl'}`}
                    >
                      {esAdmin && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setProductoAEditar(p); }}
                          className="absolute top-4 right-4 z-10 bg-white/95 hover:bg-blue-600 hover:text-white text-slate-600 p-3 rounded-full shadow-lg transition-all active:scale-95"
                        >
                          <Edit size={16} />
                        </button>
                      )}

                      <div 
                        onClick={() => { if(p.stock > 0) { setSeleccionado(p); setPrecioFinal(p.precio_lista); }}}
                        className="cursor-pointer flex-1 flex flex-col"
                      >
                        <div className="h-48 bg-slate-100 relative overflow-hidden">
                          {p.imagen_url ? (
                            <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={40} /></div>
                          )}
                          {p.stock <= 0 && (
                            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center font-black text-white text-xs uppercase tracking-widest">Agotado</div>
                          )}
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-black text-slate-800 leading-tight pr-4">{p.nombre}</h3>
                            <span className="text-blue-600 font-black text-xl">S/. {p.precio_lista}</span>
                          </div>
                          <div className="mt-auto pt-4 flex items-center justify-between">
                             <span className={`text-[10px] font-black px-3 py-1 rounded-full ${p.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                               STOCK: {p.stock}
                             </span>
                             <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VISTA: AGREGAR PRODUCTO (SOLO ADMIN) */}
            {pestana === 'agregar' && esAdmin && (
              <div className="max-w-2xl bg-white p-10 md:p-16 rounded-[3.5rem] border shadow-sm mx-auto">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  await supabase.from('productos').insert([
                    { nombre: form.nombre, stock: parseInt(form.stock), precio_lista: parseFloat(form.precio_lista), imagen_url: form.imagen_url }
                  ]);
                  setForm({ nombre: '', stock: '', precio_lista: '', imagen_url: '' });
                  setPestana('vender');
                  fetchProductos();
                }} className="space-y-6">
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase ml-2">Nombre del Producto</label>
                      <input className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-600 text-lg" placeholder="Ej. Cocina a Gas" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase ml-2">URL de la Imagen</label>
                      <input className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-600" placeholder="https://ejemplo.com/imagen.jpg" value={form.imagen_url} onChange={e => setForm({...form, imagen_url: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase ml-2">Stock Inicial</label>
                        <input type="number" className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-600" placeholder="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase ml-2">Precio de Venta (S/.)</label>
                        <input type="number" step="0.01" className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-600" placeholder="0.00" value={form.precio_lista} onChange={e => setForm({...form, precio_lista: e.target.value})} required />
                      </div>
                    </div>
                  </div>
                  <button className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-3">
                    <PlusCircle size={24} /> Guardar en Inventario
                  </button>
                </form>
              </div>
            )}

            {/* VISTA: CAJA */}
            {pestana === 'caja' && (
              <div className="space-y-8">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-white p-10 rounded-[3rem] border shadow-sm flex flex-col justify-center">
                    <p className="text-slate-400 font-bold uppercase text-xs mb-2 tracking-wider">
                      {esAdmin ? 'Ingresos de Hoy' : 'Mi Total de Hoy'}
                    </p>
                    <p className="text-7xl font-black text-slate-900">S/. {ingresosDeHoy.toFixed(2)}</p>
                  </div>
                  <div className="bg-blue-600 p-8 rounded-[3rem] text-white shadow-xl flex flex-col justify-between">
                    <TrendingUp size={40} className="text-blue-200" />
                    <div>
                      <p className="text-3xl font-black">{transaccionesDeHoy}</p>
                      <p className="text-sm font-bold text-blue-100">{esAdmin ? 'Transacciones hoy' : 'Mis transacciones hoy'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-700 flex items-center gap-2">
                    <Calendar size={22} className="text-blue-600" /> {esAdmin ? 'Historial de Ventas Diario' : 'Mis Ventas del Turno'}
                  </h3>

                  {listaVentasAgrupadas.length === 0 ? (
                    <div className="bg-white p-10 rounded-[2.5rem] border text-center text-slate-400">
                      No hay registros de ventas todavía.
                    </div>
                  ) : (
                    listaVentasAgrupadas.map((grupo, index) => (
                      <div key={index} className="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm">
                        <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
                          <span className="font-black text-slate-700 text-lg capitalize">{grupo.fechaTexto}</span>
                          <span className="bg-green-100 text-green-700 px-4 py-2 rounded-2xl font-black text-sm">Total: S/. {grupo.totalDia.toFixed(2)}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase border-b">
                              <tr>
                                <th className="px-6 py-4">Producto</th>
                                {esAdmin && <th className="px-6 py-4">Vendedor</th>}
                                <th className="px-6 py-4"><span className="flex items-center gap-1"><Clock size={12}/> Hora</span></th>
                                <th className="px-6 py-4 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {grupo.transacciones.map((v, i) => (
                                <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                  <td className="px-6 py-4 font-bold text-slate-700">{v.nombre_producto}</td>
                                  {esAdmin && <td className="px-6 py-4 text-slate-500 font-bold text-xs">{v.vendedor_nombre || 'No asignado'}</td>}
                                  <td className="px-6 py-4 text-slate-400 text-sm">{new Date(v.fecha_venta).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                  <td className="px-6 py-4 text-right font-black text-green-600">S/. {v.precio_venta.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* MODAL: EDITAR VENDEDOR (NUEVO) */}
      {vendedorAEditar && esAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[102] p-4">
          <div className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Editar Vendedor</h3>
              <p className="text-slate-400 font-bold">Modifica el acceso de este usuario</p>
            </div>

            <form onSubmit={guardarEdicionVendedor} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre Completo</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                  value={vendedorAEditar.nombre}
                  onChange={e => setVendedorAEditar({...vendedorAEditar, nombre: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Identificador de Usuario</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                  value={vendedorAEditar.usuario}
                  onChange={e => setVendedorAEditar({...vendedorAEditar, usuario: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Cambiar Contraseña</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={vendedorAEditar.contrasena}
                  onChange={e => setVendedorAEditar({...vendedorAEditar, contrasena: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Rol</label>
                <select 
                  className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-600 text-sm font-bold" 
                  value={vendedorAEditar.rol} 
                  onChange={e => setVendedorAEditar({...vendedorAEditar, rol: e.target.value})}
                >
                  <option value="empleado">Vendedor (Empleado)</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="grid gap-2 pt-4">
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-md shadow-xl active:scale-95 transition-all">
                  GUARDAR CAMBIOS
                </button>
                <button type="button" onClick={() => setVendedorAEditar(null)} className="w-full py-2 text-slate-400 font-bold hover:text-red-500 transition-colors text-sm">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR PRODUCTO */}
      {productoAEditar && esAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[101] p-4">
          <div className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl">
            <div className="text-center mb-6 relative">
              <button 
                type="button" 
                onClick={() => eliminarProducto(productoAEditar.id, productoAEditar.nombre)}
                className="absolute -top-4 -right-4 bg-red-50 hover:bg-red-600 text-red-500 hover:text-white p-3 rounded-full transition-all active:scale-90"
              >
                <Trash2 size={18} />
              </button>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Editar Producto</h3>
              <p className="text-slate-400 font-bold">Modifica las propiedades del artículo</p>
            </div>

            <form onSubmit={guardarEdicionProducto} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre</label>
                <input type="text" className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold" value={productoAEditar.nombre} onChange={e => setProductoAEditar({...productoAEditar, nombre: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">URL Imagen</label>
                <input type="text" className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={productoAEditar.imagen_url || ''} onChange={e => setProductoAEditar({...productoAEditar, imagen_url: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Stock</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold" value={productoAEditar.stock} onChange={e => setProductoAEditar({...productoAEditar, stock: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Precio (S/.)</label>
                  <input type="number" step="0.01" className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold" value={productoAEditar.precio_lista} onChange={e => setProductoAEditar({...productoAEditar, precio_lista: e.target.value})} required />
                </div>
              </div>
              <div className="grid gap-2 pt-4">
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-md shadow-xl active:scale-95 transition-all">GUARDAR CAMBIOS</button>
                <button type="button" onClick={() => setProductoAEditar(null)} className="w-full py-2 text-slate-400 font-bold hover:text-red-500 transition-colors text-sm">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE COBRO */}
      {seleccionado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                <ShoppingBag size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Confirmar Venta</h3>
              <p className="text-slate-400 font-bold">{seleccionado.nombre}</p>
            </div>
            
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 mb-8">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2 text-center tracking-widest">Precio Final</p>
              <div className="flex items-center justify-center">
                <span className="text-4xl font-black text-blue-300 mr-2">S/.</span>
                <input type="number" className="text-6xl font-black bg-transparent text-blue-600 w-full text-center outline-none" value={precioFinal} onChange={e => setPrecioFinal(e.target.value)} autoFocus />
              </div>
            </div>

            <div className="grid gap-3">
              <button onClick={realizarVenta} className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all">COMPLETAR COBRO</button>
              <button onClick={() => setSeleccionado(null)} className="w-full py-4 text-slate-400 font-bold hover:text-red-500 transition-colors">Cancelar transacción</button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MÓVIL */}
      {menuAbierto && <div className="fixed inset-0 bg-slate-900/40 z-40 md:hidden" onClick={() => setMenuAbierto(false)}></div>}
    </div>
  );
}

export default App;