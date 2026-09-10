import React from 'react';
import { Trabajador } from '../../types';
import { useFarm } from '../../context/FarmContext';
import { Modal } from '../layout/Modal';
import {
  User,
  Phone,
  CreditCard,
  Clock,
  DollarSign,
  Trees,
  CheckCircle2,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface TrabajadorDetailModalProps {
  trabajador: Trabajador | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TrabajadorDetailModal: React.FC<TrabajadorDetailModalProps> = ({
  trabajador,
  isOpen,
  onClose,
}) => {
  const { vinculaciones, getCuadraById, getTipoTrabajoById } = useFarm();

  if (!trabajador) return null;

  // Filtrar jornadas donde participa este trabajador
  const vincsTrabajador = vinculaciones.filter((v) =>
    v.trabajadores?.some((t) => t.trabajadorId === trabajador.id) || v.trabajadorId === trabajador.id
  );

  // Estadísticas del trabajador calculadas sobre su asignación individual
  let totalHoras = 0;
  let totalPagado = 0;
  let totalPendiente = 0;

  vincsTrabajador.forEach((j) => {
    const asig = j.trabajadores?.find((t) => t.trabajadorId === trabajador.id);
    if (asig) {
      totalHoras += asig.horasTrabajadas || 0;
      if (asig.estadoPago === 'pagado') {
        totalPagado += asig.pagoTotal || 0;
      } else {
        totalPendiente += asig.pagoTotal || 0;
      }
    } else {
      totalHoras += j.totalHoras || 0;
      if (j.estadoPago === 'pagado') {
        totalPagado += j.pagoTotal ?? j.totalPago ?? 0;
      } else {
        totalPendiente += j.pagoTotal ?? j.totalPago ?? 0;
      }
    }
  });

  // Cuadras únicas donde ha trabajado
  const cuadraIds = Array.from(new Set(vincsTrabajador.map((v) => v.cuadraId)));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={trabajador.nombreCompleto}
      subtitle={`Historial Laboral y Jornales Agrícolas — Cédula: ${trabajador.identificacion}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Ficha básica del trabajador */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cacao-700 text-white font-bold text-lg flex items-center justify-center shadow-xs">
                {trabajador.nombreCompleto.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-base">{trabajador.nombreCompleto}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      trabajador.estado === 'activo'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {trabajador.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{trabajador.tipo}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-right">
                <span className="text-[10px] text-slate-400 block font-semibold">TARIFA HORA</span>
                <span className="font-bold text-slate-900">{formatCurrency(trabajador.tarifaHora)}/h</span>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-right">
                <span className="text-[10px] text-slate-400 block font-semibold">TARIFA DÍA</span>
                <span className="font-bold text-slate-900">{formatCurrency(trabajador.tarifaDia)}/día</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-200/80">
            <div className="flex items-center gap-2 text-slate-600">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span><strong>Identificación:</strong> {trabajador.identificacion}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              <span><strong>Teléfono:</strong> {trabajador.telefono || 'No registrado'}</span>
            </div>
          </div>

          {trabajador.observaciones && (
            <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs text-slate-600 italic">
              <strong>Habilidades y observaciones:</strong> {trabajador.observaciones}
            </div>
          )}
        </div>

        {/* Métricas Acumuladas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-cacao-50 rounded-xl p-3 border border-cacao-200">
            <span className="text-[11px] font-semibold text-cacao-800 uppercase block">Horas Acumuladas</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-4 h-4 text-cacao-700" />
              <span className="text-lg font-bold text-cacao-950">{totalHoras} hrs</span>
            </div>
            <span className="text-[10px] text-cacao-600">{vincsTrabajador.length} labores</span>
          </div>

          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase block">Total Cobrado</span>
            <div className="flex items-center gap-1.5 mt-1">
              <DollarSign className="w-4 h-4 text-emerald-700" />
              <span className="text-lg font-bold text-emerald-950">{formatCurrency(totalPagado)}</span>
            </div>
            <span className="text-[10px] text-emerald-600">Liquidado</span>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
            <span className="text-[11px] font-semibold text-amber-800 uppercase block">Por Cobrar</span>
            <div className="flex items-center gap-1.5 mt-1">
              <DollarSign className="w-4 h-4 text-amber-700" />
              <span className="text-lg font-bold text-amber-950">{formatCurrency(totalPendiente)}</span>
            </div>
            <span className="text-[10px] text-amber-600">Pendiente</span>
          </div>

          <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
            <span className="text-[11px] font-semibold text-blue-800 uppercase block">Cuadras Atendidas</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Trees className="w-4 h-4 text-blue-700" />
              <span className="text-lg font-bold text-blue-950">{cuadraIds.length}</span>
            </div>
            <span className="text-[10px] text-blue-600">Lotes trabajados</span>
          </div>
        </div>

        {/* Historial Detallado de Trabajos del Trabajador */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 mb-3">
            <Briefcase className="w-4 h-4 text-cacao-600" />
            <span>Historial de Labores Realizadas ({vincsTrabajador.length})</span>
          </h4>

          {vincsTrabajador.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-6 border border-dashed border-slate-200 rounded-xl">
              Este trabajador aún no tiene labores registradas.
            </p>
          ) : (
            <div className="space-y-3">
              {vincsTrabajador.map((v) => {
                const cid = v.cuadraId || v.propiedades?.[0]?.cuadraId || '';
                const cuadra = getCuadraById(cid);
                const tipo = getTipoTrabajoById(v.tipoTrabajoId);
                const asig = v.trabajadores?.find((t) => t.trabajadorId === trabajador.id);
                const horasIndividual = asig ? asig.horasTrabajadas : (v.totalHoras || 0);
                const pagoIndividual = asig ? asig.pagoTotal : (v.pagoTotal ?? v.totalPago ?? 0);
                const estadoIndividual = asig ? asig.estadoPago : (v.estadoPago || 'pendiente');
                const fechaTxt = v.fecha || v.fechaInicio || '';

                return (
                  <div
                    key={v.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2 hover:border-slate-300 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{cuadra?.nombre}</span>
                        <span className="px-2 py-0.5 rounded-md bg-cacao-100 text-cacao-800 font-semibold text-[11px]">
                          {tipo?.nombre}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">
                          {v.esAgrupada && v.fechaFin
                            ? `${formatDate(fechaTxt)} al ${formatDate(v.fechaFin)}`
                            : formatDate(fechaTxt)}
                        </span>
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {horasIndividual} hrs
                        </span>
                        <span className="font-bold text-emerald-700">
                          {formatCurrency(pagoIndividual)}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            estadoIndividual === 'pagado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {estadoIndividual === 'pagado' ? 'Pagado' : 'Pendiente'}
                        </span>
                      </div>
                    </div>

                    {/* Resultado */}
                    {v.resultado && (
                      <div className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2">
                        {v.resultado.esCosecha ? (
                          <div className="text-amber-900 font-medium">
                            🌾 Cosecha obtenida: <strong>{v.resultado.cantidadCosechada} {v.resultado.unidadMedida}</strong> ({v.resultado.tipoGrano})
                          </div>
                        ) : (
                          <div className="text-slate-700">
                            <strong>Resultado:</strong> {v.resultado.resultadoTexto || 'Labor concluida satisfactoriamente.'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
