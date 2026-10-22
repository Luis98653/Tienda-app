import React from 'react';
import {
  X,
  Minus,
  Plus,
  Trash2,
  MapPin,
  Truck,
  Store,
} from 'lucide-react';

import { CopilotoVentasModal } from './CopilotoVentasModal';


// =====================================================
// ITEM DEL CARRITO
// =====================================================

const CarritoItem = function CarritoItem({
  id,
  nombre,
  cantidad,
  precioUnitario,
  cambiarCantidadCarrito,
  cambiarPrecioCarrito,
  quitarDelCarrito,
}) {
  const cantidadNumerica = Number(cantidad) || 0;
  const precioNumerico = Number(precioUnitario) || 0;
  const totalItem = precioNumerico * cantidadNumerica;

  return (
    <div className="relative border rounded-xl sm:rounded-2xl p-3 sm:p-4 flex gap-2 sm:gap-3 items-center">

      {/* PRODUCTO */}
      <div className="min-w-0 flex-1">

        <p className="font-black text-slate-700 text-xs sm:text-base truncate">
          {nombre}
        </p>

        {/* CANTIDAD */}
        <div className="relative z-20 mt-1.5 flex items-center gap-1.5 pointer-events-auto">

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cambiarCantidadCarrito(id, -1);
            }}
            className="relative z-20 pointer-events-auto p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 transition"
          >
            <Minus size={14} />
          </button>

          <span className="w-6 text-center font-black text-xs sm:text-sm">
            {cantidadNumerica}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cambiarCantidadCarrito(id, 1);
            }}
            className="relative z-20 pointer-events-auto p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 transition"
          >
            <Plus size={14} />
          </button>

        </div>
      </div>


      {/* PRECIO UNITARIO */}
      <div className="w-20 sm:w-24 shrink-0">

        <label className="text-[8px] sm:text-[9px] uppercase font-black text-slate-400 block">
          P. Unitario
        </label>

        <input
          type="number"
          step="0.01"
          min="0"
          value={precioUnitario}
          onChange={(e) => {
            cambiarPrecioCarrito(id, e.target.value);
          }}
          className="w-full p-1.5 sm:p-2 bg-slate-50 rounded-lg text-xs font-black border text-right outline-none focus:ring-2 focus:ring-blue-200"
        />

      </div>


      {/* TOTAL ITEM */}
      <div className="text-right shrink-0">

        <p className="font-black text-blue-600 text-xs sm:text-base whitespace-nowrap">
          S/. {totalItem.toFixed(2)}
        </p>

      </div>


      {/* ELIMINAR */}
      <button
        type="button"
        onClick={() => quitarDelCarrito(id)}
        className="p-1.5 text-red-400 hover:text-red-600 active:scale-95 transition shrink-0"
      >
        <Trash2 size={16} />
      </button>

    </div>
  );
};


// =====================================================
// MODAL DEL CARRITO
// =====================================================

