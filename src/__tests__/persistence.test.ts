import { describe, it, expect } from "vitest";
import { PersistenceService } from "@/services/persistence/storage";
import { INITIAL_LIST } from "@/lib/voicecart/data";

describe("Persistence Service", () => {
  it("loads default state when storage is empty with empty purchase history for fresh user", () => {
    PersistenceService.clearState();
    const loaded = PersistenceService.loadState({
      items: INITIAL_LIST,
      activity: [],
      history: [],
      lang: "en",
    });

    expect(loaded.version).toBe(2);
    expect(loaded.items.length).toBe(INITIAL_LIST.length);
    expect(loaded.history).toEqual([]);
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
    const storage = PersistenceService.getStorage();
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

  it("sanitizes malformed items from storage array", () => {
    const storage = PersistenceService.getStorage();
    if (storage) {
      const payload = {
        version: 1,
        items: [
          { id: "valid-1", name: "Valid Item", category: "Produce", quantity: 1, done: false },
          { id: "", name: "Missing ID" },
          null,
          { id: "no-name" },
          "not an object",
        ],
        activity: [],
        lang: "en",
      };
      storage.setItem("voicecart_v1_state", JSON.stringify(payload));
    }

    const loaded = PersistenceService.loadState({
      items: INITIAL_LIST,
      activity: [],
      lang: "en",
    });

    expect(loaded.items.length).toBe(1);
    expect(loaded.items[0].id).toBe("valid-1");
  });

  it("falls back to default language when stored language code is invalid", () => {
    const storage = PersistenceService.getStorage();
    if (storage) {
      storage.setItem(
        "voicecart_v1_state",
        JSON.stringify({
          version: 1,
          items: [],
          activity: [],
          lang: "unsupported-lang-code",
        }),
      );
    }

    const loaded = PersistenceService.loadState({
      items: [],
      activity: [],
      lang: "en",
    });

    expect(loaded.lang).toBe("en");
  });

  it("safely migrates v1 state by stripping legacy seeded mock history while preserving user history", () => {
    const storage = PersistenceService.getStorage();
    if (storage) {
      storage.setItem(
        "voicecart_v1_state",
        JSON.stringify({
          version: 1,
          items: [],
          activity: [],
          history: [
            {
              id: "h1",
              productName: "Milk",
              category: "Dairy",
              quantity: 2,
              unit: "bottles",
              timestamp: 1000,
            },
            {
              id: "h2",
              productName: "Milk",
              category: "Dairy",
              quantity: 2,
              unit: "bottles",
              timestamp: 2000,
            },
            {
              id: "h3",
              productName: "Bread",
              category: "Bakery",
              quantity: 1,
              unit: "loaf",
              timestamp: 3000,
            },
            {
              id: "legit-user-rec",
              productName: "Butter",
              category: "Dairy",
              quantity: 1,
              unit: "packs",
              timestamp: 4000,
            },
          ],
          lang: "en",
        }),
      );
    }

    const loaded = PersistenceService.loadState({
      items: [],
      activity: [],
      history: [],
      lang: "en",
    });

    expect(loaded.history.length).toBe(1);
    expect(loaded.history[0].id).toBe("legit-user-rec");
    expect(loaded.history[0].productName).toBe("Butter");
  });

  it("validates field types and rejects records with corrupted or invalid properties", () => {
    const storage = PersistenceService.getStorage();
    if (storage) {
      storage.setItem(
        "voicecart_v1_state",
        JSON.stringify({
          version: 2,
          items: [
            // Valid item
            {
              id: "item-ok",
              name: "Rice",
              category: "Pantry",
              quantity: 1,
              unit: "kg",
              done: false,
              addedAt: 1000,
              updatedAt: 1000,
            },
            // Invalid quantity (negative)
            {
              id: "item-bad-qty",
              name: "Flour",
              category: "Pantry",
              quantity: -5,
              unit: "kg",
              done: false,
              addedAt: 1000,
              updatedAt: 1000,
            },
            // Invalid category
            {
              id: "item-bad-cat",
              name: "Gadget",
              category: "Electronics",
              quantity: 1,
              unit: "pcs",
              done: false,
              addedAt: 1000,
              updatedAt: 1000,
            },
            // Non-boolean done
            {
              id: "item-bad-done",
              name: "Salt",
              category: "Pantry",
              quantity: 1,
              unit: "pack",
              done: "false",
              addedAt: 1000,
              updatedAt: 1000,
            },
          ],
          activity: [
            // Valid activity
            { id: "act-ok", kind: "add", label: "Added Rice", at: 1000 },
            // Invalid kind
            { id: "act-bad-kind", kind: "hack_database", label: "Invalid", at: 1000 },
            // Negative timestamp
            { id: "act-bad-time", kind: "search", label: "Search", at: -1 },
          ],
          history: [
            // Valid history record
            {
              id: "hist-ok",
              productName: "Rice",
              category: "Pantry",
              quantity: 2,
              unit: "kg",
              timestamp: 5000,
            },
            // String quantity
            {
              id: "hist-bad-qty",
              productName: "Rice",
              category: "Pantry",
              quantity: "two",
              unit: "kg",
              timestamp: 5000,
            },
          ],
          lang: "en",
        }),
      );
    }

    const loaded = PersistenceService.loadState({
      items: [],
      activity: [],
      history: [],
      lang: "en",
    });

    expect(loaded.items.length).toBe(1);
    expect(loaded.items[0].id).toBe("item-ok");

    expect(loaded.activity.length).toBe(1);
    expect(loaded.activity[0].id).toBe("act-ok");

    expect(loaded.history.length).toBe(1);
    expect(loaded.history[0].id).toBe("hist-ok");
  });

  it("handles malformed or missing versions safely and preserves genuine records while stripping synthetic v1 items", () => {
    const storage = PersistenceService.getStorage();
    const testVersions = ["corrupted-string", NaN, -5, null, undefined];

    testVersions.forEach((badVersion) => {
      if (storage) {
        storage.setItem(
          "voicecart_v1_state",
          JSON.stringify({
            version: badVersion,
            items: [],
            activity: [],
            history: [
              {
                id: "h1",
                productName: "Milk",
                category: "Dairy",
                quantity: 2,
                unit: "bottles",
                timestamp: 1000,
              },
              {
                id: "h2",
                productName: "Milk",
                category: "Dairy",
                quantity: 2,
                unit: "bottles",
                timestamp: 2000,
              },
              {
                id: "h3",
                productName: "Bread",
                category: "Bakery",
                quantity: 1,
                unit: "loaf",
                timestamp: 3000,
              },
              {
                id: "genuine-purchase",
                productName: "Olive Oil",
                category: "Pantry",
                quantity: 1,
                unit: "bottle",
                timestamp: 6000,
              },
            ],
            lang: "en",
          }),
        );
      }

      const loaded = PersistenceService.loadState({
        items: [],
        activity: [],
        history: [],
        lang: "en",
      });

      expect(loaded.version).toBe(2);
      expect(loaded.history.length).toBe(1);
      expect(loaded.history[0].id).toBe("genuine-purchase");
      expect(loaded.history[0].productName).toBe("Olive Oil");
    });
  });

  it("preserves all valid records without stripping when version is already v2", () => {
    const storage = PersistenceService.getStorage();
    if (storage) {
      storage.setItem(
        "voicecart_v1_state",
        JSON.stringify({
          version: 2,
          items: [],
          activity: [],
          history: [
            {
              id: "v2-purchase",
              productName: "Almonds",
              category: "Snacks",
              quantity: 1,
              unit: "pack",
              timestamp: 8000,
            },
          ],
          lang: "en",
        }),
      );
    }

    const loaded = PersistenceService.loadState({
      items: [],
      activity: [],
      history: [],
      lang: "en",
    });

    expect(loaded.version).toBe(2);
    expect(loaded.history.length).toBe(1);
    expect(loaded.history[0].id).toBe("v2-purchase");
  });

  it("handles future storage versions safely without destructive migration and preserves future version number", () => {
    const storage = PersistenceService.getStorage();
    if (storage) {
      storage.setItem(
        "voicecart_v1_state",
        JSON.stringify({
          version: 3,
          items: [
            {
              id: "item-future",
              name: "Avocado",
              category: "Produce",
              quantity: 2,
              unit: "pcs",
              done: false,
              addedAt: 1000,
              updatedAt: 1000,
            },
          ],
          activity: [],
          history: [
            {
              id: "future-purchase",
              productName: "Avocado",
              category: "Produce",
              quantity: 2,
              unit: "pcs",
              timestamp: 9000,
            },
          ],
          lang: "en",
        }),
      );
    }

    const loaded = PersistenceService.loadState({
      items: [],
      activity: [],
      history: [],
      lang: "en",
    });

    // Version must NOT be silently downgraded to 2
    expect(loaded.version).toBe(3);
    expect(loaded.items.length).toBe(1);
    expect(loaded.items[0].id).toBe("item-future");
    expect(loaded.history.length).toBe(1);
    expect(loaded.history[0].id).toBe("future-purchase");

    // Saving updates must also preserve the future version (version 3)
    PersistenceService.saveState({
      lang: "hi",
    });

    const reloaded = PersistenceService.loadState({
      items: [],
      activity: [],
      history: [],
      lang: "en",
    });
    expect(reloaded.version).toBe(3);
    expect(reloaded.lang).toBe("hi");
  });
});
