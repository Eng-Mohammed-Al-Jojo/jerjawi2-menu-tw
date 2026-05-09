import { useMemo, useState } from "react";
import ItemRow from "./ItemRow";
import type { Category, Item, Subcategory } from "./Menu";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } }
};

interface Props {
  category: Category;
  subcategories: Subcategory[];
  items: Item[];
  orderSystem: boolean;
  onItemClick?: (item: Item) => void;
  onDetailsClick?: (item: Item) => void;
  defaultOpen?: boolean;
}

export default function CategorySection({ category, subcategories, items, orderSystem, onItemClick, onDetailsClick, defaultOpen = false }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const groupedItems = useMemo(() => {
    const groups: Record<string, Item[]> = {};
    const noSubItems: Item[] = [];

    items.forEach(item => {
      const sub = subcategories.find(s => s.id === item.subcategoryId);
      if (item.subcategoryId && sub) {
        if (sub.visible === false) return;
        if (!groups[item.subcategoryId]) groups[item.subcategoryId] = [];
        groups[item.subcategoryId].push(item);
      } else {
        noSubItems.push(item);
      }
    });

    return { groups, noSubItems };
  }, [items, subcategories]);

  const activeSubcategories = useMemo(() => {
    return subcategories
      .filter(sub => sub.categoryId === category.id && sub.visible !== false && groupedItems.groups[sub.id])
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [category.id, subcategories, groupedItems.groups]);

  if (category.visible === false) return null;

  const catName = category.nameAr || category.name || "";
  const itemCount = items.length;
  const categoryImage = category.image ? `/images/${category.image}` : null;

  return (
    <section className="w-full overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="relative w-full min-h-36 sm:min-h-44 md:min-h-52 rounded-2xl overflow-hidden border border-(--menu-border) text-right group"
        aria-expanded={isOpen}
      >
        {categoryImage ? (
          <img
            src={categoryImage}
            alt={catName}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => { (e.currentTarget.style.display = "none"); }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,var(--menu-primary-50),var(--menu-accent-50))] text-6xl">
            🍽️
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--menu-text)_10%,transparent),color-mix(in_srgb,var(--menu-text)_50%,transparent))]" />

        <div className="relative z-10 min-h-36 sm:min-h-44 md:min-h-52 p-5 sm:p-7 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-(--menu-card-elevated) tracking-tight drop-shadow-lg">
              {catName}
            </h2>
            <p className="text-xs sm:text-sm font-black text-[color-mix(in_srgb,var(--menu-card-elevated)_82%,transparent)] mt-2">
              {itemCount} صنف
            </p>
          </div>

          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="w-12 h-12 rounded-2xl bg-[color-mix(in_srgb,var(--menu-card-elevated)_20%,transparent)] border border-[color-mix(in_srgb,var(--menu-card-elevated)_36%,transparent)] text-(--menu-card-elevated) backdrop-blur-md flex items-center justify-center shrink-0"
          >
            <FiChevronDown size={22} />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-1 sm:px-2 pb-2 pt-4 space-y-4">
              {groupedItems.noSubItems.length > 0 && (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  {groupedItems.noSubItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      orderSystem={orderSystem}
                      onClick={onItemClick}
                      onDetailsClick={onDetailsClick}
                    />
                  ))}
                </motion.div>
              )}

              {activeSubcategories.map((sub) => (
                <div key={sub.id} className="space-y-3">
                  <div className="flex items-center gap-3 w-full">
                    <div className="h-px flex-1 bg-(--menu-border)" />
                    <span className="px-4 py-2 rounded-2xl bg-(--menu-accent-50) text-(--menu-accent-800) text-sm font-black border border-(--menu-border) whitespace-nowrap">
                      {sub.nameAr}
                    </span>
                    <div className="h-px flex-1 bg-(--menu-border)" />
                  </div>

                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    {groupedItems.groups[sub.id].map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        orderSystem={orderSystem}
                        onClick={onItemClick}
                        onDetailsClick={onDetailsClick}
                      />
                    ))}
                  </motion.div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
