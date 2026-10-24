"use client";

import React, { useState, useEffect } from "react";
import { Mail, Plus, Send, Users, Eye, MousePointerClick, CheckCircle2, AlertCircle } from "lucide-react";

interface CampaignItem {
  id: string;
  name: string;
  channel: string;
  recipients: number;
  sent: number;
  opens: string;
  clicks: string;
  status: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [testEmail, setTestEmail] = useState("christian.mansilla@gmail.com");
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/crm/campaigns")
      .then((r) => r.json())
      .then((data) => {
        if (data.campaigns) setCampaigns(data.campaigns);
      })
      .catch(() => {});
  }, []);

  const handleSendTest = async (targetEmail: string) => {
    setSending(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/crm/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          message: "Prueba de campaña emitida desde el panel de Lean CRM hacia Listmonk (Contabo).",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(`✅ Correo de prueba enviado con éxito a ${targetEmail}`);
      } else {
        setStatusMessage(`❌ Error al enviar: ${data.error || "Fallo en el servicio"}`);
      }
    } catch {
      setStatusMessage("❌ Error de conexión");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Campañas y Difusión (Listmonk & WhatsApp)</h1>
          <p className="text-xs text-slate-500">Envío masivo segmentado y tracking de engagement omnicanal.</p>
        </div>

        {/* Panel de Envíos de Prueba Rápido */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
          <Mail className="w-4 h-4 text-purple-600" />
          <select
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none"
          >
            <option value="christian.mansilla@gmail.com">christian.mansilla@gmail.com</option>
            <option value="chris_serge@hotmail.com">chris_serge@hotmail.com</option>
            <option value="chris_serge@yahoo.com">chris_serge@yahoo.com</option>
          </select>
          <button
            onClick={() => handleSendTest(testEmail)}
            disabled={sending}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sending ? "Enviando..." : "Enviar Prueba"}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-800">
          {statusMessage}
        </div>
      )}

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
