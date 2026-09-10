import React, { useState, useEffect } from 'react';
import { Cuadra, EstadoCuadra, TipoPropiedad } from '../../types';
import { useFarm } from '../../context/FarmContext';
import { Modal } from '../layout/Modal';
import { CheckCircle2 } from 'lucide-react';

interface CuadraFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cuadraToEdit?: Cuadra | null;
}

export const CuadraFormModal: React.FC<CuadraFormModalProps> = ({
  isOpen,
  onClose,
  cuadraToEdit,
}) => {
  const { propietarios, addCuadra, updateCuadra } = useFarm();

  const [propietarioId, setPropietarioId] = useState('');
  const [nombre, setNombre] = useState('');
  const [lugar, setLugar] = useState('');
  const [referencia, setReferencia] = useState('');
  const [tamanoM2, setTamanoM2] = useState<number>(10000);
  const [tipoPropiedad, setTipoPropiedad] = useState<TipoPropiedad>('propia');
  const [estado, setEstado] = useState<EstadoCuadra>('activa');
  const [observaciones, setObservaciones] = useState('');

  // Errores inline
  const [errors, setErrors] = useState<{
    propietarioId?: string;
    nombre?: string;
    lugar?: string;
    tamanoM2?: string;
  }>({});

  useEffect(() => {
    if (cuadraToEdit) {
      setPropietarioId(cuadraToEdit.propietarioId);
      setNombre(cuadraToEdit.nombre);
      setLugar(cuadraToEdit.lugar || (cuadraToEdit as any).ubicacion || '');
      setReferencia(cuadraToEdit.referencia || '');
      setTamanoM2(cuadraToEdit.tamanoM2);
      setTipoPropiedad(cuadraToEdit.tipoPropiedad || 'propia');
      setEstado(cuadraToEdit.estado);
      setObservaciones(cuadraToEdit.observaciones || '');
    } else {
      setPropietarioId(propietarios[0]?.id || '');
      setNombre('');
      setLugar('');
      setReferencia('');
      setTamanoM2(10000);
      setTipoPropiedad('propia');
      setEstado('activa');
      setObservaciones('');
    }
    setErrors({});
  }, [cuadraToEdit, isOpen, propietarios]);

  const validate = () => {
    const newErrors: {
      propietarioId?: string;
      nombre?: string;
      lugar?: string;
      tamanoM2?: string;
    } = {};

    if (!propietarioId) {
      newErrors.propietarioId = 'Debes asignar obligatoriamente un propietario a la cuadra.';
    }
    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre o identificador de la cuadra es obligatorio.';
    }
    if (!lugar.trim()) {
      newErrors.lugar = 'El lugar o sector del terreno es obligatorio.';
    }
    if (!tamanoM2 || Number(tamanoM2) <= 0) {
      newErrors.tamanoM2 = 'Los metros de terreno deben ser mayores que 0.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (cuadraToEdit) {
      await updateCuadra(cuadraToEdit.id, {
        propietarioId,
        nombre: nombre.trim(),
        lugar: lugar.trim(),
        referencia: referencia.trim(),
        tamanoM2: Number(tamanoM2),
        tipoPropiedad,
        estado,
        observaciones: observaciones.trim(),
      });
    } else {
      await addCuadra({
        propietarioId,
        nombre: nombre.trim(),
        lugar: lugar.trim(),
        referencia: referencia.trim(),
        tamanoM2: Number(tamanoM2),
        tipoPropiedad,
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
      title={cuadraToEdit ? 'Editar Cuadra de Cacao' : 'Registrar Nueva Cuadra / Parcela'}
      subtitle="Asigna el propietario responsable, tipo de terreno propio o de tercero y superficie"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Propietario y Tipo de Propiedad */}
        <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Propietario Responsable *
              </label>
              <select
                value={propietarioId}
                onChange={(e) => {
                  setPropietarioId(e.target.value);
                  if (errors.propietarioId) setErrors({ ...errors, propietarioId: undefined });
                }}
                className={`w-full px-3 py-2 rounded-xl border text-xs bg-white font-semibold transition ${
                  errors.propietarioId ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              >
                <option value="">-- Selecciona un propietario --</option>
                {propietarios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombreCompleto} ({p.identificacion})
                  </option>
                ))}
              </select>
              {errors.propietarioId && (
                <span className="text-rose-600 text-[11px] font-semibold mt-1 block">
                  ⚠ {errors.propietarioId}
                </span>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Tipo de Propiedad *
              </label>
              <select
                value={tipoPropiedad}
                onChange={(e) => setTipoPropiedad(e.target.value as TipoPropiedad)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              >
                <option value="propia">Terreno Propio (Mis cuadras)</option>
                <option value="tercero">Terreno de Tercero (Asociado/Aparcería)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Nombre de la Cuadra */}
        <div>
          <label className="block font-bold text-slate-800 mb-1">
            Nombre o Identificador de la Cuadra *
          </label>
          <input
            type="text"
            placeholder="Ej: Cuadra 6 - La Esperanza"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (errors.nombre) setErrors({ ...errors, nombre: undefined });
            }}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs transition ${
              errors.nombre ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
            }`}
          />
          {errors.nombre && (
            <span className="text-rose-600 text-[11px] font-semibold mt-1 block">
              ⚠ {errors.nombre}
            </span>
          )}
        </div>

        {/* Lugar y Superficie */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Lugar / Sector *
            </label>
            <input
              type="text"
              placeholder="Ej: Sector Norte - Lote C"
              value={lugar}
              onChange={(e) => {
                setLugar(e.target.value);
                if (errors.lugar) setErrors({ ...errors, lugar: undefined });
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs transition ${
                errors.lugar ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
              }`}
            />
            {errors.lugar && (
              <span className="text-rose-600 text-[11px] font-semibold mt-1 block">
                ⚠ {errors.lugar}
              </span>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Superficie del Terreno (m²) *
            </label>
            <input
              type="number"
              min="1"
              step="100"
              placeholder="10000"
              value={tamanoM2}
              onChange={(e) => {
                setTamanoM2(Number(e.target.value));
                if (errors.tamanoM2) setErrors({ ...errors, tamanoM2: undefined });
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold transition ${
                errors.tamanoM2 ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
              }`}
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Equivalente a {(tamanoM2 / 10000).toFixed(2)} hectáreas
            </span>
          </div>
        </div>

        {/* Ubicación / Referencia */}
        <div>
          <label className="block font-bold text-slate-800 mb-1">
            Ubicación o Referencia Adicional
          </label>
          <input
            type="text"
            placeholder="Ej: Cerca al canal de riego principal y lindero de palmeras"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs transition"
          />
        </div>

        {/* Estado de la Cuadra */}
        <div>
          <label className="block font-bold text-slate-800 mb-1">
            Estado de la Cuadra *
          </label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoCuadra)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs transition bg-white font-semibold"
          >
            <option value="activa">Activa (En producción continua)</option>
            <option value="mantenimiento">En Mantenimiento / Poda / Renovación</option>
            <option value="inactiva">Inactiva / En descanso</option>
          </select>
        </div>

        {/* Observaciones */}
        <div>
          <label className="block font-bold text-slate-800 mb-1">
            Observaciones
          </label>
          <textarea
            rows={2}
            placeholder="Variedad de cacao predominante, edad de los árboles, tipo de suelo..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs transition resize-none"
          />
        </div>

        {/* Botones de acción */}
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
            <span>{cuadraToEdit ? 'Guardar Cambios' : 'Registrar Cuadra'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
