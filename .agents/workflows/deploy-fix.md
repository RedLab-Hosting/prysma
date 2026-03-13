---
description: Cómo reparar el despliegue de una franquicia en GitHub Pages
---

Si una franquicia aparece en blanco o tiene errores de secretos, sigue este flujo con Antigravity:

1. **Abrir el Super Admin**: Ve a `http://localhost:5173/superadmin`.
2. **Localizar Empresa**: Busca la tarjeta de la empresa que falla.
3. **Sincronizar**: Haz clic en el **icono azul de sincronización (RefreshCw)**.
   - Antigravity ejecutará `setupTenantSecrets` para encriptar y subir las llaves.
   - Cambiará el "Source" de Pages a **Actions** vía API.
   - Disparará un **Workflow Dispatch** inmediato.

// turbo 4. **Verificar Despliegue**: Pídele a Antigravity que revise el estado de las Actions en GitHub para confirmar que el build terminó con éxito.

### Notas Técnicas:

- Asegúrate de tener el `VITE_GITHUB_TOKEN` con permisos de `workflow` y `repo`.
- La detección de subcarpeta es automática gracias al `basename` dinámico en `App.jsx`.
