import React from "react";
import { MessageSquare, Phone, Mail, Bot, User, CheckCheck, Send, Sparkles, AlertCircle } from "lucide-react";

export default function InboxPage() {
  // Datos mock de prueba para renderizado inicial del layout
  const mockConversations = [
    {
      id: "c1",
      contactName: "Dr. Carlos Mendoza",
      phone: "+51 999 888 777",
      channel: "whatsapp",
      provider: "meta",
      status: "bot",
      score: 75,
      temperature: "hot",
      lastMessage: "Hola, me interesa saber el costo del plan anual",
      time: "10:42 AM",
      unread: true,
    },
    {
      id: "c2",
      contactName: "Valentina Rios",
      phone: "+51 987 654 321",
      channel: "whatsapp",
      provider: "waha",
      status: "human",
      score: 40,
      temperature: "warm",
      lastMessage: "Gracias por la información, quedo a la espera",
      time: "Ayer",
      unread: false,
    },
    {
      id: "c3",
      contactName: "Eduardo Silva",
      email: "eduardo@empresa.com",
      channel: "email",
      provider: "resend",
      status: "bot",
      score: 85,
      temperature: "hot",
      lastMessage: "Re: Cotización formal de servicios",
      time: "20 Oct",
      unread: false,
    },
  ];

  return (
    <div className="flex h-full w-full">
      {/* Columna Izquierda: Lista de Conversaciones */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h1 className="font-bold text-slate-800 text-lg">Bandeja de Entrada</h1>
          <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">3 chats</span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {mockConversations.map((conv) => (
            <div
              key={conv.id}
              className={`p-4 hover:bg-slate-50 cursor-pointer transition flex flex-col gap-1.5 ${
                conv.id === "c1" ? "bg-blue-50/50 border-l-4 border-blue-600" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {conv.channel === "whatsapp" ? (
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span className="font-semibold text-sm text-slate-900 truncate max-w-[140px]">
                    {conv.contactName}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">{conv.time}</span>
              </div>

              <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>

              <div className="flex items-center justify-between pt-1">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                    conv.status === "bot" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {conv.status === "bot" ? "IA Respondiendo" : "Humano a cargo"}
                </span>

                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    conv.temperature === "hot"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {conv.temperature} ({conv.score})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Columna Derecha: Vista de Chat Activo */}
      <div className="flex-1 flex flex-col bg-slate-50/60">
        {/* Cabecera del Chat */}
        <div className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
              CM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-800 text-sm">Dr. Carlos Mendoza</h2>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono">
                  Meta Cloud API
                </span>
              </div>
              <p className="text-xs text-slate-400">+51 999 888 777 · Ventas Lima</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm transition">
              <User className="w-3.5 h-3.5" />
              <span>Tomar Control (Handoff)</span>
            </button>
          </div>
        </div>

        {/* Burbujas de Mensajes */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {/* Mensaje Cliente */}
          <div className="flex flex-col items-start max-w-md">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-3.5 shadow-sm text-sm text-slate-800">
              Hola, me interesa saber el costo del plan anual para 3 doctores. ¿Tienen algún descuento por pago anticipado?
            </div>
            <span className="text-[10px] text-slate-400 mt-1 pl-1">10:41 AM</span>
          </div>

          {/* Mensaje IA con LightRAG */}
          <div className="flex flex-col items-end ml-auto max-w-md">
            <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm p-3.5 shadow-sm text-sm">
              <div className="flex items-center gap-1.5 text-blue-200 text-xs mb-1 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Agente IA (LightRAG)</span>
              </div>
              ¡Hola Dr. Carlos! Con gusto. El Plan Anual para 3 profesionales tiene un valor de $1,200 USD ($100 USD/mes). Sí incluye un 15% de descuento por pago anticipado e instalación prioritaria de agenda digital.
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 pr-1">
              <span>10:42 AM</span>
              <CheckCheck className="w-3 h-3 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Barra de Entrada / Respuesta */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
          <input
            type="text"
            placeholder="Escribe una respuesta como operador humano o usa un comando /link /cita..."
            className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl shadow-sm transition">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
