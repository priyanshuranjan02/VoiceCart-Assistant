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
   */
  public static generateHabitRecommendations(
    products: Product[],
    history: PurchaseHistoryRecord[],
    currentTime = Date.now(),
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Group history by product
    const productGroups = new Map<string, number[]>();
    for (const record of history) {
      const existing = productGroups.get(record.productName) ?? [];
      existing.push(record.timestamp);
      productGroups.set(record.productName, existing);
    }

    // Default fallback if no user history yet: recommend staples like Milk
    if (productGroups.size === 0) {
      const milk = products.find((p) => p.id === "p-milk");
      if (milk) {
        suggestions.push({
          id: "s-habit-milk",
          kind: "habit",
          productId: milk.id,
          title: milk.name,
          line1: "You usually buy this every 7 days.",
          line2: "Last purchased 8 days ago.",
          cta: "add",
          reason: "Frequently reordered staple",
        });
      }
      return suggestions;
    }

    for (const [productName, timestamps] of productGroups.entries()) {
      const matchedProduct = products.find(
        (p) => p.name.toLowerCase() === productName.toLowerCase(),
      );
      if (!matchedProduct) continue;

      // Sort chronological
      timestamps.sort((a, b) => a - b);
      const lastTimestamp = timestamps[timestamps.length - 1];
      const daysSinceLast = Math.max(
        1,
        Math.round((currentTime - lastTimestamp) / (1000 * 60 * 60 * 24)),
      );

      let averageIntervalDays = 7;
      if (timestamps.length >= 2) {
        let totalIntervals = 0;
        for (let i = 1; i < timestamps.length; i++) {
          totalIntervals += (timestamps[i] - timestamps[i - 1]) / (1000 * 60 * 60 * 24);
        }
        averageIntervalDays = Math.max(2, Math.round(totalIntervals / (timestamps.length - 1)));
      }

      suggestions.push({
        id: `s-habit-${matchedProduct.id}`,
        kind: "habit",
        productId: matchedProduct.id,
        title: matchedProduct.name,
        line1: `You usually buy this every ${averageIntervalDays} days.`,
        line2: `Last purchased ${daysSinceLast} days ago.`,
        cta: "add",
        reason: `Reorder interval: ~${averageIntervalDays}d`,
      });
    }

    return suggestions.slice(0, 2);
  }

  /**
   * Generates dynamic seasonal recommendations based on current date.
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

    const matching = products.filter(
      (p) => (p.season === season || p.season === "all") && p.available && p.popular,
    );

    const target = matching[0] ?? products.find((p) => p.season === season) ?? products[0];
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
   */
  public static getRecommendations(
    products: Product[],
    history: PurchaseHistoryRecord[],
    date: Date = new Date(),
  ): Suggestion[] {
    const habit = this.generateHabitRecommendations(products, history).slice(0, 1);
    const seasonal = this.generateSeasonalRecommendations(products, date).slice(0, 1);
    const substitute = this.generateSubstituteRecommendations(products).slice(0, 1);

    return [...habit, ...seasonal, ...substitute];
  }
}
