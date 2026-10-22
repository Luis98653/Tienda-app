import React, { useEffect, useRef, useState } from 'react';
import { obtenerSugerenciasVenta } from './services/aiService';

export const CopilotoVentasModal = ({
  carrito,
  catalogo,
  agregarAlCarrito
}) => {
  const [sugerencias, setSugerencias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [agregandoId, setAgregandoId] = useState(null);

  // Controla respuestas antiguas de Gemini
  const requestIdRef = useRef(0);

  useEffect(() => {
    
    const carritoSeguro = Array.isArray(carrito) ? carrito : [];
    const catalogoSeguro = Array.isArray(catalogo) ? catalogo : [];
    

    // Si el carrito queda vacío, limpiamos todo.
    if (carritoSeguro.length === 0) {
      requestIdRef.current += 1;
      setSugerencias([]);
      setCargando(false);
      return;
    }

    const requestId = Date.now();
  requestIdRef.current = requestId;

  setCargando(true);

    // Pequeño debounce para no consultar Gemini
    // inmediatamente ante cada cambio del carrito.
    const timer = setTimeout(async () => {
      try {
        console.log('🤖 Copiloto: consultando recomendaciones...');

        const resultado = await obtenerSugerenciasVenta(
          carritoSeguro,
          catalogoSeguro
        );

        // Si esta respuesta ya no corresponde al carrito actual,
        // la ignoramos.
        if (requestId !== requestIdRef.current) {
          console.log(
            '🛑 Copiloto: respuesta antigua ignorada.'
          );
          return;
        }

        const sugerenciasValidas = Array.isArray(resultado)
          ? resultado.filter(item => item?.productoId)
          : [];

        console.log(
          '✅ Copiloto: sugerencias recibidas:',
          sugerenciasValidas
        );

        setSugerencias(sugerenciasValidas);
      } catch (error) {
        console.error(
          '❌ Error en Copiloto de Ventas:',
          error
        );

        if (requestId === requestIdRef.current) {
          setSugerencias([]);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setCargando(false);
        }
      }
    }, 600);

    return () => {
      clearTimeout(timer);
    };
  }, [carrito, catalogo]);

  /**
   * Agrega una recomendación al carrito.
   *
   * IMPORTANTE:
   * No construimos aquí un producto nuevo.
   * Buscamos el producto ORIGINAL dentro de catalogo
   * y usamos agregarAlCarrito(), que ya maneja:
   *
   * - precioUnitario
   * - cantidad
   * - stockDisponible
   * - validación de stock
   * - actualización del carrito
   */
  const manejarAgregar = (sugerencia) => {
    if (!sugerencia?.productoId) return;

    if (agregandoId) return;

    const catalogoSeguro = Array.isArray(catalogo)
      ? catalogo
      : [];

    const producto = catalogoSeguro.find(
      item =>
        item.id === sugerencia.productoId ||
        String(item.id) === String(sugerencia.productoId)
    );

    if (!producto) {
      console.warn(
        '⚠️ Copiloto: producto recomendado no encontrado:',
        sugerencia
      );

      return;
    }

    const stock = Number(producto.stock) || 0;

    if (stock <= 0) {
      console.warn(
        '⚠️ Copiloto: producto sin stock:',
        producto
      );

      return;
    }

    // Evita doble clic.
    setAgregandoId(producto.id);

    try {
      console.log(
        '🛒 Copiloto: agregando producto real al carrito:',
        {
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio_lista,
          stock: producto.stock
        }
      );

      // ESTA es la función importante.
      // App.jsx se encarga de colocar precioUnitario,
      // cantidad y stockDisponible.
      agregarAlCarrito(producto);

      // Quitamos la sugerencia que acabamos de utilizar.
      setSugerencias(prev =>
        prev.filter(
          item =>
            String(item.productoId) !==
            String(producto.id)
        )
      );
    } catch (error) {
      console.error(
        '❌ Error agregando producto desde Copiloto:',
        error
      );
    } finally {
      setTimeout(() => {
        setAgregandoId(null);
      }, 300);
    }
  };

  if (!Array.isArray(carrito) || carrito.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-4 rounded-xl shadow-lg my-3 border border-purple-400/30">

      {/* CABECERA */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🤖</span>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-purple-200">
              Copiloto de Ventas
            </h4>

            <p className="text-[10px] text-purple-300">
              Recomendaciones inteligentes
            </p>
          </div>
        </div>
      </div>

      {/* CARGANDO */}
      {cargando ? (
        <div className="flex items-center gap-2">
          <span className="animate-spin text-sm">
            ⟳
          </span>

          <p className="text-xs text-purple-300 animate-pulse">
            Analizando productos complementarios...
          </p>
        </div>
      ) : sugerencias.length > 0 ? (

        /* SUGERENCIAS */
        <div className="space-y-2">

          {sugerencias.map((item, idx) => {
            const producto = catalogo?.find(
              p =>
                String(p.id) ===
                String(item.productoId)
            );

            const sinStock =
              !producto ||
              (Number(producto.stock) || 0) <= 0;

            const estaAgregando =
              String(agregandoId) ===
              String(item.productoId);

            return (
              <div
                key={`${item.productoId}-${idx}`}
                className="bg-white/10 p-3 rounded-lg flex items-center justify-between border border-purple-400/20"
              >

                {/* INFORMACIÓN */}
                <div className="pr-3 min-w-0">

                  <p className="font-semibold text-xs text-white truncate">
                    {item.nombre}
                  </p>

                  <p className="text-[11px] text-purple-200 italic mt-1">
                    "{item.fraseVenta}"
                  </p>

                  {producto && (
                    <div className="flex gap-3 mt-1">

                      <span className="text-[10px] text-purple-300">
                        S/.{' '}
                        {(
                          Number(
                            producto.precio_lista
                          ) || 0
                        ).toFixed(2)}
                      </span>

                      <span className="text-[10px] text-purple-300">
                        Stock: {producto.stock}
                      </span>

                    </div>
                  )}
                </div>

                {/* BOTÓN */}
                <button
                  type="button"
                  disabled={
                    estaAgregando ||
                    sinStock
                  }
                  onClick={() =>
                    manejarAgregar(item)
                  }
                  className={`
                    font-bold text-xs px-3 py-2 rounded-lg
                    transition-colors whitespace-nowrap
                    ${
                      sinStock
                        ? 'bg-gray-500 cursor-not-allowed'
                        : estaAgregando
                        ? 'bg-purple-700 cursor-wait'
                        : 'bg-purple-500 hover:bg-purple-600'
                    }
                  `}
                >
                  {estaAgregando
                    ? '✓ Agregado'
                    : sinStock
                    ? 'Agotado'
                    : '+ Agregar'}
                </button>

              </div>
            );
          })}

        </div>

      ) : (

        /* SIN SUGERENCIAS */
        <p className="text-xs text-purple-300">
          Sin recomendaciones adicionales.
        </p>
      )}
    </div>
  );
};