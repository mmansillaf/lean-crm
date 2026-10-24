"use client";

import React, { useState, useEffect } from "react";
import { Plus, MoreVertical, Calendar, ArrowRight, Loader2, RefreshCw } from "lucide-react";

interface DealItem {
  id: string;
  title: string;
  stageId: string;
  valueCents: number;
  currency: string;
  contactName: string | null;
  contactPhone: string | null;
  createdAt: string;
}

const STAGES = [
  { id: "lead", name: "1. Nuevos Leads", border: "border-blue-500", accent: "border-l-blue-500", textCol: "text-blue-600", pillCol: "bg-blue-100 text-blue-700", next: "contacted" },
  { id: "contacted", name: "2. Contactados", border: "border-amber-500", accent: "border-l-amber-500", textCol: "text-amber-600", pillCol: "bg-amber-100 text-amber-700", next: "qualified" },
  { id: "qualified", name: "3. Calificados (Link)", border: "border-purple-500", accent: "border-l-purple-500", textCol: "text-purple-600", pillCol: "bg-purple-100 text-purple-700", next: "won" },
  { id: "won", name: "4. Cerrado Ganado", border: "border-emerald-500", accent: "border-l-emerald-500", textCol: "text-emerald-600", pillCol: "bg-emerald-100 text-emerald-700", next: null },
];

export default function KanbanPage() {
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchDeals = async () => {
    try {
      const res = await fetch("/api/crm/deals");
      const data = await res.json();
      if (data.deals) {
        setDeals(data.deals);
      }
    } catch (err) {
      console.error("Error fetching deals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleAdvanceStage = async (dealId: string, currentStage: string) => {
    const stageObj = STAGES.find((s) => s.id === currentStage);
    if (!stageObj || !stageObj.next) return;

    setUpdatingId(dealId);
    try {
      const res = await fetch("/api/crm/deals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId, stageId: stageObj.next }),
      });
      if (res.ok) {
        setDeals((prev) =>
          prev.map((d) => (d.id === dealId ? { ...d, stageId: stageObj.next! } : d))
        );
      }
    } catch (err) {
      console.error("Error updating deal stage:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const totalPipelineCents = deals.reduce((sum, d) => sum + (d.valueCents || 0), 0);
  const totalPipelineFormatted = `S/ ${(totalPipelineCents / 100).toLocaleString("es-PE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} PEN`;

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">Embudo Comercial de Suscripciones</h1>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs px-2.5 py-1 rounded-full shadow-2xs">
              Total en Pipeline: {totalPipelineFormatted}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Gestión de oportunidades con calificación automática y totalizadores por etapa.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setLoading(true);
              fetchDeals();
            }}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {/* Columnas Kanban */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-sm">Cargando oportunidades del CRM...</span>
        </div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((st) => {
            const stageDeals = deals.filter((d) => d.stageId === st.id);
            const stageTotalCents = stageDeals.reduce((sum, d) => sum + (d.valueCents || 0), 0);
            const stageTotalFormatted = `S/ ${(stageTotalCents / 100).toLocaleString("es-PE", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })} PEN`;

            return (
              <div key={st.id} className="w-72 bg-slate-100/70 border border-slate-200/60 rounded-2xl flex flex-col flex-shrink-0">
                {/* Header de Columna */}
                <div className={`p-3.5 border-b border-slate-200/60 bg-white rounded-t-2xl border-t-4 ${st.border} flex items-center justify-between`}>
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">{st.name}</span>
                    <span className={`text-[11px] font-bold ${st.textCol} block mt-0.5`}>
                      {stageTotalFormatted}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.pillCol}`}>
                    {stageDeals.length}
                  </span>
                </div>

                {/* Tarjetas */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {stageDeals.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      Sin oportunidades en esta etapa
                    </div>
                  ) : (
                    stageDeals.map((deal) => {
                      const isSoles = !deal.currency || deal.currency === "PEN" || deal.currency === "SOL";
                      const valueFormatted = isSoles
                        ? `S/ ${(deal.valueCents / 100).toLocaleString("es-PE", { minimumFractionDigits: 0 })} PEN`
                        : (deal.valueCents / 100).toLocaleString("en-US", {
                            style: "currency",
                            currency: deal.currency || "USD",
                          });

                      const planType =
                        deal.valueCents === 25000 || deal.title.toLowerCase().includes("6 m")
                          ? "6 Meses"
                          : deal.valueCents === 45000 || deal.title.toLowerCase().includes("1 a") || deal.title.toLowerCase().includes("anual")
                          ? "1 Año"
                          : "Suscripción";

                      const isUpdating = updatingId === deal.id;

                      return (
                        <div
                          key={deal.id}
                          className={`bg-white p-3.5 rounded-xl border border-slate-200 ${st.accent} border-l-4 shadow-2xs hover:shadow-sm transition flex flex-col gap-2`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                              {deal.contactPhone || "WhatsApp"}
                            </span>
                            <span className="font-bold text-xs text-slate-900">{valueFormatted}</span>
                          </div>

                          <h3 className="font-bold text-xs text-slate-800 leading-snug">{deal.title}</h3>
                          <p className="text-[11px] text-slate-500 truncate">{deal.contactName || "Contacto sin nombre"}</p>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>{new Date(deal.createdAt).toLocaleDateString()}</span>
                              </span>
                              <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium">
                                {planType}
                              </span>
                            </div>

                            {st.next && (
                              <button
                                onClick={() => handleAdvanceStage(deal.id, st.id)}
                                disabled={isUpdating}
                                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5 disabled:opacity-50 text-xs"
                              >
                                {isUpdating ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>
                                    <span>Avanzar</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
