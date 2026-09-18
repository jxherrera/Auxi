import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  BarChart3,
  Download,
  Filter,
  DollarSign,
  Grape,
  Clock,
  TrendingUp,
  Package,
  Maximize2,
  Calendar,
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, formatArea } from '../../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const ReportesView: React.FC = () => {
  const {
    propietarios,
    cuadras,
    trabajadores,
    tiposTrabajo,
    vinculaciones,
    rentabilidades,
    getCuadraById,
    getTrabajadorById,
    getTipoTrabajoById,
    getPropietarioById,
  } = useFarm();

  // Filtros de reportes
  const [filterPropietario, setFilterPropietario] = useState<string>('todos');
  const [filterTipoPropiedad, setFilterTipoPropiedad] = useState<string>('todos');
  const [filterCuadra, setFilterCuadra] = useState<string>('todos');
  const [filterTrabajador, setFilterTrabajador] = useState<string>('todos');
  const [filterTipoTrabajo, setFilterTipoTrabajo] = useState<string>('todos');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');

  // Filtrado de cuadras según propietario y tipo
  const cuadrasFiltradas = cuadras.filter((c) => {
    if (filterPropietario !== 'todos' && c.propietarioId !== filterPropietario) return false;
    if (filterTipoPropiedad !== 'todos' && c.tipoPropiedad !== filterTipoPropiedad) return false;
    return true;
  });

  const cuadrasIdsFiltradas = new Set(cuadrasFiltradas.map((c) => c.id));

  // Filtrado de vinculaciones / jornadas para analítica
  const filteredVincs = vinculaciones.filter((v) => {
    const touchesCuadra =
      (v.cuadraId && cuadrasIdsFiltradas.has(v.cuadraId)) ||
      v.propiedades?.some((p) => cuadrasIdsFiltradas.has(p.cuadraId));
    if (!touchesCuadra) return false;

    if (filterCuadra !== 'todos') {
      const matchesC = v.cuadraId === filterCuadra || v.propiedades?.some((p) => p.cuadraId === filterCuadra);
      if (!matchesC) return false;
    }

    if (filterTrabajador !== 'todos') {
      const hasWorker =
        v.trabajadores?.some((t) => t.trabajadorId === filterTrabajador) ||
        v.trabajadorId === filterTrabajador;
      if (!hasWorker) return false;
    }

    if (filterTipoTrabajo !== 'todos' && v.tipoTrabajoId !== filterTipoTrabajo) return false;

    const fechaInicioV = v.fecha || v.fechaInicio || '';
    if (fechaDesde && fechaInicioV < fechaDesde) return false;
    if (fechaHasta && (v.fechaFin || fechaInicioV) > fechaHasta) return false;

    return true;
  });

  // Métricas agregadas sobre los datos filtrados
  let totalProduccionQuintales = 0;
  let totalIngresosCosecha = 0;
  let totalGastosManoObra = 0;
  let totalHoras = 0;
  let totalHorasFamiliares = 0;

  filteredVincs.forEach((v) => {
    totalGastosManoObra += v.pagoTotal || 0;
    totalHoras += v.totalHoras || 0;
    totalHorasFamiliares += v.totalHorasFamiliares || 0;

    if (v.resultado?.esCosecha) {
      if (
        filterPropietario !== 'todos' &&
        v.resultado.cosechasPorPropietario &&
        v.resultado.cosechasPorPropietario.length > 0
      ) {
        const duenoCosechas = v.resultado.cosechasPorPropietario.filter(
          (cp) => cp.propietarioId === filterPropietario
        );
        duenoCosechas.forEach((cp) => {
          totalProduccionQuintales += cp.cantidad || 0;
          totalIngresosCosecha += cp.ingresoGenerado || 0;
        });
      } else {
        totalProduccionQuintales += v.resultado.cantidadCosechada || 0;
        totalIngresosCosecha += v.resultado.ingresoGenerado || 0;
      }
    }
  });

  const gananciaNetaConsolidada = totalIngresosCosecha - totalGastosManoObra;

  // Rentabilidades filtradas según cuadras
  const rentabilidadesFiltradas = rentabilidades.filter((r) => cuadrasIdsFiltradas.has(r.cuadra.id));

  // Datos para gráfico de Rentabilidad por Cuadra (Ingresos vs Gastos)
  const chartDataRentabilidad = rentabilidadesFiltradas.map((r) => ({
    nombre: r.cuadra.nombre.split(' - ')[0],
    ingresos: r.ingresosGenerados,
    gastos: r.gastosManoObra,
    margenNeto: r.gananciaNeta,
  }));

  // Exportar a CSV
  const handleExportCSV = () => {
    const headers = [
      'Codigo',
      'Propietario',
      'TipoPropiedad',
      'Cuadra',
      'Trabajadores',
      'TipoTrabajo',
      'FechaInicio',
      'FechaFin',
      'HorasTotales',
      'HorasFamiliares',
      'PagoTotal',
      'EstadoPago',
      'EsCosecha',
      'QuintalesCosechados',
      'IngresoCosecha',
    ];

    const rows = filteredVincs.map((v) => {
      const cid = v.cuadraId || v.propiedades?.[0]?.cuadraId || '';
      const cuadra = getCuadraById(cid);
      const prop = cuadra ? getPropietarioById(cuadra.propietarioId) : undefined;
      const nombresTrabajadores = v.trabajadores && v.trabajadores.length > 0
        ? v.trabajadores.map((t) => t.nombreTrabajador || getTrabajadorById(t.trabajadorId)?.nombreCompleto).filter(Boolean).join(', ')
        : (getTrabajadorById(v.trabajadorId || '')?.nombreCompleto || '');
      const fechaV = v.fecha || v.fechaInicio || '';

      return [
        v.codigo,
        `"${prop?.nombre || 'Desconocido'}"`,
        `"${cuadra?.tipoPropiedad === 'propia' ? 'Propia' : 'Tercero'}"`,
        `"${cuadra?.nombre || ''}"`,
        `"${nombresTrabajadores}"`,
        `"${getTipoTrabajoById(v.tipoTrabajoId)?.nombre || ''}"`,
        fechaV,
        v.fechaFin || fechaV,
        v.totalHoras || 0,
        v.totalHorasFamiliares || 0,
        v.pagoTotal ?? v.totalPago ?? 0,
        v.estadoPago || 'pendiente',
        v.resultado?.esCosecha ? 'SI' : 'NO',
        v.resultado?.cantidadCosechada || 0,
        v.resultado?.ingresoGenerado || 0,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_AgroCacao_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs sm:shadow-card">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-100 text-emerald-800 shrink-0">
            <BarChart3 className="w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-lg font-bold text-slate-900 leading-snug">Reportes</h2>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-tight">
              Cálculo de margen neto, rendimiento agrícola por hectárea y finanzas
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-cacao-800 hover:bg-cacao-900 text-white text-xs font-bold shadow-xs hover:shadow transition w-full sm:w-auto"
        >
          <Download className="w-4 h-4 text-harvest-400 shrink-0" />
          <span>Exportar Informe CSV</span>
        </button>
      </div>

      {/* Filtros Paramétricos del Reporte */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-cacao-700" />
            <span>Filtros Paramétricos de Análisis</span>
          </div>
          {(filterPropietario !== 'todos' || filterTipoPropiedad !== 'todos' || filterCuadra !== 'todos' || filterTrabajador !== 'todos' || filterTipoTrabajo !== 'todos' || fechaDesde || fechaHasta) && (
            <button
              onClick={() => {
                setFilterPropietario('todos');
                setFilterTipoPropiedad('todos');
                setFilterCuadra('todos');
                setFilterTrabajador('todos');
                setFilterTipoTrabajo('todos');
                setFechaDesde('');
                setFechaHasta('');
              }}
              className="text-xs text-cacao-700 hover:text-cacao-900 font-semibold underline"
            >
              Restablecer filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Propietario:</label>
            <select
              value={filterPropietario}
              onChange={(e) => setFilterPropietario(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
            >
              <option value="todos">Todos los propietarios ({propietarios.length})</option>
              {propietarios.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} ({p.identificacion})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tipo de Propiedad:</label>
            <select
              value={filterTipoPropiedad}
              onChange={(e) => setFilterTipoPropiedad(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
            >
              <option value="todos">Todas las propiedades</option>
              <option value="propia">Terrenos Propios ({cuadras.filter(c => c.tipoPropiedad === 'propia').length})</option>
              <option value="tercero">Terrenos de Terceros ({cuadras.filter(c => c.tipoPropiedad === 'tercero').length})</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cuadra / Parcela:</label>
            <select
              value={filterCuadra}
              onChange={(e) => setFilterCuadra(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
            >
              <option value="todos">Todas las cuadras ({cuadrasFiltradas.length})</option>
              {cuadrasFiltradas.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Trabajador:</label>
            <select
              value={filterTrabajador}
              onChange={(e) => setFilterTrabajador(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
            >
              <option value="todos">Todos los trabajadores</option>
              {trabajadores.map((t) => (
                <option key={t.id} value={t.id}>{t.nombreCompleto} ({t.tipo})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Labor Agrícola:</label>
            <select
              value={filterTipoTrabajo}
              onChange={(e) => setFilterTipoTrabajo(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
            >
              <option value="todos">Todas las labores</option>
              {tiposTrabajo.map((tp) => (
                <option key={tp.id} value={tp.id}>{tp.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Desde Fecha:</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Hasta Fecha:</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Tarjetas de Resultados Filtrados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400 block">Producción Cosechada</span>
          <div className="flex items-center gap-2 mt-2">
            <Grape className="w-6 h-6 text-amber-600" />
            <span className="text-2xl font-extrabold text-slate-900">{formatNumber(totalProduccionQuintales)} qq</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">En registros seleccionados</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400 block">Ingresos Brutos Cosecha</span>
          <div className="flex items-center gap-2 mt-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <span className="text-2xl font-extrabold text-emerald-700">{formatCurrency(totalIngresosCosecha)}</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Ventas liquidadas</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400 block">Gasto Mano de Obra</span>
          <div className="flex items-center gap-2 mt-2">
            <Clock className="w-6 h-6 text-cacao-700" />
            <span className="text-2xl font-extrabold text-slate-900">{formatCurrency(totalGastosManoObra)}</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {totalHoras.toFixed(1)}h pagadas/pend. | <strong className="text-purple-700">{totalHorasFamiliares.toFixed(1)}h fam. ($0)</strong>
          </span>
        </div>

        <div className={`p-5 rounded-2xl border shadow-card ${gananciaNetaConsolidada >= 0 ? 'bg-green-50/70 border-green-300' : 'bg-rose-50/70 border-rose-300'}`}>
          <span className="text-xs font-semibold uppercase text-slate-700 block">Rentabilidad Neta</span>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-2xl font-extrabold ${gananciaNetaConsolidada >= 0 ? 'text-green-800' : 'text-rose-800'}`}>
              {formatCurrency(gananciaNetaConsolidada)}
            </span>
          </div>
          <span className="text-xs text-slate-600 mt-1 block">Ingresos menos Costos de Jornales</span>
        </div>
      </div>

      {/* Gráfico de Rentabilidad Comparativa por Cuadra */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Balance Financiero por Cuadra: Ingresos vs Gastos en Mano de Obra
            </h3>
            <p className="text-xs text-slate-500">
              Evaluación del retorno de inversión y margen limpio por parcela
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartDataRentabilidad} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="nombre" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val)), '']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="ingresos" name="Ingresos Cosecha ($)" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" name="Inversión en Jornales ($)" fill="#7E573C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="margenNeto" name="Margen Neto ($)" fill="#D97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Matriz de Rentabilidad Detallada por Cuadra */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Matriz de Rendimiento y Rentabilidad por Cuadra</h3>
          <span className="text-xs text-slate-500">{rentabilidadesFiltradas.length} cuadras evaluadas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Cuadra</th>
                <th className="py-3 px-3">Propietario</th>
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-4">Superficie</th>
                <th className="py-3 px-3 text-center">Horas Mano Obra</th>
                <th className="py-3 px-4 text-right">Inversión Jornales</th>
                <th className="py-3 px-4 text-center">Cosecha Total</th>
                <th className="py-3 px-3 text-center">Rendimiento (qq/ha)</th>
                <th className="py-3 px-4 text-right">Ingresos Brutos</th>
                <th className="py-3 px-4 text-right">Ganancia Neta</th>
                <th className="py-3 px-3 text-center">Rentabilidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rentabilidadesFiltradas.map((r) => {
                const roi = r.gastosManoObra > 0 ? (r.gananciaNeta / r.gastosManoObra) * 100 : 0;
                const prop = getPropietarioById(r.cuadra.propietarioId);

                return (
                  <tr key={r.cuadra.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{r.cuadra.nombre}</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-700">{prop?.nombre || '—'}</td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.cuadra.tipoPropiedad === 'propia'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.cuadra.tipoPropiedad === 'propia' ? 'Propia' : 'Tercero'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{formatArea(r.cuadra.tamanoM2)}</td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-700">{r.totalHoras} hrs</td>
                    <td className="py-3.5 px-4 text-right text-rose-700 font-semibold">
                      {formatCurrency(r.gastosManoObra)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-amber-900">
                      {r.totalQuintalesCosechados} qq
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-emerald-800 bg-emerald-50/60">
                      {r.rendimientoPorHectarea} qq/ha
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(r.ingresosGenerados)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">
                      {formatCurrency(r.gananciaNeta)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.gananciaNeta >= 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {r.gananciaNeta >= 0 ? `+${roi.toFixed(0)}% ROI` : 'Déficit'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
