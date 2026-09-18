import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FarmProvider, useFarm } from './context/FarmContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileBottomBar } from './components/layout/MobileBottomBar';
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/dashboard/DashboardView';
import { PropietariosView } from './components/propietarios/PropietariosView';
import { CuadrasView } from './components/cuadras/CuadrasView';
import { TrabajadoresView } from './components/trabajadores/TrabajadoresView';
import { TiposTrabajoView } from './components/trabajos/TiposTrabajoView';
import { VinculacionView } from './components/vinculacion/VinculacionView';
import { InsumosView } from './components/insumos/InsumosView';
import { ResultadosView } from './components/resultados/ResultadosView';
import { PagosView } from './components/pagos/PagosView';
import { ReportesView } from './components/reportes/ReportesView';
import { TrazabilidadView } from './components/trazabilidad/TrazabilidadView';
import { MiCuentaView } from './components/usuarios/MiCuentaView';
import { UsuariosView } from './components/usuarios/UsuariosView';
import { JornadaWizardModal } from './components/vinculacion/JornadaWizardModal';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/common/ToastContainer';
import { ConfirmModal } from './components/common/ConfirmModal';
import { Loader2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeView } = useFarm();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isQuickVinculacionOpen, setIsQuickVinculacionOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'propietarios':
        return <PropietariosView />;
      case 'cuadras':
        return <CuadrasView />;
      case 'trabajadores':
        return <TrabajadoresView />;
      case 'tipos-trabajo':
        return <TiposTrabajoView />;
      case 'vinculacion':
        return <VinculacionView />;
      case 'insumos':
        return <InsumosView />;
      case 'resultados':
        return <ResultadosView />;
      case 'pagos':
        return <PagosView />;
      case 'reportes':
        return <ReportesView />;
      case 'trazabilidad':
        return <TrazabilidadView />;
      case 'mi-cuenta':
        return <MiCuentaView />;
      case 'usuarios':
        return <UsuariosView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F6] text-slate-800 flex flex-col lg:flex-row pb-20 lg:pb-0">
      {/* Sidebar Lateral */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          onOpenNuevaVinculacion={() => setIsQuickVinculacionOpen(true)}
        />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>

      {/* Floating Mobile Bottom Navigation Bar */}
      <MobileBottomBar />

      {/* Modal Rápido de Jornada Asistida accesible desde el Header */}
      <JornadaWizardModal
        isOpen={isQuickVinculacionOpen}
        onClose={() => setIsQuickVinculacionOpen(false)}
      />
    </div>
  );
};

const AuthConsumer: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-3 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <span className="text-sm font-semibold text-slate-300">Iniciando AgroCacao Pro...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <FarmProvider>
      <MainLayout />
      <ToastContainer />
      <ConfirmModal />
    </FarmProvider>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
