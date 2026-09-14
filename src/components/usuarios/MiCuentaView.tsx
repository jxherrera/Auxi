import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User, Mail, Shield, KeyRound, CheckCircle2, AlertCircle, Loader2, Calendar, LogOut, Type, Sparkles, SlidersHorizontal, RotateCcw } from 'lucide-react';

export const MiCuentaView: React.FC = () => {
  const { user, updateCurrentUser, logout } = useAuth();

  const [nombre, setNombre] = useState(user?.nombre || '');
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [fontSizePx, setFontSizePx] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('agrocacao_font_size');
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num) && num >= 13 && num <= 24) return num;
        if (saved === 'grande') return 18;
        if (saved === 'extra') return 20;
        if (saved === 'compacto') return 14;
      }
      return 16;
    } catch {
      return 16;
    }
  });
  const [fontSizeFeedback, setFontSizeFeedback] = useState<string | null>(null);

  const applyFontSize = (newPx: number) => {
    setFontSizePx(newPx);
    try {
      localStorage.setItem('agrocacao_font_size', newPx.toString());
      document.documentElement.style.fontSize = `${newPx}px`;
      setFontSizeFeedback(`Tamaño: ${newPx}px guardado`);
      setTimeout(() => setFontSizeFeedback(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (passwordNuevo) {
      if (!passwordActual) {
        setErrorMessage('Debes ingresar tu contraseña actual para establecer una nueva.');
        return;
      }
      if (passwordNuevo.length < 6) {
        setErrorMessage('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (passwordNuevo !== passwordConfirm) {
        setErrorMessage('Las contraseñas nuevas no coinciden.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const res = await api.updatePerfil({
        nombre: nombre.trim(),
        passwordActual: passwordActual || undefined,
        passwordNuevo: passwordNuevo || undefined,
      });

      if (res.ok && res.data) {
        updateCurrentUser(res.data);
        setSuccessMessage('¡Perfil y datos actualizados correctamente!');
        setPasswordActual('');
        setPasswordNuevo('');
        setPasswordConfirm('');
      } else {
        setErrorMessage(res.mensaje || 'Error al actualizar perfil.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white text-2xl font-black shadow-md shadow-emerald-600/20">
            {user.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{user.nombre}</h1>
            <p className="text-sm font-medium text-slate-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                user.rol === 'Administrador' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
              }`}>
                <Shield className="w-3.5 h-3.5" />
                {user.rol}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Cuenta Activa
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-bold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>

      {/* Ajustes de Visualización y Lectura con Deslizador */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Ajuste de Tamaño de Texto (Deslizador)</h2>
              <p className="text-xs text-slate-500">
                Desliza la barra para agrandar o reducir el texto en toda la app de forma continua según tu preferencia.
              </p>
            </div>
          </div>
          {fontSizeFeedback && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold self-start sm:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {fontSizeFeedback}
            </span>
          )}
        </div>

        {/* Panel del deslizador */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tamaño Actual:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-extrabold shadow-sm">
                {fontSizePx}px · {Math.round((fontSizePx / 16) * 100)}%
                {fontSizePx === 16 && ' (Estándar)'}
                {fontSizePx === 18 && ' (Grande)'}
                {fontSizePx >= 20 && ' (Extra Grande)'}
                {fontSizePx <= 14 && ' (Compacto)'}
              </span>
              {fontSizePx !== 16 && (
                <button
                  type="button"
                  onClick={() => applyFontSize(16)}
                  title="Restablecer tamaño normal (16px)"
                  className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Slider input */}
          <div className="py-2 px-1">
            <input
              type="range"
              min={14}
              max={22}
              step={1}
              value={fontSizePx}
              onChange={(e) => applyFontSize(Number(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            {/* Etiquetas del deslizador */}
            <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 mt-2">
              <button
                type="button"
                onClick={() => applyFontSize(14)}
                className={`hover:text-slate-700 cursor-pointer ${fontSizePx === 14 ? 'text-emerald-700 font-bold' : ''}`}
              >
                14px (Pequeño)
              </button>
              <button
                type="button"
                onClick={() => applyFontSize(16)}
                className={`hover:text-slate-700 cursor-pointer ${fontSizePx === 16 ? 'text-emerald-700 font-bold' : ''}`}
              >
                16px (Normal)
              </button>
              <button
                type="button"
                onClick={() => applyFontSize(18)}
                className={`hover:text-slate-700 cursor-pointer ${fontSizePx === 18 ? 'text-emerald-700 font-bold' : ''}`}
              >
                18px (Grande)
              </button>
              <button
                type="button"
                onClick={() => applyFontSize(20)}
                className={`hover:text-slate-700 cursor-pointer ${fontSizePx === 20 ? 'text-emerald-700 font-bold' : ''}`}
              >
                20px (Extra)
              </button>
              <button
                type="button"
                onClick={() => applyFontSize(22)}
                className={`hover:text-slate-700 cursor-pointer ${fontSizePx === 22 ? 'text-emerald-700 font-bold' : ''}`}
              >
                22px (Máximo)
              </button>
            </div>
          </div>

          {/* Botones de acceso rápido */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-3 border-t border-slate-200/60">
            <button
              type="button"
              onClick={() => applyFontSize(16)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                fontSizePx === 16
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-900/10'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Normal (16px)
            </button>
            <button
              type="button"
              onClick={() => applyFontSize(18)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                fontSizePx === 18
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-900/10'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Grande (18px)
            </button>
            <button
              type="button"
              onClick={() => applyFontSize(20)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                fontSizePx >= 20
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-900/10'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Extra Grande (20px)
            </button>
          </div>
        </div>

        {/* Vista previa en tiempo real */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="w-full">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Vista previa en tiempo real:
            </span>
            <p className="text-slate-800 font-medium leading-relaxed">
              «Jornada de Cosecha registrada en Lote Principal: 8 horas netas trabajadas, total a liquidar: $24.00»
            </p>
          </div>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <h2 className="text-lg font-bold text-slate-800 mb-1">Información de la Cuenta</h2>
        <p className="text-xs text-slate-500 mb-6">
          Puedes actualizar tu nombre y cambiar tu contraseña de acceso en cualquier momento.
        </p>

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Nombre Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Email (read only) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Correo Electrónico (No modificable)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 text-sm font-medium cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Change password section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Cambiar Contraseña (Opcional)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Si no deseas cambiar tu contraseña actual, deja estos campos en blanco.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  placeholder="Tu clave actual"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={passwordNuevo}
                  onChange={(e) => setPasswordNuevo(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Repite la clave nueva"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Último acceso: {user.ultimoAcceso ? new Date(user.ultimoAcceso).toLocaleString('es-EC') : 'Esta sesión'}
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-md shadow-emerald-900/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Cambios</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
