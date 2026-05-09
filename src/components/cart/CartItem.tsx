import { FaTrash, FaMinus, FaPlus } from "react-icons/fa";
import { TbCurrencyShekel } from "react-icons/tb";
import { type CartItem as CartItemType, useCart } from "../../context/CartContext";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function CartItem({ item }: { item: CartItemType }) {
    const { increase, decrease, removeItem } = useCart();
    const { i18n, t } = useTranslation();
    const isRtl = i18n.language === 'ar';

    const itemName = isRtl
        ? (item.nameAr || item.nameEn || item.name)
        : (item.nameEn || item.nameAr || item.name);

    const lineTotal = item.selectedPrice * item.qty;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
        >
            <div className="flex items-center gap-4 bg-white p-4 sm:p-5 rounded-4xl border border-gray-100 hover:border-primary/20 hover:shadow-soft transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/2 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500" />

                {/* Qty Badge */}
                <div className="shrink-0 w-9 h-9 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center">
                    <span className="text-xs font-black text-primary">{item.qty}×</span>
                </div>

                {/* Name & Price */}
                <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 truncate text-sm leading-tight">
                        {itemName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-gray-400">{item.selectedPrice}</span>
                        <TbCurrencyShekel size={11} className="text-gray-400" />
                        {item.qty > 1 && (
                            <>
                                <span className="text-gray-300 text-xs">•</span>
                                <span className="text-xs font-black text-primary">{lineTotal}₪</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Qty Controls */}
                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 shrink-0">
                    <button
                        onClick={() => decrease(item.priceKey)}
                        className="w-7 h-7 rounded-lg text-gray-500 flex items-center justify-center hover:bg-secondary hover:text-white transition-all active:scale-90"
                    >
                        <FaMinus size={9} />
                    </button>

                    <span className="min-w-[22px] text-center font-black text-sm text-gray-900">
                        {item.qty}
                    </span>

                    <button
                        onClick={() => increase(item.priceKey)}
                        className="w-7 h-7 rounded-lg text-gray-500 flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-90"
                    >
                        <FaPlus size={9} />
                    </button>
                </div>

                {/* Remove */}
                <button
                    onClick={() => removeItem(item.priceKey)}
                    className="shrink-0 w-8 h-8 rounded-xl text-gray-300 hover:text-secondary hover:bg-secondary-50 transition-all active:scale-90 flex items-center justify-center"
                    title={t('common.remove')}
                >
                    <FaTrash size={11} />
                </button>
            </div>
        </motion.div>
    );
}
