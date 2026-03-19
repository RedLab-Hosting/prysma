# Prysma Developer Guide 🚀

Este documento sirve como referencia para desarrolladores que deseen continuar el desarrollo de Prysma o configurar el entorno en una nueva máquina.

## 3. Branding & Personalización
El sistema utiliza un núcleo de 5 colores inyectados dinámicamente:
- `--primary-color`: Color principal de la marca.
- `--secondary-color`: Color secundario/acentos fuertes.
- `--accent-1/2/3`: Colores opcionales para micro-interacciones.

Para usar estos colores en CSS/Tailwind:
```html
<div className="bg-primary" style={{ backgroundColor: 'var(--primary-color)' }}></div>
```

## 4. Modo Desarrollo & Debug (Super Admin)
Para acceder al panel de control en desarrollo:
- URL: `http://localhost:5173/superadmin`
- Bypass: Se ha implementado un **Bypass de Autenticación** en la pantalla de `Login` para pruebas rápidas.

## 5. Diseño y Estética (Flat & Compact)
El diseño del Super Admin ha sido optimizado para:
- **Escalabilidad**: Márgenes reducidos y tipografía controlada para evitar cortes en logos y headers.
- **Estilo Plano**: Eliminación de desenfoques pesados (`backdrop-blur`) en favor de fondos sólidos y bordes sutiles.
- **Consistencia**: Uso de iconos de 20px (sidebar) y 14-16px (tarjetas/modales).

## 6. Modulación de Funciones
Las funciones se activan desde el Super Admin. Los componentes deben usar:
```javascript
const { features } = useTenant();
if (features.delivery) { /* ... */ }
```

## 🛠️ Tecnologías Core

- **Frontend**: React 19 + Vite 6
- **Styling**: Tailwind CSS v4 (Modern Engine)
- **Base de Datos & Auth**: Supabase (PostgreSQL)
- **Iconografía**: Lucide React
- **Animaciones**: Framer Motion
- **Mapas**: Leaflet + React Leaflet
- **Seguridad**: Libsodium-wrappers (para encriptación de secretos de GitHub)
- **Routing**: React Router DOM v7

## 🏗️ Arquitectura Multi-Tenant

Prysma utiliza una arquitectura **Multi-tenant dinámica** basada en subcarpetas de GitHub Pages o dominios personalizados:

1.  **Detección de Tenant**: `TenantContext.jsx` analiza la URL (`location.pathname` o `hostname`) para identificar el `slug` de la empresa y carga la configuración desde Supabase.
2.  **Inyección de ADN (Branding)**: Una vez identificado el tenant, se inyectan variables CSS globales (`--primary-color`, `--font-family`, etc.) y se cargan fuentes de Google Fonts dinámicamente.
3.  **Servicios de Datos**: El contexto inicializa `productService`, `categoryService` y `orderService` con el ID único del tenant para asegurar el aislamiento de datos.
4.  **Routing Dinámico**: `App.jsx` utiliza un `basename` dinámico para soportar despliegues tanto en `localhost` como en subcarpetas de GitHub Pages.

## 📁 Distribución de Archivos

```text
src/
├── api/             # Capa de servicios (Supabase, GitHub, etc.)
│   ├── githubService.js # Automatización de Repos, Secretos y Pages
│   ├── tenantService.js # Gestión de la tabla 'tenants'
│   ├── productService.js # Gestión de productos (multi-tenant)
│   └── categoryService.js # Gestión de categorías (multi-tenant)
├── components/      # UI Components atómicos y compartidos
├── context/         # Estados globales
│   ├── TenantContext.jsx # Detección de empresa y branding
│   ├── CartContext.jsx   # Lógica del carrito de compras
│   └── AuthContext.jsx   # Gestión de sesiones con Supabase
├── views/           # Vistas principales del sistema
│   ├── SuperAdmin/  # Panel de gestión de franquicias
│   ├── Admin/       # Panel de gestión para el dueño de la tienda
│   └── Client/      # Storefront y Checkout para el cliente final
├── theme/           # Tokens de diseño (si aplica)
└── utils/           # Helper functions (formateo, validación)
```

## 🤖 Antigravity & Workflows

Para trabajar con **Antigravity** de forma eficiente, hemos definido flujos de trabajo en `.agents/workflows/`. Estos permiten automatizar tareas complejas.

### Configuración en nueva PC:

1. Clonar el repositorio.
2. Instalar dependencias: `npm install`.
3. Configurar `.env` con `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_GITHUB_TOKEN`.
4. Ejecutar `npm run dev`.

### Workflow de Despliegue Automático:

Prysma automatiza el despliegue de nuevos tenants mediante `githubService.js`:

1. **Creación de Repo**: Usa la API de GitHub para crear un repo desde el sitio semilla.
2. **Secretos**: Encripta y sube las llaves de Supabase vía API.
3. **Pages**: Activa GitHub Pages configurando la fuente a **Workflow**.
4. **Dispatch**: Dispara el primer build inmediatamente.

## 🔧 Utilidades Clave

- **`githubService.setupTenantSecrets(repoName)`**: Configura las variables de entorno en el repositorio remoto.
- **`githubService.dispatchWorkflow(repoName)`**: Fuerza un nuevo despliegue en GitHub Actions.
- **`basename` dinámico en `App.jsx`**: Permite que el SPA funcione tanto en `localhost` como en subcarpetas de producción.

## 💱 Exchange Rate System (BCV)

El sistema de divisas permite a cada tenant definir su moneda de referencia (USD, EUR, COP) y sincronizarla con el BCV:

- **Servicio**: `exchangeRateService.js` maneja el scraping mediante `corsproxy.io`.
- **Lógica**: La función `syncAllRates(tenantId)` actualiza tanto USD como EUR en una sola petición paralela basándose en selectores CSS del BCV.
- **Persistencia**: Los datos se guardan en la tabla `exchange_rates` con una restricción única por `(tenant_id, currency_code)`.
- **Automatización**: Para actualizaciones desatendidas (ej. 4 PM VET), se utiliza una combinación de Edge Functions y `pg_cron` (instrucciones en `AUTOMATED_SYNC_GUIDE.md`).

---

_Actualizado por Antigravity - 2026_
