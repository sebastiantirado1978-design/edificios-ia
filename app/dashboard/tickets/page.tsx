"use client";
import { useEffect, useState } from "react";

interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  resident?: { fullName: string; phone: string };
  unit?: { number: string };
}

const priorityColors: Record<string, string> = {
  urgente: "bg-red-100 text-red-700 border-red-200",
  alta: "bg-orange-100 text-orange-700 border-orange-200",
  media: "bg-yellow-100 text-yellow-700 border-yellow-200",
  baja: "bg-green-100 text-green-700 border-green-200",
};

const statusColors: Record<string, string> = {
  abierto: "bg-blue-100 text-blue-700",
  en_progreso: "bg-purple-100 text-purple-700",
  resuelto: "bg-green-100 text-green-700",
  cerrado: "bg-slate-100 text-slate-600",
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("abierto");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tickets?status=${filter}`)
      .then((r) => r.json())
      .then((data) => { setTickets(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tickets</h1>
          <p className="text-slate-500">Reclamos, solicitudes y mantenciones</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {["abierto", "en_progreso", "resuelto", "cerrado"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === s ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-12">Cargando tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center text-slate-400 py-12 bg-white rounded-xl border border-slate-200">
          No hay tickets {filter}s
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-slate-400">{ticket.ticketNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${priorityColors[ticket.priority] ?? ""}`}>
                      {ticket.priority}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[ticket.status] ?? ""}`}>
                      {ticket.status}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {ticket.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-1">{ticket.title}</h3>
                  <p className="text-sm text-slate-500 mb-2">{ticket.description.slice(0, 120)}...</p>
                  <p className="text-xs text-slate-400">
                    {ticket.resident?.fullName ?? "Residente"} {ticket.unit ? `• Dpto ${ticket.unit.number}` : ""}
                  </p>
                </div>
                <span className="text-xs text-slate-400 ml-4">
                  {new Date(ticket.createdAt).toLocaleDateString("es-CL")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
