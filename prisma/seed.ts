import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function diasHabiles(cantidad: number): string[] {
  const out: string[] = [];
  const d = new Date();
  while (out.length < cantidad) {
    const dow = d.getDay();
    if (dow >= 1 && dow <= 5) out.push(toYMD(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

async function main() {
  const hash = await bcrypt.hash("brie1234", 10);

  // --- Usuarios ---
  await Promise.all([
    db.user.upsert({
      where: { email: "piccoli@brie.com" },
      update: {},
      create: { email: "piccoli@brie.com", password: hash, nombre: "Piccoli", rol: "ADMIN" },
    }),
    db.user.upsert({
      where: { email: "agus@brie.com" },
      update: {},
      create: { email: "agus@brie.com", password: hash, nombre: "Agus", rol: "ADMIN" },
    }),
    db.user.upsert({
      where: { email: "cocina@brie.com" },
      update: {},
      create: { email: "cocina@brie.com", password: hash, nombre: "Equipo Cocina", rol: "COCINA" },
    }),
    db.user.upsert({
      where: { email: "cadete.norte@brie.com" },
      update: {},
      create: {
        email: "cadete.norte@brie.com",
        password: hash,
        nombre: "Cadete Norte",
        rol: "DELIVERY",
        zona: "NORTE",
      },
    }),
    db.user.upsert({
      where: { email: "cadete.centro@brie.com" },
      update: { nombre: "Cadete Centro", zona: "CENTRO" },
      create: {
        email: "cadete.centro@brie.com",
        password: hash,
        nombre: "Cadete Centro",
        rol: "DELIVERY",
        zona: "CENTRO",
      },
    }),
    db.user.upsert({
      where: { email: "cadete.sur@brie.com" },
      update: { nombre: "Cadete Sur", zona: "SUR" },
      create: {
        email: "cadete.sur@brie.com",
        password: hash,
        nombre: "Cadete Sur",
        rol: "DELIVERY",
        zona: "SUR",
      },
    }),
  ]);

  const cliente1 = await db.user.upsert({
    where: { email: "cliente@demo.com" },
    update: {},
    create: {
      email: "cliente@demo.com",
      password: hash,
      nombre: "Marta García",
      telefono: "342-5551234",
      direccion: "San Martín 2456",
      piso: "3° B",
      zona: "NORTE",
      rol: "CLIENTE",
      grupo: "INDIVIDUO",
    },
  });

  const cliente2 = await db.user.upsert({
    where: { email: "empresa@demo.com" },
    update: {},
    create: {
      email: "empresa@demo.com",
      password: hash,
      nombre: "Sanatorio Santa Fe",
      telefono: "342-4570000",
      direccion: "San Jerónimo 3134",
      zona: "CENTRO",
      rol: "CLIENTE",
      grupo: "EMPRESA",
    },
  });

  // --- Config ---
  await db.config.upsert({
    where: { clave: "horaCorte" },
    update: {},
    create: { clave: "horaCorte", valor: "10:00" },
  });

  // --- Ingredientes ---
  const ingredientesData: [string, string, number, number][] = [
    ["Pollo", "KG", 25, 5],
    ["Carne vacuna", "KG", 18, 5],
    ["Merluza", "KG", 10, 3],
    ["Arroz", "KG", 30, 8],
    ["Fideos", "KG", 20, 5],
    ["Papa", "KG", 40, 10],
    ["Batata", "KG", 15, 5],
    ["Zanahoria", "KG", 12, 4],
    ["Zapallo", "KG", 14, 4],
    ["Lechuga", "UN", 30, 10],
    ["Tomate", "KG", 10, 3],
    ["Huevo", "UN", 120, 30],
    ["Queso cremoso", "KG", 8, 2],
    ["Lentejas", "KG", 12, 3],
    ["Garbanzos", "KG", 10, 3],
    ["Aceite", "L", 15, 4],
    ["Salsa de tomate", "L", 12, 3],
    ["Crema de leche", "L", 6, 2],
  ];

  const ingredientes: Record<string, number> = {};
  for (const [nombre, unidad, stock, min] of ingredientesData) {
    const existente = await db.ingrediente.findFirst({ where: { nombre } });
    const ing =
      existente ??
      (await db.ingrediente.create({
        data: { nombre, unidad, stock, stockMinimo: min },
      }));
    ingredientes[nombre] = ing.id;
  }

  // --- Viandas con recetas (cantidades por porción) ---
  const viandasData: {
    nombre: string;
    descripcion: string;
    categoria: string;
    receta: [string, number][];
  }[] = [
    {
      nombre: "Pollo grillé con puré de calabaza",
      descripcion: "Pechuga de pollo grillada con puré de zapallo y zanahorias glaseadas.",
      categoria: "GOURMET",
      receta: [
        ["Pollo", 0.25],
        ["Zapallo", 0.2],
        ["Zanahoria", 0.05],
        ["Aceite", 0.01],
      ],
    },
    {
      nombre: "Pastel de papa casero",
      descripcion: "Carne vacuna magra, puré de papa gratinado con queso cremoso.",
      categoria: "GOURMET",
      receta: [
        ["Carne vacuna", 0.2],
        ["Papa", 0.3],
        ["Queso cremoso", 0.05],
        ["Huevo", 0.5],
      ],
    },
    {
      nombre: "Merluza al horno con batatas",
      descripcion: "Filet de merluza al horno con batatas asadas y verduras.",
      categoria: "GOURMET",
      receta: [
        ["Merluza", 0.22],
        ["Batata", 0.25],
        ["Zanahoria", 0.05],
        ["Aceite", 0.01],
      ],
    },
    {
      nombre: "Guiso de lentejas",
      descripcion: "Lentejas con verduras de estación y arroz. Rico en proteínas vegetales.",
      categoria: "VEGETARIANO",
      receta: [
        ["Lentejas", 0.12],
        ["Arroz", 0.08],
        ["Zanahoria", 0.05],
        ["Salsa de tomate", 0.08],
      ],
    },
    {
      nombre: "Tortilla de papa y verduras",
      descripcion: "Tortilla de papa con huevos de campo y vegetales salteados.",
      categoria: "VEGETARIANO",
      receta: [
        ["Papa", 0.3],
        ["Huevo", 2],
        ["Aceite", 0.02],
      ],
    },
    {
      nombre: "Ensalada completa de garbanzos",
      descripcion: "Garbanzos, lechuga, tomate, huevo y zanahoria rallada.",
      categoria: "ENSALADA",
      receta: [
        ["Garbanzos", 0.1],
        ["Lechuga", 0.5],
        ["Tomate", 0.1],
        ["Huevo", 1],
        ["Zanahoria", 0.05],
      ],
    },
    {
      nombre: "Ensalada césar con pollo",
      descripcion: "Lechuga, pollo grillado, croutons y aderezo césar suave.",
      categoria: "ENSALADA",
      receta: [
        ["Pollo", 0.15],
        ["Lechuga", 0.5],
        ["Queso cremoso", 0.03],
        ["Crema de leche", 0.03],
      ],
    },
  ];

  const viandaIds: number[] = [];
  for (const v of viandasData) {
    let vianda = await db.vianda.findFirst({ where: { nombre: v.nombre } });
    if (!vianda) {
      vianda = await db.vianda.create({
        data: {
          nombre: v.nombre,
          descripcion: v.descripcion,
          categoria: v.categoria,
          receta: {
            create: v.receta.map(([ing, cant]) => ({
              ingredienteId: ingredientes[ing],
              cantidad: cant,
            })),
          },
        },
      });
    }
    viandaIds.push(vianda.id);
  }

  // --- Menú publicado para los próximos 5 días hábiles ---
  const fechas = diasHabiles(5);
  for (let i = 0; i < fechas.length; i++) {
    const fecha = fechas[i];
    // Rotación simple: 2 gourmet + 1 vegetariano + 1 ensalada por día
    const seleccion = [
      viandaIds[i % 3], // gourmet rotando
      viandaIds[(i + 1) % 3],
      viandaIds[3 + (i % 2)], // vegetariano
      viandaIds[5 + (i % 2)], // ensalada
    ];
    for (const viandaId of seleccion) {
      await db.menuDia.upsert({
        where: { fecha_viandaId: { fecha, viandaId } },
        update: {},
        create: {
          fecha,
          viandaId,
          cupo: 50,
          precioIndividuo: 6500,
          precioEmpresa: 5800,
        },
      });
    }
  }

  // --- Pedidos demo para hoy ---
  const fechaHoy = fechas[0];
  const menusHoy = await db.menuDia.findMany({ where: { fecha: fechaHoy } });
  const existentes = await db.pedido.count({ where: { fechaEntrega: fechaHoy } });
  if (existentes === 0 && menusHoy.length >= 2) {
    await db.pedido.create({
      data: {
        clienteId: cliente1.id,
        fechaEntrega: fechaHoy,
        estado: "CONFIRMADO",
        estadoPago: "INFORMADO",
        metodoPago: "TRANSFERENCIA",
        comprobante: "TRF-000123",
        total: menusHoy[0].precioIndividuo * 2,
        direccion: "San Martín 2456",
        piso: "3° B",
        zona: "NORTE",
        items: {
          create: [
            { menuDiaId: menusHoy[0].id, cantidad: 2, precioUnit: menusHoy[0].precioIndividuo },
          ],
        },
      },
    });
    await db.pedido.create({
      data: {
        clienteId: cliente2.id,
        fechaEntrega: fechaHoy,
        estado: "CONFIRMADO",
        estadoPago: "PENDIENTE",
        total: menusHoy[0].precioEmpresa * 10 + menusHoy[1].precioEmpresa * 5,
        direccion: "San Jerónimo 3134",
        zona: "CENTRO",
        observaciones: "Entregar en recepción antes de las 12hs.",
        items: {
          create: [
            { menuDiaId: menusHoy[0].id, cantidad: 10, precioUnit: menusHoy[0].precioEmpresa },
            { menuDiaId: menusHoy[1].id, cantidad: 5, precioUnit: menusHoy[1].precioEmpresa },
          ],
        },
      },
    });
  }

  console.log("Seed completado.");
  console.log("Usuarios (password para todos: brie1234):");
  console.log("  piccoli@brie.com / agus@brie.com -> ADMIN");
  console.log("  cocina@brie.com                -> COCINA");
  console.log("  cadete.norte@brie.com          -> DELIVERY (Norte)");
  console.log("  cadete.centro@brie.com         -> DELIVERY (Centro)");
  console.log("  cadete.sur@brie.com            -> DELIVERY (Sur)");
  console.log("  cliente@demo.com               -> CLIENTE individuo");
  console.log("  empresa@demo.com               -> CLIENTE empresa");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
