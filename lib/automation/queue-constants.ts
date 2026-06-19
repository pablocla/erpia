export const AUTOMATION_OUTBOUND_QUEUE = "automation.outbound"

export const AUTOMATION_OUTBOUND_OPTS = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 500 },
}