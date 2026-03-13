# Registro de Cambios y Arquitectura (Prysma)

Este documento registra las decisiones técnicas, cambios de base de datos y configuraciones de seguridad realizadas para la arquitectura multi-tenant de Prysma.

## 1. Arquitectura Core
- **Estructura Git**: Modelo Núcleo (`prysma`) -> Ramas (`empresa-x`).
- **Sincronización**: Actualizaciones heredadas vía remotos de Git (`upstream`).
- **Aislamiento**: Multi-tenancy compartido en una sola instancia de Supabase usando `tenant_id`.

## 2. Base de Datos (Supabase)
### Cambios en Esquema
- Adición de tabla `tenants` con soporte para temas, features y settings JSONB.
- Columna `custom_domain` añadida para soporte de dominios propios.
- Relación de `tenant_id` en todas las tablas operativas (pedidos, productos, perfiles).

### Seguridad (RLS)
- Implementación de **Row Level Security** en todas las tablas expuestas.
- Políticas de aislamiento: Los usuarios/clientes solo pueden acceder a datos de su propio `tenant_id`.

## 3. Seguridad Avanzada (Fixes)
- **RLS Enablement**: Activación de RLS en todas las tablas para que las políticas sean efectivas.
- **Security Definer Fix**: Corrección de la función `is_superadmin` con `SET search_path = public` para prevenir ataques de inyección de esquema.

## 4. Automatización
- **githubService**: Integración con la API de GitHub para crear repositorios automáticamente al registrar una nueva empresa.
- **TenantContext**: Detección dinámica de inquilinos mediante subdominios, dominios propios o links de GitHub Pages.

## 5. Bitácora de Errores y Soluciones

### Error de Permisos GitHub (403 Forbidden)
- **Problema**: `remote: Permission to redlab-hosting/prysma.git denied to Diego-Beleno`.
- **Causa**: Credenciales locales en conflicto con los permisos de la organización en GitHub.
- **Solución**: Se generó un Personal Access Token (PAT) y se configuró el remote URL con el formato `https://TOKEN@github.com/...`.

### Bloqueo de Seguridad por Secreto Expuesto
- **Problema**: GitHub rechazó el push (`push declined due to repository rule violations`).
- **Causa**: Se intentó subir el `githubService.js` con el Token de GitHub hardcodeado.
- **Solución**: Se movió el token al archivo `.env` (`VITE_GITHUB_TOKEN`) y se actualizó el servicio para usar `import.meta.env`.

### Pantalla Blanca en Super Admin
- **Problema**: Al entrar a `/superadmin` la pantalla se quedaba en blanco.
- **Causa**: Falta de importación de hooks básicos de React (`useState`, `useEffect`) en `SuperAdminView.jsx`.
- **Solución**: Se añadieron las importaciones faltantes y se verificó el renderizado.

### Advertencias de Seguridad Supabase (Linter)
- **Problema**: `Policy Exists RLS Disabled`, `Function Search Path Mutable` e `Infinite recursion detected`.
- **Causa**: Políticas creadas sin activar RLS, funciones sin esquema fijo y subconsultas circulares en las políticas de `profiles`.
- **Solución**:
  - Se ejecutó `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` en todas las tablas.
  - Se añadió `SET search_path = public` a la función `is_superadmin`.
  - Se crearon funciones `SECURITY DEFINER` (`get_my_tenant_id`, `get_my_role`) para evitar recursión en las políticas de RLS.

### Refinamiento de Branding
- **Problema**: Logo duplicado (icono + texto) en el sidebar.
- **Solución**: Se reemplazó el contenedor del icono y el texto manual por la imagen `prysma_full_logo_white.svg` que contiene tanto el icono como el nombre, logrando un diseño más limpio.

### UI Mobile-First y Responsividad
- **Cambio**: Refactorización completa de `SuperAdminView.jsx` para adoptar un diseño mobile-first.
- **Detalle**: Implementación de sidebar colapsable para móviles, cuadrícula de tarjetas adaptable y optimización de espaciados y tamaños de fuente para pantallas pequeñas.

### Personalización Avanzada de Tenants
- **Cambio**: Expansión del modelo de datos y UI de registro de empresas.
- **Detalle**: Se añadieron selectores de color hexadecimal para **Primary/Secondary Colors** y toggles modulares para **Features** (Delivery, Inventario, Pagos, etc.), permitiendo que cada tienda sea configurada según sus necesidades desde el kernel.

### Idempotencia en Setup SQL
- **Problema**: ERROR: relation "tenants" already exists al re-ejecutar el script de base de datos.
- **Solución**: Se actualizó `SUPABASE_SETUP.sql` para usar `CREATE TABLE IF NOT EXISTS` y un bloque anónimo para limpiar (`DROP POLICY IF EXISTS`) todas las políticas de RLS antes de recrearlas. Esto garantiza que el entorno de desarrollo y producción pueda ser actualizado sin conflictos de colisión de nombres.

## 6. Gestión y Despliegue Automatizado
- **Control de Estado del Sitio**: Se añadió la columna `is_active` a `tenants` y una interfaz de "Power Switch" en el Super Admin para activar/desactivar sitios web instantáneamente.
- **Automatización de GitHub Pages**: 
  - Actualización de `githubService.js` para usar la API de **Generación de Repositorios desde Plantilla**.
  - Implementación de activación automática de **GitHub Pages** vía API (`POST /pages`) tras la creación del repositorio. Esto elimina la necesidad de configurar el hosting manualmente para cada nueva empresa.
- **Panel de Edición**: Añadida capacidad para modificar colores, temas y features de empresas ya registradas sin necesidad de recrearlas.

- **Solución**: 
  - Configuración de `base: './'` en `vite.config.js`.
  - Creación de `.github/workflows/deploy.yml` para automatizar `build` y `deploy`.

## 8. Automatización Total de Despliegue (Zero-Config)
- **Problema**: Las nuevas empresas requerían configurar Secretos y GitHub Pages manualmente.
- **Solución**:
  - Implementación de **Encriptación de Secretos** vía API en `githubService.js` usando `libsodium`.
  - Configuración automática de **GitHub Pages (Source: Actions)** al crear el repositorio.
  - **Botón de Sincronización**: Nueva función en el Super Admin para "reparar" o actualizar repositorios existentes con un solo clic. Esto automatiza la inyección de secretos y dispara un despliegue inmediato.
