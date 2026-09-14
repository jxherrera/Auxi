# 🌱 AgroCacao Pro — Sistema Integral de Gestión Agrícola de Cacao

Plataforma web profesional y responsive para la administración integral de fincas cacaoteras, control de parcelas (cuadras), jornadas laborales con múltiples trabajadores, distribución de cosechas multipartitas, insumos agrícolas, liquidación de jornales y analítica de rentabilidad en tiempo real.

---

## 🚀 Arquitectura del Sistema

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts, PWA (Service Worker + Web App Manifest).
- **Backend**: Node.js, Express, SQLite3 (con transacciones ACID atómicas y llaves foráneas activas `PRAGMA foreign_keys = ON`), Autenticación JWT y Bcrypt, RBAC (Administrador vs Operador).
- **Infraestructura**: Dockerfile multi-etapa, Docker Compose, Nginx Reverse Proxy.

---

## 📦 Instalación y Desarrollo Local

### 1. Requisitos Previos
- Node.js 18+ y npm
- Git

### 2. Pasos de Instalación
```bash
# Clonar repositorio
git clone https://github.com/jxherrera/Auxi.git
cd Auxi

# Instalar dependencias del frontend y del backend
npm install
cd server && npm install && cd ..
```

### 3. Configuración de Variables de Entorno (`.env`)
Crear un archivo `.env` en la raíz (opcional para desarrollo local):
```env
PORT=3001
JWT_SECRET=agrocacao-super-secret-key-production-2026
CORS_ORIGIN=http://localhost:5173
```

### 4. Iniciar en Desarrollo
```bash
# Terminal 1: Iniciar API Backend
npm run server
# El servidor iniciará en http://localhost:3001

# Terminal 2: Iniciar Servidor Web Frontend Vite
npm run dev
# La aplicación abrirá en http://localhost:5173
```

---

## 👥 Roles y Credenciales Iniciales

- **Administradora**: `mayraveragiler@gmail.com` (Acceso total: eliminación, liquidación, auditoría y modificación de catálogos).
- **Operador de Campo**: Permiso de visualización y registro diario de jornales, cosechas y utilización de insumos.

---

## 🐳 Despliegue con Docker y Docker Compose

El proyecto incluye configuración lista para producción:

```bash
# Construir y levantar contenedores en segundo plano
docker compose up -d --build

# Ver logs de los servicios
docker compose logs -f

# Detener los servicios
docker compose down
```

---

## 💾 Estrategia de Copias de Seguridad (Backup & Restore) SQLite

La base de datos SQLite se encuentra en `server/data/agrocacao.db`. Debido al modo transaccional seguro (`withTransaction`), se recomienda realizar backups sin detener el servicio utilizando el comando nativo `.backup` de SQLite o copias seguras.

### 1. Copia de Seguridad Rápida (PowerShell / Windows)
```powershell
# Crear directorio de respaldos si no existe
New-Item -ItemType Directory -Force -Path "backups"

# Generar backup con timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item "server/data/agrocacao.db" "backups/agrocacao_backup_$timestamp.db"
```

### 2. Copia de Seguridad Online Segura (Linux / SQLite CLI)
```bash
mkdir -p backups
sqlite3 server/data/agrocacao.db ".backup 'backups/agrocacao_$(date +%Y%m%d_%H%M%S).db'"
```

### 3. Restauración de Base de Datos
```bash
# 1. Detener el servidor backend
# 2. Restaurar el archivo
cp backups/agrocacao_backup_YYYYMMDD.db server/data/agrocacao.db
# 3. Reiniciar el servidor backend
```

---

## 🧪 Pruebas y Compilación

```bash
# Comprobación de tipos TypeScript
npx tsc --noEmit

# Compilación de producción (Vite build)
npm run build
```

