import React, { useState, useEffect } from 'react';
import { Trabajador, TipoTrabajador, EstadoTrabajador } from '../../types';
import { useFarm } from '../../context/FarmContext';
import { Modal } from '../layout/Modal';
import { CheckCircle2 } from 'lucide-react';

interface TrabajadorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  trabajadorToEdit?: Trabajador | null;
}

export const TrabajadorFormModal: React.FC<TrabajadorFormModalProps> = ({
  isOpen,
  onClose,
  trabajadorToEdit,
}) => {
  const { addTrabajador, updateTrabajador } = useFarm();

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [identificacion, setIdentificacion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipo, setTipo] = useState<TipoTrabajador>('Contratado');
  const [tarifaHora, setTarifaHora] = useState<number>(3.50);
  const [tarifaDia, setTarifaDia] = useState<number>(28.00);
  const [estado, setEstado] = useState<EstadoTrabajador>('activo');
  const [observaciones, setObservaciones] = useState('');

  // Errores inline
  const [errors, setErrors] = useState<{ nombreCompleto?: string; identificacion?: string }>({});

  useEffect(() => {
    if (trabajadorToEdit) {
      setNombreCompleto(trabajadorToEdit.nombreCompleto);
      setIdentificacion(trabajadorToEdit.identificacion);
      setTelefono(trabajadorToEdit.telefono || '');
      setTipo(trabajadorToEdit.tipo);
      setTarifaHora(trabajadorToEdit.tarifaHora);
      setTarifaDia(trabajadorToEdit.tarifaDia);
      setEstado(trabajadorToEdit.estado);
      setObservaciones(trabajadorToEdit.observaciones || '');
    } else {
      setNombreCompleto('');
      setIdentificacion('');
      setTelefono('');
      setTipo('Contratado');
      setTarifaHora(3.50);
      setTarifaDia(28.00);
      setEstado('activo');
      setObservaciones('');
    }
    setErrors({});
  }, [trabajadorToEdit, isOpen]);

  // Si cambia a Familiar, sugerir $0
  const handleTipoChange = (newTipo: TipoTrabajador) => {
    setTipo(newTipo);
    if (newTipo === 'Familiar') {
      setTarifaHora(0);
      setTarifaDia(0);
    } else if (tarifaHora === 0) {
      setTarifaHora(3.50);
      setTarifaDia(28.00);
    }
  };

  const handleTarifaHoraChange = (val: number) => {
    setTarifaHora(val);
    setTarifaDia(parseFloat((val * 8).toFixed(2)));
  };

  const validate = () => {
    const newErrors: { nombreCompleto?: string; identificacion?: string } = {};
    if (!nombreCompleto.trim()) {
      newErrors.nombreCompleto = 'El nombre completo del trabajador es obligatorio.';
    }
    if (!identificacion.trim()) {
      newErrors.identificacion = 'La identificación o cédula es obligatoria.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (trabajadorToEdit) {
      await updateTrabajador(trabajadorToEdit.id, {
        nombreCompleto: nombreCompleto.trim(),
        identificacion: identificacion.trim(),
        telefono: telefono.trim(),
        tipo,
        tarifaHora: Number(tarifaHora) || 0,
        tarifaDia: Number(tarifaDia) || 0,
        estado,
        observaciones: observaciones.trim(),
      });
    } else {
      await addTrabajador({
        nombreCompleto: nombreCompleto.trim(),
        identificacion: identificacion.trim(),
        telefono: telefono.trim(),
        tipo,
        tarifaHora: Number(tarifaHora) || 0,
        tarifaDia: Number(tarifaDia) || 0,
        estado,
        observaciones: observaciones.trim(),
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={trabajadorToEdit ? 'Editar Ficha de Trabajador' : 'Registrar Trabajador Agrícola'}
      subtitle="Define el tipo de personal (Contratado, Familiar en $0, Eventual u Otro) y su esquema tarifario"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-800 mb-1">
            Nombre Completo del Trabajador *
          </label>
          <input
            type="text"
            placeholder="Ej: Carlos Mendoza o María Elena Rivas"
            value={nombreCompleto}
            onChange={(e) => {
              setNombreCompleto(e.target.value);
              if (errors.nombreCompleto) setErrors({ ...errors, nombreCompleto: undefined });
            }}
            className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs transition ${
              errors.nombreCompleto
                ? 'border-rose-400 bg-rose-50/50'
                : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
            }`}
          />
          {errors.nombreCompleto && (
            <span className="text-rose-600 text-[11px] font-semibold mt-1 block">
              ⚠ {errors.nombreCompleto}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Identificación / Cédula / Código *
            </label>
            <input
              type="text"
              placeholder="Ej: 0928374619"
              value={identificacion}
              onChange={(e) => {
                setIdentificacion(e.target.value);
                if (errors.identificacion) setErrors({ ...errors, identificacion: undefined });
              }}
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs transition ${
                errors.identificacion
                  ? 'border-rose-400 bg-rose-50/50'
                  : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
              }`}
            />
            {errors.identificacion && (
              <span className="text-rose-600 text-[11px] font-semibold mt-1 block">
                ⚠ {errors.identificacion}
              </span>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Teléfono / Celular
            </label>
            <input
              type="tel"
              placeholder="Ej: 0984561230"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs transition"
            />
          </div>
        </div>

        {/* Clasificación de Trabajador */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Tipo de Trabajador *
            </label>
            <select
              value={tipo}
              onChange={(e) => handleTipoChange(e.target.value as TipoTrabajador)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs transition bg-white font-semibold"
            >
              <option value="Contratado">Contratado (Con pago por jornal/hora)</option>
              <option value="Familiar">Familiar (Colaboración / Tarifa $0)</option>
              <option value="Eventual">Eventual (Zafra / Cuadrilla temporal)</option>
              <option value="Otro">Otro personal</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Estado Operativo *
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoTrabajador)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs transition bg-white font-semibold"
            >
              <option value="activo">Activo (Disponible para jornadas)</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        {/* Alerta de Trabajador Familiar */}
        {tipo === 'Familiar' && (
          <div className="bg-blue-50/80 p-3 rounded-2xl border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
            <span className="text-base leading-none">♥</span>
            <span>
              <strong>Trabajo Familiar ($0):</strong> Las horas y labores se registrarán para trazabilidad y auditoría completa de la finca sin generar costo financiero a la nómina.
            </span>
          </div>
        )}

        {/* Tarifas */}
        <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 space-y-3">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">
            Esquema Tarifario de Referencia
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tarifa por Hora ($/h)
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={tarifaHora}
                onChange={(e) => handleTarifaHoraChange(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {tipo === 'Familiar' ? 'Tarifa sugerida $0.00 para familiares' : 'Base de cálculo para pago por horas'}
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tarifa por Jornal Completo (8h) ($)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={tarifaDia}
                onChange={(e) => setTarifaDia(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-800 mb-1">
            Observaciones o Rol en la Finca
          </label>
          <textarea
            rows={2}
            placeholder="Relación familiar, habilidades especiales, experiencia con motosierra o motoguadaña..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs transition resize-none"
          />
        </div>

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
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-900/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{trabajadorToEdit ? 'Guardar Cambios' : 'Registrar Trabajador'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
