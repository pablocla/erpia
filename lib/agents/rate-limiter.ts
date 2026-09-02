const LIMITES = {
  "leo-vendedor":     { requestsPorMinuto: 30, requestsPorHora: 500 },
  "clara-afip":       { requestsPorMinuto: 10, requestsPorHora: 100 },
  "guardian-caja":    { requestsPorMinuto: 60, requestsPorHora: 1000 },
  "ramiro-reponedor": { requestsPorMinuto: 20, requestsPorHora: 200 },
  "cobrador-cxc":     { requestsPorMinuto: 15, requestsPorHora: 150 },
} as const;

type AgentLimiterIds = keyof typeof LIMITES | (string & {});

interface RateLimitData {
  minuteCount: number;
  hourCount: number;
  minuteStart: number;
  hourStart: number;
}

// In-memory store (a better implementation would use Redis in production)
const store = new Map<string, RateLimitData>();

export function checkRateLimit(empresaId: number, agentId: AgentLimiterIds): { allowed: boolean; retryAfter?: number } {
  const limits = LIMITES[agentId as keyof typeof LIMITES] ?? { requestsPorMinuto: 20, requestsPorHora: 200 }; // Default limits
  const key = `${empresaId}:${agentId}`;
  const now = Date.now();
  
  let data = store.get(key);
  if (!data) {
    data = { minuteCount: 0, hourCount: 0, minuteStart: now, hourStart: now };
    store.set(key, data);
  }

  // Reset minute counter if a minute has passed
  if (now - data.minuteStart > 60000) {
    data.minuteCount = 0;
    data.minuteStart = now;
  }

  // Reset hour counter if an hour has passed
  if (now - data.hourStart > 3600000) {
    data.hourCount = 0;
    data.hourStart = now;
  }

  if (data.minuteCount >= limits.requestsPorMinuto) {
    const retryAfter = Math.ceil((60000 - (now - data.minuteStart)) / 1000);
    return { allowed: false, retryAfter };
  }

  if (data.hourCount >= limits.requestsPorHora) {
    const retryAfter = Math.ceil((3600000 - (now - data.hourStart)) / 1000);
    return { allowed: false, retryAfter };
  }

  data.minuteCount++;
  data.hourCount++;

  return { allowed: true };
}
