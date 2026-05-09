import { useState, useEffect } from "react";
import { FiShoppingCart } from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import CartModal from "./CartModal";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useMenuStore } from "../../store/useMenuStore";

interface CartButtonProps {
    className?: string;
}

export default function CartButton({ className = "" }: CartButtonProps) {
    const { t, i18n } = useTranslation();
    const { totalItems, isFullTrackingOpen, setIsFullTrackingOpen } = useCart();
    const { orderSystem } = useMenuStore();
    
    const isCurrentTabOrderingEnabled = orderSystem;

    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (isFullTrackingOpen) {
            setOpen(true);
        }
    }, [isFullTrackingOpen]);

    const handleCloseModal = () => {
        setOpen(false);
        if (isFullTrackingOpen) {
            setIsFullTrackingOpen(false);
        }
    };

    return (
        <>
            {/* Cart Button */}
            <AnimatePresence>
                {totalItems > 0 && isCurrentTabOrderingEnabled && (
                    <motion.button
                        initial={{ scale: 0.9, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 10 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ willChange: 'transform, opacity' }}
                        onClick={() => setOpen(true)}
                        className={`
                            fixed bottom-8 ${i18n.language === 'ar' ? 'left-8' : 'right-8'} z-50
                            flex items-center gap-4
                            bg-secondary text-white cursor-pointer
                            px-7 py-5 rounded-full
                            shadow-[0_20px_50px_rgba(167,10,5,0.4)]
                            hover:shadow-[0_25px_60px_rgba(167,10,5,0.5)]
                            transition-all duration-500
                            font-black uppercase tracking-widest text-[11px]
                            border border-white/20 backdrop-blur-2xl
                            ${className}
                        `}
                    >
                        <div className="relative">
                            <FiShoppingCart size={22} />
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={totalItems}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    style={{ willChange: 'transform, opacity' }}
                                    className={`absolute -top-7 ${i18n.language === 'ar' ? '-left-4' : '-right-4'} bg-white text-primary text-[11px] w-7 h-7 flex items-center justify-center rounded-full border-2 border-primary`}
                                >
                                    {totalItems}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                        <span className="hidden sm:inline-block">{t('common.cart')}</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Modal */}
            <AnimatePresence>
                {open && <CartModal isOpen={open} onClose={handleCloseModal} />}
            </AnimatePresence>
        </>
    );
}
