import React, { useState, useEffect } from 'react';
import {
  VinculacionTrabajo,
  ResultadoTrabajo,
  JornadaInsumo,
  TipoGranoCacao,
  CosechaPropietario,
  UnidadCosecha,
} from '../../types';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../layout/Modal';
import {
  Grape,
  Sparkles,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Package,
  Edit2,
  Eye,
  Fuel,
  Wrench,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface ResultadoModalProps {
  vinculacion: VinculacionTrabajo | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ResultadoModal: React.FC<ResultadoModalProps> = ({
  vinculacion,
  isOpen,
  onClose,
}) => {
  const {
    registrarResultado,
    getCuadraById,
    getTrabajadorById,
    getTipoTrabajoById,
    getPropietarioById,
    propietarios,
    cuadras,
    insumos,
  } = useFarm();
  const { confirm } = useToast();

  const tipoTrabajo = vinculacion ? getTipoTrabajoById(vinculacion.tipoTrabajoId) : null;
  const esCosecha = tipoTrabajo?.esCosecha ?? false;

  // Estado del Modo: 'read' (Consulta Solo Lectura inicial) o 'edit' (Edición de resultados)
  const [mode, setMode] = useState<'read' | 'edit'>('read');

  // Cosecha states
  const [cantidadCosechada, setCantidadCosechada] = useState<number>(1000);
  const [unidadMedida, setUnidadMedida] = useState<UnidadCosecha>('libras');
  const [precioVentaUnitario, setPrecioVentaUnitario] = useState<number>(0.80);
  const [gastosRelacionados, setGastosRelacionados] = useState<number>(100.00);
  const [tipoGrano, setTipoGrano] = useState<TipoGranoCacao>('Cacao Nacional Fino de Aroma');
  const [obsCosecha, setObsCosecha] = useState<string>('');

  // Distribución de cosecha por propietario
  const [cosechasPorPropietario, setCosechasPorPropietario] = useState<CosechaPropietario[]>([]);

  // No-cosecha states
  const [resultadoTexto, setResultadoTexto] = useState<string>('');
  const [problemasEncontrados, setProblemasEncontrados] = useState<string>('');
  const [obsGeneral, setObsGeneral] = useState<string>('');

  // Insumos utilizados y requeridos en la labor
  const [insumosUtilizados, setInsumosUtilizados] = useState<JornadaInsumo[]>([]);
  const [insumosRequeridos, setInsumosRequeridos] = useState<JornadaInsumo[]>([]);

  // Selector temporal para agregar insumo utilizado
  const [selectedInsumoId, setSelectedInsumoId] = useState('');
  const [newInsumoCant, setNewInsumoCant] = useState<number>(1);
  const [newInsumoCostoUnit, setNewInsumoCostoUnit] = useState<number>(0);
  const [newInsumoObs, setNewInsumoObs] = useState('');

  // Selector temporal para solicitar insumo requerido
  const [reqInsumoNombre, setReqInsumoNombre] = useState('');
  const [reqInsumoCant, setReqInsumoCant] = useState<number>(1);
  const [reqInsumoUnidad, setReqInsumoUnidad] = useState('litros');
  const [reqInsumoUrgente, setReqInsumoUrgente] = useState(false);
  const [reqInsumoObs, setReqInsumoObs] = useState('');

  useEffect(() => {
    if (vinculacion) {
      // Si la vinculación/jornada ya tiene resultado registrado, abrir por defecto en MODO CONSULTA (Solo Lectura)
      // Si aún no tiene resultado, abrir directamente en MODO EDICIÓN
      if (vinculacion.resultado) {
        setMode('read');
      } else {
        setMode('edit');
      }

      if (vinculacion.resultado) {
        const res = vinculacion.resultado;
        if (res.esCosecha) {
          const totalCant = res.cantidadCosechada || 1000;
          const uMedida = (res.unidadMedida as UnidadCosecha) || 'libras';
          const pUnit = res.precioVentaUnitario ?? 0.80;

          setCantidadCosechada(totalCant);
          setUnidadMedida(uMedida);
          setPrecioVentaUnitario(pUnit);
          setGastosRelacionados(res.gastosRelacionados || 100);
          setTipoGrano(res.tipoGrano || 'Cacao Nacional Fino de Aroma');
          setObsCosecha(res.observaciones || '');

          if (res.cosechasPorPropietario && res.cosechasPorPropietario.length > 0) {
            // Asegurar que cada fila herede el precio unitario general
            setCosechasPorPropietario(
              res.cosechasPorPropietario.map((cp) => ({
                ...cp,
                precioUnitario: pUnit,
                ingresoGenerado: parseFloat((Number(cp.cantidad) * pUnit).toFixed(2)),
                gananciaNeta: parseFloat(((Number(cp.cantidad) * pUnit) - (Number(cp.gastosRelacionados) || 0)).toFixed(2)),
              }))
            );
          } else {
            generarDistribucionInicial(totalCant, uMedida, pUnit);
          }
        } else {
          setResultadoTexto(res.resultadoTexto || '');
          setProblemasEncontrados(res.problemasEncontrados || '');
          setObsGeneral(res.observaciones || '');
        }

        // Cargar insumos
        const used = res.insumosUtilizados || vinculacion.insumosUtilizados || [];
        const req = res.insumosRequeridos || vinculacion.insumosRequeridos || [];
        setInsumosUtilizados(used);
        setInsumosRequeridos(req);
      } else {
        // Defaults iniciales
        setCantidadCosechada(1000);
        setUnidadMedida('libras');
        setPrecioVentaUnitario(0.80);
        setGastosRelacionados(100.00);
        setTipoGrano('Cacao Nacional Fino de Aroma');
        setObsCosecha('');
        setResultadoTexto('');
        setProblemasEncontrados('');
        setObsGeneral('');
        setInsumosUtilizados(vinculacion.insumosUtilizados || []);
        setInsumosRequeridos(vinculacion.insumosRequeridos || []);

        generarDistribucionInicial(1000, 'libras', 0.80);
      }
    }
  }, [vinculacion, isOpen]);

  // Generar distribución inicial basada en los propietarios que participaron en la jornada
  const generarDistribucionInicial = (total: number, unidad: UnidadCosecha, precio: number) => {
    if (!vinculacion) return;

    const propsJornada = vinculacion.propiedades && vinculacion.propiedades.length > 0
      ? vinculacion.propiedades
      : [{ id: 'jp-def', propietarioId: vinculacion.propietarioId || '', cuadraId: vinculacion.cuadraId || '', horasEstimadas: 0, observaciones: '' }];

    const uniqueOwnerIds = Array.from(
      new Set(propsJornada.map((p) => p.propietarioId).filter((id): id is string => Boolean(id)))
    );
    const numOwners = uniqueOwnerIds.length || 1;
    const porcion = parseFloat((total / numOwners).toFixed(1));

    const dist: CosechaPropietario[] = uniqueOwnerIds.map((pId, idx) => {
      const cuadrasOwner = propsJornada
        .filter((p) => p.propietarioId === pId)
        .map((p) => p.cuadraId)
        .filter((id): id is string => Boolean(id));
      const cant = idx === numOwners - 1 ? parseFloat((total - porcion * (numOwners - 1)).toFixed(1)) : porcion;
      const ing = parseFloat((cant * precio).toFixed(2));
      const gast = parseFloat((100 / numOwners).toFixed(2));
      return {
        id: `cp-${Date.now()}-${idx}`,
        propietarioId: pId,
        cuadraIds: cuadrasOwner,
        cantidad: cant,
        unidad,
        precioUnitario: precio, // Único precio general
        gastosRelacionados: gast,
        ingresoGenerado: ing,
        gananciaNeta: parseFloat((ing - gast).toFixed(2)),
        tipoGrano: 'Cacao Nacional Fino de Aroma',
        observaciones: `Cosecha recolectada en ${cuadrasOwner.length} parcela(s)`,
      };
    });

    setCosechasPorPropietario(dist);
  };

  if (!vinculacion) return null;

  const cuadra = vinculacion.cuadraId ? getCuadraById(vinculacion.cuadraId) : (vinculacion.propiedades?.[0]?.cuadraId ? getCuadraById(vinculacion.propiedades[0].cuadraId) : undefined);
  
  // Lista de trabajadores de la jornada
  const trabajadoresJornada = vinculacion.trabajadores && vinculacion.trabajadores.length > 0
    ? vinculacion.trabajadores.map((tj) => {
        const trabInfo = getTrabajadorById(tj.trabajadorId);
        return {
          ...tj,
          nombreCompleto: trabInfo?.nombreCompleto || tj.nombreTrabajador || 'Trabajador',
          tipo: trabInfo?.tipo || 'Contratado',
        };
      })
    : [];

  const nombresTrabajadoresTexto = trabajadoresJornada.map((t) => t.nombreCompleto).join(', ') || 'Sin asignar';
  const costoManoObraJornada = vinculacion.totalPago ?? vinculacion.pagoTotal ?? 0;

  // Costo total de insumos utilizados
  const costoTotalInsumos = parseFloat(
    insumosUtilizados.reduce((acc, item) => acc + (Number(item.costoTotal) || 0), 0).toFixed(2)
  );

  // Cálculos dinámicos en vivo para cosecha general
  const ingresoGenerado = parseFloat((cantidadCosechada * precioVentaUnitario).toFixed(2));
  const gananciaNeta = parseFloat((ingresoGenerado - gastosRelacionados - costoTotalInsumos).toFixed(2));

  // Suma de cosecha distribuida
  const sumaCosechaDistribuida = parseFloat(
    cosechasPorPropietario.reduce((acc, c) => acc + (Number(c.cantidad) || 0), 0).toFixed(2)
  );
  const diferenciaDistribucion = parseFloat((cantidadCosechada - sumaCosechaDistribuida).toFixed(2));

  // Etiqueta dinámica de precio unitario según la unidad
  const getPrecioUnitarioLabel = (u: UnidadCosecha) => {
    switch (u) {
      case 'libras':
        return 'Precio por libra ($/lb)';
      case 'kg':
        return 'Precio por kilogramo ($/kg)';
      case 'quintales':
        return 'Precio por quintal ($/qq)';
      case 'sacos':
        return 'Precio por saco ($/saco)';
      default:
        return 'Precio unitario ($)';
    }
  };

  // Sincronización del Precio General con todos los propietarios
  const handleGeneralPriceChange = (newPrice: number) => {
    setPrecioVentaUnitario(newPrice);
    setCosechasPorPropietario((prev) =>
      prev.map((c) => {
        const ing = parseFloat((c.cantidad * newPrice).toFixed(2));
        return {
          ...c,
          precioUnitario: newPrice,
          ingresoGenerado: ing,
          gananciaNeta: parseFloat((ing - c.gastosRelacionados).toFixed(2)),
        };
      })
    );
  };

  // Manejo de cambio en la cantidad total de la cosecha (hacia los propietarios o viceversa)
  const handleCantidadTotalChange = (newTotal: number) => {
    setCantidadCosechada(newTotal);
  };

  // Handlers para agregar y modificar cosechas por propietario
  const handleAddCosechaPropietario = () => {
    const assignedPropIds = cosechasPorPropietario.map((c) => c.propietarioId);
    const available = propietarios.find((p) => !assignedPropIds.includes(p.id)) || propietarios[0];

    if (!available) return;

    const cuadrasDueno = cuadras.filter((c) => c.propietarioId === available.id).map((c) => c.id);
    const restante = Math.max(0, diferenciaDistribucion);
    const ing = parseFloat((restante * precioVentaUnitario).toFixed(2));

    const nuevaFila: CosechaPropietario = {
      id: `cp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      propietarioId: available.id,
      cuadraIds: cuadrasDueno,
      cantidad: restante,
      unidad: unidadMedida,
      precioUnitario: precioVentaUnitario, // Hereda precio único
      gastosRelacionados: 0,
      ingresoGenerado: ing,
      gananciaNeta: ing,
      tipoGrano,
      observaciones: '',
    };

    const newRows = [...cosechasPorPropietario, nuevaFila];
    setCosechasPorPropietario(newRows);

    // Auto-actualizar total general con la nueva suma
    const newSum = parseFloat(newRows.reduce((acc, c) => acc + (Number(c.cantidad) || 0), 0).toFixed(2));
    if (newSum > cantidadCosechada) {
      setCantidadCosechada(newSum);
    }
  };

  const handleRemoveCosechaPropietario = (id: string) => {
    if (cosechasPorPropietario.length <= 1) return;
    const remaining = cosechasPorPropietario.filter((c) => c.id !== id);
    setCosechasPorPropietario(remaining);
    // Sincronizar total cosechado con la suma resultante si se desea
    const newSum = parseFloat(remaining.reduce((acc, c) => acc + (Number(c.cantidad) || 0), 0).toFixed(2));
    setCantidadCosechada(newSum);
  };

  const handleCosechaPropietarioChange = (
    id: string,
    field: 'propietarioId' | 'cuadraIds' | 'cantidad' | 'gastosRelacionados',
    value: any
  ) => {
    setCosechasPorPropietario((prev) => {
      const updatedList = prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, [field]: value };

          if (field === 'propietarioId') {
            const cDueno = cuadras.filter((cd) => cd.propietarioId === value).map((cd) => cd.id);
            updated.cuadraIds = cDueno;
          }

          const cant = field === 'cantidad' ? Number(value) : c.cantidad;
          const gastos = field === 'gastosRelacionados' ? Number(value) : c.gastosRelacionados;
          const ing = parseFloat((cant * precioVentaUnitario).toFixed(2));

          updated.precioUnitario = precioVentaUnitario; // Siempre el unitario general
          updated.ingresoGenerado = ing;
          updated.gananciaNeta = parseFloat((ing - gastos).toFixed(2));

          return updated;
        }
        return c;
      });

      // Sincronización dinámica: si el usuario editó la cantidad del propietario, recalcular la suma y actualizar total
      if (field === 'cantidad') {
        const totalCalculado = parseFloat(
          updatedList.reduce((acc, item) => acc + (Number(item.cantidad) || 0), 0).toFixed(2)
        );
        setCantidadCosechada(totalCalculado);
      }

      return updatedList;
    });
  };

  // Repartir equitativamente el total entre las filas
  const handleDistribuirEquitativamente = () => {
    if (cosechasPorPropietario.length === 0) return;
    const n = cosechasPorPropietario.length;
    const cuota = parseFloat((cantidadCosechada / n).toFixed(1));
    const gastoCuota = parseFloat((gastosRelacionados / n).toFixed(2));

    setCosechasPorPropietario((prev) =>
      prev.map((c, idx) => {
        const cant = idx === n - 1 ? parseFloat((cantidadCosechada - cuota * (n - 1)).toFixed(1)) : cuota;
        const ing = parseFloat((cant * precioVentaUnitario).toFixed(2));
        return {
          ...c,
          cantidad: cant,
          precioUnitario: precioVentaUnitario,
          gastosRelacionados: gastoCuota,
          ingresoGenerado: ing,
          gananciaNeta: parseFloat((ing - gastoCuota).toFixed(2)),
        };
      })
    );
  };

  // Handlers para Insumos Utilizados
  const handleAddInsumoUtilizado = () => {
    if (!selectedInsumoId) return;
    const ins = insumos.find((i) => i.id === selectedInsumoId);
    if (!ins) return;

    const cant = Number(newInsumoCant) || 1;
    const cUnit = newInsumoCostoUnit !== undefined && newInsumoCostoUnit >= 0 ? newInsumoCostoUnit : ins.costoUnitario;
    const cTot = parseFloat((cant * cUnit).toFixed(2));

    setInsumosUtilizados([
      ...insumosUtilizados,
      {
        id: `ji-used-${Date.now()}`,
        insumoId: ins.id,
        nombreInsumo: ins.nombre,
        categoria: ins.categoria,
        tipo: 'utilizado',
        cantidad: cant,
        unidad: ins.unidad,
        costoUnitario: cUnit,
        costoTotal: cTot,
        observaciones: newInsumoObs.trim(),
      },
    ]);

    setSelectedInsumoId('');
    setNewInsumoCant(1);
    setNewInsumoCostoUnit(0);
    setNewInsumoObs('');
  };

  const handleRemoveInsumoUtilizado = (id: string) => {
    setInsumosUtilizados(insumosUtilizados.filter((item) => item.id !== id));
  };

  // Handlers para Insumos Requeridos
  const handleAddInsumoRequerido = () => {
    if (!reqInsumoNombre.trim()) return;

    setInsumosRequeridos([
      ...insumosRequeridos,
      {
        id: `ji-req-${Date.now()}`,
        nombreInsumo: reqInsumoNombre.trim(),
        tipo: 'requerido',
        cantidad: Number(reqInsumoCant) || 1,
        unidad: reqInsumoUnidad.trim() || 'litros',
        estado: reqInsumoUrgente ? 'urgente' : 'pendiente',
        observaciones: reqInsumoObs.trim(),
      },
    ]);

    setReqInsumoNombre('');
    setReqInsumoCant(1);
    setReqInsumoObs('');
  };

  const handleRemoveInsumoRequerido = (id: string) => {
    setInsumosRequeridos(insumosRequeridos.filter((item) => item.id !== id));
  };

  // Guardar con confirmación modal previa
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    confirm({
      title: '¿Guardar resultados de la jornada?',
      message: esCosecha
        ? `Se registrará la liquidación de ${cantidadCosechada} ${unidadMedida} con ingreso de ${formatCurrency(ingresoGenerado)} y distribución en ${cosechasPorPropietario.length} propietario(s).`
        : `Se actualizarán los resultados de campo, insumos utilizados (${insumosUtilizados.length}) e insumos solicitados (${insumosRequeridos.length}).`,
      type: 'info',
      confirmText: 'Confirmar y Guardar',
      cancelText: 'Revisar',
      onConfirm: async () => {
        let resultadoFinal: ResultadoTrabajo;

        if (esCosecha) {
          resultadoFinal = {
            esCosecha: true,
            cantidadCosechada: Number(cantidadCosechada),
            unidadMedida,
            precioVentaUnitario: Number(precioVentaUnitario),
            ingresoGenerado,
            gastosRelacionados: Number(gastosRelacionados),
            costoInsumos: costoTotalInsumos,
            gananciaNeta,
            tipoGrano,
            observaciones: obsCosecha.trim(),
            cosechasPorPropietario,
            insumosUtilizados,
            insumosRequeridos,
          };
        } else {
          resultadoFinal = {
            esCosecha: false,
            resultadoTexto: resultadoTexto.trim(),
            problemasEncontrados: problemasEncontrados.trim(),
            insumosUtilizados,
            insumosRequeridos,
            costoInsumos: costoTotalInsumos,
            observaciones: obsGeneral.trim(),
          };
        }

        await registrarResultado(vinculacion.id, resultadoFinal);
        onClose();
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'read'
          ? `Reporte de Resultados — ${vinculacion.codigo}`
          : esCosecha
          ? 'Registro de Cosecha & Distribución por Propietario'
          : 'Registro de Resultados de Campo & Insumos'
      }
      subtitle={`${vinculacion.codigo} • ${tipoTrabajo?.nombre || 'Labor'} • Cuadras: ${
        vinculacion.propiedades?.length ? `${vinculacion.propiedades.length} parcela(s)` : cuadra?.nombre || 'General'
      }`}
      maxWidth="4xl"
    >
      <div className="space-y-4 text-xs">
        {/* Banner contextual de la jornada */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-800 text-xs block">
                Labor: {tipoTrabajo?.nombre} ({vinculacion.totalHoras}h en total)
              </span>
              <span className="text-[11px] text-slate-500">
                Personal: {nombresTrabajadoresTexto}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-amber-100 text-amber-900 border border-amber-300">
                {esCosecha ? 'Zafra / Cosecha Cacao' : 'Mantenimiento de Campo'}
              </span>
              <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-cacao-100 text-cacao-900 border border-cacao-300">
                Mano de Obra: {formatCurrency(costoManoObraJornada)}
              </span>
              {mode === 'read' ? (
                <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Modo Consulta
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                  <Edit2 className="w-3 h-3" /> Modo Edición
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODO 1: CONSULTA (SOLO LECTURA)                                            */}
        {/* ========================================================================= */}
        {mode === 'read' ? (
          <div className="space-y-4">
            {esCosecha ? (
              /* Reporte Cosecha Solo Lectura */
              <div className="space-y-4">
                {/* Cuadro Global de la Cosecha */}
                <div className="bg-gradient-to-br from-cacao-900 to-cacao-950 p-4 rounded-2xl text-white shadow-soft">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase text-cacao-300 tracking-wider">
                      Resumen Ejecutivo de la Cosecha
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-harvest-500 text-cacao-950">
                      {tipoGrano}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-cacao-800/80 p-3 rounded-xl border border-cacao-700">
                      <span className="text-[10px] text-cacao-300 font-semibold block">Total Cosechado</span>
                      <span className="text-base font-black text-white">
                        {cantidadCosechada} {unidadMedida}
                      </span>
                      <span className="text-[10px] text-harvest-400 block">
                        a {formatCurrency(precioVentaUnitario)}/{unidadMedida === 'libras' ? 'lb' : unidadMedida}
                      </span>
                    </div>

                    <div className="bg-cacao-800/80 p-3 rounded-xl border border-cacao-700">
                      <span className="text-[10px] text-cacao-300 font-semibold block">Ingreso Bruto</span>
                      <span className="text-base font-black text-white">
                        {formatCurrency(ingresoGenerado)}
                      </span>
                      <span className="text-[10px] text-slate-300 block">Venta directa</span>
                    </div>

                    <div className="bg-cacao-800/80 p-3 rounded-xl border border-cacao-700">
                      <span className="text-[10px] text-cacao-300 font-semibold block">Gastos Directos</span>
                      <span className="text-base font-black text-rose-300">
                        {formatCurrency(gastosRelacionados)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Fletes / Transporte</span>
                    </div>

                    <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-600">
                      <span className="text-[10px] text-emerald-300 font-bold block">Ganancia Neta Global</span>
                      <span className="text-base font-black text-emerald-400">
                        {formatCurrency(gananciaNeta)}
                      </span>
                      <span className="text-[10px] text-emerald-300/80 block">Liquidación final</span>
                    </div>
                  </div>
                </div>

                {/* Tarjetas de Distribución por Propietario (Solo Lectura) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Distribución por Propietario ({cosechasPorPropietario.length})
                    </span>
                    <span className="text-xs text-emerald-700 font-bold">
                      ✓ Precio unitario aplicado: {formatCurrency(precioVentaUnitario)}/{unidadMedida === 'libras' ? 'lb' : unidadMedida}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {cosechasPorPropietario.map((cp) => {
                      const dueno = getPropietarioById(cp.propietarioId);
                      return (
                        <div key={cp.id} className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <strong className="text-cacao-950 text-xs">{dueno?.nombreCompleto || 'Propietario'}</strong>
                            <span className="text-xs font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                              {cp.cantidad} {unidadMedida}
                            </span>
                          </div>

                          <div className="text-[11px] space-y-1 pt-1 border-t border-slate-100 text-slate-600">
                            <div className="flex justify-between">
                              <span>Precio único:</span>
                              <span className="font-semibold text-slate-800">{formatCurrency(precioVentaUnitario)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Ingreso bruto:</span>
                              <strong className="text-slate-900">{formatCurrency(cp.ingresoGenerado)}</strong>
                            </div>
                            <div className="flex justify-between text-rose-700">
                              <span>Gastos asignados:</span>
                              <span>- {formatCurrency(cp.gastosRelacionados)}</span>
                            </div>
                            <div className="flex justify-between font-black text-emerald-700 pt-1 border-t border-slate-100 text-xs">
                              <span>Ganancia Neta:</span>
                              <span>{formatCurrency(cp.gananciaNeta)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Insumos utilizados en la cosecha si existen */}
                {insumosUtilizados.length > 0 && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-800 block mb-2">
                      Insumos & Materiales Utilizados en el Corte / Recolección:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {insumosUtilizados.map((ins, idx) => (
                        <span key={ins.id || idx} className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-800 text-xs font-semibold">
                          📦 {ins.nombreInsumo} — <strong>{ins.cantidad} {ins.unidad}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {obsCosecha && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                    <strong className="block text-slate-900 mb-0.5">Observaciones de la Cosecha:</strong>
                    {obsCosecha}
                  </div>
                )}
              </div>
            ) : (
              /* Reporte No Cosecha (Deshierbe, Poda, Fumigación) Solo Lectura */
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Resultado Técnico de la Labor
                    </span>
                    <p className="text-sm font-semibold text-slate-800">
                      {resultadoTexto || 'Labor de campo completada satisfactoriamente.'}
                    </p>
                  </div>

                  {problemasEncontrados && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                      <strong>Problemas Fitosanitarios / Novedades de Campo:</strong>
                      <p className="mt-0.5">{problemasEncontrados}</p>
                    </div>
                  )}

                  {/* Resumen Económico Integrado */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Mano de Obra</span>
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(costoManoObraJornada)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Costo Insumos</span>
                      <span className="text-sm font-bold text-cacao-900">{formatCurrency(costoTotalInsumos)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Costo Total Labor</span>
                      <span className="text-base font-black text-emerald-700">
                        {formatCurrency(costoManoObraJornada + costoTotalInsumos)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Insumos Utilizados */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-cacao-700" />
                    <span>Insumos y Herramientas Utilizados ({insumosUtilizados.length})</span>
                  </span>

                  {insumosUtilizados.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {insumosUtilizados.map((ins, i) => (
                        <div key={ins.id || i} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">
                              {ins.categoria === 'Combustibles' ? '⛽' : ins.categoria === 'Herramientas' ? '🔧' : '📦'}{' '}
                              {ins.nombreInsumo}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Cantidad: <strong>{ins.cantidad} {ins.unidad}</strong>
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 block text-xs">
                              {formatCurrency(ins.costoTotal || 0)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {ins.costoUnitario && ins.costoUnitario > 0 ? `${formatCurrency(ins.costoUnitario)}/${ins.unidad}` : 'Sin costo'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-[11px]">No se registraron insumos ni herramientas para esta labor.</p>
                  )}
                </div>

                {/* Insumos Requeridos */}
                {insumosRequeridos.length > 0 && (
                  <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-2">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Insumos Requeridos / Pedidos Faltantes ({insumosRequeridos.length})</span>
                    </span>
                    <div className="space-y-1.5">
                      {insumosRequeridos.map((req, i) => (
                        <div key={req.id || i} className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900">
                              {req.nombreInsumo} — {req.cantidad} {req.unidad}
                            </span>
                            {req.observaciones && (
                              <span className="block text-[10px] text-slate-500 italic">{req.observaciones}</span>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            req.estado === 'urgente' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {req.estado?.toUpperCase() || 'PENDIENTE'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer de Modo Consulta: Solo Editar resultados y Cerrar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={() => setMode('edit')}
                className="px-5 py-2 rounded-xl bg-cacao-800 hover:bg-cacao-900 text-white font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <Edit2 className="w-4 h-4 text-harvest-400" />
                <span>✏ Editar Resultados</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* MODO 2: EDICIÓN (FORMULARIO DINÁMICO)                                       */
          /* ========================================================================= */
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {esCosecha ? (
              /* Formulario Cosecha */
              <div className="space-y-4">
                {/* Parámetros Generales de la Cosecha con Precio Unitario Único */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Grape className="w-4 h-4 text-amber-600" />
                      <span>Datos Generales de la Cosecha</span>
                    </h4>
                    <span className="text-[11px] text-cacao-800 font-bold bg-harvest-400/20 px-2 py-0.5 rounded-md">
                      El precio unitario ingresado se aplica automáticamente a todos los propietarios
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Cantidad Total Recolectada *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        required
                        value={cantidadCosechada}
                        onChange={(e) => handleCantidadTotalChange(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-cacao-700 text-sm font-bold transition"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Unidad de Medida *
                      </label>
                      <select
                        value={unidadMedida}
                        onChange={(e) => setUnidadMedida(e.target.value as UnidadCosecha)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-cacao-700 text-xs transition bg-white font-medium"
                      >
                        <option value="libras">Libras (lb)</option>
                        <option value="kg">Kilogramos (kg)</option>
                        <option value="quintales">Quintales (qq - 100 lb)</option>
                        <option value="sacos">Sacos de baba</option>
                        <option value="otra">Otra unidad</option>
                      </select>
                    </div>

                    {/* PRECIO GENERAL ÚNICO */}
                    <div className="bg-amber-50/80 p-2 rounded-xl border border-amber-300">
                      <label className="block font-bold text-cacao-950 mb-1">
                        {getPrecioUnitarioLabel(unidadMedida)} *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={precioVentaUnitario}
                        onChange={(e) => handleGeneralPriceChange(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg border border-amber-400 focus:border-cacao-800 text-sm font-black text-cacao-950 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Gastos Directos ($)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        value={gastosRelacionados}
                        onChange={(e) => setGastosRelacionados(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-cacao-700 text-xs transition font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* SECCIÓN: DISTRIBUCIÓN DE LA COSECHA POR PROPIETARIO */}
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-2.5">
                    <div>
                      <h4 className="font-bold text-cacao-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <span>Distribución de la Cosecha por Propietario ({cosechasPorPropietario.length})</span>
                      </h4>
                      <p className="text-[11px] text-amber-900">
                        Cada propietario utiliza automáticamente el precio general de <strong>{formatCurrency(precioVentaUnitario)}/{unidadMedida === 'libras' ? 'lb' : unidadMedida}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={handleDistribuirEquitativamente}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition"
                      >
                        ⚖ Repartir equitativo
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCosechaPropietario}
                        className="px-3 py-1.5 rounded-xl bg-cacao-800 hover:bg-cacao-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5 text-harvest-400" />
                        <span>+ Agregar propietario</span>
                      </button>
                    </div>
                  </div>

                  {/* Alerta de balance dinámica según la especificación */}
                  {Math.abs(diferenciaDistribucion) < 0.05 ? (
                    <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        ✓ <strong>{sumaCosechaDistribuida} {unidadMedida}</strong> distribuidas de <strong>{cantidadCosechada} {unidadMedida}</strong> recolectadas.
                      </span>
                    </div>
                  ) : diferenciaDistribucion > 0 ? (
                    <div className="px-3.5 py-2 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center gap-2 font-medium">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        ⚠ Faltan <strong>{diferenciaDistribucion} {unidadMedida}</strong> por distribuir (Registrado: {cantidadCosechada} {unidadMedida} | Distribuido: {sumaCosechaDistribuida} {unidadMedida}).
                      </span>
                    </div>
                  ) : (
                    <div className="px-3.5 py-2 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 flex items-center gap-2 font-medium">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        ⚠ Se han distribuido <strong>{sumaCosechaDistribuida} {unidadMedida}</strong>, pero la cosecha registrada es de <strong>{cantidadCosechada} {unidadMedida}</strong> (Excede por {Math.abs(diferenciaDistribucion)} {unidadMedida}).
                      </span>
                    </div>
                  )}

                  {/* Vista Móvil: Tarjetas por Propietario (Pantallas pequeñas) */}
                  <div className="space-y-2.5 md:hidden">
                    {cosechasPorPropietario.map((cp) => {
                      const dueno = getPropietarioById(cp.propietarioId);
                      const cuadrasDueno = cuadras.filter((c) => c.propietarioId === cp.propietarioId);

                      return (
                        <div key={cp.id} className="bg-white p-3 rounded-2xl border border-amber-200 shadow-2xs space-y-2.5">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-[10px] font-black">
                                🌾
                              </span>
                              <span>{dueno?.nombreCompleto || 'Propietario'}</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-emerald-700">
                                {formatCurrency(cp.gananciaNeta)} neto
                              </span>
                              {cosechasPorPropietario.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCosechaPropietario(cp.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition"
                                  title="Remover propietario"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Propietario</label>
                              <select
                                value={cp.propietarioId}
                                onChange={(e) => handleCosechaPropietarioChange(cp.id, 'propietarioId', e.target.value)}
                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                              >
                                {propietarios.map((p) => (
                                  <option key={p.id} value={p.id}>{p.nombreCompleto}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Cuadra de Origen</label>
                              <select
                                value={cp.cuadraIds?.[0] || ''}
                                onChange={(e) => handleCosechaPropietarioChange(cp.id, 'cuadraIds', [e.target.value])}
                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                              >
                                {cuadrasDueno.map((c) => (
                                  <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Cantidad ({unidadMedida})</label>
                              <input
                                type="number"
                                step="0.01"
                                value={cp.cantidad}
                                onChange={(e) => handleCosechaPropietarioChange(cp.id, 'cantidad', Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 bg-amber-50/50 border border-amber-300 rounded-xl text-xs font-bold text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Gastos ($)</label>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={cp.gastosRelacionados}
                                onChange={(e) => handleCosechaPropietarioChange(cp.id, 'gastosRelacionados', Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 bg-rose-50/50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                            <span className="text-slate-500">Precio general: {formatCurrency(precioVentaUnitario)}</span>
                            <span className="font-bold text-slate-700">Ingreso: {formatCurrency(cp.ingresoGenerado)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tabla de Cosechas por Propietario (Desktop / Pantallas medianas en adelante) */}
                  <div className="hidden md:block border border-amber-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-amber-100/60 text-cacao-950 font-bold border-b border-amber-200 text-[11px]">
                          <tr>
                            <th className="py-2.5 px-3">Propietario</th>
                            <th className="py-2.5 px-2">Cuadra(s) de Origen</th>
                            <th className="py-2.5 px-2 text-right w-28">Cantidad ({unidadMedida})</th>
                            <th className="py-2.5 px-2 text-right w-24">Precio ({formatCurrency(precioVentaUnitario)})</th>
                            <th className="py-2.5 px-2 text-right w-24">Gastos ($)</th>
                            <th className="py-2.5 px-2 text-right w-24">Ingreso ($)</th>
                            <th className="py-2.5 px-3 text-right w-24">Ganancia Neta ($)</th>
                            <th className="py-2.5 px-2 text-center w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {cosechasPorPropietario.map((cp) => {
                            const dueno = getPropietarioById(cp.propietarioId);
                            const cuadrasDueno = cuadras.filter((c) => c.propietarioId === cp.propietarioId);

                            return (
                              <tr key={cp.id} className="hover:bg-slate-50/70 transition">
                                <td className="py-2.5 px-3">
                                  <select
                                    value={cp.propietarioId}
                                    onChange={(e) => handleCosechaPropietarioChange(cp.id, 'propietarioId', e.target.value)}
                                    className="w-full px-2 py-1 rounded border border-slate-300 text-xs font-semibold bg-white"
                                  >
                                    {propietarios.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.nombreCompleto}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                <td className="py-2.5 px-2">
                                  <select
                                    value={cp.cuadraIds?.[0] || ''}
                                    onChange={(e) => handleCosechaPropietarioChange(cp.id, 'cuadraIds', [e.target.value])}
                                    className="w-full px-2 py-1 rounded border border-slate-300 text-xs bg-white"
                                  >
                                    {cuadrasDueno.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.nombre}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                <td className="py-2.5 px-2 text-right">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={cp.cantidad}
                                    onChange={(e) => handleCosechaPropietarioChange(cp.id, 'cantidad', Number(e.target.value))}
                                    className="w-24 px-2 py-1 rounded border border-slate-300 text-xs font-bold text-right text-cacao-950 bg-amber-50/40"
                                  />
                                </td>

                                {/* Precio fijo heredado automáticamente */}
                                <td className="py-2.5 px-2 text-right font-medium text-slate-500">
                                  {formatCurrency(precioVentaUnitario)}
                                </td>

                                <td className="py-2.5 px-2 text-right">
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={cp.gastosRelacionados}
                                    onChange={(e) => handleCosechaPropietarioChange(cp.id, 'gastosRelacionados', Number(e.target.value))}
                                    className="w-20 px-1.5 py-1 rounded border border-slate-300 text-xs text-right text-rose-700"
                                  />
                                </td>

                                <td className="py-2.5 px-2 text-right font-bold text-slate-800">
                                  {formatCurrency(cp.ingresoGenerado)}
                                </td>

                                <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                                  {formatCurrency(cp.gananciaNeta)}
                                </td>

                                <td className="py-2.5 px-2 text-center">
                                  <button
                                    type="button"
                                    disabled={cosechasPorPropietario.length <= 1}
                                    onClick={() => handleRemoveCosechaPropietario(cp.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition"
                                    title="Remover propietario"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Cuadro de Liquidación Global de la Cosecha */}
                <div className="bg-gradient-to-br from-cacao-900 to-cacao-950 p-4 rounded-2xl text-white shadow-soft">
                  <span className="text-[11px] font-bold uppercase text-cacao-300 tracking-wider block mb-2">
                    Balance Económico General de la Cosecha
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-cacao-800/80 p-3 rounded-xl border border-cacao-700">
                      <span className="text-[10px] text-cacao-300 font-semibold block">Ingreso Bruto</span>
                      <span className="text-base font-extrabold text-white">
                        {formatCurrency(ingresoGenerado)}
                      </span>
                      <span className="text-[10px] text-harvest-400 block">
                        {cantidadCosechada} {unidadMedida}
                      </span>
                    </div>

                    <div className="bg-cacao-800/80 p-3 rounded-xl border border-cacao-700">
                      <span className="text-[10px] text-cacao-300 font-semibold block">Gastos Directos</span>
                      <span className="text-base font-extrabold text-rose-300">
                        {formatCurrency(gastosRelacionados)}
                      </span>
                      <span className="text-[10px] text-cacao-400 block">Fletes</span>
                    </div>

                    <div className="bg-cacao-800/80 p-3 rounded-xl border border-cacao-700">
                      <span className="text-[10px] text-cacao-300 font-semibold block">Mano de Obra</span>
                      <span className="text-base font-extrabold text-amber-300">
                        {formatCurrency(costoManoObraJornada)}
                      </span>
                      <span className="text-[10px] text-cacao-400 block">{vinculacion.totalHoras}h en campo</span>
                    </div>

                    <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-600 shadow-xs">
                      <span className="text-[10px] text-emerald-300 font-bold block">Margen Neto Limpio</span>
                      <span className="text-base font-black text-emerald-400">
                        {formatCurrency(ingresoGenerado - gastosRelacionados - costoManoObraJornada)}
                      </span>
                      <span className="text-[10px] text-emerald-300/80 block">Utilidad global</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Observaciones Generales de la Cosecha
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Grado Brix, dulzor de baba, condiciones climáticas del corte, madurez uniforme..."
                    value={obsCosecha}
                    onChange={(e) => setObsCosecha(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-cacao-700 text-xs resize-none bg-white"
                  />
                </div>
              </div>
            ) : (
              /* Formulario No-Cosecha (Deshierbe, Poda, Fumigación) */
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Resultado del Trabajo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Cuadra completamente limpia, zanjas de desagüe despejadas"
                    value={resultadoTexto}
                    onChange={(e) => setResultadoTexto(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-cacao-700 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Problemas Fitosanitarios o Agronómicos Encontrados
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Presencia de monilia en árboles del lindero; deficiencia nutricional de potasio..."
                    value={problemasEncontrados}
                    onChange={(e) => setProblemasEncontrados(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-cacao-700 text-xs resize-none"
                  />
                </div>

                {/* SECCIÓN A: Insumos y Herramientas Utilizados (con catálogo y costos) */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-cacao-700" />
                      <span>Insumos & Herramientas Utilizados en esta Labor</span>
                    </span>
                    <span className="text-xs font-bold text-cacao-900">
                      Gasto Insumos: {formatCurrency(costoTotalInsumos)}
                    </span>
                  </div>

                  {/* Lista de utilizados */}
                  {insumosUtilizados.length > 0 ? (
                    <div className="space-y-1.5">
                      {insumosUtilizados.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">
                              {item.categoria === 'Combustibles' ? '⛽' : item.categoria === 'Herramientas' ? '🔧' : '📦'}{' '}
                              {item.nombreInsumo}
                            </span>
                            <span className="text-slate-500 ml-2">
                              {item.cantidad} {item.unidad}
                            </span>
                            {item.costoUnitario && item.costoUnitario > 0 ? (
                              <span className="text-slate-400 text-[10px] ml-2">
                                ({formatCurrency(item.costoUnitario)}/{item.unidad})
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-900">
                              {formatCurrency(item.costoTotal || 0)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveInsumoUtilizado(item.id)}
                              className="text-slate-400 hover:text-rose-600 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No se han registrado insumos ni herramientas.</p>
                  )}

                  {/* Formulario para agregar insumo del catálogo */}
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
                    <select
                      value={selectedInsumoId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedInsumoId(id);
                        const found = insumos.find((i) => i.id === id);
                        if (found) {
                          setNewInsumoCostoUnit(found.costoUnitario);
                        }
                      }}
                      className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
                    >
                      <option value="">-- Seleccionar Insumo del Catálogo --</option>
                      {insumos.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nombre} ({i.categoria}) — Stock: {i.stockActual} {i.unidad}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="Cant."
                      value={newInsumoCant}
                      onChange={(e) => setNewInsumoCant(Number(e.target.value))}
                      className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 text-xs text-center"
                    />

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Costo/u ($)"
                      value={newInsumoCostoUnit}
                      onChange={(e) => setNewInsumoCostoUnit(Number(e.target.value))}
                      className="w-24 px-2 py-1.5 rounded-lg border border-slate-300 text-xs text-center"
                    />

                    <button
                      type="button"
                      onClick={handleAddInsumoUtilizado}
                      className="px-3 py-1.5 bg-cacao-800 hover:bg-cacao-900 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>

                {/* SECCIÓN B: Insumos Requeridos / Faltantes */}
                <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-3">
                  <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Insumos Requeridos / Faltantes para Próximos Trabajos</span>
                  </span>

                  {insumosRequeridos.length > 0 ? (
                    <div className="space-y-1.5">
                      {insumosRequeridos.map((req) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-amber-200 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800">
                              {req.nombreInsumo} — {req.cantidad} {req.unidad}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                              <span
                                className={`px-1.5 py-0.2 rounded-sm font-semibold ${
                                  req.estado === 'urgente' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {req.estado?.toUpperCase() || 'PENDIENTE'}
                              </span>
                              {req.observaciones && <span className="text-amber-800 italic">{req.observaciones}</span>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveInsumoRequerido(req.id)}
                            className="text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No se han solicitado insumos adicionales.</p>
                  )}

                  {/* Formulario rápido para solicitar insumo */}
                  <div className="pt-2 border-t border-amber-200 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      placeholder="Insumo faltante (ej: Gasolina, Fertilizante NPK)"
                      value={reqInsumoNombre}
                      onChange={(e) => setReqInsumoNombre(e.target.value)}
                      className="flex-1 min-w-[160px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />

                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="Cant."
                      value={reqInsumoCant}
                      onChange={(e) => setReqInsumoCant(Number(e.target.value))}
                      className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 text-xs text-center"
                    />

                    <input
                      type="text"
                      placeholder="Unidad (litros, kg)"
                      value={reqInsumoUnidad}
                      onChange={(e) => setReqInsumoUnidad(e.target.value)}
                      className="w-24 px-2 py-1.5 rounded-lg border border-slate-300 text-xs text-center"
                    />

                    <label className="flex items-center gap-1.5 cursor-pointer text-rose-700 font-semibold px-2">
                      <input
                        type="checkbox"
                        checked={reqInsumoUrgente}
                        onChange={(e) => setReqInsumoUrgente(e.target.checked)}
                        className="rounded text-rose-600"
                      />
                      <span>Urgente</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleAddInsumoRequerido}
                      className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Solicitar</span>
                    </button>
                  </div>
                </div>

                {/* Resumen de Costos Mano de Obra + Insumos */}
                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span>Mano de obra: <strong>{formatCurrency(costoManoObraJornada)}</strong></span>
                    <span>Insumos utilizados: <strong>{formatCurrency(costoTotalInsumos)}</strong></span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">
                      Costo Total de la Labor:{' '}
                      <strong className="text-emerald-700 text-sm font-black">
                        {formatCurrency(costoManoObraJornada + costoTotalInsumos)}
                      </strong>
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Observaciones Adicionales
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Observaciones de campo, clima, recomendaciones para la próxima labor..."
                    value={obsGeneral}
                    onChange={(e) => setObsGeneral(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-cacao-700 text-xs resize-none"
                  />
                </div>
              </div>
            )}

            {/* Footer de Modo Edición */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (vinculacion.resultado) setMode('read');
                  else onClose();
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold transition"
              >
                {vinculacion.resultado ? 'Cancelar edición' : 'Cerrar'}
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cacao-800 hover:bg-cacao-900 text-white font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-harvest-400" />
                <span>Guardar Resultados</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
