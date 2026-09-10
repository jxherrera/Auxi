import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import {
  initDatabase,
  runQuery,
  getQuery,
  allQuery,
  hashPassword,
  verifyPassword,
} from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Token secret & helper
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'agrocacao-super-secret-token-key-2026';

function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    rol: user.rol,
    timestamp: Date.now(),
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

function verifyToken(tokenString) {
  if (!tokenString || typeof tokenString !== 'string') return null;
  const parts = tokenString.split('.');
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    // Validar antigüedad de token (7 días)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - payload.timestamp > sevenDaysMs) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// Middleware de Autenticación
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, mensaje: 'Debes iniciar sesión para realizar esta acción.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ ok: false, mensaje: 'Tu sesión ha caducado o el token es inválido. Por favor, inicia sesión nuevamente.' });
  }

  const user = await getQuery('SELECT id, nombre, email, rol, estado FROM usuarios WHERE id = ?', [payload.id]);
  if (!user || user.estado !== 'activo') {
    return res.status(401).json({ ok: false, mensaje: 'La cuenta no existe o ha sido desactivada.' });
  }

  req.user = user;
  next();
};

// Middleware para Rol Administrador
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.rol !== 'Administrador') {
    return res.status(403).json({ ok: false, mensaje: 'Acceso denegado: esta acción solo puede ser realizada por administradores.' });
  }
  next();
};

// Logger de solicitudes
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Middleware de manejo amigable de errores
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR API ${new Date().toISOString()}]`, err);
  res.status(500).json({
    ok: false,
    mensaje: 'Ocurrió un error inesperado al procesar la solicitud en el servidor.',
    errorTecnico: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

// ==========================================
// 0. AUTENTICACIÓN Y GESTIÓN DE USUARIOS (RBAC)
// ==========================================

// Login con email y contraseña
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Por favor, ingresa tu correo electrónico y tu contraseña.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await getQuery('SELECT * FROM usuarios WHERE LOWER(email) = ?', [cleanEmail]);

    if (!user) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas. Revisa tu correo y contraseña.' });
    }

    if (user.estado !== 'activo') {
      return res.status(403).json({ ok: false, mensaje: 'Esta cuenta ha sido desactivada. Comunícate con la administradora.' });
    }

    const isMatch = verifyPassword(password, user.salt, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas. Revisa tu correo y contraseña.' });
    }

    // Actualizar último acceso
    const now = new Date().toISOString();
    await runQuery('UPDATE usuarios SET ultimoAcceso = ? WHERE id = ?', [now, user.id]);

    const token = generateToken(user);
    const safeUser = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      estado: user.estado,
      ultimoAcceso: now,
      created_at: user.created_at,
    };

    res.json({
      ok: true,
      mensaje: `¡Bienvenida(o), ${user.nombre}!`,
      token,
      usuario: safeUser,
    });
  } catch (err) {
    next(err);
  }
});

// Obtener perfil actual verificado
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  res.json({ ok: true, data: req.user, usuario: req.user });
});

// Actualizar perfil propio (nombre y/o contraseña de Mayra)
app.put('/api/auth/perfil', authMiddleware, async (req, res, next) => {
  try {
    const { nombre, currentPassword, newPassword, passwordActual, passwordNuevo } = req.body;
    const curPass = passwordActual || currentPassword;
    const newPass = passwordNuevo || newPassword;

    const user = await getQuery('SELECT * FROM usuarios WHERE id = ?', [req.user.id]);

    if (!user) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }

    let updatedNombre = user.nombre;
    if (nombre && nombre.trim()) {
      updatedNombre = nombre.trim();
    }

    if (newPass) {
      if (!curPass) {
        return res.status(400).json({ ok: false, mensaje: 'Debes ingresar tu contraseña actual para cambiarla.' });
      }
      if (newPass.length < 6) {
        return res.status(400).json({ ok: false, mensaje: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      }
      const isMatch = verifyPassword(curPass, user.salt, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ ok: false, mensaje: 'La contraseña actual ingresada es incorrecta.' });
      }

      const { salt, hash } = hashPassword(newPass);
      await runQuery(
        'UPDATE usuarios SET nombre = ?, passwordHash = ?, salt = ? WHERE id = ?',
        [updatedNombre, hash, salt, user.id]
      );
    } else {
      await runQuery('UPDATE usuarios SET nombre = ? WHERE id = ?', [updatedNombre, user.id]);
    }

    const updatedUser = await getQuery('SELECT id, nombre, email, rol, estado, ultimoAcceso, created_at FROM usuarios WHERE id = ?', [user.id]);
    res.json({ ok: true, mensaje: 'Perfil actualizado correctamente.', data: updatedUser, usuario: updatedUser });
  } catch (err) {
    next(err);
  }
});

// Listar todos los usuarios (solo Administrador)
app.get('/api/usuarios', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const rows = await allQuery('SELECT id, nombre, email, rol, estado, ultimoAcceso, created_at FROM usuarios ORDER BY nombre ASC');
    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// Crear nuevo usuario (solo Administrador)
app.post('/api/usuarios', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { nombre, email, password, rol, estado } = req.body;
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ ok: false, mensaje: 'Nombre, correo electrónico, rol y contraseña inicial son obligatorios.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ ok: false, mensaje: 'La contraseña inicial debe tener al menos 6 caracteres.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await getQuery('SELECT id FROM usuarios WHERE LOWER(email) = ?', [cleanEmail]);
    if (existing) {
      return res.status(400).json({ ok: false, mensaje: 'Ya existe un usuario registrado con este correo electrónico.' });
    }

    const id = `usr-${Date.now()}`;
    const { salt, hash } = hashPassword(password);
    const userRol = rol === 'Administrador' ? 'Administrador' : 'Operador';
    const userEstado = estado === 'inactivo' ? 'inactivo' : 'activo';

    await runQuery(
      `INSERT INTO usuarios (id, nombre, email, passwordHash, salt, rol, estado, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, nombre.trim(), cleanEmail, hash, salt, userRol, userEstado, new Date().toISOString()]
    );

    const created = await getQuery('SELECT id, nombre, email, rol, estado, ultimoAcceso, created_at FROM usuarios WHERE id = ?', [id]);
    res.status(201).json({ ok: true, data: created, mensaje: `Usuario "${created.nombre}" creado exitosamente.` });
  } catch (err) {
    next(err);
  }
});

