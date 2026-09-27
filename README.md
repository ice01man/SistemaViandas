# Brie · Sistema de gestión y venta de viandas

Aplicación web para **Brie — Servicio Gastronómico Integral** (Santa Fe Capital y alrededores).
Centraliza el circuito completo del pedido que hoy se maneja por WhatsApp + Excel:
menú del día → pedido del cliente → producción en cocina → reparto por zonas → pagos y cierre del día.

Proyecto final · P.P. Integración de Sistemas · PIGMALIÓN RCMR.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend + Backend | Next.js 16 (App Router, Server Actions) + React 19 + TypeScript |
| Estilos | Tailwind CSS 4 (paleta violeta/naranja de la marca) |
| Base de datos | SQLite vía Prisma ORM |
| Autenticación | Sesión JWT en cookie httpOnly (jose) + bcryptjs |

## UI / UX

- **Tema claro y oscuro** en toda la app: respeta la preferencia del sistema y se puede alternar
  con el botón 🌙/☀️ del navbar (y del panel admin). La elección se guarda en `localStorage`.
  Los colores de marca están definidos como variables CSS en `globals.css` (`:root` y `.dark`).
- **Mobile first**: todas las pantallas son responsive (menú horizontal en mobile, tablas con
  scroll propio, carrito apilado, login con pestañas).
- **Animaciones**: logo flotante con órbita en el hero, aparición al hacer scroll
  (componente `Reveal`, IntersectionObserver) y scrollbar sutil con los colores de la app.
- **Login/Registro unificados** (`/login` y `/registro` comparten pantalla): en escritorio el
  panel violeta se desliza para alternar entre ambos formularios (estilo "double slider");
  en mobile se alterna con pestañas animadas. Tarjetas con efecto *liquid glass* sobre una
  imagen de fondo.
- **Imagen de fondo del login**: colocar en `public/auth-bg.jpg` (recomendado **1920×1280 px**,
  JPG, < 500 KB). Si falta, se muestra un degradado violeta de respaldo.

## Cómo correr el proyecto

```bash
npm install          # instalar dependencias
npx prisma db push   # crear la base de datos (prisma/dev.db)
npm run db:seed      # cargar datos de demostración
npm run dev          # levantar en http://localhost:3000
```

> Para producción: `npm run build && npm start`.

## Usuarios de demostración

Contraseña para todos: **`brie1234`**

| Email | Rol | Qué ve |
|---|---|---|
| `piccoli@brie.com` / `agus@brie.com` | **Admin** | Todo: panel del día, pedidos, menú, viandas, stock, compras, usuarios, reportes, configuración |
| `cocina@brie.com` | **Cocina** | Producción del día, recetas escaladas por porciones, comanda, confirmación de cocción |
| `cadete.norte@brie.com` | **Delivery** | Hoja de ruta de la zona Norte |
| `cadete.sur@brie.com` | **Delivery** | Hoja de ruta de la zona Centro/Sur |
| `cliente@demo.com` | **Cliente** (individuo) | Menú, hacer pedidos, historial con seguimiento |
| `empresa@demo.com` | **Cliente** (empresa) | Igual que cliente, pero con la lista de precios de empresa |

## Módulos (según el Diseño Detallado)

### 1. Gestión de menú (Administración)
- ABM de viandas con **recetas** (ingredientes por porción) — `/admin/viandas`
- Publicación del **menú por fecha** con cupo (estimado a producir) y **precios por grupo** (individuo / empresa) — `/admin/menu`
- **Lista de compras** consolidada de la semana (necesario vs. stock, exportable a PDF con imprimir) — `/admin/compras`
- Control general del día y **reporte de cierre** (pedidos, pagos, producción, entregas) — `/admin`, `/admin/reporte`

### 2. Ventas (Cliente)
- Registro / login; el sistema asigna el **grupo de precio** según el usuario
- **Ventana de pedidos** dinámica: hasta la hora de corte (configurable, default 10:00) se puede pedir para hoy; después, para los próximos días hábiles
- Menú del día con **cupo disponible** en tiempo real (cupo – vendidas); el carrito valida cupo y precios en el servidor
- Dirección con piso, zona, restricciones/observaciones y método de pago
- El cliente puede **informar su pago** (referencia del comprobante) y cancelar mientras el pedido siga confirmado

### 3. Producción (Cocina)
- Producción del día: estimado (cupo) ajustado por la **comanda real** de pedidos
- Recetas **escaladas automáticamente** a las porciones pedidas
- **Confirmar cocción** descuenta los insumos de la receta del stock (transaccional)
- Comanda con restricciones/observaciones destacadas; marcar pedidos **preparados**

### 4. Control de Stock
- Insumos con unidad (UN/KG/G/L/ML), stock, mínimo y vencimiento — `/admin/insumos`
- **Ingreso de mercadería** suma stock; la cocción lo descuenta
- Alertas de **reposición** (bajo mínimo) y **vencimiento** (próximos 7 días) en el panel del día

### 5. Reparto (Delivery)
- **Hoja de ruta** por zona del cadete (Norte / Centro-Sur) con dirección, piso, teléfono y aviso de cobro en efectivo
- Estados: preparado → **en camino** → **entregado** / **no entregado** (ausente o rechazo, queda para reprogramar)
- Administración puede asignar cadete manualmente a cada pedido

### 6. Notificaciones
- Cada cambio de estado se refleja en la **línea de tiempo** del pedido que ve el cliente en “Mis pedidos” (pedido recibido → en preparación → preparado → en camino → entregado)
- *Fase posterior:* notificaciones push de PWA (el módulo de estados ya emite los eventos necesarios)

## Estructura del código

```
prisma/schema.prisma      # Modelo de datos (User, Vianda, RecetaItem, Ingrediente,
                          #   MenuDia, Pedido, PedidoItem, Config)
prisma/seed.ts            # Datos de demostración
src/lib/auth.ts           # Sesión JWT + guard por rol + configuración
src/lib/fechas.ts         # Ventana de pedidos, días hábiles, hora de corte
src/lib/menu.ts           # Cálculo de disponibilidad (cupo - vendidas)
src/lib/actions/          # Server Actions: auth, pedidos, admin, operaciones
src/app/                  # Páginas públicas y de cliente
src/app/admin/            # Panel de administración (layout con guard de rol)
src/app/cocina/           # Panel de cocina
src/app/delivery/         # Hoja de ruta del cadete
```

## Fase posterior (fuera del alcance actual)

- Notificaciones push PWA (suscripción + web-push)
- Descuento por pedido semanal (5 días)
- Reprogramación automática de pedidos no entregados
- Menús adaptados por patologías dentro del sistema (hoy se derivan a atención personalizada, como define el relevamiento)
- Reportes estadísticos históricos y optimización de recorridos
