import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Category } from "./Menu";
import { FaThLarge } from "react-icons/fa";

interface Props {
  categories: Category[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export default function CategoryNavigation({
  categories,
  activeId,
  onSelect,
}: Props) {
  const { t } = useTranslation();
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeId]);

  return (
    <div className="relative mb-8 sm:mb-10">
      <div className="overflow-x-auto no-scrollbar pb-2">
        <div className="flex items-center gap-3 min-w-max px-1">
          <TabButton
            id="all"
            label={t("common.all") || "الكل"}
            isActive={activeId === "all"}
            onClick={() => onSelect("all")}
            isAll
            refProp={activeId === "all" ? activeRef : null}
          />

          {categories.map((cat) => (
            <TabButton
              key={cat.id}
              id={cat.id}
              label={cat.nameAr || cat.name}
              isActive={activeId === cat.id}
              onClick={() => onSelect(cat.id)}
              refProp={activeId === cat.id ? activeRef : null}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface TabButtonProps {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isAll?: boolean;
  refProp?: React.Ref<HTMLButtonElement> | null;
}

function TabButton({
  label,
  isActive,
  onClick,
  isAll,
  refProp,
}: TabButtonProps) {
  return (
    <button
      ref={refProp || null}
      onClick={onClick}
      className={`
        relative h-11 px-6 rounded-xl text-[13px] font-bold whitespace-nowrap
        transition-all duration-300 flex items-center gap-2.5
        ${isActive 
          ? "text-white shadow-lg shadow-primary/20" 
          : "text-gray-500 bg-gray-50 hover:bg-gray-100 border border-transparent"
        }
      `}
    >
      <span className="relative z-10 flex items-center gap-2">
        {isAll ? <FaThLarge size={14} /> : <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : "bg-primary"}`} />}
        {label}
      </span>

      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-primary rounded-xl"
          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
        />
      )}
    </button>
  );
}