"use server";

import { auditAiBotRobots, type RobotsAudit } from "@/lib/ai-bot-robots";

/**
 * Server action: run the AI-bot robots audit. Called by the client form.
 */
export async function runAiRobotsAudit(url: string): Promise<RobotsAudit> {
  return auditAiBotRobots(url);
}