// Actualizar usuario (nombre, rol, estado) (solo Administrador)
app.put('/api/usuarios/:id', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, rol, estado } = req.body;

    const target = await getQuery('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (!target) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }

    // Regla crítica: No permitir desactivar ni degradar al administrador principal Mayra
    if (target.email.toLowerCase() === 'mayraveragiler@gmail.com') {
      if (estado === 'inactivo') {
        return res.status(400).json({ ok: false, mensaje: 'No es posible desactivar la cuenta administradora principal.' });
      }
      if (rol && rol !== 'Administrador') {
        return res.status(400).json({ ok: false, mensaje: 'La cuenta administradora principal debe conservar siempre el rol de Administrador.' });
      }
    }

    const newNombre = nombre ? nombre.trim() : target.nombre;
    const newRol = rol ? (rol === 'Administrador' ? 'Administrador' : 'Operador') : target.rol;
    const newEstado = estado ? (estado === 'inactivo' ? 'inactivo' : 'activo') : target.estado;

    await runQuery(
      'UPDATE usuarios SET nombre = ?, rol = ?, estado = ? WHERE id = ?',
      [newNombre, newRol, newEstado, id]
    );

    const updated = await getQuery('SELECT id, nombre, email, rol, estado, ultimoAcceso, created_at FROM usuarios WHERE id = ?', [id]);
    res.json({ ok: true, data: updated, mensaje: 'Usuario actualizado exitosamente.' });
  } catch (err) {
    next(err);
  }
});

// Restablecer contraseña de un usuario (solo Administrador)
app.put('/api/usuarios/:id/password', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ ok: false, mensaje: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    const target = await getQuery('SELECT id, nombre FROM usuarios WHERE id = ?', [id]);
    if (!target) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }

    const { salt, hash } = hashPassword(newPassword);
    await runQuery('UPDATE usuarios SET passwordHash = ?, salt = ? WHERE id = ?', [hash, salt, id]);

    res.json({ ok: true, mensaje: `Contraseña restablecida exitosamente para ${target.nombre}.` });
  } catch (err) {
    next(err);
  }
});

// Eliminar usuario con protección estricta (solo Administrador)
app.delete('/api/usuarios/:id', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const target = await getQuery('SELECT * FROM usuarios WHERE id = ?', [id]);

    if (!target) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }

    if (target.email.toLowerCase() === 'mayraveragiler@gmail.com') {
      return res.status(400).json({ ok: false, mensaje: 'La cuenta administradora principal no puede ser eliminada bajo ninguna circunstancia.' });
    }

    if (req.user.id === id) {
      return res.status(400).json({ ok: false, mensaje: 'No puedes eliminar tu propia sesión activa.' });
    }

    await runQuery('DELETE FROM usuarios WHERE id = ?', [id]);
    res.json({ ok: true, mensaje: `Usuario "${target.nombre}" eliminado correctamente.` });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 1. PROPIETARIOS
