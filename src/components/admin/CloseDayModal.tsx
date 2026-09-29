import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiAlertTriangle, FiX, FiCheck, FiDownload, FiTrash2 } from "react-icons/fi";
import { useTranslation } from "react-i18next";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

export default function CloseDayModal({ isOpen, onClose, onConfirm }: Props) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error("Failed to close day:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-1000 flex items-center justify-center p-6">
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!loading ? onClose : undefined}
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-[22rem] sm:max-w-sm bg-white rounded-2xl border border-gray-100 shadow-premium overflow-hidden z-10 p-4 sm:p-5 text-center"
                    >
                        {/* Header Icon */}
                        <div className="w-9 h-9 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl shadow-inner border border-red-100">
                            <FiAlertTriangle />
                        </div>

                        {/* Title & Message */}
                        <h3 className="text-xl font-extrabold text-gray-900 mb-4 tracking-tight">
                            تأكيد الإغلاق اليومي
                        </h3>
                        <p className="text-gray-500 font-medium mb-4 leading-relaxed text-sm">
                            سيتم إغلاق اليوم الحالي، ترحيل جميع الطلبات إلى ملف Excel، وحذفها من لوحة التحكم. لا يمكن التراجع عن هذه العملية.
                        </p>

                        {/* Checklist Section */}
                        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-3 mb-4 text-right space-y-4 shadow-inner">
                            <div className="flex items-center gap-4 text-emerald-600">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                    <FiCheck size={14} />
                                </div>
                                <span className="text-xs font-bold">سيتم إنشاء ملف Excel يحتوي على جميع طلبات اليوم</span>
                            </div>
                            <div className="flex items-center gap-4 text-emerald-600">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                    <FiCheck size={14} />
                                </div>
                                <span className="text-xs font-bold">سيتم حذف الطلبات من النظام بعد التصدير</span>
                            </div>
                            <div className="flex items-center gap-4 text-amber-600">
                                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                    <FiAlertTriangle size={14} />
                                </div>
                                <span className="text-xs font-bold">تأكد من مراجعة الطلبات قبل المتابعة</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 py-2.5 bg-gray-50 text-gray-400 border border-gray-100 rounded-2xl font-black text-sm hover:bg-gray-100 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-50"
                            >
                                <FiX size={20} />
                                {t('common.cancel') || "إلغاء"}
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className="flex-[1.5] py-2.5 bg-red-600 text-white rounded-2xl font-black text-sm hover:bg-red-700 shadow-xl shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-50"
                            >
                                {loading ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    >
                                        <FiTrash2 size={20} />
                                    </motion.div>
                                ) : (
                                    <FiDownload size={20} />
                                )}
                                {loading ? "جاري الإغلاق..." : "تأكيد الإغلاق"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
