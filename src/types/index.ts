// ==========================================
// 0. USUARIOS Y AUTENTICACIÓN (RBAC)
// ==========================================
export type RolUsuario = 'Administrador' | 'Operador';
export type EstadoUsuario = 'activo' | 'inactivo';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  ultimoAcceso?: string;
  created_at?: string;
}

export interface AuthSession {
  token: string;
  usuario: Usuario;
}

// ==========================================
// 1. PROPIETARIOS
// ==========================================
export type EstadoPropietario = 'activo' | 'inactivo';

export interface Propietario {
  id: string;
  nombreCompleto: string;
  nombre?: string; // Alias de conveniencia
  identificacion: string; // Cédula o código interno
  telefono: string;
  direccion: string; // Dirección o ubicación de referencia
  observaciones: string;
  estado: EstadoPropietario;
  fechaRegistro?: string;
}

// ==========================================
// 2. CUADRAS Y TERRENOS
// ==========================================
export type EstadoCuadra = 'activa' | 'inactiva' | 'mantenimiento';
export type TipoPropiedad = 'propia' | 'tercero';

export interface Cuadra {
  id: string;
  propietarioId: string; // Obligatorio: relación con Propietario
  nombre: string;
  lugar: string; // Lugar / sector
  referencia: string; // Ubicación o referencia
  ubicacion?: string; // Alias de referencia para compatibilidad
  tamanoM2: number; // Metros de terreno (m²)
  tipoPropiedad: TipoPropiedad; // 'propia' o 'tercero'
  estado: EstadoCuadra;
  observaciones: string;
  fechaCreacion: string;
}

// ==========================================
// 3. TRABAJADORES (CON FAMILIARES Y TIPOS)
// ==========================================
export type TipoTrabajador = 
  | 'Contratado'
  | 'Familiar'
  | 'Eventual'
  | 'Otro';

export type EstadoTrabajador = 'activo' | 'inactivo';

export interface Trabajador {
  id: string;
  nombreCompleto: string;
  identificacion: string;
  telefono: string;
  tipo: TipoTrabajador; // Contratado, Familiar, Eventual, Otro
  tarifaHora: number; // Puede ser $0 para trabajadores familiares
  tarifaDia: number;  // Puede ser $0
  estado: EstadoTrabajador;
  observaciones: string;
}

// ==========================================
// 4. TIPOS DE TRABAJO
// ==========================================
export type CategoriaTrabajo = 'cosecha' | 'mantenimiento' | 'fitosanitario' | 'agronomico';

export interface TipoTrabajo {
  id: string;
  nombre: string;
  categoria: CategoriaTrabajo;
  descripcion: string;
  esCosecha: boolean;
  icono: string;
}

// ==========================================
// 5. TRABAJADOR EN JORNADA (HORARIOS Y PAGOS)
// ==========================================
export type FormaPago = 'por_hora' | 'por_jornada' | 'pago_fijo' | 'sin_pago';
export type EstadoPago = 'pendiente' | 'pagado';

export interface TrabajadorJornada {
  id: string;
  trabajadorId: string;
  nombreTrabajador?: string; // Para display rápido
  horaEntrada: string; // HH:mm (ej: '07:00')
  horaSalida: string;  // HH:mm (ej: '16:00')
  almuerzoHoras: number; // Duración del almuerzo en horas (ej: 1 o 0.5)
  horasTrabajadas: number; // Auto: Salida - Entrada - Almuerzo
  tipoPago: FormaPago; // por_hora, por_jornada, pago_fijo, sin_pago
  tarifa: number; // Tarifa unitaria o monto fijo
  pagoTotal: number; // Auto: calculado según tipoPago ($0 si familiar/sin_pago)
  estadoPago: EstadoPago;
  fechaPago?: string;
  metodoPago?: 'Efectivo' | 'Transferencia Bancaria' | 'Cheque';
  comprobantePago?: string;
  observaciones?: string;
}

// ==========================================
// 6. INSUMOS Y RECURSOS AGRÍCOLAS
// ==========================================
export type CategoriaInsumo = 
  | 'Herramientas'
  | 'Combustibles'
  | 'Materiales'
  | 'Productos agrícolas'
  | 'Agroquímicos'
  | 'Otros';

export type EstadoInsumo = 'activo' | 'inactivo' | 'Disponible' | 'Bajo Stock' | 'Agotado' | 'En Mantenimiento';

export interface Insumo {
  id: string;
  nombre: string;
  categoria: CategoriaInsumo;
  unidad: string; // 'litros', 'unidad', 'kg', 'metros', 'sacos', etc.
  stockInicial: number;
  stockActual: number;
  costoUnitario: number;
  estado: EstadoInsumo;
  observaciones?: string;
  totalConsumido?: number;
  created_at?: string;
}

export interface JornadaInsumo {
  id: string;
  jornadaId?: string;
  insumoId?: string;
  nombreInsumo: string;
  categoria?: string;
  tipo: 'utilizado' | 'requerido';
  cantidad: number;
  unidad: string;
  costoUnitario?: number;
  costoTotal?: number;
  estado?: 'utilizado' | 'pendiente' | 'urgente';
  observaciones?: string;
}

