import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { Trabajador } from '../../types';
import { TrabajadorDetailModal } from './TrabajadorDetailModal';
import { TrabajadorFormModal } from './TrabajadorFormModal';
import {
  Users,
  Plus,
  Search,
  Phone,
  CreditCard,
  Edit2,
  Trash2,
  Eye,
  LayoutGrid,
  List,
  Heart,
  Clock,
  DollarSign,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const TrabajadoresView: React.FC = () => {
  const { trabajadores, deleteTrabajador, jornadas } = useFarm();
  const { confirm } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTrabajadorForEdit, setSelectedTrabajadorForEdit] = useState<Trabajador | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTrabajadorForDetail, setSelectedTrabajadorForDetail] = useState<Trabajador | null>(null);

  const filteredTrabajadores = trabajadores.filter((t) => {
    const matchesSearch =
      t.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.identificacion.includes(searchTerm) ||
      (t.telefono && t.telefono.includes(searchTerm));
    const matchesTipo = filterTipo === 'todos' || t.tipo === filterTipo;
    const matchesEstado = filterEstado === 'todos' || t.estado === filterEstado;
    return matchesSearch && matchesTipo && matchesEstado;
  });

  const handleOpenNew = () => {
    setSelectedTrabajadorForEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (trab: Trabajador) => {
    setSelectedTrabajadorForEdit(trab);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (trab: Trabajador) => {
    setSelectedTrabajadorForDetail(trab);
    setIsDetailOpen(true);
  };

  const handleDelete = (trab: Trabajador) => {
    confirm({
      title: '¿Eliminar trabajador?',
      message: `¿Estás seguro de remover a ${trab.nombreCompleto}? Esta acción se reflejará en el directorio de personal.`,
      type: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        await deleteTrabajador(trab.id);
      },
    });
  };

  const familiaresCount = trabajadores.filter((t) => t.tipo === 'Familiar').length;
  const contratadosCount = trabajadores.filter((t) => t.tipo === 'Contratado').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-100 text-blue-800">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Directorio de Personal Agrícola</h2>
            <p className="text-xs text-slate-500">
              {trabajadores.length} trabajadores registrados ({familiaresCount} familiares • {contratadosCount} contratados)
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cacao-800 hover:bg-cacao-900 text-white text-xs font-bold shadow-xs hover:shadow transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-harvest-400" />
          <span>Registrar Trabajador</span>
        </button>
      </div>

      {/* Tabs rápidos y Búsqueda */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setFilterTipo('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterTipo === 'todos' ? 'bg-white text-cacao-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({trabajadores.length})
            </button>
            <button
              onClick={() => setFilterTipo('Familiar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterTipo === 'Familiar' ? 'bg-white text-amber-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-amber-600" />
              <span>Familiares ({familiaresCount})</span>
            </button>
            <button
              onClick={() => setFilterTipo('Contratado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterTipo === 'Contratado' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Contratados ({contratadosCount})
            </button>
          </div>

          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-hidden focus:border-cacao-700"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>

          {/* Toggle View */}
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
          {filteredTrabajadores.map((trab) => {
            // Calcular horas acumuladas y pagos en todas las jornadas
            let horasAcumuladas = 0;
            let totalCobrado = 0;

            jornadas.forEach((j) => {
              j.trabajadores.forEach((tj) => {
                if (tj.trabajadorId === trab.id) {
                  horasAcumuladas += tj.horasTrabajadas || 0;
                  if (tj.estadoPago === 'pagado') {
                    totalCobrado += tj.pagoTotal || 0;
                  }
                }
              });
            });

            return (
              <div
                key={trab.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-card hover:shadow-soft transition flex flex-col justify-between"
              >
                <div>
                  {/* Type Badge & Actions */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        trab.tipo === 'Familiar'
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : trab.tipo === 'Contratado'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {trab.tipo === 'Familiar' ? 'Trabajador Familiar ($0)' : trab.tipo}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(trab)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cacao-700 hover:bg-slate-100 transition"
                        title="Editar trabajador"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(trab)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Eliminar trabajador"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Worker Name & Avatar */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl font-extrabold text-base flex items-center justify-center shrink-0 shadow-xs ${
                        trab.tipo === 'Familiar'
                          ? 'bg-amber-700 text-amber-100'
                          : 'bg-cacao-900 text-amber-400'
                      }`}
                    >
                      {trab.nombreCompleto.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                          {trab.nombreCompleto}
                        </h3>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            trab.estado === 'activo' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                          title={trab.estado}
                        />
                      </div>
                      <span className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        {trab.identificacion}
                      </span>
                    </div>
                  </div>

                  {/* Tarifa & Phone */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Tarifa convenida:</span>
                      <span className="font-bold text-slate-900">
                        {trab.tipo === 'Familiar' && trab.tarifaHora === 0 ? (
                          <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded">
                            Tarifa $0.00 (Familiar)
                          </span>
                        ) : (
                          `${formatCurrency(trab.tarifaHora)}/h (${formatCurrency(trab.tarifaDia)}/día)`
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Contacto:</span>
                      <span className="text-slate-700 flex items-center gap-1 font-medium">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {trab.telefono || 'Sin teléfono'}
                      </span>
                    </div>
                  </div>

                  {/* Hours vs Pay Summary */}
                  <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block font-semibold">Horas Aportadas:</span>
                      <strong className="text-slate-900 font-bold text-xs">{horasAcumuladas} hrs</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block font-semibold">Total Cobrado:</span>
                      <strong className="text-emerald-700 font-bold text-xs">
                        {trab.tipo === 'Familiar' && totalCobrado === 0 ? '$0.00 (Familiar)' : formatCurrency(totalCobrado)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Footer button */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenDetail(trab)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-cacao-50 text-cacao-800 hover:text-cacao-950 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200/80 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Historial y Récord de Horas</span>
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
                  <th className="py-3.5 px-4">Trabajador</th>
                  <th className="py-3.5 px-4">Identificación</th>
                  <th className="py-3.5 px-4">Tipo / Clasificación</th>
                  <th className="py-3.5 px-4">Tarifa Hora</th>
                  <th className="py-3.5 px-4">Tarifa Día</th>
                  <th className="py-3.5 px-4">Teléfono</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrabajadores.map((trab) => (
                  <tr key={trab.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{trab.nombreCompleto}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">{trab.identificacion}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                          trab.tipo === 'Familiar'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {trab.tipo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {trab.tipo === 'Familiar' && trab.tarifaHora === 0 ? '$0.00' : formatCurrency(trab.tarifaHora)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {trab.tipo === 'Familiar' && trab.tarifaDia === 0 ? '$0.00' : formatCurrency(trab.tarifaDia)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{trab.telefono || '-'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          trab.estado === 'activo'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {trab.estado}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenDetail(trab)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-cacao-800"
                          title="Ver récord de horas"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(trab)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-cacao-800"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(trab)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales */}
      <TrabajadorFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        trabajadorToEdit={selectedTrabajadorForEdit}
      />
      <TrabajadorDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        trabajador={selectedTrabajadorForDetail}
      />
    </div>
  );
};
