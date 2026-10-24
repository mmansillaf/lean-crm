"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Network,
  Database,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Trash2,
  AlertTriangle,
  FileText,
  MessageSquare,
  Send,
  X,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Search,
  Bot,
  Zap,
} from "lucide-react";

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

interface ChatHit {
  entity: string;
  type: string;
  description: string;
  score: number;
}

interface ChatRelation {
  from: string;
  path: string;
  to: string;
  detail: string;
}

interface TestChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  hits?: ChatHit[];
  relations?: ChatRelation[];
  latencyMs?: number;
  timestamp: string;
}

export default function KnowledgePage() {
  const [sources, setSources] = useState<KnowledgeSourceItem[]>([]);
  const [relations, setRelations] = useState<KnowledgeRelationItem[]>([]);
  const [stats, setStats] = useState<KnowledgeStats>({ totalSources: 0, totalEntities: 0, totalRelations: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados del Chat Buscador / Verificador (Drawer)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [chatMode, setChatMode] = useState<"agent" | "search">("agent");
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatMessages, setChatMessages] = useState<TestChatMessage[]>([
    {
      id: "initial_welcome",
      role: "assistant",
      content:
        "👋 ¡Hola! Soy el simulador del motor RAG de Algoritmo Jurídico. Escribe una pregunta para comprobar qué información responde el bot y qué nodos semánticos recupera del grafo.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const chatBottomRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (isDrawerOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isDrawerOpen]);

  // Subir e ingestar documento (PDF o Texto)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/crm/knowledge", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(`Error al ingestar documento: ${errorData.error || "Fallo en el servidor"}`);
      } else {
        await fetchKnowledge();
      }
    } catch (err) {
      console.error("Error al subir archivo:", err);
      alert("Error de red al procesar el archivo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Eliminar una fuente específica
  const handleDeleteSource = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar la fuente "${name}"?\nSus entidades, vectores y relaciones asociadas se borrarán en cascada.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/crm/knowledge?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchKnowledge();
      } else {
        const errorData = await res.json();
        alert(`Error al eliminar: ${errorData.error}`);
      }
    } catch (err) {
      console.error("Error al eliminar fuente:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Reset total de la base de conocimiento
  const handleResetKB = async () => {
    if (!window.confirm("⚠️ ¿Estás seguro de que deseas vaciar TODA la base de conocimiento?\nSe eliminarán todas las fuentes, entidades y relaciones del grafo. Esta acción no se puede deshacer.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/crm/knowledge?reset=true", {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchKnowledge();
      } else {
        const errorData = await res.json();
        alert(`Error al resetear base de conocimiento: ${errorData.error}`);
      }
    } catch (err) {
      console.error("Error al resetear:", err);
    } finally {
      setLoading(false);
    }
  };

  // Enviar consulta de prueba al Chat Verificador
  const handleSendTestQuery = async (queryText: string) => {
    const q = queryText.trim();
    if (!q || chatSending) return;

    const userMsg: TestChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatSending(true);

    try {
      const res = await fetch("/api/crm/knowledge/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, mode: chatMode }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: TestChatMessage = {
          id: `asst_${Date.now()}`,
          role: "assistant",
          content:
            chatMode === "search"
              ? data.hits?.length > 0
                ? `🔍 Se encontraron ${data.hits.length} entidades coincidentes en el grafo vectorial.`
                : "No se encontraron entidades coincidentes para esta consulta con el umbral actual."
              : data.answer || "(Sin respuesta generada)",
          hits: data.hits || [],
          relations: data.relations || [],
          latencyMs: data.latencyMs,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setChatMessages((prev) => [...prev, assistantMsg]);
        // Expandir detalles automáticamente en modo búsqueda
        if (chatMode === "search") {
          setExpandedDetails((prev) => ({ ...prev, [assistantMsg.id]: true }));
        }
      } else {
        const errJson = await res.json();
        setChatMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: "assistant",
            content: `❌ Error al consultar motor RAG: ${errJson.error || "Fallo interno"}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (err) {
      console.error("Error en test query:", err);
    } finally {
      setChatSending(false);
    }
  };

  const toggleDetails = (msgId: string) => {
    setExpandedDetails((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const sampleQuestions = [
    "¿Qué planes y suscripciones tienen?",
    "Sentencias de amparo del Tribunal Constitucional",
    "Quiero pagar la suscripción de 6 meses",
    "¿Qué jurisprudencia tienen de SUNAT?",
  ];

  return (
    <div className="h-full flex flex-col p-6 space-y-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Base de Conocimiento LightRAG</h1>
          <p className="text-xs text-slate-500">Grafo semántico relacional en PostgreSQL para respuestas sin alucinaciones.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón para Abrir el Chat Buscador / Verificador */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Probar Chat RAG</span>
          </button>

          {/* Input oculto para subida de archivos */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.txt,.md"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Ingestando Grafo con IA...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Ingestar PDF / Archivo</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setLoading(true);
              fetchKnowledge();
            }}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition"
            title="Refrescar vista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refrescar</span>
          </button>

          {sources.length > 0 && (
            <button
              onClick={handleResetKB}
              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 rounded-xl text-xs font-semibold transition"
              title="Vaciar todo el grafo"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Total</span>
            </button>
          )}
        </div>
      </div>

      {uploading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-center gap-3 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 flex-shrink-0" />
          <div>
            <p className="font-semibold">Extrayendo Grafo de Conocimiento e Indexando Vectores...</p>
            <p className="text-[11px] text-blue-600">El modelo LLM está analizando entidades, relaciones y generando embeddings L2.</p>
          </div>
        </div>
      )}

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
                <div className="text-center py-12 text-xs text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>Sin fuentes indexadas en el grafo.</p>
                  <p className="text-[11px] text-slate-400">Haz clic en <strong>Ingestar PDF</strong> para agregar contenido.</p>
                </div>
              ) : (
                sources.map((src) => (
                  <div key={src.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50/40 transition flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900 truncate max-w-[180px]" title={src.name}>{src.name}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono uppercase">{src.sourceType}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{src.status}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">{new Date(src.createdAt).toLocaleDateString()}</span>
                        <button
                          onClick={() => handleDeleteSource(src.id, src.name)}
                          disabled={deletingId === src.id}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                          title="Eliminar fuente y sus nodos en cascada"
                        >
                          {deletingId === src.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
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
                <div className="text-center py-12 text-xs text-slate-400">Sin relaciones en el grafo</div>
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

      {/* DRAWER / SLIDE-OVER: Chat Buscador & Verificador RAG */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop oscurecedor */}
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Panel Lateral */}
          <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full border-l border-slate-200 z-10 animate-in slide-in-from-right duration-200">
            {/* Header del Drawer */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Verificador RAG en Vivo</h3>
                  <p className="text-[11px] text-slate-500">Prueba respuestas y audita nodos sin alterar el CRM.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setChatMessages([
                      {
                        id: `reset_${Date.now()}`,
                        role: "assistant",
                        content: "Historial limpiado. Puedes ingresar una nueva consulta de prueba.",
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      },
                    ])
                  }
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition"
                  title="Limpiar chat de prueba"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition"
                  title="Cerrar panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Selector de Modo: Agente vs Búsqueda Pura */}
            <div className="px-4 py-2.5 bg-slate-100/60 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Modo de Verificación:</span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setChatMode("agent")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                    chatMode === "agent" ? "bg-purple-600 text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Bot className="w-3 h-3" />
                  <span>Agente Ventas</span>
                </button>
                <button
                  onClick={() => setChatMode("search")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                    chatMode === "search" ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Search className="w-3 h-3" />
                  <span>Búsqueda Pura</span>
                </button>
              </div>
            </div>

            {/* Lista de Mensajes del Chat */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
              {chatMessages.map((msg) => {
                const isUser = msg.role === "user";
                const isExpanded = expandedDetails[msg.id];
                const hasHits = msg.hits && msg.hits.length > 0;

                return (
                  <div key={msg.id} className={`flex flex-col ${isUser ? "items-end ml-auto" : "items-start"} max-w-[92%]`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed shadow-xs ${
                        isUser
                          ? "bg-purple-600 text-white rounded-tr-xs"
                          : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                      }`}
                    >
                      {!isUser && (
                        <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-100 text-[10px] text-purple-700 font-semibold">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {chatMode === "agent" ? "Respuesta Agente IA" : "Motor LightRAG"}
                          </span>
                          {msg.latencyMs && (
                            <span className="flex items-center gap-0.5 text-slate-400 font-mono">
                              <Zap className="w-2.5 h-2.5 text-amber-500" />
                              {(msg.latencyMs / 1000).toFixed(2)}s
                            </span>
                          )}
                        </div>
                      )}

                      {msg.content}

                      {/* Botón desplegable para inspeccionar nodos recuperados */}
                      {!isUser && hasHits && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => toggleDetails(msg.id)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-800 transition"
                          >
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            <span>{msg.hits?.length} nodos recuperados del grafo</span>
                          </button>

                          {isExpanded && (
                            <div className="mt-2 space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px]">
                              {msg.hits?.map((h, i) => (
                                <div key={i} className="p-2 bg-white rounded-lg border border-slate-100 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-800">{h.entity}</span>
                                    <span className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono font-semibold">
                                      {h.type}
                                    </span>
                                  </div>
                                  <p className="text-slate-500 text-[10px] leading-tight">{h.description}</p>
                                </div>
                              ))}

                              {msg.relations && msg.relations.length > 0 && (
                                <div className="pt-1.5 border-t border-slate-200 space-y-1">
                                  <span className="font-semibold text-slate-700 text-[10px] block">Relaciones enlazadas:</span>
                                  {msg.relations.map((rel, ri) => (
                                    <div key={ri} className="text-[10px] text-slate-600 bg-white p-1.5 rounded border border-slate-100">
                                      <span className="font-bold">{rel.from}</span>
                                      <span className="text-purple-600 font-mono mx-1 font-semibold">──[{rel.path}]──►</span>
                                      <span className="font-bold text-emerald-700">{rel.to}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                );
              })}
              {chatSending && (
                <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl w-fit text-xs text-slate-500 shadow-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                  <span>Consultando grafo y generando respuesta...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Preguntas Sugeridas de Prueba Rápida */}
            <div className="p-3 bg-white border-t border-slate-200 space-y-1.5">
              <span className="text-[10px] text-slate-400 font-semibold block">Preguntas de prueba sugeridas:</span>
              <div className="flex flex-wrap gap-1.5">
                {sampleQuestions.map((sq, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendTestQuery(sq)}
                    className="text-[10px] bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 px-2 py-1 rounded-lg border border-slate-200 transition text-left"
                  >
                    {sq}
                  </button>
                ))}
              </div>
            </div>

            {/* Input y Botón de Envío */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendTestQuery(chatInput);
              }}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={chatMode === "agent" ? "Haz una pregunta para probar el agente..." : "Buscar nodos en el grafo..."}
                className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={chatSending || !chatInput.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-2 rounded-xl shadow-xs transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
