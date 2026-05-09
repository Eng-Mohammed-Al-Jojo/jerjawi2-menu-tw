import React from "react";
import { type PopupState } from "./types";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCheck, FiTrash2, FiLogOut, FiKey, FiMail, FiEdit, FiLayers, FiType, FiInfo, FiImage } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import FeaturedGallery from "./FeaturedGallery";
import { getAssetUrl } from "../../utils/assetUtils";
import { loadImages } from "../../utils/imageLoader";
import SafeImage from "../common/SafeImage";

interface Props {
  popup: PopupState;
  setPopup: (popup: PopupState) => void;
  deleteItem?: () => void;
  deleteCategory?: (id: string) => void;
  addCategory?: () => void;
  addItem?: () => void;
  updateItem?: () => void;
  updateCategoryImage?: (id: string, image: string) => void;
  updateSubcategoryImage?: (id: string, image: string) => void;
  editItemValues?: {
    itemNameAr: string;
    itemPrice: string;
    priceTw: string;
    selectedCategory: string;
    selectedSubcategory: string;
    itemIngredientsAr?: string;
  };
  setEditItemValues?: (values: {
    itemNameAr: string;
    itemPrice: string;
    priceTw: string;
    selectedCategory: string;
    selectedSubcategory: string;
    itemIngredientsAr?: string;
  }) => void;
  categories?: any;
  subcategories?: any;
  addSubcategory?: (categoryId: string, nameAr: string, nameEn: string, image?: string) => void;
  updateSubcategory?: (id: string, nameAr: string, nameEn: string, image?: string) => void;
  deleteSubcategory?: (id: string) => void;
  resetPasswordPopup?: boolean;
  setResetPasswordPopup?: (val: boolean) => void;
  resetEmail?: string;
  setResetEmail?: (val: string) => void;
  resetMessage?: string;
  handleResetPassword?: () => void;
  logout?: () => void;
}

