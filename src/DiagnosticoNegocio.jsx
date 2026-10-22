import React, { useState } from 'react';
import { Activity, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { obtenerDiagnosticoNegocio } from './services/aiService';

export const DiagnosticoNegocio = ({ ingresosHoy, transaccionesHoy, deliveriesHoy, productosBajoStock }) => {
  const [diagnostico, setDiagnostico] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleDiagnosticar = async () => {
    setCargando(true);
    try {
      const res = await obtenerDiagnosticoNegocio(ingresosHoy, transaccionesHoy, deliveriesHoy, productosBajoStock);
      setDiagnostico(res);
    } catch (error) {
      console.error("Error en diagnóstico de IA:", error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl">
            <Activity size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800">Agente Director de Inteligencia comercial</h3>
            <p className="text-xs text-slate-400 font-bold">
              Diagnóstico estratégico en tiempo real de ingresos, canales y stock
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDiagnosticar}
          disabled={cargando}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw size={14} className={cargando ? "animate-spin" : ""} />
          <span>{cargando ? "Analizando..." : "Generar Diagnóstico"}</span>
        </button>
      </div>

      {cargando && (
        <div className="p-6 text-center text-blue-600 text-xs font-bold animate-pulse">
          El Agente está procesando las métricas comerciales en tiempo real...
        </div>
      )}

      {!cargando && diagnostico && (
        <div className="bg-slate-50 border p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase">Estado del negocio</span>
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
            <div className="space-y-1 pt-2 border-t border-slate-200">
              <p className="text-[10px] font-black uppercase text-slate-400">Puntos de atención:</p>
              <ul className="text-xs text-slate-600 font-medium list-disc list-inside space-y-1">
                {diagnostico.puntosCriticos.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-bold">💡 Acción prioritaria:</span>
            <span className="font-black text-blue-600">{diagnostico.accionInmediata}</span>
          </div>
        </div>
      )}
    </div>
  );
};