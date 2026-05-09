import { TbCurrencyShekel } from "react-icons/tb";
import { useCart } from "../../context/CartContext";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function CartSummary() {
    const { totalAmount, items } = useCart();
    const { t } = useTranslation();

    if (items.length === 0) return null;

    return (
        <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="sticky bottom-0 left-0 right-0 z-50 p-6 sm:p-8 bg-linear-to-t from-(--bg-card) via-(--bg-card) to-(--bg-card)/0 pt-20"
        >
            <div className="bg-primary text-white p-6 rounded-[2.5rem] shadow-2xl shadow-primary/30 flex items-center justify-between gap-6 overflow-hidden relative group">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-colors" />
                
                <div className="flex flex-col z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">
                        {t('common.total')}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-3xl font-black tracking-tighter">
                            {totalAmount}
                        </span>
                        <TbCurrencyShekel size={24} className="opacity-80" />
                    </div>
                </div>

                <div className="flex flex-col items-end z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">
                        {items.length} {t('common.items')}
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 text-xl shadow-lg ring-4 ring-white/5">
                        🛒
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
