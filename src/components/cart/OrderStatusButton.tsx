import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaClock, FaCheckCircle, FaUtensils, FaMotorcycle, FaTimes, FaBell } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { FirebaseService } from "../../services/firebaseService";
import { useCart } from "../../context/CartContext";

export default function OrderStatusButton() {
    const { t, i18n } = useTranslation();
    const { orderId, updateOrderId, isFullTrackingOpen, setIsFullTrackingOpen } = useCart();
    const [order, setOrder] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const isRtl = i18n.language === 'ar';


    useEffect(() => {
        if (!orderId) {
            setOrder(null);
            setIsVisible(false);
            return;
        }

        const cleanId = orderId.replace(/#/g, '');
        const unsubscribe = FirebaseService.listen(`orders/${cleanId}`, (data) => {
            if (data) {
                setOrder(data);
                setIsVisible(true);
            } else {
                setOrder(null);
                setIsVisible(false);
            }
        });

        return () => unsubscribe();
    }, [orderId]);

    useEffect(() => {
        if (order && (order.status === 'delivered' || order.status === 'done' || order.archived)) {
            const timer = setTimeout(() => {
                updateOrderId(null);
            }, 20000);
            return () => clearTimeout(timer);
        }
    }, [order?.status, order?.archived, updateOrderId]);

    const getStatusInfo = (status: string) => {
        switch (status) {
            case "pending":
                return {
                    label: t('admin.pending'),
                    icon: <FaClock />,
                    color: "bg-amber-500",
                    progress: 20
                };
            case "confirmed":
                return {
                    label: t('admin.confirmed'),
                    icon: <FaCheckCircle />,
                    color: "bg-blue-500",
                    progress: 40
                };
            case "preparing":
                return {
                    label: t('admin.preparing'),
                    icon: <FaUtensils />,
                    color: "bg-indigo-500",
                    progress: 60
                };
            case "ready":
                return {
                    label: t('admin.ready'),
                    icon: <FaBell />,
                    color: "bg-purple-500",
                    progress: 80
                };
            case "delivered":
            case "done":
                return {
                    label: t('admin.delivered'),
                    icon: <FaMotorcycle />,
                    color: "bg-green-600",
                    progress: 100
                };
            case "cancelled":
                return {
                    label: t('admin.cancelled'),
                    icon: <FaTimes />,
                    color: "bg-red-500",
                    progress: 100
                };
            default:
                return {
                    label: status,
                    icon: <FaClock />,
                    color: "bg-gray-400",
                    progress: 0
                };
        }
    };

    const dismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateOrderId(null);
        setOrder(null);
        setIsVisible(false);
    };

    const handleOpenFull = () => {
        setIsFullTrackingOpen(true);
    };

    if (!isVisible || !order || order.tracked === false || isFullTrackingOpen) return null;

    const statusInfo = getStatusInfo(order.status || "pending");

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.95 }}
                style={{ willChange: 'transform, opacity' }}
                onClick={handleOpenFull}
                className={`fixed bottom-24 ${isRtl ? 'left-6 sm:left-10' : 'right-6 sm:right-10'} z-50 w-[280px] sm:w-[320px] cursor-pointer`}
            >
                <div className="bg-(--bg-card)/80 backdrop-blur-2xl border border-(--border-color) rounded-[2.5rem] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden relative group">
                    {/* Progress Bar Background */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-(--border-color) opacity-20" />
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: statusInfo.progress / 100 }}
                        style={{ originX: isRtl ? 1 : 0, willChange: 'transform' }}
                        className={`absolute top-0 left-0 right-0 h-1 ${statusInfo.color} transition-all duration-1000`}
                    />

                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl ${statusInfo.color} text-white flex items-center justify-center text-xl shadow-lg shadow-${statusInfo.color.split('-')[1]}-500/20`}>
                            {statusInfo.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-widest text-(--text-muted) mb-0.5">
                                {t('common.order_type')}: {order.orderType === 'in' ? t('common.dine_in') : t('common.takeaway')}
                            </p>
                            <h4 className="font-black text-(--text-main) truncate text-sm">
                                {statusInfo.label}
                            </h4>
                        </div>

                        <button
                            onClick={dismiss}
                            className="w-8 h-8 rounded-xl bg-(--bg-main) border border-(--border-color) flex items-center justify-center text-(--text-muted) hover:text-red-500 transition-colors shadow-sm"
                        >
                            <FaTimes size={12} />
                        </button>
                    </div>

                    {/* Step Indicators */}
                    <div className="mt-4 flex justify-between px-1">
                        {[1, 2, 3, 4, 5].map((step) => (
                            <div
                                key={step}
                                className={`h-1 flex-1 mx-0.5 rounded-full transition-all duration-500 ${statusInfo.progress >= step * 20 ? statusInfo.color : 'bg-(--border-color)/50'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// Add simple tada animation style if not globally defined
// In a real project we'd add this to index.css
