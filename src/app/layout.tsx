import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lean CRM — Sistema de Ventas con IA y WhatsApp Omnicanal",
  description: "CRM open-source con WhatsApp dual, LightRAG y campañas de correo Listmonk en PostgreSQL",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen font-sans">{children}</body>
    </html>
  );
}
