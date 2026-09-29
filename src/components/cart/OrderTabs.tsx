import { useState, useEffect } from "react";
import type { RefObject } from "react";
import { FaUtensils, FaMotorcycle } from "react-icons/fa";
import { FiUser, FiGrid, FiMapPin, FiPhone, FiMessageSquare } from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

interface OrderTabsProps {
    onConfirm: (
        type: "in" | "out",
        customerData: { name: string; table?: string; phone?: string; address?: string; notes?: string; },
        message: string
    ) => void;
    firstInputRef?: RefObject<HTMLInputElement | null>;
    disableSend?: boolean;
    orderSettings?: { inRestaurant: boolean; takeaway: boolean; inPhone: string; outPhone: string; };
    submitting?: boolean;
}

export default function OrderTabs({ onConfirm, firstInputRef, disableSend, orderSettings, submitting }: OrderTabsProps) {
    const { items, totalAmount } = useCart();
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    const [tab, setTab] = useState<"in" | "out">("out");

    useEffect(() => {
        if (!orderSettings) return;
        if (tab === "in" && !orderSettings.inRestaurant && orderSettings.takeaway) setTab("out");
        if (tab === "out" && !orderSettings.takeaway && orderSettings.inRestaurant) setTab("in");
    }, [orderSettings, tab]);

    const [form, setForm] = useState({ name: "", table: "", phone: "", address: "", notes: "" });
    const [error, setError] = useState<string | null>(null);

    const isCurrentTabActive = () => {
        if (!orderSettings) return true;
        return tab === "in" ? orderSettings.inRestaurant : orderSettings.takeaway;
    };

    const validateForm = () => {
        if (!isCurrentTabActive()) { setError(t('common.service_unavailable')); return false; }
        if (!form.name.trim()) { setError(t('common.name_required')); return false; }
        if (tab === "in" && !form.table.trim()) { setError(t('common.table_required')); return false; }
        if (tab === "out") {
            if (!form.phone.trim()) { setError(t('common.phone_required')); return false; }
            if (!/^\d{6,15}$/.test(form.phone)) { setError(t('common.invalid_phone')); return false; }
            if (!form.address.trim()) { setError(t('common.address_required')); return false; }
        }
        if (items.length === 0) { setError(t('common.empty_cart')); return false; }
        setError(null);
        return true;
    };

    const buildMessage = () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString(isRtl ? "ar-EG" : "en-US");
        const timeStr = now.toLocaleTimeString(isRtl ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" });
        const list = items.map(i => {
            const nm = isRtl ? (i as any).nameAr || i.name : (i as any).nameEn || i.name;
            return `🔹 ${i.qty} × ${nm} → ${i.selectedPrice * i.qty}₪`;
        }).join("\n");

        if (tab === "in") {
            return `✨ *${t('common.dine_in')}* ✨\n========================\n${list}\n========================\n💰 *${t('common.total')}:* ${totalAmount}₪\n========================\n\n👤 *${t('whatsapp.customer_name')}:* ${form.name}\n🍽️ *${t('whatsapp.table_number')}:* ${form.table}\n📝 *${t('whatsapp.notes')}:* ${form.notes || "—"}\n\n⏰ *${t('whatsapp.time')}:* ${timeStr}\n📅 *${t('whatsapp.date')}:* ${dateStr}\n\n💵 ${t('whatsapp.payment_cashier')}\n========================`;
        }
        return `✨ *${t('common.takeaway')}* ✨\n========================\n${list}\n========================\n\n💰 *${t('common.total')}:* ${totalAmount}₪\n👤 *${t('whatsapp.customer_name')}:* ${form.name}\n📱 *${t('whatsapp.phone_number')}:* ${form.phone}\n🏠 *${t('whatsapp.address')}:* ${form.address}\n📝 *${t('whatsapp.notes')}:* ${form.notes || "—"}\n\n⏰ *${t('whatsapp.time')}:* ${timeStr}\n📅 *${t('whatsapp.date')}:* ${dateStr}\n\n💵 ${t('whatsapp.payment_delivery')}\n========================`;
    };

    const submit = () => {
        if (!validateForm()) return;
        onConfirm(tab, { name: form.name, table: tab === "in" ? form.table : "", phone: tab === "out" ? form.phone : "", address: tab === "out" ? form.address : "", notes: form.notes }, buildMessage());
    };

    // Shared input style — matches admin dashboard inputs
    const inputCls = `w-full bg-white border border-gray-200 rounded-2xl py-2.5 px-3 h-10 text-[13px] font-bold text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary focus:ring-4 focus:ring-primary/8 transition-all shadow-sm`;
    const iconCls = `absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`;

    return (
        <div className="space-y-3">
            {/* Type Tabs Hidden - Always Takeaway */}
            <div className="hidden">
                {[
                    { id: "in" as const, icon: <FaUtensils size={14} />, label: t('common.dine_in'), enabled: orderSettings?.inRestaurant },
                    { id: "out" as const, icon: <FaMotorcycle size={14} />, label: t('common.takeaway'), enabled: orderSettings?.takeaway },
                ].map(({ id, icon, label, enabled }) => (
                    <button
                        key={id}
                        onClick={() => enabled && setTab(id)}
                        disabled={!enabled}
                        className={`
                            flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl font-black text-sm transition-all duration-300
                            ${tab === id ? "bg-primary text-white shadow-lg shadow-primary/25" : enabled ? "text-gray-400 hover:text-gray-600 hover:bg-gray-50" : "text-gray-200 cursor-not-allowed"}
                        `}
                    >
                        {icon}
                        {label}
                    </button>
                ))}
            </div>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="text-xs font-bold text-secondary bg-secondary-50 px-4 py-3 rounded-2xl text-center border border-secondary-100"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fields */}
            <div className="space-y-3">
                {/* Name */}
                <div className="relative">
                    <FiUser className={`${iconCls} ${isRtl ? 'right-4' : 'left-4'}`} size={16} />
                    <input
                        ref={firstInputRef}
                        placeholder={t('common.customer_name')}
                        className={inputCls + (isRtl ? ' pr-11 pl-5' : ' pl-11 pr-5')}
                        value={form.name}
                        onChange={e => { setError(null); setForm({ ...form, name: e.target.value }); }}
                    />
                </div>

                {tab === "in" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="relative">
                        <FiGrid className={`${iconCls} ${isRtl ? 'right-4' : 'left-4'}`} size={16} />
                        <input
                            placeholder={t('common.table_number')}
                            className={inputCls + (isRtl ? ' pr-11 pl-5' : ' pl-11 pr-5')}
                            value={form.table}
                            onChange={e => { setError(null); setForm({ ...form, table: e.target.value }); }}
                        />
                    </motion.div>
                )}

                {tab === "out" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
                        <div className="relative">
                            <FiPhone className={`${iconCls} ${isRtl ? 'right-4' : 'left-4'}`} size={16} />
                            <input
                                placeholder={t('common.phone_number')}
                                className={inputCls + (isRtl ? ' pr-11 pl-5' : ' pl-11 pr-5')}
                                value={form.phone}
                                onChange={e => { setError(null); setForm({ ...form, phone: e.target.value }); }}
                            />
                        </div>
                        <div className="relative">
                            <FiMapPin className={`${iconCls} ${isRtl ? 'right-4' : 'left-4'}`} size={16} />
                            <input
                                placeholder={t('common.address')}
                                className={inputCls + (isRtl ? ' pr-11 pl-5' : ' pl-11 pr-5')}
                                value={form.address}
                                onChange={e => { setError(null); setForm({ ...form, address: e.target.value }); }}
                            />
                        </div>
                    </motion.div>
                )}

                <div className="relative">
                    <FiMessageSquare className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-4 text-gray-400 pointer-events-none`} size={16} />
                    <textarea
                        placeholder={t('common.notes_optional')}
                        rows={2}
                        className={(inputCls as string).replace(' h-10', '') + " resize-none " + (isRtl ? 'pr-11 pl-5' : 'pl-11 pr-5')}
                        value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                    />
                </div>
            </div>

            {/* Submit */}
            <button
                onClick={submit}
                disabled={disableSend || submitting || !isCurrentTabActive()}
                className="w-full py-2.5 rounded-xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/25 hover:bg-primary-600 hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
            >
                {submitting ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : t('common.confirm_order')}
            </button>
        </div>
    );
}
