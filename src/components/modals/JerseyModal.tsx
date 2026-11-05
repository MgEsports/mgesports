import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { GoldButton } from "../common/GoldButton";
import { Check, ShieldCheck, Sparkles } from "lucide-react";
import jerseyFrontImg from "../../assets/jersey-front.jpg";
import jerseyBackImg from "../../assets/jersey-back.jpg";
import confetti from "canvas-confetti";
import { getApiUrl } from "../../api/client";

interface JerseyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JerseyModal = ({ isOpen, onClose }: JerseyModalProps) => {
  const [selectedSize, setSelectedSize] = useState("L");
  const [customIgn, setCustomIgn] = useState("BEAST");
  const [customNumber, setCustomNumber] = useState("00");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [ordered, setOrdered] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const sizes = ["S", "M", "L", "XL", "2XL"];

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(getApiUrl("/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: "MG PRO COMBAT JERSEY 2026",
          customerName: customerName || "Esports Enthusiast",
          customerEmail: "fan@mgesports.in",
          customerPhone: customerPhone || "+91 98765 00000",
          address: "Official Shipping Dispatch",
          city: "Chennai",
          state: "Tamil Nadu",
          pincode: "600001",
          size: selectedSize,
          customIgn: customIgn.toUpperCase(),
          customNumber: customNumber,
          totalAmount: 1299,
          paymentMethod: "ONLINE",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data?.orderNumber) {
          setOrderNumber(data.data.orderNumber);
        }
      }
    } catch {
      // offline fallback
    }

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FFBE32", "#FFFFFF", "#000000"],
    });
    setOrdered(true);
  };

  const handleClose = () => {
    setOrdered(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="WEAR THE MG SPIRIT"
      subtitle="Official 2026-27 Pro Combat Jersey • Custom Athlete Print"
      maxWidth="lg"
    >
      {ordered ? (
        <div className="py-8 text-center flex flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-[#FFBE32]/20 border border-[#FFBE32] flex items-center justify-center text-[#FFBE32] mb-4">
            <Check className="h-8 w-8" />
          </div>
          <h4 className="font-display text-3xl uppercase text-white">
            ORDER PRE-REGISTERED!
          </h4>
          <p className="mt-2 text-sm text-[#9CA3AF] max-w-sm">
            Your customized MG Pro Jersey with IGN <strong className="text-[#FFBE32]">{customIgn.toUpperCase()} #{customNumber}</strong> (Size {selectedSize}) has been reserved for batch delivery.
            {orderNumber && <span className="block mt-2 font-mono text-xs text-[#FFBE32]">Order Reference: {orderNumber}</span>}
          </p>
          <div className="mt-6 w-full">
            <GoldButton onClick={handleClose} className="w-full" showArrow={false}>
              BACK TO STORE
            </GoldButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visual Showcase */}
          <div className="flex flex-col items-center justify-center rounded-xl bg-black/60 border border-white/10 p-4 relative overflow-hidden">
            <div className="absolute top-3 left-3 z-10 flex gap-2">
              <button
                type="button"
                onClick={() => setPreviewSide("front")}
                className={`px-3 py-1 text-xs font-heading font-bold uppercase rounded cursor-pointer transition-all ${
                  previewSide === "front"
                    ? "bg-[#FFBE32] text-black"
                    : "bg-neutral-800 text-gray-400 hover:text-white"
                }`}
              >
                Front
              </button>
              <button
                type="button"
                onClick={() => setPreviewSide("back")}
                className={`px-3 py-1 text-xs font-heading font-bold uppercase rounded cursor-pointer transition-all ${
                  previewSide === "back"
                    ? "bg-[#FFBE32] text-black"
                    : "bg-neutral-800 text-gray-400 hover:text-white"
                }`}
              >
                Back
              </button>
            </div>

            <div className="h-64 sm:h-72 w-full flex items-center justify-center overflow-hidden">
              <img
                src={previewSide === "front" ? jerseyFrontImg : jerseyBackImg}
                alt="MG Jersey Preview"
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_10px_25px_rgba(255,190,50,0.15)] transition-all duration-300"
              />
            </div>

            <div className="w-full mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1 text-[#FFBE32]">
                <Sparkles className="h-3.5 w-3.5" /> Breathable Poly-Dry
              </span>
              <span className="flex items-center gap-1 text-gray-300">
                <ShieldCheck className="h-3.5 w-3.5 text-[#FFBE32]" /> 100% Authentic
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleOrder} className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xl font-display uppercase tracking-wider text-white">
                    MG PRO JERSEY 2026
                  </div>
                  <div className="text-xs text-gray-400 font-body">Black & Gold • Temple Dravidian Edition</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display text-[#FFBE32] font-bold">₹1,299</div>
                  <div className="text-[10px] text-emerald-400 uppercase">Free India Shipping</div>
                </div>
              </div>

              {/* Size Selector */}
              <div>
                <label className="block text-xs font-heading uppercase tracking-wider text-gray-300 mb-1.5">
                  Select Size
                </label>
                <div className="flex gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`flex-1 py-2 text-xs font-heading font-bold rounded border cursor-pointer transition-all ${
                        selectedSize === s
                          ? "border-[#FFBE32] bg-[#FFBE32] text-black shadow-[0_0_12px_rgba(255,190,50,0.3)]"
                          : "border-white/15 bg-black/40 text-gray-300 hover:border-white/30"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Contact */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-heading uppercase tracking-wider text-gray-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul"
                    className="w-full rounded-lg border border-white/15 bg-black/60 px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-[#FFBE32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-heading uppercase tracking-wider text-gray-300 mb-1">
                    WhatsApp Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-lg border border-white/15 bg-black/60 px-3 py-1.5 text-xs text-white placeholder-gray-500 font-mono focus:border-[#FFBE32] focus:outline-none"
                  />
                </div>
              </div>

              {/* Custom IGN Print */}
              <div>
                <label className="block text-xs font-heading uppercase tracking-wider text-gray-300 mb-1">
                  Custom Player IGN on Back
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={customIgn}
                  onChange={(e) => setCustomIgn(e.target.value)}
                  placeholder="e.g. BEAST"
                  className="w-full rounded-lg border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white placeholder-gray-500 uppercase font-display tracking-widest focus:border-[#FFBE32] focus:outline-none"
                />
              </div>

              {/* Jersey Number */}
              <div>
                <label className="block text-xs font-heading uppercase tracking-wider text-gray-300 mb-1">
                  Jersey Number
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={customNumber}
                  onChange={(e) => setCustomNumber(e.target.value)}
                  placeholder="00"
                  className="w-full rounded-lg border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white placeholder-gray-500 font-mono tracking-widest focus:border-[#FFBE32] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <GoldButton type="submit" className="w-full" size="lg">
                PRE-ORDER NOW (₹1,299)
              </GoldButton>
              <p className="mt-2 text-center text-[10px] text-gray-500">
                Dispatches within 5-7 business days across all Indian states.
              </p>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
};
