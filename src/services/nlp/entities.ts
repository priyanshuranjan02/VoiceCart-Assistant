import { normalizeDevanagariDigits, parseNumberWord } from "./numbers";
import { resolveProductConcept } from "./normalizer";
import type { Category } from "@/domain/command";

export const KNOWN_BRANDS = [
  "Amul",
  "Britannia",
  "Colgate",
  "NatureFresh",
  "FreshFarm",
  "Dove",
  "Dabur",
  "Lay's",
  "Parle",
  "Go",
  "Epigamia",
  "Raw Pressery",
  "The Baker's Dozen",
  "Sofit",
  "Farm Direct",
  "Ratnagiri Farms",
  "Nagpur Grove",
  "Local Market",
];

const UNIT_PATTERNS: Record<string, string[]> = {
  bottles: ["bottle", "bottles", "botle", "botles", "बोतल", "बोतलें"],
  cartons: ["carton", "cartons", "टेट्रापैक"],
  packs: ["pack", "packs", "packet", "packets", "pkt", "pkts", "पैकेट", "पैक"],
  pieces: ["piece", "pieces", "pc", "pcs", "पीस", "टुकड़े", "दाने"],
  kg: ["kg", "kgs", "kilo", "kilos", "kilogram", "kilograms", "किलो", "किग्रा"],
  g: ["g", "gm", "gms", "gram", "grams", "ग्राम"],
  litre: ["litre", "litres", "liter", "liters", "l", "ltr", "ltrs", "लीटर"],
  loaf: ["loaf", "loaves", "ब्रेड"],
  bunch: ["bunch", "bunches", "दर्जन", "दरजन", "गुच्छा"],
  tubes: ["tube", "tubes", "ट्यूब"],
  cups: ["cup", "cups", "कप"],
  box: ["box", "boxes", "डिब्बा", "डिब्बे"],
};

export type ExtractedEntities = {
  product?: string;
  brand?: string;
  quantity?: number;
  unit?: string;
  category?: Category;
  maxPrice?: number;
  minPrice?: number;
  size?: string;
  organic?: boolean;
  attributes: string[];
};

/**
 * Extracts entities from raw speech transcript.
 */
