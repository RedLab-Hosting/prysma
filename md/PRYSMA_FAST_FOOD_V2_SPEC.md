vamos a crear una web app
hosteada en github, programada con JavaScript y React con base de datos en SupaBase, dame un panel de super admin para crear una nueva empresa, y de ahi vamos trabajando, quiero hacer un nucleo central en github, y que los repos rama se alimenten de el para asegurar actualizaciones futuras, hago enfasis en que quiero escalar a varias empresas / franquicias y cada una debe ser personalizable, explicame paso a paso lo que tenemos que hacer, vamos desde crear el repo nucleo en git hub hasta configurar supabase
paso a paso

# Especificación Funcional: Fast Food App V2 🍔🚀

Esta documentación desglosa el proyecto en bloques funcionales y técnicos para una reconstrucción total desde cero, optimizada para **Supabase** y una arquitectura de código moderna (**React + Vite + Tailwind**).

---

## 1. Bloque de Arquitectura Core (Multi-Tenancy)

El corazón del sistema. Permite que múltiples negocios operen en la misma plataforma con total aislamiento.

- **Identidad Dinámica**: Cada local tiene su propio `slug` (ej: `/burger-king`), logo, colores y fuentes.
- **Feature Flags**: Capacidad de activar/desactivar módulos por local (ej: unos usan Zelle, otros no).
- **Aislamiento de Datos**: RLS (Row Level Security) aplicado en Supabase. Cada local solo accede a sus propios datos mediante `tenant_id`.
- **Configuración en Tiempo Real**: Los cambios en el tema o configuración se reflejan instantáneamente mediante el `TenantContext`.
- **Fallback de Datos**: Sistema de datos "mock" inteligente para empresas nuevas que aún no han cargado productos.

---

## 2. Bloque Super Admin (Control Central)

Panel de control para el dueño de la plataforma.

- **Gestión de Empresas**: CRUD de locales (Crear, Editar, Pausar).
- **Control Destructivo**: Modal de eliminación permanente con confirmación por `slug`.
- **Personalización de Marca**: Editor visual de temas (Primary Color, Branding) por local.
- **Sincronización de Secretos**: Automatización de llaves de Supabase y despliegue en GitHub vía API.

---

## 3. Bloque Administrador de Local (Dashboard Business)

Donde el dueño del local gestiona su día a día.

- **Gestión de Pedidos (Live)**: Tablero con estados granulares controlados desde submenús (Entrantes, Pendiente, Asignado, Entregando, Entregados).
- **Gestión de Menú**:
  - Categorías dinámicas con iconos/emojis.
  - Productos con múltiples variantes/extras (ej: Con/Sin cebolla, Extra queso) y soporte para SKU.
  - Gestión de imágenes asistida por Unsplash API.
  - Control de inventario (Disponible/Agotado).
- **Caja y Tasas**: Sincronización automática dual (USD/EUR) con el dólar (BCV) o tasa manual, calculada en tiempo real en todo el sitio.

---

## 4. Bloque Delivery (App del Repartidor)

Interfaz optimizada para móviles.

- **Hoja de Ruta**: Lista de pedidos asignados con prioridad.
- **Navegación**: Enlace directo a Google Maps/Waze con la dirección del cliente.
- **Gestión de Estado**: Botones rápidos para indicar "Llegué al sitio" o "Entregado".
- **Notificaciones Push**: Alertas inmediatas cuando se le asigna un nuevo pedido.

---

## 5. Bloque Cliente (Frontend de Venta)

Experiencia de usuario rápida y "deliciosa".

- **Catálogo Interactivo**: Navegación por categorías mediante scroll horizontal suave y rejilla de productos responsiva.
- **Carrito Inteligente**: Gestión de extras y notas especiales mediante modales animados de producto.
- **Checkout Dinámico**:
  1.  **Tipo de Entrega**: Delivery o Pickup.
  2.  **Ubicación**: Pin en el mapa + detección de GPS automática.
  3.  **Pago**: Selección con cálculo de tasa real (BCV) en tiempo real.

---

## 6. Estructura Técnica Sugerida (V2)

```text
src/
├── api/             # Servicios de Supabase y GitHub
├── components/      # UI Atómica y componentes Admin/Client
├── context/         # AuthContext, TenantContext, CartContext
├── views/
│   ├── Client/      # Storefront y Checkout
│   ├── Admin/       # Dashboard y Pedidos
│   └── SuperAdmin/  # Gestión Global
```

---

## 7. Elementos de "Efecto WOW" (Mandatorios)

- **Flat Design & Minimalism**: Interfaz moderna sin sombras, basada en bordes limpios y fondos sutiles (Zinc/Slate) para un look premium profesional.
- **Framer Motion**: Animaciones fluidas en transiciones de páginas y modales.
- **Diseño Ergonómico**: Menú lateral (Mobile) desplazado a la derecha para fácil acceso táctil.
- **Real-time Engine**: Cambios en configuración y tasas se ven al instante en el cliente.
- **Universal Subfolder Support**: Compatibilidad nativa con GitHub Pages sin necesidad de configurar el `base` de Vite manualmente por cada repositorio.
- **Automatic Slug Inference**: El núcleo deduce la identidad del local basado en el nombre del repositorio en GitHub.

---
