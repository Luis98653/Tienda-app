  import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    Calendar, 
    Trash2, 
    LogOut, 
    ShieldAlert, 
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
  } from 'lucide-react';
  import Login from './Login';

  
  // FORZAR_BUILD_NUEVO_1
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
    
    const [form, setForm] = useState({ nombre: '', stock: '', precio_lista: '', imagen_url: '' });
    const [productoAEditar, setProductoAEditar] = useState(null);

    // --- ESTADOS DE GESTIÓN DE PERSONAL (NUEVO) ---
    const [usuariosLista, setUsuariosLista] = useState([]);
    const [vendedorForm, setVendedorForm] = useState({ usuario: '', contrasena: '', nombre: '', rol: 'empleado' });
    const [vendedorAEditar, setVendedorAEditar] = useState(null);
    
    // --- ESTADOS DE GESTIÓN DE CLIENTES ---
const [clientesLista, setClientesLista] = useState([]);
const [clienteForm, setClienteForm] = useState({ id: null, nombre: '', documento: '', telefono: '', correo: '' });
const [clienteSeleccionadoVenta, setClienteSeleccionadoVenta] = useState('');

    // --- ESTADOS DE OPERACIÓN / CALIDAD ---
    const [cargando, setCargando] = useState(false);
    const [procesandoVenta, setProcesandoVenta] = useState(false);
    const [errorApp, setErrorApp] = useState('');
    const [mensajeApp, setMensajeApp] = useState('');

    const mostrarMensaje = useCallback((texto) => {
      setMensajeApp(texto);
      window.setTimeout(() => setMensajeApp(''), 3200);
    }, []);

    const fetchClientes = useCallback(async () => {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error cargando clientes:', error);
    mostrarMensaje('No se pudo cargar la lista de clientes.');
    return false;
  }
  setClientesLista(data || []);
  return true;
}, [mostrarMensaje]);
    

    useEffect(() => {
  try {
    const usuarioGuardado = localStorage.getItem('usuario_hogarsys');
    if (usuarioGuardado) {
      const usuario = JSON.parse(usuarioGuardado);
      if (usuario && usuario.id && usuario.usuario && usuario.rol) {
        setUsuarioLogueado(usuario);
        
        // --- CARGAR DATOS AL REFRESCAR ---
        fetchClientes();
        // Si tienes otras funciones de carga, agrégalas aquí también:
        // fetchProductos();
        // fetchVentas();

      } else {
        localStorage.removeItem('usuario_hogarsys');
      }
    }
  } catch (error) {
    console.error('Sesión local inválida:', error);
    localStorage.removeItem('usuario_hogarsys');
  }
}, [fetchClientes]); // Agregamos fetchClientes a las dependencias

    
    const fetchProductos = useCallback(async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error cargando productos:', error);
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
        console.error('Error cargando usuarios:', error);
        setErrorApp('No se pudo cargar el personal.');
        return false;
      }

      setUsuariosLista(data || []);
      return true;
    }, []);

    

const guardarCliente = async (e) => {
  e.preventDefault();
  const nombre = clienteForm.nombre.trim();
  
  if (!nombre) {
    mostrarMensaje('El nombre del cliente es obligatorio.');
    return;
  }

  setCargando(true);
  try {
    const datosGuardar = {
      nombre,
      documento: clienteForm.documento.trim(),
      telefono: clienteForm.telefono.trim(),
      correo: clienteForm.correo.trim()
    };

    if (clienteForm.id) {
      // MODO EDICIÓN
      const { error } = await supabase
        .from('clientes')
        .update(datosGuardar)
        .eq('id', clienteForm.id);

      if (error) throw error;
      mostrarMensaje('Cliente actualizado con éxito.');
    } else {
      // MODO CREACIÓN
      const { error } = await supabase.from('clientes').insert([datosGuardar]);
      if (error) throw error;
      mostrarMensaje('Cliente registrado con éxito.');
    }

    // Limpiar formulario y recargar
    setClienteForm({ id: null, nombre: '', documento: '', telefono: '', correo: '' });
    await fetchClientes();
  } catch (error) {
    console.error('Error guardando cliente:', error);
    mostrarMensaje(`Error: ${error.message}`);
  } finally {
    setCargando(false);
  }
};

const eliminarCliente = async (id) => {
  const confirmar = window.confirm('¿Estás seguro de que deseas eliminar este cliente?');
  if (!confirmar) return;

  setCargando(true);
  try {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    mostrarMensaje('Cliente eliminado con éxito.');
    
    // Si estabas editando al cliente eliminado, limpia el formulario
    if (clienteForm.id === id) {
      cancelarEdicion();
    }

    await fetchClientes();
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    mostrarMensaje(`Error al eliminar: ${error.message}`);
  } finally {
    setCargando(false);
  }
};

