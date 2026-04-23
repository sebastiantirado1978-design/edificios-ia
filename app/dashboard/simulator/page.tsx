"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, RefreshCw, Building2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  ts: string;
  intent?: string;
}

interface Building {
  id: string;
  name: string;
  commune: string;
}

export default function SimulatorPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("+56912345099");
  const [currentIntent, setCurrentIntent] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/buildings")
      .then((r) => r.json())
      .then((d) => {
        setBuildings(d.buildings ?? []);
        if (d.buildings?.length > 0) setSelectedBuilding(d.buildings[0].id);
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading || !selectedBuilding) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [
      ...m,
      { role: "user", content: userMsg, ts: new Date().toLocaleTimeString("es-CL") },
    ]);
    setLoading(true);

    try {
      const res = await fetch("/api/agent/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(-10).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content })),
          clientPhone: phone,
          isSimulator: true,
          intent: currentIntent,
          buildingId: selectedBuilding,
        }),
      });
      const data = await res.json();
      setCurrentIntent(data.intent);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.response ?? "Sin respuesta",
          ts: new Date().toLocaleTimeString("es-CL"),
          intent: data.intent,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Error al conectar con el agente.", ts: new Date().toLocaleTimeString("es-CL") },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages([]);
    setCurrentIntent(undefined);
  }

  const INTENT_COLORS: Record<string, string> = {
    ticket: "bg-amber-500/20 text-amber-400",
    pago: "bg-emerald-500/20 text-emerald-400",
    informacion: "bg-blue-500/20 text-blue-400",
    comunicado: "bg-purple-500/20 text-purple-400",
    encuesta: "bg-teal-500/20 text-teal-400",
    humano: "bg-red-500/20 text-red-400",
    error: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-800 bg-slate-900">
        <Bot className="w-6 h-6 text-blue-400" />
        <div className="flex-1">
          <h1 className="text-white font-bold text-base">Simulador de Agentes</h1>
          {currentIntent && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${INTENT_COLORS[currentIntent] ?? "bg-slate-700 text-slate-400"}`}>
              intent: {currentIntent}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Building selector */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <select
              value={selectedBuilding}
              onChange={(e) => { setSelectedBuilding(e.target.value); reset(); }}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          {/* Phone */}
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+56912345099"
            className="bg-slate-800 border border-slate-700 text-slate-400 text-xs rounded-lg px-3 py-1.5 w-36 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Selecciona un edificio y envía un mensaje para probar el agente</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["Hola, tengo una gotera", "¿Cuánto debo de GC?", "¿Cuál es el reglamento de mascotas?", "Quiero reportar ruidos"].map((s) => (
                <button key={s} onClick={() => setInput(s)} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-3 py-1.5 rounded-full transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm"
              }`}>
                {msg.content}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">{msg.ts}</span>
                {msg.intent && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${INTENT_COLORS[msg.intent] ?? "bg-slate-700 text-slate-400"}`}>
                    {msg.intent}
                  </span>
                )}
              </div>
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1 items-center h-4">
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-slate-800 bg-slate-900">
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={selectedBuilding ? "Escribe un mensaje como residente..." : "Selecciona un edificio primero"}
            disabled={!selectedBuilding || loading}
            className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || !selectedBuilding}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
