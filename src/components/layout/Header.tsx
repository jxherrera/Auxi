import React from 'react';
import { useFarm } from '../../context/FarmContext';
import { PlusCircle, Download, Menu, Calendar, Sparkles } from 'lucide-react';
import { formatDateLong } from '../../utils/formatters';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenNuevaVinculacion: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onOpenNuevaVinculacion,
}) => {
  const { activeView, exportDataJSON, stats } = useFarm();

  const viewTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Panel General de Operaciones',
      subtitle: 'Resumen consolidado de cuadras, producción de cacao y mano de obra',
    },
    cuadras: {
      title: 'Registro de Cuadras y Parcelas',
      subtitle: 'Control geográfico, tamaño, estado fitosanitario e historial por cuadra',
    },
    trabajadores: {
      title: 'Directorio de Trabajadores',
      subtitle: 'Administración de personal agrícola, tarifas y récord de labores',
    },
    'tipos-trabajo': {
      title: 'Catálogo de Tipos de Trabajo',
      subtitle: 'Definición de actividades agrícolas, labores culturales y esquemas de registro',
    },
    vinculacion: {
      title: 'Vinculación de Trabajo y Jornadas',
      subtitle: 'Asignación de labores, registro diario o agrupado y cálculo automático de pagos',
    },
    resultados: {
      title: 'Registro de Resultados & Insumos',
      subtitle: 'Cosechas (quintales e ingresos) y materiales utilizados o requeridos en campo',
    },
    pagos: {
      title: 'Control de Pagos y Nómina de Jornales',
      subtitle: 'Liquidación de horas trabajadas, pagos pendientes y emisión de comprobantes',
    },
    reportes: {
      title: 'Reportes y Rentabilidad Agrícola',
      subtitle: 'Análisis financiero por cuadra, producción de cacao y proyección de materiales',
    },
    trazabilidad: {
      title: 'Historial y Trazabilidad 360°',
      subtitle: 'Auditoría integral: responde al instante las 12 preguntas de la operación',
    },
    'mi-cuenta': {
      title: 'Mi Cuenta y Perfil',
      subtitle: 'Gestión de credenciales de acceso, datos personales y seguridad',
    },
    usuarios: {
      title: 'Gestión de Usuarios y Accesos',
      subtitle: 'Administración de operadores, roles y restablecimiento de claves',
    },
  };

  const current = viewTitles[activeView] || viewTitles.dashboard;
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {current.title}
              </h1>
              {stats.materialesRequeridosUrgentes.length > 0 && (
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-rose-500" />
                  {stats.materialesRequeridosUrgentes.length} materiales requeridos
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Date badge & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Farm & Date Pill */}
          <div className="hidden xl:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/60 text-xs font-medium text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-cacao-600" />
            <span>{formatDateLong(todayStr)}</span>
            <span className="text-slate-300">|</span>
            <span className="text-agri-700 font-semibold">Hda. San Rafael (Cacao Fino)</span>
          </div>

          {/* New Linking Button */}
          <button
            onClick={onOpenNuevaVinculacion}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cacao-800 hover:bg-cacao-900 text-white text-xs font-semibold shadow-xs hover:shadow transition"
          >
            <PlusCircle className="w-4 h-4 text-harvest-400" />
            <span className="hidden sm:inline">Vincular Trabajo</span>
            <span className="sm:hidden">Vincular</span>
          </button>

          {/* Backup Button */}
          <button
            onClick={exportDataJSON}
            title="Exportar copia de seguridad (JSON)"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
