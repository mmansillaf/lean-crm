export interface GuardrailCheckResult {
  isSafe: boolean;
  sanitizedInput: string;
  flaggedReason?: string;
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /olvida\s+(todas\s+las\s+)?instrucciones\s+anteriores/i,
  /you\s+are\s+now\s+(DAN|unrestricted|developer mode)/i,
  /actúa\s+como\s+un\s+modelo\s+sin\s+restricciones/i,
  /show\s+me\s+your\s+(system\s+prompt|instructions)/i,
  /muestra\s+tu\s+prompt\s+del\s+sistema/i,
  /eres\s+libre\s+de\s+cualquier\s+regla/i,
];

export function sanitizeAndGuardPrompt(rawInput: string): GuardrailCheckResult {
  const trimmed = rawInput.trim();

  // 1. Detección de patrones de jailbreak conocidos
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isSafe: false,
        sanitizedInput: "[Mensaje bloqueado por intento de inyección de prompt]",
        flaggedReason: "prompt_injection_detected",
      };
    }
  }

  // 2. Escapar etiquetas XML para evitar inyecciones que rompan el contenedor <customer_message>
  const sanitized = trimmed
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return {
    isSafe: true,
    sanitizedInput: sanitized,
  };
}
