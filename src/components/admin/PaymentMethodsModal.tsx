import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPlus, FiTrash2, FiSave, FiCheck, FiSettings, FiList, FiEdit3 } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { PaymentService } from "../../services/paymentService";
import type { PaymentMethod } from "../../types/payment";
import { toast } from "react-hot-toast";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const emptyMethod = (order: number): Partial<PaymentMethod> => ({
    name: "",
    fields: [],
    type: "bank",
    isEnabled: true,
    showPaymentDetails: true,
    imageUrl: "",
    order
});

const imageModules = import.meta.glob('/public/images/payment/*', { 
    eager: true, 
    query: '?url', 
    import: 'default' 
});
const galleryImages = Object.values(imageModules).map(url => (url as string).replace('/public', ''));

export default function PaymentMethodsModal({ isOpen, onClose }: Props) {
    const { t } = useTranslation();

    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [enabled, setEnabled] = useState(true);
    const [editingMethod, setEditingMethod] = useState<Partial<PaymentMethod> | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        const unsubscribe = PaymentService.listenToPaymentMethodsSettings((settings) => {
            setMethods(settings.methods);
            setEnabled(settings.enabled);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [isOpen]);

    const handleToggleEnabled = async () => {
        const next = !enabled;
        setEnabled(next);
        try {
            await PaymentService.setPaymentScreenEnabled(next);
        } catch {
            setEnabled(!next);
            toast.error(t('common.error'));
        }
    };

    const handleSave = async () => {
        if (!editingMethod || !editingMethod.label?.trim()) {
            toast.error(t('common.name_required'));
            return;
        }

        try {
            await PaymentService.savePaymentMethod({
                ...editingMethod,
                label: editingMethod.label.trim(),
                details: editingMethod.details?.trim() || "",
                isActive: editingMethod.isActive ?? true
            });
            toast.success(t('common.success_message'));
            setEditingMethod(null);
        } catch {
            toast.error(t('common.error'));
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(t('common.confirm_delete_extra'))) return;
        try {
            await PaymentService.deletePaymentMethod(id);
            toast.success(t('common.success_message'));
        } catch {
            toast.error(t('common.error'));
        }
    };

    const toggleEnabled = async (method: PaymentMethod) => {
        const next = !method.isEnabled;
        try {
            await PaymentService.updatePaymentMethodField(method.id, 'isEnabled', next);
            if (next) {
                toast.success(`تم تفعيل ${method.name || method.label}`);
            } else {
                toast.error(`تم تعطيل ${method.name || method.label} — لن تظهر للزبون`);
            }
        } catch {
            toast.error(t('common.error'));
        }
    };

    const toggleShowPaymentDetails = async (method: PaymentMethod) => {
        const next = !method.showPaymentDetails;
        try {
            await PaymentService.updatePaymentMethodField(method.id, 'showPaymentDetails', next);
            if (next) {
                toast.success(`${method.name || method.label}: سيعرض شاشة تفاصيل الدفع للزبون`, {
                    icon: '🔵',
                    style: { border: '1px solid #3b82f6', color: '#1e40af' }
                });
            } else {
                toast.success(`${method.name || method.label}: سيتخطى شاشة الدفع ويؤكد مباشرة`, {
                    icon: '⚪',
                    style: { border: '1px solid #94a3b8', color: '#475569' }
                });
            }
        } catch {
            toast.error(t('common.error'));
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={`relative w-full transition-all duration-500 bg-white rounded-[3rem] border border-gray-100 shadow-premium overflow-hidden z-10 flex flex-col max-h-[90vh] ${isGalleryOpen ? 'max-w-7xl' : 'max-w-5xl'}`}
                    >
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
                                    <FiSettings size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t('admin.manage_payment_methods')}</h2>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">{t('admin.payment_methods_config_desc')}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-all border border-gray-100 shadow-soft">
                                <FiX size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                            <motion.div
                                layout
                                className="mb-8 p-6 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-between gap-5"
                            >
                                <div>
                                    <h3 className="text-base font-black text-gray-900">{t('admin.enable_payment_screen')}</h3>
                                    <p className="text-xs font-bold text-gray-400 mt-1">{enabled ? t('admin.payment_screen_enabled') : t('admin.payment_screen_disabled')}</p>
                                </div>
                                <button
                                    onClick={handleToggleEnabled}
                                    className={`relative w-16 h-8 rounded-full transition-all duration-300 border ${enabled ? "bg-emerald-500 border-emerald-600" : "bg-gray-200 border-gray-300"}`}
                                >
                                    <motion.span animate={{ x: enabled ? 36 : 4 }} className="absolute top-1 left-0 w-6 h-6 rounded-full bg-white shadow-md" />
                                </button>
                            </motion.div>

                            <div className={`grid grid-cols-1 ${isGalleryOpen ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-10 transition-all duration-500`}>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                            <FiList size={18} /> {t('admin.payment_methods_title')}
                                        </h3>
                                        <button
                                            onClick={() => setEditingMethod(emptyMethod(methods.length + 1))}
                                            className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                                        >
                                            <FiPlus /> {t('admin.add_payment_method')}
                                        </button>
                                    </div>

                                    {loading ? (
                                        <div className="space-y-4">
                                            {[0, 1, 2].map((item) => (
                                                <div key={item} className="h-24 rounded-3xl bg-gray-50 border border-gray-100 animate-pulse" />
                                            ))}
                                        </div>
                                    ) : methods.length === 0 ? (
                                        <div className="py-24 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                                            <FiSettings className="mx-auto text-gray-200 mb-6" size={48} />
                                            <p className="text-gray-400 font-black text-sm uppercase tracking-widest">{t('admin.no_payment_methods')}</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {methods.map((method) => (
                                                <div
                                                    key={method.id}
                                                    onClick={() => setEditingMethod(method)}
                                                    className={`p-6 rounded-3xl border transition-all flex items-center justify-between cursor-pointer group ${editingMethod?.id === method.id ? 'bg-white border-primary shadow-premium' : 'bg-gray-50 border-gray-100 hover:bg-white hover:border-primary/20'} ${!method.isEnabled ? 'opacity-45' : ''}`}
                                                >
                                                    <div className="flex items-center gap-5 min-w-0">
                                                        <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-soft text-primary">
                                                            {method.imageUrl ? (
                                                                <img src={method.imageUrl} alt="" className="w-10 h-10 object-contain" />
                                                            ) : (
                                                                <FiEdit3 size={22} />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-black text-gray-900 text-lg leading-none truncate">{method.name || method.label}</p>
                                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                                {!method.isEnabled && (
                                                                    <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border bg-rose-50 text-rose-600 border-rose-100">
                                                                        معطّلة
                                                                    </span>
                                                                )}
                                                                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border ${method.showPaymentDetails ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                                    {method.showPaymentDetails ? "يعرض تفاصيل الدفع" : "يتخطى الدفع"}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{t(`admin.payment_type_${method.type}`)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex flex-col gap-2 items-end">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">تفاصيل الدفع</span>
                                                                <button
                                                                    onClick={() => toggleShowPaymentDetails(method)}
                                                                    className={`w-10 h-6 rounded-full transition-all relative border ${method.showPaymentDetails ? 'bg-emerald-500 border-emerald-600' : 'bg-gray-200 border-gray-300'}`}
                                                                >
                                                                    <motion.span animate={{ x: method.showPaymentDetails ? 20 : 4 }} className="absolute top-1 left-0 w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">مفعّلة</span>
                                                                <button
                                                                    onClick={() => toggleEnabled(method)}
                                                                    className={`w-10 h-6 rounded-full transition-all relative border ${method.isEnabled ? 'bg-emerald-500 border-emerald-600' : 'bg-gray-200 border-gray-300'}`}
                                                                >
                                                                    <motion.span animate={{ x: method.isEnabled ? 20 : 4 }} className="absolute top-1 left-0 w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDelete(method.id)}
                                                            className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-secondary/10 hover:text-secondary border border-gray-100 transition-all flex items-center justify-center shadow-sm"
                                                        >
                                                            <FiTrash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-50 p-6 md:p-10 rounded-[3rem] border border-gray-100 h-fit sticky top-0 shadow-inner">
                                    <AnimatePresence mode="wait">
                                        {editingMethod ? (
                                            <motion.div
                                                key="editor"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="space-y-8"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">
                                                        {editingMethod.id ? t('admin.edit_payment_method') : t('admin.add_payment_method')}
                                                    </h3>
                                                    <button onClick={() => setEditingMethod(null)} className="w-10 h-10 rounded-xl bg-white text-gray-400 hover:text-secondary hover:bg-secondary/10 border border-gray-100 transition-all flex items-center justify-center shadow-soft">
                                                        <FiX />
                                                    </button>
                                                </div>

                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] block mb-3 px-1">شعار وسيلة الدفع</label>
                                                        <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-3xl shadow-soft">
                                                            <div className="w-[52px] h-[52px] rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                                                {editingMethod.imageUrl ? (
                                                                    <img src={editingMethod.imageUrl} alt="" className="w-full h-full object-contain p-1" />
                                                                ) : (
                                                                    <div className="text-gray-300 text-[10px] font-black text-center uppercase leading-none">No<br />Img</div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-black text-gray-900 truncate mb-1">
                                                                    {editingMethod.imageUrl ? editingMethod.imageUrl.split('/').pop() : "لم يتم اختيار صورة"}
                                                                </p>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => setIsGalleryOpen(!isGalleryOpen)}
                                                                        className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                                                    >
                                                                        {isGalleryOpen ? "إغلاق الجاليري" : "اختيار من الجاليري"}
                                                                    </button>
                                                                    {editingMethod.imageUrl && (
                                                                        <button
                                                                            onClick={() => setEditingMethod({ ...editingMethod, imageUrl: "" })}
                                                                            className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors"
                                                                        >
                                                                            <FiX size={12} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] block mb-3 px-1">{t('admin.method_label')}</label>
                                                        <input
                                                            value={editingMethod.name || editingMethod.label || ""}
                                                            onChange={(e) => setEditingMethod({ ...editingMethod, name: e.target.value })}
                                                            className="w-full bg-white border border-gray-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-soft"
                                                            placeholder={t('admin.method_label')}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] block mb-3 px-1">{t('admin.payment_type')}</label>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {(["cash", "bank", "wallet"] as const).map((type) => (
                                                                <button
                                                                    key={type}
                                                                    onClick={() => setEditingMethod({ ...editingMethod, type })}
                                                                    className={`py-4 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest ${editingMethod.type === type ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white text-gray-400 border-gray-100 hover:border-primary/30'}`}
                                                                >
                                                                    {t(`admin.payment_type_${type}`)}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] block mb-3 px-1">{t('admin.method_details')}</label>
                                                        <textarea
                                                            rows={5}
                                                            value={editingMethod.details || ""}
                                                            onChange={(e) => setEditingMethod({ ...editingMethod, details: e.target.value })}
                                                            className="w-full bg-white border border-gray-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-soft resize-none"
                                                            placeholder={t('admin.method_details_placeholder')}
                                                        />
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <button
                                                            onClick={() => setEditingMethod({ ...editingMethod, isEnabled: !editingMethod.isEnabled })}
                                                            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${editingMethod.isEnabled ? 'bg-emerald-500 text-white border border-emerald-600' : 'bg-white text-secondary border border-gray-100'}`}
                                                        >
                                                            {editingMethod.isEnabled ? <FiCheck /> : <FiX />}
                                                            {t('admin.active_status')}
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingMethod({ ...editingMethod, showPaymentDetails: !editingMethod.showPaymentDetails })}
                                                            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${editingMethod.showPaymentDetails ? 'bg-blue-500 text-white border border-blue-600' : 'bg-white text-blue-600 border border-gray-100'}`}
                                                        >
                                                            {editingMethod.showPaymentDetails ? <FiCheck /> : <FiX />}
                                                            تفاصيل الدفع
                                                        </button>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={handleSave}
                                                    className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest"
                                                >
                                                    <FiSave size={20} /> {t('common.save')}
                                                </button>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="empty"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="h-[420px] flex flex-col items-center justify-center text-center p-10 space-y-6"
                                            >
                                                <div className="w-24 h-24 rounded-4xl bg-white shadow-soft flex items-center justify-center text-primary/10 border border-gray-50">
                                                    <FiSettings size={48} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-gray-900 text-lg mb-2">{t('admin.payment_editor_title')}</h4>
                                                    <p className="text-xs text-gray-400 font-bold max-w-[240px] leading-relaxed uppercase tracking-widest">{t('admin.payment_editor_desc')}</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <AnimatePresence>
                                    {isGalleryOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="bg-white p-6 rounded-[3rem] border border-gray-100 shadow-premium flex flex-col h-full overflow-hidden"
                                        >
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">معرض الصور</h3>
                                                <button onClick={() => setIsGalleryOpen(false)} className="text-gray-400 hover:text-rose-500 transition-colors">
                                                    <FiX size={20} />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-4 gap-3 overflow-y-auto custom-scrollbar p-1">
                                                {galleryImages.map((url, i) => {
                                                    const filename = url.split('/').pop() || "";
                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={() => {
                                                                setEditingMethod({ ...editingMethod, imageUrl: url });
                                                                // Don't close on mobile? User said "closes the gallery"
                                                                setIsGalleryOpen(false);
                                                            }}
                                                            className={`flex flex-col items-center gap-2 p-2 rounded-2xl border transition-all hover:bg-primary/5 ${editingMethod?.imageUrl === url ? 'bg-primary/10 border-primary ring-2 ring-primary/10' : 'bg-gray-50 border-gray-100'}`}
                                                        >
                                                            <div className="w-full aspect-square bg-white rounded-xl overflow-hidden flex items-center justify-center p-1 shadow-soft">
                                                                <img src={url} alt="" className="w-full h-full object-contain" />
                                                            </div>
                                                            <span className="text-[8px] font-black text-gray-500 uppercase truncate w-full text-center">{filename}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
