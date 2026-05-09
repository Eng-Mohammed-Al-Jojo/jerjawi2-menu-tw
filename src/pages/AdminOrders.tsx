/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { useEffect, useState, useMemo, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
    FiSearch, FiFilter, FiCalendar, FiPackage, FiCheckCircle,
    FiClock, FiTrash2, FiArchive, FiDollarSign, FiBarChart2, FiLayers,
    FiShoppingBag, FiInfo, FiTag, FiArrowRight, FiRotateCw, FiX, FiBell,
    FiTruck, FiBellOff, FiVolume2, FiVolumeX,
} from "react-icons/fi";
import { FaChair, FaMotorcycle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { OrderService } from "../services/orderService";
import { FirebaseService } from "../services/firebaseService";
import { calculateStats } from "../utils/accountingUtils";
import { exportOrdersToExcel } from "../utils/excelUtils";
import AnalyticsSection from "../components/admin/AnalyticsSection";
import OrderDetailsDrawer from "../components/admin/OrderDetailsDrawer";
import DeleteConfirmationModal from "../components/admin/DeleteConfirmationModal";
import OrderNotificationToast from "../components/admin/OrderNotificationToast";
import PaymentMethodsModal from "../components/admin/PaymentMethodsModal";
import PaymentApprovalsModal from "../components/admin/PaymentApprovalsModal";
import CloseDayModal from "../components/admin/CloseDayModal";
import { useOrderNotifications } from "../hooks/useOrderNotifications";
import { PaymentService } from "../services/paymentService";
import type { PaymentRecord } from "../types/payment";
import type { Order, OrderStatus } from "../types/order";
import {
    isWithinInterval,
    startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    isSameDay
} from "date-fns";

type DateRangeFilter = "all" | "today" | "week" | "month";

export default function AdminOrdersPage() {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const navigate = useNavigate();

    const [authOk, setAuthOk] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [limit] = useState(1000);

    // Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [paymentFilter, setPaymentFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [sourceFilter, setSourceFilter] = useState<string>("all");
    const [dateRange, setDateRange] = useState<DateRangeFilter>("all");

    const [showAnalytics, setShowAnalytics] = useState(false);
    const [viewMode, setViewMode] = useState<"active" | "history" | "whatsapp">("active");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isApprovalsModalOpen, setIsApprovalsModalOpen] = useState(false);
    const [isCloseDayModalOpen, setIsCloseDayModalOpen] = useState(false);
    const [payments, setPayments] = useState<PaymentRecord[]>([]);

    // ✅ Notification Management
    const { notifications, dismissNotification, settings, updateSettings } = useOrderNotifications(limit);

    useEffect(() => {
        const auth = FirebaseService.auth();
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            setAuthOk(!!user);
            if (!user) setLoading(false);
        });

        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    console.log("Order Monitoring: System Notifications Enabled 🔔");
                }
            });
        }

        return () => unsubAuth();
    }, []);

    useEffect(() => {
        if (!authOk) return;
        const unsubOrders = OrderService.listenToOrders(limit, (ordersArray) => {
            setOrders(ordersArray);
            setLoading(false);
        });

        const unsubPayments = PaymentService.listenToPayments(100, (paymentsArray) => {
            setPayments(paymentsArray);
        });

        return () => {
            unsubOrders();
            unsubPayments();
        };
    }, [authOk, limit]);

    const stats = useMemo(() => calculateStats(orders), [orders]);

    // ✅ Augment orders with payment data for detailed export
    const augmentedOrders = useMemo(() => {
        return orders.map(order => {
            const payment = payments.find(p => p.orderId === order.id);
            if (payment) {
                return {
                    ...order,
                    methodName: payment.methodName,
                    senderAccountName: payment.senderAccountName,
                    senderAccountNumber: payment.senderAccountNumber,
                    receiverAccountName: payment.receiverAccountName,
                    receiverAccountNumber: payment.receiverAccountNumber,
                    senderBankOrWallet: payment.senderBankOrWallet,
                };
            }
            return order;
        });
    }, [orders, payments]);

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch =
                (order.customer?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (order.orderId || "").toLowerCase().includes(searchTerm.toLowerCase());

            let matchesView = true;
            if (viewMode === "active") matchesView = order.archived !== true && order.status !== "delivered" && order.status !== "cancelled" && order.status !== "archived";
            else if (viewMode === "history") matchesView = (order.archived === true || order.status === "delivered" || order.status === "cancelled" || order.status === "archived");
            else if (viewMode === "whatsapp") matchesView = order.source === "whatsapp";

            const matchesStatus = statusFilter === "all" || order.status === statusFilter;
            const matchesType = typeFilter === "all" || order.orderType === typeFilter;

            const isPaid = order.paymentStatus === "paid" || order.status === "delivered";
            const matchesPayment = paymentFilter === "all" || (paymentFilter === "paid" ? isPaid : !isPaid);

            let matchesDate = true;
            const orderDate = new Date(order.createdAt);
            const now = new Date();
            if (dateRange === "today") matchesDate = isSameDay(orderDate, now);
            else if (dateRange === "week") matchesDate = isWithinInterval(orderDate, { start: startOfWeek(now), end: endOfWeek(now) });
            else if (dateRange === "month") matchesDate = isWithinInterval(orderDate, { start: startOfMonth(now), end: endOfMonth(now) });

            const matchesSource = sourceFilter === "all" || (order.source || "dashboard") === sourceFilter;

            return matchesSearch && matchesView && matchesStatus && matchesType && matchesPayment && matchesDate && matchesSource;
        });
    }, [orders, searchTerm, statusFilter, paymentFilter, typeFilter, dateRange, viewMode, sourceFilter]);

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await OrderService.deleteOrder(deleteId);
            toast.success(t('common.success_message'));
        } catch (error) {
            toast.error(t('common.error'));
        } finally {
            setDeleteId(null);
        }
    };

    if (!authOk && !loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-premium text-center max-w-md">
                    <div className="text-7xl mb-8">🔒</div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4">{t('admin.login_title')}</h2>
                    <p className="text-gray-500 font-medium mb-8">{t('admin.login_required')}</p>
                    <button onClick={() => navigate("/admin")} className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95">
                        {t('admin.login_btn')}
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-['Cairo']">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header & Main Toggle */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                    <div className="flex items-center gap-6">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(-1)}
                            className="w-14 h-14 flex items-center justify-center bg-white text-gray-900 rounded-2xl border border-gray-100 shadow-soft hover:shadow-premium transition-all"
                        >
                            {isRtl ? <FiArrowRight size={24} /> : <FiArrowRight className="rotate-180" size={24} />}
                        </motion.button>
                        <div className="text-right">
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight">{t('admin.orders_board')}</h1>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                {viewMode === "history" ? t('admin.archived_orders') : viewMode === "whatsapp" ? t('admin.source_whatsapp') : t('admin.active_orders')}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsApprovalsModalOpen(true)}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl bg-white border border-gray-100 shadow-soft transition-all relative ${payments.some(p => p.status === 'pending') ? 'text-amber-500' : 'text-gray-400'}`}
                                title={t('admin.payment_requests')}
                            >
                                <FiBell />
                                {payments.filter(p => p.status === 'pending').length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                                        {payments.filter(p => p.status === 'pending').length}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setIsPaymentModalOpen(true)}
                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl bg-white text-gray-400 border border-gray-100 hover:text-primary hover:border-primary/30 shadow-soft transition-all"
                                title={t('admin.payment_methods')}
                            >
                                <FiDollarSign />
                            </button>

                            <button
                                onClick={() => setShowAnalytics(!showAnalytics)}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all border ${showAnalytics ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:text-primary hover:border-primary/30 shadow-soft'}`}
                                title="الاحصائيات"
                            >
                                <FiBarChart2 />
                            </button>


                            <div className="flex bg-white p-1.5 gap-1.5 rounded-2xl border border-gray-100 shadow-inner">
                                <button
                                    onClick={() => updateSettings('system', !settings.system)}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${settings.system ? 'text-primary bg-primary/10' : 'text-gray-400 hover:bg-gray-50'}`}
                                >
                                    {settings.system ? <FiBell /> : <FiBellOff />}
                                </button>
                                <button
                                    onClick={() => updateSettings('sound', !settings.sound)}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${settings.sound ? 'text-blue-500 bg-blue-500/10' : 'text-gray-400 hover:bg-gray-50'}`}
                                >
                                    {settings.sound ? <FiVolume2 /> : <FiVolumeX />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsCloseDayModalOpen(true)}
                                className="px-6 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 transition-all font-black text-xs uppercase tracking-widest shadow-soft flex items-center gap-2"
                            >
                                <FiTrash2 /> إغلاق يومي وتنزيل Excel
                            </button>

                            <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-inner">
                                {[
                                    { id: "active", icon: <FiClock />, label: t('admin.active_orders') },
                                    { id: "history", icon: <FiArchive />, label: t('admin.history') || "الأرشيف" },
                                    { id: "whatsapp", icon: <FiPackage />, label: t('admin.source_whatsapp') }
                                ].map((mode) => (
                                    <button
                                        key={mode.id}
                                        onClick={() => setViewMode(mode.id as any)}
                                        className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${viewMode === mode.id
                                            ? 'bg-primary text-white shadow-xl shadow-primary/20'
                                            : 'text-gray-400 hover:text-primary hover:bg-gray-50'
                                            }`}
                                    >
                                        {mode.icon}
                                        <span className="hidden sm:inline uppercase tracking-wider">{mode.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Stats KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <StatCard icon={<FiDollarSign />} label={t('admin.total_revenue')} value={`${stats.overall.totalRevenue}₪`} type="primary" />
                    <StatCard icon={<FiShoppingBag />} label={t('admin.total_orders')} value={stats.overall.totalOrders} type="blue" />
                    <StatCard icon={<FiCheckCircle />} label={t('admin.paid_orders')} value={stats.overall.paidCount} type="emerald" />
                    <StatCard icon={<FiClock />} label={t('admin.unpaid_orders')} value={stats.overall.unpaidCount} type="secondary" />
                </div>

                {/* Analytics Panel (Toggleable) */}
                <AnimatePresence>
                    {showAnalytics && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-soft">
                                <AnalyticsSection orders={orders} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Advanced Filter Management */}
                <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-soft space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
                            <FiFilter size={20} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">{t('admin.advanced_filters')}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
                        <SearchInput value={searchTerm} onChange={setSearchTerm} t={t} isRtl={isRtl} />
                        <FilterSelect
                            icon={<FiCalendar />}
                            value={dateRange}
                            onChange={(val: string) => setDateRange(val as DateRangeFilter)}
                            options={[
                                { val: "all", label: t('admin.all_dates') },
                                { val: "today", label: t('admin.today') },
                                { val: "week", label: t('admin.this_week') },
                                { val: "month", label: t('admin.this_month') }
                            ]}
                            isRtl={isRtl}
                        />
                        <FilterSelect icon={<FiLayers />} value={typeFilter} onChange={setTypeFilter} options={[
                            { val: "all", label: t('admin.all_types') },
                            { val: "in", label: t('common.dine_in') },
                            { val: "out", label: t('common.takeaway') }
                        ]} isRtl={isRtl} />
                        <FilterSelect icon={<FiPackage />} value={statusFilter} onChange={setStatusFilter} options={[
                            { val: "all", label: t('admin.all_status') },
                            { val: "pending", label: t('admin.pending') },
                            { val: "confirmed", label: t('admin.confirmed') },
                            { val: "preparing", label: t('admin.preparing') },
                            { val: "ready", label: t('admin.ready') },
                            { val: "delivered", label: t('admin.delivered') },
                            { val: "cancelled", label: t('admin.cancelled') }
                        ]} isRtl={isRtl} />
                        <FilterSelect icon={<FiTag />} value={sourceFilter} onChange={(val: string) => setSourceFilter(val)} options={[
                            { val: "all", label: t('admin.source_filter') },
                            { val: "dashboard", label: t('admin.source_dashboard') },
                            { val: "whatsapp", label: t('admin.source_whatsapp') }
                        ]} isRtl={isRtl} />
                        <FilterSelect icon={<FiDollarSign />} value={paymentFilter} onChange={(val: string) => setPaymentFilter(val)} options={[
                            { val: "all", label: t('admin.all_payments') },
                            { val: "paid", label: t('admin.paid') },
                            { val: "unpaid", label: t('admin.unpaid') }
                        ]} isRtl={isRtl} />
                    </div>
                </div>

                {/* Professional Orders Table */}
                <>
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-premium overflow-hidden flex flex-col">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-right border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-8 py-6 text-[11px] font-bold uppercase text-gray-400 tracking-[0.2em]">{t('admin.order_id')}</th>
                                        <th className="px-8 py-6 text-[11px] font-bold uppercase text-gray-400 tracking-[0.2em]">{t('admin.customer')}</th>
                                        <th className="px-8 py-6 text-[11px] font-bold uppercase text-gray-400 tracking-[0.2em]">{t('admin.order_time')}</th>
                                        <th className="px-8 py-6 text-[11px] font-bold uppercase text-gray-400 tracking-[0.2em]">{t('admin.type')}</th>
                                        <th className="px-8 py-6 text-[11px] font-bold uppercase text-gray-400 tracking-[0.2em]">{t('admin.status_lifecycle')}</th>
                                        <th className="px-8 py-6 text-[11px] font-bold uppercase text-gray-400 tracking-[0.2em]">{t('admin.payment')}</th>
                                        <th className="px-8 py-6 text-[11px] font-bold uppercase text-gray-400 tracking-[0.2em] text-center">{t('common.total')}</th>
                                        <th className="px-8 py-6 text-[11px] font-bold uppercase text-gray-400 tracking-[0.2em] text-left">{t('admin.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={8} className="px-8 py-32 text-center">
                                                <div className="flex flex-col items-center justify-center gap-6">
                                                    <div className="w-14 h-14 rounded-full border-4 border-gray-100 border-t-primary animate-spin" />
                                                    <p className="text-gray-400 font-bold tracking-[0.2em] uppercase text-xs">
                                                        {t('common.loading')}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        <AnimatePresence mode="popLayout">
                                            {filteredOrders.map((order) => (
                                                <motion.tr
                                                    key={order.id}
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="group hover:bg-gray-50 transition-all duration-300 cursor-pointer"
                                                    onClick={() => setSelectedOrder(order)}
                                                >

                                                    {/* ORDER ID */}
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col gap-2 items-start">
                                                            <span className="text-xs font-black text-primary bg-primary/5 px-2 py-1.5 rounded-xl border border-primary/10 tracking-widest shadow-sm">
                                                                {order.orderId}
                                                            </span>

                                                            {order.source === "whatsapp" && (
                                                                <span className="text-[10px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                                                    {t('admin.source_whatsapp')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* CUSTOMER */}
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <p className="text-base font-bold text-gray-900 leading-tight">
                                                                {order.customer?.name}
                                                            </p>
                                                            <p className="text-xs text-gray-400 font-medium mt-1">
                                                                {order.customer?.table
                                                                    ? `${t('admin.table_number')} ${order.customer.table}`
                                                                    : (order.customer?.phone || "")}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    {/* TIME ORDER */}
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-gray-900">
                                                                {order.createdAt
                                                                    ? new Date(order.createdAt).toLocaleTimeString('ar-EG', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })
                                                                    : "--"}
                                                            </span>

                                                            <span className="text-[11px] text-gray-400 font-medium mt-1">
                                                                {order.createdAt
                                                                    ? new Date(order.createdAt).toLocaleDateString('ar-EG')
                                                                    : ""}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    {/* TYPE */}
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center justify-center">
                                                            {order.orderType === "in" ? (
                                                                <div
                                                                    title={t('common.dine_in')}
                                                                    className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm border border-blue-100 hover:scale-110 transition-transform"
                                                                >
                                                                    <FaChair size={18} />
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    title={t('common.takeaway')}
                                                                    className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm border border-emerald-100 hover:scale-110 transition-transform"
                                                                >
                                                                    <FaMotorcycle size={18} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* STATUS */}
                                                    <td className="px-8 py-6">
                                                        <div className="min-w-[360px]">
                                                            <InlineStatusPills
                                                                order={order}
                                                                t={t}
                                                                viewMode={viewMode}
                                                            />
                                                        </div>
                                                    </td>

                                                    {/* PAYMENT */}
                                                    <td className="px-8 py-6">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                OrderService.updatePaymentStatus(
                                                                    order.id,
                                                                    order.paymentStatus === "paid" ? "unpaid" : "paid"
                                                                );
                                                            }}
                                                            className="hover:scale-105 transition-transform"
                                                        >
                                                            <PaymentBadge
                                                                isPaid={
                                                                    order.paymentStatus === "paid" ||
                                                                    order.status === "delivered"
                                                                }
                                                                t={t}
                                                            />
                                                        </button>
                                                    </td>

                                                    {/* TOTAL */}
                                                    <td className="px-8 py-6 text-center">
                                                        <span className="text-xl font-black text-primary tracking-tight">
                                                            {order.totalAmount}<span className="text-xs ml-0.5 opacity-60">₪</span>
                                                        </span>
                                                    </td>

                                                    {/* ACTIONS */}
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3 justify-start">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedOrder(order);
                                                                }}
                                                                className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center shadow-sm"
                                                            >
                                                                <FiInfo size={18} />
                                                            </button>


                                                            {/* Delete Button */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteId(order.id);
                                                                }}
                                                                className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center shadow-sm"
                                                            >
                                                                <FiTrash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>

                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Empty State */}
                    {!loading && filteredOrders.length === 0 && (
                        <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                                <FiPackage size={40} className="text-gray-200" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900">{t('admin.no_results_found')}</h3>
                            <p className="text-gray-400 font-bold mt-3 uppercase tracking-widest text-xs">{t('admin.no_orders')}</p>
                        </div>
                    )}
                </>
            </div>

            {/* Premium Detail Drawer */}
            <OrderDetailsDrawer order={selectedOrder} isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} />

            {/* Safety Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title={(t('admin.delete_order') || "حذف الطلب")}
                details={orders.find(o => o.id === deleteId)?.orderId}
            />

            {/* Real-time Notifications Stack */}
            <OrderNotificationToast
                notifications={notifications}
                onClose={dismissNotification}
                onView={setSelectedOrder}
            />

            {/* Payment Methods Management */}
            <PaymentMethodsModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
            />

            {/* Payment Approvals Workflow */}
            <PaymentApprovalsModal
                isOpen={isApprovalsModalOpen}
                onClose={() => setIsApprovalsModalOpen(false)}
                payments={payments}
                onApprove={async (p: { id: string; orderId: string; }) => {
                    const linkedOrder = orders.find(o => o.id === p.orderId);
                    if (linkedOrder) {
                        await PaymentService.confirmPayment(p as any, linkedOrder, "admin");
                        toast.success(t('admin.payment_approved_success') || "تم تأكيد الدفع بنجاح");
                    } else {
                        await PaymentService.updatePaymentStatus(p.id, p.orderId, "approved");
                        toast.success(t('admin.payment_approved_success'));
                    }
                }}
                onReject={async (p: { id: string; orderId: string; }) => {
                    await PaymentService.updatePaymentStatus(p.id, p.orderId, "rejected");
                    toast.error(t('admin.payment_rejected_error'));
                }}
            />

            {/* Daily Closing Confirmation Modal */}
            <CloseDayModal
                isOpen={isCloseDayModalOpen}
                onClose={() => setIsCloseDayModalOpen(false)}
                onConfirm={async () => {
                    try {
                        // 1. Export to Excel
                        exportOrdersToExcel(augmentedOrders, `Daily_Closing_${new Date().toISOString().split('T')[0]}`);

                        // 2. Clear Database
                        await OrderService.deleteAllOrders();
                        await PaymentService.deleteAllPayments();

                        // 3. Notify Success
                        toast.success("تم إغلاق اليوم وتنزيل التقرير بنجاح");
                    } catch (error) {
                        toast.error("حدث خطأ أثناء إغلاق اليوم");
                        throw error;
                    }
                }}
            />
        </div >
    );
}

// Sub-components
interface StatCardProps {
    icon: ReactNode;
    label: string;
    value: string | number;
    type: "primary" | "secondary" | "blue" | "emerald";
}

function StatCard({ icon, label, value, type }: StatCardProps) {
    const config = {
        primary: { bg: "bg-white", text: "text-primary", iconBg: "bg-primary/5", iconText: "text-primary", border: "border-gray-100" },
        secondary: { bg: "bg-white", text: "text-secondary", iconBg: "bg-secondary/5", iconText: "text-secondary", border: "border-gray-100" },
        blue: { bg: "bg-white", text: "text-blue-600", iconBg: "bg-blue-50", iconText: "text-blue-600", border: "border-gray-100" },
        emerald: { bg: "bg-white", text: "text-emerald-600", iconBg: "bg-emerald-50", iconText: "text-emerald-600", border: "border-gray-100" }
    };

    const s = config[type];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${s.bg} border ${s.border} p-8 rounded-[2.5rem] shadow-soft hover:shadow-premium transition-all duration-500 group`}
        >
            <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-3xl ${s.iconBg} ${s.iconText} flex items-center justify-center shadow-inner transition-transform group-hover:scale-110`}>
                    <span className="text-2xl">{icon}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">{label}</span>
                    <div className={`text-3xl font-black ${s.text} tracking-tight`}>{value}</div>
                </div>
            </div>
        </motion.div>
    );
}

function SearchInput({ value, onChange, t, isRtl }: any) {
    return (
        <div className="relative group xl:col-span-1">
            <FiSearch className={`absolute top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary ${isRtl ? 'right-5' : 'left-5'}`} size={20} />
            <input
                type="text"
                placeholder={t('admin.search_placeholder')}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-sm ${isRtl ? 'pr-14 pl-5 text-right' : 'pl-14 pr-5'}`}
            />
        </div>
    );
}

