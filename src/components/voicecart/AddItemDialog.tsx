import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, type Category } from "@/lib/voicecart/data";
import { useVoiceCart } from "@/lib/voicecart/store";

const UNITS = ["pieces", "bottles", "packs", "kg", "loaf", "bunch", "tubes"];

export function AddItemDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addItem, t } = useVoiceCart();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("pieces");
  const [category, setCategory] = useState<Category>("Produce");

  const submit = () => {
    if (!name.trim()) return;
    addItem({
      name: name.trim().replace(/^\w/, (c) => c.toUpperCase()),
      category,
      quantity: Math.max(1, Number(quantity) || 1),
      unit,
    });
    setName("");
    setQuantity("1");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-md rounded-3xl border-border-strong sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle>{t("addItem")}</DialogTitle>
          <DialogDescription>
            Typing works — but speaking is the faster way to build your list.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="vc-product">Product</Label>
            <Input
              id="vc-product"
              value={name}
              autoFocus
              placeholder="e.g. Greek Yogurt"
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="vc-qty">Quantity</Label>
              <Input
                id="vc-qty"
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger aria-label="Unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as Category)}>
              <SelectTrigger aria-label="Category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full rounded-xl bg-gradient-accent px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition-opacity disabled:opacity-40"
            >
              {t("addToList")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
