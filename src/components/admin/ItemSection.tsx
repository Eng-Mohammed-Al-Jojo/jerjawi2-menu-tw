import React, { useState, useEffect } from "react";
import { ref, push, update } from "firebase/database";
import { db } from "../../firebase";
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiChevronDown, FiStar, FiImage, FiMinus, FiArrowUp, FiArrowDown, FiMove } from "react-icons/fi";
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
import { normalizeIngredients } from "../../utils/stringUtils";
import type { PopupState, Category, Item, Subcategory } from "./types";
import FeaturedGallery from "./FeaturedGallery";
import CustomSelect from "./CustomSelect";
import { getAssetUrl } from "../../utils/assetUtils";
import { loadImages } from "../../utils/imageLoader";
import SafeImage from "../common/SafeImage";



interface Props {
  categories: Record<string, Category>;
  subcategories: Record<string, Subcategory>;
  items: Record<string, Item>;
  popup: PopupState;
  setPopup: (popup: PopupState) => void;
}

const SortableItem: React.FC<{
  item: Item & { id: string };
  idx: number;
  totalItems: number;
  subcategories: Record<string, Subcategory>;
  toggleItem: (id: string, visible: boolean) => void;
  openGallery: (itemId: string, currentImage?: string) => void;
  removeImage: (id: string) => void;
  setPopup: (popup: PopupState) => void;
  moveItem: (categoryId: string, itemId: string, direction: 'up' | 'down') => void;
}> = ({ item, idx, totalItems, subcategories, toggleItem, openGallery, removeImage, setPopup, moveItem }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none",
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className={`flex flex-col sm:flex-row gap-4 sm:gap-8 py-4 sm:py-5 transition-all bg-white mb-2 px-3 sm:px-4 rounded-3xl border ${isDragging ? "z-50 shadow-premium border-primary scale-[1.02]" : "border-gray-50 hover:border-primary/20 shadow-soft hover:shadow-premium"} ${!item.visible ? "opacity-40 grayscale" : ""
        }`}
    >
      {/* ===== Top Row (image + info) ===== */}
      <div className="flex gap-4 w-full items-center">
        {/* Drag Handle */}
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing p-2.5 text-gray-400 hover:text-primary transition-colors"
        >
          <FiMove size={20} />
        </div>

        {/* Image */}
        <div className="relative group/img shrink-0">
          {item.image ? (
            <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
              <SafeImage
                src={item.image.startsWith('http') || item.image.startsWith('/') ? item.image : getAssetUrl(`images/${item.image}`)}
                alt={item.nameAr}
                className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700"
              />

              <button
                onClick={() => removeImage(item.id)}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 sm:w-7 sm:h-7 bg-secondary text-white rounded-full flex items-center justify-center shadow-lg scale-0 group-hover/img:scale-100 transition-transform hover:bg-secondary-600"
              >
                <FiMinus size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openGallery(item.id)}
              className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/40 transition-all"
            >
              <FiImage size={24} />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col">

          <div className="flex items-center gap-2">
            <h4 className="font-bold text-base sm:text-xl text-gray-900 truncate">
              {item.nameAr}
            </h4>

            {item.star && (
              <FiStar
                className="text-amber-400 fill-amber-400 shrink-0"
                size={16}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {item.subcategoryId && (
              <span className="text-[10px] px-2.5 py-1 bg-primary/5 border border-primary/10 rounded-lg font-bold text-primary uppercase tracking-wider">
                {subcategories[item.subcategoryId]?.nameAr}
              </span>
            )}
            {item.ingredientsAr && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {item.ingredientsAr.split(',').map((ing, i) => (
                  <span key={i} className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-gray-200">
                    {ing.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-lg font-black text-primary">{item.priceTw || item.price}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">₪</span>
          </div>

        </div>
      </div>

      {/* ===== Actions ===== */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto bg-gray-50 p-2 rounded-2xl border border-gray-100 shadow-inner">

        {/* Animated Toggle */}
        <button
          onClick={() => toggleItem(item.id, item.visible)}
          className={`relative shrink-0 w-12 h-6.5 rounded-full flex items-center p-1 transition-all duration-500 ${item.visible
            ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            : "bg-gray-300"
            }`}
          style={{
            justifyContent: item.visible ? "flex-end" : "flex-start"
          }}
        >
          <motion.div
            layout
            initial={false}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="w-4.5 h-4.5 rounded-full bg-white shadow-sm z-10"
          />
        </button>

        <div className="flex items-center gap-1.5">

          <button
            onClick={async () => {
              const newStar = !item.star;
              await update(ref(db, `items/${item.id}`), { star: newStar });
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${item.star
              ? "bg-amber-100 text-amber-600"
              : "hover:bg-white text-gray-400 hover:text-amber-500 hover:shadow-sm"
              }`}
          >
            <FiStar size={18} fill={item.star ? "currentColor" : "none"} />
          </button>

          <button
            onClick={() => setPopup({ type: "editItem", id: item.id })}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white hover:text-primary hover:shadow-sm text-gray-400 transition-all"
          >
            <FiEdit size={18} />
          </button>

          <button
            onClick={() => setPopup({ type: "deleteItem", id: item.id })}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white hover:text-secondary hover:shadow-sm text-gray-400 transition-all"
          >
            <FiTrash2 size={18} />
          </button>

        </div>
        <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => moveItem(item.categoryId, item.id, 'up')}
            disabled={idx === 0}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white hover:text-primary hover:shadow-sm text-gray-400 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <FiArrowUp size={18} />
          </button>
          <button
            onClick={() => moveItem(item.categoryId, item.id, 'down')}
            disabled={idx === totalItems - 1}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white hover:text-primary hover:shadow-sm text-gray-400 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <FiArrowDown size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ItemSection: React.FC<Props> = ({ categories, subcategories, items, setPopup }) => {
  const { t, i18n } = useTranslation();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [itemNameAr, setItemNameAr] = useState("");
  const [itemIngredientsAr, setItemIngredientsAr] = useState("");
  const [itemPriceTw, setItemPriceTw] = useState("");
  const [quickSearch, setQuickSearch] = useState("");

  const [selectedCategoryError, setSelectedCategoryError] = useState(false);
  const [itemNameError, setItemNameError] = useState(false);

  const [showToast, setShowToast] = useState(false);

  const [showGallery, setShowGallery] = useState(false);
  const [galleryForItemId, setGalleryForItemId] = useState<string | null>(null);
  const [itemImage, setItemImage] = useState("");
  const [localItems, setLocalItems] = useState<Record<string, Item>>(items);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  useEffect(() => {
    loadImages('images').then(setGalleryImages).catch(console.error);
  }, []);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const addItem = async () => {
    let hasError = false;
    if (!selectedCategory) { setSelectedCategoryError(true); hasError = true; }
    if (!itemNameAr.trim()) { setItemNameError(true); hasError = true; }
    if (!itemPriceTw.trim() || itemPriceTw.split(",").some(p => isNaN(Number(p)) || Number(p) <= 0)) {
      hasError = true;
    }
    if (hasError) return;

    await push(ref(db, "items"), {
      nameAr: itemNameAr,
      ingredientsAr: normalizeIngredients(itemIngredientsAr),
      price: itemPriceTw, // Sync to price as fallback
      priceTw: itemPriceTw,
      categoryId: selectedCategory,
      subcategoryId: selectedSubcategory || null,
      visible: true,
      createdAt: Date.now(),
      image: itemImage || "",
      star: false,
    });

    setItemNameAr("");
    setItemIngredientsAr("");
    setItemPriceTw("");
    setSelectedCategory("");
    setSelectedSubcategory("");
    setItemImage("");

    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
  };

  const toggleItem = async (id: string, visible: boolean) => {
    await update(ref(db, `items/${id}`), { visible: !visible });
  };

  const updateImage = async (id: string, image: string) => {
    await update(ref(db, `items/${id}`), { image });
  };

  const removeImage = async (id: string) => {
    await update(ref(db, `items/${id}`), { image: "" });
  };

  const openGallery = (itemId: string, currentImage?: string) => {
    setGalleryForItemId(itemId);
    setItemImage(currentImage || "");
    setShowGallery(true);
  };

  const handleSelectImage = async (img: string) => {
    if (!galleryForItemId) return;
    await updateImage(galleryForItemId, img);
    setShowGallery(false);
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const moveItem = async (categoryId: string, itemId: string, direction: 'up' | 'down') => {
    const catItems = Object.entries(localItems)
      .map(([id, item]) => ({ ...item, id }))
      .filter(item => item.categoryId === categoryId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const index = catItems.findIndex(i => i.id === itemId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= catItems.length) return;

    const newItems = [...catItems];
    const [movedItem] = newItems.splice(index, 1);
    newItems.splice(newIndex, 0, movedItem);

    // Update orders in Firebase
    const updates: Record<string, any> = {};
    newItems.forEach((item, idx) => {
      updates[`items/${item.id}/order`] = idx;
    });

    try {
      await update(ref(db), updates);
    } catch (err) {
      console.error("Failed to reorder items:", err);
    }
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  const handleDragEndItems = async (event: DragEndEvent, currentItems: (Item & { id: string })[]) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = currentItems.findIndex((i) => i.id === active.id);
    const newIndex = currentItems.findIndex((i) => i.id === over.id);

    const newArray = arrayMove(currentItems, oldIndex, newIndex);

    const updates: Record<string, any> = {};
    newArray.forEach((item, index) => {
      updates[`items/${item.id}/order`] = index;
    });

    try {
      await update(ref(db), updates);
    } catch (err) {
      console.error("Failed to drag reorder items:", err);
    }
  };

  const currentCatSubcategories = Object.entries(subcategories)
    .filter(([, sub]) => sub.categoryId === selectedCategory)
    .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="space-y-12">


      {/* Adding Form */}
      <div className="bg-white p-10 border border-gray-100 shadow-soft relative overflow-hidden group rounded-4xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center text-3xl shadow-inner transition-transform group-hover:scale-110">
              <FiPlus />
            </div>
            <div>
              <h2 className="text-2xl sm:text-xl font-black text-gray-900">{t('admin.add_new_item')}</h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="flex flex-col gap-3">
            <label className="text-sm md:text-lg font-bold uppercase tracking-[0.2em] text-gray-400 px-1">{t('admin.categories')}</label>
            <CustomSelect
              options={Object.keys(categories).map(id => ({ id, name: categories[id].nameAr || "" }))}
              value={selectedCategory}
              onChange={(val) => { setSelectedCategory(val); setSelectedSubcategory(""); setSelectedCategoryError(false); }}
              error={selectedCategoryError}
              placeholder={t('admin.select_category')}
            />
          </div>

          <div className={`flex flex-col gap-3 transition-all duration-500 ${currentCatSubcategories.length > 0 ? "opacity-100 translate-y-0" : "opacity-30 pointer-events-none translate-y-2"}`}>
            <label className="text-sm md:text-lg font-bold uppercase tracking-[0.2em] text-gray-400 px-1">{t('admin.subcategories')}</label>
            <CustomSelect
              options={currentCatSubcategories.map(([id, sub]) => ({ id, name: sub.nameAr || "" }))}
              value={selectedSubcategory}
              onChange={(val) => setSelectedSubcategory(val)}
              placeholder={t('admin.select_subcategory')}
              disabled={currentCatSubcategories.length === 0}
            />
          </div>

          <div className="flex flex-col gap-3 md:col-span-2">
            <label className="text-sm md:text-lg font-bold uppercase tracking-[0.2em] text-gray-400 px-1">
              {t('common.name')}
            </label>
            <input
              className={`w-full h-14 bg-gray-50 border px-6 rounded-2xl text-sm md:text-base lg:text-md outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all
                ${itemNameError ? "border-secondary" : "border-gray-100"} text-right`}
              placeholder={t('admin.item_name_ar_placeholder')}
              value={itemNameAr}
              onChange={(e) => {
                setItemNameAr(e.target.value);
                setItemNameError(false);
              }}
            />
          </div>

          <div className="flex flex-col gap-3 md:col-span-2">
            <label className="text-sm md:text-lg font-bold uppercase tracking-[0.2em] text-gray-400 px-1">
              {t('admin.ingredients_label')}
            </label>
            <input
              className="w-full h-14 bg-gray-50 border border-gray-100 px-6 rounded-2xl text-sm md:text-base lg:text-md outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-right"
              placeholder={t('admin.ingredients_placeholder')}
              value={itemIngredientsAr}
              onChange={(e) => setItemIngredientsAr(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3 md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm md:text-lg font-bold uppercase tracking-[0.2em] text-gray-400 px-1">{t('common.price') || "السعر"}</label>
                <input
                  className="w-full h-14 bg-gray-50 border px-6 rounded-2xl text-sm md:text-base lg:text-md outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all border-gray-100"
                  placeholder={t('admin.item_price_placeholder')}
                  value={itemPriceTw}
                  onChange={(e) => setItemPriceTw(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={addItem}
              className="w-full h-14 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-4"
            >
              <FiPlus className="text-2xl" />
              <span className="text-lg uppercase tracking-wider">{t('admin.add_item_btn')}</span>
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-primary/95 backdrop-blur-md flex items-center justify-center z-50 rounded-[3rem]"
            >
              <div className="text-center text-white px-8">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-xl">✅</div>
                <h3 className="text-3xl font-black mb-2">{t('admin.item_added_success_title')}</h3>
                <p className="opacity-90 font-bold uppercase tracking-[0.2em] text-xs">{t('admin.item_added_success_desc')}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Bar */}
      <div className="relative group px-2 max-w-2xl mx-auto w-full">
        <FiSearch className={`absolute ${i18n.language === 'ar' ? 'right-8' : 'left-8'} top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors text-2xl`} />
        <input
          className={`w-full bg-white border border-gray-100 rounded-4xl h-16 ${i18n.language === 'ar' ? 'pr-16 pl-8 text-right' : 'pl-16 pr-8'} text-sm md:text-base lg:text-md font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-premium`}
          placeholder={t('admin.search_placeholder')}
          value={quickSearch}
          onChange={(e) => setQuickSearch(e.target.value)}
        />
      </div>

      {/* Items by Category */}
      <div className="space-y-8">
        {Object.entries(categories)
          .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
          .map(([catId, cat]) => {
            const catItems = Object.keys(localItems)
              .map(id => ({ ...localItems[id], id }))
              .filter(item => item.categoryId === catId)
              .filter(item => {
                const search = quickSearch.toLowerCase();
                const itemName = item.nameAr;
                const itemIngredients = item.ingredientsAr;
                return (
                  (itemName && itemName.toLowerCase().includes(search)) ||
                  (itemIngredients && itemIngredients.toLowerCase().includes(search)) ||
                  String(item.price).includes(search)
                );
              })
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

            if (quickSearch && catItems.length === 0) return null;

            const isExpanded = expandedSections[catId] ?? false;

            return (
              <div key={catId} className="bg-white border border-gray-50 rounded-[2.5rem] overflow-hidden shadow-soft hover:shadow-premium transition-all">
                <button
                  onClick={() => toggleSection(catId)}
                  className="w-full p-8 flex items-center justify-between group bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >

                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-white text-primary flex items-center justify-center shadow-soft transition-transform group-hover:scale-110">
                      <FiChevronDown size={22} className={`transition-transform duration-500 ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                    <div className="text-right">
                      <h3 className="text-2xl font-bold text-gray-900">{cat.nameAr}</h3>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1.5">{catItems.length} {t('admin.items_count', { count: catItems.length })}</p>
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-8 pt-4">
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => handleDragEndItems(event, catItems)}
                        >
                          <SortableContext
                            items={catItems.map((i) => i.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="flex flex-col gap-1">
                              {catItems.map((item, idx) => (
                                <SortableItem
                                  key={item.id}
                                  item={item}
                                  idx={idx}
                                  totalItems={catItems.length}
                                  subcategories={subcategories}
                                  toggleItem={toggleItem}
                                  openGallery={openGallery}
                                  removeImage={removeImage}
                                  setPopup={setPopup}
                                  moveItem={moveItem}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>

                        {catItems.length === 0 && (
                          <div className="py-16 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                              <FiSearch size={32} className="text-gray-200" />
                            </div>
                            <p className="text-gray-400 font-bold text-lg">{t('admin.no_items_placeholder')}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
      </div>

      <FeaturedGallery
        visible={showGallery}
        onClose={() => setShowGallery(false)}
        onSelect={handleSelectImage}
        galleryImages={galleryImages}
        selectedImage={itemImage}
      />
    </div>
  );
};

export default ItemSection;
