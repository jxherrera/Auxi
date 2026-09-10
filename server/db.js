import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asegurar que exista la carpeta data
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'agrocacao.db');
const db = new sqlite3.Database(dbPath);

// Helper para ejecutar consultas con Promises
export const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

export const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

// Helpers de Criptografía Segura para Contraseñas
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, storedHash) {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

// Inicializar Tablas y Relaciones
export async function initDatabase() {
  await runQuery('PRAGMA foreign_keys = ON;');

  // 0. Usuarios y Autenticación RBAC
  await runQuery(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      salt TEXT NOT NULL,
      rol TEXT NOT NULL CHECK(rol IN ('Administrador', 'Operador')),
      estado TEXT DEFAULT 'activo' CHECK(estado IN ('activo', 'inactivo')),
      ultimoAcceso TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 1. Propietarios
  await runQuery(`
    CREATE TABLE IF NOT EXISTS propietarios (
      id TEXT PRIMARY KEY,
      nombreCompleto TEXT NOT NULL,
      identificacion TEXT NOT NULL UNIQUE,
      telefono TEXT,
      direccion TEXT,
      observaciones TEXT,
      estado TEXT DEFAULT 'activo',
      fechaRegistro TEXT
    );
  `);

  // 2. Cuadras (con propietarioId y tipoPropiedad)
  await runQuery(`
    CREATE TABLE IF NOT EXISTS cuadras (
      id TEXT PRIMARY KEY,
      propietarioId TEXT NOT NULL,
      nombre TEXT NOT NULL,
      lugar TEXT NOT NULL,
      referencia TEXT,
      tamanoM2 REAL NOT NULL,
      tipoPropiedad TEXT NOT NULL CHECK(tipoPropiedad IN ('propia', 'tercero')),
      estado TEXT NOT NULL CHECK(estado IN ('activa', 'inactiva', 'mantenimiento')),
      observaciones TEXT,
      fechaCreacion TEXT,
      FOREIGN KEY (propietarioId) REFERENCES propietarios(id) ON DELETE RESTRICT
    );
  `);

  // 3. Trabajadores (con clasificación Familiar, Contratado, etc.)
  await runQuery(`
    CREATE TABLE IF NOT EXISTS trabajadores (
      id TEXT PRIMARY KEY,
      nombreCompleto TEXT NOT NULL,
      identificacion TEXT NOT NULL UNIQUE,
      telefono TEXT,
      tipo TEXT NOT NULL CHECK(tipo IN ('Contratado', 'Familiar', 'Eventual', 'Otro')),
      tarifaHora REAL DEFAULT 0,
      tarifaDia REAL DEFAULT 0,
      estado TEXT DEFAULT 'activo' CHECK(estado IN ('activo', 'inactivo')),
      observaciones TEXT
    );
  `);

  // 4. Tipos de Trabajo
  await runQuery(`
    CREATE TABLE IF NOT EXISTS tipos_trabajo (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      categoria TEXT NOT NULL,
      descripcion TEXT,
      esCosecha INTEGER DEFAULT 0,
      icono TEXT
    );
  `);

  // 5. Jornadas (Cabecera operativa)
  await runQuery(`
    CREATE TABLE IF NOT EXISTS jornadas (
      id TEXT PRIMARY KEY,
      codigo TEXT NOT NULL UNIQUE,
      propietarioId TEXT,
      cuadraId TEXT,
      tipoTrabajoId TEXT NOT NULL,
      fecha TEXT NOT NULL,
      fechaFin TEXT,
      esAgrupada INTEGER DEFAULT 0,
      totalHoras REAL DEFAULT 0,
      totalHorasFamiliares REAL DEFAULT 0,
      totalPago REAL DEFAULT 0,
      observaciones TEXT,
      resultado_esCosecha INTEGER,
      resultado_cantidad REAL,
      resultado_unidad TEXT,
      resultado_precio REAL,
      resultado_ingreso REAL,
      resultado_gastos REAL,
      resultado_ganancia REAL,
      resultado_tipoGrano TEXT,
      resultado_texto TEXT,
      resultado_problemas TEXT,
      resultado_observaciones TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tipoTrabajoId) REFERENCES tipos_trabajo(id) ON DELETE RESTRICT
    );
  `);

  // 5.1 Propiedades trabajadas por Jornada (Multi-propietario / Multi-cuadra)
  await runQuery(`
    CREATE TABLE IF NOT EXISTS jornada_propiedades (
      id TEXT PRIMARY KEY,
      jornadaId TEXT NOT NULL,
      propietarioId TEXT NOT NULL,
      cuadraId TEXT NOT NULL,
      horasEstimadas REAL DEFAULT 0,
      observaciones TEXT,
      FOREIGN KEY (jornadaId) REFERENCES jornadas(id) ON DELETE CASCADE,
      FOREIGN KEY (propietarioId) REFERENCES propietarios(id) ON DELETE RESTRICT,
      FOREIGN KEY (cuadraId) REFERENCES cuadras(id) ON DELETE CASCADE
    );
  `);

  // 5.2 Distribución de Cosecha por Propietario
  await runQuery(`
    CREATE TABLE IF NOT EXISTS cosechas_propietario (
      id TEXT PRIMARY KEY,
      jornadaId TEXT NOT NULL,
      propietarioId TEXT NOT NULL,
      cuadraIds TEXT NOT NULL,
      cantidad REAL NOT NULL,
      unidad TEXT NOT NULL,
      precioUnitario REAL NOT NULL,
      gastosRelacionados REAL DEFAULT 0,
      ingresoGenerado REAL NOT NULL,
      gananciaNeta REAL NOT NULL,
      tipoGrano TEXT,
      observaciones TEXT,
      FOREIGN KEY (jornadaId) REFERENCES jornadas(id) ON DELETE CASCADE,
      FOREIGN KEY (propietarioId) REFERENCES propietarios(id) ON DELETE RESTRICT
    );
  `);

  // 6. Trabajadores por Jornada (Multi-trabajador con horarios y cálculo automático)
  await runQuery(`
    CREATE TABLE IF NOT EXISTS jornada_trabajadores (
      id TEXT PRIMARY KEY,
      jornadaId TEXT NOT NULL,
      trabajadorId TEXT NOT NULL,
      horaEntrada TEXT NOT NULL,
      horaSalida TEXT NOT NULL,
      almuerzoHoras REAL DEFAULT 1,
      horasTrabajadas REAL NOT NULL,
      tipoPago TEXT NOT NULL CHECK(tipoPago IN ('por_hora', 'por_jornada', 'pago_fijo', 'sin_pago')),
      tarifa REAL DEFAULT 0,
      pagoTotal REAL DEFAULT 0,
      estadoPago TEXT DEFAULT 'pendiente' CHECK(estadoPago IN ('pendiente', 'pagado')),
      fechaPago TEXT,
      metodoPago TEXT,
      comprobantePago TEXT,
      observaciones TEXT,
      FOREIGN KEY (jornadaId) REFERENCES jornadas(id) ON DELETE CASCADE,
      FOREIGN KEY (trabajadorId) REFERENCES trabajadores(id) ON DELETE RESTRICT
    );
  `);

  // 7. Materiales Utilizados
  await runQuery(`
    CREATE TABLE IF NOT EXISTS materiales_utilizados (
      id TEXT PRIMARY KEY,
      jornadaId TEXT NOT NULL,
      nombre TEXT NOT NULL,
      cantidad REAL NOT NULL,
      unidad TEXT NOT NULL,
      FOREIGN KEY (jornadaId) REFERENCES jornadas(id) ON DELETE CASCADE
    );
  `);

  // 8. Materiales Requeridos
  await runQuery(`
    CREATE TABLE IF NOT EXISTS materiales_requeridos (
      id TEXT PRIMARY KEY,
      jornadaId TEXT NOT NULL,
      nombre TEXT NOT NULL,
      cantidad REAL NOT NULL,
      unidad TEXT NOT NULL,
      esPerecible INTEGER DEFAULT 0,
      estado TEXT DEFAULT 'pendiente',
      observaciones TEXT,
      FOREIGN KEY (jornadaId) REFERENCES jornadas(id) ON DELETE CASCADE
    );
  `);

  // 9. Insumos y Recursos (Catálogo centralizado de herramientas, combustibles, etc.)
  await runQuery(`
    CREATE TABLE IF NOT EXISTS insumos (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL UNIQUE,
      categoria TEXT NOT NULL,
      unidad TEXT NOT NULL,
      stockInicial REAL DEFAULT 0,
      stockActual REAL DEFAULT 0,
      costoUnitario REAL DEFAULT 0,
      estado TEXT DEFAULT 'activo',
      observaciones TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 10. Insumos utilizados y requeridos en Jornadas (Relación N:M enriquecida)
  await runQuery(`
    CREATE TABLE IF NOT EXISTS jornada_insumos (
      id TEXT PRIMARY KEY,
      jornadaId TEXT NOT NULL,
      insumoId TEXT,
      nombreInsumo TEXT NOT NULL,
      categoria TEXT,
      tipo TEXT NOT NULL CHECK(tipo IN ('utilizado', 'requerido')),
      cantidad REAL NOT NULL,
      unidad TEXT NOT NULL,
      costoUnitario REAL DEFAULT 0,
      costoTotal REAL DEFAULT 0,
      estado TEXT DEFAULT 'utilizado',
      observaciones TEXT,
      FOREIGN KEY (jornadaId) REFERENCES jornadas(id) ON DELETE CASCADE,
      FOREIGN KEY (insumoId) REFERENCES insumos(id) ON DELETE SET NULL
    );
  `);

  // Solo inicializar tipos de trabajo si está vacío (catálogo fijo de actividades)
  const tiposCount = await getQuery('SELECT COUNT(*) as count FROM tipos_trabajo');
  if (tiposCount && tiposCount.count === 0) {
    await runQuery(`
      INSERT INTO tipos_trabajo (id, nombre, categoria, descripcion, esCosecha, icono)
      VALUES
        ('tipo-cosecha', 'Cosecha', 'cosecha', 'Corte de mazorcas maduras, partido y desgranado', 1, 'Grape'),
        ('tipo-poda', 'Poda', 'mantenimiento', 'Poda fitosanitaria, aclareo y deschuponado', 0, 'Scissors'),
        ('tipo-limpieza', 'Limpieza', 'mantenimiento', 'Control de malezas y despeje de zanjas', 0, 'Sparkles'),
        ('tipo-deshierbe', 'Deshierbe', 'mantenimiento', 'Chapeo manual y mecánico en coronas', 0, 'Shovel'),
        ('tipo-fumigacion', 'Aplicación de productos', 'fitosanitario', 'Control preventivo de monilia y escoba de bruja', 0, 'SprayCan'),
        ('tipo-fertilizacion', 'Fertilización', 'agronomico', 'Aplicación edáfica de abono orgánico y NPK', 0, 'Layers'),
        ('tipo-mantenimiento', 'Mantenimiento General', 'mantenimiento', 'Cercas, caminos y marquesinas de secado', 0, 'Wrench');
    `);
  }
}

// Semilla inicial completa conforme a los requerimientos del usuario
async function seedInitialData() {
  // Propietarios (Mayra, Carlos, Juan)
  await runQuery(`
    INSERT INTO propietarios (id, nombreCompleto, identificacion, telefono, direccion, observaciones, estado, fechaRegistro)
    VALUES
      ('prop-1', 'Mayra González', '0928374610', '0998877665', 'Recinto El Cacao, Sector Central', 'Propietaria principal y administradora de la finca', 'activo', '2026-01-10'),
      ('prop-2', 'Carlos Mendoza', '1209384756', '0987654321', 'Vía Principal Km 14, Parroquia Rural', 'Propietario de terrenos asociados en aparcería', 'activo', '2026-01-20'),
      ('prop-3', 'Juan Morales', '0912345678', '0971122334', 'Vía al Río Km 8, Sector San Vicente', 'Propietario asociado', 'activo', '2026-02-01');
  `);

  // Cuadras asignadas
  await runQuery(`
    INSERT INTO cuadras (id, propietarioId, nombre, lugar, referencia, tamanoM2, tipoPropiedad, estado, observaciones, fechaCreacion)
    VALUES
      ('cuadra-1', 'prop-1', 'Cuadra 1 - El Mirador', 'Sector Alto - Lote A', 'Junto al reservorio de agua y ladera sur', 12500, 'propia', 'activa', 'Cacao Nacional Fino de Aroma de 7 años', '2026-01-15'),
      ('cuadra-2', 'prop-1', 'Cuadra 2 - Las Palmas', 'Sector Central - Lote B', 'Frente al camino carrozable', 18000, 'propia', 'activa', 'CCN-51 de alta productividad con microaspersión', '2026-02-10'),
      ('cuadra-3', 'prop-2', 'Cuadra 3 - El Río', 'Sector Bajo - Ribera', 'Margen derecha del estero fluvial', 15200, 'tercero', 'activa', 'Suelo fértil; requiere podas periódicas', '2026-02-20'),
      ('cuadra-4', 'prop-2', 'Cuadra 4 - San José', 'Sector Occidental - Lote D', 'Colindante con bosque protector', 9800, 'tercero', 'mantenimiento', 'En plan de renovación y manejo fitosanitario', '2026-03-05'),
      ('cuadra-5', 'prop-3', 'Cuadra 5 - La Providencia', 'Sector Oriental - Lote E', 'Junto a la bodega y estero', 14000, 'tercero', 'activa', 'Plantación mixta con plátano y sombrío', '2026-04-12');
  `);

  // Trabajadores (incluyendo Freddy Zambrano con tarifa decimal libre $2.60)
  await runQuery(`
    INSERT INTO trabajadores (id, nombreCompleto, identificacion, telefono, tipo, tarifaHora, tarifaDia, estado, observaciones)
    VALUES
      ('trab-freddy', 'Freddy Zambrano', '0938271645', '0987123450', 'Contratado', 2.60, 20.80, 'activo', 'Trabajador multifunción de campo y recolección'),
      ('trab-1', 'Pedro Zambrano', '1203948571', '0991234567', 'Contratado', 3.00, 24.00, 'activo', 'Experto en recolección, zafra y acarreo pesado'),
      ('trab-3', 'María González', '0948291038', '0998765432', 'Familiar', 0.00, 0.00, 'activo', 'Miembro familiar: apoyo en fermentación y control de secado ($0)'),
      ('trab-2', 'Juan Pérez', '0918273645', '0984561230', 'Contratado', 4.00, 32.00, 'activo', 'Especialista en podas y deschuponado'),
      ('trab-4', 'Miguel Ángel Torres', '0928374619', '0978901234', 'Eventual', 5.00, 40.00, 'activo', 'Técnico en fumigación fitosanitaria y monilia');
  `);

  // Tipos de Trabajo
  await runQuery(`
    INSERT INTO tipos_trabajo (id, nombre, categoria, descripcion, esCosecha, icono)
    VALUES
      ('tipo-cosecha', 'Cosecha', 'cosecha', 'Corte de mazorcas maduras, partido y desgranado', 1, 'Grape'),
      ('tipo-poda', 'Poda', 'mantenimiento', 'Poda fitosanitaria, aclareo y deschuponado', 0, 'Scissors'),
      ('tipo-limpieza', 'Limpieza', 'mantenimiento', 'Control de malezas y despeje de zanjas', 0, 'Sparkles'),
      ('tipo-deshierbe', 'Deshierbe', 'mantenimiento', 'Chapeo manual y mecánico en coronas', 0, 'Shovel'),
      ('tipo-fumigacion', 'Aplicación de productos', 'fitosanitario', 'Control preventivo de monilia y escoba de bruja', 0, 'SprayCan'),
      ('tipo-fertilizacion', 'Fertilización', 'agronomico', 'Aplicación edáfica de abono orgánico y NPK', 0, 'Layers'),
      ('tipo-mantenimiento', 'Mantenimiento General', 'mantenimiento', 'Cercas, caminos y marquesinas de secado', 0, 'Wrench');
  `);

  // Jornada Multi-Propiedad JORN-2026-001
  // Propiedades: Mayra (Cuadra 1 y 2), Carlos (Cuadra 3), Juan (Cuadra 5)
  // Trabajadores: Freddy (5h, $13 pago fijo), Pedro (8h, $24), María (6h, $0 familiar)
  // Cosecha: 1000 lb @ $0.80/lb = $800 ingreso, $100 gastos, $700 ganancia
  // Distribuida: Mayra 400 lb ($320 - $50 = $270), Carlos 350 lb ($280 - $35 = $245), Juan 250 lb ($200 - $15 = $185)
  await runQuery(`
    INSERT INTO jornadas (
      id, codigo, propietarioId, cuadraId, tipoTrabajoId, fecha, fechaFin, esAgrupada,
      totalHoras, totalHorasFamiliares, totalPago, observaciones,
      resultado_esCosecha, resultado_cantidad, resultado_unidad, resultado_precio,
      resultado_ingreso, resultado_gastos, resultado_ganancia, resultado_tipoGrano, resultado_observaciones
    ) VALUES (
      'jorn-1', 'JORN-2026-001', 'prop-1', 'cuadra-1', 'tipo-cosecha', '2026-09-08', '2026-09-08', 0,
      19.0, 6.0, 37.00, 'Jornada integral compartida entre Mayra, Carlos y Juan. Cosecha mixta y recolección.',
      1, 1000, 'libras', 0.80, 800.00, 100.00, 700.00, 'Cacao Nacional Fino de Aroma', 'Distribución equilibrada entre los 3 propietarios.'
    );
  `);

  // Propiedades vinculadas a la jornada JORN-2026-001
  await runQuery(`
    INSERT INTO jornada_propiedades (id, jornadaId, propietarioId, cuadraId, horasEstimadas, observaciones)
    VALUES
      ('jp-1', 'jorn-1', 'prop-1', 'cuadra-1', 7.0, 'Recolección en ladera norte'),
      ('jp-2', 'jorn-1', 'prop-1', 'cuadra-2', 4.0, 'Zafra rápida en CCN-51'),
      ('jp-3', 'jorn-1', 'prop-2', 'cuadra-3', 5.0, 'Corte en sector ribereño'),
      ('jp-4', 'jorn-1', 'prop-3', 'cuadra-5', 3.0, 'Apoyo y recolección final');
  `);

  // Trabajadores de la jornada JORN-2026-001
  await runQuery(`
    INSERT INTO jornada_trabajadores (
      id, jornadaId, trabajadorId, horaEntrada, horaSalida, almuerzoHoras, horasTrabajadas,
      tipoPago, tarifa, pagoTotal, estadoPago, fechaPago, metodoPago, comprobantePago, observaciones
    ) VALUES
      ('jt-1', 'jorn-1', 'trab-freddy', '07:00', '12:00', 0.0, 5.0, 'pago_fijo', 2.60, 13.00, 'pagado', '2026-09-08', 'Efectivo', 'PAG-001', 'Trabajo continuo en propiedades Mayra, Carlos y Juan'),
      ('jt-2', 'jorn-1', 'trab-1', '07:00', '16:00', 1.0, 8.0, 'pago_fijo', 3.00, 24.00, 'pagado', '2026-09-08', 'Efectivo', 'PAG-002', 'Partido de mazorcas y traslado al tendal'),
      ('jt-3', 'jorn-1', 'trab-3', '08:00', '15:00', 1.0, 6.0, 'sin_pago', 0.00, 0.00, 'pagado', '2026-09-08', 'Efectivo', 'FAM-001', 'Familiar: desgranado y pesaje de baba ($0)');
  `);

  // Cosechas distribuidas por propietario
  await runQuery(`
    INSERT INTO cosechas_propietario (
      id, jornadaId, propietarioId, cuadraIds, cantidad, unidad, precioUnitario,
      gastosRelacionados, ingresoGenerado, gananciaNeta, tipoGrano, observaciones
    ) VALUES
      ('cp-1', 'jorn-1', 'prop-1', '["cuadra-1","cuadra-2"]', 400.0, 'libras', 0.80, 50.00, 320.00, 270.00, 'Nacional Fino', '400 lb recolectadas en Cuadras 1 y 2'),
      ('cp-2', 'jorn-1', 'prop-2', '["cuadra-3"]', 350.0, 'libras', 0.80, 35.00, 280.00, 245.00, 'CCN-51', '350 lb recolectadas en Cuadra 3'),
      ('cp-3', 'jorn-1', 'prop-3', '["cuadra-5"]', 250.0, 'libras', 0.80, 15.00, 200.00, 185.00, 'Nacional Fino', '250 lb recolectadas en Cuadra 5');
  `);

  // Jornada Agrupada Ejemplo: Poda consecutiva en Cuadra 3 (Carlos - Tercero) durante 3 días
  await runQuery(`
    INSERT INTO jornadas (
      id, codigo, propietarioId, cuadraId, tipoTrabajoId, fecha, fechaFin, esAgrupada,
      totalHoras, totalHorasFamiliares, totalPago, observaciones,
      resultado_esCosecha, resultado_texto, resultado_problemas, resultado_observaciones
    ) VALUES (
      'jorn-2', 'JORN-2026-002', 'prop-2', 'cuadra-3', 'tipo-poda', '2026-09-10', '2026-09-12', 1,
      24.0, 0.0, 96.00, 'Poda fitosanitaria continua de 3 días consecutivos',
      0, 'Poda lateral y aclareo de copas completado al 100%', 'Se detectó inicio de brotes en esquina sur', 'Monitorear en 15 días'
    );
  `);

  await runQuery(`
    INSERT INTO jornada_propiedades (id, jornadaId, propietarioId, cuadraId, horasEstimadas, observaciones)
    VALUES
      ('jp-5', 'jorn-2', 'prop-2', 'cuadra-3', 24.0, 'Poda integral en Cuadra 3');
  `);

  await runQuery(`
    INSERT INTO jornada_trabajadores (
      id, jornadaId, trabajadorId, horaEntrada, horaSalida, almuerzoHoras, horasTrabajadas,
      tipoPago, tarifa, pagoTotal, estadoPago, observaciones
    ) VALUES
      ('jt-4', 'jorn-2', 'trab-2', '07:00', '16:00', 1.0, 24.0, 'por_hora', 4.00, 96.00, 'pendiente', 'Jornada agrupada de 3 días (8h por día)');
  `);

  await runQuery(`
    INSERT INTO materiales_utilizados (id, jornadaId, nombre, cantidad, unidad)
    VALUES
      ('mu-1', 'jorn-2', 'Pasta cicatrizante cúprica', 1.5, 'kg'),
      ('mu-2', 'jorn-2', 'Tijera podadora telescópica', 1.0, 'unidades');
  `);

  await runQuery(`
    INSERT INTO materiales_requeridos (id, jornadaId, nombre, cantidad, unidad, esPerecible, estado, observaciones)
    VALUES
      ('mr-1', 'jorn-2', 'Pasta cicatrizante cúprica', 3.0, 'kg', 0, 'urgente', 'Agotado para la siguiente cuadra'),
      ('mr-2', 'jorn-1', 'Gasolina común', 5.0, 'litros', 0, 'urgente', 'Se requiere para motoguadaña en Cuadra 4');
  `);

  console.log('✅ Base de datos inicializada con éxito con soporte multi-propiedad y cosechas.');
}

// Asegurar datos si ya existía la base de datos previa
async function ensureExtendedData() {
  try {
    // 1. Obtener propietarios existentes
    const allProps = await allQuery('SELECT id, nombreCompleto FROM propietarios');
    let mayra = allProps.find(p => p.nombreCompleto.toLowerCase().includes('mayra'));
    let carlos = allProps.find(p => p.nombreCompleto.toLowerCase().includes('carlos') || p.nombreCompleto.toLowerCase().includes('noe'));
    let juan = allProps.find(p => p.nombreCompleto.toLowerCase().includes('juan'));

    if (!mayra) {
      const mayraId = `prop-${Date.now()}-1`;
      await runQuery(`
        INSERT INTO propietarios (id, nombreCompleto, identificacion, telefono, direccion, observaciones, estado, fechaRegistro)
        VALUES ('${mayraId}', 'Mayra González', '0928374610', '0998877665', 'Recinto El Cacao, Sector Central', 'Propietaria principal', 'activo', '2026-01-10')
      `);
      mayra = { id: mayraId, nombreCompleto: 'Mayra González' };
    }

    if (!carlos) {
      const carlosId = `prop-${Date.now()}-2`;
      await runQuery(`
        INSERT INTO propietarios (id, nombreCompleto, identificacion, telefono, direccion, observaciones, estado, fechaRegistro)
        VALUES ('${carlosId}', 'Carlos Mendoza', '1209384756', '0987654321', 'Vía Principal Km 14', 'Propietario asociado', 'activo', '2026-01-20')
      `);
      carlos = { id: carlosId, nombreCompleto: 'Carlos Mendoza' };
    }

    if (!juan) {
      await runQuery(`
        INSERT INTO propietarios (id, nombreCompleto, identificacion, telefono, direccion, observaciones, estado, fechaRegistro)
        VALUES ('prop-3', 'Juan Morales', '0912345678', '0971122334', 'Vía al Río Km 8, Sector San Vicente', 'Propietario asociado', 'activo', '2026-02-01')
      `);
      juan = { id: 'prop-3', nombreCompleto: 'Juan Morales' };
    }

    // 2. Asegurar cuadras para cada propietario
    const existingCuadras = await allQuery('SELECT id, propietarioId, nombre FROM cuadras');
    let c1 = existingCuadras.find(c => c.propietarioId === mayra.id && c.nombre.includes('Cuadra 1'));
    if (!c1) {
      const c1Id = `cuadra-${Date.now()}-1`;
      await runQuery(`
        INSERT INTO cuadras (id, propietarioId, nombre, lugar, referencia, tamanoM2, tipoPropiedad, estado, observaciones, fechaCreacion)
        VALUES ('${c1Id}', '${mayra.id}', 'Cuadra 1 - El Mirador', 'Sector Alto', 'Junto al reservorio', 12500, 'propia', 'activa', 'Cacao Nacional', '2026-01-15')
      `);
      c1 = { id: c1Id };
    }

    let c2 = existingCuadras.find(c => c.propietarioId === mayra.id && c.nombre.includes('Cuadra 2'));
    if (!c2) {
      const c2Id = `cuadra-${Date.now()}-2`;
      await runQuery(`
        INSERT INTO cuadras (id, propietarioId, nombre, lugar, referencia, tamanoM2, tipoPropiedad, estado, observaciones, fechaCreacion)
        VALUES ('${c2Id}', '${mayra.id}', 'Cuadra 2 - Las Palmas', 'Sector Central', 'Camino carrozable', 18000, 'propia', 'activa', 'CCN-51', '2026-02-10')
      `);
      c2 = { id: c2Id };
    }

    let c3 = existingCuadras.find(c => c.propietarioId === carlos.id && c.nombre.includes('Cuadra 3'));
    if (!c3) {
      const c3Id = `cuadra-${Date.now()}-3`;
      await runQuery(`
        INSERT INTO cuadras (id, propietarioId, nombre, lugar, referencia, tamanoM2, tipoPropiedad, estado, observaciones, fechaCreacion)
        VALUES ('${c3Id}', '${carlos.id}', 'Cuadra 3 - El Río', 'Sector Ribera', 'Estero fluvial', 15200, 'tercero', 'activa', 'Suelo fértil', '2026-02-20')
      `);
      c3 = { id: c3Id };
    }

    let c5 = existingCuadras.find(c => c.propietarioId === juan.id);
    if (!c5) {
      const c5Id = `cuadra-${Date.now()}-5`;
      await runQuery(`
        INSERT INTO cuadras (id, propietarioId, nombre, lugar, referencia, tamanoM2, tipoPropiedad, estado, observaciones, fechaCreacion)
        VALUES ('${c5Id}', '${juan.id}', 'Cuadra 5 - La Providencia', 'Sector Oriental', 'Bodega central', 14000, 'tercero', 'activa', 'Plantación mixta', '2026-04-12')
      `);
      c5 = { id: c5Id };
    }

    // 3. Asegurar trabajadores
    let freddy = await getQuery("SELECT id FROM trabajadores WHERE id = 'trab-freddy' OR nombreCompleto LIKE '%fred%'");
    if (!freddy) {
      await runQuery(`
        INSERT INTO trabajadores (id, nombreCompleto, identificacion, telefono, tipo, tarifaHora, tarifaDia, estado, observaciones)
        VALUES ('trab-freddy', 'Freddy Zambrano', '0938271645', '0987123450', 'Contratado', 2.60, 20.80, 'activo', 'Trabajador multifunción de campo y recolección')
      `);
      freddy = { id: 'trab-freddy' };
    }

    let pedro = await getQuery("SELECT id FROM trabajadores WHERE nombreCompleto LIKE '%pedro%' OR nombreCompleto LIKE '%alberto%'");
    if (!pedro) {
      await runQuery(`
        INSERT INTO trabajadores (id, nombreCompleto, identificacion, telefono, tipo, tarifaHora, tarifaDia, estado, observaciones)
        VALUES ('trab-pedro', 'Pedro Zambrano', '1203948571', '0991234567', 'Contratado', 3.00, 24.00, 'activo', 'Experto en recolección, zafra y acarreo pesado')
      `);
      pedro = { id: 'trab-pedro' };
    }

    let maria = await getQuery("SELECT id FROM trabajadores WHERE tipo = 'Familiar' OR nombreCompleto LIKE '%mar%'");
    if (!maria) {
      await runQuery(`
        INSERT INTO trabajadores (id, nombreCompleto, identificacion, telefono, tipo, tarifaHora, tarifaDia, estado, observaciones)
        VALUES ('trab-maria', 'María González', '0948291038', '0998765432', 'Familiar', 0.00, 0.00, 'activo', 'Miembro familiar: fermentación y control de secado ($0)')
      `);
      maria = { id: 'trab-maria' };
    }

    // 4. Si no existen jornadas, sembrar la Jornada Ejemplo JORN-2026-001
    const jornadasCount = await getQuery('SELECT COUNT(*) as count FROM jornadas');
    if (jornadasCount && jornadasCount.count === 0) {
      await runQuery(`
        INSERT INTO jornadas (
          id, codigo, propietarioId, cuadraId, tipoTrabajoId, fecha, fechaFin, esAgrupada,
          totalHoras, totalHorasFamiliares, totalPago, observaciones,
          resultado_esCosecha, resultado_cantidad, resultado_unidad, resultado_precio,
          resultado_ingreso, resultado_gastos, resultado_ganancia, resultado_tipoGrano, resultado_observaciones
        ) VALUES (
          'jorn-1', 'JORN-2026-001', '${mayra.id}', '${c1.id}', 'tipo-cosecha', '2026-09-08', '2026-09-08', 0,
          19.0, 6.0, 37.00, 'Jornada integral compartida entre Mayra, ${carlos.nombreCompleto.split(' ')[0]} y Juan. Cosecha mixta y recolección.',
          1, 1000, 'libras', 0.80, 800.00, 100.00, 700.00, 'Cacao Nacional Fino de Aroma', 'Distribución equilibrada de cosecha entre los 3 propietarios.'
        );
      `);

      await runQuery(`
        INSERT INTO jornada_propiedades (id, jornadaId, propietarioId, cuadraId, horasEstimadas, observaciones)
        VALUES
          ('jp-1', 'jorn-1', '${mayra.id}', '${c1.id}', 7.0, 'Recolección en ladera norte'),
          ('jp-2', 'jorn-1', '${mayra.id}', '${c2.id}', 4.0, 'Zafra rápida en CCN-51'),
          ('jp-3', 'jorn-1', '${carlos.id}', '${c3.id}', 5.0, 'Corte en sector ribereño'),
          ('jp-4', 'jorn-1', '${juan.id}', '${c5.id}', 3.0, 'Apoyo y recolección final');
      `);

      await runQuery(`
        INSERT INTO jornada_trabajadores (
          id, jornadaId, trabajadorId, horaEntrada, horaSalida, almuerzoHoras, horasTrabajadas,
          tipoPago, tarifa, pagoTotal, estadoPago, fechaPago, metodoPago, comprobantePago, observaciones
        ) VALUES
          ('jt-1', 'jorn-1', '${freddy.id}', '07:00', '12:00', 0.0, 5.0, 'pago_fijo', 2.60, 13.00, 'pagado', '2026-09-08', 'Efectivo', 'PAG-001', 'Trabajo continuo en propiedades Mayra, Carlos y Juan'),
          ('jt-2', 'jorn-1', '${pedro.id}', '07:00', '16:00', 1.0, 8.0, 'pago_fijo', 3.00, 24.00, 'pagado', '2026-09-08', 'Efectivo', 'PAG-002', 'Partido de mazorcas y traslado al tendal'),
          ('jt-3', 'jorn-1', '${maria.id}', '08:00', '15:00', 1.0, 6.0, 'sin_pago', 0.00, 0.00, 'pagado', '2026-09-08', 'Efectivo', 'FAM-001', 'Familiar: desgranado y pesaje de baba ($0)');
      `);

      await runQuery(`
        INSERT INTO cosechas_propietario (
          id, jornadaId, propietarioId, cuadraIds, cantidad, unidad, precioUnitario,
          gastosRelacionados, ingresoGenerado, gananciaNeta, tipoGrano, observaciones
        ) VALUES
          ('cp-1', 'jorn-1', '${mayra.id}', '["${c1.id}","${c2.id}"]', 400.0, 'libras', 0.80, 50.00, 320.00, 270.00, 'Nacional Fino', '400 lb recolectadas en Cuadras 1 y 2'),
          ('cp-2', 'jorn-1', '${carlos.id}', '["${c3.id}"]', 350.0, 'libras', 0.80, 35.00, 280.00, 245.00, 'CCN-51', '350 lb recolectadas en Cuadra 3'),
          ('cp-3', 'jorn-1', '${juan.id}', '["${c5.id}"]', 250.0, 'libras', 0.80, 15.00, 200.00, 185.00, 'Nacional Fino', '250 lb recolectadas en Cuadra 5');
      `);
    }

    // 5. Catálogo Centralizado de Insumos
    const insumosCount = await getQuery('SELECT COUNT(*) as count FROM insumos');
    if (insumosCount && insumosCount.count === 0) {
      await runQuery(`
        INSERT INTO insumos (id, nombre, categoria, unidad, stockInicial, stockActual, costoUnitario, estado, observaciones)
        VALUES
          ('ins-1', 'Gasolina', 'Combustibles', 'litros', 20.0, 18.0, 2.50, 'activo', 'Gasolina regular para desmalezadoras y motoguadañas'),
          ('ins-2', 'Diésel', 'Combustibles', 'litros', 30.0, 30.0, 2.10, 'activo', 'Combustible para transporte y bomba de riego'),
          ('ins-3', 'Desmalezadora', 'Herramientas', 'unidad', 2.0, 2.0, 0.00, 'activo', 'Equipo motorizado para control de maleza'),
          ('ins-4', 'Guadaña', 'Herramientas', 'unidad', 2.0, 2.0, 0.00, 'activo', 'Herramienta manual de corte y chapiado'),
          ('ins-5', 'Machete', 'Herramientas', 'unidad', 6.0, 6.0, 0.00, 'activo', 'Machete rula para corte y deshierbe manual'),
          ('ins-6', 'Pala', 'Herramientas', 'unidad', 3.0, 3.0, 0.00, 'activo', 'Pala para drenajes y abonamiento'),
          ('ins-7', 'Tijera de podar', 'Herramientas', 'unidad', 4.0, 4.0, 0.00, 'activo', 'Tijera telescópica para poda de formación'),
          ('ins-8', 'Piola', 'Materiales', 'metros', 200.0, 185.0, 0.05, 'activo', 'Piola plástica para amarre de ramas y tutores'),
          ('ins-9', 'Sacos de yute', 'Materiales', 'sacos', 100.0, 92.0, 1.25, 'activo', 'Sacos para cosecha y transporte de cacao en baba y seco'),
          ('ins-10', 'Cuerda', 'Materiales', 'metros', 80.0, 80.0, 0.10, 'activo', 'Cuerda de polipropileno para amarres pesados'),
          ('ins-11', 'Alambre', 'Materiales', 'metros', 120.0, 120.0, 0.25, 'activo', 'Alambre galvanizado para cerramiento'),
          ('ins-12', 'Fertilizante 10-30-10', 'Productos agrícolas', 'kg', 100.0, 100.0, 1.80, 'activo', 'Abono granulado para corona de plantas'),
          ('ins-13', 'Herbicida', 'Productos agrícolas', 'litros', 15.0, 15.0, 6.50, 'activo', 'Control fitosanitario de malezas resistentes'),
          ('ins-14', 'Fungicida Cúprico', 'Productos agrícolas', 'kg', 25.0, 25.0, 4.50, 'activo', 'Pasta y aspersión para prevención de monilia');
      `);
    }

    // 6. Jornada Ejemplo de Deshierbe con Insumos (Requerimiento 10 y 11)
    const deshierbe = await getQuery("SELECT id FROM jornadas WHERE codigo = 'JORN-2026-002'");
    if (!deshierbe) {
      let tipoDeshierbe = await getQuery("SELECT id FROM tipos_trabajo WHERE nombre LIKE '%deshierb%' OR id = 'tipo-mantenimiento'");
      const tipoId = tipoDeshierbe ? tipoDeshierbe.id : 'tipo-mantenimiento';

      await runQuery(`
        INSERT INTO jornadas (
          id, codigo, propietarioId, cuadraId, tipoTrabajoId, fecha, fechaFin, esAgrupada,
          totalHoras, totalHorasFamiliares, totalPago, observaciones,
          resultado_esCosecha, resultado_texto, resultado_observaciones
        ) VALUES (
          'jorn-2', 'JORN-2026-002', '${mayra.id}', '${c2.id}', '${tipoId}', '2026-09-08', '2026-09-08', 0,
          5.0, 0.0, 13.00, 'Se realizó limpieza completa de la cuadra.',
          0, 'Se limpió completamente la Cuadra 2.', 'Control de malezas en corona y callejones.'
        );
      `);

      await runQuery(`
        INSERT INTO jornada_propiedades (id, jornadaId, propietarioId, cuadraId, horasEstimadas, observaciones)
        VALUES ('jp-jorn-2', 'jorn-2', '${mayra.id}', '${c2.id}', 5.0, 'Limpieza completa de Cuadra 2');
      `);

      await runQuery(`
        INSERT INTO jornada_trabajadores (
          id, jornadaId, trabajadorId, horaEntrada, horaSalida, almuerzoHoras, horasTrabajadas,
          tipoPago, tarifa, pagoTotal, estadoPago, fechaPago, metodoPago, comprobantePago, observaciones
        ) VALUES (
          'jt-jorn-2-1', 'jorn-2', '${freddy.id}', '07:00', '12:00', 0.0, 5.0, 'pago_fijo', 2.60, 13.00, 'pagado', '2026-09-08', 'Efectivo', 'PAG-003', 'Deshierbe integral de Cuadra 2'
        );
      `);

      await runQuery(`
        INSERT INTO jornada_insumos (id, jornadaId, insumoId, nombreInsumo, categoria, tipo, cantidad, unidad, costoUnitario, costoTotal, estado, observaciones)
        VALUES
          ('ji-1', 'jorn-2', 'ins-3', 'Desmalezadora', 'Herramientas', 'utilizado', 1.0, 'unidad', 0.00, 0.00, 'utilizado', 'Uso en lote completo'),
          ('ji-2', 'jorn-2', 'ins-1', 'Gasolina', 'Combustibles', 'utilizado', 2.0, 'litros', 2.50, 5.00, 'utilizado', '2 litros consumidos en 5 horas de trabajo'),
          ('ji-3', 'jorn-2', 'ins-1', 'Gasolina', 'Combustibles', 'requerido', 5.0, 'litros', 2.50, 12.50, 'urgente', 'Se requiere reposición de combustible para la siguiente semana');
      `);
    }

    // Insumos utilizados en jorn-1 (Cosecha)
    const jorn1Insumos = await getQuery("SELECT COUNT(*) as count FROM jornada_insumos WHERE jornadaId = 'jorn-1'");
    if (jorn1Insumos && jorn1Insumos.count === 0) {
      await runQuery(`
        INSERT INTO jornada_insumos (id, jornadaId, insumoId, nombreInsumo, categoria, tipo, cantidad, unidad, costoUnitario, costoTotal, estado, observaciones)
        VALUES
          ('ji-c1', 'jorn-1', 'ins-9', 'Sacos de yute', 'Materiales', 'utilizado', 8.0, 'sacos', 1.25, 10.00, 'utilizado', 'Sacos utilizados para ensacar cacao recolectado'),
          ('ji-c2', 'jorn-1', 'ins-8', 'Piola', 'Materiales', 'utilizado', 15.0, 'metros', 0.05, 0.75, 'utilizado', 'Costura y amarre de sacos');
      `);
    }

    // 7. Cuentas Iniciales de Usuarios (Mayra Administradora y Operador)
    const mayraUser = await getQuery("SELECT id FROM usuarios WHERE email = 'mayraveragiler@gmail.com'");
    if (!mayraUser) {
      // Contraseña segura de inicio definida por variable de entorno o clave segura inicial
      const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'MayraCacao2026!';
      const { salt, hash } = hashPassword(initialAdminPassword);

      await runQuery(
        `INSERT INTO usuarios (id, nombre, email, passwordHash, salt, rol, estado, ultimoAcceso, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'usr-admin-1',
          'Mayra Vera',
          'mayraveragiler@gmail.com',
          hash,
          salt,
          'Administrador',
          'activo',
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
      console.log('✔ Cuenta principal de Mayra inicializada con credenciales seguras (mayraveragiler@gmail.com)');
    }

    // Operador de campo secundario de ejemplo
    const operadorUser = await getQuery("SELECT id FROM usuarios WHERE email = 'operador@agrocacao.com'");
    if (!operadorUser) {
      const { salt: opSalt, hash: opHash } = hashPassword('Operador2026!');
      await runQuery(
        `INSERT INTO usuarios (id, nombre, email, passwordHash, salt, rol, estado, ultimoAcceso, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'usr-op-1',
          'Carlos Asistente',
          'operador@agrocacao.com',
          opHash,
          opSalt,
          'Operador',
          'activo',
          null,
          new Date().toISOString()
        ]
      );
    }
  } catch (e) {
    console.error('Error no crítico en ensureExtendedData:', e);
  }
}

export default db;
