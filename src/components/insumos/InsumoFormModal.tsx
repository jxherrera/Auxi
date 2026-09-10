import React, { useState, useEffect } from 'react';
import { Insumo, CategoriaInsumo, EstadoInsumo } from '../../types';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../layout/Modal';
import { Package, Wrench, Fuel, Sparkles, CheckCircle2, DollarSign, Layers, FileText } from 'lucide-react';

interface InsumoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  insumoToEdit?: Insumo | null;
}

const CATEGORIAS: { label: string; value: CategoriaInsumo; icon: string; defaultUnit: string }[] = [
  { label: 'Herramientas', value: 'Herramientas', icon: '🔧', defaultUnit: 'unidad' },
  { label: 'Combustibles & Lubricantes', value: 'Combustibles', icon: '⛽', defaultUnit: 'litros' },
  { label: 'Materiales & Empaques', value: 'Materiales', icon: '📦', defaultUnit: 'rollos' },
  { label: 'Agroquímicos & Abonos', value: 'Agroquímicos', icon: '🌱', defaultUnit: 'litros' },
  { label: 'Otros Insumos', value: 'Otros', icon: '📋', defaultUnit: 'unidad' },
];

export const InsumoFormModal: React.FC<InsumoFormModalProps> = ({
  isOpen,
  onClose,
  insumoToEdit,
}) => {
  const { addInsumo, updateInsumo } = useFarm();
  const { confirm, error } = useToast();

  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<CategoriaInsumo>('Herramientas');
  const [unidad, setUnidad] = useState('unidad');
  const [stockInicial, setStockInicial] = useState<number>(1);
  const [costoUnitario, setCostoUnitario] = useState<number>(0);
  const [estado, setEstado] = useState<EstadoInsumo>('Disponible');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    if (insumoToEdit) {
      setNombre(insumoToEdit.nombre);
      setCategoria(insumoToEdit.categoria);
      setUnidad(insumoToEdit.unidad);
      setStockInicial(insumoToEdit.stockInicial);
      setCostoUnitario(insumoToEdit.costoUnitario);
      setEstado(insumoToEdit.estado);
      setObservaciones(insumoToEdit.observaciones || '');
    } else {
      setNombre('');
      setCategoria('Herramientas');
      setUnidad('unidad');
      setStockInicial(1);
      setCostoUnitario(0);
      setEstado('Disponible');
      setObservaciones('');
    }
  }, [insumoToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      error('Campo requerido', 'El nombre del insumo o herramienta es obligatorio.');
      return;
    }

    confirm({
      title: insumoToEdit ? '¿Guardar cambios del insumo?' : '¿Registrar nuevo insumo?',
      message: insumoToEdit
        ? `Se actualizarán los datos de "${nombre}".`
        : `Se registrará "${nombre}" en el catálogo con stock inicial de ${stockInicial} ${unidad}.`,
      type: 'info',
      confirmText: insumoToEdit ? 'Actualizar' : 'Registrar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        if (insumoToEdit) {
          await updateInsumo(insumoToEdit.id, {
            nombre: nombre.trim(),
            categoria,
            unidad: unidad.trim(),
            stockInicial: Number(stockInicial),
            costoUnitario: Number(costoUnitario),
            estado,
            observaciones: observaciones.trim(),
          });
        } else {
          await addInsumo({
            nombre: nombre.trim(),
            categoria,
            unidad: unidad.trim(),
            stockInicial: Number(stockInicial),
            costoUnitario: Number(costoUnitario),
            estado,
            observaciones: observaciones.trim(),
          });
        }
        onClose();
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={insumoToEdit ? 'Editar Insumo o Herramienta' : 'Nuevo Insumo o Herramienta'}
      subtitle="Catálogo de herramientas, combustibles, agroquímicos y materiales de campo"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Nombre del Insumo */}
        <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Nombre del Insumo / Herramienta *
          </label>
          <div className="relative">
            <Package className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              placeholder="Ej: Desmalezadora Stihl FS-450, Gasolina Extra, Piola de amarre..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>
        </div>

        {/* Categoría Selector Mobile-First */}
        <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-2">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Categoría del Insumo *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIAS.map((c) => {
              const isSelected = categoria === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setCategoria(c.value);
                    if (!insumoToEdit) {
                      setUnidad(c.defaultUnit);
                    }
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                  }`}
                >
                  <span className="text-base leading-none">{c.icon}</span>
                  <span className="text-xs truncate">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Unidad y Cantidad */}
        <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Unidad de Medida *
            </label>
            <input
              type="text"
              required
              placeholder="unidad, litros, galones, rollos..."
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Stock Inicial / Compra *
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              required
              value={stockInicial}
              onChange={(e) => setStockInicial(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Costo Unitario ($)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={costoUnitario}
                onChange={(e) => setCostoUnitario(Number(e.target.value))}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              />
            </div>
          </div>
        </div>

        {/* Estado y Observaciones */}
        <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Estado del Insumo *
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoInsumo)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            >
              <option value="Disponible">🟢 Disponible (Listo para uso)</option>
              <option value="Bajo Stock">🟡 Bajo Stock (Próximo a agotarse)</option>
              <option value="Agotado">🔴 Agotado</option>
              <option value="En Mantenimiento">🔧 En Mantenimiento</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Notas y Especificaciones Técnicas
            </label>
            <textarea
              rows={2}
              placeholder="Marca, proveedor, mezcla requerida (2 tiempos), bodega de almacenamiento..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/20 transition active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{insumoToEdit ? 'Guardar Cambios' : 'Registrar Insumo'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
