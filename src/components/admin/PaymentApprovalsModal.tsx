import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCheck, FiXCircle, FiClock, FiDollarSign, FiUser, FiInfo } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import type { PaymentRecord } from "../../types/payment";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    payments: PaymentRecord[];
    onApprove: (payment: PaymentRecord) => void;
    onReject: (payment: PaymentRecord) => void;
}

export default function PaymentApprovalsModal({ isOpen, onClose, payments, onApprove, onReject }: Props) {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    const pendingPayments = payments.filter(p => p.status === "pending");
    const historyPayments = payments.filter(p => p.status !== "pending").slice(0, 20);

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
                        className="relative w-full max-w-4xl bg-white rounded-[3rem] border border-gray-100 shadow-premium overflow-hidden z-10 flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20">
                                    <FiDollarSign size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t('admin.payment_approvals')}</h2>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">{t('admin.payment_editor_desc')}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-all border border-gray-100 shadow-soft">
                                <FiX size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-12">

                            {/* Pending Section */}
                            <section className="space-y-6">
                                <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <FiClock size={18} /> {t('admin.pending_approvals')}
                                </h3>

                                {pendingPayments.length === 0 ? (
                                    <div className="py-16 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                                        <p className="text-gray-400 font-bold text-sm">{t('admin.no_pending_payments')}</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6">
                                        {pendingPayments.map((payment) => (
                                            <div key={payment.id} className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-soft hover:shadow-premium transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                                                <div className="flex items-start gap-6">
                                                    <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl shrink-0">
                                                        <FiDollarSign />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-black text-gray-900">طلب {payment.orderId}</span>
                                                            <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-1 rounded-lg uppercase">{payment.methodName}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-gray-500">
                                                            <FiUser size={14} />
                                                            <p className="text-sm font-bold">{payment.senderAccountName || payment.customerName}</p>
                                                        </div>
                                                        <p className="text-xs text-gray-400 font-medium">{payment.senderAccountNumber || "-"}</p>
                                                        {payment.senderBankOrWallet && (
                                                            <p className="text-[10px] text-primary font-bold">{payment.senderBankOrWallet}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                                                    <div className="text-right">
                                                        <p className="text-2xl font-black text-primary">{payment.amount}₪</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                            {new Date(payment.createdAt).toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => onReject(payment)}
                                                            className="w-12 h-12 rounded-2xl bg-secondary/5 text-secondary hover:bg-secondary hover:text-white transition-all flex items-center justify-center border border-secondary/10"
                                                            title={t('common.cancel')}
                                                        >
                                                            <FiXCircle size={22} />
                                                        </button>
                                                        <button
                                                            onClick={() => onApprove(payment)}
                                                            className="h-12 px-4 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 font-black text-sm"
                                                            title={t('admin.confirm_payment')}
                                                        >
                                                            <FiCheck size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* History Section */}
                            {historyPayments.length > 0 && (
                                <section className="space-y-6">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <FiInfo size={18} /> {t('admin.payment_history')}
                                    </h3>
                                    <div className="bg-gray-50 rounded-[2.5rem] overflow-hidden border border-gray-100">
                                        <table className="w-full text-right border-collapse">
                                            <thead>
                                                <tr className="bg-gray-100/50">
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.order_id')}</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.customer')}</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.method')}</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('common.total')}</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.status')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {historyPayments.map((p) => (
                                                    <tr key={p.id} className="hover:bg-white transition-colors">
                                                        <td className="px-6 py-4 text-xs font-black text-gray-900">{p.orderId}</td>
                                                        <td className="px-6 py-4 text-xs font-bold text-gray-600">{p.senderAccountName || p.customerName}</td>
                                                        <td className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">{p.methodName}</td>
                                                        <td className="px-6 py-4 text-xs font-black text-primary">{p.amount}₪</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${p.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-secondary/5 text-secondary border-secondary/10'}`}>
                                                                {p.status === 'approved' ? t('admin.approved') : t('admin.rejected')}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
