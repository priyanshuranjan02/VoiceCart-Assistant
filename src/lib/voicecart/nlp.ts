import { parseVoiceCommand, formatQuantityString } from "@/services/nlp/parser";
import type { ParsedCommand, ParsedAction, Intent } from "@/domain/command";

export type { ParsedCommand, ParsedAction, Intent };

/**
 * Main NLP command parser.
 * Replaces simulated regex prototype with full deterministic multilingual engine.
 */
export function parseCommand(transcript: string): ParsedCommand {
  return parseVoiceCommand(transcript);
}

export const formatQuantity = (quantity?: number, unit?: string): string =>
  formatQuantityString(quantity, unit);
