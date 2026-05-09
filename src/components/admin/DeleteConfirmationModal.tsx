import { motion, AnimatePresence } from "framer-motion";
import { FiAlertTriangle, FiX, FiCheck } from "react-icons/fi";
import { useTranslation } from "react-i18next";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    details?: string;
}

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, title, details }: Props) {
    const { t } = useTranslation();

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
                        className="relative w-full max-w-md bg-white rounded-[3rem] border border-gray-100 shadow-premium overflow-hidden z-10 p-10 text-center"
                    >
                        {/* Warning Icon */}
                        <div className="w-24 h-24 bg-secondary/5 text-secondary rounded-4xl flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner border border-secondary/10">
                            <FiAlertTriangle />
                        </div>

                        {/* Text */}
                        <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
                            {title}
                        </h3>

                        {details && (
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-8 shadow-inner">
                                <span className="text-xs font-black text-primary tracking-[0.2em] uppercase">{details}</span>
                            </div>
                        )}

                        <div className="bg-secondary/5 p-5 rounded-2xl border border-secondary/10 mb-10">
                            <p className="text-[11px] font-black text-secondary uppercase tracking-widest leading-relaxed">
                                ⚠️ {t('common.confirm_delete_extra') || "هذا الإجراء لا يمكن التراجع عنه وسيتم حذفه من القاعدة نهائياً"}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className="w-full py-5 bg-secondary text-white rounded-2xl font-black text-sm hover:bg-secondary/90 shadow-xl shadow-secondary/20 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
                            >
                                <FiCheck size={20} />
                                {t('common.delete') || "تأكيد الحذف"}
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-5 bg-gray-50 text-gray-400 border border-gray-100 rounded-2xl font-black text-sm hover:bg-gray-100 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
                            >
                                <FiX size={20} />
                                {t('common.cancel') || "إلغاء"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
