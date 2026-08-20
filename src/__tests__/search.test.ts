import { describe, it, expect } from "vitest";
import { ProductSearchEngine } from "@/services/search/searchEngine";
import { PRODUCTS } from "@/lib/voicecart/data";

describe("Product Search Engine", () => {
  it("searches by product name", () => {
    const results = ProductSearchEngine.search(PRODUCTS, { query: "milk" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((p) => p.name === "Milk")).toBe(true);
  });

  it("filters by brand", () => {
    const results = ProductSearchEngine.search(PRODUCTS, { brand: "Amul" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.brand === "Amul")).toBe(true);
  });

  it("filters by price constraint under ₹200", () => {
    const results = ProductSearchEngine.search(PRODUCTS, { filter: "Under ₹200" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.price < 200)).toBe(true);
  });

  it("filters by organic status", () => {
    const results = ProductSearchEngine.search(PRODUCTS, { filter: "Organic" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.organic === true)).toBe(true);
  });

  it("handles composite natural-language query 'organic apples under 200'", () => {
    const results = ProductSearchEngine.search(PRODUCTS, {
      query: "organic apples under 200",
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.organic && p.price <= 200)).toBe(true);
  });

  it("handles combined search 'Find NatureFresh organic apples under 200'", () => {
    const results = ProductSearchEngine.search(PRODUCTS, {
      query: "Find NatureFresh organic apples under 200",
    });
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((p) => p.brand === "NatureFresh" && p.organic === true && p.price <= 200),
    ).toBe(true);
  });

  it("handles combined search with size 'Find 1 kg apples under 200'", () => {
    const results = ProductSearchEngine.search(PRODUCTS, {
      query: "Find 1 kg apples under 200",
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.size === "1 kg" && p.price <= 200)).toBe(true);
  });

  it("handles no results for non-existent product", () => {
    const results = ProductSearchEngine.search(PRODUCTS, {
      query: "NonExistentExtravagantItem12345",
    });
    expect(results.length).toBe(0);
  });
});