// ==========================================
app.get('/api/propietarios', async (req, res, next) => {
  try {
    const rows = await allQuery('SELECT * FROM propietarios ORDER BY nombreCompleto ASC');
    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
});

app.post('/api/propietarios', async (req, res, next) => {
  try {
    const { nombreCompleto, identificacion, telefono, direccion, observaciones, estado } = req.body;
    if (!nombreCompleto || !identificacion) {
      return res.status(400).json({ ok: false, mensaje: 'El nombre completo y la identificación son obligatorios.' });
    }

    const id = `prop-${Date.now()}`;
    const fechaRegistro = new Date().toISOString().split('T')[0];

    await runQuery(
      `INSERT INTO propietarios (id, nombreCompleto, identificacion, telefono, direccion, observaciones, estado, fechaRegistro)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, nombreCompleto.trim(), identificacion.trim(), telefono || '', direccion || '', observaciones || '', estado || 'activo', fechaRegistro]
    );

    const created = await getQuery('SELECT * FROM propietarios WHERE id = ?', [id]);
    res.status(201).json({ ok: true, data: created, mensaje: 'Propietario registrado exitosamente.' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ ok: false, mensaje: 'Ya existe un propietario con esta identificación.' });
    }
    next(err);
  }
});

app.put('/api/propietarios/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombreCompleto, identificacion, telefono, direccion, observaciones, estado } = req.body;

    await runQuery(
      `UPDATE propietarios
       SET nombreCompleto = COALESCE(?, nombreCompleto),
           identificacion = COALESCE(?, identificacion),
           telefono = COALESCE(?, telefono),
           direccion = COALESCE(?, direccion),
           observaciones = COALESCE(?, observaciones),
           estado = COALESCE(?, estado)
       WHERE id = ?`,
      [nombreCompleto?.trim(), identificacion?.trim(), telefono, direccion, observaciones, estado, id]
    );

    const updated = await getQuery('SELECT * FROM propietarios WHERE id = ?', [id]);
    res.json({ ok: true, data: updated, mensaje: 'Propietario actualizado correctamente.' });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/propietarios/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const cuadrasCount = await getQuery('SELECT COUNT(*) as count FROM cuadras WHERE propietarioId = ?', [id]);
    if (cuadrasCount && cuadrasCount.count > 0) {
      return res.status(400).json({
        ok: false,
        mensaje: `No se puede eliminar el propietario porque tiene ${cuadrasCount.count} cuadras asignadas. Reasigna o elimina sus cuadras primero.`
      });
    }

    await runQuery('DELETE FROM propietarios WHERE id = ?', [id]);
    res.json({ ok: true, mensaje: 'Propietario eliminado correctamente.' });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2. CUADRAS
// ==========================================
app.get('/api/cuadras', async (req, res, next) => {
  try {
    const { propietarioId, tipoPropiedad } = req.query;
    let sql = 'SELECT * FROM cuadras WHERE 1=1';
    const params = [];

    if (propietarioId && propietarioId !== 'todos') {
      sql += ' AND propietarioId = ?';
      params.push(propietarioId);
    }
    if (tipoPropiedad && tipoPropiedad !== 'todos') {
      sql += ' AND tipoPropiedad = ?';
      params.push(tipoPropiedad);
    }

    sql += ' ORDER BY nombre ASC';
    const rows = await allQuery(sql, params);
    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
});

app.post('/api/cuadras', async (req, res, next) => {
  try {
    const { propietarioId, nombre, lugar, referencia, tamanoM2, tipoPropiedad, estado, observaciones } = req.body;
    if (!propietarioId || !nombre || !lugar || !tamanoM2) {
      return res.status(400).json({ ok: false, mensaje: 'El propietario, nombre, lugar y tamaño son obligatorios.' });
    }

    const id = `cuadra-${Date.now()}`;
    const fechaCreacion = new Date().toISOString().split('T')[0];

    await runQuery(
      `INSERT INTO cuadras (id, propietarioId, nombre, lugar, referencia, tamanoM2, tipoPropiedad, estado, observaciones, fechaCreacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        propietarioId,
        nombre.trim(),
        lugar.trim(),
        referencia?.trim() || '',
        Number(tamanoM2),
        tipoPropiedad || 'propia',
        estado || 'activa',
        observaciones?.trim() || '',
        fechaCreacion,
      ]
    );

    const created = await getQuery('SELECT * FROM cuadras WHERE id = ?', [id]);
    res.status(201).json({ ok: true, data: created, mensaje: 'Cuadra registrada exitosamente.' });
  } catch (err) {
    next(err);
  }
});

app.put('/api/cuadras/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { propietarioId, nombre, lugar, referencia, tamanoM2, tipoPropiedad, estado, observaciones } = req.body;

    await runQuery(
      `UPDATE cuadras
       SET propietarioId = COALESCE(?, propietarioId),
           nombre = COALESCE(?, nombre),
           lugar = COALESCE(?, lugar),
           referencia = COALESCE(?, referencia),
           tamanoM2 = COALESCE(?, tamanoM2),
           tipoPropiedad = COALESCE(?, tipoPropiedad),
           estado = COALESCE(?, estado),
           observaciones = COALESCE(?, observaciones)
       WHERE id = ?`,
      [propietarioId, nombre?.trim(), lugar?.trim(), referencia, tamanoM2 ? Number(tamanoM2) : null, tipoPropiedad, estado, observaciones, id]
    );

    const updated = await getQuery('SELECT * FROM cuadras WHERE id = ?', [id]);
    res.json({ ok: true, data: updated, mensaje: 'Cuadra actualizada correctamente.' });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/cuadras/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await runQuery('DELETE FROM cuadras WHERE id = ?', [id]);
    res.json({ ok: true, mensaje: 'Cuadra eliminada correctamente.' });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 3. TRABAJADORES
// ==========================================
app.get('/api/trabajadores', async (req, res, next) => {
  try {
    const rows = await allQuery('SELECT * FROM trabajadores ORDER BY nombreCompleto ASC');
    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
});

app.post('/api/trabajadores', async (req, res, next) => {
  try {
    const { nombreCompleto, identificacion, telefono, tipo, tarifaHora, tarifaDia, estado, observaciones } = req.body;
    if (!nombreCompleto || !identificacion || !tipo) {
      return res.status(400).json({ ok: false, mensaje: 'Nombre, identificación y tipo de trabajador son obligatorios.' });
    }

    const id = `trab-${Date.now()}`;
    await runQuery(
      `INSERT INTO trabajadores (id, nombreCompleto, identificacion, telefono, tipo, tarifaHora, tarifaDia, estado, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        nombreCompleto.trim(),
        identificacion.trim(),
        telefono || '',
        tipo,
        Number(tarifaHora) || 0,
        Number(tarifaDia) || 0,
        estado || 'activo',
        observaciones || '',
      ]
    );

    const created = await getQuery('SELECT * FROM trabajadores WHERE id = ?', [id]);
    res.status(201).json({ ok: true, data: created, mensaje: 'Trabajador registrado exitosamente.' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ ok: false, mensaje: 'Ya existe un trabajador con esa identificación.' });
    }
    next(err);
  }
});

app.put('/api/trabajadores/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombreCompleto, identificacion, telefono, tipo, tarifaHora, tarifaDia, estado, observaciones } = req.body;

    await runQuery(
      `UPDATE trabajadores
       SET nombreCompleto = COALESCE(?, nombreCompleto),
           identificacion = COALESCE(?, identificacion),
           telefono = COALESCE(?, telefono),
           tipo = COALESCE(?, tipo),
           tarifaHora = COALESCE(?, tarifaHora),
           tarifaDia = COALESCE(?, tarifaDia),
           estado = COALESCE(?, estado),
           observaciones = COALESCE(?, observaciones)
       WHERE id = ?`,
      [
        nombreCompleto?.trim(),
        identificacion?.trim(),
        telefono,
        tipo,
        tarifaHora !== undefined ? Number(tarifaHora) : null,
        tarifaDia !== undefined ? Number(tarifaDia) : null,
        estado,
        observaciones,
        id,
      ]
    );

    const updated = await getQuery('SELECT * FROM trabajadores WHERE id = ?', [id]);
    res.json({ ok: true, data: updated, mensaje: 'Trabajador actualizado correctamente.' });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/trabajadores/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await runQuery('DELETE FROM trabajadores WHERE id = ?', [id]);
    res.json({ ok: true, mensaje: 'Trabajador eliminado correctamente.' });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 4. TIPOS DE TRABAJO
// ==========================================
app.get('/api/tipos-trabajo', async (req, res, next) => {
  try {
    const rows = await allQuery('SELECT * FROM tipos_trabajo ORDER BY nombre ASC');
    res.json({
      ok: true,
      data: rows.map(r => ({ ...r, esCosecha: Boolean(r.esCosecha) }))
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 5. JORNADAS (MULTI-PROPIEDAD Y MULTI-TRABAJADOR)
// ==========================================
app.get('/api/jornadas', async (req, res, next) => {
  try {
    const jornadasRows = await allQuery('SELECT * FROM jornadas ORDER BY fecha DESC, created_at DESC');

    const result = await Promise.all(
      jornadasRows.map(async (j) => {
        const propiedadesRows = await allQuery(
          'SELECT * FROM jornada_propiedades WHERE jornadaId = ?',
          [j.id]
        );
        const trabajadoresRows = await allQuery(
          'SELECT * FROM jornada_trabajadores WHERE jornadaId = ?',
          [j.id]
        );
        const matUtilizados = await allQuery(
          'SELECT * FROM materiales_utilizados WHERE jornadaId = ?',
          [j.id]
        );
        const matRequeridos = await allQuery(
          'SELECT * FROM materiales_requeridos WHERE jornadaId = ?',
          [j.id]
        );
        const cosechasRows = await allQuery(
          'SELECT * FROM cosechas_propietario WHERE jornadaId = ?',
          [j.id]
        );
        const insumosRows = await allQuery(
          'SELECT * FROM jornada_insumos WHERE jornadaId = ?',
          [j.id]
        );

        const insumosUtilizados = insumosRows.filter(i => i.tipo === 'utilizado');
        const insumosRequeridos = insumosRows.filter(i => i.tipo === 'requerido');
        const costoInsumos = insumosUtilizados.reduce((acc, i) => acc + (Number(i.costoTotal) || 0), 0);
        const costoTotal = Number(j.totalPago || 0) + costoInsumos;

        const parsedCosechas = cosechasRows.map(c => {
          let cuadras = [];
          try {
            cuadras = JSON.parse(c.cuadraIds);
            if (!Array.isArray(cuadras)) cuadras = [c.cuadraIds];
          } catch {
            cuadras = c.cuadraIds ? [c.cuadraIds] : [];
          }
          return {
            id: c.id,
            propietarioId: c.propietarioId,
            cuadraIds: cuadras,
            cantidad: Number(c.cantidad),
            unidad: c.unidad,
            precioUnitario: Number(c.precioUnitario),
            gastosRelacionados: Number(c.gastosRelacionados || 0),
            ingresoGenerado: Number(c.ingresoGenerado),
            gananciaNeta: Number(c.gananciaNeta),
            tipoGrano: c.tipoGrano || '',
            observaciones: c.observaciones || '',
          };
        });

        // Asegurar que existan propiedades para compatibilidad previa
        let propiedades = propiedadesRows;
        if (propiedades.length === 0 && j.cuadraId) {
          propiedades = [
            {
              id: `jp-${j.id}-default`,
              propietarioId: j.propietarioId,
              cuadraId: j.cuadraId,
              horasEstimadas: j.totalHoras,
              observaciones: ''
            }
          ];
        }

        let resultado = undefined;
        if (j.resultado_esCosecha !== null) {
          if (j.resultado_esCosecha === 1) {
            resultado = {
              esCosecha: true,
              cantidadCosechada: j.resultado_cantidad,
              unidadMedida: j.resultado_unidad,
              precioVentaUnitario: j.resultado_precio,
              ingresoGenerado: j.resultado_ingreso,
              gastosRelacionados: j.resultado_gastos,
              costoInsumos,
              gananciaNeta: j.resultado_ganancia,
              tipoGrano: j.resultado_tipoGrano,
              observaciones: j.resultado_observaciones,
              cosechasPorPropietario: parsedCosechas,
              insumosUtilizados,
              insumosRequeridos,
            };
          } else {
            resultado = {
              esCosecha: false,
              resultadoTexto: j.resultado_texto,
              problemasEncontrados: j.resultado_problemas,
              observaciones: j.resultado_observaciones,
              costoInsumos,
              materialesUtilizados: matUtilizados,
              materialesRequeridos: matRequeridos.map(m => ({ ...m, esPerecible: Boolean(m.esPerecible) })),
              insumosUtilizados,
              insumosRequeridos,
            };
          }
        }

        return {
          id: j.id,
          codigo: j.codigo,
          propietarioId: j.propietarioId || propiedades[0]?.propietarioId || '',
          cuadraId: j.cuadraId || propiedades[0]?.cuadraId || '',
          propiedades,
          tipoTrabajoId: j.tipoTrabajoId,
          fecha: j.fecha,
          fechaFin: j.fechaFin,
          esAgrupada: Boolean(j.esAgrupada),
          totalHoras: j.totalHoras,
          totalHorasFamiliares: j.totalHorasFamiliares || 0,
          totalPago: j.totalPago,
          pagoTotal: j.totalPago,
          insumosUtilizados,
          insumosRequeridos,
          costoInsumos,
          costoTotal,
          observaciones: j.observaciones,
          trabajadores: trabajadoresRows,
          resultado,
          created_at: j.created_at,
        };
      })
    );

    res.json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
});

app.post('/api/jornadas', async (req, res, next) => {
  try {
    const {
      propietarioId,
      cuadraId,
      propiedades = [],
      tipoTrabajoId,
      fecha,
      fechaFin,
      esAgrupada,
      observaciones,
      trabajadores = [],
    } = req.body;

    // Construir lista de propiedades trabajadas
    let listaPropiedades = [...propiedades];
    if (listaPropiedades.length === 0 && cuadraId) {
      let propId = propietarioId;
      if (!propId) {
        const c = await getQuery('SELECT propietarioId FROM cuadras WHERE id = ?', [cuadraId]);
        propId = c?.propietarioId;
      }
      listaPropiedades.push({
        id: `jp-${Date.now()}-0`,
        propietarioId: propId,
        cuadraId: cuadraId,
        horasEstimadas: 0,
        observaciones: ''
      });
    }

    if (listaPropiedades.length === 0 || !tipoTrabajoId || !fecha || trabajadores.length === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Debe seleccionar al menos una propiedad/cuadra, la labor, la fecha y al menos un trabajador.',
      });
    }

    const primaryProp = listaPropiedades[0];
    const primaryPropId = primaryProp.propietarioId || propietarioId;
    const primaryCuadraId = primaryProp.cuadraId || cuadraId;

    const jornadaCount = await getQuery('SELECT COUNT(*) as count FROM jornadas');
    const codigo = `JORN-2026-${String((jornadaCount?.count || 0) + 1).padStart(3, '0')}`;
    const id = `jorn-${Date.now()}`;

    // Calcular totales de la jornada
    let totalHoras = 0;
    let totalHorasFamiliares = 0;
    let totalPago = 0;

    trabajadores.forEach((t) => {
      const h = Number(t.horasTrabajadas) || 0;
      totalHoras += h;
      if (t.tipoPago === 'sin_pago' || Number(t.pagoTotal) === 0) {
        totalHorasFamiliares += h;
      } else {
        totalPago += Number(t.pagoTotal) || 0;
      }
    });

    await runQuery(
      `INSERT INTO jornadas (id, codigo, propietarioId, cuadraId, tipoTrabajoId, fecha, fechaFin, esAgrupada, totalHoras, totalHorasFamiliares, totalPago, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        codigo,
        primaryPropId,
        primaryCuadraId,
        tipoTrabajoId,
        fecha,
        fechaFin || fecha,
        esAgrupada ? 1 : 0,
        totalHoras,
        totalHorasFamiliares,
        totalPago,
        observaciones || '',
      ]
    );

    // Guardar propiedades trabajadas en jornada_propiedades
    for (const p of listaPropiedades) {
      const jpId = p.id && !p.id.startsWith('jp-auto') ? p.id : `jp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      await runQuery(
        `INSERT INTO jornada_propiedades (id, jornadaId, propietarioId, cuadraId, horasEstimadas, observaciones)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          jpId,
          id,
          p.propietarioId,
          p.cuadraId,
          Number(p.horasEstimadas) || 0,
          p.observaciones || '',
        ]
      );
    }

    // Insertar cada trabajador de la jornada
    for (const t of trabajadores) {
      const jtId = `jt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      await runQuery(
        `INSERT INTO jornada_trabajadores (
          id, jornadaId, trabajadorId, horaEntrada, horaSalida, almuerzoHoras,
          horasTrabajadas, tipoPago, tarifa, pagoTotal, estadoPago, observaciones
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          jtId,
          id,
          t.trabajadorId,
          t.horaEntrada || '07:00',
          t.horaSalida || '16:00',
          Number(t.almuerzoHoras) || 0,
          Number(t.horasTrabajadas) || 0,
          t.tipoPago || 'por_hora',
          Number(t.tarifa) || 0,
          Number(t.pagoTotal) || 0,
          t.estadoPago || 'pendiente',
          t.observaciones || '',
        ]
      );
    }

    // Insertar insumos utilizados y requeridos si se proporcionaron
    const { insumosUtilizados = [], insumosRequeridos = [] } = req.body;
    for (const iu of insumosUtilizados) {
      const jiId = `ji-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const cant = Number(iu.cantidad) || 0;
      const cu = Number(iu.costoUnitario) || 0;
      await runQuery(
        `INSERT INTO jornada_insumos (id, jornadaId, insumoId, nombreInsumo, categoria, tipo, cantidad, unidad, costoUnitario, costoTotal, estado, observaciones)
         VALUES (?, ?, ?, ?, ?, 'utilizado', ?, ?, ?, ?, 'utilizado', ?)`,
        [jiId, id, iu.insumoId || null, iu.nombreInsumo || iu.nombre || 'Insumo', iu.categoria || '', cant, iu.unidad || 'unidad', cu, Number(iu.costoTotal) || (cant * cu), iu.observaciones || '']
      );
    }

    for (const ir of insumosRequeridos) {
      const jiId = `ji-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const cant = Number(ir.cantidad) || 0;
      const cu = Number(ir.costoUnitario) || 0;
      await runQuery(
        `INSERT INTO jornada_insumos (id, jornadaId, insumoId, nombreInsumo, categoria, tipo, cantidad, unidad, costoUnitario, costoTotal, estado, observaciones)
         VALUES (?, ?, ?, ?, ?, 'requerido', ?, ?, ?, ?, ?, ?)`,
        [jiId, id, ir.insumoId || null, ir.nombreInsumo || ir.nombre || 'Insumo', ir.categoria || '', cant, ir.unidad || 'unidad', cu, Number(ir.costoTotal) || (cant * cu), ir.estado || 'pendiente', ir.observaciones || '']
      );
    }

    res.status(201).json({ ok: true, mensaje: 'Jornada registrada exitosamente.', id, codigo });
  } catch (err) {
    next(err);
  }
});

