import { motion, useReducedMotion } from "motion/react";
import { Check, Minus, MoreHorizontal, Plus, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { springs } from "@/lib/voicecart/motion";
import type { ListItem } from "@/lib/voicecart/data";
import { cn } from "@/lib/utils";

type Props = {
  item: ListItem;
  onToggle: () => void;
  onRemove: () => void;
  onQuantity: (quantity: number) => void;
};

export function ShoppingListItem({ item, onToggle, onRemove, onQuantity }: Props) {
  const reduced = useReducedMotion();

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, height: 0, marginTop: 0 }}
      transition={springs.ui}
      className="group flex items-center gap-3 rounded-xl border border-transparent px-2 py-2.5 transition-colors hover:border-border hover:bg-glass"
    >
      <motion.button
        type="button"
        onClick={onToggle}
        whileTap={{ scale: 0.88 }}
        transition={springs.snap}
        role="checkbox"
        aria-checked={item.done}
        aria-label={`Mark ${item.name} as ${item.done ? "not bought" : "bought"}`}
        className={cn(
          "grid h-6 w-6 shrink-0 place-items-center rounded-lg border transition-colors",
          item.done
            ? "border-success/60 bg-success/20 text-success"
            : "border-border-strong bg-glass text-transparent hover:border-primary/60",
        )}
      >
        <motion.span
          initial={false}
          animate={{ scale: item.done ? 1 : 0.3, opacity: item.done ? 1 : 0 }}
          transition={springs.snap}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </motion.span>
      </motion.button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium transition-all",
            item.done ? "text-muted-foreground line-through opacity-60" : "text-foreground",
          )}
        >
          {item.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {item.quantity} {item.unit}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 sm:opacity-60">
        <button
          type="button"
          onClick={() => onQuantity(item.quantity - 1)}
          aria-label={`Decrease ${item.name} quantity`}
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onQuantity(item.quantity + 1)}
          aria-label={`Increase ${item.name} quantity`}
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`More actions for ${item.name}`}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuItem onSelect={onToggle}>
            <Check className="h-4 w-4" />
            {item.done ? "Mark as pending" : "Mark as bought"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onRemove} className="text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.li>
  );
}
