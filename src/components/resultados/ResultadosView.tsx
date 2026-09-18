import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  Grape,
  Sparkles,
  Package,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Clock,
  Layers,
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';

export const ResultadosView: React.FC = () => {
  const { vinculaciones, getCuadraById, getTrabajadorById, getTipoTrabajoById } = useFarm();

  const [activeTab, setActiveTab] = useState<'cosechas' | 'materiales' | 'labores'>('cosechas');

  // Filtrar cosechas
  const cosechas = vinculaciones.filter((v) => v.resultado?.esCosecha);

  // Filtrar labores no cosecha con resultados
  const laboresConResultado = vinculaciones.filter(
    (v) => v.resultado && !v.resultado.esCosecha
  );

  // Acumulados de materiales utilizados y requeridos
  const todosMaterialesUtilizados: { matNombre: string; cantidad: number; unidad: string; cuadra: string; fecha: string }[] = [];
  const todosMaterialesRequeridos: { reqNombre: string; cantidad: number; unidad: string; esPerecible: boolean; estado: string; obs: string; cuadra: string; trabajador: string }[] = [];

  vinculaciones.forEach((v) => {
    const cid = v.cuadraId || v.propiedades?.[0]?.cuadraId || '';
    const cuadra = getCuadraById(cid)?.nombre || 'Cuadra';
    const trab = v.trabajadores && v.trabajadores.length > 0
      ? v.trabajadores.map((t) => t.nombreTrabajador || getTrabajadorById(t.trabajadorId)?.nombreCompleto).filter(Boolean).join(', ')
      : (getTrabajadorById(v.trabajadorId || '')?.nombreCompleto || 'Equipo agrícola');

    if (v.resultado?.materialesUtilizados) {
      v.resultado.materialesUtilizados.forEach((m) => {
        todosMaterialesUtilizados.push({
          matNombre: m.nombre,
          cantidad: m.cantidad,
          unidad: m.unidad,
          cuadra,
          fecha: v.fecha || v.fechaInicio || '',
        });
      });
    }

    if (v.resultado?.materialesRequeridos) {
      v.resultado.materialesRequeridos.forEach((r) => {
        todosMaterialesRequeridos.push({
          reqNombre: r.nombre,
          cantidad: r.cantidad,
          unidad: r.unidad,
          esPerecible: r.esPerecible,
          estado: r.estado,
          obs: r.observaciones || '',
          cuadra,
          trabajador: trab,
        });
      });
    }
  });

  // KPIs de Cosecha
  const totalQuintales = cosechas.reduce((acc, c) => acc + (c.resultado?.cantidadCosechada || 0), 0);
  const totalIngresos = cosechas.reduce((acc, c) => acc + (c.resultado?.ingresoGenerado || 0), 0);
  const totalGastos = cosechas.reduce((acc, c) => acc + (c.resultado?.gastosRelacionados || 0), 0);
  const totalGanancia = cosechas.reduce((acc, c) => acc + (c.resultado?.gananciaNeta || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 sm:gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-card">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div className="p-2 sm:p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
              Resultados
            </h2>
          </div>
        </div>

        {/* Tabs selector */}
        <div className="w-full lg:w-auto flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar gap-1">
          <button
            onClick={() => setActiveTab('cosechas')}
            className={`flex-1 sm:flex-initial shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'cosechas'
                ? 'bg-white text-cacao-950 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grape className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span>Cosechas ({cosechas.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('materiales')}
            className={`flex-1 sm:flex-initial shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'materiales'
                ? 'bg-white text-cacao-950 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5 shrink-0 text-cacao-700" />
            <span>Insumos & Materiales ({todosMaterialesRequeridos.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('labores')}
            className={`flex-1 sm:flex-initial shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'labores'
                ? 'bg-white text-cacao-950 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            <span>Labores de Campo ({laboresConResultado.length})</span>
          </button>
        </div>
      </div>

      {/* 1. PESTAÑA: COSECHAS */}
      {activeTab === 'cosechas' && (
        <div className="space-y-6">
          {/* Métricas de Cosecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
              <span className="text-xs font-semibold uppercase text-slate-400 block">Total Cosechado</span>
              <div className="flex items-center gap-2 mt-2">
                <Grape className="w-6 h-6 text-amber-600" />
                <span className="text-2xl font-extrabold text-slate-900">{formatNumber(totalQuintales)} qq</span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Zafra 2026 acumulada</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
              <span className="text-xs font-semibold uppercase text-slate-400 block">Ingresos Brutos</span>
              <div className="flex items-center gap-2 mt-2">
                <DollarSign className="w-6 h-6 text-emerald-600" />
                <span className="text-2xl font-extrabold text-emerald-700">{formatCurrency(totalIngresos)}</span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Ventas en bodega</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
              <span className="text-xs font-semibold uppercase text-slate-400 block">Gastos de Cosecha</span>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="w-6 h-6 text-rose-600" />
                <span className="text-2xl font-extrabold text-rose-700">{formatCurrency(totalGastos)}</span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Fletes y suministros</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-300 shadow-card">
              <span className="text-xs font-semibold uppercase text-emerald-800 block">Ganancia Neta Cosecha</span>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-2xl font-extrabold text-emerald-800">{formatCurrency(totalGanancia)}</span>
              </div>
              <span className="text-xs text-emerald-700 mt-1 block">Margen limpio acumulado</span>
            </div>
          </div>

          {/* Tabla de Cosechas */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Registro Detallado de Cosechas</h3>
              <span className="text-xs text-slate-500">{cosechas.length} zafras registradas</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Cuadra</th>
                    <th className="py-3 px-4">Variedad / Grano</th>
                    <th className="py-3 px-4 text-center">Volumen</th>
                    <th className="py-3 px-4 text-right">Precio/qq</th>
                    <th className="py-3 px-4 text-right">Ingreso Bruto</th>
                    <th className="py-3 px-4 text-right">Gastos</th>
                    <th className="py-3 px-4 text-right">Ganancia Neta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cosechas.map((c) => {
                    const cid = c.cuadraId || c.propiedades?.[0]?.cuadraId || '';
                    const cuadra = getCuadraById(cid);
                    const res = c.resultado!;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 text-slate-600">{formatDate(c.fecha || c.fechaInicio || '')}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{cuadra?.nombre}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 font-semibold border border-amber-200 text-[11px]">
                            {res.tipoGrano || 'Cacao Fino'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-amber-900">
                          {res.cantidadCosechada} {res.unidadMedida}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                          ${res.precioVentaUnitario}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(res.ingresoGenerado)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-rose-700">
                          {formatCurrency(res.gastosRelacionados)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">
                          {formatCurrency(res.gananciaNeta)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. PESTAÑA: MATERIALES E INSUMOS */}
      {activeTab === 'materiales' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Materiales Requeridos (Faltantes / Alertas) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Materiales e Insumos Requeridos</h3>
                  <p className="text-xs text-slate-500">Solicitudes de campo para próximas labores</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {todosMaterialesRequeridos.length} pedidos
              </span>
            </div>

            {todosMaterialesRequeridos.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">No hay insumos pendientes solicitados.</p>
            ) : (
              <div className="space-y-3">
                {todosMaterialesRequeridos.map((req, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 text-sm">
                        {req.reqNombre} — {req.cantidad} {req.unidad}
                      </strong>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.estado === 'urgente' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {req.estado.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>Destino: <strong>{req.cuadra}</strong></span>
                      <span>•</span>
                      <span>Solicitante: {req.trabajador}</span>
                      <span>•</span>
                      <span className="font-semibold">{req.esPerecible ? 'Perecible' : 'No perecible'}</span>
                    </div>
                    {req.obs && (
                      <p className="text-[11px] text-amber-900 italic bg-amber-50/80 p-1.5 rounded border border-amber-200/60">
                        {req.obs}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Materiales Utilizados */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cacao-100 text-cacao-800 rounded-xl">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Materiales Utilizados en Finca</h3>
                  <p className="text-xs text-slate-500">Bitácora de insumos aplicados en cuadras</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {todosMaterialesUtilizados.length} registros
              </span>
            </div>

            {todosMaterialesUtilizados.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">No hay registros de materiales aplicados.</p>
            ) : (
              <div className="space-y-2">
                {todosMaterialesUtilizados.map((mat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{mat.matNombre}</span>
                      <span className="text-slate-500 text-[11px] ml-2">({mat.cuadra})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-cacao-900 bg-cacao-50 px-2 py-0.5 rounded">
                        {mat.cantidad} {mat.unidad}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{formatDate(mat.fecha)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. PESTAÑA: LABORES DE CAMPO */}
      {activeTab === 'labores' && (
        <div className="space-y-3">
          {laboresConResultado.map((v) => {
            const cid = v.cuadraId || v.propiedades?.[0]?.cuadraId || '';
            const cuadra = getCuadraById(cid);
            const nombresTrabajadores = v.trabajadores && v.trabajadores.length > 0
              ? v.trabajadores.map((t) => t.nombreTrabajador || getTrabajadorById(t.trabajadorId)?.nombreCompleto).filter(Boolean).join(', ')
              : (getTrabajadorById(v.trabajadorId || '')?.nombreCompleto || 'Equipo agrícola');
            const tipo = getTipoTrabajoById(v.tipoTrabajoId);
            const res = v.resultado!;

            return (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-card space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{cuadra?.nombre}</span>
                    <span className="px-2 py-0.5 rounded-full bg-cacao-100 text-cacao-900 font-bold text-[11px]">
                      {tipo?.nombre}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <span>{formatDate(v.fecha || v.fechaInicio || '')}</span>
                    <span>•</span>
                    <span>Trabajadores: <strong>{nombresTrabajadores}</strong></span>
                    <span>•</span>
                    <span className="font-bold text-slate-900">{v.totalHoras} hrs</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <p className="text-slate-800">
                    <strong className="text-slate-900">Resultado:</strong> {res.resultadoTexto}
                  </p>
                  {res.problemasEncontrados && (
                    <p className="text-amber-800 text-[11px]">
                      <strong>Problemas detectados:</strong> {res.problemasEncontrados}
                    </p>
                  )}
                  {res.observaciones && (
                    <p className="text-slate-500 text-[11px] italic">
                      <strong>Observaciones:</strong> {res.observaciones}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
