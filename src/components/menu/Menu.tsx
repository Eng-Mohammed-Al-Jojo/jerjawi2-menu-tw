import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import CategorySection from "./CategorySection";
import ItemRow from "./ItemRow";
import MenuSkeleton from "./MenuSkeleton";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FiSearch, FiX } from "react-icons/fi";
import { FaCommentDots } from "react-icons/fa";
import FeedbackModal from "./FeedbackModal";

import { MenuService } from "../../services/menuService";
import { useMenuStore } from "../../store/useMenuStore";

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, scale: 0.98 }
};

/* ================= Types ================= */
export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  available?: boolean;
  order?: number;
  image?: string;
  visible?: boolean;
}

export interface Subcategory {
  id: string;
  nameAr: string;
  nameEn?: string;
  categoryId: string;
  image?: string;
  visible?: boolean;
  order?: number;
}

export interface Item {
  featured: any;
  image: string | undefined;
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  price: number;
  ingredients?: string;
  ingredientsAr?: string;
  ingredientsEn?: string;
  priceTw?: number;
  dineInOrderEnabled?: boolean;
  takeawayOrderEnabled?: boolean;
  categoryId: string;
  subcategoryId?: string | null;
  visible?: boolean;
  star?: boolean;
  createdAt?: number;
  order?: number;
}

/* ================= Props ================= */
interface Props {
  onLoadingChange?: (loading: boolean) => void;
  onFeaturedCheck?: (hasFeatured: boolean) => void;
  onFeaturedItemsChange?: (items: Item[]) => void;
  orderSystem?: boolean;
  onItemClick?: (item: Item) => void;
  onDetailsClick?: (item: Item) => void;
}

type LoadingPhase = "loading" | "skeleton" | "ready";

const MIN_LOADING_TIME = 2000;
const SKELETON_DURATION = 600;