export function CarritoModal({
  mostrarCarrito,
  setMostrarCarrito,

  carrito,
  productos,
  clientesLista,

  unidadesCarrito,
  subtotalCarrito,

  cambiarCantidadCarrito,
  cambiarPrecioCarrito,
  quitarDelCarrito,

  agregarAlCarrito,

  tipoEntrega,
  setTipoEntrega,

  direccion,
  setDireccion,

  clienteSeleccionadoVenta,
  setClienteSeleccionadoVenta,

  procesandoVenta,
  realizarVenta,

  inputRef,
  mapRef,
}) {

  if (!mostrarCarrito) {
    return null;
  }


  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4">

      <div className="bg-white w-full max-w-2xl max-h-[90vh] sm:max-h-[92vh] overflow-hidden rounded-t-[1.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="p-4 sm:p-6 border-b flex items-center justify-between shrink-0 bg-white">

          <div>

            <h3 className="text-lg sm:text-2xl font-black text-slate-800">
              Carrito de Venta
            </h3>

            <p className="text-xs sm:text-sm text-slate-400 font-bold">
              {unidadesCarrito} unidad(es) · Total S/.{' '}
              {Number(subtotalCarrito || 0).toFixed(2)}
            </p>

          </div>


          <button
            type="button"
            onClick={() => setMostrarCarrito(false)}
            className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95 transition"
          >
            <X size={20} />
          </button>

        </div>


        {/* =================================================
            BODY
        ================================================= */}

        <div className="p-3 sm:p-6 overflow-y-auto space-y-3 flex-1">


          {/* CARRITO */}

          {carrito.length === 0 ? (

            <div className="text-center py-8 text-slate-400 text-sm font-bold">
              El carrito está vacío
            </div>

          ) : (

            carrito.map((item) => (

              <CarritoItem
                key={item.id}

                id={item.id}
                nombre={item.nombre}
                cantidad={item.cantidad}
                precioUnitario={item.precioUnitario}

                cambiarCantidadCarrito={cambiarCantidadCarrito}
                cambiarPrecioCarrito={cambiarPrecioCarrito}
                quitarDelCarrito={quitarDelCarrito}
              />

            ))

          )}


          {/* =================================================
              COPILOTO
          ================================================= */}

          <CopilotoVentasModal
            carrito={carrito}
            catalogo={productos}
            agregarAlCarrito={agregarAlCarrito}
          />


          {/* =================================================
              ENTREGA
          ================================================= */}

          <div className="space-y-3 pt-2">


            {/* MODALIDAD */}

            <div className="space-y-1.5">

              <label className="text-[10px] uppercase font-black text-slate-400">
                Modalidad de Venta
              </label>


              <div className="grid grid-cols-2 gap-2">

                {/* TIENDA */}

                <button
                  type="button"
                  onClick={() => setTipoEntrega('tienda')}
                  className={`p-2.5 sm:p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition ${
                    tipoEntrega === 'tienda'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Store size={15} />
                  Retiro en Tienda
                </button>


                {/* DELIVERY */}

                <button
                  type="button"
                  onClick={() => setTipoEntrega('delivery')}
                  className={`p-2.5 sm:p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition ${
                    tipoEntrega === 'delivery'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Truck size={15} />
                  Envío Delivery
                </button>

              </div>

            </div>


            {/* =================================================
                DIRECCIÓN DELIVERY
            ================================================= */}

            {tipoEntrega === 'delivery' && (

              <div className="space-y-2 bg-purple-50/50 p-3 rounded-xl border border-purple-100">

                <label className="text-[10px] uppercase font-black text-purple-700 flex items-center gap-1">
                  <MapPin size={12} />
                  Dirección de Entrega
                </label>


                <input
                  ref={inputRef}
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ingresa la dirección..."
                  className="w-full p-2.5 bg-white rounded-lg border text-xs font-bold"
                />


                <div
                  ref={mapRef}
                  className="w-full h-28 sm:h-36 rounded-xl border bg-slate-200 overflow-hidden"
                />

              </div>

            )}


            {/* =================================================
                CLIENTE
            ================================================= */}

            <div>

              <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">
                Cliente Registrado
              </label>


              <select
                value={clienteSeleccionadoVenta}
                onChange={(e) =>
                  setClienteSeleccionadoVenta(e.target.value)
                }
                className="w-full p-2.5 bg-slate-50 rounded-xl border text-xs font-bold"
              >

                <option value="">
                  Consumidor Final
                </option>


                {clientesLista.map((cliente) => (

                  <option
                    key={cliente.id}
                    value={cliente.nombre}
                  >
                    {cliente.nombre}

                    {cliente.documento
                      ? ` - ${cliente.documento}`
                      : ''}
                  </option>

                ))}

              </select>

            </div>

          </div>

        </div>


        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="p-4 sm:p-6 border-t bg-slate-50 shrink-0">

          <div className="flex items-center justify-between gap-3">


            {/* TOTAL */}

            <div>

              <p className="text-[9px] uppercase font-black text-slate-400">
                Total a pagar
              </p>

              <p className="text-2xl sm:text-3xl font-black text-blue-600">
                S/. {Number(subtotalCarrito || 0).toFixed(2)}
              </p>

            </div>


            {/* CONFIRMAR */}

            <button
              type="button"
              onClick={realizarVenta}
              disabled={
                procesandoVenta ||
                carrito.length === 0
              }
              className="px-5 py-3 sm:px-8 sm:py-4 rounded-xl bg-blue-600 text-white font-black text-xs sm:text-base shadow-lg disabled:bg-slate-300 hover:bg-blue-700 active:scale-95 transition"
            >

              {procesandoVenta
                ? 'PROCESANDO...'
                : 'CONFIRMAR VENTA'}

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}