import type { Category } from "./command";

export type ListItem = {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  done: boolean;
  brand?: string;
  price?: number;
  addedAt: number;
  updatedAt: number;
};

export type PurchaseHistoryRecord = {
  id: string;
  productName: string;
  category: Category;
  quantity: number;
  unit: string;
  timestamp: number;
};

export type ActivityKind =
  "add" | "remove" | "search" | "complete" | "update" | "clear" | "suggest";

export type Activity = {
  id: string;
  kind: ActivityKind;
  label: string;
  at: number;
  details?: Record<string, unknown>;
};
