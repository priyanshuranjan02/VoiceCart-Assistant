import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import {
  INITIAL_LIST,
  INITIAL_PURCHASE_HISTORY,
  PRODUCTS,
  type Category,
  type ListItem,
  type Activity,
  type PurchaseHistoryRecord,
  type Suggestion,
} from "./data";
import { translate, type Language, type TranslationKey } from "./i18n";
import { ShoppingListEngine } from "@/services/shopping/listEngine";
import { PersistenceService } from "@/services/persistence/storage";
import { RecommendationEngine } from "@/services/recommendations/engine";

export type { Activity };

type VoiceCartState = {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TranslationKey) => string;
  items: ListItem[];
  activity: Activity[];
  history: PurchaseHistoryRecord[];
  suggestions: Suggestion[];
  addItem: (input: {
    name: string;
    category?: Category;
    quantity?: number;
    unit?: string;
    brand?: string;
    price?: number;
  }) => void;
  removeItem: (id: string) => void;
  removeByName: (name: string) => boolean;
  updateQuantity: (idOrName: string, quantity: number) => boolean;
  toggleItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clearList: () => void;
  clearCompleted: () => void;
  logSearch: (query: string) => void;
};

const VoiceCartContext = createContext<VoiceCartState | null>(null);

const uid = () => Math.random().toString(36).slice(2, 9);

const INITIAL_ACTIVITY: Activity[] = [
  { id: uid(), kind: "add", label: "Added Milk × 2", at: Date.now() - 1000 * 60 * 6 },
  { id: uid(), kind: "add", label: "Added Apples × 5", at: Date.now() - 1000 * 60 * 24 },
  { id: uid(), kind: "search", label: "Searched toothpaste", at: Date.now() - 1000 * 60 * 52 },
  { id: uid(), kind: "remove", label: "Removed Bread", at: Date.now() - 1000 * 60 * 90 },
];

