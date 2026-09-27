"use client";

import { useState } from "react";

/** Selects de rol y zona del alta de personal: la zona solo aplica a Delivery. */
export default function CamposRolZona() {
  const [rol, setRol] = useState("ADMIN");

  return (
    <>
      <div>
        <label className="label">Rol</label>
        <select className="input w-40" name="rol" value={rol} onChange={(e) => setRol(e.target.value)}>
          <option value="ADMIN">Administración</option>
          <option value="COCINA">Cocina</option>
          <option value="DELIVERY">Delivery</option>
        </select>
      </div>
      {rol === "DELIVERY" && (
        <div>
          <label className="label">Zona</label>
          <select className="input w-40" name="zona">
            <option value="">Todas</option>
            <option value="SUR">Sur</option>
            <option value="CENTRO">Centro</option>
            <option value="NORTE">Norte</option>
          </select>
        </div>
      )}
    </>
  );
}
