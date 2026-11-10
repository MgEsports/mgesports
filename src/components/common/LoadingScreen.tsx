import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "../../assets/lordz-logo.png";

interface LoadingScreenProps {
  onComplete?: () => void;
}

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      if (onComplete) onComplete();
    }, 1400);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#050505]"
        >
          {/* Subtle Ambient Gold Radiance */}
          <div className="absolute h-64 w-64 rounded-full bg-[#fc8100]/10 blur-[90px] pointer-events-none" />

          {/* Logo with entrance & pulse */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex items-center justify-center"
          >
            <img
              src={logoImg}
              alt="MG ESPORTS Logo"
              className="h-28 w-28 object-contain drop-shadow-[0_0_25px_rgba(252, 129, 0,0.45)]"
            />
          </motion.div>

          {/* Typography */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" }}
            className="mt-6 flex flex-col items-center gap-1"
          >
            <h1 className="font-display text-3xl md:text-4xl tracking-[0.25em] text-white">
              MG <span className="text-[#fc8100]">ESPORTS</span>
            </h1>
            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent via-[#fc8100] to-transparent mt-1" />
            <span className="font-heading text-xs tracking-[0.3em] text-[#9CA3AF] mt-1">
              INDIAN ESPORTS SUPREMACY
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
