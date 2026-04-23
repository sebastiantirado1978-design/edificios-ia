"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Ticket, Users, CreditCard, FileText, Megaphone, ClipboardList, MessageSquare, Settings, Bot } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Building2 },
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
  { href: "/dashboard/residents", label: "Residentes", icon: Users },
  { href: "/dashboard/payments", label: "Pagos", icon: CreditCard },
  { href: "/dashboard/documents", label: "Documentos", icon: FileText },
  { href: "/dashboard/announcements", label: "Comunicados", icon: Megaphone },
  { href: "/dashboard/surveys", label: "Encuestas", icon: ClipboardList },
  { href: "/dashboard/conversations", label: "Conversaciones", icon: MessageSquare },
  { href: "/dashboard/simulator", label: "Simulador IA", icon: Bot },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏢</span>
            <div>
              <h1 className="font-bold text-lg leading-tight">Edificios IA</h1>
              <p className="text-slate-400 text-xs">Panel Administrativo</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <p className="text-slate-500 text-xs text-center">CONSERJEPRO © 2025</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