function FilterSelect({ icon, value, onChange, options, isRtl }: any) {
    return (
        <div className="relative">
            <div className={`absolute top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none ${isRtl ? 'right-5' : 'left-5'}`}>
                {icon}
            </div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-primary transition-all font-bold text-sm appearance-none relative ${isRtl ? 'pr-14 pl-6 text-right' : 'pl-14 pr-6'}`}
            >
                {options.map((opt: any) => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
            </select>
        </div>
    );
}


function StatusBadge({ status, t }: { status: OrderStatus; t: any }) {
    const config: Record<string, { bg: string, text: string, border: string }> = {
        pending: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
        confirmed: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
        preparing: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100" },
        ready: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
        delivered: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
        cancelled: { bg: "bg-red-50", text: "text-red-600", border: "border-red-100" },
        archived: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-100" }
    };
    const c = config[status] || config.pending;
    return (
        <span className={`px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${c.bg} ${c.text} ${c.border} shadow-sm flex items-center gap-1.5`}>
            {t(`admin.${status}`) || status}
        </span>
    );
}

function PaymentBadge({ isPaid, t }: { isPaid: boolean; t: any }) {
    return (
        <span
            className={`
      inline-flex items-center justify-center
      px-2 sm:px-3 py-1 sm:py-1.5
      rounded-full border
      text-xs sm:text-sm font-bold
      whitespace-nowrap
      transition-all duration-200
      ${isPaid
                    ? "bg-linear-to-r from-emerald-500 to-emerald-600 text-white border-none"
                    : "bg-gray-100 text-gray-600 border-gray-200"}
    `}
        >
            {isPaid ? t('admin.paid') : t('admin.unpaid')}
        </span>
    );
}

function InlineStatusPills({ order, t, viewMode }: { order: Order, t: any, viewMode: string }) {
    const currentStatus = order.status;
    const orderId = order.id;

    const [updating, setUpdating] = useState(false);

    const nextStepMap: Record<string, OrderStatus | null> = {
        pending: "confirmed",
        confirmed: "preparing",
        preparing: "ready",
        ready: "delivered",
        delivered: "archived",
        cancelled: null,
        archived: "pending"
    };

    const prevStepMap: Record<string, OrderStatus | null> = {
        confirmed: "pending",
        preparing: "confirmed",
        ready: "preparing"
    };

    const nextStatus = nextStepMap[currentStatus];
    const prevStatus = prevStepMap[currentStatus];

    const config: Record<OrderStatus, { color: string, icon: any, label: string, btnClass: string }> = {
        pending: { color: "blue", icon: <FiCheckCircle />, label: t('admin.mark_confirmed'), btnClass: "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20" },
        confirmed: { color: "indigo", icon: <FiPackage />, label: t('admin.mark_preparing'), btnClass: "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20" },
        preparing: { color: "purple", icon: <FiBell />, label: t('admin.mark_ready'), btnClass: "bg-purple-500 hover:bg-purple-600 shadow-purple-500/20" },
        ready: { color: "emerald", icon: <FiTruck />, label: t('admin.mark_delivered'), btnClass: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" },
        delivered: { color: "gray", icon: <FiArchive />, label: t('admin.mark_archived'), btnClass: "bg-gray-500 hover:bg-gray-600 shadow-gray-500/20" },
        cancelled: { color: "red", icon: <FiX />, label: t('admin.cancelled'), btnClass: "bg-red-500 hover:bg-red-600 shadow-red-500/20" },
        archived: { color: "blue", icon: <FiRotateCw />, label: t('admin.restore_order'), btnClass: "bg-primary hover:bg-primary/90 shadow-primary/20" }
    };

    const handleUpdate = async (status: OrderStatus) => {
        if (updating) return;
        setUpdating(true);
        try {
            const extraUpdates: any = {};
            const now = Date.now();

            if (status === "preparing" && !order.preparationTime?.startedAt) {
                extraUpdates['preparationTime/startedAt'] = now;
            } else if (status === "ready") {
                extraUpdates['preparationTime/completedAt'] = now;
                if (order.preparationTime?.startedAt) {
                    const durationMs = now - order.preparationTime.startedAt;
                    const durationMinutes = parseFloat((durationMs / 60000).toFixed(1));
                    extraUpdates['preparationTime/durationMinutes'] = durationMinutes;
                }
            }

            await OrderService.updateStatus(orderId, status, extraUpdates);
            toast.success(t('common.success_message'), { duration: 1000 });
        } catch (error) {
            toast.error(t('admin.update_failed'));
        } finally {
            setUpdating(false);
        }
    };

    if (viewMode !== "active" && currentStatus === "archived") {
        return (
            <button
                onClick={(e) => { e.stopPropagation(); handleUpdate("pending"); }}
                disabled={updating}
                className="flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95"
            >
                <FiRotateCw size={16} className={updating ? "animate-spin" : ""} />
                {t('admin.restore_order')}
            </button>
        );
    }

    if (!nextStatus || currentStatus === "delivered" || currentStatus === "cancelled") {
        return <StatusBadge status={currentStatus} t={t} />;
    }

    const c = config[currentStatus];

    return (
        <div className="flex items-center gap-4">
            {prevStatus && (
                <button
                    onClick={(e) => { e.stopPropagation(); handleUpdate(prevStatus); }}
                    disabled={updating}
                    title={t('admin.revert_status')}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-secondary hover:bg-secondary/5 rounded-xl transition-all"
                >
                    <FiRotateCw className="-scale-x-100" size={18} />
                </button>
            )}

            <StatusBadge status={currentStatus} t={t} />

            <FiArrowRight className="text-gray-300 shrink-0" size={18} />

            <button
                onClick={(e) => { e.stopPropagation(); handleUpdate(nextStatus); }}
                disabled={updating}
                className={`
                    flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all relative overflow-hidden group text-white shadow-lg
                    ${c.btnClass} hover:-translate-y-0.5 active:translate-y-0
                    ${updating ? 'opacity-70 cursor-not-allowed' : ''}
                `}
            >
                {updating && (
                    <motion.div
                        className="absolute inset-0 bg-white/20"
                        animate={{ opacity: [0, 0.4, 0] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                    />
                )}
                <span className="group-hover:rotate-12 transition-transform">{c.icon}</span>
                <span>{c.label}</span>
            </button>
        </div>
    );
}
