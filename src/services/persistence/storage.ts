import type { ListItem, Activity, PurchaseHistoryRecord } from "@/domain/shopping";
import type { Language } from "@/lib/voicecart/i18n";

export interface StoredAppState {
  version: number;
  items: ListItem[];
  activity: Activity[];
  history: PurchaseHistoryRecord[];
  lang: Language;
  theme?: "light" | "dark" | "system";
}

const STORAGE_KEY = "voicecart_v1_state";
const CURRENT_VERSION = 2;

const VALID_CATEGORIES = new Set<string>([
  "Dairy",
  "Produce",
  "Bakery",
  "Snacks",
  "Personal Care",
  "Beverages",
  "Pantry",
  "Other",
]);

const VALID_ACTIVITY_KINDS = new Set<string>([
  "add",
  "remove",
  "search",
  "complete",
  "update",
  "clear",
  "suggest",
]);

export function isValidListItem(item: unknown): item is ListItem {
  if (!item || typeof item !== "object") return false;
  const i = item as Record<string, unknown>;
  if (typeof i.id !== "string" || !i.id.trim()) return false;
  if (typeof i.name !== "string" || !i.name.trim()) return false;
  if (typeof i.category !== "string" || !VALID_CATEGORIES.has(i.category)) return false;
  if (typeof i.quantity !== "number" || !Number.isFinite(i.quantity) || i.quantity <= 0)
    return false;
  if (typeof i.done !== "boolean") return false;
  if (i.unit !== undefined && typeof i.unit !== "string") return false;
  if (
    i.addedAt !== undefined &&
    (typeof i.addedAt !== "number" || !Number.isFinite(i.addedAt) || i.addedAt <= 0)
  )
    return false;
  if (
    i.updatedAt !== undefined &&
    (typeof i.updatedAt !== "number" || !Number.isFinite(i.updatedAt) || i.updatedAt <= 0)
  )
    return false;
  if (i.brand !== undefined && (typeof i.brand !== "string" || !i.brand.trim())) return false;
  if (
    i.price !== undefined &&
    (typeof i.price !== "number" || !Number.isFinite(i.price) || i.price < 0)
  )
    return false;
  return true;
}

export function normalizeListItem(item: ListItem): ListItem {
  return {
    ...item,
    unit: typeof item.unit === "string" && item.unit ? item.unit : "pieces",
    addedAt: typeof item.addedAt === "number" && item.addedAt > 0 ? item.addedAt : Date.now(),
    updatedAt:
      typeof item.updatedAt === "number" && item.updatedAt > 0 ? item.updatedAt : Date.now(),
  };
}

export function isValidPurchaseRecord(rec: unknown): rec is PurchaseHistoryRecord {
  if (!rec || typeof rec !== "object") return false;
  const r = rec as Record<string, unknown>;
  if (typeof r.id !== "string" || !r.id.trim()) return false;
  if (typeof r.productName !== "string" || !r.productName.trim()) return false;
  if (typeof r.category !== "string" || !VALID_CATEGORIES.has(r.category)) return false;
  if (typeof r.quantity !== "number" || !Number.isFinite(r.quantity) || r.quantity <= 0)
    return false;
  if (r.unit !== undefined && typeof r.unit !== "string") return false;
  if (typeof r.timestamp !== "number" || !Number.isFinite(r.timestamp) || r.timestamp <= 0)
    return false;
  return true;
}

export function normalizePurchaseRecord(rec: PurchaseHistoryRecord): PurchaseHistoryRecord {
  return {
    ...rec,
    unit: typeof rec.unit === "string" && rec.unit ? rec.unit : "pieces",
  };
}

export function isValidActivity(act: unknown): act is Activity {
  if (!act || typeof act !== "object") return false;
  const a = act as Record<string, unknown>;
  if (typeof a.id !== "string" || !a.id.trim()) return false;
  if (typeof a.kind !== "string" || !VALID_ACTIVITY_KINDS.has(a.kind)) return false;
  if (typeof a.label !== "string" || !a.label.trim()) return false;
  if (typeof a.at !== "number" || !Number.isFinite(a.at) || a.at <= 0) return false;
  return true;
}

class MemoryFallbackStore {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

export class PersistenceService {
  private static memoryStore = new MemoryFallbackStore();
  private static isMemoryOnly = false;

