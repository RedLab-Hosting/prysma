# 🚀 Guía de Replicación - Fast Food Platform

Esta guía detalla todo lo necesario para replicar exactamente la estructura, dependencias y configuración de esta aplicación web multi-tenant.

## 📁 Distribución de Carpetas

La arquitectura sigue un patrón modular donde el `core` es compartido y la personalización se gestiona vía Context API.

```text
demo-page/
├── public/                 # Assets públicos
├── src/
│   ├── api/                # Capa de servicios (Supabase, GitHub, etc.)
│   │   ├── baseService.js  # Clase base para servicios CRUD
│   │   ├── productService.js # Gestión de productos (multi-tenant)
│   │   ├── categoryService.js # Gestión de categorías (multi-tenant)
│   │   └── ...
│   ├── components/         # Componentes UI (Client, Admin, SuperAdmin)
│   ├── TenantContext.jsx # Branding y configuración de la empresa
│   ├── CartContext.jsx   # Gestión del carrito de compras
│   └── AuthContext.jsx   # Gestión de sesiones con Supabase
│   ├── views/              # Vistas basadas en roles
│   ├── App.jsx             # Enrutador principal y configuración
│   └── main.jsx            # Punto de entrada de Vite
├── .env                    # Variables de entorno (VITE_ prefix)
├── SUPABASE_SETUP.sql      # Script de base de datos
└── vite.config.js          # Configuración de Vite
```

## 🛠️ Tecnologías y Dependencias

### Core

- **React 19**: Framework de UI.
- **Tailwind CSS v4**: Para estilos dinámicos y branding.
- **Vite 6**: Tooling para desarrollo ultra-rápido.

### Librerías Clave

```bash
npm install @supabase/supabase-js lucide-react framer-motion react-router-dom leaflet react-leaflet qrcode.react
```

## 🚀 Pasos para la Replicación

### 1. Clonar e Instalar

```bash
git clone <url-del-repositorio>
cd fast-food
npm install
```

### 2. Configuración de Base de Datos (Supabase)

1. Crea un proyecto en [Supabase](https://supabase.com/).
2. Ejecuta `SUPABASE_SETUP.sql` en el SQL Editor para crear las tablas y políticas RLS.

### 3. Variables de Entorno

Crea un archivo `.env`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
VITE_GITHUB_TOKEN=tu-github-token-para-automatizacion
```

### 4. Ejecución Local

```bash
npm run dev
```

La app estará disponible en `http://localhost:5173`.

## 💱 Gestión de Tasa de Cambio (BCV)

La aplicación incluye un sistema inteligente de sincronización de tasas desde el Banco Central de Venezuela:

- **Sincronización Dual:** Un solo botón actualiza USD y EUR simultáneamente usando un scraper robusto con proxy CORS.
- **Multimoneda:** Soporte nativo para USD, EUR y soporte experimental para COP (Pesos Colombianos).
- **Modos de Control:** Alterna entre actualización automática (BCV) o manual para cada moneda.
- **Automatización:** Se incluyen guías para programar actualizaciones diarias a las 4:00 PM (VET).

---

_Nota: Esta guía refleja el estado actual de la migración a Supabase, la arquitectura modular v2.0 y el sistema de multi-divisa._
