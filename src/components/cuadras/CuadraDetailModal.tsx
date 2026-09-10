import React from 'react';
import { Cuadra } from '../../types';
import { useFarm } from '../../context/FarmContext';
import { Modal } from '../layout/Modal';
import {
  MapPin,
  Maximize2,
  Calendar,
  Users,
  Clock,
  DollarSign,
  Grape,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { formatCurrency, formatArea, formatDate, formatNumber } from '../../utils/formatters';

interface CuadraDetailModalProps {
  cuadra: Cuadra | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CuadraDetailModal: React.FC<CuadraDetailModalProps> = ({
  cuadra,
  isOpen,
  onClose,
}) => {
  const { jornadas, getTrabajadorById, getTipoTrabajoById, getPropietarioById } = useFarm();

  if (!cuadra) return null;

  const propietario = getPropietarioById(cuadra.propietarioId);

  // Filtrar jornadas de esta cuadra
  const vincsCuadra = jornadas.filter((j) => j.cuadraId === cuadra.id);

  // Estadísticas acumuladas
  const totalHoras = vincsCuadra.reduce((acc, v) => acc + (v.totalHoras || 0), 0);
  const totalPagado = vincsCuadra.reduce((acc, v) => acc + (v.totalPago || 0), 0);
  let totalCosechado = 0;
  let totalIngresos = 0;

  vincsCuadra.forEach((v) => {
    if (v.resultado?.esCosecha) {
      totalCosechado += v.resultado.cantidadCosechada || 0;
      totalIngresos += v.resultado.ingresoGenerado || 0;
    }
  });

  const gananciaNeta = totalIngresos - totalPagado;

  // Trabajadores únicos
  const workerIds = Array.from(
    new Set(vincsCuadra.flatMap((j) => j.trabajadores.map((t) => t.trabajadorId)))
  );
  const trabajadoresCuadra = workerIds.map((id) => getTrabajadorById(id)).filter(Boolean);

  const statusBadgeColor = {
    activa: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    inactiva: 'bg-slate-100 text-slate-700 border-slate-300',
    mantenimiento: 'bg-amber-100 text-amber-800 border-amber-300',
  }[cuadra.estado];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={cuadra.nombre}
      subtitle={`Ficha Técnica y Trazabilidad — ${cuadra.lugar || (cuadra as any).ubicacion}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Propietario y Datos Geográficos */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${statusBadgeColor}`}
              >
                {cuadra.estado === 'activa'
                  ? 'Cuadra Activa'
                  : cuadra.estado === 'mantenimiento'
                  ? 'En Mantenimiento'
                  : 'Inactiva'}
              </span>

              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  cuadra.tipoPropiedad === 'propia'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {cuadra.tipoPropiedad === 'propia' ? 'Terreno Propio' : 'Terreno de Tercero'}
              </span>
            </div>

            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Registrada el {formatDate(cuadra.fechaCreacion)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2 text-slate-600">
              <Building2 className="w-4 h-4 text-cacao-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">Propietario:</strong> {propietario?.nombreCompleto || 'No asignado'}
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Cédula: {propietario?.identificacion} • Contacto: {propietario?.telefono || 'S/N'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-slate-600">
              <Maximize2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">Superficie del terreno:</strong>
                <p className="text-slate-700 font-semibold">{formatArea(cuadra.tamanoM2)}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-slate-600 sm:col-span-2">
              <MapPin className="w-4 h-4 text-cacao-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">Ubicación / Sector:</strong> {cuadra.lugar || (cuadra as any).ubicacion}
                {cuadra.referencia && <p className="text-slate-500 text-[11px] mt-0.5">{cuadra.referencia}</p>}
              </div>
            </div>
          </div>

          {cuadra.observaciones && (
            <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600 italic">
              <strong>Observaciones agronómicas:</strong> {cuadra.observaciones}
            </div>
          )}
        </div>

        {/* Métricas Acumuladas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
            <span className="text-[11px] font-semibold text-amber-800 uppercase block">Cosecha Total</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Grape className="w-4 h-4 text-amber-600" />
              <span className="text-lg font-bold text-amber-950">{formatNumber(totalCosechado)} qq</span>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase block">Ingresos Cosecha</span>
            <div className="flex items-center gap-1.5 mt-1">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span className="text-lg font-bold text-emerald-950">{formatCurrency(totalIngresos)}</span>
            </div>
          </div>

          <div className="bg-cacao-50 rounded-xl p-3 border border-cacao-200">
            <span className="text-[11px] font-semibold text-cacao-800 uppercase block">Inversión en Mano Obra</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-4 h-4 text-cacao-600" />
              <span className="text-lg font-bold text-cacao-950">{formatCurrency(totalPagado)}</span>
            </div>
            <span className="text-[10px] text-cacao-600">{totalHoras} horas invertidas</span>
          </div>

          <div className={`rounded-xl p-3 border ${gananciaNeta >= 0 ? 'bg-green-50 border-green-200' : 'bg-rose-50 border-rose-200'}`}>
            <span className="text-[11px] font-semibold uppercase block text-slate-700">Margen Neto</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-lg font-bold ${gananciaNeta >= 0 ? 'text-green-800' : 'text-rose-800'}`}>
                {formatCurrency(gananciaNeta)}
              </span>
            </div>
            <span className="text-[10px] text-slate-500">Ingresos - Jornales</span>
          </div>
        </div>

        {/* Trabajadores que han laborado en esta cuadra */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 mb-2.5">
            <Users className="w-4 h-4 text-cacao-600" />
            <span>Trabajadores que han intervenido en esta cuadra ({trabajadoresCuadra.length})</span>
          </h4>
          {trabajadoresCuadra.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No hay registros de trabajadores aún en esta cuadra.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {trabajadoresCuadra.map((t) => (
                <div
                  key={t?.id}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-full bg-cacao-100 text-cacao-800 font-bold flex items-center justify-center text-[10px]">
                    {t?.nombreCompleto.charAt(0)}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block">{t?.nombreCompleto}</span>
                    <span className="text-[10px] text-slate-500">{t?.tipo}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historial de Jornadas en la Cuadra */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 mb-3">
            <Clock className="w-4 h-4 text-cacao-600" />
            <span>Historial y Bitácora de Jornadas Realizadas ({vincsCuadra.length})</span>
          </h4>

          {vincsCuadra.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl">
              <p className="text-xs text-slate-500">Aún no se han registrado jornadas en esta cuadra.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vincsCuadra.map((j) => {
                const tipo = getTipoTrabajoById(j.tipoTrabajoId);

                return (
                  <div
                    key={j.id}
                    className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-2.5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {j.codigo}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-cacao-100 text-cacao-900 font-bold text-xs">
                          {tipo?.nombre}
                        </span>
                        <span className="text-slate-500">
                          {j.esAgrupada ? `${formatDate(j.fecha)} al ${formatDate(j.fechaFin)}` : formatDate(j.fecha)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-slate-600 font-semibold">{j.trabajadores.length} trabajador(es)</span>
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {j.totalHoras} hrs
                        </span>
                        <span className="font-bold text-emerald-700">{formatCurrency(j.totalPago)}</span>
                      </div>
                    </div>

                    {/* Trabajadores desglosados */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 space-y-1 text-[11px]">
                      <span className="font-bold text-slate-700 block">Personal participante:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {j.trabajadores.map((tj) => {
                          const trab = getTrabajadorById(tj.trabajadorId);
                          return (
                            <div key={tj.id} className="bg-white px-2.5 py-1 rounded border border-slate-200 flex items-center justify-between">
                              <span className="font-semibold text-slate-800">
                                {trab?.nombreCompleto} ({trab?.tipo})
                              </span>
                              <span className="text-slate-600 font-medium">
                                {tj.horasTrabajadas}h • {formatCurrency(tj.pagoTotal)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Resultado */}
                    {j.resultado && (
                      <div className="pt-2 border-t border-slate-100 text-xs">
                        {j.resultado.esCosecha ? (
                          <div className="bg-amber-50/80 p-2 rounded-lg text-amber-950 font-medium">
                            🌾 Cosecha: {j.resultado.cantidadCosechada} {j.resultado.unidadMedida} • Ganancia Neta: {formatCurrency(j.resultado.gananciaNeta)}
                          </div>
                        ) : (
                          <p className="text-slate-700">
                            <strong>Resultado:</strong> {j.resultado.resultadoTexto}
                          </p>
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