// Nueva función para cargar los datos en el formulario cuando se hace clic en "Editar"
const editarCliente = (cliente) => {
  setClienteForm({
    id: cliente.id,
    nombre: cliente.nombre,
    documento: cliente.documento || '',
    telefono: cliente.telefono || '',
    correo: cliente.correo || ''
  });
};

const cancelarEdicion = () => {
  setClienteForm({ id: null, nombre: '', documento: '', telefono: '', correo: '' });
};

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
        console.error('Error cargando ventas:', error);
        setErrorApp('No se pudo cargar el historial de ventas.');
        return false;
      }

      setVentasDia(data || []);
      return true;
    }, [usuarioLogueado]);

    useEffect(() => {
      if (!usuarioLogueado) return;

      let activo = true;

      const cargarDatos = async () => {
        setCargando(true);
        setErrorApp('');

        try {
          await fetchProductos();

          if (pestana === 'caja') {
            await fetchVentas();
          }

          if (pestana === 'personal' && usuarioLogueado.rol === 'admin') {
            await fetchUsuarios();
          }
        } finally {
          if (activo) setCargando(false);
        }
      };

      cargarDatos();

      return () => {
        activo = false;
      };
    }, [pestana, usuarioLogueado, fetchProductos, fetchVentas, fetchUsuarios]);

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
            mostrarMensaje(`No puedes agregar más de ${stock} unidad${stock === 1 ? '' : 'es'}.`);
            return prev;
          }
          return prev.map(item => item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
          );
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
      setCarrito(prev => prev.map(item => item.id === id
        ? { ...item, precioUnitario: valor }
        : item
      ));
    };

    const quitarDelCarrito = (id) => {
      setCarrito(prev => prev.filter(item => item.id !== id));
    };

    const vaciarCarrito = () => {
      setCarrito([]);
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

      const items = carrito.map(item => ({
        ...item,
        precioUnitario: Number(item.precioUnitario)
      }));

      const precioInvalido = items.find(item => !Number.isFinite(item.precioUnitario) || item.precioUnitario <= 0);
      if (precioInvalido) {
        mostrarMensaje(`Revisa el precio de ${precioInvalido.nombre}. Debe ser mayor que 0.`);
        return;
      }

      setProcesandoVenta(true);
      setErrorApp('');
      const actualizaciones = [];

      try {
        // Se valida y descuenta cada línea con control optimista de stock.
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
            throw new Error(`El stock de ${item.nombre} cambió. Actualiza la información e inténtalo de nuevo.`);
          }

          actualizaciones.push({ id: item.id, stockAnterior: stockActual, stockNuevo: nuevoStock });
        }

        // Conservamos el esquema actual: una fila en ventas por unidad vendida.
        const registrosVenta = [];
        items.forEach(item => {
          for (let i = 0; i < item.cantidad; i += 1) {
            registrosVenta.push({
              nombre_producto: item.nombre,
              precio_venta: item.precioUnitario,
              fecha_venta: new Date().toISOString(),
              vendedor_nombre: usuarioLogueado.nombre
            });
          }
        });

        const { error: errVenta } = await supabase.from('ventas').insert(registrosVenta);
        if (errVenta) {
          throw new Error(`No se registró la venta: ${errVenta.message}`);
        }

        setCarrito([]);
        setMostrarCarrito(false);
        await Promise.all([fetchProductos(), pestana === 'caja' ? fetchVentas() : Promise.resolve()]);
        mostrarMensaje(`Venta confirmada: ${unidadesCarrito} unidad${unidadesCarrito === 1 ? '' : 'es'} por S/. ${subtotalCarrito.toFixed(2)}.`);
      } catch (error) {
        console.error('Error realizando venta:', error);
        // Compensación para evitar dejar stock descontado si falla el registro.
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

    // --- MÉTODOS DE CONTROL DE PRODUCTOS ---
    const agregarProducto = async (e) => {
      e.preventDefault();

      const nombre = form.nombre.trim();
      const stock = Number(form.stock);
      const precio = Number(form.precio_lista);
      const imagenUrl = form.imagen_url.trim();

      if (!nombre) {
        mostrarMensaje('El nombre del producto es obligatorio.');
        return;
      }

      if (!Number.isInteger(stock) || stock < 0) {
        mostrarMensaje('El stock debe ser un número entero igual o mayor que 0.');
        return;
      }

      if (!Number.isFinite(precio) || precio < 0) {
        mostrarMensaje('El precio debe ser un número válido igual o mayor que 0.');
        return;
      }

      setCargando(true);

      try {
        const { error } = await supabase
          .from('productos')
          .insert([{
            nombre,
            stock,
            precio_lista: precio,
            imagen_url: imagenUrl
          }]);

        if (error) throw error;

        setForm({ nombre: '', stock: '', precio_lista: '', imagen_url: '' });
        await fetchProductos();
        setPestana('vender');
        mostrarMensaje('Producto guardado correctamente.');
      } catch (error) {
        console.error('Error creando producto:', error);
        mostrarMensaje(`No se pudo guardar el producto: ${error.message}`);
      } finally {
        setCargando(false);
      }
    };


    const guardarEdicionProducto = async (e) => {
      e.preventDefault();
      if (!productoAEditar) return;

      const nombre = productoAEditar.nombre?.trim();
      const stock = Number(productoAEditar.stock);
      const precio = Number(productoAEditar.precio_lista);
      const imagenUrl = productoAEditar.imagen_url?.trim() || '';

      if (!nombre) {
        mostrarMensaje('El nombre del producto es obligatorio.');
        return;
      }

      if (!Number.isInteger(stock) || stock < 0) {
        mostrarMensaje('El stock debe ser un número entero igual o mayor que 0.');
        return;
      }

      if (!Number.isFinite(precio) || precio < 0) {
        mostrarMensaje('El precio debe ser un número válido igual o mayor que 0.');
        return;
      }

      setCargando(true);

      try {
        const { error } = await supabase
          .from('productos')
          .update({
            nombre,
            stock,
            precio_lista: precio,
            imagen_url: imagenUrl
          })
          .eq('id', productoAEditar.id);

        if (error) throw error;

        setProductoAEditar(null);
        await fetchProductos();
        mostrarMensaje('Producto actualizado.');
      } catch (error) {
        console.error('Error actualizando producto:', error);
        mostrarMensaje(`Error al actualizar producto: ${error.message}`);
      } finally {
        setCargando(false);
      }
    };

    const eliminarProducto = async (id, nombre) => {
      if (!id) return;

      if (window.confirm(`¿Seguro de eliminar "${nombre}"?`)) {
        const { error } = await supabase
          .from('productos')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error eliminando producto:', error);
          mostrarMensaje(`No se pudo eliminar el producto: ${error.message}`);
          return;
        }

        setProductoAEditar(null);
        setProductos(prev => prev.filter(p => p.id !== id));
        mostrarMensaje('Producto eliminado correctamente.');
      }
    };

    // --- MÉTODOS DE CONTROL DE PERSONAL ---
    const agregarVendedor = async (e) => {
      e.preventDefault();

      const usuario = vendedorForm.usuario.trim().toLowerCase();
      const nombre = vendedorForm.nombre.trim();
      const contrasena = vendedorForm.contrasena;

      if (!usuario || !nombre || !contrasena) {
        mostrarMensaje('Completa todos los campos del usuario.');
        return;
      }

      if (contrasena.length < 4) {
        mostrarMensaje('La contraseña debe tener al menos 4 caracteres.');
        return;
      }

      try {
        const { error } = await supabase.from('usuarios').insert([{
          usuario,
          contrasena,
          nombre,
          rol: vendedorForm.rol
        }]);

        if (error) throw error;

        mostrarMensaje('Usuario registrado con éxito.');
        setVendedorForm({ usuario: '', contrasena: '', nombre: '', rol: 'empleado' });
        await fetchUsuarios();
      } catch (error) {
        console.error('Error registrando vendedor:', error);
        mostrarMensaje(`Error al registrar vendedor: ${error.message}`);
      }
    };

    const guardarEdicionVendedor = async (e) => {
      e.preventDefault();
      if (!vendedorAEditar) return;

      const usuario = vendedorAEditar.usuario?.trim().toLowerCase();
      const nombre = vendedorAEditar.nombre?.trim();
      const contrasena = vendedorAEditar.contrasena;

      if (!usuario || !nombre || !contrasena) {
        mostrarMensaje('Completa todos los campos del usuario.');
        return;
      }

      try {
        const { error } = await supabase
          .from('usuarios')
          .update({
            usuario,
            contrasena,
            nombre,
            rol: vendedorAEditar.rol
          })
          .eq('id', vendedorAEditar.id);

        if (error) throw error;

        setVendedorAEditar(null);

        // Si el usuario se editó a sí mismo, sincronizamos la sesión local.
        if (vendedorAEditar.id === usuarioLogueado.id) {
          const sesionActualizada = {
            ...usuarioLogueado,
            usuario,
            nombre,
            rol: vendedorAEditar.rol
          };
          setUsuarioLogueado(sesionActualizada);
          localStorage.setItem('usuario_hogarsys', JSON.stringify(sesionActualizada));
        }

        await fetchUsuarios();
        mostrarMensaje('Datos de usuario actualizados correctamente.');
      } catch (error) {
        console.error('Error actualizando usuario:', error);
        mostrarMensaje(`Error al actualizar: ${error.message}`);
      }
    };

    const eliminarVendedor = async (id, nombre) => {
      if (!id || !usuarioLogueado) return;

      if (id === usuarioLogueado.id) {
        mostrarMensaje('No puedes eliminar tu propia cuenta activa de administrador.');
        return;
      }

      if (!window.confirm(`¿Estás seguro de que deseas eliminar al usuario "${nombre}" del sistema?`)) {
        return;
      }

      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error eliminando usuario:', error);
        mostrarMensaje(`No se pudo eliminar el usuario: ${error.message}`);
        return;
      }

      mostrarMensaje('Usuario eliminado.');
      await fetchUsuarios();
    };

    // --- MANEJO DE SESIÓN ---
    const manejarLoginExitoso = (datosUsuario) => {
      if (!datosUsuario?.id || !datosUsuario?.rol) {
        console.error('Datos de usuario inválidos:', datosUsuario);
        return;
      }

      setUsuarioLogueado(datosUsuario);
      localStorage.setItem('usuario_hogarsys', JSON.stringify(datosUsuario));
      setPestana('vender');
      setErrorApp('');
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
    const ventasTopProductos = useMemo(() => {
      const mapa = ventasDia.reduce((acc, venta) => {
        const nombre = venta.nombre_producto || 'Sin nombre';
        if (!acc[nombre]) acc[nombre] = { nombre, unidades: 0, total: 0 };
        acc[nombre].unidades += 1;
        acc[nombre].total += Number(venta.precio_venta) || 0;
        return acc;
      }, {});
      return Object.values(mapa).sort((a,b) => b.unidades - a.unidades).slice(0, 5);
    }, [ventasDia]);

    const actualizarTodo = async () => {
      setCargando(true);
      setErrorApp('');
      try {
        const tareas = [fetchProductos()];
        if (pestana === 'caja') tareas.push(fetchVentas());
        if (pestana === 'personal' && esAdmin) tareas.push(fetchUsuarios());
        await Promise.all(tareas);
        mostrarMensaje('Información actualizada.');
      } finally {
        setCargando(false);
      }
    };

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
<MenuLink id="clientes" icon={Contact} label="Clientes" /> {/* NUEVO BOTÓN */}
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

              {errorApp && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                  <AlertCircle size={20} className="mt-0.5 shrink-0" />
                  <span>{errorApp}</span>
                </div>
              )}

              {cargando && (
                <div className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-400">
                  <Clock size={16} className="animate-pulse" />
                  Actualizando información...
                </div>
              )}

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
                <div className="bg-white p-4 md:p-5 rounded-[2rem] border shadow-sm space-y-4">
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      className="w-full p-4 pl-14 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-lg"
                      placeholder="Buscar producto por nombre..."
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_220px_auto] gap-3">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      <SlidersHorizontal size={18} className="text-slate-400 shrink-0" />
                      {[
                        ['todos', 'Todos'], ['disponible', 'Disponibles'], ['bajo', 'Stock bajo'], ['agotado', 'Agotados']
                      ].map(([valor, etiqueta]) => (
                        <button key={valor} type="button" onClick={() => setFiltroStock(valor)} className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap ${filtroStock === valor ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                          {etiqueta}
                        </button>
                      ))}
                    </div>
                    <select value={ordenProductos} onChange={e => setOrdenProductos(e.target.value)} className="p-3 rounded-xl bg-slate-100 border-none outline-none text-sm font-bold text-slate-600">
                      <option value="nombre">Ordenar: Nombre</option>
                      <option value="precioAsc">Precio: menor</option>
                      <option value="precioDesc">Precio: mayor</option>
                      <option value="stockAsc">Stock: menor</option>
                    </select>
                    <button type="button" onClick={actualizarTodo} disabled={cargando} className="p-3 px-4 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                      <RefreshCw size={17} className={cargando ? 'animate-spin' : ''} /> Actualizar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-2xl p-4 border"><p className="text-[10px] uppercase font-black text-slate-400">Productos</p><p className="text-2xl font-black">{productos.length}</p></div>
                  <div className="bg-white rounded-2xl p-4 border"><p className="text-[10px] uppercase font-black text-amber-500">Stock bajo</p><p className="text-2xl font-black text-amber-600">{productosBajoStock.length}</p></div>
                  <div className="bg-white rounded-2xl p-4 border"><p className="text-[10px] uppercase font-black text-red-500">Agotados</p><p className="text-2xl font-black text-red-600">{productosAgotados.length}</p></div>
                  <button type="button" onClick={() => setMostrarCarrito(true)} className="bg-blue-600 rounded-2xl p-4 text-white text-left shadow-lg hover:bg-blue-700 transition-colors">
                    <p className="text-[10px] uppercase font-black text-blue-100">Carrito</p><p className="text-2xl font-black flex items-center gap-2"><ShoppingCart size={22}/>{unidadesCarrito}</p>
                  </button>
                </div>

                {productosFiltrados.length === 0 ? (
                  <div className="bg-white p-12 rounded-[2.5rem] border text-center text-slate-400">
                    <Search size={40} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-black text-slate-600">No encontramos productos</p>
                    <p className="text-sm mt-1">Prueba otra búsqueda o cambia el filtro.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {productosFiltrados.map(p => {
                      const stock = Number(p.stock) || 0;
                      const enCarrito = carrito.find(item => item.id === p.id)?.cantidad || 0;
                      return (
                        <div key={p.id} className={`group bg-white rounded-[2rem] border overflow-hidden shadow-sm flex flex-col relative transition-all ${stock === 0 ? 'opacity-75' : 'hover:-translate-y-1 hover:shadow-xl'}`}>
                          {esAdmin && <button type="button" onClick={() => setProductoAEditar(p)} className="absolute top-3 right-3 z-10 bg-white/95 hover:bg-blue-600 hover:text-white text-slate-600 p-2.5 rounded-full shadow-lg"><Edit size={15} /></button>}
                          <div className="h-44 bg-slate-100 relative overflow-hidden">
                            {p.imagen_url ? <img src={p.imagen_url} alt={p.nombre} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={42}/></div>}
                            <div className="absolute top-3 left-3 flex gap-2">
                              {stock === 0 ? <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">Agotado</span> : stock <= 5 ? <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">Stock bajo</span> : null}
                            </div>
                            {enCarrito > 0 && <span className="absolute bottom-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-black">{enCarrito} en carrito</span>}
                          </div>
                          <div className="p-5 flex-1 flex flex-col">
                            <h3 className="font-black text-slate-800 leading-tight min-h-10">{p.nombre}</h3>
                            <div className="flex items-end justify-between mt-3">
                              <div><p className="text-[10px] font-black text-slate-400 uppercase">Precio</p><p className="text-2xl font-black text-blue-600">S/. {Number(p.precio_lista || 0).toFixed(2)}</p></div>
                              <span className={`text-[10px] font-black px-3 py-1 rounded-full ${stock <= 0 ? 'bg-red-100 text-red-600' : stock <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>STOCK {stock}</span>
                            </div>
                            <button type="button" onClick={() => agregarAlCarrito(p)} disabled={stock <= 0} className="mt-5 w-full py-3.5 rounded-xl bg-slate-900 text-white font-black text-sm disabled:bg-slate-200 disabled:text-slate-400 hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                              <ShoppingCart size={18}/> {stock <= 0 ? 'AGOTADO' : 'AGREGAR AL CARRITO'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

   {/* VISTA: GESTIÓN DE CLIENTES */}
{pestana === 'clientes' && (
  <div className="grid lg:grid-cols-3 gap-8">
    
    {/* Formulario de Creación/Edición */}
    <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm h-fit">
      <h3 className="text-lg font-black text-slate-700 mb-6 uppercase tracking-tight flex items-center gap-2">
  {clienteForm.id ? (
    <>
      <Pencil size={20} className="text-amber-500"/>
      <span>Editar Cliente</span>
    </>
  ) : (
    <>
      <UserPlus size={20} className="text-blue-600"/>
      <span>Nuevo Cliente</span>
    </>
  )}
</h3>
      <form onSubmit={guardarCliente} className="space-y-4">
        {/* ... (mantén tus inputs exactos de nombre, documento, telefono y correo aquí) ... */}
        
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre o Razón Social *</label>
          <input className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-600 text-sm font-bold" value={clienteForm.nombre} onChange={e => setClienteForm({...clienteForm, nombre: e.target.value})} required placeholder="Ej. Empresa SAC / Juan Pérez" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">DNI / RUC</label>
          <input className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-600 text-sm" value={clienteForm.documento} onChange={e => setClienteForm({...clienteForm, documento: e.target.value})} placeholder="Número de documento" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Teléfono</label>
            <input className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-600 text-sm" value={clienteForm.telefono} onChange={e => setClienteForm({...clienteForm, telefono: e.target.value})} placeholder="Celular" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Correo</label>
            <input type="email" className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-600 text-sm" value={clienteForm.correo} onChange={e => setClienteForm({...clienteForm, correo: e.target.value})} placeholder="@" />
          </div>
        </div>

        {/* Botones Dinámicos */}
        <div className="flex gap-2 pt-2">
          <button type="submit" className={`flex-1 text-white py-4 rounded-xl font-black uppercase text-xs tracking-wider shadow-lg transition-all ${clienteForm.id ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-900 hover:bg-blue-600'}`}>
            {clienteForm.id ? 'Actualizar' : 'Registrar'}
          </button>
          {clienteForm.id && (
            <button type="button" onClick={cancelarEdicion} className="bg-slate-200 text-slate-600 px-6 rounded-xl font-black uppercase text-xs hover:bg-slate-300 transition-all">
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>

    {/* Lista de Clientes */}
    <div className="lg:col-span-2 bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
      <div className="p-6 bg-slate-50 border-b">
        <h3 className="font-black text-slate-700 text-md uppercase tracking-tight">Directorio de Clientes</h3>
      </div>
      <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
        {clientesLista.length === 0 ? (
          <p className="p-8 text-center text-slate-400 font-bold">Aún no hay clientes registrados.</p>
        ) : (
          clientesLista.map(c => (
            <div key={c.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/50 transition-all">
              <div>
                <p className="font-black text-slate-800 text-lg">{c.nombre}</p>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  {c.documento && <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded-md flex items-center gap-1"><CreditCard size={12}/> {c.documento}</span>}
                  {c.telefono && <span className="text-xs text-slate-400 font-bold">Tel: {c.telefono}</span>}
                </div>
              </div>
              {/* BOTÓN DE EDITAR */}
              {/* BOTONES DE ACCIÓN (EDITAR Y ELIMINAR) */}
<div className="flex items-center gap-2 mt-4 sm:mt-0">
  <button 
    onClick={() => editarCliente(c)}
    className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-amber-100 hover:text-amber-600 transition-all"
    title="Editar cliente"
  >
    <Pencil size={18} />
  </button>

  <button 
    onClick={() => eliminarCliente(c.id)}
    className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-rose-100 hover:text-rose-600 transition-all"
    title="Eliminar cliente"
  >
    <Trash2 size={18} />
  </button>
</div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
)}

            {/* VISTA: AGREGAR PRODUCTO (SOLO ADMIN) */}
            {pestana === 'agregar' && esAdmin && (
              <div className="max-w-2xl bg-white p-10 md:p-16 rounded-[3.5rem] border shadow-sm mx-auto">
                <form onSubmit={agregarProducto} className="space-y-6">
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div><p className="text-sm text-slate-400 font-bold">Resumen operativo</p><p className="font-black text-slate-700">{esAdmin ? 'Todas las ventas registradas' : 'Tus ventas del día'}</p></div>
                  <button type="button" onClick={actualizarTodo} disabled={cargando} className="self-start px-4 py-3 rounded-xl bg-white border shadow-sm font-black text-sm flex items-center gap-2 disabled:opacity-50"><RefreshCw size={17} className={cargando ? 'animate-spin' : ''}/> Actualizar datos</button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-[2rem] border shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400">Ingresos de hoy</p><p className="text-3xl md:text-4xl font-black mt-2">S/. {ingresosDeHoy.toFixed(2)}</p><p className="text-xs text-slate-400 mt-2">Total cobrado</p></div>
                  <div className="bg-white p-6 rounded-[2rem] border shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400">Unidades vendidas</p><p className="text-3xl md:text-4xl font-black text-blue-600 mt-2">{transaccionesDeHoy}</p><p className="text-xs text-slate-400 mt-2">Registros de venta de hoy</p></div>
                  <div className="bg-white p-6 rounded-[2rem] border shadow-sm"><p className="text-[10px] font-black uppercase text-amber-500">Stock bajo</p><p className="text-3xl md:text-4xl font-black text-amber-600 mt-2">{productosBajoStock.length}</p><p className="text-xs text-slate-400 mt-2">Productos con ≤ 5 unidades</p></div>
                  <div className="bg-white p-6 rounded-[2rem] border shadow-sm"><p className="text-[10px] font-black uppercase text-red-500">Agotados</p><p className="text-3xl md:text-4xl font-black text-red-600 mt-2">{productosAgotados.length}</p><p className="text-xs text-slate-400 mt-2">Requieren reposición</p></div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white rounded-[2.5rem] border shadow-sm p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6"><div><h3 className="text-xl font-black text-slate-700">Productos más vendidos</h3><p className="text-xs text-slate-400 font-bold">Basado en el historial cargado</p></div><TrendingUp className="text-blue-600"/></div>
                    {ventasTopProductos.length === 0 ? <p className="text-slate-400 text-sm">Todavía no hay ventas para mostrar.</p> : <div className="space-y-4">{ventasTopProductos.map((v, i) => <div key={v.nombre} className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500">{i+1}</span><div className="flex-1 min-w-0"><p className="font-black text-slate-700 truncate">{v.nombre}</p><div className="h-2 bg-slate-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{width: `${Math.max(8, (v.unidades / Math.max(1, ventasTopProductos[0].unidades)) * 100)}%`}} /></div></div><div className="text-right"><p className="font-black">{v.unidades}</p><p className="text-[10px] text-slate-400 font-bold">unidades</p></div></div>)}</div>}
                  </div>
                  <div className="bg-white rounded-[2.5rem] border shadow-sm p-6 md:p-8">
                    <h3 className="text-xl font-black text-slate-700">Alertas de inventario</h3><p className="text-xs text-slate-400 font-bold mb-5">Productos que necesitan atención</p>
                    <div className="space-y-3 max-h-64 overflow-y-auto">{[...productosAgotados.map(p => ({...p, alerta:'Agotado'})), ...productosBajoStock.map(p => ({...p, alerta:'Stock bajo'}))].slice(0,8).map(p => <div key={`${p.id}-${p.alerta}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50"><div className={`p-2 rounded-lg ${p.alerta === 'Agotado' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{p.alerta === 'Agotado' ? <PackageX size={17}/> : <PackageCheck size={17}/>}</div><div className="min-w-0 flex-1"><p className="font-black text-sm truncate">{p.nombre}</p><p className="text-[10px] text-slate-400 font-bold">{p.alerta} · {Number(p.stock) || 0} unidades</p></div></div>)}{productosAgotados.length === 0 && productosBajoStock.length === 0 && <p className="text-sm text-green-600 font-bold">Inventario sin alertas.</p>}</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-700 flex items-center gap-2"><ReceiptText size={22} className="text-blue-600" /> {esAdmin ? 'Historial de Ventas Diario' : 'Mis Ventas del Turno'}</h3>
                  {listaVentasAgrupadas.length === 0 ? <div className="bg-white p-10 rounded-[2.5rem] border text-center text-slate-400">No hay registros de ventas todavía.</div> : listaVentasAgrupadas.map((grupo, index) => <div key={index} className="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm"><div className="p-5 md:p-6 bg-slate-50 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"><span className="font-black text-slate-700 text-lg capitalize">{grupo.fechaTexto}</span><span className="bg-green-100 text-green-700 px-4 py-2 rounded-2xl font-black text-sm w-fit">Total: S/. {grupo.totalDia.toFixed(2)}</span></div><div className="overflow-x-auto"><table className="w-full text-left min-w-[600px]"><thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase border-b"><tr><th className="px-6 py-4">Producto</th>{esAdmin && <th className="px-6 py-4">Vendedor</th>}<th className="px-6 py-4"><span className="flex items-center gap-1"><Clock size={12}/> Hora</span></th><th className="px-6 py-4 text-right">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{grupo.transacciones.map((v, i) => <tr key={v.id || i} className="hover:bg-blue-50/30"><td className="px-6 py-4 font-bold text-slate-700">{v.nombre_producto}</td>{esAdmin && <td className="px-6 py-4 text-slate-500 font-bold text-xs">{v.vendedor_nombre || 'No asignado'}</td>}<td className="px-6 py-4 text-slate-400 text-sm">{new Date(v.fecha_venta).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td><td className="px-6 py-4 text-right font-black text-green-600">S/. {Number(v.precio_venta || 0).toFixed(2)}</td></tr>)}</tbody></table></div></div>)}
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

      {/* MODAL: CARRITO Y CONFIRMACIÓN DE COBRO */}
      {mostrarCarrito && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4">
          <div className="bg-white w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col">
            <div className="p-5 md:p-7 border-b flex items-center justify-between shrink-0"><div><h3 className="text-xl md:text-2xl font-black text-slate-800">Carrito de venta</h3><p className="text-sm text-slate-400 font-bold">{unidadesCarrito} unidad{unidadesCarrito === 1 ? '' : 'es'} · Total S/. {subtotalCarrito.toFixed(2)}</p></div><button type="button" onClick={() => setMostrarCarrito(false)} className="p-2 rounded-full bg-slate-100 text-slate-500"><X/></button></div>
            <div className="p-4 md:p-6 overflow-y-auto space-y-3 flex-1">
              {carrito.length === 0 ? <div className="py-12 text-center text-slate-400"><ShoppingCart size={44} className="mx-auto mb-3 text-slate-300"/><p className="font-black">El carrito está vacío</p></div> : carrito.map(item => {
                const precio = Number(item.precioUnitario) || 0;
                return <div key={item.id} className="border rounded-2xl p-4 flex gap-3 items-center">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0">{item.imagen_url ? <img src={item.imagen_url} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-slate-300"><PackageCheck size={24}/></div>}</div>
                  <div className="min-w-0 flex-1"><p className="font-black text-slate-700 truncate">{item.nombre}</p><p className="text-[10px] font-bold text-slate-400">Stock disponible: {item.stockDisponible}</p><div className="mt-2 flex items-center gap-2"><button type="button" onClick={() => cambiarCantidadCarrito(item.id, -1)} className="p-2 rounded-lg bg-slate-100"><Minus size={15}/></button><span className="w-7 text-center font-black">{item.cantidad}</span><button type="button" onClick={() => cambiarCantidadCarrito(item.id, 1)} className="p-2 rounded-lg bg-slate-100"><Plus size={15}/></button></div></div>
                  <div className="w-28 sm:w-36"><label className="text-[9px] uppercase font-black text-slate-400">Precio unitario</label><div className="relative mt-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">S/.</span><input type="number" min="0.01" step="0.01" value={item.precioUnitario} onChange={e => cambiarPrecioCarrito(item.id, e.target.value)} className="w-full p-2.5 pl-9 rounded-lg bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-black"/></div><p className="text-right text-xs font-black mt-1">S/. {(precio * item.cantidad).toFixed(2)}</p></div>
                  <button type="button" onClick={() => quitarDelCarrito(item.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={17}/></button>
                </div>;
              })}
            </div>
            <div className="mb-4">
  <label className="text-[10px] uppercase font-black text-slate-400 block mb-2">Asignar Cliente (Opcional)</label>
  <select 
    value={clienteSeleccionadoVenta} 
    onChange={e => setClienteSeleccionadoVenta(e.target.value)}
    className="w-full p-3 bg-slate-100 rounded-xl border-none outline-none text-sm font-bold text-slate-600"
  >
    <option value="">Consumidor Final (Sin asignar)</option>
    {clientesLista.map(c => (
      <option key={c.id} value={c.nombre}>{c.nombre} {c.documento ? `- ${c.documento}` : ''}</option>
    ))}
  </select>
</div>
            <div className="p-5 md:p-6 border-t bg-slate-50 shrink-0">
              <div className="flex items-end justify-between mb-4"><div><p className="text-[10px] uppercase font-black text-slate-400">Total a cobrar</p><p className="text-3xl md:text-4xl font-black text-blue-600">S/. {subtotalCarrito.toFixed(2)}</p></div><button type="button" onClick={vaciarCarrito} disabled={carrito.length === 0 || procesandoVenta} className="text-xs font-black text-red-500 disabled:opacity-30">Vaciar carrito</button></div>
              <div className="grid sm:grid-cols-2 gap-3"><button type="button" onClick={() => setMostrarCarrito(false)} disabled={procesandoVenta} className="py-4 rounded-xl bg-white border font-black text-slate-500">Seguir comprando</button><button type="button" onClick={realizarVenta} disabled={procesandoVenta || carrito.length === 0} className="py-4 rounded-xl bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black shadow-lg">{procesandoVenta ? 'PROCESANDO COBRO...' : 'CONFIRMAR Y COBRAR'}</button></div>
            </div>
          </div>
        </div>
      )}

      {mensajeApp && (
        <div className="fixed right-4 bottom-4 z-[120] max-w-sm bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-right-4 duration-200">
          <CheckCircle size={20} className="text-green-400 shrink-0 mt-0.5"/><span className="text-sm font-bold">{mensajeApp}</span>
        </div>
      )}

      {/* OVERLAY MÓVIL */}
      {menuAbierto && <div className="fixed inset-0 bg-slate-900/40 z-40 md:hidden" onClick={() => setMenuAbierto(false)}></div>}
    </div>
  );
}

export default App;