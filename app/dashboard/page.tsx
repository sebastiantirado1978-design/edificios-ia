"use client";
import { useEffect, useState } from "react";
import { Building2, Ticket, AlertTriangle, CreditCard, MessageSquare, ClipboardList, CheckCircle, Users } from "lucide-react";

interface Metrics {
  totalBuildings: number;
  totalResidents: number;
  openTickets: number;
  urgentTickets: number;
  resolvedToday: number;
  pendingPayments: number;
  overduePayments: number;
  openConversations: number;
  activeSurveys: number;
  recentTickets: Array<{
    id: string;
    ticketNumber: string;
    title: string;
    priority: string;
    status: string;
    category: string;
    createdAt: string;
    resident?: { fullName: string };
    unit?: { number: string };
  }>;
}

const priorityColors: Record<string, string> = {
  urgente: "bg-red-100 text-red-700",
  alta: "bg-orange-100 text-orange-700",
  media: "bg-yellow-100 text-yellow-700",
  baja: "bg-green-100 text-green-700",
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => { setMetrics(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Cargando métricas...</div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 capitalize">{today}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={<Building2 size={20} className="text-blue-600" />} label="Edificios activos" value={metrics?.totalBuildings ?? 0} bg="bg-blue-50" />
        <MetricCard icon={<Users size={20} className="text-violet-600" />} label="Residentes" value={metrics?.totalResidents ?? 0} bg="bg-violet-50" />
        <MetricCard icon={<Ticket size={20} className="text-orange-600" />} label="Tickets abiertos" value={metrics?.openTickets ?? 0} sub={metrics?.urgentTickets ? `${metrics.urgentTickets} urgentes` : undefined} bg="bg-orange-50" urgent={!!metrics?.urgentTickets} />
        <MetricCard icon={<CheckCircle size={20} className="text-green-600" />} label="Resueltos hoy" value={metrics?.resolvedToday ?? 0} bg="bg-green-50" />
        <MetricCard icon={<CreditCard size={20} className="text-red-600" />} label="Pagos pendientes" value={metrics?.pendingPayments ?? 0} bg="bg-red-50" />
        <MetricCard icon={<AlertTriangle size={20} className="text-red-700" />} label="Pagos atrasados" value={metrics?.overduePayments ?? 0} bg="bg-red-50" urgent={!!metrics?.overduePayments} />
        <MetricCard icon={<MessageSquare size={20} className="text-sky-600" />} label="Conversaciones" value={metrics?.openConversations ?? 0} bg="bg-sky-50" />
        <MetricCard icon={<ClipboardList size={20} className="text-teal-600" />} label="Encuestas activas" value={metrics?.activeSurveys ?? 0} bg="bg-teal-50" />
      </div>

      {/* Recent Tickets */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Tickets recientes</h2>
          <a href="/dashboard/tickets" className="text-blue-600 text-sm hover:underline">Ver todos →</a>
        </div>
        {!metrics?.recentTickets?.length ? (
          <div className="p-8 text-center text-slate-400">No hay tickets aún</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {metrics.recentTickets.map((ticket) => (
              <div key={ticket.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400">{ticket.ticketNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[ticket.priority] ?? "bg-slate-100 text-slate-600"}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{ticket.title}</p>
                  <p className="text-xs text-slate-400">
                    {ticket.resident?.fullName ?? "Residente"} {ticket.unit ? `• Dpto ${ticket.unit.number}` : ""}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(ticket.createdAt).toLocaleDateString("es-CL")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon, label, value, sub, bg, urgent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  bg: string;
  urgent?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border ${urgent ? "border-red-200" : "border-slate-200"} p-5`}>
      <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>{icon}</div>
      <div className={`text-3xl font-bold mb-1 ${urgent ? "text-red-600" : "text-slate-900"}`}>{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
      {sub && <div className="text-xs text-red-500 mt-1">{sub}</div>}
    </div>
  );
}
