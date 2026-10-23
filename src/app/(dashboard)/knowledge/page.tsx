"use client";

import React, { useState, useEffect } from "react";
import { Upload, Network, Database, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

interface KnowledgeSourceItem {
  id: string;
  name: string;
  sourceType: string;
  status: string;
  createdAt: string;
}

interface KnowledgeRelationItem {
  id: string;
  relationType: string;
  description: string;
  sourceName: string;
  targetName: string;
}

interface KnowledgeStats {
  totalSources: number;
  totalEntities: number;
  totalRelations: number;
}

export default function KnowledgePage() {
  const [sources, setSources] = useState<KnowledgeSourceItem[]>([]);
  const [relations, setRelations] = useState<KnowledgeRelationItem[]>([]);
  const [stats, setStats] = useState<KnowledgeStats>({ totalSources: 0, totalEntities: 0, totalRelations: 0 });
  const [loading, setLoading] = useState(true);

  const fetchKnowledge = async () => {
    try {
      const res = await fetch("/api/crm/knowledge");
      const data = await res.json();
      if (data.sources) setSources(data.sources);
      if (data.relations) setRelations(data.relations);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error("Error fetching knowledge:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Base de Conocimiento LightRAG</h1>
          <p className="text-xs text-slate-500">Grafo semántico relacional en PostgreSQL para respuestas sin alucinaciones.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setLoading(true);
              fetchKnowledge();
            }}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-sm">Cargando grafo de conocimiento...</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6 flex-1 overflow-hidden">
          {/* Columna Izquierda: Fuentes de Conocimiento */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span>Fuentes Indexadas</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">{stats.totalSources} fuentes</span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {sources.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">Sin fuentes indexadas</div>
              ) : (
                sources.map((src) => (
                  <div key={src.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50/40 transition flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900 truncate max-w-[200px]">{src.name}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono uppercase">{src.sourceType}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>{new Date(src.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{src.status}</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Columna Derecha: Explorador del Grafo Relacional */}
          <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-purple-600" />
                <h2 className="font-bold text-sm text-slate-800">Grafo de Entidades y Conexiones Semánticas</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
                  {stats.totalEntities} Nodos
                </span>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
                  {stats.totalRelations} Aristas
                </span>
              </div>
            </div>

            {/* Visualizador de Aristas */}
            <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 p-4 overflow-y-auto space-y-2.5">
              {relations.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">Sin relaciones en el grafo</div>
              ) : (
                relations.map((edge) => (
                  <div key={edge.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-xs text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {edge.sourceName}
                      </span>
                      <span className="text-[11px] text-purple-600 font-mono font-semibold bg-purple-50 px-2 py-0.5 rounded">
                        ──[{edge.relationType}]──►
                      </span>
                      <span className="font-semibold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        {edge.targetName}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]" title={edge.description}>
                      {edge.description}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