app.put('/api/jornadas/:id/resultado', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      esCosecha,
      cantidadCosechada,
      unidadMedida,
      precioVentaUnitario,
      ingresoGenerado,
      gastosRelacionados,
      gananciaNeta,
      tipoGrano,
      resultadoTexto,
      problemasEncontrados,
      observaciones,
      materialesUtilizados = [],
      materialesRequeridos = [],
      cosechasPorPropietario = [],
    } = req.body;

    if (esCosecha) {
      await runQuery(
        `UPDATE jornadas
         SET resultado_esCosecha = 1,
             resultado_cantidad = ?,
             resultado_unidad = ?,
             resultado_precio = ?,
             resultado_ingreso = ?,
             resultado_gastos = ?,
             resultado_ganancia = ?,
             resultado_tipoGrano = ?,
             resultado_observaciones = ?
         WHERE id = ?`,
        [
          Number(cantidadCosechada) || 0,
          unidadMedida || 'libras',
          Number(precioVentaUnitario) || 0,
          Number(ingresoGenerado) || 0,
          Number(gastosRelacionados) || 0,
          Number(gananciaNeta) || 0,
          tipoGrano || 'Cacao Nacional Fino de Aroma',
          observaciones || '',
          id,
        ]
      );

      // Guardar distribución por propietario en cosechas_propietario
      await runQuery('DELETE FROM cosechas_propietario WHERE jornadaId = ?', [id]);
      for (const cp of cosechasPorPropietario) {
        const cpId = cp.id && !cp.id.startsWith('temp-') ? cp.id : `cp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const cuadraIdsJson = JSON.stringify(Array.isArray(cp.cuadraIds) ? cp.cuadraIds : [cp.cuadraIds]);
        await runQuery(
          `INSERT INTO cosechas_propietario (
            id, jornadaId, propietarioId, cuadraIds, cantidad, unidad, precioUnitario,
            gastosRelacionados, ingresoGenerado, gananciaNeta, tipoGrano, observaciones
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            cpId,
            id,
            cp.propietarioId,
            cuadraIdsJson,
            Number(cp.cantidad) || 0,
            cp.unidad || unidadMedida || 'libras',
            Number(cp.precioUnitario) || 0,
            Number(cp.gastosRelacionados) || 0,
            Number(cp.ingresoGenerado) || 0,
            Number(cp.gananciaNeta) || 0,
            cp.tipoGrano || tipoGrano || '',
            cp.observaciones || '',
          ]
        );
      }
    } else {
      await runQuery(
        `UPDATE jornadas
         SET resultado_esCosecha = 0,
             resultado_texto = ?,
             resultado_problemas = ?,
             resultado_observaciones = ?
         WHERE id = ?`,
        [resultadoTexto || '', problemasEncontrados || '', observaciones || '', id]
      );

      // Limpiar y reinsertar materiales
      await runQuery('DELETE FROM materiales_utilizados WHERE jornadaId = ?', [id]);
      for (const m of materialesUtilizados) {
        await runQuery(
          'INSERT INTO materiales_utilizados (id, jornadaId, nombre, cantidad, unidad) VALUES (?, ?, ?, ?, ?)',
          [`mu-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, id, m.nombre, Number(m.cantidad), m.unidad]
        );
      }

      await runQuery('DELETE FROM materiales_requeridos WHERE jornadaId = ?', [id]);
      for (const r of materialesRequeridos) {
        await runQuery(
          'INSERT INTO materiales_requeridos (id, jornadaId, nombre, cantidad, unidad, esPerecible, estado, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            `mr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            id,
            r.nombre,
            Number(r.cantidad),
            r.unidad,
            r.esPerecible ? 1 : 0,
            r.estado || 'pendiente',
            r.observaciones || '',
          ]
        );
      }
    }

    // Guardar insumos utilizados y requeridos si vienen en el payload
    const { insumosUtilizados = [], insumosRequeridos = [] } = req.body;
    if (insumosUtilizados.length > 0 || insumosRequeridos.length > 0) {
      await runQuery('DELETE FROM jornada_insumos WHERE jornadaId = ?', [id]);
      for (const iu of insumosUtilizados) {
        const jiId = `ji-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const cant = Number(iu.cantidad) || 0;
        const cu = Number(iu.costoUnitario) || 0;
        await runQuery(
          `INSERT INTO jornada_insumos (id, jornadaId, insumoId, nombreInsumo, categoria, tipo, cantidad, unidad, costoUnitario, costoTotal, estado, observaciones)
           VALUES (?, ?, ?, ?, ?, 'utilizado', ?, ?, ?, ?, 'utilizado', ?)`,
          [jiId, id, iu.insumoId || null, iu.nombreInsumo || iu.nombre || 'Insumo', iu.categoria || '', cant, iu.unidad || 'unidad', cu, Number(iu.costoTotal) || (cant * cu), iu.observaciones || '']
        );
      }
      for (const ir of insumosRequeridos) {
        const jiId = `ji-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const cant = Number(ir.cantidad) || 0;
        const cu = Number(ir.costoUnitario) || 0;
        await runQuery(
          `INSERT INTO jornada_insumos (id, jornadaId, insumoId, nombreInsumo, categoria, tipo, cantidad, unidad, costoUnitario, costoTotal, estado, observaciones)
           VALUES (?, ?, ?, ?, ?, 'requerido', ?, ?, ?, ?, ?, ?)`,
          [jiId, id, ir.insumoId || null, ir.nombreInsumo || ir.nombre || 'Insumo', ir.categoria || '', cant, ir.unidad || 'unidad', cu, Number(ir.costoTotal) || (cant * cu), ir.estado || 'pendiente', ir.observaciones || '']
        );
      }
    }

    res.json({ ok: true, mensaje: 'Resultados de la jornada guardados exitosamente.' });
  } catch (err) {
    next(err);
  }
});

