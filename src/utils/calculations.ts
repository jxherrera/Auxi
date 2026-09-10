import {
  Propietario,
  Cuadra,
  Trabajador,
  Jornada,
  TrabajadorJornada,
  MaterialRequerido,
  FormaPago,
} from '../types';

/**
 * Calcula las horas netas trabajadas: (HoraSalida - HoraEntrada) - Almuerzo
 * Retorna { horas: number, error: string | null }
 */
export const calculateNetHoursWorked = (
  horaEntrada: string,
  horaSalida: string,
  almuerzoHoras: number = 1.0
): { horas: number; error: string | null } => {
  if (!horaEntrada || !horaSalida) {
    return { horas: 0, error: 'Ingresa la hora de entrada y de salida' };
  }

  const [h1, m1] = horaEntrada.split(':').map(Number);
  const [h2, m2] = horaSalida.split(':').map(Number);

  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) {
    return { horas: 0, error: 'Formato de hora inválido' };
  }

  const minutosEntrada = h1 * 60 + m1;
  const minutosSalida = h2 * 60 + m2;
  const minutosTotales = minutosSalida - minutosEntrada;

  if (minutosTotales <= 0) {
    return { horas: 0, error: 'La hora de salida debe ser posterior a la hora de entrada' };
  }

  const minutosAlmuerzo = (Number(almuerzoHoras) || 0) * 60;
  if (minutosAlmuerzo >= minutosTotales) {
    return { horas: 0, error: 'El tiempo de almuerzo no puede ser mayor o igual al turno de trabajo' };
  }

  const minutosNetos = minutosTotales - minutosAlmuerzo;
  const horasNetas = parseFloat((minutosNetos / 60).toFixed(2));

  return { horas: Math.max(0, horasNetas), error: null };
};

/**
 * Calcula el pago de un trabajador según la forma de pago
 */
export const calculateWorkerPay = (
  horasTrabajadas: number,
  tipoPago: FormaPago,
  tarifa: number
): number => {
  if (tipoPago === 'sin_pago') return 0.00;
  const tar = Number(tarifa) || 0;

  switch (tipoPago) {
    case 'por_hora':
      return parseFloat((horasTrabajadas * tar).toFixed(2));
    case 'por_jornada':
      return parseFloat(tar.toFixed(2));
    case 'pago_fijo':
      return parseFloat(tar.toFixed(2));
    default:
      return 0.00;
  }
};

export const calculateHoursBetween = (entrada: string, salida: string, almuerzo: number = 1.0): number => {
  return calculateNetHoursWorked(entrada, salida, almuerzo).horas;
};

export const calculateTotalPay = (horas: number, tipoTarifa: any, valorTarifa: number): number => {
  const mapping: Record<string, FormaPago> = {
    'por_hora': 'por_hora',
    'por_dia': 'por_jornada',
    'por_jornada': 'por_jornada',
    'fijo': 'pago_fijo',
    'pago_fijo': 'pago_fijo',
    'sin_pago': 'sin_pago',
  };
  const forma = mapping[tipoTarifa] || 'por_hora';
  return calculateWorkerPay(horas, forma, valorTarifa);
};

export interface DashboardStats {
  totalPropietarios: number;
  totalCuadras: number;
  totalCuadrasPropias: number;
  totalCuadrasTerceros: number;
  totalM2: number;
  totalTrabajadores: number;
  totalTrabajadoresFamiliares: number;
  trabajosRealizados: number;
  trabajosPendientes: number;
  totalPagadoTrabajadores: number;
  totalPendientePago: number;
  totalHorasTrabajadas: number;
  totalHorasFamiliares: number;
  produccionTotalQuintales: number;
  ingresosCosecha: number;
  gastosCosecha: number;
  gananciaNetaCosecha: number;
  balanceNetoFinca: number;
  materialesRequeridosUrgentes: MaterialRequerido[];
}

