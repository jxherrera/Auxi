import React, { useState } from 'react';
import { Propietario, Cuadra, Trabajador, TipoTrabajo, FiltrosFinca } from '../../types';
import { Filter, X, Search, ChevronDown, SlidersHorizontal } from 'lucide-react';

interface FiltroBarProps {
  filtros: FiltrosFinca;
  onFilterChange: (key: keyof FiltrosFinca, value: any) => void;
  onClear: () => void;
  propietarios: Propietario[];
  cuadras: Cuadra[];
  trabajadores?: Trabajador[];
  tiposTrabajo?: TipoTrabajo[];
  showTipoPropiedad?: boolean;
  showPropietario?: boolean;
  showCuadra?: boolean;
  showTrabajador?: boolean;
  showLabor?: boolean;
  showFechas?: boolean;
  showEstadoPago?: boolean;
  searchPlaceholder?: string;
}

export const FiltroBar: React.FC<FiltroBarProps> = ({
  filtros,
  onFilterChange,
  onClear,
  propietarios,
  cuadras,
  trabajadores = [],
  tiposTrabajo = [],
  showTipoPropiedad = true,
  showPropietario = true,
  showCuadra = true,
  showTrabajador = false,
  showLabor = false,
  showFechas = false,
  showEstadoPago = false,
  searchPlaceholder = 'Buscar...',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Cuadras filtradas contextualmente por el propietario seleccionado (si hay uno activo)
  const cuadrasDisponibles = filtros.propietarioId && filtros.propietarioId !== 'todos'
    ? cuadras.filter((c) => c.propietarioId === filtros.propietarioId)
    : cuadras;

  const activeDropdownCount = [
    filtros.propietarioId && filtros.propietarioId !== 'todos',
    filtros.tipoPropiedad && filtros.tipoPropiedad !== 'todos',
    filtros.cuadraId && filtros.cuadraId !== 'todos',
    filtros.trabajadorId && filtros.trabajadorId !== 'todos',
    filtros.tipoTrabajoId && filtros.tipoTrabajoId !== 'todos',
    filtros.estadoPago && filtros.estadoPago !== 'todos',
    Boolean(filtros.fechaDesde),
    Boolean(filtros.fechaHasta),
  ].filter(Boolean).length;

  const hasActiveFilters = Boolean(
    activeDropdownCount > 0 || filtros.searchTerm
  );

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-card space-y-3">
      <div className="flex items-center gap-2.5">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={filtros.searchTerm || ''}
            onChange={(e) => onFilterChange('searchTerm', e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-cacao-700 transition bg-slate-50/50 focus:bg-white"
          />
          {filtros.searchTerm && (
            <button
              type="button"
              onClick={() => onFilterChange('searchTerm', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Botón desplegable para Filtros */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border shrink-0 ${
            isOpen || activeDropdownCount > 0
              ? 'bg-cacao-900 text-amber-300 border-cacao-950 shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Filtros</span>
          {activeDropdownCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-400 text-cacao-950 font-black text-[10px] flex items-center justify-center">
              {activeDropdownCount}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            title="Limpiar filtros"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold transition shrink-0 cursor-pointer border border-slate-200 hover:border-rose-200"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        )}
      </div>

      {/* Selector Grid Desplegable */}
      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 pt-3 border-t border-slate-100 text-xs animate-fadeIn">
        {/* Propietario */}
        {showPropietario && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Propietario
            </label>
            <select
              value={filtros.propietarioId || 'todos'}
              onChange={(e) => {
                onFilterChange('propietarioId', e.target.value);
                // Si cambia de propietario y la cuadra seleccionada ya no le pertenece, resetear cuadra
                onFilterChange('cuadraId', 'todos');
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:border-cacao-700"
            >
              <option value="todos">Todos los propietarios</option>
              {propietarios.map((p) => (
                <option key={p.id} value={p.id}>{p.nombreCompleto}</option>
              ))}
            </select>
          </div>
        )}

        {/* Tipo de Propiedad */}
        {showTipoPropiedad && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Tipo de Terreno
            </label>
            <select
              value={filtros.tipoPropiedad || 'todos'}
              onChange={(e) => onFilterChange('tipoPropiedad', e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:border-cacao-700"
            >
              <option value="todos">Todos (Propio y Tercero)</option>
              <option value="propia">Solo Mis Terrenos (Propios)</option>
              <option value="tercero">Terrenos de Terceros</option>
            </select>
          </div>
        )}

        {/* Cuadra */}
        {showCuadra && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Cuadra / Parcela
            </label>
            <select
              value={filtros.cuadraId || 'todos'}
              onChange={(e) => onFilterChange('cuadraId', e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:border-cacao-700"
            >
              <option value="todos">Todas las cuadras</option>
              {cuadrasDisponibles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.tipoPropiedad === 'propia' ? 'Propia' : 'Tercero'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Labor */}
        {showLabor && tiposTrabajo.length > 0 && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Tipo de Trabajo
            </label>
            <select
              value={filtros.tipoTrabajoId || 'todos'}
              onChange={(e) => onFilterChange('tipoTrabajoId', e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:border-cacao-700"
            >
              <option value="todos">Todas las labores</option>
              {tiposTrabajo.map((tp) => (
                <option key={tp.id} value={tp.id}>{tp.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {/* Trabajador */}
        {showTrabajador && trabajadores.length > 0 && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Trabajador
            </label>
            <select
              value={filtros.trabajadorId || 'todos'}
              onChange={(e) => onFilterChange('trabajadorId', e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:border-cacao-700"
            >
              <option value="todos">Todos los trabajadores</option>
              {trabajadores.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombreCompleto} ({t.tipo})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Estado de Pago */}
        {showEstadoPago && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Estado de Pago
            </label>
            <select
              value={filtros.estadoPago || 'todos'}
              onChange={(e) => onFilterChange('estadoPago', e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:border-cacao-700"
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="pagado">Pagados</option>
            </select>
          </div>
        )}

        {/* Fechas */}
        {showFechas && (
          <>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={filtros.fechaDesde || ''}
                onChange={(e) => onFilterChange('fechaDesde', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={filtros.fechaHasta || ''}
                onChange={(e) => onFilterChange('fechaHasta', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700"
              />
            </div>
          </>
        )}
      </div>
      )}
    </div>
  );
};
