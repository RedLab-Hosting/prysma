# 🛠️ Tecnologías y Funcionalidades del Sistema

Esta es una lista detallada de los componentes externos e internos que hacen funcionar la plataforma.

## 📦 Tecnologías Externas

### Core & UI

- **React 19**: Biblioteca principal para la interfaz de usuario.
- **Tailwind CSS v4**: Framework de CSS con el nuevo motor compilado vía `@tailwindcss/vite`.
- **Vite 6**: Build tool ultra-rápido para desarrollo y producción.
- **React Router DOM v7**: Routing dinámico con `basename` adaptable a GitHub Pages.
- **Framer Motion**: Micro-animaciones y transiciones suaves en la UI.
- **Lucide React**: Set de íconos vectoriales modernos.

### Backend & Datos

- **Supabase**: Backend-as-a-Service que provee:
  - **PostgreSQL**: Base de datos relacional con RLS (Row Level Security).
  - **Auth**: Gestión de usuarios y sesiones vinculada a `AuthContext.jsx`.
- **Unsplash API**: Imágenes de alta calidad para el catálogo demo.

### Geolocalización y Mapas

- **Leaflet + React-Leaflet**: Motor de mapas interactivos.
- **Leaflet Routing Machine**: Cálculo de rutas para delivery.

### Utilidades Especializadas

- **QRCode.react**: Generación dinámica de códigos QR.
- **libsodium-wrappers**: Encriptación de secretos para GitHub Actions API.

---

## ⚙️ Funcionalidades Internas

### Servicios API (`src/api/`)

| Archivo | Función |
|---|---|
| `supabase.js` | Cliente Supabase inicializado con env vars |
| `baseService.js` | Clase base CRUD con `tenant_id` |
| `tenantService.js` | CRUD de la tabla `tenants` |
| `productService.js` | Productos (hereda de BaseService) |
| `categoryService.js` | Categorías (hereda de BaseService) |
| `orderService.js` | Pedidos (hereda de BaseService) |
| `exchangeRateService.js` | Scraping BCV, sincronización dual USD/EUR |
| `githubService.js` | Repos, secretos, Pages, workflows |

### Contextos (`src/context/`)

| Archivo | Función |
|---|---|
| `TenantContext.jsx` | Detección de empresa, branding, inyección de servicios |
| `AuthContext.jsx` | Sesiones Supabase para Admin/Delivery |
| `CartContext.jsx` | Carrito de compras del cliente |

### Utilidades (`src/utils/`)

| Archivo | Función |
|---|---|
| `featureFlags.js` | Definición de feature toggles por tenant |
| `whatsappUtils.js` | Generación de enlaces de WhatsApp para pedidos |

### Componentes (`src/components/`)

| Ruta | Función |
|---|---|
| `Admin/ProductModal.jsx` | Modal para crear/editar productos con Unsplash |
| `Client/ProductCard.jsx` | Tarjeta de producto en el storefront |
| `Client/ProductModal.jsx` | Detalle de producto con modificadores |
| `Common/ErrorBoundary.jsx` | Captura de errores críticos en la UI |

### Vistas (`src/views/`)

| Ruta | Función |
|---|---|
| `SuperAdmin/SuperAdminView.jsx` | Panel de gestión de franquicias (848 líneas) |
| `Admin/AdminDashboardView.jsx` | Dashboard del dueño de tienda (32K) |
| `Client/StorefrontView.jsx` | Tienda del cliente final |
| `Client/CheckoutView.jsx` | Proceso de pago |
| `Login/LoginView.jsx` | Pantalla de inicio de sesión |

---

_Actualizado: 2026-03-28_

### Cambios Clave (v2.4.0):
- Soporte nativo para `leaflet-routing-machine`.
- Servicios de `productService.js` y `categoryService.js` ahora son 100% transaccionales con Supabase.
- Estructura de vistas móvil-primero para repartidores.
