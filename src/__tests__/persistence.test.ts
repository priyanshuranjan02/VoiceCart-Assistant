import { describe, it, expect } from "vitest";
import { PersistenceService } from "@/services/persistence/storage";
import { INITIAL_LIST } from "@/lib/voicecart/data";

describe("Persistence Service", () => {
  it("loads default state when storage is empty", () => {
    PersistenceService.clearState();
    const loaded = PersistenceService.loadState({
      items: INITIAL_LIST,
      activity: [],
      lang: "en",
    });

    expect(loaded.version).toBe(1);
    expect(loaded.items.length).toBe(INITIAL_LIST.length);
    expect(loaded.lang).toBe("en");
  });

  it("saves and reloads state correctly", () => {
    const customItems = [
      {
        id: "test-1",
        name: "Organic Honey",
        category: "Pantry" as const,
        quantity: 2,
        unit: "jars",
        done: false,
        addedAt: 1000,
        updatedAt: 1000,
      },
    ];

    PersistenceService.saveState({
      items: customItems,
      lang: "hi",
    });

    const loaded = PersistenceService.loadState({
      items: [],
      activity: [],
      lang: "en",
    });

    expect(loaded.items.length).toBe(1);
    expect(loaded.items[0].name).toBe("Organic Honey");
    expect(loaded.lang).toBe("hi");
  });

  it("recovers gracefully from corrupted data", () => {
    // Save corrupted invalid json
    const storage = (PersistenceService as unknown as { getStorage: () => Storage }).getStorage?.();
    if (storage) {
      storage.setItem("voicecart_v1_state", "{invalid: corrupt JSON}}");
    }

    const loaded = PersistenceService.loadState({
      items: INITIAL_LIST,
      activity: [],
      lang: "en",
    });

    expect(loaded.items.length).toBe(INITIAL_LIST.length);
    expect(loaded.lang).toBe("en");
  });
});
