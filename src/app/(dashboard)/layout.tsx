import React from "react";
import Link from "next/link";
import { MessageSquare, Columns3, BrainCircuit, Mail, Settings, ShieldCheck } from "lucide-react";
import { UserNav } from "@/components/UserNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800">
      {/* Sidebar Lateral */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between">
        <div>
          {/* Logo / Marca White-Label */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              L
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight block leading-tight">Lean CRM</span>
              <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">White-Label Edition</span>
            </div>
          </div>

          {/* Navegación */}
          <nav className="p-4 space-y-1">
            <Link
              href="/inbox"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition"
            >
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span>Inbox Omnicanal</span>
            </Link>

            <Link
              href="/kanban"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition"
            >
              <Columns3 className="w-4 h-4 text-slate-500" />
              <span>Embudo de Ventas</span>
            </Link>

            <Link
              href="/knowledge"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition"
            >
              <BrainCircuit className="w-4 h-4 text-slate-500" />
              <span>Conocimiento LightRAG</span>
            </Link>

            <Link
              href="/campaigns"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition"
            >
              <Mail className="w-4 h-4 text-slate-500" />
              <span>Campañas Listmonk</span>
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Configuración & Canales</span>
            </Link>
          </nav>
        </div>

        {/* Footer Sidebar con Sesión de Usuario */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Postgres + pgvector</span>
            </div>
            <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded">v0.1.0</span>
          </div>

          <UserNav />
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
