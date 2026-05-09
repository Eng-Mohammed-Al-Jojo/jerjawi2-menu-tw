import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import type { MenuPriceOption, PriceType } from "../../utils/priceUtils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  options: MenuPriceOption[];
  enabledTypes: Record<PriceType, boolean>;
  onSelect: (price: number, type: PriceType) => void;
}

export default function PricePicker({
  isOpen,
  onClose,
  options,
  enabledTypes,
  onSelect,
}: Props) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-200 bg-[(--menu-overlay)] backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-201 bg-(--menu-card-bg) rounded-t-4xl shadow-premium p-6 pb-10 max-h-[92vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-(--menu-border) rounded-full mx-auto mb-6" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-(--menu-text)">
                {t("menu.choose_price") || "اختر السعر"}
              </h3>
              <button
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-(--menu-surface) text-(--menu-text-muted) hover:text-(--menu-text) transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {options.map((option, idx) => {
                const enabled = enabledTypes[option.type];
                const isTakeaway = option.type === "takeaway";
                return (
                  <motion.button
                    key={`${option.type}-${option.price}-${idx}`}
                    whileTap={enabled ? { scale: 0.97 } : undefined}
                    onClick={() => enabled && onSelect(option.price, option.type)}
                    disabled={!enabled}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all group ${enabled
                        ? isTakeaway
                          ? "border-(--menu-accent-200) bg-(--menu-accent-50) hover:border-(--menu-accent)"
                          : "border-(--menu-primary-200) bg-(--menu-primary-50) hover:border-(--menu-primary)"
                        : "border-(--menu-border) bg-(--menu-surface) opacity-55 cursor-not-allowed"
                      }`}
                  >
                    <div className="text-right">
                      <span className={`block text-xs font-black uppercase tracking-widest mb-0.5 ${isTakeaway ? "text-(--menu-accent-700)" : "text-(--menu-primary-700)"}`}>
                        {option.label} · {isTakeaway ? (t("common.takeaway") || "تيك أواي") : (t("common.dine_in") || "داخل المطعم")}
                      </span>
                      <span className="block text-xl font-black text-(--menu-text)">
                        {option.price}
                        <span className="text-sm font-bold text-(--menu-text-muted) mr-1">₪</span>
                      </span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 transition-colors ${isTakeaway ? "border-(--menu-accent-300) group-hover:border-(--menu-accent)" : "border-(--menu-primary-300) group-hover:border-(--menu-primary)"}`} />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
