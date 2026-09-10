import React from 'react';
import { Jornada } from '../../types';
import { useFarm } from '../../context/FarmContext';
import { Modal } from '../layout/Modal';
import {
  Calendar,
  Building2,
  Users,
  Briefcase,
  Edit2,
  Sparkles,
  Clock,
  DollarSign,
  Package,
  CheckCircle2,
  Layers,
  Fuel,
  Wrench,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface JornadaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  jornada: Jornada | null;
  onEdit: () => void;
  onOpenResultados: () => void;
}

export const JornadaDetailModal: React.FC<JornadaDetailModalProps> = ({
  isOpen,
  onClose,
  jornada,
  onEdit,
  onOpenResultados,
}) => {
  const { getCuadraById, getPropietarioById, getTrabajadorById, getTipoTrabajoById } = useFarm();

  if (!jornada) return null;

  const tipo = getTipoTrabajoById(jornada.tipoTrabajoId);
  const esCosecha = tipo?.esCosecha ?? false;

  const propiedadesDetalle = jornada.propiedades && jornada.propiedades.length > 0
    ? jornada.propiedades
    : [{ id: 'p-def', propietarioId: jornada.propietarioId || '', cuadraId: jornada.cuadraId || '', horasEstimadas: jornada.totalHoras, observaciones: '' }];

  const pendingTrabajadores = jornada.trabajadores.filter((t) => t.estadoPago === 'pendiente' && t.pagoTotal > 0);
  const isFullyPaid = pendingTrabajadores.length === 0;

  // Insumos utilizados y requeridos
  const insumosUtilizados = jornada.insumosUtilizados || jornada.resultado?.insumosUtilizados || [];
  const insumosRequeridos = jornada.insumosRequeridos || jornada.resultado?.insumosRequeridos || [];

  const costoManoObra = jornada.totalPago ?? 0;
  const costoInsumos = jornada.costoInsumos ?? jornada.resultado?.costoInsumos ?? 0;
  const costoTotal = jornada.costoTotal ?? (costoManoObra + costoInsumos);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Jornada Agrícola ${jornada.codigo}`}
      subtitle={`${tipo?.nombre || 'Labor'} • ${jornada.esAgrupada ? `${formatDate(jornada.fecha)} al ${formatDate(jornada.fechaFin || jornada.fecha)}` : formatDate(jornada.fecha)}`}
      maxWidth="3xl"
    >
      <div className="space-y-4 text-xs">
        {/* Cabecera con Chips y Resumen Financiero */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-md">
                {jornada.codigo}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                esCosecha ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-cacao-100 text-cacao-900 border border-cacao-200'
              }`}>
                {tipo?.nombre}
              </span>
              {jornada.esAgrupada && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Agrupada ({formatDate(jornada.fecha)} al {formatDate(jornada.fechaFin || jornada.fecha)})
                </span>
              )}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isFullyPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isFullyPaid ? 'Liquidada' : `${pendingTrabajadores.length} Pagos Pendientes`}
              </span>
            </div>

            <p className="text-slate-600 text-xs">
              Fecha: <strong>{formatDate(jornada.fecha)}</strong> • Horas totales invertidas:{' '}
              <strong>{jornada.totalHoras} h</strong> (incluye {jornada.totalHorasFamiliares || 0}h familiares)
            </p>
          </div>

          <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-right shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Costo Total Jornada</span>
            <span className="text-lg font-black text-slate-900">{formatCurrency(costoTotal)}</span>
            <div className="text-[10px] text-slate-500 flex justify-end gap-2 mt-0.5">
              <span>Mano obra: {formatCurrency(costoManoObra)}</span>
              {costoInsumos > 0 && <span>• Insumos: {formatCurrency(costoInsumos)}</span>}
            </div>
          </div>
        </div>

        {/* Propiedades y Cuadras Vinculadas */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-cacao-700" />
            <span>Propiedades & Cuadras Vinculadas ({propiedadesDetalle.length})</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {propiedadesDetalle.map((pd, i) => {
              const pOwner = pd.propietarioId ? getPropietarioById(pd.propietarioId) : undefined;
              const pCuadra = pd.cuadraId ? getCuadraById(pd.cuadraId) : undefined;
              return (
                <div
                  key={pd.id || i}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-800"
                >
                  <strong className="text-cacao-950">{pOwner?.nombreCompleto || 'Propietario'}:</strong>{' '}
                  <span>{pCuadra?.nombre || 'Cuadra'}</span>{' '}
                  <span className="text-[10px] text-slate-400">
                    ({pCuadra?.tipoPropiedad === 'propia' ? 'Propia' : 'Tercero'})
                  </span>
                  {pd.observaciones && (
                    <span className="block text-[10px] text-slate-500 italic mt-0.5">
                      {pd.observaciones}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Trabajadores Participantes */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Personal Participante ({jornada.trabajadores.length})</span>
            </span>
            <span className="text-[11px] text-slate-500 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
              Mano de obra: <strong className="text-emerald-700">{formatCurrency(costoManoObra)}</strong>
            </span>
          </div>

          {/* VISTA MÓVIL: Tarjetas de Trabajadores */}
          <div className="md:hidden divide-y divide-slate-100 p-2 space-y-2">
            {jornada.trabajadores.map((tj) => {
              const trab = getTrabajadorById(tj.trabajadorId);
              const isFamiliar = trab?.tipo === 'Familiar';
              return (
                <div key={tj.id} className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                        {(trab?.nombreCompleto || 'T').charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">
                          {trab?.nombreCompleto || 'Trabajador'}
                        </span>
                        {isFamiliar && (
                          <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-900">
                            Familiar ($0)
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      tj.estadoPago === 'pagado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {tj.estadoPago === 'pagado' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Horario & Tiempo</span>
                      <span className="text-slate-700 font-medium">
                        {tj.horaEntrada} - {tj.horaSalida} ({tj.horasTrabajadas}h)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-semibold">Liquidación</span>
                      <span className="font-black text-emerald-700 text-xs">
                        {formatCurrency(tj.pagoTotal)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {tj.tipoPago === 'por_hora' ? `${formatCurrency(tj.tarifa)}/h` : tj.tipoPago === 'por_jornada' ? `${formatCurrency(tj.tarifa)}/día` : 'Fijo'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* VISTA DESKTOP: Tabla */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3.5">Trabajador</th>
                  <th className="py-2.5 px-2 text-center">Horario</th>
                  <th className="py-2.5 px-2 text-center">Horas</th>
                  <th className="py-2.5 px-2">Tipo Pago</th>
                  <th className="py-2.5 px-2 text-right">Tarifa</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3.5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jornada.trabajadores.map((tj) => {
                  const trab = getTrabajadorById(tj.trabajadorId);
                  const isFamiliar = trab?.tipo === 'Familiar';
                  return (
                    <tr key={tj.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3.5 font-semibold text-slate-800">
                        {trab?.nombreCompleto || 'Trabajador'}
                        {isFamiliar && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-purple-100 text-purple-900">
                            Familiar
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-600 font-mono text-[11px]">
                        {tj.horaEntrada} - {tj.horaSalida}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-900">
                        {tj.horasTrabajadas}h
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 text-[11px]">
                        {tj.tipoPago === 'por_hora' ? 'Por hora' : tj.tipoPago === 'por_jornada' ? 'Por jornada' : 'Fijo / Sin pago'}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-700">
                        {formatCurrency(tj.tarifa)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        {formatCurrency(tj.pagoTotal)}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tj.estadoPago === 'pagado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
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

        {/* Insumos Utilizados en esta Jornada */}
        {insumosUtilizados.length > 0 && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Package className="w-3.5 h-3.5 text-cacao-700" />
                <span>Insumos & Herramientas Utilizados ({insumosUtilizados.length})</span>
              </span>
              <span className="text-[11px] font-bold text-cacao-900">
                Gasto Insumos: {formatCurrency(costoInsumos)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {insumosUtilizados.map((ins, i) => (
                <div key={ins.id || i} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {ins.categoria === 'Combustibles' ? '⛽' : ins.categoria === 'Herramientas' ? '🔧' : '📦'}{' '}
                      {ins.nombreInsumo}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Cantidad: <strong>{ins.cantidad} {ins.unidad}</strong>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block text-xs">
                      {formatCurrency(ins.costoTotal || 0)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {ins.costoUnitario && ins.costoUnitario > 0 ? `${formatCurrency(ins.costoUnitario)}/${ins.unidad}` : 'Sin costo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumen del Resultado Registrado */}
        {jornada.resultado ? (
          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cacao-950 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Resultados Registrados</span>
              </span>
              <button
                onClick={onOpenResultados}
                className="text-[11px] font-bold text-cacao-800 hover:text-cacao-950 underline"
              >
                Ver reporte completo
              </button>
            </div>
            {jornada.resultado.esCosecha ? (
              <p className="text-slate-800 text-xs">
                🌾 Cosecha Total: <strong>{jornada.resultado.cantidadCosechada} {jornada.resultado.unidadMedida}</strong> •
                Precio: <strong>{formatCurrency(jornada.resultado.precioVentaUnitario || 0)}/{jornada.resultado.unidadMedida}</strong> •
                Ganancia Neta: <strong className="text-emerald-700">{formatCurrency(jornada.resultado.gananciaNeta || 0)}</strong>
              </p>
            ) : (
              <p className="text-slate-800 text-xs">
                <strong>Resultado:</strong> {jornada.resultado.resultadoTexto}
                {jornada.resultado.problemasEncontrados && (
                  <span className="block text-[11px] text-amber-800 mt-0.5">
                    <strong>Atención:</strong> {jornada.resultado.problemasEncontrados}
                  </span>
                )}
              </p>
            )}
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <span>Aún no se han registrado los resultados técnicos de esta labor.</span>
            <button
              onClick={onOpenResultados}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-2xl shadow-xs transition"
            >
              Registrar Resultados
            </button>
          </div>
        )}

        {/* Botones del Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition"
          >
            Cerrar
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenResultados();
              }}
              className="px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Ver Resultados</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/20 transition active:scale-[0.98]"
            >
              <Edit2 className="w-3.5 h-3.5 text-emerald-200" />
              <span>Editar Jornada</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
