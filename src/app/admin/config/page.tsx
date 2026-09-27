import { getConfig } from "@/lib/auth";
import { guardarConfiguracion } from "@/lib/actions/admin";
import { IconClock, IconUsers } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminConfigPage() {
  const horaCorte = await getConfig("horaCorte", "10:00");

  return (
    <>
      <h1 className="text-2xl font-extrabold text-brie-violet-deep">Configuración</h1>
      <p className="mt-1 text-foreground/70">Parámetros generales de la operatoria.</p>

      <div className="card mt-6 max-w-lg">
        <h3 className="flex items-center gap-1.5 font-extrabold text-brie-violet-deep">
          <IconClock className="h-4 w-4" /> Ventana de pedidos
        </h3>
        <p className="mt-1 text-sm text-foreground/70">
          Hora límite para tomar pedidos con entrega en el día. Después de esta hora, los clientes
          solo pueden pedir para los días siguientes. Se puede extender temporalmente según la zona y
          la disponibilidad.
        </p>
        <form action={guardarConfiguracion} className="mt-4 flex items-end gap-3">
          <div>
            <label className="label" htmlFor="horaCorte">Hora de corte</label>
            <input className="input w-32" id="horaCorte" name="horaCorte" type="time" defaultValue={horaCorte} />
          </div>
          <button className="btn-primary">Guardar</button>
        </form>
      </div>

      <div className="card mt-6 max-w-lg bg-brie-lavender-soft">
        <h3 className="flex items-center gap-1.5 font-extrabold text-brie-violet-deep">
          <IconUsers className="h-4 w-4" /> Cuentas de demostración
        </h3>
        <p className="mt-2 text-sm text-foreground/75">
          Contraseña para todas: <code className="font-bold">brie1234</code>
        </p>
        <ul className="mt-2 space-y-1 text-sm text-foreground/75">
          <li>• piccoli@brie.com / agus@brie.com — Administración</li>
          <li>• cocina@brie.com — Cocina</li>
          <li>• cadete.norte@brie.com — Delivery zona Norte</li>
          <li>• cadete.centro@brie.com — Delivery zona Centro</li>
          <li>• cadete.sur@brie.com — Delivery zona Sur</li>
          <li>• cliente@demo.com — Cliente individuo</li>
          <li>• empresa@demo.com — Cliente con precios de empresa</li>
        </ul>
      </div>
    </>
  );
}
