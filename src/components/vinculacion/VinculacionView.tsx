import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { Jornada, FiltrosFinca } from '../../types';
import { JornadaFormModal } from './JornadaFormModal';
import { ResultadoModal } from './ResultadoModal';
import { JornadaDetailModal } from './JornadaDetailModal';
import { FiltroBar } from '../common/FiltroBar';
import {
  GitMerge,
  Plus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Edit2,
  Trash2,
  DollarSign,
  Clock,
  Layers,
  Users,
  Building2,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const VinculacionView: React.FC = () => {
  const {
    jornadas,
    cuadras,
    propietarios,
    trabajadores,
    tiposTrabajo,
    deleteJornada,
    marcarPagosEnLote,
    getCuadraById,
    getTrabajadorById,
    getTipoTrabajoById,
    getPropietarioById,
  } = useFarm();

  const { confirm, success } = useToast();

  // Filtros independientes de este módulo
  const [filtros, setFiltros] = useState<FiltrosFinca>({
    propietarioId: 'todos',
    tipoPropiedad: 'todos',
    cuadraId: 'todos',
    tipoTrabajoId: 'todos',
    trabajadorId: 'todos',
    estadoPago: 'todos',
    searchTerm: '',
  });

  const handleFilterChange = (key: keyof FiltrosFinca, value: any) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFiltros({
      propietarioId: 'todos',
      tipoPropiedad: 'todos',
      cuadraId: 'todos',
      tipoTrabajoId: 'todos',
      trabajadorId: 'todos',
      estadoPago: 'todos',
      searchTerm: '',
    });
  };

  // Expanded grouped records state
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    'jorn-1': true,
    'jorn-2': true,
  });

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedJornadaForEdit, setSelectedJornadaForEdit] = useState<Jornada | null>(null);
  const [isResultadoOpen, setIsResultadoOpen] = useState(false);
  const [selectedJornadaForResult, setSelectedJornadaForResult] = useState<Jornada | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedJornadaForDetail, setSelectedJornadaForDetail] = useState<Jornada | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtrado de Jornadas (compatible con jornadas multi-propietario y multi-cuadra)
  const filteredJornadas = jornadas.filter((j) => {
    const cuadra = j.cuadraId ? getCuadraById(j.cuadraId) : undefined;
    const prop = j.propietarioId ? getPropietarioById(j.propietarioId) : undefined;
    const tipo = getTipoTrabajoById(j.tipoTrabajoId);

    // Obtener todos los nombres de propietarios y cuadras involucrados
    const ownersInJornada = j.propiedades?.map((p) => getPropietarioById(p.propietarioId)?.nombreCompleto).filter(Boolean) || [prop?.nombreCompleto];
    const cuadrasInJornada = j.propiedades?.map((p) => getCuadraById(p.cuadraId)?.nombre).filter(Boolean) || [cuadra?.nombre];

    const searchTerm = filtros.searchTerm?.toLowerCase() || '';
    const matchesSearch =
      !searchTerm ||
      j.codigo.toLowerCase().includes(searchTerm) ||
      cuadrasInJornada.some((name) => name?.toLowerCase().includes(searchTerm)) ||
      ownersInJornada.some((name) => name?.toLowerCase().includes(searchTerm)) ||
      (tipo && tipo.nombre.toLowerCase().includes(searchTerm));

    const matchesProp =
      !filtros.propietarioId ||
      filtros.propietarioId === 'todos' ||
      j.propietarioId === filtros.propietarioId ||
      j.propiedades?.some((p) => p.propietarioId === filtros.propietarioId) ||
      j.resultado?.cosechasPorPropietario?.some((cp) => cp.propietarioId === filtros.propietarioId);

    const matchesTipoPropiedad =
      !filtros.tipoPropiedad ||
      filtros.tipoPropiedad === 'todos' ||
      cuadra?.tipoPropiedad === filtros.tipoPropiedad ||
      j.propiedades?.some((p) => getCuadraById(p.cuadraId)?.tipoPropiedad === filtros.tipoPropiedad);

    const matchesCuadra =
      !filtros.cuadraId ||
      filtros.cuadraId === 'todos' ||
      j.cuadraId === filtros.cuadraId ||
      j.propiedades?.some((p) => p.cuadraId === filtros.cuadraId);

    const matchesTipo =
      !filtros.tipoTrabajoId ||
      filtros.tipoTrabajoId === 'todos' ||
      j.tipoTrabajoId === filtros.tipoTrabajoId;

    const matchesTrab =
      !filtros.trabajadorId ||
      filtros.trabajadorId === 'todos' ||
      j.trabajadores.some((tj) => tj.trabajadorId === filtros.trabajadorId);

    return matchesSearch && matchesProp && matchesTipoPropiedad && matchesCuadra && matchesTipo && matchesTrab;
  });

  const handleOpenNew = () => {
    setSelectedJornadaForEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (jorn: Jornada) => {
    setSelectedJornadaForEdit(jorn);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (jorn: Jornada) => {
    setSelectedJornadaForDetail(jorn);
    setIsDetailOpen(true);
  };

  const handleOpenResultados = (jorn: Jornada) => {
    setSelectedJornadaForResult(jorn);
    setIsResultadoOpen(true);
  };

  const handleDelete = (jorn: Jornada) => {
    confirm({
      title: '¿Eliminar esta jornada?',
      message: `¿Estás seguro de eliminar la jornada ${jorn.codigo}? Se eliminarán los registros de horarios y pagos de sus ${jorn.trabajadores.length} trabajador(es).`,
      type: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        await deleteJornada(jorn.id);
      },
    });
  };

  const handleLiquidarJornada = (jorn: Jornada) => {
    const pendingIds = jorn.trabajadores
      .filter((t) => t.estadoPago === 'pendiente' && t.pagoTotal > 0)
      .map((t) => t.id);

    if (pendingIds.length === 0) return;

    confirm({
      title: 'Liquidar Pagos de la Jornada',
      message: `¿Confirmas el pago de ${formatCurrency(jorn.totalPago)} a los ${pendingIds.length} trabajador(es) con jornales pendientes?`,
      type: 'success',
      confirmText: 'Liquidar Pagos',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        await marcarPagosEnLote(pendingIds, 'Efectivo');
      },
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cacao-900 text-amber-300">
            <GitMerge className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Módulo de Vinculación de Trabajo y Jornadas</h2>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cacao-800 hover:bg-cacao-900 text-white text-xs font-bold shadow-xs hover:shadow transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-harvest-400" />
          <span>Registrar Nueva Jornada</span>
        </button>
      </div>

      {/* Barra de Filtros Independiente */}
      <FiltroBar
        filtros={filtros}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
        propietarios={propietarios}
        cuadras={cuadras}
        trabajadores={trabajadores}
        tiposTrabajo={tiposTrabajo}
        showPropietario={true}
        showTipoPropiedad={true}
        showCuadra={true}
        showLabor={true}
        showTrabajador={true}
        searchPlaceholder="Buscar por código, propietario, cuadra o labor..."
      />

      {/* Listado de Jornadas */}
      <div className="space-y-4">
        {filteredJornadas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-xs text-slate-500">No se encontraron jornadas con los filtros aplicados.</p>
          </div>
        ) : (
          filteredJornadas.map((jorn) => {
            const cuadra = jorn.cuadraId ? getCuadraById(jorn.cuadraId) : undefined;
            const prop = jorn.propietarioId ? getPropietarioById(jorn.propietarioId) : undefined;
            const tipo = getTipoTrabajoById(jorn.tipoTrabajoId);
            const isExpanded = expandedIds[jorn.id] ?? false;

            const pendingTrabajadores = jorn.trabajadores.filter((t) => t.estadoPago === 'pendiente' && t.pagoTotal > 0);
            const isFullyPaid = pendingTrabajadores.length === 0;

            // Extraer propietarios y parcelas vinculadas
            const propiedadesDetalle = jorn.propiedades && jorn.propiedades.length > 0
              ? jorn.propiedades
              : [{ id: 'p-def', propietarioId: jorn.propietarioId || '', cuadraId: jorn.cuadraId || '', horasEstimadas: jorn.totalHoras, observaciones: '' }];

            const uniquePropIds = Array.from(new Set(propiedadesDetalle.map((p) => p.propietarioId)));
            const esMultiPropietario = uniquePropIds.length > 1;

            return (
              <div
                key={jorn.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-card transition duration-150 overflow-hidden"
              >
                {/* Cabecera Principal de la Jornada */}
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Datos de la Jornada */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {jorn.codigo}
                        </span>

                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            tipo?.esCosecha
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-cacao-100 text-cacao-900 border border-cacao-200'
                          }`}
                        >
                          {tipo?.nombre || 'Labor'}
                        </span>

                        {esMultiPropietario && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                            <Users className="w-3 h-3" />
                            Multi-Propietario ({uniquePropIds.length} dueños)
                          </span>
                        )}

                        {jorn.esAgrupada && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            <Layers className="w-3 h-3" />
                            Agrupada (Días consecutivos)
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isFullyPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isFullyPaid ? 'Liquidada' : `${pendingTrabajadores.length} Pagos Pendientes`}
                        </span>
                      </div>

                      {/* Título unificado con apertura en modo consulta */}
                      <h3
                        onClick={() => handleOpenDetail(jorn)}
                        className="text-base font-extrabold text-slate-900 tracking-tight flex flex-wrap items-center gap-2 cursor-pointer hover:text-cacao-700 transition"
                        title="Ver detalle de jornada en modo consulta"
                      >
                        <span>{tipo?.nombre}</span>
                        <span className="text-slate-300">—</span>
                        <span className="text-slate-600 font-medium">
                          {jorn.esAgrupada
                            ? `${formatDate(jorn.fecha)} al ${formatDate(jorn.fechaFin)}`
                            : formatDate(jorn.fecha)}
                        </span>
                      </h3>

                      {/* Lista de Propiedades y Cuadras trabajadas */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-cacao-700" />
                          <span>Propiedades trabajadas:</span>
                        </span>
                        {propiedadesDetalle.map((pd, i) => {
                          const pOwner = pd.propietarioId ? getPropietarioById(pd.propietarioId) : undefined;
                          const pCuadra = pd.cuadraId ? getCuadraById(pd.cuadraId) : undefined;
                          return (
                            <span
                              key={pd.id || i}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-800"
                            >
                              <strong className="text-cacao-950">{pOwner?.nombreCompleto.split(' ')[0]}:</strong>
                              <span>{pCuadra?.nombre || 'Cuadra'}</span>
                              <span className="text-[10px] text-slate-400">
                                ({pCuadra?.tipoPropiedad === 'propia' ? 'Propia' : 'Tercero'})
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Resumen numérico y Acciones */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between lg:justify-end gap-3 lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                      {/* Resumen Horas y Monto (Sin duplicación de trabajadores) */}
                      <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 flex sm:block items-center justify-between sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Mano de Obra Jornada
                        </span>
                        <div>
                          <span className="text-base font-extrabold text-slate-900 block sm:inline">
                            {formatCurrency(jorn.totalPago)}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {jorn.totalHoras}h ({jorn.trabajadores.length} pers. compartidos)
                          </span>
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Botón Registrar/Ver Resultados */}
                        <button
                          onClick={() => handleOpenResultados(jorn)}
                          className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs ${
                            jorn.resultado
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-harvest-500 hover:bg-harvest-600 text-cacao-950 shadow-xs'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{jorn.resultado ? 'Resultados' : 'Registrar'}</span>
                        </button>

                        {/* Botón Liquidar si hay pendientes */}
                        {!isFullyPaid && (
                          <button
                            onClick={() => handleLiquidarJornada(jorn)}
                            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs flex items-center justify-center gap-1"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Pagar</span>
                          </button>
                        )}

                        {/* Acciones secundarias */}
                        <div className="flex items-center gap-1 ml-auto sm:ml-0">
                          <button
                            onClick={() => handleOpenDetail(jorn)}
                            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-cacao-800 transition"
                            title="Ver detalle en modo consulta"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(jorn)}
                            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-cacao-800 transition"
                            title="Editar jornada"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(jorn)}
                            className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Eliminar jornada"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resumen del Resultado con Distribución por Propietario */}
                  {jorn.resultado && (
                    <div className="mt-3.5 pt-3 border-t border-slate-100 text-xs">
                      {jorn.resultado.esCosecha ? (
                        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-amber-200/60 pb-2">
                            <div className="space-y-0.5">
                              <span className="font-bold text-amber-950 text-xs block">
                                🌾 Cosecha Total: {jorn.resultado.cantidadCosechada} {jorn.resultado.unidadMedida} ({jorn.resultado.tipoGrano})
                              </span>
                              <span className="text-amber-800 text-[11px]">
                                Ingreso Total: {formatCurrency(jorn.resultado.ingresoGenerado)} • Gastos: {formatCurrency(jorn.resultado.gastosRelacionados)}
                              </span>
                            </div>
                            <div className="sm:text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-500 block">Ganancia Neta Global</span>
                              <span className="text-sm font-black text-emerald-700">
                                {formatCurrency(jorn.resultado.gananciaNeta)}
                              </span>
                            </div>
                          </div>

                          {/* Mini desglose por propietario si existe */}
                          {jorn.resultado.cosechasPorPropietario && jorn.resultado.cosechasPorPropietario.length > 0 && (
                            <div className="pt-1">
                              <span className="text-[10px] font-bold text-amber-900 uppercase block mb-1">
                                Distribución de la Cosecha:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {jorn.resultado.cosechasPorPropietario.map((cp) => {
                                  const d = getPropietarioById(cp.propietarioId);
                                  return (
                                    <div
                                      key={cp.id}
                                      className="bg-white/90 px-3 py-1.5 rounded-lg border border-amber-200 text-[11px] shadow-2xs"
                                    >
                                      <strong className="text-slate-900">{d?.nombreCompleto.split(' ')[0]}:</strong>{' '}
                                      <span className="font-bold text-amber-900">{cp.cantidad} {cp.unidad}</span>{' '}
                                      <span className="text-slate-400">|</span>{' '}
                                      <span className="text-slate-600 font-medium">Ing: {formatCurrency(cp.ingresoGenerado)}</span>{' '}
                                      <span className="text-slate-400">|</span>{' '}
                                      <span className="text-emerald-700 font-black">Neto: {formatCurrency(cp.gananciaNeta)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                          <p className="text-slate-800 font-medium">
                            <strong>Resultado:</strong> {jorn.resultado.resultadoTexto}
                          </p>
                          {jorn.resultado.problemasEncontrados && (
                            <p className="text-[11px] text-amber-800">
                              <strong>Atención:</strong> {jorn.resultado.problemasEncontrados}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Toggle para Desglose de Trabajadores y Horarios */}
                  <div className="mt-3 pt-2">
                    <button
                      onClick={() => toggleExpand(jorn.id)}
                      className="text-xs font-bold text-cacao-700 hover:text-cacao-950 flex items-center gap-1.5 transition"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      <span>
                        {isExpanded
                          ? 'Ocultar desglose de trabajadores'
                          : `Ver desglose de personal (${jorn.trabajadores.length} trabajadores participantes)`}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Vista Desplegable: Detalle de Trabajadores de la Jornada */}
                {isExpanded && (
                  <div className="bg-slate-50/90 border-t border-slate-200 p-3 sm:p-5">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
                      Personal, Horarios de Entrada/Salida, Almuerzos y Pagos:
                    </span>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                      {/* VISTA MÓVIL: Tarjetas individuales para cada trabajador (Evita scroll horizontal y cortes) */}
                      <div className="md:hidden divide-y divide-slate-100 p-2 space-y-2.5">
                        {jorn.trabajadores.map((tj) => {
                          const trab = getTrabajadorById(tj.trabajadorId);
                          const isFamiliar = trab?.tipo === 'Familiar';

                          return (
                            <div key={tj.id} className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80 space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                                    {(trab?.nombreCompleto || 'T').charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-900 block text-xs truncate">
                                      {trab?.nombreCompleto || 'Trabajador'}
                                    </span>
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                                        isFamiliar ? 'bg-amber-100 text-amber-900' : 'bg-slate-200/70 text-slate-700'
                                      }`}
                                    >
                                      {trab?.tipo || 'Contratado'}
                                    </span>
                                  </div>
                                </div>

                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                    tj.estadoPago === 'pagado'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {tj.estadoPago === 'pagado' ? 'Pagado' : 'Pendiente'}
                                </span>
                              </div>

                              {tj.observaciones && (
                                <p className="text-[11px] text-slate-500 italic bg-white/80 p-1.5 rounded-lg border border-slate-100">
                                  {tj.observaciones}
                                </p>
                              )}

                              {/* Grilla compacta de datos de jornada */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-white p-2.5 rounded-xl border border-slate-200/60">
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-semibold">Horario</span>
                                  <span className="font-mono font-medium text-slate-700 text-[11px]">
                                    {tj.horaEntrada} - {tj.horaSalida}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-semibold">Almuerzo</span>
                                  <span className="text-slate-700 font-medium text-[11px]">{tj.almuerzoHoras} h</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-semibold">Horas netas</span>
                                  <span className="font-bold text-cacao-950 text-[11px]">{tj.horasTrabajadas} h</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-semibold">Forma pago</span>
                                  <span className="text-slate-700 text-[11px]">
                                    {tj.tipoPago === 'por_hora'
                                      ? 'Por hora'
                                      : tj.tipoPago === 'por_jornada'
                                      ? 'Por jornada'
                                      : tj.tipoPago === 'sin_pago'
                                      ? 'Sin pago ($0)'
                                      : 'Fijo'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-semibold">Tarifa</span>
                                  <span className="text-slate-700 text-[11px]">
                                    {isFamiliar && tj.tarifa === 0 ? '$0.00' : formatCurrency(tj.tarifa)}
                                  </span>
                                </div>
                                <div className="border-t sm:border-t-0 pt-1 sm:pt-0 col-span-2 sm:col-span-1">
                                  <span className="text-[10px] text-emerald-800 font-bold block">A Pagar</span>
                                  <span className="font-black text-emerald-700 text-sm">
                                    {isFamiliar && tj.pagoTotal === 0 ? '$0.00' : formatCurrency(tj.pagoTotal)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* VISTA ESCRITORIO: Tabla tradicional con overflow-x-auto */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">Trabajador</th>
                              <th className="py-2.5 px-3">Tipo</th>
                              <th className="py-2.5 px-2 text-center">Horario</th>
                              <th className="py-2.5 px-2 text-center">Almuerzo</th>
                              <th className="py-2.5 px-2 text-center">Horas</th>
                              <th className="py-2.5 px-2">Forma Pago</th>
                              <th className="py-2.5 px-2 text-right">Tarifa</th>
                              <th className="py-2.5 px-3 text-right">Total a Pagar</th>
                              <th className="py-2.5 px-3 text-center">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {jorn.trabajadores.map((tj) => {
                              const trab = getTrabajadorById(tj.trabajadorId);
                              const isFamiliar = trab?.tipo === 'Familiar';

                              return (
                                <tr key={tj.id} className="hover:bg-slate-50/70 transition">
                                  <td className="py-2.5 px-3 font-bold text-slate-900">
                                    {trab?.nombreCompleto}
                                    {tj.observaciones && (
                                      <span className="block text-[10px] text-slate-400 font-normal">
                                        {tj.observaciones}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        isFamiliar
                                          ? 'bg-amber-100 text-amber-900'
                                          : 'bg-slate-100 text-slate-700'
                                      }`}
                                    >
                                      {trab?.tipo || 'Contratado'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                                    {tj.horaEntrada} - {tj.horaSalida}
                                  </td>
                                  <td className="py-2.5 px-2 text-center text-slate-500">
                                    {tj.almuerzoHoras} h
                                  </td>
                                  <td className="py-2.5 px-2 text-center font-bold text-cacao-900">
                                    {tj.horasTrabajadas} h
                                  </td>
                                  <td className="py-2.5 px-2 text-slate-600">
                                    {tj.tipoPago === 'por_hora'
                                      ? 'Por hora'
                                      : tj.tipoPago === 'por_jornada'
                                      ? 'Por jornada'
                                      : tj.tipoPago === 'sin_pago'
                                      ? 'Sin pago ($0)'
                                      : 'Fijo'}
                                  </td>
                                  <td className="py-2.5 px-2 text-right text-slate-700">
                                    {isFamiliar && tj.tarifa === 0 ? '$0.00' : formatCurrency(tj.tarifa)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">
                                    {isFamiliar && tj.pagoTotal === 0 ? '$0.00' : formatCurrency(tj.pagoTotal)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span
                                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        tj.estadoPago === 'pagado'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {tj.estadoPago === 'pagado' ? 'Pagado' : 'Pendiente'}
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
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modales */}
      <JornadaFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        jornadaToEdit={selectedJornadaForEdit}
      />
      <ResultadoModal
        isOpen={isResultadoOpen}
        onClose={() => setIsResultadoOpen(false)}
        vinculacion={selectedJornadaForResult as any}
      />
      <JornadaDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        jornada={selectedJornadaForDetail}
        onEdit={() => {
          setSelectedJornadaForEdit(selectedJornadaForDetail);
          setIsFormOpen(true);
        }}
        onOpenResultados={() => {
          setSelectedJornadaForResult(selectedJornadaForDetail);
          setIsResultadoOpen(true);
        }}
      />
    </div>
  );
};