export function VoiceCartProvider({ children }: { children: ReactNode }) {
  // Load persisted state or fallback to initial defaults
  const [persisted] = useState(() =>
    PersistenceService.loadState({
      items: INITIAL_LIST,
      activity: INITIAL_ACTIVITY,
      history: INITIAL_PURCHASE_HISTORY,
      lang: "en",
    }),
  );

  const [lang, setLangState] = useState<Language>(persisted.lang);
  const [items, setItems] = useState<ListItem[]>(persisted.items);
  const [activity, setActivity] = useState<Activity[]>(persisted.activity);
  const [history, setHistory] = useState<PurchaseHistoryRecord[]>(persisted.history);

  // Sync with localStorage on state changes
  useEffect(() => {
    PersistenceService.saveState({
      items,
      activity,
      history,
      lang,
    });
  }, [items, activity, history, lang]);

  // Mirror of `items` and `history` so callbacks can read without stale closure
  const itemsRef = useRef<ListItem[]>(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    PersistenceService.saveState({ lang: newLang });
  }, []);

  const log = useCallback(
    (kind: Activity["kind"], label: string, details?: Record<string, unknown>) => {
      setActivity((prev) =>
        [{ id: uid(), kind, label, at: Date.now(), details }, ...prev].slice(0, 20),
      );
    },
    [],
  );

  const addItem = useCallback<VoiceCartState["addItem"]>(
    ({ name, category, quantity = 1, unit = "pieces", brand, price }) => {
      const result = ShoppingListEngine.addItem(itemsRef.current, {
        name,
        category,
        quantity,
        unit,
        brand,
        price,
      });

      setItems(result.items);

      // Record to purchase history for smart recommendations
      const newHistoryRecord: PurchaseHistoryRecord = {
        id: uid(),
        productName: result.addedItem.name,
        category: result.addedItem.category,
        quantity,
        unit,
        timestamp: Date.now(),
      };
      setHistory((prev) => [newHistoryRecord, ...prev].slice(0, 50));

      const label = result.isMerged
        ? `Updated ${result.addedItem.name} to × ${result.addedItem.quantity}`
        : `Added ${result.addedItem.name} × ${quantity}`;

      log("add", label);
      toast.success(label);
    },
    [log],
  );

  const removeItem = useCallback<VoiceCartState["removeItem"]>(
    (id) => {
      const { items: newItems, removedItem } = ShoppingListEngine.removeItem(itemsRef.current, id);
      if (!removedItem) return;
      setItems(newItems);
      log("remove", `Removed ${removedItem.name}`);
      toast(`Removed ${removedItem.name}`);
    },
    [log],
  );

  const removeByName = useCallback<VoiceCartState["removeByName"]>(
    (name) => {
      const { items: newItems, removedItem } = ShoppingListEngine.removeByName(
        itemsRef.current,
        name,
      );
      if (!removedItem) return false;
      setItems(newItems);
      log("remove", `Removed ${removedItem.name}`);
      toast(`Removed ${removedItem.name}`);
      return true;
    },
    [log],
  );

  const updateQuantity = useCallback<VoiceCartState["updateQuantity"]>(
    (idOrName, quantity) => {
      const { items: newItems, updatedItem } = ShoppingListEngine.updateQuantity(
        itemsRef.current,
        idOrName,
        quantity,
      );
      if (!updatedItem) return false;
      setItems(newItems);
      log("update", `Updated ${updatedItem.name} quantity to ${updatedItem.quantity}`);
      toast.success(`Updated ${updatedItem.name} to × ${updatedItem.quantity}`);
      return true;
    },
    [log],
  );

  const toggleItem = useCallback<VoiceCartState["toggleItem"]>(
    (id) => {
      const { items: newItems, toggledItem } = ShoppingListEngine.toggleItem(itemsRef.current, id);
      if (!toggledItem) return;
      setItems(newItems);
      if (toggledItem.done) {
        log("complete", `Completed ${toggledItem.name}`);
        // Add to history
        setHistory((prev) => [
          {
            id: uid(),
            productName: toggledItem.name,
            category: toggledItem.category,
            quantity: toggledItem.quantity,
            unit: toggledItem.unit,
            timestamp: Date.now(),
          },
          ...prev,
        ]);
      }
    },
    [log],
  );

  const setQuantity = useCallback<VoiceCartState["setQuantity"]>((id, quantity) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i)),
    );
  }, []);

  const clearList = useCallback(() => {
    setItems([]);
    log("clear", "Cleared shopping list");
    toast("Shopping list cleared");
  }, [log]);

  const clearCompleted = useCallback(() => {
    setItems((prev) => prev.filter((i) => !i.done));
    log("clear", "Cleared completed items");
    toast("Cleared completed items");
  }, [log]);

  const logSearch = useCallback((query: string) => log("search", `Searched ${query}`), [log]);

  // Dynamic recommendations based on current date and purchase history
  const suggestions = useMemo(() => {
    return RecommendationEngine.getRecommendations(PRODUCTS, history, new Date());
  }, [history]);

  const value = useMemo<VoiceCartState>(
    () => ({
      lang,
      setLang,
      t: (key) => translate(key, lang),
      items,
      activity,
      history,
      suggestions,
      addItem,
      removeItem,
      removeByName,
      updateQuantity,
      toggleItem,
      setQuantity,
      clearList,
      clearCompleted,
      logSearch,
    }),
    [
      lang,
      setLang,
      items,
      activity,
      history,
      suggestions,
      addItem,
      removeItem,
      removeByName,
      updateQuantity,
      toggleItem,
      setQuantity,
      clearList,
      clearCompleted,
      logSearch,
    ],
  );

  return <VoiceCartContext.Provider value={value}>{children}</VoiceCartContext.Provider>;
}

export function useVoiceCart() {
  const ctx = useContext(VoiceCartContext);
  if (!ctx) throw new Error("useVoiceCart must be used within VoiceCartProvider");
  return ctx;
}
