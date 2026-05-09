import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiClock, FiCheckCircle, FiPackage, FiCheck, FiDollarSign,
    FiChevronRight, FiX, FiMapPin
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { FirebaseService } from "../../services/firebaseService";
import type { PaymentRecord } from "../../types/payment";
import { useCart } from "../../context/CartContext";

interface OrderTrackingProps {
    orderId: string;
    onClose: () => void;
    paymentRecord?: PaymentRecord | null;
}

function FiBell({ size }: { size: number }) {
    return <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height={size} width={size} xmlns="http://www.w3.org/2000/svg"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
}

const STATUS_STAGES = ["pending", "confirmed", "preparing", "ready"];

const STAGE_ICONS: Record<string, React.ReactNode> = {
    pending: <FiClock size={20} />,
    confirmed: <FiCheckCircle size={20} />,
    preparing: <FiPackage size={20} />,
    ready: <FiBell size={20} />,
};

// Colors aligned with admin dashboard status badges
const STAGE_COLORS: Record<string, { active: string; done: string; label: string }> = {
    pending: { active: "bg-amber-500 text-white border-amber-500 shadow-amber-500/30", done: "bg-amber-100 text-amber-500 border-amber-200", label: "text-amber-500" },
    confirmed: { active: "bg-blue-500 text-white border-blue-500 shadow-blue-500/30", done: "bg-blue-100 text-blue-500 border-blue-200", label: "text-blue-500" },
    preparing: { active: "bg-indigo-500 text-white border-indigo-500 shadow-indigo-500/30", done: "bg-indigo-100 text-indigo-500 border-indigo-200", label: "text-indigo-500" },
    ready: { active: "bg-purple-500 text-white border-purple-500 shadow-purple-500/30", done: "bg-purple-100 text-purple-500 border-purple-200", label: "text-purple-500" },
};

