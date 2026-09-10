import React, { useState } from 'react';
import { Usuario, RolUsuario } from '../../types';
import { X, User, Mail, Lock, Shield, Loader2 } from 'lucide-react';

interface UsuarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { nombre: string; email: string; password: string; rol: RolUsuario }) => Promise<boolean>;
  usuarioEdit?: Usuario | null;
}

export const UsuarioFormModal: React.FC<UsuarioFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  usuarioEdit,
}) => {
  const [nombre, setNombre] = useState(usuarioEdit?.nombre || '');
  const [email, setEmail] = useState(usuarioEdit?.email || '');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<RolUsuario>(usuarioEdit?.rol || 'Operador');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !email) {
      setError('Nombre y correo son obligatorios.');
      return;
    }

    if (!usuarioEdit && (!password || password.length < 6)) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const success = await onSave({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password,
      rol,
    });

    setIsLoading(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800">
                {usuarioEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <p className="text-xs text-slate-500">
                {usuarioEdit ? 'Modifica los permisos del usuario' : 'Crea un nuevo acceso al sistema'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre Completo *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Correo Electrónico *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                disabled={!!usuarioEdit}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@finca.com"
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-2xl text-xs font-semibold focus:outline-none transition ${
                  usuarioEdit
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
            </div>
          </div>

          {!usuarioEdit && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contraseña Temporal *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Rol de Usuario *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRol('Operador')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-left cursor-pointer ${
                  rol === 'Operador'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-bold">Operador</span>
                <span className="text-[10px] text-slate-500 font-normal text-center">
                  Registra jornadas, cosechas y consulta datos
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRol('Administrador')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-left cursor-pointer ${
                  rol === 'Administrador'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-bold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  Admin
                </span>
                <span className="text-[10px] text-slate-500 font-normal text-center">
                  Control total, finanzas y administración
                </span>
              </button>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-900/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.98]"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{usuarioEdit ? 'Guardar Cambios' : 'Crear Usuario'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