  public static getStorage(): Storage | MemoryFallbackStore {
    if (typeof window === "undefined") {
      this.isMemoryOnly = true;
      return this.memoryStore;
    }
    try {
      const testKey = "__voicecart_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      this.isMemoryOnly = false;
      return window.localStorage;
    } catch {
      this.isMemoryOnly = true;
      return this.memoryStore;
    }
  }

  public static isUsingMemoryFallback(): boolean {
    this.getStorage();
    return this.isMemoryOnly;
  }

  public static loadState(defaults: {
    items: ListItem[];
    activity: Activity[];
    history?: PurchaseHistoryRecord[];
    lang: Language;
  }): StoredAppState {
    const storage = this.getStorage();
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) {
        return {
          version: CURRENT_VERSION,
          items: defaults.items,
          activity: defaults.activity,
          history: defaults.history ?? [],
          lang: defaults.lang,
        };
      }

      const parsed = JSON.parse(raw) as Partial<StoredAppState>;

      // Validate and sanitize items (rejects individual malformed items without discarding valid items)
      const sanitizedItems = Array.isArray(parsed.items)
        ? parsed.items.filter(isValidListItem).map(normalizeListItem)
        : defaults.items;

      // Validate and sanitize activity records
      const sanitizedActivity = Array.isArray(parsed.activity)
        ? parsed.activity.filter(isValidActivity)
        : defaults.activity;

      // Validate stored version as a finite number
      const isVersionFinite = typeof parsed.version === "number" && Number.isFinite(parsed.version);
      const storedVersion = isVersionFinite ? (parsed.version as number) : null;

      // Unversioned, missing, malformed (e.g. NaN, string, negative), or v1 (< 2)
      // triggers the legacy v1 migration to clean up historical seeded test artifacts
      const isLegacyV1 = storedVersion === null || storedVersion < 2;

      // Safe schema migration for purchase history:
      // In v1, sample fake purchase records had IDs "h1", "h2", "h3".
      // When migrating from v1, missing, or malformed version, strip out ONLY these known synthetic records
      // while safely preserving all authentic user completion records.
      const rawHistory = Array.isArray(parsed.history) ? parsed.history : (defaults.history ?? []);
      const SYNTHETIC_V1_HISTORY_IDS = new Set(["h1", "h2", "h3"]);
      const historyToValidate = isLegacyV1
        ? rawHistory.filter(
            (h) =>
              h &&
              typeof h === "object" &&
              "id" in h &&
              !SYNTHETIC_V1_HISTORY_IDS.has(String(h.id)),
          )
        : rawHistory;
      const sanitizedHistory = historyToValidate
        .filter(isValidPurchaseRecord)
        .map(normalizePurchaseRecord);

      const validLang: Language =
        parsed.lang === "hi" || parsed.lang === "en" ? parsed.lang : defaults.lang;

      const validTheme: StoredAppState["theme"] =
        parsed.theme === "dark" || parsed.theme === "light" || parsed.theme === "system"
          ? parsed.theme
          : undefined;

      // Preserve future versions greater than CURRENT_VERSION without silently rewriting them to 2
      const effectiveVersion =
        storedVersion !== null && storedVersion > CURRENT_VERSION ? storedVersion : CURRENT_VERSION;

      return {
        version: effectiveVersion,
        items: sanitizedItems,
        activity: sanitizedActivity,
        history: sanitizedHistory,
        lang: validLang,
        theme: validTheme,
      };
    } catch (e) {
      console.warn("Failed to load stored state, using defaults:", e);
      return {
        version: CURRENT_VERSION,
        items: defaults.items,
        activity: defaults.activity,
        history: defaults.history ?? [],
        lang: defaults.lang,
      };
    }
  }

  public static saveState(state: Partial<StoredAppState>): void {
    const storage = this.getStorage();
    try {
      const existing = this.loadState({
        items: [],
        activity: [],
        lang: "en",
      });

      const effectiveVersion = Math.max(existing.version, CURRENT_VERSION);

      const merged: StoredAppState = {
        ...existing,
        ...state,
        version: effectiveVersion,
      };

      storage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {
      console.warn("Failed to save state to storage:", e);
    }
  }

  public static clearState(): void {
    const storage = this.getStorage();
    try {
      storage.removeItem(STORAGE_KEY);
      this.memoryStore.clear();
    } catch (e) {
      console.warn("Failed to clear storage:", e);
    }
  }
}
