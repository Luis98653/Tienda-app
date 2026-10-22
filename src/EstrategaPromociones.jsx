import React, { useState } from 'react';
import { Tag, TrendingUp, RefreshCw, Sparkles, Activity, AlertTriangle, CheckCircle2, ShieldAlert, ShoppingCart, Compass } from 'lucide-react';
import { 
  obtenerEstrategiaPromociones, 
  obtenerDiagnosticoNegocio, 
  obtenerPlanReabastecimiento, 
  obtenerSugerenciasNuevosProductos 
} from './services/aiService';

export const EstrategaPromociones = ({ productos, ventas, mostrarMensaje, ingresosHoy, transaccionesHoy, deliveriesHoy }) => {
  // Estado para alternar entre los 4 sub-agentes
  const [agenteActivo, setAgenteActivo] = useState('promociones'); // 'promociones' | 'diagnostico' | 'compras' | 'tendencias'

  // Estados Agente 1: Promociones
  const [promociones, setPromociones] = useState([]);
  const [cargandoPromo, setCargandoPromo] = useState(false);
  const [analizadoPromo, setAnalizadoPromo] = useState(false);

  // Estados Agente 2: Diagnóstico
  const [diagnostico, setDiagnostico] = useState(null);
  const [cargandoDiag, setCargandoDiag] = useState(false);

  // Estados Agente 3: Compras
  const [planCompras, setPlanCompras] = useState(null);
  const [cargandoCompras, setCargandoCompras] = useState(false);

  // Estados Agente 4: Tendencias y Nuevos Productos
  const [tendencias, setTendencias] = useState(null);
  const [cargandoTendencias, setCargandoTendencias] = useState(false);

  // --- HANDLERS DE CADA AGENTE ---
  const handleAnalizarPromociones = async () => {
    setCargandoPromo(true);
    try {
      const res = await obtenerEstrategiaPromociones(productos, ventas);
      setPromociones(res || []);
    } catch (err) {
      console.error("Error al obtener promociones:", err);
      setPromociones([]);
    } finally {
      setCargandoPromo(false);
      setAnalizadoPromo(true);
    }
  };

  const handleDiagnosticarNegocio = async () => {
    setCargandoDiag(true);
    const productosBajoStock = (productos || []).filter(p => Number(p.stock) > 0 && Number(p.stock) <= 5);
    try {
      const res = await obtenerDiagnosticoNegocio(ingresosHoy, transaccionesHoy, deliveriesHoy, productosBajoStock);
      setDiagnostico(res);
    } catch (err) {
      console.error("Error en diagnóstico de IA:", err);
    } finally {
      setCargandoDiag(false);
    }
  };

  const handleCalcularCompras = async () => {
    setCargandoCompras(true);
    try {
      const res = await obtenerPlanReabastecimiento(productos, ventas);
      setPlanCompras(res);
    } catch (err) {
      console.error("Error en plan de compras de IA:", err);
    } finally {
      setCargandoCompras(false);
    }
  };

  const handleAnalizarTendencias = async () => {
    setCargandoTendencias(true);
    try {
      const res = await obtenerSugerenciasNuevosProductos(productos);
      setTendencias(res);
    } catch (err) {
      console.error("Error en agente de tendencias:", err);
    } finally {
      setCargandoTendencias(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* BARRA DE NAVEGACIÓN DE LOS 4 AGENTES */}
      <div className="bg-white p-2 rounded-2xl border shadow-sm grid grid-cols-2 md:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setAgenteActivo('promociones')}
          className={`py-3 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
            agenteActivo === 'promociones'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Sparkles size={16} />
          <span>Promociones y Combos</span>
        </button>

        <button
          type="button"
          onClick={() => setAgenteActivo('diagnostico')}
          className={`py-3 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
            agenteActivo === 'diagnostico'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Activity size={16} />
          <span>Diagnóstico Ejecutivo</span>
        </button>

        <button
          type="button"
          onClick={() => setAgenteActivo('compras')}
          className={`py-3 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
            agenteActivo === 'compras'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <ShoppingCart size={16} />
          <span>Plan de Compras</span>
        </button>

        <button
          type="button"
          onClick={() => setAgenteActivo('tendencias')}
          className={`py-3 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
            agenteActivo === 'tendencias'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Compass size={16} />
          <span>Nuevos Productos</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* AGENTE 1: PROMOCIONES Y COMBOS                           */}
      {/* ========================================================= */}
      {agenteActivo === 'promociones' && (
        <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-600 rounded-2xl">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Agente Estratega de Promociones</h3>
                <p className="text-xs text-slate-400 font-bold">Análisis de rotación e inventario estancado</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAnalizarPromociones}
              disabled={cargandoPromo}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl text-xs shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <RefreshCw size={14} className={cargandoPromo ? "animate-spin" : ""} />
              <span>{cargandoPromo ? "Analizando..." : "Generar Estrategias"}</span>
            </button>
          </div>

          {cargandoPromo && (
            <div className="p-8 text-center text-amber-600 text-xs font-bold animate-pulse">
              El Agente está evaluando el inventario en tiempo real...
            </div>
          )}

          {!cargandoPromo && analizadoPromo && promociones.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl">
              Inventario estable. No hay recomendaciones críticas por el momento.
            </div>
          )}

          {!cargandoPromo && promociones.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promociones.map((promo, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] px-2.5 py-1 rounded-xl font-black uppercase">
                        <Tag size={12} /> {promo.tipo}
                      </span>
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        {promo.descuentoSugerido}
                      </span>
                    </div>
                    <h4 className="font-black text-slate-800 text-sm mb-1">{promo.titulo}</h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{promo.razon}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-bold flex items-center gap-1">
                      <TrendingUp size={13} className="text-blue-500" /> {promo.impactoEsperado}
                    </span>
                    <button
                      type="button"
                      onClick={() => mostrarMensaje && mostrarMensaje(`Estrategia consultada: "${promo.titulo}"`)}
                      className="text-amber-600 hover:text-amber-700 font-black"
                    >
                      Aceptar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* AGENTE 2: DIAGNÓSTICO EJECUTIVO                           */}
      {/* ========================================================= */}
      {agenteActivo === 'diagnostico' && (
        <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl">
                <Activity size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Agente Director de Inteligencia Comercial</h3>
                <p className="text-xs text-slate-400 font-bold">Diagnóstico holístico de métricas y rendimiento comercial</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDiagnosticarNegocio}
              disabled={cargandoDiag}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <RefreshCw size={14} className={cargandoDiag ? "animate-spin" : ""} />
              <span>{cargandoDiag ? "Analizando..." : "Generar Diagnóstico"}</span>
            </button>
          </div>

          {cargandoDiag && (
            <div className="p-8 text-center text-blue-600 text-xs font-bold animate-pulse">
              El Agente está procesando las métricas globales del negocio...
            </div>
          )}

          {!cargandoDiag && diagnostico && (
            <div className="bg-slate-50 border p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase">Estado del Negocio</span>
                <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase flex items-center gap-1 ${
                  diagnostico.saludNegocio === 'OPTIMA' ? 'bg-emerald-100 text-emerald-700' :
                  diagnostico.saludNegocio === 'RIESGO' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {diagnostico.saludNegocio === 'OPTIMA' && <CheckCircle2 size={14} />}
                  {diagnostico.saludNegocio === 'RIESGO' && <ShieldAlert size={14} />}
                  {diagnostico.saludNegocio === 'ESTABLE' && <AlertTriangle size={14} />}
                  {diagnostico.saludNegocio}
                </span>
              </div>

              <p className="text-sm font-black text-slate-800">{diagnostico.diagnosticoGeneral}</p>

              {diagnostico.puntosCriticos?.length > 0 && (
                <div className="space-y-1.5 pt-3 border-t border-slate-200">
                  <p className="text-[10px] font-black uppercase text-slate-400">Observaciones Clave:</p>
                  <ul className="text-xs text-slate-600 font-medium list-disc list-inside space-y-1">
                    {diagnostico.puntosCriticos.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">💡 Recomendación:</span>
                <span className="font-black text-blue-600">{diagnostico.accionInmediata}</span>
              </div>
            </div>
          )}

          {!cargandoDiag && !diagnostico && (
            <div className="p-8 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl">
              Haz clic en "Generar Diagnóstico" para obtener el análisis comercial.
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* AGENTE 3: PLAN DE COMPRAS                                 */}
      {/* ========================================================= */}
      {agenteActivo === 'compras' && (
        <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 text-purple-600 rounded-2xl">
                <ShoppingCart size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Agente Jefe de Compras y Reposición</h3>
                <p className="text-xs text-slate-400 font-bold">Generación automática de pedidos según niveles de stock</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCalcularCompras}
              disabled={cargandoCompras}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl text-xs shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <RefreshCw size={14} className={cargandoCompras ? "animate-spin" : ""} />
              <span>{cargandoCompras ? "Calculando..." : "Calcular Pedido"}</span>
            </button>
          </div>

          {cargandoCompras && (
            <div className="p-8 text-center text-purple-600 text-xs font-bold animate-pulse">
              El Agente está evaluando el déficit de inventario y cantidades recomendadas...
            </div>
          )}

          {!cargandoCompras && planCompras && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase text-purple-600">Presupuesto Sugerido</p>
                  <p className="text-lg font-black text-purple-900">{planCompras.presupuestoEstimado}</p>
                </div>
                <p className="text-xs text-purple-700 font-medium max-w-md">{planCompras.resumenOrden}</p>
              </div>

              <div className="overflow-x-auto rounded-2xl border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] border-b">
                    <tr>
                      <th className="p-3">Producto</th>
                      <th className="p-3">Stock Actual</th>
                      <th className="p-3">Pedido Sugerido</th>
                      <th className="p-3">Prioridad</th>
                      <th className="p-3">Justificación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold">
                    {planCompras.listaCompras.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 text-slate-800">{item.nombre}</td>
                        <td className="p-3 text-slate-500">{item.stockActual} un.</td>
                        <td className="p-3 text-purple-700 font-black">+{item.cantidadSugerida} un.</td>
                        <td className="p-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black ${
                            item.prioridad === 'URGENTE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {item.prioridad}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">{item.justificacion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!cargandoCompras && !planCompras && (
            <div className="p-8 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl">
              Haz clic en "Calcular Pedido" para generar la orden sugerida por IA.
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* AGENTE 4: NUEVOS PRODUCTOS Y TENDENCIAS                    */}
      {/* ========================================================= */}
      {agenteActivo === 'tendencias' && (
        <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-2xl">
                <Compass size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Agente Analista de Tendencias</h3>
                <p className="text-xs text-slate-400 font-bold">Identificación de productos novedosos para incorporar al catálogo</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAnalizarTendencias}
              disabled={cargandoTendencias}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <RefreshCw size={14} className={cargandoTendencias ? "animate-spin" : ""} />
              <span>{cargandoTendencias ? "Buscando..." : "Explorar Oportunidades"}</span>
            </button>
          </div>

          {cargandoTendencias && (
            <div className="p-8 text-center text-emerald-600 text-xs font-bold animate-pulse">
              El Agente está analizando las categorías para detectar productos novedosos...
            </div>
          )}

          {!cargandoTendencias && tendencias && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-emerald-700">Oportunidad de Mercado</p>
                <p className="text-xs text-emerald-900 font-bold mt-1">{tendencias.resumenOportunidad}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tendencias.sugerencias.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 border p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                    <div>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-1 rounded-xl font-black uppercase">
                        {item.categoria}
                      </span>
                      <h4 className="font-black text-slate-800 text-sm mt-2">{item.nombreProducto}</h4>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">{item.razonComercial}</p>
                    </div>
                    <div className="pt-2 border-t text-[11px] font-bold text-blue-600">
                      🚀 {item.impactoEsperado}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!cargandoTendencias && !tendencias && (
            <div className="p-8 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl">
              Haz clic en "Explorar Oportunidades" para recibir sugerencias de nuevos productos novedosos.
            </div>
          )}
        </div>
      )}

    </div>
  );
};