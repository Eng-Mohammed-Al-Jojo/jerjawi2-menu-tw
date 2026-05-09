import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useMenuStore } from "../../store/useMenuStore";
import type { OrderMode } from "../../store/useMenuStore";
import { FaUtensils, FaShoppingBag } from "react-icons/fa";

export default function OrderModeTabs() {
  const { t } = useTranslation();
  const { selectedOrderMode, setOrderMode } = useMenuStore();

  const modes: { id: OrderMode; label: string; icon: any }[] = [
    { id: "dineIn", label: t("common.dine_in_short") || "صالة", icon: FaUtensils },
    { id: "takeaway", label: t("common.takeaway_short") || "تيك أواي", icon: FaShoppingBag },
  ];

  return (
    <div className="flex justify-center w-full mt-6 mb-2 px-2">
      <div className="flex w-full max-w-sm bg-(--menu-card-elevated) rounded-2xl p-1 border border-(--menu-border) shadow-soft">

        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = selectedOrderMode === mode.id;

          return (
            <motion.button
              key={mode.id}
              onClick={() => setOrderMode(mode.id)}
              whileTap={{ scale: 0.97 }}
              className={`
                flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl
                transition-all duration-200 font-bold text-sm uppercase tracking-wider
              `}
            >
              <div
                className={`
                  flex items-center gap-2 px-12 py-3 rounded-xl transition-all duration-400
                  ${isActive
                    ? "bg-(--menu-primary) text-(--menu-card-elevated) shadow-md"
                    : "text-(--menu-text-muted) hover:text-(--menu-text)"
                  }
                `}
              >
                <Icon size={16} />
                {mode.label}
              </div>
            </motion.button>
          );
        })}

      </div>
    </div>
  );
}
