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
  { id: "lead", name: "Nuevo Lead", color: "border-blue-500", next: "contacted" },
  { id: "contacted", name: "Contactado", color: "border-amber-500", next: "qualified" },
  { id: "qualified", name: "Calificado (IA)", color: "border-purple-500", next: "won" },
  { id: "won", name: "Cerrado Ganado", color: "border-emerald-500", next: null },
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

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Embudo Comercial de Ventas</h1>
          <p className="text-xs text-slate-500">Gestión interactiva de oportunidades y avance por etapas con datos de PostgreSQL.</p>
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
            return (
              <div key={st.id} className="w-72 bg-slate-100/70 border border-slate-200/60 rounded-2xl flex flex-col flex-shrink-0">
                {/* Header de Columna */}
                <div className={`p-3.5 border-b border-slate-200/60 bg-white rounded-t-2xl border-t-4 ${st.color} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">{st.name}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                      {stageDeals.length}
                    </span>
                  </div>
                  <MoreVertical className="w-4 h-4 text-slate-400" />
                </div>

                {/* Tarjetas */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {stageDeals.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      Sin oportunidades en esta etapa
                    </div>
                  ) : (
                    stageDeals.map((deal) => {
                      const valueFormatted = (deal.valueCents / 100).toLocaleString("en-US", {
                        style: "currency",
                        currency: deal.currency || "USD",
                      });
                      const isUpdating = updatingId === deal.id;

                      return (
                        <div key={deal.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                              {deal.contactPhone || "WhatsApp"}
                            </span>
                            <span className="font-bold text-sm text-slate-900">{valueFormatted}</span>
                          </div>

                          <h3 className="font-bold text-sm text-slate-800 leading-snug">{deal.title}</h3>
                          <p className="text-xs text-slate-500">{deal.contactName || "Contacto sin nombre"}</p>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(deal.createdAt).toLocaleDateString()}</span>
                            </span>
                            {st.next && (
                              <button
                                onClick={() => handleAdvanceStage(deal.id, st.id)}
                                disabled={isUpdating}
                                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5 disabled:opacity-50"
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
