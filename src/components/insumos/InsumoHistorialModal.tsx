import React, { useState, useEffect } from 'react';
import { Insumo } from '../../types';
import { useFarm } from '../../context/FarmContext';
import { Modal } from '../layout/Modal';
import { History, Calendar, Building2, Trees, DollarSign, Package, Fuel, Wrench, Clock, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface InsumoHistorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  insumo: Insumo | null;
}

export const InsumoHistorialModal: React.FC<InsumoHistorialModalProps> = ({
  isOpen,
  onClose,
  insumo,
}) => {
  const { getHistorialInsumo } = useFarm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && insumo) {
      setLoading(true);
      getHistorialInsumo(insumo.id)
        .then((res) => {
          setData(res);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setData(null);
    }
  }, [isOpen, insumo]);

  if (!insumo) return null;

  const registros = data?.registros || [];
  const totalUtilizado = data?.totalUtilizado ?? (insumo.totalConsumido || 0);
  const costoTotalAcumulado = data?.costoAcumulado ?? (totalUtilizado * insumo.costoUnitario);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Historial — ${insumo.nombre}`}
      subtitle={`Trazabilidad de uso por labor, propietario y parcela (${insumo.categoria})`}
      maxWidth="3xl"
    >
      <div className="space-y-4 text-xs">
        {/* KPI Cards del Insumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Stock Inicial</span>
            <span className="text-sm sm:text-base font-black text-slate-800">
              {insumo.stockInicial} <span className="text-xs font-normal text-slate-500">{insumo.unidad}</span>
            </span>
          </div>

          <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/80">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Total Usado</span>
            <span className="text-sm sm:text-base font-black text-amber-900">
              {totalUtilizado} <span className="text-xs font-normal text-amber-700">{insumo.unidad}</span>
            </span>
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/80">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Stock Actual</span>
            <span className="text-sm sm:text-base font-black text-emerald-900">
              {insumo.stockActual} <span className="text-xs font-normal text-emerald-700">{insumo.unidad}</span>
            </span>
          </div>

          <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-200/80">
            <span className="text-[10px] uppercase font-bold text-blue-700 block">Costo Acumulado</span>
            <span className="text-sm sm:text-base font-black text-blue-950">
              {formatCurrency(costoTotalAcumulado)}
            </span>
          </div>
        </div>

        {/* Sección de Registros con soporte dual: Cards en Móvil + Tabla en Desktop */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-600" />
              <span>Salidas y Aplicaciones en Jornadas ({registros.length})</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
              Costo ref: {formatCurrency(insumo.costoUnitario)}/{insumo.unidad}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <p>Cargando registros históricos...</p>
            </div>
          ) : registros.length === 0 ? (
            <div className="py-10 text-center text-slate-400 px-4">
              <p className="font-semibold text-slate-600">No hay salidas registradas aún.</p>
              <p className="text-[11px] mt-1 text-slate-400">
                Aparecerán automáticamente cuando se utilice este insumo en labores de campo.
              </p>
            </div>
          ) : (
            <>
              {/* VISTA MÓVIL: Tarjetas */}
              <div className="md:hidden divide-y divide-slate-100 p-2 space-y-2">
                {registros.map((reg: any) => {
                  const costoItem = reg.costoTotal || (reg.cantidad * (reg.costoUnitario || insumo.costoUnitario));
                  return (
                    <div key={reg.id} className="bg-slate-50/60 p-3 rounded-2xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-slate-800">{reg.fecha ? formatDate(reg.fecha) : '—'}</span>
                        </div>
                        <span className="font-mono text-[10px] bg-slate-200/80 px-2 py-0.5 rounded font-semibold text-slate-700">
                          {reg.jornadaCodigo}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 block">{reg.tipoTrabajo || 'Labor'}</span>
                          <span className="text-[11px] text-slate-500">
                            {reg.propietarioNombre || '—'} • {reg.cuadraNombre || '—'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-slate-900 text-sm block">
                            {reg.cantidad} {reg.unidad}
                          </span>
                          <span className="text-xs font-bold text-emerald-700">
                            {formatCurrency(costoItem)}
                          </span>
                        </div>
                      </div>

                      {reg.observaciones && (
                        <p className="text-[10px] text-slate-500 bg-white p-1.5 rounded-xl border border-slate-100 italic">
                          {reg.observaciones}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* VISTA DESKTOP: Tabla */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3.5">Fecha</th>
                      <th className="py-2.5 px-2">Jornada / Labor</th>
                      <th className="py-2.5 px-2">Propietario</th>
                      <th className="py-2.5 px-2">Cuadra</th>
                      <th className="py-2.5 px-2 text-right">Cantidad</th>
                      <th className="py-2.5 px-2 text-right">Costo Total</th>
                      <th className="py-2.5 px-3.5">Notas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {registros.map((reg: any) => (
                      <tr key={reg.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3.5 font-semibold text-slate-800 whitespace-nowrap">
                          {reg.fecha ? formatDate(reg.fecha) : '—'}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="font-bold text-slate-900 block">{reg.tipoTrabajo || 'Labor'}</span>
                          <span className="text-[10px] font-mono text-slate-400">{reg.jornadaCodigo}</span>
                        </td>
                        <td className="py-2.5 px-2 text-slate-700 font-medium">
                          {reg.propietarioNombre || '—'}
                        </td>
                        <td className="py-2.5 px-2 text-slate-600">
                          {reg.cuadraNombre || '—'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-extrabold text-slate-900">
                          {reg.cantidad} {reg.unidad}
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-emerald-700">
                          {formatCurrency(reg.costoTotal || (reg.cantidad * (reg.costoUnitario || insumo.costoUnitario)))}
                        </td>
                        <td className="py-2.5 px-3.5 text-[11px] text-slate-500 max-w-[160px] truncate">
                          {reg.observaciones || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};
