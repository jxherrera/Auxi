import React from 'react';
import { VinculacionTrabajo } from '../../types';
import { useFarm } from '../../context/FarmContext';
import { Modal } from '../layout/Modal';
import { Printer, CheckCircle2, DollarSign, Calendar, Sprout } from 'lucide-react';
import { formatCurrency, formatDate, formatDateLong } from '../../utils/formatters';

interface ReciboModalProps {
  vinculacion: VinculacionTrabajo | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReciboModal: React.FC<ReciboModalProps> = ({
  vinculacion,
  isOpen,
  onClose,
}) => {
  const { getCuadraById, getTrabajadorById, getTipoTrabajoById } = useFarm();

  if (!vinculacion) return null;

  const cid = vinculacion.cuadraId || vinculacion.propiedades?.[0]?.cuadraId || '';
  const cuadra = getCuadraById(cid);
  const workerId = vinculacion.trabajadorId || vinculacion.trabajadores?.[0]?.trabajadorId || '';
  const trabajador = getTrabajadorById(workerId);
  const tipo = getTipoTrabajoById(vinculacion.tipoTrabajoId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Comprobante de Liquidación de Jornal"
      subtitle={`Voucher de Pago Oficial — Folio: ${vinculacion.comprobantePago || vinculacion.codigo}`}
      maxWidth="lg"
    >
      <div className="space-y-5 text-xs">
        {/* Recibo Printable Box */}
        <div className="p-6 bg-white border-2 border-slate-300 rounded-2xl space-y-5 shadow-2xs print:border-none print:p-0">
          {/* Cabecera del comprobante */}
          <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cacao-800 text-amber-400 flex items-center justify-center font-bold">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">HACIENDA CACAO REAL</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Liquidación de Labores Agrícolas</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-semibold">COMPROBANTE N°</span>
              <strong className="font-mono text-sm text-cacao-900">
                {vinculacion.comprobantePago || 'COMP-00291'}
              </strong>
            </div>
          </div>

          {/* Datos del Beneficiario y la Finca */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Trabajador:</span>
              <strong className="text-slate-900 text-xs block">{trabajador?.nombreCompleto}</strong>
              <span className="text-slate-500 text-[11px]">Cédula: {trabajador?.identificacion}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ubicación / Cuadra:</span>
              <strong className="text-slate-900 text-xs block">{cuadra?.nombre}</strong>
              <span className="text-slate-500 text-[11px]">{cuadra?.ubicacion}</span>
            </div>
          </div>

          {/* Desglose del Servicio */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Detalle del Trabajo Realizado
            </span>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Concepto / Labor</th>
                    <th className="py-2 px-3">Período</th>
                    <th className="py-2 px-3 text-center">Horas</th>
                    <th className="py-2 px-3 text-right">Tarifa</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {tipo?.nombre}
                      {vinculacion.esAgrupada && (
                        <span className="block text-[10px] text-slate-500 font-normal">
                          Labor agrupada ({vinculacion.subJornadas?.length || vinculacion.jornadas?.length || 1} días)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {vinculacion.esAgrupada && vinculacion.fechaFin
                        ? `${formatDate(vinculacion.fecha || vinculacion.fechaInicio || '')} al ${formatDate(vinculacion.fechaFin)}`
                        : formatDate(vinculacion.fecha || vinculacion.fechaInicio || '')}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {vinculacion.totalHoras} hrs
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700">
                      {formatCurrency(vinculacion.tarifaValor)}/{vinculacion.tipoTarifa === 'por_hora' ? 'h' : 'día'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(vinculacion.pagoTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Total & Método de Pago */}
          <div className="flex items-center justify-between bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
            <div>
              <span className="text-[10px] text-emerald-800 font-bold uppercase block">Método de Liquidación:</span>
              <span className="text-emerald-950 font-semibold text-xs">
                {vinculacion.metodoPago || 'Efectivo'} — Fecha: {formatDate(vinculacion.fechaPago || new Date().toISOString().split('T')[0])}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-800 font-bold uppercase block">Total Cancelado</span>
              <span className="text-xl font-black text-emerald-900">
                {formatCurrency(vinculacion.pagoTotal ?? vinculacion.totalPago ?? 0)}
              </span>
            </div>
          </div>

          {/* Firmas de Conformidad */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-dashed border-slate-300">
            <div className="text-center">
              <div className="border-b border-slate-400 w-3/4 mx-auto mb-1" />
              <span className="text-[10px] text-slate-500 block font-semibold">ADMINISTRACIÓN / PAGADOR</span>
            </div>
            <div className="text-center">
              <div className="border-b border-slate-400 w-3/4 mx-auto mb-1" />
              <span className="text-[10px] text-slate-500 block font-semibold">FIRMA DEL TRABAJADOR</span>
            </div>
          </div>
        </div>

        {/* Acciones del modal */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold transition"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-cacao-800 hover:bg-cacao-900 text-white font-bold transition shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-harvest-400" />
            <span>Imprimir Recibo</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
