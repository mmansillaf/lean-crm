import React from "react";
import { Mail, Plus, Send, Users, Eye, MousePointerClick } from "lucide-react";

export default function CampaignsPage() {
  const campaigns = [
    { id: "cmp1", name: "Lanzamiento Tratamientos 2026", channel: "Email (Listmonk)", recipients: 450, sent: 450, opens: "42%", clicks: "18%", status: "Completada" },
    { id: "cmp2", name: "Recordatorio de Cita Médica Masivo", channel: "WhatsApp Broadcast", recipients: 120, sent: 120, opens: "98%", clicks: "35%", status: "Completada" },
    { id: "cmp3", name: "Promoción Black Friday Clínica", channel: "Email (Listmonk)", recipients: 1200, sent: 0, opens: "—", clicks: "—", status: "Borrador" },
  ];

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Campañas y Difusión (Listmonk & WhatsApp)</h1>
          <p className="text-xs text-slate-500">Envío masivo segmentado y tracking de engagement omnicanal.</p>
        </div>

        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition">
          <Plus className="w-4 h-4" />
          <span>Nueva Campaña</span>
        </button>
      </div>

      {/* Tabla de Campañas */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="p-4">Nombre de Campaña</th>
              <th className="p-4">Canal</th>
              <th className="p-4">Destinatarios</th>
              <th className="p-4">Tasa de Apertura</th>
              <th className="p-4">Tasa de Clics</th>
              <th className="p-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {campaigns.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/60 transition">
                <td className="p-4 font-semibold text-slate-900">{c.name}</td>
                <td className="p-4">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono text-[11px]">
                    {c.channel}
                  </span>
                </td>
                <td className="p-4 flex items-center gap-1.5 pt-4.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.recipients}</span>
                </td>
                <td className="p-4">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                    <span>{c.opens}</span>
                  </span>
                </td>
                <td className="p-4">
                  <span className="flex items-center gap-1 text-slate-600">
                    <MousePointerClick className="w-3.5 h-3.5 text-purple-500" />
                    <span>{c.clicks}</span>
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      c.status === "Completada" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
