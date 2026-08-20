export type Category =
  "Dairy" | "Produce" | "Bakery" | "Snacks" | "Personal Care" | "Beverages" | "Pantry" | "Other";

export type Intent =
  "ADD" | "REMOVE" | "UPDATE" | "COMPLETE" | "SEARCH" | "RECOMMEND" | "CLEAR" | "UNKNOWN";

export type ParsedAction =
  "add" | "remove" | "search" | "suggest" | "update" | "complete" | "clear" | "unknown";

export type ParsedCommand = {
  rawTranscript: string;
  transcript: string;
  intent: Intent;
  action: ParsedAction; // Backward compatibility with existing UI components
  item?: string;
  product?: string;
  brand?: string;
  quantity?: number;
  unit?: string;
  category?: Category;
  maxPrice?: number;
  minPrice?: number;
  organic?: boolean;
  attributes: string[];
  confidence: number;
};
