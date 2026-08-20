import type { Category } from "@/domain/command";
import { resolveProductConcept } from "../nlp/normalizer";

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  Dairy: [
    "milk",
    "cheese",
    "butter",
    "yogurt",
    "yoghurt",
    "cream",
    "paneer",
    "ghee",
    "dahi",
    "doodh",
    "दूध",
    "दही",
    "पनीर",
    "मक्खन",
    "चीज़",
  ],
  Produce: [
    "apple",
    "apples",
    "banana",
    "bananas",
    "mango",
    "mangoes",
    "orange",
    "oranges",
    "tomato",
    "tomatoes",
    "potato",
    "potatoes",
    "onion",
    "onions",
    "lemon",
    "spinach",
    "carrot",
    "fruit",
    "vegetable",
    "सेब",
    "केला",
    "आम",
    "संतरा",
    "टमाटर",
    "आलू",
    "प्याज",
  ],
  Bakery: ["bread", "bagel", "croissant", "muffin", "bun", "loaf", "toast", "ब्रेड", "पाव", "रोटी"],
  Snacks: [
    "chips",
    "biscuit",
    "biscuits",
    "cookie",
    "cookies",
    "crackers",
    "popcorn",
    "namkeen",
    "nuts",
    "चिप्स",
    "बिस्कुट",
    "नमकीन",
  ],
  "Personal Care": [
    "toothpaste",
    "soap",
    "shampoo",
    "conditioner",
    "brush",
    "face wash",
    "cream",
    "lotion",
    "टूथपेस्ट",
    "साबुन",
    "शैम्पू",
  ],
  Beverages: ["tea", "coffee", "juice", "soda", "water", "chai", "चाय", "कॉफ़ी", "जूस", "पानी"],
  Pantry: [
    "rice",
    "flour",
    "atta",
    "sugar",
    "salt",
    "oil",
    "dal",
    "lentils",
    "spices",
    "चावल",
    "आटा",
    "दाल",
    "तेल",
    "चीनी",
    "नमक",
  ],
  Other: [],
};

/**
 * Automatically infers product category from product name, with safe fallback to 'Other'.
 */
export function inferCategory(productName: string): Category {
  const clean = productName.toLowerCase().trim();

  // First check canonical product concepts
  const concept = resolveProductConcept(clean);
  if (concept) {
    return concept.defaultCategory;
  }

  // Keyword match across categories
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (clean.includes(kw.toLowerCase())) {
        return category as Category;
      }
    }
  }

  return "Other";
}
