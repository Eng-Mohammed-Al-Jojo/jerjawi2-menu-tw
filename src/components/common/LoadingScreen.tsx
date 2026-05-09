import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAssetUrl } from "../../utils/assetUtils";

interface Props {
  visible: boolean;
  onExited?: () => void;
}

export default function LoadingScreen({ visible, onExited }: Props) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) {
      setProgress(100);
      return;
    }
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + (95 - prev) * 0.1;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [visible]);

  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <AnimatePresence onExitComplete={onExited}>
      {visible && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(12px)" }}
          transition={{ duration: 0.9, ease: [0.43, 0.13, 0.23, 0.96] }}
          className="fixed inset-0 z-9999 flex flex-col items-center justify-center overflow-hidden"
          style={{ backgroundColor: "#FAF7F2" }}
          dir={isRtl ? "rtl" : "ltr"}
        >

          {/* ── Ambient blobs ── */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* top-left warm blob */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(240,210,170,0.6) 0%, transparent 70%)",
              }}
            />
            {/* bottom-right cool blob */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute -bottom-40 -right-40 w-120 h-120 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(53,81,82,0.15) 0%, transparent 70%)",
              }}
            />
            {/* center shimmer */}
            <motion.div
              animate={{ opacity: [0, 0.06, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 50%, rgba(53,81,82,0.12) 0%, transparent 60%)",
              }}
            />
          </div>

          {/* ── Main card ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center"
          >

            {/* Ring + Logo */}
            <div className="relative w-56 h-56 flex items-center justify-center">

              {/* Outer decorative ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full"
                style={{
                  border: "1px dashed rgba(53,81,82,0.18)",
                }}
              />

              {/* SVG progress */}
              <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 180 180"
              >
                {/* track */}
                <circle
                  cx="90" cy="90" r={radius}
                  stroke="rgba(53,81,82,0.1)"
                  strokeWidth="1.5"
                  fill="none"
                />
                {/* progress */}
                <motion.circle
                  cx="90" cy="90" r={radius}
                  stroke="#355152"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ strokeDasharray: circumference }}
                />
                {/* orange accent dot at progress head */}
                <motion.circle
                  cx="90" cy="90" r={radius}
                  stroke="#E07B39"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`6 ${circumference - 6}`}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </svg>

              {/* Logo container */}
              <motion.div
                animate={{ scale: [0.97, 1.02, 0.97] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-28 h-28 rounded-full flex items-center justify-center"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.95) 60%, rgba(240,210,170,0.3) 100%)",
                  boxShadow:
                    "0 8px 32px rgba(53,81,82,0.12), 0 2px 8px rgba(53,81,82,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
                }}
              >
                <img
                  src={getAssetUrl("logo.png")}
                  className="w-20 h-20 object-contain"
                  alt="Logo"
                />
              </motion.div>
            </div>

            {/* Progress text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-10 flex flex-col items-center gap-3"
            >
              {/* Dots loader */}
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ y: [0, -5, 0], opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                    className="block w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "#355152" }}
                  />
                ))}
              </div>

              {/* Percentage */}
              <div className="flex items-center gap-3">
                <div
                  className="h-px w-6"
                  style={{ backgroundColor: "rgba(53,81,82,0.2)" }}
                />
                <span
                  className="text-xs font-bold tracking-[0.35em] uppercase tabular-nums"
                  style={{ color: "#E07B39" }}
                >
                  {Math.round(progress)}%
                </span>
                <div
                  className="h-px w-6"
                  style={{ backgroundColor: "rgba(53,81,82,0.2)" }}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* ── Bottom branding ── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-10 text-[10px] font-semibold uppercase tracking-[0.5em]"
            style={{ color: "rgba(53,81,82,0.3)" }}
          >
          </motion.p>

        </motion.div>
      )}
    </AnimatePresence>
  );
}