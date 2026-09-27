import { requireRol } from "@/lib/auth";
import AdminSidebar from "@/components/AdminSidebar";
import AdminMobileNav from "@/components/AdminMobileNav";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireRol("ADMIN");

  return (
    <div className="flex min-h-screen">
      <AdminSidebar nombre={session.nombre} />

      <div className="min-w-0 flex-1">
        {/* Barra superior con hamburguesa en mobile/tablet */}
        <AdminMobileNav nombre={session.nombre} />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
