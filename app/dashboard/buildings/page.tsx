"use client";
import { useEffect, useState } from "react";
import { Building2, Plus, MapPin, Phone, Mail, Users, CheckCircle, XCircle } from "lucide-react";

interface Building {
  id: string;
  name: string;
  address: string;
  commune: string;
  city: string;
  totalUnits: number;
  adminPhone: string | null;
  adminEmail: string | null;
  active: boolean;
  whatsappPhoneId: string | null;
  _count?: { residents: number; tickets: number };
}

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/buildings")
      .then((r) => r.json())
      .then((data) => { setBuildings(data.buildings ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-400" />
            Edificios
          </h1>
          <p className="text-slate-400 text-sm mt-1">Administración de edificios registrados</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Nuevo Edificio
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 text-center py-12">Cargando edificios...</div>
      ) : buildings.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-slate-300 text-lg font-medium mb-2">No hay edificios registrados</h2>
          <p className="text-slate-500 text-sm mb-6">Agrega tu primer edificio para comenzar</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            + Agregar Edificio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {buildings.map((b) => (
            <div key={b.id} className="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-blue-500 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-100 text-lg">{b.name}</h3>
                  <p className="text-slate-400 text-sm flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {b.address}, {b.commune}
                  </p>
                </div>
                {b.active ? (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs bg-emerald-400/10 px-2 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Activo
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-500 text-xs bg-slate-700 px-2 py-1 rounded-full">
                    <XCircle className="w-3 h-3" /> Inactivo
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-slate-700/50 rounded-lg p-2">
                  <div className="text-lg font-bold text-blue-400">{b.totalUnits}</div>
                  <div className="text-xs text-slate-500">Unidades</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-2">
                  <div className="text-lg font-bold text-purple-400">{b._count?.residents ?? 0}</div>
                  <div className="text-xs text-slate-500">Residentes</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-2">
                  <div className="text-lg font-bold text-amber-400">{b._count?.tickets ?? 0}</div>
                  <div className="text-xs text-slate-500">Tickets</div>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                {b.adminPhone && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                    {b.adminPhone}
                  </div>
                )}
                {b.adminEmail && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                    {b.adminEmail}
                  </div>
                )}
                {b.whatsappPhoneId && (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <span className="text-xs">📱 WhatsApp conectado</span>
                  </div>
                )}
              </div>

              <button className="mt-4 w-full text-center text-blue-400 hover:text-blue-300 text-sm border border-slate-700 hover:border-blue-500 py-2 rounded-lg transition-colors">
                Ver detalles →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
