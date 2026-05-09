import { motion, AnimatePresence } from "framer-motion";
import { FiShoppingBag, FiInfo, FiX } from "react-icons/fi";
import type { Order } from "../../types/order";

interface Props {
    notifications: Order[];
    onClose: (id: string) => void;
    onView: (order: Order) => void;
}

/**
 * OrderNotificationToast
 * Premium stacked notification system for new orders
 */
export default function OrderNotificationToast({ notifications, onClose, onView }: Props) {
    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-8 right-8 z-200 flex flex-col gap-6 w-full max-w-sm pointer-events-none">
            <AnimatePresence mode="popLayout">
                {notifications.map((order) => (
                    <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, x: 100, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.3 } }}
                        className="w-full bg-white border border-gray-100 shadow-premium rounded-[2.5rem] overflow-hidden pointer-events-auto flex flex-col group backdrop-blur-xl bg-opacity-95"
                    >
                        <div className="p-6 flex items-start gap-5">
                            <div className="w-16 h-16 rounded-3xl bg-primary text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                                <FiShoppingBag size={32} className="animate-bounce" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-sm font-black text-gray-900 font-['Cairo'] tracking-tight">طلب جديد! 🔔</h3>
                                    <button
                                        onClick={() => onClose(order.id)}
                                        className="text-gray-400 hover:text-secondary p-1 -m-1 transition-colors"
                                    >
                                        <FiX size={20} />
                                    </button>
                                </div>

                                <p className="text-3xl font-black text-primary tracking-tighter mt-1">
                                    {order.orderId}
                                </p>

                                <div className="flex items-center gap-3 mt-3">
                                    <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${order.orderType === 'in' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                        {order.orderType === 'in' ? 'داخل المطعم 🍽️' : 'تيك أواي 🥡'}
                                    </span>
                                    <span className="text-[11px] font-bold text-gray-400 truncate max-w-[120px]">
                                        {order.customer?.name}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 pb-6">
                            <button
                                onClick={() => {
                                    onView(order);
                                    onClose(order.id);
                                }}
                                className="w-full py-4 bg-gray-50 hover:bg-primary text-gray-900 hover:text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-3 border border-gray-100 hover:border-primary shadow-soft hover:shadow-xl hover:shadow-primary/20"
                            >
                                <FiInfo size={18} />
                                عرض تفاصيل الطلب
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