export default function Menu({ onLoadingChange, onFeaturedCheck, onFeaturedItemsChange, onItemClick, onDetailsClick }: Props) {
  const { t } = useTranslation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [phase, setPhase] = useState<LoadingPhase>("loading");

  const { orderSystem, setOrderSystem: setStoreOrderSystem } = useMenuStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const isMounted = useRef(true);
  const startTime = useRef(Date.now());

  /* ================= Data Fetching ================= */
  useEffect(() => {
    isMounted.current = true;
    onLoadingChange?.(true);

    let unsubscribe: (() => void) | null = null;

    const loadData = async () => {
      try {
        const { data } = await MenuService.getMenuWithFallback();
        if (!isMounted.current) return;

        setCategories(data.categories);
        setSubcategories(data.subcategories);
        setItems(data.items);
        setStoreOrderSystem(data.orderSystem);

        const wasLoaded = sessionStorage.getItem("menu_orca_initial_load");
        const elapsed = Date.now() - startTime.current;
        const remainingFetchTime = wasLoaded ? 0 : Math.max(0, MIN_LOADING_TIME - elapsed);

        setTimeout(() => {
          if (!isMounted.current) return;
          onLoadingChange?.(false);
          setPhase("skeleton");
          sessionStorage.setItem("menu_orca_initial_load", "true");

          setTimeout(() => {
            if (isMounted.current) setPhase("ready");
          }, SKELETON_DURATION);
        }, remainingFetchTime);

        unsubscribe = MenuService.subscribeToMenuUpdates((freshData) => {
          if (!isMounted.current) return;
          setCategories(freshData.categories);
          setSubcategories(freshData.subcategories);
          setItems(freshData.items);
          setStoreOrderSystem(freshData.orderSystem);
        });
      } catch (err) {
        console.error("Menu load failed:", err);
        if (isMounted.current) {
          onLoadingChange?.(false);
          setPhase("ready");
        }
      }
    };

    loadData();
    return () => {
      isMounted.current = false;
      unsubscribe?.();
    };
  }, [onLoadingChange, setStoreOrderSystem]);

  /* ================= Derived Data (Optimized) ================= */
  const featuredItems = useMemo(() =>
    items.filter(i => (i.star === true || (i as any).isFeatured === true) && i.visible !== false),
    [items]
  );

  const availableCategories = useMemo(() => {
    return categories
      .filter(cat => {
        if (!cat.available) return false;
        // Smart Filter: Ensure the category has at least one visible item
        return items.some(i => i.categoryId === cat.id && i.visible !== false);
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [categories, items]);

  const filteredItems = useMemo(() => {
    const search = searchTerm?.toLowerCase() ?? "";
    if (!search) return [];
    return items.filter((item) => {
      const name = (item.nameAr || item.name || "").toLowerCase();
      const ingredients = (item.ingredientsAr || item.ingredients || "").toLowerCase();
      return name.includes(search) || ingredients.includes(search);
    });
  }, [items, searchTerm]);

  useEffect(() => {
    onFeaturedCheck?.(featuredItems.length > 0);
    onFeaturedItemsChange?.(featuredItems);
  }, [featuredItems, onFeaturedCheck, onFeaturedItemsChange]);

  const handleItemClick = useCallback((item: Item) => {
    onItemClick?.(item);
  }, [onItemClick]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchTerm("");
  }, []);

  /* ================= Phase: Loading ================= */
  if (phase === "loading") return null;

  /* ================= Phase: Skeleton ================= */
  if (phase === "skeleton") {
    return (
      <div className="menu-wrapper">
        <motion.div variants={pageVariants} initial="initial" animate="animate" className="max-w-7xl mx-auto px-4 pb-32">
          <MenuSkeleton />
        </motion.div>
      </div>
    );
  }

  /* ================= Phase: Ready ================= */
  return (
    <div className="menu-wrapper bg-(--menu-bg) min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 pt-6"
      >
        <div className="flex flex-col">
          {/* Header Area */}
          <div className="flex flex-col mb-5 gap-4">
            {/* Search Bar */}
            <div className="w-full max-w-xl mx-auto relative group">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-(--menu-text-muted) group-focus-within:text-(--menu-primary) transition-colors">
                <FiSearch size={18} />
              </div>
              <input
                type="text"
                placeholder={t('common.search') || "ابحث عن طبقك المفضل..."}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full bg-(--menu-card-elevated) border border-(--menu-border) rounded-xl h-11 pr-11 pl-4 text-sm font-medium focus:bg-(--menu-card-elevated) focus:border-(--menu-primary) focus:ring-2 focus:ring-[color-mix(in_srgb,var(--menu-primary)_14%,transparent)] outline-none transition-all shadow-soft text-right text-(--menu-text)"
              />
              {searchTerm && (
                <button
                  onClick={handleSearchClear}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-(--menu-card-bg) flex items-center justify-center text-(--menu-text-muted) hover:text-(--menu-text) transition-colors"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 w-full min-w-0">
            <AnimatePresence mode="wait">
              {searchTerm ? (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit="exit"
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <ItemRow key={item.id} item={item} orderSystem={orderSystem} onClick={handleItemClick} onDetailsClick={onDetailsClick} />
                    ))
                  ) : (
                    <div className="md:col-span-2 py-20 text-center flex flex-col items-center gap-4">
                      <div className="w-24 h-24 rounded-3xl bg-(--menu-card-bg) border border-(--menu-border) flex items-center justify-center text-5xl">
                        🍽️
                      </div>
                      <h3 className="text-xl font-black text-(--menu-text)">{t('menu.no_results') || "لا توجد نتائج"}</h3>
                      <p className="text-(--menu-text-muted) text-sm font-bold max-w-xs mx-auto">
                        {t('menu.no_results_desc') || "جرّب البحث باسم صنف آخر أو مكوّن مختلف."}
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : availableCategories.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-24 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-(--menu-card-bg) border border-(--menu-border) flex items-center justify-center text-5xl mb-6">
                    🍽️
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-(--menu-text)">{t('menu.empty_menu') || "القائمة قادمة قريباً"}</h3>
                    <p className="text-(--menu-text-muted) max-w-xs mx-auto">
                      {t('menu.empty_menu_desc') || "نحن نقوم بتجهيز تشكيلتنا اللذيذة. يرجى التحقق مرة أخرى قريباً."}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="categories"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {availableCategories.map((cat, idx) => (
                    <CategorySection
                      key={cat.id}
                      category={cat}
                      subcategories={subcategories}
                      items={items.filter(i => i.categoryId === cat.id && i.visible !== false)}
                      orderSystem={orderSystem}
                      onItemClick={handleItemClick}
                      onDetailsClick={onDetailsClick}
                      defaultOpen={idx === 0}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Floating Components */}
        <button
          onClick={() => setShowFeedbackModal(true)}
          aria-label="feedback"
          className="fixed bottom-6 right-6 w-12 h-12 bg-(--menu-primary) text-(--menu-card-elevated) rounded-2xl shadow-premium flex items-center justify-center z-40 hover:scale-105 active:scale-95 transition-transform border border-white/20"
        >
          <FaCommentDots size={20} />
        </button>

        <FeedbackModal show={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} orderSystem={orderSystem} />
      </motion.div>
    </div>
  );
}
