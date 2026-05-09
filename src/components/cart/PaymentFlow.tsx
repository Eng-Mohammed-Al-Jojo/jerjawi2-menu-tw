import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
    FiCheck, FiDollarSign, FiInfo, FiArrowRight, FiArrowLeft,
    FiUser, FiHash, FiMessageSquare, FiAlertTriangle,
    FiShoppingCart, FiClock, FiAlertCircle, FiChevronRight, FiCopy
} from "react-icons/fi";
import type { PaymentMethod, PaymentRecord } from "../../types/payment";
import { toast } from "react-hot-toast";

type Step = "SELECT" | "FORM" | "CONFIRM" | "RESULT";

interface PaymentFlowProps {
    methods: PaymentMethod[];
    totalAmount: number;
    items: any[];
    selectedMethod: PaymentMethod | null;
    onSelectMethod: (method: PaymentMethod | null) => void;
    paymentRecord: PaymentRecord | null;
    submitting: boolean;
    onSubmit: (formData: any, methodOverride?: PaymentMethod) => void;
    onResetRecord: () => void;
    onTrackOrder: () => void;
}

export default function PaymentFlow({
    methods, totalAmount, items, selectedMethod, onSelectMethod,
    paymentRecord, submitting, onSubmit, onResetRecord, onTrackOrder
}: PaymentFlowProps) {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === "ar";

    const [step, setStep] = useState<Step>(paymentRecord ? "RESULT" : "SELECT");
    const [formData, setFormData] = useState({
        senderAccountName: "",
        senderAccountNumber: "",
        senderBankOrWallet: "",
        notes: ""
    });

    const handleSelectMethod = (method: PaymentMethod) => {
        onSelectMethod(method);
        if (!method.showPaymentDetails) {
            // Immediate submission if payment details screen is disabled
            onSubmit({
                methodName: method.name || method.label,
                senderAccountName: null,
                senderAccountNumber: null,
                receiverAccountName: null,
                receiverAccountNumber: null,
                senderBankOrWallet: null,
                notes: "Direct Confirmation"
            }, method);
            return; // EXIT IMMEDIATELY - Bypass all steps
        } else {
            setStep("FORM");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success(t('common.copied_to_clipboard') || "تم النسخ بنجاح");
        });
    };

    const CopyButton = ({ text }: { text: string }) => (
        <button
            onClick={() => copyToClipboard(text)}
            className="w-8 h-8 rounded-lg bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center group/copy"
            title={t('common.copy')}
        >
            <FiCopy size={14} className="group-hover/copy:scale-110 transition-transform" />
        </button>
    );
    const handleBack = () => { if (step === "FORM") setStep("SELECT"); if (step === "CONFIRM") setStep("FORM"); };
    const handleNext = () => {
        if (step === "FORM" && formData.senderAccountName && formData.senderAccountNumber && formData.senderBankOrWallet) setStep("CONFIRM");
    };

    const currentStep = paymentRecord ? "RESULT" : step;
    const STEPS = ["SELECT", "FORM", "CONFIRM"];
    const stepIdx = STEPS.indexOf(currentStep);

    // Shared styles — match admin dashboard
    const inputCls = `w-full bg-white border border-gray-200 rounded-2xl py-3.5 px-5 text-sm font-bold text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary focus:ring-4 focus:ring-primary/8 transition-all shadow-sm`;
    const inputWithIcon = (rtl: boolean) => inputCls + (rtl ? ' pr-11 pl-5' : ' pl-11 pr-5');

    return (
        <div className="flex flex-col gap-5">

            {/* Step Indicators */}
            {currentStep !== "RESULT" && (
                <div className="flex items-center justify-center gap-2 py-1">
                    {STEPS.map((s, idx) => {
                        const isDone = idx < stepIdx;
                        const isActive = idx === stepIdx;
                        return (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300
                                    ${isDone ? 'bg-primary text-white' : isActive ? 'bg-primary/10 text-primary border-2 border-primary ring-4 ring-primary/10 scale-110' : 'bg-gray-100 text-gray-400'}
                                `}>
                                    {isDone ? <FiCheck size={13} /> : idx + 1}
                                </div>
                                {idx < STEPS.length - 1 && (
                                    <div className={`w-8 h-0.5 rounded-full transition-all duration-500 ${idx < stepIdx ? 'bg-primary' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <AnimatePresence mode="wait">

                {/* ── SELECT ── */}
                {currentStep === "SELECT" && (
                    <motion.div key="select" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                        <div className="text-center mb-4">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{t('common.payment_method')}</h3>
                            <p className="text-sm font-bold text-gray-400 mt-1">{t('common.payment_desc')}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {methods.map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => handleSelectMethod(method)}
                                    className="relative p-6 rounded-4xl border-2 border-gray-100 bg-white hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-4 group shadow-soft hover:shadow-premium active:scale-95"
                                >
                                    <div className="w-20 h-20 rounded-3xl overflow-hidden bg-white shadow-soft flex items-center justify-center border border-gray-50 shrink-0 group-hover:scale-105 transition-transform duration-500">
                                        {method.imageUrl ? (
                                            <img src={method.imageUrl} alt="" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <FiDollarSign size={28} className="text-primary" />
                                        )}
                                    </div>
                                    <span className="font-black text-base text-gray-700 group-hover:text-primary transition-colors text-center px-2">{method.name || method.label}</span>
                                    <div className="absolute top-4 right-4 w-7 h-7 rounded-full border-2 border-gray-100 group-hover:border-primary group-hover:bg-primary transition-all flex items-center justify-center">
                                        <FiChevronRight size={12} className="text-gray-200 group-hover:text-white" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── FORM ── */}
                {currentStep === "FORM" && selectedMethod && (
                    <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                        <div className="flex items-center gap-3">
                            <button onClick={handleBack} className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 text-gray-400 hover:text-primary hover:border-primary/30 flex items-center justify-center transition-all">
                                {isRtl ? <FiArrowRight size={16} /> : <FiArrowLeft size={16} />}
                            </button>
                            <div>
                                <h3 className="text-base font-black text-gray-900">{selectedMethod.name || selectedMethod.label}</h3>
                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{t('common.payment_step_form')}</p>
                            </div>
                        </div>

                        {/* Account Info Card */}
                        {selectedMethod.details && (
                            <div className="bg-primary/5 border border-primary/10 rounded-3xl p-5 space-y-4">
                                <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                                    <FiInfo size={14} />
                                    <span>{t('admin.account_details')}</span>
                                </div>
                                <div className="space-y-2">
                                    {selectedMethod.details.split('\n').filter(line => line.trim()).map((line, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-2xl group/line hover:border-primary/20 transition-all">
                                            <p className="text-sm font-black text-gray-700 select-all">{line.trim()}</p>
                                            <CopyButton text={line.trim()} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Warning */}
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                            <FiAlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-bold text-amber-700 leading-relaxed">{t('common.payment_external_warning')}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <FiUser className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRtl ? 'right-5' : 'left-5'}`} size={18} />
                                <input placeholder={t('common.account_name')} className={inputWithIcon(isRtl)} value={formData.senderAccountName} onChange={e => setFormData({ ...formData, senderAccountName: e.target.value })} />
                            </div>
                            <div className="relative">
                                <FiHash className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRtl ? 'right-5' : 'left-5'}`} size={18} />
                                <input placeholder={t('common.account_number')} className={inputWithIcon(isRtl)} value={formData.senderAccountNumber} onChange={e => setFormData({ ...formData, senderAccountNumber: e.target.value })} />
                            </div>
                            <div className="relative">
                                <FiCheck className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRtl ? 'right-5' : 'left-5'}`} size={18} />
                                <input placeholder={t('common.sender_bank_wallet') || "Sender Bank/Wallet"} className={inputWithIcon(isRtl)} value={formData.senderBankOrWallet} onChange={e => setFormData({ ...formData, senderBankOrWallet: e.target.value })} />
                            </div>
                            <div className="relative">
                                <FiMessageSquare className={`absolute ${isRtl ? 'right-5' : 'left-5'} top-5 text-gray-400`} size={18} />
                                <textarea placeholder={t('common.notes_optional')} rows={3} className={inputWithIcon(isRtl) + " resize-none pt-4"} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                            </div>
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={!formData.senderAccountName || !formData.senderAccountNumber || !formData.senderBankOrWallet}
                            className="w-full py-5 rounded-3xl bg-primary text-white font-black text-base shadow-xl shadow-primary/25 hover:bg-primary-600 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:hover:scale-100"
                        >
                            {t('common.complete_order')}
                        </button>
                    </motion.div>
                )}

                {/* ── CONFIRM ── */}
                {currentStep === "CONFIRM" && selectedMethod && (
                    <motion.div key="confirm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                        <div className="flex items-center gap-3">
                            <button onClick={handleBack} className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 text-gray-400 hover:text-primary hover:border-primary/30 flex items-center justify-center transition-all">
                                {isRtl ? <FiArrowRight size={16} /> : <FiArrowLeft size={16} />}
                            </button>
                            <div>
                                <h3 className="text-base font-black text-gray-900">{t('common.confirm_payment_details')}</h3>
                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{t('common.payment_step_confirm')}</p>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-3 shadow-sm">
                            <div className="flex items-center gap-2 text-gray-500 text-xs font-black uppercase tracking-widest">
                                <FiShoppingCart size={13} className="text-primary" />
                                {t('common.order_summary')}
                            </div>
                            <div className="space-y-2">
                                {items.slice(0, 3).map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-xs font-bold text-gray-500">
                                        <span>{item.qty}× {item.nameAr || item.name} ({item.selectedPriceType === "takeaway" ? "TW" : "DIN"})</span>
                                        <span className="text-gray-700">{item.selectedPrice * item.qty}₪</span>
                                    </div>
                                ))}
                                {items.length > 3 && <p className="text-[10px] text-gray-400 italic">+{items.length - 3} {t('common.more')}...</p>}
                            </div>
                            <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-xs font-black text-gray-500">{t('common.total')}</span>
                                <span className="text-2xl font-black text-primary">{totalAmount}₪</span>
                            </div>
                        </div>

                        {/* Method + Details */}
                        <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow flex items-center justify-center p-1.5">
                                    {selectedMethod.imageUrl ? (
                                        <img src={selectedMethod.imageUrl} alt="" className="w-full h-full object-contain" />
                                    ) : (
                                        <FiDollarSign className="text-primary" />
                                    )}
                                </div>
                                <span className="text-sm font-black text-gray-800">{selectedMethod.name || selectedMethod.label}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                                {[
                                    { label: t('common.account_name'), value: formData.senderAccountName },
                                    { label: t('common.account_number'), value: formData.senderAccountNumber },
                                    { label: t('common.sender_bank_wallet'), value: formData.senderBankOrWallet },
                                    ...(formData.notes ? [{ label: t('common.notes'), value: formData.notes }] : []),
                                ].map((row, idx) => (
                                    <div key={idx} className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">{row.label}</span>
                                        <span className="text-xs font-black text-gray-800">{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => onSubmit(formData)}
                            disabled={submitting}
                            className="w-full py-5 rounded-3xl bg-primary text-white font-black text-base shadow-xl shadow-primary/25 hover:bg-primary-600 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 flex items-center justify-center gap-3"
                        >
                            {submitting ? (
                                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            ) : (
                                <><FiCheck size={20} />{t('common.confirm_and_submit')}</>
                            )}
                        </button>
                    </motion.div>
                )}

                {/* ── RESULT ── */}
                {currentStep === "RESULT" && paymentRecord && (
                    <motion.div key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center text-center py-6 space-y-7">

                        {/* Status icon */}
                        <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-2xl border-4 ${paymentRecord.status === "pending"
                            ? "bg-amber-50 text-amber-500 border-amber-100 animate-pulse"
                            : paymentRecord.status === "approved"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-secondary-50 text-secondary border-secondary-100"
                            }`}>
                            {paymentRecord.status === "pending" ? <FiClock size={48} /> :
                                paymentRecord.status === "approved" ? <FiCheck size={48} strokeWidth={3} /> :
                                    <FiAlertCircle size={48} />}
                        </div>

                        <div>
                            <h4 className="text-2xl font-black text-gray-900">
                                {paymentRecord.status === "pending" ? t('common.under_review') :
                                    paymentRecord.status === "approved" ? t('common.payment_approved') : t('common.payment_rejected')}
                            </h4>
                            <p className="text-sm font-bold text-gray-400 max-w-xs mx-auto mt-2 leading-relaxed">
                                {paymentRecord.status === "pending" ? t('common.payment_pending') :
                                    paymentRecord.status === "approved" ? t('common.order_saved_success') : t('common.error')}
                            </p>
                        </div>

                        {paymentRecord.status === "rejected" && (
                            <button
                                onClick={onResetRecord}
                                className="px-10 py-3.5 rounded-2xl bg-primary text-white font-black text-sm shadow-lg shadow-primary/25 hover:scale-105 transition-all"
                            >
                                {t('common.edit')}
                            </button>
                        )}

                        <div className="w-full space-y-3">
                            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400">{t('common.order_id')}</span>
                                <span className="text-sm font-black text-primary font-mono">#{paymentRecord.orderId}</span>
                            </div>

                            {paymentRecord.status !== "pending" && (
                                <button
                                    onClick={onTrackOrder}
                                    className="w-full py-5 rounded-3xl bg-primary text-white font-black text-base shadow-xl shadow-primary/25 hover:bg-primary-600 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3"
                                >
                                    <FiShoppingCart size={20} />
                                    {t('common.track_order')}
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}
