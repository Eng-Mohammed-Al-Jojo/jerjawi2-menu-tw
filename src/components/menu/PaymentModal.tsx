import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, X, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PaymentMethod } from "../../types/payment";
import { useState } from "react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  methods: PaymentMethod[];
  loading: boolean;
}

export default function PaymentModal({ isOpen, onClose, methods, loading }: PaymentModalProps) {
  const { t } = useTranslation();
  const [copiedMethodId, setCopiedMethodId] = useState<string | null>(null);


  const activePaymentMethods = methods.filter((method) => method.isEnabled);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 backdrop-blur-sm bg-black/40"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-xl rounded-4xl bg-(--menu-bg) border border-(--menu-border) shadow-premium p-6 md:p-8 overflow-hidden"
            dir="rtl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-(--menu-border) pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/15">
                  <Wallet size={20} />
                </div>
                <h2 className="text-lg font-black text-(--menu-text)">{t('footer.payment_methods')}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-(--menu-card-bg) text-(--menu-text-muted) border border-(--menu-border) flex items-center justify-center hover:text-secondary transition-colors"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[62vh] overflow-y-auto custom-scrollbar py-4 space-y-3">
              {loading ? (
                [0, 1].map((item) => (
                  <div key={item} className="h-24 rounded-2xl bg-(--menu-card-bg) border border-(--menu-border) animate-pulse" />
                ))
              ) : activePaymentMethods.length === 0 ? (
                <div className="py-10 text-center rounded-3xl border border-dashed border-(--menu-border) bg-(--menu-card-bg)/50">
                  <Wallet className="mx-auto text-(--menu-text-muted) mb-3" size={28} />
                  <p className="text-sm font-bold text-(--menu-text-muted)">{t('footer.no_active_payment_methods')}</p>
                </div>
              ) : (
                activePaymentMethods.map((method) => {
                  return (
                    <div key={method.id} className="rounded-3xl bg-(--menu-card-bg) border border-(--menu-border) px-4 py-4 md:px-6 md:py-5 shadow-sm">
                      <div className="flex flex-col gap-4">
                        {/* Header Info */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {method.imageUrl && (
                                <img src={method.imageUrl} alt="" className="w-6 h-6 object-contain" />
                              )}
                              <h3 className="font-black text-(--menu-text) truncate">{method.name || method.label}</h3>
                            </div>
                            <span className="shrink-0 rounded-full border border-primary/15 bg-primary/10 text-primary px-2.5 py-1 text-[10px] font-black uppercase tracking-widest">
                              {t(`admin.payment_type_${method.type}`)}
                            </span>
                          </div>
                        </div>

                        {/* Details Lines - Individually Copiable */}
                        {method.details && (
                          <div className="space-y-2 mt-2">
                            {method.details.split('\n').filter(line => line.trim()).map((line, idx) => {
                              const isLineCopied = copiedMethodId === `${method.id}-${idx}`;
                              return (
                                <div key={idx} className="group relative flex items-center justify-between gap-3 p-3 rounded-2xl bg-(--menu-bg) border border-(--menu-border) hover:border-primary/30 transition-all">
                                  <p className="text-sm font-bold text-(--menu-text-muted) break-all leading-relaxed">{line.trim()}</p>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        await navigator.clipboard.writeText(line.trim());
                                        setCopiedMethodId(`${method.id}-${idx}`);
                                        setTimeout(() => setCopiedMethodId(null), 2000);
                                      } catch {}
                                    }}
                                    className={`shrink-0 w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${isLineCopied ? "bg-emerald-500 text-white border-emerald-500" : "bg-(--menu-card-bg) text-primary border-(--menu-border) hover:bg-primary hover:text-white"}`}
                                    aria-label={t('common.copy')}
                                  >
                                    <Copy size={14} />
                                  </button>
                                  
                                  <AnimatePresence>
                                    {isLineCopied && (
                                      <motion.div
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="absolute -top-8 left-0 px-2 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-lg shadow-lg"
                                      >
                                        {t('footer.copied')}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