export const computeDashboardStats = (
  propietarios: Propietario[],
  cuadras: Cuadra[],
  trabajadores: Trabajador[],
  jornadas: Jornada[],
  filtroPropietarioId?: string,
  filtroTipoPropiedad?: string
): DashboardStats => {
  // Aplicar filtros si se solicitan
  let cuadrasFiltradas = cuadras;
  if (filtroPropietarioId && filtroPropietarioId !== 'todos') {
    cuadrasFiltradas = cuadrasFiltradas.filter((c) => c.propietarioId === filtroPropietarioId);
  }
  if (filtroTipoPropiedad && filtroTipoPropiedad !== 'todos') {
    cuadrasFiltradas = cuadrasFiltradas.filter((c) => c.tipoPropiedad === filtroTipoPropiedad);
  }

  const cuadrasIdsFiltradas = new Set(cuadrasFiltradas.map((c) => c.id));

  let jornadasFiltradas = jornadas;
  if (filtroPropietarioId && filtroPropietarioId !== 'todos') {
    jornadasFiltradas = jornadasFiltradas.filter((j) => {
      if (j.propietarioId === filtroPropietarioId) return true;
      if (j.propiedades && j.propiedades.some((p) => p.propietarioId === filtroPropietarioId)) return true;
      if (j.resultado?.cosechasPorPropietario?.some((cp) => cp.propietarioId === filtroPropietarioId)) return true;
      return false;
    });
  }
  if (filtroTipoPropiedad && filtroTipoPropiedad !== 'todos') {
    jornadasFiltradas = jornadasFiltradas.filter((j) => {
      if (j.cuadraId && cuadrasIdsFiltradas.has(j.cuadraId)) return true;
      if (j.propiedades && j.propiedades.some((p) => cuadrasIdsFiltradas.has(p.cuadraId))) return true;
      return false;
    });
  }

  const totalPropietarios = propietarios.filter((p) => p.estado === 'activo').length;
  const totalCuadras = cuadrasFiltradas.length;
  const totalCuadrasPropias = cuadrasFiltradas.filter((c) => c.tipoPropiedad === 'propia').length;
  const totalCuadrasTerceros = cuadrasFiltradas.filter((c) => c.tipoPropiedad === 'tercero').length;
  const totalM2 = cuadrasFiltradas.reduce((acc, c) => acc + (c.tamanoM2 || 0), 0);
  const totalTrabajadores = trabajadores.filter((t) => t.estado === 'activo').length;
  const totalTrabajadoresFamiliares = trabajadores.filter((t) => t.tipo === 'Familiar').length;

  let trabajosRealizados = 0;
  let trabajosPendientes = 0;
  let totalPagadoTrabajadores = 0;
  let totalPendientePago = 0;
  let totalHorasTrabajadas = 0;
  let totalHorasFamiliares = 0;
  let produccionTotalQuintales = 0;
  let ingresosCosecha = 0;
  let gastosCosecha = 0;
  let gananciaNetaCosecha = 0;
  const materialesRequeridosUrgentes: MaterialRequerido[] = [];

  jornadasFiltradas.forEach((j) => {
    if (j.resultado) {
      trabajosRealizados++;
    } else {
      trabajosPendientes++;
    }

    totalHorasTrabajadas += j.totalHoras || 0;
    totalHorasFamiliares += j.totalHorasFamiliares || 0;

    // Pagos de trabajadores en la jornada (sin duplicar nunca)
    j.trabajadores.forEach((tj) => {
      if (tj.estadoPago === 'pagado') {
        totalPagadoTrabajadores += tj.pagoTotal || 0;
      } else {
        totalPendientePago += tj.pagoTotal || 0;
      }
    });

    if (j.resultado?.esCosecha) {
      // Si se filtra por un propietario específico y la jornada tiene distribución por propietario
      if (
        filtroPropietarioId &&
        filtroPropietarioId !== 'todos' &&
        j.resultado.cosechasPorPropietario &&
        j.resultado.cosechasPorPropietario.length > 0
      ) {
        const cosechasDueno = j.resultado.cosechasPorPropietario.filter(
          (cp) => cp.propietarioId === filtroPropietarioId
        );
        cosechasDueno.forEach((cp) => {
          produccionTotalQuintales += cp.cantidad || 0;
          ingresosCosecha += cp.ingresoGenerado || 0;
          gastosCosecha += cp.gastosRelacionados || 0;
          gananciaNetaCosecha += cp.gananciaNeta || (cp.ingresoGenerado || 0) - (cp.gastosRelacionados || 0);
        });
      } else {
        const q = j.resultado.cantidadCosechada || 0;
        produccionTotalQuintales += q;
        ingresosCosecha += j.resultado.ingresoGenerado || 0;
        gastosCosecha += j.resultado.gastosRelacionados || 0;
        gananciaNetaCosecha += j.resultado.gananciaNeta || (j.resultado.ingresoGenerado || 0) - (j.resultado.gastosRelacionados || 0);
      }
    }

    if (j.resultado?.materialesRequeridos) {
      j.resultado.materialesRequeridos.forEach((mat) => {
        if (mat.estado === 'urgente' || mat.estado === 'pendiente') {
          materialesRequeridosUrgentes.push(mat);
        }
      });
    }
  });

  const balanceNetoFinca = ingresosCosecha - (totalPagadoTrabajadores + totalPendientePago + gastosCosecha);

  return {
    totalPropietarios,
    totalCuadras,
    totalCuadrasPropias,
    totalCuadrasTerceros,
    totalM2,
    totalTrabajadores,
    totalTrabajadoresFamiliares,
    trabajosRealizados,
    trabajosPendientes,
    totalPagadoTrabajadores,
    totalPendientePago,
    totalHorasTrabajadas,
    totalHorasFamiliares,
    produccionTotalQuintales,
    ingresosCosecha,
    gastosCosecha,
    gananciaNetaCosecha,
    balanceNetoFinca,
    materialesRequeridosUrgentes,
  };
};

