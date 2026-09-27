import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { crearUsuario, actualizarUsuario, eliminarUsuario } from "@/lib/actions/admin";
import { ZONA_LABEL } from "@/lib/constants";
import { IconPlus, IconTrash } from "@/components/icons";
import FiltroBusqueda from "@/components/FiltroBusqueda";
import FiltroSelect from "@/components/FiltroSelect";
import ConfirmButton from "@/components/ConfirmButton";
import PasswordInput from "@/components/PasswordInput";
import CamposRolZona from "./CamposRolZona";

export const dynamic = "force-dynamic";

const ROL_LABEL: Record<string, string> = {
  ADMIN: "Administración",
  COCINA: "Cocina",
  DELIVERY: "Delivery",
  CLIENTE: "Cliente",
};

const ROL_COLOR: Record<string, string> = {
  ADMIN: "bg-brie-solid text-white",
  COCINA: "bg-amber-100 text-amber-800",
  DELIVERY: "bg-orange-100 text-orange-800",
  CLIENTE: "bg-brie-lavender-light text-brie-violet-dark",
};

export default async function AdminUsuariosPage(props: PageProps<"/admin/usuarios">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim().toLowerCase() : "";
  const rolFiltro = typeof searchParams.rol === "string" ? searchParams.rol : "";

  const [usuarios, session] = await Promise.all([
    db.user.findMany({ orderBy: [{ rol: "asc" }, { nombre: "asc" }] }),
    getSession(),
  ]);

  const coincide = (u: (typeof usuarios)[number]) =>
    !q ||
    [u.nombre, u.email, u.telefono ?? "", u.direccion ?? ""].some((campo) =>
      campo.toLowerCase().includes(q)
    );

  const filtrados = usuarios.filter((u) => coincide(u) && (!rolFiltro || u.rol === rolFiltro));
  const personal = filtrados.filter((u) => u.rol !== "CLIENTE");
  const clientes = filtrados.filter((u) => u.rol === "CLIENTE");

  return (
    <>
      <h1 className="text-2xl font-extrabold text-brie-violet-deep">Usuarios y roles</h1>
      <p className="mt-1 text-foreground/70">
        Cada rol ve solo lo suyo: Administración ve todo, Cocina ve producción y recetas, Delivery ve
        sus entregas, y los clientes hacen sus pedidos.
      </p>

      {/* Alta de personal */}
      <div className="card mt-6 bg-brie-lavender-soft">
        <h3 className="flex items-center gap-1.5 font-extrabold text-brie-violet-deep">
          <IconPlus className="h-4 w-4" /> Nuevo usuario del equipo
        </h3>
        <form action={crearUsuario} className="mt-3 flex flex-wrap items-end gap-3">
          <div className="min-w-44 flex-1">
            <label className="label">Nombre</label>
            <input className="input" name="nombre" required />
          </div>
          <div className="min-w-52 flex-1">
            <label className="label">Email</label>
            <input className="input" name="email" type="email" required />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <PasswordInput className="input w-40" name="password" minLength={6} required />
          </div>
          <CamposRolZona />
          <button className="btn-orange">Crear</button>
        </form>
      </div>

      {/* Filtros */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <FiltroBusqueda
          placeholder="Buscar por nombre, email, teléfono o dirección..."
          className="min-w-64 flex-1"
        />
        <FiltroSelect
          param="rol"
          className="w-44"
          opciones={[
            { value: "", label: "Todos los roles" },
            { value: "ADMIN", label: "Administración" },
            { value: "COCINA", label: "Cocina" },
            { value: "DELIVERY", label: "Delivery" },
            { value: "CLIENTE", label: "Clientes" },
          ]}
        />
        {(q || rolFiltro) && (
          <span className="text-sm text-foreground/60">
            {filtrados.length} resultado{filtrados.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* Personal */}
      <h2 className="mt-8 text-lg font-extrabold text-brie-violet-dark">Equipo Brie</h2>

      {/* Mobile/tablet: tarjetas */}
      <div className="mt-3 space-y-3 md:hidden">
        {personal.map((u) => (
          <div key={u.id} className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-extrabold text-brie-violet-deep">{u.nombre}</h3>
              <span className={`badge ${ROL_COLOR[u.rol]}`}>{ROL_LABEL[u.rol]}</span>
            </div>
            <p className="mt-1 text-sm text-foreground/70">{u.email}</p>
            {u.rol === "DELIVERY" && (
              <p className="text-sm text-foreground/70">
                {u.zona ? ZONA_LABEL[u.zona] : "Todas las zonas"}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-brie-lavender-light pt-3">
              <form action={actualizarUsuario}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="activo" value={u.activo ? "false" : "true"} />
                <button
                  className={`badge cursor-pointer ${u.activo ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}
                >
                  {u.activo ? "Activo · desactivar" : "Inactivo · activar"}
                </button>
              </form>
              {u.id !== session?.id && (
                <form action={eliminarUsuario}>
                  <input type="hidden" name="id" value={u.id} />
                  <ConfirmButton
                    mensaje={`¿Eliminar a ${u.nombre} del equipo? Si tiene entregas asociadas se desactivará para conservar el historial.`}
                    className="inline-flex cursor-pointer items-center gap-1 text-xs text-red-500 hover:underline"
                  >
                    <IconTrash className="h-3.5 w-3.5" /> Eliminar
                  </ConfirmButton>
                </form>
              )}
            </div>
          </div>
        ))}
        {personal.length === 0 && (
          <p className="card p-4 text-center text-sm text-foreground/60">
            Sin resultados en el equipo{q ? ` para “${q}”` : ""}.
          </p>
        )}
      </div>

      {/* Desktop: tabla */}
      <div className="card mt-3 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-brie-lavender-light text-left text-xs uppercase text-brie-violet">
              <th className="py-2">Nombre</th>
              <th className="py-2">Email</th>
              <th className="py-2">Rol</th>
              <th className="py-2">Zona</th>
              <th className="py-2 text-right">Estado</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {personal.map((u) => (
              <tr key={u.id} className="border-b border-brie-lavender-light/60">
                <td className="py-2 font-semibold">{u.nombre}</td>
                <td className="py-2 text-foreground/70">{u.email}</td>
                <td className="py-2">
                  <span className={`badge ${ROL_COLOR[u.rol]}`}>{ROL_LABEL[u.rol]}</span>
                </td>
                <td className="py-2 text-foreground/70">
                  {u.zona ? ZONA_LABEL[u.zona] : u.rol === "DELIVERY" ? "Todas las zonas" : "—"}
                </td>
                <td className="py-2 text-right">
                  <form action={actualizarUsuario} className="inline">
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="activo" value={u.activo ? "false" : "true"} />
                    <button
                      className={`badge cursor-pointer ${u.activo ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}
                    >
                      {u.activo ? "Activo · desactivar" : "Inactivo · activar"}
                    </button>
                  </form>
                </td>
                <td className="py-2 text-right">
                  {u.id !== session?.id && (
                    <form action={eliminarUsuario} className="inline">
                      <input type="hidden" name="id" value={u.id} />
                      <ConfirmButton
                        mensaje={`¿Eliminar a ${u.nombre} del equipo? Si tiene entregas asociadas se desactivará para conservar el historial.`}
                        className="inline-flex cursor-pointer items-center gap-1 text-xs text-red-500 hover:underline"
                      >
                        <IconTrash className="h-3.5 w-3.5" /> Eliminar
                      </ConfirmButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {personal.length === 0 && (
          <p className="mt-3 text-center text-sm text-foreground/60">
            Sin resultados en el equipo{q ? ` para “${q}”` : ""}.
          </p>
        )}
      </div>

      {/* Clientes */}
      <h2 className="mt-8 text-lg font-extrabold text-brie-violet-dark">Clientes</h2>

      {/* Mobile/tablet: tarjetas */}
      <div className="mt-3 space-y-3 md:hidden">
        {clientes.map((u) => (
          <div key={u.id} className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-extrabold text-brie-violet-deep">{u.nombre}</h3>
              <form action={actualizarUsuario}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="activo" value={u.activo ? "false" : "true"} />
                <button
                  className={`badge cursor-pointer ${u.activo ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}
                >
                  {u.activo ? "Activo" : "Inactivo"}
                </button>
              </form>
            </div>
            <p className="mt-1 text-sm text-foreground/70">{u.email}</p>
            <p className="text-sm text-foreground/70">
              {u.telefono ?? "—"} · {u.direccion}
              {u.piso ? `, ${u.piso}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-brie-lavender-light pt-3">
              <form action={actualizarUsuario} className="flex items-center gap-2">
                <input type="hidden" name="id" value={u.id} />
                <select className="input w-32 py-1 text-xs" name="grupo" defaultValue={u.grupo}>
                  <option value="INDIVIDUO">Individuo</option>
                  <option value="EMPRESA">Empresa</option>
                </select>
                <button className="btn-primary px-2 py-1 text-xs">OK</button>
              </form>
              <form action={eliminarUsuario}>
                <input type="hidden" name="id" value={u.id} />
                <ConfirmButton
                  mensaje={`¿Eliminar al cliente ${u.nombre}? Si tiene pedidos asociados se desactivará para conservar el historial.`}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs text-red-500 hover:underline"
                >
                  <IconTrash className="h-3.5 w-3.5" /> Eliminar
                </ConfirmButton>
              </form>
            </div>
          </div>
        ))}
        {clientes.length === 0 && (
          <p className="card p-4 text-center text-sm text-foreground/60">
            Sin clientes que coincidan{q ? ` con “${q}”` : ""}.
          </p>
        )}
      </div>

      {/* Desktop: tabla */}
      <div className="card mt-3 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-brie-lavender-light text-left text-xs uppercase text-brie-violet">
              <th className="py-2">Nombre</th>
              <th className="py-2">Email</th>
              <th className="py-2">Teléfono</th>
              <th className="py-2">Dirección</th>
              <th className="py-2">Grupo de precio</th>
              <th className="py-2 text-right">Estado</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((u) => (
              <tr key={u.id} className="border-b border-brie-lavender-light/60">
                <td className="py-2 font-semibold">{u.nombre}</td>
                <td className="py-2 text-foreground/70">{u.email}</td>
                <td className="py-2 text-foreground/70">{u.telefono ?? "—"}</td>
                <td className="py-2 text-foreground/70">
                  {u.direccion}
                  {u.piso ? `, ${u.piso}` : ""}
                </td>
                <td className="py-2">
                  <form action={actualizarUsuario} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <select className="input w-32 py-1 text-xs" name="grupo" defaultValue={u.grupo}>
                      <option value="INDIVIDUO">Individuo</option>
                      <option value="EMPRESA">Empresa</option>
                    </select>
                    <button className="btn-primary px-2 py-1 text-xs">OK</button>
                  </form>
                </td>
                <td className="py-2 text-right">
                  <form action={actualizarUsuario} className="inline">
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="activo" value={u.activo ? "false" : "true"} />
                    <button
                      className={`badge cursor-pointer ${u.activo ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}
                    >
                      {u.activo ? "Activo" : "Inactivo"}
                    </button>
                  </form>
                </td>
                <td className="py-2 text-right">
                  <form action={eliminarUsuario} className="inline">
                    <input type="hidden" name="id" value={u.id} />
                    <ConfirmButton
                      mensaje={`¿Eliminar al cliente ${u.nombre}? Si tiene pedidos asociados se desactivará para conservar el historial.`}
                      className="inline-flex cursor-pointer items-center gap-1 text-xs text-red-500 hover:underline"
                    >
                      <IconTrash className="h-3.5 w-3.5" /> Eliminar
                    </ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clientes.length === 0 && (
          <p className="mt-3 text-center text-sm text-foreground/60">
            Sin clientes que coincidan{q ? ` con “${q}”` : ""}.
          </p>
        )}
      </div>
    </>
  );
}
