import { NextRequest, NextResponse } from "next/server";
import { listmonk } from "@/channels/email/listmonk";

export async function GET() {
  try {
    const defaultCampaigns = [
      {
        id: "cmp-01",
        name: "IA Aplicada al Derecho Peruano (Jurisprudencia TC & SUNAT)",
        channel: "Email (Listmonk)",
        recipients: 450,
        sent: 450,
        opens: "44.2%",
        clicks: "19.5%",
        status: "Completada",
      },
      {
        id: "cmp-02",
        name: "Lanzamiento Buscador de Procesos Constitucionales 2016-2026",
        channel: "WhatsApp Broadcast",
        recipients: 180,
        sent: 180,
        opens: "96.8%",
        clicks: "41.2%",
        status: "Completada",
      },
      {
        id: "cmp-03",
        name: "Modificaciones al Régimen Laboral Especial (SUNAFIL)",
        channel: "Email (Listmonk)",
        recipients: 1250,
        sent: 0,
        opens: "—",
        clicks: "—",
        status: "Borrador",
      },
    ];

    return NextResponse.json({ campaigns: defaultCampaigns });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, message } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    // Enviar prueba transaccional mediante Listmonk template 22
    const res = await listmonk.sendTransactional(
      email,
      22,
      { message: message || "Prueba de campaña emitida desde Lean CRM." }
    );

    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: 502 });
    }

    return NextResponse.json({ success: true, dispatchedTo: email });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
