import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { TipoTrabajo, CategoriaTrabajo } from '../../types';
import { Modal } from '../layout/Modal';
import {
  Briefcase,
  Plus,
  Scissors,
  Grape,
  Sparkles,
  Shovel,
  SprayCan,
  Layers,
  Wrench,
  Trees,
  CheckCircle2,
  Package,
} from 'lucide-react';

export const TiposTrabajoView: React.FC = () => {
  const { tiposTrabajo, addTipoTrabajo, updateTipoTrabajo } = useFarm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoTrabajo | null>(null);

  // Form states
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<CategoriaTrabajo>('mantenimiento');
  const [descripcion, setDescripcion] = useState('');
  const [esCosecha, setEsCosecha] = useState(false);

  const handleOpenNew = () => {
    setSelectedTipo(null);
    setNombre('');
    setCategoria('mantenimiento');
    setDescripcion('');
    setEsCosecha(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tipo: TipoTrabajo) => {
    setSelectedTipo(tipo);
    setNombre(tipo.nombre);
    setCategoria(tipo.categoria);
    setDescripcion(tipo.descripcion);
    setEsCosecha(tipo.esCosecha);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    if (selectedTipo) {
      updateTipoTrabajo(selectedTipo.id, {
        nombre: nombre.trim(),
        categoria,
        descripcion: descripcion.trim(),
        esCosecha,
      });
    } else {
      addTipoTrabajo({
        nombre: nombre.trim(),
        categoria,
        descripcion: descripcion.trim(),
        esCosecha,
        icono: esCosecha ? 'Grape' : 'Briefcase',
      });
    }
    setIsModalOpen(false);
  };

  const getIcon = (nombre: string) => {
    const lower = nombre.toLowerCase();
    if (lower.includes('cosecha')) return Grape;
    if (lower.includes('poda')) return Scissors;
    if (lower.includes('limpieza')) return Sparkles;
    if (lower.includes('deshierbe')) return Shovel;
    if (lower.includes('fumigación') || lower.includes('aplicación')) return SprayCan;
    if (lower.includes('fertiliz')) return Layers;
    if (lower.includes('mantenimiento')) return Wrench;
    if (lower.includes('injerto')) return Trees;
    return Briefcase;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-800">
            <Briefcase className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Catálogo de Actividades y Labores Agrícolas</h2>
            <p className="text-xs text-slate-500">
              Configura los tipos de trabajo y el esquema de datos complementarios que se deben registrar en campo
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cacao-800 hover:bg-cacao-900 text-white text-xs font-bold shadow-xs hover:shadow transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-harvest-400" />
          <span>Nuevo Tipo de Trabajo</span>
        </button>
      </div>

      {/* Grid de Actividades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tiposTrabajo.map((tipo) => {
          const Icon = getIcon(tipo.nombre);

          return (
            <div
              key={tipo.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-card hover:shadow-soft transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2.5 rounded-xl ${
                        tipo.esCosecha
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-cacao-100 text-cacao-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{tipo.nombre}</h3>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {tipo.categoria}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      tipo.esCosecha
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {tipo.esCosecha ? 'Modo Cosecha' : 'Mantenimiento / Campo'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-2 min-h-[36px]">
                  {tipo.descripcion}
                </p>

                {/* Esquema de captura según tipo */}
                <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px]">
                  <span className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                    {tipo.esCosecha ? (
                      <>
                        <Grape className="w-3.5 h-3.5 text-amber-600" />
                        <span>Datos de Cosecha Requeridos:</span>
                      </>
                    ) : (
                      <>
                        <Package className="w-3.5 h-3.5 text-cacao-600" />
                        <span>Datos Agrícolas Requeridos:</span>
                      </>
                    )}
                  </span>

                  {tipo.esCosecha ? (
                    <ul className="space-y-1 text-slate-600">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Cantidad cosechada (quintales, kg, sacos)
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Precio de venta y gastos asociados
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Tipo de grano (Nacional Fino / CCN-51) y Ganancia
                      </li>
                    </ul>
                  ) : (
                    <ul className="space-y-1 text-slate-600">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Resultado obtenido y problemas encontrados
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Materiales utilizados (gasolina, piola, abono, etc.)
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Materiales faltantes requeridos (urgencia y perecibilidad)
                      </li>
                    </ul>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-right">
                <button
                  onClick={() => handleOpenEdit(tipo)}
                  className="text-xs font-bold text-cacao-700 hover:text-cacao-900 transition"
                >
                  Modificar Configuración
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Formulario */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTipo ? 'Modificar Tipo de Trabajo' : 'Definir Nuevo Tipo de Trabajo Agrícola'}
        subtitle="Configura los parámetros de la actividad y la lógica de registro de resultados"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nombre de la Actividad *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Injertación en parche"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-cacao-700 text-xs transition"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Categoría Agronómica *
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaTrabajo)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-cacao-700 text-xs transition bg-white"
            >
              <option value="cosecha">Cosecha y Recolección</option>
              <option value="mantenimiento">Mantenimiento y Manejo Cultural</option>
              <option value="fitosanitario">Control Fitosanitario y Sanidad</option>
              <option value="agronomico">Nutrición y Agronomía</option>
            </select>
          </div>

          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80">
            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-900">
              <input
                type="checkbox"
                checked={esCosecha}
                onChange={(e) => setEsCosecha(e.target.checked)}
                className="w-4 h-4 rounded text-cacao-700 focus:ring-cacao-700"
              />
              <span>¿Es una actividad de Cosecha de Cacao?</span>
            </label>
            <p className="text-[11px] text-amber-800 mt-1 pl-6">
              Si se marca, el sistema habilitará automáticamente campos para quintales cosechados, precio unitario de venta, cálculo de ingreso bruto y ganancia neta. Si no, habilitará registro de materiales e insumos.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Descripción de la Labor
            </label>
            <textarea
              rows={3}
              placeholder="Procedimiento estándar, herramientas requeridas, recomendaciones técnicas..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-cacao-700 text-xs transition resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cacao-800 hover:bg-cacao-900 text-white font-bold transition shadow-xs"
            >
              {selectedTipo ? 'Guardar Cambios' : 'Crear Tipo de Trabajo'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
