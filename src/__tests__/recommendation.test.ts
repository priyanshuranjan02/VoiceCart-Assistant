import { describe, it, expect } from "vitest";
import { RecommendationEngine, getCurrentSeason } from "@/services/recommendations/engine";
import { PRODUCTS, INITIAL_PURCHASE_HISTORY, SAMPLE_PURCHASE_HISTORY } from "@/lib/voicecart/data";
import type { PurchaseHistoryRecord } from "@/domain/shopping";

describe("Recommendation Engine", () => {
  it("determines season from month", () => {
    // May = Summer (month index 4)
    expect(getCurrentSeason(new Date(2026, 4, 15))).toBe("summer");
    // July = Monsoon (month index 6)
    expect(getCurrentSeason(new Date(2026, 6, 15))).toBe("monsoon");
    // December = Winter (month index 11)
    expect(getCurrentSeason(new Date(2026, 11, 15))).toBe("winter");
  });

  it("generates dynamic seasonal recommendations", () => {
    const summerRecs = RecommendationEngine.generateSeasonalRecommendations(
      PRODUCTS,
      new Date(2026, 4, 1),
    );
    expect(summerRecs.length).toBeGreaterThan(0);
    expect(summerRecs[0].kind).toBe("seasonal");
    expect(summerRecs[0].title).toBe("Mangoes");
  });

  it("guarantees a fresh user installation has empty purchase history", () => {
    expect(INITIAL_PURCHASE_HISTORY).toEqual([]);
    const freshRecs = RecommendationEngine.getRecommendations(PRODUCTS, INITIAL_PURCHASE_HISTORY);
    const habitRecs = freshRecs.filter((r) => r.kind === "habit");
    expect(habitRecs).toEqual([]);
  });

  it("generates habit recommendations from history", () => {
    const habitRecs = RecommendationEngine.generateHabitRecommendations(
      PRODUCTS,
      SAMPLE_PURCHASE_HISTORY,
    );
    expect(habitRecs.length).toBeGreaterThan(0);
    expect(habitRecs[0].kind).toBe("habit");
    expect(habitRecs[0].title).toBe("Milk");
  });

  it("never fabricates habit recommendations when history is empty", () => {
    const habitRecs = RecommendationEngine.generateHabitRecommendations(PRODUCTS, []);
    expect(habitRecs).toEqual([]);
  });

  it("requires at least 2 purchase records of the same item to establish a habit interval", () => {
    const singlePurchaseHistory: PurchaseHistoryRecord[] = [
      {
        id: "single-1",
        productName: "Milk",
        category: "Dairy",
        quantity: 1,
        unit: "bottles",
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3,
      },
    ];

    const habitRecs = RecommendationEngine.generateHabitRecommendations(
      PRODUCTS,
      singlePurchaseHistory,
    );
    expect(habitRecs).toEqual([]);
  });

  it("calculates exact interval and elapsed days for verified repeat purchases", () => {
    const now = 1000000000000;
    const dayMs = 1000 * 60 * 60 * 24;

    const repeatHistory: PurchaseHistoryRecord[] = [
      {
        id: "rep-1",
        productName: "Bread",
        category: "Bakery",
        quantity: 1,
        unit: "loaf",
        timestamp: now - dayMs * 4, // 4 days ago
      },
      {
        id: "rep-2",
        productName: "Bread",
        category: "Bakery",
        quantity: 1,
        unit: "loaf",
        timestamp: now - dayMs * 14, // 14 days ago (10-day interval)
      },
    ];

    const habitRecs = RecommendationEngine.generateHabitRecommendations(
      PRODUCTS,
      repeatHistory,
      now,
    );

    expect(habitRecs.length).toBe(1);
    expect(habitRecs[0].title).toBe("Bread");
    expect(habitRecs[0].line1).toContain("every 10 days");
    expect(habitRecs[0].line2).toContain("4 days ago");
  });

  it("safely ignores historical purchases for products missing from the catalog", () => {
    const missingProductHistory: PurchaseHistoryRecord[] = [
      {
        id: "m-1",
        productName: "DiscontinuedAncientItem",
        category: "Other",
        quantity: 1,
        unit: "pcs",
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2,
      },
      {
        id: "m-2",
        productName: "DiscontinuedAncientItem",
        category: "Other",
        quantity: 1,
        unit: "pcs",
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 8,
      },
    ];

    const habitRecs = RecommendationEngine.generateHabitRecommendations(
      PRODUCTS,
      missingProductHistory,
    );
    expect(habitRecs).toEqual([]);
  });

  it("generates substitute recommendations", () => {
    const subRecs = RecommendationEngine.generateSubstituteRecommendations(PRODUCTS);
    expect(subRecs.length).toBeGreaterThan(0);
    expect(subRecs[0].kind).toBe("substitute");
    expect(subRecs[0].cta).toBe("options");
  });

  it("aggregates all 3 recommendation pillars and guarantees unique product IDs", () => {
    const all = RecommendationEngine.getRecommendations(
      PRODUCTS,
      SAMPLE_PURCHASE_HISTORY,
      new Date(2026, 4, 1),
    );
    expect(all.length).toBe(3);
    const kinds = all.map((r) => r.kind);
    expect(kinds).toContain("habit");
    expect(kinds).toContain("seasonal");
    expect(kinds).toContain("substitute");

    const productIds = all.map((r) => r.productId);
    const uniqueIds = new Set(productIds);
    expect(uniqueIds.size).toBe(all.length);
  });
});
