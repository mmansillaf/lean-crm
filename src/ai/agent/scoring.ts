export type LeadTemperature = "cold" | "warm" | "hot";

export interface LeadScoreResult {
  temperature: LeadTemperature;
  score: number; // 0 - 100
  buyingIntentSignals: string[];
}

export function evaluateLeadScore(messageText: string, currentScore: number = 20): LeadScoreResult {
  const text = messageText.toLowerCase();
  const signals: string[] = [];
  let score = currentScore;

  // Señales de alta intención (Hot: +25 por cada coincidencia)
  const hotKeywords = [
    "precio", "cuanto cuesta", "cuánto cuesta", "costo", "comprar", "pagar",
    "contratar", "cotización", "cotizacion", "tarjeta", "factura", "agendar", "cita"
  ];

  for (const kw of hotKeywords) {
    if (text.includes(kw)) {
      score += 25;
      signals.push(`Mención de compra/precio: "${kw}"`);
    }
  }

  // Señales de interés moderado (Warm: +15 por cada coincidencia)
  const warmKeywords = ["planes", "caracteristicas", "diferencia", "como funciona", "horario", "informacion"];
  for (const kw of warmKeywords) {
    if (text.includes(kw)) {
      score += 15;
      signals.push(`Interés en características: "${kw}"`);
    }
  }

  // Señales frías o detractoras (Cold: -20 por coincidencia)
  const coldKeywords = ["caro", "no me interesa", "gratis", "spam", "equivocado", "eliminar"];
  for (const kw of coldKeywords) {
    if (text.includes(kw)) {
      score -= 20;
      signals.push(`Objeción o desinterés: "${kw}"`);
    }
  }

  // Normalizar entre 0 y 100
  score = Math.max(0, Math.min(100, score));

  let temperature: LeadTemperature = "cold";
  if (score >= 60) {
    temperature = "hot";
  } else if (score >= 35) {
    temperature = "warm";
  }

  return {
    temperature,
    score,
    buyingIntentSignals: signals,
  };
}
