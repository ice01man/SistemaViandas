import type { Metadata } from "next";
import { Nunito, Pacifico } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const pacifico = Pacifico({
  variable: "--font-pacifico",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brie · Servicio Gastronómico Integral",
  description:
    "Viandas saludables diseñadas por Licenciados en Nutrición, para hogares y empresas. Pedí tu vianda del día en Santa Fe Capital y alrededores.",
  icons: {
    icon: [
      { url: "/logo_brie.ico", sizes: "any" },
      { url: "/logo_brie.png", type: "image/png" },
    ],
    shortcut: "/logo_brie.ico",
    apple: "/logo_brie.png",
  },
};

// Aplica el tema guardado (o el del sistema) antes del primer render para evitar parpadeo
const themeScript = `(function(){try{var t=localStorage.getItem('brie-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${nunito.variable} ${pacifico.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
