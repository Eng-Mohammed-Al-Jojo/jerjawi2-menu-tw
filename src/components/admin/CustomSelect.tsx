import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import { useTranslation } from "react-i18next";

interface Props {
    options: { id: string; name: string }[];
    value: string;
    onChange: (val: string) => void;
    error?: boolean;
    placeholder?: string;
    disabled?: boolean;
}

const CustomSelect: React.FC<Props> = ({ options, value, onChange, error, placeholder, disabled }) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.id === value);

    return (
        <div className="relative w-full" ref={ref} dir="rtl">
            <button
                type="button"
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between px-6 py-4 rounded-2xl border transition-all duration-500
                    bg-gray-50 outline-none shadow-soft
                    ${disabled ? "opacity-50 cursor-not-allowed border-gray-100" : "hover:border-primary/30 hover:bg-white"}
                    ${error ? "border-secondary ring-4 ring-secondary/5" : (!disabled ? "border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/5 focus:bg-white" : "")} 
                `}
            >
                <span className={`text-sm font-bold ${selectedOption ? "text-gray-900" : "text-gray-400"}`}>
                    {selectedOption ? selectedOption.name : placeholder || t('common.select')}
                </span>
                <FiChevronDown className={`transition-transform duration-500 text-gray-400 ${open ? "rotate-180 text-primary" : ""}`} size={20} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute z-60 w-full right-0 mt-3 max-h-64 overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-premium"
                    >
                        <div className="overflow-y-auto max-h-64 custom-scrollbar p-2">
                            {options.length === 0 ? (
                                <div className="p-6 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">{t('common.no_options')}</div>
                            ) : (
                                <div className="space-y-1">
                                    {options.map(o => (
                                        <button
                                            key={o.id}
                                            type="button"
                                            onClick={() => { onChange(o.id); setOpen(false); }}
                                            className={`
                                                w-full text-right px-5 py-3.5 rounded-xl transition-all flex items-center justify-between group
                                                ${value === o.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-primary/5 text-gray-700"}
                                            `}
                                        >
                                            <span className="text-sm font-black tracking-tight">{o.name}</span>
                                            {value === o.id && <FiCheck className="text-white" size={18} strokeWidth={3} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomSelect;
