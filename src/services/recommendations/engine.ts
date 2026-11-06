import type { Product, Season } from "@/domain/product";
import type { PurchaseHistoryRecord } from "@/domain/shopping";
import type { Suggestion } from "@/domain/recommendation";

export function getCurrentSeason(date: Date = new Date()): Season {
  const month = date.getMonth(); // 0 = Jan, 11 = Dec
  if (month >= 2 && month <= 5) return "summer"; // Mar, Apr, May, Jun
  if (month >= 6 && month <= 8) return "monsoon"; // Jul, Aug, Sep
  return "winter"; // Oct, Nov, Dec, Jan, Feb
}

export class RecommendationEngine {
  /**
   * Generates history-based habit recommendations from past purchases.
   * STRICT DATA REQUIREMENT:
   * Only products with at least 2 verified past purchases qualify for interval calculation.
   * If history is insufficient, returns an empty array. Does not fabricate purchase patterns.
   */
  public static generateHabitRecommendations(
    products: Product[],
    history: PurchaseHistoryRecord[],
    currentTime = Date.now(),
  ): Suggestion[] {
    if (!history || history.length < 2) {
      return [];
    }

    // Group purchase timestamps by product name (case-insensitive)
    const productGroups = new Map<string, number[]>();
    for (const record of history) {
      if (!record.productName || typeof record.timestamp !== "number") continue;
      const key = record.productName.trim().toLowerCase();
      const existing = productGroups.get(key) ?? [];
      existing.push(record.timestamp);
      productGroups.set(key, existing);
    }

    const candidates: {
      product: Product;
      averageIntervalDays: number;
      daysSinceLast: number;
      reorderScore: number;
    }[] = [];

    for (const [normName, timestamps] of productGroups.entries()) {
      // Must have at least 2 distinct purchases to calculate an actual interval
      if (timestamps.length < 2) {
        continue;
      }

      const matchedProduct = products.find(
        (p) =>
          p.name.toLowerCase() === normName || p.aliases?.some((a) => a.toLowerCase() === normName),
      );
      if (!matchedProduct) continue;

      // Sort chronological
      timestamps.sort((a, b) => a - b);
      const lastTimestamp = timestamps[timestamps.length - 1];
      const daysSinceLast = Math.max(
        0,
        Math.round((currentTime - lastTimestamp) / (1000 * 60 * 60 * 24)),
      );

      let totalIntervals = 0;
      for (let i = 1; i < timestamps.length; i++) {
        totalIntervals += (timestamps[i] - timestamps[i - 1]) / (1000 * 60 * 60 * 24);
      }
      const averageIntervalDays = Math.max(1, Math.round(totalIntervals / (timestamps.length - 1)));

      // Score: how overdue/ready for reorder is it?
      const reorderScore = daysSinceLast / averageIntervalDays;

      candidates.push({
        product: matchedProduct,
        averageIntervalDays,
        daysSinceLast,
        reorderScore,
      });
    }

    // Sort by most due for replenishment
    candidates.sort((a, b) => b.reorderScore - a.reorderScore);

    const suggestions: Suggestion[] = [];
    const seenIds = new Set<string>();

    for (const candidate of candidates) {
      if (seenIds.has(candidate.product.id)) continue;
      seenIds.add(candidate.product.id);

      const lastText =
        candidate.daysSinceLast === 0
          ? "Last purchased today."
          : `Last purchased ${candidate.daysSinceLast} day${candidate.daysSinceLast === 1 ? "" : "s"} ago.`;

      suggestions.push({
        id: `s-habit-${candidate.product.id}`,
        kind: "habit",
        productId: candidate.product.id,
        title: candidate.product.name,
        line1: `You usually buy this every ${candidate.averageIntervalDays} days.`,
        line2: lastText,
        cta: "add",
        reason: `Reorder interval: ~${candidate.averageIntervalDays}d`,
      });

      if (suggestions.length >= 2) break;
    }

    return suggestions;
  }

  /**
   * Generates dynamic seasonal recommendations based on current date.
   * Prioritizes season-specific produce (e.g. Summer Mangoes, Winter Apples/Oranges).
   */
  public static generateSeasonalRecommendations(
    products: Product[],
    date: Date = new Date(),
  ): Suggestion[] {
    const season = getCurrentSeason(date);
    const seasonLabels: Record<Season, string> = {
      summer: "Peak summer harvest",
      winter: "Fresh winter arrivals",
      monsoon: "Fresh monsoon produce",
      all: "Popular all year",
    };

    // Prefer items specific to the current season first
    const seasonSpecific = products.filter((p) => p.season === season && p.available && p.popular);
    const allSeasonPopular = products.filter(
      (p) => (p.season === season || p.season === "all") && p.available && p.popular,
    );

    const target =
      seasonSpecific[0] ??
      allSeasonPopular[0] ??
      products.find((p) => p.season === season) ??
      products[0];

    if (!target) return [];

    return [
      {
        id: `s-seasonal-${target.id}`,
        kind: "seasonal",
        productId: target.id,
        title: target.name,
        line1: "Popular this season",
        line2: `${seasonLabels[season]} · ${target.brand}`,
        cta: "add",
        reason: `Dynamic seasonal match for ${season}`,
      },
    ];
  }

  /**
   * Generates substitute recommendations for products with healthier or dietary alternatives.
   */
  public static generateSubstituteRecommendations(products: Product[]): Suggestion[] {
    const withSubs = products.filter((p) => p.substitutes && p.substitutes.length > 0);
    if (withSubs.length === 0) return [];

    const base = withSubs[0];
    const subId = base.substitutes![0];
    const subProduct = products.find((p) => p.id === subId) ?? base;

    return [
      {
        id: `s-substitute-${subProduct.id}`,
        kind: "substitute",
        productId: subProduct.id,
        title: subProduct.name,
        line1: `An alternative to ${base.name}`,
        line2: subProduct.organic
          ? "Organic & Natural · Great alternative"
          : `Similar to ${base.name}`,
        cta: "options",
        reason: `Direct substitute for ${base.name}`,
      },
    ];
  }

  /**
   * Aggregates all 3 pillars of recommendations.
   * Guarantees unique product suggestions across pillars.
   */
  public static getRecommendations(
    products: Product[],
    history: PurchaseHistoryRecord[],
    date: Date = new Date(),
  ): Suggestion[] {
    const habit = this.generateHabitRecommendations(products, history).slice(0, 1);
    const seasonal = this.generateSeasonalRecommendations(products, date).slice(0, 1);
    const substitute = this.generateSubstituteRecommendations(products).slice(0, 1);

    const result: Suggestion[] = [];
    const usedProductIds = new Set<string>();

    for (const s of [...habit, ...seasonal, ...substitute]) {
      if (!usedProductIds.has(s.productId)) {
        usedProductIds.add(s.productId);
        result.push(s);
      }
    }

    return result;
  }
}