export interface MaterialUtilizado {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
}

export type EstadoMaterialRequerido = 'pendiente' | 'adquirido' | 'urgente';

export interface MaterialRequerido {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  esPerecible: boolean;
  estado: EstadoMaterialRequerido;
  observaciones?: string;
}

export type TipoGranoCacao = 
  | 'Cacao Nacional Fino de Aroma'
  | 'Nacional Fino'
  | 'CCN-51'
  | 'Cacao Baba (Fresco)'
  | 'Cacao Seco Fermentado'
  | string;

export type UnidadCosecha = 'libras' | 'kg' | 'quintales' | 'sacos' | 'otra';

// ==========================================
// 6. ASIGNACIÓN DE PROPIEDADES EN JORNADA
// ==========================================
export interface PropiedadJornada {
  id: string;
  propietarioId: string;
  cuadraId: string;
  horasEstimadas?: number; // Participación de tiempo opcional
  observaciones?: string;
}

// ==========================================
// 7. COSECHA DISTRIBUIDA POR PROPIETARIO
// ==========================================
export interface CosechaPropietario {
  id: string;
  propietarioId: string;
  cuadraIds?: string[]; // Cuadras asociadas
  cantidad: number;
  unidad: UnidadCosecha;
  precioUnitario: number;
  gastosRelacionados: number;
  ingresoGenerado: number; // cantidad * precioUnitario
  gananciaNeta: number; // ingresoGenerado - gastosRelacionados
  tipoGrano?: TipoGranoCacao;
  observaciones?: string;
}

export interface ResultadoTrabajo {
  esCosecha: boolean;
  // Cosecha global:
  cantidadCosechada?: number;
  unidadMedida?: UnidadCosecha;
  precioVentaUnitario?: number;
  ingresoGenerado?: number;
  gastosRelacionados?: number;
  costoInsumos?: number;
  gananciaNeta?: number;
  tipoGrano?: TipoGranoCacao;
  // Distribución por propietario:
  cosechasPorPropietario?: CosechaPropietario[];
  // No cosecha / General:
  resultadoTexto?: string;
  problemasEncontrados?: string;
  insumosUtilizados?: JornadaInsumo[];
  insumosRequeridos?: JornadaInsumo[];
  materialesUtilizados?: MaterialUtilizado[];
  materialesRequeridos?: MaterialRequerido[];
  observaciones?: string;
}

// ==========================================
// 8. JORNADA DE TRABAJO (MULTI-PROPIETARIO, MULTI-CUADRA, MULTI-TRABAJADOR)
// ==========================================
export interface SubJornadaDia {
  id: string;
  fecha: string; // YYYY-MM-DD
  trabajadores: TrabajadorJornada[];
  observaciones?: string;
}

export interface Jornada {
  id: string;
  codigo: string; // ej: "JORN-2026-001"
  fecha: string; // Fecha principal o fecha inicio (YYYY-MM-DD)
  fechaInicio?: string; // Alias de fecha
  fechaFin?: string; // Si es agrupada
  esAgrupada: boolean;
  tipoTrabajoId: string;
  propiedades?: PropiedadJornada[]; // 1..N propiedades/cuadras de diferentes propietarios
  subJornadas?: SubJornadaDia[]; // Para desglose día a día si es agrupada
  trabajadores: TrabajadorJornada[]; // 1..N trabajadores de la jornada
  totalHoras: number; // Suma de todas las horas (incluyendo familiares)
  totalHorasFamiliares?: number; // Horas aportadas por familiares ($0)
  totalPago: number; // Suma de pagos a liquidar (sin contar familiares $0)
  pagoTotal?: number; // Alias de totalPago
  insumosUtilizados?: JornadaInsumo[]; // Insumos efectivamente usados
  insumosRequeridos?: JornadaInsumo[]; // Insumos requeridos para futuro
  costoInsumos?: number; // Suma de costos de insumos utilizados
  costoTotal?: number; // totalPago + costoInsumos
  estadoPago?: EstadoPago; // Estado general
  fechaPago?: string;
  metodoPago?: string;
  comprobantePago?: string;
  // Propiedades de conveniencia/compatibilidad:
  propietarioId?: string;
  cuadraId?: string;
  trabajadorId?: string;
  tipoTarifa?: string;
  tarifaValor?: number;
  jornadas?: any[];
  observaciones: string;
  resultado?: ResultadoTrabajo;
  created_at?: string;
}

// Compatibilidad hacia atrás
export type VinculacionTrabajo = Jornada;
export type JornadaDiaria = SubJornadaDia;

// ==========================================
// 8. FILTROS INDEPENDIENTES
// ==========================================
export interface FiltrosFinca {
  propietarioId?: string;
  tipoPropiedad?: TipoPropiedad | 'todos';
  cuadraId?: string;
  tipoTrabajoId?: string;
  trabajadorId?: string;
  tipoTrabajador?: TipoTrabajador | 'todos';
  estadoPago?: EstadoPago | 'todos';
  fechaDesde?: string;
  fechaHasta?: string;
  searchTerm?: string;
}

// ==========================================
// 9. TOASTS Y MODALES PROPIOS
// ==========================================
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  durationMs?: number;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  onCancel?: () => void;
}
