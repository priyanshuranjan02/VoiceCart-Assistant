import { describe, it, expect } from "vitest";
import { RecommendationEngine, getCurrentSeason } from "@/services/recommendations/engine";
import { PRODUCTS, INITIAL_PURCHASE_HISTORY } from "@/lib/voicecart/data";

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
  });

  it("generates habit recommendations from history", () => {
    const habitRecs = RecommendationEngine.generateHabitRecommendations(
      PRODUCTS,
      INITIAL_PURCHASE_HISTORY,
    );
    expect(habitRecs.length).toBeGreaterThan(0);
    expect(habitRecs[0].kind).toBe("habit");
    expect(habitRecs[0].title).toBe("Milk");
  });

  it("generates substitute recommendations", () => {
    const subRecs = RecommendationEngine.generateSubstituteRecommendations(PRODUCTS);
    expect(subRecs.length).toBeGreaterThan(0);
    expect(subRecs[0].kind).toBe("substitute");
    expect(subRecs[0].cta).toBe("options");
  });

  it("aggregates all 3 recommendation pillars", () => {
    const all = RecommendationEngine.getRecommendations(
      PRODUCTS,
      INITIAL_PURCHASE_HISTORY,
      new Date(2026, 4, 1),
    );
    expect(all.length).toBe(3);
    const kinds = all.map((r) => r.kind);
    expect(kinds).toContain("habit");
    expect(kinds).toContain("seasonal");
    expect(kinds).toContain("substitute");
  });
});
