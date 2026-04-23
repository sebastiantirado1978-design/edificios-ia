"use client";
import { useEffect, useState } from "react";
import { Users, Search, Phone, Home, Shield, User } from "lucide-react";

interface Resident {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  active: boolean;
  registeredAt: string;
  unit: { number: string; floor: number } | null;
  building: { name: string } | null;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Propietario",
  tenant: "Arrendatario",
  admin: "Administrador",
  concierge: "Conserje",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "text-blue-400 bg-blue-400/10",
  tenant: "text-purple-400 bg-purple-400/10",
  admin: "text-amber-400 bg-amber-400/10",
  concierge: "text-emerald-400 bg-emerald-400/10",
};

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/residents")
      .then((r) => r.json())
      .then((data) => { setResidents(data.residents ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = residents.filter((r) =>
    r.fullName.toLowerCase().includes(search.toLowerCase()) ||
    r.phone.includes(search) ||
    r.unit?.number.includes(search) ||
    r.building?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-7 h-7 text-purple-400" />
            Residentes
          </h1>
          <p className="text-slate-400 text-sm mt-1">{residents.length} residentes registrados</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar residente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400 text-center py-12">Cargando residentes...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-slate-300 text-lg font-medium">
            {search ? "No se encontraron resultados" : "No hay residentes registrados"}
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            {search ? "Intenta otra búsqueda" : "Los residentes se registran automáticamente al escribir por WhatsApp"}
          </p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-700/50 text-xs uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Residente</th>
                <th className="px-4 py-3 text-left">Edificio / Unidad</th>
                <th className="px-4 py-3 text-left">Teléfono</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Desde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm font-medium text-slate-300">
                        {r.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-slate-200 font-medium">{r.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-300 text-sm">{r.building?.name ?? "—"}</div>
                    {r.unit && (
                      <div className="text-slate-500 text-xs flex items-center gap-1">
                        <Home className="w-3 h-3" />
                        Dpto {r.unit.number} · Piso {r.unit.floor}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-300 text-sm flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {r.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[r.role] ?? "text-slate-400 bg-slate-700"}`}>
                      {ROLE_LABELS[r.role] ?? r.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${r.active ? "text-emerald-400 bg-emerald-400/10" : "text-slate-500 bg-slate-700"}`}>
                      {r.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-sm">
                    {new Date(r.registeredAt).toLocaleDateString("es-CL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
