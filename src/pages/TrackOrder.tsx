import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import { FiClock, FiCheckCircle, FiPackage, FiChevronRight, FiPhone, FiCheck } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useTranslation } from "react-i18next";
// أضف هاد الإمبورت فوق
import PaymentMethodsDisplay from "../components/common/PaymentMethodsDisplay"; // عدّل المسار حسب مشروعك

export default function TrackOrderPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const cleanId = id.replace(/#/g, '');
        const orderRef = ref(db, `orders/${cleanId}`);
        const unsubscribe = onValue(orderRef, (snap) => {
            setOrder(snap.val());
            setLoading(false);
        });

        // Safety timeout: stop infinite loading after 5 seconds
        const timer = setTimeout(() => {
            setLoading(false);
        }, 5000);

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-(--bg-main) flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
                />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-(--bg-main) flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 rounded-4xl bg-(--bg-card) flex items-center justify-center mb-6 text-5xl shadow-xl border border-(--border-color)">
                    🔍
                </div>
                <h3 className="text-2xl font-black text-(--text-main)">{t('common.order_not_found')}</h3>
                <p className="text-(--text-muted) font-bold mt-2 max-w-md">
                    {t('common.order_not_found_desc')}
                </p>
                <button
                    onClick={() => navigate("/")}
                    className="mt-8 px-10 py-4 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                >
                    <FiChevronRight className={isRtl ? "rotate-180" : ""} />
                    {t('common.back_to_menu')}
                </button>
            </div>
        );
    }

    const isUntracked = order.tracked === false;
    const isCompleted = order.status === "delivered" || order.archived === true;
    const statuses = ["pending", "confirmed", "preparing", "ready"];
    const currentStatus = order.status || "pending";
    const currentIndex = statuses.indexOf(currentStatus);

    const maskValue = (val: string) => {
        if (!val || val.length < 5) return val;
        return val.slice(0, 3) + "****" + val.slice(-2);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "pending": return <FiClock />;
            case "confirmed": return <FiCheckCircle />;
            case "preparing": return <FiPackage />;
            case "ready": return <FiBell size={24} />;
            default: return <FiClock />;
        }
    };

    const getStatusLabel = (status: string) => {
        return t(`admin.${status}`);
    };

    return (
        <div className="min-h-screen bg-(--bg-main) py-10 px-4 sm:px-6 md:px-10 flex justify-center">
            <div className="w-full max-w-2xl space-y-8">

                <AnimatePresence mode="wait">
                    {isCompleted ? (
                        <motion.div
                            key="completed"
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-(--bg-card) p-10 py-16 rounded-[3rem] border border-(--border-color) shadow-2xl text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="w-24 h-24 bg-green-500 text-white rounded-[2.5rem] flex items-center justify-center text-4xl mb-8 mx-auto shadow-2xl shadow-green-500/20 relative z-10">
                                <FiCheck strokeWidth={3} />
                            </div>
                            <h3 className="text-3xl font-black text-(--text-main) relative z-10">{t('common.order_delivered') || "تم تسليم طلبك بنجاح!"}</h3>
                            <p className="text-(--text-muted) font-bold mt-3 max-w-[320px] mx-auto text-lg leading-relaxed relative z-10">
                                {t('common.enjoy_meal') || "نتمنى لك وجبة شهية وتجربة رائعة معنا. ننتظرك مجدداً بالحب!"}
                            </p>
                            <div className="mt-10 inline-flex px-8 py-3 bg-primary/5 text-primary text-xs font-black uppercase tracking-widest rounded-full border border-primary/10 relative z-10">
                                #{t('common.order_id')}: {order.orderId}
                            </div>
                        </motion.div>
                    ) : !isUntracked ? (
                        <motion.div
                            key="tracking"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-(--bg-card) p-8 rounded-[2.5rem] border border-(--border-color) shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />

                            <div className="text-center relative z-10">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20 mb-6 shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(167,10,5,0.5)]" />
                                    {t('common.live_tracking')}
                                </div>
                                <h1 className="text-4xl font-black text-(--text-main) tracking-tighter mb-2">{t('common.order_status')}</h1>
                                <p className="text-(--text-muted) font-black flex items-center justify-center gap-2 text-sm">
                                    <span className="opacity-50">#{t('common.order_id')}:</span> {order.orderId}
                                </p>
                            </div>

                            {/* Stepper */}
                            <div className="mt-12 relative px-4">
                                {/* Track Line */}
                                <div className="absolute top-7 left-12 right-12 h-1 bg-(--bg-main) rounded-full -translate-y-1/2" />
                                <div
                                    className="absolute top-7 h-1 bg-primary rounded-full -translate-y-1/2 transition-all duration-1000 ease-out"
                                    style={{
                                        width: currentIndex < 0 ? '0%' : `calc(${(currentIndex / (statuses.length - 1)) * 88}%)`,
                                        [isRtl ? 'right' : 'left']: '48px'
                                    }}
                                />

                                <div className="flex justify-between items-start relative z-10">
                                    {statuses.map((status, idx) => {
                                        const isCompletedStatus = idx < currentIndex;
                                        const isCurrent = idx === currentIndex;

                                        return (
                                            <div key={status} className="flex flex-col items-center gap-4 w-1/4">
                                                <motion.div
                                                    animate={isCurrent ? { y: [0, -6, 0] } : {}}
                                                    transition={{ repeat: Infinity, duration: 4 }}
                                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-xl transition-all duration-700 border-2 ${isCurrent ? "bg-primary text-white border-primary ring-4 ring-primary/20 shadow-primary/30" : isCompletedStatus ? "bg-primary/20 text-primary border-primary/10" : "bg-(--bg-main) text-(--text-muted) border-(--border-color)"
                                                        }`}
                                                >
                                                    {getStatusIcon(status)}
                                                </motion.div>
                                                <div className="text-center">
                                                    <p className={`text-[10px] font-black uppercase tracking-tighter sm:tracking-widest ${isCurrent || isCompletedStatus ? "text-primary" : "text-(--text-muted)"
                                                        }`}>
                                                        {getStatusLabel(status)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="untracked"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-(--bg-card) p-10 py-16 rounded-[3rem] border border-(--border-color) shadow-2xl text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="w-24 h-24 bg-amber-500/10 text-amber-500 rounded-[2.5rem] flex items-center justify-center text-4xl mb-8 mx-auto shadow-2xl border border-amber-500/20 relative z-10">
                                <FaWhatsapp />
                            </div>
                            <h3 className="text-3xl font-black text-(--text-main) relative z-10">{t('admin.order_sent_wa')}</h3>
                            <p className="text-(--text-muted) font-bold mt-3 max-w-[320px] mx-auto text-lg leading-relaxed relative z-10">
                                {t('admin.tracking_disabled')}
                            </p>
                            <div className="mt-10 inline-flex px-8 py-3 bg-primary/5 text-primary text-xs font-black uppercase tracking-widest rounded-full border border-primary/10 relative z-10">
                                #{t('common.order_id')}: {order.orderId}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ✅ Payment Methods Section */}
                <h3 className="text-xs font-black text-(--text-muted) uppercase tracking-widest px-2 flex items-center gap-2 mb-2">
                    {t('admin.available_payment_methods')}
                </h3>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <PaymentMethodsDisplay />
                </motion.div>


                {/* Details Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Customer Info */}
                    <motion.div
                        initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-(--bg-card) p-8 rounded-4xl border border-(--border-color) shadow-xl"
                    >
                        <h3 className="text-xs font-black text-(--text-muted) uppercase tracking-widest mb-6 flex items-center gap-2">
                            {t('admin.customer_details')}
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                    <FiCheckCircle size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-(--text-muted) font-black uppercase tracking-widest">{t('common.customer_name')}</span>
                                    <span className="font-bold text-(--text-main)">{order.customer?.name}</span>
                                </div>
                            </div>
                            {order.customer?.phone && (
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-green-500/5 flex items-center justify-center text-green-500">
                                        <FiPhone size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-(--text-muted) font-black uppercase tracking-widest">{t('common.phone_number')}</span>
                                        <span className="font-bold text-(--text-main) dir-ltr">{isUntracked ? maskValue(order.customer.phone) : order.customer.phone}</span>
                                    </div>
                                </div>
                            )}
                            {order.customer?.address && (
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/5 flex items-center justify-center text-orange-500">
                                        <FiTruck size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-(--text-muted) font-black uppercase tracking-widest">{t('common.address')}</span>
                                        <span className="font-bold text-(--text-main)">{order.customer.address}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Order Info */}
                    <motion.div
                        initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-(--bg-card) p-8 rounded-4xl border border-(--border-color) shadow-xl"
                    >
                        <h3 className="text-xs font-black text-(--text-muted) uppercase tracking-widest mb-6 flex items-center gap-2">
                            {t('admin.ordered_items')}
                        </h3>
                        <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {order.items?.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-lg">{item.qty}×</span>
                                        <span className="font-bold text-(--text-main)">
                                            {isRtl ? item.nameAr : item.nameEn || item.nameAr}
                                        </span>
                                    </div>
                                    <span className="font-mono text-(--text-muted) text-xs font-bold">{item.total}₪</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-(--border-color) flex justify-between items-center">
                            <span className="font-black text-(--text-main) uppercase text-sm tracking-widest">{t('common.total')}</span>
                            <span className="text-3xl font-black text-primary">{order.totalAmount}₪</span>
                        </div>
                    </motion.div>
                </div>

                <button
                    onClick={() => navigate("/")}
                    className="w-full py-5 rounded-4xl bg-(--bg-card) border border-(--border-color) text-(--text-main) font-black hover:bg-(--bg-main) transition-all flex items-center justify-center gap-3 group shadow-xl"
                >
                    {t('common.back_to_menu')}
                    <FiChevronRight className={`transition-transform group-hover:translate-x-2 ${isRtl ? 'rotate-180 group-hover:-translate-x-2' : ''}`} />
                </button>
            </div>
        </div>
    );
}

// Internal icons helper
function FiBell({ size }: { size: number }) {
    return <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height={size} width={size} xmlns="http://www.w3.org/2000/svg"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
}

function FiTruck({ size }: { size: number }) {
    return <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height={size} width={size} xmlns="http://www.w3.org/2000/svg"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>;
}