export interface RentabilidadCuadra {
  cuadra: Cuadra;
  propietario?: Propietario;
  totalHoras: number;
  totalHorasFamiliares: number;
  totalJornalesPagados: number;
  totalQuintalesCosechados: number;
  ingresosGenerados: number;
  gastosManoObra: number;
  gananciaNeta: number;
  rendimientoPorHectarea: number;
}

export const computeRentabilidadCuadras = (
  cuadras: Cuadra[],
  jornadas: Jornada[],
  propietarios: Propietario[]
): RentabilidadCuadra[] => {
  return cuadras.map((cuadra) => {
    const propietario = propietarios.find((p) => p.id === cuadra.propietarioId);
    // Una jornada se relaciona con la cuadra si es su cuadraId principal o está en propiedades
    const jCuadra = jornadas.filter((j) => {
      if (j.cuadraId === cuadra.id) return true;
      if (j.propiedades && j.propiedades.some((p) => p.cuadraId === cuadra.id)) return true;
      return false;
    });

    let totalHoras = 0;
    let totalHorasFamiliares = 0;
    let gastosManoObra = 0;
    let totalQuintalesCosechados = 0;
    let ingresosGenerados = 0;

    jCuadra.forEach((j) => {
      // Si la jornada tiene propiedades detalladas, prorratear o tomar horas estimadas
      const propDetalle = j.propiedades?.find((p) => p.cuadraId === cuadra.id);
      if (propDetalle && propDetalle.horasEstimadas) {
        totalHoras += propDetalle.horasEstimadas;
      } else {
        const numCuadras = Math.max(1, j.propiedades?.length || 1);
        totalHoras += (j.totalHoras || 0) / numCuadras;
        totalHorasFamiliares += (j.totalHorasFamiliares || 0) / numCuadras;
        gastosManoObra += (j.totalPago || 0) / numCuadras;
      }

      if (j.resultado?.esCosecha) {
        // Verificar si existe distribución por propietario para esta cuadra
        const cpCuadra = j.resultado.cosechasPorPropietario?.find((cp) =>
          cp.cuadraIds?.includes(cuadra.id)
        );
        if (cpCuadra) {
          const numCuadrasInCp = cpCuadra.cuadraIds?.length || 1;
          const share = 1 / numCuadrasInCp;
          totalQuintalesCosechados += (cpCuadra.cantidad || 0) * share;
          ingresosGenerados += (cpCuadra.ingresoGenerado || 0) * share;
        } else if (j.cuadraId === cuadra.id) {
          totalQuintalesCosechados += j.resultado.cantidadCosechada || 0;
          ingresosGenerados += j.resultado.ingresoGenerado || 0;
        }
      }
    });

    const gananciaNeta = ingresosGenerados - gastosManoObra;
    const hectareas = (cuadra.tamanoM2 || 10000) / 10000;
    const rendimientoPorHectarea = hectareas > 0
      ? parseFloat((totalQuintalesCosechados / hectareas).toFixed(1))
      : 0;

    return {
      cuadra,
      propietario,
      totalHoras: parseFloat(totalHoras.toFixed(1)),
      totalHorasFamiliares: parseFloat(totalHorasFamiliares.toFixed(1)),
      totalJornalesPagados: parseFloat(gastosManoObra.toFixed(2)),
      totalQuintalesCosechados: parseFloat(totalQuintalesCosechados.toFixed(1)),
      ingresosGenerados: parseFloat(ingresosGenerados.toFixed(2)),
      gastosManoObra: parseFloat(gastosManoObra.toFixed(2)),
      gananciaNeta: parseFloat(gananciaNeta.toFixed(2)),
      rendimientoPorHectarea,
    };
  });
};
