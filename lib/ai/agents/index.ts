/**
 * Agents — Public exports
 */

export { agentRegistry } from "./agent-registry"
export { AgentBase } from "./agent-base"
export { shouldRunNow, shouldRunInWindow } from "./cron-matcher"
export type {
  AgentId,
  AgentStatus,
  AgentSchedule,
  AgentTier,
  AgentConfig,
  AgentRunContext,
  AgentRunResult,
  AgentAction,
  AgentLog,
  AgentStatusInfo,
} from "./agent-types"

// Import bootstrap to register all agents on first import
import "./bootstrap"
