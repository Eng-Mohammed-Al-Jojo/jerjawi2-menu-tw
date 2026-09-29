import { useRef, useState, useEffect } from "react";
import { useCart } from "../../context/CartContext";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiShoppingCart, FiShoppingBag, FiArrowRight } from "react-icons/fi";
import CartItem from "./CartItem";
import OrderTabs from "./OrderTabs";
import OrderTracking from "./OrderTracking";
import { db } from "../../firebase";
import { onValue, ref } from "firebase/database";
import { OrderService } from "../../services/orderService";
import { PaymentService } from "../../services/paymentService";
import { toast } from "react-hot-toast";
import type { PaymentMethod, PaymentRecord } from "../../types/payment";
import PaymentFlow from "./PaymentFlow";
import { FiDollarSign } from "react-icons/fi";
import { usePaymentMethods } from "../../hooks/usePaymentMethods";

interface OrderSettings {
    inRestaurant: boolean;
    takeaway: boolean;
    inPhone: string;
    outPhone: string;
    orderMode?: "dashboard" | "whatsapp";
}

export default function CartModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { items, totalAmount, clearCart, orderId, updateOrderId, isFullTrackingOpen, setIsFullTrackingOpen, orderSession, saveOrderSession } = useCart();
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    const [step, setStep] = useState<"items" | "order" | "payment">("items");
    const [orderSettings, setOrderSettings] = useState<OrderSettings | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const { methods: allPaymentMethods, enabled: paymentScreenEnabled, loading: paymentMethodsLoading } = usePaymentMethods();
    const paymentMethods = allPaymentMethods.filter((method) => method.isEnabled);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
    const [createdOrderDisplayId, setCreatedOrderDisplayId] = useState<string | null>(null);
    const [customerName, setCustomerName] = useState<string>("");
    const [paymentRecord, setPaymentRecord] = useState<PaymentRecord | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const sRef = ref(db, "settings");
        const unsubSettings = onValue(sRef, (snap) => {
            const data = snap.val() || {};
            setOrderSettings(
                data.orderMode
                    ? { ...data.orderSettings, orderMode: data.orderMode }
                    : data.orderSettings || null
            );
        });
        return () => { unsubSettings(); };
    }, []);

    useEffect(() => {
        if (!paymentRecord?.id) return;
        const pRef = ref(db, `payments/${paymentRecord.id}`);
        return onValue(pRef, (snap) => {
            const data = snap.val();
            if (data) {
                setPaymentRecord(data);
                if (data.status === "rejected") {
                    toast.error(t('common.payment_rejected'));
                    setPaymentRecord(null);
                    setSelectedMethod(null);
                    if (orderSession) saveOrderSession({ ...orderSession, status: "pending_payment", lastUpdated: Date.now() });
                }
            }
        });
    }, [paymentRecord?.id]);

    useEffect(() => {
        if (paymentMethodsLoading || step !== "payment" || paymentRecord) return;
        if (!createdOrderId) return;
        if (paymentScreenEnabled && paymentMethods.length > 0) return;

        toast.success(t('common.order_saved_success'));
        saveOrderSession(null);
        updateOrderId(createdOrderId);
        setIsFullTrackingOpen(true);
        clearCart();
        setStep("items");
        setSelectedMethod(null);
    }, [paymentMethodsLoading, paymentScreenEnabled, paymentMethods.length, step, paymentRecord, createdOrderId]);

    // ✅ Session Sync Effect
    useEffect(() => {
        if (!orderSession?.orderId) return;
        const cleanId = orderSession.orderId.replace(/#/g, '');
        const oRef = ref(db, `orders/${cleanId}`);
        return onValue(oRef, (snap) => {
            const data = snap.val();
            if (!data) {
                // If order deleted, clear session
                saveOrderSession(null);
                return;
            }

            // Sync terminal states
            if (data.status === "delivered" || data.status === "cancelled" || data.archived) {
                saveOrderSession(null);
            }

            // ✅ REAL-TIME REDIRECT ON PAID STATUS
            if (data.paymentStatus === "paid" && step === "payment") {
                toast.success(t('common.payment_approved'));
                if (orderSession) saveOrderSession({ ...orderSession, status: "paid", lastUpdated: Date.now() });

                setTimeout(() => {
                    saveOrderSession(null);
                    updateOrderId(orderSession.orderId);
                    setIsFullTrackingOpen(true);
                    clearCart();
                    setStep("items");
                    setPaymentRecord(null);
                    setSelectedMethod(null);
                }, 1500);
            }
        });
    }, [orderSession?.orderId, step]);

    // Restore "submitted" sessions: fetch the payment record from Firebase
    // so the Under Review screen can display
    useEffect(() => {
        if (!isOpen) return;

        if (orderSession) {
            if (orderSession.status === "pending_payment") {
                setCreatedOrderId(orderSession.orderId);
                setCreatedOrderDisplayId(orderSession.displayId);
                setCustomerName(orderSession.customerName);
                setStep("payment");
                toast(t('common.session_restored') || "تم استعادة طلبك السابق، يمكنك إكمال الدفع", { icon: '🔄' });
            } else if (orderSession.status === "submitted") {
                // ✅ Stay on payment step — show Under Review, NOT tracking
                setCreatedOrderId(orderSession.orderId);
                setCreatedOrderDisplayId(orderSession.displayId);
                setCustomerName(orderSession.customerName);
                setStep("payment");
                // Fetch the existing payment record so RESULT screen renders
                const paymentsRef = ref(db, "payments");
                onValue(paymentsRef, (snap) => {
                    const payments = snap.val();
                    if (payments) {
                        const match = Object.values(payments).find(
                            (p: any) => p.orderId === orderSession.orderId
                        ) as PaymentRecord | undefined;
                        if (match) {
                            setPaymentRecord(match);
                        }
                    }
                }, { onlyOnce: true });
                toast(t('common.session_restored') || "تم استعادة طلبك السابق", { icon: '🔄' });
            } else if (orderSession.status === "paid") {
                // Only redirect to tracking when admin has actually approved
                updateOrderId(orderSession.orderId);
                setIsFullTrackingOpen(true);
            }
        } else {
            setStep("items");
        }
    }, [isOpen, orderSession]);

    const handleConfirm = async (type: "in" | "out", customerData: any, message: string) => {
        if (submitting) return;

        // ✅ Required Field Validation
        if (!customerData?.name?.trim()) {
            toast.error(t('common.name_required') || "يرجى إدخال اسم الزبون");
            return;
        }

        if (paymentMethodsLoading) {
            toast(t('common.loading'));
            return;
        }

        setSubmitting(true);
        try {
            const isWaMode = orderSettings?.orderMode === "whatsapp";
            const orderIdStr = await OrderService.getNextOrderNumber();

            if (isWaMode) {
                await OrderService.createOrder({
                    orderId: orderIdStr, customer: customerData,
                    items: items.map(i => ({ 
                        id: i.id, 
                        name: (i as any).nameAr || i.name, 
                        quantity: i.qty, 
                        selectedPriceType: i.selectedPriceType, 
                        price: i.selectedPrice, 
                        total: i.selectedPrice * i.qty 
                    })),
                    totalAmount: totalAmount, orderType: type, paymentStatus: "unpaid",
                    status: "archived", source: "whatsapp", tracked: false, excludedFromReports: true
                }, orderIdStr);
                const phone = type === "in" ? orderSettings?.inPhone : orderSettings?.outPhone;
                if (phone) {
                    const cleanPhone = phone.replace(/[\s\+]/g, '');
                    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
                }
                toast.success(t('common.order_success_alert'));
                setTimeout(() => { clearCart(); setStep("items"); onClose(); }, 1200);
                return;
            }

            // Idempotency: Check if session already exists for this order
            if (orderSession && orderSession.status === "pending_payment") {
                setCreatedOrderId(orderSession.orderId);
                setCreatedOrderDisplayId(orderSession.displayId);
                setStep("payment");
                return;
            }

            const cleanId = await OrderService.createOrder({
                orderId: orderIdStr, customer: customerData,
                items: items.map(i => ({ 
                    id: i.id, 
                    name: (i as any).nameAr || i.name, 
                    quantity: i.qty, 
                    selectedPriceType: i.selectedPriceType, 
                    price: i.selectedPrice, 
                    total: i.selectedPrice * i.qty 
                })),
                totalAmount: totalAmount, orderType: type, paymentStatus: "unpaid",
                status: "pending", source: "dashboard", tracked: true, excludedFromReports: false
            }, orderIdStr);

            setCustomerName(customerData.name);
            setCreatedOrderId(cleanId);
            setCreatedOrderDisplayId(orderIdStr);

            // Initialize Session
            saveOrderSession({
                orderId: cleanId,
                displayId: orderIdStr,
                customerName: customerData.name,
                status: "pending_payment",
                lastUpdated: Date.now()
            });

            if (paymentScreenEnabled && paymentMethods.length > 0) {
                setStep("payment");
            } else {
                toast.success(t('common.order_saved_success'));
                saveOrderSession(null);
                updateOrderId(cleanId);
                setIsFullTrackingOpen(true);
                setTimeout(() => { clearCart(); setStep("items"); }, 1000);
            }
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        } finally {
            setSubmitting(false);
        }
    };

    const handlePaymentSubmit = async (formData: any, methodOverride?: PaymentMethod) => {
        const method = methodOverride || selectedMethod;
        if (!method || !createdOrderId || !createdOrderDisplayId) return;

        if (!customerName) {
            toast.error(t('common.name_required'));
            return;
        }

        setSubmitting(true);
        try {
            // Map receiver details from method fields if they exist
            const record = await PaymentService.submitPayment({
                orderId: createdOrderId,
                methodId: method.id,
                methodName: method.label || method.name,
                customerName: customerName,
                senderAccountName: formData.senderAccountName || null,
                senderAccountNumber: formData.senderAccountNumber || null,
                receiverAccountName: method.label || method.name,
                receiverAccountNumber: method.details || null,
                senderBankOrWallet: formData.senderBankOrWallet || (formData as any).transactionReference || null,
                notes: formData.notes || "",
                amount: Number(totalAmount),
            });

            setPaymentRecord(record);

            // Update Session Status
            if (orderSession) {
                saveOrderSession({ ...orderSession, status: "submitted", paymentMethod: method.label, lastUpdated: Date.now() });
            }

            if (method.type === 'cash') {
                toast.success(t('common.order_saved_success'));
                // DO NOT REDIRECT TO TRACKING IMMEDIATELY
                // Let the session logic handle the "Under Review" state
            } else {
                toast.success(t('common.payment_submitted_success'));
            }
        } catch (error) {
            console.error("Payment submission error:", error);
            toast.error(t('common.error'));
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const STEPS = ["items", "order", "payment"];
    const stepIdx = STEPS.indexOf(step);

    const stepIcon = step === "items" ? <FiShoppingCart /> : step === "order" ? <FiShoppingBag /> : <FiDollarSign />;
    const stepTitle = step === "items" ? t('common.cart') : step === "order" ? t('common.complete_order') : t('common.payment_method');

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center overflow-hidden">

                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ y: "100%", opacity: 0.5 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0.5 }}
                    transition={{ type: "spring", damping: 28, stiffness: 220 }}
                    className="
                        relative w-full max-w-sm sm:max-w-md
                        h-[95vh] sm:h-auto sm:max-h-[90vh]
                        bg-white
                        sm:rounded-2xl rounded-t-4xl
                        shadow-[0_-8px_40px_rgba(53,81,82,0.15)]
                        overflow-hidden flex flex-col z-10
                        border border-primary-100
                    "
                >
                    {/* Top color accent */}
                    <div className="h-1 bg-linear-to-r from-primary via-primary-400 to-secondary shrink-0" />

                    {/* Header */}
                    <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-gray-100 bg-white shrink-0">
                        {/* Mobile drag handle */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-100 rounded-full sm:hidden" />

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-primary-600 text-white flex items-center justify-center text-xl shadow-xl shadow-primary/20 shrink-0">
                                {stepIcon}
                            </div>
                            <div>
                                <h2 className="text-lg font-extrabold text-gray-900 leading-tight tracking-tight">
                                    {stepTitle}
                                </h2>
                                <p className="text-primary text-[11px] font-black uppercase tracking-[0.2em] mt-1 opacity-60">
                                    {items.length} {t('common.items')} • {totalAmount}₪
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-secondary hover:bg-secondary-50 hover:rotate-90 transition-all border border-gray-100"
                        >
                            <FiX size={22} />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="px-4 py-2 flex items-center gap-2 bg-white shrink-0">
                        {STEPS.map((s, idx) => {
                            const isDone = idx < stepIdx;
                            const isActive = idx === stepIdx;
                            return (
                                <div
                                    key={s}
                                    className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${isDone ? 'bg-primary' : isActive ? 'bg-primary-300' : 'bg-gray-100'
                                        }`}
                                />
                            );
                        })}
                    </div>

                    {/* Scroll Content */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 pb-28 bg-gray-50"
                    >
                        <AnimatePresence mode="wait">
                            {step === "items" ? (
                                <motion.div
                                    key="items-step"
                                    initial={{ opacity: 0, x: isRtl ? 16 : -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: isRtl ? -16 : 16 }}
                                    className="space-y-2.5"
                                >
                                    {items.length === 0 ? (
                                        <div className="py-20 text-center flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-5xl">
                                                🛒
                                            </div>
                                            <h3 className="text-xl font-black text-gray-900">{t('common.empty_cart')}</h3>
                                            <p className="text-gray-400 text-sm font-bold max-w-[240px]">{t('common.add_items_desc')}</p>
                                            <button
                                                onClick={onClose}
                                                className="mt-2 px-8 py-3 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                                            >
                                                {t('common.back_to_menu')}
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-3">
                                                {items.map((item) => (
                                                    <CartItem key={item.priceKey} item={item} />
                                                ))}
                                            </div>
                                            {/* Summary Card */}
                                            <div className="mt-8 p-6 rounded-2xl bg-white border border-gray-100 shadow-soft relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />
                                                <div className="relative z-10 flex justify-between items-end">
                                                    <div className="space-y-1">
                                                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">{t('common.total')}</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-4xl font-black text-primary">{totalAmount}</span>
                                                            <span className="text-lg font-black text-primary/50">₪</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-xs font-bold text-gray-400">{t('common.items')}</span>
                                                        <span className="text-lg font-black text-gray-900">{items.length}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            ) : step === "order" ? (
                                <motion.div
                                    key="order-step"
                                    initial={{ opacity: 0, x: isRtl ? 16 : -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: isRtl ? -16 : 16 }}
                                >
                                    <button
                                        onClick={() => setStep("items")}
                                        className="flex items-center gap-1.5 text-xs font-black text-primary hover:gap-2.5 transition-all mb-5 opacity-70 hover:opacity-100"
                                    >
                                        <FiArrowRight className={isRtl ? "" : "rotate-180"} size={14} />
                                        {t('common.back_to_cart')}
                                    </button>
                                    <OrderTabs
                                        onConfirm={handleConfirm}
                                        orderSettings={orderSettings || undefined}
                                        submitting={submitting}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="payment-step"
                                    initial={{ opacity: 0, x: isRtl ? 16 : -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: isRtl ? -16 : 16 }}
                                >
                                    <PaymentFlow
                                        methods={paymentMethods}
                                        totalAmount={totalAmount}
                                        items={items}
                                        selectedMethod={selectedMethod}
                                        onSelectMethod={setSelectedMethod}
                                        paymentRecord={paymentRecord}
                                        submitting={submitting}
                                        onSubmit={handlePaymentSubmit}
                                        onResetRecord={() => { setPaymentRecord(null); setSelectedMethod(null); }}
                                        onTrackOrder={() => {
                                            const id = createdOrderId || paymentRecord?.orderId;
                                            if (id) { updateOrderId(id); setIsFullTrackingOpen(true); clearCart(); setStep("items"); }
                                        }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer CTA */}
                    {step === "items" && items.length > 0 && (
                        <div className="absolute bottom-0 inset-x-0 px-4 pb-4 pt-16 bg-linear-to-t from-gray-50 via-gray-50/95 to-transparent pointer-events-none z-30">
                            <button
                                onClick={() => setStep("order")}
                                className="pointer-events-auto w-full py-3 bg-primary text-white rounded-2xl font-black text-[15px] flex items-center justify-between px-4 shadow-premium hover:bg-primary-600 hover:scale-[1.02] active:scale-[0.98] transition-all border border-primary-400/20 group"
                            >
                                <span className="tracking-tight">{t('common.order_now')}</span>
                                <div className="flex items-center gap-4">
                                    <span className="text-lg font-extrabold">{totalAmount}₪</span>
                                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                        <FiArrowRight className={isRtl ? "rotate-180" : ""} size={20} />
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Tracking Overlay */}
                    <AnimatePresence>
                        {orderId && isFullTrackingOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="absolute inset-0 z-50 bg-white"
                            >
                                <OrderTracking
                                    orderId={orderId}
                                    paymentRecord={paymentRecord}
                                    onClose={() => { setIsFullTrackingOpen(false); onClose(); }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
