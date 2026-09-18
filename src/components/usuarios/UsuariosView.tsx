import React, { useState, useEffect } from 'react';
import { Usuario, RolUsuario } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UsuarioFormModal } from './UsuarioFormModal';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const UsuariosView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { confirm, success, error: toastError } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioEdit, setUsuarioEdit] = useState<Usuario | null>(null);

  // Modals for Reset Password
  const [resetModalUser, setResetModalUser] = useState<Usuario | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const res = await api.getUsuarios();
      if (res.ok && res.data) {
        setUsuarios(res.data);
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleSaveUsuario = async (data: { nombre: string; email: string; password: string; rol: RolUsuario }) => {
    if (usuarioEdit) {
      const res = await api.updateUsuario(usuarioEdit.id, {
        nombre: data.nombre,
        rol: data.rol,
      });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Usuario actualizado correctamente.' });
        fetchUsuarios();
        return true;
      } else {
        setNotification({ type: 'error', message: res.mensaje || 'Error al actualizar.' });
        return false;
      }
    } else {
      const res = await api.createUsuario(data);
      if (res.ok) {
        setNotification({ type: 'success', message: 'Usuario creado con éxito.' });
        fetchUsuarios();
        return true;
      } else {
        setNotification({ type: 'error', message: res.mensaje || 'Error al crear usuario.' });
        return false;
      }
    }
  };

  const handlePromptToggleEstado = (u: Usuario) => {
    const nuevoEstado = u.estado === 'activo' ? 'inactivo' : 'activo';
    confirm({
      title: u.estado === 'activo' ? '¿Desactivar Usuario?' : '¿Activar Usuario?',
      message:
        u.estado === 'activo'
          ? `¿Estás segura de desactivar a ${u.nombre}? No podrá iniciar sesión en la plataforma mientras esté inactivo.`
          : `¿Estás segura de activar a ${u.nombre}? Podrá ingresar al sistema con su correo y contraseña.`,
      confirmText: u.estado === 'activo' ? 'Sí, desactivar' : 'Sí, activar',
      type: u.estado === 'activo' ? 'danger' : 'success',
      onConfirm: async () => {
        const res = await api.updateUsuario(u.id, { estado: nuevoEstado });
        if (res.ok) {
          success(`Usuario ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} exitosamente.`);
          fetchUsuarios();
        } else {
          toastError(res.mensaje || 'No se pudo cambiar el estado.');
        }
      },
    });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword || newPassword.length < 6) {
      setResetError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setResetError(null);
    const res = await api.resetPasswordUsuario(resetModalUser.id, newPassword);
    if (res.ok) {
      setResetSuccess(`Contraseña restablecida con éxito para ${resetModalUser.nombre}.`);
      setTimeout(() => {
        setResetModalUser(null);
        setNewPassword('');
        setResetSuccess(null);
      }, 1500);
    } else {
      setResetError(res.mensaje || 'Error al restablecer contraseña.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs sm:shadow-sm">
        <div>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black text-slate-800 tracking-tight leading-snug">Usuarios</h1>
              <p className="text-[11px] sm:text-sm font-medium text-slate-500 leading-tight">
                Controla los accesos y roles del personal
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setUsuarioEdit(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Alert Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs underline font-bold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="text-sm font-medium">Cargando usuarios...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Usuario</th>
                  <th className="py-4 px-4">Rol</th>
                  <th className="py-4 px-4">Estado</th>
                  <th className="py-4 px-4">Último Acceso</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {usuarios.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const isMayra = u.email === 'mayraveragiler@gmail.com';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-700 font-bold flex items-center justify-center flex-shrink-0">
                            {u.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{u.nombre}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md font-extrabold">
                                  Tú
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            u.rol === 'Administrador'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          {u.rol}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            u.estado === 'activo'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {u.estado === 'activo' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          {u.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleDateString('es-EC') : 'Nunca'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            title="Restablecer Contraseña"
                            onClick={() => {
                              setResetModalUser(u);
                              setNewPassword('');
                              setResetError(null);
                            }}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {!isMayra && (
                            <button
                              title={u.estado === 'activo' ? 'Desactivar usuario' : 'Activar usuario'}
                              onClick={() => handlePromptToggleEstado(u)}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                u.estado === 'activo'
                                  ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                                  : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                              }`}
                            >
                              {u.estado === 'activo' ? 'Desactivar' : 'Activar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <UsuarioFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveUsuario}
        usuarioEdit={usuarioEdit}
      />

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Restablecer Clave</h3>
                <p className="text-xs text-slate-500">{resetModalUser.nombre}</p>
              </div>
            </div>

            {resetSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center">
                {resetSuccess}
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {resetError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                    {resetError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nueva Contraseña</label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                  >
                    Guardar Clave
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
