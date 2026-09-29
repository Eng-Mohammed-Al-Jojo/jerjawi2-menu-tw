import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import CartButton from "../components/cart/CartButton";
import Footer from "../components/menu/footer";
import Menu, { type Item } from "../components/menu/Menu";
import ItemModal from "../components/menu/ItemModal";
import { HiSparkles } from "react-icons/hi";
import FeaturedModal from "../components/menu/FeaturedModal";
import LoadingScreen from "../components/common/LoadingScreen";
import { motion } from "framer-motion";
import { FirebaseService } from "../services/firebaseService";
import OrderStatusButton from "../components/cart/OrderStatusButton";
import GlassButton from "../components/common/GlassButton";
import { getAssetUrl } from "../utils/assetUtils";
import { useMenuStore } from "../store/useMenuStore";


export default function MenuPage() {
  const { t } = useTranslation();

  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [hasFeatured, setHasFeatured] = useState(false);
  const [featuredItems, setFeaturedItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const { orderSystem, setOrderSystem, setOrderModesConfig } = useMenuStore();

  useEffect(() => {
    const unsubscribe = FirebaseService.listen("settings/orderSystem", (value) => {
      setOrderSystem(value === true || value === "true" || value === 1);
    });

    // Sync Order Modes Config
    const unsubModes = FirebaseService.listen("settings/orderModes", (value) => {
      if (value) {
        setOrderModesConfig(value);
      }
    });

    return () => {
      unsubscribe();
      unsubModes();
    };
  }, [setOrderSystem, setOrderModesConfig]);

  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsLoading(loading);
    if (!loading) setIsDataReady(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-(--menu-bg) text-(--menu-text) menu-wrapper overflow-x-hidden">

      {/* Loading */}
      <LoadingScreen visible={isLoading} />

      {/* ✅ Top Bar */}
      {/* ✅ Featured Button — Floating Left */}
      <div className="absolute top-4 left-4 z-50">
        {isDataReady && hasFeatured && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <GlassButton
              variant="featured"
              icon={<HiSparkles size={18} />}
              onClick={() => setShowFeaturedModal(true)}
              title={t("menu.featured_items")}
            />
          </motion.div>
        )}
      </div>

      <main className="flex flex-col flex-1">

        {/* Hero Section — mobile-first compact */}
        <section className="relative flex flex-col items-center justify-center text-center px-4 pt-8 pb-6 sm:pt-10 sm:pb-8 overflow-hidden bg-(--linear-gradient(180deg,(--menu-surface),(--menu-bg))) border-b border-(--menu-border)">
          <div className="absolute inset-x-0 bottom-0 h-12 bg-(--linear-gradient(180deg,transparent,(--menu-bg))) pointer-events-none" />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex items-center justify-center w-44 h-44 md:w-60 md:h-60 rounded-3xl bg-(--menu-card-elevated) border border-(--menu-border) shadow-premium"
          >
            <motion.img
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ willChange: "transform, opacity" }}
              src={getAssetUrl('logo.png')}
              className="w-36 h-36 md:w-52 md:h-52 object-contain"
              alt="Logo"
            />
          </motion.div>
          {/* Welcome Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-3 text-center px-4"
          >
            <h3 className="text-sm sm:text-base font-bold text-(--menu-primary-800) leading-snug">
              أهلاً بكم في عصائر و مرطبات الجرجاوي 🧃
            </h3>

          </motion.div>

          {/* Takeaway Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-(--menu-primary-200) bg-(--menu-primary-50) text-(--menu-primary-800) text-xs font-semibold shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-(--menu-primary-500) animate-pulse" />
            {t("menu.notice.takeaway")}
          </motion.div>



        </section>

        {/* ✅ Menu */}
        <div className="flex-1 w-full max-w-6xl mx-auto px-0 md:px-6">
          <Menu
            onLoadingChange={handleLoadingChange}
            onFeaturedCheck={setHasFeatured}
            onFeaturedItemsChange={setFeaturedItems}
            onItemClick={setSelectedItem}
          />
        </div>

      </main>

      {/* Cart */}
      {isDataReady && <CartButton />}

      {/* Modals */}
      <FeaturedModal
        isOpen={showFeaturedModal}
        onClose={() => setShowFeaturedModal(false)}
        orderSystem={orderSystem}
        items={featuredItems}
        onItemClick={setSelectedItem}
      />


      <ItemModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        orderSystem={orderSystem}
      />



      <OrderStatusButton />
      <Footer />
    </div>
  );
}
