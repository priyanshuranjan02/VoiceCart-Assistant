export type RecommendationKind = "habit" | "seasonal" | "substitute";

export type Suggestion = {
  id: string;
  kind: RecommendationKind;
  productId: string;
  title: string;
  line1: string;
  line2?: string;
  cta: "add" | "options";
  reason?: string;
};
