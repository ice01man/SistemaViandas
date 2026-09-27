// Datos de prueba para septiembre 2026 (1 al 30, días hábiles).
// Genera clientes de prueba (*@test.brie.com), menús publicados y pedidos con
// estados realistas. Es re-ejecutable: borra y regenera solo los pedidos de los
// clientes de prueba, sin tocar los datos cargados a mano.
//   npx tsx prisma/seed-septiembre.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DESDE = "2026-09-01";
const HASTA = "2026-09-30";
const HOY = "2026-09-12";

// RNG determinístico para que cada corrida genere los mismos datos.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260901);
const entre = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const elegir = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

function diasHabilesSeptiembre(): string[] {
  const out: string[] = [];
  for (let dia = 1; dia <= 30; dia++) {
    const d = new Date(2026, 8, dia);
    if (d.getDay() >= 1 && d.getDay() <= 5) out.push(`2026-09-${String(dia).padStart(2, "0")}`);
  }
  return out;
}

const CLIENTES_PRUEBA = [
  { nombre: "Jorge Fernández", zona: "NORTE", grupo: "INDIVIDUO", direccion: "Av. Aristóbulo del Valle 5520", piso: null },
  { nombre: "Lucía Bertoni", zona: "NORTE", grupo: "INDIVIDUO", direccion: "Lavaisse 610", piso: "2° A" },
  { nombre: "Raúl Domínguez", zona: "CENTRO", grupo: "INDIVIDUO", direccion: "9 de Julio 2033", piso: null },
  { nombre: "Carina López", zona: "CENTRO", grupo: "INDIVIDUO", direccion: "Urquiza 3110", piso: "5° C" },
  { nombre: "Esteban Ruiz", zona: "SUR", grupo: "INDIVIDUO", direccion: "Av. Perón 7213", piso: null },
  { nombre: "Nora Giménez", zona: "SUR", grupo: "INDIVIDUO", direccion: "Estrada 6420", piso: "1° B" },
  { nombre: "Estudio Contable Ferreyra", zona: "CENTRO", grupo: "EMPRESA", direccion: "25 de Mayo 2457", piso: "Piso 3" },
  { nombre: "Clínica del Norte", zona: "NORTE", grupo: "EMPRESA", direccion: "Blas Parera 6120", piso: null },
  { nombre: "Distribuidora El Litoral", zona: "SUR", grupo: "EMPRESA", direccion: "Av. Circunvalación Oeste 4380", piso: null },
  { nombre: "Escuela Técnica N°19", zona: "CENTRO", grupo: "EMPRESA", direccion: "Callejón Roca 1250", piso: null },
];