const Popup: React.FC<Props> = ({
  popup,
  setPopup,
  deleteItem,
  deleteCategory,
  addCategory,
  updateItem,
  updateCategoryImage,
  editItemValues,
  setEditItemValues,
  categories,
  subcategories,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  updateSubcategoryImage,
  resetPasswordPopup,
  setResetPasswordPopup,
  resetEmail,
  setResetEmail,
  resetMessage,
  handleResetPassword,
  logout,
}) => {
  const { t } = useTranslation();
  const [subNameAr, setSubNameAr] = React.useState("");
  const [subNameEn, setSubNameEn] = React.useState("");
  const [selectedImg, setSelectedImg] = React.useState("");
  const [showGallery, setShowGallery] = React.useState(false);
  const [galleryImages, setGalleryImages] = React.useState<string[]>([]);
  const isRtl = true;
  const isOpen = popup.type !== null || resetPasswordPopup;

  React.useEffect(() => {
    loadImages('images').then(setGalleryImages).catch(console.error);
  }, []);

  React.useEffect(() => {
    if (popup.type === "editSubcategory" && popup.id && subcategories[popup.id]) {
      const sub = subcategories[popup.id];
      setSubNameAr(sub.nameAr || "");
      setSubNameEn(sub.nameEn || "");
      setSelectedImg(sub.image || "");
    } else if (popup.type === "addSubcategory") {
      setSubNameAr("");
      setSubNameEn("");
      setSelectedImg("");
    }
  }, [popup.type, popup.id, subcategories]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const closePopup = () => {
    setPopup({ type: null });
    setResetPasswordPopup && setResetPasswordPopup(false);
  };

  const inputClass = "w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pr-4 pl-4 text-right text-sm font-bold outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-inner";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePopup}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md max-h-[90vh] sm:max-h-[85vh] bg-white rounded-[3rem] border border-gray-100 shadow-premium flex flex-col z-10 overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={closePopup}
            className="absolute top-4 left-6 w-10 h-10 flex items-center justify-center rounded-2xl bg-white text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-all border border-gray-100 shadow-soft z-20"
          >
            <FiX size={20} />
          </button>

          <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
            {/* ===== Logout ===== */}
            {popup.type === "logout" && (
              <div className="text-center space-y-8">
                <div className="w-24 h-24 bg-secondary/5 text-secondary rounded-4xl flex items-center justify-center mx-auto text-4xl shadow-inner border border-secondary/10">
                  <FiLogOut />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('admin.logout_title')}؟</h2>
                  <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-[11px]">{t('admin.logout_confirm')}</p>
                </div>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => { logout && logout(); closePopup(); }}
                    className="w-full py-5 rounded-2xl bg-secondary text-white font-black shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('admin.logout_title')}
                  </button>
                  <button
                    onClick={closePopup}
                    className="w-full py-5 rounded-2xl bg-gray-50 text-gray-400 font-black border border-gray-100 hover:bg-gray-100 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            {/* ===== Add/Edit/Delete Subcategory ===== */}
            {(popup.type === "addSubcategory" || popup.type === "editSubcategory" || popup.type === "deleteSubcategory") && (
              <div className="text-center space-y-8">
                <div className={`w-24 h-24 rounded-4xl flex items-center justify-center mx-auto text-4xl shadow-inner border ${popup.type === 'deleteSubcategory' ? 'bg-secondary/5 text-secondary border-secondary/10' : 'bg-primary/5 text-primary border-primary/10'}`}>
                  {popup.type === 'deleteSubcategory' ? <FiTrash2 /> : (popup.type === 'editSubcategory' ? <FiEdit /> : <FiLayers />)}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                    {popup.type === "addSubcategory" ? t('admin.add_subcategory') : (popup.type === "editSubcategory" ? t('admin.edit_subcategory') : t('admin.delete_subcategory'))}
                  </h2>
                </div>

                {(popup.type === "addSubcategory" || popup.type === "editSubcategory") && (
                  <div className="space-y-5">
                    <div className="relative group">
                      <FiType className="right-5 absolute top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-primary" />
                      <input
                        className={inputClass}
                        placeholder={t('admin.subcategory_name_ar')}
                        value={subNameAr}
                        onChange={(e) => setSubNameAr(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={() => setShowGallery(true)}
                      className="w-full h-20 rounded-2xl bg-gray-50 border border-gray-100 text-gray-400 font-black flex items-center justify-center gap-3 hover:border-primary hover:bg-white hover:shadow-soft transition-all overflow-hidden"
                    >
                      {selectedImg ? (
                        <div className="flex items-center gap-3 px-4">
                          <SafeImage src={selectedImg.startsWith('http') || selectedImg.startsWith('/') ? selectedImg : getAssetUrl(`images/${selectedImg}`)} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                          <span className="truncate text-gray-900 text-sm">{selectedImg.split('/').pop()}</span>
                        </div>
                      ) : (
                        <><FiImage size={24} /> {t('admin.select_image')}</>
                      )}
                    </button>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => {
                      if (popup.type === "addSubcategory") {
                        addSubcategory && addSubcategory(popup.parentId!, subNameAr, subNameEn, selectedImg);
                      } else if (popup.type === "editSubcategory") {
                        updateSubcategory && updateSubcategory(popup.id!, subNameAr, subNameEn, selectedImg);
                      } else {
                        deleteSubcategory && deleteSubcategory(popup.id!);
                      }
                      closePopup();
                    }}
                    className={`w-full py-5 rounded-2xl text-white font-black shadow-xl transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest text-sm ${popup.type === 'deleteSubcategory' ? 'bg-secondary shadow-secondary/20' : 'bg-primary shadow-primary/20'}`}
                  >
                    {popup.type === "deleteSubcategory" ? t('common.delete') : t('common.save')}
                  </button>
                  <button
                    onClick={closePopup}
                    className="w-full py-5 rounded-2xl bg-gray-50 text-gray-400 font-black border border-gray-100 hover:bg-gray-100 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            {/* ===== Add/Delete Category ===== */}
            {(popup.type === "addCategory" || popup.type === "deleteCategory") && (
              <div className="text-center space-y-8">
                <div className={`w-24 h-24 rounded-4xl flex items-center justify-center mx-auto text-4xl shadow-inner border ${popup.type === 'deleteCategory' ? 'bg-secondary/5 text-secondary border-secondary/10' : 'bg-emerald-50 text-emerald-500 border-emerald-100'}`}>
                  {popup.type === 'deleteCategory' ? <FiTrash2 /> : <FiLayers />}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                    {popup.type === "addCategory" ? t('admin.add_category_title') : t('admin.delete_category_title')}
                  </h2>
                </div>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => {
                      if (popup.type === "addCategory") addCategory && addCategory();
                      else deleteCategory && deleteCategory(popup.id!);
                      closePopup();
                    }}
                    className={`w-full py-5 rounded-2xl text-white font-black shadow-xl transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest text-sm ${popup.type === 'deleteCategory' ? 'bg-secondary shadow-secondary/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}
                  >
                    {popup.type === "addCategory" ? t('common.save') : t('common.delete')}
                  </button>
                  <button
                    onClick={closePopup}
                    className="w-full py-5 rounded-2xl bg-gray-50 text-gray-400 font-black border border-gray-100 hover:bg-gray-100 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            {/* ===== Category/Subcategory Image Selection ===== */}
            {(popup.type === "categoryImage" || popup.type === "subcategoryImage") && (
              <div className="text-center space-y-8">
                <div className="w-24 h-24 bg-primary/5 text-primary rounded-4xl border border-primary/10 flex items-center justify-center mx-auto text-4xl shadow-inner">
                  <FiImage />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('admin.select_image')}</h2>
                </div>
                <div className="space-y-5">
                  <button
                    onClick={() => setShowGallery(true)}
                    className="w-full h-24 rounded-2xl bg-gray-50 border border-gray-100 text-gray-400 font-black flex items-center justify-center gap-3 hover:border-primary hover:bg-white hover:shadow-soft transition-all overflow-hidden px-6"
                  >
                    {selectedImg ? (
                      <div className="flex items-center gap-4">
                        <SafeImage src={selectedImg.startsWith('http') || selectedImg.startsWith('/') ? selectedImg : getAssetUrl(`images/${selectedImg}`)} className="w-14 h-14 rounded-xl object-cover shadow-sm border border-gray-100" />
                        <span className="truncate text-gray-900 text-sm font-black">{selectedImg.split('/').pop()}</span>
                      </div>
                    ) : (
                      <><FiImage size={24} /> {t('admin.select_image')}</>
                    )}
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => {
                      if (popup.type === "categoryImage") {
                        updateCategoryImage && popup.id && updateCategoryImage(popup.id, selectedImg);
                      } else {
                        updateSubcategoryImage && popup.id && updateSubcategoryImage(popup.id, selectedImg);
                      }
                      closePopup();
                      setSelectedImg("");
                    }}
                    className="w-full py-5 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('common.save')}
                  </button>
                  <button
                    onClick={closePopup}
                    className="w-full py-5 rounded-2xl bg-gray-50 text-gray-400 font-black border border-gray-100 hover:bg-gray-100 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            {/* ===== Delete Item ===== */}
            {popup.type === "deleteItem" && (
              <div className="text-center space-y-8">
                <div className="w-24 h-24 bg-secondary/5 text-secondary rounded-4xl border border-secondary/10 flex items-center justify-center mx-auto text-4xl shadow-inner">
                  <FiTrash2 />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('admin.delete_item_title')}</h2>
                  <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-[11px]">{t('admin.delete_item_confirm')}</p>
                </div>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => { deleteItem && deleteItem(); closePopup(); }}
                    className="w-full py-5 rounded-2xl bg-secondary text-white font-black shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('common.delete')}
                  </button>
                  <button
                    onClick={closePopup}
                    className="w-full py-5 rounded-2xl bg-gray-50 text-gray-400 font-black border border-gray-100 hover:bg-gray-100 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            {/* ===== Edit Item ===== */}
            {popup.type === "editItem" && editItemValues && setEditItemValues && categories && (
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center text-3xl shadow-inner border border-amber-100">
                    <FiEdit />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t('admin.edit_product_title')}</h2>
                    <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mt-1">{t('admin.edit_product_desc')}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="relative group">
                    <FiLayers className="right-5 absolute top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-primary" />
                    <select
                      className={`${inputClass} appearance-none cursor-pointer`}
                      value={editItemValues.selectedCategory}
                      onChange={(e) => setEditItemValues({ ...editItemValues, selectedCategory: e.target.value, selectedSubcategory: "" })}
                    >
                      {Object.keys(categories).map((id) => (
                        <option key={id} value={id}>{categories[id].nameAr}</option>
                      ))}
                    </select>
                  </div>

                  {editItemValues.selectedCategory && subcategories && (
                    <div className="relative group">
                      <FiLayers className="right-5 absolute top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-primary" />
                      <select
                        className={`${inputClass} appearance-none cursor-pointer`}
                        value={editItemValues.selectedSubcategory}
                        onChange={(e) => setEditItemValues({ ...editItemValues, selectedSubcategory: e.target.value })}
                      >
                        <option value="">{t('admin.no_subcategory')}</option>
                        {Object.entries(subcategories)
                          .filter(([, s]: any) => s.categoryId === editItemValues.selectedCategory)
                          .map(([id, s]: any) => (
                            <option key={id} value={id}>{s.nameAr}</option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div className="relative group">
                    <FiType className="right-5 absolute top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-primary" />
                    <input
                      className={inputClass}
                      placeholder={t('admin.product_name_ar')}
                      value={editItemValues.itemNameAr}
                      onChange={(e) => setEditItemValues({ ...editItemValues, itemNameAr: e.target.value })}
                    />
                  </div>

                  <div className="relative group">
                    <FiInfo className="right-5 absolute top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-primary" />
                    <input
                      className={inputClass}
                      placeholder={t('admin.ingredients_placeholder')}
                      value={editItemValues.itemIngredientsAr || ""}
                      onChange={(e) => setEditItemValues({ ...editItemValues, itemIngredientsAr: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-3 md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                      <div className="relative group">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-1 block">{t('common.price') || "السعر"}</label>
                        <input
                          className={inputClass}
                          placeholder={t('admin.item_price_placeholder')}
                          value={editItemValues.priceTw || ""}
                          onChange={(e) => setEditItemValues({ ...editItemValues, priceTw: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => { updateItem && updateItem(); closePopup(); }}
                    className="w-full py-5 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3"
                  >
                    <FiCheck size={20} /> {t('admin.save_edits')}
                  </button>
                  <button
                    onClick={closePopup}
                    className="w-full py-5 rounded-2xl bg-gray-50 text-gray-400 font-black border border-gray-100 hover:bg-gray-100 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            {/* ===== Reset Password ===== */}
            {resetPasswordPopup && (
              <div className="space-y-8">
                <div className="text-center space-y-6 mb-2">
                  <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-4xl border border-blue-100 flex items-center justify-center mx-auto text-4xl shadow-inner">
                    <FiKey />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('admin.account_reset_title')}</h2>
                    <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-[11px]">{t('admin.account_reset_desc')}</p>
                  </div>
                </div>

                <div className="relative group">
                  <FiMail className={`absolute ${isRtl ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-primary`} />
                  <input
                    type="email"
                    placeholder={t('admin.email_placeholder')}
                    className={`${inputClass} ${isRtl ? '' : 'pl-12 pr-6 text-left'}`}
                    value={resetEmail}
                    onChange={(e) => setResetEmail && setResetEmail(e.target.value)}
                  />
                </div>

                <AnimatePresence>
                  {resetMessage && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-xs text-center text-emerald-600 font-black bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm">
                      {resetMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={handleResetPassword}
                    className="w-full py-5 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('admin.send_reset_link')}
                  </button>
                  <button
                    onClick={closePopup}
                    className="w-full py-5 rounded-2xl bg-gray-50 text-gray-400 font-black border border-gray-100 hover:bg-gray-100 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div >

      <FeaturedGallery
        visible={showGallery}
        onClose={() => setShowGallery(false)}
        onSelect={(img) => { setSelectedImg(img); setShowGallery(false); }}
        galleryImages={galleryImages}
        selectedImage={selectedImg}
      />
    </AnimatePresence >
  );
};

export default Popup;