export default function OrderTracking({ orderId, onClose, paymentRecord: initialPaymentRecord }: OrderTrackingProps) {
    const { t, i18n } = useTranslation();
    const { saveOrderSession } = useCart();
    const isRtl = i18n.language === 'ar';
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [paymentRecord, setPaymentRecord] = useState<PaymentRecord | null>(initialPaymentRecord || null);

    useEffect(() => {
        const cleanId = (id: string) => id.replace(/#/g, '');
        const unsubOrder = FirebaseService.listen(`orders/${cleanId(orderId)}`, (val) => {
            setOrder(val);
            setLoading(false);
            if (val && (val.status === "delivered" || val.archived)) {
                saveOrderSession(null); // Clear session when completed
            }
        });
        const unsubPayment = FirebaseService.listen(`payments`, (payments: Record<string, PaymentRecord>) => {
            if (payments) {
                const record = Object.values(payments).find(p => p.orderId === cleanId(orderId));
                if (record) setPaymentRecord(record);
            }
        });
        const timer = setTimeout(() => setLoading(false), 5000);
        return () => { unsubOrder(); unsubPayment(); clearTimeout(timer); };
    }, [orderId]);

    const maskValue = (val: string) => {
        if (!val || val.length < 5) return val;
        return val.slice(0, 3) + "****" + val.slice(-2);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-gray-400 font-bold mt-5 text-sm">{t('common.loading_order')}</p>
        </div>
    );

    if (!order) return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-8 text-center">
            <div className="w-24 h-24 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center text-5xl mb-5">🔍</div>
            <h3 className="text-xl font-black text-gray-900">{t('common.order_not_found')}</h3>
            <p className="text-gray-400 text-sm mt-2 font-bold max-w-[220px] leading-relaxed">{t('common.order_not_found_desc')}</p>
            <button onClick={onClose} className="mt-7 px-8 py-4 rounded-2xl bg-primary text-white font-black text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                {t('common.back_to_menu')}
            </button>
        </div>
    );

    const isUntracked = order.tracked === false;
    const isCompleted = order.status === "delivered" || order.archived === true;
    const currentStatus = order.status || "pending";
    const currentIndex = STATUS_STAGES.indexOf(currentStatus);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 sm:px-8 pt-6 pb-4 flex items-center justify-between border-b border-gray-100 shrink-0 bg-white">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                        <FiMapPin size={18} />
                    </div>
                    <div>
                        <p className="text-gray-900 font-black text-sm">{t('common.order_status')}</p>
                        <p className="text-primary text-[10px] font-black uppercase tracking-widest opacity-70">{order.orderId}</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 hover:text-secondary hover:bg-secondary-50 flex items-center justify-center transition-all">
                    <FiX size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 sm:px-8 py-6 space-y-5 bg-gray-50">
                <AnimatePresence mode="wait">

                    {/* COMPLETED */}
                    {isCompleted ? (
                        <motion.div key="completed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-12 space-y-6">
                            <div className="w-32 h-32 bg-emerald-500 text-white rounded-[3rem] flex items-center justify-center text-5xl shadow-premium">
                                <FiCheck size={56} strokeWidth={3} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">{t('common.order_delivered') || "تم تسليم طلبك! 🎉"}</h3>
                                <p className="text-gray-400 font-bold mt-2 max-w-[260px] mx-auto leading-relaxed text-sm">
                                    {t('common.enjoy_meal') || "نتمنى لك وجبة شهية وتجربة رائعة معنا. ننتظرك مجدداً!"}
                                </p>
                            </div>
                            <div className="px-6 py-2.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-black uppercase tracking-widest">
                                {order.orderId}
                            </div>
                        </motion.div>

                    ) : !isUntracked ? (
                        <motion.div key="tracking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

                            {/* Live Badge */}
                            <div className="flex justify-center">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-xs font-black text-primary uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    {t('common.live_tracking')}
                                </div>
                            </div>

                            {/* Status Timeline */}
                            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-soft">
                                <div className="relative">
                                    {/* Track BG */}
                                    <div className="absolute top-8 left-8 right-8 h-0.5 bg-gray-100 rounded-full" />
                                    {/* Track Progress */}
                                    <div
                                        className="absolute top-8 h-0.5 bg-linear-to-r from-primary to-primary-400 rounded-full transition-all duration-1000"
                                        style={{
                                            width: currentIndex < 0 ? '0%' : `${(currentIndex / (STATUS_STAGES.length - 1)) * 84}%`,
                                            [isRtl ? 'right' : 'left']: '2rem'
                                        }}
                                    />
                                    <div className="flex justify-between relative z-10">
                                        {STATUS_STAGES.map((status, idx) => {
                                            const isDone = idx < currentIndex;
                                            const isCurrent = idx === currentIndex;
                                            const colors = STAGE_COLORS[status];

                                            return (
                                                <div key={status} className="flex flex-col items-center gap-2">
                                                    <motion.div
                                                        animate={isCurrent ? { scale: [1, 1.12, 1], y: [0, -3, 0] } : {}}
                                                        transition={{ repeat: Infinity, duration: 2.5 }}
                                                        className={`
                                                            w-16 h-16 rounded-2xl flex items-center justify-center border-2 shadow-lg transition-all duration-500
                                                            ${isCurrent ? colors.active + " ring-4 ring-offset-1 ring-current/20" : isDone ? colors.done : "bg-gray-50 text-gray-300 border-gray-100"}
                                                        `}
                                                    >
                                                        {STAGE_ICONS[status]}
                                                    </motion.div>
                                                    <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tighter whitespace-nowrap ${isCurrent || isDone ? colors.label : 'text-gray-300'}`}>
                                                        {t(`admin.${status}`)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="bg-white border border-gray-100 rounded-4xl p-6 shadow-soft space-y-5">
                                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <span>{t('admin.ordered_items')}</span>
                                    <span>{order.items?.length} {t('admin.products')}</span>
                                </div>
                                <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                                    {order.items?.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center text-xs">
                                            <div className="flex gap-2 items-center">
                                                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-[10px] border border-primary/15">{item.quantity}</span>
                                                <span className="font-bold text-gray-700">{item.name || item.nameAr}</span>
                                            </div>
                                            <span className="font-mono text-gray-400 font-bold">{item.total}₪</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-sm font-black text-gray-500">{t('common.total')}</span>
                                    <span className="text-2xl font-black text-primary">{order.totalAmount}₪</span>
                                </div>
                            </div>

                            {/* Payment Status */}
                            {(paymentRecord || order.paymentStatus) && (
                                <div className="bg-white border border-gray-100 rounded-4xl p-6 shadow-soft space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-500 text-xs font-black uppercase tracking-widest">
                                            <FiDollarSign size={14} className="text-primary" />
                                            {t('admin.payment')}
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${order.paymentStatus === 'paid'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : paymentRecord?.status === 'pending'
                                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                                : 'bg-gray-50 text-gray-400 border-gray-100'
                                            }`}>
                                            {order.paymentStatus === 'paid' ? t('admin.paid') :
                                                paymentRecord?.status === 'pending' ? t('common.under_review') : t('admin.unpaid')}
                                        </div>
                                    </div>
                                    {paymentRecord && (
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('common.payment_method')}</p>
                                                <p className="text-xs font-black text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 inline-block">{paymentRecord.methodName}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('common.account_name')}</p>
                                                <p className="text-xs font-black text-gray-700 truncate">{maskValue(paymentRecord.senderAccountName || "")}</p>
                                            </div>
                                            {paymentRecord.senderBankOrWallet && (
                                                <div className="col-span-2 space-y-1 pt-1">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('common.sender_bank_wallet')}</p>
                                                    <p className="text-xs font-black text-primary">{paymentRecord.senderBankOrWallet}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>

                    ) : null}

                    {/* WHATSAPP UNTRACKED */}
                    {isUntracked && !isCompleted && (
                        <motion.div key="wa" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center py-8 space-y-5">
                            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center text-5xl border border-green-100 shadow-sm">
                                <FaWhatsapp />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900">{t('admin.order_sent_wa')}</h3>
                                <p className="text-gray-400 text-sm font-bold mt-2 max-w-[230px] leading-relaxed">{t('admin.tracking_disabled')}</p>
                            </div>
                            <div className="w-full bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3">
                                {[
                                    { label: t('common.order_id'), value: order.orderId },
                                    { label: t('admin.customer'), value: order.customer?.name },
                                    { label: t('admin.phone'), value: maskValue(order.customer?.phone || "") },
                                ].map((row, idx) => (
                                    <div key={idx} className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{row.label}</span>
                                        <span className="text-sm font-bold text-gray-700">{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 sm:px-8 pb-6 pt-3 bg-white border-t border-gray-100 shrink-0">
                <button
                    onClick={onClose}
                    className="w-full py-4 rounded-2xl bg-gray-50 text-gray-500 border border-gray-100 font-black text-sm hover:bg-gray-100 hover:text-gray-800 transition-all flex items-center justify-center gap-2 group"
                >
                    <FiChevronRight className={`transition-transform group-hover:translate-x-1 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} size={18} />
                    {t('common.back_to_menu')}
                </button>
            </div>
        </div>
    );
}
