import {
  FaLaptopCode,
  FaMapMarkerAlt,
  FaInstagram,
  FaWhatsapp,
  FaFacebookF,
  FaPhoneAlt,
  FaTelegramPlane,
  FaTiktok,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import { CreditCard } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";
import { useTranslation } from "react-i18next";
import { usePaymentMethods } from "../../hooks/usePaymentMethods";
import PaymentModal from "./PaymentModal";

const LOCAL_STORAGE_KEY = "footerInfo";

export default function Footer() {
  const { t } = useTranslation();
  const { methods, loading } = usePaymentMethods();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [footer, setFooter] = useState({
    address: "",
    phone: "",
    whatsapp: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    telegram: "",
  });

  useEffect(() => {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) setFooter(JSON.parse(localData));

    const footerRef = ref(db, "settings/footerInfo");
    const unsubFooter = onValue(footerRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setFooter(data);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      }
    });

    return () => {
      unsubFooter();
    };
  }, []);

  const socialIcons: { Icon: any; url: string | undefined }[] = [
    {
      Icon: FaWhatsapp,
      url: footer.whatsapp ? `https://wa.me/${footer.whatsapp}` : undefined,
    },
    { Icon: FaInstagram, url: footer.instagram || undefined },
    { Icon: FaFacebookF, url: footer.facebook || undefined },
    { Icon: FaTiktok, url: footer.tiktok || undefined },
    { Icon: FaTelegramPlane, url: footer.telegram || undefined },
  ];



  return (
    <footer className="w-full bg-(--menu-card-bg)/40 backdrop-blur-md border-t border-(--menu-border) px-4 py-3 md:px-6 md:py-4 mt-20 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-8">
        <button
          type="button"
          onClick={() => setIsPaymentModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-(--menu-bg) border border-(--menu-border) text-(--menu-text) font-black text-sm hover:text-primary hover:border-primary transition-all shadow-sm"
        >
          <CreditCard size={18} />
          {t('footer.payment_methods')}
        </button>

        <div className="flex flex-wrap justify-center gap-8 text-sm font-bold text-(--menu-text)">
          {footer.address && (
            <div className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-primary" />
              <span>{footer.address}</span>
            </div>
          )}
          {footer.phone && (
            <a href={`tel:${footer.phone}`} className="flex items-center gap-2 hover:text-(--menu-primary) transition-colors">
              <FaPhoneAlt className="text-primary" />
              <span>{footer.phone}</span>
            </a>
          )}
        </div>

        <div className="flex gap-4">
          {socialIcons.map(({ Icon, url }, i) => url && (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-(--menu-bg) border hover:border-secondary hover:text-primary border-primary text-secondary hover:scale-105 active:scale-95 transition-all duration-300 shadow-sm hover:shadow-lg shadow-primary/20">
              <Icon size={18} />
            </a>
          ))}
        </div>

        <div className="pt-8 border-t border-(--menu-border) w-full flex flex-col items-center gap-4">
          <a href="https://engmohammedaljojo.vercel.app/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
            <FaLaptopCode className="text-lg" />
            <div className="text-[10px] font-bold uppercase tracking-widest text-center">
              {t('footer.developed_by')} : Eng.<span className="text-(--menu-primary)">Mohammed El joujo</span>
            </div>
          </a>
          <p className="text-[10px] text-(--menu-text-muted) font-bold">© {new Date().getFullYear()} {t('footer.rights_reserved')}</p>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        methods={methods}
        loading={loading}
      />
    </footer>
  );
}
