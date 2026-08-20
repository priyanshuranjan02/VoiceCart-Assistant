import type { ListItem, Activity, PurchaseHistoryRecord } from "@/domain/shopping";
import type { Language } from "@/lib/voicecart/i18n";

export interface StoredAppState {
  version: number;
  items: ListItem[];
  activity: Activity[];
  history: PurchaseHistoryRecord[];
  lang: Language;
  theme?: "light" | "dark";
}

const STORAGE_KEY = "voicecart_v1_state";
const CURRENT_VERSION = 1;

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
}

export class PersistenceService {
  private static memoryStore = new MemoryFallbackStore();

  private static getStorage(): Storage | MemoryFallbackStore {
    if (typeof window === "undefined") {
      return this.memoryStore;
    }
    try {
      const testKey = "__voicecart_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    } catch {
      return this.memoryStore;
    }
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
      return {
        version: CURRENT_VERSION,
        items: Array.isArray(parsed.items) ? parsed.items : defaults.items,
        activity: Array.isArray(parsed.activity) ? parsed.activity : defaults.activity,
        history: Array.isArray(parsed.history) ? parsed.history : (defaults.history ?? []),
        lang: parsed.lang === "hi" || parsed.lang === "en" ? parsed.lang : defaults.lang,
        theme: parsed.theme,
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

      const merged: StoredAppState = {
        ...existing,
        ...state,
        version: CURRENT_VERSION,
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
    } catch (e) {
      console.warn("Failed to clear storage:", e);
    }
  }
}
