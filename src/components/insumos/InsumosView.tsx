import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { Insumo, CategoriaInsumo } from '../../types';
import { InsumoFormModal } from './InsumoFormModal';
import { InsumoHistorialModal } from './InsumoHistorialModal';
import {
  Package,
  Plus,
  Search,
  Filter,
  Wrench,
  Fuel,
  Sparkles,
  AlertTriangle,
  History,
  Edit2,
  Trash2,
  CheckCircle2,
  Boxes,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const CATEGORIAS_TABS: { label: string; value: CategoriaInsumo | 'todos' }[] = [
  { label: 'Todos los Insumos', value: 'todos' },
  { label: 'Herramientas', value: 'Herramientas' },
  { label: 'Combustibles & Lubricantes', value: 'Combustibles' },
  { label: 'Materiales & Empaques', value: 'Materiales' },
  { label: 'Agroquímicos & Abonos', value: 'Agroquímicos' },
  { label: 'Otros', value: 'Otros' },
];

export const InsumosView: React.FC = () => {
  const { insumos, deleteInsumo } = useFarm();
  const { confirm } = useToast();

  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaInsumo | 'todos'>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [insumoToEdit, setInsumoToEdit] = useState<Insumo | null>(null);

  const [isHistorialOpen, setIsHistorialOpen] = useState(false);
  const [insumoForHistorial, setInsumoForHistorial] = useState<Insumo | null>(null);

  const filteredInsumos = insumos.filter((ins) => {
    const matchesCat = selectedCategoria === 'todos' || ins.categoria === selectedCategoria;
    const matchesSearch =
      !searchTerm ||
      ins.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ins.observaciones && ins.observaciones.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // KPIs
  const totalInsumos = insumos.length;
  const bajoStockCount = insumos.filter((i) => i.estado === 'Bajo Stock' || i.stockActual <= 1).length;
  const totalHerramientas = insumos.filter((i) => i.categoria === 'Herramientas').length;
  const totalCombustibles = insumos.filter((i) => i.categoria === 'Combustibles').length;

  const handleOpenNew = () => {
    setInsumoToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (ins: Insumo) => {
    setInsumoToEdit(ins);
    setIsFormOpen(true);
  };

  const handleOpenHistorial = (ins: Insumo) => {
    setInsumoForHistorial(ins);
    setIsHistorialOpen(true);
  };

  const handleDelete = (ins: Insumo) => {
    confirm({
      title: '¿Eliminar insumo del catálogo?',
      message: `¿Estás seguro de eliminar "${ins.nombre}"? Si ya fue utilizado en jornadas anteriores, no podrá ser eliminado por integridad histórica.`,
      type: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        await deleteInsumo(ins.id);
      },
    });
  };

  const getCategoryIcon = (cat: CategoriaInsumo) => {
    switch (cat) {
      case 'Herramientas':
        return <Wrench className="w-4 h-4 text-amber-600" />;
      case 'Combustibles':
        return <Fuel className="w-4 h-4 text-rose-600" />;
      case 'Materiales':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'Agroquímicos':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      default:
        return <Boxes className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs sm:shadow-card">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-cacao-900 text-amber-300 shrink-0">
            <Boxes className="w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-lg font-bold text-slate-900 leading-snug">Insumos</h2>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-tight">
              Control de stock, salidas en jornadas, costos unitarios y requerimientos
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-cacao-800 hover:bg-cacao-900 text-white text-xs font-bold shadow-xs hover:shadow transition w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 text-harvest-400 shrink-0" />
          <span>+ Nuevo Insumo / Herramienta</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Insumos</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-2xl font-black text-slate-900">{totalInsumos}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">En catálogo activo</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Herramientas</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-black text-amber-900">{totalHerramientas}</span>
          <span className="text-[10px] text-amber-700/80 block mt-0.5">Desmalezadoras, machetes, palas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Combustibles</span>
            <Fuel className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-2xl font-black text-rose-900">{totalCombustibles}</span>
          <span className="text-[10px] text-rose-700/80 block mt-0.5">Gasolina, diésel, mezclas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-orange-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">Bajo Stock</span>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <span className="text-2xl font-black text-orange-900">{bajoStockCount}</span>
          <span className="text-[10px] text-orange-700/80 block mt-0.5">Requieren reposición</span>
        </div>
      </div>

      {/* Tabs de Filtro por Categoría y Buscador */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIAS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedCategoria(tab.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedCategoria === tab.value
                    ? 'bg-cacao-800 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar insumo o herramienta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:border-cacao-700 transition"
            />
          </div>
        </div>
      </div>

      {/* Tabla Principal de Insumos */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Insumo / Herramienta</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3 text-right">Stock Inicial</th>
                <th className="py-3 px-3 text-right">Salidas (Usado)</th>
                <th className="py-3 px-3 text-right">Stock Actual</th>
                <th className="py-3 px-3 text-right">Costo Unitario</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-4 text-center w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInsumos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No se encontraron insumos o herramientas con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredInsumos.map((ins) => {
                  const salidas = ins.totalConsumido ?? 0;
                  const stockActual = ins.stockActual ?? Math.max(0, ins.stockInicial - salidas);
                  const isLowStock = stockActual <= 1 || ins.estado === 'Bajo Stock';

                  return (
                    <tr key={ins.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                            {getCategoryIcon(ins.categoria)}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block text-xs">
                              {ins.nombre}
                            </span>
                            {ins.observaciones && (
                              <span className="text-[10px] text-slate-400 block line-clamp-1">
                                {ins.observaciones}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                          {ins.categoria}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right text-slate-600 font-medium">
                        {ins.stockInicial} {ins.unidad}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-amber-800">
                        {salidas} {ins.unidad}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded-lg ${
                            isLowStock
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}
                        >
                          {stockActual} {ins.unidad}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {ins.costoUnitario > 0 ? (
                          <span>
                            {formatCurrency(ins.costoUnitario)}{' '}
                            <span className="text-[10px] text-slate-400">/{ins.unidad}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">$0.00 (propio)</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ins.estado === 'Disponible'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ins.estado === 'Bajo Stock'
                              ? 'bg-amber-100 text-amber-800'
                              : ins.estado === 'Agotado'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {ins.estado}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenHistorial(ins)}
                            className="p-1.5 rounded-lg text-cacao-700 hover:bg-cacao-100 transition"
                            title="Ver historial de consumo en jornadas"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(ins)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-cacao-800 transition"
                            title="Editar insumo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(ins)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Eliminar insumo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales de Insumos */}
      <InsumoFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        insumoToEdit={insumoToEdit}
      />

      <InsumoHistorialModal
        isOpen={isHistorialOpen}
        onClose={() => setIsHistorialOpen(false)}
        insumo={insumoForHistorial}
      />
    </div>
  );
};
