"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Phone, Mail, Bot, User, CheckCheck, Send, Sparkles, Radio, Ban } from "lucide-react";

interface ConversationItem {
  id: string;
  contactId: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  channel: string;
  status: "bot" | "human" | "closed" | "blocked";
  isBlocked?: boolean;
  metadata?: Record<string, any> | null;
  lastMessage: string | null;
  updatedAt: string;
}

interface MessageItem {
  id: string;
  senderType: "customer" | "ai" | "human" | "agent";
  content: string;
  status: string;
  createdAt: string;
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [sending, setSending] = useState(false);
  const [isSseConnected, setIsSseConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Cargar lista de conversaciones
  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/crm/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (!selectedConvId && data.conversations?.length > 0) {
          setSelectedConvId(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error("Error al cargar conversaciones:", err);
    } finally {
      setLoadingConvs(false);
    }
  };

  // 2. Cargar mensajes de la conversación activa
  const fetchMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/crm/messages?conversationId=${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Error al cargar mensajes:", err);
    }
  };

  // Carga inicial de conversaciones
  useEffect(() => {
    fetchConversations();
  }, []);

  // Cargar mensajes cuando cambia la conversación activa
  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);
    }
  }, [selectedConvId]);

  // Conexión Server-Sent Events (SSE) en tiempo real con fallback resiliente
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    try {
      eventSource = new EventSource("/api/crm/events");

      eventSource.addEventListener("connected", () => {
        setIsSseConnected(true);
      });

      eventSource.addEventListener("update", (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          // Refrescar lista de conversaciones
          fetchConversations();

          // Si el evento corresponde a la conversación abierta actualmente, refrescar hilo
          if (selectedConvId && (!payload.conversationId || payload.conversationId === selectedConvId)) {
            fetchMessages(selectedConvId);
          }
        } catch (err) {
          console.error("Error procesando evento SSE:", err);
        }
      });

      eventSource.onerror = () => {
        setIsSseConnected(false);
      };
    } catch {
      setIsSseConnected(false);
    }

    // Polling de respaldo preventivo cada 15s si SSE no está conectado o ante pérdida de paquetes
    fallbackInterval = setInterval(() => {
      fetchConversations();
      if (selectedConvId) {
        fetchMessages(selectedConvId);
      }
    }, 15000);

    return () => {
      if (eventSource) eventSource.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConv = conversations.find((c) => c.id === selectedConvId);

  // Enviar mensaje como operador
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConvId || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/crm/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedConvId, content: inputText }),
      });

      if (res.ok) {
        setInputText("");
        await fetchMessages(selectedConvId);
        await fetchConversations();
      }
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
    } finally {
      setSending(false);
    }
  };

  // Alternar Handoff (IA vs Humano)
  const toggleHandoff = async () => {
    if (!activeConv) return;
    const newStatus = activeConv.status === "bot" ? "human" : "bot";
    try {
      const res = await fetch("/api/crm/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConv.id, status: newStatus }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConv.id ? { ...c, status: newStatus } : c))
        );
      }
    } catch (err) {
      console.error("Error al cambiar handoff:", err);
    }
  };

  // Alternar Bloqueo de Contacto (Lista Negra)
  const toggleBlockContact = async () => {
    if (!activeConv) return;
    const isCurrentlyBlocked = activeConv.status === "blocked" || activeConv.isBlocked;
    const confirmMsg = isCurrentlyBlocked
      ? "¿Deseas desbloquear este contacto para volver a recibir sus mensajes y permitir que el bot responda?"
      : "¿Deseas bloquear a este remitente? El bot no responderá y sus mensajes serán descartados automáticamente.";

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/crm/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConv.id,
          action: isCurrentlyBlocked ? "unblock" : "block",
        }),
      });

      if (res.ok) {
        await fetchConversations();
        await fetchMessages(activeConv.id);
      }
    } catch (err) {
      console.error("Error al cambiar bloqueo de contacto:", err);
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Columna Izquierda: Lista de Conversaciones */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-800 text-lg">Bandeja de Entrada</h1>
              <span
                title={isSseConnected ? "Sincronización en tiempo real vía SSE" : "Modo sondeo de respaldo"}
                className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isSseConnected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                <Radio className={`w-3 h-3 ${isSseConnected ? "animate-pulse text-emerald-600" : "text-amber-500"}`} />
                <span>{isSseConnected ? "Live SSE" : "Polling"}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Mensajería omnicanal en vivo</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
            {conversations.length} {conversations.length === 1 ? "chat" : "chats"}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {loadingConvs && conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">Cargando chats...</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No hay mensajes todavía.</p>
              <p className="text-[10px]">Envía un mensaje de prueba a tu número de WhatsApp.</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              const title = conv.contactName || conv.phone || "Contacto Desconocido";
              const time = new Date(conv.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`p-4 hover:bg-slate-50 cursor-pointer transition flex flex-col gap-1.5 ${
                    isSelected ? "bg-blue-50/60 border-l-4 border-blue-600" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {conv.channel === "whatsapp" ? (
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      <span className="font-semibold text-sm text-slate-900 truncate max-w-[140px]">{title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{time}</span>
                  </div>

                  <p className="text-xs text-slate-500 truncate">{conv.lastMessage || "(Sin contenido de texto)"}</p>

                  <div className="flex items-center justify-between pt-1">
                    {conv.status === "blocked" || conv.isBlocked ? (
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-700 flex items-center gap-1">
                        <Ban className="w-2.5 h-2.5" /> Bloqueado
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          conv.status === "bot" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {conv.status === "bot" ? "IA Respondiendo" : "Operador"}
                      </span>
                    )}

                    {conv.metadata?.temperature && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          conv.metadata.temperature === "hot"
                            ? "bg-rose-100 text-rose-700"
                            : conv.metadata.temperature === "warm"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {conv.metadata.temperature} {conv.metadata.score ? `(${conv.metadata.score})` : ""}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Columna Derecha: Vista de Chat Activo */}
      <div className="flex-1 flex flex-col bg-slate-50/60">
        {activeConv ? (
          <>
            {/* Cabecera del Chat */}
            <div className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                  {(activeConv.contactName || activeConv.phone || "W").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-800 text-sm">
                      {activeConv.contactName || activeConv.phone || "Contacto"}
                    </h2>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono">
                      WhatsApp NOWEB
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {activeConv.phone} ·{" "}
                    {activeConv.status === "blocked" || activeConv.isBlocked
                      ? "Contacto Bloqueado (Lista Negra)"
                      : activeConv.status === "bot"
                      ? "Modo Autónomo IA"
                      : "Control Manual"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleBlockContact}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition ${
                    activeConv.status === "blocked" || activeConv.isBlocked
                      ? "bg-slate-800 hover:bg-slate-900 text-white"
                      : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                  }`}
                  title={
                    activeConv.status === "blocked" || activeConv.isBlocked
                      ? "Desbloquear número"
                      : "Bloquear remitente / Spam"
                  }
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{activeConv.status === "blocked" || activeConv.isBlocked ? "Desbloquear" : "Bloquear"}</span>
                </button>

                {!(activeConv.status === "blocked" || activeConv.isBlocked) && (
                  <button
                    onClick={toggleHandoff}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition ${
                      activeConv.status === "bot"
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : "bg-purple-600 hover:bg-purple-700 text-white"
                    }`}
                  >
                    {activeConv.status === "bot" ? (
                      <>
                        <User className="w-3.5 h-3.5" />
                        <span>Tomar Control (Handoff)</span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-3.5 h-3.5" />
                        <span>Delegar a IA</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Burbujas de Mensajes */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-10">Cargando mensajes del chat...</div>
              ) : (
                messages.map((m) => {
                  const isClient = m.senderType === "customer";
                  const isAi = m.senderType === "ai";
                  const time = new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isClient ? "items-start" : "items-end ml-auto"} max-w-lg`}
                    >
                      <div
                        className={`rounded-2xl p-3.5 shadow-sm text-sm whitespace-pre-wrap leading-relaxed ${
                          isClient
                            ? "bg-white border border-slate-200 rounded-tl-sm text-slate-800"
                            : isAi
                            ? "bg-blue-600 text-white rounded-tr-sm"
                            : "bg-emerald-600 text-white rounded-tr-sm"
                        }`}
                      >
                        {!isClient && (
                          <div
                            className={`flex items-center gap-1.5 text-xs mb-1 font-semibold ${
                              isAi ? "text-blue-200" : "text-emerald-200"
                            }`}
                          >
                            {isAi ? <Sparkles className="w-3 h-3" /> : <User className="w-3 h-3" />}
                            <span>{isAi ? "Agente IA (LightRAG)" : "Operador Humano"}</span>
                          </div>
                        )}
                        {m.content}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                        <span>{time}</span>
                        {!isClient && <CheckCheck className="w-3 h-3 text-blue-500" />}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Banner de Advertencia si está Bloqueado */}
            {(activeConv.status === "blocked" || activeConv.isBlocked) && (
              <div className="bg-rose-50 border-t border-rose-200 px-6 py-2.5 flex items-center justify-between text-xs text-rose-800">
                <div className="flex items-center gap-2 font-medium">
                  <Ban className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>Contacto bloqueado en Lista Negra. El bot no procesará mensajes de este número.</span>
                </div>
                <button
                  type="button"
                  onClick={toggleBlockContact}
                  className="font-bold underline hover:text-rose-950 ml-4 flex-shrink-0"
                >
                  Desbloquear
                </button>
              </div>
            )}

            {/* Barra de Entrada / Respuesta */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe un mensaje para responder al cliente por WhatsApp..."
                className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2.5 rounded-xl shadow-sm transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
            <MessageSquare className="w-12 h-12 text-slate-300" />
            <p className="text-sm">Selecciona una conversación para ver los mensajes</p>
          </div>
        )}
      </div>
    </div>
  );
}
