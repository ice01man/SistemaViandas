import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Reveal from "@/components/Reveal";
import { getSession } from "@/lib/auth";
import {
  IconSmartphone,
  IconClock,
  IconBike,
  IconCreditCard,
  IconPot,
  IconLeaf,
  IconSalad,
  IconStethoscope,
  IconBuilding,
  IconMapPin,
  IconMail,
  IconInstagram,
} from "@/components/icons";

const PASOS = [
  {
    icono: IconSmartphone,
    titulo: "Elegí tu vianda",
    texto: "Mirá el menú del día: opciones gourmet, vegetarianas y ensaladas, diseñadas por Lic. en Nutrición.",
  },
  {
    icono: IconClock,
    titulo: "Pedí hasta las 10 hs",
    texto: "Tomamos pedidos de lunes a viernes hasta las 10 de la mañana para entrega en el día.",
  },
  {
    icono: IconBike,
    titulo: "Recibila en tu puerta",
    texto: "Envíos sin cargo en Santa Fe Capital y alrededores, en envases aptos para microondas.",
  },
  {
    icono: IconCreditCard,
    titulo: "Pagá fácil",
    texto: "Efectivo o transferencia. Asociamos tu comprobante directamente a tu pedido.",
  },
];

const CATEGORIAS_HOME = [
  { icono: IconPot, nombre: "Gourmet", texto: "Platos elaborados con ingredientes frescos y de calidad." },
  { icono: IconLeaf, nombre: "Vegetariano", texto: "Opciones ricas en proteínas vegetales, pensadas por nutricionistas." },
  { icono: IconSalad, nombre: "Ensalada", texto: "Ensaladas completas, frescas y balanceadas para todos los días." },
];

