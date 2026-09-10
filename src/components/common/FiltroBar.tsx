import React from 'react';
import { Propietario, Cuadra, Trabajador, TipoTrabajo, FiltrosFinca } from '../../types';
import { Filter, X, Search } from 'lucide-react';

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
  // Cuadras filtradas contextualmente por el propietario seleccionado (si hay uno activo)
  const cuadrasDisponibles = filtros.propietarioId && filtros.propietarioId !== 'todos'
    ? cuadras.filter((c) => c.propietarioId === filtros.propietarioId)
    : cuadras;

  const hasActiveFilters = Boolean(
    (filtros.propietarioId && filtros.propietarioId !== 'todos') ||
    (filtros.tipoPropiedad && filtros.tipoPropiedad !== 'todos') ||
    (filtros.cuadraId && filtros.cuadraId !== 'todos') ||
    (filtros.trabajadorId && filtros.trabajadorId !== 'todos') ||
    (filtros.tipoTrabajoId && filtros.tipoTrabajoId !== 'todos') ||
    (filtros.estadoPago && filtros.estadoPago !== 'todos') ||
    filtros.fechaDesde ||
    filtros.fechaHasta ||
    filtros.searchTerm
  );

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-card space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={filtros.searchTerm || ''}
            onChange={(e) => onFilterChange('searchTerm', e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-cacao-700 transition"
          />
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition self-start md:self-auto"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpiar Filtros</span>
          </button>
        )}
      </div>

      {/* Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 text-xs">
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
    </div>
  );
};
