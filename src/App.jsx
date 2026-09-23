import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  PlusCircle, 
  ShoppingBag, 
  ShoppingCart,
  Search, 
  CheckCircle, 
  BarChart3, 
  Users, 
  Image as ImageIcon, 
  AlertCircle, 
  Clock, 
  Edit, 
  Trash2, 
  LogOut, 
  X, 
  Menu, 
  TrendingUp,
  Plus,
  Minus,
  RefreshCw,
  SlidersHorizontal,
  PackageCheck,
  PackageX,
  ReceiptText,
  UserPlus, 
  Contact,
  CreditCard,
  Pencil,
  MapPin,
  Truck,
  Store,
  ExternalLink
} from 'lucide-react';
import Login from './Login';

const supabase = createClient(
  'https://afvlnosqgzcdhzonkabq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmdmxub3NxZ3pjZGh6b25rYWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NDcxOTksImV4cCI6MjA5NDEyMzE5OX0.vhod6ZZUpV_n0Gq_5Bzxvj9OU95QHpWOI4z5LVpkb0I'
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
  const [filtroStock, setFiltroStock] = useState('todos');
  const [ordenProductos, setOrdenProductos] = useState('nombre');
  const [carrito, setCarrito] = useState([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  
  // --- ESTADO DE TIPO DE ENTREGA ---
  const [tipoEntrega, setTipoEntrega] = useState('tienda'); // 'tienda' | 'delivery'

  // --- MAPA Y UBICACIÓN ---
  const mapRef = useRef(null);
  const inputRef = useRef(null);
  const [cargado, setCargado] = useState(false);
  const [coordenadas, setCoordenadas] = useState({ lat: -12.046374, lng: -77.042793 });
  const [direccion, setDireccion] = useState('');

  // Cargar Google Maps
  useEffect(() => {
    const checkGoogleMaps = setInterval(() => {
      if (window.google && window.google.maps) {
        setCargado(true);
        clearInterval(checkGoogleMaps);
      }
    }, 100);
    return () => clearInterval(checkGoogleMaps);
  }, []);

  const obtenerDireccionDeCoordenadas = useCallback((lat, lng) => {
    if (!window.google || !window.google.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const direccionFormateada = results[0].formatted_address;
        setDireccion(direccionFormateada);
        if (inputRef.current) {
          inputRef.current.value = direccionFormateada;
        }
      }
    });
  }, []);

  // Inicialización de Google Maps
  useEffect(() => {
    if (!cargado || !mostrarCarrito || tipoEntrega !== 'delivery' || !mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: coordenadas,
      zoom: 15,
      disableDefaultUI: false,
    });

    const marker = new window.google.maps.Marker({
      position: coordenadas,
      map: map,
      draggable: true,
    });

    marker.addListener("dragend", () => {
      const nuevaLat = marker.getPosition().lat();
      const nuevaLng = marker.getPosition().lng();
      setCoordenadas({ lat: nuevaLat, lng: nuevaLng });
      obtenerDireccionDeCoordenadas(nuevaLat, nuevaLng);
    });

    if (inputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current);
      autocomplete.bindTo("bounds", map);

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;

        const nuevaLat = place.geometry.location.lat();
        const nuevaLng = place.geometry.location.lng();

        map.setCenter(place.geometry.location);
        map.setZoom(17);
        marker.setPosition(place.geometry.location);

        setCoordenadas({ lat: nuevaLat, lng: nuevaLng });
        setDireccion(place.formatted_address || place.name || '');
      });
    }
  }, [cargado, mostrarCarrito, tipoEntrega, obtenerDireccionDeCoordenadas]);

  // --- FORMULARIOS ---
  const [form, setForm] = useState({ nombre: '', stock: '', precio_lista: '', imagen_url: '' });
  const [productoAEditar, setProductoAEditar] = useState(null);

  const [usuariosLista, setUsuariosLista] = useState([]);
  const [vendedorForm, setVendedorForm] = useState({ usuario: '', contrasena: '', nombre: '', rol: 'empleado' });
  const [vendedorAEditar, setVendedorAEditar] = useState(null);
  
  const [clientesLista, setClientesLista] = useState([]);
  const [clienteForm, setClienteForm] = useState({ id: null, nombre: '', documento: '', telefono: '', correo: '' });
  const [clienteAEditar, setClienteAEditar] = useState(null);
  const [clienteSeleccionadoVenta, setClienteSeleccionadoVenta] = useState('');

  // --- ESTADOS DE OPERACIÓN ---
  const [cargando, setCargando] = useState(false);
  const [procesandoVenta, setProcesandoVenta] = useState(false);
  const [errorApp, setErrorApp] = useState('');
  const [mensajeApp, setMensajeApp] = useState('');

  const mostrarMensaje = useCallback((texto) => {
    setMensajeApp(texto);
    window.setTimeout(() => setMensajeApp(''), 3200);
  }, []);

  // --- CONSULTAS SUPABASE ---
  const fetchClientes = useCallback(async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      mostrarMensaje('No se pudo cargar la lista de clientes.');
      return false;
    }
    setClientesLista(data || []);
    return true;
  }, [mostrarMensaje]);

  const fetchProductos = useCallback(async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      setErrorApp('No se pudieron cargar los productos.');
      return false;
    }
    setProductos(data || []);
    return true;
  }, []);

  const fetchUsuarios = useCallback(async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      setErrorApp('No se pudo cargar el personal.');
      return false;
    }
    setUsuariosLista(data || []);
    return true;
  }, []);

  const fetchVentas = useCallback(async () => {
    if (!usuarioLogueado) return false;

    let query = supabase.from('ventas').select('*');

    if (usuarioLogueado.rol === 'empleado') {
      const hoy = new Date().toISOString().split('T')[0];
      query = query
        .eq('vendedor_nombre', usuarioLogueado.nombre)
        .gte('fecha_venta', `${hoy}T00:00:00`)
        .lte('fecha_venta', `${hoy}T23:59:59`);
    }

    const { data, error } = await query.order('fecha_venta', { ascending: false });

    if (error) {
      setErrorApp('No se pudo cargar el historial de ventas.');
      return false;
    }

    setVentasDia(data || []);
    return true;
  }, [usuarioLogueado]);

  useEffect(() => {
    try {
      const usuarioGuardado = localStorage.getItem('usuario_hogarsys');
      if (usuarioGuardado) {
        const usuario = JSON.parse(usuarioGuardado);
        if (usuario && usuario.id && usuario.usuario && usuario.rol) {
          setUsuarioLogueado(usuario);
          fetchClientes();
        } else {
          localStorage.removeItem('usuario_hogarsys');
        }
      }
    } catch (error) {
      localStorage.removeItem('usuario_hogarsys');
    }
  }, [fetchClientes]);

  useEffect(() => {
    if (!usuarioLogueado) return;
    let activo = true;

    const cargarDatos = async () => {
      setCargando(true);
      setErrorApp('');

      try {
        await fetchProductos();
        if (pestana === 'caja') await fetchVentas();
        if (pestana === 'personal' && usuarioLogueado.rol === 'admin') await fetchUsuarios();
        if (pestana === 'clientes') await fetchClientes();
      } catch (error) {
        setErrorApp('Error al cargar los datos.');
      } finally {
        if (activo) setCargando(false);
      }
    };
    cargarDatos();

    return () => { activo = false; };
  }, [pestana, usuarioLogueado, fetchProductos, fetchVentas, fetchUsuarios, fetchClientes]);

  // --- CRUD PRODUCTOS ---
  const guardarProducto = async (e) => {
    e.preventDefault();
    if (!form.nombre || form.stock === '' || !form.precio_lista) {
      mostrarMensaje('Completa los campos obligatorios del producto.');
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      stock: parseInt(form.stock, 10),
      precio_lista: parseFloat(form.precio_lista),
      imagen_url: form.imagen_url.trim()
    };

    setCargando(true);
    let error;

    if (productoAEditar) {
      const { error: err } = await supabase.from('productos').update(payload).eq('id', productoAEditar.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('productos').insert([payload]);
      error = err;
    }

    setCargando(false);

    if (error) {
      setErrorApp('Error al guardar el producto: ' + error.message);
    } else {
      mostrarMensaje(productoAEditar ? 'Producto actualizado correctamente.' : 'Producto creado exitosamente.');
      setForm({ nombre: '', stock: '', precio_lista: '', imagen_url: '' });
      setProductoAEditar(null);
      fetchProductos();
      setPestana('vender');
    }
  };

  const seleccionarEditarProducto = (p) => {
    setProductoAEditar(p);
    setForm({
      nombre: p.nombre || '',
      stock: p.stock ?? '',
      precio_lista: p.precio_lista ?? '',
      imagen_url: p.imagen_url || ''
    });
    setPestana('agregar');
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm('¿Seguro de que deseas eliminar este producto?')) return;
    setCargando(true);
    const { error } = await supabase.from('productos').delete().eq('id', id);
    setCargando(false);

    if (error) {
      setErrorApp('No se pudo eliminar el producto.');
    } else {
      mostrarMensaje('Producto eliminado.');
      fetchProductos();
    }
  };

  // --- CRUD PERSONAL ---
  const guardarUsuario = async (e) => {
    e.preventDefault();
    if (!vendedorForm.usuario || !vendedorForm.contrasena || !vendedorForm.nombre) {
      mostrarMensaje('Completa todos los campos del vendedor.');
      return;
    }

    setCargando(true);
    let error;

    if (vendedorAEditar) {
      const { error: err } = await supabase.from('usuarios').update(vendedorForm).eq('id', vendedorAEditar.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('usuarios').insert([vendedorForm]);
      error = err;
    }

    setCargando(false);

    if (error) {
      setErrorApp('Error al guardar el usuario: ' + error.message);
    } else {
      mostrarMensaje(vendedorAEditar ? 'Usuario actualizado.' : 'Usuario registrado.');
      setVendedorForm({ usuario: '', contrasena: '', nombre: '', rol: 'empleado' });
      setVendedorAEditar(null);
      fetchUsuarios();
    }
  };

  const seleccionarEditarUsuario = (u) => {
    setVendedorAEditar(u);
    setVendedorForm({
      usuario: u.usuario || '',
      contrasena: u.contrasena || '',
      nombre: u.nombre || '',
      rol: u.rol || 'empleado'
    });
  };

  const eliminarUsuario = async (id) => {
    if (!window.confirm('¿Eliminar este acceso de usuario?')) return;
    setCargando(true);
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    setCargando(false);

    if (error) {
      setErrorApp('No se pudo eliminar el usuario.');
    } else {
      mostrarMensaje('Usuario eliminado.');
      fetchUsuarios();
    }
  };

  // --- CRUD CLIENTES ---
  const guardarCliente = async (e) => {
    e.preventDefault();
    if (!clienteForm.nombre) {
      mostrarMensaje('El nombre del cliente es obligatorio.');
      return;
    }

    setCargando(true);
    let error;

    if (clienteAEditar) {
      const { error: err } = await supabase.from('clientes').update({
        nombre: clienteForm.nombre,
        documento: clienteForm.documento,
        telefono: clienteForm.telefono,
        correo: clienteForm.correo
      }).eq('id', clienteAEditar.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('clientes').insert([{
        nombre: clienteForm.nombre,
        documento: clienteForm.documento,
        telefono: clienteForm.telefono,
        correo: clienteForm.correo
      }]);
      error = err;
    }

    setCargando(false);

    if (error) {
      setErrorApp('Error al guardar el cliente: ' + error.message);
    } else {
      mostrarMensaje(clienteAEditar ? 'Cliente actualizado.' : 'Cliente registrado.');
      setClienteForm({ id: null, nombre: '', documento: '', telefono: '', correo: '' });
      setClienteAEditar(null);
      fetchClientes();
    }
  };

  const seleccionarEditarCliente = (c) => {
    setClienteAEditar(c);
    setClienteForm({
      id: c.id,
      nombre: c.nombre || '',
      documento: c.documento || '',
      telefono: c.telefono || '',
      correo: c.correo || ''
    });
  };

  const eliminarCliente = async (id) => {
    if (!window.confirm('¿Deseas eliminar a este cliente?')) return;
    setCargando(true);
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    setCargando(false);

    if (error) {
      setErrorApp('No se pudo eliminar el cliente.');
    } else {
      mostrarMensaje('Cliente eliminado.');
      fetchClientes();
    }
  };

  // --- CARRITO Y PROCESO DE VENTA ---
  const agregarAlCarrito = (producto) => {
    const stock = Number(producto.stock) || 0;
    if (stock <= 0) {
      mostrarMensaje('Este producto está agotado.');
      return;
    }

    setCarrito(prev => {
      const existente = prev.find(item => item.id === producto.id);
      if (existente) {
        if (existente.cantidad >= stock) {
          mostrarMensaje(`No puedes agregar más de ${stock} unidades.`);
          return prev;
        }
        return prev.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, {
        id: producto.id,
        nombre: producto.nombre,
        imagen_url: producto.imagen_url || '',
        precio_lista: Number(producto.precio_lista) || 0,
        precioUnitario: Number(producto.precio_lista) || 0,
        cantidad: 1,
        stockDisponible: stock
      }];
    });
    setMostrarCarrito(true);
  };

  const cambiarCantidadCarrito = (id, delta) => {
    setCarrito(prev => prev.map(item => {
      if (item.id !== id) return item;
      const siguiente = item.cantidad + delta;
      if (siguiente < 1) return item;
      if (siguiente > item.stockDisponible) {
        mostrarMensaje(`Stock máximo disponible: ${item.stockDisponible}.`);
        return item;
      }
      return { ...item, cantidad: siguiente };
    }));
  };

  const cambiarPrecioCarrito = (id, valor) => {
    setCarrito(prev => prev.map(item => item.id === id ? { ...item, precioUnitario: valor } : item));
  };

  const quitarDelCarrito = (id) => {
    setCarrito(prev => prev.filter(item => item.id !== id));
  };

  const vaciarCarrito = () => {
    setCarrito([]);
    setClienteSeleccionadoVenta('');
    setDireccion('');
    setTipoEntrega('tienda');
    setMostrarCarrito(false);
  };

  const subtotalCarrito = useMemo(() => carrito.reduce(
    (total, item) => total + (Number(item.precioUnitario) || 0) * item.cantidad,
    0
  ), [carrito]);

  const unidadesCarrito = useMemo(() => carrito.reduce(
    (total, item) => total + item.cantidad, 0
  ), [carrito]);

  const realizarVenta = async () => {
    if (!usuarioLogueado || procesandoVenta || carrito.length === 0) return;

    if (tipoEntrega === 'delivery' && !direccion.trim()) {
      mostrarMensaje('Especifica una dirección para el envío por delivery.');
      return;
    }

    const items = carrito.map(item => ({
      ...item,
      precioUnitario: Number(item.precioUnitario)
    }));

    const precioInvalido = items.find(item => !Number.isFinite(item.precioUnitario) || item.precioUnitario <= 0);
    if (precioInvalido) {
      mostrarMensaje(`Revisa el precio de ${precioInvalido.nombre}.`);
      return;
    }

    setProcesandoVenta(true);
    setErrorApp('');
    const actualizaciones = [];

    try {
      for (const item of items) {
        const productoActual = productos.find(p => p.id === item.id);
        const stockActual = Number(productoActual?.stock ?? item.stockDisponible);

        if (!Number.isInteger(stockActual) || stockActual < item.cantidad) {
          throw new Error(`Stock insuficiente para ${item.nombre}. Disponible: ${Math.max(0, stockActual)}.`);
        }

        const nuevoStock = stockActual - item.cantidad;
        const { data: stockActualizado, error: errStock } = await supabase
          .from('productos')
          .update({ stock: nuevoStock })
          .eq('id', item.id)
          .eq('stock', stockActual)
          .select('id, stock');

        if (errStock) throw new Error(`No se pudo actualizar ${item.nombre}: ${errStock.message}`);
        if (!stockActualizado || stockActualizado.length !== 1) {
          throw new Error(`El stock de ${item.nombre} cambió. Inténtalo de nuevo.`);
        }

        actualizaciones.push({ id: item.id, stockAnterior: stockActual, stockNuevo: nuevoStock });
      }

      const registrosVenta = [];
      items.forEach(item => {
        for (let i = 0; i < item.cantidad; i += 1) {
          registrosVenta.push({
            nombre_producto: item.nombre,
            precio_venta: item.precioUnitario,
            fecha_venta: new Date().toISOString(),
            vendedor_nombre: usuarioLogueado.nombre,
            cliente_nombre: clienteSeleccionadoVenta || 'Consumidor Final',
            tipo_entrega: tipoEntrega,
            direccion_envio: tipoEntrega === 'delivery' ? direccion : 'Retiro en Tienda',
            latitud: tipoEntrega === 'delivery' ? coordenadas.lat : null,
            longitud: tipoEntrega === 'delivery' ? coordenadas.lng : null
          });
        }
      });

      const { error: errVenta } = await supabase.from('ventas').insert(registrosVenta);
      if (errVenta) throw new Error(`No se registró la venta: ${errVenta.message}`);

      vaciarCarrito();
      await Promise.all([fetchProductos(), pestana === 'caja' ? fetchVentas() : Promise.resolve()]);
      mostrarMensaje(`Venta confirmada: ${unidadesCarrito} unidad(es) por S/. ${subtotalCarrito.toFixed(2)}.`);
    } catch (error) {
      for (const cambio of actualizaciones.reverse()) {
        await supabase
          .from('productos')
          .update({ stock: cambio.stockAnterior })
          .eq('id', cambio.id)
          .eq('stock', cambio.stockNuevo);
      }
      setErrorApp(error.message || 'No se pudo completar la venta.');
      await fetchProductos();
    } finally {
      setProcesandoVenta(false);
    }
  };

  // --- REPORTES Y CÓMPUTO ---
  const formatearFechaCabecera = (fechaString) => {
    const fechaVenta = new Date(fechaString);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    if (fechaVenta.toDateString() === hoy.toDateString()) return 'Hoy';
    if (fechaVenta.toDateString() === ayer.toDateString()) return 'Ayer';
    return fechaVenta.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const listaVentasAgrupadas = useMemo(() => {
    const grupos = ventasDia.reduce((acumulador, venta) => {
      const fecha = new Date(venta.fecha_venta);
      if (Number.isNaN(fecha.getTime())) return acumulador;

      const fechaClave = fecha.toDateString();
      if (!acumulador[fechaClave]) {
        acumulador[fechaClave] = {
          fechaTexto: formatearFechaCabecera(venta.fecha_venta),
          totalDia: 0,
          transacciones: []
        };
      }

      acumulador[fechaClave].totalDia += Number(venta.precio_venta) || 0;
      acumulador[fechaClave].transacciones.push(venta);
      return acumulador;
    }, {});

    return Object.values(grupos);
  }, [ventasDia]);

  const ingresosDeHoy = useMemo(() => {
    const hoy = new Date().toDateString();
    return ventasDia
      .filter(v => new Date(v.fecha_venta).toDateString() === hoy)
      .reduce((acc, v) => acc + (Number(v.precio_venta) || 0), 0);
  }, [ventasDia]);

  const transaccionesDeHoy = useMemo(() => {
    const hoy = new Date().toDateString();
    return ventasDia.filter(v => new Date(v.fecha_venta).toDateString() === hoy).length;
  }, [ventasDia]);

  const entregasDeliveryHoy = useMemo(() => {
    const hoy = new Date().toDateString();
    return ventasDia.filter(v => new Date(v.fecha_venta).toDateString() === hoy && v.tipo_entrega === 'delivery').length;
  }, [ventasDia]);

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const resultado = productos.filter(p => {
      const coincideTexto = !texto || (p.nombre || '').toLowerCase().includes(texto);
      const stock = Number(p.stock) || 0;
      const coincideStock = filtroStock === 'todos'
        || (filtroStock === 'agotado' && stock === 0)
        || (filtroStock === 'bajo' && stock > 0 && stock <= 5)
        || (filtroStock === 'disponible' && stock > 5);
      return coincideTexto && coincideStock;
    });

    return resultado.sort((a, b) => {
      if (ordenProductos === 'precioAsc') return Number(a.precio_lista || 0) - Number(b.precio_lista || 0);
      if (ordenProductos === 'precioDesc') return Number(b.precio_lista || 0) - Number(a.precio_lista || 0);
      if (ordenProductos === 'stockAsc') return Number(a.stock || 0) - Number(b.stock || 0);
      return (a.nombre || '').localeCompare(b.nombre || '');
    });
  }, [productos, busqueda, filtroStock, ordenProductos]);

  const productosBajoStock = useMemo(() => productos.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 5), [productos]);
  const productosAgotados = useMemo(() => productos.filter(p => Number(p.stock) <= 0), [productos]);

  const actualizarTodo = async () => {
    setCargando(true);
    setErrorApp('');
    try {
      const tareas = [fetchProductos()];
      if (pestana === 'caja') tareas.push(fetchVentas());
      if (pestana === 'personal' && usuarioLogueado?.rol === 'admin') tareas.push(fetchUsuarios());
      if (pestana === 'clientes') tareas.push(fetchClientes());
      await Promise.all(tareas);
      mostrarMensaje('Información actualizada.');
    } finally {
      setCargando(false);
    }
  };

  if (!usuarioLogueado) {
    return <Login supabase={supabase} onLoginSuccess={setUsuarioLogueado} />;
  }

  const esAdmin = usuarioLogueado.rol === 'admin';

  const MenuLink = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => { setPestana(id); setMenuAbierto(false); }}
      className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-bold ${
        pestana === id ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      
      {/* CAPA OVERLAY PARA MENÚ MÓVIL */}
      {menuAbierto && (
        <div 
          onClick={() => setMenuAbierto(false)} 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 
        ${menuAbierto ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex flex-col h-full">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-blue-600 tracking-tighter italic">HOGAR.SYS</h1>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5">
                {usuarioLogueado.nombre} ({esAdmin ? 'Administrador' : 'Vendedor'})
              </p>
            </div>
            <button className="md:hidden p-2 text-slate-400 hover:text-slate-600" onClick={() => setMenuAbierto(false)}>
              <X size={24} />
            </button>
          </div>

          <nav className="space-y-1.5 flex-1">
            <MenuLink id="vender" icon={ShoppingBag} label="Tienda" />
            {esAdmin && <MenuLink id="agregar" icon={PlusCircle} label="Nuevo Producto" />}
            {esAdmin && <MenuLink id="personal" icon={Users} label="Personal / Vendedores" />}
            <MenuLink id="caja" icon={BarChart3} label={esAdmin ? "Caja y Reportes" : "Mis Ventas de Hoy"} />
            <MenuLink id="clientes" icon={Contact} label="Clientes" />
          </nav>

          <div className="pt-4 border-t">
            <button 
              onClick={() => { setUsuarioLogueado(null); localStorage.removeItem('usuario_hogarsys'); }}
              className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-red-500 hover:bg-red-50"
            >
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="md:hidden px-4 py-3 bg-white border-b flex justify-between items-center shrink-0">
          <div>
            <h1 className="font-black text-blue-600 text-lg leading-none">HOGAR.SYS</h1>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{usuarioLogueado.nombre}</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setMostrarCarrito(true)}
              className="p-2 bg-blue-50 text-blue-600 rounded-xl relative"
            >
              <ShoppingCart size={20} />
              {unidadesCarrito > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {unidadesCarrito}
                </span>
              )}
            </button>
            <button onClick={() => setMenuAbierto(true)} className="p-2 bg-slate-100 rounded-xl text-slate-700">
              <Menu size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-10">
          <div className="max-w-6xl mx-auto pb-16 md:pb-0">
            
            <div className="mb-4 sm:mb-8">
              <h2 className="text-2xl sm:text-4xl font-black text-slate-800 capitalize">
                {pestana === 'personal' ? 'Gestión de Personal' : (pestana === 'caja' && !esAdmin ? 'Mis Ventas de Hoy' : pestana)}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                {esAdmin ? 'Panel integral de administración' : 'Punto de facturación autorizado'}
              </p>
            </div>

            {errorApp && (
              <div className="mb-4 sm:mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{errorApp}</span>
              </div>
            )}

            {/* VISTA: VENDER */}
            {pestana === 'vender' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-[2rem] border shadow-sm space-y-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      className="w-full py-3 pl-11 pr-4 rounded-xl sm:rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                      placeholder="Buscar producto por nombre..."
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border sm:border-none">
                      <SlidersHorizontal size={14} className="text-slate-400 shrink-0" />
                      <select 
                        value={filtroStock} 
                        onChange={e => setFiltroStock(e.target.value)}
                        className="bg-transparent border-none outline-none w-full text-xs font-bold text-slate-600"
                      >
                        <option value="todos">Todos los stocks</option>
                        <option value="disponible">En Stock (&gt;5)</option>
                        <option value="bajo">Stock Bajo (1-5)</option>
                        <option value="agotado">Agotados (0)</option>
                      </select>
                    </div>
                    <select 
                      value={ordenProductos} 
                      onChange={e => setOrdenProductos(e.target.value)}
                      className="bg-slate-50 border sm:border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none"
                    >
                      <option value="nombre">Ordenar por Nombre</option>
                      <option value="precioAsc">Precio: Menor a Mayor</option>
                      <option value="precioDesc">Precio: Mayor a Menor</option>
                      <option value="stockAsc">Menor Stock Disponible</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border"><p className="text-[9px] sm:text-[10px] uppercase font-black text-slate-400">Productos</p><p className="text-xl sm:text-2xl font-black">{productos.length}</p></div>
                  <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border"><p className="text-[9px] sm:text-[10px] uppercase font-black text-amber-500">Stock bajo</p><p className="text-xl sm:text-2xl font-black text-amber-600">{productosBajoStock.length}</p></div>
                  <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border"><p className="text-[9px] sm:text-[10px] uppercase font-black text-red-500">Agotados</p><p className="text-xl sm:text-2xl font-black text-red-600">{productosAgotados.length}</p></div>
                  <button type="button" onClick={() => setMostrarCarrito(true)} className="bg-blue-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white text-left shadow-lg hover:bg-blue-700 flex flex-col justify-between">
                    <p className="text-[9px] sm:text-[10px] uppercase font-black text-blue-100">Carrito</p>
                    <p className="text-xl sm:text-2xl font-black flex items-center gap-1.5"><ShoppingCart size={18}/>{unidadesCarrito}</p>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                  {productosFiltrados.map(p => {
                    const stock = Number(p.stock) || 0;
                    return (
                      <div key={p.id} className="bg-white rounded-2xl sm:rounded-[2rem] border p-4 sm:p-5 flex flex-col justify-between">
                        <div>
                          <div className="h-28 sm:h-36 bg-slate-100 rounded-xl sm:rounded-2xl overflow-hidden mb-3 relative">
                            {p.imagen_url ? <img src={p.imagen_url} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={28}/></div>}
                            <span className={`absolute top-2 right-2 sm:top-3 sm:right-3 text-[10px] font-black px-2 py-0.5 rounded-lg ${stock <= 0 ? 'bg-red-500 text-white' : stock <= 5 ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white'}`}>
                              Stock: {stock}
                            </span>
                          </div>
                          <h3 className="font-black text-slate-800 text-sm sm:text-base leading-snug">{p.nombre}</h3>
                          <p className="text-xl sm:text-2xl font-black text-blue-600 mt-1 sm:mt-2">S/. {Number(p.precio_lista).toFixed(2)}</p>
                        </div>
                        <div className="mt-3 sm:mt-4 space-y-2">
                          <button onClick={() => agregarAlCarrito(p)} disabled={stock <= 0} className="w-full py-2.5 sm:py-3 rounded-xl bg-slate-900 text-white font-black text-xs active:scale-95 transition-transform disabled:bg-slate-200">
                            {stock <= 0 ? 'AGOTADO' : 'AGREGAR AL CARRITO'}
                          </button>
                          {esAdmin && (
                            <div className="flex gap-2">
                              <button onClick={() => seleccionarEditarProducto(p)} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center justify-center gap-1"><Pencil size={13}/> Editar</button>
                              <button onClick={() => eliminarProducto(p.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={13}/></button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VISTA: AGREGAR / EDITAR PRODUCTO */}
            {pestana === 'agregar' && esAdmin && (
              <div className="bg-white p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] border shadow-sm max-w-2xl mx-auto">
                <h3 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6">{productoAEditar ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                <form onSubmit={guardarProducto} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-[10px] sm:text-xs font-black uppercase text-slate-400 block mb-1">Nombre del Producto</label>
                    <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full p-3.5 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base font-bold" placeholder="Ej. Smart TV 55 pulgadas" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-[10px] sm:text-xs font-black uppercase text-slate-400 block mb-1">Stock Inicial</label>
                      <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full p-3.5 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base font-bold" placeholder="0" min="0" required />
                    </div>
                    <div>
                      <label className="text-[10px] sm:text-xs font-black uppercase text-slate-400 block mb-1">Precio Unitario (S/.)</label>
                      <input type="number" step="0.01" value={form.precio_lista} onChange={e => setForm({...form, precio_lista: e.target.value})} className="w-full p-3.5 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base font-bold" placeholder="0.00" min="0" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] sm:text-xs font-black uppercase text-slate-400 block mb-1">URL de la Imagen</label>
                    <input type="url" value={form.imagen_url} onChange={e => setForm({...form, imagen_url: e.target.value})} className="w-full p-3.5 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base font-bold" placeholder="https://ejemplo.com/imagen.jpg" />
                  </div>
                  <div className="flex gap-2 sm:gap-3 pt-3">
                    {productoAEditar && (
                      <button type="button" onClick={() => { setProductoAEditar(null); setForm({ nombre: '', stock: '', precio_lista: '', imagen_url: '' }); setPestana('vender'); }} className="w-1/2 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-slate-100 font-black text-slate-500 text-xs sm:text-base">Cancelar</button>
                    )}
                    <button type="submit" disabled={cargando} className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-blue-600 text-white font-black shadow-lg shadow-blue-200 text-xs sm:text-base">
                      {cargando ? 'Guardando...' : (productoAEditar ? 'Actualizar Producto' : 'Guardar Producto')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* VISTA: PERSONAL */}
            {pestana === 'personal' && esAdmin && (
              <div className="grid md:grid-cols-3 gap-5 md:gap-8">
                <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border shadow-sm h-fit">
                  <h3 className="text-lg sm:text-xl font-black mb-3 sm:mb-4">{vendedorAEditar ? 'Editar Usuario' : 'Registrar Vendedor'}</h3>
                  <form onSubmit={guardarUsuario} className="space-y-3">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400">Nombre Completo</label>
                      <input type="text" value={vendedorForm.nombre} onChange={e => setVendedorForm({...vendedorForm, nombre: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold" required />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400">Usuario de Acceso</label>
                      <input type="text" value={vendedorForm.usuario} onChange={e => setVendedorForm({...vendedorForm, usuario: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold" required />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400">Contraseña</label>
                      <input type="text" value={vendedorForm.contrasena} onChange={e => setVendedorForm({...vendedorForm, contrasena: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold" required />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400">Rol</label>
                      <select value={vendedorForm.rol} onChange={e => setVendedorForm({...vendedorForm, rol: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold">
                        <option value="empleado">Vendedor (Empleado)</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full py-3 bg-blue-600 text-white font-black rounded-xl text-xs sm:text-sm shadow-md">
                      {vendedorAEditar ? 'Actualizar' : 'Guardar'}
                    </button>
                    {vendedorAEditar && (
                      <button type="button" onClick={() => { setVendedorAEditar(null); setVendedorForm({ usuario: '', contrasena: '', nombre: '', rol: 'empleado' }); }} className="w-full py-2 bg-slate-100 text-slate-500 font-bold rounded-xl text-xs">Cancelar</button>
                    )}
                  </form>
                </div>

                <div className="md:col-span-2 space-y-2.5 sm:space-y-3">
                  {usuariosLista.map(u => (
                    <div key={u.id} className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border flex items-center justify-between">
                      <div>
                        <p className="font-black text-slate-800 text-sm sm:text-base">{u.nombre}</p>
                        <p className="text-[11px] sm:text-xs text-slate-400 font-bold">User: {u.usuario} | Rol: <span className="uppercase text-blue-600">{u.rol}</span></p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => seleccionarEditarUsuario(u)} className="p-2 bg-slate-100 text-slate-600 rounded-lg"><Pencil size={16}/></button>
                        <button onClick={() => eliminarUsuario(u.id)} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VISTA: CLIENTES */}
            {pestana === 'clientes' && (
              <div className="grid md:grid-cols-3 gap-5 md:gap-8">
                <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border shadow-sm h-fit">
                  <h3 className="text-lg sm:text-xl font-black mb-3 sm:mb-4">{clienteAEditar ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                  <form onSubmit={guardarCliente} className="space-y-3">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400">Nombre / Razón Social</label>
                      <input type="text" value={clienteForm.nombre} onChange={e => setClienteForm({...clienteForm, nombre: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold" required />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400">DNI / RUC</label>
                      <input type="text" value={clienteForm.documento} onChange={e => setClienteForm({...clienteForm, documento: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400">Teléfono</label>
                      <input type="text" value={clienteForm.telefono} onChange={e => setClienteForm({...clienteForm, telefono: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400">Correo Electrónico</label>
                      <input type="email" value={clienteForm.correo} onChange={e => setClienteForm({...clienteForm, correo: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold" />
                    </div>
                    <button type="submit" className="w-full py-3 bg-blue-600 text-white font-black rounded-xl text-xs sm:text-sm shadow-md">
                      {clienteAEditar ? 'Actualizar' : 'Guardar Cliente'}
                    </button>
                    {clienteAEditar && (
                      <button type="button" onClick={() => { setClienteAEditar(null); setClienteForm({ id: null, nombre: '', documento: '', telefono: '', correo: '' }); }} className="w-full py-2 bg-slate-100 text-slate-500 font-bold rounded-xl text-xs">Cancelar</button>
                    )}
                  </form>
                </div>

                <div className="md:col-span-2 space-y-2.5 sm:space-y-3">
                  {clientesLista.map(c => (
                    <div key={c.id} className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border flex items-center justify-between">
                      <div>
                        <p className="font-black text-slate-800 text-sm sm:text-base">{c.nombre}</p>
                        <p className="text-[11px] sm:text-xs text-slate-400 font-bold">Doc: {c.documento || 'S/N'} | Tel: {c.telefono || 'S/N'}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => seleccionarEditarCliente(c)} className="p-2 bg-slate-100 text-slate-600 rounded-lg"><Pencil size={16}/></button>
                        <button onClick={() => eliminarCliente(c.id)} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VISTA: CAJA Y REPORTES */}
            {pestana === 'caja' && (
              <div className="space-y-5 sm:space-y-8">
                <div className="flex flex-row items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm text-slate-400 font-bold">Resumen operativo</p>
                    <p className="font-black text-slate-700 text-sm sm:text-base">{esAdmin ? 'Todas las ventas registradas' : 'Tus ventas del día'}</p>
                  </div>
                  <button type="button" onClick={actualizarTodo} disabled={cargando} className="px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-white border shadow-sm font-black text-xs sm:text-sm flex items-center gap-1.5">
                    <RefreshCw size={15} className={cargando ? 'animate-spin' : ''}/> Actualizar
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                  <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border shadow-sm">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400">Ingresos hoy</p>
                    <p className="text-xl sm:text-3xl font-black mt-1 sm:mt-2">S/. {ingresosDeHoy.toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border shadow-sm">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400">Ventas totales</p>
                    <p className="text-xl sm:text-3xl font-black text-blue-600 mt-1 sm:mt-2">{transaccionesDeHoy}</p>
                  </div>
                  <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border shadow-sm">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase text-purple-500">Deliveries Hoy</p>
                    <p className="text-xl sm:text-3xl font-black text-purple-600 mt-1 sm:mt-2">{entregasDeliveryHoy}</p>
                  </div>
                  <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border shadow-sm">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase text-amber-500">Stock Bajo</p>
                    <p className="text-xl sm:text-3xl font-black text-amber-600 mt-1 sm:mt-2">{productosBajoStock.length}</p>
                  </div>
                </div>

                {/* TABLA / TARJETAS DE VENTAS Y DIRECCIONES */}
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-lg sm:text-xl font-black text-slate-700 flex items-center gap-2">
                    <ReceiptText size={20} className="text-blue-600" /> {esAdmin ? 'Historial de Ventas' : 'Mis Ventas del Turno'}
                  </h3>

                  {listaVentasAgrupadas.length === 0 ? (
                    <div className="bg-white p-8 sm:p-10 rounded-2xl sm:rounded-[2.5rem] border text-center text-xs sm:text-sm text-slate-400">
                      No hay registros de ventas.
                    </div>
                  ) : (
                    listaVentasAgrupadas.map((grupo, index) => (
                      <div key={index} className="bg-white rounded-2xl sm:rounded-[2.5rem] border overflow-hidden shadow-sm">
                        <div className="p-4 sm:p-5 bg-slate-50 border-b flex justify-between items-center">
                          <span className="font-black text-slate-700 text-sm sm:text-lg">{grupo.fechaTexto}</span>
                          <span className="bg-green-100 text-green-700 px-3 py-1 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm">
                            Total: S/. {grupo.totalDia.toFixed(2)}
                          </span>
                        </div>

                        {/* VISTA MÓVIL: CARDS */}
                        <div className="block md:hidden divide-y divide-slate-100">
                          {grupo.transacciones.map((v, i) => (
                            <div key={v.id || i} className="p-4 space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <p className="font-black text-slate-800 text-sm">{v.nombre_producto}</p>
                                  <p className="text-xs text-slate-500 font-medium">{v.cliente_nombre || 'Consumidor Final'}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-black text-green-600 text-sm">S/. {Number(v.precio_venta || 0).toFixed(2)}</p>
                                  <p className="text-[10px] text-slate-400">{new Date(v.fecha_venta).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50">
                                <div>
                                  {v.tipo_entrega === 'delivery' ? (
                                    <div className="flex flex-col gap-1">
                                      <span className="inline-flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md text-[10px] font-black w-fit">
                                        <Truck size={12} /> DELIVERY
                                      </span>
                                      <span className="text-slate-600 text-[11px] truncate max-w-[200px]">{v.direccion_envio || v.direccion || 'Sin dirección'}</span>
                                      {v.latitud && v.longitud && (
                                        <a 
                                          href={`https://maps.google.com/?q=${v.latitud},${v.longitud}`} 
                                          target="_blank" 
                                          rel="noreferrer"
                                          className="text-blue-600 hover:underline inline-flex items-center gap-1 text-[10px]"
                                        >
                                          Ver ubicación <ExternalLink size={10} />
                                        </a>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">
                                      <Store size={12} /> TIENDA
                                    </span>
                                  )}
                                </div>
                                {esAdmin && <span className="text-[10px] text-slate-400 font-bold">Vendedor: {v.vendedor_nombre}</span>}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* VISTA DESKTOP: TABLA */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left min-w-[700px]">
                            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase border-b">
                              <tr>
                                <th className="px-6 py-4">Producto</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Modalidad / Dirección</th>
                                {esAdmin && <th className="px-6 py-4">Vendedor</th>}
                                <th className="px-6 py-4">Hora</th>
                                <th className="px-6 py-4 text-right">Monto</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {grupo.transacciones.map((v, i) => (
                                <tr key={v.id || i} className="hover:bg-blue-50/30">
                                  <td className="px-6 py-4 font-bold text-slate-700">{v.nombre_producto}</td>
                                  <td className="px-6 py-4 text-slate-600 text-xs font-medium">{v.cliente_nombre || 'Consumidor Final'}</td>
                                  
                                  <td className="px-6 py-4 text-xs font-bold">
                                    {v.tipo_entrega === 'delivery' ? (
                                      <div className="flex flex-col gap-1">
                                        <span className="inline-flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md w-fit text-[10px] font-black">
                                          <Truck size={12} /> DELIVERY
                                        </span>
                                        <span className="text-slate-600 text-[11px] truncate max-w-xs">{v.direccion_envio || v.direccion || 'Dirección no registrada'}</span>
                                        {v.latitud && v.longitud && (
                                          <a 
                                            href={`https://maps.google.com/?q=${v.latitud},${v.longitud}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-blue-600 hover:underline inline-flex items-center gap-1 text-[10px]"
                                          >
                                            Ver ubicación <ExternalLink size={10} />
                                          </a>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-1 rounded-md text-[10px]">
                                        <Store size={12} /> TIENDA
                                      </span>
                                    )}
                                  </td>

                                  {esAdmin && <td className="px-6 py-4 text-slate-500 text-xs">{v.vendedor_nombre}</td>}
                                  <td className="px-6 py-4 text-slate-400 text-sm">{new Date(v.fecha_venta).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                  <td className="px-6 py-4 text-right font-black text-green-600">S/. {Number(v.precio_venta || 0).toFixed(2)}</td>
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

      {/* MODAL CARRITO & CHECKOUT */}
      {mostrarCarrito && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] sm:max-h-[92vh] overflow-hidden rounded-t-[1.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col">
            
            {/* ENCABEZADO DEL MODAL */}
            <div className="p-4 sm:p-6 border-b flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="text-lg sm:text-2xl font-black text-slate-800">Carrito de Venta</h3>
                <p className="text-xs sm:text-sm text-slate-400 font-bold">{unidadesCarrito} unidad(es) · Total S/. {subtotalCarrito.toFixed(2)}</p>
              </div>
              <button type="button" onClick={() => setMostrarCarrito(false)} className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"><X size={20}/></button>
            </div>
            
            {/* CUERPO DEL MODAL (CON SCROLL) */}
            <div className="p-3 sm:p-6 overflow-y-auto space-y-3 flex-1">
              {carrito.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm font-bold">El carrito está vacío</div>
              ) : (
                carrito.map(item => (
                  <div key={item.id} className="border rounded-xl sm:rounded-2xl p-3 sm:p-4 flex gap-2 sm:gap-3 items-center">
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-700 text-xs sm:text-base truncate">{item.nombre}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <button type="button" onClick={() => cambiarCantidadCarrito(item.id, -1)} className="p-1.5 rounded-lg bg-slate-100"><Minus size={14}/></button>
                        <span className="w-6 text-center font-black text-xs sm:text-sm">{item.cantidad}</span>
                        <button type="button" onClick={() => cambiarCantidadCarrito(item.id, 1)} className="p-1.5 rounded-lg bg-slate-100"><Plus size={14}/></button>
                      </div>
                    </div>
                    <div className="w-20 sm:w-24">
                      <label className="text-[8px] sm:text-[9px] uppercase font-black text-slate-400 block">P. Unitario</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={item.precioUnitario} 
                        onChange={e => cambiarPrecioCarrito(item.id, e.target.value)}
                        className="w-full p-1.5 sm:p-2 bg-slate-50 rounded-lg text-xs font-black border text-right outline-none" 
                      />
                    </div>
                    <div className="text-right">
                      <p className="font-black text-blue-600 text-xs sm:text-base">S/. {(Number(item.precioUnitario) * item.cantidad).toFixed(2)}</p>
                    </div>
                    <button type="button" onClick={() => quitarDelCarrito(item.id)} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                  </div>
                ))
              )}

              {/* OPCIONES DE MODALIDAD Y DIRECCIÓN */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-slate-400">Modalidad de Venta</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoEntrega('tienda')}
                      className={`p-2.5 sm:p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                        tipoEntrega === 'tienda' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      <Store size={15} /> Retiro en Tienda
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoEntrega('delivery')}
                      className={`p-2.5 sm:p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                        tipoEntrega === 'delivery' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      <Truck size={15} /> Envío Delivery
                    </button>
                  </div>
                </div>

                {tipoEntrega === 'delivery' && (
                  <div className="space-y-2 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                    <label className="text-[10px] uppercase font-black text-purple-700 flex items-center gap-1">
                      <MapPin size={12} /> Dirección de Entrega
                    </label>
                    
                    <input 
                      ref={inputRef} 
                      type="text" 
                      value={direccion}
                      onChange={e => setDireccion(e.target.value)}
                      placeholder="Ingresa la dirección..." 
                      className="w-full p-2.5 bg-white rounded-lg border border-slate-200 text-xs font-bold text-slate-700 shadow-sm"
                    />

                    <div ref={mapRef} className="w-full h-28 sm:h-36 rounded-xl border border-slate-200 bg-slate-200 overflow-hidden" />
                  </div>
                )}

                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Cliente Registrado</label>
                  <select 
                    value={clienteSeleccionadoVenta} 
                    onChange={e => setClienteSeleccionadoVenta(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 outline-none"
                  >
                    <option value="">Consumidor Final</option>
                    {clientesLista.map(c => (
                      <option key={c.id} value={c.nombre}>{c.nombre} {c.documento ? `- ${c.documento}` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* PIE DE PÁGINA / CONFIRMACIÓN */}
            <div className="p-4 sm:p-6 border-t bg-slate-50 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] uppercase font-black text-slate-400">Total a pagar</p>
                  <p className="text-2xl sm:text-3xl font-black text-blue-600">S/. {subtotalCarrito.toFixed(2)}</p>
                </div>
                <button 
                  type="button" 
                  onClick={realizarVenta} 
                  disabled={procesandoVenta || carrito.length === 0} 
                  className="px-5 py-3 sm:px-8 sm:py-4 rounded-xl bg-blue-600 text-white font-black text-xs sm:text-base shadow-lg disabled:bg-slate-300"
                >
                  {procesandoVenta ? 'PROCESANDO...' : 'CONFIRMAR VENTA'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MENSAJE ALERTA FLOTANTE */}
      {mensajeApp && (
        <div className="fixed left-4 right-4 bottom-4 sm:left-auto sm:right-4 sm:bottom-4 z-[120] bg-slate-900 text-white px-4 py-3 sm:px-5 sm:py-4 rounded-2xl shadow-2xl flex items-center gap-3">
          <CheckCircle size={18} className="text-green-400 shrink-0"/><span className="text-xs sm:text-sm font-bold">{mensajeApp}</span>
        </div>
      )}
    </div>
  );
}

export default App;