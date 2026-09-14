import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { StatCard } from './StatCard';
import {
  Trees,
  Maximize2,
  Users,
  CheckCircle2,
  Clock,
  DollarSign,
  Grape,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Building2,
  HeartHandshake,
  Filter,
  Layers,
} from 'lucide-react';
import { formatCurrency, formatNumber, formatArea, formatDate } from '../../utils/formatters';
import { computeDashboardStats } from '../../utils/calculations';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

export const DashboardView: React.FC = () => {
  const {
    propietarios,
    cuadras,
    trabajadores,
    tiposTrabajo,
    jornadas,
    vinculaciones,
    rentabilidades,
    setActiveView,
    getCuadraById,
    getTrabajadorById,
    getTipoTrabajoById,
    getPropietarioById,
  } = useFarm();

  const { user } = useAuth();
  const [filtroPropietario, setFiltroPropietario] = useState<string>('todos');
  const [filtroTipoPropiedad, setFiltroTipoPropiedad] = useState<string>('todos');

  // Cálculo dinámico de estadísticas con filtros independientes
  const stats = useMemo(() => {
    return computeDashboardStats(
      propietarios,
      cuadras,
      trabajadores,
      jornadas,
      filtroPropietario,
      filtroTipoPropiedad
    );
  }, [propietarios, cuadras, trabajadores, jornadas, filtroPropietario, filtroTipoPropiedad]);

  // Cuadras visibles según filtros
  const cuadrasVisibles = useMemo(() => {
    return cuadras.filter((c) => {
      if (filtroPropietario !== 'todos' && c.propietarioId !== filtroPropietario) return false;
      if (filtroTipoPropiedad !== 'todos' && c.tipoPropiedad !== filtroTipoPropiedad) return false;
      return true;
    });
  }, [cuadras, filtroPropietario, filtroTipoPropiedad]);

  const cuadrasIdsVisibles = useMemo(() => new Set(cuadrasVisibles.map((c) => c.id)), [cuadrasVisibles]);

  // Rentabilidades filtradas para los gráficos
  const rentabilidadesVisibles = useMemo(() => {
    return rentabilidades.filter((r) => cuadrasIdsVisibles.has(r.cuadra.id));
  }, [rentabilidades, cuadrasIdsVisibles]);

  // Data for Charts:
  // 1. Producción por Cuadra (Quintales)
  const dataProduccionCuadra = rentabilidadesVisibles.map((r) => ({
    nombre: r.cuadra.nombre.split(' - ')[0],
    quintales: r.totalQuintalesCosechados,
    ingresos: r.ingresosGenerados,
    gastosJornal: r.gastosManoObra,
    margenNeto: r.gananciaNeta,
  }));

  // 2. Trabajos realizados por tipo en cuadras visibles
  const tipoCounts: Record<string, number> = {};
  vinculaciones
    .filter((v) => (v.cuadraId && cuadrasIdsVisibles.has(v.cuadraId)) || v.propiedades?.some((p) => cuadrasIdsVisibles.has(p.cuadraId)))
    .forEach((v) => {
      const tipo = getTipoTrabajoById(v.tipoTrabajoId)?.nombre || 'Otro';
      tipoCounts[tipo] = (tipoCounts[tipo] || 0) + 1;
    });

  const COLORS = ['#8A5233', '#16A34A', '#D97706', '#2563EB', '#9333EA', '#0D9488', '#EA580C', '#4F46E5'];

  const dataTiposTrabajo = Object.keys(tipoCounts).map((tipo, idx) => ({
    name: tipo,
    value: tipoCounts[tipo],
    color: COLORS[idx % COLORS.length],
  }));

  // 3. Producción y Evolución Temporal calculada dinámicamente de las jornadas reales
  const dataEvolucion = useMemo(() => {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const map = new Map<string, { periodo: string; timestamp: number; quintales: number; ingresos: number; jornales: number }>();

    vinculaciones
      .filter((v) => (v.cuadraId && cuadrasIdsVisibles.has(v.cuadraId)) || v.propiedades?.some((p) => cuadrasIdsVisibles.has(p.cuadraId)))
      .forEach((v) => {
        if (!v.fecha) return;
        const d = new Date(v.fecha.includes('T') ? v.fecha : v.fecha + 'T00:00:00');
        if (isNaN(d.getTime())) return;
        const year = d.getFullYear();
        const month = d.getMonth();
        const key = `${year}-${String(month + 1).padStart(2, '0')}`;
        const label = `${monthNames[month]} ${year}`;

        if (!map.has(key)) {
          map.set(key, { periodo: label, timestamp: d.getTime(), quintales: 0, ingresos: 0, jornales: 0 });
        }
        const item = map.get(key)!;
        if (v.resultado?.esCosecha) {
          item.quintales += Number(v.resultado.cantidadCosechada || 0);
          item.ingresos += Number(v.resultado.ingresoGenerado || 0);
        }
        item.jornales += Number(v.totalPago || 0);
      });

    const sorted = Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, val]) => ({
        periodo: val.periodo,
        quintales: Math.round(val.quintales * 100) / 100,
        ingresos: Math.round(val.ingresos * 100) / 100,
        jornales: Math.round(val.jornales * 100) / 100,
      }));

    if (sorted.length === 0) {
      const now = new Date();
      return [{
        periodo: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
        quintales: 0,
        ingresos: 0,
        jornales: 0,
      }];
    }
    return sorted;
  }, [vinculaciones, cuadrasIdsVisibles]);

  const propietarioSeleccionado = propietarios.find(p => p.id === filtroPropietario);
  const ultimasVinculaciones = vinculaciones
    .filter((v) => (v.cuadraId && cuadrasIdsVisibles.has(v.cuadraId)) || v.propiedades?.some((p) => cuadrasIdsVisibles.has(p.cuadraId)))
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      {/* Banner de Bienvenida y Estado General */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden border border-emerald-900/30">
        <div className="absolute -right-8 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold backdrop-blur-xs border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Operación Agrícola Activa — Zafra 2026</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Buenos días, {user?.nombre || 'Mayra'} 👋
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setActiveView('vinculacion')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-sm font-bold transition shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>+ Registrar Jornada</span>
            </button>
            <button
              onClick={() => setActiveView('resultados')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-white text-sm font-bold transition shadow-md shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Ver Cosechas & Resultados</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Filtros del Dashboard */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-cacao-600" />
            <span>Filtrar Dashboard:</span>
          </div>

          {/* Filtro Propietario */}
          <select
            value={filtroPropietario}
            onChange={(e) => setFiltroPropietario(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-harvest-500"
          >
            <option value="todos">Todos los Propietarios ({propietarios.length})</option>
            {propietarios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.identificacion})
              </option>
            ))}
          </select>

          {/* Filtro Tipo de Propiedad */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
            <button
              type="button"
              onClick={() => setFiltroTipoPropiedad('todos')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filtroTipoPropiedad === 'todos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({cuadras.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipoPropiedad('propia')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filtroTipoPropiedad === 'propia'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mis Terrenos ({cuadras.filter(c => c.tipoPropiedad === 'propia').length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipoPropiedad('tercero')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filtroTipoPropiedad === 'tercero'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Terceros ({cuadras.filter(c => c.tipoPropiedad === 'tercero').length})
            </button>
          </div>
        </div>

        {(filtroPropietario !== 'todos' || filtroTipoPropiedad !== 'todos') && (
          <button
            onClick={() => {
              setFiltroPropietario('todos');
              setFiltroTipoPropiedad('todos');
            }}
            className="text-xs font-semibold text-cacao-700 hover:text-cacao-900 underline"
          >
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* 1. Tarjetas de Indicadores Principales (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Propietarios & Tierras"
          value={stats.totalPropietarios}
          subtitle={`${stats.totalCuadrasPropias} propias | ${stats.totalCuadrasTerceros} de terceros`}
          icon={Building2}
          color="cacao"
          badge={`${stats.totalCuadras} cuadras`}
          onClick={() => setActiveView('propietarios')}
        />
        <StatCard
          title="Terreno Registrado"
          value={`${formatNumber(stats.totalM2)} m²`}
          subtitle={`Equivalente a ${(stats.totalM2 / 10000).toFixed(2)} hectáreas`}
          icon={Maximize2}
          color="emerald"
          badge={`${stats.totalCuadras} parcelas`}
          onClick={() => setActiveView('cuadras')}
        />
        <StatCard
          title="Talento Humano"
          value={stats.totalTrabajadores}
          subtitle={`${stats.totalTrabajadoresFamiliares} familiar(es) | ${stats.totalHorasFamiliares.toFixed(1)}h aportadas`}
          icon={Users}
          color="blue"
          badge={`${stats.totalHorasTrabajadas.toFixed(1)}h totales`}
          onClick={() => setActiveView('trabajadores')}
        />
        <StatCard
          title="Trabajos Registrados"
          value={stats.trabajosRealizados + stats.trabajosPendientes}
          subtitle={`${stats.trabajosRealizados} realizados | ${stats.trabajosPendientes} pendientes`}
          icon={CheckCircle2}
          color="purple"
          badge="Bitácora"
          onClick={() => setActiveView('vinculacion')}
        />
      </div>

      {/* 2. Tarjetas Financieras y de Cosecha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Producción Cosechada"
          value={`${formatNumber(stats.produccionTotalQuintales)} qq`}
          subtitle="Cacao Nacional & CCN-51 acumulado"
          icon={Grape}
          color="amber"
          badge="Zafra actual"
          onClick={() => setActiveView('resultados')}
        />
        <StatCard
          title="Ingresos por Cosecha"
          value={formatCurrency(stats.ingresosCosecha)}
          subtitle="Ventas registradas en finca"
          icon={TrendingUp}
          color="emerald"
          badge="Ingreso Bruto"
          onClick={() => setActiveView('resultados')}
        />
        <StatCard
          title="Pagado a Trabajadores"
          value={formatCurrency(stats.totalPagadoTrabajadores)}
          subtitle={`Pendiente de pago: ${formatCurrency(stats.totalPendientePago)}`}
          icon={DollarSign}
          color="cacao"
          badge="Mano de obra"
          onClick={() => setActiveView('pagos')}
        />
        <StatCard
          title="Ganancia Neta Finca"
          value={formatCurrency(stats.balanceNetoFinca)}
          subtitle="Ingresos cosecha menos costos totales"
          icon={DollarSign}
          color={stats.balanceNetoFinca >= 0 ? 'emerald' : 'red'}
          badge="Margen Operativo"
          onClick={() => setActiveView('reportes')}
        />
      </div>

      {/* Alertas Urgentes si existen materiales requeridos o pagos pendientes */}
      {(stats.materialesRequeridosUrgentes.length > 0 || stats.totalPendientePago > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.materialesRequeridosUrgentes.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    Materiales Requeridos para Próximos Trabajos
                  </h4>
                  <p className="text-xs text-amber-800 mt-1">
                    Hay <strong>{stats.materialesRequeridosUrgentes.length} insumos solicitados</strong> por
                    los trabajadores (ej. gasolina, fertilizantes, insumos de poda).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveView('resultados')}
                className="text-xs font-bold text-amber-900 hover:text-amber-700 underline shrink-0"
              >
                Ver Insumos
              </button>
            </div>
          )}

          {stats.totalPendientePago > 0 && (
            <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                    Jornales Pendientes de Liquidación
                  </h4>
                  <p className="text-xs text-blue-800 mt-1">
                    Monto total por pagar: <strong>{formatCurrency(stats.totalPendientePago)}</strong> a
                    trabajadores agrícolas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveView('pagos')}
                className="text-xs font-bold text-blue-900 hover:text-blue-700 underline shrink-0"
              >
                Liquidar Nómina
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Gráficos Interactivos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Producción de Cacao e Ingresos por Cuadra (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Producción de Cacao por Cuadra (Quintales)
              </h3>
              <p className="text-xs text-slate-500">
                Comparativo de volumen cosechado e ingresos generados por parcela
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 self-start sm:self-auto">
              Zafra 2026
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataProduccionCuadra} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="nombre" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    if (name === 'quintales') return [`${value} qq`, 'Cosecha'];
                    return [formatCurrency(Number(value)), 'Ingresos'];
                  }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="quintales" fill="#D97706" name="Cosecha (Quintales)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Distribución de Trabajos por Tipo (1 col) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Labores Agrícolas</h3>
                <p className="text-xs text-slate-500">Distribución de trabajos por tipo</p>
              </div>
            </div>

            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataTiposTrabajo}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {dataTiposTrabajo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val} registros`, 'Actividades']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
            {dataTiposTrabajo.slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}:</span>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Gráfico de Evolución y Gastos vs Ingresos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolución de Cosecha */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Evolución de Producción (qq)</h3>
              <p className="text-xs text-slate-500">Histórico de quintales de cacao cosechados</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataEvolucion} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCacao" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#15803D" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#15803D" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: any) => [`${val} quintales`, 'Producción']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="quintales" stroke="#15803D" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCacao)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comparativo Financiero: Ingresos vs Pagos Mano de Obra */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Ingresos vs. Gastos en Jornales</h3>
              <p className="text-xs text-slate-500">Relación de ventas de cacao frente a pago de trabajadores</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataEvolucion} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), '']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="ingresos" name="Ingresos Cosecha ($)" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="jornales" name="Pago Trabajadores ($)" fill="#7E573C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Tabla de Actividades y Jornadas Recientes */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Últimas Actividades Registradas</h3>
            <p className="text-xs text-slate-500">Bitácora reciente de jornales y labores en cuadras</p>
          </div>
          <button
            onClick={() => setActiveView('vinculacion')}
            className="text-xs font-bold text-cacao-700 hover:text-cacao-900 flex items-center gap-1"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Cuadra</th>
                <th className="py-3 px-4">Trabajador</th>
                <th className="py-3 px-4">Labor</th>
                <th className="py-3 px-4">Período / Horas</th>
                <th className="py-3 px-4 text-right">Pago</th>
                <th className="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ultimasVinculaciones.map((v) => {
                const cid = v.cuadraId || v.propiedades?.[0]?.cuadraId || '';
                const cuadra = getCuadraById(cid);
                const trabNombres = v.trabajadores && v.trabajadores.length > 0
                  ? v.trabajadores.map(t => t.nombreTrabajador || getTrabajadorById(t.trabajadorId)?.nombreCompleto).filter(Boolean).join(', ')
                  : (getTrabajadorById(v.trabajadorId || '')?.nombreCompleto || 'Equipo');
                const tipo = getTipoTrabajoById(v.tipoTrabajoId);
                const fechaTxt = v.fecha || v.fechaInicio || '';

                return (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">{v.codigo}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{cuadra?.nombre || 'Cuadra'}</td>
                    <td className="py-3.5 px-4 text-slate-700">{trabNombres}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cacao-50 text-cacao-800 border border-cacao-200/60">
                        {tipo?.nombre || 'Trabajo'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {v.esAgrupada && v.fechaFin ? (
                        <span>
                          {formatDate(fechaTxt)} al {formatDate(v.fechaFin)} ({v.totalHoras}h)
                        </span>
                      ) : (
                        <span>
                          {formatDate(fechaTxt)} ({v.totalHoras}h)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(v.pagoTotal ?? v.totalPago ?? 0)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.estadoPago === 'pagado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {v.estadoPago === 'pagado' ? 'Liquidado' : 'Pendiente'}
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
