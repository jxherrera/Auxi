import React from 'react';
import { useFarm, ActiveView } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Trees,
  Users,
  Briefcase,
  GitMerge,
  Sparkles,
  CreditCard,
  BarChart3,
  History,
  Sprout,
  X,
  Building2,
  Boxes,
  User,
  Shield,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  adminOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeView, setActiveView, stats, vinculaciones } = useFarm();
  const { user, isAdmin, logout } = useAuth();

  const pendingPaymentsCount = vinculaciones.filter(v => v.estadoPago === 'pendiente').length;

  const navGroups: NavGroup[] = [
    {
      title: 'Principal',
      items: [
        { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Terrenos',
      items: [
        { id: 'propietarios', label: 'Propietarios', icon: Building2, badge: stats.totalPropietarios },
        { id: 'cuadras', label: 'Cuadras de Cacao', icon: Trees, badge: `${stats.totalCuadrasPropias}P / ${stats.totalCuadrasTerceros}T` },
      ],
    },
    {
      title: 'Trabajo Agrícola',
      items: [
        { id: 'vinculacion', label: 'Jornadas de Trabajo', icon: GitMerge },
        { id: 'trabajadores', label: 'Trabajadores', icon: Users, badge: stats.totalTrabajadores },
        { id: 'tipos-trabajo', label: 'Tipos de Trabajo', icon: Briefcase },
      ],
    },
    {
      title: 'Producción & Campo',
      items: [
        {
          id: 'resultados',
          label: 'Cosechas & Resultados',
          icon: Sparkles,
          badge: stats.materialesRequeridosUrgentes.length > 0 ? `${stats.materialesRequeridosUrgentes.length} req.` : undefined,
        },
        { id: 'insumos', label: 'Insumos & Inventario', icon: Boxes },
      ],
    },
    {
      title: 'Finanzas',
      items: [
        {
          id: 'pagos',
          label: 'Pagos y Nómina',
          icon: CreditCard,
          badge: pendingPaymentsCount > 0 ? `${pendingPaymentsCount} pend.` : undefined,
        },
      ],
    },
    {
      title: 'Reportes & Auditoría',
      items: [
        { id: 'reportes', label: 'Reportes y Rentabilidad', icon: BarChart3 },
        { id: 'trazabilidad', label: 'Trazabilidad 360°', icon: History },
      ],
    },
    {
      title: 'Configuración',
      items: [
        { id: 'mi-cuenta', label: 'Mi Cuenta', icon: User },
        { id: 'usuarios', label: 'Usuarios y Accesos', icon: Shield, adminOnly: true },
      ],
    },
  ];

  const handleSelect = (view: ActiveView) => {
    setActiveView(view);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-gradient-to-b from-cacao-950 via-cacao-900 to-[#1e130c] text-slate-200 border-r border-cacao-800/60 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-cacao-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-950/40 text-white">
              <Sprout className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-lg tracking-tight">AgroCacao</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-cacao-300 font-medium">Gestión de Fincas & Cacao</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-cacao-300 hover:bg-cacao-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div className="px-4 py-3 mx-4 my-2 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{user.nombre}</div>
                <div className="text-[10px] text-emerald-300 font-medium flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  <span>{user.rol}</span>
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-1.5 text-cacao-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-5">
          {navGroups.map((group, gIdx) => {
            const filteredItems = group.items.filter((item) => !item.adminOnly || isAdmin);
            if (filteredItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                <span className="px-3 text-[10px] font-black uppercase tracking-wider text-cacao-400/80">
                  {group.title}
                </span>
                <div className="space-y-1 mt-1">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group cursor-pointer ${
                          isActive
                            ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/30'
                            : 'text-cacao-200 hover:bg-cacao-800/70 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`w-4 h-4 transition-colors ${
                              isActive
                                ? 'text-white stroke-[2.4]'
                                : 'text-cacao-400 group-hover:text-emerald-400'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-emerald-800 text-emerald-100'
                                : 'bg-cacao-800 text-cacao-300 group-hover:bg-cacao-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info box */}
        <div className="p-4 border-t border-cacao-800/60 bg-cacao-950/40">
          <div className="rounded-xl p-3 bg-gradient-to-br from-cacao-900 to-cacao-950 border border-cacao-700/40 text-xs">
            <div className="flex items-center justify-between text-cacao-300 mb-1">
              <span className="font-semibold text-slate-200">Producción 2026</span>
              <span className="text-amber-400 font-bold">{stats.produccionTotalQuintales} qq</span>
            </div>
            <div className="w-full bg-cacao-800 rounded-full h-1.5 mb-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, (stats.produccionTotalQuintales / 100) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-cacao-400 flex justify-between">
              <span>Ingresos Brutos:</span>
              <span className="text-emerald-400 font-bold">${stats.ingresosCosecha.toFixed(2)}</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
