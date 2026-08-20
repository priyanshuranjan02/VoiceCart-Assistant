import { describe, it, expect } from "vitest";
import { ShoppingListEngine } from "@/services/shopping/listEngine";
import { inferCategory } from "@/services/shopping/categorizer";
import type { ListItem } from "@/domain/shopping";

describe("Shopping List Engine", () => {
  const sampleItems: ListItem[] = [
    {
      id: "1",
      name: "Milk",
      category: "Dairy",
      quantity: 2,
      unit: "bottles",
      done: false,
      addedAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: "2",
      name: "Bread",
      category: "Bakery",
      quantity: 1,
      unit: "loaf",
      done: true,
      addedAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  it("adds a new unique item", () => {
    const { items, addedItem, isMerged } = ShoppingListEngine.addItem(sampleItems, {
      name: "Apples",
      quantity: 4,
      unit: "pieces",
    });

    expect(items.length).toBe(3);
    expect(addedItem.name).toBe("Apples");
    expect(addedItem.quantity).toBe(4);
    expect(isMerged).toBe(false);
  });

  it("merges quantity when adding an existing item", () => {
    const { items, addedItem, isMerged } = ShoppingListEngine.addItem(sampleItems, {
      name: "Milk",
      quantity: 3,
      unit: "bottles",
    });

    expect(items.length).toBe(2);
    expect(addedItem.name).toBe("Milk");
    expect(addedItem.quantity).toBe(5); // 2 + 3
    expect(isMerged).toBe(true);
  });

  it("removes item by ID", () => {
    const { items, removedItem } = ShoppingListEngine.removeItem(sampleItems, "1");
    expect(items.length).toBe(1);
    expect(removedItem?.name).toBe("Milk");
  });

  it("removes item by name", () => {
    const { items, removedItem } = ShoppingListEngine.removeByName(sampleItems, "Bread");
    expect(items.length).toBe(1);
    expect(removedItem?.id).toBe("2");
  });

  it("updates item quantity", () => {
    const { items, updatedItem } = ShoppingListEngine.updateQuantity(sampleItems, "Milk", 6);
    expect(updatedItem?.quantity).toBe(6);
    const found = items.find((i) => i.name === "Milk");
    expect(found?.quantity).toBe(6);
  });

  it("toggles item completion", () => {
    const { items, toggledItem } = ShoppingListEngine.toggleItem(sampleItems, "1");
    expect(toggledItem?.done).toBe(true);
    const found = items.find((i) => i.id === "1");
    expect(found?.done).toBe(true);
  });

  it("correctly categorizes known and novel products", () => {
    expect(inferCategory("Milk")).toBe("Dairy");
    expect(inferCategory("Apples")).toBe("Produce");
    expect(inferCategory("Croissant")).toBe("Bakery");
    expect(inferCategory("Chips")).toBe("Snacks");
    expect(inferCategory("Toothpaste")).toBe("Personal Care");
    expect(inferCategory("Mysterious Unknown Object")).toBe("Other");
  });
});
