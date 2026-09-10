import React, { useState, useEffect } from 'react';
import { Propietario, EstadoPropietario } from '../../types';
import { useFarm } from '../../context/FarmContext';
import { Modal } from '../layout/Modal';
import { CheckCircle2 } from 'lucide-react';

interface PropietarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  propietarioToEdit?: Propietario | null;
}

export const PropietarioFormModal: React.FC<PropietarioFormModalProps> = ({
  isOpen,
  onClose,
  propietarioToEdit,
}) => {
  const { addPropietario, updatePropietario } = useFarm();

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [identificacion, setIdentificacion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [estado, setEstado] = useState<EstadoPropietario>('activo');
  const [observaciones, setObservaciones] = useState('');

  // Errores inline
  const [errors, setErrors] = useState<{ nombreCompleto?: string; identificacion?: string }>({});

  useEffect(() => {
    if (propietarioToEdit) {
      setNombreCompleto(propietarioToEdit.nombreCompleto);
      setIdentificacion(propietarioToEdit.identificacion);
      setTelefono(propietarioToEdit.telefono || '');
      setDireccion(propietarioToEdit.direccion || '');
      setEstado(propietarioToEdit.estado);
      setObservaciones(propietarioToEdit.observaciones || '');
    } else {
      setNombreCompleto('');
      setIdentificacion('');
      setTelefono('');
      setDireccion('');
      setEstado('activo');
      setObservaciones('');
    }
    setErrors({});
  }, [propietarioToEdit, isOpen]);

  const validate = () => {
    const newErrors: { nombreCompleto?: string; identificacion?: string } = {};
    if (!nombreCompleto.trim()) {
      newErrors.nombreCompleto = 'El nombre completo es obligatorio.';
    }
    if (!identificacion.trim()) {
      newErrors.identificacion = 'La identificación o código interno es obligatorio.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (propietarioToEdit) {
      await updatePropietario(propietarioToEdit.id, {
        nombreCompleto: nombreCompleto.trim(),
        identificacion: identificacion.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        estado,
        observaciones: observaciones.trim(),
      });
    } else {
      await addPropietario({
        nombreCompleto: nombreCompleto.trim(),
        identificacion: identificacion.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
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
      title={propietarioToEdit ? 'Editar Propietario de Terreno' : 'Registrar Nuevo Propietario'}
      subtitle="Ingresa los datos personales, código identificador y dirección de referencia"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-800 mb-1">
            Nombre Completo del Propietario *
          </label>
          <input
            type="text"
            placeholder="Ej: Mayra González"
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
              Identificación o Código Interno *
            </label>
            <input
              type="text"
              placeholder="Ej: 0928374610 o PROP-01"
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
              Teléfono de Contacto
            </label>
            <input
              type="tel"
              placeholder="Ej: 0998877665"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs transition"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-800 mb-1">
            Dirección o Ubicación de Referencia
          </label>
          <input
            type="text"
            placeholder="Ej: Recinto El Cacao, Sector Central o Parroquia Rural"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs transition"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-800 mb-1">
            Estado Operativo *
          </label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoPropietario)}
            className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs transition bg-white font-semibold"
          >
            <option value="activo">Activo (Con terrenos en administración activa)</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-800 mb-1">
            Observaciones o Notas
          </label>
          <textarea
            rows={2}
            placeholder="Condiciones de aparcería, acuerdos de cosecha, acuerdos familiares..."
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
            <span>{propietarioToEdit ? 'Guardar Cambios' : 'Registrar Propietario'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
