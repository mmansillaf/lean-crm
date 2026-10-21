import React from "react";
import { BrainCircuit, Upload, Network, Database, Sparkles, CheckCircle2 } from "lucide-react";

export default function KnowledgePage() {
  const sources = [
    { id: "s1", name: "Tarifario y Planes Oficiales 2026.pdf", type: "PDF", entities: 18, relations: 34, status: "Listo" },
    { id: "s2", name: "Preguntas Frecuentes y Políticas de Devolución", type: "FAQ", entities: 12, relations: 21, status: "Listo" },
    { id: "s3", name: "Manual de Servicios Médicos y Procedimientos", type: "Texto", entities: 25, relations: 48, status: "Listo" },
  ];

  const graphSample = [
    { source: "Plan Pro", relation: "cuesta", target: "$100 USD/mes" },
    { source: "Plan Pro", relation: "incluye", target: "5 Agentes Humanos" },
    { source: "Plan Pro", relation: "incluye", target: "WhatsApp Dual Ilimitado" },
    { source: "Plan Anual", relation: "aplica_descuento", target: "15% de Ahorro" },
    { source: "Soporte 24/7", relation: "requiere", target: "Plan Enterprise" },
  ];

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Base de Conocimiento LightRAG</h1>
          <p className="text-xs text-slate-500">Grafo semántico relacional en PostgreSQL para respuestas sin alucinaciones.</p>
        </div>

        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition">
          <Upload className="w-4 h-4" />
          <span>Ingestar Documento</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Columna Izquierda: Fuentes de Conocimiento */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span>Fuentes Indexadas</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">3 archivos</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {sources.map((src) => (
              <div key={src.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50/40 transition flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900 truncate max-w-[200px]">{src.name}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">{src.type}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>{src.entities} Nodos · {src.relations} Aristas</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{src.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha: Explorador del Grafo Relacional */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Network className="w-4 h-4 text-purple-600" />
              <span>Grafo de Entidades y Conexiones Semánticas (LightRAG)</span>
            </h2>
            <span className="text-xs bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
              PostgreSQL WITH RECURSIVE
            </span>
          </div>

          {/* Visualizador de Aristas */}
          <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 p-4 overflow-y-auto space-y-2.5">
            {graphSample.map((edge, idx) => (
              <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {edge.source}
                  </span>
                  <span className="text-xs text-purple-600 font-mono font-semibold bg-purple-50 px-2 py-0.5 rounded">
                    ──[{edge.relation}]──►
                  </span>
                  <span className="font-semibold text-sm text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    {edge.target}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">1-hop</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
