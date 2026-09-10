import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { Propietario } from '../../types';
import { PropietarioFormModal } from './PropietarioFormModal';
import { PropietarioDetailModal } from './PropietarioDetailModal';
import {
  Users,
  Plus,
  Search,
  Phone,
  CreditCard,
  Trees,
  Edit2,
  Trash2,
  Eye,
  Building2,
  CheckCircle2,
  Maximize2,
} from 'lucide-react';
import { formatArea } from '../../utils/formatters';

export const PropietariosView: React.FC = () => {
  const { propietarios, cuadras, deletePropietario } = useFarm();
  const { confirm } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipoTerreno, setFilterTipoTerreno] = useState<'todos' | 'propias' | 'terceros'>('todos');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPropietarioForEdit, setSelectedPropietarioForEdit] = useState<Propietario | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPropietarioForDetail, setSelectedPropietarioForDetail] = useState<Propietario | null>(null);

  const filteredPropietarios = propietarios.filter((p) => {
    const matchesSearch =
      p.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.identificacion.includes(searchTerm) ||
      (p.telefono && p.telefono.includes(searchTerm));

    if (!matchesSearch) return false;

    if (filterTipoTerreno === 'propias') {
      const hasPropias = cuadras.some((c) => c.propietarioId === p.id && c.tipoPropiedad === 'propia');
      return hasPropias;
    }
    if (filterTipoTerreno === 'terceros') {
      const hasTerceros = cuadras.some((c) => c.propietarioId === p.id && c.tipoPropiedad === 'tercero');
      return hasTerceros;
    }

    return true;
  });

  const handleOpenNew = () => {
    setSelectedPropietarioForEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (prop: Propietario) => {
    setSelectedPropietarioForEdit(prop);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (prop: Propietario) => {
    setSelectedPropietarioForDetail(prop);
    setIsDetailOpen(true);
  };

  const handleDelete = (prop: Propietario) => {
    const cuadrasCount = cuadras.filter((c) => c.propietarioId === prop.id).length;
    if (cuadrasCount > 0) {
      confirm({
        title: 'Acción No Permitida',
        message: `El propietario ${prop.nombreCompleto} tiene ${cuadrasCount} cuadras asignadas. Debes reasignar o eliminar esas cuadras antes de poder eliminarlo.`,
        type: 'warning',
        confirmText: 'Entendido',
        onConfirm: () => {},
      });
      return;
    }

    confirm({
      title: '¿Eliminar este propietario?',
      message: `¿Estás seguro de remover a ${prop.nombreCompleto}? Esta acción no se puede deshacer.`,
      type: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        await deletePropietario(prop.id);
      },
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cacao-900 text-amber-300">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Gestión de Propietarios de Terrenos</h2>
            <p className="text-xs text-slate-500">
              Administración de propietarios, control de terrenos propios y terrenos gestionados de terceros
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cacao-800 hover:bg-cacao-900 text-white text-xs font-bold shadow-xs hover:shadow transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-harvest-400" />
          <span>Registrar Propietario</span>
        </button>
      </div>

      {/* Tabs rápidos: Todos vs Mis Terrenos vs Terrenos de Terceros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-hidden focus:border-cacao-700 transition"
          />
        </div>

        {/* Segmented Filter */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setFilterTipoTerreno('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterTipoTerreno === 'todos' ? 'bg-white text-cacao-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos los Propietarios ({propietarios.length})
          </button>
          <button
            onClick={() => setFilterTipoTerreno('propias')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              filterTipoTerreno === 'propias' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Mis Terrenos (Propios)</span>
          </button>
          <button
            onClick={() => setFilterTipoTerreno('terceros')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              filterTipoTerreno === 'terceros' ? 'bg-white text-amber-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Terrenos de Terceros</span>
          </button>
        </div>
      </div>

      {/* Grid de Propietarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPropietarios.map((prop) => {
          const cuadrasDelProp = cuadras.filter((c) => c.propietarioId === prop.id);
          const cuadrasPropias = cuadrasDelProp.filter((c) => c.tipoPropiedad === 'propia');
          const cuadrasTerceros = cuadrasDelProp.filter((c) => c.tipoPropiedad === 'tercero');
          const totalM2Prop = cuadrasDelProp.reduce((acc, c) => acc + (c.tamanoM2 || 0), 0);

          return (
            <div
              key={prop.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-card hover:shadow-soft transition flex flex-col justify-between"
            >
              <div>
                {/* Header card */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    {cuadrasPropias.length > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {cuadrasPropias.length} Terreno(s) Propio(s)
                      </span>
                    )}
                    {cuadrasTerceros.length > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        {cuadrasTerceros.length} de Terceros
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(prop)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cacao-700 hover:bg-slate-100 transition"
                      title="Editar propietario"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(prop)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Eliminar propietario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Avatar & Name */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-cacao-900 text-amber-400 font-extrabold text-base flex items-center justify-center shrink-0 shadow-xs">
                    {prop.nombreCompleto.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      {prop.nombreCompleto}
                    </h3>
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                      <CreditCard className="w-3 h-3 text-slate-400" />
                      {prop.identificacion}
                    </span>
                  </div>
                </div>

                {/* Cuadras asignadas */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-2">
                  <div>
                    <span className="text-slate-400 text-[11px] font-bold uppercase block mb-1">
                      Cuadras Asignadas ({cuadrasDelProp.length}):
                    </span>
                    {cuadrasDelProp.length === 0 ? (
                      <span className="text-slate-400 italic text-[11px]">Sin cuadras asignadas</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {cuadrasDelProp.map((c) => (
                          <span
                            key={c.id}
                            className={`px-2 py-0.5 rounded-md font-semibold text-[11px] border ${
                              c.tipoPropiedad === 'propia'
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                : 'bg-amber-50 text-amber-900 border-amber-200'
                            }`}
                          >
                            {c.nombre.split(' - ')[0]} ({c.tipoPropiedad === 'propia' ? 'Propia' : 'Tercero'})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-500">Superficie Total:</span>
                    <strong className="text-slate-800">{formatArea(totalM2Prop)}</strong>
                  </div>

                  {prop.direccion && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Ubicación:</span>
                      <span className="text-slate-700 truncate max-w-[170px]">{prop.direccion}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detail button */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleOpenDetail(prop)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-cacao-50 text-cacao-800 hover:text-cacao-950 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200/80 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Ficha 360° del Propietario</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modales */}
      <PropietarioFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        propietarioToEdit={selectedPropietarioForEdit}
      />
      <PropietarioDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        propietario={selectedPropietarioForDetail}
      />
    </div>
  );
};
