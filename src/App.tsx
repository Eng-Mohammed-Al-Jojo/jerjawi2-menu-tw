import { Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminPage, AdminOrdersPage, TrackOrderPage, MenuPage } from "./pages";

export default function App() {
  const { t } = useTranslation();

  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/orders" element={<AdminOrdersPage />} />
      <Route path="/track-order/:id" element={<TrackOrderPage />} />

      {/* fallback */}
      <Route
        path="*"
        element={
          <div className="text-white p-10 text-center font-bold">
            {t('common.not_found')}
          </div>
        }
      />
    </Routes>
  );
}
