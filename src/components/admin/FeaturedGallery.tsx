import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCheck, FiImage, FiSearch } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { loadImages } from "../../utils/imageLoader";
import SafeImage from "../common/SafeImage";
import { getAssetUrl } from "../../utils/assetUtils";

interface Props {
    visible: boolean;
    onClose: () => void;
    onSelect: (img: string) => void;
    galleryImages?: string[]; // Now optional
    selectedImage?: string;
    title?: string;
    basePath?: string;
    returnFullPath?: boolean;
}

const FeaturedGallery: React.FC<Props> = ({
    visible,
    onClose,
    onSelect,
    galleryImages: initialImages,
    selectedImage,
    title,
    returnFullPath = false
}) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [images, setImages] = useState<string[]>(initialImages && initialImages.length > 0 ? initialImages : []);
    const [loading, setLoading] = useState(!initialImages || initialImages.length === 0);

    // Load images if not provided or empty
    useEffect(() => {
        if (visible && (!initialImages || initialImages.length === 0)) {
            setLoading(true);
            loadImages('images')
                .then(setImages)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [visible, initialImages]);

    // Update images if prop changes and has items
    useEffect(() => {
        if (initialImages && initialImages.length > 0) {
            setImages(initialImages);
            setLoading(false);
        }
    }, [initialImages]);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const filteredImages = images.filter((img) =>
        img.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    const getFullSrc = (img: string) => {
        if (img.startsWith("http") || img.startsWith("/")) return img;
        return getAssetUrl(img);
    };

    const handleSelect = (img: string) => {
        // If the image is a full path from loadImages, we might want to return just the filename 
        // or the full path depending on returnFullPath.
        // For manifest images, they are already relative to public (e.g. images/a.jpg) or full URLs.
        if (returnFullPath) {
            onSelect(getFullSrc(img));
        } else {
            // Extract filename if it's a path
            const filename = img.split('/').pop() || img;
            onSelect(filename);
        }
    };

    return (
        <AnimatePresence>
            {visible && (
                <div className="fixed inset-0 z-200 flex items-center justify-center p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white w-full max-w-4xl rounded-[3rem] border border-gray-100 shadow-premium flex flex-col max-h-[90vh] overflow-hidden z-10"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-gray-100 bg-gray-50/50 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl shadow-xl shadow-primary/20">
                                        <FiImage />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title || t('admin.gallery_title')}</h2>
                                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">{t('admin.select_image_desc')}</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-all border border-gray-100 shadow-soft">
                                    <FiX size={24} />
                                </button>
                            </div>

                            {/* Search Input */}
                            <div className="relative group">
                                <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('common.search') || "Search images..."}
                                    className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-soft"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-secondary transition-colors"
                                    >
                                        <FiX size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 scroll-smooth custom-scrollbar bg-gray-50/30">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{t('common.loading')}</p>
                                </div>
                            ) : (
                                <motion.div
                                    layout
                                    className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6"
                                >
                                    <AnimatePresence mode="popLayout">
                                        {filteredImages.map((img) => {
                                            const fullSrc = getFullSrc(img);
                                            const isSelected = selectedImage === img || selectedImage === fullSrc || selectedImage === img.split('/').pop();
                                            return (
                                                <motion.button
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    key={img}
                                                    type="button"
                                                    onClick={() => handleSelect(img)}
                                                    className={`group relative rounded-4xl overflow-hidden border-2 transition-all duration-300 aspect-square shadow-soft
                                                        ${isSelected ? "border-primary ring-4 ring-primary/10" : "border-white hover:border-primary/50 hover:shadow-premium"}`}
                                                >
                                                    <SafeImage
                                                        src={fullSrc}
                                                        alt={img}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />

                                                    <AnimatePresence>
                                                        {isSelected && (
                                                            <motion.div
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] flex items-center justify-center"
                                                            >
                                                                <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center shadow-premium">
                                                                    <FiCheck strokeWidth={4} size={20} />
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    <div className="absolute inset-0 bg-linear-to-t from-gray-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 pointer-events-none">
                                                        <span className="text-[9px] text-white font-black truncate w-full uppercase tracking-widest">{img.split('/').pop()}</span>
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </AnimatePresence>
                                </motion.div>
                            )}

                            {/* Empty State */}
                            {!loading && filteredImages.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="py-24 text-center space-y-6"
                                >
                                    <div className="w-20 h-20 bg-white text-gray-200 rounded-4xl flex items-center justify-center mx-auto text-3xl shadow-soft border border-gray-100">
                                        <FiSearch size={32} />
                                    </div>
                                    <div>
                                        <p className="text-gray-900 font-black text-lg">{t('common.no_results') || "No images found"}</p>
                                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">{t('common.try_another_search') || "Try adjusting your search term"}</p>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-gray-100 bg-gray-50/50">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full py-5 rounded-2xl bg-white text-gray-400 font-black border border-gray-100 hover:text-secondary hover:bg-secondary/5 transition-all shadow-soft uppercase tracking-widest text-xs"
                            >
                                {t('admin.close_gallery')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default FeaturedGallery;

