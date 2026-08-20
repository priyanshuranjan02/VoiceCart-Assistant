import type { Product } from "@/domain/product";
import { parseVoiceCommand } from "../nlp/parser";

export type SearchFilterType =
  | "All"
  | "Organic"
  | "Under ₹200"
  | "Popular"
  | "Best Match"
  | "Price: Low to High"
  | "Price: High to Low";

export interface SearchCriteria {
  query?: string;
  brand?: string;
  category?: string;
  filter?: SearchFilterType;
  size?: string;
  maxPrice?: number;
  minPrice?: number;
  organicOnly?: boolean;
  inStockOnly?: boolean;
}

export class ProductSearchEngine {
  /**
   * Searches and filters products based on structured criteria and natural language.
   */
  public static search(products: Product[], criteria: SearchCriteria): Product[] {
    const q = (criteria.query ?? "").toLowerCase().trim();
    const parsed = q ? parseVoiceCommand(q) : null;

    const brandFilter =
      criteria.brand && criteria.brand !== "All brands" ? criteria.brand : undefined;
    const effectiveBrand = brandFilter ?? parsed?.brand;
    const effectiveMaxPrice = criteria.maxPrice ?? parsed?.maxPrice;
    const effectiveOrganic = criteria.organicOnly ?? parsed?.organic;
    const effectiveSize = criteria.size ?? parsed?.size;
    const targetProduct = parsed?.product?.toLowerCase();

    const matches = products.filter((product) => {
      // 1. Keyword / Name match
      if (q) {
        const nameMatch = product.name.toLowerCase().includes(q);
        const brandMatch = product.brand.toLowerCase().includes(q);
        const catMatch = product.category.toLowerCase().includes(q);
        const aliasMatch = product.aliases?.some((a) => a.toLowerCase().includes(q));
        const targetMatch = targetProduct
          ? product.name.toLowerCase().includes(targetProduct) ||
            targetProduct.includes(product.name.toLowerCase())
          : false;

        if (!nameMatch && !brandMatch && !catMatch && !aliasMatch && !targetMatch) {
          return false;
        }
      }

      // 2. Brand constraint
      if (effectiveBrand && product.brand.toLowerCase() !== effectiveBrand.toLowerCase()) {
        return false;
      }

      // 3. Size constraint
      if (effectiveSize && product.size.toLowerCase() !== effectiveSize.toLowerCase()) {
        return false;
      }

      // 4. Category constraint
      if (
        criteria.category &&
        criteria.category !== "All" &&
        product.category !== criteria.category
      ) {
        return false;
      }

      // 5. Price ceiling constraint
      if (effectiveMaxPrice !== undefined && product.price > effectiveMaxPrice) {
        return false;
      }

      // 5. Price floor constraint
      if (criteria.minPrice !== undefined && product.price < criteria.minPrice) {
        return false;
      }

      // 6. Organic status constraint
      if (effectiveOrganic === true && !product.organic) {
        return false;
      }

      // 7. Stock constraint
      if (criteria.inStockOnly && !product.available) {
        return false;
      }

      // 8. Filter pill specific checks
      if (criteria.filter === "Organic" && !product.organic) {
        return false;
      }
      if (criteria.filter === "Under ₹200" && product.price >= 200) {
        return false;
      }
      if (criteria.filter === "Popular" && !product.popular) {
        return false;
      }

      return true;
    });

    // Ranking & Sorting
    if (criteria.filter === "Best Match") {
      matches.sort((a, b) => {
        // Exact name match first
        if (targetProduct) {
          if (a.name.toLowerCase() === targetProduct) return -1;
          if (b.name.toLowerCase() === targetProduct) return 1;
        }
        // Available items first
        if (a.available !== b.available) return a.available ? -1 : 1;
        // Popular items first
        if (a.popular !== b.popular) return a.popular ? -1 : 1;
        return a.price - b.price;
      });
    } else if (criteria.filter === "Price: Low to High") {
      matches.sort((a, b) => a.price - b.price);
    } else if (criteria.filter === "Price: High to Low") {
      matches.sort((a, b) => b.price - a.price);
    }

    return matches;
  }
}
