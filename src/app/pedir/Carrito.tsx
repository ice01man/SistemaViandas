"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { crearPedido, type PedidoFormState } from "@/lib/actions/pedidos";
import { CATEGORIA_LABEL, fmtPrecio } from "@/lib/constants";
import { CategoriaIcon, IconCart } from "@/components/icons";

type MenuItem = {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  disponibles: number;
};

type Perfil = { direccion: string; piso: string; zona: string; restricciones: string };

export default function Carrito({
  fecha,
  fechaLabel,
  menus,
  perfil,
}: {
  fecha: string;
  fechaLabel: string;
  menus: MenuItem[];
  perfil: Perfil;
}) {
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [state, formAction, pending] = useActionState<PedidoFormState, FormData>(crearPedido, {});
  const resumenRef = useRef<HTMLFormElement>(null);

  const items = useMemo(
    () =>
      Object.entries(cantidades)
        .map(([id, cantidad]) => ({ menuDiaId: Number(id), cantidad }))
        .filter((i) => i.cantidad > 0),
    [cantidades]
  );

  const total = useMemo(
    () =>
      items.reduce((acc, i) => {
        const menu = menus.find((m) => m.id === i.menuDiaId);
        return acc + (menu ? menu.precio * i.cantidad : 0);
      }, 0),
    [items, menus]
  );

  function setCantidad(id: number, value: number, max: number) {
    setCantidades((prev) => ({ ...prev, [id]: Math.max(0, Math.min(max, value)) }));
  }

  const totalViandas = items.reduce((a, i) => a + i.cantidad, 0);

  return (
    <div className="mt-6 grid gap-6 pb-24 lg:grid-cols-[1fr_360px] lg:pb-0">
      {/* Menú del día */}
      <div className="grid gap-4 sm:grid-cols-2">
        {menus.map((m) => {
          const cantidad = cantidades[m.id] ?? 0;
          const agotado = m.disponibles === 0;
          return (
            <div key={m.id} className={`card flex flex-col ${agotado ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brie-lavender-light text-brie-violet">
                  <CategoriaIcon categoria={m.categoria} className="h-6 w-6" />
                </span>
                <span className="badge bg-brie-lavender-light text-brie-violet-dark">
                  {CATEGORIA_LABEL[m.categoria]}
                </span>
              </div>
              <h3 className="mt-2 font-extrabold text-brie-violet-deep">{m.nombre}</h3>
              <p className="mt-1 flex-1 text-sm text-foreground/75">{m.descripcion}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-extrabold text-brie-orange">{fmtPrecio(m.precio)}</span>
                <span className={`badge ${agotado ? "bg-red-100 text-red-700" : "bg-green-100 text-green-800"}`}>
                  {agotado ? "Agotado" : `${m.disponibles} disp.`}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCantidad(m.id, cantidad - 1, m.disponibles)}
                  className="btn-outline h-9 w-9 rounded-full p-0 text-lg"
                  disabled={cantidad === 0}
                  aria-label={`Quitar ${m.nombre}`}
                >
                  −
                </button>
                <span className="w-8 text-center text-lg font-extrabold">{cantidad}</span>
                <button
                  type="button"
                  onClick={() => setCantidad(m.id, cantidad + 1, m.disponibles)}
                  className="btn-primary h-9 w-9 rounded-full p-0 text-lg"
                  disabled={agotado || cantidad >= m.disponibles}
                  aria-label={`Agregar ${m.nombre}`}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra flotante en mobile: lleva al resumen del pedido */}
      {items.length > 0 && (
        <button
          type="button"
          onClick={() => resumenRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="fixed inset-x-3 bottom-3 z-40 flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-brie-solid px-4 py-3 text-white shadow-xl shadow-brie-violet-deep/30 lg:hidden"
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            <IconCart className="h-5 w-5" />
            {totalViandas} {totalViandas === 1 ? "vianda" : "viandas"} · {fmtPrecio(total)}
          </span>
          <span className="rounded-xl bg-white/20 px-3 py-1.5 text-xs font-extrabold">
            Ver mi pedido ↓
          </span>
        </button>
      )}

      {/* Resumen y checkout */}
      <form
        ref={resumenRef}
        action={formAction}
        className="card h-fit scroll-mt-24 lg:sticky lg:top-20"
      >
        <h3 className="text-lg font-extrabold text-brie-violet-deep">Tu pedido</h3>
        <p className="text-sm capitalize text-foreground/70">Entrega: {fechaLabel}</p>
        <input type="hidden" name="fecha" value={fecha} />
        <input type="hidden" name="items" value={JSON.stringify(items)} />

        <div className="mt-3 space-y-1 border-b border-brie-lavender-light pb-3 text-sm">
          {items.length === 0 && <p className="text-foreground/60">Todavía no agregaste viandas.</p>}
          {items.map((i) => {
            const menu = menus.find((m) => m.id === i.menuDiaId)!;
            return (
              <div key={i.menuDiaId} className="flex justify-between">
                <span>
                  {i.cantidad} × {menu.nombre}
                </span>
                <span className="font-bold">{fmtPrecio(menu.precio * i.cantidad)}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-2 flex justify-between text-lg font-extrabold text-brie-violet-deep">
          <span>Total</span>
          <span>{fmtPrecio(total)}</span>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="label" htmlFor="direccion">Dirección de entrega</label>
            <input className="input" id="direccion" name="direccion" defaultValue={perfil.direccion} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="piso">Piso / Depto</label>
              <input className="input" id="piso" name="piso" defaultValue={perfil.piso} />
            </div>
            <div>
              <label className="label" htmlFor="zona">Zona</label>
              <select className="input" id="zona" name="zona" defaultValue={perfil.zona}>
                <option value="SUR">Sur</option>
                <option value="CENTRO">Centro</option>
                <option value="NORTE">Norte</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="metodoPago">Método de pago</label>
            <select className="input" id="metodoPago" name="metodoPago" defaultValue="TRANSFERENCIA">
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="EFECTIVO">Efectivo</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="observaciones">Observaciones / restricciones</label>
            <textarea
              className="input"
              id="observaciones"
              name="observaciones"
              rows={2}
              defaultValue={perfil.restricciones}
              placeholder="Alergias, timbre, horario preferido..."
            />
          </div>
        </div>

        {state.error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {state.error}
          </p>
        )}

        <button className="btn-orange mt-4 w-full py-3" disabled={pending || items.length === 0}>
          {pending ? "Confirmando..." : `Confirmar pedido · ${fmtPrecio(total)}`}
        </button>
      </form>
    </div>
  );
}
