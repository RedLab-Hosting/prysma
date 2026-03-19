# Estrategia de Sincronización Prysma (Core/Branch)

Este documento explica cómo gestionar el repositorio núcleo (`prysma`) y los repositorios de empresas individuales para asegurar actualizaciones globales de forma sencilla.

## 1. Concepto: Upstream Remote
El repositorio de cada empresa será un "fork manual" del repositorio núcleo. Esto permite que cada empresa tenga su propio historial pero pueda recibir cambios del núcleo.

## 2. Flujo de Trabajo

### A. Para crear una nueva empresa (rama):
1. **Crear un nuevo repo vacío** en GitHub (ej: `empresa-burger-king`).
2. **Clonar el repo núcleo** localmente:
   ```bash
   git clone https://github.com/tu-usuario/prysma.git empresa-burger-king
   cd empresa-burger-king
   ```
3. **Renombrar el remote actual** a `upstream` y añadir el nuevo repo como `origin`:
   ```bash
   git remote rename origin upstream
   git remote add origin https://github.com/tu-usuario/empresa-burger-king.git
   git push -u origin main
   ```

### B. Para recibir actualizaciones del Core:
Cuando hagas cambios en el repositorio `prysma` (corrección de bugs, nuevas features) y quieras que todas las empresas los reciban:
1. En el repositorio de la empresa:
   ```bash
   git fetch upstream
   git merge upstream/main
   # Resolver conflictos si los hay (usualmente en archivos de config)
   git push origin main
   ```

## 3. Archivos que NO deben compartirse
Cada empresa tendrá su propio archivo `.env` para conectar a su propia instancia de Supabase (si decides bases de datos separadas) o simplemente para definir su `TENANT_ID`.

> [!IMPORTANT]
> Nunca hagas commit del archivo `.env`. Asegúrate de que esté en el `.gitignore`.
