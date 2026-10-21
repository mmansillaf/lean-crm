import React from "react";
import { Plus, MoreVertical, DollarSign, Calendar, ArrowRight } from "lucide-react";

export default function KanbanPage() {
  const stages = [
    {
      id: "lead",
      name: "Nuevo Lead",
      color: "border-blue-500",
      deals: [
        { id: "d1", title: "Clínica Dental San Borja", contact: "Dr. Carlos Mendoza", value: "$1,200", tag: "WhatsApp Meta" },
        { id: "d2", title: "Inmobiliaria Habita", contact: "Renato Farfán", value: "$3,500", tag: "Email Inbound" },
      ],
    },
    {
      id: "contacted",
      name: "Contactado",
      color: "border-amber-500",
      deals: [
        { id: "d3", title: "Estudio Contable Vargas", contact: "Lic. Miguel Vargas", value: "$800", tag: "WAHA Web" },
      ],
    },
    {
      id: "qualified",
      name: "Calificado (IA)",
      color: "border-purple-500",
      deals: [
        { id: "d4", title: "Dra. Valentina Ríos", contact: "+51 987 654 321", value: "$2,400", tag: "Hot Lead" },
      ],
    },
    {
      id: "won",
      name: "Cerrado Ganado",
      color: "border-emerald-500",
      deals: [
        { id: "d5", title: "Laboratorio Clínico Express", contact: "Eduardo Silva", value: "$5,000", tag: "Pagado Stripe" },
      ],
    },
  ];

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Embudo Comercial de Ventas</h1>
          <p className="text-xs text-slate-500">Gestión visual de oportunidades y avance por etapas con IA.</p>
        </div>

        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition">
          <Plus className="w-4 h-4" />
          <span>Nueva Oportunidad</span>
        </button>
      </div>

      {/* Columnas Kanban */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {stages.map((st) => (
          <div key={st.id} className="w-72 bg-slate-100/70 border border-slate-200/60 rounded-2xl flex flex-col flex-shrink-0">
            {/* Header de Columna */}
            <div className={`p-3.5 border-b border-slate-200/60 bg-white rounded-t-2xl border-t-4 ${st.color} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-800">{st.name}</span>
                <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                  {st.deals.length}
                </span>
              </div>
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </div>

            {/* Tarjetas */}
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {st.deals.map((deal) => (
                <div key={deal.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {deal.tag}
                    </span>
                    <span className="font-bold text-sm text-slate-900">{deal.value}</span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-800 leading-snug">{deal.title}</h3>
                  <p className="text-xs text-slate-500">{deal.contact}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Hoy</span>
                    </span>
                    <span className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5">
                      <span>Mover</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
