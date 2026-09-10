import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { Cuadra } from '../../types';
import { CuadraDetailModal } from './CuadraDetailModal';
import { CuadraFormModal } from './CuadraFormModal';
import {
  Trees,
  Plus,
  Search,
  MapPin,
  Maximize2,
  Edit2,
  Trash2,
  Eye,
  LayoutGrid,
  List,
  Building2,
} from 'lucide-react';
import { formatArea, formatNumber } from '../../utils/formatters';

export const CuadrasView: React.FC = () => {
  const { cuadras, propietarios, deleteCuadra, rentabilidades, getPropietarioById } = useFarm();
  const { confirm } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipoPropiedad, setFilterTipoPropiedad] = useState<'todos' | 'propia' | 'tercero'>('todos');
  const [filterPropietario, setFilterPropietario] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCuadraForEdit, setSelectedCuadraForEdit] = useState<Cuadra | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCuadraForDetail, setSelectedCuadraForDetail] = useState<Cuadra | null>(null);

  const filteredCuadras = cuadras.filter((c) => {
    const prop = getPropietarioById(c.propietarioId);
    const matchesSearch =
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.lugar && c.lugar.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.referencia && c.referencia.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prop && prop.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTipo = filterTipoPropiedad === 'todos' || c.tipoPropiedad === filterTipoPropiedad;
    const matchesProp = filterPropietario === 'todos' || c.propietarioId === filterPropietario;
    const matchesEstado = filterEstado === 'todos' || c.estado === filterEstado;

    return matchesSearch && matchesTipo && matchesProp && matchesEstado;
  });

  const handleOpenNew = () => {
    setSelectedCuadraForEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cuadra: Cuadra) => {
    setSelectedCuadraForEdit(cuadra);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (cuadra: Cuadra) => {
    setSelectedCuadraForDetail(cuadra);
    setIsDetailOpen(true);
  };

  const handleDelete = (cuadra: Cuadra) => {
    confirm({
      title: '¿Eliminar esta cuadra?',
      message: `¿Estás seguro de eliminar la ${cuadra.nombre}? Esta acción eliminará la relación con sus registros asociados.`,
      type: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        await deleteCuadra(cuadra.id);
      },
    });
  };

  const totalM2 = cuadras.reduce((acc, c) => acc + (c.tamanoM2 || 0), 0);
  const propiasCount = cuadras.filter((c) => c.tipoPropiedad === 'propia').length;
  const tercerosCount = cuadras.filter((c) => c.tipoPropiedad === 'tercero').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cacao-100 text-cacao-800">
            <Trees className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Parcelas y Cuadras de Cacao</h2>
            <p className="text-xs text-slate-500">
              {cuadras.length} cuadras registradas ({propiasCount} propias • {tercerosCount} de terceros) — Total: {formatNumber(totalM2)} m² ({(totalM2 / 10000).toFixed(2)} ha)
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cacao-800 hover:bg-cacao-900 text-white text-xs font-bold shadow-xs hover:shadow transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-harvest-400" />
          <span>Registrar Cuadra</span>
        </button>
      </div>

      {/* Tabs rápidos: Todas vs Mis Cuadras (Propias) vs De Terceros */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, lugar, referencia o propietario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-hidden focus:border-cacao-700 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Ownership Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setFilterTipoPropiedad('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterTipoPropiedad === 'todos' ? 'bg-white text-cacao-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({cuadras.length})
            </button>
            <button
              onClick={() => setFilterTipoPropiedad('propia')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterTipoPropiedad === 'propia' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Mis Cuadras ({propiasCount})</span>
            </button>
            <button
              onClick={() => setFilterTipoPropiedad('tercero')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterTipoPropiedad === 'tercero' ? 'bg-white text-amber-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>De Terceros ({tercerosCount})</span>
            </button>
          </div>

          {/* Propietario Filter */}
          <select
            value={filterPropietario}
            onChange={(e) => setFilterPropietario(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-hidden focus:border-cacao-700"
          >
            <option value="todos">Todos los propietarios</option>
            {propietarios.map((p) => (
              <option key={p.id} value={p.id}>{p.nombreCompleto}</option>
            ))}
          </select>

          {/* Estado */}
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-hidden focus:border-cacao-700"
          >
            <option value="todos">Todos los estados</option>
            <option value="activa">Activa</option>
            <option value="mantenimiento">En Mantenimiento</option>
            <option value="inactiva">Inactiva</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-white text-cacao-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Vista en Tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-white text-cacao-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Vista en Tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCuadras.map((cuadra) => {
            const propietario = getPropietarioById(cuadra.propietarioId);
            const rent = rentabilidades.find((r) => r.cuadra.id === cuadra.id);

            const statusConfig = {
              activa: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: 'Activa' },
              inactiva: { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Inactiva' },
              mantenimiento: { bg: 'bg-amber-50 text-amber-800 border-amber-200', label: 'En Mantenimiento' },
            }[cuadra.estado];

            return (
              <div
                key={cuadra.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-card hover:shadow-soft hover:border-cacao-200 transition duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top: Badges & Actions */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          cuadra.tipoPropiedad === 'propia'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {cuadra.tipoPropiedad === 'propia' ? 'Terreno Propio' : 'De Tercero'}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusConfig.bg}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(cuadra)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cacao-700 hover:bg-slate-100 transition"
                        title="Editar cuadra"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cuadra)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Eliminar cuadra"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Propietario */}
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">{cuadra.nombre}</h3>

                  <div className="mt-2 flex items-center gap-1.5 text-xs text-cacao-800 font-medium bg-cacao-50/70 p-2 rounded-xl border border-cacao-200/50">
                    <Building2 className="w-3.5 h-3.5 text-cacao-700 shrink-0" />
                    <span>Propietario: <strong>{propietario?.nombreCompleto || 'No asignado'}</strong></span>
                  </div>

                  {/* Location & Size */}
                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cacao-600 shrink-0" />
                      <span className="truncate">{cuadra.lugar || (cuadra as any).ubicacion}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800">{formatArea(cuadra.tamanoM2)}</span>
                    </div>
                  </div>

                  {cuadra.referencia && (
                    <p className="mt-2.5 text-xs text-slate-500 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {cuadra.referencia}
                    </p>
                  )}

                  {/* Rentability Snapshot */}
                  {rent && (
                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Cosecha Acumulada:</span>
                        <strong className="text-amber-800 font-bold">{rent.totalQuintalesCosechados} qq</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block">Horas Invertidas:</span>
                        <strong className="text-slate-800 font-bold">{rent.totalHoras} hrs</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer button */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenDetail(cuadra)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-cacao-50 text-cacao-800 hover:text-cacao-950 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200/80 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Detalle y Trazabilidad 360°</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Mode */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Identificador</th>
                  <th className="py-3.5 px-4">Propietario</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4">Lugar / Sector</th>
                  <th className="py-3.5 px-4">Superficie</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCuadras.map((cuadra) => {
                  const prop = getPropietarioById(cuadra.propietarioId);

                  return (
                    <tr key={cuadra.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{cuadra.nombre}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{prop?.nombreCompleto || 'S/N'}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cuadra.tipoPropiedad === 'propia'
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {cuadra.tipoPropiedad === 'propia' ? 'Propia' : 'Tercero'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{cuadra.lugar || (cuadra as any).ubicacion}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{formatArea(cuadra.tamanoM2)}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cuadra.estado === 'activa'
                              ? 'bg-emerald-100 text-emerald-800'
                              : cuadra.estado === 'mantenimiento'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {cuadra.estado}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenDetail(cuadra)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-cacao-800"
                            title="Ver detalle 360°"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(cuadra)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-cacao-800"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cuadra)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales */}
      <CuadraFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        cuadraToEdit={selectedCuadraForEdit}
      />
      <CuadraDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        cuadra={selectedCuadraForDetail}
      />
    </div>
  );
};
