import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { ReciboModal } from './ReciboModal';
import { FiltroBar } from '../common/FiltroBar';
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle2,
  FileText,
  Building2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { FiltrosFinca } from '../../types';

export const PagosView: React.FC = () => {
  const {
    jornadas,
    cuadras,
    propietarios,
    trabajadores,
    tiposTrabajo,
    marcarPagoTrabajador,
    marcarPagosEnLote,
    getCuadraById,
    getTrabajadorById,
    getTipoTrabajoById,
    getPropietarioById,
  } = useFarm();

  const { confirm, success } = useToast();

  const [filtros, setFiltros] = useState<FiltrosFinca>({
    propietarioId: 'todos',
    tipoPropiedad: 'todos',
    cuadraId: 'todos',
    trabajadorId: 'todos',
    tipoTrabajoId: 'todos',
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
      trabajadorId: 'todos',
      tipoTrabajoId: 'todos',
      estadoPago: 'todos',
      searchTerm: '',
    });
  };

  const [selectedJtIds, setSelectedJtIds] = useState<string[]>([]);
  const [reciboModalVinc, setReciboModalVinc] = useState<any | null>(null);

  // Aplanar todos los registros de trabajadores en las jornadas para control de nómina individual
  interface PagoFila {
    jornadaId: string;
    jornadaCodigo: string;
    fecha: string;
    propietarioId: string;
    cuadraId: string;
    tipoTrabajoId: string;
    jtId: string;
    trabajadorId: string;
    horaEntrada: string;
    horaSalida: string;
    almuerzoHoras: number;
    horasTrabajadas: number;
    tipoPago: string;
    tarifa: number;
    pagoTotal: number;
    estadoPago: 'pendiente' | 'pagado';
    fechaPago?: string;
    metodoPago?: string;
    comprobantePago?: string;
  }

  const todasFilas: PagoFila[] = [];
  jornadas.forEach((j) => {
    j.trabajadores.forEach((tj) => {
      todasFilas.push({
        jornadaId: j.id,
        jornadaCodigo: j.codigo,
        fecha: j.fecha,
        propietarioId: j.propietarioId || j.propiedades?.[0]?.propietarioId || '',
        cuadraId: j.cuadraId || j.propiedades?.[0]?.cuadraId || '',
        tipoTrabajoId: j.tipoTrabajoId,
        jtId: tj.id,
        trabajadorId: tj.trabajadorId,
        horaEntrada: tj.horaEntrada,
        horaSalida: tj.horaSalida,
        almuerzoHoras: tj.almuerzoHoras,
        horasTrabajadas: tj.horasTrabajadas,
        tipoPago: tj.tipoPago,
        tarifa: tj.tarifa,
        pagoTotal: tj.pagoTotal,
        estadoPago: tj.estadoPago,
        fechaPago: tj.fechaPago,
        metodoPago: tj.metodoPago,
        comprobantePago: tj.comprobantePago,
      });
    });
  });

  const filteredFilas = todasFilas.filter((f) => {
    const cuadra = getCuadraById(f.cuadraId);
    const trab = getTrabajadorById(f.trabajadorId);
    const prop = getPropietarioById(f.propietarioId);

    const matchesSearch =
      !filtros.searchTerm ||
      f.jornadaCodigo.toLowerCase().includes(filtros.searchTerm.toLowerCase()) ||
      (trab && trab.nombreCompleto.toLowerCase().includes(filtros.searchTerm.toLowerCase())) ||
      (cuadra && cuadra.nombre.toLowerCase().includes(filtros.searchTerm.toLowerCase())) ||
      (prop && prop.nombreCompleto.toLowerCase().includes(filtros.searchTerm.toLowerCase()));

    const matchesProp =
      !filtros.propietarioId ||
      filtros.propietarioId === 'todos' ||
      f.propietarioId === filtros.propietarioId;

    const matchesTipoPropiedad =
      !filtros.tipoPropiedad ||
      filtros.tipoPropiedad === 'todos' ||
      cuadra?.tipoPropiedad === filtros.tipoPropiedad;

    const matchesCuadra =
      !filtros.cuadraId ||
      filtros.cuadraId === 'todos' ||
      f.cuadraId === filtros.cuadraId;

    const matchesTrab =
      !filtros.trabajadorId ||
      filtros.trabajadorId === 'todos' ||
      f.trabajadorId === filtros.trabajadorId;

    const matchesEstado =
      !filtros.estadoPago ||
      filtros.estadoPago === 'todos' ||
      f.estadoPago === filtros.estadoPago;

    return matchesSearch && matchesProp && matchesTipoPropiedad && matchesCuadra && matchesTrab && matchesEstado;
  });

  const totalPagado = filteredFilas
    .filter((f) => f.estadoPago === 'pagado')
    .reduce((acc, f) => acc + (f.pagoTotal || 0), 0);

  const totalPendiente = filteredFilas
    .filter((f) => f.estadoPago === 'pendiente')
    .reduce((acc, f) => acc + (f.pagoTotal || 0), 0);

  const totalHoras = filteredFilas.reduce((acc, f) => acc + (f.horasTrabajadas || 0), 0);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pendingIds = filteredFilas
        .filter((f) => f.estadoPago === 'pendiente' && f.pagoTotal > 0)
        .map((f) => f.jtId);
      setSelectedJtIds(pendingIds);
    } else {
      setSelectedJtIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedJtIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePagarEnLote = () => {
    if (selectedJtIds.length === 0) return;
    confirm({
      title: 'Liquidar Pagos en Lote',
      message: `¿Confirmas liquidar ${selectedJtIds.length} jornales seleccionados mediante transferencia/efectivo?`,
      type: 'success',
      confirmText: 'Confirmar Liquidación',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        await marcarPagosEnLote(selectedJtIds, 'Transferencia Bancaria');
        setSelectedJtIds([]);
      },
    });
  };

  const handleLiquidarIndividual = (f: PagoFila) => {
    const trab = getTrabajadorById(f.trabajadorId);
    confirm({
      title: 'Liquidar Jornal Individual',
      message: `¿Confirmas el pago de ${formatCurrency(f.pagoTotal)} a ${trab?.nombreCompleto}?`,
      type: 'success',
      confirmText: 'Registrar Pago',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        await marcarPagoTrabajador(f.jornadaId, f.jtId, 'Efectivo');
      },
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs sm:shadow-card">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-cacao-900 text-amber-300 shrink-0">
            <CreditCard className="w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-lg font-bold text-slate-900 leading-snug">
              Pagos
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-tight">
              Liquidación por horas, jornales familiares en $0 y emisión de comprobantes
            </p>
          </div>
        </div>

        {selectedJtIds.length > 0 && (
          <button
            onClick={handlePagarEnLote}
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow transition w-full sm:w-auto"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Liquidar Selección ({selectedJtIds.length} jornales)</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs sm:shadow-card">
          <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 block tracking-wider">Total Pagado a Trabajadores</span>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-2">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0" />
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900">{formatCurrency(totalPagado)}</span>
          </div>
          <span className="text-[11px] sm:text-xs text-emerald-700 mt-0.5 sm:mt-1 block">Jornales liquidados</span>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-amber-300 shadow-xs sm:shadow-card">
          <span className="text-[10px] sm:text-xs font-semibold uppercase text-amber-800 block tracking-wider">Total Pendiente de Pago</span>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-2">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 shrink-0" />
            <span className="text-xl sm:text-2xl font-extrabold text-amber-900">{formatCurrency(totalPendiente)}</span>
          </div>
          <span className="text-[11px] sm:text-xs text-amber-700 mt-0.5 sm:mt-1 block">Monto por transferir a personal</span>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs sm:shadow-card">
          <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 block tracking-wider">Horas Laboradas Totales</span>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-2">
            <span className="text-xl sm:text-2xl font-extrabold text-cacao-900">{totalHoras} hrs</span>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 block">Incluye aportes familiares ($0)</span>
        </div>
      </div>

      {/* Filtros Paramétricos */}
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
        showTrabajador={true}
        showEstadoPago={true}
        searchPlaceholder="Buscar por código, trabajador o propietario..."
      />

      {/* Tabla de Pagos */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    className="rounded text-cacao-700"
                  />
                </th>
                <th className="py-3 px-3">Jornada</th>
                <th className="py-3 px-4">Trabajador</th>
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-4">Propietario</th>
                <th className="py-3 px-4">Cuadra</th>
                <th className="py-3 px-3 text-center">Horario</th>
                <th className="py-3 px-3 text-center">Horas</th>
                <th className="py-3 px-3 text-right">Tarifa</th>
                <th className="py-3 px-4 text-right">Total a Pagar</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFilas.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    No se encontraron órdenes de pago con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredFilas.map((f) => {
                  const trab = getTrabajadorById(f.trabajadorId);
                  const cuadra = getCuadraById(f.cuadraId);
                  const prop = getPropietarioById(f.propietarioId);
                  const isChecked = selectedJtIds.includes(f.jtId);
                  const isFamiliar = trab?.tipo === 'Familiar';

                  return (
                    <tr key={f.jtId} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-3 text-center">
                        {f.estadoPago === 'pendiente' && f.pagoTotal > 0 && (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleSelectOne(f.jtId)}
                            className="rounded text-cacao-700"
                          />
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-700">{f.jornadaCodigo}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{trab?.nombreCompleto}</td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isFamiliar ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {trab?.tipo || 'Contratado'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{prop?.nombreCompleto}</td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {cuadra?.nombre} ({cuadra?.tipoPropiedad === 'propia' ? 'Propia' : 'Tercero'})
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono text-slate-600">
                        {f.horaEntrada} - {f.horaSalida}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                        {f.horasTrabajadas}h
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-600">
                        {isFamiliar && f.tarifa === 0 ? '$0.00' : formatCurrency(f.tarifa)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        {isFamiliar && f.pagoTotal === 0 ? (
                          <span className="text-amber-800 font-bold">$0.00 (Familiar)</span>
                        ) : (
                          formatCurrency(f.pagoTotal)
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            f.estadoPago === 'pagado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {f.estadoPago === 'pagado' ? 'Pagado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {f.estadoPago === 'pendiente' && f.pagoTotal > 0 && (
                            <button
                              onClick={() => handleLiquidarIndividual(f)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition"
                            >
                              Liquidar
                            </button>
                          )}

                          <button
                            onClick={() => {
                              // Formato adaptado para el comprobante
                              setReciboModalVinc({
                                id: f.jornadaId,
                                codigo: f.jornadaCodigo,
                                cuadraId: f.cuadraId,
                                trabajadorId: f.trabajadorId,
                                tipoTrabajoId: f.tipoTrabajoId,
                                fechaInicio: f.fecha,
                                fechaFin: f.fecha,
                                esAgrupada: false,
                                totalHoras: f.horasTrabajadas,
                                tarifaValor: f.tarifa,
                                tipoTarifa: f.tipoPago,
                                pagoTotal: f.pagoTotal,
                                metodoPago: f.metodoPago,
                                comprobantePago: f.comprobantePago,
                              });
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-cacao-900 transition"
                            title="Ver e Imprimir Comprobante"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Comprobante / Recibo */}
      <ReciboModal
        vinculacion={reciboModalVinc}
        isOpen={Boolean(reciboModalVinc)}
        onClose={() => setReciboModalVinc(null)}
      />
    </div>
  );
};
