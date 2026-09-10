import React from 'react';
import { Propietario } from '../../types';
import { useFarm } from '../../context/FarmContext';
import { Modal } from '../layout/Modal';
import {
  User,
  Trees,
  MapPin,
  Phone,
  CreditCard,
  Maximize2,
  DollarSign,
  Grape,
  Clock,
  Layers,
} from 'lucide-react';
import { formatCurrency, formatArea, formatDate } from '../../utils/formatters';

interface PropietarioDetailModalProps {
  propietario: Propietario | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PropietarioDetailModal: React.FC<PropietarioDetailModalProps> = ({
  propietario,
  isOpen,
  onClose,
}) => {
  const { cuadras, jornadas, getTipoTrabajoById } = useFarm();

  if (!propietario) return null;

  // Cuadras que pertenecen a este propietario
  const cuadrasPropietario = cuadras.filter((c) => c.propietarioId === propietario.id);
  const totalM2 = cuadrasPropietario.reduce((acc, c) => acc + (c.tamanoM2 || 0), 0);
  const cuadrasPropias = cuadrasPropietario.filter((c) => c.tipoPropiedad === 'propia');
  const cuadrasTerceros = cuadrasPropietario.filter((c) => c.tipoPropiedad === 'tercero');

  // Jornadas en las cuadras de este propietario
  const cuadraIds = cuadrasPropietario.map((c) => c.id);
  const jornadasPropietario = jornadas.filter((j) =>
    j.propietarioId === propietario.id ||
    (j.cuadraId && cuadraIds.includes(j.cuadraId)) ||
    (j.propiedades && j.propiedades.some((p) => p.propietarioId === propietario.id || cuadraIds.includes(p.cuadraId)))
  );

  let totalQuintales = 0;
  let totalIngresos = 0;
  let totalGastosManoObra = 0;

  jornadasPropietario.forEach((j) => {
    // Si es compartida, no duplicar gastos
    const esCompartida = (j.propiedades && j.propiedades.length > 1);
    const numProps = esCompartida ? (j.propiedades?.length || 1) : 1;
    totalGastosManoObra += (j.totalPago || 0) / numProps;

    if (j.resultado?.esCosecha) {
      if (j.resultado.cosechasPorPropietario && j.resultado.cosechasPorPropietario.length > 0) {
        const cp = j.resultado.cosechasPorPropietario.find((c) => c.propietarioId === propietario.id);
        if (cp) {
          totalQuintales += cp.cantidad || 0;
          totalIngresos += cp.ingresoGenerado || 0;
        }
      } else {
        totalQuintales += j.resultado.cantidadCosechada || 0;
        totalIngresos += j.resultado.ingresoGenerado || 0;
      }
    }
  });

  const margenNeto = totalIngresos - totalGastosManoObra;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={propietario.nombreCompleto}
      subtitle={`Ficha del Propietario y Terrenos Asignados — Cédula: ${propietario.identificacion}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Cabecera del Propietario */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cacao-900 text-amber-300 font-extrabold text-lg flex items-center justify-center shadow-xs">
                {propietario.nombreCompleto.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-base">{propietario.nombreCompleto}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      propietario.estado === 'activo'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {propietario.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{propietario.direccion || 'Sin dirección registrada'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-right">
                <span className="text-[10px] text-slate-400 block font-semibold">MIS TERRENOS</span>
                <span className="font-bold text-emerald-700">{cuadrasPropias.length} propias</span>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-right">
                <span className="text-[10px] text-slate-400 block font-semibold">DE TERCEROS</span>
                <span className="font-bold text-amber-700">{cuadrasTerceros.length} de terceros</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-200/80">
            <div className="flex items-center gap-2 text-slate-600">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span><strong>Identificación:</strong> {propietario.identificacion}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              <span><strong>Teléfono:</strong> {propietario.telefono || 'No registrado'}</span>
            </div>
          </div>

          {propietario.observaciones && (
            <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs text-slate-600 italic">
              <strong>Observaciones y acuerdos:</strong> {propietario.observaciones}
            </div>
          )}
        </div>

        {/* Métricas Acumuladas del Propietario */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-cacao-50 rounded-xl p-3 border border-cacao-200">
            <span className="text-[11px] font-semibold text-cacao-800 uppercase block">Superficie Total</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Maximize2 className="w-4 h-4 text-cacao-700" />
              <span className="text-base font-bold text-cacao-950">{formatArea(totalM2)}</span>
            </div>
            <span className="text-[10px] text-cacao-600">{cuadrasPropietario.length} cuadras</span>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
            <span className="text-[11px] font-semibold text-amber-800 uppercase block">Cosecha Acumulada</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Grape className="w-4 h-4 text-amber-700" />
              <span className="text-base font-bold text-amber-950">{totalQuintales} qq</span>
            </div>
            <span className="text-[10px] text-amber-700">En sus terrenos</span>
          </div>

          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase block">Ingresos Cosecha</span>
            <div className="flex items-center gap-1.5 mt-1">
              <DollarSign className="w-4 h-4 text-emerald-700" />
              <span className="text-base font-bold text-emerald-950">{formatCurrency(totalIngresos)}</span>
            </div>
            <span className="text-[10px] text-emerald-600">Ventas brutas</span>
          </div>

          <div className={`rounded-xl p-3 border ${margenNeto >= 0 ? 'bg-green-50 border-green-200' : 'bg-rose-50 border-rose-200'}`}>
            <span className="text-[11px] font-semibold uppercase block text-slate-700">Margen Neto</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-base font-bold ${margenNeto >= 0 ? 'text-green-800' : 'text-rose-800'}`}>
                {formatCurrency(margenNeto)}
              </span>
            </div>
            <span className="text-[10px] text-slate-500">Ingresos - Mano de obra</span>
          </div>
        </div>

        {/* Listado de Cuadras Asignadas */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 mb-2.5">
            <Trees className="w-4 h-4 text-cacao-700" />
            <span>Cuadras Asignadas a este Propietario ({cuadrasPropietario.length})</span>
          </h4>

          {cuadrasPropietario.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 border border-dashed border-slate-200 rounded-xl text-center">
              Este propietario no tiene cuadras asignadas todavía.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cuadrasPropietario.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">{c.nombre}</strong>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.tipoPropiedad === 'propia'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.tipoPropiedad === 'propia' ? 'Terreno Propio' : 'De Tercero'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">{c.lugar} — {formatArea(c.tamanoM2)}</p>
                  {c.referencia && <p className="text-slate-400 text-[11px] italic">{c.referencia}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historial de Jornadas en Terrenos de este Propietario */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 mb-2.5">
            <Clock className="w-4 h-4 text-cacao-700" />
            <span>Historial de Jornadas Realizadas en sus Terrenos ({jornadasPropietario.length})</span>
          </h4>

          {jornadasPropietario.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 border border-dashed border-slate-200 rounded-xl text-center">
              No hay jornadas registradas en las cuadras de este propietario.
            </p>
          ) : (
            <div className="space-y-2">
              {jornadasPropietario.map((j) => {
                const tipo = getTipoTrabajoById(j.tipoTrabajoId);
                const cuadra = cuadras.find((c) => c.id === j.cuadraId);

                return (
                  <div
                    key={j.id}
                    className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{cuadra?.nombre}</span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span className="px-2 py-0.5 rounded bg-cacao-50 text-cacao-800 font-semibold text-[11px]">
                        {tipo?.nombre}
                      </span>
                      <span className="text-slate-500 text-[11px] ml-2">({formatDate(j.fecha)})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600">{j.trabajadores.length} trabajador(es)</span>
                      <span className="font-bold text-slate-900">{j.totalHoras} hrs</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(j.totalPago)}</span>
                    </div>
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