async function main() {
  const hash = await bcrypt.hash("brie1234", 10);

  // --- Clientes de prueba (idempotente por email) ---
  const clientes: { id: number; nombre: string; grupo: string; zona: string; direccion: string; piso: string | null }[] = [];
  for (let i = 0; i < CLIENTES_PRUEBA.length; i++) {
    const c = CLIENTES_PRUEBA[i];
    const email = `cliente${i + 1}@test.brie.com`;
    const u = await db.user.upsert({
      where: { email },
      update: { zona: c.zona, direccion: c.direccion, piso: c.piso },
      create: {
        email,
        password: hash,
        nombre: c.nombre,
        telefono: `342-4${String(100000 + i * 7919).slice(0, 6)}`,
        direccion: c.direccion,
        piso: c.piso,
        zona: c.zona,
        rol: "CLIENTE",
        grupo: c.grupo,
      },
    });
    clientes.push({ id: u.id, nombre: c.nombre, grupo: c.grupo, zona: c.zona, direccion: c.direccion, piso: c.piso });
  }

  // --- Limpiar pedidos previos de los clientes de prueba en septiembre ---
  const borrados = await db.pedido.deleteMany({
    where: {
      clienteId: { in: clientes.map((c) => c.id) },
      fechaEntrega: { gte: DESDE, lte: HASTA },
    },
  });

  // --- Viandas por categoría (deben existir del seed base) ---
  const viandas = await db.vianda.findMany({ where: { activa: true }, orderBy: { id: "asc" } });
  const gourmet = viandas.filter((v) => v.categoria === "GOURMET");
  const veg = viandas.filter((v) => v.categoria === "VEGETARIANO");
  const ensalada = viandas.filter((v) => v.categoria === "ENSALADA");
  if (gourmet.length < 2 || veg.length < 1 || ensalada.length < 1) {
    throw new Error("Faltan viandas base: corré primero `npm run db:seed`.");
  }

  // --- Cadetes por zona ---
  const cadetes = await db.user.findMany({ where: { rol: "DELIVERY" } });
  const cadetePorZona = (zona: string) => cadetes.find((c) => c.zona === zona)?.id ?? null;

  const fechas = diasHabilesSeptiembre();
  let totalPedidos = 0;

  for (let dia = 0; dia < fechas.length; dia++) {
    const fecha = fechas[dia];
    const esPasado = fecha < HOY;

    // --- Menú del día: 2 gourmet + 1 vegetariano + 1 ensalada, precios estables ---
    const seleccion = [
      gourmet[dia % gourmet.length],
      gourmet[(dia + 1) % gourmet.length],
      veg[dia % veg.length],
      ensalada[dia % ensalada.length],
    ];
    const menus: { id: number; precioIndividuo: number; precioEmpresa: number; cupo: number }[] = [];
    for (const v of seleccion) {
      const precioIndividuo = 6500 + (v.id % 3) * 300; // leve variación por vianda
      const menu = await db.menuDia.upsert({
        where: { fecha_viandaId: { fecha, viandaId: v.id } },
        update: { producido: esPasado },
        create: {
          fecha,
          viandaId: v.id,
          cupo: entre(40, 60),
          precioIndividuo,
          precioEmpresa: precioIndividuo - 700,
          producido: esPasado,
        },
      });
      menus.push(menu);
    }

    // --- Pedidos del día ---
    const vendidoPorMenu = new Map<number, number>();
    const cuantos = entre(6, 12);
    const clientesDelDia = [...clientes].sort(() => rnd() - 0.5).slice(0, cuantos);

    for (const cliente of clientesDelDia) {
      const esEmpresa = cliente.grupo === "EMPRESA";
      const nItems = esEmpresa ? entre(1, 3) : entre(1, 2);
      const menusElegidos = [...menus].sort(() => rnd() - 0.5).slice(0, nItems);

      const items: { menuDiaId: number; cantidad: number; precioUnit: number }[] = [];
      for (const m of menusElegidos) {
        const cantidad = esEmpresa ? entre(4, 12) : entre(1, 3);
        const vendido = vendidoPorMenu.get(m.id) ?? 0;
        if (vendido + cantidad > m.cupo) continue; // respeta el cupo publicado
        vendidoPorMenu.set(m.id, vendido + cantidad);
        items.push({
          menuDiaId: m.id,
          cantidad,
          precioUnit: esEmpresa ? m.precioEmpresa : m.precioIndividuo,
        });
      }
      if (items.length === 0) continue;
      const total = items.reduce((a, i) => a + i.cantidad * i.precioUnit, 0);

      // Estados realistas: los días pasados quedaron cerrados; los futuros, confirmados.
      let estado = "CONFIRMADO";
      let estadoPago = rnd() < 0.5 ? "PENDIENTE" : "INFORMADO";
      if (esPasado) {
        const suerte = rnd();
        estado = suerte < 0.82 ? "ENTREGADO" : suerte < 0.9 ? "NO_ENTREGADO" : "CANCELADO";
        estadoPago =
          estado === "CANCELADO" ? "PENDIENTE" : rnd() < 0.85 ? "CONFIRMADO" : "INFORMADO";
      }
      const metodoPago = rnd() < 0.6 ? "TRANSFERENCIA" : "EFECTIVO";

      const creado = new Date(fecha + "T00:00:00");
      creado.setDate(creado.getDate() - 1);
      creado.setHours(entre(8, 21), entre(0, 59));

      await db.pedido.create({
        data: {
          clienteId: cliente.id,
          fechaEntrega: fecha,
          estado,
          estadoPago,
          metodoPago,
          comprobante:
            metodoPago === "TRANSFERENCIA" && estadoPago !== "PENDIENTE"
              ? `TRF-${String(entre(100000, 999999))}`
              : null,
          total,
          direccion: cliente.direccion,
          piso: cliente.piso,
          zona: cliente.zona,
          observaciones:
            rnd() < 0.15
              ? elegir([
                  "Tocar timbre del portero.",
                  "Entregar en recepción.",
                  "Sin sal, por favor.",
                  "Dejar con el encargado.",
                ])
              : null,
          cadeteId: estado === "CONFIRMADO" ? null : cadetePorZona(cliente.zona),
          createdAt: creado,
          items: { create: items },
        },
      });
      totalPedidos++;
    }
  }

  console.log(`Listo: ${borrados.count} pedidos de prueba previos borrados.`);
  console.log(`Generados ${totalPedidos} pedidos entre ${DESDE} y ${HASTA} (${fechas.length} días hábiles).`);
  console.log(`Clientes de prueba: cliente1..${clientes.length}@test.brie.com (password brie1234).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
