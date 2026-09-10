import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Propietario,
  Cuadra,
  Trabajador,
  TipoTrabajo,
  Jornada,
  TrabajadorJornada,
  ResultadoTrabajo,
  Insumo,
} from '../types';
import {
  INITIAL_PROPIETARIOS,
  INITIAL_CUADRAS,
  INITIAL_TRABAJADORES,
  INITIAL_TIPOS_TRABAJO,
  INITIAL_JORNADAS,
  INITIAL_INSUMOS,
} from '../data/seedData';
import {
  computeDashboardStats,
  computeRentabilidadCuadras,
  DashboardStats,
  RentabilidadCuadra,
} from '../utils/calculations';
import { api } from '../services/api';
import { useToast } from './ToastContext';

export type ActiveView = 
  | 'dashboard'
  | 'propietarios'
  | 'cuadras'
  | 'trabajadores'
  | 'tipos-trabajo'
  | 'vinculacion'
  | 'insumos'
  | 'resultados'
  | 'pagos'
  | 'reportes'
  | 'trazabilidad'
  | 'mi-cuenta'
  | 'usuarios';

interface FarmContextType {
  propietarios: Propietario[];
  cuadras: Cuadra[];
  trabajadores: Trabajador[];
  tiposTrabajo: TipoTrabajo[];
  jornadas: Jornada[];
  insumos: Insumo[];
  // Compatibilidad con vinculaciones
  vinculaciones: Jornada[];
  stats: DashboardStats;
  rentabilidades: RentabilidadCuadra[];
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;

  // Insumos CRUD
  addInsumo: (data: Omit<Insumo, 'id' | 'created_at' | 'totalConsumido' | 'stockActual'>) => Promise<Insumo>;
  updateInsumo: (id: string, data: Partial<Insumo>) => Promise<void>;
  deleteInsumo: (id: string) => Promise<boolean>;
  getInsumoById: (id: string) => Insumo | undefined;
  getHistorialInsumo: (id: string) => Promise<{ insumo: Insumo; totalUtilizado: number; costoAcumulado: number; registros: any[] } | null>;

  // Propietarios CRUD
  addPropietario: (data: Omit<Propietario, 'id' | 'fechaRegistro'>) => Promise<Propietario>;
  updatePropietario: (id: string, data: Partial<Propietario>) => Promise<void>;
  deletePropietario: (id: string) => Promise<boolean>;
  getPropietarioById: (id: string) => Propietario | undefined;

  // Cuadras CRUD
  addCuadra: (data: Omit<Cuadra, 'id' | 'fechaCreacion'>) => Promise<Cuadra>;
  updateCuadra: (id: string, data: Partial<Cuadra>) => Promise<void>;
  deleteCuadra: (id: string) => Promise<void>;
  getCuadraById: (id: string) => Cuadra | undefined;

  // Trabajadores CRUD
  addTrabajador: (data: Omit<Trabajador, 'id'>) => Promise<Trabajador>;
  updateTrabajador: (id: string, data: Partial<Trabajador>) => Promise<void>;
  deleteTrabajador: (id: string) => Promise<void>;
  getTrabajadorById: (id: string) => Trabajador | undefined;

  // Tipos de Trabajo
  tiposTrabajoList: TipoTrabajo[];
  getTipoTrabajoById: (id: string) => TipoTrabajo | undefined;
  addTipoTrabajo: (data: Omit<TipoTrabajo, 'id'>) => Promise<TipoTrabajo>;
  updateTipoTrabajo: (id: string, data: Partial<TipoTrabajo>) => Promise<void>;

  // Jornadas / Vinculaciones CRUD
  addJornada: (data: Omit<Jornada, 'id' | 'codigo'>) => Promise<Jornada>;
  updateJornada: (id: string, data: Partial<Jornada>) => Promise<void>;
  addVinculacion: (data: any) => Promise<any>;
  updateVinculacion: (id: string, data: Partial<Jornada>) => Promise<void>;
  deleteJornada: (id: string) => Promise<void>;
  deleteVinculacion: (id: string) => Promise<void>;
  registrarResultado: (jornadaId: string, resultado: ResultadoTrabajo) => Promise<void>;

