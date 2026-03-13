# Prysma Developer Guide 🚀

Este documento sirve como referencia para desarrolladores que deseen continuar el desarrollo de Prysma o configurar el entorno en una nueva máquina.

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

1.  **Detección de Tenant**: `TenantContext.jsx` analiza la URL (`location.pathname` o `hostname`) para identificar el `slug` de la empresa.
2.  **Inyección de ADN (Branding)**: Una vez identificado el tenant, se inyectan variables CSS globales (`--primary-color`, `--font-family`, etc.) y se cargan fuentes de Google Fonts dinámicamente.
3.  **Routing Dinámico**: `App.jsx` utiliza un `basename` dinámico para soportar despliegues en subcarpetas de GitHub (`/prysma-demo/`).

## 📁 Distribución de Archivos

```text
src/
├── api/             # Capa de servicios (Supabase, GitHub, etc.)
│   ├── githubService.js # Automatización de Repos, Secretos y Pages
│   └── tenantService.js # Gestión de la tabla 'tenants'
├── components/      # UI Components atómicos y compartidos
├── context/         # Estados globales (Tenant, Carrito, Auth)
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

---

_Actualizado por Antigravity - 2026_
