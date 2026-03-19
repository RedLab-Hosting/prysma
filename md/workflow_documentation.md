# 🔄 Flujo de Trabajo: Desde la Compra hasta la Entrega

Este documento describe el ciclo de vida de un pedido en la plataforma, detallando las interacciones entre el Cliente, el Administrador y el Repartidor.

---

## 1. Fase de Compra (Vista Cliente)

El cliente interactúa con la web app para armar su pedido.

1.  **Selección**: El cliente navega por las categorías (diseño horizontal) y añade productos al carrito. Puede personalizar ingredientes y extras mediante un modal interactivo con micro-animaciones.
2.  **Checkout**:
    - Ingresa sus datos (Nombre, Apellido, Teléfono, referencia de ubicación.).
    - Selecciona el método: **Delivery** (marca su ubicación en el mapa Leaflet o la captura ubicacion exacta con el boton de gps) o **Retiro en tienda**.
    - Selecciona el método de pago (todos los subtotales dependen del metodo de pago que elija el cliente, si elije pagomovil, el subtotal se muestra en bs, si elije zelle o efectivo, el subtotal se muestra en usd y así por el resto del flujo): **Pago Móvil, Zelle o Efectivo**.
3.  **Confirmación y WhatsApp**:
    - Al pulsar "Confirmar", la app genera el pedido en Supabase con estado `pendiente`.
      le sale un aviso al cliente que al terminar de pagar por whatsapp debe regresar a la pagina para ver el estado de su pedido, el estado "pagado", lo clickea el admin desde su panel una vez el cliente haya pagado y enviado el comprobante por whatsapp.
    - Se redirige al cliente a WhatsApp con un mensaje pre-formateado que incluye el resumen de la orden, el total en USD/Bs y el enlace de su ubicación GPS.
    - El cliente envía el comprobante de pago por ese mismo chat.

---

## 2. Fase de Gestión (Vista Admin)

El comercio recibe la alerta y procesa la orden. (panel admin)

1.  **Recepción**: El pedido aparece en tiempo real en la pestaña **"Pendientes"** del Panel Admin.
2.  **Verificación**:
    - El administrador revisa el comprobante recibido por WhatsApp.
    - Si el pago es en Bs, la app calcula el monto exacto basado en la **Tasa BCV** configurada.
      lo mismo con el pago en $ del delivery, si el cliente elige metodos de pagos diferentes a Bs, el subtotal se muestra en usd y así por el resto del flujo
3.  **Asignación**:
    - El administrador selecciona un repartidor disponible (estado `en_tienda`).
    - Al asignar, el pedido cambia a estado `asignado`.

---

## 3. Fase de Despacho (Vista Delivery)

El repartidor gestiona el traslado físico del pedido. (panel delivery)

1.  **Aceptación**: El repartidor recibe una notificación en su panel y ve los detalles (dirección, monto a cobrar si es efectivo). al aceptar el pedido, el estado cambia a "asignado" y el repartidor ve la ubicacion exacta del cliente en el mapa.
2.  **En Camino**:
    el admin asigna a un repartidor y el pedido cambia a "asignado", el repartidor ve la ubicacion exacta del cliente en el mapa. - Al aceptar el pedido, el repartidor marca **"Tomar pedido"**. - Al salir de la tienda el repartidor marca **"En Camino"**. (esto tambien se activa si el mapa detecta que el repartidor salio de la tienda) - El repartidor usa el mapa integrado (Leaflet Routing) para llegar a la ubicación exacta del cliente.
3.  **Entrega**:
    - Al llegar y entregar, el repartidor marca **"Entregado"**.
    - El estado cambia a `entregado` en la base de datos.
    - Si el pago es en efectivo, el repartidor cobra y visualiza el vuelto exacto en la app.

---

## 4. Finalización y Retorno

1.  **Cierre**: El administrador ve la orden en el historial de **"Entregados"**.
2.  **Disponibilidad**: El repartidor, al regresar al local, desliza para marcarse nuevamente como `en_tienda` esto tambien se activa si el mapa detecta que el repartidor regreso al local y queda disponible para una nueva ruta.
3.  **Métricas**: El sistema actualiza automáticamente las estadísticas diarias de ventas (USD/Bs) y el ranking de entregas, también un sistema de estrellas para calificar al repartidor., asi como un sistema de notificaciones push para notificar al cliente cuando su pedido esta en camino y cuando ha sido entregado etc.

---

### 📌 Resumen de Estados del Pedido

- `pendiente`: Creado por el cliente, esperando revisión.
- `asignado`: El administrador ya eligió un repartidor.
- `en_camino`: El repartidor ya tiene el pedido y va hacia el cliente.
- `entregado`: Cliente recibió su pedido satisfactoriamente.
- `cancelado`: El administrador rechazó el pedido por algún motivo.
