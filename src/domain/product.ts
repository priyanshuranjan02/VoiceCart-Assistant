import type { Category } from "./command";

export type Season = "summer" | "winter" | "monsoon" | "all";

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: Category;
  price: number;
  size: string;
  unit: string;
  organic: boolean;
  season?: Season;
  available: boolean;
  substitutes?: string[];
  popular?: boolean;
  aliases?: string[];
  description?: string;
};

export const STANDARD_CATEGORIES: Category[] = [
  "Dairy",
  "Produce",
  "Bakery",
  "Snacks",
  "Personal Care",
  "Beverages",
  "Pantry",
  "Other",
];
