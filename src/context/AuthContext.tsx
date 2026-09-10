import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<{ ok: boolean; mensaje?: string }>;
  logout: () => void;
  updateCurrentUser: (user: Usuario) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('agrocacao_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('agrocacao_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (res.ok && res.data) {
          setUser(res.data);
        } else {
          localStorage.removeItem('agrocacao_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Error al inicializar sesión:', err);
        localStorage.removeItem('agrocacao_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setError(null);
    try {
      const res = await api.login(email.trim(), pass);
      if (res.ok && res.token && res.usuario) {
        localStorage.setItem('agrocacao_token', res.token);
        setToken(res.token);
        setUser(res.usuario);
        return { ok: true };
      } else {
        const msg = res.mensaje || 'Error al iniciar sesión. Verifica tus credenciales.';
        setError(msg);
        return { ok: false, mensaje: msg };
      }
    } catch (err: any) {
      const msg = err.message || 'Error de conexión con el servidor.';
      setError(msg);
      return { ok: false, mensaje: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('agrocacao_token');
    setToken(null);
    setUser(null);
  };

  const updateCurrentUser = (updatedUser: Usuario) => {
    setUser(updatedUser);
  };

  const isAdmin = user?.rol === 'Administrador';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        logout,
        updateCurrentUser,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
