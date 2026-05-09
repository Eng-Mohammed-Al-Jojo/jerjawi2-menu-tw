import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPlus, FiMinus, FiShoppingCart } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useCart } from "../../context/CartContext";
import { useMenuStore } from "../../store/useMenuStore";
import type { Item } from "./Menu";
import { toast } from "react-hot-toast";
import { getMenuPricesForType } from "../../utils/priceUtils";

interface Props {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  orderSystem?: boolean;
}

export default function ItemModal({ item, isOpen, onClose, orderSystem = true }: Props) {
  const { t } = useTranslation();
  const { addItem } = useCart();
  const { selectedOrderMode } = useMenuStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedPriceIndex, setSelectedPriceIndex] = useState(0);

  useEffect(() => {
    setSelectedPriceIndex(0);
  }, [item?.id, selectedOrderMode]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!item) return null;

  const priceOptions = getMenuPricesForType(item, selectedOrderMode);
  const selectedPriceOption = priceOptions[selectedPriceIndex] || priceOptions[0];
  const displayedPrices = priceOptions.map((option) => option.price).join(", ");

  const itemName = item.nameAr || item.name || "";
  const isCurrentTabOrderingEnabled = orderSystem;

  const commitAdd = (price: number) => {
    if (!isCurrentTabOrderingEnabled) return;
    addItem(item, price, quantity);
    toast.success(t("common.added_to_cart") || "Added to cart!");
    onClose();
    setQuantity(1);
  };

  const handleAdd = () => {
    if (selectedPriceOption) {
      commitAdd(selectedPriceOption.price);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-(--menu-overlay) backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg max-h-[92vh] bg-(--menu-card-bg) rounded-[2.5rem] shadow-premium overflow-hidden border border-(--menu-border) flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 left-6 z-10 w-11 h-11 rounded-2xl bg-(--menu-surface) backdrop-blur-md text-secondary flex items-center justify-center transition-all border border-(--menu-text)_24%"
            >
              <FiX size={20} />
            </button>

            {/* Image Hero */}
            <div className="relative h-64 sm:h-80 shrink-0">
              <img
                src={item.image ? `/images/${item.image}` : "/logo.png"}
                alt={itemName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo.png";
                }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-(--bg-card) via-transparent to-transparent" />
            </div>

            {/* Content Body */}
            <div className="p-8 sm:p-10 -mt-12 relative bg-(--menu-card-bg) rounded-t-[3rem] flex-1 overflow-y-auto custom-scrollbar">
              <div className="space-y-6 pb-4">
                {/* Price Display */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-bold text-(--menu-text) tracking-tight">
                      {itemName}
                    </h2>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1 rounded-full bg-(--menu-surface) border border-(--menu-border) px-3 py-1">
                      <span className="text-lg font-black text-(--menu-primary-800)">{displayedPrices || "—"}</span>
                      <small className="text-xs opacity-70">₪</small>
                    </div>
                  </div>
                </div>

                <div className="h-px w-full bg-(--menu-border)" />

                {/* Multiple Prices (if any within takeaway mode) */}
                {priceOptions.length > 1 && (
                  <div className="space-y-3">
                    <span className="text-xs font-black text-(--menu-text) uppercase tracking-widest">
                      {t("menu.choose_price") || "اختر السعر"}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {priceOptions.map((option, idx) => (
                        <button
                          key={`${option.type}-${option.price}-${idx}`}
                          onClick={() => setSelectedPriceIndex(idx)}
                          className={`py-3 px-4 rounded-2xl border font-black transition-all ${selectedPriceIndex === idx
                            ? "bg-(--menu-primary) text-(--menu-card-elevated) border-(--menu-primary) shadow-soft)"
                            : "bg-(--menu-surface) text-(--menu-text) border-(--menu-border)"
                            }`}
                        >
                          {option.price}₪
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-bold text-(--menu-text) uppercase tracking-widest">
                    {t("common.quantity") || "الكمية"}
                  </span>
                  <div className="flex items-center gap-6 bg-(--menu-surface) p-2 rounded-2xl border border-(--menu-border)">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-11 h-11 rounded-xl bg-(--menu-card-elevated) text-(--menu-text) flex items-center justify-center shadow-sm hover:text-(--menu-accent-700) transition-colors"
                    >
                      <FiMinus size={18} />
                    </motion.button>
                    <span className="text-xl font-bold w-8 text-center text-(--menu-text)">
                      {quantity}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-11 h-11 rounded-xl bg-(--menu-card-elevated) text-(--menu-text) flex items-center justify-center shadow-sm hover:text-(--menu-primary-700) transition-colors"
                    >
                      <FiPlus size={18} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            {orderSystem && (
              <div className="p-6 sm:p-8 bg-(--menu-card-bg) border-t border-(--menu-border) shrink-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAdd}
                  className="w-full min-h-11 py-5 rounded-full font-bold shadow-xl flex items-center justify-center gap-3 text-lg transition-all bg-(--menu-primary) text-(--menu-card-elevated) hover:bg-(--menu-primary-600)"
                >
                  <FiShoppingCart size={22} />
                  <span>{t("common.add_to_order") || "إضافة للطلب"}</span>
                  <>
                    <span className="mx-2 opacity-30">|</span>
                    <span>{(selectedPriceOption?.price || 0) * quantity}₪</span>
                  </>
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
