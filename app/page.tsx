import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
      <div className="text-center text-white max-w-2xl">
        <div className="text-8xl mb-6">🏢</div>
        <h1 className="text-5xl font-bold mb-3">Edificios IA</h1>
        <p className="text-slate-400 text-xl mb-2">Gestión inteligente de edificios residenciales</p>
        <p className="text-slate-500 text-base mb-10">WhatsApp AI para conserjes, administradores y residentes</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors">
            Dashboard Admin →
          </Link>
          <Link href="/dashboard/tickets" className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors">
            Ver Tickets
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-400">
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-2xl mb-2">🎫</div>
            <div>Sistema de Tickets</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-2xl mb-2">💳</div>
            <div>Gastos Comunes</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-2xl mb-2">📋</div>
            <div>Asambleas</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-2xl mb-2">📊</div>
            <div>Encuestas</div>
          </div>
        </div>
      </div>
    </main>
  );
}
