import {
  Propietario,
  Cuadra,
  Trabajador,
  TipoTrabajo,
  Jornada,
  ResultadoTrabajo,
  Usuario,
  AuthSession,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function fetchJSON<T>(endpoint: string, options: RequestInit = {}): Promise<{ ok: boolean; data?: T; mensaje?: string; token?: string; usuario?: Usuario }> {
  try {
    const token = localStorage.getItem('agrocacao_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.warn(`[API Client] Fallo al conectar con ${endpoint}:`, error.message);
    return {
      ok: false,
      mensaje: 'No se pudo establecer conexión con el servidor. Revisa tu conexión de red o el estado del backend.',
    };
  }
}

export const api = {
  // Propietarios
  getPropietarios: () => fetchJSON<Propietario[]>('/propietarios'),
  createPropietario: (data: Omit<Propietario, 'id' | 'fechaRegistro'>) =>
    fetchJSON<Propietario>('/propietarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePropietario: (id: string, data: Partial<Propietario>) =>
    fetchJSON<Propietario>(`/propietarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePropietario: (id: string) =>
    fetchJSON<void>(`/propietarios/${id}`, {
      method: 'DELETE',
    }),

  // Cuadras
  getCuadras: (propietarioId?: string, tipoPropiedad?: string) => {
    const params = new URLSearchParams();
    if (propietarioId) params.append('propietarioId', propietarioId);
    if (tipoPropiedad) params.append('tipoPropiedad', tipoPropiedad);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchJSON<Cuadra[]>(`/cuadras${query}`);
  },
  createCuadra: (data: Omit<Cuadra, 'id' | 'fechaCreacion'>) =>
    fetchJSON<Cuadra>('/cuadras', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCuadra: (id: string, data: Partial<Cuadra>) =>
    fetchJSON<Cuadra>(`/cuadras/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCuadra: (id: string) =>
    fetchJSON<void>(`/cuadras/${id}`, {
      method: 'DELETE',
    }),

  // Trabajadores
  getTrabajadores: () => fetchJSON<Trabajador[]>('/trabajadores'),
  createTrabajador: (data: Omit<Trabajador, 'id'>) =>
    fetchJSON<Trabajador>('/trabajadores', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTrabajador: (id: string, data: Partial<Trabajador>) =>
    fetchJSON<Trabajador>(`/trabajadores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTrabajador: (id: string) =>
    fetchJSON<void>(`/trabajadores/${id}`, {
      method: 'DELETE',
    }),

  // Tipos de Trabajo
  getTiposTrabajo: () => fetchJSON<TipoTrabajo[]>('/tipos-trabajo'),

  // Jornadas
  getJornadas: () => fetchJSON<Jornada[]>('/jornadas'),
  createJornada: (data: any) =>
    fetchJSON<{ id: string; codigo: string }>('/jornadas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateJornada: (id: string, data: any) =>
    fetchJSON<void>(`/jornadas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteJornada: (id: string) =>
    fetchJSON<void>(`/jornadas/${id}`, {
      method: 'DELETE',
    }),
  saveResultado: (jornadaId: string, data: ResultadoTrabajo) =>
    fetchJSON<void>(`/jornadas/${jornadaId}/resultado`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Insumos y Recursos
  getInsumos: () => fetchJSON<any[]>('/insumos'),
  createInsumo: (data: any) =>
    fetchJSON<any>('/insumos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateInsumo: (id: string, data: any) =>
    fetchJSON<any>(`/insumos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteInsumo: (id: string) =>
    fetchJSON<void>(`/insumos/${id}`, {
      method: 'DELETE',
    }),
  getHistorialInsumo: (id: string) =>
    fetchJSON<{ insumo: any; totalUtilizado: number; costoAcumulado: number; registros: any[] }>(`/insumos/${id}/historial`),

  // Pagos
  liquidarPagos: (jornadaTrabajadorIds: string[], metodoPago?: string, comprobante?: string) =>
    fetchJSON<void>('/pagos/liquidar', {
      method: 'POST',
      body: JSON.stringify({ jornadaTrabajadorIds, metodoPago, comprobante }),
    }),

  // Autenticación
  login: (email: string, password: string) =>
    fetchJSON<Usuario>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => fetchJSON<Usuario>('/auth/me'),
  updatePerfil: (data: { nombre?: string; passwordActual?: string; passwordNuevo?: string }) =>
    fetchJSON<Usuario>('/auth/perfil', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Gestión de Usuarios (Solo Administrador)
  getUsuarios: () => fetchJSON<Usuario[]>('/usuarios'),
  createUsuario: (data: { nombre: string; email: string; password: string; rol: 'Administrador' | 'Operador' }) =>
    fetchJSON<Usuario>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUsuario: (id: string, data: { nombre?: string; rol?: 'Administrador' | 'Operador'; estado?: 'activo' | 'inactivo' }) =>
    fetchJSON<Usuario>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  resetPasswordUsuario: (id: string, passwordNuevo: string) =>
    fetchJSON<void>(`/usuarios/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ passwordNuevo }),
    }),
  deleteUsuario: (id: string) =>
    fetchJSON<void>(`/usuarios/${id}`, {
      method: 'DELETE',
    }),
};
