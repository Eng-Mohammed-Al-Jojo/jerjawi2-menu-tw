import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiStar } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import ItemRow from "./ItemRow";
import type { Item } from "./Menu";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  orderSystem: boolean;
  onItemClick?: (item: Item) => void;
  onDetailsClick?: (item: Item) => void;
}

export default function FeaturedModal({ isOpen, onClose, items, orderSystem, onItemClick, onDetailsClick }: Props) {
  const { t } = useTranslation();

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
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm max-h-[85vh] bg-(--bg-card) rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 flex items-center justify-between border-b border-(--border-color)/30 bg-linear-to-b from-orange-500/10 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <FiStar size={24} className="fill-current" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-(--text-main) tracking-tight">
                    {t("menu.featured_items") || "الأصناف المميزة"}
                  </h2>
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-widest opacity-80">
                    {items.length} {t("common.items") || "صنف"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-(--bg-main) text-(--text-muted) flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-(--border-color)"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Scrollable Grid Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              <div className="flex flex-col items-center gap-2 sm:gap-1">
                {items.map((item) => (
                  <ItemRow
                    key={`modal-feat-${item.id}`}
                    item={item}
                    orderSystem={orderSystem}
                    onClick={() => {
                      onItemClick?.(item);
                      onClose();
                    }}
                    onDetailsClick={(item) => {
                      onDetailsClick?.(item);
                      onClose();
                    }}
                  />
                ))}
              </div>

              {items.length === 0 && (
                <div className="py-20 text-center space-y-4">
                  <div className="text-6xl opacity-20">⭐</div>
                  <p className="text-(--text-muted) font-bold">{t("menu.no_featured") || "لا توجد أصناف مميزة حالياً"}</p>
                </div>
              )}
            </div>

            {/* Footer shadow fade */}
            <div className="h-8 bg-linear-to-t from-(--bg-card) to-transparent shrink-0 pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}