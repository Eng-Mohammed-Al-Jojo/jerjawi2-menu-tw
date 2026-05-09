import React, { useState } from "react";
import { FiPlus, FiTrash2, FiEdit, FiCheck, FiChevronDown, FiMove, FiEye, FiEyeOff } from "react-icons/fi";
import { db } from "../../firebase";
import { ref, update } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import type { PopupState, Category, Subcategory } from "./types";
import SafeImage from "../common/SafeImage";
import { getAssetUrl } from "../../utils/assetUtils";

interface Props {
  categories: Record<string, Category>;
  subcategories: Record<string, Subcategory>;
  setPopup: (popup: PopupState) => void;
  toggleCategoryVisibility: (id: string, current: boolean) => void;
  toggleSubcategoryVisibility: (id: string, current: boolean) => void;
  updateCategoryImage: (id: string, image: string) => void;
  showNotification: (message: string, type?: 'success' | 'error') => void;
  newCategoryNameAr: string;
  setNewCategoryNameAr: (val: string) => void;
}

const CategoryCard: React.FC<{
  cat: Category & { id: string };
  subcategories: Record<string, Subcategory>;
  editingId: string | null;
  editNameAr: string;
  setEditNameAr: React.Dispatch<React.SetStateAction<string>>;
  saveEdit: (id: string) => void;
  startEditing: (id: string, nameAr: string) => void;
  toggleCategoryVisibility: (id: string, current: boolean) => void;
  toggleSubcategoryVisibility: (id: string, current: boolean) => void;
  updateCategoryImage: (id: string, image: string) => void;
  setPopup: (popup: PopupState) => void;
}> = ({
  cat,
  subcategories,
  editingId,
  editNameAr,
  setEditNameAr,
  saveEdit,
  startEditing,
  toggleCategoryVisibility,
  toggleSubcategoryVisibility,
  updateCategoryImage,
  setPopup,
}) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
      useSortable({ id: cat.id });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      touchAction: "none",
    };

    const catSubcategories = Object.entries(subcategories)
      .filter(([, sub]) => sub.categoryId === cat.id)
      .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0));

    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        {...attributes}
        layout
        className={`
          relative group flex flex-col bg-white rounded-4xl border transition-all duration-300 overflow-hidden h-full
          ${isDragging ? "z-50 border-primary shadow-premium scale-[1.02]" : "border-gray-100 hover:border-primary/20 shadow-soft hover:shadow-premium"}
          ${!cat.visible ? "opacity-60 grayscale-[0.5]" : ""}
        `}
      >
        {/* Category Image Header */}
        <div className="relative h-44 bg-gray-50 overflow-hidden group/img">
          {cat.image ? (
            <SafeImage
              src={cat.image.startsWith('http') || cat.image.startsWith('/') ? cat.image : getAssetUrl(`images/${cat.image}`)}
              alt=""
              className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <FiPlus size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('admin.add_image')}</span>
            </div>
          )}

          {/* Image Controls Overlay */}
          <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={() => setPopup({ type: "categoryImage", id: cat.id })}
              className="w-10 h-10 bg-white text-primary rounded-xl hover:scale-110 transition-transform flex items-center justify-center shadow-lg"
            >
              <FiEdit size={16} />
            </button>
            {cat.image && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateCategoryImage(cat.id, "");
                }}
                className="w-10 h-10 bg-secondary text-white rounded-xl hover:scale-110 transition-transform flex items-center justify-center shadow-lg"
              >
                <FiTrash2 size={16} />
              </button>
            )}
          </div>

          {/* Drag Handle Overlay */}
          <div
            {...listeners}
            className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-md text-gray-500 rounded-xl cursor-grab active:cursor-grabbing hover:bg-primary hover:text-white transition-all shadow-sm"
          >
            <FiMove size={14} />
          </div>

          {/* Visibility Badge */}
          <div className="absolute top-4 left-4">
            <button
              onClick={() => toggleCategoryVisibility(cat.id, cat.visible ?? true)}
              className={`p-2.5 rounded-xl backdrop-blur-md transition-all shadow-sm ${cat.visible
                ? "bg-emerald-500/90 text-white"
                : "bg-secondary/90 text-white"}`}
            >
              {cat.visible ? <FiEye size={14} /> : <FiEyeOff size={14} />}
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6 flex flex-col flex-1">
          <div className="flex-1 min-w-0 mb-6">
            {editingId === cat.id ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  className="flex-1 p-3 bg-gray-50 border border-primary rounded-xl text-sm font-bold outline-none text-right focus:bg-white transition-all"
                  value={editNameAr}
                  onChange={(e) => setEditNameAr(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit(cat.id)}
                />
                <button
                  onClick={() => saveEdit(cat.id)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-emerald-500 text-white shrink-0 shadow-lg shadow-emerald-500/20"
                >
                  <FiCheck />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-gray-900 truncate" title={cat.nameAr}>
                  {cat.nameAr}
                </h3>
                <button
                  onClick={() => startEditing(cat.id, cat.nameAr)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
                >
                  <FiEdit size={14} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                {catSubcategories.length} {t('admin.subcategories')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-6 border-t border-gray-50">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex-1 h-12 flex items-center justify-center gap-3 rounded-xl transition-all font-bold border ${isExpanded
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-white hover:border-primary/30 hover:text-primary"
                }`}
            >
              <span className="text-xs uppercase tracking-wider">{t('admin.subcategories')}</span>
              <FiChevronDown className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
            </button>

            <button
              onClick={() => setPopup({ type: "deleteCategory", id: cat.id })}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-secondary-50 text-secondary hover:bg-secondary hover:text-white transition-all border border-secondary-100 shadow-sm active:scale-95"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        </div>

        {/* Subcategories Accordion */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gray-50/50 border-t border-gray-50"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{t('admin.manage_sub')}</span>
                  <button
                    onClick={() => setPopup({ type: "addSubcategory", parentId: cat.id })}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                  >
                    <FiPlus size={12} /> {t('admin.add_new')}
                  </button>
                </div>

                {catSubcategories.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {catSubcategories.map(([id, sub]) => (
                      <div
                        key={id}
                        className={`flex items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl shadow-sm transition-all hover:border-primary/20 ${!sub.visible ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => setPopup({ type: "subcategoryImage", id })}
                            className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 group/sub"
                          >
                            {sub.image ? (
                              <SafeImage src={sub.image.startsWith('http') || sub.image.startsWith('/') ? sub.image : getAssetUrl(`images/${sub.image}`)} alt="" className="w-full h-full object-cover transition-transform group-hover/sub:scale-110" />
                            ) : (
                              <FiPlus size={14} className="text-gray-300" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-gray-800 block truncate">{sub.nameAr}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleSubcategoryVisibility(id, sub.visible ?? true)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${sub.visible ? "text-emerald-500 hover:bg-emerald-50" : "text-secondary hover:bg-secondary-50"}`}
                          >
                            {sub.visible ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                          </button>
                          <button
                            onClick={() => setPopup({ type: "editSubcategory", id })}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <FiEdit size={14} />
                          </button>
                          <button
                            onClick={() => setPopup({ type: "deleteSubcategory", id })}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-secondary hover:bg-secondary-50 rounded-lg transition-colors"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-[11px] font-bold text-gray-400 italic">{t('admin.no_subcategories')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

const CategorySection: React.FC<Props> = ({
  categories,
  subcategories,
  setPopup,
  toggleCategoryVisibility,
  toggleSubcategoryVisibility,
  updateCategoryImage,
  showNotification,
  newCategoryNameAr,
  setNewCategoryNameAr,
}) => {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameAr, setEditNameAr] = useState("");
  const [openCategories, setOpenCategories] = useState(false);

  const startEditing = (id: string, nameAr: string) => {
    setEditingId(id);
    setEditNameAr(nameAr);
  };

  const saveEdit = async (id: string) => {
    if (!editNameAr.trim()) {
      showNotification(t('admin.category_name_required'), 'error');
      return;
    }
    try {
      await update(ref(db, `categories/${id}`), {
        nameAr: editNameAr.trim(),
      });
      setEditingId(null);
      setEditNameAr("");
      showNotification(t('common.success') + " ✅");
    } catch {
      showNotification(t('common.error'), 'error');
    }
  };

  const categoriesArray = Object.entries(categories)
    .map(([id, cat]) => ({ ...cat, id }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categoriesArray.findIndex((c) => c.id === active.id);
    const newIndex = categoriesArray.findIndex((c) => c.id === over.id);

    const newArray = arrayMove(categoriesArray, oldIndex, newIndex);

    const updates: Record<string, any> = {};
    newArray.forEach((cat, index) => {
      updates[`categories/${cat.id}/order`] = index;
    });

    await update(ref(db), updates);
  };

  return (
    <div className="bg-white p-8 sm:p-10 rounded-[3rem] mb-12 border border-gray-100 shadow-soft">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-primary">{t('admin.categories')}</h2>
          <p className="text-gray-400 text-sm font-medium mt-1.5">{t('admin.category_desc')}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newCategoryNameAr}
            onChange={(e) => setNewCategoryNameAr(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setPopup({ type: "addCategory" })}
            placeholder={t('admin.add_category_placeholder')}
            className="w-full md:w-72 h-14 px-5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold outline-none text-right focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
          />
          <button
            onClick={() => setPopup({ type: "addCategory" })}
            className="w-14 h-14 flex items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all self-center md:self-auto"
          >
            <FiPlus size={28} />
          </button>
        </div>
      </div>

      {/* View Categories Button */}
      <button
        onClick={() => setOpenCategories((p) => !p)}
        className="
          w-full mb-2
          flex items-center justify-between
          px-6 sm:px-8 py-5
          bg-gray-50
          rounded-4xl
          font-black text-base text-gray-800
          hover:bg-primary/5 hover:text-primary
          transition-all border border-gray-100 shadow-inner group
        "
      >
        <div className="flex items-center gap-4">
          <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white text-primary flex items-center justify-center shadow-soft transition-transform group-hover:scale-110">
            <FiChevronDown size={20} className={`transition-transform duration-500 ${openCategories ? "rotate-180" : ""}`} />
          </span>
          <span className="text-lg font-bold">{t('admin.view_all_categories')}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] hidden sm:inline">{t('admin.total')}</span>
          <span className="bg-primary text-white text-[12px] font-black px-4 py-1.5 rounded-xl shadow-lg shadow-primary/20">
            {categoriesArray.length}
          </span>
        </div>
      </button>

      {/* Accordion List */}
      <AnimatePresence>
        {openCategories && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-10">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categoriesArray.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {categoriesArray.map((cat) => (
                      <CategoryCard
                        key={cat.id}
                        cat={cat}
                        subcategories={subcategories}
                        editingId={editingId}
                        editNameAr={editNameAr}
                        setEditNameAr={setEditNameAr}
                        saveEdit={saveEdit}
                        startEditing={startEditing}
                        toggleCategoryVisibility={toggleCategoryVisibility}
                        toggleSubcategoryVisibility={toggleSubcategoryVisibility}
                        updateCategoryImage={updateCategoryImage}
                        setPopup={setPopup}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategorySection;

