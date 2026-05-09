import { motion } from "framer-motion";
import { FiArrowRight, FiLoader } from "react-icons/fi";
import { useTranslation } from "react-i18next";

interface OrderButtonProps {
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    price?: number | string;
    label?: string;
    className?: string;
}

/**
 * Premium Order Button
 * Features: Gradient backgrounds, glassmorphism effects, loading states, and smooth animations.
 */
export default function OrderButton({
    onClick,
    loading = false,
    disabled = false,
    price,
    label,
    className = ""
}: OrderButtonProps) {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    return (
        <motion.button
            whileHover={!disabled && !loading ? { scale: 1.02, y: -2 } : {}}
            whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
            onClick={onClick}
            disabled={disabled || loading}
            className={`
                relative w-full overflow-hidden
                py-4 sm:py-5 px-8 sm:px-10
                rounded-2xl sm:rounded-3xl
                flex items-center justify-between
                transition-all duration-300
                ${disabled || loading
                    ? "bg-gray-200 cursor-not-allowed grayscale"
                    : "bg-linear-to-r from-[#8a0f14] to-[#680c0c] shadow-[0_15px_40px_rgba(183,48,62,0.3)] hover:shadow-[0_20px_50px_rgba(183,48,62,0.4)]"
                }
                ${className}
            `}
        >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-linear-to-b from-white/10 to-transparent pointer-events-none" />

            {/* Content Left: Price info */}
            <div className="flex flex-col items-start z-10 text-white">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] opacity-70 mb-0.5">
                    {t('common.total') || "الإجمالي"}
                </span>
                <span className="text-xl sm:text-2xl font-black tracking-tight">
                    {price}₪
                </span>
            </div>

            {/* Content Right: Label & Icon */}
            <div className="flex items-center gap-4 z-10 text-white">
                <span className="text-sm sm:text-base font-black uppercase tracking-wider">
                    {loading ? (t('common.processing') || "جاري التنفيذ...") : (label || t('common.order_now') || "اطلب الآن")}
                </span>
                <div className={`
                    w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl
                    bg-white/20 backdrop-blur-md
                    flex items-center justify-center
                    transition-transform duration-500
                    ${loading ? 'animate-spin' : 'group-hover:translate-x-1'}
                `}>
                    {loading ? <FiLoader size={20} /> : <FiArrowRight size={22} className={isRtl ? "rotate-180" : ""} />}
                </div>
            </div>

            {/* Ripple Effect Background */}
            <motion.div
                className="absolute inset-0 bg-white/5"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
            />
        </motion.button>
    );
}