  // Pagos
  marcarPagoTrabajador: (jornadaId: string, trabajadorJornadaId: string, metodoPago?: string, comprobante?: string) => Promise<void>;
  marcarPagosEnLote: (jornadaTrabajadorIds: string[], metodoPago?: string) => Promise<void>;
  marcarPago: (vinculacionId: string, metodoPago?: any) => Promise<void>;

  // Backup
  exportDataJSON: () => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROPIETARIOS: 'agrocacao_propietarios_v2',
  CUADRAS: 'agrocacao_cuadras_v2',
  TRABAJADORES: 'agrocacao_trabajadores_v2',
  TIPOS_TRABAJO: 'agrocacao_tipos_v2',
  JORNADAS: 'agrocacao_jornadas_v2',
  INSUMOS: 'agrocacao_insumos_v2',
};

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { success, error, warning } = useToast();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  // Estados locales con persistencia en localStorage y sincronización con API
  const [propietarios, setPropietarios] = useState<Propietario[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROPIETARIOS);
    return saved ? JSON.parse(saved) : [];
  });

  const [cuadras, setCuadras] = useState<Cuadra[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUADRAS);
    return saved ? JSON.parse(saved) : [];
  });

  const [trabajadores, setTrabajadores] = useState<Trabajador[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRABAJADORES);
    return saved ? JSON.parse(saved) : [];
  });

  const [tiposTrabajo, setTiposTrabajo] = useState<TipoTrabajo[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TIPOS_TRABAJO);
    return saved ? JSON.parse(saved) : INITIAL_TIPOS_TRABAJO;
  });

  const [jornadas, setJornadas] = useState<Jornada[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.JORNADAS);
    return saved ? JSON.parse(saved) : [];
  });

  const [insumos, setInsumos] = useState<Insumo[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INSUMOS);
    return saved ? JSON.parse(saved) : [];
  });

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROPIETARIOS, JSON.stringify(propietarios));
  }, [propietarios]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUADRAS, JSON.stringify(cuadras));
  }, [cuadras]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRABAJADORES, JSON.stringify(trabajadores));
  }, [trabajadores]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.JORNADAS, JSON.stringify(jornadas));
  }, [jornadas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TIPOS_TRABAJO, JSON.stringify(tiposTrabajo));
  }, [tiposTrabajo]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INSUMOS, JSON.stringify(insumos));
  }, [insumos]);

  // Cargar datos iniciales desde el backend si está activo
  useEffect(() => {
    async function syncWithBackend() {
      const [resProp, resCuad, resTrab, resJorn, resIns, resTip] = await Promise.all([
        api.getPropietarios(),
        api.getCuadras(),
        api.getTrabajadores(),
        api.getJornadas(),
        api.getInsumos(),
        api.getTiposTrabajo(),
      ]);

      if (resProp.ok && resProp.data) {
        setPropietarios(resProp.data);
      }
      if (resCuad.ok && resCuad.data) {
        setCuadras(resCuad.data);
      }
      if (resTrab.ok && resTrab.data) {
        setTrabajadores(resTrab.data);
      }
      if (resJorn.ok && resJorn.data) {
        setJornadas(resJorn.data);
      }
      if (resIns.ok && resIns.data) {
        setInsumos(resIns.data);
      }
      if (resTip.ok && resTip.data && resTip.data.length > 0) {
        setTiposTrabajo(resTip.data);
      }
    }
    syncWithBackend();
  }, []);

  // Estadísticas calculadas
  const stats = computeDashboardStats(propietarios, cuadras, trabajadores, jornadas);
  const rentabilidades = computeRentabilidadCuadras(cuadras, jornadas, propietarios);

  // ==========================================
  // PROPIETARIOS
  // ==========================================
  const addPropietario = async (data: Omit<Propietario, 'id' | 'fechaRegistro'>): Promise<Propietario> => {
    const newProp: Propietario = {
      ...data,
      id: `prop-${Date.now()}`,
      fechaRegistro: new Date().toISOString().split('T')[0],
    };

    setPropietarios((prev) => [newProp, ...prev]);

    // Backend sync
    const res = await api.createPropietario(data);
    if (!res.ok && res.mensaje) {
      warning('Guardado localmente', res.mensaje);
    } else {
      success('Propietario registrado', `${data.nombreCompleto} ha sido añadido.`);
    }

    return newProp;
  };

  const updatePropietario = async (id: string, data: Partial<Propietario>) => {
    setPropietarios((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    await api.updatePropietario(id, data);
    success('Propietario actualizado', 'Los cambios han sido guardados.');
  };

  const deletePropietario = async (id: string): Promise<boolean> => {
    const cuadrasAsociadas = cuadras.filter((c) => c.propietarioId === id);
    if (cuadrasAsociadas.length > 0) {
      error(
        'No se puede eliminar el propietario',
        `Tiene ${cuadrasAsociadas.length} cuadras asignadas. Reasigna o elimina las cuadras primero.`
      );
      return false;
    }

    setPropietarios((prev) => prev.filter((p) => p.id !== id));
    await api.deletePropietario(id);
    success('Propietario eliminado', 'El registro fue removido correctamente.');
    return true;
  };

  const getPropietarioById = useCallback(
    (id: string) => propietarios.find((p) => p.id === id),
    [propietarios]
  );

  // ==========================================
  // CUADRAS
  // ==========================================
  const addCuadra = async (data: Omit<Cuadra, 'id' | 'fechaCreacion'>): Promise<Cuadra> => {
    const newCuadra: Cuadra = {
      ...data,
      id: `cuadra-${Date.now()}`,
      fechaCreacion: new Date().toISOString().split('T')[0],
    };

    setCuadras((prev) => [newCuadra, ...prev]);
    await api.createCuadra(data);
    success('Cuadra registrada', `${data.nombre} añadida a la finca.`);
    return newCuadra;
  };

  const updateCuadra = async (id: string, data: Partial<Cuadra>) => {
    setCuadras((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    await api.updateCuadra(id, data);
    success('Cuadra actualizada', 'Datos de la parcela guardados.');
  };

  const deleteCuadra = async (id: string) => {
    setCuadras((prev) => prev.filter((c) => c.id !== id));
    await api.deleteCuadra(id);
    success('Cuadra eliminada', 'La parcela ha sido removida.');
  };

  const getCuadraById = useCallback(
    (id: string) => cuadras.find((c) => c.id === id),
    [cuadras]
  );

  // ==========================================
  // TRABAJADORES
  // ==========================================
  const addTrabajador = async (data: Omit<Trabajador, 'id'>): Promise<Trabajador> => {
    const newTrab: Trabajador = {
      ...data,
      id: `trab-${Date.now()}`,
    };

    setTrabajadores((prev) => [newTrab, ...prev]);
    await api.createTrabajador(data);
    success('Trabajador registrado', `${data.nombreCompleto} (${data.tipo}) añadido.`);
    return newTrab;
  };

  const updateTrabajador = async (id: string, data: Partial<Trabajador>) => {
    setTrabajadores((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    await api.updateTrabajador(id, data);
    success('Trabajador actualizado', 'Ficha del trabajador guardada.');
  };

  const deleteTrabajador = async (id: string) => {
    setTrabajadores((prev) => prev.filter((t) => t.id !== id));
    await api.deleteTrabajador(id);
    success('Trabajador eliminado', 'El trabajador ha sido removido.');
  };

  const getTrabajadorById = useCallback(
    (id: string) => trabajadores.find((t) => t.id === id),
    [trabajadores]
  );

  const getTipoTrabajoById = useCallback(
    (id: string) => tiposTrabajo.find((t) => t.id === id),
    [tiposTrabajo]
  );

  const addTipoTrabajo = async (data: Omit<TipoTrabajo, 'id'>): Promise<TipoTrabajo> => {
    const newTipo: TipoTrabajo = {
      ...data,
      id: `tipo-${Date.now()}`,
    };
    setTiposTrabajo((prev) => [...prev, newTipo]);
    success('Tipo de trabajo creado', `Se ha registrado "${data.nombre}".`);
    return newTipo;
  };

  const updateTipoTrabajo = async (id: string, data: Partial<TipoTrabajo>) => {
    setTiposTrabajo((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    success('Tipo de trabajo actualizado', 'Los cambios se han guardado.');
  };

  // ==========================================
  // INSUMOS Y RECURSOS
  // ==========================================
  const addInsumo = async (data: Omit<Insumo, 'id' | 'created_at' | 'totalConsumido' | 'stockActual'>): Promise<Insumo> => {
    const newIns: Insumo = {
      ...data,
      id: `ins-${Date.now()}`,
      stockActual: data.stockInicial,
      totalConsumido: 0,
      created_at: new Date().toISOString().split('T')[0],
    };
    setInsumos((prev) => [newIns, ...prev]);
    const res = await api.createInsumo(data);
    if (res.ok && res.data) {
      newIns.id = res.data.id;
    }
    success('Insumo registrado', `${data.nombre} ha sido añadido al catálogo.`);
    return newIns;
  };

  const updateInsumo = async (id: string, data: Partial<Insumo>) => {
    setInsumos((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
    await api.updateInsumo(id, data);
    success('Insumo actualizado', 'Los datos del insumo han sido guardados.');
  };

  const deleteInsumo = async (id: string): Promise<boolean> => {
    const res = await api.deleteInsumo(id);
    if (!res.ok && res.mensaje) {
      error('No se pudo eliminar el insumo', res.mensaje);
      return false;
    }
    setInsumos((prev) => prev.filter((i) => i.id !== id));
    success('Insumo eliminado', 'El insumo fue removido del catálogo.');
    return true;
  };

  const getInsumoById = (id: string) => insumos.find((i) => i.id === id);

  const getHistorialInsumo = async (id: string) => {
    const res = await api.getHistorialInsumo(id);
    if (res.ok && res.data) {
      return res.data;
    }
    return null;
  };

  // ==========================================
  // JORNADAS / VINCULACIONES
  // ==========================================
  const addJornada = async (data: Omit<Jornada, 'id' | 'codigo'>): Promise<Jornada> => {
    const nextNum = jornadas.length + 1;
    const codigo = `JORN-2026-${String(nextNum).padStart(3, '0')}`;
    const primaryPropId = data.propiedades?.[0]?.propietarioId || data.propietarioId;
    const primaryCuadraId = data.propiedades?.[0]?.cuadraId || data.cuadraId;

    const newJorn: Jornada = {
      ...data,
      id: `jorn-${Date.now()}`,
      codigo,
      propietarioId: primaryPropId,
      cuadraId: primaryCuadraId,
    };

    setJornadas((prev) => [newJorn, ...prev]);
    const res = await api.createJornada(data);
    if (res.ok && res.data) {
      if (res.data.id) newJorn.id = res.data.id;
      if (res.data.codigo) newJorn.codigo = res.data.codigo;
      success('Jornada registrada', `Se registró la jornada ${newJorn.codigo} con ${data.trabajadores.length} trabajador(es).`);
    } else if (!res.ok) {
      error('Error al guardar en el servidor', res.mensaje || 'No se pudo guardar la jornada en la base de datos.');
    } else {
      success('Jornada registrada', `Se registró la jornada ${newJorn.codigo} con ${data.trabajadores.length} trabajador(es).`);
    }
    return newJorn;
  };

  const updateJornada = async (id: string, data: Partial<Jornada>) => {
    setJornadas((prev) => prev.map((j) => (j.id === id ? { ...j, ...data } : j)));
    await api.updateJornada(id, data);
    success('Jornada actualizada', 'Se guardaron las modificaciones de la jornada.');
  };

  const deleteJornada = async (id: string) => {
    setJornadas((prev) => prev.filter((j) => j.id !== id));
    await api.deleteJornada(id);
    success('Jornada eliminada', 'La jornada ha sido eliminada del historial.');
  };

  const registrarResultado = async (jornadaId: string, resultado: ResultadoTrabajo) => {
    setJornadas((prev) =>
      prev.map((j) => (j.id === jornadaId ? { ...j, resultado } : j))
    );
    await api.saveResultado(jornadaId, resultado);
    success(
      'Resultados guardados',
      resultado.esCosecha ? 'Se registraron los quintales y ventas de la cosecha.' : 'Se registraron los resultados e insumos de campo.'
    );
  };

  // ==========================================
  // CONTROL DE PAGOS
  // ==========================================
  const marcarPagoTrabajador = async (
    jornadaId: string,
    trabajadorJornadaId: string,
    metodoPago: string = 'Efectivo',
    comprobante?: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const comp = comprobante || `PAG-${Date.now().toString().slice(-6)}`;

    setJornadas((prev) =>
      prev.map((j) => {
        if (j.id === jornadaId) {
          return {
            ...j,
            trabajadores: j.trabajadores.map((tj) =>
              tj.id === trabajadorJornadaId
                ? {
                    ...tj,
                    estadoPago: 'pagado',
                    fechaPago: today,
                    metodoPago: metodoPago as any,
                    comprobantePago: comp,
                  }
                : tj
            ),
          };
        }
        return j;
      })
    );

    await api.liquidarPagos([trabajadorJornadaId], metodoPago, comp);
    success('Pago liquidado', `Jornal cancelado mediante ${metodoPago}.`);
  };

  const marcarPagosEnLote = async (
    jornadaTrabajadorIds: string[],
    metodoPago: string = 'Transferencia Bancaria'
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const comp = `BATCH-${Date.now().toString().slice(-6)}`;

    setJornadas((prev) =>
      prev.map((j) => ({
        ...j,
        trabajadores: j.trabajadores.map((tj) =>
          jornadaTrabajadorIds.includes(tj.id)
            ? {
                ...tj,
                estadoPago: 'pagado',
                fechaPago: today,
                metodoPago: metodoPago as any,
                comprobantePago: comp,
              }
            : tj
        ),
      }))
    );

    await api.liquidarPagos(jornadaTrabajadorIds, metodoPago, comp);
    success('Pagos en lote liquidados', `Se procesaron ${jornadaTrabajadorIds.length} jornales exitosamente.`);
  };

  // ==========================================
  // BACKUP
  // ==========================================
  const exportDataJSON = () => {
    const data = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      propietarios,
      cuadras,
      trabajadores,
      tiposTrabajo,
      jornadas,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AgroCacao_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    success('Copia de seguridad exportada', 'El archivo JSON ha sido descargado.');
  };

  return (
    <FarmContext.Provider
      value={{
        propietarios,
        cuadras,
        trabajadores,
        tiposTrabajo,
        jornadas,
        insumos,
        vinculaciones: jornadas,
        stats,
        rentabilidades,
        activeView,
        setActiveView,
        addInsumo,
        updateInsumo,
        deleteInsumo,
        getInsumoById,
        getHistorialInsumo,
        addPropietario,
        updatePropietario,
        deletePropietario,
        getPropietarioById,
        addCuadra,
        updateCuadra,
        deleteCuadra,
        getCuadraById,
        addTrabajador,
        updateTrabajador,
        deleteTrabajador,
        getTrabajadorById,
        tiposTrabajoList: tiposTrabajo,
        getTipoTrabajoById,
        addTipoTrabajo,
        updateTipoTrabajo,
        addJornada,
        updateJornada,
        addVinculacion: addJornada as any,
        updateVinculacion: updateJornada as any,
        deleteJornada,
        deleteVinculacion: deleteJornada,
        registrarResultado,
        marcarPagoTrabajador,
        marcarPagosEnLote,
        marcarPago: async (vincId) => {
          const j = jornadas.find((x) => x.id === vincId);
          if (j) {
            const pendingIds = j.trabajadores.filter((t) => t.estadoPago === 'pendiente').map((t) => t.id);
            if (pendingIds.length > 0) {
              await marcarPagosEnLote(pendingIds, 'Efectivo');
            }
          }
        },
        exportDataJSON,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm debe usarse dentro de un FarmProvider');
  }
  return context;
};
