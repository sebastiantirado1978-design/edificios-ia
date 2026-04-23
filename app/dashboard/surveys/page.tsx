"use client";
import { useEffect, useState } from "react";
import { BarChart2, Plus, Clock, CheckCircle, Users } from "lucide-react";

interface Survey {
  id: string;
  title: string;
  description: string | null;
  status: string;
  closesAt: string | null;
  building: { name: string } | null;
  _count?: { questions: number; responses: number };
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/surveys")
      .then((r) => r.json())
      .then((data) => { setSurveys(data.surveys ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    active: "text-emerald-400 bg-emerald-400/10",
    draft: "text-amber-400 bg-amber-400/10",
    closed: "text-slate-400 bg-slate-700",
  };
  const statusLabel: Record<string, string> = {
    active: "Activa",
    draft: "Borrador",
    closed: "Cerrada",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-teal-400" />
            Encuestas
          </h1>
          <p className="text-slate-400 text-sm mt-1">Consultas y votaciones para residentes</p>
        </div>
        <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Nueva Encuesta
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 text-center py-12">Cargando encuestas...</div>
      ) : surveys.length === 0 ? (
        <div className="text-center py-16">
          <BarChart2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-slate-300 text-lg font-medium mb-2">No hay encuestas</h2>
          <p className="text-slate-500 text-sm mb-6">Crea encuestas para consultar a los residentes sobre temas del edificio</p>
          <button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            + Crear Primera Encuesta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {surveys.map((s) => (
            <div key={s.id} className="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-teal-500 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 mr-3">
                  <h3 className="font-semibold text-slate-100">{s.title}</h3>
                  {s.building && (
                    <p className="text-slate-500 text-xs mt-0.5">{s.building.name}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusColor[s.status] ?? "text-slate-400 bg-slate-700"}`}>
                  {statusLabel[s.status] ?? s.status}
                </span>
              </div>

              {s.description && (
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{s.description}</p>
              )}

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-teal-400">{s._count?.questions ?? 0}</div>
                  <div className="text-xs text-slate-500">Preguntas</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-blue-400">{s._count?.responses ?? 0}</div>
                  <div className="text-xs text-slate-500">Respuestas</div>
                </div>
              </div>

              {s.closesAt && (
                <div className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                  <Clock className="w-3 h-3" />
                  Cierra {new Date(s.closesAt).toLocaleDateString("es-CL")}
                </div>
              )}

              <div className="flex gap-2">
                <button className="flex-1 text-center text-teal-400 hover:text-teal-300 text-sm border border-slate-700 hover:border-teal-500 py-2 rounded-lg transition-colors">
                  Ver resultados
                </button>
                {s.status === "draft" && (
                  <button className="text-sm bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-lg transition-colors">
                    Activar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
