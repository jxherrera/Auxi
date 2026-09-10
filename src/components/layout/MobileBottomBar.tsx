import React, { useState } from 'react';
import { useFarm, ActiveView } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Briefcase,
  Sprout,
  Menu,
  X,
  Trees,
  Users,
  CreditCard,
  BarChart3,
  Shield,
  User,
  LogOut,
  Building2,
  Boxes,
} from 'lucide-react';

export const MobileBottomBar: React.FC = () => {
  const { activeView, setActiveView } = useFarm();
  const { user, isAdmin, logout } = useAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const isMainTabActive = (tab: 'inicio' | 'trabajo' | 'produccion') => {
    if (tab === 'inicio') return activeView === 'dashboard';
    if (tab === 'trabajo') return ['vinculacion', 'trabajadores', 'tipos-trabajo'].includes(activeView);
    if (tab === 'produccion') return ['resultados', 'insumos', 'cuadras', 'propietarios'].includes(activeView);
    return false;
  };

  const navigateTo = (view: ActiveView) => {
    setActiveView(view);
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* "Más" slide-up drawer for mobile */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="fixed inset-0"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="relative bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-6 pb-24 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  {user?.nombre.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{user?.nombre}</h3>
                  <span className="text-[11px] text-slate-500 font-medium">{user?.rol}</span>
                </div>
              </div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => navigateTo('propietarios')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition ${
                  activeView === 'propietarios' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-100 bg-slate-50 text-slate-700'
                }`}
              >
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold">Propietarios</span>
              </button>

              <button
                onClick={() => navigateTo('cuadras')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition ${
                  activeView === 'cuadras' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-100 bg-slate-50 text-slate-700'
                }`}
              >
                <Trees className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold">Cuadras</span>
              </button>

              <button
                onClick={() => navigateTo('trabajadores')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition ${
                  activeView === 'trabajadores' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-100 bg-slate-50 text-slate-700'
                }`}
              >
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold">Trabajadores</span>
              </button>

              <button
                onClick={() => navigateTo('pagos')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition ${
                  activeView === 'pagos' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-100 bg-slate-50 text-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold">Pagos y Nómina</span>
              </button>

              <button
                onClick={() => navigateTo('insumos')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition ${
                  activeView === 'insumos' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-100 bg-slate-50 text-slate-700'
                }`}
              >
                <Boxes className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-bold">Insumos</span>
              </button>

              <button
                onClick={() => navigateTo('reportes')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition ${
                  activeView === 'reportes' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-100 bg-slate-50 text-slate-700'
                }`}
              >
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <span className="text-xs font-bold">Reportes</span>
              </button>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2">
              <button
                onClick={() => navigateTo('mi-cuenta')}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-bold"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>Mi Cuenta</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => navigateTo('usuarios')}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-bold"
                >
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>Gestión de Usuarios</span>
                </button>
              )}

              <button
                onClick={logout}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-rose-50 text-rose-600 text-xs font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-2 shadow-lg flex items-center justify-around select-none">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] rounded-xl transition-all ${
            isMainTabActive('inicio') ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className={`w-5 h-5 mb-0.5 ${isMainTabActive('inicio') ? 'text-emerald-600 stroke-[2.5]' : ''}`} />
          <span className="text-[10px]">Inicio</span>
        </button>

        <button
          onClick={() => setActiveView('vinculacion')}
          className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] rounded-xl transition-all ${
            isMainTabActive('trabajo') ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className={`w-5 h-5 mb-0.5 ${isMainTabActive('trabajo') ? 'text-emerald-600 stroke-[2.5]' : ''}`} />
          <span className="text-[10px]">Trabajo</span>
        </button>

        <button
          onClick={() => setActiveView('resultados')}
          className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] rounded-xl transition-all ${
            isMainTabActive('produccion') ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sprout className={`w-5 h-5 mb-0.5 ${isMainTabActive('produccion') ? 'text-emerald-600 stroke-[2.5]' : ''}`} />
          <span className="text-[10px]">Producción</span>
        </button>

        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] rounded-xl transition-all ${
            showMoreMenu ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Más</span>
        </button>
      </nav>
    </>
  );
};
