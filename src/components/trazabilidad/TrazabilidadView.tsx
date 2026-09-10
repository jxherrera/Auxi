import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  History,
  Trees,
  User,
  HelpCircle,
  Clock,
  DollarSign,
  Grape,
  CheckCircle2,
  Calendar,
  Layers,
  Wrench,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency, formatDate, formatArea } from '../../utils/formatters';

export const TrazabilidadView: React.FC = () => {
  const {
    cuadras,
    trabajadores,
    vinculaciones,
    rentabilidades,
    stats,
    getCuadraById,
    getTrabajadorById,
    getTipoTrabajoById,
  } = useFarm();

  const [perspective, setPerspective] = useState<'cuadra' | 'trabajador' | 'preguntas'>('cuadra');
  const [selectedCuadraId, setSelectedCuadraId] = useState<string>(cuadras[0]?.id || '');
  const [selectedTrabajadorId, setSelectedTrabajadorId] = useState<string>(trabajadores[0]?.id || '');

  // Datos para perspectiva de Cuadra
  const vincsDeCuadra = vinculaciones.filter((v) => v.cuadraId === selectedCuadraId);
  const selectedCuadra = getCuadraById(selectedCuadraId);
  const rentabilidadCuadra = rentabilidades.find((r) => r.cuadra.id === selectedCuadraId);

  // Datos para perspectiva de Trabajador
  const vincsDeTrabajador = vinculaciones.filter((v) =>
    v.trabajadores?.some((t) => t.trabajadorId === selectedTrabajadorId) || v.trabajadorId === selectedTrabajadorId
  );
  const selectedTrabajador = getTrabajadorById(selectedTrabajadorId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cacao-900 text-amber-300">
            <History className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Trazabilidad Agrícola 360°</h2>
            <p className="text-xs text-slate-500">
              Línea de tiempo cronológica por cuadra o trabajador y resolución de las 12 preguntas de la operación
            </p>
          </div>
        </div>

        {/* Perspective Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setPerspective('cuadra')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              perspective === 'cuadra'
                ? 'bg-white text-cacao-950 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trees className="w-3.5 h-3.5 text-cacao-700" />
            <span>Por Cuadra</span>
          </button>
          <button
            onClick={() => setPerspective('trabajador')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              perspective === 'trabajador'
                ? 'bg-white text-cacao-950 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-blue-700" />
            <span>Por Trabajador</span>
          </button>
          <button
            onClick={() => setPerspective('preguntas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              perspective === 'preguntas'
                ? 'bg-white text-cacao-950 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Las 12 Preguntas Clave</span>
          </button>
        </div>
      </div>

      {/* 1. PERSPECTIVA POR CUADRA */}
      {perspective === 'cuadra' && (
        <div className="space-y-5">
          {/* Selector de Cuadra */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Seleccionar Cuadra a Auditar:</label>
              <select
                value={selectedCuadraId}
                onChange={(e) => setSelectedCuadraId(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-900 focus:border-cacao-700"
              >
                {cuadras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.referencia || c.lugar || c.ubicacion || ''})
                  </option>
                ))}
              </select>
            </div>

            {selectedCuadra && (
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span>Superficie: <strong>{formatArea(selectedCuadra.tamanoM2)}</strong></span>
                <span>•</span>
                <span>Estado: <strong className="uppercase text-emerald-700">{selectedCuadra.estado}</strong></span>
              </div>
            )}
          </div>

          {/* Resumen de la Cuadra */}
          {rentabilidadCuadra && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Cosecha Acumulada</span>
                <span className="text-lg font-bold text-amber-900 mt-1 block">
                  {rentabilidadCuadra.totalQuintalesCosechados} qq
                </span>
                <span className="text-[10px] text-slate-500">{rentabilidadCuadra.rendimientoPorHectarea} qq/ha</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Ingresos Generados</span>
                <span className="text-lg font-bold text-emerald-700 mt-1 block">
                  {formatCurrency(rentabilidadCuadra.ingresosGenerados)}
                </span>
                <span className="text-[10px] text-slate-500">Por venta de cacao</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Inversión en Mano Obra</span>
                <span className="text-lg font-bold text-rose-700 mt-1 block">
                  {formatCurrency(rentabilidadCuadra.gastosManoObra)}
                </span>
                <span className="text-[10px] text-slate-500">{rentabilidadCuadra.totalHoras} hrs invertidas</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-300 shadow-2xs">
                <span className="text-[10px] text-emerald-800 font-bold uppercase block">Margen Neto Cuadra</span>
                <span className="text-lg font-black text-emerald-700 mt-1 block">
                  {formatCurrency(rentabilidadCuadra.gananciaNeta)}
                </span>
                <span className="text-[10px] text-emerald-600">Rentabilidad directa</span>
              </div>
            </div>
          )}

          {/* Timeline de la Cuadra */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card">
            <h3 className="font-bold text-slate-900 text-sm mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cacao-700" />
              <span>Línea de Tiempo de Labores Realizadas en {selectedCuadra?.nombre}</span>
            </h3>

            {vincsDeCuadra.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">No hay registros para esta cuadra.</p>
            ) : (
              <div className="relative border-l-2 border-cacao-200 ml-4 space-y-8">
                {vincsDeCuadra.map((v) => {
                  const trabNombres = v.trabajadores && v.trabajadores.length > 0
                    ? v.trabajadores.map((t) => t.nombreTrabajador || getTrabajadorById(t.trabajadorId)?.nombreCompleto).filter(Boolean).join(', ')
                    : (getTrabajadorById(v.trabajadorId || '')?.nombreCompleto || 'Equipo agrícola');
                  const tipo = getTipoTrabajoById(v.tipoTrabajoId);
                  const fechaTxt = v.fecha || v.fechaInicio || '';

                  return (
                    <div key={v.id} className="relative pl-6 group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-cacao-700 group-hover:scale-125 transition" />

                      <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{tipo?.nombre}</span>
                            <span className="px-2 py-0.5 rounded-full bg-cacao-100 text-cacao-900 font-bold text-[10px]">
                              {trabNombres}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-500">
                            <span className="font-semibold text-slate-700">
                              {v.esAgrupada && v.fechaFin
                                ? `${formatDate(fechaTxt)} al ${formatDate(v.fechaFin)}`
                                : formatDate(fechaTxt)}
                            </span>
                            <span className="font-bold text-cacao-900 bg-cacao-50 px-2 py-0.5 rounded">
                              {v.totalHoras} hrs
                            </span>
                            <span className="font-bold text-emerald-700">
                              {formatCurrency(v.pagoTotal ?? v.totalPago ?? 0)}
                            </span>
                          </div>
                        </div>

                        {/* Detalle diario si es agrupada */}
                        {v.esAgrupada && v.subJornadas && v.subJornadas.length > 0 && (
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                            <strong>Jornadas consecutivas agrupadas ({v.subJornadas.length} días):</strong>
                            <div className="flex flex-wrap gap-2">
                              {v.subJornadas.map((j) => (
                                <span key={j.id} className="bg-slate-100 px-2 py-0.5 rounded">
                                  {formatDate(j.fecha)}: {j.trabajadores.length} trab.
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Resultado */}
                        {v.resultado && (
                          <div className="pt-2 border-t border-slate-200/80">
                            {v.resultado.esCosecha ? (
                              <div className="bg-amber-50 p-2 rounded-lg text-amber-950 font-medium">
                                🌾 Cosecha: {v.resultado.cantidadCosechada} {v.resultado.unidadMedida} • Ingreso: {formatCurrency(v.resultado.ingresoGenerado)} • Ganancia Neta: {formatCurrency(v.resultado.gananciaNeta)}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <p className="text-slate-800">
                                  <strong>Resultado:</strong> {v.resultado.resultadoTexto}
                                </p>
                                {v.resultado.materialesUtilizados && v.resultado.materialesUtilizados.length > 0 && (
                                  <p className="text-slate-600 text-[11px]">
                                    <strong>Materiales usados:</strong> {v.resultado.materialesUtilizados.map(m => `${m.nombre} (${m.cantidad} ${m.unidad})`).join(', ')}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. PERSPECTIVA POR TRABAJADOR */}
      {perspective === 'trabajador' && (
        <div className="space-y-5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Seleccionar Trabajador a Auditar:</label>
              <select
                value={selectedTrabajadorId}
                onChange={(e) => setSelectedTrabajadorId(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-900 focus:border-cacao-700"
              >
                {trabajadores.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombreCompleto} ({t.tipo})
                  </option>
                ))}
              </select>
            </div>

            {selectedTrabajador && (
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span>Tarifa: <strong>{formatCurrency(selectedTrabajador.tarifaHora)}/h</strong></span>
                <span>•</span>
                <span>Cédula: <strong>{selectedTrabajador.identificacion}</strong></span>
              </div>
            )}
          </div>

          {/* Timeline del Trabajador */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card">
            <h3 className="font-bold text-slate-900 text-sm mb-6 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-700" />
              <span>Récord de Actividades de {selectedTrabajador?.nombreCompleto}</span>
            </h3>

            {vincsDeTrabajador.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">No hay registros para este trabajador.</p>
            ) : (
              <div className="relative border-l-2 border-blue-200 ml-4 space-y-8">
                {vincsDeTrabajador.map((v) => {
                  const cid = v.cuadraId || v.propiedades?.[0]?.cuadraId || '';
                  const cuadra = getCuadraById(cid);
                  const tipo = getTipoTrabajoById(v.tipoTrabajoId);

                  return (
                    <div key={v.id} className="relative pl-6 group">
                      <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-blue-600 group-hover:scale-125 transition" />

                      <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{cuadra?.nombre}</span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold text-[10px]">
                              {tipo?.nombre}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-500">
                            <span>{formatDate(v.fecha || v.fechaInicio || '')}</span>
                            <span className="font-bold text-slate-900">
                              {v.trabajadores?.find((t) => t.trabajadorId === selectedTrabajadorId)?.horasTrabajadas ?? v.totalHoras} hrs
                            </span>
                            <span className="font-bold text-emerald-700">
                              {formatCurrency(v.trabajadores?.find((t) => t.trabajadorId === selectedTrabajadorId)?.pagoTotal ?? v.pagoTotal ?? v.totalPago ?? 0)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                (v.trabajadores?.find((t) => t.trabajadorId === selectedTrabajadorId)?.estadoPago ?? v.estadoPago) === 'pagado'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {(v.trabajadores?.find((t) => t.trabajadorId === selectedTrabajadorId)?.estadoPago ?? v.estadoPago) === 'pagado' ? 'Cobrado' : 'Por Cobrar'}
                            </span>
                          </div>
                        </div>

                        {v.resultado && (
                          <div className="pt-2 border-t border-slate-200/80 text-slate-700">
                            <strong>Resultado obtenido:</strong> {v.resultado.esCosecha ? `Cosecha de ${v.resultado.cantidadCosechada} ${v.resultado.unidadMedida}` : v.resultado.resultadoTexto}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. AUDITORÍA DE LAS 12 PREGUNTAS CLAVE */}
      {perspective === 'preguntas' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-6">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              Auditoría Agrícola: Respuestas Inmediatas a las 12 Preguntas Clave
            </h3>
            <p className="text-xs text-slate-500">
              El sistema conecta de forma relacional todas las entidades de la finca para responder con precisión cada duda operativa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Pregunta 1 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-cacao-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cacao-800 text-white font-bold flex items-center justify-center text-[10px]">1</span>
                ¿Quién trabajó en una determinada cuadra?
              </span>
              <p className="text-slate-600 pl-6.5">
                En la vista de cada Cuadra se muestran los trabajadores asignados históricamente con su rol, horas y fechas.
              </p>
            </div>

            {/* Pregunta 2 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-cacao-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cacao-800 text-white font-bold flex items-center justify-center text-[10px]">2</span>
                ¿Qué trabajo realizó?
              </span>
              <p className="text-slate-600 pl-6.5">
                Cada registro vincula la labor cultural exacta (Poda sanitaria, Cosecha, Deshierbe, Fumigación, Fertilización).
              </p>
            </div>

            {/* Pregunta 3 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-cacao-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cacao-800 text-white font-bold flex items-center justify-center text-[10px]">3</span>
                ¿Cuándo trabajó?
              </span>
              <p className="text-slate-600 pl-6.5">
                Fechas exactas de inicio y fin, con desglose día a día en jornadas consecutivas agrupadas.
              </p>
            </div>

            {/* Pregunta 4 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-cacao-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cacao-800 text-white font-bold flex items-center justify-center text-[10px]">4</span>
                ¿Cuántas horas trabajó?
              </span>
              <p className="text-slate-600 pl-6.5">
                Cálculo horario automático por turno (hora de entrada y salida) y suma consolidada de la labor.
              </p>
            </div>

            {/* Pregunta 5 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-cacao-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cacao-800 text-white font-bold flex items-center justify-center text-[10px]">5</span>
                ¿Cuánto se le pagó?
              </span>
              <p className="text-slate-600 pl-6.5">
                Multiplicación automática de horas por tarifa unitaria, con control de estado (Pendiente vs Pagado) y recibo de comprobante.
              </p>
            </div>

            {/* Pregunta 6 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-cacao-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cacao-800 text-white font-bold flex items-center justify-center text-[10px]">6</span>
                ¿Qué resultado obtuvo el trabajo?
              </span>
              <p className="text-slate-600 pl-6.5">
                Formulario adaptativo que registra el éxito de la labor y problemas agronómicos detectados en las plantas.
              </p>
            </div>

            {/* Pregunta 7 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-cacao-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cacao-800 text-white font-bold flex items-center justify-center text-[10px]">7</span>
                ¿Cuánto cacao se cosechó?
              </span>
              <p className="text-slate-600 pl-6.5">
                Acumulado global y por cuadra en quintales (qq), kilogramos o sacos de baba fresca.
              </p>
            </div>

            {/* Pregunta 8 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-cacao-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cacao-800 text-white font-bold flex items-center justify-center text-[10px]">8</span>
                ¿Cuánto dinero generó la cosecha?
              </span>
              <p className="text-slate-600 pl-6.5">
                Cálculo de Ingreso Bruto (Cantidad × Precio de venta) y Ganancia Neta restando gastos directos.
              </p>
            </div>

            {/* Pregunta 9 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-cacao-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cacao-800 text-white font-bold flex items-center justify-center text-[10px]">9</span>
                ¿Qué materiales se utilizaron?
              </span>
              <p className="text-slate-600 pl-6.5">
                Bitácora de insumos gastados en campo (litros de gasolina, pasta cúprica, sacos de NPK, piolas).
              </p>
            </div>

            {/* Pregunta 10 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-cacao-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cacao-800 text-white font-bold flex items-center justify-center text-[10px]">10</span>
                ¿Qué materiales hacen falta?
              </span>
              <p className="text-slate-600 pl-6.5">
                Panel de insumos requeridos con clasificación de perecibles/no perecibles y alertas de urgencia.
              </p>
            </div>

            {/* Pregunta 11 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-cacao-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cacao-800 text-white font-bold flex items-center justify-center text-[10px]">11</span>
                ¿Cuánto se ha gastado en una cuadra?
              </span>
              <p className="text-slate-600 pl-6.5">
                Suma consolidada de todos los jornales liquidados y costos en cada parcela específica.
              </p>
            </div>

            {/* Pregunta 12 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-cacao-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cacao-800 text-white font-bold flex items-center justify-center text-[10px]">12</span>
                ¿Cuál es la rentabilidad de cada cuadra?
              </span>
              <p className="text-slate-600 pl-6.5">
                Matriz de balance económico (Ingresos de cosecha - Gastos de mano de obra = Margen Neto y % ROI).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
