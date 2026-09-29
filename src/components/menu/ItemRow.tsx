import React, { useCallback } from "react";
import { type Item } from "./Menu";
import { FaFire } from "react-icons/fa";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FiShoppingCart } from "react-icons/fi";
import { useMenuStore } from "../../store/useMenuStore";
import { getMenuPricesForType } from "../../utils/priceUtils";

interface Props {
  item: Item;
  orderSystem: boolean;
  onClick?: (item: Item) => void;
  onDetailsClick?: (item: Item) => void;
}

const ItemRow = React.memo(({ item, orderSystem, onClick }: Props) => {
  const { t } = useTranslation();
  const { selectedOrderMode } = useMenuStore();

  // ── Price normalization ────────────────────────────────────────
  const priceOptions = getMenuPricesForType(item, selectedOrderMode);

  // ── Guards ────────────────────────────────────────────────────
  const unavailable = item.visible === false;
  const itemName = item.nameAr || item.name || "";
  const description = item.ingredientsAr || item.ingredients || "";

  const canOrder = !unavailable && orderSystem;

  const handleOrderClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canOrder) return;
      onClick?.(item);
    },
    [canOrder, item, onClick]
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        viewport={{ once: true, margin: "50px" }}
        className={`
          relative flex items-center justify-between w-full rounded-xl border border-(--menu-border)
          min-h-[76px] py-2 pr-24 pl-2 bg-(--menu-card-elevated) mb-1 mr-1
          transition-all duration-300 group shadow-soft
          ${unavailable ? "opacity-60 grayscale mt-2 mb-2" : canOrder ? "hover:bg-(--menu-surface) cursor-pointer" : ""}
        `}
        onClick={handleOrderClick}
      >
        {/* IMAGE */}
        <div className="absolute right-10 translate-x-1/2 w-20 h-20 z-10">
          <img
            src={item.image ? `/images/${item.image}` : "/logo.png"}
            alt={itemName}
            loading="lazy"
            className="w-full h-full rounded-xl object-cover shadow border border-(--menu-primary) transition-transform duration-500 group-hover:scale-105 bg-(--menu-surface)"
            onError={(e) => { (e.target as HTMLImageElement).src = "/logo.png"; }}
          />
          {(item.star || (item as any).isFeatured) && !unavailable && (
            <div className="absolute -top-1 -right-1 bg-(--menu-accent) text-(--menu-card-elevated) p-1.5 rounded-full shadow-lg border-2 border-(--menu-card-elevated)">
              <FaFire size={10} />
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="flex-1 text-right overflow-hidden">
          <h3 className="text-[15px] sm:text-base font-bold text-(--menu-text) mb-0.5 leading-tight truncate">
            {itemName}
          </h3>
          <p className="text-[11px] text-(--menu-text-muted) line-clamp-1 leading-relaxed font-medium">
            {description}
          </p>
        </div>

        {/* PRICE + BUTTON */}
        <div className="flex flex-col items-end gap-1 shrink-0 min-w-[90px] pl-2">
          <div className="flex flex-col items-end gap-1">
            {priceOptions.length > 0 ? (
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                {priceOptions.map((option, idx) => (
                  <span
                    key={`${option.type}-${option.price}-${idx}`}
                    className="flex items-center gap-0.5 rounded-full bg-(--menu-surface) border border-(--menu-border) px-2 py-0.5"
                  >
                    <span className="text-(--menu-primary-800) font-black text-xs leading-none">
                      {option.price}
                    </span>
                    <span className="text-[9px] font-bold text-(--menu-primary-700)">₪</span>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[10px] font-bold text-(--menu-text-muted)">—</span>
            )}
          </div>

          {canOrder && (
            <button
              onClick={handleOrderClick}
              className="bg-(--menu-accent) hover:bg-(--menu-accent-600) text-(--menu-card-elevated) px-4 py-2.5 rounded-full text-xs font-black shadow-soft transition-all active:scale-95 uppercase tracking-wider whitespace-nowrap"
              aria-label={t("common.add_to_order") || "إضافة للطلب"}
            >
              <FiShoppingCart size={14} />
            </button>
          )}


          {unavailable && (
            <span className="bg-(--menu-surface) text-(--menu-text-muted) px-3 py-1 rounded-full text-[10px] font-bold">
              {t("common.unavailable")}
            </span>
          )}
        </div>
      </motion.div>

    </>
  );
});

export default ItemRow;
