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
- **Problema**: `Policy Exists RLS Disabled` y `Function Search Path Mutable`.
- **Causa**: Políticas creadas sin activar RLS en las tablas, y funciones sin esquema fijo de búsqueda.
- **Solución**:
  - Se ejecutó `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` en todas las tablas.
  - Se añadió `SET search_path = public` a la función `is_superadmin`.
