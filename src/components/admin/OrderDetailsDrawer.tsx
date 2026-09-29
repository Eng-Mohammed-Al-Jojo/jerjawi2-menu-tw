import { motion, AnimatePresence } from "framer-motion";
import {
    FiX, FiUser, FiPhone, FiMapPin, FiClock,
    FiDollarSign, FiMessageSquare,
    FiPackage, FiTruck, FiChevronRight, FiCheck, FiRotateCw, FiTrash2, FiAlertTriangle
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { OrderService } from "../../services/orderService";
import { toast } from "react-hot-toast";
import { useState } from "react";
import type { Order, OrderStatus, PaymentStatus } from "../../types/order";

interface Props {
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function OrderDetailsDrawer({ order, isOpen, onClose }: Props) {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [showHardDeleteConfirm, setShowHardDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    if (!order) return null;

    const updatePayment = async () => {
        const newStatus: PaymentStatus = order.paymentStatus === "paid" ? "unpaid" : "paid";
        try {
            await OrderService.updatePaymentStatus(order.id, newStatus);
            toast.success(t('common.success_message'));
        } catch (error) {
            toast.error(t('common.error'));
        }
    };

    const updateStatus = async (status: OrderStatus) => {
        try {
            await OrderService.updateStatus(order.id, status);
            toast.success(t('common.success_message'));
        } catch (error) {
            toast.error(t('common.error'));
        }
    };


    const handleHardDelete = async () => {
        if (deleting) return;
        setDeleting(true);
        try {
            await OrderService.deleteOrder(order.id);
            toast.success(t('common.success_message'));
            onClose();
        } catch {
            toast.error(t('common.error'));
        } finally {
            setDeleting(false);
            setShowHardDeleteConfirm(false);
        }
    };

    const handleConfirmNotify = async () => {
        try {
            await OrderService.updateStatus(order.id, "confirmed");
            OrderService.notifyCustomer(order, 'confirm');
            toast.success(t('common.success_message'));
        } catch (error) {
            toast.error(t('common.error'));
        }
    };

    const handleReadyNotify = async () => {
        try {
            await OrderService.updateStatus(order.id, "ready");
            OrderService.notifyCustomer(order, 'ready');
            toast.success(t('common.success_message'));
        } catch (error) {
            toast.error(t('common.error'));
        }
    };

    const steps: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "delivered"];
    const currentStepIndex = steps.indexOf(order.status as OrderStatus);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-200 flex justify-end overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm z-0"
                    />

                    <motion.div
                        initial={{ x: isRtl ? "-100%" : "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: isRtl ? "-100%" : "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className={`relative w-full max-w-[22rem] sm:max-w-sm bg-white h-full shadow-premium z-10 flex flex-col ${isRtl ? 'border-r' : 'border-l'} border-gray-100`}
                    >
                        {/* Header */}
                        <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-3 py-1 rounded-lg border border-primary/10">
                                    {order.orderId}
                                </span>
                                <h2 className="text-lg font-extrabold text-gray-900 mt-2">{t('admin.order_details') || "تفاصيل الطلب"}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-2xl bg-white text-gray-400 flex items-center justify-center hover:bg-secondary/10 hover:text-secondary transition-all border border-gray-100 shadow-soft"
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        {/* Content Scrollable */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">

                            {/* Order Progress Control Center */}
                            <section className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">{t('admin.status_progress') || "تتبع وتحديث الحالة"}</h3>
                                    {order.archived && (
                                        <span className="bg-gray-100 text-gray-500 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">{t('admin.archived')}</span>
                                    )}
                                </div>

                                {/* Simplified Status Visualization */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                                                <FiClock size={22} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">{t('admin.order_status')}</p>
                                                <p className="text-base font-black text-gray-900 leading-none">{t(`admin.${order.status}`)}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1.5">
                                            {steps.map((st, idx) => (
                                                <div
                                                    key={st}
                                                    className={`w-6 h-1.5 rounded-full transition-all duration-500 ${idx <= currentStepIndex ? "bg-primary shadow-sm" : "bg-gray-200"}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Smart Actions Contextual */}
                                <div className="grid grid-cols-1 gap-4 mt-4">
                                    {order.status === "pending" && (
                                        <button
                                            onClick={handleConfirmNotify}
                                            className="w-full py-2.5 text-sm bg-primary text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            <FiCheck size={20} />
                                            {t('admin.mark_confirmed') || "تأكيد الطلب وإبلاغ العميل"}
                                            <FaWhatsapp size={18} className="opacity-70 ml-2" />
                                        </button>
                                    )}
                                    {order.status === "confirmed" && (
                                        <button
                                            onClick={() => updateStatus("preparing")}
                                            className="w-full py-2.5 text-sm bg-indigo-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            <FiPackage size={20} />
                                            {t('admin.mark_preparing') || "بدء تحضير الطلب"}
                                        </button>
                                    )}
                                    {order.status === "preparing" && (
                                        <button
                                            onClick={handleReadyNotify}
                                            className="w-full py-2.5 text-sm bg-purple-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-purple-600/20 hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            <FiBell size={20} />
                                            {t('admin.mark_ready') || "إخطار العميل بجاهزية الطلب"}
                                            <FaWhatsapp size={18} className="opacity-70 ml-2" />
                                        </button>
                                    )}
                                    {(order.status === "ready" || order.status === "confirmed" || order.status === "preparing") && (
                                        <button
                                            onClick={() => updateStatus("delivered")}
                                            className="w-full py-2.5 text-sm bg-emerald-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            <FiTruck size={20} />
                                            {t('admin.mark_delivered') || "تم التسليم بنجاح (إغلاق الطلب)"}
                                        </button>
                                    )}

                                    {order.status === "archived" && (
                                        <button
                                            onClick={() => updateStatus("pending")}
                                            className="w-full py-2.5 text-sm bg-blue-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            <FiRotateCw size={20} />
                                            {t('admin.restore') || "استعادة الطلب ونقله للنشطة"}
                                        </button>
                                    )}
                                </div>
                            </section>

                            <div className="h-px bg-gray-100" />

                            {/* Customer Info */}
                            <section className="space-y-3">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">{t('admin.customer_details')}</h3>
                                <div className="grid gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-5">
                                        <div className="w-9 h-9 rounded-2xl bg-white shadow-soft flex items-center justify-center text-primary border border-gray-100">
                                            <FiUser size={22} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{t('admin.customer')}</p>
                                            <p className="text-base font-black text-gray-900 leading-none">{order.customer?.name}</p>
                                        </div>
                                    </div>
                                    {order.customer?.phone && (
                                        <div className="flex items-center gap-5 transition-transform hover:scale-[1.02] cursor-pointer group" onClick={() => OrderService.notifyCustomer(order, 'confirm')}>
                                            <div className="w-9 h-9 rounded-2xl bg-emerald-50 shadow-soft flex items-center justify-center text-emerald-600 border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                                <FiPhone size={22} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{t('admin.phone')}</p>
                                                <p className="text-base font-black text-gray-900 leading-none flex items-center gap-3">
                                                    {order.customer.phone}
                                                    <FaWhatsapp size={16} className="text-emerald-500" />
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {order.customer?.address && (
                                        <div className="flex items-center gap-5">
                                            <div className="w-9 h-9 rounded-2xl bg-white shadow-soft flex items-center justify-center text-orange-500 border border-gray-100">
                                                <FiMapPin size={22} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{t('whatsapp.address')}</p>
                                                <p className="text-base font-black text-gray-900 leading-none">{order.customer.address}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Items List */}
                            <section className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">{t('admin.ordered_items')}</h3>
                                    <span className="px-4 py-1.5 rounded-xl bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                        {order.items?.length} {t('common.items')}
                                    </span>
                                </div>
                                <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100 shadow-inner">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="p-5 flex justify-between items-center group hover:bg-white transition-all">
                                            <div className="flex items-center gap-5">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shadow-sm border border-primary/10">
                                                    {item.quantity}×
                                                </div>
                                                <span className="text-base font-bold text-gray-900 leading-tight">
                                                    {item.name || item.name}
                                                </span>
                                            </div>
                                            <span className="text-base font-black text-primary tracking-tight">
                                                {item.total}<span className="text-xs ml-0.5 opacity-60">₪</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Financial Summary */}
                            <section className="bg-primary/5 rounded-2xl p-3 border border-primary/10 space-y-6 shadow-inner">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/60">{t('common.total')}</span>
                                    <div className="text-right">
                                        <div className="text-3xl font-black text-primary tracking-tighter leading-none">{order.totalAmount}<span className="text-lg ml-1 opacity-50">₪</span></div>
                                        <div className={`text-[11px] font-black uppercase mt-2 tracking-widest ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-secondary'}`}>
                                            {order.paymentStatus === 'paid' ? t('admin.paid') : t('admin.unpaid')}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={updatePayment}
                                    className={`w-full flex items-center justify-center gap-4 py-2.5 rounded-xl font-black text-sm transition-all border ${order.paymentStatus === "paid"
                                        ? "bg-emerald-500 text-white border-emerald-400 shadow-xl shadow-emerald-500/20"
                                        : "bg-white text-secondary border-secondary/20 hover:bg-secondary/5 shadow-soft"
                                        }`}
                                >
                                    <FiDollarSign size={20} />
                                    {order.paymentStatus === "paid" ? (t('admin.paid') || "دُفعت التكلفة ✅") : (t('admin.mark_as_paid') || "تحديد كمدفوع الآن")}
                                </button>
                            </section>

                            {order.customer?.notes && (
                                <section className="p-3 rounded-2xl bg-amber-50 border border-amber-100 space-y-4">
                                    <div className="flex items-center gap-3 text-xs font-black text-amber-600 uppercase tracking-widest">
                                        <FiMessageSquare size={18} />
                                        <span>{t('whatsapp.notes')}</span>
                                    </div>
                                    <p className="text-base font-bold text-amber-700 italic leading-relaxed">
                                        {order.customer.notes}
                                    </p>
                                </section>
                            )}

                        </div>

                        {/* Sticky Bottom Actions */}
                        <div className="p-3 sm:p-4 border-t border-gray-100 bg-white flex flex-col gap-3 shrink-0">
                            {/* Hard Delete for Cancelled/Archived orders */}
                            {(order.status === "cancelled" || order.status === "archived") && (
                                !showHardDeleteConfirm ? (
                                    <button
                                        onClick={() => setShowHardDeleteConfirm(true)}
                                        className="w-full py-4 bg-red-50 text-red-500 border border-red-100 rounded-2xl font-black text-sm hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <FiTrash2 size={18} />
                                        {t('admin.hard_delete') || "حذف نهائي من قاعدة البيانات"}
                                    </button>
                                ) : (
                                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
                                        <div className="flex items-center gap-3 text-red-600">
                                            <FiAlertTriangle size={18} />
                                            <p className="text-xs font-black">{t('admin.hard_delete_confirm') || "هذا الإجراء لا يمكن التراجع عنه!"}</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleHardDelete}
                                                disabled={deleting}
                                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black text-xs hover:bg-red-700 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                                            >
                                                {deleting ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <FiTrash2 size={14} />}
                                                {t('common.delete') || "تأكيد الحذف"}
                                            </button>
                                            <button
                                                onClick={() => setShowHardDeleteConfirm(false)}
                                                className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-black text-xs hover:bg-gray-200 transition-all"
                                            >
                                                {t('common.cancel') || "إلغاء"}
                                            </button>
                                        </div>
                                    </div>
                                )
                            )}
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 bg-gray-50 text-gray-900 border border-gray-100 rounded-2xl font-black text-sm hover:bg-gray-100 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-soft"
                            >
                                <FiChevronRight className={isRtl ? "rotate-180" : ""} size={20} />
                                {t('common.close')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// Internal icons helper
function FiBell({ size }: { size: number }) {
    return <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height={size} width={size} xmlns="http://www.w3.org/2000/svg"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
}
