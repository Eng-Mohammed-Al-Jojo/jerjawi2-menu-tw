import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiCopy, FiCreditCard } from "react-icons/fi";
import { usePaymentMethods } from "../../hooks/usePaymentMethods";

export default function PaymentMethodsDisplay() {
    const { t } = useTranslation();
    const { methods, loading } = usePaymentMethods();
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const activeMethods = useMemo(() => {
        return methods
            .filter((method) => method.isActive)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [methods]);

    const handleCopy = async (methodId: string, value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopiedId(methodId);
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            setCopiedId(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[0, 1].map((item) => (
                    <div key={item} className="bg-(--bg-card) p-4 rounded-2xl border border-(--border-color) animate-pulse">
                        <div className="h-12 bg-(--bg-main) rounded-xl" />
                    </div>
                ))}
            </div>
        );
    }

    if (activeMethods.length === 0) {
        return (
            <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-(--bg-main) flex items-center justify-center mx-auto mb-3 text-(--text-muted)">
                    <FiCreditCard size={20} />
                </div>
                <p className="text-xs font-bold text-(--text-muted)">{t('admin.no_payment_methods')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {activeMethods.map((method) => {
                const copied = copiedId === method.id;
                return (
                    <div
                        key={method.id}
                        className="bg-(--bg-card) rounded-2xl border border-(--border-color) overflow-hidden shadow-sm"
                    >
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-(--border-color) bg-(--bg-main)/40">
                            <div className="w-9 h-9 rounded-xl bg-white border border-(--border-color) flex items-center justify-center overflow-hidden shrink-0 shadow-sm text-primary">
                                <FiCreditCard size={16} />
                            </div>
                            <span className="font-black text-(--text-main) text-sm">{method.label}</span>
                            <div className="ms-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-[10px] font-black text-green-600 dark:text-green-400">{t(`admin.payment_type_${method.type}`)}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-4 py-3 gap-3 group hover:bg-(--bg-main)/30 transition-colors">
                            <span className="text-xs font-black text-(--text-main) whitespace-pre-wrap wrap-break-word">{method.details}</span>
                            <button
                                type="button"
                                onClick={() => handleCopy(method.id, method.details || "")}
                                disabled={!method.details}
                                className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${copied ? "bg-green-500 text-white" : "bg-(--bg-main) text-(--text-muted) hover:bg-primary hover:text-white"}`}
                                aria-label={t('common.copy')}
                            >
                                <FiCopy size={12} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
