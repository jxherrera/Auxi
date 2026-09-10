import React, { useState } from 'react';
import {
  TrabajadorJornada,
  FormaPago,
  PropiedadJornada,
  TipoGranoCacao,
  UnidadCosecha,
  CosechaPropietario,
  JornadaInsumo,
} from '../../types';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import {
  Calendar,
  Building2,
  Briefcase,
  Users,
  Clock,
  Boxes,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Trash2,
  DollarSign,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { calculateNetHoursWorked, calculateWorkerPay } from '../../utils/calculations';

interface JornadaWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface WorkerConfig {
  horaEntrada: string;
  horaSalida: string;
  almuerzo: number;
  tarifa: number;
  tipoPago: FormaPago;
  manualPago?: number;
  observaciones?: string;
}

interface InsumoUtilizadoItem {
  id: string;
  insumoId?: string;
  nombreInsumo: string;
  categoria?: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  costoTotal: number;
  observaciones?: string;
}

interface InsumoRequeridoItem {
  id: string;
  nombreInsumo: string;
  cantidad: number;
  unidad: string;
  urgente: boolean;
  observaciones?: string;
}

export const JornadaWizardModal: React.FC<JornadaWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    cuadras,
    propietarios,
    trabajadores,
    tiposTrabajo,
    insumos,
    addJornada,
    registrarResultado,
    getTrabajadorById,
    getCuadraById,
    getPropietarioById,
  } = useFarm();

  const { success, error } = useToast();

  const [step, setStep] = useState(1);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [esAgrupada, setEsAgrupada] = useState(false);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCuadras, setSelectedCuadras] = useState<string[]>([]);
  const [tipoTrabajoId, setTipoTrabajoId] = useState('');
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [workerHours, setWorkerHours] = useState<Record<string, WorkerConfig>>({});

  // Insumos utilizados y requeridos
  const [insumoTab, setInsumoTab] = useState<'utilizados' | 'requeridos'>('utilizados');
  const [insumosUtilizados, setInsumosUtilizados] = useState<InsumoUtilizadoItem[]>([]);
  const [insumosRequeridos, setInsumosRequeridos] = useState<InsumoRequeridoItem[]>([]);

  // Cosecha states
  const [tieneCosecha, setTieneCosecha] = useState(false);
  const [tipoGrano, setTipoGrano] = useState<TipoGranoCacao>('Cacao Nacional Fino de Aroma');
  const [unidadCosecha, setUnidadCosecha] = useState<UnidadCosecha>('quintales');
  const [cantidadCosecha, setCantidadCosecha] = useState<number>(0);
  const [precioUnitarioCosecha, setPrecioUnitarioCosecha] = useState<number>(35);
  const [gastosCosecha, setGastosCosecha] = useState<number>(0);
  const [observaciones, setObservaciones] = useState('');

  const resetForm = () => {
    setStep(1);
    setFecha(new Date().toISOString().split('T')[0]);
    setEsAgrupada(false);
    setFechaFin(new Date().toISOString().split('T')[0]);
    setSelectedCuadras([]);
    setTipoTrabajoId('');
    setSelectedWorkers([]);
    setWorkerHours({});
    setInsumosUtilizados([]);
    setInsumosRequeridos([]);
    setTieneCosecha(false);
    setTipoGrano('Cacao Nacional Fino de Aroma');
    setUnidadCosecha('quintales');
    setCantidadCosecha(0);
    setPrecioUnitarioCosecha(35);
    setGastosCosecha(0);
    setObservaciones('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const toggleCuadra = (id: string) => {
    setSelectedCuadras((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleWorker = (id: string) => {
    setSelectedWorkers((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        return prev.filter((item) => item !== id);
      } else {
        const tr = getTrabajadorById(id);
        const isFamiliar = tr?.tipo === 'Familiar';
        const tarifa = isFamiliar ? 0 : (tr?.tarifaDia || 25);
        const tipoPago: FormaPago = isFamiliar ? 'sin_pago' : 'por_jornada';
        setWorkerHours((h) => ({
          ...h,
          [id]: {
            horaEntrada: '07:00',
            horaSalida: '16:00',
            almuerzo: 1,
            tarifa,
            tipoPago,
            manualPago: isFamiliar ? 0 : (tr?.tarifaDia || 25),
            observaciones: '',
          },
        }));
        return [...prev, id];
      }
    });
  };

  // Agregar insumo utilizado
  const addInsumoUtilizadoRow = () => {
    const defaultInsumo = insumos[0];
    const newItem: InsumoUtilizadoItem = {
      id: `iu-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      insumoId: defaultInsumo?.id,
      nombreInsumo: defaultInsumo?.nombre || 'Combustible / Insumo',
      categoria: defaultInsumo?.categoria || 'Combustibles',
      cantidad: 1,
      unidad: defaultInsumo?.unidad || 'litros',
      costoUnitario: defaultInsumo?.costoUnitario || 0,
      costoTotal: defaultInsumo?.costoUnitario || 0,
    };
    setInsumosUtilizados((prev) => [...prev, newItem]);
  };

  const removeInsumoUtilizadoRow = (id: string) => {
    setInsumosUtilizados((prev) => prev.filter((item) => item.id !== id));
  };

  // Agregar insumo requerido
  const addInsumoRequeridoRow = () => {
    const newItem: InsumoRequeridoItem = {
      id: `ir-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      nombreInsumo: '',
      cantidad: 1,
      unidad: 'unidad',
      urgente: false,
      observaciones: '',
    };
    setInsumosRequeridos((prev) => [...prev, newItem]);
  };

  const removeInsumoRequeridoRow = (id: string) => {
    setInsumosRequeridos((prev) => prev.filter((item) => item.id !== id));
  };

  // Cálculo de trabajadores
  const calculatedWorkers: TrabajadorJornada[] = selectedWorkers.map((wId) => {
    const config = workerHours[wId] || {
      horaEntrada: '07:00',
      horaSalida: '16:00',
      almuerzo: 1,
      tarifa: 25,
      tipoPago: 'por_jornada' as FormaPago,
      manualPago: 25,
    };
    const netHours = calculateNetHoursWorked(config.horaEntrada, config.horaSalida, config.almuerzo).horas;
    
    let pay = 0;
    if (config.tipoPago === 'sin_pago') {
      pay = 0;
    } else if (config.tipoPago === 'pago_fijo') {
      pay = config.manualPago !== undefined ? config.manualPago : config.tarifa;
    } else {
      pay = calculateWorkerPay(netHours, config.tipoPago, config.tarifa);
    }

    const tr = getTrabajadorById(wId);

    return {
      id: `w-wiz-${wId}`,
      trabajadorId: wId,
      nombreTrabajador: tr?.nombreCompleto,
      horaEntrada: config.horaEntrada,
      horaSalida: config.horaSalida,
      almuerzoHoras: config.almuerzo,
      horasTrabajadas: netHours,
      tipoPago: config.tipoPago,
      tarifa: config.tipoPago === 'pago_fijo' ? (config.manualPago ?? config.tarifa) : config.tarifa,
      pagoTotal: pay,
      estadoPago: 'pendiente',
      observaciones: config.observaciones,
    };
  });

  const totalManoObra = calculatedWorkers.reduce((acc, w) => acc + w.pagoTotal, 0);
  const totalHorasManoObra = calculatedWorkers.reduce((acc, w) => acc + w.horasTrabajadas, 0);
  const totalHorasFamiliares = calculatedWorkers
    .filter((w) => w.tipoPago === 'sin_pago' || w.pagoTotal === 0)
    .reduce((acc, w) => acc + w.horasTrabajadas, 0);
  const totalHorasContratadas = totalHorasManoObra - totalHorasFamiliares;

  const totalCostoInsumos = insumosUtilizados.reduce((acc, it) => acc + (it.costoTotal || 0), 0);

  // Cálculos de cosecha
  const ingresoBrutoCosecha = cantidadCosecha * precioUnitarioCosecha;
  const ingresoNetoCosecha = Math.max(0, ingresoBrutoCosecha - gastosCosecha);

  // Distribución de cosecha por propietario según sus cuadras seleccionadas
  const distinctOwnerIds = Array.from(
    new Set(
      selectedCuadras
        .map((cId) => getCuadraById(cId)?.propietarioId)
        .filter((id): id is string => Boolean(id))
    )
  );

  const calculatedCosechasPorPropietario: CosechaPropietario[] = distinctOwnerIds.map((propId) => {
    const ownerCuadras = selectedCuadras.filter((cId) => getCuadraById(cId)?.propietarioId === propId);
    const fraction = selectedCuadras.length > 0 ? ownerCuadras.length / selectedCuadras.length : 1;
    const propCantidad = parseFloat((cantidadCosecha * fraction).toFixed(2));
    const propGastos = parseFloat((gastosCosecha * fraction).toFixed(2));
    const propIngreso = parseFloat((propCantidad * precioUnitarioCosecha).toFixed(2));
    const propGanancia = parseFloat(Math.max(0, propIngreso - propGastos).toFixed(2));

    return {
      id: `cp-wiz-${propId}`,
      propietarioId: propId,
      cuadraIds: ownerCuadras,
      cantidad: propCantidad,
      unidad: unidadCosecha,
      precioUnitario: precioUnitarioCosecha,
      gastosRelacionados: propGastos,
      ingresoGenerado: propIngreso,
      gananciaNeta: propGanancia,
      tipoGrano,
      observaciones: `Distribuido por ${ownerCuadras.length} cuadra(s) trabajada(s)`,
    };
  });

  const canGoNext = () => {
    if (step === 1) return !!fecha;
    if (step === 2) return selectedCuadras.length > 0;
    if (step === 3) return !!tipoTrabajoId;
    if (step === 4) return selectedWorkers.length > 0;
    return true;
  };

  const handleSave = async () => {
    try {
      const propiedades: PropiedadJornada[] = selectedCuadras.map((cId) => {
        const c = getCuadraById(cId);
        return {
          id: `prop-wiz-${cId}`,
          propietarioId: c?.propietarioId || '',
          cuadraId: cId,
          horasEstimadas: totalHorasManoObra / (selectedCuadras.length || 1),
        };
      });

      const firstCuadra = getCuadraById(selectedCuadras[0]);

      // Guardar la Jornada principal
      const newJornada = await addJornada({
        fecha,
        fechaFin: esAgrupada ? fechaFin : undefined,
        esAgrupada,
        propietarioId: firstCuadra?.propietarioId || '',
        cuadraId: selectedCuadras[0],
        propiedades,
        tipoTrabajoId,
        trabajadores: calculatedWorkers,
        totalHoras: totalHorasManoObra,
        totalPago: totalManoObra,
        observaciones,
      });

      // Guardar insumos o resultados si hubo cosecha o insumos
      const hasHarvest = tieneCosecha && cantidadCosecha > 0;
      const hasInsumos = insumosUtilizados.length > 0 || insumosRequeridos.length > 0;

      if (hasHarvest || hasInsumos) {
        const formattedInsumosUtilizados: JornadaInsumo[] = insumosUtilizados.map((iu) => ({
          id: iu.id,
          insumoId: iu.insumoId,
          nombreInsumo: iu.nombreInsumo,
          categoria: iu.categoria,
          tipo: 'utilizado',
          cantidad: iu.cantidad,
          unidad: iu.unidad,
          costoUnitario: iu.costoUnitario,
          costoTotal: iu.costoTotal,
          estado: 'utilizado',
          observaciones: iu.observaciones,
        }));

        const formattedInsumosRequeridos: JornadaInsumo[] = insumosRequeridos.map((ir) => ({
          id: ir.id,
          nombreInsumo: ir.nombreInsumo,
          tipo: 'requerido',
          cantidad: ir.cantidad,
          unidad: ir.unidad,
          estado: ir.urgente ? 'urgente' : 'pendiente',
          observaciones: ir.observaciones,
        }));

        await registrarResultado(newJornada.id, {
          esCosecha: hasHarvest,
          cantidadCosechada: hasHarvest ? cantidadCosecha : undefined,
          unidadMedida: hasHarvest ? unidadCosecha : undefined,
          precioVentaUnitario: hasHarvest ? precioUnitarioCosecha : undefined,
          ingresoGenerado: hasHarvest ? ingresoBrutoCosecha : undefined,
          gastosRelacionados: hasHarvest ? gastosCosecha : undefined,
          gananciaNeta: hasHarvest ? ingresoNetoCosecha : undefined,
          tipoGrano: hasHarvest ? tipoGrano : undefined,
          cosechasPorPropietario: hasHarvest ? calculatedCosechasPorPropietario : undefined,
          costoInsumos: totalCostoInsumos,
          insumosUtilizados: formattedInsumosUtilizados,
          insumosRequeridos: formattedInsumosRequeridos,
          observaciones: observaciones || (hasHarvest ? 'Cosecha registrada desde Asistente Rápido' : 'Insumos registrados desde Asistente Rápido'),
        });
      }

      success('¡Jornada vinculada y guardada exitosamente!');
      resetForm();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      error(err.message || 'Error al guardar la jornada');
    }
  };

  const stepsLabels = [
    'Fecha',
    'Terreno',
    'Labor',
    'Equipo',
    'Horas & Pago',
    'Insumos',
    'Cosecha',
    'Resumen',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                {step}
              </span>
              <h2 className="text-base font-bold text-slate-800">
                Paso {step} de 8: {stepsLabels[step - 1]}
              </h2>
            </div>
            <div className="w-48 bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${(step / 8) * 100}%` }}
              />
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* PASO 1: FECHA */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <Calendar className="w-10 h-10 text-emerald-600 mx-auto mb-1" />
                <h3 className="font-bold text-slate-800 text-lg">¿Cuándo se realizó la labor?</h3>
                <p className="text-xs text-slate-500">Selecciona el día de trabajo o rango de fechas</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Fecha Principal *
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-base font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={esAgrupada}
                    onChange={(e) => setEsAgrupada(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-emerald-900">
                    Jornada Agrupada (varios días consecutivos)
                  </span>
                </label>

                {esAgrupada && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Fin</label>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 2: TERRENO / MULTI-PROPIEDAD */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <Building2 className="w-10 h-10 text-emerald-600 mx-auto mb-1" />
                <h3 className="font-bold text-slate-800 text-lg">¿Dónde se trabajó?</h3>
                <p className="text-xs text-slate-500">
                  Selecciona una o varias cuadras de cualquier propietario
                </p>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {cuadras.map((c) => {
                  const p = getPropietarioById(c.propietarioId);
                  const isSelected = selectedCuadras.includes(c.id);

                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleCuadra(c.id)}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                            isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{c.nombre}</div>
                          <div className="text-xs text-slate-500 font-medium">
                            Propietario: <strong className="text-slate-700">{p?.nombreCompleto}</strong> •{' '}
                            <span className="capitalize">{c.tipoPropiedad}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedCuadras.length > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {selectedCuadras.length} cuadra(s) seleccionada(s) de {distinctOwnerIds.length} propietario(s).
                  </span>
                </div>
              )}
            </div>
          )}

          {/* PASO 3: LABOR */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <Briefcase className="w-10 h-10 text-emerald-600 mx-auto mb-1" />
                <h3 className="font-bold text-slate-800 text-lg">¿Qué labor se realizó?</h3>
                <p className="text-xs text-slate-500">Selecciona el tipo de trabajo agrícola ejecutado</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {tiposTrabajo.map((t) => {
                  const isSelected = tipoTrabajoId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setTipoTrabajoId(t.id);
                        if (t.esCosecha) setTieneCosecha(true);
                      }}
                      className={`p-3.5 rounded-2xl border flex flex-col justify-between cursor-pointer transition ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm">{t.nombre}</span>
                        {t.esCosecha && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-md">
                            Cosecha
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{t.descripcion}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 4: EQUIPO */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <Users className="w-10 h-10 text-emerald-600 mx-auto mb-1" />
                <h3 className="font-bold text-slate-800 text-lg">¿Quiénes trabajaron?</h3>
                <p className="text-xs text-slate-500">
                  Selecciona a los peones o familiares que participaron en la labor
                </p>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {trabajadores.map((w) => {
                  const isSelected = selectedWorkers.includes(w.id);
                  const isFamiliar = w.tipo === 'Familiar';
                  return (
                    <div
                      key={w.id}
                      onClick={() => toggleWorker(w.id)}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                            isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{w.nombreCompleto}</div>
                          <div className="text-xs text-slate-500">
                            <span className={`font-semibold ${isFamiliar ? 'text-blue-700' : 'text-slate-600'}`}>
                              {isFamiliar ? 'Trabajo Familiar ($0)' : 'Peón externo'}
                            </span>{' '}
                            • {isFamiliar ? 'Tarifa $0' : `Base: $${w.tarifaDia}/día ($${w.tarifaHora}/h)`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 5: HORAS, LIQUIDACIÓN Y VARIABLES DE PAGO */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <Clock className="w-10 h-10 text-emerald-600 mx-auto mb-1" />
                <h3 className="font-bold text-slate-800 text-lg">Horas y Liquidación</h3>
                <p className="text-xs text-slate-500">
                  Ajusta horarios, almuerzo, forma de pago (día, hora, fijo o familiar)
                </p>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {selectedWorkers.map((wId) => {
                  const w = getTrabajadorById(wId);
                  const cfg = workerHours[wId] || {
                    horaEntrada: '07:00',
                    horaSalida: '16:00',
                    almuerzo: 1,
                    tarifa: 25,
                    tipoPago: 'por_jornada' as FormaPago,
                    manualPago: 25,
                    observaciones: '',
                  };
                  const net = calculateNetHoursWorked(cfg.horaEntrada, cfg.horaSalida, cfg.almuerzo).horas;
                  
                  let pay = 0;
                  if (cfg.tipoPago === 'sin_pago') {
                    pay = 0;
                  } else if (cfg.tipoPago === 'pago_fijo') {
                    pay = cfg.manualPago !== undefined ? cfg.manualPago : cfg.tarifa;
                  } else {
                    pay = calculateWorkerPay(net, cfg.tipoPago, cfg.tarifa);
                  }

                  return (
                    <div key={wId} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                      {/* Cabecera del trabajador */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-sm">{w?.nombreCompleto}</span>
                          <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            {net} hrs netas
                          </span>
                        </div>
                        <span className="text-sm font-extrabold text-emerald-700">
                          {cfg.tipoPago === 'sin_pago' ? '$0.00 (Familiar)' : formatCurrency(pay)}
                        </span>
                      </div>

                      {/* Selector de Forma de Pago */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">
                          Forma de Pago
                        </label>
                        <select
                          value={cfg.tipoPago}
                          onChange={(e) => {
                            const newTipo = e.target.value as FormaPago;
                            setWorkerHours((prev) => ({
                              ...prev,
                              [wId]: {
                                ...cfg,
                                tipoPago: newTipo,
                                tarifa:
                                  newTipo === 'sin_pago'
                                    ? 0
                                    : newTipo === 'por_hora'
                                    ? w?.tarifaHora || 3.5
                                    : w?.tarifaDia || 25,
                              },
                            }));
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                        >
                          <option value="por_jornada">Por Jornada Completa ($/día)</option>
                          <option value="por_hora">Por Horas Netas ($/hora)</option>
                          <option value="pago_fijo">Pago Fijo Acordado ($ total)</option>
                          <option value="sin_pago">Sin Pago (Familiar / Propio $0)</option>
                        </select>
                      </div>

                      {/* Horarios y Almuerzo */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Entrada</label>
                          <input
                            type="time"
                            value={cfg.horaEntrada}
                            onChange={(e) =>
                              setWorkerHours((prev) => ({
                                ...prev,
                                [wId]: { ...cfg, horaEntrada: e.target.value },
                              }))
                            }
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Salida</label>
                          <input
                            type="time"
                            value={cfg.horaSalida}
                            onChange={(e) =>
                              setWorkerHours((prev) => ({
                                ...prev,
                                [wId]: { ...cfg, horaSalida: e.target.value },
                              }))
                            }
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Almuerzo</label>
                          <select
                            value={cfg.almuerzo}
                            onChange={(e) =>
                              setWorkerHours((prev) => ({
                                ...prev,
                                [wId]: { ...cfg, almuerzo: parseFloat(e.target.value) || 0 },
                              }))
                            }
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                          >
                            <option value="0">0h (Sin pausa)</option>
                            <option value="0.5">30 min (0.5h)</option>
                            <option value="1">1 hora (1.0h)</option>
                            <option value="1.5">1h 30 min (1.5h)</option>
                            <option value="2">2 horas (2.0h)</option>
                          </select>
                        </div>
                      </div>

                      {/* Tarifa o Monto Fijo */}
                      {cfg.tipoPago !== 'sin_pago' && (
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                            {cfg.tipoPago === 'pago_fijo'
                              ? 'Monto Total Acordado ($)'
                              : cfg.tipoPago === 'por_hora'
                              ? 'Tarifa por Hora ($/h)'
                              : 'Tarifa por Jornada ($/día)'}
                          </label>
                          {cfg.tipoPago === 'pago_fijo' ? (
                            <input
                              type="number"
                              step="0.5"
                              value={cfg.manualPago ?? cfg.tarifa}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setWorkerHours((prev) => ({
                                  ...prev,
                                  [wId]: { ...cfg, manualPago: val, tarifa: val },
                                }));
                              }}
                              className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800"
                              placeholder="Ej: 13.00"
                            />
                          ) : (
                            <input
                              type="number"
                              step="0.5"
                              value={cfg.tarifa}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setWorkerHours((prev) => ({
                                  ...prev,
                                  [wId]: { ...cfg, tarifa: val },
                                }));
                              }}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Barra de Totales */}
              <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-1 text-xs text-emerald-950">
                <div className="flex items-center justify-between font-bold">
                  <span>Total Nómina Mano de Obra:</span>
                  <span className="text-sm font-extrabold text-emerald-800">
                    {formatCurrency(totalManoObra)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-emerald-700">
                  <span>Horas Totales: {totalHorasManoObra}h</span>
                  <span>
                    ({totalHorasContratadas}h contratadas • {totalHorasFamiliares}h familiares $0)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* PASO 6: INSUMOS Y RECURSOS AGRÍCOLAS */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <Boxes className="w-10 h-10 text-emerald-600 mx-auto mb-1" />
                <h3 className="font-bold text-slate-800 text-lg">Insumos y Recursos</h3>
                <p className="text-xs text-slate-500">
                  Registra insumos utilizados de inventario y repuestos o materiales requeridos
                </p>
              </div>

              {/* Pestañas: Utilizados vs Requeridos */}
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setInsumoTab('utilizados')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                    insumoTab === 'utilizados'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Insumos Utilizados ({insumosUtilizados.length})
                </button>
                <button
                  type="button"
                  onClick={() => setInsumoTab('requeridos')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                    insumoTab === 'requeridos'
                      ? 'bg-white text-amber-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Insumos Requeridos ({insumosRequeridos.length})
                </button>
              </div>

              {insumoTab === 'utilizados' ? (
                <div className="space-y-3">
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {insumosUtilizados.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs italic">
                        No se han registrado insumos utilizados en esta labor.
                      </div>
                    ) : (
                      insumosUtilizados.map((item) => (
                        <div
                          key={item.id}
                          className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <select
                              value={item.insumoId || ''}
                              onChange={(e) => {
                                const ins = insumos.find((i) => i.id === e.target.value);
                                setInsumosUtilizados((prev) =>
                                  prev.map((it) =>
                                    it.id === item.id
                                      ? {
                                          ...it,
                                          insumoId: ins?.id,
                                          nombreInsumo: ins?.nombre || it.nombreInsumo,
                                          unidad: ins?.unidad || it.unidad,
                                          costoUnitario: ins?.costoUnitario || 0,
                                          costoTotal: (ins?.costoUnitario || 0) * it.cantidad,
                                        }
                                      : it
                                  )
                                );
                              }}
                              className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                            >
                              <option value="">Seleccionar del catálogo...</option>
                              {insumos.map((ins) => (
                                <option key={ins.id} value={ins.id}>
                                  {ins.nombre} ({ins.unidad} - ${ins.costoUnitario})
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => removeInsumoUtilizadoRow(item.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block">Cantidad</label>
                              <input
                                type="number"
                                min="0.1"
                                step="0.5"
                                value={item.cantidad}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setInsumosUtilizados((prev) =>
                                    prev.map((it) =>
                                      it.id === item.id
                                        ? { ...it, cantidad: val, costoTotal: val * it.costoUnitario }
                                        : it
                                    )
                                  );
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block">Unidad</label>
                              <input
                                type="text"
                                value={item.unidad}
                                onChange={(e) =>
                                  setInsumosUtilizados((prev) =>
                                    prev.map((it) =>
                                      it.id === item.id ? { ...it, unidad: e.target.value } : it
                                    )
                                  )
                                }
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-center"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block">Costo Total</label>
                              <div className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-center text-slate-700">
                                {formatCurrency(item.costoTotal)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={addInsumoUtilizadoRow}
                    className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-emerald-500 text-slate-600 hover:text-emerald-700 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Agregar Insumo Utilizado</span>
                  </button>

                  {totalCostoInsumos > 0 && (
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-xs font-bold text-emerald-900">
                      <span>Total Costo Insumos:</span>
                      <span>{formatCurrency(totalCostoInsumos)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {insumosRequeridos.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs italic">
                        No hay insumos requeridos ni compras pendientes.
                      </div>
                    ) : (
                      insumosRequeridos.map((item) => (
                        <div
                          key={item.id}
                          className="bg-amber-50/50 p-3 rounded-2xl border border-amber-200 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Nombre del insumo / repuesto requerido..."
                              value={item.nombreInsumo}
                              onChange={(e) =>
                                setInsumosRequeridos((prev) =>
                                  prev.map((it) =>
                                    it.id === item.id ? { ...it, nombreInsumo: e.target.value } : it
                                  )
                                )
                              }
                              className="flex-1 px-2.5 py-1.5 bg-white border border-amber-200 rounded-xl text-xs font-semibold text-slate-800"
                            />
                            <button
                              type="button"
                              onClick={() => removeInsumoRequeridoRow(item.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setInsumosRequeridos((prev) =>
                                    prev.map((it) => (it.id === item.id ? { ...it, cantidad: val } : it))
                                  );
                                }}
                                className="w-16 px-2 py-1 bg-white border border-amber-200 rounded-xl text-xs font-bold text-center"
                              />
                              <input
                                type="text"
                                placeholder="Unidad"
                                value={item.unidad}
                                onChange={(e) =>
                                  setInsumosRequeridos((prev) =>
                                    prev.map((it) =>
                                      it.id === item.id ? { ...it, unidad: e.target.value } : it
                                    )
                                  )
                                }
                                className="flex-1 px-2 py-1 bg-white border border-amber-200 rounded-xl text-xs"
                              />
                            </div>

                            <label className="flex items-center gap-2 justify-end text-xs font-bold text-amber-900 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.urgente}
                                onChange={(e) =>
                                  setInsumosRequeridos((prev) =>
                                    prev.map((it) =>
                                      it.id === item.id ? { ...it, urgente: e.target.checked } : it
                                    )
                                  )
                                }
                                className="w-4 h-4 rounded text-amber-600"
                              />
                              <span>Marcar Urgente</span>
                            </label>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={addInsumoRequeridoRow}
                    className="w-full py-2.5 border-2 border-dashed border-amber-200 hover:border-amber-500 text-amber-800 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Solicitar Insumo Requerido</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PASO 7: COSECHA Y PRODUCCIÓN */}
          {step === 7 && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <Sparkles className="w-10 h-10 text-emerald-600 mx-auto mb-1" />
                <h3 className="font-bold text-slate-800 text-lg">¿Hubo Cosecha?</h3>
                <p className="text-xs text-slate-500">
                  Registra variedad de grano, volumen cosechado, precio y gastos directos
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tieneCosecha}
                    onChange={(e) => setTieneCosecha(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-amber-950">
                    Registrar producción de cacao obtenida en esta jornada
                  </span>
                </label>

                {tieneCosecha && (
                  <div className="space-y-3 pt-2">
                    {/* Variedad de Grano */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Variedad o Tipo de Grano de Cacao *
                      </label>
                      <select
                        value={tipoGrano}
                        onChange={(e) => setTipoGrano(e.target.value as TipoGranoCacao)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                      >
                        <option value="Cacao Nacional Fino de Aroma">Cacao Nacional Fino de Aroma</option>
                        <option value="CCN-51">Cacao Clon CCN-51</option>
                        <option value="Cacao Baba (Fresco)">Cacao en Baba (Fresco en baba)</option>
                        <option value="Cacao Seco Fermentado">Cacao Seco y Fermentado</option>
                        <option value="Mezcla / Corriente">Mezcla / Corriente</option>
                      </select>
                    </div>

                    {/* Cantidad y Unidad */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Unidad</label>
                        <select
                          value={unidadCosecha}
                          onChange={(e) => setUnidadCosecha(e.target.value as UnidadCosecha)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                        >
                          <option value="quintales">Quintales (qq)</option>
                          <option value="libras">Libras (lb)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Cantidad Cosechada ({unidadCosecha === 'quintales' ? 'qq' : 'lb'})
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={cantidadCosecha}
                          onChange={(e) => setCantidadCosecha(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Precio Unitario y Gastos Directos */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Precio de Venta ($/{unidadCosecha === 'quintales' ? 'qq' : 'lb'})
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={precioUnitarioCosecha}
                          onChange={(e) => setPrecioUnitarioCosecha(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Gastos Directos (Flete/Acarreo $)
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={gastosCosecha}
                          onChange={(e) => setGastosCosecha(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Caja de Ingreso Neto */}
                    <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Ingreso Bruto de Venta:</span>
                        <span className="font-bold">{formatCurrency(ingresoBrutoCosecha)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Gastos Directos:</span>
                        <span className="font-bold text-rose-600">-{formatCurrency(gastosCosecha)}</span>
                      </div>
                      <div className="flex justify-between text-amber-950 font-black border-t border-slate-100 pt-1 text-sm">
                        <span>Ganancia Neta Cosecha:</span>
                        <span className="text-emerald-700">{formatCurrency(ingresoNetoCosecha)}</span>
                      </div>
                    </div>

                    {/* Desglose por Propietario si hay varias cuadras */}
                    {distinctOwnerIds.length > 1 && (
                      <div className="p-3 bg-amber-100/60 rounded-xl border border-amber-200 space-y-2">
                        <span className="text-[11px] font-bold text-amber-900 block">
                          Distribución Proporcional por Propietario:
                        </span>
                        {calculatedCosechasPorPropietario.map((cp) => {
                          const p = getPropietarioById(cp.propietarioId);
                          return (
                            <div
                              key={cp.id}
                              className="flex items-center justify-between text-xs bg-white/80 p-2 rounded-lg"
                            >
                              <span className="font-semibold text-slate-800">{p?.nombreCompleto}:</span>
                              <span className="font-bold text-amber-900">
                                {cp.cantidad} {unidadCosecha === 'quintales' ? 'qq' : 'lb'} •{' '}
                                {formatCurrency(cp.gananciaNeta)} neto
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones Generales de la Jornada
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalles sobre el clima, estado de la plantación o instrucciones..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* PASO 8: RESUMEN Y CONFIRMACIÓN */}
          {step === 8 && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-1" />
                <h3 className="font-bold text-slate-800 text-lg">Resumen de la Jornada</h3>
                <p className="text-xs text-slate-500">Confirma las variables registradas antes de guardar</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Fecha:</span>
                  <span className="font-bold text-slate-800">
                    {fecha} {esAgrupada ? `al ${fechaFin} (Agrupada)` : ''}
                  </span>
                </div>

                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Labor:</span>
                  <span className="font-bold text-slate-800">
                    {tiposTrabajo.find((t) => t.id === tipoTrabajoId)?.nombre}
                  </span>
                </div>

                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Cuadras ({selectedCuadras.length}):</span>
                  <span className="font-bold text-slate-800 text-right">
                    {selectedCuadras.map((cId) => getCuadraById(cId)?.nombre).join(', ')}
                  </span>
                </div>

                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Personal ({selectedWorkers.length}):</span>
                  <span className="font-bold text-slate-800 text-right">
                    {selectedWorkers.map((wId) => getTrabajadorById(wId)?.nombreCompleto).join(', ')}
                  </span>
                </div>

                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Mano de Obra:</span>
                  <span className="font-bold text-emerald-800">
                    {totalHorasManoObra}h ({totalHorasContratadas}h pagadas + {totalHorasFamiliares}h fam.) •{' '}
                    {formatCurrency(totalManoObra)}
                  </span>
                </div>

                {insumosUtilizados.length > 0 && (
                  <div className="flex justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">
                      Insumos Utilizados ({insumosUtilizados.length}):
                    </span>
                    <span className="font-bold text-slate-800">{formatCurrency(totalCostoInsumos)}</span>
                  </div>
                )}

                {insumosRequeridos.length > 0 && (
                  <div className="flex justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Insumos Requeridos:</span>
                    <span className="font-bold text-amber-700">
                      {insumosRequeridos.length} insumo(s) solicitado(s)
                    </span>
                  </div>
                )}

                {tieneCosecha && cantidadCosecha > 0 && (
                  <div className="flex justify-between text-amber-950 font-bold">
                    <span>Cosecha ({tipoGrano}):</span>
                    <span>
                      {cantidadCosecha} {unidadCosecha === 'quintales' ? 'qq' : 'lb'} • Neto:{' '}
                      {formatCurrency(ingresoNetoCosecha)}
                    </span>
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-emerald-100/70 text-emerald-950 font-black flex justify-between items-center text-sm">
                  <span>Costo Total de la Jornada:</span>
                  <span>{formatCurrency(totalManoObra + totalCostoInsumos)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
          ) : (
            <div />
          )}

          {step < 8 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canGoNext()}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Jornada</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
