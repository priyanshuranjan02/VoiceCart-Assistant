import type { Category } from "@/domain/command";
import type { ListItem } from "@/domain/shopping";
import { inferCategory } from "./categorizer";

const generateId = () => Math.random().toString(36).slice(2, 9);

export interface AddItemParams {
  name: string;
  category?: Category;
  quantity?: number;
  unit?: string;
  brand?: string;
  price?: number;
}

export class ShoppingListEngine {
  /**
   * Adds an item to the list. If an item with the same name exists, merges quantities.
   */
  public static addItem(
    currentItems: ListItem[],
    params: AddItemParams,
  ): { items: ListItem[]; addedItem: ListItem; isMerged: boolean } {
    const name = params.name.trim();
    const category = params.category ?? inferCategory(name);
    const quantity = Math.max(1, params.quantity ?? 1);
    const unit = params.unit ?? "pieces";
    const now = Date.now();

    const existingIndex = currentItems.findIndex(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );

    if (existingIndex >= 0) {
      const existing = currentItems[existingIndex];
      const updatedItem: ListItem = {
        ...existing,
        quantity: existing.quantity + quantity,
        unit: params.unit ?? existing.unit,
        done: false, // unmark done if adding more
        updatedAt: now,
      };

      const newItems = [...currentItems];
      newItems[existingIndex] = updatedItem;

      return {
        items: newItems,
        addedItem: updatedItem,
        isMerged: true,
      };
    }

    const newItem: ListItem = {
      id: generateId(),
      name: name.replace(/^\w/, (c) => c.toUpperCase()),
      category,
      quantity,
      unit,
      done: false,
      brand: params.brand,
      price: params.price,
      addedAt: now,
      updatedAt: now,
    };

    return {
      items: [...currentItems, newItem],
      addedItem: newItem,
      isMerged: false,
    };
  }

  /**
   * Removes an item by ID.
   */
  public static removeItem(
    currentItems: ListItem[],
    id: string,
  ): { items: ListItem[]; removedItem?: ListItem } {
    const removedItem = currentItems.find((i) => i.id === id);
    return {
      items: currentItems.filter((i) => i.id !== id),
      removedItem,
    };
  }

  /**
   * Removes an item by product name (fuzzy/case-insensitive match).
   */
  public static removeByName(
    currentItems: ListItem[],
    name: string,
  ): { items: ListItem[]; removedItem?: ListItem } {
    const clean = name.toLowerCase().trim();
    const removedItem = currentItems.find(
      (i) => i.name.toLowerCase() === clean || i.name.toLowerCase().includes(clean),
    );

    if (!removedItem) {
      return { items: currentItems, removedItem: undefined };
    }

    return {
      items: currentItems.filter((i) => i.id !== removedItem.id),
      removedItem,
    };
  }

  /**
   * Updates an item's exact quantity or sets by name.
   */
  public static updateQuantity(
    currentItems: ListItem[],
    idOrName: string,
    newQuantity: number,
  ): { items: ListItem[]; updatedItem?: ListItem } {
    const qty = Math.max(1, newQuantity);
    const clean = idOrName.toLowerCase().trim();

    let updatedItem: ListItem | undefined = undefined;

    const newItems = currentItems.map((item) => {
      if (item.id === idOrName || item.name.toLowerCase() === clean) {
        updatedItem = { ...item, quantity: qty, updatedAt: Date.now() };
        return updatedItem;
      }
      return item;
    });

    return { items: newItems, updatedItem };
  }

  /**
   * Toggles an item's completion status.
   */
  public static toggleItem(
    currentItems: ListItem[],
    id: string,
  ): { items: ListItem[]; toggledItem?: ListItem } {
    let toggledItem: ListItem | undefined = undefined;

    const newItems = currentItems.map((item) => {
      if (item.id === id) {
        toggledItem = { ...item, done: !item.done, updatedAt: Date.now() };
        return toggledItem;
      }
      return item;
    });

    return { items: newItems, toggledItem };
  }

  /**
   * Clears all items or completed items.
   */
  public static clear(currentItems: ListItem[], onlyCompleted = false): ListItem[] {
    if (onlyCompleted) {
      return currentItems.filter((item) => !item.done);
    }
    return [];
  }
}
