import React from "react";
import { Settings, Palette, Smartphone, Mail, Globe, Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="h-full flex flex-col p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Configuración & Marca Blanca</h1>
        <p className="text-xs text-slate-500">Personalización visual por tenant, canales de WhatsApp y parámetros de correo.</p>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2">
        {/* Sección 1: White-Label Branding */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Palette className="w-4 h-4 text-blue-600" />
            <span>Marca Blanca & Apariencia</span>
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Nombre Comercial de la Empresa</label>
              <input
                type="text"
                defaultValue="Algoritmo Jurídico SAC"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Subdominio Personalizado</label>
              <div className="flex items-center">
                <input
                  type="text"
                  defaultValue="algoritmojuridico"
                  className="w-full bg-slate-50 border border-slate-200 rounded-l-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="bg-slate-100 border border-l-0 border-slate-200 px-3 py-2 text-xs text-slate-500 rounded-r-xl">
                  .misaas.com
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Color Primario (Hex)</label>
              <div className="flex items-center gap-3">
                <input type="color" defaultValue="#2563eb" className="h-9 w-9 rounded-lg border border-slate-200 cursor-pointer" />
                <input
                  type="text"
                  defaultValue="#2563eb"
                  className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">URL de Logotipo</label>
              <input
                type="text"
                placeholder="https://tudominio.com/logo.svg"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Sección 2: Canales de WhatsApp Multi-Número */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Instancias de WhatsApp Conectadas</span>
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  WA
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-800 block">Línea Oficial de Ventas</span>
                  <span className="text-xs text-slate-500">+51 999 888 777 · Meta Cloud API Oficial</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                Conectado (Graph v21)
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  WA
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-800 block">Soporte y Prospección</span>
                  <span className="text-xs text-slate-500">+51 987 654 321 · WAHA NOWEB (Sesión Web)</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                Sesión Activa
              </span>
            </div>
          </div>
        </div>

        {/* Sección 3: Campañas y Listmonk */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Mail className="w-4 h-4 text-purple-600" />
            <span>Integración con Listmonk (Campañas de Correo)</span>
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">URL de Instancia Listmonk</label>
              <input
                type="text"
                defaultValue="http://localhost:9000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Estado de Sincronización</label>
              <div className="flex items-center gap-2 pt-2 text-xs text-emerald-700 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>Conexión activa (Clúster PostgreSQL compartido)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end pt-2">
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition">
            <Save className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </div>
    </div>
  );
}