export function extractEntities(text: string): ExtractedEntities {
  const normalized = normalizeDevanagariDigits(text.toLowerCase().trim());
  const attributes: string[] = [];

  // 1. Organic flag
  let organic: boolean | undefined = undefined;
  if (/\b(organic|जैविक|jaivik)\b/i.test(normalized)) {
    organic = true;
    attributes.push("Organic");
  }

  // 2. Price constraints (e.g. "under 200", "under ₹200", "below 150", "200 se kam", "200 ke andar")
  let maxPrice: number | undefined = undefined;
  const minPrice: number | undefined = undefined;
  const underPriceRegex =
    /(?:under|below|less than|se kam|ke andar|तक)\s*(?:₹|rs\.?|inr)?\s*(\d{2,5})|(\d{2,5})\s*(?:₹|rs\.?|inr)?\s*(?:se kam|ke andar|se niche)/i;
  const priceMatch = normalized.match(underPriceRegex);
  if (priceMatch) {
    const val = priceMatch[1] || priceMatch[2];
    if (val) {
      maxPrice = Number(val);
      attributes.push(`Under ₹${maxPrice}`);
    }
  }

  // 3. Brand extraction
  let brand: string | undefined = undefined;
  for (const knownBrand of KNOWN_BRANDS) {
    const escaped = knownBrand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(normalized)) {
      brand = knownBrand;
      attributes.push(knownBrand);
      break;
    }
  }

  // 4. Quantity and Unit extraction
  let quantity: number | undefined = undefined;
  let unit: string | undefined = undefined;

  // Check unit patterns
  for (const [canonicalUnit, variations] of Object.entries(UNIT_PATTERNS)) {
    for (const v of variations) {
      const isNonAscii = Array.from(v).some((char) => char.charCodeAt(0) > 127);
      const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = isNonAscii
        ? new RegExp(
            `(\\d+(\\.\\d+)?|[a-zA-Z\u0900-\u097F]+)?\\s*(?:^|\\s|[.,!?;:()"])${escaped}(?:$|\\s|[.,!?;:()"])`,
            "u",
          )
        : new RegExp(`(\\d+(\\.\\d+)?|[a-zA-Z\u0900-\u097F]+)?\\s*\\b${escaped}\\b`, "i");

      const match = normalized.match(pattern);
      if (match) {
        unit = canonicalUnit;
        if (match[1]) {
          const parsedNum = parseNumberWord(match[1]);
          if (parsedNum !== undefined) {
            quantity = parsedNum;
          }
        }
        break;
      }
    }
    if (unit) break;
  }

  // If quantity still not found, check for numeric word / digits in text
  if (quantity === undefined) {
    // Check digits
    const digitMatch = normalized.match(/\b(\d+(\.\d+)?)\b/);
    if (digitMatch && (!maxPrice || Number(digitMatch[1]) !== maxPrice)) {
      quantity = Number(digitMatch[1]);
    } else {
      // Check number words
      const words = normalized.split(/\s+/);
      for (const w of words) {
        const parsedNum = parseNumberWord(w);
        if (parsedNum !== undefined && parsedNum > 0 && parsedNum <= 100) {
          quantity = parsedNum;
          break;
        }
      }
    }
  }

  // 5. Size extraction (e.g. "1 kg", "500 g", "1 L", "200 g", "400 g", "6 pcs", "340 ml", "150 g")
  let size: string | undefined = undefined;
  const sizeRegex = /\b(\d+(?:\.\d+)?)\s*(kg|kilo|g|gm|gram|grams|l|litre|liter|ml|pcs|pieces)\b/i;
  const sizeMatch = normalized.match(sizeRegex);
  if (sizeMatch) {
    const num = sizeMatch[1];
    const unitStr = sizeMatch[2].toLowerCase();
    if (unitStr === "l" || unitStr === "litre" || unitStr === "liter") size = `${num} L`;
    else if (unitStr === "kg" || unitStr === "kilo") size = `${num} kg`;
    else if (unitStr === "g" || unitStr === "gm" || unitStr === "gram" || unitStr === "grams")
      size = `${num} g`;
    else if (unitStr === "ml") size = `${num} ml`;
    else if (unitStr === "pcs" || unitStr === "pieces") size = `${num} pcs`;
    if (size && !attributes.includes(size)) {
      attributes.push(size);
    }
  }

  // 6. Product concept resolution
  const concept = resolveProductConcept(normalized);
  let product: string | undefined = concept?.canonicalName;
  let category: Category | undefined = concept?.defaultCategory;

  if (!unit && concept?.defaultUnit) {
    unit = concept.defaultUnit;
  }

  // If no canonical concept found, attempt extracting product noun phrase
  if (!product) {
    const stripped = normalized
      .replace(
        /\b(add|put|buy|remove|delete|take off|find|search|show me|look for|jodo|hatao|khojo|lao|kar do|chahiye|need|want)\b/gi,
        "",
      )
      .replace(
        /\b(two|three|four|five|six|seven|eight|nine|ten|one|ek|do|teen|chaar|paanch|एक|दो|तीन|चार|पाँच|\d+)\b/gi,
        "",
      )
      .replace(
        /\b(bottles|bottle|kg|kilo|packs|pack|packet|pieces|piece|loaf|bunch|tubes|cartons|cups|boxes)\b/gi,
        "",
      )
      .replace(/\b(under|below|less than|organic|जैविक)\s*(?:₹|rs\.?|inr)?\s*\d*/gi, "")
      .replace(/\b(to my list|from my list|on my list|please|karo|do|mera|meri|mujhe)\b/gi, "")
      .trim();

    if (stripped.length > 1) {
      product = stripped.replace(/^\w/, (c) => c.toUpperCase());
      category = "Other";
    }
  }

  if (product && !attributes.includes(product)) {
    attributes.unshift(product);
  }

  return {
    product,
    brand,
    quantity,
    unit,
    category,
    maxPrice,
    minPrice,
    size,
    organic,
    attributes,
  };
}
