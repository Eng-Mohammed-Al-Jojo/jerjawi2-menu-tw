import React, { useState } from "react";
import { ref, update, remove } from "firebase/database";
import { db } from "../../firebase";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaUtensils, FaShoppingBag, FaClock, FaTrash, FaHistory } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface Props {
    orders: Record<string, any>;
}

const OrderSection: React.FC<Props> = ({ orders }) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [openOrder, setOpenOrder] = useState<string | null>(null);

    const orderArray = Object.entries(orders || {})
        .map(([id, order]) => ({ id, ...order }))
        .sort((a, b) => b.createdAt - a.createdAt);

    const toggleOrder = (id: string) => {
        setOpenOrder(openOrder === id ? null : id);
    };

    const updateStatus = (id: string, status: string) => {
        update(ref(db, `orders/${id}`), { status });
    };

    const deleteOrder = (id: string) => {
        if (confirm(t('admin.confirm_delete_order'))) {
            remove(ref(db, `orders/${id}`));
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "pending": return "bg-secondary/5 text-secondary border-secondary/10";
            case "preparing": return "bg-blue-50 text-blue-600 border-blue-100";
            case "ready": return "bg-emerald-50 text-emerald-600 border-emerald-100";
            case "done":
            case "delivered": return "bg-gray-50 text-gray-400 border-gray-100";
            case "cancelled": return "bg-secondary/5 text-secondary border-secondary/10";
            default: return "bg-gray-50 text-gray-500 border-gray-100";
        }
    };

    const getStatusName = (status: string) => {
        switch (status) {
            case "pending": return t('admin.pending');
            case "preparing": return t('admin.preparing');
            case "ready": return t('admin.ready');
            case "done":
            case "delivered": return t('admin.delivered');
            case "cancelled": return t('admin.cancelled');
            default: return status;
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 px-2">
                <div>
                    <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                            <FaHistory className="text-2xl" />
                        </div>
                        {t('admin.orders_board')}
                    </h2>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-2 px-1">
                        {t('admin.manage_orders')}
                    </p>
                </div>
                <div className="bg-white px-8 py-4 rounded-xl border border-gray-100 flex items-center gap-4 self-end sm:self-auto shadow-premium">
                    <div className="flex flex-col items-end">
                        <span className="text-primary font-black text-3xl leading-none tracking-tighter">{orderArray.length}</span>
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{t('admin.total_orders')}</span>
                    </div>
                </div>
            </header>

            <div className="grid gap-6">
                <AnimatePresence mode="popLayout">
                    {orderArray.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gray-50 rounded-2xl p-24 text-center border-2 border-dashed border-gray-200 shadow-inner"
                        >
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-8 text-5xl shadow-soft">
                                📋
                            </div>
                            <p className="text-gray-400 font-black text-xl uppercase tracking-widest">{t('admin.no_orders')}</p>
                        </motion.div>
                    ) : (
                        orderArray.map((order, index) => {
                            const isOpen = openOrder === order.id;
                            const statusStyles = getStatusStyles(order.status || "pending");

                            return (
                                <motion.div
                                    layout
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className={`bg-white rounded-2xl border transition-all duration-500 shadow-soft ${isOpen ? "border-primary shadow-premium ring-8 ring-primary/5" : "border-gray-100 hover:border-primary/30 hover:shadow-premium"
                                        }`}
                                >
                                    <button
                                        onClick={() => toggleOrder(order.id)}
                                        className={`w-full ${isRtl ? 'text-right' : 'text-left'} flex flex-col md:flex-row md:items-center gap-6 p-8`}
                                    >
                                        <div className="flex items-center gap-6 flex-1">
                                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0 ${order.orderType === "in" ? "bg-amber-100 text-amber-600 border border-amber-200" : "bg-primary/10 text-primary border border-primary/10"
                                                }`}>
                                                {order.orderType === "in" ? <FaUtensils /> : <FaShoppingBag />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-black text-xl text-gray-900 flex flex-wrap items-center gap-4 tracking-tight">
                                                    <span className="truncate">{order.customer?.name || t('admin.customer')}</span>

                                                </h3>
                                                <div className="flex items-center gap-5 text-xs text-gray-400 font-bold uppercase tracking-widest mt-2 px-1">
                                                    <span className="flex items-center gap-2">
                                                        <FaClock size={16} className="text-primary/40" />
                                                        {new Date(order.createdAt).toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className="opacity-30">•</span>
                                                    <span>{order.items?.length} {t('admin.products')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-6 md:pt-0">
                                            <div className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border shrink-0 shadow-sm ${statusStyles}`}>
                                                {getStatusName(order.status || "pending")}
                                            </div>
                                            <div className="text-xl font-extrabold text-primary tracking-tighter whitespace-nowrap">
                                                {order.totalAmount}<span className="text-sm font-bold opacity-40 ml-1">₪</span>
                                            </div>
                                            <div className={`text-gray-300 transition-transform duration-500 ${isOpen ? "rotate-180 text-primary" : ""}`}>
                                                <FaChevronDown size={20} />
                                            </div>
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden border-t border-gray-100"
                                            >
                                                <div className="px-8 pb-10 pt-6 bg-gray-50/50">
                                                    <div className="grid md:grid-cols-2 gap-10 py-6">
                                                        <div className="space-y-6">
                                                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-3 px-2">
                                                                <div className="w-2 h-4 bg-primary rounded-full shadow-sm" />
                                                                {t('admin.customer_details')}
                                                            </h4>
                                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-soft space-y-4">
                                                                {order.customer?.phone && (
                                                                    <p className="text-sm font-black text-gray-700 flex items-center gap-4">
                                                                        <span className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shadow-inner border border-gray-100">📱</span>
                                                                        {order.customer.phone}
                                                                    </p>
                                                                )}
                                                                {order.customer?.address && (
                                                                    <p className="text-sm font-black text-gray-700 flex items-center gap-4">
                                                                        <span className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shadow-inner border border-gray-100">📍</span>
                                                                        {order.customer.address}
                                                                    </p>
                                                                )}
                                                                {order.customer?.notes && (
                                                                    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 mt-4 flex gap-4 italic shadow-inner">
                                                                        <span className="text-2xl opacity-40">📝</span>
                                                                        <p className="text-sm font-bold text-amber-800 leading-relaxed">{order.customer.notes}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-6">
                                                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-3 px-2">
                                                                <div className="w-2 h-4 bg-secondary rounded-full shadow-sm" />
                                                                {t('admin.ordered_items')}
                                                            </h4>
                                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-soft divide-y divide-gray-50">
                                                                {order.items.map((item: any, i: number) => {
                                                                    const itemName = item.name || item.nameAr || item.nameEn;
                                                                    return (
                                                                        <div key={i} className="flex justify-between py-4 text-sm group hover:bg-gray-50/50 transition-colors">
                                                                            <span className="font-bold text-gray-800">
                                                                                <span className="text-primary font-black mr-3 bg-primary/5 px-3 py-1 rounded-xl border border-primary/10">{item.quantity}×</span> {itemName}
                                                                            </span>
                                                                            <span className="font-black text-gray-900 text-base">{item.total}<span className="text-xs opacity-40 ml-0.5">₪</span></span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-8 mt-10 pt-10 border-t border-gray-100">
                                                        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-3 sm:pb-0">
                                                            {[
                                                                { id: 'pending', label: t('admin.pending'), icon: '⏳', color: 'secondary' },
                                                                { id: 'preparing', label: t('admin.preparing'), icon: '👨‍🍳', color: 'blue' },
                                                                { id: 'ready', label: t('admin.ready'), icon: '🔔', color: 'emerald' },
                                                                { id: 'delivered', label: t('admin.delivered'), icon: '✅', color: 'primary' }
                                                            ].map((st) => (
                                                                <button
                                                                    key={st.id}
                                                                    onClick={() => updateStatus(order.id, st.id)}
                                                                    className={`
                                                                        px-6 h-12 rounded-2xl text-[12px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-3 shadow-soft
                                                                        ${order.status === st.id || (st.id === 'pending' && !order.status)
                                                                            ? `bg-${st.id === 'delivered' ? 'primary' : st.id === 'pending' ? 'secondary' : st.id === 'preparing' ? 'blue-600' : 'emerald-600'} text-white shadow-xl scale-105 z-10`
                                                                            : 'bg-white text-gray-400 border border-gray-100 hover:bg-white hover:border-primary/30 hover:text-primary hover:shadow-premium'
                                                                        }
                                                                    `}
                                                                >
                                                                    <span className="text-lg">{st.icon}</span>
                                                                    <span>{st.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>

                                                        <button
                                                            onClick={() => deleteOrder(order.id)}
                                                            className="flex items-center justify-center gap-3 px-8 h-12 rounded-2xl text-[12px] font-black uppercase tracking-widest bg-white text-secondary hover:bg-secondary hover:text-white transition-all border border-secondary/10 shadow-soft active:scale-95"
                                                        >
                                                            <FaTrash size={16} />
                                                            {t('admin.delete_order')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default OrderSection;