// Modificar datos generales de una jornada (propiedades, trabajadores, insumos)
app.put('/api/jornadas/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      propiedades = [],
      tipoTrabajoId,
      fecha,
      fechaFin,
      esAgrupada,
      observaciones,
      trabajadores = [],
      insumosUtilizados = [],
      insumosRequeridos = [],
    } = req.body;

    // Calcular totales
    let totalHoras = 0;
    let totalHorasFamiliares = 0;
    let totalPago = 0;

    trabajadores.forEach((t) => {
      const h = Number(t.horasTrabajadas) || 0;
      totalHoras += h;
      if (t.tipoPago === 'sin_pago' || Number(t.pagoTotal) === 0) {
        totalHorasFamiliares += h;
      } else {
        totalPago += Number(t.pagoTotal) || 0;
      }
    });

    const primaryPropId = propiedades[0]?.propietarioId;
    const primaryCuadraId = propiedades[0]?.cuadraId;

    await runQuery(
      `UPDATE jornadas
       SET tipoTrabajoId = COALESCE(?, tipoTrabajoId),
           fecha = COALESCE(?, fecha),
           fechaFin = COALESCE(?, fechaFin),
           esAgrupada = COALESCE(?, esAgrupada),
           totalHoras = ?,
           totalHorasFamiliares = ?,
           totalPago = ?,
           propietarioId = COALESCE(?, propietarioId),
           cuadraId = COALESCE(?, cuadraId),
           observaciones = COALESCE(?, observaciones)
       WHERE id = ?`,
      [tipoTrabajoId, fecha, fechaFin || fecha, esAgrupada ? 1 : 0, totalHoras, totalHorasFamiliares, totalPago, primaryPropId, primaryCuadraId, observaciones, id]
    );

    // Actualizar propiedades
    if (propiedades.length > 0) {
      await runQuery('DELETE FROM jornada_propiedades WHERE jornadaId = ?', [id]);
      for (const p of propiedades) {
        const jpId = p.id && !p.id.startsWith('jp-auto') ? p.id : `jp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        await runQuery(
          `INSERT INTO jornada_propiedades (id, jornadaId, propietarioId, cuadraId, horasEstimadas, observaciones)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [jpId, id, p.propietarioId, p.cuadraId, Number(p.horasEstimadas) || 0, p.observaciones || '']
        );
      }
    }

    // Actualizar trabajadores
    if (trabajadores.length > 0) {
      await runQuery('DELETE FROM jornada_trabajadores WHERE jornadaId = ?', [id]);
      for (const t of trabajadores) {
        const jtId = `jt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        await runQuery(
          `INSERT INTO jornada_trabajadores (
            id, jornadaId, trabajadorId, horaEntrada, horaSalida, almuerzoHoras,
            horasTrabajadas, tipoPago, tarifa, pagoTotal, estadoPago, observaciones
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            jtId,
            id,
            t.trabajadorId,
            t.horaEntrada || '07:00',
            t.horaSalida || '16:00',
            Number(t.almuerzoHoras) || 0,
            Number(t.horasTrabajadas) || 0,
            t.tipoPago || 'por_hora',
            Number(t.tarifa) || 0,
            Number(t.pagoTotal) || 0,
            t.estadoPago || 'pendiente',
            t.observaciones || '',
          ]
        );
      }
    }

    // Actualizar insumos
    if (insumosUtilizados.length > 0 || insumosRequeridos.length > 0) {
      await runQuery('DELETE FROM jornada_insumos WHERE jornadaId = ?', [id]);
      for (const iu of insumosUtilizados) {
        const jiId = `ji-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const cant = Number(iu.cantidad) || 0;
        const cu = Number(iu.costoUnitario) || 0;
        await runQuery(
          `INSERT INTO jornada_insumos (id, jornadaId, insumoId, nombreInsumo, categoria, tipo, cantidad, unidad, costoUnitario, costoTotal, estado, observaciones)
           VALUES (?, ?, ?, ?, ?, 'utilizado', ?, ?, ?, ?, 'utilizado', ?)`,
          [jiId, id, iu.insumoId || null, iu.nombreInsumo || iu.nombre || 'Insumo', iu.categoria || '', cant, iu.unidad || 'unidad', cu, Number(iu.costoTotal) || (cant * cu), iu.observaciones || '']
        );
      }
      for (const ir of insumosRequeridos) {
        const jiId = `ji-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const cant = Number(ir.cantidad) || 0;
        const cu = Number(ir.costoUnitario) || 0;
        await runQuery(
          `INSERT INTO jornada_insumos (id, jornadaId, insumoId, nombreInsumo, categoria, tipo, cantidad, unidad, costoUnitario, costoTotal, estado, observaciones)
           VALUES (?, ?, ?, ?, ?, 'requerido', ?, ?, ?, ?, ?, ?)`,
          [jiId, id, ir.insumoId || null, ir.nombreInsumo || ir.nombre || 'Insumo', ir.categoria || '', cant, ir.unidad || 'unidad', cu, Number(ir.costoTotal) || (cant * cu), ir.estado || 'pendiente', ir.observaciones || '']
        );
      }
    }

    res.json({ ok: true, mensaje: 'Jornada actualizada correctamente.' });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 6. INSUMOS Y RECURSOS AGRÍCOLAS
