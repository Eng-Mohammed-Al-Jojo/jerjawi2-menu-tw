import { useState, useEffect } from "react";
import { FiX, FiStar, FiMessageSquare, FiSend } from "react-icons/fi";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface Props {
    show: boolean;
    onClose: () => void;
    orderSystem?: boolean;
}

const LOCAL_STORAGE_KEY = "feedbackSettings";

export default function FeedbackModal({ show, onClose }: Props) {
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [toast, setToast] = useState<string | null>(null);

    const [feedbackPhone, setFeedbackPhone] = useState("");

    useEffect(() => {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
            const data = JSON.parse(localData);
            if (data.feedbackPhone) setFeedbackPhone(data.feedbackPhone);
        }

        const feedbackRef = ref(db, "settings/complaintsWhatsapp");
        const unsubscribe = onValue(feedbackRef, (snapshot) => {
            if (snapshot.exists()) {
                const phone = snapshot.val();
                setFeedbackPhone(phone);
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ feedbackPhone: phone }));
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!show) {
            setName("");
            setPhone("");
            setMessage("");
            setRating(0);
            setHoverRating(0);
        }
    }, [show]);

    const handleSend = () => {
        if (!message.trim()) {
            setToast(t('common.feedback_error_message'));
            setTimeout(() => setToast(null), 3000);
            return;
        }

        if (!feedbackPhone) {
            setToast(t('common.feedback_error_phone'));
            setTimeout(() => setToast(null), 3000);
            return;
        }

        const fullMessage = `${t('whatsapp.rating_prefix')}\n------------------\n${t('whatsapp.name_prefix')}: ${name || "-"}\n${t('whatsapp.phone_prefix')}: ${phone || "-"}\n${t('whatsapp.rating_label')}: ${rating}/5\n${t('whatsapp.note_prefix')}: ${message || "-"}`;
        const url = `https://wa.me/${feedbackPhone}?text=${encodeURIComponent(fullMessage)}`;
        window.open(url, "_blank");

        setToast(t('common.feedback_success'));
        setTimeout(() => setToast(null), 3000);
        onClose();
    };

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-(--bg-card)/80 backdrop-blur-2xl w-full max-w-md p-8 rounded-[2.5rem] border border-(--border-color) shadow-2xl overflow-y-auto max-h-[90vh] z-10"
                    >
                        <button onClick={onClose} className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center rounded-2xl bg-(--bg-main) text-(--text-muted) hover:text-red-500 transition-all border border-(--border-color)">
                            <FiX />
                        </button>

                        <div className="flex flex-col items-center mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl mb-4 shadow-inner">
                                <FiMessageSquare />
                            </div>
                            <h2 className="text-2xl font-black text-(--text-main) text-center">{t('common.feedback_title')}</h2>
                            <p className="text-sm font-bold text-(--text-muted) text-center mt-1 uppercase tracking-widest opacity-60">{t('common.feedback_desc')}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t('common.name')}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-(--bg-main)/50 text-(--text-main) border border-(--border-color) focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold placeholder:opacity-50"
                                />
                            </div>
                            <div className="relative" dir="ltr">
                                <input
                                    type="tel"
                                    placeholder={t('common.phone')}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    dir="ltr"
                                    className="w-full px-5 py-3.5 rounded-2xl 
                                                bg-(--bg-main)/50 text-(--text-main) 
                                                border border-(--border-color) 
                                                focus:border-primary focus:ring-4 focus:ring-primary/5 
                                                outline-none transition-all font-bold 
                                                placeholder:opacity-50 text-right"
                                />
                            </div>

                            {/* Stars Rating */}
                            <div className="flex justify-center gap-2 py-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                        className="relative p-1 transition-transform hover:scale-125 active:scale-95"
                                    >
                                        <FiStar
                                            size={32}
                                            className={`transition-colors duration-300 ${star <= (hoverRating || rating) ? 'text-amber-400 fill-amber-400 drop-shadow-lg' : 'text-(--text-muted) opacity-20'}`}
                                        />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                placeholder={t('common.feedback_placeholder')}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl bg-(--bg-main)/50 text-(--text-main) border border-(--border-color) focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold resize-none h-32 placeholder:opacity-50"
                            />

                            <button
                                onClick={handleSend}
                                className="w-full py-4 rounded-2xl bg-primary text-white font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <FiSend />
                                {t('common.send_feedback')}
                            </button>
                        </div>
                    </motion.div>

                    {/* Toast */}
                    <AnimatePresence>
                        {toast && (
                            <motion.div
                                initial={{ opacity: 0, y: 30, x: "-50%" }}
                                animate={{ opacity: 1, y: 0, x: "-50%" }}
                                exit={{ opacity: 0, y: 30, x: "-50%" }}
                                className="fixed top-10 left-1/2 z-110 bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-2xl border border-white/20 backdrop-blur-md"
                            >
                                {toast}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </AnimatePresence>
    );
}

