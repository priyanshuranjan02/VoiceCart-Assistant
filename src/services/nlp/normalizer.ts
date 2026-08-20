/**
 * Product Normalization & Synonyms Dictionary
 * Maps common multilingual grocery terms and plurals to canonical product concepts.
 */

export interface ProductConcept {
  canonicalName: string;
  aliases: string[];
  defaultCategory:
    "Dairy" | "Produce" | "Bakery" | "Snacks" | "Personal Care" | "Beverages" | "Pantry" | "Other";
  defaultUnit: string;
}

export const PRODUCT_CONCEPTS: ProductConcept[] = [
  // Dairy
  {
    canonicalName: "Milk",
    aliases: ["milk", "milks", "doodh", "dudh", "दूध", "cow milk", "toned milk"],
    defaultCategory: "Dairy",
    defaultUnit: "bottles",
  },
  {
    canonicalName: "Almond Milk",
    aliases: ["almond milk", "badaam doodh", "badam milk", "बादाम का दूध", "बादाम दूध"],
    defaultCategory: "Dairy",
    defaultUnit: "cartons",
  },
  {
    canonicalName: "Soy Milk",
    aliases: ["soy milk", "soya milk", "सोया मिल्क", "सोया दूध"],
    defaultCategory: "Dairy",
    defaultUnit: "cartons",
  },
  {
    canonicalName: "Cheese",
    aliases: ["cheese", "cheeses", "cheddar", "paneer", "पनीर", "चीज़", "चीज"],
    defaultCategory: "Dairy",
    defaultUnit: "packs",
  },
  {
    canonicalName: "Butter",
    aliases: ["butter", "makhan", "makkhan", "मक्खन", "माखन"],
    defaultCategory: "Dairy",
    defaultUnit: "packs",
  },
  {
    canonicalName: "Yogurt",
    aliases: ["yogurt", "yoghurt", "curd", "dahi", "दही", "योगर्ट"],
    defaultCategory: "Dairy",
    defaultUnit: "cups",
  },

  // Produce
  {
    canonicalName: "Apples",
    aliases: ["apple", "apples", "seb", "saeb", "सेब"],
    defaultCategory: "Produce",
    defaultUnit: "pieces",
  },
  {
    canonicalName: "Bananas",
    aliases: ["banana", "bananas", "kela", "kele", "केला", "केले"],
    defaultCategory: "Produce",
    defaultUnit: "bunch",
  },
  {
    canonicalName: "Mangoes",
    aliases: ["mango", "mangoes", "aam", "alphonso", "आम"],
    defaultCategory: "Produce",
    defaultUnit: "kg",
  },
  {
    canonicalName: "Oranges",
    aliases: ["orange", "oranges", "santra", "santre", "संतरा", "संतरे", "narangi"],
    defaultCategory: "Produce",
    defaultUnit: "kg",
  },
  {
    canonicalName: "Tomatoes",
    aliases: ["tomato", "tomatoes", "tamatar", "tamater", "टमाटर"],
    defaultCategory: "Produce",
    defaultUnit: "kg",
  },
  {
    canonicalName: "Potatoes",
    aliases: ["potato", "potatoes", "aalu", "aloo", "आलू"],
    defaultCategory: "Produce",
    defaultUnit: "kg",
  },
  {
    canonicalName: "Onions",
    aliases: ["onion", "onions", "pyaaz", "pyaz", "कांदा", "प्याज"],
    defaultCategory: "Produce",
    defaultUnit: "kg",
  },

  // Bakery
  {
    canonicalName: "Bread",
    aliases: [
      "bread",
      "breads",
      "white bread",
      "brown bread",
      "multigrain bread",
      "ब्रेड",
      "पाव",
      "double roti",
    ],
    defaultCategory: "Bakery",
    defaultUnit: "loaf",
  },

  // Snacks
  {
    canonicalName: "Chips",
    aliases: ["chips", "potato chips", "wafers", "lays", "चिप्स", "वेफर्स"],
    defaultCategory: "Snacks",
    defaultUnit: "packs",
  },
  {
    canonicalName: "Biscuits",
    aliases: ["biscuit", "biscuits", "cookies", "cookie", "parle", "बिस्कुट", "बिस्किट"],
    defaultCategory: "Snacks",
    defaultUnit: "packs",
  },

  // Personal Care
  {
    canonicalName: "Toothpaste",
    aliases: ["toothpaste", "colgate", "paste", "tooth paste", "दंत मंजन", "टूथपेस्ट"],
    defaultCategory: "Personal Care",
    defaultUnit: "tubes",
  },
  {
    canonicalName: "Herbal Toothpaste",
    aliases: ["herbal toothpaste", "dabur red", "ayurvedic paste", "हर्बल टूथपेस्ट"],
    defaultCategory: "Personal Care",
    defaultUnit: "tubes",
  },
  {
    canonicalName: "Shampoo",
    aliases: ["shampoo", "hair wash", "शैम्पू", "शैंपू"],
    defaultCategory: "Personal Care",
    defaultUnit: "bottles",
  },
];

/**
 * Finds matching canonical concept for any token or phrase, with Unicode support for Indic scripts.
 */
export function resolveProductConcept(text: string): ProductConcept | undefined {
  const clean = text.toLowerCase().trim();

  // Sort longest alias first to match multi-word aliases before single-word
  const sorted: { concept: ProductConcept; alias: string }[] = [];
  for (const concept of PRODUCT_CONCEPTS) {
    for (const alias of concept.aliases) {
      sorted.push({ concept, alias: alias.toLowerCase() });
    }
  }
  sorted.sort((a, b) => b.alias.length - a.alias.length);

  // Exact match
  for (const item of sorted) {
    if (clean === item.alias) {
      return item.concept;
    }
  }

  // Token boundary match (handling both ASCII and Devanagari Unicode word boundaries)
  for (const item of sorted) {
    // If alias contains non-ascii characters (like Devanagari)
    const isNonAscii = Array.from(item.alias).some((char) => char.charCodeAt(0) > 127);
    let matched = false;

    if (isNonAscii) {
      // For Devanagari, match if word is surrounded by space, punctuation, or start/end
      const escaped = item.alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(^|\\s|[.,!?;:()"])${escaped}($|\\s|[.,!?;:()"])`, "u");
      matched = regex.test(clean);
    } else {
      const escaped = item.alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      matched = regex.test(clean);
    }

    if (matched) {
      return item.concept;
    }
  }

  return undefined;
}