// ==========================================
app.get('/api/insumos', async (req, res, next) => {
  try {
    const rows = await allQuery('SELECT * FROM insumos ORDER BY categoria ASC, nombre ASC');
    const enriched = await Promise.all(
      rows.map(async (ins) => {
        const salidasRow = await getQuery(
          "SELECT SUM(cantidad) as totalSalidas FROM jornada_insumos WHERE (insumoId = ? OR nombreInsumo = ?) AND tipo = 'utilizado'",
          [ins.id, ins.nombre]
        );
        const totalConsumido = Number(salidasRow?.totalSalidas) || 0;
        const stockActual = Math.max(0, Number(ins.stockInicial) - totalConsumido);
        return {
          ...ins,
          totalConsumido,
          stockActual: Number(stockActual.toFixed(2)),
        };
      })
    );
    res.json({ ok: true, data: enriched });
  } catch (err) {
    next(err);
  }
});

app.post('/api/insumos', async (req, res, next) => {
  try {
    const { nombre, categoria, unidad, stockInicial, costoUnitario, estado, observaciones } = req.body;
    if (!nombre || !categoria || !unidad) {
      return res.status(400).json({ ok: false, mensaje: 'El nombre, categoría y unidad de medida son obligatorios.' });
    }
    const id = `ins-${Date.now()}`;
    const sInicial = Number(stockInicial) || 0;
    const cUnit = Number(costoUnitario) || 0;
    await runQuery(
      `INSERT INTO insumos (id, nombre, categoria, unidad, stockInicial, stockActual, costoUnitario, estado, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, nombre.trim(), categoria, unidad.trim(), sInicial, sInicial, cUnit, estado || 'activo', observaciones || '']
    );
    const created = await getQuery('SELECT * FROM insumos WHERE id = ?', [id]);
    res.status(201).json({ ok: true, data: created, mensaje: 'Insumo registrado correctamente en el catálogo.' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(400).json({ ok: false, mensaje: 'Ya existe un insumo registrado con este nombre.' });
    }
    next(err);
  }
});

app.put('/api/insumos/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, categoria, unidad, stockInicial, costoUnitario, estado, observaciones } = req.body;
    await runQuery(
      `UPDATE insumos
       SET nombre = COALESCE(?, nombre),
           categoria = COALESCE(?, categoria),
           unidad = COALESCE(?, unidad),
           stockInicial = COALESCE(?, stockInicial),
           costoUnitario = COALESCE(?, costoUnitario),
           estado = COALESCE(?, estado),
           observaciones = COALESCE(?, observaciones)
       WHERE id = ?`,
      [nombre?.trim(), categoria, unidad?.trim(), stockInicial !== undefined ? Number(stockInicial) : null, costoUnitario !== undefined ? Number(costoUnitario) : null, estado, observaciones, id]
    );
    const updated = await getQuery('SELECT * FROM insumos WHERE id = ?', [id]);
    res.json({ ok: true, data: updated, mensaje: 'Insumo actualizado exitosamente.' });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/insumos/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const usage = await getQuery('SELECT COUNT(*) as count FROM jornada_insumos WHERE insumoId = ?', [id]);
    if (usage && usage.count > 0) {
      return res.status(400).json({
        ok: false,
        mensaje: `No se puede eliminar este insumo porque ha sido utilizado en ${usage.count} jornadas registradas. Puedes marcarlo como inactivo en su lugar.`
      });
    }
    await runQuery('DELETE FROM insumos WHERE id = ?', [id]);
    res.json({ ok: true, mensaje: 'Insumo eliminado del catálogo.' });
  } catch (err) {
    next(err);
  }
});

app.get('/api/insumos/:id/historial', async (req, res, next) => {
  try {
    const { id } = req.params;
    const ins = await getQuery('SELECT * FROM insumos WHERE id = ?', [id]);
    if (!ins) {
      return res.status(404).json({ ok: false, mensaje: 'Insumo no encontrado.' });
    }

    const rows = await allQuery(
      `SELECT ji.*, j.codigo as jornadaCodigo, j.fecha, j.tipoTrabajoId, tt.nombre as tipoTrabajoNombre
       FROM jornada_insumos ji
       JOIN jornadas j ON ji.jornadaId = j.id
       LEFT JOIN tipos_trabajo tt ON j.tipoTrabajoId = tt.id
       WHERE ji.insumoId = ? OR ji.nombreInsumo = ?
       ORDER BY j.fecha DESC`,
      [id, ins.nombre]
    );

    // Adjuntar propiedades/propietarios a cada registro
    const historial = await Promise.all(
      rows.map(async (r) => {
        const props = await allQuery(
          `SELECT jp.*, p.nombreCompleto as propietarioNombre, c.nombre as cuadraNombre
           FROM jornada_propiedades jp
           LEFT JOIN propietarios p ON jp.propietarioId = p.id
           LEFT JOIN cuadras c ON jp.cuadraId = c.id
           WHERE jp.jornadaId = ?`,
          [r.jornadaId]
        );
        return {
          ...r,
          propiedades: props,
        };
      })
    );

    const totalUtilizado = rows
      .filter((r) => r.tipo === 'utilizado')
      .reduce((acc, r) => acc + Number(r.cantidad || 0), 0);
    const costoAcumulado = rows
      .filter((r) => r.tipo === 'utilizado')
      .reduce((acc, r) => acc + Number(r.costoTotal || 0), 0);

    res.json({
      ok: true,
      data: {
        insumo: ins,
        totalUtilizado,
        costoAcumulado,
        registros: historial,
      },
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/pagos/liquidar', async (req, res, next) => {
  try {
    const { jornadaTrabajadorIds = [], metodoPago = 'Efectivo', comprobante } = req.body;
    if (jornadaTrabajadorIds.length === 0) {
      return res.status(400).json({ ok: false, mensaje: 'No se seleccionaron trabajadores para liquidar.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const comp = comprobante || `PAG-${Date.now().toString().slice(-6)}`;

    for (const jtId of jornadaTrabajadorIds) {
      await runQuery(
        `UPDATE jornada_trabajadores
         SET estadoPago = 'pagado',
             fechaPago = ?,
             metodoPago = ?,
             comprobantePago = ?
         WHERE id = ?`,
        [today, metodoPago, comp, jtId]
      );
    }

    res.json({ ok: true, mensaje: `Se liquidaron ${jornadaTrabajadorIds.length} pagos correctamente.` });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/jornadas/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await runQuery('DELETE FROM jornadas WHERE id = ?', [id]);
    res.json({ ok: true, mensaje: 'Jornada eliminada correctamente.' });
  } catch (err) {
    next(err);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'online', database: 'sqlite-connected', timestamp: new Date().toISOString() });
});

// Registrar manejador central de errores
app.use(errorHandler);

// Iniciar servidor tras verificar base de datos
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor Backend AgroCacao activo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Error fatal al inicializar base de datos SQLite:', err);
    process.exit(1);
  });