export default async function Home() {
  const session = await getSession();
  const ctaHref = session ? "/pedir" : "/registro";

  return (
    <>
      <Navbar />
      <main className="flex-1 overflow-x-clip">
        {/* Hero */}
        <section className="-mt-16 bg-gradient-to-b from-brie-lavender-light to-brie-cream pt-16">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 py-14 md:flex-row md:py-24">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-extrabold text-brie-violet-deep md:text-5xl">
                Comé rico y saludable, <span className="text-brie-orange">sin cocinar</span>.
              </h1>
              <p className="mt-4 max-w-xl text-lg text-brie-violet-dark">
                Somos <span className="font-brand text-2xl text-brie-violet">Brie</span> — un equipo de
                Licenciados en Nutrición y cocineros que fusionamos el arte culinario con la ciencia de la
                nutrición. Viandas para hogares y empresas en Santa Fe Capital y alrededores.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
                <Link href={ctaHref} className="btn-orange px-6 py-3 text-base">
                  Pedir mi vianda
                </Link>
                <Link href="/menu" className="btn-outline px-6 py-3 text-base">
                  Ver el menú
                </Link>
              </div>
            </div>

            {/* Logo animado */}
            <div className="relative flex flex-1 items-center justify-center py-8">
              <div className="absolute h-56 w-56 rounded-full bg-brie-lavender/50 blur-3xl animate-pulse-soft md:h-72 md:w-72" />
              <div className="absolute h-64 w-64 rounded-full border-2 border-dashed border-brie-violet/40 animate-spin-slow md:h-80 md:w-80" />
              <div className="absolute h-64 w-64 md:h-80 md:w-80">
                <span className="absolute -top-4 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-surface text-brie-violet shadow-md ring-1 ring-brie-lavender">
                  <IconSalad className="h-5 w-5" />
                </span>
                <span className="absolute top-1/2 -right-4 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-brie-orange shadow-md ring-1 ring-brie-lavender">
                  <IconPot className="h-5 w-5" />
                </span>
                <span className="absolute -bottom-4 left-1/4 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-green-600 shadow-md ring-1 ring-brie-lavender">
                  <IconLeaf className="h-5 w-5" />
                </span>
              </div>
              <Image
                src="/logo_brie.png"
                alt="Brie · Servicio Gastronómico Integral"
                width={280}
                height={280}
                priority
                unoptimized
                className="relative h-48 w-48 animate-float drop-shadow-xl md:h-64 md:w-64"
              />
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <Reveal>
            <h2 className="text-center text-3xl font-extrabold text-brie-violet-deep">¿Cómo funciona?</h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PASOS.map(({ icono: Icono, titulo, texto }, i) => (
              <Reveal key={titulo} delay={i * 120}>
                <div className="card h-full text-center transition-transform duration-300 hover:-translate-y-1">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brie-lavender-light text-brie-violet">
                    <Icono className="h-7 w-7" />
                  </span>
                  <h3 className="mt-3 text-lg font-extrabold text-brie-violet-dark">{titulo}</h3>
                  <p className="mt-2 text-sm text-foreground/80">{texto}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Categorías */}
        <section className="bg-brie-lavender-soft">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <Reveal>
              <h2 className="text-center text-3xl font-extrabold text-brie-violet-deep">Tipos de menú</h2>
            </Reveal>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {CATEGORIAS_HOME.map(({ icono: Icono, nombre, texto }, i) => (
                <Reveal key={nombre} delay={i * 140}>
                  <div className="card h-full border-brie-lavender text-center transition-transform duration-300 hover:-translate-y-1">
                    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brie-lavender-light text-brie-violet">
                      <Icono className="h-9 w-9" />
                    </span>
                    <h3 className="mt-3 text-xl font-extrabold text-brie-violet">{nombre}</h3>
                    <p className="mt-2 text-sm text-foreground/80">{texto}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Nutrición + Empresas */}
        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-2">
          <Reveal>
            <div className="card h-full bg-gradient-to-br from-brie-solid to-brie-solid-dark p-8 text-white">
              <h3 className="flex items-center gap-3 text-2xl font-extrabold">
                <IconStethoscope className="h-7 w-7 shrink-0" /> Viandas para diferentes patologías
              </h3>
              <p className="mt-3 text-white/90">
                Preparamos viandas personalizadas para diabetes tipo 1 y 2, hipertensión, insuficiencia
                renal, divertículos, alergias alimentarias ¡y muchas opciones más! Diseñadas por Lic. en
                Nutrición.
              </p>
              <p className="mt-3 text-sm text-white/75">
                Estos menús requieren atención personalizada: contactanos y un profesional te acompaña.
              </p>
              <a
                href="mailto:brie.serviciosgastronomicos@gmail.com"
                className="btn mt-5 bg-white text-[#5d4e8e] hover:bg-white/85"
              >
                Consultar menú personalizado
              </a>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="card h-full bg-gradient-to-br from-brie-orange to-[#d96f24] p-8 text-white">
              <h3 className="flex items-center gap-3 text-2xl font-extrabold">
                <IconBuilding className="h-7 w-7 shrink-0" /> Empresas e instituciones
              </h3>
              <p className="mt-3 text-white/90">
                Servicio de viandas para empresas, instituciones, centros de día y jardines de infantes.
                Vianda individual o a granel, con adaptación de menús según patologías.
              </p>
              <p className="mt-3 text-sm text-white/75">
                Diseñamos la propuesta que mejor se adapte al servicio que estás buscando. ¡Invertí en tu
                equipo!
              </p>
              <a
                href="mailto:brie.serviciosgastronomicos@gmail.com"
                className="btn mt-5 bg-white text-[#d96f24] hover:bg-white/85"
              >
                Contactar por mi empresa
              </a>
            </div>
          </Reveal>
        </section>

        {/* Misión */}
        <section className="bg-brie-night text-center text-white">
          <div className="mx-auto max-w-3xl px-4 py-16">
            <Reveal>
              <span className="font-brand text-3xl text-brie-lavender">Nuestra misión</span>
              <p className="mt-4 text-lg text-white/90">
                Transformar la alimentación de empresas y personas, ofreciendo soluciones de alta calidad en
                el ámbito de la nutrición. Nos apasiona mejorar la calidad de vida de nuestros clientes y
                estamos comprometidos con hacerlo realidad todos los días.
              </p>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-brie-lavender-light bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center text-sm text-brie-violet-dark">
          <span className="font-brand text-3xl text-brie-violet">Brie</span>
          <p className="font-bold">Servicio Gastronómico Integral</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <IconMapPin className="h-4 w-4" /> Santa Fe Capital y alrededores
            </span>
            <a
              href="mailto:brie.serviciosgastronomicos@gmail.com"
              className="inline-flex items-center gap-1.5 hover:text-brie-violet"
            >
              <IconMail className="h-4 w-4" /> brie.serviciosgastronomicos@gmail.com
            </a>
            <span className="inline-flex items-center gap-1.5">
              <IconInstagram className="h-4 w-4" /> @brie.serviciosgastronomicos
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
