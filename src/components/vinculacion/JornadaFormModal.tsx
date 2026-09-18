import React, { useState, useEffect } from 'react';
import {
  Jornada,
  TrabajadorJornada,
  FormaPago,
  PropiedadJornada,
} from '../../types';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../layout/Modal';
import {
  Plus,
  Trash2,
  Clock,
  DollarSign,
  AlertTriangle,
  Building2,
  Trees,
  Briefcase,
  CheckCircle2,
  Users,
  User,
  Sparkles,
  Calendar,
  FileText,
} from 'lucide-react';
import { calculateNetHoursWorked, calculateWorkerPay } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';

interface JornadaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  jornadaToEdit?: Jornada | null;
}

interface WorkerRowState {
  id: string;
  trabajadorId: string;
  horaEntrada: string;
  horaSalida: string;
  almuerzoHoras: number;
  horasTrabajadas: number;
  tipoPago: FormaPago;
  tarifa: number;
  pagoTotal: number;
  observaciones: string;
  error?: string | null;
}

interface PropiedadRowState {
  id: string;
  propietarioId: string;
  cuadraId: string;
  horasEstimadas: number;
  observaciones: string;
}

export const JornadaFormModal: React.FC<JornadaFormModalProps> = ({
  isOpen,
  onClose,
  jornadaToEdit,
}) => {
  const {
    cuadras,
    propietarios,
    trabajadores,
    tiposTrabajo,
    addJornada,
    updateJornada,
    getTrabajadorById,
    getCuadraById,
    getPropietarioById,
  } = useFarm();
  const { warning, error, confirm } = useToast();

  const [propiedadRows, setPropiedadRows] = useState<PropiedadRowState[]>([]);
  const [tipoTrabajoId, setTipoTrabajoId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [esAgrupada, setEsAgrupada] = useState(false);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState('');

  const [workerRows, setWorkerRows] = useState<WorkerRowState[]>([]);
  const [formErrors, setFormErrors] = useState<{ general?: string }>({});

  useEffect(() => {
    if (jornadaToEdit) {
      setTipoTrabajoId(jornadaToEdit.tipoTrabajoId);
      setFecha(jornadaToEdit.fecha);
      setFechaFin(jornadaToEdit.fechaFin || jornadaToEdit.fecha);
      setEsAgrupada(jornadaToEdit.esAgrupada);
      setObservaciones(jornadaToEdit.observaciones || '');

      if (jornadaToEdit.propiedades && jornadaToEdit.propiedades.length > 0) {
        setPropiedadRows(
          jornadaToEdit.propiedades.map((p) => ({
            id: p.id,
            propietarioId: p.propietarioId,
            cuadraId: p.cuadraId,
            horasEstimadas: p.horasEstimadas || 0,
            observaciones: p.observaciones || '',
          }))
        );
      } else {
        setPropiedadRows([
          {
            id: `prow-${Date.now()}`,
            propietarioId: jornadaToEdit.propietarioId || (propietarios[0]?.id || ''),
            cuadraId: jornadaToEdit.cuadraId || (cuadras[0]?.id || ''),
            horasEstimadas: jornadaToEdit.totalHoras || 0,
            observaciones: '',
          },
        ]);
      }

      const initialRows: WorkerRowState[] = jornadaToEdit.trabajadores.map((t) => ({
        id: t.id || `row-${Math.random()}`,
        trabajadorId: t.trabajadorId,
        horaEntrada: t.horaEntrada || '07:00',
        horaSalida: t.horaSalida || '16:00',
        almuerzoHoras: t.almuerzoHoras ?? 1.0,
        horasTrabajadas: t.horasTrabajadas,
        tipoPago: t.tipoPago,
        tarifa: t.tarifa,
        pagoTotal: t.pagoTotal,
        observaciones: t.observaciones || '',
      }));
      setWorkerRows(initialRows);
    } else {
      const validCuadra = cuadras.find((c) => propietarios.some((p) => p.id === c.propietarioId)) || cuadras[0];
      const validPropId = validCuadra?.propietarioId || propietarios[0]?.id;

      if (validCuadra && validPropId) {
        setPropiedadRows([
          {
            id: `prow-${Date.now()}`,
            propietarioId: validPropId,
            cuadraId: validCuadra.id,
            horasEstimadas: 0,
            observaciones: '',
          },
        ]);
      } else {
        setPropiedadRows([]);
      }

      if (tiposTrabajo[0]) setTipoTrabajoId(tiposTrabajo[0].id);
      setFecha(new Date().toISOString().split('T')[0]);
      setFechaFin(new Date().toISOString().split('T')[0]);
      setEsAgrupada(false);
      setObservaciones('');

      if (trabajadores.length > 0) {
        const firstTrab = trabajadores[0];
        const isFamiliar = firstTrab.tipo === 'Familiar';
        const defaultTipoPago: FormaPago = isFamiliar ? 'sin_pago' : 'por_jornada';
        const defaultTarifa = isFamiliar ? 0 : firstTrab.tarifaDia || 25.00;
        const calc = calculateNetHoursWorked('07:00', '16:00', 1.0);
        const pay = calculateWorkerPay(calc.horas, defaultTipoPago, defaultTarifa);

        setWorkerRows([
          {
            id: `row-${Date.now()}`,
            trabajadorId: firstTrab.id,
            horaEntrada: '07:00',
            horaSalida: '16:00',
            almuerzoHoras: 1.0,
            horasTrabajadas: calc.horas,
            tipoPago: defaultTipoPago,
            tarifa: defaultTarifa,
            pagoTotal: pay,
            observaciones: '',
            error: null,
          },
        ]);
      } else {
        setWorkerRows([]);
      }
    }
    setFormErrors({});
  }, [jornadaToEdit, isOpen, cuadras, propietarios, trabajadores, tiposTrabajo]);

  const handleAddPropiedadRow = () => {
    const assignedCuadras = propiedadRows.map((p) => p.cuadraId);
    const availCuadra = cuadras.find((c) => !assignedCuadras.includes(c.id)) || cuadras[0];

    if (!availCuadra) {
      error('Sin cuadras registradas', 'No hay parcelas creadas en el sistema.');
      return;
    }

    setPropiedadRows([
      ...propiedadRows,
      {
        id: `prow-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        propietarioId: availCuadra.propietarioId,
        cuadraId: availCuadra.id,
        horasEstimadas: 0,
        observaciones: '',
      },
    ]);
  };

  const handleRemovePropiedadRow = (rowId: string) => {
    if (propiedadRows.length <= 1) {
      warning('Atención', 'La jornada debe tener al menos una propiedad/cuadra asignada.');
      return;
    }
    setPropiedadRows(propiedadRows.filter((p) => p.id !== rowId));
  };

  const handlePropiedadChange = (
    rowId: string,
    field: keyof PropiedadRowState,
    value: any
  ) => {
    setPropiedadRows((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          const updated = { ...row, [field]: value };
          if (field === 'propietarioId') {
            const duenoCuadras = cuadras.filter((c) => c.propietarioId === value);
            if (duenoCuadras.length > 0) {
              updated.cuadraId = duenoCuadras[0].id;
            }
          }
          if (field === 'cuadraId') {
            const c = getCuadraById(value);
            if (c) {
              updated.propietarioId = c.propietarioId;
            }
          }
          return updated;
        }
        return row;
      })
    );
  };

  const handleAddWorkerRow = () => {
    const assignedIds = workerRows.map((r) => r.trabajadorId);
    const available = trabajadores.find((t) => !assignedIds.includes(t.id)) || trabajadores[0];

    if (!available) {
      error('Sin trabajadores disponibles', 'No hay trabajadores registrados en el sistema.');
      return;
    }

    const isFamiliar = available.tipo === 'Familiar';
    const tipoPago: FormaPago = isFamiliar ? 'sin_pago' : 'por_jornada';
    const tarifa = isFamiliar ? 0 : available.tarifaDia || 25.00;
    const calc = calculateNetHoursWorked('07:00', '16:00', 1.0);
    const pago = calculateWorkerPay(calc.horas, tipoPago, tarifa);

    setWorkerRows([
      ...workerRows,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        trabajadorId: available.id,
        horaEntrada: '07:00',
        horaSalida: '16:00',
        almuerzoHoras: 1.0,
        horasTrabajadas: calc.horas,
        tipoPago,
        tarifa,
        pagoTotal: pago,
        observaciones: '',
        error: null,
      },
    ]);
  };

  const handleRemoveWorkerRow = (rowId: string) => {
    if (workerRows.length <= 1) {
      warning('Atención', 'Una jornada debe contener al menos un trabajador.');
      return;
    }
    setWorkerRows(workerRows.filter((r) => r.id !== rowId));
  };

  const handleRowChange = (rowId: string, field: keyof WorkerRowState, value: any) => {
    setWorkerRows((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          const updated = { ...row, [field]: value };

          if (field === 'trabajadorId') {
            const t = getTrabajadorById(value);
            if (t) {
              if (t.tipo === 'Familiar') {
                updated.tipoPago = 'sin_pago';
                updated.tarifa = 0;
                updated.pagoTotal = 0;
              } else {
                updated.tipoPago = 'por_jornada';
                updated.tarifa = t.tarifaDia || 25.00;
                updated.pagoTotal = updated.tarifa;
              }
            }
          }

          const entrada = field === 'horaEntrada' ? value : row.horaEntrada;
          const salida = field === 'horaSalida' ? value : row.horaSalida;
          const almuerzo = field === 'almuerzoHoras' ? Number(value) : row.almuerzoHoras;

          const calc = calculateNetHoursWorked(entrada, salida, almuerzo);
          updated.horasTrabajadas = calc.horas;
          updated.error = calc.error;

          if (field === 'pagoTotal') {
            updated.pagoTotal = Number(value) || 0;
          } else if (field === 'tipoPago') {
            if (value === 'sin_pago') {
              updated.pagoTotal = 0;
              updated.tarifa = 0;
            } else if (value === 'pago_fijo') {
              updated.pagoTotal = updated.pagoTotal || updated.tarifa || 13.00;
            } else if (value === 'por_jornada') {
              const t = getTrabajadorById(updated.trabajadorId);
              updated.tarifa = t?.tarifaDia || 25.00;
              updated.pagoTotal = updated.tarifa;
            } else {
              const t = getTrabajadorById(updated.trabajadorId);
              updated.tarifa = t?.tarifaHora || 3.50;
              updated.pagoTotal = calculateWorkerPay(calc.horas, 'por_hora', updated.tarifa);
            }
          } else if (field === 'tarifa') {
            const nuevaTarifa = Number(value) || 0;
            updated.tarifa = nuevaTarifa;
            if (updated.tipoPago === 'por_hora') {
              updated.pagoTotal = calculateWorkerPay(calc.horas, 'por_hora', nuevaTarifa);
            } else if (updated.tipoPago === 'por_jornada') {
              updated.pagoTotal = nuevaTarifa;
            }
          } else if (field === 'horaEntrada' || field === 'horaSalida' || field === 'almuerzoHoras') {
            if (updated.tipoPago === 'por_hora') {
              updated.pagoTotal = calculateWorkerPay(calc.horas, 'por_hora', updated.tarifa);
            }
          }

          return updated;
        }
        return row;
      })
    );
  };

  const totalHoras = parseFloat(
    workerRows.reduce((acc, r) => acc + (Number(r.horasTrabajadas) || 0), 0).toFixed(2)
  );
  const totalHorasFamiliares = parseFloat(
    workerRows
      .filter((r) => r.tipoPago === 'sin_pago' || r.tarifa === 0)
      .reduce((acc, r) => acc + (Number(r.horasTrabajadas) || 0), 0)
      .toFixed(2)
  );
  const totalHorasPagadas = parseFloat((totalHoras - totalHorasFamiliares).toFixed(2));
  const totalPago = parseFloat(
    workerRows
      .filter((r) => r.tipoPago !== 'sin_pago')
      .reduce((acc, r) => acc + (Number(r.pagoTotal) || 0), 0)
      .toFixed(2)
  );

  const hasFamiliarWorkers = workerRows.some((r) => {
    const t = getTrabajadorById(r.trabajadorId);
    return t?.tipo === 'Familiar' || r.tipoPago === 'sin_pago';
  });

  const validateForm = (): boolean => {
    if (propiedadRows.length === 0) {
      setFormErrors({ general: 'Debes seleccionar al menos una propiedad/cuadra.' });
      return false;
    }
    for (const p of propiedadRows) {
      if (!p.propietarioId || !p.cuadraId) {
        setFormErrors({ general: 'Cada fila de propiedad debe tener propietario y cuadra seleccionados.' });
        return false;
      }
    }
    if (!tipoTrabajoId) {
      setFormErrors({ general: 'Debes seleccionar el tipo de trabajo.' });
      return false;
    }
    if (!fecha) {
      setFormErrors({ general: 'Debes seleccionar la fecha de la jornada.' });
      return false;
    }
    if (workerRows.length === 0) {
      setFormErrors({ general: 'Debes agregar al menos un trabajador a la jornada.' });
      return false;
    }

    for (const r of workerRows) {
      if (r.error) {
        setFormErrors({ general: `Error en horario de trabajador: ${r.error}` });
        return false;
      }
      if (!r.horaEntrada || !r.horaSalida) {
        setFormErrors({ general: 'Cada trabajador debe tener hora de entrada y salida definida.' });
        return false;
      }
    }

    setFormErrors({});
    return true;
  };

  const executeSave = async () => {
    const trabajadoresPayload: TrabajadorJornada[] = workerRows.map((r) => ({
      id: r.id.startsWith('row-') ? `jt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` : r.id,
      trabajadorId: r.trabajadorId,
      horaEntrada: r.horaEntrada,
      horaSalida: r.horaSalida,
      almuerzoHoras: Number(r.almuerzoHoras) || 0,
      horasTrabajadas: Number(r.horasTrabajadas) || 0,
      tipoPago: r.tipoPago,
      tarifa: Number(r.tarifa) || 0,
      pagoTotal: Number(r.pagoTotal) || 0,
      estadoPago: 'pendiente',
      observaciones: r.observaciones.trim(),
    }));

    const propiedadesPayload: PropiedadJornada[] = propiedadRows.map((p) => ({
      id: p.id.startsWith('prow-') ? `jp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` : p.id,
      propietarioId: p.propietarioId,
      cuadraId: p.cuadraId,
      horasEstimadas: Number(p.horasEstimadas) || 0,
      observaciones: p.observaciones.trim(),
    }));

    const primaryProp = propiedadesPayload[0];

    if (jornadaToEdit) {
      await updateJornada(jornadaToEdit.id, {
        propietarioId: primaryProp.propietarioId,
        cuadraId: primaryProp.cuadraId,
        propiedades: propiedadesPayload,
        tipoTrabajoId,
        fecha,
        fechaFin: esAgrupada ? fechaFin : fecha,
        esAgrupada,
        trabajadores: trabajadoresPayload,
        totalHoras,
        totalHorasFamiliares,
        totalPago,
        observaciones: observaciones.trim(),
      });
    } else {
      await addJornada({
        propietarioId: primaryProp.propietarioId,
        cuadraId: primaryProp.cuadraId,
        propiedades: propiedadesPayload,
        tipoTrabajoId,
        fecha,
        fechaFin: esAgrupada ? fechaFin : fecha,
        esAgrupada,
        trabajadores: trabajadoresPayload,
        totalHoras,
        totalHorasFamiliares,
        totalPago,
        observaciones: observaciones.trim(),
      });
    }

    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    confirm({
      title: jornadaToEdit ? '¿Guardar cambios de la jornada?' : '¿Registrar nueva jornada?',
      message: jornadaToEdit
        ? `Se actualizará la información de la jornada ${jornadaToEdit.codigo} (${workerRows.length} trabajador(es)).`
        : hasFamiliarWorkers
        ? `Esta jornada incluye personal familiar con pago $0.00. Sus horas se registrarán para trazabilidad del aporte familiar sin costo financiero.\n\n¿Deseas registrar la jornada?`
        : `Se registrará la jornada con ${propiedadRows.length} propiedad(es) y ${workerRows.length} trabajador(es).`,
      type: 'info',
      confirmText: jornadaToEdit ? 'Guardar Cambios' : 'Registrar Jornada',
      cancelText: 'Revisar',
      onConfirm: () => {
        executeSave();
      },
    });
  };

  const distinctOwnerIds = Array.from(new Set(propiedadRows.map((p) => p.propietarioId)));
  const distinctOwners = distinctOwnerIds.map((id) => getPropietarioById(id)?.nombreCompleto).filter(Boolean);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={jornadaToEdit ? 'Editar Jornada de Trabajo' : 'Registrar Nueva Jornada Agrícola'}
      subtitle="Vincula propietarios, parcelas y trabajadores con cálculo dinámico"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 text-xs">
        {formErrors.general && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2 font-medium animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formErrors.general}</span>
          </div>
        )}

        {/* ==========================================
            SECCIÓN 1: PROPIEDADES Y CUADRAS (MOBILE CARDS)
            ========================================== */}
        <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-3xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Trees className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                  Terrenos / Cuadras Trabajadas
                </h4>
                <p className="text-[11px] text-slate-500 truncate">
                  {propiedadRows.length} parcela(s) seleccionada(s)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddPropiedadRow}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Terreno</span>
            </button>
          </div>

          {/* Tarjetas de Terrenos */}
          <div className="space-y-2.5">
            {propiedadRows.map((pRow, idx) => {
              const cuadrasPropietario = cuadras.filter((c) => c.propietarioId === pRow.propietarioId);
              const cuadraSeleccionada = getCuadraById(pRow.cuadraId);

              return (
                <div
                  key={pRow.id}
                  className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black">
                        {idx + 1}
                      </span>
                      <span>Parcela asignada</span>
                      {cuadraSeleccionada && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
                          {cuadraSeleccionada.tipoPropiedad === 'propia' ? 'Propia' : 'Tercero'}
                        </span>
                      )}
                    </span>

                    {propiedadRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePropiedadRow(pRow.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Eliminar parcela"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Propietario */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Propietario *
                      </label>
                      <div className="relative">
                        <select
                          value={pRow.propietarioId}
                          onChange={(e) => handlePropiedadChange(pRow.id, 'propietarioId', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                        >
                          {propietarios.map((prop) => (
                            <option key={prop.id} value={prop.id}>
                              {prop.nombreCompleto} ({prop.identificacion})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Cuadra */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Cuadra / Parcela *
                      </label>
                      <select
                        value={pRow.cuadraId}
                        onChange={(e) => handlePropiedadChange(pRow.id, 'cuadraId', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                      >
                        {cuadrasPropietario.length > 0 ? (
                          cuadrasPropietario.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nombre} ({c.tipoPropiedad === 'propia' ? 'Propia' : 'Tercero'})
                            </option>
                          ))
                        ) : (
                          <option value="">Sin cuadras para este propietario</option>
                        )}
                      </select>
                    </div>

                    {/* Observación / Sector */}
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Observación / Área / Hilera
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Hileras 1 al 12, sector bajo junto a la acequia..."
                        value={pRow.observaciones}
                        onChange={(e) => handlePropiedadChange(pRow.id, 'observaciones', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-3 py-2 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-[11px] font-medium text-slate-600">
            <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{propiedadRows.length} parcela(s) en conjunto: {distinctOwners.join(', ')}</span>
            </span>
          </div>
        </div>

        {/* ==========================================
            SECCIÓN 2: LABOR Y FECHAS (MODERN CARD)
            ========================================== */}
        <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-3xl border border-slate-200/80 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Labor */}
            <div>
              <label className="font-bold text-slate-800 text-xs mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                <span>Labor o Actividad Realizada *</span>
              </label>
              <select
                value={tipoTrabajoId}
                onChange={(e) => setTipoTrabajoId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition shadow-2xs"
              >
                {tiposTrabajo.map((tp) => (
                  <option key={tp.id} value={tp.id}>
                    {tp.nombre} {tp.esCosecha ? '(Cosecha)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha y Modo Agrupada */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fecha de la Jornada *</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-emerald-800">
                  <input
                    type="checkbox"
                    checked={esAgrupada}
                    onChange={(e) => setEsAgrupada(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Varios días</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 shadow-2xs"
                />
                {esAgrupada && (
                  <>
                    <span className="text-slate-400 font-black">al</span>
                    <input
                      type="date"
                      required
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 shadow-2xs"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            SECCIÓN 3: TRABAJADORES (MOBILE-FIRST CARDS)
            ========================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Personal Asignado ({workerRows.length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Horas netas = Salida - Entrada - Almuerzo
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddWorkerRow}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Trabajador</span>
            </button>
          </div>

          {/* Lista de Tarjetas de Trabajadores */}
          <div className="space-y-3">
            {workerRows.map((row, idx) => {
              const trab = getTrabajadorById(row.trabajadorId);
              const isFamiliar = trab?.tipo === 'Familiar' || row.tipoPago === 'sin_pago';

              return (
                <div
                  key={row.id}
                  className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs hover:border-emerald-300 transition space-y-3"
                >
                  {/* Fila superior: Trabajador, Badge de Pago y Eliminar */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <select
                          value={row.trabajadorId}
                          onChange={(e) => handleRowChange(row.id, 'trabajadorId', e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 transition max-w-[200px] sm:max-w-xs truncate"
                        >
                          {trabajadores.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.nombreCompleto} ({t.tipo})
                            </option>
                          ))}
                        </select>

                        {isFamiliar && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                            ♥ Familiar ($0)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-black text-emerald-700">
                        {isFamiliar ? '$0.00' : formatCurrency(row.pagoTotal)}
                      </span>

                      {workerRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveWorkerRow(row.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Eliminar trabajador de la jornada"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Fila intermedia: Forma de Pago y Tarifa */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Forma de Pago
                      </label>
                      <select
                        value={row.tipoPago}
                        onChange={(e) => handleRowChange(row.id, 'tipoPago', e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                      >
                        <option value="por_jornada">Por jornada completa ($/día)</option>
                        <option value="por_hora">Por horas netas ($/hora)</option>
                        <option value="pago_fijo">Pago fijo acordado ($ total)</option>
                        <option value="sin_pago">Sin pago (Familiar / Propio $0)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        {row.tipoPago === 'pago_fijo'
                          ? 'Monto Acordado ($ total)'
                          : row.tipoPago === 'por_hora'
                          ? 'Tarifa por Hora ($/h)'
                          : row.tipoPago === 'por_jornada'
                          ? 'Tarifa por Día ($/día)'
                          : 'Costo financiero'}
                      </label>
                      {row.tipoPago === 'pago_fijo' ? (
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={row.pagoTotal}
                            onChange={(e) => handleRowChange(row.id, 'pagoTotal', e.target.value)}
                            className="w-full pl-7 pr-3 py-1.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900"
                            placeholder="Ej: 13.00"
                          />
                        </div>
                      ) : row.tipoPago === 'sin_pago' ? (
                        <div className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 italic">
                          Aporte familiar ($0.00)
                        </div>
                      ) : (
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={row.tarifa}
                            onChange={(e) => handleRowChange(row.id, 'tarifa', e.target.value)}
                            className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fila de Horarios y Almuerzo */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 items-center">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Entrada</label>
                      <input
                        type="time"
                        required
                        value={row.horaEntrada}
                        onChange={(e) => handleRowChange(row.id, 'horaEntrada', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-center"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Salida</label>
                      <input
                        type="time"
                        required
                        value={row.horaSalida}
                        onChange={(e) => handleRowChange(row.id, 'horaSalida', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-center"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Almuerzo</label>
                      <select
                        value={row.almuerzoHoras}
                        onChange={(e) => handleRowChange(row.id, 'almuerzoHoras', Number(e.target.value))}
                        className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-center"
                      >
                        <option value={0}>0h</option>
                        <option value={0.5}>30 min</option>
                        <option value={1}>1h</option>
                        <option value={1.5}>1.5h</option>
                        <option value={2}>2h</option>
                      </select>
                    </div>

                    <div className="col-span-3 flex items-center justify-between pt-1 border-t border-slate-200/50 text-[11px]">
                      <span className="text-slate-500 font-medium">Horas calculadas:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md ${
                          row.error
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {row.error ? row.error : `${row.horasTrabajadas} hrs netas`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ==========================================
            SECCIÓN 4: OBSERVACIONES GENERALES
            ========================================== */}
        <div>
          <label className="font-bold text-slate-800 text-xs mb-1 block">
            Observaciones Adicionales de la Jornada
          </label>
          <textarea
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Clima, incidencias, notas sobre el cultivo o herramientas..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white focus:border-emerald-500 transition"
          />
        </div>

        {/* ==========================================
            SECCIÓN 5: RESUMEN FINANCIERO DINÁMICO
            ========================================== */}
        <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 space-y-1.5 text-xs text-emerald-950 shadow-xs">
          <div className="flex items-center justify-between font-black text-sm">
            <span>Total Nómina a Liquidar:</span>
            <span className="text-emerald-800 text-base">{formatCurrency(totalPago)}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-emerald-700 font-medium">
            <span>⏱ {totalHoras}h netas totales</span>
            <span>
              ({totalHorasPagadas}h pagadas • {totalHorasFamiliares}h familiares $0)
            </span>
          </div>
        </div>

        {/* ==========================================
            BOTONES DE ACCIÓN (TOUCH-FRIENDLY)
            ========================================== */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-900/20 flex items-center gap-2 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{jornadaToEdit ? 'Guardar Cambios' : 'Registrar Jornada'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
