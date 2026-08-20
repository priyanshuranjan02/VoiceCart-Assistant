import { extractEntities } from "./entities";
import { normalizeDevanagariDigits } from "./numbers";
import type { Intent, ParsedAction, ParsedCommand } from "@/domain/command";

/**
 * Production-ready deterministic Natural Language Parser for VoiceCart.
 * Understands natural English, Hindi (Devanagari & Romanized/Hinglish).
 */
export function parseVoiceCommand(transcript: string): ParsedCommand {
  const raw = transcript.trim();
  const normalized = normalizeDevanagariDigits(raw.toLowerCase());
  const entities = extractEntities(normalized);

  let intent: Intent = "UNKNOWN";
  let confidence = 0.5;

  // 1. RECOMMEND / SUGGEST
  if (
    /(what\s+should\s+i|what\s+do\s+i\s+need|what\s+am\s+i\s+running\s+low|suggest|recommend|what\s+do\s+i\s+usually|kya\s+khareed|kya\s+lena\s+hai|sujhav|सुझाव|क्या\s+खरीद)/i.test(
      normalized,
    )
  ) {
    intent = "RECOMMEND";
    confidence = 0.95;
  }
  // 2. CLEAR LIST
  else if (
    /(clear\s+(my\s+)?(shopping\s+)?(list|cart)|empty\s+(my\s+)?(shopping\s+)?(list|cart)|remove\s+all|delete\s+all|list\s+khaali|लिस्ट\s+खाली)/i.test(
      normalized,
    )
  ) {
    intent = "CLEAR";
    confidence = 0.95;
  }
  // 3. COMPLETE / CHECK OFF
  else if (
    /(mark\s+.*as\s+(done|bought|completed)|completed|finished|check\s+off|ho\s+gaya|khareed\s+liya|हो\s+गया|खरीद\s+लिया)/i.test(
      normalized,
    )
  ) {
    intent = "COMPLETE";
    confidence = 0.9;
  }
  // 4. UPDATE QUANTITY
  else if (
    /(make\s+.*(quantity|to)|change\s+.*to|update\s+.*to|set\s+.*to|add\s+\d+\s+more|\d+\s+kar\s+do|कर\s+दो)/i.test(
      normalized,
    )
  ) {
    intent = "UPDATE";
    confidence = 0.9;
  }
  // 5. REMOVE / DELETE
  else if (
    /(remove|delete|take\s+.*off|don't\s+need|dont\s+need|drop|hatao|hata\s+do|nikal\s+do|nisaar\s+do|हटाओ|हटा\s+दो|निकाल\s+दो)/i.test(
      normalized,
    )
  ) {
    intent = "REMOVE";
    confidence = 0.95;
  }
  // 6. SEARCH / FIND
  else if (
    /(find|search|show\s+me|look\s+for|khojo|dhoondo|dikhao|खोजो|ढूंढो|दिखाओ|browse)/i.test(
      normalized,
    ) ||
    entities.maxPrice !== undefined
  ) {
    if (!/^(add|buy|put|jodo|जोड़)/i.test(normalized)) {
      intent = "SEARCH";
      confidence = 0.9;
    } else {
      intent = "ADD";
      confidence = 0.9;
    }
  }
  // 7. ADD / BUY
  else if (
    /^(add|buy|put|i\s+need|i\s+want|get\s+me|can\s+you\s+add|jodo|jod\s+do|lao|le\s+aao|चाहिए|जोड़ो|जोड़\s+दो|खरीद)/i.test(
      normalized,
    ) ||
    normalized.includes(" add ") ||
    normalized.includes(" jodo ") ||
    normalized.includes(" जोड़ो ") ||
    /(jodo|जोड़ो|जोड़\s+दो)$/i.test(normalized)
  ) {
    intent = "ADD";
    confidence = 0.95;
  }
  // 8. Default fallback: If a product concept is mentioned without an action verb, treat as ADD if short, SEARCH if has filter
  else if (entities.product) {
    if (entities.maxPrice !== undefined || entities.brand !== undefined) {
      intent = "SEARCH";
    } else {
      intent = "ADD";
    }
    confidence = 0.75;
  }

  // Map Intent to legacy ParsedAction for existing component compatibility
  let action: ParsedAction = "unknown";
  if (intent === "ADD") action = "add";
  else if (intent === "REMOVE") action = "remove";
  else if (intent === "UPDATE") action = "update";
  else if (intent === "COMPLETE") action = "complete";
  else if (intent === "SEARCH") action = "search";
  else if (intent === "RECOMMEND") action = "suggest";
  else if (intent === "CLEAR") action = "clear";

  const quantity = entities.quantity ?? (intent === "ADD" || intent === "UPDATE" ? 1 : undefined);

  return {
    rawTranscript: raw,
    transcript: raw,
    intent,
    action,
    item: entities.product,
    product: entities.product,
    brand: entities.brand,
    quantity,
    unit: entities.unit,
    category: entities.category,
    maxPrice: entities.maxPrice,
    minPrice: entities.minPrice,
    size: entities.size,
    organic: entities.organic,
    attributes: entities.attributes,
    confidence,
  };
}

export function formatQuantityString(quantity?: number, unit?: string): string {
  if (!quantity) return "—";
  return `${quantity}${unit ? ` ${unit}` : ""}`;
}
