import { FaTrash, FaMinus, FaPlus } from "react-icons/fa";
import { TbCurrencyShekel } from "react-icons/tb";
import { type CartItem, useCart } from "../../context/CartContext";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function CartItemRow({ item }: { item: CartItem }) {
    const { increase, decrease, removeItem } = useCart();
    const { i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    const itemName = isRtl 
        ? (item.nameAr || item.nameEn || item.name) 
        : (item.nameEn || item.nameAr || item.name);
    const priceLabel = item.selectedPriceType === "takeaway" ? "TW" : "DIN";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-4 bg-(--bg-main) p-4 rounded-3xl border border-(--border-color) group hover:border-primary/20 transition-all shadow-sm"
        >
            <div className="flex-1 min-w-0">
                <p className="font-black text-(--text-main) truncate text-sm sm:text-base">{itemName}</p>
                <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{priceLabel}</span>
                    <span className="text-xs font-bold text-primary">{item.qty} × {item.selectedPrice}</span>
                    <TbCurrencyShekel size={14} className="text-primary opacity-60" />
                </div>
            </div>

            <div className="flex items-center gap-3 bg-(--bg-card) p-1 rounded-2xl border border-(--border-color)">
                <button
                    onClick={() => decrease(item.priceKey)}
                    className="w-8 h-8 rounded-xl bg-(--bg-main) text-(--text-main) flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-(--border-color) active:scale-95"
                >
                    <FaMinus size={10} />
                </button>

                <span className="min-w-[24px] text-center font-black text-sm text-(--text-main)">
                    {item.qty}
                </span>

                <button
                    onClick={() => increase(item.priceKey)}
                    className="w-8 h-8 rounded-xl bg-(--bg-main) text-(--text-main) flex items-center justify-center hover:bg-primary hover:text-white transition-all border border-(--border-color) active:scale-95"
                >
                    <FaPlus size={10} />
                </button>

                <div className={`h-4 w-px bg-(--border-color) mx-1 hidden sm:block`} />

                <button
                    onClick={() => removeItem(item.priceKey)}
                    className="p-2 text-(--text-muted) hover:text-red-500 transition-colors rounded-xl hidden sm:block"
                >
                    <FaTrash size={12} />
                </button>
            </div>
        </motion.div>
    );
}
