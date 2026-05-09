import { useState, useEffect } from "react";
import { ref, update } from "firebase/database";
import { db } from "../../firebase";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCheck, FiSettings, FiInfo, FiSmartphone, FiLayout, FiTruck, FiCoffee } from "react-icons/fi";
import { FaWhatsapp, FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import { useTranslation } from "react-i18next";

/* ================= Toast ================= */
function Toast({ type, message }: { type: "success" | "error"; message: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 30, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={`fixed top-0 left-1/2 z-200 px-10 py-5 rounded-full shadow-premium text-white font-black flex items-center gap-4 backdrop-blur-xl border border-white/20 transition-all ${type === "success" ? "bg-emerald-500/95" : "bg-secondary/95"}`}
        >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">
                {type === "success" ? <FiCheck /> : "×"}
            </div>
            <span className="text-sm tracking-wide">{message}</span>
        </motion.div>
    );
}

/* ================= Simple Components ================= */
const inputClass = "w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-gray-300";

function ServiceCheckbox({ title, enabled, onToggle, value, setValue, disabled, icon: Icon, required, isWaMode }: any) {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    const showPhoneInput = isWaMode && enabled;

    return (
        <motion.div
            whileHover={!disabled ? { y: -4, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" } : {}}
            className={`relative p-8 rounded-4xl border transition-all duration-500 group overflow-hidden ${enabled
                ? "bg-white border-primary/20 shadow-premium"
                : "bg-gray-50 border-gray-100 opacity-70 hover:opacity-100"
                } ${disabled ? "opacity-40 grayscale pointer-events-none" : ""}`}
        >
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 ${enabled
                        ? "bg-primary text-white shadow-xl shadow-primary/20"
                        : "bg-white text-gray-400 border border-gray-100"
                        }`}>
                        <Icon />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-base text-gray-900 tracking-tight">{title}</span>
                        {required && enabled && !value.trim() && (
                            <motion.span
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="text-[9px] font-black text-secondary uppercase tracking-widest mt-1 bg-secondary/5 px-2 py-0.5 rounded-md w-fit border border-secondary/10"
                            >
                                {t('admin.required') || "مطلوب"}
                            </motion.span>
                        )}
                        {!isWaMode && enabled && (
                            <span className="text-[10px] text-primary/60 font-black uppercase tracking-widest mt-1">
                                {t('admin.dashboard_managed') || "تدار عبر اللوحة"}
                            </span>
                        )}
                    </div>
                </div>

                <button
                    onClick={onToggle}
                    disabled={disabled}
                    className={`relative w-14 h-7 rounded-full transition-all duration-500 border ${enabled ? "bg-emerald-500 border-emerald-600" : "bg-gray-200 border-gray-300"
                        }`}
                >
                    <motion.span
                        animate={{ x: enabled ? (isRtl ? 4 : 32) : (isRtl ? 32 : 4) }}
                        className="absolute top-1 left-0 w-5 h-5 rounded-full bg-white shadow-md z-10"
                    />
                </button>
            </div>

            <AnimatePresence>
                {showPhoneInput && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        className="overflow-hidden relative z-10"
                    >
                        <div className="relative">
                            <div className={`absolute ${isRtl ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100`}>
                                <FaWhatsapp size={16} />
                            </div>
                            <input
                                type="tel"
                                value={value}
                                onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
                                placeholder={t('admin.whatsapp_placeholder')}
                                className={`${inputClass} ${isRtl ? 'pr-16 pl-6' : 'pl-16 pr-6'} ${required && !value.trim() ? 'border-secondary/30 bg-secondary/5' : ''}`}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ================= Modal ================= */
export default function OrderSettingsModal({ setShowOrderSettings, orderSettings: initialSettings, onSave }: any) {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [orderSystem, setOrderSystem] = useState(true);
    const [inRestaurant, setInRestaurant] = useState(false);
    const [takeaway, setTakeaway] = useState(false);
    const [orderMode, setOrderMode] = useState<"dashboard" | "whatsapp">("dashboard");
    const [inPhone, setInPhone] = useState("");
    const [outPhone, setOutPhone] = useState("");
    const [complaintsWhatsapp, setComplaintsWhatsapp] = useState("");
    const [footer, setFooter] = useState({ address: "", phone: "", whatsapp: "", facebook: "", instagram: "", tiktok: "" });
    const [dineInEnabled, setDineInEnabled] = useState(true);
    const [takeawayEnabled, setTakeawayEnabled] = useState(true);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<any>(null);

    useEffect(() => {
        if (!initialSettings) return;
        setOrderSystem(initialSettings.orderSystem ?? true);
        const s = initialSettings.orderSettings ?? {};
        setInRestaurant(!!s.inRestaurant);
        setTakeaway(!!s.takeaway);
        setOrderMode(initialSettings.orderMode || "dashboard");
        setInPhone(s.inPhone || "");
        setOutPhone(s.outPhone || "");
        setComplaintsWhatsapp(initialSettings.complaintsWhatsapp || "");
        setFooter(initialSettings.footerInfo || {});
        
        const modes = initialSettings.orderModes || { dineInEnabled: true, takeawayEnabled: true };
        setDineInEnabled(!!modes.dineInEnabled);
        setTakeawayEnabled(!!modes.takeawayEnabled);
        
        setLoading(false);
    }, [initialSettings]);

    if (loading) return null;

    const handleSave = async () => {
        if (orderMode === "whatsapp") {
            const enabledAnyService = inRestaurant || takeaway;
            if (!enabledAnyService) {
                setToast({ type: "error", message: t('admin.no_service_enabled') || "يجب تفعيل خدمة واحدة على الأقل" });
                setTimeout(() => setToast(null), 3000);
                return;
            }

            if ((inRestaurant && inPhone.trim() === "") || (takeaway && outPhone.trim() === "")) {
                setToast({ type: "error", message: t('admin.whatsapp_required') });
                setTimeout(() => setToast(null), 3000);
                return;
            }
        }

        const newSettings = {
            orderSystem,
            orderMode,
            orderSettings: {
                inRestaurant,
                takeaway,
                inPhone,
                outPhone
            },
            complaintsWhatsapp,
            footerInfo: footer,
            orderModes: {
                dineInEnabled,
                takeawayEnabled
            }
        };

        try {
            setSaving(true);
            await update(ref(db, "settings"), newSettings);
            onSave?.(newSettings);
            setToast({ type: "success", message: t('admin.settings_saved_success') });
            setTimeout(() => setShowOrderSettings(false), 1500);
        } catch (error) {
            setToast({ type: "error", message: t('admin.settings_save_error') });
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowOrderSettings(false)} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-2xl rounded-[3rem] border border-gray-100 shadow-premium flex flex-col max-h-[90vh] overflow-hidden z-10"
            >
                {/* Header */}
                <div className="p-10 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-primary text-white flex items-center justify-center text-3xl shadow-xl shadow-primary/20">
                            <FiSettings />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t('admin.system_settings')}</h2>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">{t('admin.system_config_desc')}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowOrderSettings(false)}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-all border border-gray-100 shadow-soft"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                    {/* Order Module Toggle */}
                    <div className="p-8 rounded-4xl bg-primary/5 border border-primary/10 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${orderSystem ? "bg-primary text-white" : "bg-white text-gray-300"}`}>
                                <FiSmartphone />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-base text-gray-900 leading-none">{t('admin.enable_web_ordering')}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{orderSystem ? "النظام مفعل حالياً" : "النظام معطل"}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setOrderSystem((p) => !p)}
                            className={`relative w-16 h-8 rounded-full transition-all duration-300 border ${orderSystem ? "bg-emerald-500 border-emerald-600" : "bg-gray-200 border-gray-300"}`}
                        >
                            <motion.span animate={{ x: orderSystem ? (isRtl ? 4 : 36) : (isRtl ? 36 : 4) }} className="absolute top-1 left-0 w-6 h-6 rounded-full bg-white shadow-md" />
                        </button>
                    </div>

                    {/* ✅ Dual Pricing / Order Modes Config */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 px-2">{t('admin.dual_pricing_modes') || "أوضاع الطلب والأسعار"}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Dine-In Mode Hidden */}
                            <div className="hidden">
                                <div className={`p-6 rounded-3xl border transition-all ${dineInEnabled ? "bg-white border-primary/20 shadow-sm" : "bg-gray-50 border-gray-100 opacity-60"}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dineInEnabled ? "bg-primary/10 text-primary" : "bg-gray-200 text-gray-400"}`}>
                                                <FiCoffee />
                                            </div>
                                            <span className="font-bold text-sm text-gray-900">{t('admin.dine_in_mode') || "وضع داخل المطعم"}</span>
                                        </div>
                                        <button
                                            onClick={() => setDineInEnabled(!dineInEnabled)}
                                            className={`relative w-12 h-6 rounded-full transition-all border ${dineInEnabled ? "bg-emerald-500 border-emerald-600" : "bg-gray-200 border-gray-300"}`}
                                        >
                                            <motion.span animate={{ x: dineInEnabled ? (isRtl ? 4 : 28) : (isRtl ? 28 : 4) }} className="absolute top-0.5 left-0 w-4.5 h-4.5 rounded-full bg-white shadow-sm" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                                        {t('admin.dine_in_mode_desc') || "تفعيل هذا الوضع يظهر أسعار الصالة ويسمح بالطلب المباشر."}
                                    </p>
                                </div>
                            </div>

                            <div className={`p-6 rounded-3xl border transition-all ${takeawayEnabled ? "bg-white border-primary/20 shadow-sm" : "bg-gray-50 border-gray-100 opacity-60"}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${takeawayEnabled ? "bg-primary/10 text-primary" : "bg-gray-200 text-gray-400"}`}>
                                            <FiTruck />
                                        </div>
                                        <span className="font-bold text-sm text-gray-900">{t('admin.takeaway_mode') || "وضع التيك أوي"}</span>
                                    </div>
                                    <button
                                        onClick={() => setTakeawayEnabled(!takeawayEnabled)}
                                        className={`relative w-12 h-6 rounded-full transition-all border ${takeawayEnabled ? "bg-emerald-500 border-emerald-600" : "bg-gray-200 border-gray-300"}`}
                                    >
                                        <motion.span animate={{ x: takeawayEnabled ? (isRtl ? 4 : 28) : (isRtl ? 28 : 4) }} className="absolute top-0.5 left-0 w-4.5 h-4.5 rounded-full bg-white shadow-sm" />
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                                    {t('admin.takeaway_mode_desc') || "تفعيل هذا الوضع يظهر أسعار السفري ويسمح بالطلب الخارجي."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Order Mode Switch */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 px-2">{t('admin.order_source_mode') || "وضع استقبال الطلبات"}</h3>
                        <div className="relative grid grid-cols-2 p-2 bg-gray-100 rounded-3xl overflow-hidden border border-gray-100">
                            <motion.div
                                className="absolute top-2 bottom-2 w-[calc(50%-8px)] bg-white rounded-2xl shadow-premium"
                                animate={{
                                    left: orderMode === "dashboard"
                                        ? (isRtl ? "calc(50% + 4px)" : "8px")
                                        : (isRtl ? "8px" : "calc(50% + 4px)")
                                }}
                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            />
                            <button
                                onClick={() => setOrderMode("dashboard")}
                                className={`relative z-10 py-4 text-xs font-black tracking-widest transition-all duration-300
                                ${orderMode === "dashboard" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}
                            >
                                {t('admin.mode_dashboard')}
                            </button>
                            <button
                                onClick={() => setOrderMode("whatsapp")}
                                className={`relative z-10 py-4 text-xs font-black tracking-widest transition-all duration-300
                                ${orderMode === "whatsapp" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}
                            >
                                {t('admin.mode_whatsapp')}
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={orderMode}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                        >
                            <div className="hidden">
                                <ServiceCheckbox
                                    title={t('admin.local_ordering')}
                                    icon={FiCoffee}
                                    enabled={inRestaurant}
                                    onToggle={() => setInRestaurant((p) => !p)}
                                    value={inPhone}
                                    setValue={setInPhone}
                                    disabled={!orderSystem}
                                    required={orderMode === "whatsapp"}
                                    isWaMode={orderMode === "whatsapp"}
                                />
                            </div>
                            <ServiceCheckbox
                                title={t('admin.takeaway_delivery')}
                                icon={FiTruck}
                                enabled={takeaway}
                                onToggle={() => setTakeaway((p) => !p)}
                                value={outPhone}
                                setValue={setOutPhone}
                                disabled={!orderSystem}
                                required={orderMode === "whatsapp"}
                                isWaMode={orderMode === "whatsapp"}
                            />
                        </motion.div>
                    </AnimatePresence>

                    {/* Complaints */}
                    <div className="p-8 rounded-4xl bg-secondary/5 border border-secondary/10 space-y-6 relative group overflow-hidden">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-secondary text-white flex items-center justify-center shadow-xl shadow-secondary/20">
                                <FiInfo size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-base text-gray-900 tracking-tight">{t('admin.complaints_whatsapp')}</h3>
                                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">{t('admin.feedback_channel') || "قناة التواصل للشكاوى والملاحظات"}</p>
                            </div>
                        </div>
                        <div className="relative">
                            <FaWhatsapp className={`absolute ${isRtl ? 'right-6' : 'left-6'} top-1/2 -translate-y-1/2 text-secondary z-10`} />
                            <input
                                value={complaintsWhatsapp}
                                onChange={(e) => setComplaintsWhatsapp(e.target.value.replace(/\D/g, ""))}
                                placeholder={t('admin.whatsapp_placeholder')}
                                className={`${inputClass} ${isRtl ? 'pr-16 pl-6' : 'pl-16 pr-6'}`}
                            />
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="p-10 rounded-[2.5rem] bg-gray-50 border border-gray-100 space-y-8 shadow-inner">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-white text-primary flex items-center justify-center border border-gray-100 shadow-soft">
                                <FiLayout size={24} />
                            </div>
                            <h3 className="font-black text-base text-gray-900 tracking-tight">{t('admin.footer_info')}</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="relative group">
                                <FiLayout className={`absolute ${isRtl ? 'right-6' : 'left-6'} top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-primary`} />
                                <input placeholder={t('admin.address_detail')} value={footer.address} onChange={(e) => setFooter({ ...footer, address: e.target.value })} className={`${inputClass} ${isRtl ? 'pr-16' : 'pl-16'} bg-white! shadow-soft`} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="relative group">
                                    <FiSmartphone className={`absolute ${isRtl ? 'right-6' : 'left-6'} top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-primary`} />
                                    <input placeholder={t('admin.primary_phone')} value={footer.phone} onChange={(e) => setFooter({ ...footer, phone: e.target.value })} className={`${inputClass} ${isRtl ? 'pr-16' : 'pl-16'} bg-white! shadow-soft`} />
                                </div>
                                <div className="relative group">
                                    <FaWhatsapp className={`absolute ${isRtl ? 'right-6' : 'left-6'} top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-emerald-500`} />
                                    <input placeholder={t('admin.contact_whatsapp')} value={footer.whatsapp} onChange={(e) => setFooter({ ...footer, whatsapp: e.target.value })} className={`${inputClass} ${isRtl ? 'pr-16' : 'pl-16'} bg-white! shadow-soft`} />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                <div className="relative group">
                                    <FaFacebook className={`absolute ${isRtl ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-blue-600`} />
                                    <input placeholder="FB" value={footer.facebook} onChange={(e) => setFooter({ ...footer, facebook: e.target.value })} className={`${inputClass} ${isRtl ? 'pr-14 pl-2' : 'pl-14 pr-2'} bg-white! shadow-soft text-xs`} />
                                </div>
                                <div className="relative group">
                                    <FaInstagram className={`absolute ${isRtl ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-pink-500`} />
                                    <input placeholder="IG" value={footer.instagram} onChange={(e) => setFooter({ ...footer, instagram: e.target.value })} className={`${inputClass} ${isRtl ? 'pr-14 pl-2' : 'pl-14 pr-2'} bg-white! shadow-soft text-xs`} />
                                </div>
                                <div className="relative group">
                                    <FaTiktok className={`absolute ${isRtl ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-black`} />
                                    <input placeholder="TT" value={footer.tiktok} onChange={(e) => setFooter({ ...footer, tiktok: e.target.value })} className={`${inputClass} ${isRtl ? 'pr-14 pl-2' : 'pl-14 pr-2'} bg-white! shadow-soft text-xs`} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Save */}
                <div className="p-10 border-t border-gray-100 bg-gray-50/50">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        disabled={saving}
                        className={`w-full py-6 rounded-4xl font-black text-white shadow-xl flex items-center justify-center gap-4 transition-all relative overflow-hidden group ${saving
                            ? "bg-emerald-500/50 cursor-not-allowed"
                            : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30"
                            }`}
                    >
                        {saving ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                            />
                        ) : (
                            <FiCheck size={24} />
                        )}
                        <span className="text-base uppercase tracking-widest">{t('admin.save_changes')}</span>
                    </motion.button>
                </div>

                <AnimatePresence>
                    {toast && (
                        <Toast type={toast.type} message={toast.message} />
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
